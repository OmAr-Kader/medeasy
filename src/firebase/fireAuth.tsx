import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { DoctorSack as DoctorSack, UserSack, createUserSack } from '../global/model';
import { CLIENT_ID, CREDENTIAL_FIREBASE, FCM_TOKEN, PERSONAL_IMG, USER_DOCUMENT_ID, USER_ID_AUTH, USER_IS_DOCTOR, WEB_CLIENT_SECRET } from '../global/const';
import firebase, { ReactNativeFirebase } from '@react-native-firebase/app';
import { launchImageLibrary } from 'react-native-image-picker';
import { fetchForSignIn, fetchForSignInAdmin } from './fireStore';
import { isSafeToUse, logger, removeMultiPref, updatePref } from '../global/utils';

export const uploadPersonalImage = (done: (firestoneUri: string) => void, failed: () => void) => {
    launchImageLibrary({
        selectionLimit: 1,
        mediaType: 'photo',
        includeBase64: false,
    }).then((result) => {
        if (result.assets !== null && result.assets !== undefined && result.assets?.length !== 0) {
            const uri = result.assets[0].uri;
            if (uri === undefined) {
                failed();
                return;
            }
            console.log('AAAAAAAAAAA' + '1')
            intiFirebase((app) => {
                const task = storage(app).ref().child(PERSONAL_IMG).child(('' + (Date.now()) + '' + Math.random()).replace('.', '').trim());
                task.putFile(uri).then(() => {
                    task.getDownloadURL().then((firestoneUri) => {
                        done(firestoneUri);
                    }).catch((e) => {
                        failed();
                        logger('Error: getDownloadURL ' + e);
                    });
                }).catch((e) => {
                    failed();
                    logger('Error: storage ' + e);
                });
            });
        } else {
            failed();
        }
    }).catch((e) => {
        failed();
        logger('Error: ' + e);
    });
};


export const uploadCertificates = (done: (firestoneUri: string[]) => void, failed: () => void) => {
    launchImageLibrary({
        selectionLimit: 0,
        mediaType: 'photo',
        includeBase64: false,
    }).then((result) => {
        if (result.assets !== null && result.assets !== undefined && result.assets?.length !== 0) {
            if (result.assets[0]?.uri === undefined) {
                failed();
                return;
            }
            intiFirebase((app) => {
                const uris: string[] = [];
                result.assets?.forEach((value, index) => {
                    const uri = value?.uri
                    if (uri !== undefined) {
                        const task = storage(app).ref().child(PERSONAL_IMG).child(('' + (Date.now()) + '' + Math.random()).replace('.', '').trim());
                        task.putFile(uri).then(() => {
                            task.getDownloadURL().then((firestoneUri) => {
                                uris.push(firestoneUri);
                                if (index === (result.assets!!.length - 1)) {
                                    done(uris);
                                }
                            }).catch((e) => {
                                failed();
                                logger('Error: getDownloadURL ' + e);
                            });
                        }).catch((e) => {
                            failed();
                            logger('Error: storage ' + e);
                        });
                    }
                });
            });
        }
    }).catch((e) => {
        failed();
        logger('Error: ' + e);
    });
};

export const intiFirebase = (invoke: (app: ReactNativeFirebase.FirebaseApp) => void) => {
    if (!firebase.apps.length) {
        firebase.initializeApp(CREDENTIAL_FIREBASE).then((app) => {
            invoke(app);
        });
    } else {
        invoke(firebase.app());
    }
};

export const signIn = (email: string, password: string, done: (user: UserSack | DoctorSack) => void, failed: () => void, ifAdmin: boolean = false) => {
    intiFirebase((app) => {
        auth(app).signInWithEmailAndPassword(email.trim(), password.trim()).then((google) => {
            const googleUser = google?.user;
            if (googleUser === null || googleUser?.uid === null) {
                failed();
                logger('Error: ' + 'googleUser === null || googleUser?.uid === null');
                return;
            }
            if (ifAdmin) {
                isSafeToUse(googleUser?.uid, () => {
                    fetchForSignInAdmin(googleUser?.uid, done, failed);
                }, () => {
                    failed();
                    logger('Error: isSaveToUse signIn');
                })
            } else {
                isSafeToUse(googleUser?.uid, () => {
                    fetchForSignIn(googleUser?.uid, done, failed);
                }, () => {
                    failed();
                    logger('Error: isSaveToUse signIn');
                })
            }
        }).catch((e) => {
            failed();
            logger('Error: ' + e);
        });
    });
};

