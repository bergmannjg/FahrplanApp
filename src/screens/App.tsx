import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import HomeScreen from './Home';
import DepartureScreen from './Departures';
import ConnectionsScreen from './Connections';
import RadarScreen from './Radar';
import NearbyScreen from './Nearby';
import JourneyplanScreen from './Journeyplan';
import RailwayRoutesOfTripScreen from './RailwayRoutesOfTrip';
import RailwayRoute from './RailwayRoute';
import OpenStreetMapScreen from './OpenStreetMap';
import TrainformationScreen from './Trainformation';
import WagonimageScreen from './Wagonimage'
import OptionsScreen from './Options';
import BRouterScreen from './BRouter';
import TripScreen from './Trip';
import WebViewScreen from './WebView';
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
        name="Radar"
        component={RadarScreen}
        options={{ title: t('RadarScreen.Title') }}
      />
      <MainStack.Screen
        name="Nearby"
        component={NearbyScreen}
        options={{ title: t('NearbyScreen.Title') }}
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
        name="Trainformation"
        component={TrainformationScreen}
        options={{ title: t('TrainformationScreen.Title') }}
      />
      <MainStack.Screen
        name="Wagonimage"
        component={WagonimageScreen}
        options={({ route }) => ({ title: route.params.title })}
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
        options={({ route }) => ({ title: t('TripScreen.Title') + ' ' + route.params.line?.name })}
      />
      <MainStack.Screen
        name="OpenStreetMap"
        component={OpenStreetMapScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <MainStack.Screen
        name="WebView"
        component={WebViewScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
      <MainStack.Screen
        name="BRouter"
        component={BRouterScreen}
        options={({ route }) => ({
          title: route.params.locations.length > 1
            ? 'Route'
            : 'Standort' + (route.params.titleSuffix ? ' ' + route.params.titleSuffix : '')
        })}
      />
    </MainStack.Navigator>
  );
}

function RootStackScreen(): JSX.Element {
  const { t } = useTranslation();
  return (
    <RootStack.Navigator screenOptions={{ presentation: 'modal' }}>
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
