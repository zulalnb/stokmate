/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        'background-dark': '#000000',
        'background-element': '#F0F0F3',
        'background-element-dark': '#212225',
        'background-selected': '#E0E1E6',
        'background-selected-dark': '#2E3135',
        foreground: '#000000',
        'foreground-dark': '#ffffff',
        'foreground-secondary': '#60646C',
        'foreground-secondary-dark': '#B0B4BA',
        accent: '#3c87f7',
        danger: '#DC2626',
      },
    },
  },
  plugins: [],
};
