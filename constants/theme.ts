export const colors = {
  background: {
    start: '#FFF5EB',
    middle: '#FFE8D6',
    end: '#FFDDC1',
  },
  surface: '#FFFBF7',
  border: '#F0E6DA',
  text: {
    primary: '#3D2B1F',
    secondary: '#8B7355',
    muted: '#B8A590',
  },
  accent: {
    red: '#E8756A',
    redHover: '#D4605A',
    gold: '#D4A056',
    goldHover: '#C4903F',
  },
  whatsapp: '#25D366',
  error: '#D4605A',
  white: '#FFFFFF',
} as const;

export const fonts = {
  heading: {
    bold: 'PlayfairDisplay_700Bold',
    extraBold: 'PlayfairDisplay_800ExtraBold',
    black: 'PlayfairDisplay_900Black',
  },
  body: {
    medium: 'Quicksand_500Medium',
    semiBold: 'Quicksand_600SemiBold',
    bold: 'Quicksand_700Bold',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
} as const;

export const minTapTarget = 48;
