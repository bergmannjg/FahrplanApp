import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Linking
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

import { BetriebsstelleRailwayRoutePosition, findRailwayRoute, findBetriebsstellenMitPositionAnStreckeForRailwayRouteNr } from '../lib/db-data';
import { Location } from 'hafas-client';
import { extractTimeOfDatestring, momentWithTimezone } from '../lib/iso-8601-datetime-utils';
import { MainStackParamList, RailwayRouteScreenParams, BRouterScreenParams } from './ScreenTypes';

type Props = {
    route: RouteProp<MainStackParamList, 'RailwayRoute'>;
    navigation: StackNavigationProp<MainStackParamList, 'RailwayRoute'>;
};

export default function RailwayRouteScreen({ route, navigation }: Props) {
    console.log('constructor RailwayRouteScreen');

    const { t, i18n } = useTranslation();

    const { params }: { params: RailwayRouteScreenParams } = route;
    const railwayRouteNr = params.railwayRouteNr;

    const data: BetriebsstelleRailwayRoutePosition[] = findBetriebsstellenMitPositionAnStreckeForRailwayRouteNr(railwayRouteNr).sort((a, b) => a.KM_I - b.KM_I);
    const strecke = findRailwayRoute(railwayRouteNr);
    const STRNAME = strecke?.STRNAME || '';

    const showRoute = async (isLongPress: boolean) => {
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
            <View style={styles.subtitleView}>
                <Text style={styles.itemStationText}>{`km: ${item.KM_L} ${item.BEZEICHNUNG} ${item.STELLE_ART}`}</Text>
            </View >
        );
    }

    return (
        <View style={styles.container}>
            <View >
                <TouchableOpacity style={styles.button} onPress={() => showRoute(false)} onLongPress={() => showRoute(true)}>
                    <Text style={styles.itemButtonText}>
                        {t('JourneyplanScreen.ShowRoute')}
                    </Text>
                </TouchableOpacity>
            </View>
            <View >
                <Text style={styles.itemHeaderText}>
                    {STRNAME}
                </Text>
                <Text style={styles.itemLinkText}
                    onPress={() => Linking.openURL('https://www.google.de/search?q=Bahnstrecke+' + railwayRouteNr)}>
                    Suche nach 'Bahnstrecke {railwayRouteNr}'
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
                keyExtractor={item => item.KM_L}
                ItemSeparatorComponent={renderSeparator}
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
        margin: 0
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
        paddingLeft: 25,
        paddingBottom: 0,
        paddingTop: 10,
        backgroundColor: Colors.white
    },
    itemLinkText: {
        fontSize: 14,
        paddingLeft: 25,
        paddingBottom: 0,
        paddingTop: 10,
        backgroundColor: Colors.white,
        fontStyle: "italic"
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
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 8,
        margin: 2,
    },
    itemButtonText: {
        fontSize: 18,
        margin: 2,
        textAlign: 'center'
    },
});

