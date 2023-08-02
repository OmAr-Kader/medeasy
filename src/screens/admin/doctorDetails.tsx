import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { FetchIsDarkMode } from '../../global/dims';
import { BackArrow, CertificateView, DonePending } from '../../assets/logo';
import * as COL from '../../global/styles';
import { AppointmentSack, ExaminationSack, jsonToDoctor } from '../../global/model';
import { TagSelectOne, ICheckboxButton } from '../../component/selectorView/TagSelectMulti';
import { firstCapital, formatAmPm, formatHourAmPm, pushLocalNotification } from '../../global/utils';
import useStateWithCallback, { DispatchWithCallback } from '../../component/selectorView/useStateWithCallback';
import { convertDateToMonthAndDay } from '../../global/utils';
import { DialogTwoButtonAlert, FlatListed, ProfilePic, SeeMoreText } from '../../global/baseView';
import { acceptDoctor, fetchDoctorAppointment, fetchExaminationHistory, rejectDoctor } from '../../firebase/fireStore';
import * as CONST from '../../global/const';
import { sendFcmMessage } from '../../firebase/firebaseMessaging';
import Spinner from 'react-native-loading-spinner-overlay';
import MultiSwitch from '../../component/multipleSwitch/multipleSwitch';

type Props = {
  dataList: ExaminationSack[] | AppointmentSack[],
  dialogRemoveDoctorVisible: boolean,
  dialogAcceptDoctorVisible: boolean,
  toggle: string,
  spinner: boolean,
}

type IProps = {
  dataList?: ExaminationSack[] | AppointmentSack[],
  dialogRemoveDoctorVisible?: boolean,
  dialogAcceptDoctorVisible?: boolean,
  toggle?: string,
  spinner?: boolean,
}

