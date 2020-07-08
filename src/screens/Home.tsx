import React, { useState } from "react";
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text, Button, TextInput, Keyboard } from "react-native";
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import CustomAutocomplete from './components/CustomAutocomplete';
// import DeviceInfo from 'react-native-device-info'
import { useTranslation } from 'react-i18next';
import { hafas, Hafas } from '../lib/hafas';
import { Station, Stop, Location, Alternative } from 'hafas-client';

import { MainStackParamList, RootStackParamList, DepartureScreenParams } from './ScreenTypes';

type Props = {
  route: RouteProp<MainStackParamList, 'Home'>;
  navigation: CompositeNavigationProp<
    StackNavigationProp<MainStackParamList, 'Home'>,
    StackNavigationProp<RootStackParamList>
  >;
};

export default function HomeScreen({ route, navigation }: Props) {
  console.log('home constructor, route: ', route);

  const { t, i18n } = useTranslation();

  navigation.setOptions({
    headerTitle: t('HomeScreen.Header'),
    headerRight: () => (
      <View style={{ backgroundColor: '#F5FCFF' }}>
        <TouchableOpacity onPress={() => { navigateToOptionsScreen(); }}>
          <Text style={{ fontSize: 18, marginRight: 10 }} >
            {t('HomeScreen.Options')}
          </Text>
        </TouchableOpacity>
      </View>
    ),
  });

  const emulator = false;
  const [station1, setStation1] = useState(emulator ? 'Hannover' : '');
  const [station2, setStation2] = useState(emulator ? 'Bielfeld' : '');
  const [stationVia, setStationVia] = useState('');

  const [profile, setProfile] = useState('db');
  const [tripDetails, setTripDetails] = useState(true);
  const [date, setDate] = useState(new Date());
  const [routeSearch, setRouteSearch] = useState('single');

  // route.params from OptionsScreen
  if (route.params?.profile !== undefined && route.params?.profile !== profile) {
    setProfile(route.params.profile);
    route.params.profile = undefined;
  }

  // route.params from OptionsScreen
  if (route.params?.tripDetails !== undefined && route.params?.tripDetails !== tripDetails) {
    setTripDetails(route.params.tripDetails);
    route.params.tripDetails = undefined;
  }

  // route.params from OptionsScreen
  if (route.params?.routeSearch !== undefined && route.params?.routeSearch !== routeSearch) {
    setRouteSearch(route.params.routeSearch);
    route.params.tripDetails = undefined;
  }

  // route.params from DateTimeScreen
  if (route.params?.date !== undefined && route.params?.date !== date) {
    setDate(route.params.date);
    route.params.date = undefined;
  }

  console.log('profile: ', profile);
  console.log('tripDetails: ', tripDetails);
  console.log('date: ', date);

  const client = hafas(profile);

  const asyncFindBahnhoefe = (query: string, callback: (arr: ReadonlyArray<Station | Stop | Location>) => void) => {
    if (query.length > 0) {
      client.locations(query, 1)
        .then(locations => callback(locations))
        .catch((error) => {
          console.log('There has been a problem with your locations operation: ' + error);
          callback([]);
        });
    }
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

  const suchen = () => {
    if (station1 !== '' && station2 !== '') {
      navigation.navigate('Connections', { client, station1, station2, via: stationVia, date, tripDetails, routeSearch });
    }
  }

  const showmapOfQuery = (query: string) => {
    asyncFindBahnhoefe(query, (places: ReadonlyArray<Station | Stop | Location>) => {
      if (places.length > 0) {
        const place = places[0];
        const location = client.isStop(place) ? place.location : (client.isLocation(place) ? place : place.location);
        if (location) {
          navigation.navigate('OpenStreetMap', { name: places[0].name ?? '', location })
        }
      }
    });
  }

  const showDeparturesQuery = (query: string) => {
    asyncFindDepartures(query, (alternatives: ReadonlyArray<Alternative>) => {
      if (alternatives.length > 0) {
        navigation.navigate('Departures', { station: query, alternatives, client })
      } else {
        console.log('no departures from ', query)
      }
    });
  }

  const navigateToOptionsScreen = () => {
    navigation.navigate('Options', { navigationParams: { profile, tripDetails, routeSearch } });
  }

  const navigateToDateTimeScreen = (mode: 'date' | 'time') => {
    navigation.navigate('DateTime', { navigationParams: { date, mode } });
  }

  const setDateNow = () => {
    setDate(new Date());
  }

  const searchEnabled = station1.length > 0 && station2.length > 0;

  return (
    <View>
      <View style={styles.autocompleteContainerFrom}>
        <CustomAutocomplete client={client} placeholder={t('HomeScreen.From')} query={station1} onPress={(name) => { setStation1(name); }} />
      </View>
      <View style={styles.autocompleteContainerVia}>
        <CustomAutocomplete client={client} placeholder="via" query={stationVia} onPress={(name) => { setStationVia(name); }} />
      </View>
      <View style={styles.autocompleteContainerTo}>
        <CustomAutocomplete client={client} placeholder={t('HomeScreen.To')} query={station2} onPress={(name) => { setStation2(name); }} />
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
        <TouchableOpacity style={styles.button} disabled={!searchEnabled} onPress={() => suchen()}>
          <Text style={styles.itemText}>
            {t('HomeScreen.SearchConnections')}
          </Text>
        </TouchableOpacity>
      </View>
      {station1.length > 0 &&
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
  containerDepFrom: {
    backgroundColor: '#F5FCFF',
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 330,
  },
  containerDepTo: {
    backgroundColor: '#F5FCFF',
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 400,
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
