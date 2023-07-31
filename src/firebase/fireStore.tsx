import firestore from '@react-native-firebase/firestore';
import { intiFirebase } from './fireAuth';
import { checkPermissionTokenFirst } from './firebaseMessaging';
import { isArraySafeToJson, updateMuliPref, updatePref } from '../global/utils';
import * as M from '../global/model';
import * as CONST from '../global/const';

export const fireBaseCreate = (collection: string, doc: M.UserSack | M.DoctorSack | M.ExaminationSack | M.AppointmentSack, done: (documentId: string) => void, failed: () => void) => {
    intiFirebase((app) => {
        firestore(app).collection(collection).add(doc.asJson()).then((docRef) => {
            done(docRef.id);
        }).catch((e) => {
            failed();
            console.log('Error: fireBaseCreate ' + e);
        });
    });
};

export const fireBaseGet = (collection: string, documentId: string, done: (any: any) => void, failed: () => void) => {
    intiFirebase((app) => {
        firestore(app).collection(collection).doc(documentId.trim()).get().then((docRef) => {
            const docRefDocs = docRef;
            if (docRefDocs === null) {
                console.log('Error: #fetchUser ' + 'docRefDocs === null || docRefDocs.length === 0');
                failed();
                return;
            }
            done(docRefDocs);
        }).catch((e) => {
            failed();
            console.log('Error: =>' + e);
        });
    });
}

export const fireBaseGetFirstOfAll = (collection: string, done: (any: any) => void, failed: () => void) => {
    intiFirebase((app) => {
        firestore(app).collection(collection).get().then((docRef) => {
            const docRefDocs = docRef?.docs;
            if (docRefDocs === null || docRefDocs.length === 0) {
                done(null);
                console.log('Error: ' + 'docRefDocs === null || docRefDocs.length === 0 =>' + docRefDocs);
                return;
            }
            done(docRefDocs[0]);
        }).catch((e) => {
            failed();
            console.log('Error: ' + e);
        });
    });
}

export const fireBaseWhere = (collection: string, filter: any, done: (any: any) => void, failed: () => void) => {
    intiFirebase((app) => {
        firestore(app).collection(collection).where(filter).get().then((docRef) => {
            const docRefDocs = docRef?.docs;
            if (docRefDocs === null || docRefDocs.length === 0) {
                console.log('Error: #fetchUser ' + 'docRefDocs === null || docRefDocs.length === 0');
                failed();
                return;
            }
            done(docRefDocs[0]);
        }).catch((e) => {
            failed();
            console.log('Error: ' + e);
        });
    });
}

export const fireBaseAllWhere = (collection: string, filter: any, done: (any: any[]) => void, failed: () => void) => {
    intiFirebase((app) => {
        firestore(app).collection(collection).where(filter).get().then((docRef) => {
            const docRefDocs = docRef?.docs;
            if (docRefDocs === null || docRefDocs.length === 0) {
                console.log('Error: #fetchUser ' + 'docRefDocs === null || docRefDocs.length === 0');
                done([]);
                return;
            }
            done(docRefDocs);
        }).catch((e) => {
            failed();
            console.log('Error:  =>> ' + e);
        });
    });
}

export const fireBaseAllWhereOri = (collection: string, field: string, value: any, done: (any: any[]) => void, failed: () => void) => {
    intiFirebase((app) => {
        firestore(app).collection(collection).where(field, '==', value).get().then((docRef) => {
            const docRefDocs = docRef?.docs;
            if (docRefDocs === null || docRefDocs.length === 0) {
                console.log('Error: #fetchUser ' + 'docRefDocs === null || docRefDocs.length === 0');
                done([]);
                return;
            }
            done(docRefDocs);
        }).catch((e) => {
            failed();
            console.log('Error: ' + e);
        });
    });
}

export const fireBaseUpdate = (collection: string, documentId: string, key: string, value: any, done: () => void, failed: () => void) => {
    intiFirebase((app) => {
        firestore(app).collection(collection).doc(documentId).update(key, value).then((docRef) => {
            done();
        }).catch((e) => {
            failed();
            console.log('Error: ' + e);
        });
    });
}

