// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#3a4045',      // Charcoal
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#5b8a72',      // Green accent
            contrastText: '#ffffff',
        },
        background: {
            default: '#f5f5f5',   // Light warm gray
            paper: '#ffffff',
        },
        text: {
            primary: '#1f2937',   // Dark charcoal
            secondary: '#4b5563', // Medium gray
        },
        divider: '#e5e7eb',
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#3a4045',
                    color: '#f9fafb',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                containedPrimary: {
                    backgroundColor: '#3a4045',
                    '&:hover': {
                        backgroundColor: '#4a5055',
                    },
                },
                containedSecondary: {
                    backgroundColor: '#5b8a72',
                    '&:hover': {
                        backgroundColor: '#4a7a62',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                outlined: {
                    borderColor: '#5b8a72',
                    color: '#5b8a72',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    '&.Mui-selected': {
                        color: '#5b8a72',
                    },
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    backgroundColor: '#5b8a72',
                },
            },
        },
    },
});

export default theme;
