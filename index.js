
import { AppRegistry } from 'react-native';
import './src/global';
import './src/init-i18next';
import App from './src/screens/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