export const fireBaseSet = (collection: string, documentId: string, map: {}, done: () => void, failed: () => void) => {
    intiFirebase((app) => {
        firestore(app).collection(collection).doc(documentId).set(map, { merge: true }).then(() => {
            done();
        }).catch((e) => {
            failed();
            console.log('Error: ' + e);
        });
    });
}

export const fireBaseDelete = (collection: string, documentId: string, done: () => void, failed: () => void) => {
    intiFirebase((app) => {
        firestore(app).collection(collection).doc(documentId).delete().then(() => {
            done();
        }).catch((e) => {
            failed();
            console.log('Error: ' + e);
        });
    });
}

export const fireBaseCreateUser = (doc: M.UserSack | M.DoctorSack, done: () => void, failed: () => void) => {
    fireBaseCreate(doc instanceof M.UserSack ? CONST.USER_COLLECTION : CONST.DOCTOR_COLLECTION, doc, (documentId) => {
        updateMuliPref([[CONST.USER_DOCUMENT_ID, documentId], [CONST.USER_IS_DOCTOR, doc instanceof M.UserSack ? 'false' : 'true']], done, failed);
    }, () => failed());
};

export const fireBaseCreateAdmin = (doc: M.UserSack, done: () => void, failed: () => void) => {
    fireBaseCreate(CONST.ADMINS_COLLECTION, doc, (documentId) => {
        updatePref(CONST.USER_DOCUMENT_ID, documentId, () => {
            done();
        }, failed)
    }, () => failed());
};

export const fetchUser = (uid: string, done: (user: M.UserSack) => void, failed: () => void) => {
    fireBaseWhere(CONST.USER_COLLECTION, firestore.Filter('userAuth', '==', uid.trim()), (oneDoc) => {
        done(M.jsonToUser(oneDoc.data(), oneDoc.id));
    }, () => {
        console.log('Error: #fetchUser ' + 'oneDoc === null');
        failed();
    });
};

export const fetchUserByDocument = (documentID: string, done: (user: M.UserSack) => void, failed: () => void) => {
    fireBaseGet(CONST.USER_COLLECTION, documentID, (oneDoc) => {
        done(M.jsonToUser(oneDoc.data(), documentID));
    }, () => failed());
};

export const fetchForSignInAdmin = (uid: string, done: (user: M.UserSack | M.DoctorSack) => void, failed: () => void) => {
    fireBaseWhere(CONST.ADMINS_COLLECTION, firestore.Filter('userAuth', '==', uid.trim()), (oneDoc) => {
        const user = M.jsonToUser(oneDoc.data(), oneDoc.id);
        checkPermissionTokenFirst((fcmToken) => {
            fireBaseUpdate(CONST.ADMINS_COLLECTION, user.userDocumentID, 'fcmToken', fcmToken, () => {
                var newUser = user;
                newUser.fcmToken = fcmToken;
                afterSignInAsUser(uid, newUser, done, failed);
            }, () => failed());
        });
    }, () => failed());
};

export const fetchForSignIn = (uid: string, done: (user: M.UserSack | M.DoctorSack) => void, failed: () => void) => {
    fetchUser(uid, (user) => {
        checkPermissionTokenFirst((fcmToken) => {
            fireBaseUpdate(CONST.USER_COLLECTION, user.userDocumentID, 'fcmToken', fcmToken, () => {
                var newUser = user;
                newUser.fcmToken = fcmToken;
                afterSignInAsUser(uid, newUser, done, failed);
            }, () => failed());
        });
    }, () => {
        fetchDoctor(uid, (doctor) => {
            console.log('Error: #fetchDoctor ' + 'doctor');
            checkPermissionTokenFirst((fcmToken) => {
                console.log('Error: ' + 'fcmToken');
                fireBaseUpdate(CONST.DOCTOR_COLLECTION, doctor.doctorDocId, 'fcmToken', fcmToken, () => {
                    var newDoctor = doctor;
                    newDoctor.fcmToken = fcmToken;
                    afterSignInAsDoctor(uid, doctor, done, failed);
                }, () => failed());
            });
        }, () => {
            console.log('Error: ' + 'user === null');
            failed();
        });
    });
};

