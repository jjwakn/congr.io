import { IS_SETUP_KEY } from './constants';

export const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`${key}`, error);
    return defaultValue;
  }
};

export const setLocalStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`${key}`, error);
  }
};

export const getIsSetupFromStorage = (): boolean => {
  return getLocalStorageItem(IS_SETUP_KEY, false);
};

export const setIsSetupToStorage = (value: boolean): void => {
  setLocalStorageItem(IS_SETUP_KEY, value);
};
