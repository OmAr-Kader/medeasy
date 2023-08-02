import { SafeAreaView } from "react-native-safe-area-context"
import { FetchIsDarkMode, navbarHeight } from "../../global/dims";
import React from "react";
import { ScrollView, StatusBar, StyleSheet, Text, TouchableHighlight, View } from "react-native";
import * as COL from '../../global/styles';
import * as CONST from '../../global/const'
import Spinner from "react-native-loading-spinner-overlay";
import MultiSwitch from '../../component/multipleSwitch/multipleSwitch';
import { Colors } from "react-native/Libraries/NewAppScreen";
import { AppointmentDate, AppointmentDoctor, AppointmentSack, DoctorSack, jsonToAppointmentSack } from "../../global/model";
import { ICheckboxButtonActive, TagSelectMultiActiveController } from "../../component/selectorView/TagSelectMulti";
import { formatHourAmPm, isSafeToUse, pushLocalNotification } from "../../global/utils";
import SelectedOptionPicker from "../../component/selectedOptionPicker/SelectedOptionPicker";
import { DayPicker, DialogTwoButtonAlert } from "../../global/baseView";
import { fetchDoctors, fetchSpecialistAppointment, fireBaseCreate, fireBaseSet } from "../../firebase/fireStore";
import { mergeSpaciestAppointment } from "../../global/modelHandler";
import { BackArrow } from "../../assets/logo";
import Animated, { FadeIn, StretchInY, StretchOutY } from "react-native-reanimated";

type Props = {
    dataList: AppointmentSack[],
    allDoctors: DoctorSack[],
    specialistDoctors: AppointmentDoctor[],
    selectedDoctors: AppointmentDoctor[],
    currentSpecialist: CONST.PairTwoSack | null,
    selectedDay: CONST.PairTwoSack | null,
    selectedHour: number | null,
    clientCapacity: number,
    selectedAppointmentSack: AppointmentSack | undefined,
    showSave: boolean,
    showSpecialistPicker: boolean,
    showDoctorPicker: boolean,
    toggle: string,
    dialogData: any | null,
    spinner: boolean,
}

type IProps = {
    dataList?: AppointmentSack[],
    allDoctors?: DoctorSack[],
    specialistDoctors?: AppointmentDoctor[],
    selectedDoctors?: AppointmentDoctor[],
    currentSpecialist?: CONST.PairTwoSack | null,
    selectedDay?: CONST.PairTwoSack | null,
    selectedHour?: number | null,
    clientCapacity?: number,
    selectedAppointmentSack?: AppointmentSack | undefined,
    showSave?: boolean,
    showSpecialistPicker?: boolean,
    showDoctorPicker?: boolean,
    toggle?: string,
    dialogData?: any | null,
    spinner?: boolean,
}


