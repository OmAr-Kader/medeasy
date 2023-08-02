import React from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, FlatListProps, RefreshControlProps, ListRenderItem } from 'react-native';
import { BACK_DARK, BACK_LIGHT } from './styles';
import * as COL from '../global/styles';
import { TouchableHighlight } from 'react-native';
import { EditSave, Filter, Menus, Profile, Search } from '../assets/logo';
import * as CONST from './const';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import Dialog from 'react-native-dialog';
import Animated, { FadeIn, FadeOut, StretchInY, StretchOutY } from 'react-native-reanimated';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import { strings } from './strings';

export const ProfilePic = ({ style, uri }: { style: any, uri: string }): React.JSX.Element => {
    return (
        uri.length > 0 ? <Image
            style={style}
            source={{ uri: uri, cache: 'only-if-cached' }}
            onError={ProfileIfFailed} /> : <ProfileIfFailed />
    );
};

const ProfileIfFailed = (): React.JSX.Element => {
    return <Profile />;
};

export const StatusBarView = ({ isDarkMode }: { isDarkMode: boolean }): React.JSX.Element => {
    return <StatusBar translucent={false} backgroundColor={isDarkMode ? BACK_DARK : BACK_LIGHT} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />;
};

export const ScrollUpDown = ({ isDarkMode, child }: { isDarkMode: boolean, child: React.JSX.Element }): React.JSX.Element => {
    return <SafeAreaView style={stylesColorful(isDarkMode).backgroundStyle}>
        <StatusBarView isDarkMode={isDarkMode} />
        <ScrollView contentInsetAdjustmentBehavior="automatic"
            overScrollMode={'always'}
            keyboardShouldPersistTaps={'handled'}
            keyboardDismissMode={'interactive'}//'on-drag
            contentContainerStyle={styles.scrollStyle} children={child} />
    </SafeAreaView>;
};

//const [isExpended, setIsExpended] = React.useState<boolean | null>(null);
//setIsExpended(isExpended === null ? false : !isExpended)
export const ExpendCollapseView = ({ visible, intiWithAnim = false, children }: { visible: boolean, intiWithAnim?: boolean, children: React.ReactNode }): React.JSX.Element | null => {
    const isEntering = React.useRef<boolean>(false)
    React.useEffect(() => {
        visible && intiWithAnim ? (isEntering.current = false) : (isEntering.current = true);
    }, [visible])
    return visible ? (
        <Animated.View
            entering={isEntering.current ? StretchInY.duration(400) : undefined}
            exiting={StretchOutY.duration(400)} children={children} />
    ) : null
};

export const LoadingButton = ({ text, isLoading, style }: { text: string, isLoading: boolean, style: {} }) => {
    return <View style={{ width: '100%', height: '100%', flex: 1, justifyContent: "center", alignItems: "center" }}>
        {
            !isLoading ? <Text style={style}>{text}</Text> : <ActivityIndicator size="small" color={COL.MAIN} style={[{ flex: 1 }]} />
        }
    </View>
}

export const EditSaveTextInput = ({ isDarkMode, mode, multiline, defaultText, hint, minHeight, minWidth, flex, style, onSave, onChange }: { isDarkMode: boolean, mode: number, multiline: boolean, defaultText: string, hint?: string, minHeight?: number, minWidth?: number, flex: number, style?: {}, onSave: (text: string) => void, onChange: (text: string) => void }): React.JSX.Element => {
    const [editable, setEditable] = React.useState(mode === CONST.EDIT_SAVE_EDITABLE_INTI_YES || mode === CONST.EDIT_SAVE_NOT_EDITABLE_INTI_YES);
    const [text, setText] = React.useState<string>(defaultText);
    const textRef = React.useRef<TextInput>(null);
    const onPress = () => {
        if (editable) {
            if (text !== defaultText) {
                onSave(text);
                setEditable(false);
            }
        } else {
            setEditable(true);
            setTimeout(() => {
                textRef?.current?.focus();
            }, 150);
        }
    };
    const styleEditSave: {} = mode === CONST.EDIT_SAVE_EDITABLE_INTI_YES || mode === CONST.EDIT_SAVE_EDITABLE_INTI_NOT ? StyleSheet.flatten({ width: 40, height: 40, padding: 10, borderRadius: 20, position: 'absolute', end: 0, marginTop: 3 }) : StyleSheet.flatten({ width: 0, height: 0, padding: 10, borderRadius: 20, position: 'absolute', end: 10 });
    return <View style={StyleSheet.flatten({ flex: flex, flexDirection: 'row' })}>
        <TextInput
            ref={textRef}
            style={[style ? style : stylesColorful(isDarkMode).bioTextStyle, StyleSheet.flatten({ flex: flex, minHeight: minHeight, minWidth: minWidth, marginEnd: 40, textAlign: 'left' })]}
            editable={editable}
            returnKeyType="default"
            onSubmitEditing={() => text !== defaultText ? onSave(text) : {}}
            defaultValue={defaultText.length > 0 ? defaultText : undefined}
            multiline={multiline}
            placeholder={hint}
            placeholderTextColor={isDarkMode ? COL.WHITE_200 : COL.BLACK_55}
            onChangeText={newText => {
                setText(newText);
                onChange(newText);
            }} />
        <TouchableHighlight style={styleEditSave}
            underlayColor={isDarkMode ? COL.SHADOW_WHITE : COL.SHADOW_BLACK}
            onPress={onPress}>
            <EditSave color={isDarkMode ? COL.WHITE_200 : COL.BLACK_55} editable={editable} />
        </TouchableHighlight>
    </View>;
};

