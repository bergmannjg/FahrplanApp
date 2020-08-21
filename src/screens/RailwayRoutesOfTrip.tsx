import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator
} from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { ListItem } from "react-native-elements";
import { Location } from 'hafas-client';
import { useTranslation } from 'react-i18next';

import type { RailwayRouteOfTrip } from '../lib/db-data-railway-routes';
import { findRailwayRoutesOfTrip, findRailwayRouteText, computeDistanceOfRoutes, findRailwayRoutePositionForRailwayRoutes } from '../lib/db-data-railway-routes';
import { Stop } from 'hafas-client';
import { MainStackParamList, RailwayRoutesOfTripScreenParams } from './ScreenTypes';

type Props = {
    route: RouteProp<MainStackParamList, 'RailwayRoutesOfTrip'>;
    navigation: StackNavigationProp<MainStackParamList, 'RailwayRoutesOfTrip'>;
};

export default function RailwayRoutesOfTripScreen({ route, navigation }: Props): JSX.Element {
    console.log('constructor RailwayRouteOfTrip');

    const { t } = useTranslation();

    const { params }: { params: RailwayRoutesOfTripScreenParams } = route;
    const stops: Stop[] = params.stops;

    console.log('stops.length: ', stops.length);

    const findRailwayRoutes = (stopsOfRoute: Stop[]) => {
        return findRailwayRoutesOfTrip(stopsOfRoute.map(s => parseInt(s.id, 10)), true);
    }

    const [data, setData] = useState([] as RailwayRouteOfTrip[]);
    const [loading, setLoading] = useState(true);
    const [distance, setDistance] = useState(0);
    const [missing, setMissing] = useState(0);

    useEffect(() => {
        if (loading && data.length === 0) {
            const result = findRailwayRoutes(params.stops)
            setLoading(false);
            setDistance(computeDistanceOfRoutes(result.railwayRoutes));
            setData(result.railwayRoutes);
            setMissing(result.missing)
        }
    });

    const showRoute = async (isLongPress: boolean) => {
        if (data.length > 0) {
            const locations: Location[] = findRailwayRoutePositionForRailwayRoutes(data, isLongPress).filter(s => s.GEOGR_LAENGE > 0 && s.GEOGR_LAENGE > 0).map(s => { return { type: 'location', longitude: s.GEOGR_LAENGE, latitude: s.GEOGR_BREITE } })
            navigation.navigate('BRouter', { isLongPress: false, locations });
        }
    }

    const showRailwayRoute = async (railwayRouteNr: number) => {
        console.log('showRailwayRoute');

        navigation.navigate('RailwayRoute', { railwayRouteNr });
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

    interface ItemProps {
        item: RailwayRouteOfTrip
    }

    const normalizeString = (s: string) => {
        const re = / {2}/gi;
        return s.replace(re, '');
    }

    const Item = ({ item }: ItemProps) => {
        return (
            <View style={styles.subtitleView}>
                <Text style={styles.itemStationText}>{`${normalizeString(item.from?.name ?? '')} km: ${item.from?.railwayRoutePosition?.KM_L}`}</Text>
                <TouchableOpacity style={styles.itemButton} onPress={() => showRailwayRoute(item.railwayRouteNr ?? 0)}>
                    <Text style={styles.itemButtonText}>{`${t('RailwayRoutesOfTripScreen.RailwayRoute')} ${item.railwayRouteNr} ${findRailwayRouteText(item.railwayRouteNr ?? 0)} `}</Text>
                </TouchableOpacity>
                <Text style={styles.itemStationText}>{`${normalizeString(item.to?.name ?? '')} km: ${item.to?.railwayRoutePosition?.KM_L}`}</Text>
            </View >
        );
    }

    return (
        <View style={styles.container}>
            <View >
                <TouchableOpacity style={styles.button} onPress={() => showRoute(false)} onLongPress={() => showRoute(true)}>
                    <Text style={styles.buttonText}>
                        {t('JourneyplanScreen.ShowRoute')}
                    </Text>
                </TouchableOpacity>
            </View>
            <View >
                <Text style={styles.itemHeaderText}>
                    km: {distance.toFixed(2)}
                </Text>
                {(missing > 0) &&
                    <Text style={styles.itemHeaderWarningText}>
                        {`${missing} Verbindungen ohne Strecke`}
                    </Text>
                }
            </View>
            <FlatList
                data={data}
                renderItem={({ item }) => (
                    <ListItem
                        title={<Item item={item} />}
                        containerStyle={{ borderBottomWidth: 0 }}
                    />
                )}
                keyExtractor={item => item.railwayRouteNr ? item.railwayRouteNr.toString() : ''}
                ItemSeparatorComponent={renderSeparator}
                ListFooterComponent={renderFooter}
                onEndReachedThreshold={50}
            />
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
    activity: {
        backgroundColor: Colors.white,
    },
    itemHeaderText: {
        fontSize: 14,
        paddingLeft: 35,
        paddingBottom: 0,
        paddingTop: 10,
        backgroundColor: Colors.white,
    },
    itemHeaderWarningText: {
        fontSize: 14,
        paddingLeft: 35,
        paddingBottom: 0,
        paddingTop: 10,
        backgroundColor: Colors.white,
        color: 'red'
    },
    itemWarningText: {
        color: 'red',
        paddingLeft: 50,
    },
    itemDelayText: {
        color: 'green',
    },
    itemStationText: {
        fontWeight: 'normal',
    },
    itemDetailsText: {
        paddingLeft: 30,
        fontWeight: 'bold'
    },
    footer: {
        color: Colors.dark,
        fontSize: 12,
        fontWeight: '600',
        padding: 4,
        paddingRight: 12,
        textAlign: 'right',
    },
    itemButton: {
        alignItems: 'flex-start',
        fontWeight: 'normal',
        // backgroundColor: '#DDDDDD',
        padding: 8,
        margin: 2,
    },
    itemButtonText: {
        margin: 2,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    button: {
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 8,
        margin: 2,
    },
    buttonText: {
        fontSize: 18,
        margin: 2,
        textAlign: 'center'
    },
});

