import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { CheckBox, Default } from './defaultPropsType';
import stylePreset from './style.preset';
import {
  isValidData,
  isValidShowPicker,
  isValidAnimationType,
  isValidPreset,
  isValidCheckBoxType,
  isValidCheckBoxIcons,
  isValidEnableSeach,
} from './Validations';
import { FetchIsDarkMode } from '../../global/dims';
import * as COL from '../../global/styles';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { TouchableHighlight } from 'react-native-gesture-handler';
import style from 'react-native-multiple-switch/style';

const SelectedOptionPicker = (props: {
  data: any[];
  multipleData?: () => any[],
  setMultipleData?: (a: any) => void,
  showCheck?: boolean,
  showPicker: boolean;
  pickerHeight?: number;
  animationType?: any;
  preset?: any;
  pickerTitle: any;
  primaryColor: any;
  checkBoxType: any;
  checkBoxIcons?: any;
  itemTitleKey: any;
  itemTitleValue: any;
  itemTitleStyle?: any;
  itemUniqueKey: any;
  itemUniqueValue: any;
  enableSearch: any;
  searchPlaceholder: any;
  emptyTitle: any;
  onDonePress: any;
  onCancelPress: any;
  onItemChange: any;
}) => {
  const {
    data, // [] *
    multipleData = () => [],
    setMultipleData = (m) => [],
    showCheck = true,// boolean
    showPicker, // boolean *
    pickerHeight, // height
    animationType, // 'slide' | 'fade' | 'none'
    preset, //'single' | 'multiple'
    pickerTitle, // 'Select Option'

    primaryColor, // 'color'
    checkBoxType, // CheckBox.Type
    checkBoxIcons, // {check:image,uncheck:image}

    itemTitleKey, // 'String'*
    itemTitleValue, // ''*
    itemTitleStyle, // {Style}
    itemUniqueKey, // 'String'
    itemUniqueValue, // 'String'

    enableSearch, // boloean
    searchPlaceholder, //'String'
    emptyTitle, // 'String'
    onDonePress, // (item){}
    onCancelPress, // (){}
    onItemChange, // (item){}
  } = props;

  const picker_data = data;
  const picker_preset = preset || Default.Preset.SINGLE;
  const picker_height = pickerHeight || '70%';
  const picker_title = pickerTitle || Default.Value.PICKER_TITLE;
  const animation_type = animationType || Default.Animation.SLIDE;
  const check_box_type = checkBoxType || CheckBox.Type.SQUARE;
  const check_icon = checkBoxIcons?.check || Default.Icon.CHECK;
  const uncheck_icon = checkBoxIcons?.uncheck || Default.Icon.UNCHEK;
  const empty_title = emptyTitle || Default.Value.EMPTY_TITLE;
  const search_placeholder = searchPlaceholder || Default.Search.PLACEHOLDER;
  const enable_serach = enableSearch || false;

  const isMultiple = picker_preset === 'multiple';
  const [searchText, setSearchText] = useState('');
  const [filterData, setFilterData] = useState<any>([]);
  const listRef: React.MutableRefObject<any> = React.useRef();

  isValidData(picker_data);
  isValidShowPicker(showPicker);
  isValidAnimationType(animation_type);
  isValidPreset(picker_preset);
  isValidCheckBoxType(check_box_type);
  isValidCheckBoxIcons(check_box_type, checkBoxIcons);
  isValidEnableSeach(enable_serach);
  useEffect(() => {
    if (!isMultiple && picker_data?.length) {
      const index = picker_data.findIndex(
        item => item[itemTitleKey] === itemTitleValue,
      );
      if (showPicker && index > -1) {
        /*listRef.current?.scrollToIndex({
          index: index,
          animated: true,
        });*/
      }
    }
  }, [isMultiple, itemTitleKey, itemTitleValue, picker_data, showPicker]);

  const onSearchChangeText = (text: React.SetStateAction<string>) => {
    setSearchText(text);
    const filter = picker_data?.filter(item => {
      const itemData = item[itemTitleKey]
        ? item[itemTitleKey].toUpperCase()
        : ''.toUpperCase();
      const textData = text.toString().toUpperCase().trim();
      return itemData.indexOf(textData) > -1;
    });
    setFilterData(filter);
  };

  const isDarkMode = FetchIsDarkMode();

  return (
    <Modal
      statusBarTranslucent={true}
      animationType={animation_type}
      transparent={true}
      visible={showPicker}
      onRequestClose={props.onCancelPress}
      style={StyleSheet.flatten({ flex: 1 })}>
      <SafeAreaView style={stylePreset(isDarkMode).mainView}>
        <View style={stylePreset(isDarkMode).outerView}>
          <View style={stylePreset(isDarkMode).outerContainer}>
            <TouchableOpacity
              style={stylePreset(isDarkMode).outerTouchContainer}
              onPress={onCancelPress} />
          </View>
          <View
            style={[
              stylePreset(isDarkMode).listOuterView,
              {
                backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
                height: picker_height,
              },
            ]}>
            <View style={stylePreset(isDarkMode).buttonOuter}>
              <TouchableOpacity
                activeOpacity={0.5}
                onPress={() => {
                  isMultiple ? setMultipleData([]) : '';
                  setSearchText('');
                  onCancelPress();
                }}
                style={[
                  stylePreset(isDarkMode).buttonSecondary,
                  primaryColor && { borderColor: primaryColor },
                ]}>
                <Text
                  style={[
                    stylePreset(isDarkMode).buttonTitleSecondary,
                    primaryColor && { color: primaryColor },
                  ]}>
                  {'Cancel'}
                </Text>
              </TouchableOpacity>

              <Text
                style={[
                  stylePreset(isDarkMode).headingText,
                  primaryColor && { color: primaryColor },
                ]}>
                {picker_title}
              </Text>
              <TouchableOpacity
                activeOpacity={0.5}
                onPress={() => {
                  setSearchText('');

                  isMultiple ? onDonePress(multipleData()) : onDonePress();
                }}
                style={[
                  stylePreset(isDarkMode).buttonPrimary,
                  primaryColor && { backgroundColor: primaryColor },
                ]}>
                <Text style={stylePreset(isDarkMode).buttonTitlePrimary}>
                  {'Done'}
                </Text>
              </TouchableOpacity>
            </View>

            {enable_serach && (
              <View style={stylePreset(isDarkMode).searchOuter}>
                <TextInput
                  placeholder={search_placeholder}
                  style={stylePreset(isDarkMode).input}
                  value={searchText}
                  maxLength={50}
                  onChangeText={text => onSearchChangeText(text)}
                />
                {searchText !== '' ? (
                  <TouchableOpacity
                    activeOpacity={0.5}
                    style={stylePreset(isDarkMode).searchCloseOuter}
                    onPress={() => {
                      setSearchText('');
                    }}>
                    <Image
                      source={require('./assets/cross.png')}
                      style={stylePreset(isDarkMode).close}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            <FlatList
              ref={listRef}
              data={searchText === '' ? picker_data : filterData}
              bounces={false}
              style={StyleSheet.flatten({ marginHorizontal: 10 })}
              ListEmptyComponent={<EmptyList empty_title={empty_title} isDarkMode={isDarkMode} />}
              renderItem={({ item, index }) => RenderListItem(item, index, isMultiple, isDarkMode, multipleData, itemTitleStyle, itemUniqueKey, itemUniqueValue, onItemChange, primaryColor, check_box_type, itemTitleKey, check_icon, uncheck_icon, showCheck, setMultipleData)}
              keyExtractor={(item, index) =>
                index.toString() + 'list Items' + item.id
              }
            /*onScrollToIndexFailed={info => {
              if (!isMultiple) {
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  listRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                  });
                });
              }
            }}*/
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const RenderListItem = (
  item: {
    [x: string]:
    | string
    | number
    | boolean
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | Iterable<React.ReactNode>
    | React.ReactPortal
    | null
    | undefined;
  },
  index: number,
  isMultiple: boolean,
  isDarkMode: boolean,
  multipleData: () => any[],
  itemTitleStyle: any,
  itemUniqueKey: any,
  itemUniqueValue: any,
  onItemChange: any,
  primaryColor: any,
  check_box_type: any,
  itemTitleKey: any,
  check_icon: any,
  uncheck_icon: any,
  showCheck: boolean,
  setMultipleData: (multipleData: any) => void,
) => {
  let selected = false;
  if (isMultiple) {
    const a = multipleData().find(it => it[itemUniqueKey] === item[itemUniqueKey]) !== undefined;
    selected = a;
  } else {
    selected = item[itemUniqueKey] === itemUniqueValue;
  }

  return (
    <View style={stylePreset(isDarkMode).itemOuter}>
      <TouchableOpacity
        activeOpacity={0.5}
        onPress={() => {
          isMultiple
            ? multipleSelection(item, index, selected, multipleData, setMultipleData)
            : onItemChange(item);
        }}
        style={stylePreset(isDarkMode).itemInner}>
        {showCheck ? <TouchableOpacity
          activeOpacity={0.5}
          style={[
            stylePreset(isDarkMode).checkBoxSquareUncheck,
            primaryColor
              ? {
                borderColor: selected
                  ? primaryColor
                  : isDarkMode
                    ? COL.WHITE_200
                    : COL.BLACK_46,
              }
              : {
                borderColor: selected
                  ? COL.MAIN
                  : isDarkMode
                    ? COL.WHITE_200
                    : COL.BLACK_46,
              },
          ]}
          onPress={() => {
            isMultiple
              ? multipleSelection(item, index, selected, multipleData, setMultipleData)
              : onItemChange(item);
          }}>
          {check_box_type === CheckBox.Type.ICON && (
            <Image
              style={[
                stylePreset(isDarkMode).checkBoxSquareCheck,
                primaryColor && { tintColor: primaryColor },
                check_icon?.uri != null && StyleSheet.flatten({ tintColor: null }),
              ]}
              source={selected ? check_icon : uncheck_icon}
            />
          )}
          {check_box_type !== CheckBox.Type.ICON && selected && (
            <View
              style={[
                stylePreset(isDarkMode).checkBoxSquareCheck,
                primaryColor && { backgroundColor: primaryColor },
              ]}
            />
          )}
        </TouchableOpacity> : null}
        <Text
          style={[
            selected
              ? stylePreset(isDarkMode).itemTitleCheck
              : stylePreset(isDarkMode).itemTitleUncheck,
            { ...itemTitleStyle },
            primaryColor && { color: primaryColor },
            !selected && { color: isDarkMode ? COL.WHITE_200 : COL.BLACK_46 },
          ]}>
          {item[itemTitleKey]}
        </Text>
      </TouchableOpacity>
    </View>
  );
};


const multipleSelection = (item: any, index: any, isSelected: boolean, multipleData: () => any, setMultipleData: (multipleData: any) => void) => {
  if (multipleData.length > 0 && isSelected) {
    let multiple = [...multipleData()];
    const deleteIndex = multipleData().findIndex((e: any) => e === item);
    multiple.splice(deleteIndex, 1);
    setMultipleData(multiple);
  } else {
    let multiple: React.SetStateAction<never>[] = [...multipleData()];
    multiple.push(item);
    setMultipleData(multiple);
  }
};

const EmptyList = ({ empty_title, isDarkMode }: { empty_title: string, isDarkMode: boolean },) => {
  return (
    <View style={stylePreset(isDarkMode).emptyOuter}>
      <Text style={stylePreset(isDarkMode).emptyTitle}>{empty_title}</Text>
    </View>
  );
};


export default SelectedOptionPicker;
