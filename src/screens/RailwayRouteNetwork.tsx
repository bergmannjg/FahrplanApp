import React, { useEffect, useState } from 'react';
import { List as PaperList, Text } from 'react-native-paper';
import { View, FlatList, ListRenderItem, TouchableOpacity, Linking } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import type { LineInfoExtra } from '../lib/rinf-data-railway-routes';
import { MainStackParamList, RailwayRouteNetworkParams, asLinkText } from './ScreenTypes';
import { styles } from './styles';

type Props = {
    route: RouteProp<MainStackParamList, 'RailwayRouteNetwork'>;
    navigation: StackNavigationProp<MainStackParamList, 'RailwayRouteNetwork'>;
};

export default function RailwayRouteNetworkScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: RailwayRouteNetworkParams } = route;

    if (__DEV__) {
        console.log('constructor RailwayRouteNetworkScreen, params.date: ');
    }

    const [data, setData] = useState([] as LineInfoExtra[]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (loading) {
            import('../lib/rinf-data-railway-routes')
                .then(rinf => {
                    setData(rinf.getLineInfoExtra().filter(li => params.railwaRoutesAllItems || li.lengthWithHighSpeed > 10));
                    setLoading(false);
                })
                .catch(reason => { console.error(reason); setLoading(false); });
        }
    });

    const goToRoute = async (item: LineInfoExtra) => {
        navigation.navigate('RailwayRoute', { country: item.lineInfo.Country, railwayRouteNr: item.lineInfo.Line })
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
        return null;
    };

    const renderItem: ListRenderItem<LineInfoExtra> = ({ item }) => (
        <PaperList.Item
            style={{ borderWidth: 0, paddingLeft: 10 }}
            title={
                () => <TouchableOpacity onPress={() => goToRoute(item)}>
                    <Text style={styles.summaryText}>{item.lineInfo.Country} {item.lineInfo.Line}, {item.lineInfo.Name}</Text>
                </TouchableOpacity>
            }
            description={
                () =>
                    <View style={styles.subtitleConnectionsColumn}>
                        <Text>max: {item.maxSpeed} km/h</Text>
                        <Text>Länge gesamt: {item.lineInfo.Length.toFixed(3)} km</Text>
                        <Text>Länge mit mehr als 200 km/h: {item.lengthWithHighSpeed.toFixed(3)} km</Text>
                    </View>
            }
        />);

    return (
        <View style={styles.container}>
            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={item => item.lineInfo.Line + item.lineInfo.Country}
                ItemSeparatorComponent={renderSeparator}
                ListFooterComponent={renderFooter}
                onEndReachedThreshold={50}
            />
        </View>
    );
}
