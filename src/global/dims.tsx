import { Dimensions, NativeModules, Platform, useColorScheme } from 'react-native';
import { ScaledSize } from 'react-native/Libraries/Utilities/Dimensions';

const { StatusBarManager } = NativeModules;


export const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBarManager.HEIGHT;

export const FetchIsDarkMode = () => useColorScheme() === 'dark';
/*
export const screenHeight = Dimensions.get('screen').height;
export const windowHeight = Dimensions.get('window').height;
export const windowWidth = Dimensions.get('window').width;
export const navbarHeight = screenHeight - (windowHeight + (Platform.OS === 'ios' ? 20 : StatusBarManager.HEIGHT));

export const initialNumToRender = (itemHeight: number) => screenHeight / itemHeight;

const msp = (dim: ScaledSize, limit: number) => {
    return dim.scale * dim.width >= limit || dim.scale * dim.height >= limit;
};

export const isPortrait = () => {
    const dim = Dimensions.get('screen');
    return dim.height >= dim.width;
};

export const isLandscape = () => {
    const dim = Dimensions.get('screen');
    return dim.width >= dim.height;
};

export const isTablet = () => {
    const dim = Dimensions.get('screen');
    return (
        (dim.scale < 2 && msp(dim, 1000)) || (dim.scale >= 2 && msp(dim, 1900))
    );
};

export const isPhone = () => {
    return !isTablet();
};
*/