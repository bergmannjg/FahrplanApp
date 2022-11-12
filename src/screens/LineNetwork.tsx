import React from 'react';
import { List as PaperList, Text } from 'react-native-paper';
import { View, FlatList, ListRenderItem } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { railwayLines, railwayLineInfos, RailwayLine } from '../lib/line-numbers';
import { MainStackParamList, LineNetworkParams } from './ScreenTypes';
import { styles } from './styles';

type Props = {
    route: RouteProp<MainStackParamList, 'LineNetwork'>;
    navigation: StackNavigationProp<MainStackParamList, 'LineNetwork'>;
};

export default function LineNetworkScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: LineNetworkParams } = route;

    if (__DEV__) {
        console.log('constructor LineNetworkScreen, params.date: ');
    }

    const data = params.line ? railwayLines.filter(r => r.Line === params.line) : railwayLineInfos;

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
            navigation.navigate('LineNetwork', { line: item.Line });
        } else {
            console.log('Navigation router run to Journeyplan');
            navigation.navigate('Home', { station: item.StartStation, station2: item.EndStation })
        }
    };

    const renderFooter = () => {
        return null;
    };

    const renderItem: ListRenderItem<RailwayLine> = ({ item }) => (
        <PaperList.Item
            style={{ borderWidth: 0, paddingLeft: 10 }}
            title={
                () => <Text style={styles.summaryText}>Linie {item.Line} {params.line ? ', ' + item.StartStation + ' - ' + item.EndStation : ''}</Text>
            }
            description={
                () =>
                    <View>
                    </View>
            }
            onPress={() => { goToView(item) }}
        />);

    return (
        <View style={styles.container}>
            <View style={styles.container}>
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
