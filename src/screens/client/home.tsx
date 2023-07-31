import React from 'react';
import { BackHandler, EmitterSubscription, NativeEventEmitter, RefreshControl, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableHighlight, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { FetchIsDarkMode, navbarHeight } from '../../global/dims';
import { DonePending, Filter, LeftArrow, Menus, Search } from '../../assets/logo';
import * as COL from '../../global/styles';
import * as CONST from '../../global/const';
import { DoctorSack, ExaminationSack, UserSack, jsonToUser } from '../../global/model';
import { FlatListed, ProfilePic } from '../../global/baseView';
import { fetchDoctors, fetchExaminationHistoryForClient } from '../../firebase/fireStore';
import Spinner from 'react-native-loading-spinner-overlay';
import MultiSwitch from 'react-native-multiple-switch';
import { convertDateToMonthAndDay, formatAmPm, updatePref } from '../../global/utils';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import { signOut } from '../../firebase/fireAuth';
import { checkForIntent } from '../../firebase/notifyNavigator';
import { checkNewMessage } from '../../firebase/lifecycle';
import { strings } from '../../global/strings';

type Props = {
  doctors: any[],
  originalDoctors: any[],
  spinner: boolean,
  toggle: string,
}

type IProps = {
  doctors?: any[],
  originalDoctors?: any[],
  spinner?: boolean,
  toggle?: string,
}

const HomeScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { isDark } = route.params;
  const isDarkMode: boolean = route !== undefined && route.params != null ? isDark : FetchIsDarkMode();
  const { data } = route.params;
  const { togglePos } = route.params;

  const userSack: UserSack = jsonToUser(data, data.userDocumentID);

  const toggleItems = [strings.history, strings.docs];
  const refInput = React.useRef<TextInput>(null);

  const [state, dispatch] = React.useReducer<(prevState: Props, action: IProps) => Props>(
    (state: Props, newState: IProps) => ({ ...state, ...newState }),
    {
      doctors: [],
      originalDoctors: [],
      spinner: false,
      toggle: toggleItems[togglePos],
    } as Props,
  );

  React.useEffect(() => {
    if (state.toggle === toggleItems[0]) {
      updateSpinner(true);
      fetchExaminationHistoryForClient(userSack.userDocumentID, (allDoctors) => {
        dispatch({ originalDoctors: allDoctors, doctors: allDoctors })
        checkForIntent(isDarkMode, (map: any,) => {
          updateSpinner(false);
          if (data instanceof ExaminationSack) {
            navigation.navigate(map.navigatorTag, { isDark: isDarkMode, data: map.data, modeApp: CONST.EDIT_SAVE_EDITABLE_INTI_NOT, newAp: [], userName: userSack.nameUser, profilePic: userSack.personalImage });
          } else {
            navigation.navigate(CONST.VIDEO_CALL_SCREEN, { room: map.data.room, tokenOther: map.data.tokenOther, userID: userSack.userAuthID, userName: userSack.nameUser })
          }
        }, () => {
          updateSpinner(false);
        })
      });
    } else {
      updateSpinner(true);
      fetchDoctors(true, (allDoctors) => {
        dispatch({ originalDoctors: allDoctors, doctors: allDoctors })
        checkForIntent(isDarkMode, (map: any) => {
          updateSpinner(false);
          navigation.navigate(map.navigatorTag, map.data);
        }, () => {
          updateSpinner(false);
        });
      });
    }
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
    } catch (e) { }
  }

  const renderItem = ({ item }: { item: any }) => {
    if (item instanceof ExaminationSack) {
      return recyclerChildExamination(item,
        isDarkMode,
        () => {
          clearEmitter()
          emitterSubscription.current = new NativeEventEmitter().addListener(CONST.REFRESH_APPOINTMENT, () => {
            updateSpinner(true);
            fetchExaminationHistoryForClient(userSack.userDocumentID, (allDoctors) => {
              dispatch({ originalDoctors: allDoctors, doctors: allDoctors, spinner: false })
            });
            clearEmitter()
          })
          navigation.navigate(CONST.APPOINTMENT_SCREEN, { isDark: isDarkMode, data: item.asJsonAll(), modeApp: CONST.EDIT_SAVE_EDITABLE_INTI_NOT, newAp: [], userName: userSack.nameUser, profilePic: userSack.personalImage });
        });
    } else {
      return recyclerChild(item, isDarkMode, () => navigation.navigate(CONST.DOCTOR_DETAIL, { data: item.asJsonAll(), isDark: isDarkMode, userName: userSack.nameUser, profilePic: userSack.personalImage }));
    }
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
        <View style={styles.loginContainer}>
          <View style={styles.logoContainer}>
            <Text style={stylesColorful(isDarkMode).highlight}>{strings.hey + (userSack.nameUser.length > 15 ? String(userSack.nameUser).substring(0, 15) + '..' : userSack.nameUser)}</Text>
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
                    text="Sign Out"
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
            <View style={styles.profileButton}>
              <TouchableHighlight
                onPress={userSack.personalImage.length > 0 ? () => {
                  navigation.navigate(CONST.PROFILE_IMAGE_SCREEN, { data: userSack.personalImage, isDark: isDarkMode });
                } : undefined}
                underlayColor={COL.MAIN_WHITER}>
                <ProfilePic style={styles.doctorImage} uri={userSack.personalImage} />
              </TouchableHighlight>
            </View>
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
                  dispatch({ doctors: state.originalDoctors })
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
                if (state.doctors instanceof DoctorSack) {
                  const newDoctors = state.originalDoctors.filter((it: DoctorSack) => String(it.nameDoc).toLowerCase().includes(String(text).toLowerCase()) || String(it.specialistDoc).toLowerCase().includes(String(text).toLowerCase()));
                  dispatch({ doctors: newDoctors })
                } else if (state.doctors instanceof ExaminationSack) {
                  const newExaminations = state.originalDoctors.filter((it: ExaminationSack) => String(it.communicationMethods.doctorName).toLowerCase().includes(String(text).toLowerCase()) || String(it.clientNote).toLowerCase().includes(String(text).toLowerCase()) || String(it.doctorNote).toLowerCase().includes(String(text).toLowerCase()) || String(it.examinationName).toLowerCase().includes(String(text).toLowerCase()))
                  dispatch({ doctors: newExaminations })
                }
              }}
              placeholderTextColor={isDarkMode ? COL.WHITE_200 : COL.BLACK_46} />
            <TouchableHighlight style={stylesColorful(isDarkMode).eyeLogo}
              underlayColor={COL.MAIN_PALE}>
              <Filter />
            </TouchableHighlight>
          </View>
        </View>
        <View style={styles.toggleContainerBack}>
          <View style={styles.menuButton} />
          <View style={styles.toggleViewStyle}>
            <MultiSwitch
              value={state.toggle}
              items={toggleItems}
              onChange={(value: string) => {
                if (value === toggleItems[0]) {
                  updatePref(CONST.TOGGLE_HOME, '0', () => { });
                  updateSpinner(true);
                  fetchExaminationHistoryForClient(userSack.userDocumentID, (allDoctors) => {
                    updateSpinner(false);
                    dispatch({ originalDoctors: allDoctors, doctors: allDoctors })
                  });
                } else {
                  updatePref(CONST.TOGGLE_HOME, '1', () => { });
                  updateSpinner(true);
                  fetchDoctors(true, (allDoctors) => {
                    updateSpinner(false);
                    dispatch({ originalDoctors: allDoctors, doctors: allDoctors })
                  });
                }
                dispatch({ toggle: value, })
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
          data={state.doctors}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={async () => { }} />
          }
          renderItem={renderItem}
          isDarkMode={isDarkMode}
          emptyMessage={state.spinner ? '' : (state.toggle === toggleItems[0] ? 'No previous appointment' : 'No doctor in this specialty')} />
      </View>
    </SafeAreaView>
  </MenuProvider>;
};

