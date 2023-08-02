import React from 'react';
import S from './src/screens';
import * as CONST from './src/global/const';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ZegoExpressEngine from 'zego-express-engine-reactnative';
import { intiFirebase } from './src/firebase/fireAuth';
import { intiFCM, manualCheck } from './src/firebase/firebaseMessaging';
import { checkNetworkStats } from './src/firebase/lifecycle';
import { NotifierWrapper } from 'react-native-notifier';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReactNative from 'react-native';

try {
  ReactNative.I18nManager.allowRTL(false);
} catch (e) {}

ZegoExpressEngine.createEngineWithProfile({
  appID: CONST.ZEGO_APP_ID,
  appSign: CONST.ZEGO_APP_SIGN,
  scenario: 0,
});

const Stack = createNativeStackNavigator();

function App() {
  checkNetworkStats();
  intiFirebase(() => {
    manualCheck();
    intiFCM();
  });
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotifierWrapper>
        <NavigationContainer>
          <Stack.Navigator initialRouteName={CONST.SPLASH_SCREEN}>
            <Stack.Screen
              name={CONST.SPLASH_SCREEN}
              component={S.SplashScreen}
              options={{ headerShown: false }} />
            <Stack.Screen
              name={CONST.LOG_In}
              component={S.SignInUp}
              options={{ headerShown: false }} />
            <Stack.Screen
              name={CONST.LOG_In_ADMIN}
              component={S.SignScreenAdmin}
              options={{ headerShown: false }} />
            <Stack.Screen
              name={CONST.HOME_SCREEN_USER}
              component={S.HomeScreen}
              options={{ headerShown: false }} />
            <Stack.Screen
              name={CONST.DOCTOR_DETAIL}
              component={S.DoctorDetail}
              options={{ headerShown: false }} />
            <Stack.Screen
              name={CONST.CLIENT_DETAIL}
              component={S.UserAppointment}
              options={{ headerShown: false }} />
            <Stack.Screen
              name={CONST.HOME_SCREEN_DOCTOR}
              component={S.HomeDocScreen}
              options={{ headerShown: false }} />
            <Stack.Screen
              name={CONST.HOME_SCREEN_ADMAN}
              component={S.HomeAdminScreen}
              options={{ headerShown: false }} />
            <Stack.Screen
              name={CONST.DOCTOR_DETAIL_ADMIN}
              component={S.DoctorDetailAdmin}
              options={{ headerShown: false }} />
            <Stack.Screen
              name={CONST.CERTIFICATES_SCREEN}
              component={S.CertificatesView}
              options={{ headerShown: false }} />
            <Stack.Screen
              name={CONST.PROFILE_IMAGE_SCREEN}
              component={S.ProfileImageView}
              options={{ headerShown: false }} />
            <Stack.Screen
              name={CONST.APPOINTMENT_SCREEN}
              component={S.AppointmentScreen}
              options={{ headerShown: false }} />
            <Stack.Screen
              name={CONST.APPOINTMENT_SCREEN_DOCTOR}
              component={S.AppointmentDoctorScreen}
              options={{ headerShown: false }} />
            <Stack.Screen
              name={CONST.SCHEDULE_SCREEN}
              component={S.ScheduleView}
              options={{ headerShown: false }} />
            <Stack.Screen
              name={CONST.VIDEO_CALL_SCREEN}
              component={S.VideoCallView}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </NotifierWrapper>
    </GestureHandlerRootView>
  );
}

export default App;
