import notifee, { AuthorizationStatus, AndroidImportance, AndroidVisibility, AndroidCategory, AndroidFlags, IOSIntentIdentifier, TriggerType, EventType, Notification, EventDetail } from '@notifee/react-native';
import { isAllSafeToUse, isSafeToUse, pushLocalNotification, updateMuliPref } from "../global/utils";
import * as CONST from "../global/const";
import { Platform } from "react-native";
import { MAIN } from "../global/styles";
import { NativeModules } from 'react-native';
import { ZegoExpressManager } from './ZegoExpressManager';

export const handledFromFcm = (remoteMessage: any) => {
    isSafeToUse<{ [key: string]: string }>(remoteMessage.data, (_data) => {
        const type = _data.type;
        const navigator = _data.navigator;
        const id = _data.id;
        const time = _data.time;
        const tittle = remoteMessage?.notification?.title;
        const body = remoteMessage?.notification?.body;
        isAllSafeToUse([navigator, type, id, tittle, body], () => {
            handleFcm({
                type: type,
                navigator: navigator,
                id: id,
                time: time,
                tittle: tittle,
                body: body,
            })
        })
    })
}

export const handleFcm = ({ type, navigator, id, time, tittle, body }: { type: string, navigator: string, id: string, time: string | undefined | null, tittle: string, body: string }) => {
    if (Number(type) === CONST.FCM_DOCTOR_CONFIRM) {
        isSafeToUse(time, () => {
            scheduleNotification({
                title: 'Appointment date',
                msg: 'Minutes and the doctor will contact you',
                time: Number(time),
                type: CONST.FCM_APPOINTMENT_REMINDER,
                id: id,
                navigator: navigator,
                hasteMinutes: 3,
            });
        })
        updateMuliPref([[CONST.NOTIFICATION_NAVIGATOR, navigator as string], [CONST.NOTIFICATION_TYPE, type as string], [CONST.NOTIFICATION_DOC_ID, id as string]], () => { }, () => { });
    } else if (Number(type) === CONST.FCM_CALL) {
        try {
            notifee.cancelAllNotifications()
        } catch (e) { }
        isAllSafeToUse([tittle, body], () => {
            displayOngoingNotification({
                notId: CONST.NOTIFY_CALL,
                title: tittle!!,
                msg: body!!,
                answered: true,
                record: { type: CONST.FCM_CALL, id: id, navigator: navigator }
            })
        })
    } else {
        updateMuliPref([[CONST.NOTIFICATION_NAVIGATOR, navigator as string], [CONST.NOTIFICATION_TYPE, type as string], [CONST.NOTIFICATION_DOC_ID, id as string]], () => { }, () => { });
    }
}

export const handleNotify = (_type: EventType, detail: EventDetail) => {
    if (_type === EventType.ACTION_PRESS) {
        isSafeToUse<Notification>(detail.notification, (notification) => {
            if (detail.pressAction?.id === 'cancel') {
                isSafeToUse<string>(notification.id, (id) => {
                    notifee.cancelDisplayedNotification(id);
                })
            } else if (detail.pressAction?.id === 'join') {
                isSafeToUse<{ [key: string]: string | object | number; }>(detail.notification?.data, (_data) => {
                    saveDataFromNotify(_data);
                })
            } else if (detail.pressAction?.id == 'hangUp') {
                isSafeToUse<string>(notification.id, (id) => {
                    endCall(id);
                })
            }
        })
    } else if (_type === EventType.PRESS) {
        isSafeToUse<{ [key: string]: string | object | number; }>(detail.notification?.data, (_data) => {
            saveDataFromNotify(_data);
        })
    }
}


export const handleNotifyForeground = (_type: EventType, detail: EventDetail, invoke: (data: any) => void) => {
    if (_type === EventType.ACTION_PRESS) {
        isSafeToUse<Notification>(detail.notification, (notification) => {
            if (detail.pressAction?.id === 'cancel') {
                isSafeToUse<string>(notification.id, (id) => {
                    notifee.cancelDisplayedNotification(id);
                })
            } else if (detail.pressAction?.id === 'join') {
                isSafeToUse<{ [key: string]: string | object | number; }>(detail.notification?.data, (_data) => {
                    saveDataFromNotify(_data);
                })
            } else if (detail.pressAction?.id == 'hangUp') {
                isSafeToUse<string>(notification.id, (id) => {
                    endCall(id);
                })
            }
        })
    } else if (_type === EventType.PRESS) {
        isSafeToUse<{ [key: string]: string | object | number; }>(detail.notification?.data, (_data) => {
            invoke(_data);
        })
    }
}

