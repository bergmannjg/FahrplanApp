import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator
} from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { ListItem } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { extractTimeOfDatestring } from '../lib/iso-8601-datetime-utils';
import { Hafas, JourneyInfo } from '../lib/hafas';
import { MainStackParamList, ConnectionsScreenParams } from './ScreenTypes';
import { hafas } from '../lib/hafas';
import { useOrientation } from './useOrientation';

type Props = {
  route: RouteProp<MainStackParamList, 'Connections'>;
  navigation: StackNavigationProp<MainStackParamList, 'Connections'>;
};

export default function ConnectionsScreen({ route, navigation }: Props): JSX.Element {
  const { params }: { params: ConnectionsScreenParams } = route;

  if (__DEV__) {
    console.log('constructor ConnectionsScreen, params.date: ', params.date);
  }

  const { t } = useTranslation();

  const [data, setData] = useState([] as JourneyInfo[]);
  const [date, setDate] = useState(new Date(params.date));
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  console.log('data.length: ', data.length);

  const query1 = params.station1;
  const query2 = params.station2;
  const queryVia = params.via;
  const profile = params.profile;
  const client: Hafas = hafas(profile);
  const tripDetails = params.tripDetails;
  const transferTime = params.transferTime;
  const modes = ["train", "watercraft", "bus"];

  const makeRemoteRequest = () => {
    console.log('makeRemoteRequest, loading:', loading);
    if (loading) return;
    setLoading(true);

    client.journeys(query1, query2, 3, date, queryVia, transferTime, modes)
      .then(journeys => {
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
        console.log('There has been a problem with your journeys operation: ' + error);
        console.log(error.stack);
        setLoading(false);
        setData([]);
      });
  };

  const orientation = useOrientation();

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
    navigation.navigate('Journeyplan', { journey: item, profile, tripDetails })
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
    showIncr(-1);
  }

  const showNext = () => {
    showIncr(1);
  }

  const showDiffDays = (from: Date, to: Date) => {
    // console.log('from.dayOfYear', moment(from).dayOfYear());
    // console.log('to.dayOfYear', moment(to).dayOfYear());
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
      <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerButtons : stylesLandscape.containerButtons} >
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
            <ListItem onPress={() => { goToView(item) }} containerStyle={{ borderBottomWidth: 0 }} >
              <ListItem.Content>
                <ListItem.Title>{`${item.originName} ${t('ConnectionsScreen.DirectionTo')} ${item.destinationName}`}</ListItem.Title>
                <ListItem.Subtitle>
                  <View style={styles.subtitleView}>
                    <Text>{`${t('ConnectionsScreen.TimeFrom', { date: extractTimeOfDatestring(item.plannedDeparture) })}, ${t('ConnectionsScreen.TimeTo', { date: extractTimeOfDatestring(item.plannedArrival) })}${showDiffDays(new Date(item.plannedDeparture), new Date(item.plannedArrival))}, ${t('ConnectionsScreen.Duration', { duration: moment.duration((new Date(item.plannedArrival)).valueOf() - (new Date(item.plannedDeparture)).valueOf()) })}, ${t('ConnectionsScreen.Changes', { changes: item.changes })}, ${item.distance} km`}</Text>
                    {!item.reachable && !item.cancelled && (<Text style={styles.itemWarningText}>{t('ConnectionsScreen.ConnectionNotAccessible')}</Text>)}
                    {item.cancelled && (<Text style={styles.itemWarningText}>{t('ConnectionsScreen.TripCancled')}</Text>)}
                    {item.informationAvailable && (<Text style={styles.itemWarningText}>Es liegen aktuelle Informationen vor.</Text>)}
                  </View>
                </ListItem.Subtitle>
              </ListItem.Content>
            </ListItem>
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

const stylesPortrait = StyleSheet.create({
  containerButtons: {
    flexDirection: 'column',
  }
});

const stylesLandscape = StyleSheet.create({
  containerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 10
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    paddingTop: 0
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
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    margin: 2,
    minWidth: 200
  },
  itemButtonText: {
    fontSize: 18,
    textAlign: 'center',
  },
  itemHeaderText: {
    fontSize: 15,
    padding: 10,
    paddingTop: 12,
    paddingLeft: 15,
  },
});

