import { createTheme } from '@mui/material/styles';

const earthyTheme = createTheme({
    palette: {
        mode: 'light', // You can set 'light' or 'dark'
        primary: {
            main: '#d07557', // Sienna - a reddish-brown earth tone
            contrastText: '#FFFFFF', // White text contrasts well with Sienna
        },
        secondary: {
            main: '#8FBC8F', // DarkSeaGreen - a muted, earthy green
            contrastText: '#000000', // Black text for contrast
        },
        background: {
            default: '#F5F5DC', // Beige - a light sandy background
            paper: '#FFFAF0',   // FloralWhite - slightly lighter for cards, paper surfaces
        },
        text: {
            primary: '#5D4037',   // Dark Brown - for main text
            secondary: '#795548', // Lighter Brown - for secondary text elements (like dates/authors)
        },
        // You could also customize other colors like error, warning, etc.
        // error: { main: '#B71C1C' },
        // warning: { main: '#FFA000' },
        // info: { main: '#1976D2' },
        // success: { main: '#388E3C' },
    },
    // Optional: Customize Typography
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', // Default MUI font
        h1: {
            fontWeight: 500, // Example customization
        },
        // Add other typography overrides if desired
    },
    // Optional: Customize specific components
    // components: {
    //   MuiAppBar: {
    //     styleOverrides: {
    //       root: {
    //         // Example: Make AppBar background slightly transparent if desired
    //         // backgroundColor: 'rgba(160, 82, 45, 0.9)', // Semi-transparent Sienna
    //       },
    //     },
    //   },
    //   MuiCard: {
    //      styleOverrides: {
    //        root: {
    //          border: '1px solid #D2B48C', // Add a light tan border to cards
    //        }
    //      }
    //   }
    // }
});

export default earthyTheme; // Export the theme if you put it in a separate file