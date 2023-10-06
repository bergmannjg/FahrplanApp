import React, { useState, useEffect } from 'react';
import { List as PaperList, Text } from 'react-native-paper';
import { View, TouchableOpacity, FlatList, Pressable, ListRenderItem, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Hafas } from '../lib/hafas';
import { extractTimeOfDatestring } from '../lib/iso-8601-datetime-utils';
import { MainStackParamList, TripsOfLineScreenParams } from './ScreenTypes';
import { hafas } from '../lib/hafas';
import { useOrientation } from './useOrientation';
import { stylesPortrait, stylesLandscape, styles } from './styles';
import { Trip, Location } from 'fs-hafas-client/hafas-client';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type Props = {
    route: RouteProp<MainStackParamList, 'TripsOfLine'>;
    navigation: StackNavigationProp<MainStackParamList, 'TripsOfLine'>;
};

export default function TripsOfLineScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: TripsOfLineScreenParams } = route;

    if (__DEV__) {
        console.log('constructor TripsOfLineScreen, params.line: ', params.lineName);
    }

    const { t } = useTranslation();

    const lineName = params.lineName
    const [data, setData] = useState([] as readonly Trip[]);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);

    console.log('data.length: ', data.length);

    const profile = params.profile;
    const client: Hafas = hafas(profile);

    const makeRemoteRequest = () => {
        console.log('makeRemoteRequest, loading:', loading);
        if (loading) return;
        setLoading(true);

        const guessProductName = () => {
            if (params.train.includes('ICE')) return 'ICE';
            else if (params.train.includes('TGV')) return 'TGV';
            else if (params.train.includes('RJX')) return 'RJX';
            else if (params.train.includes('IC ')) return 'IC';
            else if (params.train.includes('EC ')) return 'EC';
            return 'ICE';
        }

        client.tripsByName(guessProductName(), lineName, ["DB Fernverkehr AG"], true)
            .then(tripsRt => {
                console.log('trips', tripsRt.trips.length);
                setLoading(false);
                const trips: Trip[] = tripsRt.trips as (Trip[]);
                trips.sort((a, b) => (a.departure ?? "").localeCompare(b.departure ?? ""))
                setData(trips);
            })
            .catch((error) => {
                if (params.refreshToken) {
                    client.refreshJourney(params.refreshToken)
                        .then(journey => {
                            if (journey && journey.legs[0]?.tripId) {
                                const leg = journey.legs[0];
                                client.trip(leg.tripId)
                                    .then(trip => {
                                        setLoading(false);
                                        setData([trip]);
                                    })
                                    .catch((error) => {
                                        console.log('There has been a problem with your tripsOfJourney operation: ' + error);
                                    });
                            } else {
                                setLoading(false);
                            }
                        })
                        .catch((error) => {
                            console.log('There has been a problem with your refreshJourney operation: ' + error);
                            setLoading(false);
                        });
                } else {
                    console.log('There has been a problem with your tripsByName operation: ' + error);
                    setLoading(false);
                    setData([]);
                }
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

    const showRoute = async () => {
        const locations = data.filter(trip => trip.currentLocation).map(trip => {
            const location = trip.currentLocation as Location;
            location.name = trip.line?.name;
            return trip.currentLocation;
        }) as Location[];
        console.log('locations: ', locations.length);
        if (locations && locations.length > 0) {
            navigation.navigate('BRouter', { isLongPress: false, locations: [], pois: locations, zoom: 6 });
        }
    }

    const goToView = async (item: Trip) => {
        console.log('Navigation router run to Trip');
        client.trip(item.id)
            .then(trip => {
                navigation.navigate('Trip', { trip, line: trip.line, profile })
            })
            .catch((error) => {
                console.log('There has been a problem with your trip operation: ' + error);
            });
    };

    const renderFooter = () => {
        if (!loading) return null;

        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    paddingVertical: 20,
                    borderTopWidth: 1,
                    borderColor: "#CED0CE"
                }}
            >
                <ActivityIndicator size="small" color="#0000ff" />
            </View>
        );
    };

    const renderItem: ListRenderItem<Trip> = ({ item }) => (
        <PaperList.Item
            style={{ borderWidth: 0, padding: 0 }}
            title={
                () => <Text style={styles.summaryText}>{item.origin?.name} nach {item.destination?.name}</Text>
            }
            description={
                () =>
                    <View>
                        <View style={styles.containerPriceText}>
                            {item.departure && item.arrival &&
                                <Text>ab: {extractTimeOfDatestring(item.departure)}, an: {extractTimeOfDatestring(item.arrival)}, {item.line?.name}</Text>
                            }
                        </View>
                    </View>
            }
            onPress={() => { goToView(item) }}
        />);

    return (
        <View style={styles.container}>
            <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerButtons : stylesLandscape.containerButtons}>
                <Pressable style={styles.buttonJourneyPlan} onPress={() => showRoute()}>
                    <Text style={styles.itemButtonText}>
                        {t('TripsOfLineScreen.ShowRoute')}
                    </Text>
                </Pressable>
            </View>
            <View style={styles.container}>
                <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerHeaderText : stylesLandscape.containerHeaderText}>
                    <Text style={styles.itemHeaderText}>
                        {t('TripsOfLineScreen.Date', { date: new Date() })}, {data.length} Fahrten gefunden.
                    </Text>
                </View>
                <View style={styles.container}>
                    <FlatList
                        data={data}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        ItemSeparatorComponent={renderSeparator}
                        ListFooterComponent={renderFooter}
                        onEndReachedThreshold={50}
                    />
                </View>
            </View>
        </View>
    );
}
