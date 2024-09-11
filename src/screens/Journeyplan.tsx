import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ListItem } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { Hafas, JourneyInfo, isStopover4Routes } from '../lib/hafas';
import { Location, Leg, Line, Stop, Station, Status } from 'fs-hafas-client/hafas-client';
import { extractTimeOfDatestring, momentWithTimezone } from '../lib/iso-8601-datetime-utils';
import { MainStackParamList, JourneyplanScreenParams, asLinkText } from './ScreenTypes';
import { hafas, hasTrainformation, legs2Locations4Routes } from '../lib/hafas';
import { useOrientation } from './useOrientation';
import { stylesPortrait, stylesLandscape, styles } from './styles';
import { LogBox } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { saveItem, MyJourney } from './MyJourneys';

LogBox.ignoreLogs([
    'VirtualizedLists should never be nested', // warning of FlatList in ScrollView, ignored cause list of legs is small 
])

type Props = {
    route: RouteProp<MainStackParamList, 'Journeyplan'>;
    navigation: StackNavigationProp<MainStackParamList, 'Journeyplan'>;
};

export default function JourneyplanScreen({ route, navigation }: Props): JSX.Element {
    console.log('constructor JourneyplanScreen');

    const { t } = useTranslation();

    const { params }: { params: JourneyplanScreenParams } = route;
    const profile = params.profile;
    const client: Hafas = hafas(profile);
    const showTransfers = params.tripDetails;
    const modes = ["train", "watercraft", "bus"];

    const [journeyInfo, setJourneyInfo] = useState<JourneyInfo | undefined>(params.journey);
    const [refreshToken] = useState<string | undefined>(params.refreshToken);
    const [data, setData] = useState<(Leg | Status)[]>(journeyInfo ? [...journeyInfo.legs, ...journeyInfo.statusRemarks] : []);
    const [legs, setLegs] = useState(journeyInfo ? journeyInfo.legs : []);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);

    const orientation = useOrientation();

    console.log('legs.length: ', legs.length);

    const refresh = () => {
        const token = journeyInfo?.refreshToken ?? refreshToken;
        if (token) {
            console.log('refreshJourney: ', token);
            client.refreshJourney(token)
                .then(journey => {
                    if (journey) {
                        console.log('journey: ', journey);
                        const info = client.journeyInfo(journey);
                        setJourneyInfo(info);
                        setLegs(info.legs);
                        setData([...info.legs, ...info.statusRemarks])
                    }
                })
                .catch((error) => {
                    console.log('There has been a problem with your refreshJourney operation: ' + error);
                    console.log(error.stack);
                });
        }
    };

    const makeRemoteRequest = () => {
        console.log('makeRemoteRequest, count:', count, journeyInfo?.refreshToken);
        if (count === 0 && refreshToken || (count > 0 && journeyInfo?.refreshToken)) {
            console.log('makeRemoteRequest, loading:', loading);
            if (loading) return;
            setLoading(true);
            const token = journeyInfo?.refreshToken ?? refreshToken;
            if (token) {
                console.log('refreshJourney: ', token);
                client.refreshJourney(token)
                    .then(journey => {
                        if (journey) {
                            console.log('journey: ', journey);
                            const info = client.journeyInfo(journey);
                            setLoading(false);
                            setJourneyInfo(info);
                            setLegs(info.legs);
                            setData([...info.legs, ...info.statusRemarks])
                        }
                    })
                    .catch((error) => {
                        console.log('There has been a problem with your refreshJourney operation: ' + error);
                        console.log(error.stack);
                        setLoading(false);
                    });
            }
        }
    };

    useEffect(() => {
        makeRemoteRequest();
    }, [count]);

    const showRailwayRoutes = (longPress: boolean) => {
        console.log('Journeyplan showRailwayRoutes, legs', legs.length);
        const stops = legs2Locations4Routes(legs);
        if (stops.length > 1) {
            navigation.navigate('RailwayRoutesOfTrip', { profile, tripDetails: true, useMaxSpeed: longPress, originName: stops[0].name ?? '', destinationName: stops[stops.length - 1].name ?? '', locations: stops });
        }
    }

    const saveData = async () => {
        try {
            if (journeyInfo?.refreshToken) {
                const myJourney: MyJourney = { originName: journeyInfo.originName, destinationName: journeyInfo.destinationName, plannedDeparture: journeyInfo.plannedDeparture, refreshToken: journeyInfo.refreshToken, profile };
                await saveItem(myJourney);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const showRoute = async (isLongPress: boolean) => {
        console.log('showRoute.showTransfers: ', showTransfers);
        if (journeyInfo) {
            const stops = await client.stopssOfJourney(journeyInfo, modes, false, false);
            const products = journeyInfo.legs.map(l => l.line?.product).filter(p => !!p) as Array<string>;
            const isCar = products.every(p => p === 'bus');
            console.log('products', products, 'isCar', isCar);
            const locations = stops.filter(stop => stop.location).map(stop => stop.location) as Location[];
            console.log('locations: ', locations.length);
            if (locations && locations.length > 0) {
                navigation.navigate('BRouter', { isLongPress, locations, isCar });
            }
        }
    }

    const showCurrentLocation = async (loc: Location | undefined, line: string | undefined) => {
        if (loc) {
            console.log('showLocation: ', loc);
            navigation.navigate('BRouter', { isLongPress: false, locations: [loc], pois: [], titleSuffix: line, zoom: 10 });
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
        console.log('Navigation router run to Trip of Leg, leg?.line: ', leg?.line, ', leg?.tripId: ', leg?.tripId, ', leg.polyline: ', leg.polyline);
        if (leg?.line && leg?.tripId) {
            setLoading(true);
            const showAsTransits = showTransits && hasNationalProduct(leg.line) && leg.polyline != undefined;
            client.tripOfLeg(leg.tripId, leg.origin, leg.destination, showAsTransits ? leg.polyline : undefined)
                .then(trip => {
                    setLoading(false);
                    navigation.navigate('Trip', { trip, line: leg.line, profile, showAsTransits })
                })
                .catch((error) => {
                    setLoading(false);
                    console.log('There has been a problem with your tripsOfJourney operation: ' + error);
                });
        }
    }

    const goToWagenreihung = (line?: Line, plannedDeparture?: string, origin?: Station | Stop | Location) => {
        console.log('Navigation router run to Wagenreihung');
        console.log('fahrtNr: ', line?.fahrtNr, ', plannedDeparture:', plannedDeparture);
        if (line?.fahrtNr && plannedDeparture) {
            const loc = client.getLocation(origin);
            navigation.navigate('Trainformation', { fahrtNr: line?.fahrtNr, date: plannedDeparture, location: loc })
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

    const hasNationalProduct = (line?: Line): boolean => {
        const productsOfLines = ["nationalExpress", "national"];
        return productsOfLines.find(p => line?.product === p) !== undefined;
    }

    const legLineName = (leg: Leg) => {
        let name = '';
        if (leg?.line) {
            name = (leg.line.name ?? '');
            if (leg.direction) {
                name = name + ' -> ' + leg.direction;
            }
            if (leg?.line?.matchId && leg?.line?.product?.includes('national')) {
                name = name + ', Linie ' + leg?.line?.matchId;
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

    interface StatusItemProps {
        item: Status
    }

    const StatusItem = ({ item }: StatusItemProps) => {
        return (
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
        )
    }

    interface LegItemProps {
        item: Leg
    }

    const LegItem = ({ item }: LegItemProps) => {
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

                            {hasTrainformation(item.line, item.departure || item.plannedDeparture) &&
                                <TouchableOpacity onPress={() => goToWagenreihung(item.line, item.plannedDeparture, item.origin)}>
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

                        {
                            (item?.currentLocation) &&
                            <TouchableOpacity onPress={() => showCurrentLocation(item?.currentLocation, item?.line?.name)}>
                                <Text style={styles.itemDetailsText}>{asLinkText("aktuelle Position um " + (new Date).toLocaleTimeString())}</Text>
                            </TouchableOpacity>
                        }

                        <Text> </Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.itemStationText}>{`${t('JourneyplanScreen.Time', { date: extractTimeOfDatestring(item.plannedArrival ?? "") })} ${item.destination?.name} ${platform(item.arrivalPlatform)}`}</Text>
                        </View>

                        {
                            (item.arrival && (item.departureDelay && item.departureDelay > 0 || item.arrivalDelay && item.arrivalDelay > 0)) ?
                                <Text style={styles.itemDelayText}>{`${t('JourneyplanScreen.Time', { date: extractTimeOfDatestring(item.arrival) })}`}</Text>
                                :
                                <View />
                        }

                    </View>
                }
            </View >
        );
    }

    function isLeg(l: Leg | Status): l is Leg {
        return 'object' === typeof l && !!(l as Leg).origin;
    }

    function isStatus(s: Leg | Status): s is Status {
        return 'object' === typeof s && !!(s as Status).type;
    }

    interface ItemProps {
        item: Leg | Status
    }

    const Item = ({ item }: ItemProps) => {
        return isStatus(item) ? <StatusItem item={item} /> : isLeg(item) ? <LegItem item={item} /> : <View />
    }

    const keyExtractor = (item: Leg | Status) =>
        isStatus(item)
            ? (item.summary ?? '') + item.text.length
            : isLeg(item)
                ? item.origin?.name ?? "" + item.destination?.name
                : ''

    const departure = journeyInfo ? momentWithTimezone(journeyInfo.originDeparture, journeyInfo.originLocation) : undefined;
    const arrival = journeyInfo ? momentWithTimezone(journeyInfo.destinationArrival, journeyInfo.destinationLocation) : undefined;

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
                <Pressable style={styles.buttonJourneyPlan} onPress={() => showRoute(false)} onLongPress={() => showRoute(true)}>
                    <Text style={styles.itemButtonText}>
                        {t('JourneyplanScreen.ShowRoute')}
                    </Text>
                </Pressable>
                <Pressable style={styles.buttonJourneyPlan} onPress={() => showRailwayRoutes(false)} onLongPress={() => showRailwayRoutes(true)} >
                    {({ pressed }) => (
                        pressed
                            ? <Text style={styles.itemButtonTextPressed}>
                                {t('JourneyplanScreen.ShowRailwayRoutes')}
                            </Text>
                            : <Text style={styles.itemButtonText}>
                                {t('JourneyplanScreen.ShowRailwayRoutes')}
                            </Text>
                    )}
                </Pressable>
            </View>
            <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerHeaderText : stylesLandscape.containerHeaderText}>
                {journeyInfo && <View style={styles.myJourneyItem}>
                    <Text style={styles.itemHeaderText}>
                        {journeyInfo.originName} {t('JourneyplanScreen.DirectionTo')} {journeyInfo.destinationName}
                    </Text>
                    {params.journey && <TouchableOpacity onPress={() => saveData()}>
                        <Text style={styles.infoText}>Merken</Text>
                    </TouchableOpacity>}
                </View>}
                {departure && <View style={styles.myJourneyItem}>
                    <Text style={styles.itemHeaderText}>
                        {t('JourneyplanScreen.Departure', { date: departure.moment })}
                        {departure.hasTimezone ? t('JourneyplanScreen.Timezone', { date: departure.moment }) : ''}
                    </Text>
                    {params.journey && <TouchableOpacity onPress={() => refresh()}>
                        <Text style={styles.infoText}>Aktualisieren</Text>
                    </TouchableOpacity>}
                </View>}
                {arrival && <Text style={styles.itemHeaderText}>
                    {t('JourneyplanScreen.Arrival', { date: arrival.moment })}
                    {arrival.hasTimezone ? t('JourneyplanScreen.Timezone', { date: arrival.moment }) : ''}
                </Text>}
            </View>
            <FlatList
                data={data}
                renderItem={({ item }) => (
                    <Item item={item} />
                )}
                keyExtractor={keyExtractor}
                ItemSeparatorComponent={renderSeparator}
                ListFooterComponent={renderFooter}
                onEndReachedThreshold={50}
            />
        </View>
    );
}
