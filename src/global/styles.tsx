import { StyleSheet } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

export const BACK_DARK = Colors.darker;
export const BACK_LIGHT = Colors.lighter;
export const LIGHT_BLUE = '#b2c1d9';
export const DARK_BLUE = '#1c1a2f';
export const WHITE = '#ffffff';
export const SHADOW_WHITE = '#00000030';
export const WHITE_226 = '#e5e5e5';
export const WHITE_200 = '#c8c8c8';
export const WHITE_196 = '#c4c4c4';
export const WHITE_165_A_30 = '#a5a5a533';
export const GREY = '#7d7d7d';
export const BLACK_99_A_30 = '#63636333';
export const BLACK_55 = '#373737';
export const BLACK_46 = '#2e2e2e';
export const SHADOW_BLACK = '#ffffff30';
export const BLACK_26 = '#1a1a1a';
export const BLACK = '#000000';
export const MAIN = '#166FC1';
export const MAIN_PALE = '#697f94';
export const MAIN_WHITER = '#3F98E9';
export const GREEN_CALL = '#00a22e';
export const GREEN_CALL_WHITER = '#36d964';
export const RED = '#b80b12';
export const PENDING_COLOR = '#f1b207';


export const stylesMain = StyleSheet.create({
    screenSubTittle: {
        marginStart: 70,
        marginEnd: 70,
        fontWeight: '500',
        fontSize: 18,
        color: MAIN,
    },
    mainFlatListContainer: {
        width: '100%',
        height: 80,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flex: 1,
        flexWrap: 'wrap',
    },
    touchableFlatListContainer: {
        width: '100%',
        height: '100%',
        marginStart: 15,
        borderRadius: 20
    },
    subTouchableFlatList: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        flexDirection: 'row',
    },
    profilePicContainer: {
        width: 66,
        height: 66,
        borderRadius: 33,
        overflow: 'hidden',
    },
    profilePic: {
        width: 66,
        height: 66,
    },
    flatListDetailsContainer: {
        marginStart: 10,
    },
    subFlatListDetails: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        flex: 1,
        flexWrap: 'wrap',
        width: '100%',
        marginStart: 10,
    },
    flatListSubTittle: {
        fontWeight: '500',
        width: '65%',
        fontSize: 18,
        color: MAIN,
        marginEnd: 10,
        textAlign: 'left',
    },
    flatListDetailsIcon: {
        width: 15,
        height: 15,
    },
    bottomLineFlatListContainer: {
        width: '100%',
        height: 1,
        position: 'absolute',
        paddingStart: '15%',
        paddingEnd: '15%',
        bottom: 0,
    },
    bottomLineFlatList: {
        width: '100%',
        height: 1,
        backgroundColor: MAIN,
        bottom: 0,
    },
    menuButton: {
        width: 48,
        height: 48,
        marginTop: 5,
        padding: 13,
        borderRadius: 24,
    },
    profileButton: {
        width: 66,
        height: 66,
        borderRadius: 33,
        overflow: 'hidden',
        marginEnd: 5
    },
    headerContainer: {
        width: '100%',
        flexWrap: 'wrap',//height: 80,
        alignSelf: 'baseline',
    },
    headerDetailsContainer: {
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
        //height: '100%',
    },
    headerIconsContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        position: 'absolute',
        width: '100%',
    },
    scrollStyle: {
        flexGrow: 1,
        justifyContent: 'flex-end',
        flex: 0,
    },
    toggleViewStyle: {
        padding: 10,
        marginEnd: 10,
        width: 180,
    },
    activeToggleStyle: {
        color: WHITE,
        fontSize: 14,
        fontWeight: '300',
    },
    toggleContainerBack: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingEnd: 5,
        justifyContent: 'space-between',
        width: '100%',
    },
    mainContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flex: 1,
    },
});

export const stylesColorMain = (isDark: boolean) => {
    return StyleSheet.create({
        backStyle: {
            backgroundColor: isDark ? Colors.darker : Colors.lighter,
            width: '100%',
            height: '100%',
        },
        screenTittle: {
            fontWeight: '700',
            fontSize: 18,
            marginStart: 60,
            marginEnd: 60,
            color: isDark ? WHITE : BLACK,
        },
        toggleView: {
            backgroundColor: isDark ? BLACK_55 : WHITE_196,
            height: 40,
            width: 180,
        },
        textToggleStyle: {
            color: isDark ? WHITE : BLACK,
            fontSize: 14,
            fontWeight: '300',
        },
        toggleItemStyle: {
            backgroundColor: isDark ? WHITE_196 : BLACK_55,
            borderColor: isDark ? WHITE_196 : BLACK_55,
        },
        toggleItemStyleSelected: {
            backgroundColor: MAIN,
            borderColor: MAIN,
        },
        backListFourCorner: {
            borderRadius: 20,
            shadowColor: MAIN,
            marginStart: 20,
            marginEnd: 20,
            elevation: 15,
            backgroundColor: isDark ? Colors.darker : Colors.lighter,
            flex: 1,
            margin: 7,
        },
        optionMenuItemText: {
            color: isDark ? WHITE_226 : BLACK_26,
            textAlign: 'center',
            fontSize: 16,
            fontWeight: '500',
        },
        optionMenuItemContainer: {
            width: 110,
            height: 40,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
        },
    });
};
