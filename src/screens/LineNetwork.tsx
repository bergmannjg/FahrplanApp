import React from 'react';
import { List as PaperList, Text } from 'react-native-paper';
import { View, FlatList, ListRenderItem, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { railwayLines, railwayLineInfos, railwayLineTripIds, RailwayLine } from '../lib/line-numbers';
import { MainStackParamList, LineNetworkParams } from './ScreenTypes';
import { styles } from './styles';
import { hafas } from '../lib/hafas';
import { Hafas } from '../lib/hafas';
import { uicRefs } from '../lib/rinf-data-railway-routes';
import { Trip, StopOver } from 'fs-hafas-client/hafas-client';

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

    const data = railwayLineInfos;

    const tripData = (item: RailwayLine) => {
        const info = railwayLineTripIds.find(r => r.Line === item.Line)
        return info ? info.TripId : '';
    }

    const goToTrip = async (item: RailwayLine) => {
        const data = railwayLines.filter(r => r.Line ===item.Line);
        const railwayLineTripId = railwayLineTripIds.find(r => r.Line === item.Line);
        if (railwayLineTripId?.TripId) {
            client.trip(railwayLineTripId.TripId)
                .then(trip => {
                    navigation.navigate('Trip', { trip, profile })
                })
                .catch((error) => {
                    console.log('There has been a problem with your tripsOfJourney operation: ' + error);
                });
        } else if (data.length === 1) {
            const r: RailwayLine = data[0];
            const stopovers: StopOver[] = []

            const stopIds: string[] = [];

            stopIds.push(r.StartStation);
            stopIds.push(...r.ViaStations);
            stopIds.push(r.EndStation);
            const dt = new Date(Date.now());
            const stops = await client.stopsOfIds(stopIds, uicRefs);
            if (stops.length > 2) {
                stopovers.push({ stop: stops[0], plannedDeparture: dt.toISOString() });
                stopovers.push(...stops.slice(1, stops.length - 2).map(s => ({ stop: s, plannedArrival: dt.toISOString() })));
                stopovers.push({ stop: stops[stops.length - 1], plannedArrival: dt.toISOString() });
            }
            const trip: Trip = { id: '', stopovers, line: { type: 'line', name: r.Train }, plannedArrival: dt.toISOString(), plannedDeparture: dt.toISOString() }
            navigation.navigate('Trip', { trip, profile })
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

    const renderFooter = () => {
        return null;
    };

    const renderItem: ListRenderItem<RailwayLine> = ({ item }) => (
        <PaperList.Item
            style={{ borderWidth: 0, paddingLeft: 10 }}
            title={
                () => <TouchableOpacity onPress={() => goToTrip(item)}>
                    <Text style={styles.summaryText}>Linie {item.Line}: {item.StartStation} {'->'} {item.EndStation} {tripData(item)}</Text>
                </TouchableOpacity>
            }
        />);

    return (
        <View style={styles.container}>
            <View>
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={item => item.Line + item.StartStation + item.EndStation}
                    ItemSeparatorComponent={renderSeparator}
                    ListFooterComponent={renderFooter}
                    onEndReachedThreshold={50}
                />
            </View>
        </View>
    );
}
