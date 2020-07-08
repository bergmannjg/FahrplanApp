import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar,
    TouchableOpacity,
    FlatList,
    ActivityIndicator
} from 'react-native';

import {
    Header,
    LearnMoreLinks,
    Colors,
    DebugInstructions,
    ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { ListItem, SearchBar, Icon } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import moment from 'moment';

import { Hafas, JourneyInfo } from '../lib/hafas';
import { Stop, Products, Location, Leg } from 'hafas-client';
import { extractTimeOfDatestring, momentWithTimezone } from '../lib/iso-8601-datetime-utils';
import { MainStackParamList, JourneyplanScreenParams, BRouterScreenParams } from './ScreenTypes';

type Props = {
    route: RouteProp<MainStackParamList, 'Journeyplan'>;
    navigation: StackNavigationProp<MainStackParamList, 'Journeyplan'>;
};

export default function JourneyplanScreen({ route, navigation }: Props) {
    console.log('constructor JourneyplanScreen');

    const { t, i18n } = useTranslation();

    const { params }: { params: JourneyplanScreenParams } = route;
    const journeyInfo: JourneyInfo = params.journey;
    const legs = journeyInfo.legs;
    const client: Hafas = params.client;
    const tripDetails = params.tripDetails;
    const routeSearch = params.routeSearch;

    console.log('legs.length: ', legs.length);
    console.log('legs: ', legs);

    const showRailwayRoutes = async () => {
        console.log('showRailwayRoutes');
        const stops = await client.stopssOfJourney(journeyInfo, ['train', 'watercraft']);
        if (stops.length > 0) {
            navigation.navigate('RailwayRoutesOfTrip', { stops, routeSearch });
        }
    }

    const showRoute = async (isLongPress: boolean) => {
        console.log('showRoute.tripDetails: ', tripDetails);

        if (tripDetails) {
            const stops = await client.stopssOfJourney(journeyInfo, ['train', 'watercraft']);
            const locations = stops.filter(stop => stop.location).map(stop => stop.location) as Location[];
            console.log('locations: ', locations.length);
            if (locations && locations.length > 0) {
                navigation.navigate('BRouter', { isLongPress, locations });
            }
        }
        else {
            if (legs.length > 0) {
                const locations = legs.filter(leg => leg.origin.location).map(leg => leg.origin.location) as Location[];
                const location = legs[legs.length - 1].destination.location;
                if (location) {
                    locations.push(location);
                }
                if (locations && locations.length > 0) {
                    navigation.navigate('BRouter', { isLongPress: false, locations });
                }
            } else {
                console.log('Bahnhofslisten leer');
            }
        }
    }

    const goToTrip = (leg: Leg) => {
        console.log('Navigation router run to Trip of Leg');
        console.log('leg: ', leg);
        if (leg?.line && leg?.tripId) {
            client.trip(leg.tripId)
                .then(trip => {
                    navigation.navigate('Trip', { trip, client })
                })
                .catch((error) => {
                    console.log('There has been a problem with your tripsOfJourney operation: ' + error.message);
                });
        }
    }

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

    const loadFactor2Text = (loadFactor: string) => {
        if (loadFactor === 'low-to-medium') return t('JourneyplanScreen.low-to-medium');
        else if (loadFactor === 'high') return t('JourneyplanScreen.high');
        else if (loadFactor === 'very-high') return t('JourneyplanScreen.very-high');
        else if (loadFactor === 'exceptionally-high') return t('JourneyplanScreen.exceptionally-high');
        else return 'unbekannt';
    }

    const legLineName = (leg: Leg) => {
        let name = 'zu Fuss';
        if (leg?.line) {
            name = (leg.line.name ?? '');
            if (leg.direction) {
                name = name + ' -> ' + leg.direction;
            }
        }
        return name;
    }

    const platform = (p?: string) => {
        if (p) {
            return 'Gl. ' + p;
        }
        else {
            return '';
        };
    }

    interface ItemProps {
        item: Leg
    }

    const Item = ({ item }: ItemProps) => {
        return (
            <View style={styles.subtitleView}>
                {item.cancelled ?
                    <View>
                        <Text style={styles.itemStationText}>{`${t('JourneyplanScreen.Time', { date: extractTimeOfDatestring(item.plannedDeparture) })} ${item.origin.name}`}</Text>
                        <Text> </Text>
                        <TouchableOpacity onPress={() => goToTrip(item)}>
                            <Text style={styles.itemDetailsText}>{legLineName(item)}</Text>
                        </TouchableOpacity>
                        <Text style={styles.itemWarningText}>{`${t('JourneyplanScreen.TripCancled')}`}</Text>
                        <Text> </Text>
                        <Text style={styles.itemStationText}>{`${t('JourneyplanScreen.Time', { date: extractTimeOfDatestring(item.plannedArrival) })} ${item.destination.name}`}</Text>
                    </View>
                    :
                    <View>
                        <Text style={styles.itemStationText}>{`${t('JourneyplanScreen.Time', { date: extractTimeOfDatestring(item.plannedDeparture) })} ${item.origin.name} ${platform(item.departurePlatform)}`}</Text>

                        {item.departure && (item.departureDelay && item.departureDelay > 0 || item.arrivalDelay && item.arrivalDelay > 0) ?
                            <Text style={styles.itemDelayText}>{`${t('JourneyplanScreen.Time', { date: extractTimeOfDatestring(item.departure) })}`}</Text>
                            :
                            <Text> </Text>
                        }

                        {!item.reachable && !item.walking &&
                            <Text style={styles.itemWarningText}>{`${t('JourneyplanScreen.ConnectionNotAccessible')}`}</Text>
                        }

                        <TouchableOpacity onPress={() => goToTrip(item)}>
                            <Text style={styles.itemDetailsText}>{legLineName(item)}</Text>
                        </TouchableOpacity>

                        {item.arrival && item.departure &&
                            <Text style={styles.itemDetailsText}>{t('JourneyplanScreen.Duration', { duration: moment.duration((new Date(item.arrival)).valueOf() - (new Date(item.departure)).valueOf()) })}</Text>
                        }
                        <Text> </Text>
                        {
                            (item?.loadFactor) &&
                            <Text style={styles.itemDetailsText}>{`${t('JourneyplanScreen.LoadFactor')}: ${loadFactor2Text(item.loadFactor)}`}</Text>
                        }

                        <Text style={styles.itemStationText}>{`${t('JourneyplanScreen.Time', { date: extractTimeOfDatestring(item.plannedArrival) })} ${item.destination.name} ${platform(item.arrivalPlatform)}`}</Text>
                        {
                            (item.arrival && (item.departureDelay && item.departureDelay > 0 || item.arrivalDelay && item.arrivalDelay > 0)) ?
                                <View>
                                    <Text> </Text>
                                    <Text style={styles.itemDelayText}>{`${t('JourneyplanScreen.Time', { date: extractTimeOfDatestring(item.arrival) })}`}</Text>
                                </View>
                                :
                                <View />
                        }
                    </View>
                }
            </View >
        );
    }

    const departure = momentWithTimezone(journeyInfo.originDeparture, journeyInfo.originLocation);
    const arrival = momentWithTimezone(journeyInfo.destinationArrival, journeyInfo.destinationLocation);

    return (
        <View style={styles.container}>
            <View >
                <TouchableOpacity style={styles.button} onPress={() => showRoute(false)} onLongPress={() => showRoute(true)}>
                    <Text style={styles.itemButtonText}>
                        {t('JourneyplanScreen.ShowRoute')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => showRailwayRoutes()}>
                    <Text style={styles.itemButtonText}>
                        {t('JourneyplanScreen.ShowRailwayRoutes')}
                    </Text>
                </TouchableOpacity>
            </View>
            <View >
                <Text style={styles.itemHeaderText}>
                    {journeyInfo.originName} {t('JourneyplanScreen.DirectionTo')} {journeyInfo.destinationName}
                </Text>
                <Text style={styles.itemHeaderText}>
                    {t('JourneyplanScreen.Departure', { date: departure.moment })}
                    {departure.hasTimezone ? t('JourneyplanScreen.Timezone', { date: departure.moment }) : ''}
                </Text>
                <Text style={styles.itemHeaderText}>
                    {t('JourneyplanScreen.Arrival', { date: arrival.moment })}
                    {arrival.hasTimezone ? t('JourneyplanScreen.Timezone', { date: arrival.moment }) : ''}
                </Text>
            </View>
            <FlatList
                data={legs}
                renderItem={({ item }) => (
                    <ListItem
                        title={<Item item={item} />}
                        containerStyle={{ borderBottomWidth: 0 }}
                    />
                )}
                keyExtractor={item => item.origin.name + item.destination.name}
                ItemSeparatorComponent={renderSeparator}
                onEndReachedThreshold={50}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    subtitleView: {
        flexDirection: 'column',
        paddingLeft: 20,
        paddingTop: 0,
        paddingBottom: 0,
        margin: 0
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        paddingTop: 22
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
    activity: {
        backgroundColor: Colors.white,
    },
    itemHeaderText: {
        fontSize: 14,
        paddingLeft: 35,
        paddingBottom: 0,
        paddingTop: 10,
        backgroundColor: Colors.white,
    },
    itemWarningText: {
        color: 'red',
        paddingLeft: 50,
    },
    itemDelayText: {
        color: 'green',
    },
    itemStationText: {
        fontWeight: 'bold',
    },
    itemDetailsText: {
        paddingLeft: 50,
    },
    footer: {
        color: Colors.dark,
        fontSize: 12,
        fontWeight: '600',
        padding: 4,
        paddingRight: 12,
        textAlign: 'right',
    },
    button: {
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 8,
        margin: 2,
    },
    itemButtonText: {
        fontSize: 18,
        margin: 2,
        textAlign: 'center'
    },
});

