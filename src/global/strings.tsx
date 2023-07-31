import LocalizedStrings from "react-native-localization";

const english = {
    hey: 'Hey!, ',
    signOut: 'Sign Out',
    loading: 'Loading...',
    noPreApp: 'No previous appointment',
    noPending: 'No pending appointment',
    mr: 'Mr. ',
    noDoc:'No doctors founded',
    noDocRev: 'No doctors under review',
    allDoc: 'All Doctors',
    underRev: 'Under review',
    history: 'History',
    pending: 'Pending',
    docs: 'Doctors',
    search: 'Search',
}

const spanish = {
    hey: '¡Hola!, ',
    signOut: 'Cerrar Sesión',
    loading: 'Cargando...',
    noPreApp: 'Sin cita previa',
    noPending: 'Sin cita pendiente',
    mr: 'Señor. ',
    noDoc: 'Sin médicos fundados',
    noDocRev: 'No hay médicos bajo revisión',
    allDoc: 'Todos los doctores',
    underRev: 'Bajo revisión',
    history: 'Historia',
    pending: 'Pendiente',
    docs:'Doctores',
    search: 'Buscar'
}

export const strings = new LocalizedStrings({
    "en": english,
    "es": spanish
});
