import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableHighlight,
  Image,
} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { FetchIsDarkMode, navbarHeight } from '../../global/dims';
import { HiddenUnhidden, LogoSvg } from '../../assets/logo';
import React from 'react';
import * as CONST from '../../global/const';
import * as COL from '../../global/styles';
import { ExpendCollapseView, LoadingButton, ScrollUpDown } from '../../global/baseView';
import { signIn, signInWithGoogle, signUp, signUpWithGoogle, uploadCertificates, uploadPersonalImage } from '../../firebase/fireAuth';
import { DoctorSack, UserSack, createDoctorSack, createUserSack } from '../../global/model';
import SelectedOptionPicker from '../../component/selectedOptionPicker/SelectedOptionPicker';
import { fetchAdmin, fireBaseCreateUser } from '../../firebase/fireStore';
import { checkPermissionTokenFirst, sendFcmMessage } from '../../firebase/firebaseMessaging';
import { ellipse1, ellipse3, google } from '../../assets';
import { name as appName } from '../../../app.json';
import { pushLocalNotification } from '../../global/utils';

type Props = {
  doctorBio: string | null,
  doctorSpec: CONST.PairTwoSack | null,
  uploadAuth: string[],
  uploadAuthLoading: boolean,
  personalImg: string | null,
  personalImgLoading: boolean,
  emailTXT: string | null,
  telTXT: string | null,
  nameTXT: string | null,
  passwordTXT: string | null,
  isSignUp: boolean,
  hidePass: boolean,
  hideEye: boolean,
  spinner: boolean,
  showPicker: boolean,
  name: CONST.PairTwoSack,
}

type IProps = {
  doctorBio?: string | null,
  doctorSpec?: CONST.PairTwoSack | null,
  uploadAuth?: string[],
  uploadAuthLoading?: boolean,
  personalImg?: string | null,
  personalImgLoading?: boolean,
  emailTXT?: string | null,
  telTXT?: string | null,
  nameTXT?: string | null,
  passwordTXT?: string | null,
  isSignUp?: boolean,
  hidePass?: boolean,
  hideEye?: boolean,
  spinner?: boolean,
  showPicker?: boolean,
  name?: CONST.PairTwoSack,
}

const SignScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { isDark } = route.params;
  const isDarkMode: boolean = route.params != null ? isDark : FetchIsDarkMode();
  const { isDoctor } = route.params;

  const emailRef = React.useRef<TextInput>(null);
  const telRef = React.useRef<TextInput>(null);
  const passwordRef = React.useRef<TextInput>(null);

  const [state, dispatch] = React.useReducer<(prevState: Props, action: IProps) => Props>(
    (state: Props, newState: IProps) => ({ ...state, ...newState }),
    {
      doctorBio: null,
      doctorSpec: null,
      uploadAuth: [],
      uploadAuthLoading: false,
      personalImg: null,
      personalImgLoading: false,
      emailTXT: null,
      telTXT: null,
      nameTXT: null,
      passwordTXT: null,
      isSignUp: true,
      hidePass: true,
      hideEye: true,
      spinner: false,
      showPicker: false,
      name: CONST.DOCTORS_FELIDS[0],
    } as Props,
  );

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

  const signWithGoogle = () => {
    if (state.spinner) {
      return;
    }
    updateSpinner(true);
    signInWithGoogle((user) => {
      updateSpinner(false);
      if (user instanceof UserSack) {
        navigation.replace(CONST.HOME_SCREEN_USER, { data: user.asJsonAll(), togglePos: 1, isDark: isDarkMode });
      } else {
        navigation.replace(CONST.HOME_SCREEN_DOCTOR, { data: user.asJsonAll(), togglePos: 1, isDark: isDarkMode });
      }
    }, () => {
      updateSpinner(false);
      pushLocalNotification('Something went wrong!', '', false);
    });
  };

  const checkForSignUp = (isGoogle: boolean, invoke: () => void) => {
    if (state.spinner) {
      return;
    }
    if (isDoctor && state.uploadAuth.length === 0) {
      pushLocalNotification('Please Upload any Medical certificate', '', false);
      updateSpinner(false);
      return;
    }
    if (isDoctor && (state.doctorBio === null || state.doctorBio.length === 0)) {
      pushLocalNotification('Please Enter Your Bio', '', false);
      updateSpinner(false);
      return;
    }
    if (isDoctor && (state.doctorSpec === null || state.doctorSpec.name.length === 0)) {
      pushLocalNotification('Please Enter Your specialist', '', false);
      updateSpinner(false);
      return;
    }
    if (isGoogle) {
      invoke();
      return;
    }
    if (state.nameTXT === null || state.nameTXT.length === 0) {
      pushLocalNotification('Full name shouldn\'t be empty', '', false);
      updateSpinner(false);
      return;
    }
    if (state.emailTXT === null || state.emailTXT.length === 0) {
      pushLocalNotification('email shouldn\'t be empty', '', false);
      updateSpinner(false);
      return;
    }
    if (state.telTXT === null || state.telTXT.length === 0) {
      pushLocalNotification('Mobile number shouldn\'t be empty', '', false);
      updateSpinner(false);
      return;
    }
    if (state.passwordTXT === null || state.passwordTXT.length === 0) {
      pushLocalNotification('Password shouldn\'t be empty', '', false);
      updateSpinner(false);
      return;
    }
    invoke();
  };

  const returnNewUserFromGoogle = (user: UserSack, fcmToken: string): UserSack | DoctorSack => {
    return isDoctor ? createDoctorSack(
      {
        userAuthID: user.userAuthID,
        nameDoc: user.nameUser,
        email: user.email,
        mobile: user.mobile,
        specialistDoc: state.doctorSpec!.name,
        specialistId: state.doctorSpec!.id,
        personalImage: user.personalImage,
        doctorBio: '',
        doctorAuth: state.uploadAuth!!,
        approved: false,
        doctorEditedBio: state.doctorBio!!,
        doctorDocId: '',
        fcmToken: fcmToken,
      }
    ) : createUserSack({
      userAuthID: user.userAuthID,
      userDocumentID: '',
      nameUser: user.nameUser,
      email: user.email,
      mobile: user.mobile,
      personalImage: user.personalImage,
      fcmToken: fcmToken,
    });
  };

  const signUpGoogle = () => {
    checkForSignUp(true, () => {
      updateSpinner(true);
      signUpWithGoogle(state.personalImg ? state.personalImg : '', (user) => {
        updateSpinner(false);
        checkPermissionTokenFirst((fcmToken) => {
          const newUser = returnNewUserFromGoogle(user, fcmToken);
          navigateAfterSignUpGoogle(newUser);
        });
      }, () => {
        updateSpinner(false);
        pushLocalNotification('Something went wrong!', '', false);
      });
    });
  };

  const navigateAfterSignUpGoogle = (newUser: UserSack | DoctorSack) => {
    fireBaseCreateUser(newUser, () => {
      updateSpinner(false);
      if (newUser instanceof DoctorSack) {
        fetchAdmin((admin) => {
          sendFcmMessage({
            token: admin?.fcmToken,
            data: { id: newUser.doctorDocId, type: CONST.FCM_NEW_DOCTOR_CONFIRMATION, navigator: CONST.DOCTOR_DETAIL, data: newUser.doctorDocId },
            tittle: 'New Doctor',
            msg: `Doctor ${newUser.nameDoc} waiting for approvement`,
          },
            () => {
              updateSpinner(false);
              navigation.navigate(CONST.HOME_SCREEN_DOCTOR, { data: newUser.asJsonAll(), togglePos: 1, isDark: isDarkMode });
            }
          );
        }, () => {
          updateSpinner(false);
          navigation.navigate(CONST.HOME_SCREEN_USER, { data: newUser.asJsonAll(), togglePos: 1, isDark: isDarkMode });
        });
      } else {
        updateSpinner(false);
        navigation.navigate(CONST.HOME_SCREEN_USER, { data: newUser.asJsonAll(), togglePos: 1, isDark: isDarkMode });
      }
    }, () => {
      updateSpinner(false);
      pushLocalNotification('Something went wrong!', '', false);
    });
  };

  const returnNewUser = (signedUpuId: string, fcmToken: string) => {
    return isDoctor ? createDoctorSack(
      {
        userAuthID: signedUpuId,
        nameDoc: state.nameTXT!!,
        email: state.emailTXT!!,
        mobile: state.telTXT!!,
        specialistDoc: state.doctorSpec!.name,
        specialistId: state.doctorSpec!.id,
        personalImage: state.personalImg ? state.personalImg : '',
        doctorBio: '',
        doctorAuth: state.uploadAuth!!,
        approved: false,
        doctorEditedBio: state.doctorBio!!,
        doctorDocId: '',
        fcmToken: fcmToken,
      }
    ) : createUserSack({
      userAuthID: signedUpuId,
      userDocumentID: '',
      nameUser: state.nameTXT!!,
      email: state.emailTXT!!,
      mobile: state.telTXT!!,
      personalImage: state.personalImg ? state.personalImg : '',
      fcmToken: fcmToken,
    });
  };

  const signUpFun = () => {
    checkForSignUp(false, () => {
      signUp(state.emailTXT!!, state.passwordTXT!!, (signedUpuId) => {
        checkPermissionTokenFirst((fcmToken) => {
          const newUser = returnNewUser(signedUpuId, fcmToken);
          navigateAfterSignUp(newUser);
        });
      }, (message) => {
        updateSpinner(false);
        pushLocalNotification('Failed', message, false);
      });
    });
    updateSpinner(true);
  };

  const navigateAfterSignUp = (newUser: UserSack | DoctorSack) => {
    fireBaseCreateUser(newUser, () => {
      updateSpinner(false);
      if (isDoctor) {
        navigation.navigate(CONST.HOME_SCREEN_DOCTOR, { data: newUser.asJsonAll(), togglePos: 1, isDark: isDarkMode });
      } else {
        navigation.navigate(CONST.HOME_SCREEN_USER, { data: newUser.asJsonAll(), togglePos: 1, isDark: isDarkMode });
      }
    }, () => {
      updateSpinner(false)
      pushLocalNotification('Something went wrong!', '', false);
    });
  };

  const signInFun = () => {
    if (state.spinner) {
      return;
    }
    if (state.emailTXT === null || state.emailTXT.length === 0) {
      updateSpinner(false);
      pushLocalNotification('email shouldn\'t be empty', '', false);
      return;
    }
    if (state.passwordTXT === null || state.passwordTXT.length === 0) {
      updateSpinner(false);
      pushLocalNotification('Password shouldn\'t be empty', '', false);
      return;
    }
    updateSpinner(true);
    signIn(state.emailTXT, state.passwordTXT, (user) => {
      updateSpinner(false);
      if (user instanceof UserSack) {
        navigation.replace(CONST.HOME_SCREEN_USER, { data: user.asJsonAll(), togglePos: 1, isDark: isDarkMode });
      } else {
        navigation.replace(CONST.HOME_SCREEN_DOCTOR, { data: user.asJsonAll(), togglePos: 1, isDark: isDarkMode });
      }
    }, () => {
      updateSpinner(false);
      pushLocalNotification('Failed', '', false);
    });
  };

  return <ScrollUpDown isDarkMode={isDarkMode} child={
    <View style={styles.mainContainer}>
      <Spinner
        visible={state.spinner}
        textContent={'Loading...'}
        color={isDarkMode ? COL.WHITE : COL.BLACK}
        textStyle={{ color: isDarkMode ? COL.WHITE : COL.BLACK }}
        animation={'fade'}
        cancelable={false}
        overlayColor={isDarkMode ? COL.SHADOW_WHITE : COL.SHADOW_BLACK}
      />
      <View style={styles.loginContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoContainerLin}>
            <View style={styles.logoStyle}>
              <LogoSvg />
            </View>
            <Text style={stylesColorful(isDarkMode).highlight}>{appName}</Text>
          </View>
        </View>
        <View style={styles.logoContainerBack}>
          <Image style={styles.logoContainerStart} resizeMode={'stretch'} source={ellipse3} />
          <Image style={styles.logoContainerEnd} resizeMode={'stretch'} source={ellipse1} />
        </View>
      </View>
      <View style={stylesColorful(isDarkMode).logContainer}>
        <FetchTextForTitle isSignUp={state.isSignUp} isDarkMode={isDarkMode} />
        <ExpendCollapseView visible={state.isSignUp}>
          <View style={stylesColorful(isDarkMode).textInputContainer}>
            <TextInput
              style={stylesColorful(isDarkMode).textInput}
              autoComplete="name"
              placeholder="Full Name"
              returnKeyType="next"
              placeholderTextColor={isDarkMode ? COL.WHITE_200 : COL.BLACK_46}
              onSubmitEditing={() => {
                emailRef?.current?.focus();
              }}
              onChangeText={newText => dispatch({ nameTXT: newText })}
            />
          </View>
        </ExpendCollapseView>
        <View style={stylesColorful(isDarkMode).textInputContainer}>
          <TextInput
            style={stylesColorful(isDarkMode).textInput}
            autoComplete="email"
            placeholder="Email"
            returnKeyType="next"
            placeholderTextColor={isDarkMode ? COL.WHITE_200 : COL.BLACK_46}
            ref={emailRef}
            onSubmitEditing={() => {
              if (state.isSignUp) {
                telRef?.current?.focus();
              } else {
                passwordRef?.current?.focus();
              }
            }}
            onChangeText={newText => dispatch({ emailTXT: newText })}
          />
        </View>
        <ExpendCollapseView visible={state.isSignUp}>
          <View style={stylesColorful(isDarkMode).textInputContainer}>
            <TextInput
              style={stylesColorful(isDarkMode).textInput}
              autoComplete="tel"
              placeholder="Mobile Number"
              returnKeyType="next"
              keyboardType="phone-pad"
              placeholderTextColor={isDarkMode ? COL.WHITE_200 : COL.BLACK_46}
              ref={telRef}
              onSubmitEditing={() => {
                passwordRef?.current?.focus();
              }}
              onChangeText={newText => dispatch({ telTXT: newText })}
            />
          </View>
        </ExpendCollapseView>
        <View style={stylesColorful(isDarkMode).textInputContainer}>
          <TextInput
            style={stylesColorful(isDarkMode).textInput}
            autoComplete="password"
            placeholder="          Password"
            returnKeyType="done"
            placeholderTextColor={isDarkMode ? COL.WHITE_200 : COL.BLACK_46}
            ref={passwordRef}
            secureTextEntry={state.hidePass ? true : false}
            onChangeText={(newText) => {
              const isNotEmpty = newText != null && newText?.trim()?.length !== 0;
              if (state.hideEye && isNotEmpty) {
                dispatch({ hideEye: false, passwordTXT: newText })
              } else if (!state.hideEye && !isNotEmpty) {
                dispatch({ hideEye: true, passwordTXT: newText })
              } else {
                dispatch({ passwordTXT: newText })
              }
            }}
            onSubmitEditing={state.isSignUp ? signUpFun : signInFun}
          />
          <TouchableHighlight style={styleEye(state.hideEye).eyeLogo}
            underlayColor={COL.MAIN_PALE}
            onPress={() => dispatch({ hidePass: !state.hidePass })}>
            <HiddenUnhidden color={isDarkMode ? COL.WHITE : COL.BLACK} hidePass={state.hidePass} />
          </TouchableHighlight>
        </View>
        <ExpendCollapseView visible={isDoctor && state.isSignUp}>
          <View style={stylesColorful(isDarkMode).textInputContainer}>
            <TouchableHighlight
              style={styles.pickerClickStyle}
              onPress={() => dispatch({ showPicker: true })}
              underlayColor={COL.MAIN_PALE}>
              <Text
                style={[stylesColorful(isDarkMode).textInputSpecialist, { color: state.doctorSpec === null ? (isDarkMode ? COL.WHITE_200 : COL.BLACK_46) : (isDark ? COL.WHITE : COL.BLACK) }]}
              >{state.doctorSpec === null ? 'Select specialist' : state.doctorSpec.name}</Text>
            </TouchableHighlight>
            <SelectedOptionPicker
              showPicker={state.showPicker}
              data={CONST.DOCTORS_FELIDS}
              pickerTitle={'Select specialist'}
              checkBoxType={'circle'}
              itemTitleKey={'name'}
              primaryColor={COL.MAIN}
              itemTitleValue={state.name.name}
              itemUniqueKey={'id'}
              itemUniqueValue={state.name.id}
              enableSearch={true}
              searchPlaceholder={'Search specialist'}
              emptyTitle={'No specialist(s) Found'}
              onDonePress={() => dispatch({ showPicker: false })}
              onCancelPress={() => dispatch({ showPicker: false })}
              onItemChange={(item: any) => {
                dispatch({ name: item, doctorSpec: item })
              }} />
          </View>
        </ExpendCollapseView>
        <ExpendCollapseView visible={isDoctor && state.isSignUp}>
          <View style={stylesColorful(isDarkMode).textInputContainerBio}>
            <TextInput
              style={stylesColorful(isDarkMode).textInput}
              multiline={true}
              placeholder="Doctor Bio"
              returnKeyType="default"
              placeholderTextColor={isDarkMode ? COL.WHITE_200 : COL.BLACK_46}
              ref={telRef}
              onSubmitEditing={() => {
                passwordRef?.current?.focus();
              }}
              onChangeText={newText => dispatch({ doctorBio: newText })}
            />
          </View>
        </ExpendCollapseView>
        <ExpendCollapseView visible={state.isSignUp}>
          <TouchableHighlight
            style={styles.uploadImage}
            onPress={() => {
              dispatch({ personalImgLoading: true })
              uploadPersonalImage((uri) => {
                dispatch({ personalImg: uri, personalImgLoading: false })
              }, () => {
                pushLocalNotification('Failed', '', false)
                dispatch({ personalImgLoading: false })
              })
            }}
            underlayColor={COL.MAIN_WHITER}>
            <LoadingButton
              style={styles.textUploadImg}
              text={state.personalImg === null ? 'Upload personal Image' : 'Done'}
              isLoading={state.personalImgLoading} />
          </TouchableHighlight>
        </ExpendCollapseView>
        <ExpendCollapseView visible={isDoctor && state.isSignUp}>
          <TouchableHighlight
            style={styles.uploadImage}
            onPress={() => {
              dispatch({ uploadAuthLoading: true })
              uploadCertificates((uri: string[]) => {
                dispatch({ uploadAuth: uri, uploadAuthLoading: false })
              }, () => {
                pushLocalNotification('Failed', '', false)
                dispatch({ uploadAuthLoading: false })
              })
            }}
            underlayColor={COL.MAIN_WHITER}>
            <LoadingButton
              style={styles.textUploadImg}
              text={state.uploadAuth.length === 0 ? 'Upload Medical certificate' : 'Done'}
              isLoading={state.uploadAuthLoading} />
          </TouchableHighlight>
        </ExpendCollapseView>
        <TouchableHighlight
          style={styles.bottomButton}
          onPress={state.isSignUp ? signUpFun : signInFun}
          underlayColor={COL.MAIN_WHITER}>
          <FetchTextForButton isSignUp={state.isSignUp} />
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.bottomSignGoogle}
          onPress={state.isSignUp ? signUpGoogle : signWithGoogle}
          underlayColor={COL.MAIN_PALE}>
          <View style={styles.signGoogleCont}>
            <FetchTextForGoogle isSignUp={state.isSignUp} />
            <Image style={styles.googleLogo}
              source={google} />
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          style={styles.styleForAlready}
          underlayColor={COL.MAIN_PALE}
          onPress={() => dispatch({ isSignUp: !state.isSignUp })}>
          <FetchTextFor isSignUp={state.isSignUp} isDarkMode={isDarkMode} />
        </TouchableHighlight>
        <View style={{ height: navbarHeight }} />
      </View>
    </View>
  } />;
};


