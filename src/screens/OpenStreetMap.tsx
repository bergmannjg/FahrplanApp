import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { MainStackParamList } from './ScreenTypes';

type Props = {
  route: RouteProp<MainStackParamList, 'OpenStreetMap'>;
  navigation: StackNavigationProp<MainStackParamList, 'OpenStreetMap'>;
};

export default function OpenStreetMapScreen({ route, navigation }: Props) {
  console.log('OpenStreetMapScreen constructor');
  const { location } = route.params;
  console.log('location: ', location);

  const uri = `https://www.openstreetmap.org/#map=14/${location.latitude}/${location.longitude}`;

  return (
    <WebView
      source={{ uri }}
      style={{ marginTop: 20 }}
    />
  );

}