const ScheduleView = ({ route, navigation }: { route: any, navigation: any }) => {
    const { isDark } = route.params;
    const isDarkMode: boolean = route !== undefined && route.params != null ? isDark : FetchIsDarkMode();

    const toggleItems = ['One', 'Two', 'Three', 'Four'];

    const [state, dispatch] = React.useReducer<(prevState: Props, action: IProps) => Props>(
        (state: Props, newState: IProps) => ({ ...state, ...newState }),
        {
            dataList: [],
            allDoctors: [],
            specialistDoctors: [],
            selectedDoctors: [],
            currentSpecialist: null,
            selectedDay: null,
            selectedHour: null,
            clientCapacity: -1,
            selectedAppointmentSack: undefined,
            showSave: false,
            showSpecialistPicker: false,
            showDoctorPicker: false,
            toggle: toggleItems[0],
            dialogData: null,
            spinner: false,
        },
    );

    const isClientCapacityChanged = (): boolean => state.clientCapacity !== -1 && state.clientCapacity !== state.selectedAppointmentSack?.clientCapacity

    React.useEffect(() => {
        updateSpinner(true);
        fetchDoctors(true, (doctors) => {
            dispatch({ allDoctors: doctors, spinner: false })
        })
    }, [])

    const fetchAppointments = (item: CONST.PairTwoSack) => {
        if (state.selectedHour !== null || isClientCapacityChanged()) {
            dispatch({ dialogData: { id: item.id, name: item.name, type: 1, isVisitable: true } })
            return;
        }
        doFetchAppointments(item);
    }

    const doFetchAppointments = (item: CONST.PairTwoSack) => {
        updateSpinner(true)
        fetchSpecialistAppointment(item.id, (appointments) => {
            const newList = mergeSpaciestAppointment(item.id, appointments);
            if (state.selectedDay !== null) {
                isSafeToUse<AppointmentSack>(state.dataList.find((it) => it.dayId === state.selectedDay?.id), (newSelect) => {
                    const selApp = newSelect.asJson();
                    const newApp = jsonToAppointmentSack(selApp, newSelect.documentId);
                    dispatch({ dataList: newList, currentSpecialist: item, spinner: false, selectedAppointmentSack: newApp, clientCapacity: newApp.clientCapacity, toggle: toggleItems[newApp.clientCapacity - 1] })
                }, () => {
                    dispatch({ dataList: newList, currentSpecialist: item, spinner: false })
                })
            } else {
                dispatch({ dataList: newList, currentSpecialist: item, spinner: false })
            }
        }, () => updateSpinner(false))
    }

    const RenderItem = ({ item }: { item: AppointmentSack | undefined }) => {
        return item !== undefined ? recyclerChild(item, isDarkMode, (value: AppointmentDate) => {
            const a = value.doctors
            dispatch({ selectedHour: value.hour, selectedDoctors: a, showDoctorPicker: true })
        }) : null;
    };

    const afterSave = (appointmentSack: AppointmentSack, invoke: () => void) => {
        const newList = state.dataList;
        var i = newList.findIndex((it) => it.dayId === state.selectedDay?.id)
        if (i !== -1) {
            newList[i] = appointmentSack
            dispatch({ dataList: newList, selectedHour: null, selectedDoctors: [], showSave: false, spinner: false })
        } else {
            dispatch({ selectedHour: null, selectedDoctors: [], showSave: false, spinner: false })
        }
        pushLocalNotification('Done', 'Successfully saved', true);
        invoke();
    }

    const saveChanges = (invoke: () => void) => {
        updateSpinner(true)
        isSafeToUse<AppointmentSack>(state.selectedAppointmentSack, (appointmentSack) => {
            if (appointmentSack.documentId.length === 0) {
                fireBaseCreate(CONST.APPOINTMENTS_COLLECTION, appointmentSack, (docId) => {
                    appointmentSack.documentId = docId;
                    afterSave(appointmentSack, invoke)
                }, () => {
                    updateSpinner(false)
                    pushLocalNotification('Failed', 'Failed to save', false);
                });
            } else {
                const isChanged = isClientCapacityChanged();
                appointmentSack.clientCapacity = isChanged ? state.clientCapacity : appointmentSack.clientCapacity;
                const mode: {} = isChanged && state.showSave ? {
                    'appointments': appointmentSack.appointments.map((value) => value.asJson()),
                    'clientCapacity': appointmentSack.clientCapacity,
                } : ((!isChanged && state.showSave) ? {
                    'appointments': appointmentSack.appointments.map((value) => value.asJson()),
                } : ((isChanged && !state.showSave) ? {
                    'clientCapacity': appointmentSack.clientCapacity,
                } : {
                    'appointments': appointmentSack.appointments.map((value) => value.asJson()),
                    'clientCapacity': appointmentSack.clientCapacity,
                }))
                fireBaseSet(CONST.APPOINTMENTS_COLLECTION, appointmentSack.documentId, mode, () => {
                    afterSave(appointmentSack, invoke)
                }, () => {
                    updateSpinner(false)
                    pushLocalNotification('Failed', 'Failed to save', false);
                })
            }
        }, () => {
            updateSpinner(false)
            pushLocalNotification('Failed', 'Failed to save', false);
        })
    }

    const selectAfterDialog = () => {
        if (state.dialogData.type === 2) {
            const item = { id: state.dialogData.id, name: state.dialogData.name }
            isSafeToUse<AppointmentSack>(state.dataList.find((it) => it.dayId === item.id), (newSelect) => {
                const selApp = newSelect.asJson();
                const newApp = jsonToAppointmentSack(selApp, newSelect.documentId);
                dispatch({ selectedAppointmentSack: newApp, clientCapacity: newApp.clientCapacity, toggle: toggleItems[newApp.clientCapacity - 1], selectedDay: item, dialogData: { id: 0, name: '', type: 0, isVisitable: false } })
            }, () => {
                dispatch({ selectedDay: item, dialogData: { id: 0, name: '', type: 0, isVisitable: false } })
            })
        } else if (state.dialogData.type === 1) {
            doFetchAppointments({ id: state.dialogData.id, name: state.dialogData.name });
            dispatch({ dialogData: { id: 0, name: '', type: 0, isVisitable: false } })
        }
    }

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

    return <SafeAreaView style={stylesColorful(isDarkMode).backStyle}>
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
        <View style={styles.mainContainer}>
            <View style={styles.loginContainer}>
                <View style={styles.logoContainer}>
                    <Text style={stylesColorful(isDarkMode).highlight}>{'Schedule'}</Text>
                </View>
                <View style={styles.logoContainerBack}>
                    <TouchableHighlight style={styles.menuButton} underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                        onPress={() => { navigation.goBack(); }}>
                        <BackArrow color={isDarkMode ? COL.WHITE : COL.BLACK} />
                    </TouchableHighlight>
                </View>
            </View>
            <View style={styles.selectSpecContainer}>
                <View style={stylesColorful(isDarkMode).textInputContainer}>
                    <TouchableHighlight
                        style={styles.pickerClickStyle}
                        onPress={() => dispatch({ showSpecialistPicker: true })}
                        underlayColor={COL.MAIN_PALE}>
                        <Text style={[stylesColorful(isDarkMode).textInputSpecialist, { color: state.currentSpecialist === null ? (isDarkMode ? COL.WHITE_200 : COL.BLACK_46) : (isDark ? COL.WHITE : COL.BLACK) }]}
                        >{state.currentSpecialist === null ? 'Select specialist' : state.currentSpecialist.name}</Text>
                    </TouchableHighlight>
                </View>
            </View>
            {state.currentSpecialist ? <Animated.View
                entering={StretchInY.duration(400)}>
                <View style={styles.selectSpecContainer}>
                    <DayPicker
                        activeColor={COL.MAIN}
                        selectedDay={state.selectedDay}
                        onSelected={(item: CONST.PairTwoSack) => {
                            if (state.selectedHour !== null || isClientCapacityChanged()) {
                                dispatch({ dialogData: { id: item.id, name: item.name, type: 2, isVisitable: true } })
                            } else {
                                isSafeToUse<AppointmentSack>(state.dataList.find((it) => it.dayId === item.id), (newSelect) => {
                                    const selApp = newSelect.asJson();
                                    const newApp = jsonToAppointmentSack(selApp, newSelect.documentId);
                                    dispatch({ selectedDay: item, selectedAppointmentSack: newApp, clientCapacity: newApp.clientCapacity, toggle: toggleItems[newApp.clientCapacity - 1] })
                                })
                            }
                        }} />
                </View>
            </Animated.View> : null}
            <ScrollView contentInsetAdjustmentBehavior="automatic"
                overScrollMode={'always'}
                keyboardShouldPersistTaps={'handled'}
                keyboardDismissMode={'interactive'}
                contentContainerStyle={styles.scrollStyle}>
                <View style={stylesColorful(isDarkMode).backListStyle}>
                    {state.clientCapacity !== -1 && state.selectedAppointmentSack !== undefined ?
                        <Animated.View
                            entering={FadeIn.duration(400)}>
                            <Text style={stylesColorful(isDarkMode).medTextTitleStyle}>Capacity per hour</Text>
                            <View style={styles.toggleContainerBack}>
                                <View style={styles.menuButton} />
                                <View style={styles.toggleViewStyle}>
                                    <MultiSwitch
                                        value={state.toggle}
                                        items={toggleItems}
                                        onChange={(value: string) => {
                                            const clientCap = toggleItems.indexOf(value) + 1
                                            if (clientCap !== state.clientCapacity) {
                                                dispatch({ clientCapacity: clientCap, toggle: value })
                                            } else {
                                                dispatch({ toggle: value })
                                            }
                                        }}
                                        containerStyle={stylesColorful(isDark).toggleView}
                                        sliderStyle={{
                                            backgroundColor: COL.MAIN,
                                        }}
                                        textStyle={stylesColorful(isDarkMode).textToggleStyle}
                                        activeTextStyle={styles.activeToggleStyle}
                                    />
                                </View>
                            </View>
                            <RenderItem item={state.selectedAppointmentSack} />
                        </Animated.View> : null}
                </View>
            </ScrollView>
            {
                state.showSave || isClientCapacityChanged() ? <Animated.View
                    entering={StretchInY.duration(400)}
                    exiting={StretchOutY.duration(400)}>
                    <View style={styles.bookButtonContainer}>
                        <TouchableHighlight
                            style={stylesColorful(isDarkMode).bottomButton}
                            onPress={() => saveChanges(() => { })}
                            underlayColor={COL.GREY}>
                            <Text style={styles.textBottom}>{'Save'}</Text>
                        </TouchableHighlight>
                    </View>
                </Animated.View> : null
            }
        </View>
        <SelectedOptionPicker
            showPicker={state.showSpecialistPicker}
            data={CONST.DOCTORS_FELIDS}
            pickerTitle={'Select specialist'}
            checkBoxType={'circle'}
            showCheck={false}
            itemTitleKey={'name'}
            primaryColor={COL.MAIN}
            itemTitleValue={''}
            itemUniqueKey={'id'}
            itemUniqueValue={''}
            enableSearch={true}
            searchPlaceholder={'Search specialist'}
            emptyTitle={'No specialist(s) Found'}
            onDonePress={() => dispatch({ showSpecialistPicker: false })}
            onCancelPress={() => dispatch({ showSpecialistPicker: false })}
            onItemChange={(item: any) => {
                fetchAppointments(item)
                dispatch({
                    spinner: true,
                    currentSpecialist: item,
                    showSpecialistPicker: false,
                    specialistDoctors: state.allDoctors.filter((doctor) => doctor.specialistId === item.id).map((it) => new AppointmentDoctor(it.doctorDocId, it.nameDoc, true, 0, 0))
                })
            }} />
        <SelectedOptionPicker
            showPicker={state.showDoctorPicker}
            data={state.specialistDoctors}
            multipleData={() => state.selectedDoctors} setMultipleData={(a: any) => {
                dispatch({ selectedDoctors: a })
            }}
            pickerTitle={'Select Doctors'}
            preset={'multiple'}
            checkBoxType={'square'}
            itemTitleKey={'doctorName'}
            primaryColor={COL.MAIN}
            itemTitleValue={''}
            itemUniqueKey={'doctorDocumentID'}
            itemUniqueValue={''}
            enableSearch={true}
            searchPlaceholder={'Search Doctors'}
            emptyTitle={'No Doctor(s) Found'}
            onDonePress={(item: AppointmentDoctor[]) => {
                if (state.selectedDoctors.length === 0) {
                    dispatch({ showDoctorPicker: false })
                } else {
                    isSafeToUse<AppointmentSack>(state.selectedAppointmentSack, (preSack) => {
                        const preSelect = preSack.asJson();
                        const newSelect = jsonToAppointmentSack(preSelect, preSack.documentId)
                        isSafeToUse<AppointmentDate>(newSelect.appointments.find(it => it.hour == state.selectedHour), (preDate) => {
                            preDate.doctors = item
                            dispatch({ selectedAppointmentSack: newSelect, clientCapacity: newSelect.clientCapacity, toggle: toggleItems[newSelect.clientCapacity - 1] })
                            setTimeout(() => {
                                dispatch({ showDoctorPicker: false, showSave: true })
                            }, 150)
                        })
                    })
                }
            }}
            onCancelPress={() => {
                dispatch({ selectedHour: null, selectedDoctors: [], showDoctorPicker: false })
            }}
            onItemChange={() => { }} />
        <DialogTwoButtonAlert
            visible={state.dialogData?.isVisitable ?? false}
            alertTitle={"Ignore changes"}
            alertMsg={"If you continue the changes will be ignored"}
            positiveButton={"Save first"}
            negativeButton={"Continue"}
            invoke={() => {``
                saveChanges(() => {
                    selectAfterDialog()
                })
            }}
            onClose={() => {
                dispatch({ dialogData: { id: 0, name: '', type: 0, isVisitable: false } })
            }}
            cancel={() => {
                dispatch({ selectedHour: null, selectedDoctors: [] })
                selectAfterDialog()
            }} />
    </SafeAreaView>;
}

