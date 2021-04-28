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
import { useOrientation } from './useOrientation';

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

    const showLocation = async (item: Stop | Station | Location) => {
        const loc = client.getLocation(item);
        if (loc) {
            console.log('showLocation: ', loc);
            navigation.navigate('BRouter', { isLongPress: false, locations: [loc], titleSuffix: item.name });
        }
    }

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
            <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerButtons : stylesLandscape.containerButtons} >
                <Text style={styles.itemHeaderText}>
                    {`${t('NearbyScreen.Distance')} ${distance} m`}
                </Text>
                <TouchableOpacity style={styles.button} onPress={() => incrDistance()} disabled={distance > 20000}>
                    <Text style={styles.itemButtonText}>
                        {t('NearbyScreen.IncrDistance')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => switchMode()}>
                    <Text style={styles.itemButtonText}>
                        {`${searchBusStops ? 'auch Bushaltestellen anzeigen' : 'keine Bushaltestellen anzeigen'}`}
                    </Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={data}
                renderItem={({ item }) => (
                    <ListItem containerStyle={{ borderBottomWidth: 0 }} >
                        <ListItem.Content>
                            <ListItem.Title>
                                <View style={styles.titleView} >
                                    <TouchableOpacity onPress={() => showLocation(item)}>
                                        <Text style={{ width: 20 }}>&#8982;</Text>
                                    </TouchableOpacity>
                                    <Text>&#32;</Text>
                                    <TouchableOpacity onPress={() => goToView(item)}>
                                        <Text>{`${item.name} ${item.distance} m`}</Text>
                                    </TouchableOpacity>
                                </View>
                            </ListItem.Title>
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

const stylesPortrait = StyleSheet.create({
    containerButtons: {
        flexDirection: 'column',
    }
});

const stylesLandscape = StyleSheet.create({
    containerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 10
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
    },
    titleView: {
        flexDirection: 'row'
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
        paddingTop: 15,
        paddingLeft: 15,
    },
});

