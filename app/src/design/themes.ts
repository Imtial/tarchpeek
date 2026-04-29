import type { StatusBarStyle } from 'react-native';

type ThemeId = 'deep-emerald' | 'mint-breeze';

type AppTheme = {
  id: ThemeId;
  label: string;
  statusBarStyle: StatusBarStyle;
  colors: {
    pageBackground: string;
    surfaceBackground: string;
    surfacePressed: string;
    border: string;
    accent: string;
    textPrimary: string;
    textSecondary: string;
    buttonPrimaryBackground: string;
    buttonSecondaryBackground: string;
    buttonDisabledBackground: string;
    buttonLabel: string;
    inputBackground: string;
    inputBorder: string;
    inputPlaceholder: string;
    focusRing: string;
    videoFrameBackground: string;
  };
};

const themes: Record<ThemeId, AppTheme> = {
  'deep-emerald': {
    id: 'deep-emerald',
    label: 'Deep Emerald',
    statusBarStyle: 'light-content',
    colors: {
      pageBackground: '#2C3333',
      surfaceBackground: '#2E4F4F',
      surfacePressed: '#3b6363',
      border: '#3b6363',
      accent: '#4DB6AC',
      textPrimary: '#CBE4DE',
      textSecondary: '#4DB6AC',
      buttonPrimaryBackground: '#CBE4DE',
      buttonSecondaryBackground: '#4DB6AC',
      buttonDisabledBackground: '#3b6363',
      buttonLabel: '#2C3333',
      inputBackground: '#2E4F4F',
      inputBorder: '#3b6363',
      inputPlaceholder: '#4DB6AC',
      focusRing: '#4DB6AC',
      videoFrameBackground: '#2E4F4F',
    },
  },
  'mint-breeze': {
    id: 'mint-breeze',
    label: 'Mint Breeze',
    statusBarStyle: 'dark-content',
    colors: {
      pageBackground: '#CBE4DE',
      surfaceBackground: '#B4D5CE',
      surfacePressed: '#9CC5BD',
      border: '#9CC5BD',
      accent: '#2E4F4F',
      textPrimary: '#2C3333',
      textSecondary: '#2E4F4F',
      buttonPrimaryBackground: '#2C3333',
      buttonSecondaryBackground: '#2E4F4F',
      buttonDisabledBackground: '#9CC5BD',
      buttonLabel: '#CBE4DE',
      inputBackground: '#B4D5CE',
      inputBorder: '#9CC5BD',
      inputPlaceholder: '#2E4F4F',
      focusRing: '#2E4F4F',
      videoFrameBackground: '#B4D5CE',
    },
  },
};

const defaultThemeId: ThemeId = 'deep-emerald';

export { defaultThemeId, themes };
export type { AppTheme, ThemeId };
