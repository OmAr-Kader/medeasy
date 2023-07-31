import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { FetchIsDarkMode, navbarHeight } from '../../global/dims';
import { BackArrow, DonePending } from '../../assets/logo';
import * as COL from '../../global/styles';
import { ExaminationSack, jsonToUser } from '../../global/model';
import { formatAmPm } from '../../global/utils';
import { convertDateToMonthAndDay } from '../../global/utils';
import { FlatListed, ProfilePic } from '../../global/baseView';
import { APPOINTMENT_SCREEN, EDIT_SAVE_EDITABLE_INTI_NOT, PROFILE_IMAGE_SCREEN } from '../../global/const';
import { fetchExaminationHistoryByUser } from '../../firebase/fireStore';
import Spinner from 'react-native-loading-spinner-overlay';

type Props = {
    dataList: ExaminationSack[],
    spinner: boolean,
}

type IProps = {
    dataList?: ExaminationSack[],
    spinner?: boolean,
}

const UserAppointment = ({ route, navigation }: { route: any, navigation: any }) => {
    const { isDark } = route.params;
    const isDarkMode: boolean = route !== undefined && route.params != null ? isDark : FetchIsDarkMode();
    const { data } = route.params;
    const { doctorDocID } = route.params;

    const userSack = jsonToUser(data, data.userDocumentID);

    const [state, dispatch] = React.useReducer<(prevState: Props, action: IProps) => Props>(
        (state: Props, newState: IProps) => ({ ...state, ...newState }),
        {
            dataList: [],
            spinner: false,
        },
    );

    const renderItem = ({ item }: { item: ExaminationSack }) => {
        return recyclerChildExamination(item, isDarkMode, () => navigation.navigate(APPOINTMENT_SCREEN, { isDark: isDarkMode, data: item.asJsonAll(), modeApp: EDIT_SAVE_EDITABLE_INTI_NOT, newAp: [], userName: userSack.nameUser, profilePic: userSack.personalImage }));
    };

    React.useEffect(() => {
        updateSpinner(true);
        fetchExaminationHistoryByUser(doctorDocID + userSack.userDocumentID, (allDoctorExamination) => {
            dispatch({ dataList: allDoctorExamination, spinner: false })
        });
    }, []);

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

    return <SafeAreaView style={stylesColorful(isDarkMode).backStyle}>
        <StatusBar translucent={false} backgroundColor={isDarkMode ? Colors.darker : Colors.lighter} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Spinner
            visible={state.spinner}
            textContent={'Loading...'}
            color={isDarkMode ? COL.WHITE : COL.BLACK}
            textStyle={{ color: isDarkMode ? COL.WHITE : COL.BLACK }}
            animation={'fade'}
            cancelable={false}
            overlayColor={isDarkMode ? COL.SHADOW_WHITE : COL.SHADOW_BLACK}
        />
        <View style={styles.mainContainer}>
            <View style={styles.loginContainer}>
                <View style={styles.logoContainer}>
                    <Text style={stylesColorful(isDarkMode).doctorNameStyle}>{userSack.nameUser}</Text>
                </View>
                <View style={styles.logoContainerBack}>
                    <TouchableHighlight style={styles.menuButton} underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                        onPress={() => { navigation.goBack(); }}>
                        <BackArrow color={isDarkMode ? COL.WHITE : COL.BLACK} />
                    </TouchableHighlight>
                    <View style={styles.profileButton}>
                        <TouchableHighlight
                            onPress={userSack.personalImage.length > 0 ? () => {
                                navigation.navigate(PROFILE_IMAGE_SCREEN, { data: userSack.personalImage, isDark: isDarkMode });
                            } : undefined}
                            underlayColor={COL.MAIN_WHITER}>
                            <ProfilePic style={styles.doctorImage} uri={userSack.personalImage} />
                        </TouchableHighlight>
                    </View>
                </View>
            </View>
            <ScrollView contentInsetAdjustmentBehavior="automatic"
                overScrollMode={'always'}
                keyboardShouldPersistTaps={'handled'}
                keyboardDismissMode={'interactive'}
                contentContainerStyle={styles.scrollStyle}>
                <View style={stylesColorful(isDarkMode).backListStyle}>
                    <FlatListed
                        data={state.dataList}
                        scrollEnabled={false}
                        renderItem={renderItem} 
                        emptyMessage={state.spinner ? '' : 'No items'} 
                        isDarkMode={isDarkMode} />
                </View>
            </ScrollView>
        </View>
    </SafeAreaView>;
};


