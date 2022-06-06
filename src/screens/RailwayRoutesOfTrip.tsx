import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, VirtualizedList } from 'react-native';
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
import { rinfToPathElement, rinfIsWalkingPath, rinfFindRailwayRoutesOfTripIBNRs, rinfGetCompactPath, rinfGetLocationsOfPath } from '../lib/rinf-data-railway-routes';
import type { GraphNode, Location as RInfLocation } from 'rinf-graph/rinfgraph.bundle';

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
    const useMaxSpeed = !params.compactifyPath;
    const compactifyPath = true;
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
            return rinfFindRailwayRoutesOfTripIBNRs(uics, compactifyPath);
        } catch (ex) {
            console.error("findRailwayRoutesOfTrip", (ex as Error).message);
            return [];
        }
    }

    interface GraphNodeEx {
        TotalStartKm: number;
        TotalEndKm: number;
        node: GraphNode;
        prevNode?: GraphNode
        nextNode?: GraphNode
    }

    const [path, setPath] = useState([] as GraphNode[]);
    const [compactPath, setCompactData] = useState([] as GraphNodeEx[]);
    const [loading, setLoading] = useState(true);
    const [locationsOfPath, setLocationsOfPath] = useState([] as RInfLocation[][]);
    const [locationsOfPathIndexes, setLocationsOfPathIndexes] = useState([] as number[]);

    const orientation = useOrientation();

    const distanceOfNode = (node: GraphNode): number => Math.abs(node.Edges[0].StartKm - node.Edges[0].EndKm)

    const reducer = (previous: GraphNodeEx[], current: GraphNode): GraphNodeEx[] => {
        const currTotal = previous.length > 0 ? previous[previous.length - 1].TotalEndKm : 0;
        if (previous.length > 0) {
            previous[previous.length - 1].nextNode = current;
        }
        return previous.concat([{
            TotalStartKm: currTotal,
            TotalEndKm: currTotal + distanceOfNode(current),
            node: current,
            prevNode: previous.length > 0 ? previous[previous.length - 1].node : undefined
        }]);
    }

    useEffect(() => {
        if (loading && path.length === 0) {
            if (journeyInfo) {
                client.stopssOfJourney(journeyInfo, trainModes, showTransfers, showTransfers)
                    .then(stops => {
                        const result = findRailwayRoutes(stops)
                        setLoading(false);
                        setPath(result);
                        setCompactData(rinfGetCompactPath(result, useMaxSpeed).reduce(reducer, []));
                        const locations = rinfGetLocationsOfPath(result);
                        setLocationsOfPath(locations);
                        const indexes = [...locations.keys()];
                        console.log('indexes:', indexes);
                        setLocationsOfPathIndexes(indexes);
                    })
                    .catch((error) => {
                        console.log('There has been a problem with your stopssOfJourney operation: ' + error);
                        console.log(error.stack);
                        setLoading(false);
                        setPath([]);
                        setLocationsOfPath([]);
                    });
            } else if (stops) {
                const result = findRailwayRoutes(stops)
                setLoading(false);
                const locations = rinfGetLocationsOfPath(result);
                console.log('locations:', locations.length);
                const indexes = [...locations.map((_, i) => i)];
                console.log('indexes:', indexes);

                setPath(result);
                setCompactData(rinfGetCompactPath(result, useMaxSpeed).reduce(reducer, []));
                setLocationsOfPath(locations);
                setLocationsOfPathIndexes(indexes);
            } else {
                setLoading(false);
            }
        }
    });

    const showRoute = async (index: number) => {
        if (locationsOfPath[index].length > 0) {
            const locations: Location[] = locationsOfPath[index].map(s => { return { type: 'location', longitude: s.Longitude, latitude: s.Latitude } })
            navigation.navigate('BRouter', { isLongPress: false, locations });
        }
    }

    const showRailwayRoute = async (imcode: string, railwayRouteNr: number) => {
        console.log('showRailwayRoute');

        navigation.navigate('RailwayRoute', { railwayRouteNr, imcode });
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

    // adhoc
    const normalizeString = (s: string) => {
        return s.replace('Berlin Hauptbahnhof - Lehrter Bahnhof', 'Berlin Hauptbahnhof').replace(/[ ]+/, ' ');
    }

    interface ItemProps {
        item: GraphNodeEx
    }

    const Item = ({ item }: ItemProps) => {
        const element = rinfToPathElement(item.node);
        const isWalking = rinfIsWalkingPath(item.node); // todo
        const maxSpeedInfo = useMaxSpeed ? element.MaxSpeed.toString() + ' km ' : ''
        const firstNodeOfLine = item.TotalStartKm === 0 || (item.prevNode ? item.prevNode.Edges[0].Line !== item.node.Edges[0].Line : true);
        const lastNodeOfLine = item.nextNode ? item.nextNode.Edges[0].Line !== item.node.Edges[0].Line : true;
        const lastNode = !item.nextNode;
        return (
            useMaxSpeed ?
                <View>
                    {firstNodeOfLine && <View style={styles.distanceColumn}>
                        <Text style={styles.distanceText}>km: {`${item.TotalStartKm.toFixed(3)}`}</Text>
                        <TouchableOpacity onPress={() => showRailwayRoute(element.IMCode, parseInt(element.Line))}>
                                <Text style={styles.maxSpeedLinkText}>{`${element.Line} ${asLinkText(normalizeString(element.LineText))} `}</Text>
                            </TouchableOpacity>
                    </View>}
                    <View style={styles.routeViewMaxSpeedColumn}>
                        <Text >{`${normalizeString(element.From)}, km: ${element.StartKm}`}</Text>
                        {isWalking ?
                            <Text style={styles.itemButtonTextMaxSpeed}>Fußweg</Text>
                            :
                                <Text style={styles.itemButtonTextMaxSpeed}>{`${maxSpeedInfo}`}</Text>
                        }
                        {lastNodeOfLine && <Text >{`${normalizeString(element.To)}, km: ${element.EndKm}`}</Text>}
                    </View >
                    {lastNode && <View style={styles.distanceColumn}>
                        <Text style={styles.distanceText}>km: {`${item.TotalEndKm.toFixed(3)}`}</Text>
                    </View>}
                </View> :
                <View>
                    {item.TotalStartKm === 0 && <View style={styles.distanceColumn}>
                        <Text style={styles.distanceText}>km: {`${item.TotalStartKm.toFixed(3)}`}</Text>
                    </View>}
                    <View style={styles.routeViewColumn}>
                        <Text >{`${normalizeString(element.From)}, km: ${element.StartKm}`}</Text>
                        {isWalking ?
                            <Text style={styles.itemButtonTextRouteOfTrip}>Fußweg</Text>
                            :
                            <TouchableOpacity onPress={() => showRailwayRoute(element.IMCode, parseInt(element.Line))}>
                                <Text style={styles.itemButtonTextRouteOfTrip}>{`${maxSpeedInfo}${element.Line} ${asLinkText(normalizeString(element.LineText))} `}</Text>
                            </TouchableOpacity>
                        }
                        <Text >{`${normalizeString(element.To)}, km: ${element.EndKm}`}</Text>
                    </View >
                    <View style={styles.distanceColumn}>
                        <Text style={styles.distanceText}>km: {`${item.TotalEndKm.toFixed(3)}`}</Text>
                    </View>
                </View>
        );
    }

    interface RouteItemProps {
        item: number,
    }

    const RouteItem = ({ item }: RouteItemProps) => {
        const len = locationsOfPathIndexes.length;
        const txt = len > 1 ? (item + 1).toString() : ''
        console.log('RouteItem: ', item, len)
        return (
            <View style={styles.subtitleButtonColumn}>
                <TouchableOpacity style={styles.buttonJourneyPlan} onPress={() => showRoute(item)}>
                    <Text style={styles.itemButtonText}>
                        {t('JourneyplanScreen.ShowRoute')} {txt}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerHeaderText : stylesLandscape.containerHeaderText}>
                <VirtualizedList
                    data={locationsOfPathIndexes}
                    renderItem={({ item }) => (
                        <RouteItem item={item as number} />
                    )}
                    getItem={(date, index) => locationsOfPathIndexes[index]}
                    getItemCount={() => locationsOfPathIndexes.length}
                    keyExtractor={(item: number) => item.toString()}
                    ListFooterComponent={null}
                />
            </View>
            <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerHeaderText : stylesLandscape.containerHeaderText}>
                <Text style={styles.itemHeaderText}>
                    {originName} {t('JourneyplanScreen.DirectionTo')} {destinationName}
                </Text>
            </View>
            <FlatList
                data={compactPath}
                renderItem={({ item }) => (
                    <ListItem containerStyle={{ borderBottomWidth: 0, borderWidth: 0, padding: 0 }}>
                        <ListItem.Content>
                            <ListItem.Title><Item item={item} /></ListItem.Title>
                        </ListItem.Content>
                    </ListItem>
                )}
                keyExtractor={item => item.node.Node}
                ListFooterComponent={renderFooter}
                onEndReachedThreshold={50}
            />
        </View>
    );
}
