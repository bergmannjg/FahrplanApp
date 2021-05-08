import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ListItem } from "react-native-elements";
import { Location } from 'hafas-client';
import { useTranslation } from 'react-i18next';
import type { RailwayRouteOfTrip } from 'railwaytrip-to-railwayroute/dist/db-data-railway-routes';
import { findRailwayRoutesOfTrip, findRailwayRouteText, computeDistanceOfRoutes, findRailwayRoutePositionForRailwayRoutes } from 'railwaytrip-to-railwayroute/dist/db-data-railway-routes';
import { Stop } from 'hafas-client';
import { MainStackParamList, RailwayRoutesOfTripScreenParams, asLinkText } from './ScreenTypes';
import { useOrientation } from './useOrientation';
import { stylesPortrait,  stylesLandscape, styles } from './styles';

type Props = {
    route: RouteProp<MainStackParamList, 'RailwayRoutesOfTrip'>;
    navigation: StackNavigationProp<MainStackParamList, 'RailwayRoutesOfTrip'>;
};

export default function RailwayRoutesOfTripScreen({ route, navigation }: Props): JSX.Element {
    console.log('constructor RailwayRouteOfTrip');

    const { t } = useTranslation();

    const { params }: { params: RailwayRoutesOfTripScreenParams } = route;
    const stops: Stop[] = params.stops;
    const originName = params.originName;
    const destinationName = params.destinationName;

    console.log('stops.length: ', stops.length);

    const findRailwayRoutes = (stopsOfRoute: Stop[]) => {
        try {
            return findRailwayRoutesOfTrip(stopsOfRoute.map(s => parseInt(s.id || "0", 10)))
        } catch (ex) {
            console.error("findRailwayRoutesOfTrip", ex.message);
            return {
                railwayRoutes: [],
                missing: 0
            };
        }
    }

    const [data, setData] = useState([] as RailwayRouteOfTrip[]);
    const [loading, setLoading] = useState(true);
    const [distance, setDistance] = useState(0);
    const [missing, setMissing] = useState(0);

    const orientation = useOrientation();

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
                <ActivityIndicator size="small" color="#0000ff" />
            </View>
        );
    };

    interface ItemProps {
        item: RailwayRouteOfTrip
    }

    const normalizeString = (s: string) => {
        // const re = / {2}/gi;
        // return s.replace(re, '');
        return s;
    }

    const Item = ({ item }: ItemProps) => {
        return (
            <View style={styles.subtitleViewColumn}>
                <Text >{`${normalizeString(item.from?.name ?? '')} km: ${item.from?.railwayRoutePosition?.KM_L}`}</Text>
                <TouchableOpacity onPress={() => showRailwayRoute(item.railwayRouteNr ?? 0)}>
                    <Text style={styles.itemButtonTextRouteOfTrip}>{`${t('RailwayRoutesOfTripScreen.RailwayRoute')} ${item.railwayRouteNr} ${asLinkText(findRailwayRouteText(item.railwayRouteNr ?? 0))} `}</Text>
                </TouchableOpacity>
                <Text >{`${normalizeString(item.to?.name ?? '')} km: ${item.to?.railwayRoutePosition?.KM_L}`}</Text>
            </View >
        );
    }

    return (
        <View style={styles.container}>
            <View style={{ padding: 10 }}>
                <TouchableOpacity style={styles.buttonJourneyPlan} onPress={() => showRoute(false)} onLongPress={() => showRoute(true)}>
                    <Text style={styles.itemButtonText}>
                        {t('JourneyplanScreen.ShowRoute')}
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerHeaderText : stylesLandscape.containerHeaderText}>
                <Text style={styles.itemHeaderText}>
                    {originName} {t('JourneyplanScreen.DirectionTo')} {destinationName}
                </Text>
                <Text style={styles.itemHeaderText}>
                    km: {distance.toFixed(2)}
                </Text>
                {(missing > 0) &&
                    <Text style={styles.itemWarningText}>
                        {`${missing} Verbindungen ohne Strecke`}
                    </Text>
                }
            </View>
            <FlatList
                data={data}
                renderItem={({ item }) => (
                    <ListItem containerStyle={{ borderBottomWidth: 0 }} >
                        <ListItem.Content>
                            <ListItem.Title><Item item={item} /></ListItem.Title>
                        </ListItem.Content>
                    </ListItem>
                )}
                keyExtractor={item => item.railwayRouteNr ? item.railwayRouteNr.toString() : ''}
                ItemSeparatorComponent={renderSeparator}
                ListFooterComponent={renderFooter}
                onEndReachedThreshold={50}
            />
        </View>
    );
}
