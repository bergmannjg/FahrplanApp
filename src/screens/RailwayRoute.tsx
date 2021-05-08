import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Linking } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ListItem } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import type { BetriebsstelleRailwayRoutePosition } from 'railwaytrip-to-railwayroute/dist/db-data';
import { findRailwayRoute, findBetriebsstellenWithRailwayRoutePositionForRailwayRouteNr } from 'railwaytrip-to-railwayroute/dist/db-data-railway-routes';
import { Location } from 'hafas-client';
import { MainStackParamList, RailwayRouteScreenParams, asLinkText } from './ScreenTypes';
import { styles } from './styles';

type Props = {
    route: RouteProp<MainStackParamList, 'RailwayRoute'>;
    navigation: StackNavigationProp<MainStackParamList, 'RailwayRoute'>;
};

export default function RailwayRouteScreen({ route, navigation }: Props): JSX.Element {
    console.log('constructor RailwayRouteScreen');

    const { t } = useTranslation();

    const { params }: { params: RailwayRouteScreenParams } = route;
    const railwayRouteNr = params.railwayRouteNr;

    const data: BetriebsstelleRailwayRoutePosition[] = findBetriebsstellenWithRailwayRoutePositionForRailwayRouteNr(railwayRouteNr).sort((a, b) => a.KM_I - b.KM_I);
    const strecke = findRailwayRoute(railwayRouteNr);
    const STRNAME = strecke?.STRNAME || '';

    const showRoute = async () => {
        if (data.length > 0) {
            const locations: Location[] = data.filter(s => s.GEOGR_LAENGE > 0 && s.GEOGR_LAENGE > 0).map(s => { return { type: 'location', longitude: s.GEOGR_LAENGE, latitude: s.GEOGR_BREITE } })
            navigation.navigate('BRouter', { isLongPress: false, locations });
        }
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

    interface ItemProps {
        item: BetriebsstelleRailwayRoutePosition
    }

    const Item = ({ item }: ItemProps) => {
        return (
            <View style={styles.subtitleViewColumn}>
                <Text>{`km: ${item.KM_L} ${item.BEZEICHNUNG}, max: ${item.maxSpeed ? item.maxSpeed + ' km' : 'unbekannt'}`}</Text>
            </View >
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
                    onPress={() => Linking.openURL('https://www.google.de/search?q=Bahnstrecke+' + railwayRouteNr)}>
                    Suche nach Bahnstrecke {railwayRouteNr} {asLinkText('')}
                </Text>
            </View>
            <FlatList
                data={data}
                renderItem={({ item }) => (
                    <ListItem containerStyle={{ borderBottomWidth: 0 }}>
                        <ListItem.Content>
                            <ListItem.Title><Item item={item} /></ListItem.Title>
                        </ListItem.Content>
                    </ListItem>
                )}
                keyExtractor={item => item.KM_L}
                ItemSeparatorComponent={renderSeparator}
                onEndReachedThreshold={50}
            />
        </View>
    );
}
