import React from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    Text,
    TouchableOpacity,
    FlatList
} from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { ListItem } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import moment from 'moment';

import { Hafas, JourneyInfo } from '../lib/hafas';
import { Location, Leg, Stop, Line } from 'hafas-client';
import { extractTimeOfDatestring, momentWithTimezone } from '../lib/iso-8601-datetime-utils';
import { MainStackParamList, JourneyplanScreenParams, asLinkText } from './ScreenTypes';
import { hafas } from '../lib/hafas';
import { useOrientation } from './useOrientation';

type Props = {
    route: RouteProp<MainStackParamList, 'Journeyplan'>;
    navigation: StackNavigationProp<MainStackParamList, 'Journeyplan'>;
};

export default function JourneyplanScreen({ route, navigation }: Props): JSX.Element {
    console.log('constructor JourneyplanScreen');

    const { t } = useTranslation();

    const { params }: { params: JourneyplanScreenParams } = route;
    const journeyInfo: JourneyInfo = params.journey;
    const legs = journeyInfo.legs;
    const profile = params.profile;
    const client: Hafas = hafas(profile);
    const tripDetails = params.tripDetails;
    const modes = ["train", "watercraft", "bus"];
    const trainModes = ["train", "watercraft"];

    const orientation = useOrientation();

    console.log('legs.length: ', legs.length);
    console.log('legs: ', legs);

    const showRailwayRoutes = async () => {
        console.log('showRailwayRoutes');
        const stops = await client.stopssOfJourney(journeyInfo, trainModes);
        if (stops.length > 0) {
            navigation.navigate('RailwayRoutesOfTrip', { stops });
        }
    }

    const showRoute = async (isLongPress: boolean) => {
        console.log('showRoute.tripDetails: ', tripDetails);

        if (tripDetails) {
            const stops = await client.stopssOfJourney(journeyInfo, modes);
            const locations = stops.filter(stop => stop.location).map(stop => stop.location) as Location[];
            console.log('locations: ', locations.length);
            if (locations && locations.length > 0) {
                navigation.navigate('BRouter', { isLongPress, locations });
            }
        }
        else {
            if (legs.length > 0) {
                const locations = legs.map(leg => client.getLocation(leg.origin)).filter(l => !!l) as Location[];
                const location = (legs[legs.length - 1].destination as Stop)?.location;
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
                    navigation.navigate('Trip', { trip, line: leg.line, profile })
                })
                .catch((error) => {
                    console.log('There has been a problem with your tripsOfJourney operation: ' + error);
                });
        }
    }

    const hasTrainformation = (line?: Line) => {
        return line?.product === 'nationalExpress' || line?.name?.startsWith('IC');
    }

    const goToWagenreihung = (leg: Leg) => {
        console.log('Navigation router run to Wagenreihung');
        console.log('fahrtNr: ', leg.line?.fahrtNr, ', plannedDeparture:', leg.plannedDeparture);
        if (leg?.line?.fahrtNr && leg?.plannedDeparture) {
            navigation.navigate('Trainformation', { fahrtNr: leg?.line?.fahrtNr, date: leg?.plannedDeparture })
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
        let name = '';
        if (leg?.line) {
            name = (leg.line.name ?? '');
            if (leg.direction) {
                name = name + ' -> ' + leg.direction;
            }
        } else if (leg?.walking) {
            const dist = client.distanceOfLeg(leg);
            name = 'Fussweg';
            if (dist > 0) name += ', ' + dist + ' m';

        }
        return name;
    }

    const railwayCar = '\uD83D\uDE83'; // surrogate pair of U+1F683

    const platform = (p?: string) => {
        if (p) {
            return 'Gl. ' + p;
        }
        else {
            return '';
        }
    }

    interface ItemProps {
        item: Leg
    }

    const Item = ({ item }: ItemProps) => {
        return (
            <View style={styles.itemView}>
                {item.cancelled ?
                    <View>
                        <Text style={styles.itemStationText}>{`${t('JourneyplanScreen.Time', { date: extractTimeOfDatestring(item.plannedDeparture ?? "") })} ${item.origin?.name}`}</Text>
                        <Text> </Text>
                        <TouchableOpacity onPress={() => goToTrip(item)}>
                            <Text style={styles.itemDetailsText}>{legLineName(item)}</Text>
                        </TouchableOpacity>
                        <Text style={styles.itemWarningText}>{`${t('JourneyplanScreen.TripCancled')}`}</Text>
                        <Text> </Text>
                        <Text style={styles.itemStationText}>{`${t('JourneyplanScreen.Time', { date: extractTimeOfDatestring(item.plannedArrival ?? "") })} ${item.destination?.name}`}</Text>
                    </View>
                    :
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.itemStationText}>{`${t('JourneyplanScreen.Time', { date: extractTimeOfDatestring(item.plannedDeparture ?? "") })} ${item.origin?.name} ${platform(item.departurePlatform)}`}</Text>

                            {hasTrainformation(item.line) &&
                                <TouchableOpacity onPress={() => goToWagenreihung(item)}>
                                    <Text style={styles.itemDetailsText}>{asLinkText(railwayCar)}</Text>
                                </TouchableOpacity>
                            }
                        </View>

                        {item.departure && (item.departureDelay && item.departureDelay > 0 || item.arrivalDelay && item.arrivalDelay > 0) ?
                            <Text style={styles.itemDelayText}>{`${t('JourneyplanScreen.Time', { date: extractTimeOfDatestring(item.departure) })}`}</Text>
                            :
                            <Text> </Text>
                        }

                        {!item.reachable && !item.walking &&
                            <Text style={styles.itemWarningText}>{`${t('JourneyplanScreen.ConnectionNotAccessible')}`}</Text>
                        }

                        <TouchableOpacity onPress={() => goToTrip(item)}>
                            <Text style={styles.itemDetailsText}>{asLinkText(legLineName(item))}</Text>
                        </TouchableOpacity>

                        {item.arrival && item.departure &&
                            <Text style={styles.itemDetailsText}>{t('JourneyplanScreen.Duration', { duration: moment.duration((new Date(item.arrival)).valueOf() - (new Date(item.departure)).valueOf()) })}</Text>
                        }

                        {
                            (item?.loadFactor) &&
                            <Text style={styles.itemDetailsText}>{`${t('JourneyplanScreen.LoadFactor')}: ${loadFactor2Text(item.loadFactor)}`}</Text>
                        }

                        <Text> </Text>
                        <Text style={styles.itemStationText}>{`${t('JourneyplanScreen.Time', { date: extractTimeOfDatestring(item.plannedArrival ?? "") })} ${item.destination?.name} ${platform(item.arrivalPlatform)}`}</Text>
                        {
                            (item.arrival && (item.departureDelay && item.departureDelay > 0 || item.arrivalDelay && item.arrivalDelay > 0)) ?
                                <View>
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
            <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerButtons : stylesLandscape.containerButtons}>
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
            <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerButtons : stylesLandscape.containerButtons}>
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
            <ScrollView>
                <FlatList
                    data={legs}
                    renderItem={({ item }) => (
                        <Item item={item} />
                    )}
                    keyExtractor={item => item.origin?.name ?? "" + item.destination?.name}
                    ItemSeparatorComponent={renderSeparator}
                    onEndReachedThreshold={50}
                />
                <View style={{ paddingLeft: 20 }}>
                    <FlatList
                        data={journeyInfo.statusRemarks}
                        renderItem={({ item }) => (
                            <ListItem containerStyle={{ borderBottomWidth: 0 }}>
                                <ListItem.Content>
                                    <ListItem.Title>
                                        <Text style={styles.summaryText}>
                                            {item.summary}
                                        </Text>
                                    </ListItem.Title>
                                    <ListItem.Subtitle>
                                        <Text style={styles.contentText}>
                                            {item.text}
                                        </Text>
                                    </ListItem.Subtitle>
                                </ListItem.Content>
                            </ListItem>
                        )}
                        keyExtractor={item => item.summary ?? ''}
                        ItemSeparatorComponent={renderSeparator}
                        onEndReachedThreshold={50}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const stylesPortrait = StyleSheet.create({
    containerButtons: {
        flexDirection: 'column',
    }
});

const stylesLandscape = StyleSheet.create({
    containerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});

const styles = StyleSheet.create({
    summaryText: {
        fontWeight: 'bold',
        fontSize: 14,
        paddingLeft: 20,
    },
    contentText: {
        paddingLeft: 20,
    },
    itemView: {
        flexDirection: 'column',
        paddingLeft: 35,
        paddingTop: 10,
        paddingBottom: 0,
        margin: 0,
        width: '100%',
        backgroundColor: Colors.white
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        paddingTop: 0
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
        flexGrow: 1,
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
        flexGrow: 1,
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 8,
        margin: 2,
        minWidth: 200
    },
    itemButtonText: {
        fontSize: 18,
        margin: 2,
        textAlign: 'center'
    },
});

