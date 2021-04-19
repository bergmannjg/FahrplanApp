import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ListItem } from "react-native-elements";
import { parseDatestring, extractTimeOfDatestring } from '../lib/iso-8601-datetime-utils';
import { Hafas } from '../lib/hafas';
import { MainStackParamList, RadarScreenParams } from './ScreenTypes';
import { hafas } from '../lib/hafas';
import { getCurrentPosition } from '../lib/location';
import { Movement, StopOver, Location } from 'hafas-client';

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
    plannedDeparture: string;
    stop: string;
}

export default function RadarScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: RadarScreenParams } = route;

    if (__DEV__) {
        console.log('constructor RadarScreen');
    }

    const [data, setData] = useState([] as NextStop[]);
    const [loading, setLoading] = useState(false);
    const [count] = useState(0);

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

    const filterNextStops = (movements: readonly Movement[], dt: Date): NextStop[] => {
        return movements.map(m => {
            const nextStopover = m.nextStopovers?.find(s => findNextStopover(s, dt));
            const line = m.line?.name;
            const mode = unionToString(m.line?.mode);
            const plannedDeparture = nextStopover?.plannedDeparture ? extractTimeOfDatestring(nextStopover?.plannedDeparture) : undefined;
            const stop = nextStopover?.stop?.name;
            const nextStop =
                line && plannedDeparture && stop
                    ? { line: line, mode: mode, tripId: m.tripId, direction: m.direction, location: m.location, plannedDeparture: plannedDeparture, stop: stop }
                    : undefined;
            return nextStop;
        }).filter(x => !!x) as NextStop[];
    }

    const makeRemoteRequest = () => {
        console.log('makeRemoteRequest, loading:', loading);
        if (loading) return;
        setLoading(true);

        getCurrentPosition()
            .then(location => {
                console.log(location);

                client.radar(location)
                    .then(movements => {
                        console.log('movements', movements.length);
                        const dt = new Date();
                        const nextStops = filterNextStops(movements, dt)
                        console.log('nextStops', nextStops.length, ', dt: ', dt);
                        setLoading(false);
                        setData(nextStops);
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
                <ActivityIndicator animating size="large" />
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

    return (
        <View style={styles.container}>
            <View style={styles.container}>
                <FlatList
                    data={data}
                    renderItem={({ item }) => (
                        <ListItem containerStyle={{ borderBottomWidth: 0 }} >
                            <ListItem.Content>
                                <ListItem.Title>{`${item.line} ${item.direction ? '-> ' + item.direction : ''}`}</ListItem.Title>
                                <ListItem.Subtitle>
                                    <View style={styles.subtitleView}>
                                        <TouchableOpacity onPress={() => showLocation(item.line, item.mode, item.location)}>
                                            <Text style={{ width: 20 }}>&#8982;</Text>
                                        </TouchableOpacity>
                                        <Text>&#32;</Text>
                                        <TouchableOpacity onPress={() => goToTrip(item.tripId)}>
                                            <Text>{`${item.plannedDeparture} ${item.stop}`}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </ListItem.Subtitle>
                            </ListItem.Content>
                        </ListItem>
                    )}
                    keyExtractor={item => item.direction ? item.direction : ''}
                    ItemSeparatorComponent={renderSeparator}
                    ListFooterComponent={renderFooter}
                    onEndReachedThreshold={50}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        paddingTop: 10
    },
    containerButtons: {

    },
    container2: {
        flex: 1,
    },
    scrollView: {
        backgroundColor: Colors.lighter,
    },
    engine: {
        position: 'absolute',
        right: 0,
    },
    body: {
        backgroundColor: Colors.white,
    },
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: Colors.black,
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
        color: Colors.dark,
    },
    highlight: {
        fontWeight: '700',
    },
    footer: {
        color: Colors.dark,
        fontSize: 12,
        fontWeight: '600',
        padding: 4,
        paddingRight: 12,
        textAlign: 'right',
    },
    subtitleView: {
        flexDirection: 'row',
        paddingLeft: 10,
        paddingTop: 5
    },
    itemWarningText: {
        color: 'red',
    },
    button: {
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 10,
        margin: 2,
    },
    itemButtonText: {
        fontSize: 18,
        margin: 2,
        textAlign: 'center',
    },
    itemHeaderText: {
        fontSize: 15,
        padding: 10,
        paddingLeft: 15,
    },
});

