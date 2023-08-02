import React from 'react';
import { DeviceEventEmitter, EmitterSubscription, Keyboard, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableHighlight, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { AddIcon, BackArrow, Delete } from '../../assets/logo';
import { fetchUserByDocument, fireBaseEditExamination } from '../../firebase/fireStore';
import { AutoCompleteList, DialogTwoButtonAlert, EditSaveTextInput, FlatListed, ProfilePic } from '../../global/baseView';
import * as CONST from '../../global/const';
import { FetchIsDarkMode, navbarHeight } from '../../global/dims';
import { MedicineSack, jsonToExamination } from '../../global/model';
import * as COL from '../../global/styles';
import { appointmentTitle, appointmentTitleForDoctor, convertDateToMonthAndDay, findPref, firstCapital, formatAmPm, pushLocalNotification } from '../../global/utils';

import Dialog from 'react-native-dialog';
import Spinner from 'react-native-loading-spinner-overlay';
import { sendFcmMessage } from '../../firebase/firebaseMessaging';
import { scheduleNotification } from '../../firebase/notify';

type Props = {
    dataList: MedicineSack[],
    treatmentAutoComplete: string[],
    doseFormAutoComplete: string[],
    treatmentAutoCompleteVis: boolean,
    doseFormAutoCompleteVis: boolean,
    numberOfLines: number,
    doctorNote: string,
    doctorAccepted: boolean,
    dialogRemoveTreatmentVisible: boolean,
    dialogRemoveTreatment: MedicineSack | undefined,
    spinner: boolean,
    medTxt: string,
    doseTxt: string,
    medNoteTxt: string,
    dialogMedicineVisible: boolean
}

type IProps = {
    dataList?: MedicineSack[],
    treatmentAutoComplete?: string[],
    doseFormAutoComplete?: string[],
    treatmentAutoCompleteVis?: boolean,
    doseFormAutoCompleteVis?: boolean,
    numberOfLines?: number,
    doctorNote?: string,
    doctorAccepted?: boolean,
    dialogRemoveTreatmentVisible?: boolean,
    dialogRemoveTreatment?: MedicineSack | undefined,
    spinner?: boolean,
    medTxt?: string,
    doseTxt?: string,
    medNoteTxt?: string,
    dialogMedicineVisible?: boolean
}

const AppointmentDoctorScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { isDark } = route.params;
    const isDarkMode: boolean = route !== undefined && route.params != null ? isDark : FetchIsDarkMode();
    const { data } = route.params;

    const examination = jsonToExamination(data, data.documentId);

    const [state, dispatch] = React.useReducer<(prevState: Props, action: IProps) => Props>(
        (state: Props, newState: IProps) => ({ ...state, ...newState }),
        {
            dataList: examination.medicines,
            treatmentAutoComplete: CONST.TREATMENT_LIST,
            doseFormAutoComplete: CONST.DOSE_FORM_LIST,
            treatmentAutoCompleteVis: false,
            doseFormAutoCompleteVis: false,
            numberOfLines: 1,
            doctorNote: examination.doctorNote,
            doctorAccepted: examination.doctorAccepted,
            dialogRemoveTreatmentVisible: false,
            dialogRemoveTreatment: undefined,
            spinner: false,
            medTxt: '',
            doseTxt: '',
            medNoteTxt: '',
            dialogMedicineVisible: false
        } as Props,
    );

    const isValidTime = examination.date > Date.now() - (60 * 60 * 1000);

    const medRef = React.useRef<TextInput>(null);
    const doseRef = React.useRef<TextInput>(null);
    const medNoteRef = React.useRef<TextInput>(null);

    const emitterSubscription = React.useRef<EmitterSubscription | null>(null)

    const clearEmitter = () => {
        try {
            if (emitterSubscription.current !== null) {
                emitterSubscription.current?.remove();
                emitterSubscription.current = null;
            }
        } catch (e) { }
    }

    const keyboardListener = () => {
        if (emitterSubscription.current !== null) {
            return;
        }
        emitterSubscription.current = Keyboard.addListener('keyboardDidHide', () => {
            dispatch({ treatmentAutoCompleteVis: false, doseFormAutoCompleteVis: false })
        });
    };

    const renderItem = ({ item, index }: { item: MedicineSack, index: number }) => {
        return recyclerChildMedicine(item, index, isDarkMode, () => {
            dispatch({ dialogRemoveTreatment: item, dialogRemoveTreatmentVisible: true })
        });
    };

    const removeTreatment = (item: MedicineSack) => {
        updateSpinner(true);
        var newMedicines = state.dataList.filter((it) => it !== item);
        var newMap: {}[] = [];
        newMedicines.map((medicine) => newMap.push(medicine.asJson()));
        fireBaseEditExamination(examination.documentId, 'medicines', newMap, () => {
            dispatch({ dataList: newMedicines, dialogRemoveTreatmentVisible: false, spinner: false })
            DeviceEventEmitter.emit(CONST.REFRESH_APPOINTMENT, []);
            sendFcmMessage({
                token: examination.communicationMethods.userFcmToken,
                data: { id: examination.documentId, navigator: CONST.APPOINTMENT_SCREEN, type: CONST.FCM_TREATMENT_CHANGED },
                tittle: 'New Treatment',
                msg: 'A treatment has just been changed: ' + appointmentTitle(examination),
            });
            pushLocalNotification('Done', '', true);
        }, () => {
            updateSpinner(false);
            pushLocalNotification('Failed', '', false);
        });
    };

    const makeCall = () => {
        sendFcmMessage({
            token: examination.communicationMethods.userFcmToken,
            data: { id: CONST.TEMP_TOKEN_2, time: examination.communicationMethods.clientName, type: CONST.FCM_CALL, navigator: examination.examinationKey },
            tittle: `Doctor ${examination.communicationMethods.doctorName}`,
            msg: `Doctor is calling you as scheduled`,
        }, () => {
            findPref(CONST.USER_ID_AUTH, (auth) => {
                navigation.navigate(CONST.VIDEO_CALL_SCREEN, { userID: auth, token: CONST.TEMP_TOKEN_1, room: examination.examinationKey, userName: examination.communicationMethods.doctorName })
            }, () => { })
        }, () => pushLocalNotification('Failed', '', false))
    }

    const doctorConfirm = () => {
        updateSpinner(true);
        fireBaseEditExamination(examination.documentId, 'doctorAccepted', true, () => {
            dispatch({ doctorAccepted: true })
            DeviceEventEmitter.emit(CONST.REFRESH_APPOINTMENT, []);
            pushLocalNotification('Done', '', true);
            updateSpinner(false);
            sendFcmMessage({
                token: examination.communicationMethods.userFcmToken,
                data: { id: examination.documentId, navigator: CONST.APPOINTMENT_SCREEN, type: CONST.FCM_DOCTOR_CONFIRM, time: examination.date },
                tittle: 'Doctor Confirm',
                msg: `Doctor ${examination.communicationMethods.doctorName} confirm the appointment ${convertDateToMonthAndDay(examination.date) + '-' + formatAmPm(examination.date)}`,
            });
            scheduleNotification({
                title: 'Appointment date',
                msg: 'you have a scheduled appointment',
                time: examination.date,
                navigator: CONST.APPOINTMENT_SCREEN,
                id: examination.documentId,
                type: CONST.FCM_APPOINTMENT_REMINDER_FOR_DOCTOR,
                hasteMinutes: 5,
            });
        }, () => {
            pushLocalNotification('Failed', '', false);
        });
    };

    const editExamination = () => {
        if (state.medTxt.length === 0) {
            pushLocalNotification('Empty', 'Shouldn\'t be empty', false);
            return;
        }
        if (state.doseTxt.length === 0) {
            pushLocalNotification('Empty', 'Shouldn\'t be empty', false);
            return;
        }
        if (state.medNoteTxt.length === 0) {
            pushLocalNotification('Empty', 'Shouldn\'t be empty', false);
            return;
        }
        updateSpinner(true);
        var newMedicines = state.dataList;
        newMedicines.push(new MedicineSack(state.medTxt, state.doseTxt, state.medNoteTxt));
        var newMap: {}[] = [];
        newMedicines.map((medicine) => newMap.push(medicine.asJson()));
        fireBaseEditExamination(examination.documentId, 'medicines', newMap, () => {
            DeviceEventEmitter.emit(CONST.REFRESH_APPOINTMENT, []);
            Keyboard.removeAllListeners('keyboardDidHide');
            dispatch({ dataList: newMedicines, dialogMedicineVisible: false, medTxt: '', doseTxt: '', medNoteTxt: '' })
            sendFcmMessage({
                token: examination.communicationMethods.userFcmToken,
                data: { id: examination.documentId, navigator: CONST.APPOINTMENT_SCREEN, type: CONST.FCM_TREATMENT_CHANGED },
                tittle: 'New Treatment',
                msg: 'A treatment has just been changed: ' + appointmentTitle(examination),
            });
            updateSpinner(false);
            pushLocalNotification('Done', '', true);
        }, () => {
            updateSpinner(false);
            pushLocalNotification('Failed', '', false);
        });
    };

    const makeVisible = () => {
        dispatch({ dialogMedicineVisible: true })
        setTimeout(() => {
            medRef?.current?.focus();
        }, 100);
    };

    const updateSpinner = (enable: boolean) => {
        if (enable) {
            dispatch({ spinner: true })
            setTimeout(() => {
                dispatch({ spinner: false })
            }, 3000);
        } else {
            dispatch({ spinner: false })
        }
    };

    const stylesColorMain = COL.stylesColorMain(isDarkMode)
    return <SafeAreaView style={stylesColorMain.backStyle}>
        <StatusBar translucent={false} backgroundColor={isDarkMode ? Colors.darker : Colors.lighter} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Spinner
            visible={state.spinner}
            textContent={'Loading...'}
            color={isDarkMode ? COL.WHITE : COL.BLACK}
            textStyle={{ color: isDarkMode ? COL.WHITE : COL.BLACK }}
            animation={'fade'}
            cancelable={false}
            overlayColor={isDarkMode ? COL.SHADOW_WHITE : COL.SHADOW_BLACK}
        />
        <View style={COL.stylesMain.mainContainer}>
            <View style={COL.stylesMain.headerContainer}>
                <View style={styles.titleScreenContainer}>
                    <EditSaveTextInput
                        isDarkMode={isDarkMode}
                        mode={state.doctorAccepted ? CONST.EDIT_SAVE_EDITABLE_INTI_NOT : CONST.EDIT_SAVE_ALL_OFF}
                        multiline={false}
                        style={stylesColorful(isDarkMode).doctorNameStyle}
                        defaultText={firstCapital(appointmentTitleForDoctor(examination))}
                        flex={0}
                        onChange={() => { }}
                        onSave={(text) => {
                            fireBaseEditExamination(examination.documentId, 'examinationNameDoctor', text, () => {
                                DeviceEventEmitter.emit(CONST.REFRESH_APPOINTMENT, ([]));
                                pushLocalNotification('Done', '', true);
                            }, () => pushLocalNotification('Failed', '', false));
                        }} />
                    <TouchableHighlight
                        style={styles.doctorClickName}
                        underlayColor={COL.MAIN_PALE}
                        onPress={() => {
                            updateSpinner(true);
                            fetchUserByDocument(examination.communicationMethods.clientID, (doctor) => {
                                updateSpinner(false);
                                navigation.replace(CONST.CLIENT_DETAIL, { data: doctor?.asJsonAll(), isDark: isDarkMode, doctorDocID: examination.communicationMethods.doctorID });
                            }, () => {
                                updateSpinner(false);
                                pushLocalNotification('Failed', '', false);
                            });
                        }}>
                        <Text style={styles.doctorSpecialist}>{'Mr.' + firstCapital(examination.communicationMethods.clientName)}</Text>
                    </TouchableHighlight>
                </View>
                <View style={COL.stylesMain.headerIconsContainer}>
                    <TouchableHighlight style={COL.stylesMain.menuButton} underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                        onPress={() => navigation.goBack()}>
                        <BackArrow color={isDarkMode ? COL.WHITE : COL.BLACK} />
                    </TouchableHighlight>
                    <View style={COL.stylesMain.profileButton}>
                        <TouchableHighlight
                            onPress={() => {
                                updateSpinner(true)
                                fetchUserByDocument(examination.communicationMethods.clientID, (doctor) => {
                                    updateSpinner(false);
                                    navigation.replace(CONST.CLIENT_DETAIL, { data: doctor?.asJsonAll(), isDark: isDarkMode, doctorDocID: examination.communicationMethods.doctorID });
                                }, () => {
                                    updateSpinner(false);
                                    pushLocalNotification('Failed', '', false);
                                });
                            }}
                            underlayColor={COL.MAIN_WHITER}>
                            <ProfilePic style={COL.stylesMain.profilePic} uri={examination.communicationMethods.clientImg} />
                        </TouchableHighlight>
                    </View>
                </View>
            </View>
            <ScrollView contentInsetAdjustmentBehavior="automatic"
                overScrollMode={'always'}
                keyboardShouldPersistTaps={'handled'}
                keyboardDismissMode={'interactive'}
                contentContainerStyle={COL.stylesMain.scrollStyle}>
                <View style={stylesColorful(isDarkMode).bioStyleMain}>
                    <View style={stylesColorful(isDarkMode).bioStyle}>
                        <Text style={stylesColorful(isDarkMode).bioTextTitleStyle}>Main complaint</Text>
                        <Text style={stylesColorful(isDarkMode).bioTextStyle}>{examination.clientNote}</Text>
                    </View>
                </View>
                <View style={!state.doctorAccepted ? styles.noteContainerHidden : styles.noteContainer}>
                    <Text style={stylesColorful(isDarkMode).bioTextTitleStyle}>Doctor's diagnosis</Text>
                    <EditSaveTextInput
                        isDarkMode={isDarkMode}
                        mode={CONST.EDIT_SAVE_EDITABLE_INTI_NOT}
                        multiline={true}
                        style={stylesColorful(isDarkMode).doctorNameStyle}
                        defaultText={state.doctorNote}
                        flex={0}
                        minWidth={135}
                        hint={'write diagnosis'}
                        onChange={(text: string) => {
                            dispatch({ doctorNote: text })
                        }}
                        onSave={(text) => {
                            fireBaseEditExamination(examination.documentId, 'doctorNote', text, () => {
                                DeviceEventEmitter.emit(CONST.REFRESH_APPOINTMENT, []);
                                pushLocalNotification('Done', '', true);
                            }, () => pushLocalNotification('Failed', '', false));
                        }} />
                </View>
                <View style={stylesColorMain.backListFourCorner}>
                    <Text style={stylesColorful(isDarkMode).medTextTitleStyle}>Treatments</Text>
                    <TouchableHighlight
                        style={state.doctorAccepted ? styles.addButton : styles.addButtonHidden}
                        underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                        onPress={makeVisible}>
                        <AddIcon color={isDark ? COL.MAIN_PALE : COL.MAIN_WHITER} />
                    </TouchableHighlight>
                    <View style={styles.flatListStyle}>
                        <FlatListed
                            data={state.dataList}
                            renderItem={renderItem}
                            scrollEnabled={false}
                            isDarkMode={isDarkMode}
                            emptyMessage={state.spinner ? '' : 'No treatments yet'} />
                    </View>
                </View>
            </ScrollView>
            <View style={!state.doctorAccepted ? styles.bookButtonContainer : (state.doctorAccepted && isValidTime ? styles.bookButtonContainer : styles.bookButtonContainerHidden)}>
                <TouchableHighlight
                    style={!state.doctorAccepted ? stylesColorful(false).bottomButton : (state.doctorAccepted && isValidTime ? stylesColorful(false).bottomButtonCall : stylesColorful(false).bottomButton)}
                    onPress={!state.doctorAccepted ? doctorConfirm : (state.doctorAccepted && isValidTime ? makeCall : doctorConfirm)}
                    underlayColor={COL.MAIN_WHITER}>
                    <Text style={styles.textBottom}>{!state.doctorAccepted ? 'Accept' : (state.doctorAccepted && isValidTime ? 'Call Now' : 'Accept')}</Text>
                </TouchableHighlight>
            </View>
        </View>
        <Dialog.Container
            visible={state.dialogMedicineVisible}
            contentStyle={styles.dialogStyle}
            onBackdropPress={() => {
                dispatch({ medTxt: '', doseTxt: '', medNoteTxt: '', dialogMedicineVisible: false })
                clearEmitter()
            }}
            onRequestClose={() => {
                dispatch({ medTxt: '', doseTxt: '', medNoteTxt: '', dialogMedicineVisible: false })
                clearEmitter()
            }}>
            <Dialog.Title>Add Treatment</Dialog.Title>
            <Dialog.Input
                style={stylesColorful(isDarkMode).textInputMed}
                textInputRef={medRef}
                placeholder="Treatment Name"
                value={state.medTxt}
                returnKeyType="next"
                multiline={false}
                autoCorrect={false}
                onFocus={keyboardListener}
                onBlur={() => dispatch({ treatmentAutoCompleteVis: false })}
                onSubmitEditing={() => {
                    doseRef?.current?.focus();
                    dispatch({ treatmentAutoCompleteVis: false })
                }}
                placeholderTextColor={isDarkMode ? COL.WHITE_200 : COL.BLACK_46}
                onChangeText={(newText) => {
                    const treatment = CONST.TREATMENT_LIST.filter((it) => it.toLowerCase().includes(newText.toLowerCase()))
                    if (state.treatmentAutoCompleteVis && newText?.length === 0) {
                        dispatch({ treatmentAutoCompleteVis: false, medTxt: newText, treatmentAutoComplete: treatment })
                    } else if (!state.treatmentAutoCompleteVis && newText?.length !== 0) {
                        dispatch({ treatmentAutoCompleteVis: true, medTxt: newText, treatmentAutoComplete: treatment })
                    } else {
                        dispatch({ medTxt: newText, treatmentAutoComplete: treatment })
                    }
                }}
            />
            <Dialog.Input
                style={stylesColorful(isDarkMode).textInputMed}
                textInputRef={doseRef}
                placeholder="Dose form"
                value={state.doseTxt}
                returnKeyType="next"
                multiline={false}
                autoCorrect={false}
                onFocus={keyboardListener}
                onBlur={() => dispatch({ doseFormAutoCompleteVis: false })}
                onSubmitEditing={() => {
                    medNoteRef?.current?.focus();
                    dispatch({ doseFormAutoCompleteVis: false })
                }}
                placeholderTextColor={isDarkMode ? COL.WHITE_200 : COL.BLACK_46}
                onChangeText={(newText) => {
                    const newList = CONST.DOSE_FORM_LIST.filter((it) => it.toLowerCase().includes(newText.toLowerCase()))
                    if (state.doseFormAutoCompleteVis && state.doseTxt?.length === 0) {
                        dispatch({ doseFormAutoCompleteVis: false, doseTxt: newText, doseFormAutoComplete: newList })
                    } else if (!state.doseFormAutoCompleteVis && state.doseTxt?.length !== 0) {
                        dispatch({ doseFormAutoCompleteVis: true, doseTxt: newText, doseFormAutoComplete: newList })
                    } else {
                        dispatch({ doseTxt: newText, doseFormAutoComplete: newList })
                    }
                }}
            />
            <Dialog.Input
                style={stylesColorful(isDarkMode).textInputMedBottom}
                textInputRef={medNoteRef}
                placeholder="Note"
                returnKeyType="done"
                value={state.medNoteTxt}
                multiline={true}
                numberOfLines={state.numberOfLines}
                aria-multiline={true}
                autoCorrect={false}
                onSubmitEditing={editExamination}
                placeholderTextColor={isDarkMode ? COL.WHITE_200 : COL.BLACK_46}
                onChangeText={(newText) => {
                    dispatch({ medNoteTxt: newText, numberOfLines: newText.split('\n').length })
                }}
            />
            <Dialog.Button label="Cancel"
                color={COL.MAIN}
                onPress={() => {
                    dispatch({ medTxt: '', doseTxt: '', medNoteTxt: '', dialogMedicineVisible: false })
                    clearEmitter()
                }} />
            <Dialog.Button label="Add" color={COL.MAIN_WHITER} onPress={editExamination} />
            <AutoCompleteList
                isDark={isDarkMode}
                isHidden={!state.treatmentAutoCompleteVis}
                list={state.treatmentAutoComplete}
                style={stylesColorful(isDark).autoCompleteListTreatment}
                onPress={(text) => {
                    dispatch({ treatmentAutoCompleteVis: false, medTxt: text })
                }} />
            <AutoCompleteList
                isDark={isDarkMode}
                isHidden={!state.doseFormAutoCompleteVis}
                list={state.doseFormAutoComplete}
                style={stylesColorful(isDark).autoCompleteListDose}
                onPress={(text) => {
                    dispatch({ doseFormAutoCompleteVis: false, doseTxt: text })
                }} />
        </Dialog.Container>
        <DialogTwoButtonAlert alertTitle={'Confirm'}
            positiveButton='Delete'
            negativeButton='Cancel'
            alertMsg={`Do you want to Remove ${state.dialogRemoveTreatment?.medicineName}`}
            data={state.dialogRemoveTreatment}
            visible={state.dialogRemoveTreatmentVisible && state.dialogRemoveTreatment !== undefined}
            invoke={(item) => {
                removeTreatment(item);
            }}
            cancel={() => {
                dispatch({ dialogRemoveTreatmentVisible: false })
            }} />
    </SafeAreaView>;
};

