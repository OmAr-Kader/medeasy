import { getNextDayOfTheWeek, isArraySafeToJson, isJsonSafeToArray } from "./utils";

export type ProjectType = UserSack | DoctorSack | AppointmentSack | AppointmentDate | AppointmentDoctor | ExaminationSack | CommunicationSack | MedicineSack;

export class UserSack {
  constructor(
    public userAuthID: string,
    public userDocumentID: string,
    public nameUser: string,
    public email: string,
    public mobile: string,
    public personalImage: string,
    public fcmToken: string,
  ) { }

  public asJson = (): {} => {
    return {
      userAuth: this.userAuthID,
      nameUser: this.nameUser,
      email: this.email,
      mobile: this.mobile,
      personalImage: this.personalImage,
      fcmToken: this.fcmToken,
    };
  };

  public asJsonAll = () => {
    return {
      ...(this.asJson()),
      userDocumentID: this.userDocumentID,
    };
  };
}

export const createUserSack = (
  {
    userAuthID,
    userDocumentID,
    nameUser,
    email,
    mobile,
    personalImage,
    fcmToken,
  }: {
    userAuthID: string,
    userDocumentID: string,
    nameUser: string,
    email: string,
    mobile: string,
    personalImage: string,
    fcmToken: string,
  }
): UserSack => new UserSack(userAuthID, userDocumentID, nameUser, email, mobile, personalImage, fcmToken);

export const jsonToUser = (json: any, userDocumentID: string): UserSack => {
  return new UserSack(json.userAuth, userDocumentID, json.nameUser, json.email, json.mobile, json.personalImage, json.fcmToken);
};

///////////////////////////////////////////////////////////////////////////////////

export class DoctorSack {
  constructor(
    public userAuthID: string,
    public nameDoc: string,
    public email: string,
    public mobile: string,
    public specialistDoc: string,
    public specialistId: number,
    public personalImage: string,
    public doctorBio: string,
    public doctorAuth: string[],
    public approved: boolean,
    public doctorEditedBio: string,
    public personalEditedImage: string,
    public doctorDocId: string,
    public fcmToken: string,
  ) { }

  public asJson = (): {} => {
    return {
      userAuthID: this.userAuthID,
      nameDoc: this.nameDoc,
      email: this.email,
      mobile: this.mobile,
      specialistDoc: this.specialistDoc,
      specialistId: this.specialistId,
      personalImage: this.personalImage,
      doctorBio: this.doctorBio,
      doctorAuth: this.doctorAuth !== undefined && this.doctorAuth.length > 0 ? this.doctorAuth.map((value) => value) : {},
      approved: this.approved,
      doctorEditedBio: this.doctorEditedBio,
      personalEditedImage: this.personalEditedImage,
      fcmToken: this.fcmToken,
    };
  };

  public asJsonAll = () => {
    return {
      ...(this.asJson()),
      doctorDocId: this.doctorDocId,
    };
  };
}

export const createDoctorSack = (
  {
    userAuthID,
    nameDoc,
    email,
    mobile,
    specialistDoc,
    specialistId,
    personalImage,
    doctorBio,
    doctorAuth,
    approved,
    doctorEditedBio,
    personalEditedImage,
    doctorDocId,
    fcmToken,
  }:
    {
      userAuthID: string,
      nameDoc: string,
      email: string,
      mobile: string,
      specialistDoc: string,
      specialistId: number,
      personalImage: string,
      doctorBio: string,
      doctorAuth: string[],
      approved: boolean,
      doctorEditedBio?: string
      personalEditedImage?: string
      doctorDocId: string,
      fcmToken: string,
    }
): DoctorSack => new DoctorSack(userAuthID, nameDoc, email, mobile, specialistDoc, specialistId, personalImage, doctorBio, doctorAuth, approved, doctorEditedBio ? doctorEditedBio : '', personalEditedImage ? personalEditedImage : '', doctorDocId, fcmToken);

export const jsonToDoctor = (json: any, docID: string) => {
  return createDoctorSack({
    userAuthID: `${json.userAuthID}`,
    nameDoc: `${json.nameDoc}`,
    email: `${json.email}`,
    mobile: `${json.mobile}`,
    specialistDoc: `${json.specialistDoc}`,
    specialistId: json.specialistId,
    personalImage: `${json.personalImage}`,
    doctorBio: `${json.doctorBio}`,
    doctorAuth: json.doctorAuth,
    approved: json.approved ? json.approved : false,
    doctorEditedBio: json.doctorEditedBio,
    doctorDocId: docID,
    fcmToken: json.fcmToken,
  });
};

///////////////////////////////////////////////////////////////////////////////////

