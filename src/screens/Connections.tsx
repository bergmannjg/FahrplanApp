import React, { useState, useEffect } from 'react';
import { List as PaperList, Text } from 'react-native-paper';
import { View, TouchableOpacity, FlatList, ListRenderItem, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { extractTimeOfDatestring } from '../lib/iso-8601-datetime-utils';
import { Hafas, JourneyInfo } from '../lib/hafas';
import { MainStackParamList, ConnectionsScreenParams } from './ScreenTypes';
import { hafas } from '../lib/hafas';
import { useOrientation } from './useOrientation';
import { stylesPortrait, stylesLandscape, styles } from './styles';
import { Location } from 'fs-hafas-client/hafas-client';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type Props = {
    route: RouteProp<MainStackParamList, 'Connections'>;
    navigation: StackNavigationProp<MainStackParamList, 'Connections'>;
};

export default function ConnectionsScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: ConnectionsScreenParams } = route;

    if (__DEV__) {
        console.log('constructor ConnectionsScreen, params.date: ', new Date(params.date).toString(), ', params.journeyParams: ', params.journeyParams);
    }

    const { t } = useTranslation();

    const [data, setData] = useState([] as JourneyInfo[]);
    const [date, setDate] = useState(new Date(params.date));
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);

    console.log('data.length: ', data.length);

    const query1 = params.station1;
    const query2 = params.station2;
    const queryVia = params.via;
    const profile = params.profile;
    const client: Hafas = hafas(profile);
    const tripDetails = params.tripDetails;
    const journeyParams = params.journeyParams;
    const modes = ["train", "watercraft", "bus"];

    const makeRemoteRequest = () => {
        console.log('makeRemoteRequest, loading:', loading);
        if (loading) return;
        setLoading(true);

        client.journeys(query1, query2, journeyParams, date, queryVia, modes)
            .then(journeys => {
                const infos = [] as JourneyInfo[];
                journeys.forEach(journey => {
                    const info = client.journeyInfo(journey);
                    console.log('destination', info.origin)
                    infos.push(info);
                });
                console.log('journeyInfos', infos.length);
                setLoading(false);
                setData(infos);
            })
            .catch((error) => {
                console.log('There has been a problem with your journeys operation: ' + error);
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

    const toName = (loc: string | Location) => {
        if (client.isLocation(loc)) {
            return loc.name;
        } else {
            return loc;
        }
    }

    const goToView = async (item: JourneyInfo) => {
        console.log('Navigation router run to Journeyplan');
        navigation.navigate('Journeyplan', { journey: item, profile, tripDetails })
    };

    const showIncr = (hours: number) => {
        const msecsPerHour = 60 * 60 * 1000;
        const newDate = date;
        newDate.setTime(newDate.getTime() + ((hours) * msecsPerHour));
        console.log('date: ', newDate)
        setDate(newDate);
        setData([]);
        setCount(count + 1);
    }

    const showPrev = () => {
        showIncr(-2);
    }

    const showNext = () => {
        if (data.length > 0) {
            const newDate = new Date(data[data.length - 1].originDeparture);
            console.log('originDeparture: ', newDate)
            setDate(newDate);
            setData([]);
            setCount(count + 1);
        } else {
            showIncr(1);
        }
    }

    const showBestPrice = () => {
        console.log('BestPriceConnections. profile:', profile);
        navigation.navigate('BestPriceConnections', { profile: profile, station1: params.station1, station2: params.station2, via: params.via, date: date.valueOf(), tripDetails, journeyParams, days: 7 });
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

    const renderItem: ListRenderItem<JourneyInfo> = ({ item }) => (
        <PaperList.Item
            style={{ borderWidth: 0, padding: 0 }}
            title={
                () => <Text style={styles.summaryText}>{`${t('ConnectionsScreen.TimeFrom', { date: extractTimeOfDatestring(item.plannedDeparture) })}, ${t('ConnectionsScreen.TimeTo', { date: extractTimeOfDatestring(item.plannedArrival) })}${showDiffDays(new Date(item.plannedDeparture), new Date(item.plannedArrival))}, ${t('ConnectionsScreen.Duration', { duration: moment.duration((new Date(item.plannedArrival)).valueOf() - (new Date(item.plannedDeparture)).valueOf()) })}${item.distance > 0 ? ', ' + item.distance + ' km' : ''}`}</Text>
            }
            description={
                () =>
                    <View>
                        <View style={styles.containerPriceText}>
                            <Text>{`${t('ConnectionsScreen.Changes', { changes: item.changes })}, ${item.lineNames}`}</Text>
                            {item.price && <Text>{`${item.price}`}</Text>}
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

    const longPressGesture = Gesture.Pan().onEnd((e, success) => {
        if (success) {
            setData([]);
            setCount(count + 1);
        }
    });

    const isFutureDate = () => {
        return (new Date()) < date;
    }

    const hasBestPrice = () => {
        if (data.length === 0) return false;
        else return (data[0].origin?.id?.startsWith('80') || data[0].destination?.id?.startsWith('80'))
            && isFutureDate()
            && (profile === 'db' || profile === 'db-fsharp');
    }

    return (
        <GestureDetector gesture={longPressGesture}>
            <View style={styles.container}>
                <View style={stylesLandscape.containerButtons} >
                    <TouchableOpacity style={styles.buttonConnection} onPress={() => showPrev()}>
                        <Text style={styles.itemButtonText}>
                            {t('ConnectionsScreen.Earlier')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonConnection} onPress={() => showNext()}>
                        <Text style={styles.itemButtonText}>
                            {t('ConnectionsScreen.Later')}
                        </Text>
                    </TouchableOpacity>
                    {hasBestPrice() &&
                        <TouchableOpacity style={styles.buttonConnection} onPress={() => showBestPrice()}>
                            <Text style={styles.itemButtonText}>
                                {t('ConnectionsScreen.BestPrice')}
                            </Text>
                        </TouchableOpacity>
                    }
                </View>
                <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerHeaderText : stylesLandscape.containerHeaderText}>
                    <Text style={styles.itemHeaderText}>
                        {toName(query1)} {t('JourneyplanScreen.DirectionTo')} {toName(query2)}
                    </Text>
                    <Text style={styles.itemHeaderText}>
                        {t('ConnectionsScreen.Date', { date })}
                    </Text>
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
        </GestureDetector>
    );
}
