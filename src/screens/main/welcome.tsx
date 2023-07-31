import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Image, SafeAreaView, StatusBar, StyleSheet, Text, TouchableHighlight, View, useWindowDimensions } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { FetchIsDarkMode, STATUSBAR_HEIGHT, navbarHeight } from '../../global/dims';
import { LogoSvg } from '../../assets/logo';
import * as CONST from '../../global/const';
import * as COL from '../../global/styles';
import { PageIndicator } from 'react-native-page-indicator';
import { UserSack } from '../../global/model';
import Spinner from 'react-native-loading-spinner-overlay';
import { fetchDoctor, fetchUser, firebaseFetchAdmin } from '../../firebase/fireStore';
import { DispatchWithCallback } from '../../component/selectorView/useStateWithCallback';
import { findMultiPref, isSafeToUse } from '../../global/utils';
import { welcome1, welcome2, welcome3 } from '../../assets';

const SplashScreen = ({ navigation }: { navigation: any }) => {
  const isDarkMode = FetchIsDarkMode();

  const [user, setUser] = useState<UserSack | undefined | null>(undefined);

  React.useEffect(() => {
    fetchUserOrDoctor(isDarkMode, setUser, navigation);
    //fetchAdmin(isDarkMode, setUser, navigation);
    setTimeout(() => {
      if (user === undefined) {
        setUser(null);
      }
    }, 3000);
  }, []);

  return user === null ? <WelcomeScreen navigation={navigation} isDarkMode={isDarkMode} /> : <SpinnerView isDarkMode={isDarkMode} />;
};

const fetchAdmin = (isDarkMode: boolean, setUser: (user: (UserSack | undefined | null)) => void, navigation: any) => {
  findMultiPref([CONST.USER_ID_AUTH, CONST.TOGGLE_HOME], (values) => {
    const userAuth = values[0][1]
    const toggleValue = values[1][1]
    const togglePos = toggleValue === '0' ? 0 : 1;
    isSafeToUse<string>(userAuth, (_userAuth) => {
      firebaseFetchAdmin(_userAuth, (userSack) => {
        navigation.replace(CONST.HOME_SCREEN_ADMAN, { data: userSack.asJsonAll(), togglePos: togglePos, isDark: isDarkMode });
      }, () => setUser(null));
    }, () => setUser(null))
  }, () => setUser(null));
};


const fetchUserOrDoctor = (isDarkMode: boolean, setUser: (user: (UserSack | undefined | null)) => void, navigation: any) => {
  findMultiPref([CONST.USER_ID_AUTH, CONST.TOGGLE_HOME, CONST.USER_IS_DOCTOR], (values) => {
    const userAuth = values[0][1]
    const toggleValue = values[1][1]
    const isDoctor = values[2][1] === 'true';
    const togglePos = toggleValue === '0' ? 0 : 1;
    isSafeToUse<string>(userAuth, (_userAuth) => {
      if (userAuth === 'tnvX6KiqjEYKlM6law4dVOwl2br1') {
        firebaseFetchAdmin(_userAuth, (userSack) => {
          navigation.replace(CONST.HOME_SCREEN_ADMAN, { data: userSack.asJsonAll(), togglePos: togglePos, isDark: isDarkMode });
        }, () => {
          setUser(null)
        });
        return
      }
      if (isDoctor) {
        fetchDoctor(_userAuth, (doctor) => {
          navigation.replace(CONST.HOME_SCREEN_DOCTOR, { data: doctor.asJsonAll(), togglePos: togglePos, isDark: isDarkMode });
        }, () => setUser(null));
      } else {
        fetchUser(_userAuth, (userSack) => {
          navigation.replace(CONST.HOME_SCREEN_USER, { data: userSack.asJsonAll(), togglePos: togglePos, isDark: isDarkMode });
        }, () => setUser(null));
      }
    }, () => setUser(null));
  }, () => setUser(null));
};

