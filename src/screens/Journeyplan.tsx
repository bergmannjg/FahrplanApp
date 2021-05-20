import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ListItem } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { Hafas, JourneyInfo } from '../lib/hafas';
import { Location, Leg, Line } from 'hafas-client';
import { extractTimeOfDatestring, momentWithTimezone } from '../lib/iso-8601-datetime-utils';
import { MainStackParamList, JourneyplanScreenParams, asLinkText } from './ScreenTypes';
import { hafas, isStop4Routes } from '../lib/hafas';
import { useOrientation } from './useOrientation';
import { stylesPortrait, stylesLandscape, styles } from './styles';

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
    const showTransfers = params.tripDetails;
    const modes = ["train", "watercraft", "bus"];

    const [loading, setLoading] = useState(false);

    const orientation = useOrientation();

    console.log('legs.length: ', legs.length);

    const showRailwayRoutes = () => {
        console.log('showRailwayRoutes');
        navigation.navigate('RailwayRoutesOfTrip', { profile, tripDetails: showTransfers, originName: journeyInfo.originName, destinationName: journeyInfo.destinationName, journeyInfo });
    }

    const showRoute = async (isLongPress: boolean) => {
        console.log('showRoute.showTransfers: ', showTransfers);

        const stops = await client.stopssOfJourney(journeyInfo, modes, showTransfers, showTransfers);
        const locations = stops.filter(stop => stop.location).map(stop => stop.location) as Location[];
        console.log('locations: ', locations.length);
        if (locations && locations.length > 0) {
            navigation.navigate('BRouter', { isLongPress, locations });
        }
    }

    const goToTrip = (leg: Leg) => {
        console.log('Navigation router run to Trip of Leg');
        if (leg?.line && leg?.tripId) {
            setLoading(true);
            client.trip(leg.tripId)
                .then(trip => {
                    setLoading(false);
                    navigation.navigate('Trip', { trip, line: leg.line, profile })
                })
                .catch((error) => {
                    setLoading(false);
                    console.log('There has been a problem with your tripsOfJourney operation: ' + error);
                });
        }
    }

    const goToTripOfLeg = (leg: Leg, showTransits: boolean) => {
        console.log('Navigation router run to Trip of Leg');
        if (leg?.line && leg?.tripId && leg.polyline) {
            setLoading(true);
            client.tripOfLeg(leg.tripId, leg.origin, leg.destination, showTransits && hasNationalProduct(leg.line) ? leg.polyline : undefined)
                .then(trip => {
                    setLoading(false);
                    navigation.navigate('Trip', { trip, line: leg.line, profile })
                })
                .catch((error) => {
                    setLoading(false);
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
            const loc = client.getLocation(leg.origin);
            navigation.navigate('Trainformation', { fahrtNr: leg?.line?.fahrtNr, date: leg?.plannedDeparture, location: loc })
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

    const hasNationalProduct = (line?: Line) => {
        const productsOfLines = ["nationalExpress", "national"];
        return productsOfLines.find(p => line?.product === p);
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
                        <Text style={styles.itemWarningTextJourneyPlan}>{`${t('JourneyplanScreen.TripCancled')}`}</Text>
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
                            <Text style={styles.itemWarningTextJourneyPlan}>{`${t('JourneyplanScreen.ConnectionNotAccessible')}`}</Text>
                        }

                        {!item.walking &&
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
                                <TouchableOpacity onPress={() => goToTripOfLeg(item, false)}>
                                    <Text style={styles.itemDetailsText}>{asLinkText('Fahrtverlauf')}</Text>
                                </TouchableOpacity>
                                {hasNationalProduct(item.line) &&
                                    <TouchableOpacity onPress={() => goToTripOfLeg(item, true)}>
                                        <Text style={{ paddingLeft: 5 }}>{asLinkText('mit Durchfahrten')}</Text>
                                    </TouchableOpacity>
                                }
                            </View>
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


    return (
        <View style={styles.container}>
            <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerButtons : stylesLandscape.containerButtons}>
                <TouchableOpacity style={styles.buttonJourneyPlan} onPress={() => showRoute(false)} onLongPress={() => showRoute(true)}>
                    <Text style={styles.itemButtonText}>
                        {t('JourneyplanScreen.ShowRoute')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonJourneyPlan} onPress={() => showRailwayRoutes()}>
                    <Text style={styles.itemButtonText}>
                        {t('JourneyplanScreen.ShowRailwayRoutes')}
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerHeaderText : stylesLandscape.containerHeaderText}>
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
                    ListFooterComponent={renderFooter}
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
