import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import HomeScreen from './Home';
import DepartureScreen from './Departures';
import ConnectionsScreen from './Connections';
import JourneyplanScreen from './Journeyplan';
import RailwayRoutesOfTripScreen from './RailwayRoutesOfTrip';
import RailwayRoute from './RailwayRoute';
import OpenStreetMapScreen from './OpenStreetMap';
import OptionsScreen from './Options';
import BRouterScreen from './BRouter';
import DateTimeScreen from './DateTime';
import TripScreen from './Trip';
import ThirdPartyLicensesScreen from './third-party-licenses';
import { MainStackParamList, RootStackParamList } from './ScreenTypes';

const MainStack = createStackNavigator<MainStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

function MainStackScreen() {
  const { t } = useTranslation();
  return (
    <MainStack.Navigator>
      <MainStack.Screen
        name="Home"
        component={HomeScreen}
      />
      <MainStack.Screen
        name="Connections"
        component={ConnectionsScreen}
        options={{ title: t('ConnectionsScreen.Title') }}
      />
      <MainStack.Screen
        name="Departures"
        component={DepartureScreen}
        options={({ route }) => ({ title: t('DepartureScreen.Title') + ' ' + route.params.station })}
      />
      <MainStack.Screen
        name="Journeyplan"
        component={JourneyplanScreen}
        options={{ title: t('JourneyplanScreen.Title') }}
      />
      <MainStack.Screen
        name="RailwayRoutesOfTrip"
        component={RailwayRoutesOfTripScreen}
        options={{ title: t('RailwayRoutesOfTripScreen.Title') }}
      />
      <MainStack.Screen
        name="RailwayRoute"
        component={RailwayRoute}
        options={({ route }) => ({ title: t('RailwayRouteScreen.Title') + ' ' + route.params.railwayRouteNr })}
      />
      <MainStack.Screen
        name="Trip"
        component={TripScreen}
        options={{ title: t('TripScreen.Title') }}
      />
      <MainStack.Screen
        name="OpenStreetMap"
        component={OpenStreetMapScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <MainStack.Screen
        name="BRouter"
        component={BRouterScreen}
        options={{ title: 'Route' }}
      />
    </MainStack.Navigator>
  );
}

function RootStackScreen(): JSX.Element {
  const { t } = useTranslation();
  return (
    <RootStack.Navigator mode="modal">
      <RootStack.Screen
        name="Main"
        component={MainStackScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="Options"
        component={OptionsScreen}
        options={{ title: t('OptionsScreen.Title') }}
      />
      <RootStack.Screen
        name="DateTime"
        component={DateTimeScreen}
        options={{ title: t('DateTimeScreen.Title') }}
      />
      <RootStack.Screen
        name="ThirdPartyLicenses"
        component={ThirdPartyLicensesScreen}
        options={{ title: 'Third-party licenses' }}
      />
    </RootStack.Navigator>
  );
}

export default function App(): JSX.Element {
  return (
    <NavigationContainer>
      <RootStackScreen />
    </NavigationContainer>
  );
}