const SpinnerView = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return <SafeAreaView style={stylesColorful(isDarkMode).backStyle}>
    <StatusBar translucent={false}
      backgroundColor="rgba(52, 52, 52, 0.0)"
      barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
    <Spinner
      visible={true}
      textContent={'Loading...'}
      color={isDarkMode ? COL.WHITE : COL.BLACK}
      textStyle={{ color: isDarkMode ? COL.WHITE : COL.BLACK }}
      cancelable={false}
      overlayColor={isDarkMode ? COL.SHADOW_WHITE : COL.SHADOW_BLACK}
    />
  </SafeAreaView>;
};

const WelcomeScreen = ({ navigation, isDarkMode }: { navigation: any, isDarkMode: boolean }) => {

  const currentPageState = useState(0);
  const [currentPage] = currentPageState;
  const [isChooseType, setChooseType] = useState(false);

  return <SafeAreaView style={stylesColorful(isDarkMode).backStyle}>
    <FetchImg index={currentPage} />
    <StatusBar translucent={true}
      backgroundColor="rgba(52, 52, 52, 0.0)"
      barStyle={currentPage === 0 ? 'light-content' : 'dark-content'} />
    <View style={styles.mainContainer}>
      <View style={styles.loginContainer}>
        <View style={styles.logoContainerLin}>
          <View style={styles.logoStyle}>
            <LogoSvg />
          </View>
          <Text style={stylesColorful(currentPage === 0 ? true : false).highlight}>MEDEASY</Text>
        </View>
      </View>
      <WelcomeOrChooseType
        isDarkMode={isDarkMode}
        currentPageState={currentPageState}
        isChooseType={isChooseType}
        setChooseType={setChooseType}
        navigation={navigation} />
    </View>
  </SafeAreaView>;
};

const WelcomeOrChooseType = (
  { isDarkMode, currentPageState, isChooseType, setChooseType, navigation }: { isDarkMode: boolean, currentPageState: [any, DispatchWithCallback<React.SetStateAction<any>>], isChooseType: boolean, setChooseType: (chooseType: boolean) => void, navigation: any }
) => isChooseType ? <ChooseTypeView isDarkMode={isDarkMode} navigation={navigation} /> : <Welcome isDarkMode={isDarkMode} currentPageState={currentPageState} setChooseType={setChooseType} navigation={navigation} />;


const Welcome = ({ isDarkMode, currentPageState, setChooseType, navigation }: { isDarkMode: boolean, currentPageState: [any, DispatchWithCallback<React.SetStateAction<any>>], setChooseType: (chooseType: boolean) => void, navigation: any }) => {

  const { width, height } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentPage, setCurrentPage] = currentPageState;

  const animatedCurrent = useRef(Animated.divide(scrollX, width)).current;
  return <View style={stylesColorful(isDarkMode).logContainer}>
    <PageIndicator
      style={styles.pageIndicator}
      count={CONST.WELCOME_PAGES.length}
      variant={'morse'}
      current={animatedCurrent}
    />
    <Animated.ScrollView
      horizontal={true}
      pagingEnabled={true}
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={(event) => {
        const index = Math.round(parseFloat('' + (event.nativeEvent.contentOffset.x / Dimensions.get('window').width)));
        if (currentPage !== index) {
          setCurrentPage(index);
        }
      }}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
      })}>
      {CONST.WELCOME_PAGES.map((page, index) => {
        return <View key={index} style={[styles.page, { width, height }]}>
          <View style={styles.pageContainer}>
            <Text style={stylesColorful(isDarkMode).mainText}>{page.mainText}</Text>
            <Text style={stylesColorful(isDarkMode).subText}>{page.subText}</Text>
          </View>
        </View>;
      }
      )}
    </Animated.ScrollView>
    <TouchableHighlight
      style={styles.bottomButton}
      onPress={() => {
        setChooseType(true);
        //navigation.navigate(CONST.LOG_In_ADMIN, { isDark: isDarkMode });
      }}
      underlayColor={COL.MAIN_WHITER}>
      <Text style={styles.textBottom}>Submit</Text>
    </TouchableHighlight>
  </View>;
};

