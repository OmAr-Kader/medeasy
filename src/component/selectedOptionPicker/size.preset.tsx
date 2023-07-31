import {Dimensions, PixelRatio} from 'react-native';

const {width} = Dimensions.get('window');
const scale = width / 375;

export function fontSize(size: number) {
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}
export function scaleSize(size: number) {
  return (width / 375) * size;
}
