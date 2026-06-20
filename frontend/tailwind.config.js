/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        google: {
          blue: '#1A73E8',
          'blue-hover': '#1557B0',
          'blue-light': '#E8F0FE',
          red: '#EA4335',
          yellow: '#FBBC05',
          green: '#34A853',
          'green-light': '#E6F4EA',
          gray: '#5F6368',
          'gray-light': '#F1F3F4',
          'gray-bg': '#F8F9FA',
          dark: '#202124',
          border: '#DADCE0'
        }
      },
      fontFamily: {
        sans: ['"Google Sans"', 'Roboto', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'google-card': '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        'google-focus': '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.08)'
      }
    },
  },
  plugins: [],
}
