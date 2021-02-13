import React, { useState } from 'react'
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker'
import { useTranslation } from 'react-i18next';
import { RootStackParamList, MainStackParamList } from './ScreenTypes';

type Props = {
    route: RouteProp<RootStackParamList, 'DateTime'>;
    navigation:
    CompositeNavigationProp<
        StackNavigationProp<RootStackParamList, 'DateTime'>,
        StackNavigationProp<MainStackParamList>
    >;
};

export default function DateTimeScreen({ route, navigation }: Props): JSX.Element {
    console.log('constructor DateTimeScreen, route: ', route);

    const { t, i18n } = useTranslation();

    const { params } = route;
    const [date, setDate] = useState(params.navigationParams.date);
    const mode = params.navigationParams.mode;
    const today = new Date();

    console.log('date: ', date);
    console.log('mode: ', mode);

    const goback = () => {
        console.log('goback DateTimeScreen', date);
        navigation.navigate('Home', { date : date.valueOf()});
    }

    const d = new Date();
    const timezoneOffset = d.getTimezoneOffset() * (-1);
    console.log('TimezoneOffset:', timezoneOffset);

    return (
        <View style={styles.container}>
            <View style={styles.container2}>
                <DatePicker
                    minimumDate={new Date(today.getFullYear(), 0)}
                    maximumDate={new Date(today.getFullYear(), 11)}
                    minuteInterval={5}
                    date={new Date(date)}
                    locale={i18n.language}
                    mode={mode}
                    onDateChange={dateParam => setDate(dateParam.valueOf())}
                    timeZoneOffsetInMinutes={timezoneOffset}
                />
            </View>
            <View style={styles.container3}>
                <TouchableOpacity style={styles.button} onPress={() => goback()}>
                    <Text style={styles.itemText}>
                        {t('DateTimeScreen.Update')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
    },
    container2: {
        backgroundColor: '#F5FCFF',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    container3: {
        backgroundColor: '#F5FCFF',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemText: {
        fontSize: 18,
        margin: 2
    },
    button: {
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 10,
        margin: 2,
    },
})