// src/theme.js
import { createTheme } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

const grayscaleTheme = createTheme({
    palette: {
        mode: 'light', // Or 'dark' if you prefer a dark base
        primary: {
            main: grey[800], // A darker gray for primary elements
            contrastText: '#ffffff',
        },
        secondary: {
            main: grey[600], // A medium gray for secondary elements
            contrastText: '#ffffff',
        },
        background: {
            default: grey[100], // Very light gray for page background
            paper: '#ffffff',   // White for paper elements like Cards, Paper
        },
        text: {
            primary: grey[900],   // Very dark gray (almost black) for main text
            secondary: grey[700], // Lighter gray for secondary text
        },
        divider: grey[300],     // Light gray for dividers
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: grey[900], // Dark AppBar
                    color: grey[50],          // Light text on AppBar
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                containedPrimary: {
                    backgroundColor: grey[700],
                    '&:hover': {
                        backgroundColor: grey[600],
                    },
                },
                containedSecondary: {
                    backgroundColor: grey[500],
                    color: grey[50],
                    '&:hover': {
                        backgroundColor: grey[400],
                    },
                },
            },
        },
        // Add further component overrides if needed to fine-tune
    },
});

export default grayscaleTheme;