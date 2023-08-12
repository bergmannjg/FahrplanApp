import React, { useState, useEffect, useMemo } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, TouchableOpacity, Text, Button, Platform, PlatformAndroidStatic, Pressable } from "react-native";
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import CustomAutocomplete from './components/CustomAutocomplete';
import { useTranslation } from 'react-i18next';
import { JourneyParams, isLocation } from '../lib/hafas';
import type { Location } from 'hafas-client';
import type { MainStackParamList, RootStackParamList, RInfSearchParams } from './ScreenTypes';
import { rinfProfile } from './ScreenTypes';
import { useOrientation } from './useOrientation';
import RadioGroup, { RadioButtonProps } from 'react-native-radio-buttons-group';
import { stylesPortrait, stylesLandscape, styles } from './styles';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(["The provided value 'ms-stream' is not a valid 'responseType'."])
LogBox.ignoreLogs(["The provided value 'moz-chunked-arraybuffer' is not a valid 'responseType'."])

type Props = {
    route: RouteProp<MainStackParamList, 'Home'>;
    navigation: CompositeNavigationProp<
        StackNavigationProp<MainStackParamList, 'Home'>,
        StackNavigationProp<RootStackParamList>
    >;
};

type LocalData = {
    station1: string;
    station2: string;
}

export default function HomeScreen({ route, navigation }: Props): JSX.Element {
    console.log('home constructor, route: ', route);

    const { t, i18n } = useTranslation();

    const defaultJourneyParams: JourneyParams = {
        bahncardDiscount: 25, bahncardClass: 1, age: 65, results: 5, firstClass: false, transfers: -1, transferTime: 8, regional: false
    }

    const defaultRInfSearchParams: RInfSearchParams = {
        textSearch: 'caseinsensitive'
    }

    const [nearbyStation, setNearbyStation] = useState<string | Location>('');
    const [station1, setStation1] = useState<string | Location>('');
    const [station2, setStation2] = useState<string | Location>('');
    const [stationVia, setStationVia] = useState('');
    const [loading, setLoading] = useState(true);
    const [clientLib, setClientLib] = useState('fs-hafas-client');
    const [profile, setProfile] = useState('db');
    const [tripDetails, setTripDetails] = useState(true);
    const [compactifyPath, setCompactifyPath] = useState(true);
    const [date, setDate] = useState(new Date(Date.now()));
    const [showDate, setShowDate] = useState(false);
    const [journeyParams, setJourneyParams] = useState(defaultJourneyParams);
    const [rinfSearchParams, setRInfSearchParams] = useState(defaultRInfSearchParams);
    const [searchType, setSearchType] = useState('1');
    const [mode, setMode] = useState<'date' | 'time'>('date');

    const headerRight = () => (
        <View style={{ backgroundColor: '#F5FCFF' }}>
            <TouchableOpacity onPress={() => { navigateToOptionsScreen(); }}>
                <Text style={{ fontSize: 18, marginRight: 10 }} >
                    {t('HomeScreen.Options')}
                </Text>
            </TouchableOpacity>
        </View>
    )

    console.log('Platform.OS:', Platform.OS);
    console.log('Platform.Model:', (Platform as PlatformAndroidStatic).constants.Model);
    console.log('Platform.Release:', (Platform as PlatformAndroidStatic).constants.Release);

    React.useEffect(() => {
        console.log('navigation.setOptions')
        const title = t('HomeScreen.Header');
        navigation.setOptions({
            headerTitle: title,
            headerRight: headerRight
        });
    }, [navigation, clientLib, profile, tripDetails, i18n.language]);

    const orientation = useOrientation();

    useEffect(() => {
        const retrieveData = async () => {
            try {
                const valueString = await AsyncStorage.getItem('user');
                const value: LocalData = valueString ? JSON.parse(valueString) : { station1: '', station2: '' };
                console.log('loadData:', value)
                setStation1(value.station1);
                setStation2(value.station2)
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

    const saveData = async (localData: LocalData) => {
        console.log('saveData:', localData)
        await AsyncStorage.setItem('user', JSON.stringify(localData));
    };

    const clientProfile = () => {
        return profile !== rinfProfile ? profile + (clientLib === 'fs-hafas-client' ? '-fsharp' : '') : profile;
    }

    // route.params from OptionsScreen
    if (route.params?.clientLib !== undefined && route.params?.clientLib !== clientLib) {
        setClientLib(route.params.clientLib);
    }

    // route.params from OptionsScreen
    if (route.params?.profile !== undefined && route.params?.profile !== profile) {
        setProfile(route.params.profile);
        if (route.params.profile === rinfProfile || profile === rinfProfile) {
            setStation1('');
            setStationVia('');
            setStation2('');
        }
    }

    // route.params from OptionsScreen
    if (route.params?.tripDetails !== undefined && route.params?.tripDetails !== tripDetails) {
        setTripDetails(route.params.tripDetails);
    }

    // route.params from OptionsScreen
    if (route.params?.compactifyPath !== undefined && route.params?.compactifyPath !== compactifyPath) {
        setCompactifyPath(route.params.compactifyPath);
    }

    // route.params from JourneyOptionsScreen
    if (route.params?.journeyParams !== undefined && route.params?.journeyParams !== journeyParams) {
        setJourneyParams(route.params.journeyParams);
    }

    // route.params from JourneyOptionsScreen
    if (route.params?.rinfSearchParams !== undefined && route.params?.rinfSearchParams !== rinfSearchParams) {
        setRInfSearchParams(route.params.rinfSearchParams);
    }

    // route.params from NearbyScreen or LineNetworkScreen
    if (route.params?.station !== undefined && route.params?.station !== nearbyStation) {
        setNearbyStation(route.params.station);
        setStation1(route.params.station);
    }

    // route.params from LineNetworkScreen
    if (route.params?.station2 !== undefined && route.params?.station2 !== station2) {
        setStation2(route.params.station2);
    }

    // route.params from LineNetworkScreen
    if (route.params?.stationVia !== undefined && route.params?.stationVia !== stationVia) {
        setStationVia(route.params.stationVia);
    }

    console.log('clientLib: ', clientLib);
    console.log('profile: ', profile);
    console.log('tripDetails: ', tripDetails);
    console.log('compactifyfRoute: ', compactifyPath);
    console.log('date: ', date);

    const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDate(false);
        if (selectedDate) setDate(selectedDate);
    }

    const setDateNow = () => {
        setDate(new Date());
    }

    const setAndSaveStation1 = (s: string) => {
        setStation1(s);
        const s2 = 'string' === typeof station2 ? station2 : '';
        saveData({ station1: s, station2: s2 });
    }

    const setAndSaveStation2 = (s: string) => {
        setStation2(s)
        const s1 = 'string' === typeof station1 ? station1 : '';
        saveData({ station1: s1, station2: s });
    }

    const searchConnections = () => {
        if (station1 !== '' && station2 !== '') {
            console.log('searchConnections. profile:', clientProfile());
            if (profile === rinfProfile) {
                import('../lib/rinf-data-railway-routes')
                    .then(rinf => {
                        console.log('searchConnections', station1, station2);
                        const _station1 = isLocation(station1) ? station1.name : station1;
                        const _station2 = isLocation(station2) ? station2.name : station2;
                        if (typeof _station1 === 'string' && typeof _station2 === 'string') {
                            const opInfos1 = rinf.rinfOpInfos(_station1, 'first exact match');
                            const opInfos2 = rinf.rinfOpInfos(_station2, 'first exact match');
                            const opInfosVia = stationVia.length > 3 ? rinf.rinfOpInfos(stationVia, 'first exact match') : undefined;
                            if (opInfos1.length > 0 && opInfos2.length > 0) {
                                const ids: string[] = opInfosVia && opInfosVia.length > 0
                                    ? [opInfos1[0].UOPID, opInfosVia[0].UOPID, opInfos2[0].UOPID]
                                    : [opInfos1[0].UOPID, opInfos2[0].UOPID];
                                navigation.navigate('RailwayRoutesOfTrip', { profile, tripDetails: false, compactifyPath, useMaxSpeed: false, originName: _station1, destinationName: _station2, ids });
                            }
                        }
                    })
            } else {
                navigation.navigate('Connections', { profile: clientProfile(), station1: station1, station2: station2, via: stationVia, date: date.valueOf(), tripDetails, compactifyPath: compactifyPath, journeyParams });
            }
        }
    }

    const searchNearby = () => {
        console.log('searchNearby, profile:', clientProfile());
        navigation.navigate('Nearby', { profile: clientProfile(), distance: 1000, searchBusStops: false });
    }

    const searchRadar = () => {
        console.log('searchRadar, profile:', clientProfile());
        navigation.navigate('Radar', { profile: clientProfile(), duration: 10 });
    }

    const searchLineNetwork = () => {
        console.log('LineNetwork');
        navigation.navigate('LineNetwork', { profile: clientProfile() });
    }

    const searchMyJourneys = () => {
        console.log('MyJourneys');
        navigation.navigate('MyJourneys', { tripDetails, compactifyPath });
    }

    const showDeparturesQuery = (query: string) => {
        navigation.navigate('Departures', { station: query, date: date.valueOf(), profile: clientProfile() })
    }

    const navigateToOptionsScreen = () => {
        console.log('navigateToOptionsScreen. profile:', profile, compactifyPath);
        navigation.navigate('Options', { navigationParams: { clientLib: clientLib, profile: profile, tripDetails, compactifyPath } });
    }

    const navigateToJourneyOptionsScreen = () => {
        console.log('navigateToJourneyOptionsScreen. journeyParams:', journeyParams);
        navigation.navigate('JourneyOptions', {
            profile: clientProfile(),
            navigationParams: { journeyParams, rinfSearchParams }
        });
    }

    const navigateToDateTimeScreen = (mode: 'date' | 'time') => {
        setMode(mode);
        setShowDate(true);
    }

    const switchStations = () => {
        const s1 = station1;
        const s2 = station2;
        setStation1(s2);
        setStation2(s1);
        if ('string' === typeof s1 && 'string' === typeof s2) {
            saveData({ station1: s2, station2: s1 });
        }
    }

    const radioButtons: RadioButtonProps[] = useMemo(() => ([
        {
            id: '1',
            label: 'Verbindungen',
            value: 'Verbindungen'
        },
        {
            id: '2',
            label: 'Haltestellen in der Nähe',
            value: 'Haltestellen'
        },
        {
            id: '3',
            label: 'Busse und Bahnen in der Nähe',
            value: 'BusseBahnen'
        }
    ]), []);

    const search = () => {
        if (searchType === 'Verbindungen' || searchType === '1') searchConnections();
        else if (searchType === 'Haltestellen' || searchType === '2') searchNearby();
        else if (searchType === 'BusseBahnen' || searchType === '3') searchRadar();
    }

    const searchEnabled = (isLocation(station1) || station1.length > 0) && (isLocation(station2) || station2.length > 0);

    const A1 = ({ s }: { s: string }) => {
        return (
            !loading ?
                <CustomAutocomplete profile={clientProfile()} rinfSearchParams={rinfSearchParams} placeholder={t('HomeScreen.From')} query={s} onPress={(name) => { setAndSaveStation1(name); }} />
                : <View />
        );
    }

    const AVia = ({ s }: { s: string }) => {
        return (
            !loading ?
                <CustomAutocomplete profile={clientProfile()} rinfSearchParams={rinfSearchParams} placeholder="via" query={s} onPress={(name) => { setStationVia(name); }} />
                : <View />
        );
    }

    const A2 = ({ s }: { s: string }) => {
        return (
            !loading ?
                <CustomAutocomplete profile={clientProfile()} rinfSearchParams={rinfSearchParams} placeholder={t('HomeScreen.To')} query={s} onPress={(name) => { setAndSaveStation2(name); }} />
                : <View />
        );
    }

    return (
        <View style={styles.container}>

            {showDate &&
                <DateTimePicker
                    minimumDate={new Date(new Date().getFullYear() - 1, 0, 1)}
                    maximumDate={new Date(new Date().getFullYear() + 1, 11, 31)}
                    value={new Date(date)}
                    mode={mode}
                    is24Hour={true}
                    display="default"
                    onChange={onChangeDate}
                />
            }

            {
                orientation === 'PORTRAIT' &&
                <View style={stylesPortrait.containerButtons} >
                    <View style={styles.autocompleteContainerFrom}>
                        <A1 s={isLocation(station1) ? (station1.name ? station1.name : '') : station1} />
                        <View style={styles.switchbutton}>
                            <TouchableOpacity onPress={() => showDeparturesQuery('string' === typeof station1 ? station1 : '')} disabled={!('string' === typeof station1 && station1.length > 0)} >
                                <Text style={styles.switchText}>
                                    &#8614;
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.autocompleteContainerVia}>
                        <AVia s={stationVia} />
                        <View style={styles.switchbutton}>
                            <TouchableOpacity onPress={() => switchStations()} >
                                <Text style={styles.switchText}>
                                    &#8645;
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.autocompleteContainerTo}>
                        <A2 s={isLocation(station2) ? (station2.name ? station2.name : '') : station2} />
                        <View style={styles.switchbutton}>
                            <TouchableOpacity onPress={() => showDeparturesQuery('string' === typeof station2 ? station2 : '')} disabled={!('string' === typeof station2 && station2.length > 0)} >
                                <Text style={styles.switchText}>
                                    &#8614;
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            }

            {
                orientation === 'LANDSCAPE' &&
                <View style={stylesLandscape.containerButtons} >
                    <A1 s={isLocation(station1) ? (station1.name ? station1.name : '') : station1} />
                    <Text style={{ paddingHorizontal: 5 }} />
                    <A2 s={isLocation(station2) ? (station2.name ? station2.name : '') : station2} />
                </View>
            }

            <View style={styles.containerDateTime}>
                <View style={styles.buttonDateTime}>
                    <Button onPress={() => navigateToDateTimeScreen('date')} title={t('HomeScreen.ShortDate', { date })} />
                </View>
                <View style={styles.buttonDateTime}>
                    <Button onPress={() => navigateToDateTimeScreen('time')} title={t('HomeScreen.Time', { date })} />
                </View>
                <View style={styles.buttonDateTime}>
                    <Button onPress={() => setDateNow()} title={'jetzt'} />
                </View>
            </View>

            {
                orientation === 'PORTRAIT' &&
                <View style={styles.containerSearch}>
                    <TouchableOpacity style={styles.buttonOutlined} onPress={() => navigateToJourneyOptionsScreen()}>
                        <Text style={styles.itemText}>
                            Suchoptionen ändern
                        </Text>
                    </TouchableOpacity>
                </View>
            }
            {
                orientation === 'PORTRAIT' &&
                <View style={styles.containerSearch}>
                    <Pressable style={styles.buttonJourneyPlan} disabled={!searchEnabled} onPress={() => searchConnections()}>
                        {({ pressed }) => (
                            pressed
                                ? <Text style={styles.itemButtonTextPressed}>
                                    {profile !== rinfProfile ? t('HomeScreen.SearchConnections') : 'Strecken suchen'}
                                </Text>
                                : <Text style={styles.itemButtonText}>
                                    {profile !== rinfProfile ? t('HomeScreen.SearchConnections') : 'Strecken suchen'}
                                </Text>
                        )}
                    </Pressable>
                </View>
            }

            {
                orientation === 'PORTRAIT' &&
                <View
                    style={{
                        borderBottomColor: 'black',
                        borderBottomWidth: 1,
                        marginTop: 5,
                        marginBottom: 5,
                        marginLeft: 10,
                        marginRight: 10
                    }}
                />
            }
            {
                orientation === 'PORTRAIT' &&
                <View style={styles.containerSearch}>
                    <TouchableOpacity style={styles.buttonOutlined} onPress={() => searchNearby()}>
                        <Text style={styles.itemText}>
                            {t('HomeScreen.Nearby')}
                        </Text>
                    </TouchableOpacity>
                </View>
            }
            {
                orientation === 'PORTRAIT' &&
                <View style={styles.containerSearch}>
                    <TouchableOpacity style={styles.buttonOutlined} disabled={profile === rinfProfile} onPress={() => searchRadar()}>
                        <Text style={styles.itemText}>
                            {t('HomeScreen.Radar')}
                        </Text>
                    </TouchableOpacity>
                </View>
            }
            {
                orientation === 'PORTRAIT' &&
                <View style={styles.containerSearch}>
                    <TouchableOpacity style={styles.buttonOutlined} onPress={() => searchLineNetwork()}>
                        <Text style={styles.itemText}>
                            Liniennetz
                        </Text>
                    </TouchableOpacity>
                </View>
            }
            {
                orientation === 'PORTRAIT' &&
                <View style={styles.containerSearch}>
                    <TouchableOpacity style={styles.buttonOutlined} onPress={() => searchMyJourneys()}>
                        <Text style={styles.itemText}>
                            Meine Reisen
                        </Text>
                    </TouchableOpacity>
                </View>
            }

            {
                orientation === 'LANDSCAPE' &&
                <View style={styles.containerSearch}>
                    <RadioGroup
                        radioButtons={radioButtons}
                        onPress={setSearchType}
                        selectedId={searchType}
                        layout='row'
                    />
                </View>
            }
            {
                orientation === 'LANDSCAPE' &&
                <View style={styles.containerSearch}>
                    <TouchableOpacity style={styles.buttonContained} onPress={() => search()}>
                        <Text style={styles.itemText}>
                            {t('HomeScreen.Search')}
                        </Text>
                    </TouchableOpacity>
                </View>
            }

        </View >
    );
}
