import {StyleSheet} from 'react-native';
import {scaleSize, fontSize} from './size.preset';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import * as COL from '../../global/styles';

const primary_color = COL.MAIN;
const title_color = '#2C2C2C';
const white_color = '#FFFFFF';

/*const stylePreset = (isDarkMode: boolean) => {
  return {
    itemOuter: {
      borderBottomColor: isDarkMode ? COL.BLACK_46 : COL.WHITE_226,
      borderBottomWidth: 1,
      paddingVertical: scaleSize(3),
    },
    itemInner: {
      flexDirection: 'row',
      padding: scaleSize(10),
      alignItems: 'center',
    },
    emptyOuter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: scaleSize(150),
    },
    mainView: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
    },

    outerView: {
      flex: 1,
      alignItems: 'flex-end',
      flexDirection: 'column',
    },
    listOuterView: {
      height: '70%',
      width: '100%',
      backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    },
    buttonOuter: {
      paddingVertical: scaleSize(10),
      borderBottomColor: isDarkMode ? COL.WHITE_165_A_30 : COL.BLACK_99_A_30,
      borderBottomWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: scaleSize(10),
    },
    button: {
      primary: {
        ...buttons,
        backgroundColor: primary_color,
        borderWidth: 0,
      },
      secondary: {
        ...buttons,
        borderColor: primary_color,
      },
    },
    buttonTitle: {
      primary: {
        ...buttonTitle,
        color: white_color,
      },
      secondary: {
        ...buttonTitle,
        color: primary_color,
      },
    },
    emptyTitle: {
      fontSize: fontSize(14),
      color: isDarkMode ? COL.WHITE_200 : COL.BLACK_46,
      fontWeight: '500',
    },
    checkBox: {
      square: {
        uncheck: {
          ...checkbox,
          borderRadius: 0,
        },
        check: {
          ...uncheck,
        },
      },
      circle: {
        uncheck: {
          ...checkbox,
          borderRadius: scaleSize(10),
        },
        check: {
          ...uncheck,
          borderRadius: scaleSize(5),
        },
      },
      icon: {
        uncheck: {
          ...checkbox,
          borderWidth: 0,
          height: scaleSize(20),
          width: scaleSize(20),
        },
        check: {
          height: '100%',
          width: '100%',
          tintColor: primary_color,
        },
      },
    },
    itemTitle: {
      check: {
        ...title,
        color: primary_color,
        fontWeight: '500',
      },
      uncheck: {
        ...title,
        color: isDarkMode ? COL.WHITE_200 : COL.BLACK_46,
        fontWeight: '300',
      },
    },

    headingText: {
      flex: 1,
      fontSize: fontSize(15),
      fontWeight: 'bold',
      color: primary_color,
      textAlign: 'center',
    },

    searchOuter: {
      marginHorizontal: scaleSize(10),
      marginBottom: scaleSize(5),
      borderWidth: 1,
      height: scaleSize(45),
      alignItems: 'center',
      paddingHorizontal: scaleSize(5),
      borderRadius: scaleSize(6),
      borderColor: isDarkMode ? COL.WHITE_165_A_30 : COL.BLACK_99_A_30,
      flexDirection: 'row',
    },
    input: {
      paddingHorizontal: scaleSize(12),
      fontWeight: '300',
      fontSize: fontSize(14),
      color: isDarkMode ? COL.WHITE : COL.BLACK,
      flex: 1,
    },
    searchCloseOuter: {
      height: scaleSize(35),
      width: scaleSize(25),
      justifyContent: 'center',
      alignItems: 'center',
    },
    close: {
      height: scaleSize(12),
      width: scaleSize(12),
      tintColor: isDarkMode ? COL.WHITE_200 : COL.BLACK_46,
    },
  };
};
*/
const stylePreset = (isDarkMode: boolean) => {
  return StyleSheet.create({
    itemOuter: {
      borderBottomColor: isDarkMode ? COL.BLACK_46 : COL.WHITE_226,
      borderBottomWidth: 1,
      paddingVertical: scaleSize(3),
    },
    itemInner: {
      flexDirection: 'row',
      padding: scaleSize(10),
      alignItems: 'center',
    },
    emptyOuter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: scaleSize(150),
    },
    mainView: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    outerView: {
      flex: 1,
      alignItems: 'flex-end',
      flexDirection: 'column',
    },
    outerContainer: { height: '30%', width: '100%' },
    outerTouchContainer: { height: '100%', width: '100%' },
    listOuterView: {
      height: '70%',
      width: '100%',
      backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    },
    buttonOuter: {
      paddingVertical: scaleSize(10),
      borderBottomColor: isDarkMode ? COL.WHITE_165_A_30 : COL.BLACK_99_A_30,
      borderBottomWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: scaleSize(10),
    },
    buttonPrimary: {
      height: scaleSize(35),
      width: scaleSize(80),
      borderRadius: scaleSize(6),
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 10,
      backgroundColor: primary_color,
      borderWidth: 0,
    },
    buttonSecondary: {
      height: scaleSize(35),
      width: scaleSize(80),
      borderRadius: scaleSize(6),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      marginHorizontal: 10,
      borderColor: primary_color,
    },
    buttonTitlePrimary: {
      fontWeight: '500',
      fontSize: fontSize(14),
      color: white_color,
    },
    buttonTitleSecondary: {
      fontWeight: '500',
      fontSize: fontSize(14),
      color: primary_color,
    },
    emptyTitle: {
      fontSize: fontSize(14),
      color: isDarkMode ? COL.WHITE_200 : COL.BLACK_46,
      fontWeight: '500',
    },
    checkBoxSquareCheck: {
      width: scaleSize(10),
      height: scaleSize(10),
      backgroundColor: primary_color,
      borderRadius: scaleSize(5),
    },
    checkBoxSquareUncheck: {
      alignItems: 'center',
      justifyContent: 'center',
      height: scaleSize(20),
      width: scaleSize(20),
      borderWidth: 1,
      borderColor: title_color,
      marginRight: scaleSize(12),
      borderRadius: scaleSize(10),
    },
    /*checkBox: {
      circle: {
        uncheck: {
          ...checkbox,
          borderRadius: scaleSize(10),
        },
        check: {
          ...uncheck,
          borderRadius: scaleSize(5),
        },
      },
      icon: {
        uncheck: {
          ...checkbox,
          borderWidth: 0,
          height: scaleSize(20),
          width: scaleSize(20),
        },
        check: {
          height: '100%',
          width: '100%',
          tintColor: primary_color,
        },
      },
    },*/
    itemTitleCheck: {
      fontSize: fontSize(14),
      marginRight: 15,
      color: primary_color,
      fontWeight: '500',
    },
    itemTitleUncheck: {
      fontSize: fontSize(14),
      marginRight: 15,
      color: isDarkMode ? COL.WHITE_200 : COL.BLACK_46,
      fontWeight: '300',
    },
    headingText: {
      flex: 1,
      fontSize: fontSize(15),
      fontWeight: 'bold',
      color: primary_color,
      textAlign: 'center',
    },

    searchOuter: {
      marginHorizontal: scaleSize(10),
      marginBottom: scaleSize(5),
      borderWidth: 1,
      height: scaleSize(45),
      alignItems: 'center',
      paddingHorizontal: scaleSize(5),
      borderRadius: scaleSize(6),
      borderColor: isDarkMode ? COL.WHITE_165_A_30 : COL.BLACK_99_A_30,
      flexDirection: 'row',
    },
    input: {
      paddingHorizontal: scaleSize(12),
      fontWeight: '300',
      fontSize: fontSize(14),
      color: isDarkMode ? COL.WHITE : COL.BLACK,
      flex: 1,
    },
    searchCloseOuter: {
      height: scaleSize(35),
      width: scaleSize(25),
      justifyContent: 'center',
      alignItems: 'center',
    },
    close: {
      height: scaleSize(12),
      width: scaleSize(12),
      tintColor: isDarkMode ? COL.WHITE_200 : COL.BLACK_46,
    },
  });
};

export default stylePreset;
