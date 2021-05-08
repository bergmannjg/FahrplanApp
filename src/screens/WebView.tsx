import React from 'react';
import Clipboard from '@react-native-community/clipboard';
import { WebView } from 'react-native-webview';
import { MainStackParamList, WebViewScreenParams } from './ScreenTypes'
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type Props = {
    route: RouteProp<MainStackParamList, 'WebView'>;
    navigation: StackNavigationProp<MainStackParamList, 'WebView'>;
};

export default function WebViewScreen({ route }: Props): JSX.Element {
    console.log('WebViewScreen constructor');

    const { params }: { params: WebViewScreenParams } = route;
    const uri = params.url;
    console.log('uri: ', uri);

    Clipboard.setString(uri);

    return (
        <WebView
            source={{ uri }}
            style={{ marginTop: 20 }}
            javaScriptEnabled={true}
            cacheEnabled={false}
        />
    );
}