export const endCall = (id: string) => {
    try {
        ZegoExpressManager.instance().leaveRoom().then(() => {
            notifee.cancelDisplayedNotification(id);
        }).catch(() => {
            notifee.cancelDisplayedNotification(id);
        })
    } catch (e) {
        notifee.cancelDisplayedNotification(id);
    }
}

export const saveDataFromNotify = (data: { [key: string]: string | object | number; }) => {
    isAllSafeToUse([data.type, data.id, data.navigator], (values) => {
        updateMuliPref([[CONST.NOTIFICATION_NAVIGATOR, String(values[2])], [CONST.NOTIFICATION_TYPE, String(values[0])], [CONST.NOTIFICATION_DOC_ID, String(values[1])]], () => { }, () => { });
    })
}

export const checkApplicationPermission = async (invoke: () => void) => {
    if (Platform.OS === 'android' && Platform.Version < 33) {
        invoke();
        return;
    }
    notifee.getNotificationSettings().then((preDone) => {
        if (preDone.authorizationStatus == AuthorizationStatus.AUTHORIZED || preDone.authorizationStatus == AuthorizationStatus.PROVISIONAL) {
            invoke();
        } else if (preDone.authorizationStatus == AuthorizationStatus.DENIED) {
            notifee.requestPermission().then((result) => {
                if (result.authorizationStatus == AuthorizationStatus.AUTHORIZED || result.authorizationStatus == AuthorizationStatus.PROVISIONAL) {
                    invoke();
                } else if (result.authorizationStatus == AuthorizationStatus.DENIED) {
                    pushLocalNotification('Please grant the required permissions', '', false);
                }
            });
        }
    })
};

export const scheduleNotification = ({ title, msg, type, navigator: navigator, id, time, hasteMinutes }: { title: string, msg: string, type: number, navigator: string, id: string, time: number, hasteMinutes: number }) => {
    notifee.createChannel(
        {
            id: 'knock-id',
            name: 'Communication channel',
            description: 'A channel to categories your communication notifications',
            lights: true,
            vibration: true,
            sound: 'default',
            importance: AndroidImportance.DEFAULT,
            visibility: AndroidVisibility.PUBLIC,
        },
    );
    const record = { type: type, data: id, navigator: navigator };
    notifee.createTriggerNotification({
        id: CONST.NOTIFY_COMMUNICATION,
        title: title,
        body: msg,
        data: record,
        android: {
            lightUpScreen: true,
            autoCancel: false,
            category: AndroidCategory.SOCIAL,
            color: MAIN,
            colorized: true,
            ongoing: true,
            loopSound: false,
            flags: [AndroidFlags.FLAG_INSISTENT, AndroidFlags.FLAG_NO_CLEAR],
            onlyAlertOnce: true,
            importance: AndroidImportance.DEFAULT,
            visibility: AndroidVisibility.PUBLIC,
            sound: 'default',
            channelId: 'knock-id',
        },
        ios: {
            sound: 'default',
            interruptionLevel: 'active',
            critical: true,
            criticalVolume: 0.9,
            foregroundPresentationOptions: {
                badge: true,
                sound: true,
                banner: true,
                list: true,
            },
        }
    }, {
        type: TriggerType.TIMESTAMP,
        timestamp: new Date(time - (hasteMinutes * 60 * 1000)).getTime()
    });
};

