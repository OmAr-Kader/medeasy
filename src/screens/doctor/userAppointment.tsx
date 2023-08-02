import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { FetchIsDarkMode } from '../../global/dims';
import { BackArrow, DonePending } from '../../assets/logo';
import * as COL from '../../global/styles';
import { ExaminationSack, jsonToUser } from '../../global/model';
import { firstCapital, formatAmPm } from '../../global/utils';
import { convertDateToMonthAndDay } from '../../global/utils';
import { FlatListed, ProfilePic } from '../../global/baseView';
import { APPOINTMENT_SCREEN_DOCTOR, EDIT_SAVE_EDITABLE_INTI_NOT, PROFILE_IMAGE_SCREEN } from '../../global/const';
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
        return recyclerChildExamination(item, isDarkMode, () => navigation.navigate(APPOINTMENT_SCREEN_DOCTOR, { isDark: isDarkMode, data: item.asJsonAll(), modeApp: EDIT_SAVE_EDITABLE_INTI_NOT, newAp: [], userName: userSack.nameUser, profilePic: userSack.personalImage }));
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

    const stylesColorMain = COL.stylesColorMain(isDarkMode)
    return <SafeAreaView style={stylesColorMain.backStyle}>
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
        <View style={COL.stylesMain.mainContainer}>
            <View style={COL.stylesMain.headerContainer}>
                <View style={COL.stylesMain.headerDetailsContainer}>
                    <Text style={stylesColorMain.screenTittle}>{firstCapital(userSack.nameUser)}</Text>
                </View>
                <View style={COL.stylesMain.headerIconsContainer}>
                    <TouchableHighlight style={COL.stylesMain.menuButton} underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                        onPress={() => { navigation.goBack(); }}>
                        <BackArrow color={isDarkMode ? COL.WHITE : COL.BLACK} />
                    </TouchableHighlight>
                    <View style={COL.stylesMain.profileButton}>
                        <TouchableHighlight
                            onPress={userSack.personalImage.length > 0 ? () => {
                                navigation.navigate(PROFILE_IMAGE_SCREEN, { data: userSack.personalImage, isDark: isDarkMode });
                            } : undefined}
                            underlayColor={COL.MAIN_WHITER}>
                            <ProfilePic style={COL.stylesMain.profilePic} uri={userSack.personalImage} />
                        </TouchableHighlight>
                    </View>
                </View>
            </View>
            <ScrollView contentInsetAdjustmentBehavior="automatic"
                overScrollMode={'always'}
                keyboardShouldPersistTaps={'handled'}
                keyboardDismissMode={'interactive'}
                contentContainerStyle={styles.scrollStyle}>
                <View style={stylesColorMain.backListFourCorner}>
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

    return <View style={COL.stylesMain.mainFlatListContainer} key={value.date}>
        <TouchableHighlight style={COL.stylesMain.touchableFlatListContainer}
            onPress={press}
            underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}>
            <View style={COL.stylesMain.subTouchableFlatList}>
                <View style={COL.stylesMain.profilePicContainer}>
                    <ProfilePic style={COL.stylesMain.profilePic} uri={value.communicationMethods.doctorImg} />
                </View>
                <View style={COL.stylesMain.flatListDetailsContainer}>
                    <Text style={[COL.stylesColorMain(isDarkMode).screenTittle, { marginTop: 10 }]}>{firstCapital(tittle)}</Text>
                    <View style={COL.stylesMain.subFlatListDetails}>
                        <Text style={COL.stylesMain.flatListSubTittle}>{value.clientNote}</Text>
                        <View style={COL.stylesMain.flatListDetailsIcon}>
                            <DonePending isDone={value.doctorAccepted} />
                        </View>
                    </View>
                </View>
                <View style={COL.stylesMain.bottomLineFlatListContainer}>
                    <View style={COL.stylesMain.bottomLineFlatList} />
                </View>
            </View>
        </TouchableHighlight>
    </View>;
}

const styles = StyleSheet.create({
    scrollStyle: {
        flexGrow: 1,
        justifyContent: 'flex-end',
        flex: 0,
    },
});

export default UserAppointment;
