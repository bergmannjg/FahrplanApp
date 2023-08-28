import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RadioButton, Switch, Text } from 'react-native-paper';

import { RootStackParamList, MainStackParamList, rinfProfile } from './ScreenTypes';

type Props = {
    route: RouteProp<RootStackParamList, 'JourneyOptions'>;
    navigation:
    CompositeNavigationProp<
        StackNavigationProp<RootStackParamList, 'JourneyOptions'>,
        StackNavigationProp<MainStackParamList>
    >;
};

export default function JourneyOptionsScreen({ route, navigation }: Props): JSX.Element {
    console.log('constructor JourneyOptionsScreen, journeyParams: ', route.params.navigationParams.journeyParams);

    const { t } = useTranslation();

    const { params } = route;
    const isRInfProfile = params.profile === rinfProfile;

    const [bahncard, setBahncard] = useState(params.navigationParams.journeyParams.bahncardClass * 100 + params.navigationParams.journeyParams.bahncardDiscount);
    const [firstClass, setFirstClass] = useState(params.navigationParams.journeyParams.firstClass);
    const [transfers, setTransfers] = useState(params.navigationParams.journeyParams.transfers);
    const [transferTime, setTransferTime] = useState(params.navigationParams.journeyParams.transferTime);
    const [regional, setRegional] = useState(params.navigationParams.journeyParams.regional);
    const [age, setAge] = useState(params.navigationParams.journeyParams.age);
    const [textSearch, setTextSearch] = useState(params.navigationParams.rinfSearchParams?.textSearch);
    const [railwaRoutesAllItems, setRailwaRoutesAllItems] = useState(params.navigationParams.rinfSearchParams?.railwaRoutesAllItems);
    const results = params.navigationParams.journeyParams.results;

    const onToggleTransfers = () => setTransfers(transfers == 0 ? -1 : 0);
    const onToggleRegional = () => setRegional(!regional);

    const goback = () => {
        console.log('goback JourneyOptionsScreen', transferTime);
        navigation.navigate('Home', {
            journeyParams: { bahncardDiscount: bahncard % 100, bahncardClass: Math.floor(bahncard / 100), age, results, firstClass, transfers, transferTime, regional },
            rinfSearchParams: { textSearch, railwaRoutesAllItems }
        });
    }

    interface ListItem {
        label: string;
        value: string;
    }

    const radioItems = (items: ListItem[]) =>
        items.map((item: ListItem) =>
            <RadioButton.Item style={styles.radioButtonItem} key={item.label} label={item.label} value={item.value} />
        );

    const radioBahncardItems: ListItem[] = [
        { label: 'keine', value: '0' },
        { label: 'BC 25, 1. Klasse', value: '125' },
        { label: 'BC 25, 2. Klasse', value: '225' },
    ];

    const radioAgeItems: ListItem[] = [
        { label: '6-14 Jahre', value: '10' },
        { label: '15-26 Jahre', value: '20' },
        { label: '27-64 Jahre', value: '30' },
        { label: 'ab 65 Jahre', value: '65' },
    ];

    const radioClassItems: ListItem[] = [
        { label: '1. Klasse', value: 'true' },
        { label: '2. Klasse', value: 'false' },
    ];

    const radioTransferTimeItems: ListItem[] = [
        { label: '8 Min.', value: '8' },
        { label: '30 Min.', value: '30' },
    ];

    const radioTextSearchItems: ListItem[] = [
        { label: 'exact match', value: 'exact' },
        { label: 'case insensitive', value: 'caseinsensitive' },
        { label: 'regular expression', value: 'regex' },
    ];

    const radioRailwaRoutesAllItems: ListItem[] = [
        { label: 'alle', value: 'true' },
        { label: 'nur länger als 10 km', value: 'false' },
    ];

    if (isRInfProfile)
        return (
            <View style={styles.container}>
                <Text style={styles.radioButtonTitle}>Textsuche</Text>
                <RadioButton.Group onValueChange={newValue => setTextSearch(newValue as 'exact' | 'caseinsensitive' | 'regex')} value={textSearch}>
                    {radioItems(radioTextSearchItems)}
                </RadioButton.Group>

                <Text style={styles.radioButtonTitle}>Anzeige Schnellfahrstrecken</Text>
                <RadioButton.Group onValueChange={newValue => setRailwaRoutesAllItems(newValue === 'true')} value={railwaRoutesAllItems.toString()}>
                    {radioItems(radioRailwaRoutesAllItems)}
                </RadioButton.Group>

                <View style={styles.container3}>
                    <TouchableOpacity style={styles.button} onPress={() => goback()}>
                        <Text style={styles.itemText}>
                            {t('OptionsScreen.Update')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );

    return (
        <View style={styles.container}>
            <Text style={styles.radioButtonTitle}>Bahncard</Text>
            <RadioButton.Group onValueChange={newValue => setBahncard(parseInt(newValue))} value={bahncard.toString()}>
                {radioItems(radioBahncardItems)}
            </RadioButton.Group>

            <Text style={styles.radioButtonTitle}>Alter</Text>
            <RadioButton.Group onValueChange={newValue => setAge(parseInt(newValue))} value={age.toString()}>
                {radioItems(radioAgeItems)}
            </RadioButton.Group>

            <Text style={styles.radioButtonTitle}>Klasse</Text>
            <RadioButton.Group onValueChange={newValue => setFirstClass(newValue === 'true')} value={firstClass.toString()}>
                {radioItems(radioClassItems)}
            </RadioButton.Group>

            <Text style={styles.radioButtonTitle}>Vebindungen</Text>
            <View style={styles.switch}>
                <Text>nur Direktvebindungen</Text>
                <Switch value={transfers == 0} onValueChange={onToggleTransfers} />
            </View>
            <View style={styles.switch}>
                <Text>nur regional</Text>
                <Switch value={regional} onValueChange={onToggleRegional} />
            </View>

            <Text style={styles.radioButtonTitle}>Umsteigezeit</Text>
            <RadioButton.Group onValueChange={newValue => setTransferTime(parseInt(newValue))} value={transferTime.toString()}>
                {radioItems(radioTransferTimeItems)}
            </RadioButton.Group>

            <View style={styles.container3}>
                <TouchableOpacity style={styles.button} onPress={() => goback()}>
                    <Text style={styles.itemText}>
                        {t('OptionsScreen.Update')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 22,
        flexDirection: 'column',
    },
    radioView: {
        fontSize: 10,
        paddingLeft: 40,
        paddingTop: 10,
        marginRight: 5
    },
    container3: {
        backgroundColor: '#F5FCFF',
        flex: 1,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 630,
    },
    container4: {
        backgroundColor: '#F5FCFF',
        flex: 1,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 540,
    },
    itemText: {
        fontSize: 18,
        margin: 2
    },
    button: {
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 10
    },
    switch: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 40,
        paddingRight: 20
    },
    radioButtonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        margin: 2,
        paddingLeft: 22,
        paddingBottom: 2
    },
    radioButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 40,
        paddingRight: 20
    },
    radioButtonItem: {
        paddingLeft: 40,
        paddingRight: 20,
        paddingBottom: 0,
        paddingTop: 0,
    }
});

