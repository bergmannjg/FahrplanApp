import React, { useEffect, useState } from 'react';
import { List as PaperList, Text } from 'react-native-paper';
import { View, FlatList, ListRenderItem, TouchableOpacity, Linking } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import type { RailwayLine, RailwayLineToken } from '../lib/line-numbers';
import { MainStackParamList, LineNetworkParams, asLinkText } from './ScreenTypes';
import { styles } from './styles';
import { hafas } from '../lib/hafas';
import type { Hafas } from '../lib/hafas';
import type { Trip, StopOver } from 'fs-hafas-client/hafas-client';

type Props = {
    route: RouteProp<MainStackParamList, 'LineNetwork'>;
    navigation: StackNavigationProp<MainStackParamList, 'LineNetwork'>;
};

export default function LineNetworkScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: LineNetworkParams } = route;

    if (__DEV__) {
        console.log('constructor LineNetworkScreen, params.date: ');
    }

    const profile = params.profile;
    const client: Hafas = hafas(profile);

    const [data, setData] = useState([] as RailwayLine[]);
    const [tokens, setTokens] = useState([] as RailwayLineToken[]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (loading) {
            import('../lib/line-numbers')
                .then(line => {
                    setData(line.railwayLineInfos);
                    setTokens(line.railwayLineTokens);
                    setLoading(false);
                })
                .catch(reason => { console.error(reason); setLoading(false); });
        }
    });

    const goToTrip = async (item: RailwayLine) => {
        const railwayLineToken = tokens.find(r => r.Line === item.Line);
        navigation.navigate('TripsOfLine', { lineName: item.Line.toString(), train: item.Train, refreshToken: railwayLineToken?.RefreshToken, profile })
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

    const renderItem: ListRenderItem<RailwayLine> = ({ item }) => (
        <PaperList.Item
            style={{ borderWidth: 0, paddingLeft: 10 }}
            title={
                () => <TouchableOpacity onPress={() => goToTrip(item)}>
                    <Text style={styles.summaryText}>Linie {item.Line}: {item.StartStation} {'->'} {item.EndStation}</Text>
                </TouchableOpacity>
            }
        />);

    return (
        <View style={styles.container}>
            <View style={{ paddingLeft: 10, paddingTop: 10 }}>
                <Text style={styles.infoText}
                    onPress={() => Linking.openURL('https://www.bahn.de/service/fahrplaene/streckennetz')}>
                    Streckenkarten des Fernverkehrs {asLinkText('')}
                </Text>
            </View>
            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={item => item.Line + item.StartStation + item.EndStation}
                ItemSeparatorComponent={renderSeparator}
                ListFooterComponent={renderFooter}
                onEndReachedThreshold={50}
            />
        </View>
    );
}
