import React from 'react';
import { BackHandler, EmitterSubscription, NativeEventEmitter, RefreshControl, SafeAreaView, StatusBar, Text, TextInput, TouchableHighlight, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { FetchIsDarkMode } from '../../global/dims';
import { DonePending, LeftArrow } from '../../assets/logo';
import * as COL from '../../global/styles';
import * as CONST from '../../global/const';
import { DoctorSack, ExaminationSack, UserSack, jsonToUser } from '../../global/model';
import { FlatListed, MainMenu, ProfilePic, SearchView } from '../../global/baseView';
import { fetchDoctors, fetchExaminationHistoryForClient } from '../../firebase/fireStore';
import Spinner from 'react-native-loading-spinner-overlay';
import MultiSwitch from '../../component/multipleSwitch/multipleSwitch';
import { convertDateToMonthAndDay, firstCapital, formatAmPm, updatePref } from '../../global/utils';
import { MenuOption, MenuProvider } from 'react-native-popup-menu';
import { signOut } from '../../firebase/fireAuth';
import { checkForIntent } from '../../firebase/notifyNavigator';
import { checkNewMessage } from '../../firebase/lifecycle';
import { strings } from '../../global/strings';

type Props = {
  items: any[],
  originalItems: any[],
  spinner: boolean,
  toggle: string,
}

type IProps = {
  items?: any[],
  originalItems?: any[],
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
      items: [],
      originalItems: [],
      spinner: false,
      toggle: toggleItems[togglePos],
    } as Props,
  );

  React.useEffect(() => {
    if (state.toggle === toggleItems[0]) {
      updateSpinner(true);
      fetchExaminationHistoryForClient(userSack.userDocumentID, (allDoctors) => {
        dispatch({ originalItems: allDoctors, items: allDoctors })
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
        dispatch({ originalItems: allDoctors, items: allDoctors })
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
              dispatch({ originalItems: allDoctors, items: allDoctors, spinner: false })
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

  const stylesColorMain = COL.stylesColorMain(isDarkMode)
  return <MenuProvider skipInstanceCheck={true}>
    <SafeAreaView style={stylesColorMain.backStyle}>
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
      <View style={COL.stylesMain.mainContainer}>
        <View style={COL.stylesMain.headerContainer}>
          <View style={COL.stylesMain.headerDetailsContainer}>
            <Text style={stylesColorMain.screenTittle}>{strings.hey + (userSack.nameUser.length > 15 ? String(userSack.nameUser).substring(0, 15) + '..' : userSack.nameUser)}</Text>
          </View>
          <View style={COL.stylesMain.headerIconsContainer}>
            <MainMenu isDarkMode={isDarkMode}>
              <MenuOption
                customStyles={{
                  OptionTouchableComponent: () => <TouchableHighlight
                    underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                    style={stylesColorMain.optionMenuItemContainer}
                    onPress={() => {
                      signOut(() => {
                        navigation.replace(CONST.LOG_In, { isDark: isDarkMode, isDoctor: true })
                        BackHandler.exitApp();
                      })
                    }}>
                    <Text style={stylesColorMain.optionMenuItemText}>{strings.signOut}</Text>
                  </TouchableHighlight>
                }} />
            </MainMenu>
            <TouchableHighlight
              onPress={userSack.personalImage.length > 0 ? () => {
                navigation.navigate(CONST.PROFILE_IMAGE_SCREEN, { data: userSack.personalImage, isDark: isDarkMode });
              } : undefined}
              style={COL.stylesMain.profileButton}
              underlayColor={COL.MAIN_WHITER}>
              <ProfilePic style={COL.stylesMain.profilePic} uri={userSack.personalImage} />
            </TouchableHighlight>
          </View>
        </View>
        <SearchView isDarkMode={isDarkMode}
          onChangeText={(text: String) => {
            if (state.items instanceof DoctorSack) {
              const newDoctors = state.originalItems.filter((it: DoctorSack) => String(it.nameDoc).toLowerCase().includes(String(text).toLowerCase()) || String(it.specialistDoc).toLowerCase().includes(String(text).toLowerCase()));
              dispatch({ items: newDoctors })
            } else if (state.items instanceof ExaminationSack) {
              const newExaminations = state.originalItems.filter((it: ExaminationSack) => String(it.communicationMethods.doctorName).toLowerCase().includes(String(text).toLowerCase()) || String(it.clientNote).toLowerCase().includes(String(text).toLowerCase()) || String(it.doctorNote).toLowerCase().includes(String(text).toLowerCase()) || String(it.examinationName).toLowerCase().includes(String(text).toLowerCase()))
              dispatch({ items: newExaminations })
            }
          }}
          onPress={() => dispatch({ items: state.originalItems })} />
        <View style={COL.stylesMain.toggleContainerBack}>
          <View style={COL.stylesMain.menuButton} />
          <View style={COL.stylesMain.toggleViewStyle}>
            <MultiSwitch
              value={state.toggle}
              items={toggleItems}
              onChange={(value: string) => {
                if (value === toggleItems[0]) {
                  updatePref(CONST.TOGGLE_HOME, '0', () => { });
                  updateSpinner(true);
                  fetchExaminationHistoryForClient(userSack.userDocumentID, (allDoctors) => {
                    updateSpinner(false);
                    dispatch({ originalItems: allDoctors, items: allDoctors })
                  });
                } else {
                  updatePref(CONST.TOGGLE_HOME, '1', () => { });
                  updateSpinner(true);
                  fetchDoctors(true, (allDoctors) => {
                    updateSpinner(false);
                    dispatch({ originalItems: allDoctors, items: allDoctors })
                  });
                }
                dispatch({ toggle: value, })
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
          data={state.items}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                if (state.toggle === toggleItems[0]) {
                  fetchExaminationHistoryForClient(userSack.userDocumentID, (allExaminations) => {
                    if (allExaminations !== state.items) {
                      dispatch({ originalItems: allExaminations, items: allExaminations })
                    }
                  });
                } else {
                  fetchDoctors(true, (allDoctors) => {
                    if (allDoctors !== state.items) {
                      dispatch({ originalItems: allDoctors, items: allDoctors })
                    }
                  });
                }
              }} />
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
  return <View style={COL.stylesMain.mainFlatListContainer} key={value.date}>
    <TouchableHighlight
      style={COL.stylesMain.touchableFlatListContainer}
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

function recyclerChild(data: DoctorSack, isDarkMode: boolean, press: () => void) {
  return <View style={COL.stylesMain.mainFlatListContainer} key={data.doctorDocId}>
    <TouchableHighlight
      style={COL.stylesMain.touchableFlatListContainer}
      onPress={press}
      underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}>
      <View style={COL.stylesMain.subTouchableFlatList}>
        <View style={COL.stylesMain.profilePicContainer}>
          <ProfilePic style={COL.stylesMain.profilePic} uri={data.personalImage} />
        </View>
        <View style={COL.stylesMain.flatListDetailsContainer}>
          <Text style={[COL.stylesColorMain(isDarkMode).screenTittle, { marginTop: 10 }]}>{firstCapital(data.nameDoc)}</Text>
          <View style={COL.stylesMain.subFlatListDetails}>
            <Text style={COL.stylesMain.flatListSubTittle}>{data.specialistDoc}</Text>
            <View style={COL.stylesMain.flatListDetailsIcon}>
              <LeftArrow />
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

export default HomeScreen;
