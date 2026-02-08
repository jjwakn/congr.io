import { Congregation } from '../types/congregation.types';
import { CONGREGATION_KEY, IS_SETUP_KEY } from './constants';

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

export const getCongregationFromStorage = (): Congregation | null => {
  return getLocalStorageItem<Congregation | null>(CONGREGATION_KEY, null);
};

export const setCongregationToStorage = (value: Congregation): void => {
  setLocalStorageItem(CONGREGATION_KEY, value);
};

export const clearCongregationFromStorage = (): void => {
  try {
    localStorage.removeItem(CONGREGATION_KEY);
  } catch (error) {
    console.warn(`${CONGREGATION_KEY}`, error);
  }
};
