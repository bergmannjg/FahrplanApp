
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Colors, } from 'react-native/Libraries/NewAppScreen';
import { useTranslation } from 'react-i18next';
import { extractTimeOfDatestring, momentWithTimezone, MomentWithTimezone } from '../lib/iso-8601-datetime-utils';
import { Location, Trip, StopOver, Alternative } from 'hafas-client';
import { Hafas } from '../lib/hafas';
import { MainStackParamList, TripScreenParams } from './ScreenTypes';
import moment from 'moment-timezone';
import { hafas } from '../lib/hafas';

type Props = {
    route: RouteProp<MainStackParamList, 'Trip'>;
    navigation: StackNavigationProp<MainStackParamList, 'Trip'>;
};

export default function TripScreen({ route, navigation }: Props): JSX.Element {
    console.log('constructor TripScreen');

    const { t } = useTranslation();

    const { params }: { params: TripScreenParams } = route;
    const trip: Trip = params.trip;
    const profile = params.profile;
    const client: Hafas = hafas(profile);
    console.log('trip', trip);

    const data = trip.stopovers ?? []
    const firstStop = trip.stopovers && trip.stopovers.length > 0 ? trip.stopovers[0] : undefined;
    const lastStop = trip.stopovers && trip.stopovers.length > 0 ? trip.stopovers[trip.stopovers.length - 1] : undefined;
    const operatorName = trip.line?.operator?.name ?? '';

    const showRoute = (isLongPress: boolean) => {
        const locations = [] as Location[];
        trip.stopovers?.forEach(stopover => {
            if (stopover.stop.location) {
                locations.push(stopover.stop.location);
            }
        });
        console.log('locations: ', locations.length);
        navigation.navigate('BRouter', { isLongPress, locations });
    }

    const asyncFindDepartures = (query: string, date: Date, callback: (arr: ReadonlyArray<Alternative>) => void) => {
        if (query.length > 0) {
            const onlyLocalProducts = false;
            client.departures(query, ['train', 'watercraft'], date, onlyLocalProducts)
                .then(alternatives => callback(alternatives))
                .catch((error) => {
                    console.log('There has been a problem with your locations operation: ' + error);
                    callback([]);
                });
        }
    }

    const showDepartures = (query: string, date: string) => {
        asyncFindDepartures(query, new Date(Date.parse(date)), (alternatives: ReadonlyArray<Alternative>) => {
            if (alternatives.length > 0) {
                navigation.navigate('Departures', { station: query, alternatives, profile })
            } else {
                console.log('no departures from ', query)
            }
        });
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

    interface ItemProps {
        item: StopOver, first: StopOver, last: StopOver
    }

    const OptionalItemDeparture = ({ item }: { item: StopOver }) => {
        let departure: MomentWithTimezone = { hasTimezone: false, moment: moment() };
        if (!item.plannedArrival && item.plannedDeparture && item.stop.location) {
            departure = momentWithTimezone(item.plannedDeparture, item.stop.location);
        }

        return (
            !item.plannedArrival && item.plannedDeparture ?
                <Text style={styles.itemStationText}>
                    {`${t('TripScreen.Time', { date: extractTimeOfDatestring(item.plannedDeparture) })} ${departure.hasTimezone ? t('TripScreen.Timezone', { date: departure.moment }) : ''} ${item.stop.name}`}
                </Text>
                :
                null
        )
    }

    const OptionalItemDelay = ({ item }: { item: StopOver }) => {
        if (item.departureDelay && item.departureDelay > 0 && item.departure)
            return (
                <View>
                    <Text style={styles.itemDelayText}>
                        {`${t('TripScreen.Time', { date: extractTimeOfDatestring(item.departure) })}`}
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

    const OptionalItemBetween = ({ item }: { item: StopOver }) => {
        if (item.plannedArrival && item.plannedDeparture)
            return (
                <View>
                    <TouchableOpacity onPress={() => showDepartures(item.stop.name ?? "", item.plannedArrival ?? '')}>
                        <Text style={styles.itemDetailsText}>
                            {`${t('TripScreen.Time', { date: extractTimeOfDatestring(item.plannedDeparture) })} ${item.stop.name}`}
                            <Text style={styles.itemWarningText}>
                                {` ${cancelledInfo(item)}`}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                    <OptionalItemDelay item={item} />
                </View>
            )
        else
            return null;
    }

    const OptionalItemArrival = ({ item }: { item: StopOver }) => {
        let arrival: MomentWithTimezone = { hasTimezone: false, moment: moment() };
        if (item.plannedArrival && !item.plannedDeparture && item.stop.location) {
            arrival = momentWithTimezone(item.plannedArrival, item.stop.location);
        }

        return (
            item.plannedArrival && !item.plannedDeparture ?
                <Text style={styles.itemStationText}>
                    {`${t('TripScreen.Time', { date: extractTimeOfDatestring(item.plannedArrival) })} ${arrival.hasTimezone ? t('TripScreen.Timezone', { date: arrival.moment }) : ''} ${item.stop.name}`}
                </Text>
                :
                null
        )
    }

    const Item = ({ item }: ItemProps) => {
        return (
            <View style={styles.subtitleView}>
                <OptionalItemDeparture item={item} />
                <OptionalItemBetween item={item} />
                <OptionalItemArrival item={item} />
            </View >
        );
    }

    return (
        <View style={styles.container}>
            <View >
                <TouchableOpacity style={styles.button} onPress={() => showRoute(false)} onLongPress={() => showRoute(true)}>
                    <Text style={styles.itemButtonText}>
                        {t('TripScreen.ShowRoute')}
                    </Text>
                </TouchableOpacity>
            </View>
            <View >
                <Text style={styles.itemHeaderText}>
                    {trip.line?.name ?? ''} ({operatorName}) {t('TripScreen.Duration', { duration: moment.duration((new Date(trip.plannedArrival ?? "")).valueOf() - (new Date(trip.plannedDeparture ?? "")).valueOf()) })}
                </Text>
            </View>
            {firstStop && lastStop &&
                < FlatList
                    data={data}
                    renderItem={({ item }) => <Item item={item} first={firstStop} last={lastStop} />}
                    keyExtractor={item => item.stop.name ?? ""}
                    ItemSeparatorComponent={renderSeparator}
                    onEndReachedThreshold={50}
                />
            }
        </View>
    );
}

const styles = StyleSheet.create({
    subtitleView: {
        flexDirection: 'column',
        paddingLeft: 10,
        paddingTop: 5,
        margin: 10
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
    itemButtonText: {
        fontSize: 18,
        margin: 2,
        textAlign: 'center'
    },
    itemHeaderText: {
        fontSize: 14,
        paddingLeft: 20,
    },
    itemWarningText: {
        color: 'red',
        paddingLeft: 10,
    },
    itemDelayText: {
        paddingLeft: 50,
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
});

