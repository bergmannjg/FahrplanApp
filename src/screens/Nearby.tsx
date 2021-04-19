import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    FlatList,
    Text,
    ActivityIndicator
} from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { ListItem } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import { Hafas } from '../lib/hafas';
import { Stop, Location, Station } from 'hafas-client';
import { MainStackParamList, NearbyScreenParams } from './ScreenTypes';
import { hafas } from '../lib/hafas';
import { getCurrentAddress } from '../lib/location';

type Props = {
    route: RouteProp<MainStackParamList, 'Nearby'>;
    navigation: StackNavigationProp<MainStackParamList, 'Nearby'>;
};

export default function NearbyScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: NearbyScreenParams } = route;

    const { t } = useTranslation();

    const distance = params.distance;
    const searchBusStops = params.searchBusStops;
    const profile = params.profile;
    const client: Hafas = hafas(profile);

    const [data, setData] = useState([] as readonly (Stop | Station | Location)[]);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);
    const trainModes = ["train"];
    const busModes = ["train", "bus"];

    const makeRemoteRequest = () => {
        console.log('makeRemoteRequest, loading:', loading);
        if (loading) return;
        setLoading(true);

        getCurrentAddress()
            .then(location => {
                console.log(location);
                if (location.latitude && location.longitude) {
                    client.nearby(location.latitude, location.longitude, distance, searchBusStops ? trainModes : busModes)
                        .then(locations => {
                            const currLoc = [location] as readonly (Stop | Station | Location)[]
                            const stops = currLoc.concat(locations);
                            setLoading(false);
                            setData(stops);
                        })
                        .catch((error) => {
                            console.log('There has been a problem with your nearby operation: ' + error);
                            console.log(error.stack);
                            setLoading(false);
                            setData([]);
                        });
                }
                else {
                    setLoading(false);
                    setData([]);
                }
            })
            .catch(error => {
                const { code, message } = error;
                console.warn(code, message);
                setLoading(false);
                setData([]);
            })
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
                <ActivityIndicator animating size="large" />
            </View>
        );
    };

    const goToView = (item: Stop | Station | Location): void => {
        console.log('Navigation router', item.name);
        setCount(count + 1);
        navigation.navigate('Home', { station: client.isLocation(item) ? item : item.name });
    };

    const incrDistance = (): void => {
        setCount(count + 1);
        navigation.navigate('Nearby', { profile, distance: distance * 2, searchBusStops: searchBusStops });
    };

    const switchMode = (): void => {
        setCount(count + 1);
        navigation.navigate('Nearby', { profile, distance: distance, searchBusStops: !searchBusStops });
    };

    return (
        <View style={styles.container}>
            <View >
                <Text style={styles.itemHeaderText}>
                    {`${t('NearbyScreen.Distance')} ${distance} m`}
                </Text>
            </View>
            <View >
                <TouchableOpacity style={styles.button} onPress={() => incrDistance()} disabled={distance > 20000}>
                    <Text style={styles.itemButtonText}>
                        {t('NearbyScreen.IncrDistance')}
                    </Text>
                </TouchableOpacity>
            </View>
            <View >
                <TouchableOpacity style={styles.button} onPress={() => switchMode()}>
                    <Text style={styles.itemButtonText}>
                        {`${searchBusStops ? 'auch Bushaltestellen anzeigen' : 'keine Bushaltestellen anzeigen'}`}
                    </Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={data}
                renderItem={({ item }) => (
                    <ListItem onPress={() => { goToView(item) }} containerStyle={{ borderBottomWidth: 0 }} >
                        <ListItem.Content>
                            <ListItem.Title>{`${item.name} ${item.distance} m`}</ListItem.Title>
                        </ListItem.Content>
                    </ListItem>
                )}
                keyExtractor={item => item.id ? item.id : ''}
                ItemSeparatorComponent={renderSeparator}
                ListFooterComponent={renderFooter}
                onEndReachedThreshold={50}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        paddingTop: 10
    },
    containerButtons: {

    },
    container2: {
        flex: 1,
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
    footer: {
        color: Colors.dark,
        fontSize: 12,
        fontWeight: '600',
        padding: 4,
        paddingRight: 12,
        textAlign: 'right',
    },
    subtitleView: {
        flexDirection: 'column',
        paddingLeft: 10,
        paddingTop: 5
    },
    itemWarningText: {
        color: 'red',
    },
    button: {
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 10,
        margin: 2,
    },
    itemButtonText: {
        fontSize: 18,
        margin: 2,
        textAlign: 'center',
    },
    itemHeaderText: {
        fontSize: 15,
        padding: 10,
        paddingLeft: 15,
    },
});

