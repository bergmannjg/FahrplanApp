import React, { useState, useEffect } from "react";
import AsyncStorage from '@react-native-community/async-storage';
import { View, TouchableOpacity, Text, Button } from "react-native";
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomAutocomplete from './components/CustomAutocomplete';
import { useTranslation } from 'react-i18next';
import { hafas } from '../lib/hafas';
import type { Location } from 'hafas-client';
import type { MainStackParamList, RootStackParamList } from './ScreenTypes';
import { useOrientation } from './useOrientation';
import RadioForm from 'react-native-simple-radio-button';
import { stylesPortrait, stylesLandscape, styles } from './styles';

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

  const { t } = useTranslation();

  const [nearbyStation, setNearbyStation] = useState<string | Location>('');
  const [station1, setStation1] = useState<string | Location>('');
  const [station2, setStation2] = useState<string | Location>('');
  const [stationVia, setStationVia] = useState('');
  const [loading, setLoading] = useState(true);
  const [clientLib, setClientLib] = useState('fs-hafas-client');
  const [profile, setProfile] = useState('db');
  const [clientProfile, setClientProfile] = useState('db-fsharp');
  const [tripDetails, setTripDetails] = useState(true);
  const [date, setDate] = useState(new Date(Date.now()));
  const [showDate, setShowDate] = useState(false);
  const [transferTime, setTransferTime] = useState(8);
  const [searchType, setSearchType] = useState('Verbindungen');
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

  React.useEffect(() => {
    console.log('navigation.setOptions')
    navigation.setOptions({
      headerTitle: t('HomeScreen.Header'),
      headerRight: headerRight
    });
  }, [navigation, clientLib, profile, transferTime, tripDetails]);

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

  const resetClientProfile = () => {
    setClientProfile(profile + (clientLib === 'fs-hafas-client' ? '-fsharp' : ''));
  }

  // route.params from OptionsScreen
  if (route.params?.clientLib !== undefined && route.params?.clientLib !== clientLib) {
    setClientLib(route.params.clientLib);
    resetClientProfile();
  }

  // route.params from OptionsScreen
  if (route.params?.profile !== undefined && route.params?.profile !== profile) {
    setProfile(route.params.profile);
    resetClientProfile();
  }

  // route.params from OptionsScreen
  if (route.params?.tripDetails !== undefined && route.params?.tripDetails !== tripDetails) {
    setTripDetails(route.params.tripDetails);
  }

  // route.params from OptionsScreen
  if (route.params?.transferTime !== undefined && route.params?.transferTime !== transferTime) {
    setTransferTime(route.params.transferTime);
  }

  // route.params from NearbyScreen
  if (route.params?.station !== undefined && route.params?.station !== nearbyStation) {
    setNearbyStation(route.params.station);
    setStation1(route.params.station);
  }

  console.log('clientLib: ', clientLib);
  console.log('profile: ', profile);
  console.log('tripDetails: ', tripDetails);
  console.log('date: ', date);

  const client = hafas(clientProfile);

  const onChangeDate = (event: Event, selectedDate: Date | undefined) => {
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
      console.log('searchConnections. profile:', profile);
      navigation.navigate('Connections', { profile: clientProfile, station1: station1, station2: station2, via: stationVia, date: date.valueOf(), tripDetails, transferTime });
    }
  }

  const searchNearby = () => {
    console.log('searchNearby, profile:', profile);
    navigation.navigate('Nearby', { profile: clientProfile, distance: 1000, searchBusStops: false });
  }

  const searchRadar = () => {
    console.log('searchRadar, profile:', profile);
    navigation.navigate('Radar', { profile: clientProfile, duration: 10 });
  }

  const showDeparturesQuery = (query: string) => {
    navigation.navigate('Departures', { station: query, date: date.valueOf(), profile: clientProfile })
  }

  const navigateToOptionsScreen = () => {
    console.log('navigateToOptionsScreen. profile:', profile);
    navigation.navigate('Options', { navigationParams: { clientLib: clientLib, profile: profile, tripDetails, transferTime } });
  }

  const navigateToDateTimeScreen = (mode: 'date' | 'time') => {
    setMode(mode);
    setShowDate(true);
  }

  const switchStations = () => {
    const tmp = station1;
    setStation1(station2);
    setStation2(tmp);
  }

  const radioProps = [
    { label: 'Verbindungen ', value: 'Verbindungen' },
    { label: 'Haltestellen in der Nähe ', value: 'Haltestellen' },
    { label: 'Busse und Bahnen in der Nähe', value: 'BusseBahnen' }
  ];

  const search = () => {
    if (searchType === 'Verbindungen') searchConnections();
    else if (searchType === 'Haltestellen') searchNearby();
    else if (searchType === 'BusseBahnen') searchRadar();
  }

  const searchEnabled = (client.isLocation(station1) || station1.length > 0) && (client.isLocation(station2) || station2.length > 0);

  const A1 = ({ s }: { s: string }) => {
    return (
      !loading ?
        <CustomAutocomplete client={client} placeholder={t('HomeScreen.From')} query={s} onPress={(name) => { setAndSaveStation1(name); }} />
        : <View />
    );
  }

  const A2 = ({ s }: { s: string }) => {
    return (
      !loading ?
        <CustomAutocomplete client={client} placeholder={t('HomeScreen.To')} query={s} onPress={(name) => { setAndSaveStation2(name); }} />
        : <View />
    );
  }

  return (
    <View style={styles.container}>

      { showDate &&
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
            <A1 s={client.isLocation(station1) ? (station1.name ? station1.name : '') : station1} />
            <View style={styles.switchbutton}>
              <TouchableOpacity onPress={() => showDeparturesQuery('string' === typeof station1 ? station1 : '')} disabled={!('string' === typeof station1 && station1.length > 0)} >
                <Text style={styles.switchText}>
                  &#8614;
            </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.autocompleteContainerVia}>
            <CustomAutocomplete client={client} placeholder="via" query={stationVia} onPress={(name) => { setStationVia(name); }} />
            <View style={styles.switchbutton}>
              <TouchableOpacity onPress={() => switchStations()} >
                <Text style={styles.switchText}>
                  &#8645;
            </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.autocompleteContainerTo}>
            <A2 s={client.isLocation(station2) ? (station2.name ? station2.name : '') : station2} />
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
          <A1 s={client.isLocation(station1) ? (station1.name ? station1.name : '') : station1} />
          <Text style={{ paddingHorizontal: 5 }} />
          <A2 s={client.isLocation(station2) ? (station2.name ? station2.name : '') : station2} />
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
          <TouchableOpacity style={styles.buttonContained} disabled={!searchEnabled} onPress={() => searchConnections()}>
            <Text style={styles.itemText}>
              {t('HomeScreen.SearchConnections')}
            </Text>
          </TouchableOpacity>
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
          <TouchableOpacity style={styles.buttonOutlined} onPress={() => searchRadar()}>
            <Text style={styles.itemText}>
              {t('HomeScreen.Radar')}
            </Text>
          </TouchableOpacity>
        </View>
      }

      {
        orientation === 'LANDSCAPE' &&
        <View style={styles.containerSearch}>
          <RadioForm
            formHorizontal={true}
            radio_props={radioProps}
            initial={0}
            onPress={(value: string) => { setSearchType(value) }}
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
