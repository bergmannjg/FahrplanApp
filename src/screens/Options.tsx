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
        // { label: 'Verbund Berlin-Brandenburg (BVG)', value: 'bvg' },
        { label: 'Luxembourg National Railway Company (CFL)', value: 'cfl' }
    ];

    const radioTripDetailsProps = [
        { label: t('OptionsScreen.allStations'), value: true },
        { label: t('OptionsScreen.onlyTransfers'), value: false },
    ];

    const radioLanguageProps = [
        { label: t('OptionsScreen.German'), value: 'de' },
        { label: t('OptionsScreen.English'), value: 'en' },
    ];

    const radioTransferTimeProps = [
        { label: '8 min.', value: 8 },
        { label: '30 min.', value: 30 },
    ];

    const { params } = route;

    const [profile, setProfile] = useState(params.navigationParams.profile);
    const [tripDetails, setTripDetails] = useState(params.navigationParams.tripDetails);
    const [transferTime, setTransferTime] = useState(params.navigationParams.transferTime);

    const initialProfile = radioProps.findIndex(p => p.value === profile);
    const initialTripDetails = radioTripDetailsProps.findIndex(p => p.value === tripDetails);
    const initialLanguage = radioLanguageProps.findIndex(p => p.value === i18n.language);
    const initialtransferTime = radioTransferTimeProps.findIndex(p => p.value === transferTime);

    const goback = () => {
        console.log('goback OptionsScreen', profile, tripDetails);
        navigation.navigate('Home', { profile, tripDetails, transferTime });
    }

    const showLicences = () => {
        navigation.navigate('ThirdPartyLicenses');
    }

    return (
        <View style={styles.container}>
            <Text style={styles.itemText1}>{t('OptionsScreen.InformationSystem')}</Text>
            <View style={styles.radio}>
                <RadioForm
                    radio_props={radioProps}
                    initial={initialProfile}
                    onPress={(value: string) => { setProfile(value) }}
                />
            </View>
            <Text style={styles.itemText1}>Tripdetails Router</Text>
            <View style={styles.radio}>
                <RadioForm
                    radio_props={radioTripDetailsProps}
                    initial={initialTripDetails}
                    onPress={(value: boolean) => { setTripDetails(value) }}
                />
            </View>
            <Text style={styles.itemText1}>{t('OptionsScreen.Language')}</Text>
            <View style={styles.radio}>
                <RadioForm
                    radio_props={radioLanguageProps}
                    initial={initialLanguage}
                    onPress={(value: string) => {
                        i18n.changeLanguage(value);
                        moment.locale(value);
                    }}
                />
            </View>
            <Text style={styles.itemText1}>{t('OptionsScreen.Search')}</Text>
            <View style={styles.radio}>
                <RadioForm
                    radio_props={radioTransferTimeProps}
                    initial={initialtransferTime}
                    onPress={(value: number) => { setTransferTime(value); }}
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
    radio: {
        fontSize: 10,
        paddingLeft: 22,
        paddingTop: 10,
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

