import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee from '@notifee/react-native';
import { handleNotify } from './src/firebase/notify';

notifee.onBackgroundEvent(async ({ type, detail }) => {
    handleNotify(type, detail)
    console.log('WWWW' + 'notifee');
});

AppRegistry.registerComponent(appName, () => App);
