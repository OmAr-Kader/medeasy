import React from 'react';
import { BackHandler, EmitterSubscription, NativeEventEmitter, RefreshControl, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableHighlight, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { FetchIsDarkMode, initialNumToRender } from '../../global/dims';
import { DonePending, Filter, Menus, Search, UnderReview } from '../../assets/logo';
import * as COL from '../../global/styles';
import * as CONST from '../../global/const';
import { DoctorSack, ExaminationSack, jsonToDoctor } from '../../global/model';
import { FlatListed, ProfilePic } from '../../global/baseView';
import { convertDateToMonthAndDay, formatAmPm, updatePref } from '../../global/utils';
import MultiSwitch from 'react-native-multiple-switch';
import { fetchExaminationHistoryForDoctor } from '../../firebase/fireStore';
import Spinner from 'react-native-loading-spinner-overlay';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import { signOut } from '../../firebase/fireAuth';
import { checkForIntent } from '../../firebase/notifyNavigator';
import { checkNewMessage } from '../../firebase/lifecycle';
import { strings } from '../../global/strings';

const HomeDocScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { isDark } = route.params;
  const { data } = route.params;
  const { togglePos } = route.params;

  const isDarkMode: boolean = route !== undefined && route.params != null ? isDark : FetchIsDarkMode();
  if (data === undefined) {
    navigation.goBack();
    return;
  }

  const doctorSack: DoctorSack = jsonToDoctor(data, data.doctorDocId);

  return doctorSack.approved ? <DoctorHome isDarkMode={isDarkMode} togglePos={togglePos !== undefined ? togglePos : 1} doctor={doctorSack} navigation={navigation} /> : <DoctorHomeUnderReview isDarkMode={isDarkMode} doctor={doctorSack} />;
};

type Props = {
  originalExamination: any[],
  examinations: any[],
  spinner: boolean,
  toggle: string,
}

type IProps = {
  originalExamination?: any[],
  examinations?: any[],
  spinner?: boolean,
  toggle?: string,
}

