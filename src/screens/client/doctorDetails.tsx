import React from 'react';
import { EmitterSubscription, NativeEventEmitter, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { FetchIsDarkMode, navbarHeight } from '../../global/dims';
import { BackArrow, CertificateView, DonePending } from '../../assets/logo';
import * as COL from '../../global/styles';
import { AppointmentDoctor, AppointmentSack, ExaminationSack, createCommunicationSack, createExaminationSack, jsonToAppointmentSack, jsonToDoctor } from '../../global/model';
import { TagSelectOne, ICheckboxButton } from '../../component/selectorView/TagSelectMulti';
import { findMultiPref, formatAmPm, formatHourAmPm, getNextDayOfTheWeek, isAllSafeToUse, isSafeToUse, pushLocalNotification } from '../../global/utils';
import useStateWithCallback, { DispatchWithCallback } from '../../component/selectorView/useStateWithCallback';
import { convertDateToMonthAndDay } from '../../global/utils';
import { FlatListed, ProfilePic, SeeMoreText } from '../../global/baseView';
import * as CONST from '../../global/const';
import MultiSwitch from 'react-native-multiple-switch';
import { fetchDoctorAppointment, fetchExaminationHistory, fetchUser } from '../../firebase/fireStore';
import Spinner from 'react-native-loading-spinner-overlay';
import Animated, { StretchInY, StretchOutY } from 'react-native-reanimated';

type Props = {
  dataList: ExaminationSack[] | AppointmentSack[],
  selectedAppointment: AppointmentSack | undefined
  selectedTime: number[],
  toggle: string,
  spinner: boolean,
}

type IProps = {
  dataList?: ExaminationSack[] | AppointmentSack[],
  selectedAppointment?: AppointmentSack | undefined
  selectedTime?: number[],
  toggle?: string,
  spinner?: boolean,
}

const DoctorDetail = ({ route, navigation }: { route: any, navigation: any }) => {
  const { isDark } = route.params;
  const isDarkMode: boolean = route !== undefined && route.params != null ? isDark : FetchIsDarkMode();
  const { data } = route.params;

  const doc = jsonToDoctor(data, data.doctorDocId);

  const selectedState = useStateWithCallback<
    ICheckboxButton | undefined
  >([undefined]);

  const toggleItems = ['History', 'Appointment'];
  const isAppointment = (choose: string) => choose === toggleItems[1];

  const [state, dispatch] = React.useReducer<(prevState: Props, action: IProps) => Props>(
    (state: Props, newState: IProps) => ({ ...state, ...newState }),
    {
      dataList: [],
      selectedAppointment: undefined,
      selectedTime: [],
      toggle: toggleItems[1],
      spinner: false,
    },
  );
  const renderItem = ({ item }: { item: any }) => {
    if (item instanceof ExaminationSack) {
      return recyclerChildExamination(item, isDarkMode, () => navigation.navigate(CONST.APPOINTMENT_SCREEN, { isDark: isDarkMode, data: item.asJsonAll(), modeApp: CONST.EDIT_SAVE_EDITABLE_INTI_NOT, newAp: [] }));
    } else {
      return recyclerChild(item, isDarkMode, selectedState, (selectedHour) => {
        dispatch({ selectedTime: selectedHour, selectedAppointment: item })
      });
    }
  };

  const fetchNewExamination = ({ userID, token, userAuth }: { userID: string, token: string, userAuth: string }, invoke: (examination: ExaminationSack) => void) => {
    const dateMillie = getNextDayOfTheWeek({
      nativeDayId: state.selectedTime[0], hour: state.selectedTime[1]
    }, new Date(Number(Date.now()))).getTime()
    fetchUser(userAuth, (userSack) => {
      const newComExam = createCommunicationSack({
        doctorID: `${doc.doctorDocId}`,
        doctorName: `${doc.nameDoc}`,
        doctorImg: `${doc.personalImage}`,
        doctorFcmToken: doc.fcmToken,
        clientID: `${userID}`,
        clientName: userSack.nameUser,
        clientImg: userSack.personalImage,
        userFcmToken: token ? token : '',
      });
      const exa = createExaminationSack({
        documentId: '',
        examinationKey: `${doc.doctorDocId}${userID}`,
        communicationMethods: newComExam,
        clientNote: '',
        doctorNote: '',
        medicines: [],
        date: dateMillie,
        examinationName: '',
        examinationNameDoctor: '',
        doctorAccepted: false,
      });
      invoke(exa);
    }, () => {
      updateSpinner(false)
      pushLocalNotification('Failed', '', false)
    });
  }

  const updateAppointment = (newApJson: any) => {
    const newAp = jsonToAppointmentSack(newApJson, newApJson.documentId);
    const newList = state.dataList as AppointmentSack[];
    isSafeToUse<AppointmentSack>(newList.find((it) => newAp.dayId == it.dayId), (newApp) => {
      isSafeToUse<AppointmentDoctor>(newApp.appointments.find((it) => it.hour === state.selectedTime[1])?.doctors?.find?.((it) => it.doctorDocumentID == doc.doctorDocId), (currentDoctor) => {
        if (currentDoctor.currentCapacity + 1 !== newApp.clientCapacity) {
          currentDoctor.currentCapacity = currentDoctor.currentCapacity + 1
        } else {
          newApp.appointments = newApp.appointments.filter((it) => it.hour !== state.selectedTime[1])
        }
        const [_, setSelectedItem] = selectedState
        setSelectedItem([undefined])
        dispatch({ selectedTime: [], dataList: newList.filter((it) => it.appointments.length !== 0) })
      }, () => {
        loadDetails(state.toggle)
      })
    }, () => {
      loadDetails(state.toggle)
    })
  }

  const makeExam = (newAp: AppointmentSack | undefined) => {
    if (newAp === undefined) {
      pushLocalNotification('Failed', '', false)
      pushLocalNotification('Failed', '', false)
      return
    }
    updateSpinner(true);
    findMultiPref([CONST.USER_DOCUMENT_ID, CONST.FCM_TOKEN, CONST.USER_ID_AUTH], (values) => {
      const userID = values[0][1]
      const token = values[1][1]
      const userAuth = values[2][1]
      isAllSafeToUse([userID, token, userAuth], () => {
        fetchNewExamination({ userAuth: String(userAuth), userID: String(userID), token: String(token) }, (newExam) => {
          navigateToAppointmentScreen(newAp.asJsonAll(), newExam)
        })
      }, () => {
        updateSpinner(false)
        pushLocalNotification('Failed', '', false)
      })
    }, () => {
      updateSpinner(false)
      pushLocalNotification('Failed', '', false)
    })
  };

  const emitterSubscription = React.useRef<EmitterSubscription | null>(null)

  const clearEmitter = () => {
    try {
      if (emitterSubscription.current !== null) {
        emitterSubscription.current?.remove();
        emitterSubscription.current = null;
      }
    } catch (e) { }
  }

  const navigateToAppointmentScreen = (newAppJson: any, newExam: ExaminationSack) => {
    const newApp = jsonToAppointmentSack(newAppJson, newAppJson.documentId);
    isSafeToUse<AppointmentDoctor>(newApp.appointments.find((it) => it.hour === state.selectedTime[1])?.doctors.find((it) => it.doctorDocumentID == doc.doctorDocId), (doctorSave) => {
      doctorSave.dateChangeOfStatus = Date.now()
      doctorSave.currentCapacity = doctorSave.currentCapacity + 1
      clearEmitter()
      emitterSubscription.current = new NativeEventEmitter().addListener(CONST.REFRESH_APPOINTMENT, () => {
        updateAppointment(newAppJson)
        clearEmitter()
      })
      updateSpinner(false);
      navigation.navigate(CONST.APPOINTMENT_SCREEN, { isDark: isDarkMode, data: newExam.asJsonAll(), newAp: newApp.asJsonAll(), modeApp: CONST.EDIT_SAVE_NOT_EDITABLE_INTI_YES });
    }, () => {
      updateSpinner(false)
      pushLocalNotification('Failed', '', false)
    })
  }


  React.useEffect(() => {
    loadDetails(state.toggle)
    return () => {
      clearEmitter()
    }
  }, [])

  const loadDetails = (value: string) => {
    updateSpinner(true)
    if (isAppointment(value)) {
      fetchDoctorAppointment(doc.specialistId, doc.doctorDocId, new Date(Date.now()), (appointments) => {
        dispatch({ spinner: false, dataList: appointments.sort((a, b) => a.dayId > b.dayId ? 1 : -1) })
      }, () => { })
    } else {
      fetchExaminationHistory(doc.doctorDocId, (allDoctorExamination) => {
        dispatch({ spinner: false, dataList: allDoctorExamination, selectedTime: [] })
      });
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
          <Text style={stylesColorful(isDarkMode).doctorNameStyle}>{doc.nameDoc}</Text>
          <Text style={styles.doctorSpecialist}>{doc.specialistDoc}</Text>
        </View>
        <View style={styles.logoContainerBack}>
          <TouchableHighlight style={styles.menuButton} underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
            onPress={() => { navigation.goBack(); }}>
            <BackArrow color={isDarkMode ? COL.WHITE : COL.BLACK} />
          </TouchableHighlight>
          <View style={styles.profileButton}>
            <TouchableHighlight
              onPress={doc.personalImage.length > 0 ? () => {
                navigation.navigate(CONST.PROFILE_IMAGE_SCREEN, { data: doc.personalImage, isDark: isDarkMode });
              } : undefined}
              underlayColor={COL.MAIN_WHITER}>
              <ProfilePic style={styles.doctorImage} uri={doc.personalImage} />
            </TouchableHighlight>
          </View>
        </View>
      </View>
      <ScrollView contentInsetAdjustmentBehavior="automatic"
        overScrollMode={'always'}
        keyboardShouldPersistTaps={'handled'}
        keyboardDismissMode={'interactive'}
        contentContainerStyle={styles.scrollStyle}>
        <SeeMoreText isDarkMode={isDarkMode} seeMoreTxt={doc.doctorBio} subAfter={300} tittle={'Doctor Bio'} />
        <View style={styles.bookButtonContainer}>
          <TouchableHighlight
            style={styles.displayCerButton}
            onPress={() => { navigation.navigate(CONST.CERTIFICATES_SCREEN, { isDark: isDarkMode, data: doc.doctorAuth }); }}
            underlayColor={COL.MAIN_WHITER}>
            <View style={styles.logoContainerLin}>
              <View style={StyleSheet.flatten({ width: 30, height: 30, marginTop: 8, resizeMode: 'contain', marginEnd: 5, marginStart: 15 })}>
                <CertificateView color={COL.WHITE} />
              </View>
              <Text style={styles.certificateTextBottom}>Certificates</Text>
            </View>
          </TouchableHighlight>
        </View>
        <View style={stylesColorful(isDarkMode).backListStyle}>
          <View style={styles.toggleContainerBack}>
            <View style={styles.menuButton} />
            <View style={styles.toggleViewStyle}>
              <MultiSwitch
                value={state.toggle}
                items={toggleItems}
                onChange={(value: string) => {
                  loadDetails(value)
                  dispatch({ toggle: value })
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
          <FlatListed
            data={state.dataList}
            scrollEnabled={false}
            renderItem={renderItem}
            emptyMessage={state.spinner ? '' : state.toggle === toggleItems[0] ? 'No examination' : 'Not scheduled yet'}
            isDarkMode={isDarkMode} />
        </View>
      </ScrollView>
      {
        state.selectedTime.length !== 0 && state.selectedAppointment !== undefined ?
          <Animated.View
            entering={StretchInY.duration(400)}
            exiting={StretchOutY.duration(400)}>
            <View style={styles.bookButtonContainer}>
              <TouchableHighlight
                style={stylesColorful(false).bottomButton}
                onPress={() => makeExam(state.selectedAppointment)}
                underlayColor={COL.MAIN_WHITER}>
                <Text style={styles.textBottom}>Book</Text>
              </TouchableHighlight>
              <TouchableHighlight
                style={stylesColorful(state.selectedTime !== null).joinButton}
                onPress={() => { pushLocalNotification('Doctor Not Available Now', '', false) }}
                underlayColor={COL.MAIN_WHITER}>
                <Text style={styles.textBottom}>Join Now</Text>
              </TouchableHighlight>
            </View>
          </Animated.View> : null
      }
    </View>
  </SafeAreaView>;
};


function recyclerChildExamination(value: ExaminationSack, isDarkMode: boolean, press: () => void) {
  const tittle = value.examinationName.length !== 0 ? value.examinationName : value.communicationMethods.doctorName + ' ' + convertDateToMonthAndDay(value.date) + '-' + formatAmPm(value.date);

  return <View style={styles.historyAppContainer} key={value.date}>
    <TouchableHighlight style={styles.mainDoctorStyle}
      onPress={press}
      underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}>
      <View style={styles.mainDoctorContent}>
        <View style={styles.doctorContainer}>
          <ProfilePic style={styles.doctorImage} uri={value.communicationMethods.doctorImg} />
        </View>
        <View style={styles.doctorContainerNameStyle}>
          <Text style={stylesColorful(isDarkMode).doctorNameStyle}>{tittle}</Text>
          <Text style={styles.doctorSpecialist}>{value.clientNote}</Text>
        </View>
        <View style={styles.leftArrowStyle}>
          <DonePending isDone={value.doctorAccepted} />
        </View>
        <View style={styles.bottomLineContainerStyle}>
          <View style={styles.bottomLineStyle} />
        </View>
      </View>
    </TouchableHighlight>
  </View>;
}

function recyclerChild(value: AppointmentSack, isDarkMode: boolean, selectedState: [any, DispatchWithCallback<React.SetStateAction<any>>], onChange: (selectedHour: number[]) => void) {
  const dates: ICheckboxButton[] = [];
  value.appointments.forEach((valueR) => {
    dates.push({ id: ('' + value.dayId + '/*/' + valueR.hour), name: formatHourAmPm(valueR.hour) });
  });
  return <View style={styles.mainAppContainer}>
    <Text style={stylesColorful(isDarkMode).doctorNameStyle}>{CONST.DAYS_FOR_PICKER[value.dayId].name}</Text>
    <TagSelectOne
      data={dates}
      onChange={(selectedItem: ICheckboxButton) => {
        const selectedAndDayHour: string[] = selectedItem.id!.toString().split('/*/')// [0] Day [1]hour
        onChange([Number(selectedAndDayHour[0]), Number(selectedAndDayHour[1])])
      }}
      selectState={selectedState}
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
    itemStyle: {
      backgroundColor: isDark ? COL.WHITE_196 : COL.BLACK_55,
      borderColor: isDark ? COL.WHITE_196 : COL.BLACK_55,
    },
    itemStyleSelected: {
      backgroundColor: COL.MAIN,
      borderColor: COL.MAIN,
    },
    bottomButton: {
      width: 150,
      height: 50,
      backgroundColor: isDark ? COL.GREY : COL.MAIN,
      borderRadius: 25,
      elevation: 10,
      marginStart: 10,
      marginEnd: 10,
      shadowColor: COL.WHITE,
      alignItems: 'center',
    },
    joinButton: {
      width: 150,
      height: 50,
      backgroundColor: isDark ? COL.GREY : COL.GREEN_CALL,
      borderRadius: 10,
      elevation: 10,
      marginStart: 10,
      marginEnd: 10,
      shadowColor: COL.WHITE,
      alignItems: 'center',
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
  });
};


export default DoctorDetail;
