import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ListItem } from "react-native-elements";
import { Location } from 'hafas-client';
import { useTranslation } from 'react-i18next';
import { Stop } from 'hafas-client';
import { hafas, Hafas } from '../lib/hafas';
import { MainStackParamList, RailwayRoutesOfTripScreenParams, asLinkText } from './ScreenTypes';
import { useOrientation } from './useOrientation';
import { stylesPortrait, stylesLandscape, styles } from './styles';
import { rinfToPathElement, rinfFindRailwayRoutesOfTripIBNRs, rinfComputeDistanceOfPath, rinfGetCompactPath, rinfGetLocationsOfPath } from '../lib/rinf-data-railway-routes';
import type { GraphNode } from 'rinf-data/rinfgraph.bundle';

type Props = {
    route: RouteProp<MainStackParamList, 'RailwayRoutesOfTrip'>;
    navigation: StackNavigationProp<MainStackParamList, 'RailwayRoutesOfTrip'>;
};

export default function RailwayRoutesOfTripScreen({ route, navigation }: Props): JSX.Element {
    console.log('constructor RailwayRouteOfTrip');

    const { t } = useTranslation();

    const { params }: { params: RailwayRoutesOfTripScreenParams } = route;
    const journeyInfo = params.journeyInfo;
    const stops = params.stops;
    const showTransfers = params.tripDetails;
    const profile = params.profile;
    const client: Hafas = hafas(profile);
    const trainModes = ["train", "watercraft"];

    const originName = params.originName;
    const destinationName = params.destinationName;

    console.log('journeyInfo.legs.length: ', journeyInfo?.legs.length);
    console.log('stops.length: ', stops?.length);

    const findRailwayRoutes = (stopsOfRoute: Stop[]): GraphNode[] => {
        try {
            const uics = stopsOfRoute.map(s => parseInt(s.id || "0", 10))
            return rinfFindRailwayRoutesOfTripIBNRs(uics);
        } catch (ex) {
            console.error("findRailwayRoutesOfTrip", ex.message);
            return [];
        }
    }

    const [path, setPath] = useState([] as GraphNode[]);
    const [compactPath, setCompactData] = useState([] as GraphNode[]);
    const [loading, setLoading] = useState(true);
    const [distance, setDistance] = useState(0);

    const orientation = useOrientation();

    useEffect(() => {
        if (loading && path.length === 0) {
            if (journeyInfo) {
                client.stopssOfJourney(journeyInfo, trainModes, showTransfers, showTransfers)
                    .then(stops => {
                        const result = findRailwayRoutes(stops)
                        setLoading(false);
                        setDistance(rinfComputeDistanceOfPath(result));
                        setPath(result);
                        setCompactData(rinfGetCompactPath(result));
                    })
                    .catch((error) => {
                        console.log('There has been a problem with your stopssOfJourney operation: ' + error);
                        console.log(error.stack);
                        setLoading(false);
                        setPath([]);
                    });
            } else if (stops) {
                const result = findRailwayRoutes(stops)
                setLoading(false);
                setDistance(rinfComputeDistanceOfPath(result));
                setPath(result);
                setCompactData(rinfGetCompactPath(result));

            } else {
                setLoading(false);
            }
        }
    });

    const showRoute = async (isLongPress: boolean) => {
        if (path.length > 0) {
            const locations: Location[] = rinfGetLocationsOfPath(path).map(s => { return { type: 'location', longitude: s.Longitude, latitude: s.Latitude } })
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
        item: GraphNode
    }

    // adhoc
    const normalizeString = (s: string) => {
        return s.replace('Berlin Hauptbahnhof - Lehrter Bahnhof', 'Berlin Hauptbahnhof');
    }

    const Item = ({ item }: ItemProps) => {
        const element = rinfToPathElement(item);
        return (
            <View style={styles.subtitleViewColumn}>
                <Text >{`${normalizeString(element.from)} (${element.fromOPID}) km: ${element.startKm}`}</Text>
                <TouchableOpacity onPress={() => showRailwayRoute(element.line)}>
                    <Text style={styles.itemButtonTextRouteOfTrip}>{`${element.line} ${asLinkText(normalizeString(element.lineText))} `}</Text>
                </TouchableOpacity>
                <Text >{`${normalizeString(element.to)} (${element.toOPID}) km: ${element.endKm}`}</Text>
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
            </View>
            <FlatList
                data={compactPath}
                renderItem={({ item }) => (
                    <ListItem containerStyle={{ borderBottomWidth: 0 }} >
                        <ListItem.Content>
                            <ListItem.Title><Item item={item} /></ListItem.Title>
                        </ListItem.Content>
                    </ListItem>
                )}
                keyExtractor={item => item.Node}
                ItemSeparatorComponent={renderSeparator}
                ListFooterComponent={renderFooter}
                onEndReachedThreshold={50}
            />
        </View>
    );
}