const DoctorHome = ({ isDarkMode, doctor, togglePos, navigation }: { isDarkMode: boolean, togglePos: number, doctor: DoctorSack, navigation: any }) => {

  const toggleItems = [strings.history, strings.pending];
  const refInput = React.useRef<TextInput>(null);

  const [state, dispatch] = React.useReducer<(prevState: Props, action: IProps) => Props>(
    (state: Props, newState: IProps) => ({ ...state, ...newState }),
    {
      originalExamination: [],
      examinations: [],
      spinner: false,
      toggle: toggleItems[togglePos],
    },
  );

  React.useEffect(() => {
    updateSpinner(true);
    fetchExaminationHistoryForDoctor(doctor.doctorDocId, state.toggle === toggleItems[0], (allDoctors) => {
      dispatch({ examinations: allDoctors, originalExamination: allDoctors })
    });
    checkForIntent(isDarkMode, (map: any) => {
      updateSpinner(false);
      navigation.navigate(map.navigatorTag, map.data);
    }, () => {
      updateSpinner(false);
    });
    checkNewMessage(isDarkMode, (map) => {
      updateSpinner(false)
      navigation.navigate(map.navigatorTag, map.data);
    }, (bool) => updateSpinner(bool))
    return () => {
      clearEmitter()
    }
  }, []);

  const emitterSubscription = React.useRef<EmitterSubscription | null>(null)

  const clearEmitter = () => {
    try {
      if (emitterSubscription.current !== null) {
        emitterSubscription.current?.remove();
        emitterSubscription.current = null;
      }
    } catch(e) {}
  }

  const renderItem = ({ item }: { item: ExaminationSack }) => {
    return recyclerChildExamination(item,
      isDarkMode, () => {
        clearEmitter()
        emitterSubscription.current = new NativeEventEmitter().addListener(CONST.REFRESH_APPOINTMENT, () => {
          updateSpinner(true);
          fetchExaminationHistoryForDoctor(doctor.doctorDocId, state.toggle === toggleItems[0], (allDoctors) => {
            dispatch({ examinations: allDoctors, originalExamination: allDoctors, spinner: false })
          });
          clearEmitter()
        })
        navigation.navigate(CONST.APPOINTMENT_SCREEN_DOCTOR, { isDark: isDarkMode, data: item.asJsonAll(), newAp: [] });
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

  return <MenuProvider skipInstanceCheck={true}>
    <SafeAreaView style={stylesColorful(isDarkMode).backStyle}>
      <StatusBar translucent={false} backgroundColor={isDarkMode ? Colors.darker : Colors.lighter} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Spinner
        visible={state.spinner}
        textContent={strings.loading}
        color={isDarkMode ? COL.WHITE : COL.BLACK}
        textStyle={{ color: isDarkMode ? COL.WHITE : COL.BLACK }}
        animation={'fade'}
        cancelable={false}
        overlayColor={isDarkMode ? COL.SHADOW_WHITE : COL.SHADOW_BLACK}
      />
      <View style={styles.mainContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Text style={stylesColorful(isDarkMode).highlight}>{strings.hey + (doctor.nameDoc.length > 15 ? String(doctor.nameDoc).substring(0, 15) + '..' : doctor.nameDoc)}</Text>
          </View>
          <View style={styles.logoContainerBack}>
            <Menu>
              <MenuTrigger style={styles.menuButton}>
                <Menus />
              </MenuTrigger>
              <MenuOptions
                customStyles={{
                  optionsContainer: stylesColorful(isDarkMode).optionsMenuContainer,
                }}>
                <MenuOption
                  text={strings.signOut}
                  onSelect={() => {
                    signOut(() => {
                      BackHandler.exitApp();
                    });
                  }} customStyles={{
                    optionText: stylesColorful(isDarkMode).optionMenuText,
                  }} />
              </MenuOptions>
            </Menu>
            <TouchableHighlight
              style={styles.profileButton}
              underlayColor={COL.MAIN_WHITER}
              onPress={() => { }}>
              <ProfilePic style={styles.doctorImage} uri={doctor.personalImage} />
            </TouchableHighlight>
          </View>
        </View>
        <View style={styles.searchView}>
          <View style={stylesColorful(isDarkMode).textInputContainer}>
            <TouchableHighlight style={stylesColorful(isDarkMode).eyeLogo}
              underlayColor={COL.MAIN_PALE}
              onPress={() => {
                if (refInput?.current === null) {
                  return;
                }
                if (!refInput?.current?.isFocused()) {
                  refInput?.current?.focus();
                } else {
                  refInput?.current?.blur();
                  refInput?.current?.clear();
                  dispatch({ examinations: state.originalExamination })
                }
              }}>
              <Search />
            </TouchableHighlight>
            <TextInput
              style={stylesColorful(isDarkMode).textInput}
              placeholder={strings.search}
              returnKeyType="done"
              ref={refInput}
              onChangeText={(text: String) => {
                dispatch({ examinations: state.originalExamination.filter((it: ExaminationSack) => String(it.clientNote).toLowerCase().includes(String(text).toLowerCase()) || String(it.examinationName).toLowerCase().includes(String(text).toLowerCase())) })
              }}
              placeholderTextColor={isDarkMode ? COL.WHITE_200 : COL.BLACK_46} />
            <TouchableHighlight style={stylesColorful(isDarkMode).eyeLogo}
              underlayColor={COL.MAIN_PALE}>
              <Filter />
            </TouchableHighlight>
          </View>
        </View>
        <View style={styles.toggleContainerBack}>
          <View />
          <View style={styles.toggleViewStyle}>
            <MultiSwitch
              value={state.toggle}
              items={toggleItems}
              onChange={(value: string) => {
                const bool = value === toggleItems[0];
                updatePref(CONST.TOGGLE_HOME, bool ? '0' : '1', () => { });
                dispatch({ toggle: value, spinner: true })
                fetchExaminationHistoryForDoctor(doctor.doctorDocId, bool, (allDoctors) => {
                  dispatch({ examinations: allDoctors, originalExamination: allDoctors, spinner: false })
                });
              }}
              containerStyle={stylesColorful(isDarkMode).toggleView}
              sliderStyle={{
                backgroundColor: COL.MAIN,
              }}
              textStyle={stylesColorful(isDarkMode).textToggleStyle}
              activeTextStyle={styles.activeToggleText}
            />
          </View>
        </View>
        <FlatListed
          data={state.examinations}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={async () => { }} />
          }
          renderItem={renderItem}
          isDarkMode={isDarkMode}
          emptyMessage={state.spinner ? '' : (state.toggle === toggleItems[0] ? strings.noPreApp : strings.noPending)} />
      </View>
    </SafeAreaView>
  </MenuProvider>;
};

const DoctorHomeUnderReview = ({ isDarkMode, doctor }: { isDarkMode: boolean, doctor: DoctorSack }) => {
  return <MenuProvider>
    <SafeAreaView style={stylesColorful(isDarkMode).backStyle}>
      <StatusBar translucent={false} backgroundColor={isDarkMode ? Colors.darker : Colors.lighter} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.mainContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Text style={stylesColorful(isDarkMode).highlight}>{strings.hey + (doctor.nameDoc.length > 15 ? String(doctor.nameDoc).substring(0, 15) + '..' : doctor.nameDoc)}</Text>
          </View>
          <View style={styles.logoContainerBack}>
            <View>
              <Menu>
                <MenuTrigger style={styles.menuButton}>
                  <Menus />
                </MenuTrigger>
                <MenuOptions
                  customStyles={{
                    optionsContainer: stylesColorful(isDarkMode).optionsMenuContainer,
                  }}>
                  <MenuOption
                    text={strings.signOut}
                    onSelect={() => {
                      signOut(() => {
                        BackHandler.exitApp();
                      });
                    }} customStyles={{
                      optionText: stylesColorful(isDarkMode).optionMenuText,
                    }} />
                </MenuOptions>
              </Menu>
            </View>
            <TouchableHighlight
              style={styles.profileButton}
              underlayColor={COL.MAIN_WHITER}
              onPress={() => { }}>
              <ProfilePic style={styles.doctorImage} uri={doctor.personalImage} />
            </TouchableHighlight>
          </View>
        </View>
        <View style={styles.underReviewContainer}>
          <View style={styles.logoContainerLin}>
            <View
              style={styles.logoStyle}>
              <UnderReview color={COL.MAIN} />
            </View>
            <Text style={stylesColorful(isDarkMode).highlight}>Your Account Under Review</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  </MenuProvider >;
};

function recyclerChildExamination(value: ExaminationSack, isDarkMode: boolean, press: () => void) {
  const tittle = value.examinationName.length !== 0 ? value.examinationName : strings.mr + value.communicationMethods.clientName + ' ' + convertDateToMonthAndDay(value.date) + '-' + formatAmPm(value.date);

  return <View style={styles.examinationRowContainer} key={value.date}>
    <TouchableHighlight style={styles.mainDoctorStyle}
      key={value.documentId}
      onPress={press}
      underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}>
      <View style={styles.mainDoctorContent}>
        <View style={styles.doctorContainer}>
          <ProfilePic style={styles.doctorImage} uri={value.communicationMethods.clientImg} />
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
  headerContainer: { width: '100%', height: 60, alignSelf: 'baseline' },
  examinationRowContainer: { flexDirection: 'column', justifyContent: 'flex-start', flex: 1, flexWrap: 'wrap', width: '100%' },
  activeToggleText: { color: COL.WHITE, fontSize: 14, fontWeight: '300' },
  underReviewContainer: { position: 'absolute', width: '100%', marginTop: 250 },
  menuButton: { width: 48, height: 48, padding: 13, borderRadius: 24, backgroundColor: '#00000000' },
  profileButton: { width: 66, height: 66, borderRadius: 33, overflow: 'hidden', marginEnd: 5 },
  toggleContainerBack: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingEnd: 10,
    justifyContent: 'space-between',
    width: '100%',
  },
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
    flexWrap: 'wrap',
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
    flexWrap: 'wrap',
  },
  logoStyle: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginEnd: 10,
    marginTop: 30,
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
    width: 66,
    height: 66,
    borderRadius: 33,
    overflow: 'hidden',
    marginStart: 10,
  },
  doctorImage: {
    width: 66,
    height: 66,
  },
  doctorContainerNameStyle: {
    marginStart: 10,
  },
  toggleViewStyle: {
    width: 180,
    padding: 10,
    marginEnd: 10,
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
});


