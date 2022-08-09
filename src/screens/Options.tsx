import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import 'moment/locale/de';
import 'moment/locale/en-gb';
import { RadioButton, Text } from 'react-native-paper';

import { RootStackParamList, MainStackParamList } from './ScreenTypes';

type Props = {
    route: RouteProp<RootStackParamList, 'Options'>;
    navigation:
    CompositeNavigationProp<
        StackNavigationProp<RootStackParamList, 'Options'>,
        StackNavigationProp<MainStackParamList>
    >;
};

export default function OptionsScreen({ route, navigation }: Props): JSX.Element {
    console.log('constructor OptionsScreen, route: ', route);

    const { t, i18n } = useTranslation();

    interface ListItem {
        label: string;
        value: string;
    }

    const radioItems = (items: ListItem[]) =>
        items.map((item: ListItem) =>
            <RadioButton.Item style={styles.radioButtonItem} key={item.label} label={item.label} value={item.value} />
        );

    const radioProfileProps = [
        { label: 'Deutsche Bahn (DB)', value: 'db' },
        { label: 'Österreichische Bundesbahnen (ÖBB)', value: 'oebb' },
        { label: 'Verbund Berlin-Brandenburg (BVG)', value: 'bvg' },
    ];

    const radioClientLib = [
        { label: 'F#  ', value: 'fs-hafas-client' },
        { label: 'JS', value: 'hafas-client' }
    ];

    const radioTripDetailsProps = [
        { label: t('OptionsScreen.allTransfers') + '  ', value: 'true' },
        { label: t('OptionsScreen.onlyStops'), value: 'false' },
    ];

    const radioRouteProps = [
        { label: 'exakt' + '  ', value: 'exact' },
        { label: 'kompakt', value: 'compact' },
    ];

    const radioLanguageProps = [
        { label: t('OptionsScreen.German') + '  ', value: 'de' },
        { label: t('OptionsScreen.English'), value: 'en' },
    ];

    const { params } = route;

    const [clientLib, setClientLib] = useState(params.navigationParams.clientLib);
    const [profile, setProfile] = useState(params.navigationParams.profile);
    const [tripDetails, setTripDetails] = useState(params.navigationParams.tripDetails);
    const [compactifyPath, setCompactifyPath] = useState(params.navigationParams.compactifyPath);

    const getCompactifyPath = () => {
        return compactifyPath ? 'compact' : 'exact';
    }

    console.log('profile: ', profile, ', navigationParams: ', params.navigationParams);

    const goback = () => {
        console.log('goback OptionsScreen', profile, clientLib, tripDetails, compactifyPath);
        navigation.navigate('Home', { clientLib, profile, tripDetails, compactifyPath });
    }

    return (
        <View style={styles.container}>
            <Text style={styles.radioButtonTitle}>{t('OptionsScreen.InformationSystem')}</Text>
            <RadioButton.Group onValueChange={newValue => setProfile(newValue)} value={profile}>
                {radioItems(radioProfileProps)}
            </RadioButton.Group>

            <Text style={styles.radioButtonTitle}>Client Library</Text>
            <RadioButton.Group onValueChange={newValue => setClientLib(newValue)} value={clientLib}>
                {radioItems(radioClientLib)}
            </RadioButton.Group>

            <Text style={styles.radioButtonTitle}>Tripdetails Router</Text>
            <RadioButton.Group onValueChange={newValue => setTripDetails(newValue === 'true')} value={tripDetails.toString()}>
                {radioItems(radioTripDetailsProps)}
            </RadioButton.Group>

            <Text style={styles.radioButtonTitle}>Railway Route</Text>
            <RadioButton.Group onValueChange={newValue => setCompactifyPath(newValue === 'compact')} value={getCompactifyPath()}>
                {radioItems(radioRouteProps)}
            </RadioButton.Group>

            <Text style={styles.radioButtonTitle}>{t('OptionsScreen.Language')}</Text>
            <RadioButton.Group onValueChange={newValue => {
                i18n.changeLanguage(newValue);
                moment.locale(newValue);
            }} value={i18n.language}>
                {radioItems(radioLanguageProps)}
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
    container3: {
        backgroundColor: '#F5FCFF',
        flex: 1,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 590,
    },
    container4: {
        backgroundColor: '#F5FCFF',
        flex: 1,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 590,
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
    radioButtonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        margin: 2,
        paddingLeft: 22,
        paddingBottom: 5
    },
    radioButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 40,
        paddingRight: 20,
    },
    radioButtonItem: {
        paddingLeft: 40,
        paddingRight: 20,
        paddingBottom: 0,
        paddingTop: 0,
    }
});

