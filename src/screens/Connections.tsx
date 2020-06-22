import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator
} from 'react-native';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { ListItem, SearchBar, Icon } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { extractTimeOfDatestring, momentAtLocation } from '../lib/iso-8601-datetime-utils';
import { Hafas, JourneyInfo } from '../lib/hafas';
import { MainStackParamList, JourneyplanScreenParams, ConnectionsScreenParams } from './ScreenTypes';

type Props = {
  route: RouteProp<MainStackParamList, 'Connections'>;
  navigation: StackNavigationProp<MainStackParamList, 'Connections'>;
};

export default function ConnectionsScreen({ route, navigation }: Props) {
  const { params }: { params: ConnectionsScreenParams } = route;

  if (__DEV__) {
    console.log('constructor ConnectionsScreen, params.date: ', params.date);
  }

  const { t, i18n } = useTranslation();

  const [data, setData] = useState([] as JourneyInfo[]);
  const [date, setDate] = useState(params.date);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  console.log('data.length: ', data.length);

  const query1 = params.station1;
  const query2 = params.station2;
  const queryVia = params.via;
  const client: Hafas = params.client;
  const tripDetails = params.tripDetails;

  const makeRemoteRequest = () => {
    console.log('makeRemoteRequest, loading:', loading);
    if (loading) return;
    setLoading(true);

    client.journeys(query1, query2, 3, date, queryVia)
      .then(journeys => {
        console.log('journeys', journeys);
        const infos = [] as JourneyInfo[];
        journeys.forEach(journey => {
          const info = client.journeyInfo(journey);
          infos.push(info);
        });
        console.log('journeyInfos', infos.length);
        setLoading(false);
        setData(infos);
      })
      .catch((error) => {
        console.log('There has been a problem with your locations operation: ' + error);
        console.log(error.stack);
        setLoading(false);
        setData([]);
      });
  };

  useEffect(() => {
    makeRemoteRequest();
  }, [count]);

  const renderSeparator = () => {
    return (
      <View
        style={{
          height: 1,
          width: "86%",
          backgroundColor: "#CED0CE",
          marginLeft: "14%"
        }}
      />
    );
  };

  const goToView = (item: JourneyInfo) => {
    console.log('Navigation router run to Journeyplan');
    navigation.navigate('Journeyplan', { journey: item, client, tripDetails } as JourneyplanScreenParams)
  };

  const showIncr = (hours: number) => {
    const msecsPerHour = 60 * 60 * 1000;
    const newDate = date;
    newDate.setTime(newDate.getTime() + ((hours) * msecsPerHour));
    console.log('date: ', newDate)
    setDate(newDate);
    setData([]);
    setCount(count + 1);
  }

  const showPrev = () => {
    showIncr(-2);
  }

  const showNext = () => {
    showIncr(2);
  }

  const showDiffDays = (from: Date, to: Date) => {
    console.log('from.dayOfYear', moment(from).dayOfYear());
    console.log('to.dayOfYear', moment(to).dayOfYear());
    const diffDays = to.getFullYear() === from.getFullYear() ? moment(to).dayOfYear() - moment(from).dayOfYear() : 0;
    return diffDays > 0 ? t('ConnectionsScreen.DaysDifference', { count: diffDays }) : '';
  }

  const renderFooter = () => {
    if (!loading) return null;

    return (
      <View
        style={{
          paddingVertical: 20,
          borderTopWidth: 1,
          borderColor: "#CED0CE"
        }}
      >
        <ActivityIndicator animating size="large" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.containerButtons} >
        <TouchableOpacity style={styles.button} onPress={() => showPrev()}>
          <Text style={styles.itemButtonText}>
            {t('ConnectionsScreen.Earlier')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => showNext()}>
          <Text style={styles.itemButtonText}>
            {t('ConnectionsScreen.Later')}
          </Text>
        </TouchableOpacity>
      </View>
      <View >
        <Text style={styles.itemHeaderText}>
          {t('ConnectionsScreen.Date', { date })}
        </Text>
        {
          !loading && data.length === 0 && <Text style={styles.itemHeaderText}>
            keine Verbindungn gefunden
          </Text>
        }
      </View>
      <View style={styles.container}>
        <FlatList
          data={data}
          renderItem={({ item }) => (
            <ListItem onPress={() => { goToView(item) }}
              title={`${item.originName} ${t('ConnectionsScreen.DirectionTo')} ${item.destinationName}`}
              subtitle={
                <View style={styles.subtitleView}>
                  <Text>{`${t('ConnectionsScreen.TimeFrom', { date: extractTimeOfDatestring(item.plannedDeparture) })}, ${t('ConnectionsScreen.TimeTo', { date: extractTimeOfDatestring(item.plannedArrival) })}${showDiffDays(new Date(item.plannedDeparture), new Date(item.plannedArrival))}, ${t('ConnectionsScreen.Duration', { duration: moment.duration((new Date(item.plannedArrival)).valueOf() - (new Date(item.plannedDeparture)).valueOf()) })}, ${t('ConnectionsScreen.Changes')}: ${item.changes}`}</Text>
                  {!item.reachable && !item.cancelled && (<Text style={styles.itemWarningText}>{t('ConnectionsScreen.ConnectionNotAccessible')}</Text>)}
                  {item.cancelled && (<Text style={styles.itemWarningText}>{t('ConnectionsScreen.TripCancled')}</Text>)}
                </View>
              }
              containerStyle={{ borderBottomWidth: 0 }}
            />
          )}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={renderSeparator}
          ListFooterComponent={renderFooter}
          onEndReachedThreshold={50}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    paddingTop: 10
  },
  containerButtons: {

  },
  container2: {
    flex: 1,
  },
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
  subtitleView: {
    flexDirection: 'column',
    paddingLeft: 10,
    paddingTop: 5
  },
  itemWarningText: {
    color: 'red',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    margin: 2,
  },
  itemButtonText: {
    fontSize: 18,
    margin: 2,
    textAlign: 'center',
  },
  itemHeaderText: {
    fontSize: 15,
    padding: 10,
    paddingLeft: 15,
  },
});