const updateAppointment = (appUpdated: AppointmentSack) => {
    const newDates: ICheckboxButtonActive[] = [];
    appUpdated.appointments.forEach((valueR: AppointmentDate) => {
        newDates.push({ id: valueR.hour, name: formatHourAmPm(valueR.hour), isActive: valueR.doctors.length !== 0 });
    });
    return newDates;
}

const itemKEy = (value: AppointmentSack) => {
    var str = '' + value.dayName;
    value.appointments.forEach((it) => str = str + it.hour + it.doctors.length)
    return str;
}

function recyclerChild(value: AppointmentSack, isDarkMode: boolean, selectedState: ((value: AppointmentDate) => void)) {
    const dates = updateAppointment(value)

    return <View style={styles.mainAppContainer} key={itemKEy(value)}>
        <TagSelectMultiActiveController
            data={dates}
            onChange={(item) => isSafeToUse<AppointmentDate>(
                value.appointments.find((it) => it.hour === item.id),
                (date: AppointmentDate) => {
                    selectedState(date)
                })}
            itemStyle={stylesColorful(isDarkMode).itemStyle}
            itemStyleSelected={stylesColorful(isDarkMode).itemStyleSelected}
            itemLabelStyle={{ color: isDarkMode ? COL.BLACK_55 : COL.WHITE_196 }}
            itemLabelStyleSelected={{ color: COL.BLACK }} />
    </View>;
}

