import React, { useState, useEffect } from 'react';
import { Text, FlatList, ActivityIndicator, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ListItem } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import { extractTimeOfDatestring } from '../lib/iso-8601-datetime-utils';
import { MainStackParamList, ArrivalScreenParams } from './ScreenTypes';
import { Alternative, Line } from 'hafas-client';
import { hafas } from '../lib/hafas';
import { styles } from './styles';

type Props = {
    route: RouteProp<MainStackParamList, 'Arrivals'>;
    navigation: StackNavigationProp<MainStackParamList, 'Arrivals'>;
};

export default function ArrivalScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: ArrivalScreenParams } = route;

    if (__DEV__) {
        console.log('constructor ArrivalScreen, params.station: ', params.station);
    }

    const { t } = useTranslation();

    const profile = params.profile;
    const station = params.station;
    const date = new Date();
    const client = hafas(profile);

    const [data, setData] = useState([] as readonly Alternative[]);
    const [loading, setLoading] = useState(false);
    const [count] = useState(0);

    const makeRemoteRequest = () => {
        console.log('makeRemoteRequest, loading:', loading);
        if (loading) return;
        setLoading(true);
        const onlyLocalProducts = false;
        client.arrivals(station, ['train', 'watercraft'], new Date(date), onlyLocalProducts)
            .then(alternatives => {
                setLoading(false);
                setData(alternatives);
            })
            .catch((error) => {
                console.log('There has been a problem with your arrivals operation: ' + error);
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

    const goToTrip = (item: Alternative) => {
        console.log('Navigation router run to Trip of alternative');
        console.log('item.tripId: ', item.tripId);
        if (item.tripId) {
            client.trip(item.tripId)
                .then(trip => {
                    navigation.navigate('Trip', { trip, profile })
                })
                .catch((error) => {
                    console.log('There has been a problem with your tripsOfJourney operation: ' + error.message);
                });
        }
    }

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
                <ActivityIndicator size="small" color="#0000ff" />
            </View>
        );
    };

    const platform = (p?: string) => {
        if (p) {
            return ' Gl. ' + p + '';
        }
        else {
            return '';
        }
    }

    const title = (item: Alternative) => {
        return item.direction + ' -> ' + item.stop?.name + platform(item.plannedPlatform);
    }

    const lineName = (line: Line) => {
        if (line && line.name) return line.name;
        else if (line && line.operator && line.operator.name) return line.operator.name;
        else return ''
    }

    const arrivalTime = (item: Alternative): string => {
        if (item.plannedWhen && item.when && item.plannedWhen !== item.when)
            return t('ArrivalScreen.WhenDelayed', { plannedDate: extractTimeOfDatestring(item.plannedWhen), date: extractTimeOfDatestring(item.when) })
        else if (item.plannedWhen)
            return t('ArrivalScreen.When', { date: extractTimeOfDatestring(item.plannedWhen) })
        else return '';
    }

    return (
        <View style={styles.container}>

            <View style={styles.container}>
                <FlatList
                    data={data}
                    renderItem={({ item }) => (
                        <ListItem onPress={() => { goToTrip(item) }} containerStyle={{ borderBottomWidth: 0 }}>
                            <ListItem.Content>
                                <ListItem.Title>
                                    <Text style={styles.summaryText}>
                                        {`${title(item)}`}
                                    </Text>
                                </ListItem.Title>
                                <ListItem.Subtitle>
                                    <View style={styles.contentText}>
                                        {item.line && <Text>{lineName(item.line)}</Text>}
                                        {item.plannedWhen && <Text>{arrivalTime(item)}</Text>}
                                        {item.cancelled && <Text>Fahrt fällt aus</Text>}
                                    </View>
                                </ListItem.Subtitle>
                            </ListItem.Content>
                        </ListItem>
                    )}
                    keyExtractor={item => item.tripId + item.stop?.id}
                    ItemSeparatorComponent={renderSeparator}
                    ListFooterComponent={renderFooter}
                    onEndReachedThreshold={50}
                />
            </View>
        </View>
    );
}
