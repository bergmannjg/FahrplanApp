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

export default function OptionsScreen({ route, navigation }: Props) {
    console.log('constructor OptionsScreen, route: ', route);

    const { t, i18n } = useTranslation();

    const radioProps = [
        { label: 'Deutsche Bahn (DB)', value: 'db' },
        { label: 'Österreichische Bundesbahnen (ÖBB)', value: 'oebb' },
        { label: 'Verbund Berlin-Brandenburg (BVG)', value: 'bvg' },
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

    const { params } = route;

    const [profile, setProfile] = useState(params.navigationParams.profile);
    const [tripDetails, setTripDetails] = useState(params.navigationParams.tripDetails);

    const initialProfile = radioProps.findIndex(p => p.value === profile);
    const initialTripDetails = radioTripDetailsProps.findIndex(p => p.value === tripDetails);

    const initialLanguage = radioLanguageProps.findIndex(p => p.value === i18n.language);

    const goback = () => {
        console.log('goback OptionsScreen', profile, tripDetails);
        navigation.navigate('Home', { profile, tripDetails });
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
                    onPress={(value: any) => { setProfile(value) }}
                />
            </View>
            <Text style={styles.itemText1}>Tripdetails Router</Text>
            <View style={styles.radio}>
                <RadioForm
                    radio_props={radioTripDetailsProps}
                    initial={initialTripDetails}
                    onPress={(value: any) => { setTripDetails(value) }}
                />
            </View>
            <Text style={styles.itemText1}>{t('OptionsScreen.Language')}</Text>
            <View style={styles.radio}>
                <RadioForm
                    radio_props={radioLanguageProps}
                    initial={initialLanguage}
                    onPress={(value: any) => {
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
    radio: {
        paddingLeft: 22,
        paddingTop: 10,
    },
    container3: {
        backgroundColor: '#F5FCFF',
        flex: 1,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 450,
    },
    container4: {
        backgroundColor: '#F5FCFF',
        flex: 1,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 530,
    },
    itemText: {
        fontSize: 18,
        margin: 2
    },
    itemText1: {
        fontSize: 18,
        margin: 2,
        paddingLeft: 22
    },
    button: {
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 10
    },
});

