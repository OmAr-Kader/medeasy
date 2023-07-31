import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';


function TagSelectItem({ label, selected, onPress, itemStyle, itemStyleSelected, itemLabelStyle, itemLabelStyleSelected }: { label: string, selected: boolean, onPress: () => void, itemStyle: {}; itemStyleSelected: {}; itemLabelStyle: {}; itemLabelStyleSelected: {} }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.5}
      >
        <View
          style={[
            styles.inner,
            styles.defaultInner,
            itemStyle,
            selected && styles.defaultInnerSelected,
            selected && itemStyleSelected,
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.defaultLabelText,
              itemLabelStyle,
              selected && itemLabelStyleSelected,
              selected && styles.defaultLabelTextSelected,
            ]}
          >
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    marginRight: 10,
  },
  inner: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  defaultInner: {
    backgroundColor: '#f8f9fa',
    borderColor: '#f8f9fa',
  },
  defaultInnerSelected: {
    backgroundColor: '#6c757d',
    borderColor: '#6c757d',
  },
  defaultLabelText: {
    color: '#333333',
  },
  defaultLabelTextSelected: {
    color: '#FFF',
  },
  inverseInner: {
    backgroundColor: '#FFFFFF',
    borderColor: '#343a40',
  },
  inverseInnerSelected: {
    backgroundColor: '#343a40',
    borderColor: '#343a40',
  },
  inverseLabelText: {
    color: '#343a40',
  },
  inverseLabelTextSelected: {
    color: '#FFF',
  },
  successInner: {
    backgroundColor: '#FFFFFF',
    borderColor: '#28a745',
  },
  successInnerSelected: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  successLabelText: {
    color: '#28a745',
  },
  successLabelTextSelected: {
    color: '#FFF',
  },
  infoInner: {
    backgroundColor: '#FFFFFF',
    borderColor: '#007BFF',
  },
  infoInnerSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007BFE',
  },
  infoLabelText: {
    color: '#004085',
  },
  infoLabelTextSelected: {
    color: '#FFF',
  },
  warningInner: {
    backgroundColor: '#FFFFFF',
    borderColor: '#ffc107',
  },
  warningInnerSelected: {
    backgroundColor: '#ffc107',
    borderColor: '#ffc107',
  },
  warningLabelText: {
    color: '#333',
  },
  warningLabelTextSelected: {
    color: '#333',
  },
  dangerInner: {
    backgroundColor: '#FFFFFF',
    borderColor: '#dc3545',
  },
  dangerInnerSelected: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
  },
  dangerLabelText: {
    color: '#dc3545',
  },
  dangerLabelTextSelected: {
    color: '#FFF',
  },
});

export default TagSelectItem;
