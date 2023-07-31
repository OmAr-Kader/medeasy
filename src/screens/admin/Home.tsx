import React from 'react';
import { BackHandler, RefreshControl, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableHighlight, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import MultiSwitch from 'react-native-multiple-switch';
import { FetchIsDarkMode, initialNumToRender } from '../../global/dims';
import { Filter, LeftArrow, Menus, Search, ScheduleIcon } from '../../assets/logo';
import * as COL from '../../global/styles';
import { DOCTOR_DETAIL_ADMIN, SCHEDULE_SCREEN } from '../../global/const';
import { DoctorSack } from '../../global/model';
import { FlatListed, ProfilePic } from '../../global/baseView';
import { fetchDoctors } from '../../firebase/fireStore';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import { signOut } from '../../firebase/fireAuth';
import { checkForIntent } from '../../firebase/notifyNavigator';
import Spinner from 'react-native-loading-spinner-overlay';
import { checkNewMessage } from '../../firebase/lifecycle';
import { strings } from '../../global/strings';

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

    return <MenuProvider skipInstanceCheck={true}>
        <SafeAreaView style={stylesColorful(isDarkMode).backStyle}>
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
            <View style={styles.mainContainer}>
                <View style={styles.loginContainer}>
                    <View style={styles.logoContainer}>
                        <View style={stylesColorful(isDarkMode).textInputContainer}>
                            <TouchableHighlight style={stylesColorful(isDarkMode).eyeLogo}
                                underlayColor={COL.MAIN_PALE}
                                onPress={() => {
                                    if (refInput?.current === null) {
                                        return;
                                    }
                                    if (!refInput?.current?.isFocused()) {
                                        refInput?.current?.focus();
                                    } else {
                                        refInput?.current?.blur();
                                        refInput?.current?.clear();
                                        dispatch({ doctors: state.originalDoctors })
                                    }
                                }}>
                                <Search />
                            </TouchableHighlight>
                            <TextInput
                                style={stylesColorful(isDarkMode).textInput}
                                placeholder={strings.search}
                                returnKeyType="done"
                                ref={refInput}
                                onChangeText={(text: String) => { dispatch({ doctors: state.originalDoctors.filter(it => String(it.nameDoc).toLowerCase().includes(String(text).toLowerCase()) || String(it.specialistDoc).toLowerCase().includes(String(text).toLowerCase())) }); }}
                                placeholderTextColor={isDarkMode ? COL.WHITE_200 : COL.BLACK_46} />
                            <TouchableHighlight style={stylesColorful(isDarkMode).eyeLogo}
                                underlayColor={COL.MAIN_PALE}>
                                <Filter />
                            </TouchableHighlight>
                        </View>
                    </View>
                    <View style={styles.logoContainerBack}>
                        <View>
                            <Menu>
                                <MenuTrigger style={styles.menuButton}>
                                    <Menus />
                                </MenuTrigger>
                                <MenuOptions
                                    customStyles={{
                                        optionsContainer: stylesColorful(isDarkMode).optionsMenuContainer,
                                    }}>
                                    <MenuOption
                                        text={strings.signOut}
                                        onSelect={() => {
                                            signOut(() => {
                                                BackHandler.exitApp();
                                            });
                                        }} customStyles={{
                                            optionText: stylesColorful(isDarkMode).optionMenuText,
                                        }} />
                                </MenuOptions>
                            </Menu>
                        </View>
                        <TouchableHighlight
                            style={styles.profileButton}
                            underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                            onPress={() => { navigation.navigate(SCHEDULE_SCREEN, { isDark: isDarkMode }) }}>
                            <ScheduleIcon color={COL.MAIN} />
                        </TouchableHighlight>
                    </View>
                </View>
                <View style={styles.toggleContainerBack}>
                    <View style={styles.menuButton} />
                    <View style={styles.toggleViewStyle}>
                        <MultiSwitch
                            value={state.toggle}
                            items={toggleItems}
                            onChange={(value: string) => {
                                dispatch({ toggle: value, spinner: true })
                                fetchDoctors(value === toggleItems[1], (allDoctors) => {
                                    dispatch({ doctors: allDoctors, originalDoctors: allDoctors, spinner: false })
                                });
                            }}
                            containerStyle={stylesColorful(isDarkMode).toggleView}
                            sliderStyle={{
                                backgroundColor: COL.MAIN,
                            }}
                            textStyle={stylesColorful(isDarkMode).textToggleStyle}
                            activeTextStyle={styles.activeToggleStyle}
                        />
                    </View>
                </View>
                <FlatListed
                    data={state.doctors}
                    refreshControl={
                        <RefreshControl
                            refreshing={false}
                            onRefresh={async () => { }} />
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
    return <TouchableHighlight style={styles.mainDoctorStyle}
        key={data.doctorDocId}
        onPress={press}
        underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}>
        <View style={styles.mainDoctorContent}>
            <View style={styles.doctorContainer}>
                <ProfilePic style={styles.doctorImage} uri={data.personalImage} />
            </View>
            <View style={styles.doctorContainerNameStyle}>
                <Text style={stylesColorful(isDarkMode).doctorNameStyle}>{data.nameDoc}</Text>
                <Text style={styles.doctorSpecialist}>{data.specialistDoc}</Text>
            </View>
            <View style={styles.leftArrowStyle}>
                <LeftArrow />
            </View>
            <View style={styles.bottomLineContainerStyle}>
                <View style={styles.bottomLineStyle} />
            </View>
        </View>
    </TouchableHighlight>;
}