export class AppointmentSack {
  constructor(
    public documentId: string,
    public specialistId: number,
    public clientCapacity: number,
    public dayId: number,
    public dayName: string,
    public appointments: AppointmentDate[]
  ) { }
  public asJson = (): {} => {
    return {
      specialistId: this.specialistId,
      clientCapacity: this.clientCapacity,
      dayId: this.dayId,
      dayName: this.dayName,
      appointments: isArraySafeToJson(this.appointments, (val) => val.asJson()),
    };
  };

  public asJsonAll = () => {
    return {
      ...(this.asJson()),
      documentId: this.documentId,
    };
  };
}

export const createAppointmentSack = ({
  documentId,
  specialistId,
  clientCapacity,
  dayId,
  dayName,
  appointments,
}:
  {
    documentId: string,
    specialistId: number,
    clientCapacity: number,
    dayId: number,
    dayName: string,
    appointments: AppointmentDate[],
  }
): AppointmentSack => new AppointmentSack(documentId, specialistId, clientCapacity, dayId, dayName, appointments);

export const jsonToAppointmentSack = (json: any, documentId: string): AppointmentSack => {
  return createAppointmentSack({
    documentId: documentId,
    specialistId: json.specialistId,
    clientCapacity: json.clientCapacity,
    dayId: json.dayId,
    dayName: json.dayName,
    appointments: isJsonSafeToArray(json.appointments, (value: any) => jsonToAppointmentDate(value)),
  });
};

export const jsonToAppointmentSackForDoctor = (json: any, documentId: string, doctorDocumentID: string, now: Date): AppointmentSack | null => {
  const appointmentDates = jsonToAppointmentDateHandler(json, doctorDocumentID, Number(json.dayId), now, json.clientCapacity);
  if (appointmentDates.length === 0) {
    return null;
  }
  return createAppointmentSack({
    documentId: documentId,
    specialistId: json.specialistId,
    clientCapacity: json.clientCapacity,
    dayId: json.dayId,
    dayName: json.dayName,
    appointments: appointmentDates,
  });
};

export const jsonToAppointmentDateHandler = (json: any, doctorDocumentID: string, day: number, now: Date, clientCapacity: number): AppointmentDate[] => {
  if (json.appointments === undefined) {
    return [];
  }
  var appointments = []
  for (var value of json.appointments) {
    const date = jsonToAppointmentDateForDoctor(value, doctorDocumentID, day, now, clientCapacity);
    if (date !== null) {
      appointments.push(date)
    }
  }
  return appointments;
}

export class AppointmentDate {
  constructor(
    public hour: number,
    public doctors: AppointmentDoctor[],
  ) { }
  public asJson = (): {} => {
    return {
      hour: this.hour,
      doctors: isArraySafeToJson(this.doctors, (val) => val.asJson()),
    };
  };
}

export class AppointmentDoctor {
  constructor(
    public doctorDocumentID: string,
    public doctorName: string,
    public availabilityStatus: boolean,
    public dateChangeOfStatus: number,
    public currentCapacity: number,
  ) { }
  public asJson = (): {} => {
    return {
      doctorDocumentID: this.doctorDocumentID,
      doctorName: this.doctorName,
      availabilityStatus: this.availabilityStatus,
      dateChangeOfStatus: this.dateChangeOfStatus,
      currentCapacity: this.currentCapacity,
    };
  };
}

export const jsonToAppointmentDate = (
  json: any
): AppointmentDate => {
  return new AppointmentDate(
    json.hour,
    isJsonSafeToArray(json.doctors, (value: {
      doctorDocumentID: string;
      doctorName: string,
      availabilityStatus: boolean;
      dateChangeOfStatus: number;
      currentCapacity: number,
    }
    ) => new AppointmentDoctor(
      value.doctorDocumentID,
      value.doctorName,
      value.availabilityStatus,
      value.dateChangeOfStatus,
      value.currentCapacity,
      )
    ))
}

export const jsonToAppointmentDateForDoctor = (
  json: any,
  doctorDocumentID: string,
  day: number,
  now: Date,
  clientCapacity: number,
): AppointmentDate | null => {
  if (json.doctors === undefined) {
    return null;
  }
  for (var value of json.doctors) {
    if (value.doctorDocumentID === doctorDocumentID && getNextDayOfTheWeek({
      nativeDayId: day,
      hour: Number(json.hour),
    }, now).getTime() - value.dateChangeOfStatus > 604800000) {
      return new AppointmentDate(json.hour, [new AppointmentDoctor(value.doctorDocumentID, value.doctorName, value.availabilityStatus, value.dateChangeOfStatus, 0)]) // Zero NOT value.currentCapacity case that value will decrease when client book
    } else {
      if (value.currentCapacity === clientCapacity) {
        return null;
      } else {
        return new AppointmentDate(json.hour, [new AppointmentDoctor(value.doctorDocumentID, value.doctorName, value.availabilityStatus, value.dateChangeOfStatus, value.currentCapacity)])
      }
    }
  };
  return null;
}
///////////////////////////////////////////////////////////////////////////////////