export const afterSignInAsDoctor = (uid: string, doctor: M.DoctorSack, done: (user: M.UserSack | M.DoctorSack) => void, failed: () => void) => {
    updateMuliPref([[CONST.USER_ID_AUTH, uid], [CONST.USER_DOCUMENT_ID, doctor.doctorDocId], [CONST.USER_IS_DOCTOR, 'true']], () => {
        done(doctor);
    }, failed);
};

export const afterSignInAsUser = (uid: string, user: M.UserSack, done: (user: M.UserSack | M.DoctorSack) => void, failed: () => void) => {
    updateMuliPref([[CONST.USER_ID_AUTH, uid], [CONST.USER_DOCUMENT_ID, user.userDocumentID], [CONST.USER_IS_DOCTOR, 'false']], () => {
        done(user);
    }, failed);
};

export const fetchDoctor = (uid: string, done: (user: M.DoctorSack) => void, failed: () => void) => {
    fireBaseWhere(CONST.DOCTOR_COLLECTION, firestore.Filter('userAuthID', '==', uid.trim()), (oneDoc) => {
        done(M.jsonToDoctor(oneDoc.data(), oneDoc.id));
    }, failed);
};

export const fetchDoctorDocument = (documentId: string, done: (user: M.DoctorSack) => void, failed: () => void) => {
    fireBaseGet(CONST.DOCTOR_COLLECTION, documentId.trim(), (oneDoc) => {
        done(M.jsonToDoctor(oneDoc.data(), documentId));
    }, failed);
};

export const firebaseFetchAdmin = (uid: string, done: (user: M.UserSack) => void, failed: () => void) => {
    fireBaseWhere(CONST.ADMINS_COLLECTION, firestore.Filter('userAuth', '==', uid.trim()), (oneDoc) => {
        done(M.jsonToUser(oneDoc.data(), oneDoc.id));
    }, failed);
};

export const acceptDoctor = (doctorDocId: string, doctorEditedBio: string, done: () => void, failed: () => void) => {
    fireBaseSet(CONST.DOCTOR_COLLECTION, doctorDocId.trim(), {
        'approved': true,
        'doctorBio': doctorEditedBio,
        'doctorEditedBio': '',
    }, () => {
        done();
    }, () => failed());
};

export const rejectDoctor = (doctorDocId: string, authId: string, done: () => void, failed: () => void) => {
    fireBaseDelete(CONST.DOCTOR_COLLECTION, doctorDocId, () => {
        done();
    }, () => failed());
};

export const fetchDoctors = (isApproved: boolean, done: (user: M.DoctorSack[]) => void) => {
    fireBaseAllWhere(CONST.DOCTOR_COLLECTION, firestore.Filter('approved', '==', isApproved), (docRefDocs) => {
        const doctors = docRefDocs.map((docDoc) => { return M.jsonToDoctor(docDoc.data(), docDoc.id); });
        done(doctors);
    }, () => done([]));
};

export const fetchAllDoctors = (isApproved: boolean, done: (user: M.DoctorSack[]) => void, failed: () => void) => {
    fireBaseAllWhere(CONST.DOCTOR_COLLECTION, firestore.Filter('approved', '==', isApproved), (docRefDocs) => {
        const doctors = docRefDocs.map((docDoc) => { return M.jsonToDoctor(docDoc.data(), docDoc.id); });
        done(doctors);
    }, () => done([]));
};


export const fetchAdmin = (done: (user: M.UserSack) => void, failed: () => void) => {
    fireBaseGetFirstOfAll(CONST.ADMINS_COLLECTION, (oneDoc) => {
        const admin = M.jsonToUser(oneDoc.data(), oneDoc.id);
        done(admin);
    }, failed);
};

export const fetchExaminationHistory = (doctorID: string, done: (user: M.ExaminationSack[]) => void) => {
    fireBaseAllWhere(CONST.EXAMINATIONS_COLLECTION, firestore.Filter('communicationMethods.doctorID', '==', doctorID.trim()), (examRefDocs) => {
        const doctors = examRefDocs.map((examDoc) => { return M.jsonToExamination(examDoc.data(), examDoc.id); });
        done(doctors);
    }, () => done([]));
};