const styles = StyleSheet.create({
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
    loginContainer: {
        width: '100%',
        height: 80,
        alignSelf: 'baseline',
    },
    scrollHeaderContainer: {
        width: '100%',
        height: 50,
        alignSelf: 'baseline',
        position: 'absolute',
        backgroundColor: '#00000030',
    },
    menuButton: {
        width: 48,
        height: 48,
        marginTop: 5,
        padding: 13,
        borderRadius: 24,
    },
    profileButton: { width: 69, height: 66, borderRadius: 33, overflow: 'hidden', marginEnd: 5 },
    logoContainerBack: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        position: 'absolute',
        width: '100%',
    },
    selectSpecContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 60,
    },
    mainContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flex: 1,
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
        height: 80,
        borderRadius: 20,
    },
    mainDoctorContent: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        flexDirection: 'row',
    },
    doctorContainer: {
        width: 69,
        height: 66,
        borderRadius: 33,
        overflow: 'hidden',
        marginStart: 10,
    },
    doctorImage: {
        width: 69,
        height: 66,
    },
    doctorContainerNameStyle: {
        marginStart: 10,
    },
    doctorSpecialist: {
        marginStart: 10,
        fontWeight: '500',
        fontSize: 18,
        color: COL.MAIN,
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
        height: 2,
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
        flexDirection: 'row',
        height: 60,
    },
    scrollStyle: {
        flexGrow: 1,
        justifyContent: 'flex-end',
        flex: 0,
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
    pickerClickStyle: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
});


