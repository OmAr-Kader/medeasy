import { Notifier, NotifierComponents } from 'react-native-notifier';
import React from 'react';
import NetInfo from '@react-native-community/netinfo';
import messaging from '@react-native-firebase/messaging';
import { navigateToScreenFromNotification, onForegroundMessage } from './notifyNavigator';
import notifee from '@notifee/react-native';
import { handleNotify, handleNotifyForeground } from './notify';

export const checkNetworkStats = () => {
    const handler = React.useRef<NodeJS.Timeout | null>(null);
    NetInfo.addEventListener((state) => {
        if (!state.isConnected) {
            if (handler.current) {
                clearTimeout(handler.current)
            }
            handler.current = setTimeout(() => {
                Notifier.showNotification({
                    title: 'Network state',
                    description: 'Network disconnected, please check it',
                    duration: 3000,
                    Component: NotifierComponents.Alert,
                    componentProps: {
                        alertType: 'error',
                    },
                });
            }, 2000)
        }
    });
}

export const checkNewMessage = (isDarkMode: boolean, invoke: (map: any) => void, spinner: (bool: boolean) => void) => {
    notifee.onForegroundEvent(({ type, detail }) => {
        handleNotifyForeground(type, detail, (data) => {
            spinner(true)
            navigateToScreenFromNotification({
                data: { id: data.id, type: Number(data.type), navigator: String(data.navigator) },
                isDarkMode: isDarkMode,
            }, invoke, () => { spinner(false) })
        })
        return true;
    });
    return messaging().onMessage(remoteMessage => {
        onForegroundMessage(isDarkMode, remoteMessage, invoke, spinner)
    })
}