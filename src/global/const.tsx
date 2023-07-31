export const LOG_In = 'logIn';
export const LOG_In_ADMIN = 'logInAdmin';
export const SPLASH_SCREEN = 'screenScreen';
export const HOME_SCREEN_USER = 'homeUser';
export const HOME_SCREEN_DOCTOR = 'homeDoctor';
export const DOCTOR_DETAIL = 'doctorDetail';
export const CLIENT_DETAIL = 'clientDetail';
export const APPOINTMENT_SCREEN = 'appointmentClient';
export const APPOINTMENT_SCREEN_DOCTOR = 'appointmentClientDoctor';
export const VIDEO_CALL_SCREEN = 'videoCallScreen';
export const CERTIFICATES_SCREEN = 'certificatesView';
export const PROFILE_IMAGE_SCREEN = 'profileImageView';
export const HOME_SCREEN_ADMAN = 'homeAdmin';
export const DOCTOR_DETAIL_ADMIN = 'doctorDetailAdmin';
export const SCHEDULE_SCREEN = 'scheduleSCreen';

export const REFRESH_APPOINTMENT = 'refresh.appointment';
export const PUSH_FROM_NOTIFICATION = 'push.from.notification';

export const NOTIFY_CALL = 'callNotification'
export const NOTIFY_COMMUNICATION = 'callCommunication'

export const EDIT_SAVE_ALL_OFF = -1;
export const EDIT_SAVE_EDITABLE_INTI_NOT = 0;
export const EDIT_SAVE_NOT_EDITABLE_INTI_YES = 2;
export const EDIT_SAVE_ALL_OFF_DOCTOR = 3;
export const EDIT_SAVE_EDITABLE_INTI_YES = 1;

export const FCM_CALL = 3;
export const FCM_DOCTOR_CONFIRM = 3;
export const FCM_NEW_APPOINTMENT_FOR_DOCTOR = 4;
export const FCM_TREATMENT_CHANGED = 5;
export const FCM_APPOINTMENT_REMINDER = 6;
export const FCM_APPOINTMENT_REMINDER_FOR_DOCTOR = 7;
export const FCM_NEW_DOCTOR_CONFIRMATION = 8;
export const FCM_ADMIN_CONFIRM_NEW_DOCTOR = 9;
export const FCM_ADMIN_REJECT_NEW_DOCTOR = 10;

export const USER_DOCUMENT_ID = 'userDocId';
export const USER_ID_AUTH = 'userAuthId';
export const USER_IS_DOCTOR = 'isDoctor';
export const TOGGLE_HOME = 'toggleHome';
export const FCM_TOKEN = 'fcmToken';

export const FCM_TOPIC = 'fcmTopic';

export const NOTIFICATION_NAVIGATOR = 'notificationNavigator';
export const NOTIFICATION_TYPE = 'notificationType';
export const NOTIFICATION_DOC_ID = 'notificationData';

export const USER_COLLECTION = 'users';
export const ADMINS_COLLECTION = 'admins';
export const DOCTOR_COLLECTION = 'doctors';
export const APPOINTMENTS_COLLECTION = 'appointments';
export const EXAMINATIONS_COLLECTION = 'examinations';

export const PERSONAL_IMG = 'personalImg';

export const CLIENT_ID: string = '769162715268-cffe6uh1rf0q1k467o3bfmogqg1i94ru.apps.googleusercontent.com';
export const SERVER_API_KEY: string = 'AAAAsxWroIQ:APA91bHDoGRx01ge54_5c8RUzCROITiT9trq7mmJ0_LuEp2dUU0QX6GiiVldBHxTy8f820ajhFweILB2zl2MDq49YE6X_N6ktZFzgGkZlSNp0R4GkKPWBoMH9n5wD_fcuvucQAnx7tSY';
export const APP_ID = '1:769162715268:android:8acef02dc25e89546362d1';
export const API_KEY = 'AIzaSyC5aHRK5zBPBi5MQ1WeVP6Dwddql4m2DP0';
export const DATABASE_URL = 'https://medicine-easy-1-default-rtdb.firebaseio.com';
export const STORAGE_BUCKET = 'medicine-easy-1.appspot.com';
export const MESSAGING_SENDER_ID = '769162715268';
export const PROJECT_ID = 'medicine-easy-1';
export const AUTH_DOMAIN = 'medicine-easy-1.firebaseapp.com';

export const CREDENTIAL_FIREBASE = {
    clientId: CLIENT_ID,
    appId: APP_ID,
    apiKey: API_KEY,
    databaseURL: DATABASE_URL,
    storageBucket: STORAGE_BUCKET,
    messagingSenderId: MESSAGING_SENDER_ID,
    projectId: PROJECT_ID,
    authDomain: AUTH_DOMAIN,
};