function recyclerChildExamination(value: ExaminationSack, isDarkMode: boolean, press: () => void) {
    const tittle = value.examinationName.length !== 0 ? value.examinationName : value.communicationMethods.doctorName + ' ' + convertDateToMonthAndDay(value.date) + '-' + formatAmPm(value.date);

    return <View style={styles.historyAppContainer} key={value.date}>
        <TouchableHighlight style={styles.mainDoctorStyle}
            onPress={press}
            underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}>
            <View style={styles.mainDoctorContent}>
                <View style={styles.doctorContainer}>
                    <ProfilePic style={styles.doctorImage} uri={value.communicationMethods.doctorImg} />
                </View>
                <View style={styles.doctorContainerNameStyle}>
                    <Text style={stylesColorful(isDarkMode).doctorNameStyle}>{tittle}</Text>
                    <Text style={styles.doctorSpecialist}>{value.clientNote}</Text>
                </View>
                <View style={styles.leftArrowStyle}>
                    <DonePending isDone={value.doctorAccepted} />
                </View>
                <View style={styles.bottomLineContainerStyle}>
                    <View style={styles.bottomLineStyle} />
                </View>
            </View>
        </TouchableHighlight>
    </View>;
}

const styles = StyleSheet.create({
    pageContainer: {
        margin: 20,
        alignItems: 'center',
        flexDirection: 'column',
    },
    certificateTextBottom: {
        fontWeight: '700',
        fontSize: 16,
        flex: 1,
        marginTop: 10,
        marginEnd: 5,
        color: COL.WHITE,
        textTransform: 'capitalize',
    },
    page: {
        marginTop: 30,
        alignItems: 'center',
        flexDirection: 'column',
    },
    loginContainer: {
        width: '100%',
        height: 80,
        alignSelf: 'baseline',
    },
    scrollHeaderContainer: {
        width: '100%',
        height: 50,
        alignSelf: 'baseline',
        position: 'absolute',
        backgroundColor: '#00000030',
    },
    menuButton: {
        width: 48,
        height: 48,
        marginTop: 5,
        padding: 13,
        borderRadius: 24,
    },
    profileButton: { width: 69, height: 66, borderRadius: 33, overflow: 'hidden', marginEnd: 5 },
    logoContainerBack: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        position: 'absolute',
        width: '100%',
    },
    mainContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flex: 1,
    },
    mainAppContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flex: 1,
        flexWrap: 'wrap',
        width: '100%',
        margin: 7,
    },
    historyAppContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flex: 1,
        flexWrap: 'wrap',
        width: '100%',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
        height: '100%',
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
    textBottom: {
        fontWeight: '700',
        fontSize: 16,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 15,
        color: COL.WHITE,
        textTransform: 'capitalize',
    },
    bottomContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: navbarHeight,
    },
    searchView: {
        width: '100%',
        alignItems: 'center',
    },
    mainDoctorStyle: {
        width: '100%',
        height: 80,
        borderRadius: 20,
    },
    mainDoctorContent: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        flexDirection: 'row',
    },
    doctorContainer: {
        width: 69,
        height: 66,
        borderRadius: 33,
        overflow: 'hidden',
        marginStart: 10,
    },
    doctorImage: {
        width: 69,
        height: 66,
    },
    doctorContainerNameStyle: {
        marginStart: 10,
    },
    doctorSpecialist: {
        marginStart: 10,
        fontWeight: '500',
        fontSize: 18,
        color: COL.MAIN,
    },
    leftArrowStyle: {
        width: 15,
        height: 15,
        marginStart: 50,
    },
    bottomLineContainerStyle: {
        width: '100%',
        height: 2,
        position: 'absolute',
        paddingStart: 40,
        paddingEnd: 40,
        bottom: 0,
    },
    bottomLineStyle: {
        width: '100%',
        height: 2,
        backgroundColor: COL.MAIN,
        bottom: 0,
    },
    bookButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 10,
        paddingBottom: 10,
        paddingEnd: 30,
        paddingStart: 30,
        flexDirection: 'row',
        height: 60,
    },
    scrollStyle: {
        flexGrow: 1,
        justifyContent: 'flex-end',
        flex: 0,
    },
    displayCerButton: {
        width: 150,
        height: 45,
        backgroundColor: COL.MAIN,
        borderRadius: 15,
        elevation: 10,
        marginStart: 10,
        marginEnd: 10,
        shadowColor: COL.WHITE,
        alignItems: 'center',
    },
});


const stylesColorful = (isDark: boolean) => {
    return StyleSheet.create({
        backStyle: {
            backgroundColor: isDark ? Colors.darker : Colors.lighter,
            width: '100%',
            height: '100%',
        },
        doctorNameStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: isDark ? COL.WHITE : COL.BLACK,
        },
        backListStyle: {
            borderRadius: 20,
            shadowColor: COL.MAIN,
            marginStart: 20,
            marginEnd: 20,
            elevation: 15,
            backgroundColor: isDark ? Colors.darker : Colors.lighter,
            flex: 1,
            margin: 7,
        },
    });
};


export default UserAppointment;