export const SeeMoreText = ({ isDarkMode, seeMoreTxt, subAfter, tittle }: { isDarkMode: boolean, seeMoreTxt: string, subAfter: number, tittle: string }): React.JSX.Element => {
    const [seeMore, setSeeMore] = React.useState(false);

    const isBigText = seeMoreTxt.length > subAfter;
    var firstHalf = '';
    var secondHalf = '';

    if (isBigText) {
        firstHalf = seeMoreTxt.substring(0, subAfter);
        secondHalf = seeMoreTxt.substring(subAfter + 1, seeMoreTxt.length);
    } else {
        firstHalf = seeMoreTxt;
        secondHalf = '';
    }
    const isLastEmpty = firstHalf.substring(seeMoreTxt.length - 1, seeMoreTxt.length) === ' ';
    const displayText = isBigText ? (seeMore ? firstHalf + secondHalf : (isLastEmpty ? firstHalf + '\n' + '...' : firstHalf + '...')) : firstHalf;

    const seeMoreStyle = isBigText ? { padding: 10 } : {
        width: 0,
        height: 0,
    };
    return <View style={stylesColorful(isDarkMode).bioStyleMain}>
        <View style={stylesColorful(isDarkMode).bioStyle}>
            <Text style={stylesColorful(isDarkMode).bioTextTitleStyle}>{tittle}</Text>
            <Text style={stylesColorful(isDarkMode).bioTextStyle}>{displayText}</Text>
            <TouchableHighlight style={seeMoreStyle}
                underlayColor={isDarkMode ? COL.SHADOW_WHITE : COL.SHADOW_BLACK}
                onPress={() => setSeeMore(!seeMore)}>
                <Text style={styles.seeMoreBlue}>{seeMore ? 'See less' : 'See more'}</Text>
            </TouchableHighlight>
        </View>
    </View>;
};

export const FlatListed = ({ data, emptyMessage, isDarkMode, renderItem, scrollEnabled = true, refreshControl }: { data: any[], emptyMessage: string, isDarkMode: boolean, renderItem: ListRenderItem<any>, scrollEnabled?: boolean, refreshControl?: React.ReactElement<RefreshControlProps> | undefined }): React.JSX.Element => {
    return data.length !== 0 ? <FlatList
        data={data}
        scrollEnabled={scrollEnabled}
        initialNumToRender={10} // initialNumToRender(80)
        maxToRenderPerBatch={4}
        windowSize={4}
        refreshControl={refreshControl}
        renderItem={renderItem} /> : <View style={styles.emptyListContainer}>
        <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            style={styles.animatedForEmptyList}>
            <Text style={stylesColorful(isDarkMode).textForEmptyList}>{emptyMessage}</Text>
        </Animated.View>
    </View>
}

export const SearchView = ({ isDarkMode, onChangeText, onPress }: { isDarkMode: boolean, onChangeText: (text: String) => void, onPress: () => void }) => {
    const refInput = React.useRef<TextInput>(null);

    return <View style={styles.searchView}>
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
                        onPress()
                    }
                }}>
                <Search />
            </TouchableHighlight>
            <TextInput
                style={stylesColorful(isDarkMode).textInput}
                placeholder={strings.search}
                returnKeyType="done"
                ref={refInput}
                onChangeText={onChangeText}
                placeholderTextColor={isDarkMode ? COL.WHITE_200 : COL.BLACK_46} />
            <TouchableHighlight style={stylesColorful(isDarkMode).eyeLogo}
                underlayColor={COL.MAIN_PALE}>
                <Filter />
            </TouchableHighlight>
        </View>
    </View>
}

export const MainMenu = ({ isDarkMode, children }: { isDarkMode: boolean, children: React.ReactNode }) => {
    return <View>
        <Menu>
            <MenuTrigger style={[COL.stylesMain.menuButton, { backgroundColor: '#00000000' }]}>
                <Menus />
            </MenuTrigger>
            <MenuOptions
                customStyles={{
                    optionsContainer: stylesColorful(isDarkMode).optionsMenuContainer,
                }} children={children} />
        </Menu>
    </View>
}