export class ExaminationSack {
  constructor(
    public documentId: string,
    public examinationKey: string,
    public communicationMethods: CommunicationSack,
    public clientNote: string,
    public doctorNote: string,
    public date: number,
    public medicines: MedicineSack[],
    public examinationName: string = '',
    public examinationNameDoctor: string = '',
    public doctorAccepted: boolean = false,
  ) { }
  public asJson = (): {} => {
    return {
      examinationKey: this.examinationKey,
      communicationMethods: this.communicationMethods.asJson(),
      clientNote: this.clientNote,
      doctorNote: this.doctorNote,
      date: this.date,
      medicines: isArraySafeToJson(this.medicines, (val) => val.asJson()),
      examinationName: this.examinationName,
      examinationNameDoctor: this.examinationNameDoctor,
      doctorAccepted: this.doctorAccepted,
    };
  };

  public asJsonAll = () => {
    return {
      ...(this.asJson()),
      documentId: this.documentId,
    };
  };

}

export const createExaminationSack = (
  {
    documentId,
    examinationKey,
    communicationMethods,
    clientNote,
    doctorNote,
    date,
    medicines,
    examinationName,
    examinationNameDoctor,
    doctorAccepted,
  }:
    {
      documentId: string,
      examinationKey: string,
      communicationMethods: CommunicationSack,
      clientNote: string,
      doctorNote: string,
      date: number,
      medicines: MedicineSack[],
      examinationName: string,
      examinationNameDoctor: string,
      doctorAccepted: boolean,
    }
): ExaminationSack => new ExaminationSack(documentId, examinationKey, communicationMethods, clientNote, doctorNote, date, medicines, examinationName, examinationNameDoctor, doctorAccepted);

export const jsonToExamination = (json: any, docID: string): ExaminationSack => {
  return createExaminationSack({
    documentId: `${docID}`,
    examinationKey: `${json.examinationKey}`,
    communicationMethods: jsonToCommunication(json.communicationMethods),
    clientNote: `${json.clientNote}`,
    doctorNote: `${json.doctorNote}`,
    medicines: isJsonSafeToArray(json.medicines, ((value: { medicineName: string; dose: string, doseNote: string; }) => new MedicineSack(value.medicineName, value.dose, value.doseNote))),
    date: json.date,
    examinationName: json.examinationName,
    examinationNameDoctor: json.examinationNameDoctor,
    doctorAccepted: json.doctorAccepted ? json.doctorAccepted : false,
  });
};

export class CommunicationSack {
  constructor(
    public doctorID: string,
    public doctorName: string,
    public doctorImg: string,
    public doctorFcmToken: string,
    public clientID: string,
    public clientName: string,
    public clientImg: string,
    public userFcmToken: string,
  ) { }
  public asJson = (): {} => {
    return {
      doctorID: this.doctorID,
      doctorName: this.doctorName,
      doctorImg: this.doctorImg,
      doctorFcmToken: this.doctorFcmToken,
      clientID: this.clientID,
      clientName: this.clientName,
      clientImg: this.clientImg,
      userFcmToken: this.userFcmToken,
    };
  };
}

export const createCommunicationSack = (
  {
    doctorID,
    doctorName,
    doctorImg,
    doctorFcmToken,
    clientID,
    clientName,
    clientImg,
    userFcmToken,
  }:
    {
      doctorID: string,
      doctorName: string,
      doctorImg: string,
      doctorFcmToken: string,
      clientID: string,
      clientName: string,
      clientImg: string,
      userFcmToken: string,
    }
): CommunicationSack => new CommunicationSack(doctorID, doctorName, doctorImg, doctorFcmToken, clientID, clientName, clientImg, userFcmToken);

export const jsonToCommunication = (json: any): CommunicationSack => {
  return createCommunicationSack({
    doctorID: `${json.doctorID}`,
    doctorName: `${json.doctorName}`,
    doctorImg: `${json.doctorImg}`,
    doctorFcmToken: `${json.doctorFcmToken}`,
    clientID: `${json.clientID}`,
    clientName: `${json.clientName}`,
    clientImg: `${json.clientImg}`,
    userFcmToken: `${json.userFcmToken}`,
  }); 
};

export class MedicineSack {
  constructor(
    public medicineName: string,
    public dose: string,
    public doseNote: string,
  ) { }
  public asJson = (): {} => {
    return {
      medicineName: this.medicineName,
      dose: this.dose,
      doseNote: this.doseNote,
    };
  };
}