function recyclerChildExamination(value: ExaminationSack, isDarkMode: boolean, press: () => void) {
  const tittle = value.examinationName.length !== 0 ? value.examinationName : 'Dr. ' + value.communicationMethods.doctorName + ' ' + convertDateToMonthAndDay(value.date) + '-' + formatAmPm(value.date);
  return <View style={styles.historyAppContainer} key={value.date}>
    <TouchableHighlight style={styles.mainDoctorStyle}
      key={value.documentId}
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

function recyclerChild(data: DoctorSack, isDarkMode: boolean, press: () => void) {
  return <TouchableHighlight style={styles.mainDoctorStyle}
    key={data.doctorDocId}
    onPress={press}
    underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}>
    <View style={styles.mainDoctorContent}>
      <View style={styles.doctorContainer}>
        <ProfilePic style={styles.doctorImage} uri={data.personalImage} />
      </View>
      <View style={styles.doctorContainerNameStyle}>
        <Text style={stylesColorful(isDarkMode).doctorNameStyle}>{data.nameDoc}</Text>
        <Text style={styles.doctorSpecialist}>{data.specialistDoc}</Text>
      </View>
      <View style={styles.leftArrowStyle}>
        <LeftArrow />
      </View>
      <View style={styles.bottomLineContainerStyle}>
        <View style={styles.bottomLineStyle} />
      </View>
    </View>
  </TouchableHighlight>;
}


const styles = StyleSheet.create({
  loginContainer: {
    width: '100%',
    height: 60,
    alignSelf: 'baseline',
  },
  menuButton: {
    width: 48,
    height: 48,
    padding: 13,
  },
  profileButton: { width: 66, height: 66, borderRadius: 33, overflow: 'hidden', marginEnd: 5 },
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
    fontWeight: '900',
    fontSize: 15,
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
  bottomButton: {
    width: 150,
    height: 50,
    backgroundColor: COL.MAIN,
    borderRadius: 20,
    elevation: 10,
    shadowColor: COL.WHITE,
    alignItems: 'center',
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
  toggleContainerBack: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingEnd: 10,
    justifyContent: 'space-between',
    width: '100%',
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
  toggleViewStyle: {
    width: 180,
    padding: 10,
    marginEnd: 10,
  },
  activeToggleStyle: {
    color: COL.WHITE,
    fontSize: 14,
    fontWeight: '300',
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
    sectionDescription: {
      marginTop: 30,
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
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


export default HomeScreen;
