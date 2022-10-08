import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import 'moment/locale/de';
import 'moment/locale/en-gb';
import { RadioButton, Text } from 'react-native-paper';
import DropDown from "react-native-paper-dropdown";

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

    const fs_hafas_client = 'fs-hafas-client';
    const hafas_client = 'hafas-client';

    const radioItems = (items: ListItem[]) =>
        items.map((item: ListItem) =>
            <RadioButton.Item style={styles.radioButtonItem} key={item.label} label={item.label} value={item.value} />
        );

    const radioProfileProps = [
        { label: 'Deutsche Bahn', value: 'db', fsEnabled: true },
        { label: 'Österreichische Bundesbahnen', value: 'oebb', fsEnabled: false },
        { label: 'Schweizerische Bundesbahnen', value: 'sbb', fsEnabled: false },
        { label: 'Rejseplanen in Denmark', value: 'rejseplanen', fsEnabled: false },
        { label: 'Berliner Verkehrsbetriebe', value: 'bvg', fsEnabled: true },
        { label: 'Verkehrsverbund Berlin-Brandenburg', value: 'vbb', fsEnabled: false },
    ];

    const radioProfilePropsChecked = (clientLib: string) => {
        return radioProfileProps.filter(p => clientLib === hafas_client || (clientLib == fs_hafas_client && p.fsEnabled));
    }

    const radioClientLib = [
        { label: 'F#  ', value: fs_hafas_client },
        { label: 'JS', value: hafas_client }
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
    const [showDropDown, setShowDropDown] = useState(false);

    const getCompactifyPath = () => {
        return compactifyPath ? 'compact' : 'exact';
    }

    console.log('profile: ', profile, ', navigationParams: ', params.navigationParams);

    const setCheckedClientLib = (newValue: string) => {
        setClientLib(newValue);

        if (newValue === fs_hafas_client && profile !== 'db' && profile !== 'bvg') {
            console.log('change profile')
            setProfile('db');
        }
    }

    const goback = () => {
        let realClientLib = clientLib;
        if (clientLib === fs_hafas_client && radioProfileProps.find(p => p.value === profile && !p.fsEnabled)) {
            console.log('change clientLib to ', hafas_client)
            realClientLib = hafas_client;
        }
        console.log('goback OptionsScreen', profile, realClientLib, tripDetails, compactifyPath);
        navigation.navigate('Home', { clientLib: realClientLib, profile, tripDetails, compactifyPath });
    }

    return (
        <View style={styles.container}>

            <View style={styles.safeContainerStyle}>
                <DropDown
                    label={t('OptionsScreen.InformationSystem')}
                    mode={'outlined'}
                    visible={showDropDown}
                    showDropDown={() => setShowDropDown(true)}
                    onDismiss={() => setShowDropDown(false)}
                    value={profile}
                    setValue={setProfile}
                    list={radioProfilePropsChecked(clientLib)}
                    dropDownContainerMaxHeight={300}
                />
            </View>

            <Text style={styles.radioButtonTitle}>Client Library</Text>
            <RadioButton.Group onValueChange={newValue => setCheckedClientLib(newValue)} value={clientLib}>
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
    safeContainerStyle: {
        marginLeft: 20,
        marginRight: 20,
        marginBottom: 10,
        justifyContent: "center",
        borderWidth: 0,
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