export const fetchExaminationDocument = (documentId: string, done: (user: M.ExaminationSack) => void, failed: () => void) => {
    fireBaseGet(CONST.EXAMINATIONS_COLLECTION, documentId, (oneDoc) => {
        done(M.jsonToExamination(oneDoc.data(), oneDoc.id));
    }, failed);
};

export const fetchExaminationHistoryByUser = (key: string, done: (user: M.ExaminationSack[]) => void) => {
    fireBaseAllWhere(CONST.EXAMINATIONS_COLLECTION, firestore.Filter('examinationKey', '==', key.trim()), (examRefDocs) => {
        const doctors = examRefDocs.map((examDoc) => { return M.jsonToExamination(examDoc.data(), examDoc.id); });
        done(doctors);
    }, () => done([]));
};

export const fetchExaminationHistoryForDoctor = (doctorID: string, doctorAccepted: boolean, done: (user: M.ExaminationSack[]) => void) => {
    fireBaseAllWhere(CONST.EXAMINATIONS_COLLECTION, firestore.Filter.and(firestore.Filter('doctorAccepted', '==', doctorAccepted), firestore.Filter('communicationMethods.doctorID', '==', doctorID.trim())), (examRefDocs) => {
        const doctors = examRefDocs.map((examDoc) => { return M.jsonToExamination(examDoc.data(), examDoc.id); });
        done(doctors);
    }, () => done([]));
};

export const editDoctorSchedule = (doctorDocId: string, appointment: {}, done: () => void, failed: () => void) => {
    fireBaseUpdate(CONST.DOCTOR_COLLECTION, doctorDocId.trim(), 'appointment', appointment, done, failed);
};

export const fetchExaminationHistoryForClient = (clientID: string, done: (user: M.ExaminationSack[]) => void) => {
    fireBaseAllWhere(CONST.EXAMINATIONS_COLLECTION, firestore.Filter('communicationMethods.clientID', '==', clientID.trim()), (examRefDocs) => {
        const doctors = examRefDocs.map((examDoc) => { return M.jsonToExamination(examDoc.data(), examDoc.id); });
        done(doctors);
    }, () => done([]));
};

export const fireBaseCreateExamination = (exam: M.ExaminationSack, appointment: any, done: (done: string) => void, failed: () => void) => {
    fireBaseCreate(CONST.EXAMINATIONS_COLLECTION, exam, (documentId) => {
        fireBaseUpdate(
            CONST.APPOINTMENTS_COLLECTION,
            appointment.documentId,
            'appointments',
            appointment.appointments,
            () => done(documentId), failed
        )
    }, failed);
};

export const fireBaseEditExamination = (documentId: string, key: string, value: any, done: () => void, failed: () => void) => {
    fireBaseUpdate(CONST.EXAMINATIONS_COLLECTION, documentId.trim(), key, value, done, failed);
};

export const fetchSpecialistAppointment = (specialistId: number, done: (appointments: M.AppointmentSack[]) => void, failed: () => void) => {
    fireBaseAllWhere(CONST.APPOINTMENTS_COLLECTION, firestore.Filter('specialistId', '==', specialistId), (docRefDocs) => {
        if (docRefDocs.length === 0) {
            done([])
            return
        }
        const appointments = docRefDocs.map((docDoc) => M.jsonToAppointmentSack(docDoc.data(), docDoc.id));
        done(appointments);
    }, () => {
        failed()
    });
};

export const fetchDoctorAppointment = (specialistId: number, doctorDocumentId: string, now: Date, done: (appointments: M.AppointmentSack[]) => void, failed: () => void) => {
    fireBaseAllWhere(CONST.APPOINTMENTS_COLLECTION, firestore.Filter('specialistId', '==', specialistId), (docRefDocs) => {
        var appointments = []
        for (var docDoc of docRefDocs) {
            const value = M.jsonToAppointmentSackForDoctor(docDoc.data(), docDoc.id, doctorDocumentId, now)
            if (value !== null) {
                appointments.push(value);
            }
        }
        done(appointments);
    }, () => failed());
};