const DoctorDetailAdmin = ({ route, navigation }: { route: any, navigation: any }) => {
  const { isDark } = route.params;
  const isDarkMode: boolean = route !== undefined && route.params != null ? isDark : FetchIsDarkMode();
  const { data } = route.params;
  const { dispatcher } = route.params;
  const doc = jsonToDoctor(data, data.doctorDocId);

  const selectedState = useStateWithCallback<
    ICheckboxButton | undefined
  >([undefined]);

  const toggleItems = ['History', 'Appointment'];
  const [state, dispatch] = React.useReducer<(prevState: Props, action: IProps) => Props>(
    (state: Props, newState: IProps) => ({ ...state, ...newState }),
    dispatcher !== undefined ? dispatcher : {
      dataList: [],
      dialogRemoveDoctorVisible: false,
      dialogAcceptDoctorVisible: false,
      toggle: toggleItems[1],
      spinner: false,
    },
  );

  React.useEffect(() => {
    //if (dispatcher === undefined) {
    updateSpinner(true)
    loadDetails(state.toggle)
    //}
    /*const subscription = Dimensions.addEventListener('change', (it) => {
      navigation.replace(route.name, { isDark: isDark, data: data, dispatcher: state })
    });
    return () => {
      subscription.remove();
    };*/
  }, [])

  const renderItem = ({ item }: { item: any }) => {
    if (item instanceof ExaminationSack) {
      return recyclerChildExamination(item, isDarkMode, () => navigation.navigate(CONST.APPOINTMENT_SCREEN, { isDark: isDarkMode, data: item.asJsonAll(), modeApp: CONST.EDIT_SAVE_ALL_OFF, newAp: [] }));
    } else {
      return recyclerChild(item as AppointmentSack, isDarkMode, selectedState);
    }
  };

  const loadDetails = (value: string) => {
    if (value === toggleItems[1]) {
      fetchDoctorAppointment(doc.specialistId, doc.doctorDocId, new Date(Date.now()), (appointments) => {
        dispatch({ spinner: false, dataList: appointments.sort((a, b) => a.dayId > b.dayId ? 1 : -1) })
      }, () => updateSpinner(false))
    } else {
      fetchExaminationHistory(doc.doctorDocId, (allDoctorExamination) => {
        dispatch({ spinner: false, dataList: allDoctorExamination })
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
      overlayColor={isDarkMode ? COL.SHADOW_WHITE : COL.SHADOW_BLACK} />
    <View style={COL.stylesMain.mainContainer}>
      <View style={COL.stylesMain.headerContainer}>
        <View style={COL.stylesMain.headerDetailsContainer}>
          <Text style={stylesColorMain.screenTittle}>{firstCapital(doc.nameDoc)}</Text>
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
        <SeeMoreText isDarkMode={isDarkMode} seeMoreTxt={doc.doctorEditedBio.length === 0 ? doc.doctorBio : doc.doctorEditedBio} subAfter={300} tittle={'Doctor Bio'} />
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
            <View />
            <View style={COL.stylesMain.toggleViewStyle}>
              <MultiSwitch
                value={state.toggle}
                items={toggleItems}
                onChange={(value: string) => {
                  dispatch({ toggle: value, spinner: true })
                  setTimeout(() => {
                    dispatch({ spinner: false })
                  }, 3000);
                  loadDetails(value)
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
      <View style={styles.bookButtonContainer}>
        <TouchableHighlight
          style={stylesColorful(isDarkMode).bottomButton}
          onPress={() => dispatch({ dialogRemoveDoctorVisible: true })}
          underlayColor={COL.GREY}>
          <Text style={styles.textBottom}>{doc.approved ? 'Remove' : 'Reject and Remove'}</Text>
        </TouchableHighlight>
        <TouchableHighlight
          style={[stylesColorful(isDarkMode).joinButton, doc.approved ? StyleSheet.flatten({ width: 0, height: 0 }) : StyleSheet.flatten({ width: 150, height: 50 })]}
          onPress={() => dispatch({ dialogAcceptDoctorVisible: true })}
          underlayColor={COL.GREY}>
          <Text style={styles.textBottom}>Accept</Text>
        </TouchableHighlight>
      </View>
    </View>
    <DialogTwoButtonAlert alertTitle={'Reject'}
      positiveButton='Delete'
      negativeButton='Cancel'
      alertMsg={`Do you want to ${doc.approved ? '' : 'Reject and '}Remove this doctor`}
      visible={state.dialogRemoveDoctorVisible}
      invoke={() => {
        dispatch({ dialogRemoveDoctorVisible: false })
        rejectDoctor(doc.doctorDocId, doc.userAuthID, () => {
          sendFcmMessage({
            tittle: 'Head Manager ',
            msg: 'Sorry, Head manager reject your application, try another time with more details',
            token: doc.fcmToken,
            data: { id: doc.doctorDocId, type: CONST.FCM_ADMIN_REJECT_NEW_DOCTOR, navigator: CONST.HOME_SCREEN_DOCTOR },
          })
          navigation.replace(CONST.HOME_SCREEN_ADMAN, { isDark: isDarkMode })
        }, () => pushLocalNotification('Failed', '', false));
      }}
      cancel={() => {
        dispatch({ dialogRemoveDoctorVisible: false })
      }} />
    <DialogTwoButtonAlert
      alertTitle={'Confirm'}
      positiveButton='Accept'
      negativeButton='Cancel'
      alertMsg={'Do you want to Accept this doctor'}
      visible={state.dialogAcceptDoctorVisible}
      invoke={() => {
        dispatch({ dialogAcceptDoctorVisible: false })
        acceptDoctor(doc.doctorDocId, doc.doctorEditedBio, () => {
          sendFcmMessage({
            tittle: 'Head Manager ',
            msg: 'Congratulations, Head manager Accept your application',
            token: doc.fcmToken,
            data: { id: doc.doctorDocId, type: CONST.FCM_ADMIN_CONFIRM_NEW_DOCTOR, navigator: CONST.HOME_SCREEN_DOCTOR },
          })
          navigation.replace(CONST.HOME_SCREEN_ADMAN, { isDark: isDarkMode })
        }, () => pushLocalNotification('Failed', '', false));
      }}
      cancel={() => {
        dispatch({ dialogAcceptDoctorVisible: false })
      }} />
  </SafeAreaView>;
};

function recyclerChild(value: AppointmentSack, isDarkMode: boolean, selectedState: [any, DispatchWithCallback<React.SetStateAction<any>>]) {
  const dates: ICheckboxButton[] = [];
  value.appointments.forEach((valueR) => {
    dates.push({ id: ('' + value.dayId + '/*/' + valueR.hour), name: formatHourAmPm(valueR.hour) });
  });

  const stylesColorMain = COL.stylesColorMain(isDarkMode)
  return <View style={[COL.stylesMain.mainFlatListContainer, { margin: 7 }]} key={value.dayId}>
    <Text style={stylesColorful(isDarkMode).doctorNameStyle}>{CONST.DAYS_FOR_PICKER[value.dayId].name}</Text>
    <TagSelectOne
      data={dates}
      onChange={() => { }}
      selectState={selectedState}
      itemStyle={stylesColorMain.toggleItemStyle}
      itemStyleSelected={stylesColorMain.toggleItemStyleSelected}
      itemLabelStyle={{ color: isDarkMode ? COL.BLACK_55 : COL.WHITE_196 }}
      itemLabelStyleSelected={{ color: COL.BLACK }} />
  </View>;
}

function recyclerChildExamination(value: ExaminationSack, isDarkMode: boolean, press: () => void) {
  const tittle = value.examinationName.length !== 0 ? value.examinationName : value.communicationMethods.doctorName + ' ' + convertDateToMonthAndDay(value.date) + '-' + formatAmPm(value.date);
  return <View style={COL.stylesMain.mainFlatListContainer} key={value.date}>
    <TouchableHighlight style={COL.stylesMain.touchableFlatListContainer}
      onPress={press}
      underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}>
      <View style={COL.stylesMain.subTouchableFlatList}>
        <View style={COL.stylesMain.profilePicContainer}>
          <ProfilePic
            style={COL.stylesMain.profilePic}
            uri={value.communicationMethods.clientImg} />
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

export default DoctorDetailAdmin;
