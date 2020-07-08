import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar,
    TouchableOpacity,
    FlatList,
    ActivityIndicator
} from 'react-native';

import {
    Header,
    LearnMoreLinks,
    Colors,
    DebugInstructions,
    ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { ListItem, SearchBar, Icon } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import moment from 'moment';

import { RailwayRouteOfTrip, findRailwayRoutesOfTrip, findRailwayRouteText, computeDistance } from '../lib/db-data';
import { Stop } from 'hafas-client';
import { extractTimeOfDatestring, momentWithTimezone } from '../lib/iso-8601-datetime-utils';
import { MainStackParamList, RailwayRoutesOfTripScreenParams, BRouterScreenParams } from './ScreenTypes';

type Props = {
    route: RouteProp<MainStackParamList, 'RailwayRoutesOfTrip'>;
    navigation: StackNavigationProp<MainStackParamList, 'RailwayRoutesOfTrip'>;
};

export default function RailwayRoutesOfTripScreen({ route, navigation }: Props) {
    console.log('constructor JourneyplanScreen');

    const { t, i18n } = useTranslation();

    const { params }: { params: RailwayRoutesOfTripScreenParams } = route;
    const stops: Stop[] = params.stops;
    const routeSearch = params.routeSearch;

    console.log('stops.length: ', stops.length);

    const findRailwayRoutes = (stops: Stop[]) => {
        return findRailwayRoutesOfTrip(stops.map(s => parseInt(s.id)), true, routeSearch === 'single' ? 'single' : 'double');
    }

    // const data: RailwayRouteOfTrip[] = findRailwayRoutes(params.stops);
    const emptyData: RailwayRouteOfTrip[] = []
    const [data, setData] = useState(emptyData);
    const [loading, setLoading] = useState(true);
    const [distance, setDistance] = useState(0);

    useEffect(() => {
        if (loading && data.length == 0) {
            const routes = findRailwayRoutes(params.stops)
            setLoading(false);
            setDistance(computeDistance(routes));
            setData(routes);
        }
    });

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
        const re = /  /gi;
        return s.replace(re, '');
    }

    const Item = ({ item }: ItemProps) => {
        return (
            <View style={styles.subtitleView}>
                <Text style={styles.itemStationText}>{`${normalizeString(item.from?.name ?? '')} km: ${item.from?.railwayRoutePosition?.KM_L}`}</Text>
                <TouchableOpacity style={styles.button} onPress={() => showRailwayRoute(item.railwayRouteNr ?? 0)}>
                    <Text style={styles.itemButtonText}>{`${t('RailwayRoutesOfTripScreen.RailwayRoute')} ${item.railwayRouteNr} ${findRailwayRouteText(item.railwayRouteNr ?? 0)} `}</Text>
                </TouchableOpacity>
                <Text style={styles.itemStationText}>{`${normalizeString(item.to?.name ?? '')} km: ${item.to?.railwayRoutePosition?.KM_L}`}</Text>
            </View >
        );
    }

    return (
        <View style={styles.container}>
            <View >
                <Text style={styles.itemHeaderText}>
                    km: {distance.toFixed(2)}
                </Text>
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
    button: {
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
});

