/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef, useState, useEffect, useCallback, SetStateAction } from 'react';
import { ICheckboxButton } from './TagSelectMulti';

export type Callback<T> = (value?: any) => void;
export type DispatchWithCallback<T> = (
  value: any,
  callback?: Callback<any>,
) => void;

export function useStateWithCallback<T>(
  initialState: any | (() => any),
): [any, DispatchWithCallback<SetStateAction<any>>] {
  const [state, _setState] = useState(initialState);

  const callbackRef = useRef<Callback<any>>();
  const isFirstCallbackCall = useRef<boolean>(true);

  const setState = useCallback(
    (setStateAction: SetStateAction<any>, callback?: Callback<any>): void => {
      callbackRef.current = callback;
      _setState(setStateAction);
    },
    [],
  );

  useEffect(() => {
    if (isFirstCallbackCall.current) {
      isFirstCallbackCall.current = false;
      return;
    }
    callbackRef.current?.(state);
  }, [state]);

  return [state, setState];
}

export function useStateWithCallbackMulti(
  pushInitial: ICheckboxButton[],
  onChange: (selectedItem: ICheckboxButton[]) => void,
): [ICheckboxButton[], DispatchWithCallback<SetStateAction<ICheckboxButton>>] {
  const [state, _setState] = useState<ICheckboxButton[]>(pushInitial);
  const setState = useCallback(
    (setStateAction: ICheckboxButton): void => {
      if (state?.findIndex(it => it.id === setStateAction.id) === -1) {
        _setState(oldArray => [...oldArray, setStateAction]);
      } else {
        _setState(products =>
          products.filter(it => it.id !== setStateAction.id),
        );
      }
    },
    [state],
  );
  useEffect(() => {
    onChange(state);
  }, [onChange, setState, state]);

  return [state, setState];
}

export default useStateWithCallback;