const stylesColorful = (isDark: boolean) => {
  return StyleSheet.create({
    backStyle: {
      backgroundColor: isDark ? Colors.darker : Colors.lighter,
      width: '100%',
      height: '100%',
    },
    highlight: {
      fontWeight: '700',
      fontSize: 18,
      marginStart: 60,
      marginEnd: 60,
      color: isDark ? COL.WHITE : COL.BLACK,
    },
    textInput: {
      fontSize: 16,
      textTransform: 'capitalize',
      width: '100%',
      height: '100%',
      color: isDark ? COL.WHITE : COL.BLACK,
      paddingStart: 10,
      textAlign: 'center',
      flex: 1,
    },
    textInputContainer: {
      width: 230,
      height: 40,
      backgroundColor: isDark ? COL.GREY : COL.WHITE_196,
      borderRadius: 20,
      elevation: 10,
      alignItems: 'center',
      shadowColor: COL.BLACK,
      justifyContent: 'center',
      flex: 0,
      flexDirection: 'row',
    },
    eyeLogo: {
      width: 40,
      height: 40,
      padding: 7,
      flex: 0,
      justifyContent: 'flex-end',
      borderRadius: 20,
      elevation: 10,
      shadowColor: COL.BLACK,
      backgroundColor: isDark ? COL.GREY : COL.WHITE_196,
    },
    doctorNameStyle: {
      fontWeight: '700',
      fontSize: 18,
      color: isDark ? COL.WHITE : COL.BLACK,
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
    optionsMenuContainer: {
      backgroundColor: isDark ? COL.BLACK_55 : COL.WHITE_200,
      width: 110,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      flex: 1,
      flexWrap: 'wrap',
      marginTop: 40,
    },
    optionMenuText: { color: isDark ? COL.WHITE_226 : COL.BLACK_26, textAlign: 'center', height: 30, fontSize: 14, fontWeight: '500', padding: 5 },
  });
};

export default HomeDocScreen;
