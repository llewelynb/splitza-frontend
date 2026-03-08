export const Colors = {
  primary: '#6C63FF',
  primaryDark: '#4B44CC',
  accent: '#FF6584',
  background: '#F8F9FE',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  zar: '#2D6A4F', // South African green
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const Typography = {
  heading1: { fontSize: 28, fontWeight: '700' as const, color: Colors.text },
  heading2: { fontSize: 22, fontWeight: '700' as const, color: Colors.text },
  heading3: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
  body: { fontSize: 16, fontWeight: '400' as const, color: Colors.text },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, color: Colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textSecondary },
  mono: { fontSize: 16, fontWeight: '600' as const, fontFamily: 'monospace' as const },
};
