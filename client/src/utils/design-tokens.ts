export const tokens = {
  colors: {
    brand: {
      primary: '#1E40AF', // Azul Brasilit (botões primários, links)
      primaryHover: '#1E3A8A', // Hover do primário
      secondary: '#F59E0B', // Amarelo atenção (badges, alertas)
      secondaryHover: '#D97706', // Hover do secundário
      success: '#10B981', // Confirmações
      danger: '#EF4444', // Erros
      warning: '#F59E0B', // Avisos
      info: '#3B82F6' // Informações
    },
    semantic: {
      background: {
        primary: '#FFFFFF', // Fundo padrão
        secondary: '#F8FAFC', // Fundo alternativo
        offline: '#FEE2E2', // Fundo em modo offline
        highContrast: '#000000' // Tema alto contraste
      },
      text: {
        primary: '#0F172A', // Texto principal
        secondary: '#475569', // Texto secundário
        disabled: '#CBD5E1', // Texto desativado
        highContrast: '#FFFFFF' // Texto em alto contraste
      },
      border: {
        primary: '#E2E8F0', // Bordas padrão
        focus: '#3B82F6', // Bordas em foco
        error: '#EF4444' // Bordas de erro
      }
    }
  },
  spacing: {
    '2xs': '0.125rem', // 2px
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem' // 64px
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Menlo', 'monospace']
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
      base: ['1rem', { lineHeight: '1.5rem' }], // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem', // 2px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)'
  },
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    toast: 1300
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};

export type DesignTokens = typeof tokens;
