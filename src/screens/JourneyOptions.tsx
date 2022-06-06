import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RadioButton, Switch, Text } from 'react-native-paper';

import { RootStackParamList, MainStackParamList } from './ScreenTypes';

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

    const [bahncard, setBahncard] = useState(params.navigationParams.journeyParams.bahncardClass * 100 + params.navigationParams.journeyParams.bahncardDiscount);
    const [firstClass, setFirstClass] = useState(params.navigationParams.journeyParams.firstClass);
    const [transfers, setTransfers] = useState(params.navigationParams.journeyParams.transfers);
    const [transferTime, setTransferTime] = useState(params.navigationParams.journeyParams.transferTime);
    const [regional, setRegional] = useState(params.navigationParams.journeyParams.regional);
    const age = params.navigationParams.journeyParams.age;
    const results = params.navigationParams.journeyParams.results;
    
    const onToggleTransfers = () => setTransfers(transfers == 0 ? -1 : 0);
    const onToggleRegional = () => setRegional(!regional);

    const goback = () => {
        console.log('goback JourneyOptionsScreen', transferTime);
        navigation.navigate('Home', { journeyParams: { bahncardDiscount: bahncard % 100, bahncardClass: Math.floor(bahncard / 100), age, results, firstClass, transfers, transferTime, regional } });
    }

    return (
        <View style={styles.container}>
            <Text style={styles.radioButtonTitle}>{'Bahncard'}</Text>
            <RadioButton.Group onValueChange={newValue => setBahncard(parseInt(newValue))} value={bahncard.toString()}>
                <View style={styles.radioButton}>
                    <Text>keine</Text>
                    <RadioButton value="0" />
                </View>
                <View style={styles.radioButton}>
                    <Text>BC 25, 1. Klasse</Text>
                    <RadioButton value="125" />
                </View>
                <View style={styles.radioButton}>
                    <Text>BC 25, 2. Klasse</Text>
                    <RadioButton value="225" />
                </View>
            </RadioButton.Group>

            <Text style={styles.radioButtonTitle}>{'Klasse'}</Text>
            <RadioButton.Group onValueChange={newValue => setFirstClass(newValue === 'true')} value={firstClass.toString()}>
                <View style={styles.radioButton}>
                    <Text>1. Klasse</Text>
                    <RadioButton value="true" />
                </View>
                <View style={styles.radioButton}>
                    <Text>2. Klasse</Text>
                    <RadioButton value="false" />
                </View>
            </RadioButton.Group>

            <Text style={styles.radioButtonTitle}>{'Vebindungen'}</Text>
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
                <View style={styles.radioButton}>
                    <Text>8 Min.</Text>
                    <RadioButton value="8" />
                </View>
                <View style={styles.radioButton}>
                    <Text>30 Min.</Text>
                    <RadioButton value="30" />
                </View>
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
        paddingBottom: 5
    },
    radioButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 40,
        paddingRight: 20
    }
});