export const DialogTwoButtonAlert = ({ alertTitle, alertMsg, positiveButton, negativeButton, data, visible, invoke, cancel, onClose }: { alertTitle: string, alertMsg: string, positiveButton: string, negativeButton: string, data?: any, visible: boolean, invoke: (item: any) => void, cancel: () => void, onClose?: () => void }) => {
    return <Dialog.Container visible={visible} contentStyle={styles.dialogStyle}
        onBackdropPress={onClose !== null && onClose !== undefined ? onClose : cancel}
        onRequestClose={onClose !== null && onClose !== undefined ? onClose : cancel}>
        <Dialog.Title>{alertTitle}</Dialog.Title>
        <Dialog.Description>{alertMsg}</Dialog.Description>
        <Dialog.Button label={negativeButton} onPress={cancel} color={COL.MAIN} />
        <Dialog.Button label={positiveButton} onPress={() => invoke(data)} color={COL.MAIN_WHITER} />
    </Dialog.Container>;
};

export const AutoCompleteList = ({ isDark, isHidden, list, style, onPress }: { isDark: boolean, isHidden: boolean, list: string[], style: {}, onPress: (text: string) => void }) => {
    return <View style={isHidden ? styles.autoCompleteListHidden : style}>
        <FlatList
            data={list}
            scrollEnabled={true}
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={4}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps={'handled'}
            renderItem={({ item }) => <TouchableOpacity onPress={() => onPress(item)}>
                <Text style={stylesColorful(isDark).itemText}>{item}</Text>
            </TouchableOpacity>
            }
            keyExtractor={(item: any, index: any) => `key-${item} ${index}`}
        />
    </View>;
};

export const DayPicker = ({ dayTextStyle, textColor, activeColor, inactiveColor, wrapperStyles, itemStyles, selectedDay, onSelected }: { activeColor?: string, textColor?: string, inactiveColor?: string, wrapperStyles?: any, dayTextStyle?: any, itemStyles?: any, selectedDay: CONST.PairTwoSack | null, onSelected: (day: any) => void }) => {

    const acColor = activeColor ? activeColor : 'red'
    const icColor = inactiveColor ? inactiveColor : 'grey'
    const tColor = textColor ? textColor : 'white'
    const selected = selectedDay !== null ? selectedDay.id : -1

    return (
        <View style={[styles.boxContainer, wrapperStyles]}>
            {CONST.DAYS_FOR_PICKER.map((item) => {
                return <TouchableOpacity key={item.id}
                    onPress={() => {
                        onSelected(item)
                    }}>
                    <View
                        style={[
                            styles.box, itemStyles,
                            { backgroundColor: item.id === selected ? acColor : icColor },
                        ]}>
                        <Text style={[{ color: tColor }, dayTextStyle]}>{item.name}</Text>
                    </View>
                </TouchableOpacity>
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    scrollStyle: {
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
    dialogStyle: { borderRadius: 20 },
    seeMoreBlue: {
        fontSize: 14,
        fontWeight: '500',
        color: COL.MAIN_WHITER,
    },
    autoCompleteListHidden: {
        width: 0,
        height: 0,
    },
    box: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginStart: 2,
        marginEnd: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 30,
    },
    boxContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginTop: 20,
    },
    emptyListContainer: {
        width: '100%',
        height: '30%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    listContainer: {
        width: '100%',
        height: '100%',
    },
    animatedForEmptyList: {
        marginStart: 60,
        marginEnd: 60,
        position: 'absolute',
        bottom: 0,
    },
    searchView: {
        width: '100%',
        alignItems: 'center',
        marginTop: 25,
    },
});

const stylesColorful = (isDark: boolean) => {
    return StyleSheet.create({
        backgroundStyle: {
            backgroundColor: isDark ? BACK_DARK : BACK_LIGHT,
            width: '100%',
            height: '100%',
        },
        bioStyleMain: {
            padding: 20,
        },
        bioStyle: {
            flexDirection: 'column',
            borderRadius: 30,
            elevation: 10,
            padding: 10,
            shadowColor: COL.WHITE,
            backgroundColor: isDark ? COL.BLACK_55 : COL.WHITE_200,
        },
        bioTextTitleStyle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: isDark ? COL.WHITE : COL.BLACK,
        },
        bioTextStyle: {
            fontSize: 14,
            fontWeight: '400',
            paddingStart: 10,
            paddingEnd: 10,
            //textAlign: 'center',
            color: isDark ? COL.WHITE : COL.BLACK,
        },
        seeMoreStyle: {
            fontSize: 14,
            fontWeight: '400',
            color: isDark ? COL.WHITE : COL.BLACK,
        },
        itemText: {
            fontSize: 15,
            margin: 2,
            backgroundColor: isDark ? Colors.darker : Colors.lighter,
        },
        autoCompleteList: {
            maxHeight: 150,
            alignSelf: 'baseline',
            position: 'absolute',
            flex: 1,
            flexGrow: 0,
            //minHeight: 30,
            flexDirection: 'row',
            left: 30,
            right: 30,
            top: 100,
            backgroundColor: isDark ? Colors.darker : Colors.lighter,
        },
        textForEmptyList: {
            fontWeight: '400',
            fontSize: 21,
            color: isDark ? COL.WHITE_200 : COL.BLACK_55,
        },
        optionsMenuContainer: {
            width: 110,
            backgroundColor: isDark ? COL.BLACK_55 : COL.WHITE_200,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            flex: 1,
            flexWrap: 'wrap',
            marginTop: 45,
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
    });
};