const stylesColorful = (isDark: boolean) => {
    return StyleSheet.create({
        backStyle: {
            backgroundColor: isDark ? Colors.darker : Colors.lighter,
            width: '100%',
            height: '100%',
        },
        doctorNameStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: isDark ? COL.WHITE : COL.BLACK,
        },
        backListStyle: {
            borderRadius: 20,
            shadowColor: COL.MAIN,
            marginStart: 20,
            marginEnd: 20,
            elevation: 15,
            backgroundColor: isDark ? Colors.darker : Colors.lighter,
            flex: 1,
            margin: 7,
        },
        highlight: {
            fontWeight: '700',
            fontSize: 18,
            marginStart: 60,
            marginEnd: 60,
            color: isDark ? COL.WHITE : COL.BLACK,
        },
        itemStyle: {
            backgroundColor: isDark ? COL.WHITE_196 : COL.BLACK_55,
            borderColor: isDark ? COL.WHITE_196 : COL.BLACK_55,
        },
        itemStyleSelected: {
            backgroundColor: COL.MAIN,
            borderColor: COL.MAIN,
        },
        toggleView: {
            backgroundColor: isDark ? COL.BLACK_55 : COL.WHITE_196,
            height: 40,
            width: 180,
        },
        textToggleStyle: {
            color: isDark ? COL.WHITE : COL.BLACK,
            fontSize: 14,
            fontWeight: '300',
        },
        textInputContainer: {
            width: 277,
            height: 63,
            backgroundColor: isDark ? COL.BLACK_26 : COL.WHITE_226,
            borderRadius: 20,
            elevation: 10,
            alignItems: 'center',
            shadowColor: COL.BLACK,
            justifyContent: 'center',
            flexDirection: 'row',
        },
        textInputSpecialist: {
            fontSize: 16,
            textTransform: 'capitalize',
            paddingTop: 20,
            width: '100%',
            height: '100%',
            color: isDark ? COL.WHITE : COL.BLACK,
            paddingStart: 10,
            textAlign: 'center',
            flex: 1,
        },
        bottomButton: {
            width: 150,
            height: 50,
            backgroundColor: COL.RED,
            borderRadius: 25,
            elevation: 10,
            marginStart: 10,
            marginEnd: 10,
            shadowColor: COL.WHITE,
            alignItems: 'center',
        },
        medTextTitleStyle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginStart: 15,
            marginTop: 15,
            color: isDark ? COL.WHITE : COL.BLACK,
        },
    });
};

export default ScheduleView;