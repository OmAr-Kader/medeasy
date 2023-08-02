import { Notifier, NotifierComponents } from "react-native-notifier";
import * as CONST from "../global/const";
import * as COL from "../global/styles";
import { findMultiPref, findPref, isAllSafeToUse, removeMultiPref } from "../global/utils";
import { fetchDoctorDocument, fetchExaminationDocument } from "./fireStore";

export const onForegroundMessage = (isDarkMode: boolean, remoteMessage: any, invoke: (map: any) => void, spinner: (bool: boolean) => void) => {
    const data = remoteMessage?.data;
    const notification = remoteMessage?.notification;
    const tittle = notification?.title;
    const body = notification?.body;
    const containerStyle: {} = NotifierComponents.Notification.defaultProps?.containerStyle ?? {}
    const titleStyle: {} = NotifierComponents.Notification.defaultProps?.titleStyle ?? {}
    const descriptionStyle: {} = NotifierComponents.Notification.defaultProps?.descriptionStyle ?? {}
    isAllSafeToUse([tittle, body, data], () => {
        Notifier.showNotification({
            title: tittle,
            description: body,
            duration: 0,
            Component: NotifierComponents.Notification,
            componentProps: {
                containerStyle: {
                    ...containerStyle,
                    backgroundColor: isDarkMode ? COL.DARK_BLUE : COL.LIGHT_BLUE,
                },
                titleStyle: {
                    ...titleStyle,
                    color: isDarkMode ? COL.WHITE : COL.BLACK,
                },
                descriptionStyle: {
                    ...descriptionStyle,
                    color: isDarkMode ? COL.WHITE_200 : COL.BLACK_55,
                },
            },
            onPress: () => {
                spinner(true)
                navigateToScreenFromNotification({
                    data: data,
                    isDarkMode: isDarkMode,
                }, (map: any) => {
                    invoke(map);
                }, () => spinner(false))
            },
        });
    })
}

export const checkForIntent = (isDarkMode: boolean, doNavigate: (map: any) => void, spinner: () => void) => {
    findMultiPref(
        [CONST.NOTIFICATION_NAVIGATOR, CONST.NOTIFICATION_TYPE, CONST.NOTIFICATION_DOC_ID],
        (values) => {
            try {
                const navigator = values[0][1]
                const type = values[1][1]
                const id = values[2][1]
                isAllSafeToUse([navigator, id, type], () => {
                    navigateToScreenFromNotification({
                        data: { id: id, type: Number(type), navigator: String(navigator) },
                        isDarkMode: isDarkMode,
                    }, doNavigate, spinner)
                }, () => spinner())
            } catch (e) {
                spinner()
            }
            removeMultiPref([CONST.NOTIFICATION_NAVIGATOR, CONST.NOTIFICATION_TYPE, CONST.NOTIFICATION_DOC_ID], () => { });
        },
        () => spinner()
    );
}

export const navigateToScreenFromNotification = ({ data, isDarkMode }: { data: any, isDarkMode: boolean }, doNavigate: (map: any) => void, spinner: () => void) => {
    const typeNumber = Number(data.type);
    const id = String(data.id);
    //{ navigatorTag: , data:  }
    if (typeNumber === CONST.FCM_NEW_DOCTOR_CONFIRMATION) {  // FromDoctorToAdmin
        fetchDoctorDocument(id, (doctor) => {
            doNavigate({ navigatorTag: CONST.DOCTOR_DETAIL_ADMIN, data: { isDark: isDarkMode, data: doctor.asJsonAll() } })
        }, spinner)
    } else if (typeNumber === CONST.FCM_TREATMENT_CHANGED) { // FromToCLient
        fetchExaminationDocument(id, (examination) => {
            doNavigate({ navigatorTag: CONST.APPOINTMENT_SCREEN, data: { isDark: isDarkMode, data: examination.asJsonAll(), modeApp: CONST.EDIT_SAVE_EDITABLE_INTI_NOT, newAp: [] } })
        }, spinner)
    } else if (typeNumber === CONST.FCM_APPOINTMENT_REMINDER) { // ToDoctor
        fetchExaminationDocument(id, (examination) => {
            doNavigate({ navigatorTag: CONST.APPOINTMENT_SCREEN, data: { isDark: isDarkMode, data: examination.asJsonAll(), modeApp: CONST.EDIT_SAVE_EDITABLE_INTI_NOT }})
        }, spinner)
    } else if (typeNumber === CONST.FCM_DOCTOR_CONFIRM) { // FromDoctorToClient
        fetchExaminationDocument(id, (examination) => {
            doNavigate({ navigatorTag: CONST.APPOINTMENT_SCREEN, data: { isDark: isDarkMode, data: examination.asJsonAll(), modeApp: CONST.EDIT_SAVE_EDITABLE_INTI_NOT } })
        }, spinner)
    } else if (typeNumber === CONST.FCM_NEW_APPOINTMENT_FOR_DOCTOR) { // FromCLientToDoctor
        fetchExaminationDocument(id, (examination) => {
            doNavigate({ navigatorTag: CONST.APPOINTMENT_SCREEN_DOCTOR, data: { isDark: isDarkMode, data: examination.asJsonAll(), newAp: [] }});
        }, spinner)
    } else if (typeNumber === CONST.FCM_APPOINTMENT_REMINDER_FOR_DOCTOR) { // ToDoctor
        fetchExaminationDocument(id, (examination) => {
            doNavigate({ navigatorTag: CONST.APPOINTMENT_SCREEN_DOCTOR, data: { isDark: isDarkMode, data: examination.asJsonAll()} })
        }, spinner)
    } else if (typeNumber === CONST.FCM_ADMIN_CONFIRM_NEW_DOCTOR) { // FromAdminToDoctor
        spinner();
    } else if (typeNumber === CONST.FCM_ADMIN_REJECT_NEW_DOCTOR) { // FromAdminToDoctor
        spinner();
    } else if (typeNumber === CONST.FCM_CALL) { // FromDoctorToClient
        findPref(CONST.USER_ID_AUTH, (userAuthID) => {
            doNavigate({ navigatorTag: CONST.VIDEO_CALL_SCREEN, data: { room: data.navigator, token: CONST.TEMP_TOKEN_2, userID: '2222', userName: data.time }})
        }, spinner)
    }
}
