import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { DoctorSack as DoctorSack, UserSack, createUserSack } from '../global/model';
import { CLIENT_ID, CREDENTIAL_FIREBASE, FCM_TOKEN, PERSONAL_IMG, USER_DOCUMENT_ID, USER_ID_AUTH, USER_IS_DOCTOR } from '../global/const';
import firebase, { ReactNativeFirebase } from '@react-native-firebase/app';
import { launchImageLibrary } from 'react-native-image-picker';
import { fetchForSignIn, fetchForSignInAdmin } from './fireStore';
import { isSafeToUse, removeMultiPref, updatePref } from '../global/utils';
//import * as admin from 'firebase-admin';

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
            intiFirebase((app) => {
                fetch(uri).then((response) => {
                    response.blob().then((blob) => {
                        const task = storage(app).ref().child(PERSONAL_IMG).child(('' + (Date.now()) + '' + Math.random()).replace('.', '').trim());
                        task.put(blob).then(() => {
                            task.getDownloadURL().then((firestoneUri) => {
                                done(firestoneUri);
                            }).catch((e) => {
                                failed();
                                console.log('Error: getDownloadURL ' + e);
                            });
                        }).catch((e) => {
                            failed();
                            console.log('Error: storage ' + e);
                        });
                    }).catch((e) => {
                        failed();
                        console.log('Error: blob ' + e);
                    });
                }).catch((e) => {
                    failed();
                    console.log('Error: response ' + e);
                });
            });
        } else {
            failed();
        }
    }).catch((e) => {
        failed();
        console.log('Error: ' + e);
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
                    if (value?.uri !== undefined) {
                        fetch(value?.uri).then((response) => {
                            response.blob().then((blob) => {
                                const task = storage(app).ref().child(PERSONAL_IMG).child(('' + (Date.now()) + '' + Math.random()).replace('.', '').trim());
                                task.put(blob).then(() => {
                                    task.getDownloadURL().then((firestoneUri) => {
                                        uris.push(firestoneUri);
                                        if (index === (result.assets!!.length - 1)) {
                                            done(uris);
                                        }
                                    }).catch((e) => {
                                        failed();
                                        console.log('Error: getDownloadURL ' + e);
                                    });
                                }).catch((e) => {
                                    failed();
                                    console.log('Error: storage ' + e);
                                });
                            }).catch((e) => {
                                failed();
                                console.log('Error: blob ' + e);
                            });
                        }).catch((e) => {
                            failed();
                            console.log('Error: response ' + e);
                        });
                    }
                });
            });
        }
    }).catch((e) => {
        failed();
        console.log('Error: ' + e);
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
                console.log('Error: ' + 'googleUser === null || googleUser?.uid === null');
                return;
            }
            if (ifAdmin) {
                isSafeToUse(googleUser?.uid, () => {
                    fetchForSignInAdmin(googleUser?.uid, done, failed);
                }, () => {
                    failed();
                    console.log('Error: isSaveToUse signIn');
                })
            } else {
                isSafeToUse(googleUser?.uid, () => {
                    console.log('==== ' + googleUser?.uid);
                    fetchForSignIn(googleUser?.uid, done, failed);
                }, () => {
                    failed();
                    console.log('Error: isSaveToUse signIn');
                })
            }
        }).catch((e) => {
            failed();
            console.log('Error: ' + e);
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
                    console.log('Error: ' + 'googleUser?.uid === null');
                    return;
                }
                if (ifAdmin) {
                    fetchForSignInAdmin(googleUser?.uid, done, failed);
                } else {
                    fetchForSignIn(googleUser?.uid, done, failed);
                }
            }).catch((e) => {
                failed();
                console.log('Error: ' + e);
            });
        }).catch((e) => {
            failed();
            console.log('Error: ' + e);
        });
    });
};

export const signUpWithGoogle = (personalImg: string | null, done: (user: UserSack) => void, failed: () => void) => {
    try {
        intiFirebase((app) => {
            GoogleSignin.configure({ webClientId: CLIENT_ID });
            GoogleSignin.signIn().then(({ idToken }) => {
                const googleCredential = auth.GoogleAuthProvider.credential(idToken);
                auth(app).signInWithCredential(googleCredential).then((google) => {
                    const googleUser = google?.user;
                    if (googleUser === null || googleUser.displayName === null || googleUser.email === null || googleUser?.uid === null) {
                        failed();
                        console.log('Error: ' + 'googleUser === null || googleUser.displayName === null || googleUser.email === null || googleUser?.uid === null');
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
                    console.log('Error: ' + e);
                });
            }).catch((e) => {
                failed();
                console.log('Error: ' + e);
            });
        });
    } catch (error: any) {
        console.log('error' + error);
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
                    console.log('Error: ' + 'fetchIfNotEmpty.length > 0');
                    return;
                }
                auth(app).createUserWithEmailAndPassword(email, password).then((signedUp) => {
                    const signedUpuId = signedUp?.user?.uid;
                    if (signedUpuId === null) {
                        failed('Failed');
                        console.log('Error: ' + 'signedUpuId === null');
                        return;
                    }
                    updatePref(USER_ID_AUTH, signedUpuId, () => {
                        done(signedUpuId);
                    }, () => {
                        failed('Failed');
                    });
                }).catch((e) => {
                    failed( 'Failed');
                    console.log('Error: ' + e);
                });
            }).catch((e) => {
                failed('Failed');
                console.log('Error: ' + e);
            });
        });
    } catch (error: any) {
        console.log('error' + error);
        failed('Failed');
    }
};

export const signOut = (invoke: () => void) => {
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
            console.log('Error fetching user data:');
        });
};*/