const FetchTextForButton = ({ isSignUp }: { isSignUp: boolean }) => {
  if (isSignUp) {
    return <Text style={styles.textBottom}>Sign up</Text>;
  } else {
    return <Text style={styles.textBottom}>Log In</Text>;
  }
};

const FetchTextForTitle = ({ isSignUp, isDarkMode }: { isSignUp: boolean, isDarkMode: boolean }) => {
  if (isSignUp) {
    return <Text style={stylesColorful(isDarkMode).textReg}>Register</Text>;
  } else {
    return <Text style={stylesColorful(isDarkMode).textReg}>Log In</Text>;
  }
};

const FetchTextForGoogle = ({ isSignUp }: { isSignUp: boolean }) => {
  if (isSignUp) {
    return <Text style={styles.textSignGoogle}>Sign Up with Google</Text>;
  } else {
    return <Text style={styles.textSignGoogle}>Sign In with Google</Text>;
  }
};


const FetchTextFor = ({ isSignUp, isDarkMode }: { isSignUp: boolean, isDarkMode: boolean }) => {
  if (isSignUp) {
    return <Text style={stylesColorful(isDarkMode).alreadyButton}>
      Already have an account? {'\n'}
      <Text
        style={stylesColorful(isDarkMode).alreadyButtonBlue}>
        Sign In
      </Text>
    </Text>;
  } else {
    return <Text
      style={stylesColorful(isDarkMode).alreadyButtonBlue}>
      Sign Up
    </Text>;
  }
};