export const signInWithGoogle = (done: (user: UserSack | DoctorSack) => void, failed: () => void, ifAdmin: boolean = false) => {
    intiFirebase((app) => {
        GoogleSignin.configure({ webClientId: CLIENT_ID });
        GoogleSignin.signIn().then(({ idToken }) => {
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);
            auth(app).signInWithCredential(googleCredential).then((google) => {
                const googleUser = google?.user;
                if (googleUser?.uid === null) {
                    failed();
                    logger('Error: ' + 'googleUser?.uid === null');
                    return;
                }
                if (ifAdmin) {
                    fetchForSignInAdmin(googleUser?.uid, done, failed);
                } else {
                    fetchForSignIn(googleUser?.uid, done, failed);
                }
            }).catch((e) => {
                failed();
                logger('Error: ' + e);
            });
        }).catch((e) => {
            failed();
            logger('Error: ' + e);
        });
    });
};

export const signUpWithGoogle = (personalImg: string | null, done: (user: UserSack) => void, failed: () => void) => {
    try {
        intiFirebase((app) => {
            GoogleSignin.configure({ webClientId: CLIENT_ID, offlineAccess: false, scopes: ['email', 'https://www.googleapis.com/auth/user.phonenumbers.read'] }); // 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/user.phonenumbers.read', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'
            GoogleSignin.signIn().then(({ idToken }) => {
                const googleCredential = firebase.auth.GoogleAuthProvider.credential(idToken);
                auth(app).signInWithCredential(googleCredential).then((google) => {
                    const googleUser = google?.user;
                    if (googleUser === null || googleUser.displayName === null || googleUser.email === null || googleUser?.uid === null) {
                        failed();
                        logger('Error: ' + 'googleUser === null || googleUser.displayName === null || googleUser.email === null || googleUser?.uid === null');
                        return;
                    }

                    const userSack = createUserSack({
                        userAuthID: googleUser.uid,
                        userDocumentID: '',
                        nameUser: googleUser.displayName,
                        email: googleUser.email,
                        mobile: googleUser.phoneNumber ? googleUser.phoneNumber : '',
                        personalImage: personalImg ? personalImg : (googleUser.photoURL ? googleUser.photoURL : ''),
                        fcmToken: '',
                    });
                    updatePref(USER_ID_AUTH, googleUser?.uid, () => {
                        done(userSack);
                    }, failed);
                }).catch((e) => {
                    failed();
                    logger('Error: signInWithCredential ' + e);
                });
            }).catch((e) => {
                failed();
                logger('Error: signIn ' + e);
            });
        });
    } catch (error: any) {
        logger('error intiFirebase' + error);
        failed();
    }
};

export const signUp = (
    email: string,
    password: string,
    done: (signedUpuId: string) => void,
    failed: (message: string,) => void
) => {
    try {
        intiFirebase((app) => {
            auth(app).fetchSignInMethodsForEmail(email).then((fetchIfNotEmpty) => {
                if (fetchIfNotEmpty.length > 0) {
                    failed('Email is Already registered');
                    logger('Error: ' + 'fetchIfNotEmpty.length > 0');
                    return;
                }
                auth(app).createUserWithEmailAndPassword(email, password).then((signedUp) => {
                    const signedUpuId = signedUp?.user?.uid;
                    if (signedUpuId === null) {
                        failed('Failed');
                        logger('Error: ' + 'signedUpuId === null');
                        return;
                    }
                    updatePref(USER_ID_AUTH, signedUpuId, () => {
                        done(signedUpuId);
                    }, () => {
                        failed('Failed');
                    });
                }).catch((e) => {
                    failed('Failed');
                    logger('Error: ' + e);
                });
            }).catch((e) => {
                failed('Failed');
                logger('Error: ' + e);
            });
        });
    } catch (error: any) {
        logger('error' + error);
        failed('Failed');
    }
};

export const signOut = (invoke: () => void) => {
    /*GoogleSignin.revokeAccess().then(() => {
        GoogleSignin.signOut().then(() => {
            auth()
                .signOut()
                .then(() => removeMultiPref([USER_ID_AUTH, USER_DOCUMENT_ID, USER_IS_DOCTOR, FCM_TOKEN], invoke));
        });
    });*/
    removeMultiPref([USER_ID_AUTH, USER_DOCUMENT_ID, USER_IS_DOCTOR, FCM_TOKEN], invoke);
};

/*
export const deleteUser = (authId: string, invoke: () => void) => {
    admin.auth(admin.initializeApp(CREDENTIAL_FIREBASE))
        .deleteUser(authId.trim())
        .then(() => {
            invoke();
        })
        .catch(() => {
            invoke();
            logger('Error fetching user data:');
        });
};*/
