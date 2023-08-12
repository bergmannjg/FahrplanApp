import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, VirtualizedList } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ListItem } from "react-native-elements";
import { Location } from 'hafas-client';
import { useTranslation } from 'react-i18next';
import { Stop } from 'hafas-client';
import { MainStackParamList, RailwayRoutesOfTripScreenParams, asLinkText } from './ScreenTypes';
import { useOrientation } from './useOrientation';
import { stylesPortrait, stylesLandscape, styles } from './styles';
import type { GraphNode, PathElement, Location as RInfLocation } from 'rinf-graph/rinfgraph.bundle';

type Props = {
    route: RouteProp<MainStackParamList, 'RailwayRoutesOfTrip'>;
    navigation: StackNavigationProp<MainStackParamList, 'RailwayRoutesOfTrip'>;
};

export default function RailwayRoutesOfTripScreen({ route, navigation }: Props): JSX.Element {
    console.log('constructor RailwayRouteOfTrip');

    const { t } = useTranslation();

    const { params }: { params: RailwayRoutesOfTripScreenParams } = route;
    const stops = params.stops;
    const ids = params.ids;
    const useMaxSpeed = params.useMaxSpeed;
    const compactifyPath = params.compactifyPath;

    const originName = params.originName;
    const destinationName = params.destinationName;

    console.log('stops.length: ', stops?.length);
    console.log('compactifyPath: ', compactifyPath);

    interface GraphNodeEx {
        TotalStartKm: number;
        TotalEndKm: number;
        node: GraphNode;
        element: PathElement;
        isWalking: boolean;
        prevNode?: GraphNode
        nextNode?: GraphNode
    }

    const [totalKm, setTotalKm] = useState(0.0);
    const [path, setPath] = useState([] as GraphNode[]);
    const [compactPath, setCompactData] = useState([] as GraphNodeEx[]);
    const [loading, setLoading] = useState(true);
    const [locationsOfPath, setLocationsOfPath] = useState([] as RInfLocation[][]);
    const [locationsOfPathIndexes, setLocationsOfPathIndexes] = useState([] as number[]);

    const orientation = useOrientation();

    const distanceOfNode = (node: GraphNode): number => Math.abs(node.Edges[0].StartKm - node.Edges[0].EndKm)

    useEffect(() => {
        if (loading && path.length === 0) {
            if (stops || ids) {
                import('../lib/rinf-data-railway-routes')
                    .then(rinf => {
                        const findRailwayRoutes = (stopsOfRoute: Stop[]): GraphNode[] => {
                            try {
                                return rinf.rinfFindRailwayRoutesOfTripStops(stopsOfRoute, compactifyPath);
                            } catch (ex) {
                                console.error("findRailwayRoutesOfTrip", (ex as Error).message);
                                return [];
                            }
                        }

                        const result = stops ? findRailwayRoutes(stops)
                            : ids ? rinf.rinfFindRailwayRoutesOfTrip(ids, compactifyPath)
                                : [];

                        const locations = rinf.rinfGetLocationsOfPath(result);
                        console.log('locations:', locations.length);
                        const indexes = [...locations.map((_, i) => i)];
                        console.log('indexes:', indexes);

                        setPath(result);

                        const reducer = (previous: GraphNodeEx[], current: GraphNode): GraphNodeEx[] => {
                            const currTotal = previous.length > 0 ? previous[previous.length - 1].TotalEndKm : 0;
                            if (previous.length > 0) {
                                previous[previous.length - 1].nextNode = current;
                            }
                            return previous.concat([{
                                TotalStartKm: currTotal,
                                TotalEndKm: currTotal + distanceOfNode(current),
                                node: current,
                                element: rinf.rinfToPathElement(current),
                                isWalking: rinf.rinfIsWalkingPath(current),
                                prevNode: previous.length > 0 ? previous[previous.length - 1].node : undefined
                            }]);
                        }
                        const compactResult = rinf.rinfGetCompactPath(result, useMaxSpeed).reduce(reducer, [])
                        setCompactData(compactResult);
                        setLocationsOfPath(locations);
                        setLocationsOfPathIndexes(indexes);

                        if (compactResult.length > 0) {
                            setTotalKm(compactResult[compactResult.length - 1].TotalEndKm);
                        }
                        setLoading(false);
                    })
                    .catch(reason => { console.error(reason); setLoading(false); });
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

    const showRailwayRoute = async (country: string, railwayRouteNr: string) => {
        console.log('showRailwayRoute', country, railwayRouteNr);

        navigation.navigate('RailwayRoute', { railwayRouteNr, country });
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
        const element = item.element;
        const isWalking = item.isWalking;
        const maxSpeedInfo = useMaxSpeed ? element.MaxSpeed.toString() + ' km ' : ''
        const firstNodeOfLine = item.TotalStartKm === 0 || (item.prevNode ? item.prevNode.Edges[0].Line !== item.node.Edges[0].Line : true);
        const lastNodeOfLine = item.nextNode ? item.nextNode.Edges[0].Line !== item.node.Edges[0].Line : true;
        const lastNode = !item.nextNode;
        const elementLine = element.Line;
        return (
            useMaxSpeed ?
                <View style={{ flex: 1 }}>
                    {firstNodeOfLine && <View style={styles.distanceColumn}>
                        <Text style={styles.distanceText}>km: {`${item.TotalStartKm.toFixed(3)}`}</Text>
                        <TouchableOpacity onPress={() => showRailwayRoute(element.Country, elementLine)}>
                            <Text style={styles.maxSpeedLinkText}>{`${elementLine} ${asLinkText(normalizeString(element.LineText))} `}</Text>
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
                            <TouchableOpacity onPress={() => showRailwayRoute(element.Country, elementLine)}>
                                <Text style={styles.itemButtonTextRouteOfTrip}>{`${maxSpeedInfo}${elementLine} ${asLinkText(normalizeString(element.LineText))} `}</Text>
                            </TouchableOpacity>
                        }
                        <Text >{`${normalizeString(element.To)}, km: ${element.EndKm}`}</Text>
                    </View >
                    <View style={styles.distanceColumn}>
                        <Text style={styles.distanceText}>km: {`${item.TotalEndKm.toFixed(3)}`} ({(item.TotalEndKm * 100 / totalKm).toFixed(1)} %)</Text>
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

    if(loading){
        return(
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large"/>
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
                    {originName} {t('JourneyplanScreen.DirectionTo')} {destinationName}, {totalKm.toFixed(3)} km
                </Text>
            </View>
            <FlatList
                data={compactPath}
                renderItem={({ item }) => (
                    <ListItem containerStyle={{ borderBottomWidth: 0, borderWidth: 0, padding: 0 }}>
                        <ListItem.Content>
                            <ListItem.Title style={{ width: "100%" }}><Item item={item} /></ListItem.Title>
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
