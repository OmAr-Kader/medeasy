import * as React from 'react';
import {View, StyleProp, ViewStyle, StyleSheet} from 'react-native';
import IBouncyCheckboxProps from 'react-native-bouncy-checkbox';
import TagSelectItem from './TagSelectItem';
import useStateWithCallback, {DispatchWithCallback, useStateWithCallbackMulti} from './useStateWithCallback';

type CustomStyleProp = StyleProp<ViewStyle> | Array<StyleProp<ViewStyle>>;

export interface ICheckboxButton {
  id: number | string;
  name: string;
}

export interface ICheckboxButtonActive {
  id: number;
  name: string;
  isActive: boolean,
}


interface IBouncyCheckboxGroupCommon {
  style?: CustomStyleProp;
  initial?: number;
  selectState?: [any, DispatchWithCallback<React.SetStateAction<any>>];
  checkboxProps?: IBouncyCheckboxProps;
  itemStyle: {};
  itemStyleSelected: {};
  itemLabelStyle: {};
  itemLabelStyleSelected: {};
}

interface IBouncyCheckboxGroupProps extends IBouncyCheckboxGroupCommon {
  data: ICheckboxButton[];
  onChange: (selectedItem: ICheckboxButton[]) => void;
}

interface IBouncyCheckboxGroupPropsOne extends IBouncyCheckboxGroupCommon {
  data: ICheckboxButton[];
  onChange?: (selectedItem: ICheckboxButton) => void;
}

interface IBouncyCheckboxGroupPropsActive extends IBouncyCheckboxGroupCommon {
  data: ICheckboxButtonActive[];
  onChange: (selectedItem: ICheckboxButtonActive) => void;
}

export const TagSelectOne: React.FC<IBouncyCheckboxGroupPropsOne> = ({
  style,
  initial,
  data,
  onChange,
  selectState,
  itemStyle,
  itemStyleSelected,
  itemLabelStyle,
  itemLabelStyleSelected,
}) => {
  const pushInitial =
    initial === undefined || initial == null ? initial : data[initial];

  const newCallBack = useStateWithCallback<ICheckboxButton | undefined>([undefined]);
  const [selectedItem, setSelectedItem] = selectState !== undefined && selectState !== null ? selectState : newCallBack;

  const handleItemPress = (item: ICheckboxButton) => {
    setSelectedItem(item, newItem => onChange && onChange(newItem));
  };

  return (
    <View style={[styles.container, style]}>
      {data &&
        data.map((item: ICheckboxButton, index: number) => {
          const isActive =
            item.id ===
            (selectedItem?.id === undefined || selectedItem?.id == null
              ? pushInitial?.id
              : selectedItem?.id);
          return (
            <TagSelectItem
              key={index}
              label={item.name}
              onPress={() => handleItemPress(item)}
              selected={isActive}
              itemStyle={itemStyle}
              itemStyleSelected={itemStyleSelected}
              itemLabelStyle={itemLabelStyle}
              itemLabelStyleSelected={itemLabelStyleSelected}
            />
          );
        })}
    </View>
  );
};

const TagSelectMulti: React.FC<IBouncyCheckboxGroupProps> = ({
  style,
  initial,
  data,
  onChange,
  itemStyle,
  itemStyleSelected,
  itemLabelStyle,
  itemLabelStyleSelected,
}) => {
  const pushInitial =
    initial === undefined || initial == null ? [] : [data[initial]];
  const [state, setState] = useStateWithCallbackMulti(pushInitial, onChange);

  const handleItemPress = (item: ICheckboxButton) => {
    setState(item);
  };

  return (
    <View style={[styles.container, style]}>
      {data &&
        data.map((item: ICheckboxButton, index: number) => {
          const isActive = state.findIndex(it => it.id === item.id) !== -1;
          return (
            <TagSelectItem
              key={index}
              label={item.name}
              onPress={() => handleItemPress(item)}
              selected={isActive}
              itemStyle={itemStyle}
              itemStyleSelected={itemStyleSelected}
              itemLabelStyle={itemLabelStyle}
              itemLabelStyleSelected={itemLabelStyleSelected}
            />
          );
        })}
    </View>
  );
};

export const TagSelectMultiActiveController: React.FC<IBouncyCheckboxGroupPropsActive> = ({
  style,
  initial,
  data,
  onChange,
  itemStyle,
  itemStyleSelected,
  itemLabelStyle,
  itemLabelStyleSelected,
}) => {

  const handleItemPress = (item: ICheckboxButtonActive) => {
    onChange(item);
  };

  return (
    <View style={[styles.container, style]}>
      {data &&
        data.map((item: ICheckboxButtonActive, index: number) => {
          return (
            <TagSelectItem
              key={index}
              label={item.name}
              onPress={() => handleItemPress(item)}
              selected={item.isActive}
              itemStyle={itemStyle}
              itemStyleSelected={itemStyleSelected}
              itemLabelStyle={itemLabelStyle}
              itemLabelStyleSelected={itemLabelStyleSelected}
            />
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  /**/
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
});

export default TagSelectMulti;