export const displayOngoingNotification = ({ notId, title, msg, answered, record }: { notId: string, title: string, msg: string, answered: boolean, record: {} }) => {
    const channelId = answered ? 'answered-appointment-channel' : 'appointment-ring-channel';
    if (Platform.OS === 'android') {
        const { RingToneManagerMethod } = NativeModules;
        RingToneManagerMethod.getDefaultRingtoneUri()
            .then((uri: string[]) => {
                createChannelBeforePopUp({
                    channelId: channelId,
                    soundUri: uri,
                    notId: notId,
                    title: title,
                    msg: msg,
                    answered: answered,
                    record: record,
                })
            })
            .catch((err: any) => {
                createChannelBeforePopUp({
                    soundUri: undefined,
                    channelId: channelId,
                    notId: notId,
                    title: title,
                    msg: msg,
                    answered: answered,
                    record: record,
                })
            });
    } else {
        createChannelBeforePopUp({
            soundUri: undefined,
            channelId: channelId,
            notId: notId,
            title: title,
            msg: msg,
            answered: answered,
            record: record,
        })
    }

};

export const createChannelBeforePopUp = async ({ notId, title, msg, answered, record, channelId, soundUri }: { notId: string, title: string, msg: string, answered: boolean, record: {}, channelId: string, soundUri: string[] | undefined }) => {
    if (answered) {
        await notifee.createChannel(
            {
                id: channelId,
                name: 'Call Channel',
                description: 'A channel to categories your appointment notifications',
                importance: AndroidImportance.LOW,
                vibration: false,
                visibility: AndroidVisibility.PUBLIC,
            },
        );
    }
    notifee.setNotificationCategories([
        {
            id: 'appointment',
            actions: [
                {
                    id: 'hangUp',
                    title: 'Hang Up',
                },
            ],
            intentIdentifiers: [IOSIntentIdentifier.START_VIDEO_CALL],
            allowInCarPlay: true,
        },
        {
            id: 'appointment-answered',
            actions: [
                {
                    id: 'cancel',
                    title: 'cancel',
                },
                {
                    id: 'join',
                    title: 'join',
                    foreground: true,
                    authenticationRequired: true,
                },
            ],
            intentIdentifiers: [IOSIntentIdentifier.START_VIDEO_CALL],
            allowInCarPlay: true,
        }
    ]).then(() => {
        popUpOngoingNotification({
            notId: notId,
            channelId: channelId,
            data: record,
            title: title,
            msg: msg,
            answered: answered,
            soundUri: soundUri,
        })
    }).catch(() => {
        popUpOngoingNotification({
            soundUri: soundUri,
            notId: notId,
            channelId: channelId,
            data: record,
            title: title,
            msg: msg,
            answered: answered,
        })
    });
}

export const popUpOngoingNotification = ({ notId, channelId, data, title, msg, answered, soundUri }: { notId: string, channelId: string, data: {}, title: string, msg: string, answered: boolean, soundUri: string[] | undefined }) => {
    notifee.displayNotification({
        id: notId,
        title: title,
        body: msg,
        data: data,

        android: {
            lightUpScreen: !answered,
            autoCancel: false,
            category: AndroidCategory.CALL,
            color: MAIN,
            colorized: true,
            ongoing: true,
            loopSound: answered ? false : true,
            flags: [AndroidFlags.FLAG_INSISTENT, AndroidFlags.FLAG_NO_CLEAR],
            onlyAlertOnce: answered,
            importance: answered ? AndroidImportance.LOW : AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            sound: soundUri !== undefined ? soundUri?.[1] : 'Default',
            channelId: channelId,
            actions: answered ? [
                {
                    title: 'Hang Up',
                    pressAction: {
                        id: 'hangUp',
                    }
                },
            ] : [
                {
                    title: 'cancel',
                    pressAction: {
                        id: 'Cancel'
                    }
                },
                {
                    title: 'Join',
                    pressAction: {
                        id: 'join',
                        mainComponent: 'medeasy',
                    }
                }
            ]
        },
        ios: {
            sound: answered ? undefined : 'default',
            interruptionLevel: answered ? 'active' : 'critical',
            critical: true,
            criticalVolume: 0.9,
            foregroundPresentationOptions: {
                badge: true,
                sound: !answered,
                banner: !answered,
                list: !answered,
            },
            categoryId: answered ? 'appointment-answered' : 'appointment'
        }
    })
};

export const cancelNotify = (notId: string) => {
    notifee.cancelNotification(notId);
}