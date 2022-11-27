import React from 'react';
import { List as PaperList, Text } from 'react-native-paper';
import { View, FlatList, ListRenderItem, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { railwayLines, railwayLineInfos, RailwayLine } from '../lib/line-numbers';
import { MainStackParamList, LineNetworkParams } from './ScreenTypes';
import { stylesPortrait, stylesLandscape, styles } from './styles';
import { useTranslation } from 'react-i18next';
import { hafas } from '../lib/hafas';
import { Hafas } from '../lib/hafas';
import { dbUicRefs } from '../lib/rinf-data-railway-routes';
import { Location } from 'fs-hafas-client/hafas-client';
import { useOrientation } from './useOrientation';

type Props = {
    route: RouteProp<MainStackParamList, 'LineNetwork'>;
    navigation: StackNavigationProp<MainStackParamList, 'LineNetwork'>;
};

export default function LineNetworkScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: LineNetworkParams } = route;

    if (__DEV__) {
        console.log('constructor LineNetworkScreen, params.date: ');
    }

    const orientation = useOrientation();
    const { t } = useTranslation();

    const profile = params.profile;
    const client: Hafas = hafas(profile);

    const data = params.line ? railwayLines.filter(r => r.Line === params.line) : railwayLineInfos;

    const showRoute = async (item: RailwayLine) => {
        const stops: string[] = [];

        stops.push(item.StartStation);
        stops.push(...item.ViaStations);
        stops.push(item.EndStation);

        const locations = (await client.stopsOfIds(stops, dbUicRefs)).map(s => s.location).filter(l => !!l) as Location[];
        console.log('locations: ', locations.length);
        if (locations && locations.length > 0) {
            navigation.navigate('BRouter', { locations, isLongPress: false });
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

    const goToView = (item: RailwayLine) => {
        if (!params.line) {
            console.log('LineNetwork');
            navigation.navigate('LineNetwork', { line: item.Line, profile });
        } else {
            console.log('Navigation router run to Home');
            navigation.navigate('Home', { station: item.StartStation, station2: item.EndStation, stationVia: item.ViaStations[item.ViaStations.length / 2] })
        }
    };

    const renderFooter = () => {
        return null;
    };

    const renderItem: ListRenderItem<RailwayLine> = ({ item }) => (
        <PaperList.Item
            style={{ borderWidth: 0, paddingLeft: 10 }}
            title={
                () => <TouchableOpacity onPress={() => goToView(item)}>
                    <Text style={styles.summaryText}>Linie {item.Line}: {item.StartStation} {'->'} {item.EndStation}</Text>
                </TouchableOpacity>
            }
            description={
                () =>
                    <View style={{ padding: params.line ? 20 : 0 }}>
                        {params.line &&
                            <Text style={styles.contentText}>Zug {item.Trains[0]}</Text>
                        }
                        {params.line &&
                            <Text style={styles.contentText}></Text>
                        }
                        {params.line && item.ViaStations[0] &&
                            <Text style={styles.contentText}>Via {item.ViaStations[0]}</Text>
                        }
                        {params.line && item.ViaStations[1] &&
                            <Text style={styles.contentText}>Via {item.ViaStations[1]}</Text>
                        }
                        {params.line && item.ViaStations[2] &&
                            <Text style={styles.contentText}>Via {item.ViaStations[2]}</Text>
                        }
                        {params.line && item.ViaStations[3] &&
                            <Text style={styles.contentText}>Via {item.ViaStations[3]}</Text>
                        }
                        {params.line && item.ViaStations[4] &&
                            <Text style={styles.contentText}>Via {item.ViaStations[4]}</Text>
                        }
                        {params.line && item.ViaStations[5] &&
                            <Text style={styles.contentText}>Via {item.ViaStations[5]}</Text>
                        }
                        {params.line && item.ViaStations[6] &&
                            <Text style={styles.contentText}>Via {item.ViaStations[6]}</Text>
                        }
                    </View>
            }
        />);

    return (
        <View style={styles.container}>
            {params.line && <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerButtons : stylesLandscape.containerButtons}>
                <TouchableOpacity style={styles.buttonJourneyPlan} onPress={() => showRoute(data[0])} >
                    <Text style={styles.itemButtonText}>
                        {t('JourneyplanScreen.ShowRoute')}
                    </Text>
                </TouchableOpacity>
            </View>}
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
