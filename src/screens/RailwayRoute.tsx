import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Linking } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ListItem } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import { Location } from 'hafas-client';
import { MainStackParamList, RailwayRouteScreenParams, asLinkText } from './ScreenTypes';
import { styles } from './styles';
import type { LineNode, TunnelNode } from '../lib/rinf-data-railway-routes';
import type { GraphNode } from 'rinf-graph/rinfgraph.bundle';

type Props = {
    route: RouteProp<MainStackParamList, 'RailwayRoute'>;
    navigation: StackNavigationProp<MainStackParamList, 'RailwayRoute'>;
};

const toLocation = (item: LineNode): Location => {
    return { type: 'location', latitude: item.latitude, longitude: item.longitude };
}

const lineNodeInfo = (nodes: LineNode[]): string => {
    if (nodes.length > 1) {
        return ', ' + nodes.length.toString() + ' Elemente, km: ' + nodes[0].km + ' bis ' + nodes[nodes.length - 1].km;
    } else return '';
}

export default function RailwayRouteScreen({ route, navigation }: Props): JSX.Element {
    console.log('constructor RailwayRouteScreen');

    const { t } = useTranslation();

    const { params }: { params: RailwayRouteScreenParams } = route;
    const railwayRouteNr = params.railwayRouteNr;
    const imcode = params.imcode;

    const [data, setData] = useState([] as LineNode[]);
    const [locationsOfPath, setLocationsOfPath] = useState([] as Location[]);
    const [lineName, setLineName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (loading) {
            import('../lib/rinf-data-railway-routes')
                .then(rinf => {
                    const graphNodes: GraphNode[][] = rinf.rinfFindRailwayRoutesOfLine(railwayRouteNr);
                    console.log('RailwayRouteScreen, railwayRouteNr:', railwayRouteNr, ', GraphNodes: ', graphNodes.length);
                    const lineNodes: LineNode[] = rinf.rinfToLineNodes(graphNodes);
                    console.log('RailwayRouteScreen, railwayRouteNr:', railwayRouteNr, ', LineNodes: ', lineNodes.length);
                    setData(lineNodes);
                    setLineName(rinf.rinfGetLineName(railwayRouteNr) + lineNodeInfo(lineNodes));
                    setLocationsOfPath(lineNodes.map(toLocation));
                    setLoading(false);
                })
                .catch(reason => { console.error(reason); setLoading(false); });
        }
    });

    const queryText = () => {
        let q;
        if (imcode === '0081') {
            q = 'Streckennummer ÖBB ' + (railwayRouteNr / 100).toFixed(0) + ' ' + String(railwayRouteNr % 100).padStart(2, '0') + ' Wikipedia'; // öbb
        } else if (imcode === '0087') {
            q = 'streckennummer sncf (%22' + (railwayRouteNr / 1000).toFixed(0) + ' 000%22 OR %22' + railwayRouteNr.toFixed(0) + '%22) Wikipedia'; // sncf
        } else {
            q = 'Bahnstrecke ' + railwayRouteNr + ' Wikipedia';  // db
        }
        console.log('imcode:', imcode, ', query:', q);
        return q;
    }

    const showRoute = async () => {
        if (locationsOfPath.length > 0) {
            navigation.navigate('BRouter', { isLongPress: false, locations: locationsOfPath });
        }
    }

    const showLocation = async (item: LineNode) => {
        const locations: Location[] = [toLocation(item)]
        navigation.navigate('BRouter', { isLongPress: false, locations });
    }

    interface ItemProps {
        item: LineNode
    }

    const tunnels = (tunnelNodes: TunnelNode[]) => {
        const nodes =
            tunnelNodes.map(t => {
                const km = t.km ? 'km: ' + t.km + ' ' : ''
                return (<Text key={t.name}
                    onPress={() => Linking.openURL('https://www.google.de/search?q=+' + t.name)}
                >
                    {`${km}${t.name} (${t.length} km)`} {asLinkText('')}
                </Text>)
            })
        return (
            <View style={styles.routeTunnelColumn}>
                {nodes}
            </View>
        );
    }

    const Item = ({ item }: ItemProps) => {
        return (
            <View >
                <View style={styles.routeViewColumn}>
                    <Text onPress={() => showLocation(item)}>{`km: ${item.km} ${item.name} (${item.rinftype})`} {asLinkText('')}</Text>
                </View >
                {item.maxSpeed && <View style={styles.maxSpeedColumn}>
                    <Text>{`max: ${item.maxSpeed} km`}</Text>
                </View >}
                {item.electrified !== undefined && <View style={styles.maxSpeedColumn}>
                    <Text>{`elektrifiziert: ${item.electrified ? 'ja' : 'nein'}`}</Text>
                </View >}
                {item.tunnelNodes.length > 0 && tunnels(item.tunnelNodes)}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={{ padding: 10 }}>
                <TouchableOpacity style={styles.buttonContained} onPress={() => showRoute()}>
                    <Text style={styles.itemButtonText}>
                        {t('JourneyplanScreen.ShowRoute')}
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={{ paddingLeft: 10 }}>
                <Text style={styles.itemHeaderText}>
                    {lineName}
                </Text>
                <Text style={styles.itemHeaderText}
                    onPress={() => Linking.openURL('https://www.google.de/search?q=+' + queryText())}>
                    Suche nach Bahnstecke {railwayRouteNr} {asLinkText('')}
                </Text>
            </View>
            <FlatList
                data={data}
                renderItem={({ item }) => (
                    <ListItem containerStyle={{ borderBottomWidth: 0, padding: 0 }}>
                        <ListItem.Content>
                            <ListItem.Title><Item item={item} /></ListItem.Title>
                        </ListItem.Content>
                    </ListItem>
                )}
                keyExtractor={item => item.name + item.km}
                onEndReachedThreshold={50}
            />
        </View>
    );
}
