import * as React from 'react';
import { AppRegistry } from 'react-native';
import './src/global';
import './src/init-i18next';
import App from './src/screens/App';
import { Provider as PaperProvider } from 'react-native-paper';
import { name as appName } from './app.json';

export default function Main() {
    return (
      <PaperProvider>
        <App />
      </PaperProvider>
    );
  }

AppRegistry.registerComponent(appName, () => Main);
