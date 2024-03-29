import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ListItem } from "react-native-elements";
import { parseDatestring, extractTimeOfDatestring } from '../lib/iso-8601-datetime-utils';
import { useTranslation } from 'react-i18next';
import { Hafas } from '../lib/hafas';
import { MainStackParamList, RadarScreenParams } from './ScreenTypes';
import { hafas } from '../lib/hafas';
import { getCurrentPosition } from '../lib/location';
import { Movement, StopOver, Location } from 'hafas-client';
import { useOrientation } from './useOrientation';
import { stylesPortrait, stylesLandscape, styles } from './styles';
import { distance } from '../lib/distance';

type Props = {
    route: RouteProp<MainStackParamList, 'Radar'>;
    navigation: StackNavigationProp<MainStackParamList, 'Radar'>;
};

type NextStop = {
    line: string;
    mode?: string;
    direction: string | undefined;
    tripId: string | undefined;
    location?: Location;
    distance: number;
    plannedDeparture: string;
    stop: string;
}

export default function RadarScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: RadarScreenParams } = route;

    if (__DEV__) {
        console.log('constructor RadarScreen');
    }

    const { t } = useTranslation();

    const [data, setData] = useState([] as NextStop[]);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);

    const duration = params.duration;
    const profile = params.profile;
    const client: Hafas = hafas(profile);

    const findNextStopover = (nextStopover: StopOver, dt: Date) => {
        if (nextStopover.plannedDeparture) {
            const date = parseDatestring(nextStopover.plannedDeparture);
            return date && date.dt > dt;
        }
        return false;
    }

    const unionToString = (x?: string | unknown): string | undefined => {
        if (x && typeof x === "object") return x.toString().toLowerCase();
        else if (x && typeof x === "string") return x.toLowerCase();
        else return undefined;
    }

    const stripName = (s: string | undefined) => {
        if (s && s.length > 40) return s.substr(0, 40);
        else return s;
    }

    const filterNextStops = (movements: readonly Movement[], location: Location, dt: Date): NextStop[] => {
        return movements.map(m => {
            const nextStopover = m.nextStopovers?.find(s => findNextStopover(s, dt));
            const line = m.line?.name;
            const mode = unionToString(m.line?.mode);
            const plannedDeparture = nextStopover?.plannedDeparture ? extractTimeOfDatestring(nextStopover?.plannedDeparture) : undefined;
            const stop = stripName(nextStopover?.stop?.name);
            const dist = m.location && m.location.latitude && m.location.longitude && location.latitude && location.longitude ? distance(m.location.latitude, m.location.longitude, location.latitude, location.longitude) : -1;
            const nextStop =
                line && plannedDeparture && stop
                    ? { line: line, mode: mode, tripId: m.tripId, distance: dist, direction: m.direction, location: m.location, plannedDeparture: plannedDeparture, stop: stop }
                    : undefined;
            return nextStop;
        }).filter(x => !!x && x.distance > 0) as NextStop[];
    }

    const makeRemoteRequest = () => {
        console.log('makeRemoteRequest, loading:', loading);
        if (loading) return;
        setLoading(true);

        getCurrentPosition()
            .then(location => {
                console.log(location);

                client.radar(location, duration * 60)
                    .then(movements => {
                        console.log('movements', movements.length);
                        const dt = new Date();
                        const nextStops = filterNextStops(movements, location, dt)
                        console.log('nextStops', nextStops.length, ', dt: ', dt);
                        setLoading(false);
                        setData(nextStops.sort((a, b) => a.distance - b.distance));
                    })
                    .catch((error: Error) => {
                        console.log('There has been a problem with your radar operation: ' + error.message);
                        console.log(error.stack);
                        setLoading(false);
                        setData([]);
                    });
            })
            .catch((error: Error) => {
                console.log('There has been a problem with your getCurrentPosition operation: ' + error.message);
                console.log(error.stack);
                setLoading(false);
                setData([]);
            });
    };

    const orientation = useOrientation();

    useEffect(() => {
        makeRemoteRequest();
    }, [count]);

    const renderSeparator = () => {
        return (
            <View
                style={{
                    height: 1,
                    width: "86%",
                    backgroundColor: "#CED0CE",
                    marginLeft: "14%"
                }}
            />
        );
    };

    const renderFooter = () => {
        if (!loading) return null;

        return (
            <View
                style={{
                    paddingVertical: 20,
                    borderTopWidth: 1,
                    borderColor: "#CED0CE"
                }}
            >
                <ActivityIndicator size="small" color="#0000ff" />
            </View>
        );
    };

    const goToTrip = (tripId?: string) => {
        console.log('Navigation router run to Trip: ', tripId);
        if (tripId) {
            client.trip(tripId)
                .then(trip => {
                    navigation.navigate('Trip', { trip, profile })
                })
                .catch((error) => {
                    console.log('There has been a problem with your tripsOfJourney operation: ' + error);
                });
        }
    }

    const showLocation = async (line?: string, mode?: string, loc?: Location) => {
        console.log('showLocation: ', loc, ', mode: ', mode);
        if (loc) {
            const isCar = mode === 'car' || mode === 'bus' || mode === 'taxi';
            navigation.navigate('BRouter', { isLongPress: false, locations: [loc], titleSuffix: line, isCar });
        }
    }

    const incrDuration = (): void => {
        setCount(count + 1);
        setData([]);
        navigation.navigate('Radar', { profile, duration: duration * 2 });
    };

    return (
        <View style={styles.container}>
            <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerButtons : stylesLandscape.containerButtons} >
                <Text style={styles.itemHeaderTextNearby}>
                    {`${t('RadarScreen.Duration')} ${duration} min`}
                </Text>
                <TouchableOpacity style={styles.buttonNearby} onPress={() => incrDuration()} disabled={duration > 30}>
                    <Text style={styles.itemButtonText}>
                        {t('RadarScreen.IncrDuration')}
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.container}>
                <FlatList
                    data={data}
                    renderItem={({ item }) => (
                        <ListItem containerStyle={{ borderBottomWidth: 0 }}>
                            <ListItem.Content>
                                <ListItem.Title>{`${item.line} ${item.direction ? '-> ' + item.direction : ''}`}</ListItem.Title>
                                <ListItem.Subtitle>
                                    <View style={styles.subtitleViewRow}>
                                        <TouchableOpacity onPress={() => showLocation(item.line, item.mode, item.location)}>
                                            <Text style={{ width: 20 }}>&#8982;</Text>
                                        </TouchableOpacity>
                                        <Text>&#32;</Text>
                                        <TouchableOpacity onPress={() => goToTrip(item.tripId)}>
                                            <Text>{`${item.plannedDeparture} ${item.stop} ${item.distance.toFixed(1)} km`}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </ListItem.Subtitle>
                            </ListItem.Content>
                        </ListItem>
                    )}
                    keyExtractor={item => item.direction && item.tripId ? item.direction + item.tripId : ''}
                    ItemSeparatorComponent={renderSeparator}
                    ListFooterComponent={renderFooter}
                    onEndReachedThreshold={50}
                />
            </View>
        </View>
    );
}
