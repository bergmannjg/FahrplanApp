
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { extractTimeOfDatestring, momentWithTimezone, MomentWithTimezone } from '../lib/iso-8601-datetime-utils';
import { Location, Trip, StopOver, Alternative, Line, Stop, Station } from 'hafas-client';
import { Hafas } from '../lib/hafas';
import { MainStackParamList, TripScreenParams, asLinkText } from './ScreenTypes';
import moment from 'moment-timezone';
import { hafas } from '../lib/hafas';
import { styles } from './styles';

type Props = {
    route: RouteProp<MainStackParamList, 'Trip'>;
    navigation: StackNavigationProp<MainStackParamList, 'Trip'>;
};

enum PositionKind {
    Departure,
    Stop,
    Arrival
}

interface ItemType {
    s: StopOver;
    p: PositionKind;
}

export default function TripScreen({ route, navigation }: Props): JSX.Element {
    console.log('constructor TripScreen');

    const { t } = useTranslation();

    const { params }: { params: TripScreenParams } = route;
    const trip: Trip = params.trip;
    const line = params.line;
    const profile = params.profile;
    const client: Hafas = hafas(profile);
    console.log('trip', trip);

    const length = trip.stopovers?.length ?? 0;
    const getPositionKind = (i: number) => {
        if (i == 0) return PositionKind.Departure;
        else if (i == length - 1) return PositionKind.Arrival;
        else return PositionKind.Stop;
    }
    const data = trip.stopovers?.map((s, i): ItemType => { return { s: s, p: getPositionKind(i) } })
    const operatorName = trip.line?.operator?.name ?? '';

    const showRoute = (isLongPress: boolean) => {
        const locations = [] as Location[];
        trip.stopovers?.forEach(stopover => {
            if (stopover.stop?.location) {
                locations.push(stopover.stop.location);
            }
        });
        console.log('locations: ', locations.length);
        navigation.navigate('BRouter', { isLongPress, locations });
    }

    const showDepartures = (query: string, date: string) => {
        navigation.navigate('Departures', { station: query, date: new Date(Date.parse(date)).valueOf(), profile })
    }

    const railwayCar = '\uD83D\uDE83'; // surrogate pair of U+1F683

    const hasTrainformation = (line: Line) => {
        return line?.product === 'nationalExpress' || line?.name?.startsWith('IC');
    }

    const goToWagenreihung = (line: Line, plannedDeparture?: string, stop?: Stop | Station) => {
        console.log('Navigation router run to Wagenreihung');
        console.log('fahrtNr: ', line?.fahrtNr, ', plannedDeparture:', plannedDeparture);
        if (line?.fahrtNr && plannedDeparture) {
            const loc = client.getLocation(stop);
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

    const OptionalItemDeparture = ({ item }: { item: ItemType }) => {
        let departure: MomentWithTimezone = { hasTimezone: false, moment: moment() };
        if (!item.s.plannedArrival && item.s.plannedDeparture && item.s.stop?.location) {
            departure = momentWithTimezone(item.s.plannedDeparture, item.s.stop?.location);
        }

        return (
            item.p == PositionKind.Departure && item.s.plannedDeparture ?
                <Text style={styles.itemStationText}>
                    {`${t('TripScreen.Time', { date: extractTimeOfDatestring(item.s.plannedDeparture) })} ${departure.hasTimezone ? t('TripScreen.Timezone', { date: departure.moment }) : ''} ${item.s.stop?.name}`}
                </Text>
                :
                null
        )
    }

    const OptionalItemDelay = ({ item }: { item: ItemType }) => {
        if (item.s.departureDelay && item.s.departureDelay > 0 && item.s.departure)
            return (
                <View>
                    <Text style={styles.itemDelayTextTrip}>
                        {`${t('TripScreen.Time', { date: extractTimeOfDatestring(item.s.departure) })}`}
                    </Text>
                </View>
            )
        else
            return null;
    }

    const cancelledInfo = (item: StopOver): string => {
        const cancelled = item.cancelled;
        return cancelled ? "entfällt" : "";
    }

    const OptionalItemBetween = ({ item }: { item: ItemType }) => {
        if (item.p == PositionKind.Stop && item.s.plannedDeparture)
            return (
                <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TouchableOpacity onPress={() => showDepartures(item.s.stop?.name ?? "", item.s.plannedArrival ?? '')}>
                            <Text style={styles.itemDetailsText}>
                                {`${t('TripScreen.Time', { date: extractTimeOfDatestring(item.s.plannedDeparture) })} ${asLinkText(item.s.stop?.name ?? '')}`}
                                <Text style={styles.itemWarningText}>
                                    {` ${cancelledInfo(item.s)}`}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                        {line && hasTrainformation(line) && item.s.plannedDeparture &&
                            <TouchableOpacity onPress={() => goToWagenreihung(line, item.s.plannedDeparture, item.s.stop)}>
                                <Text style={{ paddingRight: 10 }}>{asLinkText(railwayCar)}</Text>
                            </TouchableOpacity>
                        }
                    </View>
                    <OptionalItemDelay item={item} />
                </View>
            )
        else
            return null;
    }

    const OptionalItemArrival = ({ item }: { item: ItemType }) => {
        let arrival: MomentWithTimezone = { hasTimezone: false, moment: moment() };
        if (item.s.plannedArrival && !item.s.plannedDeparture && item.s.stop?.location) {
            arrival = momentWithTimezone(item.s.plannedArrival, item.s.stop?.location);
        }

        return (
            item.p == PositionKind.Arrival && item.s.plannedArrival ?
                <Text style={styles.itemStationText}>
                    {`${t('TripScreen.Time', { date: extractTimeOfDatestring(item.s.plannedArrival) })} ${arrival.hasTimezone ? t('TripScreen.Timezone', { date: arrival.moment }) : ''} ${item.s.stop?.name}`}
                </Text>
                :
                null
        )
    }

    const Item = ({ item }: { item: ItemType }) => {
        return (
            <View style={styles.subtitleViewTrip}>
                <OptionalItemDeparture item={item} />
                <OptionalItemBetween item={item} />
                <OptionalItemArrival item={item} />
            </View >
        );
    }

    return (
        <View style={styles.container}>
            <View style={{ padding: 10 }}>
                <TouchableOpacity style={styles.buttonTrip} onPress={() => showRoute(false)} onLongPress={() => showRoute(true)}>
                    <Text style={styles.itemButtonText}>
                        {t('TripScreen.ShowRoute')}
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={{ paddingLeft: 10 }}>
                <Text style={styles.itemHeaderText}>
                    {trip.line?.name ?? ''} ({operatorName}) {t('TripScreen.Duration', { duration: moment.duration((new Date(trip.plannedArrival ?? "")).valueOf() - (new Date(trip.plannedDeparture ?? "")).valueOf()) })}
                </Text>
            </View>
            {data && data.length > 1 &&
                < FlatList
                    data={data}
                    renderItem={({ item }) => <Item item={item} />}
                    keyExtractor={item => item.s.stop?.name ?? ""}
                    ItemSeparatorComponent={renderSeparator}
                    onEndReachedThreshold={50}
                />
            }
        </View>
    );
}
