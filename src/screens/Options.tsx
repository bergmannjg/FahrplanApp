import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import 'moment/locale/de';
import 'moment/locale/en-gb';
import RadioForm from 'react-native-simple-radio-button';

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

    const radioProps = [
        { label: 'Deutsche Bahn (DB)', value: 'db' },
        { label: 'Österreichische Bundesbahnen (ÖBB)', value: 'oebb' },
        { label: 'Verbund Berlin-Brandenburg (BVG)', value: 'bvg' },
        { label: 'Luxembourg National Railway Company (CFL)', value: 'cfl' }
    ];

    const radioClientLib = [
        { label: 'F#  ', value: 'fs-hafas-client' },
        { label: 'JS', value: 'hafas-client' }
    ];

    const radioTripDetailsProps = [
        { label: t('OptionsScreen.allTransfers') + '  ', value: true },
        { label: t('OptionsScreen.onlyStops'), value: false },
    ];

    const radioLanguageProps = [
        { label: t('OptionsScreen.German') + '  ', value: 'de' },
        { label: t('OptionsScreen.English'), value: 'en' },
    ];

    const { params } = route;

    const [clientLib, setClientLib] = useState(params.navigationParams.clientLib);
    const [profile, setProfile] = useState(params.navigationParams.profile);
    const [tripDetails, setTripDetails] = useState(params.navigationParams.tripDetails);

    const initialClientLib = radioClientLib.findIndex(p => p.value === clientLib);
    const initialProfile = radioProps.findIndex(p => p.value === profile);
    const initialTripDetails = radioTripDetailsProps.findIndex(p => p.value === tripDetails);
    const initialLanguage = radioLanguageProps.findIndex(p => p.value === i18n.language);

    console.log('initialProfile: ', initialProfile, ', navigationParams: ', params.navigationParams);

    const goback = () => {
        console.log('goback OptionsScreen', profile, tripDetails);
        navigation.navigate('Home', { clientLib, profile, tripDetails });
    }

    const showLicences = () => {
        navigation.navigate('ThirdPartyLicenses');
    }

    return (
        <View style={styles.container}>
            <Text style={styles.itemText1}>{t('OptionsScreen.InformationSystem')}</Text>
            <View style={styles.radioView}>
                <RadioForm
                    radio_props={radioProps}
                    initial={initialProfile}
                    onPress={(value: string) => { setProfile(value) }}
                />
            </View>
            <Text style={styles.itemText1}>Client Library</Text>
            <View style={styles.radioView}>
                <RadioForm
                    formHorizontal={true}
                    radio_props={radioClientLib}
                    initial={initialClientLib}
                    onPress={(value: string) => { setClientLib(value) }}
                />
            </View>
            <Text style={styles.itemText1}>Tripdetails Router</Text>
            <View style={styles.radioView}>
                <RadioForm
                    formHorizontal={true}
                    radio_props={radioTripDetailsProps}
                    initial={initialTripDetails}
                    onPress={(value: boolean) => { setTripDetails(value) }}
                />
            </View>
            <Text style={styles.itemText1}>{t('OptionsScreen.Language')}</Text>
            <View style={styles.radioView}>
                <RadioForm
                    formHorizontal={true}
                    radio_props={radioLanguageProps}
                    initial={initialLanguage}
                    onPress={(value: string) => {
                        i18n.changeLanguage(value);
                        moment.locale(value);
                    }}
                />
            </View>
            <View style={styles.container3}>
                <TouchableOpacity style={styles.button} onPress={() => goback()}>
                    <Text style={styles.itemText}>
                        {t('OptionsScreen.Update')}
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.container4}>
                <TouchableOpacity style={styles.button} onPress={() => showLicences()}>
                    <Text style={styles.itemText}>
                        Third-party licenses
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
        top: 485,
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
    itemText1: {
        fontSize: 16,
        margin: 2,
        paddingLeft: 22
    },
    button: {
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 10
    },
});

