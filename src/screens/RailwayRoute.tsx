import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Linking } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ListItem } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import { Location } from 'hafas-client';
import { MainStackParamList, RailwayRouteScreenParams, asLinkText } from './ScreenTypes';
import { styles } from './styles';
import { rinfFindRailwayRoutesOfLine, rinfGetLocationsOfPath, rinfToLineNodes, rinfGetLineName } from '../lib/rinf-data-railway-routes';
import type { LineNode } from '../lib/rinf-data-railway-routes';
import type { GraphNode } from 'rinf-graph/rinfgraph.bundle';

type Props = {
    route: RouteProp<MainStackParamList, 'RailwayRoute'>;
    navigation: StackNavigationProp<MainStackParamList, 'RailwayRoute'>;
};

export default function RailwayRouteScreen({ route, navigation }: Props): JSX.Element {
    console.log('constructor RailwayRouteScreen');

    const { t } = useTranslation();

    const { params }: { params: RailwayRouteScreenParams } = route;
    const railwayRouteNr = params.railwayRouteNr;
    const imcode = params.imcode;

    const graphNodes: GraphNode[][] = rinfFindRailwayRoutesOfLine(railwayRouteNr);
    const data: LineNode[] = rinfToLineNodes(graphNodes);
    const STRNAME = rinfGetLineName(railwayRouteNr);

    const queryText = () => {
        console.log('imcode:', imcode);
        if (imcode === '0081') return 'Streckennummer ÖBB "' + (railwayRouteNr / 100).toFixed(0) + ' ' 
                + String(railwayRouteNr % 100).padStart(2, '0') + '" Wikipedia'; // öbb
        else return 'Bahnstrecke ' + railwayRouteNr + ' Wikipedia';  // db
    }
    const showRoute = async () => {
        if (data.length > 0) {
            // todo: more buttons
            const locationsOfPath = rinfGetLocationsOfPath(graphNodes.reduce((accumulator, value) => accumulator.concat(value), []));
            if (locationsOfPath.length > 0) {
                const locations: Location[] = locationsOfPath[0].map(s => { return { type: 'location', longitude: s.Longitude, latitude: s.Latitude } })
                navigation.navigate('BRouter', { isLongPress: false, locations });
            }
        }
    }

    interface ItemProps {
        item: LineNode
    }

    const Item = ({ item }: ItemProps) => {
        return (
            <View >
                <View style={styles.routeViewColumn}>
                    <Text>{`km: ${item.km} ${item.name}`}</Text>
                </View >
                {item.maxSpeed && <View style={styles.maxSpeedColumn}>
                    <Text>{`max: ${item.maxSpeed} km`}</Text>
                </View >}
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
                    {STRNAME}
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
                keyExtractor={item => item.name}
                onEndReachedThreshold={50}
            />
        </View>
    );
}
