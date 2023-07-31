import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { intiFirebase } from './src/firebase/fireAuth';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { handleNotify } from './src/firebase/notify';

intiFirebase(() => {
    messaging().setBackgroundMessageHandler(async () => { });
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
    handleNotify(type, detail)
    console.log('WWWW' + 'notifee');
});

AppRegistry.registerComponent(appName, () => App);
