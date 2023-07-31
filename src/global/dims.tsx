import { Dimensions, NativeModules, Platform, useColorScheme } from 'react-native';

const { StatusBarManager } = NativeModules;

export const screenHeight = Dimensions.get('screen').height;
export const windowHeight = Dimensions.get('window').height;
export const windowWidth = Dimensions.get('window').width;

export const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBarManager.HEIGHT;
export const navbarHeight = screenHeight - (windowHeight + (Platform.OS === 'ios' ? 20 : StatusBarManager.HEIGHT));

export const FetchIsDarkMode = () => useColorScheme() === 'dark';
export const initialNumToRender = (itemHeight: number) => screenHeight / itemHeight;