const ChooseTypeView = ({ isDarkMode, navigation }: { isDarkMode: boolean, navigation: any }) => {
  return <View style={stylesColorful(isDarkMode).chooseContainer}>
    <TouchableHighlight
      style={stylesColorful(isDarkMode).chooseButton}
      onPress={() => navigation.replace(CONST.LOG_In, { isDark: isDarkMode, isDoctor: true })}
      underlayColor={COL.MAIN_WHITER}>
      <Text style={stylesColorful(isDarkMode).textChooseType}>Sign as {'\n'} Doctor</Text>
    </TouchableHighlight>
    <TouchableHighlight
      style={stylesColorful(isDarkMode).chooseButton}
      onPress={() => navigation.replace(CONST.LOG_In, { isDark: isDarkMode, isDoctor: false })}
      underlayColor={COL.MAIN_WHITER}>
      <Text style={stylesColorful(isDarkMode).textChooseType}>Sign as {'\n'} Healthcare partner</Text>
    </TouchableHighlight>
  </View>;
};


const FetchImg = ({ index }: { index: number }) => {
  if (index === 0) {
    return <Image style={styles.docImageStyle}
      resizeMode={'cover'}
      fadeDuration={500}
      source={welcome1} />;
  } else if (index === 1) {
    return <Image style={styles.docImageStyle}
      resizeMode={'cover'}
      fadeDuration={500}
      source={welcome2} />;
  } else {
    return <Image style={styles.docImageStyle}
      resizeMode={'cover'}
      fadeDuration={500}
      source={welcome3} />;
  }
};

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    flex: 1,
  },
  mainContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    marginTop: STATUSBAR_HEIGHT,
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
    width: '100%',
    height: '100%',
    position: 'absolute',
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
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    marginBottom: 50 + navbarHeight,
    flexDirection: 'column',
    alignItems: 'center',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    elevation: 10,
    marginTop: 250,
    shadowColor: COL.WHITE,
    backgroundColor: COL.BLACK_55,
  },
  bottomButton: {
    width: 150,
    height: 50,
    backgroundColor: COL.MAIN,
    borderRadius: 20,
    elevation: 5,
    margin: 10,
    shadowColor: COL.WHITE,
    alignItems: 'center',
  },
  pageIndicator: {
    marginTop: 20,
    position: 'absolute',
  },
  page: {
    marginTop: 30,
    alignItems: 'center',
    flexDirection: 'column',
  },
  pageContainer: {
    margin: 20,
    alignItems: 'center',
    flexDirection: 'column',
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
      color: isDark ? COL.WHITE : COL.BLACK,
    },
    sectionDescription: {
      marginTop: 30,
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      color: isDark ? COL.WHITE : COL.BLACK,
    },
    logContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      elevation: 10,
      marginTop: 250,
      flex: 1,
      shadowColor: COL.WHITE,
      backgroundColor: isDark ? COL.BLACK : COL.WHITE,
    },
    chooseContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      justifyContent: 'center',
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      elevation: 10,
      marginTop: 250,
      flex: 1,
      shadowColor: COL.WHITE,
      backgroundColor: isDark ? COL.BLACK : COL.WHITE,
    },
    mainText: {
      fontSize: 32,
      fontWeight: '600',
      color: isDark ? '#a4a4de' : '#2A2A37',
      textAlign: 'center',
    },
    subText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#a4a4de80' : '#2A2A3780',
      textAlign: 'center',
    },
    chooseButton: {
      width: 150,
      height: 150,
      backgroundColor: isDark ? COL.BLACK_46 : COL.WHITE_226,
      borderRadius: 20,
      elevation: 5,
      margin: 10,
      shadowColor: COL.MAIN_WHITER,
      alignItems: 'center',
    },
    textChooseType: {
      fontWeight: '700',
      fontSize: 15,
      textAlign: 'center',
      paddingTop: 55,
      width: '100%',
      height: '100%',
      color: isDark ? COL.WHITE : COL.BLACK,
      textTransform: 'capitalize',
    },
  });
};


export default SplashScreen;
