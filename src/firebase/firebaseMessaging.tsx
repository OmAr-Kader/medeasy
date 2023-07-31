import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import * as CONST from '../global/const';
import { intiFirebase } from './fireAuth';
import { findPref, findPrefOrNull, isSafeToUse, updatePref } from '../global/utils';
import { checkApplicationPermission, handledFromFcm } from './notify';

export const intiFCM = () => {
    checkApplicationPermission(() => {
        intiFirebase(() => {
            checkPermission(() => {
                //messaging().onNotificationOpenedApp(async remoteMessage => handledFromFcm(remoteMessage))
                messaging().subscribeToTopic(CONST.FCM_TOPIC).then(() => {
                });
            });
        });
    });
};

export const manualCheck = () => {
    messaging().getInitialNotification().then((remoteMessage) => {
        findPrefOrNull('lastMessageId', (value) => {
            isSafeToUse<any>(remoteMessage, (message) => {
                isSafeToUse<string>(remoteMessage?.messageId, (id) => {
                    console.log('aaaa' + value !== id);
                    if (value !== id) {
                        updatePref('lastMessageId', id, () => { })
                        handledFromFcm(message)
                    }
                })
            })
        }, () => { })
    });
}

export const checkPermissionTokenFirst = (invoke: (token: string) => void) => {
    intiFirebase(() => {
        findPref(CONST.FCM_TOKEN, (fcmToken) => {
            invoke(fcmToken);
        }, () => {
            checkPermission((newFcmToken) => {
                invoke(newFcmToken ? newFcmToken : '');
            });
        });
    });
};

export const checkPermission = (invoke: (token: string | null) => void) => {
    intiFirebase(() => {
        messaging().hasPermission().then((enabled) => {
            if (enabled === 1) {
                getToken(invoke);
            } else {
                requestPermission(invoke);
            }
        }).catch(() => {
            requestPermission(invoke);
        });
    });
};

export const getToken = (invoke: (token: string | null) => void) => {
    intiFirebase(() => {
        if (!messaging().isDeviceRegisteredForRemoteMessages) {
            messaging().registerDeviceForRemoteMessages().then(() => {
                fetchToken(invoke);
            }).catch(() => {
                invoke(null);
            });
        } else {
            findPref(CONST.FCM_TOKEN, (fcmToken) => {
                invoke(fcmToken)
            }, () => fetchToken(invoke))
        }
    })
};

const fetchToken = (invoke: (token: string | null) => void) => {
    messaging().getToken().then((newFcmToken) => {
        if (newFcmToken !== null) {
            updatePref(CONST.FCM_TOKEN, newFcmToken, () => {
                invoke(newFcmToken);
            }, () => {
                invoke(null);
            });
        }
    }).catch(() => {
        invoke(null);
    });
};

export const requestPermission = (invoke: (token: string | null) => void) => {
    intiFirebase(() => {
        messaging().requestPermission().then(() => {
            getToken(invoke);
        }).catch(() => {
            invoke(null);
        });
    });
};

export const sendFcmMessage = ({ token, data, tittle, msg }: { token: string, data: {}, tittle: string, msg: string }, invoke?: () => void, failed?: () => void) => {
    var myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append(
        'Authorization',
        `key=${CONST.SERVER_API_KEY}`,
    );

    var raw = JSON.stringify({
        data: data,
        notification: {
            body: msg,
            title: tittle,
            priority: 2,
            visibility: 1,
            sound: 'default',
        },
        to: token,
        priority: 'high',
    });

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow',
    };

    fetch('https://fcm.googleapis.com/fcm/send', requestOptions)
        .then(response => response.text())
        .then(() => {
            console.log('DONE: sendFcmMessage');
            invoke?.()
        })
        .catch((e) => {
            console.log('Failed: sendFcmMessage' + e);
            failed?.()
        });
};

export const sendMultiDeviceNotification = (tokens: string[], tittle: string, msg: string, doctorId: string) => {
    var myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append(
        'Authorization',
        `key=${CONST.SERVER_API_KEY}`,
    );
    var raw = JSON.stringify({
        data: { doctorId: doctorId },
        notification: {
            body: msg,
            title: tittle,
        },
        registration_ids: tokens,
    });
    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow',
    };

    fetch('https://fcm.googleapis.com/fcm/send', requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error', error));
};

