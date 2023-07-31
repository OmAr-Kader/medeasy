import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExaminationSack, ProjectType } from './model';
import Clipboard from '@react-native-clipboard/clipboard';
import { KeyValuePair } from '@react-native-async-storage/async-storage/lib/typescript/types';
import React from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Notifier, NotifierComponents } from 'react-native-notifier';

export const pushLocalNotification = (tittle: string, body: string, isSuccess: boolean) => {
    Notifier.showNotification({
        title: tittle,
        description: body,
        Component: NotifierComponents.Alert,
        duration: 500,
        componentProps: {
            alertType: isSuccess ? 'success' : 'error',
        },
    });
}

export const netWorkState = () => {
    const [networkSate, setNetworkSate] = React.useState<boolean | null>(null);
    const [handler, setHandler] = React.useState<NodeJS.Timeout | null>(null);
    NetInfo.addEventListener((state) => {
        if (!state.isConnected) {
            if (handler) {
                clearTimeout(handler)
            }
            setHandler(
                setTimeout(() => {
                    if (!state.isConnected) {
                        Notifier.showNotification({
                            title: 'Network state',
                            description: 'Network disconnected, please check it',
                            Component: NotifierComponents.Alert,
                            componentProps: {
                                alertType: 'error',
                            },
                        });
                    }
                }, 1000)
            );
            setNetworkSate(false);
        } else if (state.isConnected && networkSate !== null) {
            if (handler) {
                clearTimeout(handler)
            }
            setHandler(
                setTimeout(() => {
                    if (state.isConnected) {
                        Notifier.showNotification({
                            title: 'Network state',
                            description: 'Network Connected ✔',
                            Component: NotifierComponents.Alert,
                            componentProps: {
                                alertType: 'success',
                            },
                        });
                    }
                }, 1000)
            )
            setNetworkSate(true);
        }
    });
}

export function isJsonSafeToArray<U extends any>(value: any, callbackfn: (value: U) => U): U[] {
    return value !== undefined && value instanceof Array ? value.map(callbackfn) : []
}

export function isArraySafeToJson<Y extends ProjectType>(value: Y[] | undefined, callbackfn: (value: Y) => any): any[] {
    return value !== undefined && value.length > 0 ? value.map(callbackfn) : []
}

export function isSafeToUse<T extends any>(value: any | null | undefined, safe: (value: T) => void, notSafe?: () => void) {
    value !== null && value !== undefined ? safe(value) : notSafe?.();
}

export function isAllSafeToUse(values: any[], safe: (values: any[]) => void, notSafe?: () => void) {
    var isAllSave = true;
    for (var value of values) {
        if (value === null || value === undefined) {
            isAllSave = false
            break;
        }
    }
    isAllSave ? safe(values) : notSafe?.()
}

export const findPref = (key: string, invoke: (value: string) => void, failed: () => void) => {
    AsyncStorage.getItem(key).then((value) => {
        value !== null ? invoke(value) : failed();
    }).catch((e) => {
        failed();
        console.log('AsyncStorage: ' + e);
    });
};

export const findPrefOrNull = (key: string, invoke: (value: string | null) => void, failed: () => void) => {
    AsyncStorage.getItem(key).then((value) => {
        invoke(value);
    }).catch((e) => {
        failed();
        console.log('AsyncStorage: ' + e);
    });
};

export const findMultiPref = (key: string[], invoke: (values: readonly KeyValuePair[]) => void, failed: () => void) => {
    AsyncStorage.multiGet(key).then((values) => {
        invoke(values);
    }).catch((e) => {
        failed();
        console.log('AsyncStorage: ' + e);
    });
};

export const updatePref = (key: string, value: string, invoke: () => void, failed?: () => void) => {
    AsyncStorage.setItem(key, value).then(() => {
        invoke();
    }).catch((e) => {
        failed?.();
        console.log('AsyncStorage: ' + e);
    });
};

export const updateMuliPref = (keyVale: [string, string][], invoke: () => void, failed: () => void) => {
    AsyncStorage.multiSet(keyVale).then(() => {
        invoke();
    }).catch((e) => {
        failed();
        console.log('AsyncStorage: ' + e);
    });
};

export const removeMultiPref = (keys: string[], invoke: () => void, failed?: () => void) => {
    AsyncStorage.multiRemove(keys).then(() => {
        invoke();
    }).catch((e) => {
        failed?.();
        console.log('AsyncStorage: Remove ' + e);
    });
};

export const formatHourAmPm = (
    hour: number
) => hour === 0 ? '12 AM' : (hour < 12 ? `${hour} AM` : (hour === 12 ? '12 PM' : `${hour - 12} PM`))

export function formatAmPm(date: number) {
    var hours = new Date(date).getHours();
    const amPm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return hours + ' ' + amPm;
}

export const convertDateToMonthAndDay = (dateN: number): string => {
    var fullDate = new Date(Number(dateN));
    var monStr = '';
    switch (fullDate.getMonth() + 1) {
        case 1:
            monStr = 'Jan';
            break;
        case 2:
            monStr = 'Feb';
            break;
        case 3:
            monStr = 'Mar';
            break;
        case 4:
            monStr = 'Apr';
            break;
        case 5:
            monStr = 'May';
            break;
        case 6:
            monStr = 'Jun';
            break;
        case 7:
            monStr = 'Jul';
            break;
        case 8:
            monStr = 'Aug';
            break;
        case 9:
            monStr = 'Sep';
            break;
        case 10:
            monStr = 'Oct';
            break;
        case 11:
            monStr = 'Nov';
            break;
        case 12:
            monStr = 'Dec';
            break;
    }
    return monStr + ' ' + fullDate.getDate();
};

export const appointmentTitle = (value: ExaminationSack) => {
    return value.examinationName.length !== 0 ? value.examinationName : 'Dr. ' + firstCapital(value.communicationMethods.doctorName) + ' ' + convertDateToMonthAndDay(value.date) + '-' + formatAmPm(value.date);
};

export const appointmentTitleForDoctor = (value: ExaminationSack) => {
    return value.examinationNameDoctor.length !== 0 ? value.examinationNameDoctor : 'Mr. ' + firstCapital(value.communicationMethods.clientName) + ' ' + convertDateToMonthAndDay(value.date) + '-' + formatAmPm(value.date);
};

export const firstCapital = (txt: string) => txt.length > 1 ? txt.substring(0, 1).toLocaleUpperCase() + txt.substring(1, txt.length) : txt;

export const copyToClip = (text: string) => {
    Clipboard.setString(text);
};

export const getNextDayOfTheWeek = ({ nativeDayId, hour }: { nativeDayId: number, hour: number }, now: Date) => {
    var next = new Date(now)
    let day = nativeDayId;
    if (day > 6 || day < 0) {
        day = 0;
    }
    while (next.getDay() != day) {
        next.setDate(next.getDate() + 1);
    }
    next.setHours(hour, 0, 0, 0)
    return next;
}

/*
export const mapRecordToMap = (data: Record<string, string>): Map<string, string> => {
    const myReturn = new Map<string, string>();
    Object.entries<string>(data).forEach(([key, value]) => {
        myReturn.set(key as string, value as string);
    });

    return myReturn;
};
*/