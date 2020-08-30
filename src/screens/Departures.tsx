import React from 'react';
import {
    StyleSheet,
    Text,
    FlatList,
    ActivityIndicator,
    View
} from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { ListItem } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import { extractTimeOfDatestring } from '../lib/iso-8601-datetime-utils';
import { MainStackParamList, DepartureScreenParams } from './ScreenTypes';
import { Alternative, Line } from 'hafas-client';

type Props = {
    route: RouteProp<MainStackParamList, 'Departures'>;
    navigation: StackNavigationProp<MainStackParamList, 'Departures'>;
};

export default function DepartureScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: DepartureScreenParams } = route;

    if (__DEV__) {
        console.log('constructor DepartureScreen, params.alternatives.length: ', params.alternatives.length);
    }

    const { t } = useTranslation();

    const data = params.alternatives;
    const client = params.client;

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

    const goToTrip = (item: Alternative) => {
        console.log('Navigation router run to Trip of alternative');
        console.log('item.tripId: ', item.tripId);
        if (item.tripId) {
            client.trip(item.tripId)
                .then(trip => {
                    navigation.navigate('Trip', { trip, client })
                })
                .catch((error) => {
                    console.log('There has been a problem with your tripsOfJourney operation: ' + error.message);
                });
        }
    }

    const renderFooter = () => {
        return (
            <View
                style={{
                    paddingVertical: 20,
                    borderTopWidth: 1,
                    borderColor: "#CED0CE"
                }}
            >
                <ActivityIndicator animating size="large" />
            </View>
        );
    };

    const platform = (p?: string) => {
        if (p) {
            return ' Gl. ' + p + '';
        }
        else {
            return '';
        }
    }

    const title = (item: Alternative) => {
        return item.stop?.name + platform(item.plannedPlatform) + ' -> ' + item.direction;
    }

    const lineName = (line: Line) => {
        if (line && line.name) return line.name;
        else if (line && line.operator && line.operator.name) return line.operator.name;
        else return ''
    }
    return (
        <View style={styles.container}>

            <View style={styles.container}>
                <FlatList
                    data={data}
                    renderItem={({ item }) => (
                        <ListItem onPress={() => { goToTrip(item) }} containerStyle={{ borderBottomWidth: 0 }} >
                            <ListItem.Content>
                                <ListItem.Title>{`${title(item)}`}</ListItem.Title>
                                <ListItem.Subtitle>
                                    <View style={styles.subtitleView}>
                                        {item.line && <Text>{lineName(item.line)}</Text>}
                                        {item.plannedWhen && <Text>{`${t('DepartureScreen.When', { date: extractTimeOfDatestring(item.plannedWhen) })}`}</Text>}
                                    </View>
                                </ListItem.Subtitle>
                            </ListItem.Content>
                        </ListItem>
                    )}
                    keyExtractor={item => item.tripId + item.stop?.id}
                    ItemSeparatorComponent={renderSeparator}
                    ListFooterComponent={renderFooter}
                    onEndReachedThreshold={50}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        paddingTop: 10
    },
    containerButtons: {

    },
    container2: {
        flex: 1,
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
    footer: {
        color: Colors.dark,
        fontSize: 12,
        fontWeight: '600',
        padding: 4,
        paddingRight: 12,
        textAlign: 'right',
    },
    subtitleView: {
        flexDirection: 'column',
        paddingLeft: 10,
        paddingTop: 5
    },
    itemWarningText: {
        color: 'red',
    },
    button: {
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 10,
        margin: 2,
    },
    itemButtonText: {
        fontSize: 18,
        margin: 2,
        textAlign: 'center',
    },
    itemHeaderText: {
        fontSize: 15,
        padding: 10,
        paddingLeft: 15,
    },
});

