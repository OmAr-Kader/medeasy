import React from 'react';
import { BackHandler, EmitterSubscription, NativeEventEmitter, RefreshControl, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableHighlight, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { FetchIsDarkMode } from '../../global/dims';
import { DonePending, UnderReview } from '../../assets/logo';
import * as COL from '../../global/styles';
import * as CONST from '../../global/const';
import { DoctorSack, ExaminationSack, jsonToDoctor } from '../../global/model';
import { FlatListed, MainMenu, ProfilePic, SearchView } from '../../global/baseView';
import { convertDateToMonthAndDay, firstCapital, formatAmPm, updatePref } from '../../global/utils';
import MultiSwitch from '../../component/multipleSwitch/multipleSwitch';
import { fetchExaminationHistoryForDoctor } from '../../firebase/fireStore';
import Spinner from 'react-native-loading-spinner-overlay';
import { MenuOption, MenuProvider } from 'react-native-popup-menu';
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

  return doctorSack.approved ? <DoctorHome isDarkMode={isDarkMode} togglePos={togglePos !== undefined ? togglePos : 1} doctor={doctorSack} navigation={navigation} /> : <DoctorHomeUnderReview isDarkMode={isDarkMode} doctor={doctorSack} navigation={navigation} />;
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
    fetchExaminationHistoryForDoctor(doctor.doctorDocId, state.toggle === toggleItems[0], (allExaminations) => {
      dispatch({ examinations: allExaminations, originalExamination: allExaminations })
    });
    checkForIntent(isDarkMode, (map: any) => {
      updateSpinner(false);
      navigation.navigate(map.navigatorTag, map.data);
    }, () => {
      updateSpinner(false);
    });
    const uns = checkNewMessage(isDarkMode, (map) => {
      updateSpinner(false)
      navigation.navigate(map.navigatorTag, map.data);
    }, (bool) => updateSpinner(bool))
    return () => {
      clearEmitter()
      uns()
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

  const renderItem = ({ item }: { item: ExaminationSack }) => {
    return recyclerChildExamination(item,
      isDarkMode, () => {
        clearEmitter()
        emitterSubscription.current = new NativeEventEmitter().addListener(CONST.REFRESH_APPOINTMENT, () => {
          updateSpinner(true);
          fetchExaminationHistoryForDoctor(doctor.doctorDocId, state.toggle === toggleItems[0], (allExaminations) => {
            dispatch({ examinations: allExaminations, originalExamination: allExaminations, spinner: false })
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
            <Text style={stylesColorMain.screenTittle}>{strings.hey + (doctor.nameDoc.length > 15 ? String(doctor.nameDoc).substring(0, 15) + '..' : doctor.nameDoc)}</Text>
          </View>
          <View style={COL.stylesMain.headerIconsContainer}>
            <MainMenu isDarkMode={isDarkMode}>
              <MenuOption
                text="Sign Out"
                onSelect={() => {
                  signOut(() => {
                    navigation.replace(CONST.LOG_In, { isDark: isDarkMode, isDoctor: true })
                    BackHandler.exitApp();
                  });
                }} customStyles={{
                  optionText: stylesColorMain.optionMenuItemText,
                }} />
            </MainMenu>
            <TouchableHighlight
              style={COL.stylesMain.profileButton}
              underlayColor={COL.MAIN_WHITER}
              onPress={() => { }}>
              <ProfilePic style={COL.stylesMain.profilePic} uri={doctor.personalImage} />
            </TouchableHighlight>
          </View>
        </View>
        <SearchView isDarkMode={isDarkMode}
          onChangeText={(text: String) => {
            dispatch({ examinations: state.originalExamination.filter((it: ExaminationSack) => String(it.clientNote).toLowerCase().includes(String(text).toLowerCase()) || String(it.examinationName).toLowerCase().includes(String(text).toLowerCase())) })
          }}
          onPress={() => dispatch({ examinations: state.originalExamination })} />
        <View style={COL.stylesMain.toggleContainerBack}>
          <View />
          <View style={COL.stylesMain.toggleViewStyle}>
            <MultiSwitch
              value={state.toggle}
              items={toggleItems}
              onChange={(value: string) => {
                const bool = value === toggleItems[0];
                updatePref(CONST.TOGGLE_HOME, bool ? '0' : '1', () => { });
                dispatch({ toggle: value, spinner: true })
                fetchExaminationHistoryForDoctor(doctor.doctorDocId, bool, (allExaminations) => {
                  dispatch({ examinations: allExaminations, originalExamination: allExaminations, spinner: false })
                });
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
          data={state.examinations}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                fetchExaminationHistoryForDoctor(doctor.doctorDocId, state.toggle === toggleItems[0], (allExaminations) => {
                  if (allExaminations !== state.examinations) {
                    dispatch({ examinations: allExaminations, originalExamination: allExaminations })
                  }
                });
              }} />
          }
          renderItem={renderItem}
          isDarkMode={isDarkMode}
          emptyMessage={state.spinner ? '' : (state.toggle === toggleItems[0] ? strings.noPreApp : strings.noPending)} />
      </View>
    </SafeAreaView>
  </MenuProvider>;
};

const DoctorHomeUnderReview = ({ isDarkMode, doctor, navigation }: { isDarkMode: boolean, doctor: DoctorSack, navigation: any }) => {

  const stylesColorMain = COL.stylesColorMain(isDarkMode)
  return <MenuProvider>
    <SafeAreaView style={stylesColorMain.backStyle}>
      <StatusBar translucent={false} backgroundColor={isDarkMode ? Colors.darker : Colors.lighter} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={COL.stylesMain.mainContainer}>
        <View style={COL.stylesMain.headerContainer}>
          <View style={COL.stylesMain.headerDetailsContainer}>
            <Text style={stylesColorMain.screenTittle}>{strings.hey + (doctor.nameDoc.length > 15 ? String(doctor.nameDoc).substring(0, 15) + '..' : doctor.nameDoc)}</Text>
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
              style={COL.stylesMain.profileButton}
              underlayColor={COL.MAIN_WHITER}
              onPress={() => { }}>
              <ProfilePic style={COL.stylesMain} uri={doctor.personalImage} />
            </TouchableHighlight>
          </View>
        </View>
        <View style={styles.underReviewContainer}>
          <View style={styles.logoContainerLin}>
            <View
              style={styles.logoStyle}>
              <UnderReview color={COL.MAIN} />
            </View>
            <Text style={stylesColorMain.screenTittle}>Your Account Under Review</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  </MenuProvider >;
};

function recyclerChildExamination(value: ExaminationSack, isDarkMode: boolean, press: () => void) {
  const tittle = value.examinationName.length !== 0 ? value.examinationName : strings.mr + value.communicationMethods.clientName + ' ' + convertDateToMonthAndDay(value.date) + '-' + formatAmPm(value.date);

  return <View style={COL.stylesMain.mainFlatListContainer} key={value.date}>
    <TouchableHighlight
      style={COL.stylesMain.touchableFlatListContainer}
      onPress={press}
      underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}>
      <View style={COL.stylesMain.subTouchableFlatList}>
        <View style={COL.stylesMain.profilePicContainer}>
          <ProfilePic style={COL.stylesMain.profilePic} uri={value.communicationMethods.clientImg} />
        </View>
        <View style={COL.stylesMain.flatListDetailsContainer}>
          <Text style={COL.stylesColorMain(isDarkMode).flatListTittle}>{firstCapital(tittle)}</Text>
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
  underReviewContainer: {
    position: 'absolute',
    width: '100%',
    marginTop: 250
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
});


export default HomeDocScreen;