function recyclerChildMedicine(value: MedicineSack, index: number, isDarkMode: boolean, doDelete: () => void) {
    return <View style={styles.historyAppContainer}>
        <View style={styles.mainDoctorStyle}>
            <TouchableHighlight
                style={styles.deleteButton}
                underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                onPress={doDelete}>
                <Delete color={isDarkMode ? COL.WHITE : COL.BLACK} />
            </TouchableHighlight>
            <View style={styles.mainDoctorContent}>
                <View style={styles.doctorContainerNameStyle}>
                    <Text style={stylesColorful(isDarkMode).treatmentNameStyle}>
                        <Text style={stylesColorful(isDarkMode).treatmentNameHintStyle}> {'Name: '}</Text>
                        {value.medicineName}
                    </Text>
                    <Text style={stylesColorful(isDarkMode).doctorSpecialist}>{index === 0 ? 'Type: ' + value.dose : value.dose}</Text>
                    <Text style={stylesColorful(isDarkMode).medicineNoteNameStyle}>{value.doseNote}</Text>
                </View>
                <View style={styles.bottomLineContainerStyle}>
                    <View style={styles.bottomLineStyle} />
                </View>
            </View>
        </View>
    </View>;
}

const styles = StyleSheet.create({
    doctorClickName: {
        padding: 5,
        marginTop: -10,
    },
    pageContainer: {
        margin: 20,
        alignItems: 'center',
        flexDirection: 'column',
    },
    certificateTextBottom: {
        fontWeight: '700',
        fontSize: 16,
        flex: 1,
        marginTop: 10,
        marginEnd: 5,
        color: COL.WHITE,
        textTransform: 'capitalize',
    },
    page: {
        marginTop: 30,
        alignItems: 'center',
        flexDirection: 'column',
    },
    dialogStyle: { borderRadius: 20 },
    scrollHeaderContainer: {
        width: '100%',
        height: 50,
        alignSelf: 'baseline',
        position: 'absolute',
        backgroundColor: '#00000030',
    },
    profileButtonHidden: {
        width: 0,
        height: 0,
    },
    addButton: {
        width: 50,
        height: 50,
        padding: 12,
        top: 0,
        borderRadius: 25,
        position: 'absolute',
        end: 10,
    },
    deleteButton: {
        width: 50,
        height: 50,
        padding: 12,
        top: 20,
        borderRadius: 25,
        position: 'absolute',
        end: 10,
    },
    addButtonHidden: {
        width: 0,
        height: 0,
    },
    mainAppContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flex: 1,
        flexWrap: 'wrap',
        width: '100%',
        margin: 7,
    },
    historyAppContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flex: 1,
        flexWrap: 'wrap',
        width: '100%',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
        height: '100%',
    },
    noteContainer: {
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
        paddingStart: 60,
        paddingEnd: 60,
    },
    noteContainerDoctor: {
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
        paddingStart: 60,
    },
    noteContainerHidden: {
        width: 0,
        height: 0,
    },
    logoContainerLin: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainerVer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoStyle: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
        marginEnd: 10,
    },
    docImageStyle: {
        width: 249,
        height: 302,
        marginTop: 30,
    },
    textStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
    },
    textBottom: {
        fontWeight: '700',
        fontSize: 16,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 15,
        color: COL.WHITE,
        textTransform: 'capitalize',
    },
    bottomContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: navbarHeight,
    },
    searchView: {
        width: '100%',
        alignItems: 'center',
    },
    mainDoctorStyle: {
        width: '100%',
        borderRadius: 20,
    },
    mainDoctorContent: {
        width: '100%',
        alignItems: 'center',
        flexDirection: 'row',
        paddingTop: 7,
        paddingBottom: 7,
    },
    doctorContainerNameStyle: {
        marginStart: 10,
        width: '100%',
        flexGrow: 1,
        justifyContent: 'flex-start',
    },
    doctorSpecialist: {
        marginStart: 15,
        fontWeight: '500',
        fontSize: 18,
        color: COL.MAIN,
        marginEnd: 60,
    },
    clientTitle: {
        marginStart: 15,
        fontWeight: '500',
        fontSize: 18,
        color: COL.MAIN,
        marginEnd: 60,
    },
    leftArrowStyle: {
        width: 15,
        height: 15,
        marginStart: 50,
    },
    bottomLineContainerStyle: {
        width: '100%',
        height: 2,
        position: 'absolute',
        paddingStart: 40,
        paddingEnd: 40,
        bottom: 0,
    },
    bottomLineStyle: {
        width: '100%',
        height: 0.5,
        backgroundColor: COL.MAIN,
        bottom: 0,
    },
    bookButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 10,
        paddingBottom: 10,
        paddingEnd: 30,
        paddingStart: 30,
        height: 60,
        flexDirection: 'row',
    },
    bookButtonContainerHidden: {
        height: 0,
        width: 0,
    },
    displayCerButton: {
        width: 150,
        height: 45,
        backgroundColor: COL.MAIN,
        borderRadius: 15,
        elevation: 10,
        marginStart: 10,
        marginEnd: 10,
        shadowColor: COL.WHITE,
        alignItems: 'center',
    },
    titleScreenContainer: {
        alignItems: 'center',
        marginTop: 5,
        width: '100%',
        paddingStart: 60,
        paddingEnd: 60,
    },
    toggleViewStyle: {
        padding: 10,
        marginEnd: 10,
        width: 180,
    },
    activeToggleStyle: {
        color: COL.WHITE,
        fontSize: 14,
        fontWeight: '300',
    },
    toggleContainerBack: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingEnd: 5,
        justifyContent: 'space-between',
        width: '100%',
    },
    medMainContainer: {
        width: '100%',
    },
    flatListStyle: {
        marginTop: 20,
        width: '100%',
        minHeight: 100,
    },
});


