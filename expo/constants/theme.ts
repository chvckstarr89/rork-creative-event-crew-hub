export const theme = {
  colors: {
    background: '#FAFAFA',
    backgroundSecondary: '#F5F5F7',
    surface: '#FFFFFF',
    surfaceLight: '#F8F9FA',
    primary: '#007AFF',
    primaryDark: '#0056CC',
    accent: '#FF3B82',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    text: '#1D1D1F',
    textSecondary: '#6D6D80',
    textTertiary: '#8E8E93',
    border: '#E5E5EA',
    glass: 'rgba(255, 255, 255, 0.8)',
    glassLight: 'rgba(255, 255, 255, 0.95)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
    full: 999,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
    },
    tiny: {
      fontSize: 12,
      fontWeight: '400' as const,
    },
  },
};