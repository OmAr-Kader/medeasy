function showError(error: string | undefined) {
  throw new Error(error);
}
export function isValidData(data: any) {
  if (!Array.isArray(data)) {
    showError('The invalid `data` value should be an array of objects');
  }
}
export function isValidShowPicker(value: boolean) {
  if (value !== true && value !== false) {
    showError(
      'The valid value for `showPicker` in `SelectedOptionPicker` component should be a boolean type',
    );
  }
}
export function isValidAnimationType(value: string) {
  if (value !== 'slide' && value !== 'fade' && value !== 'none') {
    showError(
      'The valid value for `animationType` in `SelectedOptionPicker` component should be one of: ( "slide", "fade", "none")',
    );
  }
}
export function isValidPreset(value: string) {
  if (value !== 'single' && value !== 'multiple') {
    showError(
      'The valid value for `preset` in `SelectedOptionPicker` component should be one of: ( "single", "multiple",)',
    );
  }
}
export function isValidCheckBoxType(value: any) {
  if (value !== 'circle' && value !== 'square' && value !== 'icon') {
    showError(
      'The valid value for `checkBoxType` in `SelectedOptionPicker` component should be one of: ( "circle", "square", "icon")',
    );
  }
}
export function isValidCheckBoxIcons(
  checkBoxType: string,
  value: {check: any; uncheck: any},
) {
  if (checkBoxType === 'icon' && value && (!value.check || !value.uncheck)) {
    showError(
      'The invalid object for `checkBoxIcons` in `SelectedOptionPicker` component',
    );
  }
}

export function isValidEnableSeach(value: boolean) {
  if (value !== true && value !== false) {
    showError(
      'The valid value for `enableSearch` in `SelectedOptionPicker` component should be a boolean type',
    );
  }
}
