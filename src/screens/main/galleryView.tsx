import { Animated, Dimensions, Image, SafeAreaView, StyleSheet, Text, TouchableHighlight, View, useWindowDimensions } from 'react-native';
import { FetchIsDarkMode } from '../../global/dims';
import React from 'react';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import * as COL from '../../global/styles';
import { BackArrow } from '../../assets/logo';
import { Zoom } from 'react-native-reanimated-zoom';
import { StatusBarView } from '../../global/baseView';

export const CertificatesView = ({ route, navigation }: { route: any, navigation: any }) => {
    const { isDark } = route.params;
    const isDarkMode: boolean = route !== undefined && route.params != null ? isDark : FetchIsDarkMode();
    const { data } = route.params;
    const doctorAuth = data as string[];
    const { width, height } = useWindowDimensions();
    const [currentPage, setCurrentPage] = React.useState(0);
    const scrollX = React.useRef(new Animated.Value(0)).current;
    return <View style={StyleSheet.flatten({ width: '100%', height: '100%', backgroundColor: isDarkMode ? Colors.darker : Colors.lighter })}>
        <Animated.ScrollView
            horizontal={true}
            pagingEnabled={true}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
                const index = Math.round(parseFloat('' + (event.nativeEvent.contentOffset.x / Dimensions.get('window').width)));
                if (currentPage !== index) {
                    setCurrentPage(index);
                }
            }}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                useNativeDriver: true,
            })}>
            {doctorAuth.map((uri, index) => {
                return <View key={index} style={[styles.imageFullScreen, { width, height }]}>
                    <Zoom
                        minimumZoomScale={0.5}
                        style={{ width, height }}>
                        <Image style={{ width, height }} source={{ uri: uri, cache: 'only-if-cached' }} />
                    </Zoom>
                </View>;
            }
            )}
        </Animated.ScrollView>
        <View style={styles.scrollHeaderContainer}>
            <View style={styles.headerTextCenter}>
                <Text style={styles.doctorNameStyle}>{`${currentPage + 1} / ${doctorAuth.length}`}</Text>
            </View>
            <View style={styles.backButtonContainer}>
                <TouchableHighlight style={styles.menuButton} underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                    onPress={() => { navigation.goBack(); }}>
                    <BackArrow color={isDarkMode ? COL.WHITE : COL.BLACK} />
                </TouchableHighlight>
            </View>
        </View>
    </View>;
};


export const ProfileImageView = ({ route, navigation }: { route: any, navigation: any }) => {
    const { isDark } = route.params;
    const isDarkMode: boolean = route !== undefined && route.params != null ? isDark : FetchIsDarkMode();
    const { data } = route.params;
    const uri = data as string;

    <SafeAreaView style={stylesColorful(isDarkMode).backgroundStyle}>
        <StatusBarView isDarkMode={isDarkMode} />
    </SafeAreaView>
    return <View style={StyleSheet.flatten({ width: '100%', height: '100%', backgroundColor: isDarkMode ? Colors.darker : Colors.lighter })}>
        <View style={styles.imageFullScreen}>
            <Zoom
                minimumZoomScale={0.5}
                style={styles.fullScreen}>
                <Image style={styles.fullScreen} source={{ uri: uri, cache: 'only-if-cached' }} />
            </Zoom>
        </View>
        <View style={styles.scrollHeaderContainer}>
            <View style={styles.backButtonContainer}>
                <TouchableHighlight style={styles.menuButton} underlayColor={isDarkMode ? COL.SHADOW_BLACK : COL.SHADOW_WHITE}
                    onPress={() => { navigation.goBack(); }}>
                    <BackArrow color={isDarkMode ? COL.WHITE : COL.BLACK} />
                </TouchableHighlight>
            </View>
        </View>
    </View>;
};

const styles = StyleSheet.create({
    imageFullScreen: { marginTop: 30, alignItems: 'center', flexDirection: 'column' },
    fullScreen: { width: '100%', height: '100%' },
    scrollHeaderContainer: { width: '100%', height: 50, alignSelf: 'baseline', position: 'absolute', backgroundColor: '#00000030' },
    menuButton: { width: 48, height: 48, marginTop: 5, padding: 13, borderRadius: 24 },
    backButtonContainer: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', position: 'absolute', width: '100%' },
    headerTextCenter: { alignItems: 'center', marginTop: 20, width: '100%', height: '100%' },
    doctorNameStyle: { fontWeight: '700', fontSize: 18, color: COL.WHITE },
});


const stylesColorful = (isDark: boolean) => {
    return StyleSheet.create({
        backgroundStyle: {
            backgroundColor: isDark ? COL.BACK_DARK : COL.BACK_LIGHT,
            width: '100%',
            height: '100%',
        },
    });
};


export default CertificatesView;
