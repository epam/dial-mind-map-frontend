import type { Config } from 'tailwindcss';

import { CustomClassesSafeList } from './src/constants/custom-styles';

const commonBgColors = {
  transparent: 'transparent',
  'layer-0': 'var(--bg-layer-0, #000000)',
  'layer-1': 'var(--bg-layer-1, #090D13)',
  'layer-2': 'var(--bg-layer-2, #141A23)',
  'layer-3': 'var(--bg-layer-3, #222932)',
  'layer-4': 'var(--bg-layer-4, #333942)',
  blackout: 'var(--bg-blackout, #090D13B3)',
  error: 'var(--bg-error, #402027)',
  warning: 'var(--bg-warning, #3F3D25)',
  info: 'var(--bg-info, #1C2C47)',
  success: 'var(--bg-success, #1D3841)',
  'accent-primary': 'var(--bg-accent-primary, #5C8DEA)',
  'accent-secondary': 'var(--bg-accent-secondary, #37BABC)',
  'accent-tertiary': 'var(--bg-accent-tertiary, #A972FF)',
  'accent-primary-alpha': 'var(--bg-accent-primary-alpha, #5C8DEA2B)',
  'accent-secondary-alpha': 'var(--bg-accent-secondary-alpha, #37BABC26)',
  'accent-tertiary-alpha': 'var(--bg-accent-tertiary-alpha, #A972FF2B)',
  overlay: 'var(--bg-overlay, #090D13B3)',
};

const commonBorderColors = {
  transparent: 'transparent',
  primary: 'var(--stroke-primary, #333942)',
  secondary: 'var(--stroke-secondary, #222932)',
  tertiary: 'var(--stroke-tertiary, #090D13)',
  error: 'var(--stroke-error, #F76464)',
  warning: 'var(--stroke-warning, #F4CE46)',
  info: 'var(--stroke-info, #5C8DEA)',
  success: 'var(--stroke-success, #37BABC)',
  hover: 'var(--stroke-hover, #F3F4F6)',
  'accent-primary': 'var(--stroke-accent-primary, #5C8DEA)',
  'accent-secondary': 'var(--stroke-accent-secondary, #37BABC)',
  'accent-tertiary': 'var(--stroke-accent-tertiary, #A972FF)',
};

const config: Config = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    backgroundColor: {
      ...commonBgColors,
      'controls-accent': 'var(--controls-bg-accent, #5C8DEA)',
      'controls-permanent': 'var(--controls-text-permanent, #FCFCFC)',
      'controls-accent-hover': 'var(--controls-bg-accent-hover, #4878D2)',
      'controls-disable': 'var(--controls-bg-disable, #7F8792)',
      'model-icon': 'var(--bg-model-icon, #FFFFFF00)',
    },
    borderColor: commonBorderColors,
    stroke: commonBorderColors,
    divideColor: commonBorderColors,
    textColor: {
      transparent: 'transparent',
      primary: 'var(--text-primary, #F3F4F6)',
      secondary: 'var(--text-secondary, #7F8792)',
      error: 'var(--text-error, #F76464)',
      warning: 'var(--text-warning, #F4CE46)',
      info: 'var(--text-info, #5C8DEA)',
      success: 'var(--text-success, #37BABC)',
      'accent-primary': 'var(--text-accent-primary, #5C8DEA)',
      'accent-secondary': 'var(--text-accent-secondary, #37BABC)',
      'accent-tertiary': 'var(--text-accent-tertiary, #A972FF)',
      'controls-permanent': 'var(--controls-text-permanent, #FCFCFC)',
      'controls-disable': 'var(--controls-text-disable, #333942)',
    },
    gradientColorStops: commonBgColors,
    extend: {
      animation: {
        'spin-steps': 'spin 0.75s steps(8, end) infinite',
      },
      colors: {
        transparent: 'transparent',
      },
      screens: {
        xxs: '320px',
        xs: '480px',
        sm: '560px',
        '3xl': '1770px',
        '4xl': '2120px',
        '5xl': '2560px',
      },
      borderRadius: {
        DEFAULT: '3px',
      },
      opacity: {
        15: '15%',
      },
      boxShadow: {
        DEFAULT: '0 0 4px 0 var(--bg-blackout, #090D13B3)',
        mindmap: '0px 0px 15px 0px #090D131A',
      },
      fontFamily: {
        DEFAULT: ['var(--theme-font, var(--font-montserrat))'],
        theme: ['var(--theme-font, var(--font-montserrat))'],
        codeblock: ['var(--codeblock-font, var(--theme-font))'],
      },
      fontSize: {
        xxs: '10px',
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--text-primary, #F3F4F6)',
            a: {
              color: 'var(--text-accent-primary, #5C8DEA)',
            },
            pre: {
              border: 'none',
              borderRadius: '0',
              backgroundColor: 'transparent',
              whiteSpace: 'pre-wrap',
            },
          },
        },
      },
    },
  },
  // Ensure these classes are always included
  safelist: [...CustomClassesSafeList, 'border-solid', 'border-dashed', 'border-dotted'],
  variants: {
    extend: {
      visibility: ['group-hover'],
    },
  },
  plugins: [require('@tailwindcss/typography'), require('tailwind-scrollbar-hide')],
};
export default config;