const styles = StyleSheet.create({
  scrollStyle: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  mainContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    flex: 1,
  },
  logoContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  logoContainerBack: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    position: 'absolute',
    width: '100%',
  },
  loginContainer: {
    flex: 1,
  },
  logoContainerLin: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainerStart: {
    width: 90,
    height: 200,
    start: 0,
    top: 30,
    position: 'absolute',
  },
  logoContainerEnd: {
    width: 90,
    height: 200,
    end: 0,
    top: 30,
    position: 'absolute',
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
  sectionDescription: {
    marginTop: 30,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textBottom: {
    fontWeight: '900',
    fontSize: 19,
    flex: 1,
    paddingTop: 20,
    color: COL.WHITE,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  textUploadImg: {
    fontWeight: '500',
    fontSize: 19,
    flex: 1,
    paddingTop: 20,
    color: COL.WHITE,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  bottomContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: navbarHeight,
  },
  bottomSignGoogle: {
    width: 275,
    height: 48,
    backgroundColor: COL.WHITE,
    borderRadius: 20,
    elevation: 10,
    marginTop: 40,
    marginBottom: 20,
    shadowColor: COL.MAIN_WHITER,

    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  styleForAlready: {
    padding: 10,
    borderRadius: 7,
    marginBottom: 10,
  },
  signGoogleCont: {
    width: 275,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  googleLogo: {
    width: 40,
    height: 48,
    marginEnd: 10,
    marginStart: 10,
    resizeMode: 'contain',
  },
  textSignGoogle: {
    fontWeight: '900',
    fontSize: 19,
    color: COL.BLACK,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  bottomButton: {
    width: 280,
    height: 63,
    backgroundColor: COL.MAIN,
    borderRadius: 20,
    elevation: 10,
    marginTop: 40,
    shadowColor: COL.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadImage: {
    width: 280,
    height: 63,
    backgroundColor: COL.GREY,
    borderRadius: 10,
    elevation: 10,
    marginTop: 40,
    shadowColor: COL.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBoxStyle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    flex: 0,
    flexDirection: 'row',
  },
  checkBoxIcon: { borderWidth: 2 },
  item: {
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#FFF',
  },
  label: {
    color: '#333',
  },
  itemSelected: {
    backgroundColor: '#333',
  },
  labelSelected: {
    color: '#FFF',
  },
  pickerClickStyle: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
});

const styleEye = (hideEye: boolean) => {
  return StyleSheet.create({
    eyeLogo: {
      width: 40,
      height: 40,
      padding: 10,
      flex: 0,
      justifyContent: 'flex-end',
      borderRadius: 20,
      opacity: !hideEye ? 100 : 0,
    },
  });
};


const stylesColorful = (isDark: boolean) => {
  return StyleSheet.create({
    backgroundStyle: {
      backgroundColor: isDark ? COL.BACK_DARK : COL.BACK_LIGHT,
      width: '100%',
      height: '100%',
    },
    logContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      elevation: 10,
      marginTop: 200,
      shadowColor: COL.WHITE,
      backgroundColor: isDark ? COL.BLACK_55 : COL.WHITE_196,
    },
    textReg: {
      fontSize: 24,
      textTransform: 'capitalize',
      marginTop: 15,
      color: isDark ? COL.WHITE : COL.BLACK,
    },
    selectContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      flex: 0,
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
      marginTop: 20,
      flex: 0,
      flexDirection: 'row',
    },
    boxTextStyle: {
      fontFamily: 'JosefinSans-Regular',
      textDecorationLine: 'none',
      color: isDark ? COL.WHITE : COL.BLACK,
    },
    alreadyButton: {
      fontWeight: '900',
      fontSize: 18,
      color: isDark ? COL.WHITE : COL.BLACK,
      textAlign: 'center',
    },
    alreadyButtonBlue: {
      fontWeight: '900',
      fontSize: 18,
      color: COL.MAIN_WHITER,
      textAlign: 'center',
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
    textInputContainerBio: {
      width: 277,
      minHeight: 63,
      backgroundColor: isDark ? COL.BLACK_26 : COL.WHITE_226,
      borderRadius: 20,
      elevation: 10,
      alignItems: 'center',
      shadowColor: COL.BLACK,
      justifyContent: 'center',
      marginTop: 20,
      flex: 0,
      flexDirection: 'row',
    },
    highlight: {
      fontWeight: '700',
      fontSize: 18,
      color: isDark ? COL.WHITE : COL.BLACK,
    },
  });
};

export default SignScreen;
