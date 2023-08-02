import React from 'react';
import { EmitterSubscription, NativeEventEmitter, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { FetchIsDarkMode } from '../../global/dims';
import { BackArrow, CertificateView, DonePending } from '../../assets/logo';
import * as COL from '../../global/styles';
import { AppointmentDoctor, AppointmentSack, ExaminationSack, createCommunicationSack, createExaminationSack, jsonToAppointmentSack, jsonToDoctor } from '../../global/model';
import { TagSelectOne, ICheckboxButton } from '../../component/selectorView/TagSelectMulti';
import { findMultiPref, firstCapital, formatAmPm, formatHourAmPm, getNextDayOfTheWeek, isAllSafeToUse, isSafeToUse, pushLocalNotification } from '../../global/utils';
import useStateWithCallback, { DispatchWithCallback } from '../../component/selectorView/useStateWithCallback';
import { convertDateToMonthAndDay } from '../../global/utils';
import { FlatListed, ProfilePic, SeeMoreText } from '../../global/baseView';
import * as CONST from '../../global/const';
import MultiSwitch from '../../component/multipleSwitch/multipleSwitch';
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
        <View style={COL.stylesMain.headerDetailsContainer}>
          <Text style={COL.stylesColorMain(isDarkMode).screenTittle}>{firstCapital(doc.nameDoc)}</Text>
          <Text style={COL.stylesMain.screenSubTittle}>{doc.specialistDoc}</Text>
        </View>
        <View style={COL.stylesMain.headerIconsContainer}>
          <TouchableHighlight style={COL.stylesMain.menuButton} underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
            onPress={() => { navigation.goBack(); }}>
            <BackArrow color={isDarkMode ? COL.WHITE : COL.BLACK} />
          </TouchableHighlight>
          <View style={COL.stylesMain.profileButton}>
            <TouchableHighlight
              onPress={doc.personalImage.length > 0 ? () => {
                navigation.navigate(CONST.PROFILE_IMAGE_SCREEN, { data: doc.personalImage, isDark: isDarkMode });
              } : undefined}
              underlayColor={COL.MAIN_WHITER}>
              <ProfilePic style={COL.stylesMain.profilePic} uri={doc.personalImage} />
            </TouchableHighlight>
          </View>
        </View>
      </View>
      <ScrollView contentInsetAdjustmentBehavior="automatic"
        overScrollMode={'always'}
        keyboardShouldPersistTaps={'handled'}
        keyboardDismissMode={'interactive'}
        contentContainerStyle={COL.stylesMain.scrollStyle}>
        <SeeMoreText isDarkMode={isDarkMode} seeMoreTxt={doc.doctorBio} subAfter={300} tittle={'Doctor Bio'} />
        <View style={styles.bookButtonContainer}>
          <TouchableHighlight
            style={styles.displayCerButton}
            onPress={() => { navigation.navigate(CONST.CERTIFICATES_SCREEN, { isDark: isDarkMode, data: doc.doctorAuth }); }}
            underlayColor={COL.MAIN_WHITER}>
            <View style={styles.certificateViewContainer}>
              <View style={styles.certificateIconContainer}>
                <CertificateView color={COL.WHITE} />
              </View>
              <Text style={styles.certificateTextBottom}>Certificates</Text>
            </View>
          </TouchableHighlight>
        </View>
        <View style={stylesColorMain.backListFourCorner}>
          <View style={COL.stylesMain.toggleContainerBack}>
            <View style={COL.stylesMain.menuButton} />
            <View style={COL.stylesMain.toggleViewStyle}>
              <MultiSwitch
                value={state.toggle}
                items={toggleItems}
                onChange={(value: string) => {
                  loadDetails(value)
                  dispatch({ toggle: value })
                }}
                containerStyle={stylesColorMain.toggleView}
                sliderStyle={{
                  backgroundColor: COL.MAIN,
                }}
                textStyle={stylesColorMain.textToggleStyle}
                activeTextStyle={COL.stylesMain.activeToggleStyle}
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

  return <View style={COL.stylesMain.mainFlatListContainer} key={value.date}>
    <TouchableHighlight style={COL.stylesMain.touchableFlatListContainer}
      onPress={press}
      underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}>
      <View style={COL.stylesMain.subTouchableFlatList}>
        <View style={COL.stylesMain.profilePicContainer}>
          <ProfilePic style={COL.stylesMain.profilePic} uri={value.communicationMethods.doctorImg} />
        </View>
        <View style={COL.stylesMain.flatListDetailsContainer}>
          <Text style={[COL.stylesColorMain(isDarkMode).screenTittle, { marginTop: 10 }]}>{firstCapital(tittle)}</Text>
          <View style={COL.stylesMain.subFlatListDetails}>
            <Text style={COL.stylesMain.flatListSubTittle}>{value.clientNote}</Text>
            <View style={COL.stylesMain.flatListDetailsIcon}>
              <DonePending isDone={value.doctorAccepted} />
            </View>
          </View>
        </View>
        <View style={COL.stylesMain.bottomLineFlatListContainer}>
          <View style={COL.stylesMain.bottomLineFlatList} />
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

  const stylesColorMain = COL.stylesColorMain(isDarkMode)
  return <View style={styles.mainAppContainer}>
    <Text style={stylesColorful(isDarkMode).doctorNameStyle}>{CONST.DAYS_FOR_PICKER[value.dayId].name}</Text>
    <TagSelectOne
      data={dates}
      onChange={(selectedItem: ICheckboxButton) => {
        const selectedAndDayHour: string[] = selectedItem.id!.toString().split('/*/')// [0] Day [1]hour
        onChange([Number(selectedAndDayHour[0]), Number(selectedAndDayHour[1])])
      }}
      selectState={selectedState}
      itemStyle={stylesColorMain.toggleItemStyle}
      itemStyleSelected={stylesColorMain.toggleItemStyleSelected}
      itemLabelStyle={{ color: isDarkMode ? COL.BLACK_55 : COL.WHITE_196 }}
      itemLabelStyleSelected={{ color: COL.BLACK }} />
  </View>;
}


const styles = StyleSheet.create({
  displayCerButton: {
    width: 150,
    height: 45,
    backgroundColor: COL.MAIN,
    borderRadius: 15,
    elevation: 10,
    margin: 10,
    shadowColor: COL.WHITE,
    alignItems: 'center',
  },
  mainAppContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    flex: 1,
    flexWrap: 'wrap',
    width: '100%',
    margin: 7,
  },
  certificateViewContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  certificateIconContainer: {
    width: 30,
    height: 30,
    marginTop: 8,
    resizeMode: 'contain',
    marginEnd: 5,
    marginStart: 15
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
});


const stylesColorful = (isDark: boolean) => {
  return StyleSheet.create({
    doctorNameStyle: {
      fontWeight: '700',
      fontSize: 18,
      color: isDark ? COL.WHITE : COL.BLACK,
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
    joinButton: {
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
  });
};

export default DoctorDetail;