const stylesColorful = (isDark: boolean) => {
    return StyleSheet.create({
        doctorNameStyle: {
            fontWeight: '700',
            fontSize: 18,
            marginStart: 5,
            marginEnd: 60,
            color: isDark ? COL.WHITE_200 : COL.BLACK_55,
        },
        treatmentNameStyle: {
            fontWeight: '700',
            fontSize: 18,
            marginStart: 5,
            marginEnd: 60,
            color: isDark ? COL.WHITE_200 : COL.BLACK_55,
        },
        treatmentNameHintStyle: {
            fontWeight: '700',
            fontSize: 18,
            marginStart: 5,
            color: isDark ? COL.MAIN_PALE : COL.MAIN_WHITER,
        },
        doseTypeStyle: {
            marginStart: 5,
            fontWeight: '500',
            fontSize: 18,
            color: isDark ? COL.WHITE_200 : COL.BLACK_55,
            marginEnd: 60,
        },
        doseTypeHintStyle: {
            fontWeight: '500',
            fontSize: 18,
            color: isDark ? COL.MAIN_PALE : COL.MAIN_WHITER,
        },
        medicineNoteNameStyle: {
            fontWeight: '500',
            fontSize: 16,
            color: isDark ? COL.WHITE_200 : COL.BLACK_55,
            marginStart: 15,
            marginEnd: 60,
            marginTop: 5,
        },
        bioStyleMain: {
            padding: 20,
        },
        bioStyle: {
            flexDirection: 'column',
            borderRadius: 30,
            elevation: 10,
            padding: 10,
            shadowColor: COL.WHITE,
            backgroundColor: isDark ? COL.BLACK_55 : COL.WHITE_200,
        },
        bioTextTitleStyle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: isDark ? COL.WHITE : COL.BLACK,
        },
        medTextTitleStyle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginStart: 15,
            marginTop: 15,
            color: isDark ? COL.WHITE : COL.BLACK,
        },
        bioTextStyle: {
            fontSize: 16,
            fontWeight: '500',
            marginStart: 10,
            marginTop: 10,
            textAlign: 'left',
            color: isDark ? COL.WHITE : COL.BLACK,
        },
        bottomButton: {
            width: 150,
            height: 50,
            backgroundColor: COL.GREEN_CALL,
            borderRadius: 25,
            elevation: 10,
            marginStart: 10,
            marginEnd: 10,
            shadowColor: COL.WHITE,
            alignItems: 'center',
        },
        bottomButtonCall: {
            width: 150,
            height: 50,
            backgroundColor: COL.GREEN_CALL,
            borderRadius: 10,
            elevation: 10,
            marginStart: 10,
            marginEnd: 10,
            shadowColor: COL.WHITE,
            alignItems: 'center',
        },
        doctorSpecialist: {
            marginStart: 15,
            fontWeight: '500',
            fontSize: 18,
            color: isDark ? COL.WHITE_200 : COL.BLACK_55,
            marginEnd: 60,
        },
        textInputMed: {
            fontSize: 16,
            textTransform: 'capitalize',
            color: isDark ? COL.WHITE : COL.BLACK,
            paddingStart: 10,
            width: '100%',
            margin: 3,
            textAlign: 'center',
        },
        textInputMedBottom: {
            fontSize: 16,
            textTransform: 'capitalize',
            color: isDark ? COL.WHITE : COL.BLACK,
            paddingStart: 10,
            margin: 3,
            textAlign: 'center',
        },
        autoCompleteListTreatment: {
            maxHeight: 150,
            alignSelf: 'baseline',
            position: 'absolute',
            flex: 1,
            flexGrow: 0,
            flexDirection: 'row',
            left: 30,
            right: 30,
            top: 100,
            backgroundColor: isDark ? Colors.darker : Colors.lighter,
        },
        autoCompleteListDose: {
            maxHeight: 150,
            alignSelf: 'baseline',
            position: 'absolute',
            flex: 1,
            flexGrow: 0,
            flexDirection: 'row',
            left: 30,
            right: 30,
            top: 150,
            backgroundColor: isDark ? Colors.darker : Colors.lighter,
        },
    });
};

export default AppointmentDoctorScreen;
