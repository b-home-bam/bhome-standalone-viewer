const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');
const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [
//     join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
//     ...createGlobPatternsForDependencies(__dirname),
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// };
module.exports = {
  prefix: 'tw-',
  darkMode: 'class',
  content: [
        join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
        ...createGlobPatternsForDependencies(__dirname),
      ],
  theme: {
    screens: {
      sm: '576px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1374px',
    },
    letterSpacing: {
      tightest: '-.075em',
    },
    borderWidth: {
      DEFAULT: '1px',
      0: '0',
      2: '2px',
      3: '3px',
    },
    outlineWidth: {
      DEFAULT: '1px',
      0: '0',
      2: '2px',
      3: '3px',
    },
    boxShadow: {
      DEFAULT: '2px 2px 0 #cccccc',
      md: '0 2px 4px 0 rgba(0,0,0,0.5)',
    },
    borderRadius: {
      none: '0',
      sm: '3px',
      DEFAULT: '3px',
      md: '4px',
      lg: '5px',
      xl: '12px',
      full: '9999px',
    },
    fontWeight: {
      normal: '500',
      bold: '700',
    },
    lineHeight: {
      none: 1,
      normal: 1.5,
    },
    colors: {
      primary: {
        100: 'rgb(var(--color-primary-100) / <alpha-value>)',
        400: 'rgb(var(--color-primary-400) / <alpha-value>)',
        800: 'rgb(var(--color-primary-800) / <alpha-value>)',
      },
      gray: {
        100: '#efefef',
        200: '#333333',
        300: '#d6d6d6',
        500: '#b4b4b4',
        600: '#9b9b9b',
        800: '#6d6d6d',
      },
      red: {
        100: '#eddada',
        300: '#f1c0ca',
        400: '#f6a0b2',
        600: '#ee4266',
        800: '#d0021b',
      },
      blue: {
        100: '#b7dcff',
        800: '#3289ba',
        900: '#0000ff',
      },
      green: {
        100: '#e6f5d7',
        200: '#d9eeda',
        400: '#b8e986',
        600: '#23a53f',
        800: '#125620',
      },
      yellow: {
        100: '#fffabf',
        400: '#ffd23f',
        800: '#a57e00',
      },
      orange: {
        100: '#f7e6db',
        400: '#ee8e5d',
      },
      black: colors.black,
      white: colors.white,
      transparent: 'transparent',
    },
    extend: {
      fontFamily: {
        sans: ["'Montserrat'", ...defaultTheme.fontFamily.sans],
        serif: ["'Montserrat'", ...defaultTheme.fontFamily.serif],
      },
      spacing: {
        1: '1px',
        2: '2px',
        3: '3px',
        4: '4px',
        5: '5px',
        6: '6px',
        7: '7px',
        8: '8px',
        9: '9px',
        10: '10px',
        15: '15px',
        20: '20px',
        25: '25px',
        30: '30px',
        35: '35px',
        40: '40px',
        45: '45px',
        50: '50px',
        55: '55px',
        60: '60px',
        70: '70px',
        80: '80px',
        90: '90px',
        100: '100px',
      },
      minHeight: {
        1: '1px',
        2: '2px',
        3: '3px',
        4: '4px',
        5: '5px',
        10: '10px',
        15: '15px',
        20: '20px',
        25: '25px',
        30: '30px',
        35: '35px',
        40: '40px',
        60: '60px',
        70: '70px',
      },
      fontSize: {
        xs: '10px',
        sm: '12px',
        base: '14px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '36px',
      },
      opacity: {
        40: '0.4',
        70: '0.7',
      },
      keyframes: {
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-out-up': {
          from: {
            opacity: '1',
            transform: 'translateY(0px)',
          },
          to: {
            opacity: '0',
            transform: 'translateY(30px)',
          },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.15s linear',
        'fade-out-up': 'fade-out-up 0.15s linear',
      },
    },
  },
  plugins: [require('@tailwindcss/aspect-ratio'), require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
