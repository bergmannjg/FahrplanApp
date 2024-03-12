import React, { useState, useEffect } from 'react';
import { List as PaperList, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, FlatList, ListRenderItem, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList, MyJourneysParams } from './ScreenTypes';
import { styles } from './styles';
import { momentWithTimezone } from '../lib/iso-8601-datetime-utils';
import { useTranslation } from 'react-i18next';

type Props = {
    route: RouteProp<MainStackParamList, 'MyJourneys'>;
    navigation: StackNavigationProp<MainStackParamList, 'MyJourneys'>;
};

export type MyJourney = {
    originName: string;
    destinationName: string;
    plannedDeparture: string;
    refreshToken: string;
    profile: string;
}

export type MyJourneys = {
    myJourneys: MyJourney[];
}

const itemKey = 'itemKey';

export const saveItem = async (item: MyJourney) => {
    try {
        const valueString = await AsyncStorage.getItem(itemKey);
        const value: MyJourneys = valueString ? JSON.parse(valueString) : { myJourneys: [] };
        if (!value.myJourneys.find(j => j.refreshToken === item.refreshToken)) {
            value.myJourneys.push(item);
            console.log('saveData:', value)
            await AsyncStorage.setItem('itemKey', JSON.stringify(value));
        }
    } catch (error) {
        console.log(error);
    }
};

export default function MyJourneysScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: MyJourneysParams } = route;

    if (__DEV__) {
        console.log('constructor MyJourneysScreen');
    }

    const { t } = useTranslation();

    const [myJourneys, setMyJourneys] = useState<MyJourneys>({ myJourneys: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const retrieveData = async () => {
            try {
                const valueString = await AsyncStorage.getItem('itemKey');
                const value: MyJourneys = valueString ? JSON.parse(valueString) : { myJourneys: [] };
                console.log('loadData:', value)
                setMyJourneys(value);
            } catch (error) {
                console.log(error);
            }
        };
        if (loading) {
            console.log('loading:', loading)
            retrieveData();
            setLoading(false);
        }
    });

    const goToView = (item: MyJourney) => {
        console.log('Navigation router run to Journeyplan');
        navigation.navigate('Journeyplan', { refreshToken: item.refreshToken, profile: item.profile, tripDetails: params.tripDetails })
    };

    const removeItem = async (item: MyJourney) => {
        try {
            const valueString = await AsyncStorage.getItem('itemKey');
            const value: MyJourneys = valueString ? JSON.parse(valueString) : { myJourneys: [] };

            value.myJourneys = value.myJourneys.filter(j => j.refreshToken !== item.refreshToken);
            console.log('saveData:', value)
            await AsyncStorage.setItem('itemKey', JSON.stringify(value));
            setMyJourneys(value);
        } catch (error) {
            console.log(error);
        }
    };

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

    const departure = (item: MyJourney) => {
        return momentWithTimezone(item.plannedDeparture, undefined)
    }

    const renderItem: ListRenderItem<MyJourney> = ({ item }) => (
        <PaperList.Item
            style={{ borderWidth: 0, paddingLeft: 10 }}
            title={
                () =>
                    <View style={styles.myJourneyItem}>
                        <TouchableOpacity onPress={() => goToView(item)}>
                            <Text style={styles.summaryText}>{item.originName} {'->'} {item.destinationName}, {t('MyJourneysScreen.Departure', { date: departure(item).moment })}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeItem(item)}>
                            <Text style={styles.infoText}>Löschen</Text>
                        </TouchableOpacity>
                    </View>
            }
        />);

    return (
        <View style={styles.container}>
            <FlatList
                data={myJourneys.myJourneys}
                renderItem={renderItem}
                keyExtractor={item => item.refreshToken}
                ItemSeparatorComponent={renderSeparator}
                ListFooterComponent={renderFooter}
                onEndReachedThreshold={50}
            />
        </View>
    );
}