export const ZEGO_APP_ID = 219031413;
export const ZEGO_APP_SIGN = '36fb69a3f6504bf570e5c8825ca25c6456f062ed6a6e8c815d88fb3f7f9c2007';
export const ZEGO_STREAM_URL = 'wss://webliveroom219031413-api.coolzcloud.com/ws';
export const ZEGO_SERVER_SECRET =  'b1e0be9d129be11349f00c2c06b48db3';
export const TEMP_TOKEN_2 = '04AAAAAGTGg5kAEG1rN3F4dzczdmh6N2ZmMzUAwLcNWcMk2kI66A3s+ok30azuwed0zvKtDZgIhlFH9Tjq6IqQtQFf6RiJzeyXQPHxRJXrpYBXdivf3MTX3ZmDMRiDCvKWCsfnWC9oiSdp+/03vW0aJRTP5FBggfSwd45UKh3eC2f1WgzHagJDPyMkPznMNWLfelKyVqlj6F6zedylzDRoHpHaY0NUgzyuVDxNy9WwbAJv6ZTLK7Qqt5dma/QRJ1D7WU6TkXBIntca/ftv70uz0Hn9iW7csDaKHncpyA==';
export const TEMP_TOKEN_1 = '04AAAAAGTGg8wAEHVqaTFvb3J1bWNvMngzb28AwAGAbx4b/dfDUgQSpUw9bGeXeY7c/Gvtmt3BULY1uMS6yEwtTcErzwM8+/27pnegHsRuIhkvBGv36fyKJ09YlELKJEKg0/OKZB+YNmg32zH1yAz3hMX7OL51Hb1ehZBz1evUWkyUq8gb4Leur6KVf2oholX7JK66ro37x18o+rhRpG22838b+AfMaEH7SpBDatb+XlPDPcpW/Iy7Pdm4LR2ozPxpMzW53ERQTY+5OrF9G0ZCQ6wK28KG3MPmE6D+uQ==';

export const CLIENT_SESSION_QUARTER = 1;
export const CLIENT_SESSION_HALF = 2;
export const CLIENT_SESSION_HOUR = 3;

export const DAYS_FOR_PICKER: PairTwoSack [] = [
    { id: 0, name: 'SUN' }, { id: 1, name: 'MON' }, { id: 2, name: 'TUE' }, { id: 3, name: 'WED' }, { id: 4, name: 'THU' }, { id: 5, name: 'FRI' }, { id: 6, name: 'SAT' }
]

export type PairTwoSack = { id: number, name: string }

export const DOCTORS_FELIDS: PairTwoSack[] = [
    { id: 1, name: 'Allergy and immunology' },
    { id: 2, name: 'Anesthesiology' },
    { id: 3, name: 'Diagnostic radiology' },
    { id: 4, name: 'Emergency medicine' },
    { id: 5, name: 'Family medicine' },
    { id: 6, name: 'Internal medicine' },
    { id: 7, name: 'Medical genetics' },
    { id: 8, name: 'Neurology' },
    { id: 9, name: 'Nuclear medicine' },
    { id: 10, name: 'Obstetrics and gynecology' },
    { id: 11, name: 'Orthopedist' },
    { id: 12, name: 'Ophthalmology' },
    { id: 13, name: 'Pathology' },
    { id: 14, name: 'Pediatrics' },
    { id: 15, name: 'Physical medicine and rehabilitation' },
    { id: 16, name: 'Preventive medicine' },
    { id: 17, name: 'Psychiatry' },
    { id: 18, name: 'Radiation oncology' },
    { id: 19, name: 'Surgery' },
    { id: 20, name: 'Urology' },
];

export const TREATMENT_LIST: string[] = [
    'acetaminophen and codeine',
    'albuterol aerosol	',
    'albuterol HFA	',
    'alendronate	',
    'allopurinol',
    'alprazolam	',
    'amitriptyline',
    'amoxicillin and clavulanate K+	',
    'amoxicillin',
    'amphetamine and dextroamphetamine XR	',
    'atenolol',
    'atorvastatin',
    'azithromycin',
    'benazepril and amlodipine	',
    'carisoprodol',
    'carvedilol',
    'cefdinir',
    'celecoxib	',
    'cephalexin',
    'ciprofloxacin',
    'citalopram',
    'diclofenac sodium',
    'Duloxetine',
    'doxycycline hyclate',
    'enalapril',
    'escitalopram',
    'esomeprazole',
];

export const DOSE_FORM_LIST: string[] = [
    'Effavescent tablet',
    'Chewable tablet',
    'Sublingual tablet',
    'Enteric coated tablet',
    'Capsule',
    'Powder',
    'Lozenges',
    'Mixtures',
    'Implant',
    'Irrigation solution',
    'Lotion',
    'Gargle',
    'Drops',
    'Ointment',
    'Cream',
    'Intramuscular injection',
    'Subcutaneous injection',
    'Intravenous injection',
    'Suppository',
    'Transdermal patch',
    'Inhaler',
    'Pessary',
    'Enema',
];

export const WELCOME_PAGES = [
    { mainText: 'Stay healthy, stay on track.', subText: 'Trust Medicine to be your reliable healthcare partner around the clock.' },
    { mainText: 'Family Membership', subText: 'A comprehensive healthcare solution  to cater to the medical needs.' },
    { mainText: 'Welcome', subText: 'Start taking care of your health.' },
];
