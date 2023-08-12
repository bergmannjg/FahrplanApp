import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, FlatList, Text, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ListItem } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import { Stop, Location, Station } from 'hafas-client';
import { MainStackParamList, NearbyScreenParams, rinfProfile } from './ScreenTypes';
import { hafas, isLocation, getLocation } from '../lib/hafas';
import { getCurrentAddress } from '../lib/location';
import { useOrientation } from './useOrientation';
import { stylesPortrait, stylesLandscape, styles } from './styles';
import { distance } from '../lib/distance';

type Props = {
    route: RouteProp<MainStackParamList, 'Nearby'>;
    navigation: StackNavigationProp<MainStackParamList, 'Nearby'>;
};

export default function NearbyScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: NearbyScreenParams } = route;

    const { t } = useTranslation();

    const distanceInMeter = params.distance;
    const searchBusStops = params.searchBusStops;
    const profile = params.profile;
    const client = profile !== rinfProfile ? hafas(profile) : undefined;

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
                const currLoc = [location] as readonly (Stop | Station | Location)[]
                if (location.latitude && location.longitude) {
                    if (profile === rinfProfile) {
                        import('../lib/rinf-data-railway-routes')
                            .then(rinf => {
                                if (location.latitude && location.longitude) {
                                    const locations: Location[] =
                                        rinf.rinfNearby(location.latitude, location.longitude, distanceInMeter / 1000)
                                            .map(op => {
                                                const currdistance = location.latitude && location.longitude
                                                    ? distance(location.latitude, location.longitude, op.Latitude, op.Longitude)
                                                    : 0
                                                return {
                                                    type: 'location', name: op.Name, id: op.UOPID,
                                                    latitude: op.Latitude, longitude: op.Longitude,
                                                    distance: currdistance * 1000
                                                };
                                            });
                                    setLoading(false);
                                    setData(locations);
                                } else {
                                    setLoading(false);
                                    setData([]);
                                }
                            })
                    } else if (client) {
                        client.nearby(location.latitude, location.longitude, distanceInMeter, searchBusStops ? trainModes : busModes)
                            .then(locations => {
                                const stops = currLoc.concat(locations);
                                setLoading(false);
                                setData(stops);
                            })
                            .catch((error) => {
                                console.log('There has been a problem with your nearby operation: ' + error);
                                console.log(error.stack);
                                setLoading(false);
                                setData(currLoc);
                            });
                    }
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
                <ActivityIndicator size="small" color="#0000ff" />
            </View>
        );
    };

    const showLocation = async (item: Stop | Station | Location) => {
        const loc = getLocation(item);
        if (loc) {
            console.log('showLocation: ', loc);
            navigation.navigate('BRouter', { isLongPress: false, locations: [loc], titleSuffix: item.name });
        }
    }

    const goToView = (item: Stop | Station | Location): void => {
        console.log('Navigation router', item.name);
        setCount(count + 1);
        navigation.navigate('Home', { station: isLocation(item) ? item : item.name });
    };

    const incrDistance = (): void => {
        setCount(count + 1);
        setData([]);
        navigation.navigate('Nearby', { profile, distance: distanceInMeter * 2, searchBusStops: searchBusStops });
    };

    const switchMode = (): void => {
        setCount(count + 1);
        setData([]);
        navigation.navigate('Nearby', { profile, distance: distanceInMeter, searchBusStops: !searchBusStops });
    };

    return (
        <View style={styles.container}>
            <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerButtons : stylesLandscape.containerButtons} >
                <Text style={styles.itemHeaderTextNearby}>
                    {`${t('NearbyScreen.Distance')} ${distanceInMeter} m`}
                </Text>
                <TouchableOpacity style={styles.buttonNearby} onPress={() => incrDistance()} disabled={distanceInMeter > 20000}>
                    <Text style={styles.itemButtonText}>
                        {t('NearbyScreen.IncrDistance')}
                    </Text>
                </TouchableOpacity>
                {profile !== rinfProfile &&
                    <TouchableOpacity style={styles.buttonNearby} onPress={() => switchMode()}>
                        <Text style={styles.itemButtonText}>
                            {`${searchBusStops ? 'auch Bushaltestellen anzeigen' : 'keine Bushaltestellen anzeigen'}`}
                        </Text>
                    </TouchableOpacity>
                }
            </View>
            <FlatList
                data={data}
                renderItem={({ item }) => (
                    <ListItem containerStyle={{ borderBottomWidth: 0 }}>
                        <ListItem.Content>
                            <ListItem.Title>
                                <View style={styles.titleView} >
                                    <TouchableOpacity onPress={() => showLocation(item)}>
                                        <Text style={{ width: 20 }}>&#8982;</Text>
                                    </TouchableOpacity>
                                    <Text>&#32;</Text>
                                    <TouchableOpacity onPress={() => goToView(item)}>
                                        <Text>{`${item.name} ${item.distance?.toFixed(0)} m`}</Text>
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
