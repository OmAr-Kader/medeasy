import React from 'react';
import { DeviceEventEmitter, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { BackArrow, Copy } from '../../assets/logo';
import { fetchDoctorDocument, fireBaseCreateExamination, fireBaseEditExamination } from '../../firebase/fireStore';
import { EditSaveTextInput, FlatListed, ProfilePic } from '../../global/baseView';
import * as CONST from '../../global/const';
import { FetchIsDarkMode } from '../../global/dims';
import { MedicineSack, jsonToExamination } from '../../global/model';
import * as COL from '../../global/styles';
import { appointmentTitle, appointmentTitleForDoctor, copyToClip, findPref, firstCapital, pushLocalNotification } from '../../global/utils';
import Spinner from 'react-native-loading-spinner-overlay';
import { sendFcmMessage } from '../../firebase/firebaseMessaging';

type Props = {
    examinationName: string,
    clientNote: string,
    spinner: boolean,
}

type IProps = {
    examinationName?: string,
    clientNote?: string,
    spinner?: boolean,
}

const AppointmentScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { isDark } = route.params;
    const isDarkMode: boolean = route !== undefined && route.params != null ? isDark : FetchIsDarkMode();
    const { data } = route.params;
    const { modeApp } = route.params;
    const { newAp } = route.params;
    const mode = modeApp as number;

    const examination = jsonToExamination(data, data.documentId);

    const [state, dispatch] = React.useReducer<(prevState: Props, action: IProps) => Props>(
        (state: Props, newState: IProps) => ({ ...state, ...newState }),
        {
            examinationName: examination.examinationName,
            clientNote: examination.clientNote,
            spinner: false,
        },
    );

    const renderItem = ({ item, index }: { item: MedicineSack, index: number }) => {
        return recyclerChildMedicine(item, index, isDarkMode, () => {
            copyToClip('Name: ' + item.medicineName + '\n' + 'type: ' + item.dose);
            pushLocalNotification('Done', 'Treatment List Copied', true);
        });
    };

    const allTreatmentToClipboard = () => {
        var text = '';
        examination.medicines.forEach((it, index) => {
            if (index === examination.medicines.length - 1) {
                text = text + 'Name: ' + it.medicineName + '\n' + 'type: ' + it.dose;
            } else {
                text = text + 'Name: ' + it.medicineName + '\n' + 'type: ' + it.dose + '\n' + '\n';
            }
        });
        copyToClip(text);
        pushLocalNotification('Done', 'Treatment Copied', true);
    };

    const makeExam = () => {
        updateSpinner(true);
        var newExam = examination;
        newExam.examinationName = state.examinationName;
        newExam.clientNote = state.clientNote;
        fireBaseCreateExamination(newExam, newAp, (documentId) => {
            sendFcmMessage({
                token: examination.communicationMethods.doctorFcmToken,
                data: { id: documentId, navigator: CONST.APPOINTMENT_SCREEN, type: CONST.FCM_NEW_APPOINTMENT_FOR_DOCTOR },
                tittle: 'New Appointment',
                msg: 'From:' + appointmentTitleForDoctor(examination),
            });
            DeviceEventEmitter.emit(CONST.REFRESH_APPOINTMENT);
            navigation.goBack();
            updateSpinner(false);
            pushLocalNotification('Done', 'The medical reservation has been determined', true);
        }, () => {
            updateSpinner(false);
            pushLocalNotification('Failed', 'Failed to determine the medical reservation', false);
        });
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
                        mode={mode}
                        multiline={false}
                        style={stylesColorful(isDarkMode).doctorNameStyle}
                        defaultText={firstCapital(appointmentTitle(examination))}
                        flex={0}
                        onChange={(text: string) => {
                            dispatch({ examinationName: text })
                        }}
                        onSave={(text) => {
                            fireBaseEditExamination(examination.documentId, 'examinationName', text, () => {
                                DeviceEventEmitter.emit(CONST.REFRESH_APPOINTMENT);
                                pushLocalNotification('Done', 'Name has been changed', true);
                            }, () => {
                                pushLocalNotification('Failed', 'Failed to update', false);
                            });
                        }} />
                    <TouchableHighlight
                        style={styles.doctorClickName}
                        underlayColor={COL.MAIN_PALE}
                        onPress={mode === CONST.EDIT_SAVE_NOT_EDITABLE_INTI_YES || mode === CONST.EDIT_SAVE_ALL_OFF ? undefined : () => {
                            updateSpinner(true);
                            fetchDoctorDocument(examination.communicationMethods.doctorID, (doctor) => {
                                updateSpinner(false);
                                navigation.navigate(CONST.DOCTOR_DETAIL, { data: doctor?.asJsonAll(), isDark: isDarkMode });
                            }, () => {
                                updateSpinner(false);
                                pushLocalNotification('Failed', '', false);
                            });
                        }}>
                        <Text style={styles.doctorSpecialist}>{'Dr.' + firstCapital(examination.communicationMethods.doctorName)}</Text>
                    </TouchableHighlight>
                </View>
                <View style={COL.stylesMain.headerIconsContainer}>
                    <TouchableHighlight style={COL.stylesMain.menuButton} underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                        onPress={() => navigation.goBack()}>
                        <BackArrow color={isDarkMode ? COL.WHITE : COL.BLACK} />
                    </TouchableHighlight>
                    <View style={COL.stylesMain.profileButton}>
                        <TouchableHighlight
                            onPress={mode === CONST.EDIT_SAVE_NOT_EDITABLE_INTI_YES || mode === CONST.EDIT_SAVE_ALL_OFF ? undefined : () => {
                                updateSpinner(true);
                                fetchDoctorDocument(examination.communicationMethods.doctorID, (doctor) => {
                                    updateSpinner(false);
                                    navigation.navigate(CONST.DOCTOR_DETAIL, { data: doctor?.asJsonAll(), isDark: isDarkMode });
                                }, () => {
                                    updateSpinner(false);
                                    pushLocalNotification('Failed', '', false);
                                });
                            }}
                            underlayColor={COL.MAIN_WHITER}>
                            <ProfilePic style={COL.stylesMain.profilePic} uri={examination.communicationMethods.doctorImg} />
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
                        <EditSaveTextInput
                            isDarkMode={isDarkMode}
                            mode={mode}
                            defaultText={examination.clientNote}
                            multiline={true}
                            hint={'write Note'}
                            style={stylesColorful(isDarkMode).bioTextStyle}
                            flex={1}
                            onChange={(text: string) => {
                                dispatch({ clientNote: text })
                            }}
                            onSave={(text) => {
                                fireBaseEditExamination(examination.documentId, 'clientNote', text, () => {
                                    DeviceEventEmitter.emit(CONST.REFRESH_APPOINTMENT, ([]));
                                    pushLocalNotification('Done', 'Note has been changed', true);
                                }, () => {
                                    pushLocalNotification('Failed', 'Failed to update', false);
                                });
                            }} />
                    </View>
                </View>
                <View style={examination.doctorNote.length === 0 ? styles.noteContainerHidden : styles.noteContainer}>
                    <Text style={stylesColorful(isDarkMode).bioTextTitleStyle}>Doctor's diagnosis</Text>
                    <Text style={stylesColorful(isDarkMode).doctorNameStyle}>{examination.doctorNote}</Text>
                </View>
                <View style={stylesColorMain.backListFourCorner}>
                    <Text style={stylesColorful(isDarkMode).medTextTitleStyle}>Treatments</Text>
                    <TouchableHighlight
                        style={examination.medicines.length !== 0 ? styles.addButton : styles.addButtonHidden}
                        underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                        onPress={allTreatmentToClipboard}>
                        <Copy color={isDark ? COL.MAIN_PALE : COL.MAIN_WHITER} />
                    </TouchableHighlight>
                    <View style={styles.flatListStyle}>
                        <FlatListed
                            data={examination.medicines}
                            scrollEnabled={false}
                            renderItem={renderItem}
                            isDarkMode={isDarkMode}
                            emptyMessage={state.spinner ? '' : 'No treatments yet'} />
                    </View>
                </View>
            </ScrollView>
            <View style={mode === CONST.EDIT_SAVE_NOT_EDITABLE_INTI_YES ? styles.bookButtonContainer : styles.bookButtonContainerHidden}>
                <TouchableHighlight
                    style={stylesColorful(false).bottomButton}
                    onPress={makeExam}
                    underlayColor={COL.MAIN_WHITER}>
                    <Text style={styles.textBottom}>{'Confirm'}</Text>
                </TouchableHighlight>
            </View>
        </View>
    </SafeAreaView>;
};

function recyclerChildMedicine(value: MedicineSack, index: number, isDarkMode: boolean, doCopy: () => void) {
    return <View style={styles.historyAppContainer}>
        <View style={styles.mainDoctorStyle}>
            <TouchableHighlight
                style={styles.deleteButton}
                underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                onPress={doCopy}>
                <Copy color={isDarkMode ? COL.WHITE : COL.BLACK} />
            </TouchableHighlight>
            <View style={styles.mainDoctorContent}>
                <View style={styles.doctorContainerNameStyle}>
                    <Text style={stylesColorful(isDarkMode).treatmentNameStyle}>
                        <Text style={stylesColorful(isDarkMode).treatmentNameHintStyle}> {'Name: '}</Text>
                        {value.medicineName}
                    </Text>
                    <Text style={stylesColorful(isDarkMode).doseTypeStyle}>
                        <Text style={stylesColorful(isDarkMode).doseTypeHintStyle}> {'Type: '}</Text>
                        {value.dose}
                    </Text>
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
    historyAppContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flex: 1,
        flexWrap: 'wrap',
        width: '100%',
    },
    noteContainer: {
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
        paddingStart: 60,
        paddingEnd: 60,
    },
    titleScreenContainer: {
        alignItems: 'center',
        marginTop: 5,
        width: '100%',
        paddingStart: 60,
        paddingEnd: 60,
    },
    noteContainerHidden: {
        width: 0,
        height: 0,
    },
    textStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'capitalize',
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
    flatListStyle: {
        marginTop: 15,
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
            color: isDark ? COL.MAIN_PALE : COL.MAIN_WHITER,
        },
        medicineNoteNameStyle: {
            fontWeight: '500',
            fontSize: 16,
            color: isDark ? COL.WHITE_200 : COL.BLACK_55,
            marginStart: 25,
            marginEnd: 60,
            marginTop: 5,
            marginBottom: 5,
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
            textAlign: 'left',
            marginStart: 10,
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
    });
};

export default AppointmentScreen;