const styles = StyleSheet.create({
    loginContainer: {
        width: '100%',
        height: 60,
        alignSelf: 'baseline',
    },
    menuButton: {
        width: 48,
        height: 48,
        padding: 13,
    },
    profileButton: { width: 55, height: 55, borderRadius: 30, overflow: 'hidden', marginEnd: 5, marginTop: 8, padding: 5, paddingTop: 10 },
    toggleViewStyle: {
        width: 180,
        padding: 10,
        marginEnd: 10,
    },
    logoContainerBack: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        position: 'absolute',
        width: '100%',
    },
    toggleContainerBack: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingEnd: 10,
        justifyContent: 'space-between',
        width: '100%',
    },
    toggleContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        position: 'absolute',
        width: 200,
    },
    mainContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flex: 1,
        flexWrap: 'wrap',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
        height: '100%',
    },
    textStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'capitalize',
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
        width: 66,
        height: 66,
        borderRadius: 33,
        overflow: 'hidden',
        marginStart: 10,
    },
    doctorImage: {
        width: 66,
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
    activeToggleStyle: {
        color: COL.WHITE,
        fontSize: 14,
        fontWeight: '300',
    },
});


const stylesColorful = (isDark: boolean) => {
    return StyleSheet.create({
        backStyle: {
            backgroundColor: isDark ? Colors.darker : Colors.lighter,
            width: '100%',
            height: '100%',
        },
        textInput: {
            fontSize: 16,
            textTransform: 'capitalize',
            width: '100%',
            height: '100%',
            color: isDark ? COL.WHITE : COL.BLACK,
            paddingStart: 10,
            textAlign: 'center',
            flex: 1,
        },
        textInputContainer: {
            width: 230,
            height: 40,
            backgroundColor: isDark ? COL.GREY : COL.WHITE_196,
            borderRadius: 20,
            elevation: 10,
            alignItems: 'center',
            shadowColor: COL.BLACK,
            justifyContent: 'center',
            flex: 0,
            flexDirection: 'row',
        },
        eyeLogo: {
            width: 40,
            height: 40,
            padding: 7,
            flex: 0,
            justifyContent: 'flex-end',
            borderRadius: 20,
            elevation: 10,
            shadowColor: COL.BLACK,
            backgroundColor: isDark ? COL.GREY : COL.WHITE_196,
        },
        doctorNameStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: isDark ? COL.WHITE : COL.BLACK,
        },
        toggleView: {
            backgroundColor: isDark ? COL.BLACK_55 : COL.WHITE_196,
            height: 40,
            width: 180,
        },
        textToggleStyle: {
            color: isDark ? COL.WHITE : COL.BLACK,
            fontSize: 14,
            fontWeight: '300',
        },
        optionsMenuContainer: {
            backgroundColor: isDark ? COL.BLACK_55 : COL.WHITE_200,
            width: 110,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            flex: 1,
            flexWrap: 'wrap',
            marginTop: 40,
        },
        optionMenuText: { color: isDark ? COL.WHITE_226 : COL.BLACK_26, textAlign: 'center', height: 30, fontSize: 14, fontWeight: '500', padding: 5 },
    });
};

export default HomeAdminScreen;
