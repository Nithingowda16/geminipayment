import { createTheme } from '@mui/material/styles';

export const getMuiTheme = (mode: 'light' | 'dark') => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#1A73E8', // Google Blue
        dark: '#1557B0',
        light: '#E8F0FE',
      },
      secondary: {
        main: '#34A853', // Google Green
      },
      background: {
        default: mode === 'light' ? '#F8F9FA' : '#1A1D20',
        paper: mode === 'light' ? '#FFFFFF' : '#202124',
      },
      text: {
        primary: mode === 'light' ? '#202124' : '#E8EAED',
        secondary: mode === 'light' ? '#5F6368' : '#9AA0A6',
      },
      divider: mode === 'light' ? '#DADCE0' : '#3C4043',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
      h1: {
        fontFamily: '"Outfit", "Inter", sans-serif',
        fontWeight: 600,
      },
      h2: {
        fontFamily: '"Outfit", "Inter", sans-serif',
        fontWeight: 600,
      },
      h3: {
        fontFamily: '"Outfit", "Inter", sans-serif',
        fontWeight: 600,
      },
      h5: {
        fontFamily: '"Outfit", "Inter", sans-serif',
        fontWeight: 500,
      },
      h6: {
        fontFamily: '"Outfit", "Inter", sans-serif',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8, // Rounded corners matching modern Material Design
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 24, // Rounded pills like modern Google Buttons
            paddingLeft: 24,
            paddingRight: 24,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
            },
          },
          contained: {
            fontWeight: 500,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1A73E8',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)' 
              : '0 1px 3px 0 rgba(0,0,0,0.5)',
            backgroundImage: 'none',
          },
        },
      },
    },
  });
};
