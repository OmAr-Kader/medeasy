import { DAYS_FOR_PICKER } from "./const";
import { AppointmentDate, AppointmentSack, DoctorSack, createAppointmentSack } from "./model";

export const mergeSpaciestAppointment = (specialistId: number, appointment: AppointmentSack[]) => {
    var allDaysAppointment: AppointmentSack[] = []
    for (var day of DAYS_FOR_PICKER) {
        const appointmentDay = appointment.find((value) => value.dayId === day.id)
        appointmentDay !== undefined ?
            allDaysAppointment.push(margeAppointmentDate(appointmentDay)) :
            allDaysAppointment.push(
                createAppointmentSack({
                    documentId: '',
                    specialistId: specialistId,
                    clientCapacity: 1,
                    dayId: day.id,
                    dayName: day.name,
                    appointments: emptyAppointmentDate(),
                })
            )
    }
    return allDaysAppointment;
};

export const emptyAppointmentDate = () => {
    var list: AppointmentDate[] = [];
    for (let i = 0; i < 24; i++) {
        list.push(new AppointmentDate(i, []))
    }
    return list
}

export const margeAppointmentDate = (appointment: AppointmentSack): AppointmentSack => {
    var list: AppointmentDate[] = [];
    for (let i = 0; i < 24; i++) {
        const app = appointment.appointments.find((it) => it.hour == i)
        app !== undefined && app.doctors.length !== 0 ? list.push(app) : list.push(new AppointmentDate(i, []))
    }
    appointment.appointments = list;
    return appointment
}

/*
const isSameDay = (day: number, another: number) => new Date(Number(day)).setHours(0, 0, 0) === new Date(Number(another)).setHours(0, 0, 0);
export const resortDoctorAppointment = (doctorApps: AppointmentSack[]): AppointmentSack[][] => {
    const apps: AppointmentSack[][] = [];
    const sortedApps = doctorApps.sort((a, b) => a.dayId > b.dayId ? 1 : -1);
    sortedApps.forEach((value) => {
        const findDay = apps.find((it) => value.dayId === it[0].dayId);
        if (findDay !== undefined) {
            findDay.push(value);
        } else {
            apps.push([value]);
        }
    });
    return apps;
};*/
