import React, { useState, useEffect } from 'react';
import { List as PaperList, Text } from 'react-native-paper';
import { View, TouchableOpacity, FlatList, ListRenderItem, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { extractTimeOfDatestring, parseDatestring } from '../lib/iso-8601-datetime-utils';
import { Hafas, JourneyInfo } from '../lib/hafas';
import { MainStackParamList, BestPriceConnectionsScreenParams } from './ScreenTypes';
import { hafas } from '../lib/hafas';
import { useOrientation } from './useOrientation';
import { stylesPortrait, stylesLandscape, styles } from './styles';
import { Location } from 'fs-hafas-client/hafas-client';
import { dbPrices } from '../lib/db-prices';

type Props = {
    route: RouteProp<MainStackParamList, 'BestPriceConnections'>;
    navigation: StackNavigationProp<MainStackParamList, 'BestPriceConnections'>;
};

export default function BestPriceConnectionsScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: BestPriceConnectionsScreenParams } = route;

    if (__DEV__) {
        console.log('constructor BestPriceConnectionsScreen, params.date: ', new Date(params.date).toString(), ', params.journeyParams: ', params.journeyParams);
    }

    const { t } = useTranslation();

    const [data, setData] = useState([] as JourneyInfo[]);
    const [date, setDate] = useState(new Date(params.date));
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);
    const [days, setDays] = useState(params.days);

    console.log('data.length: ', data.length, 'loading:', loading, 'date: ', date);

    const query1 = params.station1;
    const query2 = params.station2;
    const via = params.via;
    const profile = params.profile;
    const client: Hafas = hafas(profile);
    const tripDetails = params.tripDetails;
    const journeyParams = params.journeyParams;

    const isFutureDate = (date: Date): boolean => {
        return (new Date()) < date;
    }

    function addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    const makeRemoteRequest = async () => {
        console.log('makeRemoteRequest, loading:', loading);
        if (loading) return;
        setLoading(true);

        try {
            const locationsFrom =
                client.isLocation(query1) ? [query1] :
                    await client.locations(query1, 1);
            console.log('from:', locationsFrom[0].id, locationsFrom[0].name);

            const locationsVia = via && via.length > 0 ?
                (await client.locations(via, 1)) : [{ id: undefined, name: via }];
            console.log('via:', locationsVia[0].id, locationsVia[0].name, via);

            const locationsTo =
                client.isLocation(query2) ? [query2]
                    : await client.locations(query2, 1);
            console.log('to:', locationsTo[0].id, locationsTo[0].name);

            console.log('dbPrices: ', locationsFrom[0].id, locationsTo[0].id, date.toString(), days);
            if (isFutureDate(date) && locationsFrom[0].id !== undefined && locationsTo[0].id !== undefined) {
                dbPrices(locationsFrom[0].id, locationsTo[0].id, date, days, journeyParams, locationsVia[0].id)
                    .then(journeys => {
                        const infos = [] as JourneyInfo[];
                        journeys.slice(0, 7).forEach(journey => {
                            const info = client.journeyInfo(journey);
                            infos.push(info);
                        });
                        console.log('journeyInfos', infos.length);
                        setData(infos);
                        setLoading(false);
                    })
                    .catch((error) => {
                        console.log('There has been a problem with your dbPrices operation: ' + error);
                        console.log(error.stack);
                        setData([]);
                        setLoading(false);
                    });
            } else {
                console.log('no future date');
                setLoading(false);
            }
        } catch (error) {
            console.log('makeRemoteRequest: error ', error);
            setData([]);
            setLoading(false);
        }
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

    const toName = (loc: string | Location) => {
        if (client.isLocation(loc)) {
            return loc.name;
        } else {
            return loc;
        }
    }

    const goToView = (item: JourneyInfo) => {
        console.log('Navigation router run to Journeyplan');
        navigation.navigate('Journeyplan', { journey: item, profile, tripDetails })
    };

    const goToBestPriceView = (item: JourneyInfo) => {
        if (days > 1) {
            setDate(new Date(item.originDeparture));
            setDays(1);
            setData([]);
            setCount(count + 1);
        } else {
            goToView(item);
        }
    };

    const getIncrDate = (inFuture: boolean): Date => {
        const hours = (inFuture ? 1 : -1) * 24 * days;
        const msecsPerHour = 60 * 60 * 1000;
        const newDate = new Date(date);
        newDate.setTime(newDate.getTime() + ((hours) * msecsPerHour));
        return newDate;
    }

    const showIncr = (newDate: Date) => {
        if (isFutureDate(newDate)) {
            console.log('date: ', newDate)
            setDate(newDate);
            setData([]);
            setCount(count + 1);
        }
    }

    const showPrev = () => {
        showIncr(getIncrDate(false));
    }

    const showNext = () => {
        showIncr(getIncrDate(true));
    }

    const showDiffDays = (from: Date, to: Date) => {
        const diffDays = to.getFullYear() === from.getFullYear() ? moment(to).dayOfYear() - moment(from).dayOfYear() : 0;
        return diffDays > 0 ? t('ConnectionsScreen.DaysDifference', { count: diffDays }) : '';
    }

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

    const renderItem: ListRenderItem<JourneyInfo> = ({ item }) => {
        const departure = parseDatestring(item.plannedDeparture);
        return (
            <PaperList.Item
                style={{ borderWidth: 0, padding: 0 }}
                title={
                    () => <Text style={styles.summaryText}>{departure?.day.padStart(2, '0')}.{departure?.month.padStart(2, '0')}. {`${t('ConnectionsScreen.TimeFrom', { date: extractTimeOfDatestring(item.plannedDeparture) })}, ${t('ConnectionsScreen.TimeTo', { date: extractTimeOfDatestring(item.plannedArrival) })}${showDiffDays(new Date(item.originDeparture), new Date(item.destinationArrival))}, ${t('ConnectionsScreen.Duration', { duration: moment.duration((new Date(item.plannedArrival)).valueOf() - (new Date(item.plannedDeparture)).valueOf()) })}${item.distance > 0 ? ', ' + item.distance + ' km' : ''}`}</Text>
                }
                description={
                    () =>
                        <View>
                            <View style={styles.containerPriceText}>
                                <Text>{`${t('ConnectionsScreen.Changes', { changes: item.changes })}, ${item.lineNames}`}</Text>
                                {item.price && days > 1 &&
                                    <TouchableOpacity onPress={() => goToBestPriceView(item)}>
                                        <Text style={styles.priceText}>{`${item.price}`}</Text>
                                    </TouchableOpacity>}
                                {item.price && days === 1 &&
                                    <Text>{`${item.price}`}</Text>
                                }
                            </View>
                            <View style={styles.subtitleConnectionsColumn}>
                                {!item.reachable && !item.cancelled && (<Text style={styles.itemWarningText}>{t('ConnectionsScreen.ConnectionNotAccessible')}</Text>)}
                                {item.cancelled && (<Text style={styles.itemWarningText}>{t('ConnectionsScreen.TripCancled')}</Text>)}
                                {item.informationAvailable && (<Text style={styles.itemWarningText}>Es liegen aktuelle Informationen vor.</Text>)}
                            </View>
                        </View>
                }
                onPress={() => { goToView(item) }}
            />);
    }

    return (
        <View style={styles.container}>
            {!loading &&
                <View style={stylesLandscape.containerButtons} >
                    {isFutureDate(getIncrDate(false)) &&
                        <TouchableOpacity style={styles.buttonConnection} onPress={() => showPrev()}>
                            <Text style={styles.itemButtonText}>
                                {days > 1 ? t('BestPriceConnectionsScreen.Earlier', { days }) : t('BestPriceConnectionsScreen.PrevDay')}
                            </Text>
                        </TouchableOpacity>
                    }
                    <TouchableOpacity style={styles.buttonConnection} onPress={() => showNext()}>
                        <Text style={styles.itemButtonText}>
                            {days > 1 ? t('BestPriceConnectionsScreen.Later', { days }) : t('BestPriceConnectionsScreen.NextDay')}
                        </Text>
                    </TouchableOpacity>
                </View>
            }
            <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerHeaderText : stylesLandscape.containerHeaderText}>
                {via && via.length > 0 && <Text style={styles.itemHeaderText}>
                    {toName(query1)} {t('JourneyplanScreen.DirectionTo')} {toName(query2)} über {toName(via)}
                </Text>
                }
                {via.length === 0 && <Text style={styles.itemHeaderText}>
                    {toName(query1)} {t('JourneyplanScreen.DirectionTo')} {toName(query2)}
                </Text>
                }
                {days == 1 &&
                    <Text style={styles.itemHeaderText}>
                        {t('BestPriceConnectionsScreen.Date', { date })}
                    </Text>
                }
                {days > 1 &&
                    <Text style={styles.itemHeaderText}>
                        {t('BestPriceConnectionsScreen.DateRange', { date1: date, date2: addDays(date, days - 1) })}
                    </Text>
                }
                {
                    !loading && data.length === 0 && <Text style={styles.itemHeaderText}>
                        keine Verbindungn gefunden
                    </Text>
                }
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
    );
}
