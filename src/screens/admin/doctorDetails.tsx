import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { FetchIsDarkMode } from '../../global/dims';
import { BackArrow, CertificateView, DonePending } from '../../assets/logo';
import * as COL from '../../global/styles';
import { ExaminationSack, jsonToDoctor } from '../../global/model';
import { TagSelectOne, ICheckboxButton } from '../../component/selectorView/TagSelectMulti';
import { formatAmPm, pushLocalNotification } from '../../global/utils';
import { resortDoctorAppointment, } from '../../global/modelHandler';
import useStateWithCallback, { DispatchWithCallback } from '../../component/selectorView/useStateWithCallback';
import { convertDateToMonthAndDay } from '../../global/utils';
import { DialogTwoButtonAlert, FlatListed, ProfilePic, SeeMoreText } from '../../global/baseView';
import { acceptDoctor, fetchExaminationHistory, rejectDoctor } from '../../firebase/fireStore';
import * as CONST from '../../global/const';
import MultiSwitch from 'react-native-multiple-switch';
import { sendFcmMessage } from '../../firebase/firebaseMessaging';
import Spinner from 'react-native-loading-spinner-overlay';

type Props = {
  dataList: any[],
  dialogRemoveDoctorVisible: boolean,
  dialogAcceptDoctorVisible: boolean,
  toggle: string,
  spinner: boolean,
}

type IProps = {
  dataList?: any[],
  dialogRemoveDoctorVisible?: boolean,
  dialogAcceptDoctorVisible?: boolean,
  toggle?: string,
  spinner?: boolean,
}

const DoctorDetailAdmin = ({ route, navigation }: { route: any, navigation: any }) => {
  const { isDark } = route.params;
  const isDarkMode: boolean = route !== undefined && route.params != null ? isDark : FetchIsDarkMode();
  const { data } = route.params;
  const doc = jsonToDoctor(data, data.doctorDocId);

  const selectedState = useStateWithCallback<
    ICheckboxButton | undefined
  >([undefined]);

  const dataProv = resortDoctorAppointment(
    []//doc.appointment
  );
  const toggleItems = ['History', 'Appointment'];
  const [state, dispatch] = React.useReducer<(prevState: Props, action: IProps) => Props>(
    (state: Props, newState: IProps) => ({ ...state, ...newState }),
    {
      dataList: dataProv,
      dialogRemoveDoctorVisible: false,
      dialogAcceptDoctorVisible: false,
      toggle: toggleItems[1],
      spinner: false,
    },
  );

  const renderItem = ({ item }: { item: any }) => {
    if (item instanceof ExaminationSack) {
      return recyclerChildExamination(item, isDarkMode, () => navigation.navigate(CONST.APPOINTMENT_SCREEN, { isDark: isDarkMode, data: item, modeApp: CONST.EDIT_SAVE_ALL_OFF, newAp: [] }));
    } else {
      return recyclerChild(item, isDarkMode, selectedState);
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
      overlayColor={isDarkMode ? COL.SHADOW_WHITE : COL.SHADOW_BLACK} />
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
        <SeeMoreText isDarkMode={isDarkMode} seeMoreTxt={doc.doctorEditedBio.length === 0 ? doc.doctorBio : doc.doctorEditedBio} subAfter={300} tittle={'Doctor Bio'} />
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
                  dispatch({ toggle: value })
                  if (value === toggleItems[0]) {
                    fetchExaminationHistory(doc.doctorDocId, (allDoctorExamination) => {
                      dispatch({ dataList: allDoctorExamination })
                    });
                  } else {
                    dispatch({ dataList: dataProv })
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
//value: Appointment[]
function recyclerChild(value: any[], isDarkMode: boolean, selectedState: [any, DispatchWithCallback<React.SetStateAction<any>>]) {
  const dates: ICheckboxButton[] = [];
  value.forEach((valueR) => {
    dates.push({ id: valueR.date, name: formatAmPm(valueR.date) });
  });

  return <View style={styles.mainAppContainer} key={value[0].date}>
    <Text style={stylesColorful(isDarkMode).doctorNameStyle}>{convertDateToMonthAndDay(value[0].date)}</Text>
    <TagSelectOne
      data={dates}
      onChange={() => { }}
      selectState={selectedState}
      itemStyle={stylesColorful(isDarkMode).itemStyle}
      itemStyleSelected={stylesColorful(isDarkMode).itemStyleSelected}
      itemLabelStyle={{ color: isDarkMode ? COL.BLACK_55 : COL.WHITE_196 }}
      itemLabelStyleSelected={{ color: COL.BLACK }} />
  </View>;
}

function recyclerChildExamination(value: ExaminationSack, isDarkMode: boolean, press: () => void) {
  const tittle = value.examinationName.length !== 0 ? value.examinationName : value.communicationMethods.doctorName + ' ' + convertDateToMonthAndDay(value.date) + '-' + formatAmPm(value.date);
  return <View style={styles.historyAppContainer} key={value.date}>
    <TouchableHighlight style={styles.mainDoctorStyle}
      key={value.documentId}
      onPress={press}
      underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}>
      <View style={styles.mainDoctorContent}>
        <View style={styles.doctorContainer}>
          <ProfilePic
            style={styles.doctorImage}
            uri={value.communicationMethods.clientImg} />
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
  loginContainer: {
    width: '100%',
    height: 80,
    alignSelf: 'baseline',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    height: '100%',
  },
  logoContainerLin: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
  certificateTextBottom: {
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
    marginTop: 10,
    marginEnd: 5,
    color: COL.WHITE,
    textTransform: 'capitalize',
  },
  mainDoctorStyle: { width: '100%', height: 80, marginStart: 15, borderRadius: 20 },
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
  historyAppContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    flex: 1,
    flexWrap: 'wrap',
    width: '100%',
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
      paddingStart: 10,
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


export default DoctorDetailAdmin;
