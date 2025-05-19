import { createTheme } from '@mui/material/styles';

const earthyTheme = createTheme({
    palette: {
        mode: 'light', // You can set 'light' or 'dark'
        primary: {
            main: '#fb9779', // Sienna - a reddish-brown earth tone
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
    },
});

export default earthyTheme; // Export the theme if you put it in a separate file