import React from 'react';
import { BackHandler, RefreshControl, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableHighlight, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import MultiSwitch from '../../component/multipleSwitch/multipleSwitch';
import { FetchIsDarkMode } from '../../global/dims';
import { LeftArrow, ScheduleIcon } from '../../assets/logo';
import * as COL from '../../global/styles';
import { DOCTOR_DETAIL_ADMIN, SCHEDULE_SCREEN, LOG_In } from '../../global/const';
import { DoctorSack } from '../../global/model';
import { FlatListed, MainMenu, ProfilePic, SearchView } from '../../global/baseView';
import { fetchDoctors } from '../../firebase/fireStore';
import { MenuOption, MenuProvider } from 'react-native-popup-menu';
import { signOut } from '../../firebase/fireAuth';
import { checkForIntent } from '../../firebase/notifyNavigator';
import Spinner from 'react-native-loading-spinner-overlay';
import { checkNewMessage } from '../../firebase/lifecycle';
import { strings } from '../../global/strings';
import { firstCapital } from '../../global/utils';

type Props = {
    doctors: DoctorSack[],
    originalDoctors: DoctorSack[],
    spinner: boolean,
    toggle: string,
}

type IProps = {
    doctors?: DoctorSack[],
    originalDoctors?: DoctorSack[],
    spinner?: boolean,
    toggle?: string,
}

const HomeAdminScreen = ({ route, navigation }: { route: any, navigation: any }) => {
    const { isDark } = route.params;
    const isDarkMode: boolean = route !== undefined && route.params != null ? isDark : FetchIsDarkMode();

    const refInput = React.useRef<TextInput>(null);
    const toggleItems = [strings.underRev, strings.allDoc];
    const [state, dispatch] = React.useReducer<(prevState: Props, action: IProps) => Props>(
        (state: Props, newState: IProps) => ({ ...state, ...newState }),
        {
            doctors: [],
            originalDoctors: [],
            spinner: false,
            toggle: toggleItems[1],
        } as Props,
    );

    React.useEffect(() => {
        updateSpinner(true);
        fetchDoctors(true, (allDoctors) => {
            dispatch({ doctors: allDoctors, originalDoctors: allDoctors })
            checkForIntent(isDarkMode, (map: any) => {
                updateSpinner(false);
                navigation.navigate(map.navigatorTag, map.data);
            }, () => {
                updateSpinner(false);
            });
            checkNewMessage(isDarkMode, (map) => {
                updateSpinner(false)
                navigation.navigate(map.navigatorTag, map.data);
            }, (bool) => updateSpinner(bool))
        });
    }, []);

    const renderItem = ({ item }: { item: DoctorSack }) => {
        return recyclerChild(item, isDarkMode, () => navigation.navigate(DOCTOR_DETAIL_ADMIN, { data: item.asJsonAll(), isDark: isDarkMode }));
    };

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
    return <MenuProvider skipInstanceCheck={true}>
        <SafeAreaView style={stylesColorMain.backStyle}>
            <StatusBar translucent={false} backgroundColor={isDarkMode ? Colors.darker : Colors.lighter} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <Spinner
                visible={state.spinner}
                textContent={strings.loading}
                color={isDarkMode ? COL.WHITE : COL.BLACK}
                textStyle={{ color: isDarkMode ? COL.WHITE : COL.BLACK }}
                animation={'fade'}
                cancelable={false}
                overlayColor={isDarkMode ? COL.SHADOW_WHITE : COL.SHADOW_BLACK}
            />
            <View style={COL.stylesMain.mainContainer}>
                <View style={COL.stylesMain.headerContainer}>
                    <View style={COL.stylesMain.headerDetailsContainer}>
                        <SearchView isDarkMode={isDarkMode}
                            onChangeText={(text: String) => { dispatch({ doctors: state.originalDoctors.filter(it => String(it.nameDoc).toLowerCase().includes(String(text).toLowerCase()) || String(it.specialistDoc).toLowerCase().includes(String(text).toLowerCase())) }); }}
                            onPress={() => dispatch({ doctors: state.originalDoctors })} />
                    </View>
                    <View style={COL.stylesMain.headerIconsContainer}>
                        <MainMenu isDarkMode={isDarkMode}>
                            <MenuOption
                                customStyles={{
                                    OptionTouchableComponent: () => <TouchableHighlight
                                        underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                                        style={stylesColorMain.optionMenuItemContainer}
                                        onPress={() => {
                                            signOut(() => {
                                                navigation.replace(LOG_In, { isDark: isDarkMode, isDoctor: true })
                                                BackHandler.exitApp();
                                            })
                                        }}>
                                        <Text style={stylesColorMain.optionMenuItemText}>{strings.signOut}</Text>
                                    </TouchableHighlight>
                                }} />
                        </MainMenu>
                        <TouchableHighlight
                            style={styles.scheduleButton}
                            underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                            onPress={() => { navigation.navigate(SCHEDULE_SCREEN, { isDark: isDarkMode }) }}>
                            <ScheduleIcon color={COL.MAIN} />
                        </TouchableHighlight>
                    </View>
                </View>
                <View style={COL.stylesMain.toggleContainerBack}>
                    <View />
                    <View style={COL.stylesMain.toggleViewStyle}>
                        <MultiSwitch
                            value={state.toggle}
                            items={toggleItems}
                            onChange={(value: string) => {
                                dispatch({ toggle: value, spinner: true })
                                fetchDoctors(value === toggleItems[1], (allDoctors) => {
                                    dispatch({ doctors: allDoctors, originalDoctors: allDoctors, spinner: false })
                                });
                            }}
                            containerStyle={stylesColorMain.toggleView}
                            sliderStyle={{
                                backgroundColor: COL.MAIN,
                            }}
                            textStyle={stylesColorMain.textToggleStyle}
                            activeTextStyle={COL.stylesMain.activeToggleStyle}
                        />
                    </View>
                </View>
                <FlatListed
                    data={state.doctors}
                    refreshControl={
                        <RefreshControl
                            refreshing={false}
                            onRefresh={() => {
                                fetchDoctors(state.toggle === toggleItems[1], (allDoctors) => {
                                    if (allDoctors !== state.doctors) {
                                        dispatch({ doctors: allDoctors, originalDoctors: allDoctors })
                                    }
                                });
                            }} />
                    }
                    renderItem={renderItem}
                    emptyMessage={state.spinner ? '' : state.toggle === toggleItems[1] ? strings.noDoc : strings.noDocRev}
                    isDarkMode={isDarkMode}
                />
            </View>
        </SafeAreaView>
    </MenuProvider >
};

function recyclerChild(data: DoctorSack, isDarkMode: boolean, press: () => void) {
    return <View style={COL.stylesMain.mainFlatListContainer} key={data.doctorDocId}>
        <TouchableHighlight
            style={COL.stylesMain.touchableFlatListContainer}
            onPress={press}
            underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}>
            <View style={COL.stylesMain.subTouchableFlatList}>
                <View style={COL.stylesMain.profilePicContainer}>
                    <ProfilePic style={COL.stylesMain.profilePic} uri={data.personalImage} />
                </View>
                <View style={COL.stylesMain.flatListDetailsContainer}>
                    <Text style={[COL.stylesColorMain(isDarkMode).screenTittle, { marginTop: 10 }]}>{firstCapital(data.nameDoc)}</Text>
                    <View style={COL.stylesMain.subFlatListDetails}>
                        <Text style={COL.stylesMain.flatListSubTittle}>{data.specialistDoc}</Text>
                        <View style={COL.stylesMain.flatListDetailsIcon}>
                            <LeftArrow />
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
    scheduleButton: {
        width: 55,
        height: 55,
        borderRadius: 30,
        overflow: 'hidden',
        marginEnd: 5,
        marginTop: 8,
        padding: 5,
        paddingTop: 10
    },
});


export default HomeAdminScreen;
