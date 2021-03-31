import React, { useState, useEffect } from "react";
import AsyncStorage from '@react-native-community/async-storage';
import { StyleSheet, View, TouchableOpacity, Text, Button } from "react-native";
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import CustomAutocomplete from './components/CustomAutocomplete';
import { useTranslation } from 'react-i18next';
import { hafas } from '../lib/hafas';
import type { Alternative, Location } from 'hafas-client';
import type { MainStackParamList, RootStackParamList } from './ScreenTypes';

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

  const [station1, setStation1] = useState<string | Location>('');
  const [station2, setStation2] = useState('');
  const [stationVia, setStationVia] = useState('');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState('db-fsharp');
  const [tripDetails, setTripDetails] = useState(true);
  const [date, setDate] = useState(new Date(Date.now()));
  const [transferTime, setTransferTime] = useState(8);

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
  }, [navigation, profile, transferTime, tripDetails]);

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

  // route.params from OptionsScreen
  if (route.params?.profile !== undefined && route.params?.profile !== profile) {
    setProfile(route.params.profile);
  }

  // route.params from OptionsScreen
  if (route.params?.tripDetails !== undefined && route.params?.tripDetails !== tripDetails) {
    setTripDetails(route.params.tripDetails);
  }

  // route.params from OptionsScreen
  if (route.params?.transferTime !== undefined && route.params?.transferTime !== transferTime) {
    setTransferTime(route.params.transferTime);
  }

  // route.params from DateTimeScreen
  if (route.params?.date !== undefined && route.params?.date !== date.valueOf()) {
    setDate(new Date(route.params.date));
  }

  // route.params from NearbyScreen
  if (route.params?.station !== undefined && route.params?.station !== station1) {
    setStation1(route.params.station);
  }

  console.log('profile: ', profile);
  console.log('tripDetails: ', tripDetails);
  console.log('date: ', date);

  const client = hafas(profile);

  const setAndSaveStation1 = (s: string) => {
    setStation1(s);
    saveData({ station1: s, station2 });
  }

  const setAndSaveStation2 = (s: string) => {
    setStation2(s)
    const s1 = 'string' === typeof station1 ? station1 : '';
    saveData({ station1: s1, station2: s });
  }

  const asyncFindDepartures = (query: string, callback: (arr: ReadonlyArray<Alternative>) => void) => {
    if (query.length > 0) {
      const onlyLocalProducts = false;
      client.departures(query, ['train', 'watercraft'], date, onlyLocalProducts)
        .then(alternatives => callback(alternatives))
        .catch((error) => {
          console.log('There has been a problem with your locations operation: ' + error);
          callback([]);
        });
    }
  }

  const searchConnections = () => {
    if (station1 !== '' && station2 !== '') {
      console.log('searchConnections. profile:', profile);
      navigation.navigate('Connections', { profile, station1: station1, station2: station2, via: stationVia, date: date.valueOf(), tripDetails, transferTime });
    }
  }

  const searchNearby = () => {
    console.log('searchNearby. profile:', profile);
    navigation.navigate('Nearby', { profile, distance: 2000, searchBusStops: false });
  }

  const showDeparturesQuery = (query: string) => {
    asyncFindDepartures(query, (alternatives: ReadonlyArray<Alternative>) => {
      if (alternatives.length > 0) {
        navigation.navigate('Departures', { station: query, alternatives, profile })
      } else {
        console.log('no departures from ', query)
      }
    });
  }

  const navigateToOptionsScreen = () => {
    console.log('navigateToOptionsScreen. profile:', profile);
    navigation.navigate('Options', { navigationParams: { profile: profile, tripDetails, transferTime } });
  }

  const navigateToDateTimeScreen = (mode: 'date' | 'time') => {
    navigation.navigate('DateTime', { navigationParams: { date: date.valueOf(), mode } });
  }

  const setDateNow = () => {
    setDate(new Date(Date.now()));
  }

  const searchEnabled = (client.isLocation(station1) || station1.length > 0) && station2.length > 0;

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
    <View>
      <View style={styles.autocompleteContainerFrom}>
        <A1 s={client.isLocation(station1) ? (station1.name ? station1.name : '') : station1} />
      </View>
      <View style={styles.autocompleteContainerVia}>
        <CustomAutocomplete client={client} placeholder="via" query={stationVia} onPress={(name) => { setStationVia(name); }} />
      </View>
      <View style={styles.autocompleteContainerTo}>
        <A2 s={station2} />
      </View>

      <View style={styles.containerDateTime}>
        <View style={styles.button2}>
          <Button onPress={() => navigateToDateTimeScreen('date')} title={t('HomeScreen.ShortDate', { date })} />
        </View>
        <View style={styles.button2}>
          <Button onPress={() => navigateToDateTimeScreen('time')} title={t('HomeScreen.Time', { date })} />
        </View>
        <View style={styles.button2}>
          <Button onPress={() => setDateNow()} title={'jetzt'} />
        </View>
      </View>

      <View style={styles.containerSearch}>
        <TouchableOpacity style={styles.button} disabled={!searchEnabled} onPress={() => searchConnections()}>
          <Text style={styles.itemText}>
            {t('HomeScreen.SearchConnections')}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.nearby}>
        <TouchableOpacity style={styles.button} disabled={!searchEnabled} onPress={() => searchNearby()}>
          <Text style={styles.itemText}>
            {t('HomeScreen.Nearby')}
          </Text>
        </TouchableOpacity>
      </View>
      {'string' === typeof station1 && station1.length > 0 &&
        <View style={styles.containerDepFrom}>
          <TouchableOpacity style={styles.button} onPress={() => showDeparturesQuery(station1)}>
            <Text style={styles.itemText}>
              {t('HomeScreen.Departures', { station: station1 })}
            </Text>
          </TouchableOpacity>
        </View>
      }
      {station2.length > 0 &&
        <View style={styles.containerDepTo}>
          <TouchableOpacity style={styles.button} onPress={() => showDeparturesQuery(station2)}>
            <Text style={styles.itemText}>
              {t('HomeScreen.Departures', { station: station2 })}
            </Text>
          </TouchableOpacity>
        </View>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container1: {
    backgroundColor: '#F5FCFF',
    flex: 1,
    paddingTop: 25
  },
  container2: {
    backgroundColor: '#F5FCFF',
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 120,
  },
  containerDateTime: {
    backgroundColor: '#F5FCFF',
    flex: 1,
    flexDirection: 'row',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 190,
  },
  containerSearch: {
    backgroundColor: '#F5FCFF',
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 270,
  },
  nearby: {
    backgroundColor: '#F5FCFF',
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 330,
  },
  containerDepFrom: {
    backgroundColor: '#F5FCFF',
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 400,
  },
  containerDepTo: {
    backgroundColor: '#F5FCFF',
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 470,
  },
  autocompleteContainerFrom: {
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 10,
    zIndex: 3
  },
  autocompleteContainerVia: {
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 70,
    zIndex: 2
  },
  autocompleteContainerTo: {
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 130,
    zIndex: 1
  },
  itemText: {
    fontSize: 18,
    margin: 2
  },
  descriptionContainer: {
    // `backgroundColor` needs to be set otherwise the
    // autocomplete input will disappear on text input.
    backgroundColor: '#F5FCFF',
    marginTop: 25
  },
  infoText: {
    textAlign: 'center'
  },
  titleText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
    marginTop: 10,
    textAlign: 'center'
  },
  directorText: {
    color: 'grey',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center'
  },
  openingText: {
    textAlign: 'center'
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10
  },
  button2: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    flex: 4,
  },
});
