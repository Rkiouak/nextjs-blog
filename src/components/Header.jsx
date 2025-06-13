// src/components/Header.jsx
import React, {useState} from 'react';
import {AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem} from '@mui/material'; // Added Menu, MenuItem
import Link from 'next/link';
import {useRouter} from 'next/router'; // Added useRouter
import {useAuth} from '@/context/AuthContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit'; // Added EditIcon

function Header() {
    const {user, isAuthenticated, logout} = useAuth();
    const router = useRouter(); // Hook to get current route

    // State for User Menu
    const [anchorEl, setAnchorEl] = useState(null);
    const isMenuOpen = Boolean(anchorEl);

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleMenuClose();
        router.push('/'); // Redirect to home after logout
    };

    const isCurrentPage = (path) => router.pathname === path;

    return (
        <AppBar position="static">
            <Toolbar sx={{minHeight: '48px', '@media (min-width:600px)': {minHeight: '56px'}, py: 0.5}}>
                {/* Main Site Logo */}
                <Box
                    component="img"
                    sx={{
                        display: {xs: 'none', md: 'flex'},
                        mr: 1,
                        height: 52,
                        width: 52,
                        borderRadius: '50%',
                        objectFit: 'cover',
                    }}
                    alt="Musings logo"
                    src={"/newfy.jpeg"} // Main site logo
                />

                {/* Site Title */}
                <Typography variant="h6" component="div" sx={{mr: 2}}>
                    <Link href="/" style={{textDecoration: 'none', color: 'inherit'}}>
                        Musings
                    </Link>
                </Typography>

                {/* Home Button with Active State */}
                <Button
                    color="inherit"
                    component={Link}
                    href="/"
                    sx={{
                        whiteSpace: 'nowrap',
                        backgroundColor: isCurrentPage('/') ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        }
                    }}
                >
                    Home
                </Button>
                <Button
                    color="inherit"
                    component={Link}
                    href="/resume"
                    sx={{
                        whiteSpace: 'nowrap',
                        ml: 1,
                        backgroundColor: isCurrentPage('/resume') ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        }
                    }}
                >
                    Resume
                </Button>
                {/* Spacer */}
                <Box sx={{flexGrow: 1}}/>

                {/* Right-hand side controls */}
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    {isAuthenticated && user?.email === 'mrkiouak@gmail.com' && (
                        <>
                            <Button
                                color="inherit"
                                component={Link}
                                href="/create-post"
                                startIcon={<AddCircleOutlineIcon/>}
                                sx={{
                                    mr: {xs: 0.5, sm: 1}, // Adjusted margin
                                    whiteSpace: 'nowrap',
                                    display: {xs: 'none', sm: 'inline-flex'}
                                }}
                            >
                                Create Post
                            </Button>
                            <Button
                                color="inherit"
                                component={Link}
                                href="/edit-posts" // Link to the new edit posts page
                                startIcon={<EditIcon />}
                                sx={{
                                    mr: {xs: 0.5, sm: 1.5},
                                    whiteSpace: 'nowrap',
                                    display: {xs: 'none', sm: 'inline-flex'}
                                }}
                            >
                                Edit Posts
                            </Button>
                        </>
                    )}

                    {isAuthenticated ? ( // General authenticated user controls (excluding admin-specific ones above)
                        <>
                            {/* Ki Storygen button might still be relevant for all logged-in users */}
                            <Button
                                color="inherit"
                                component={Link}
                                href="https://ki-storygen.com"
                                sx={{
                                    mr: {xs: 0.5, sm: 1.5},
                                    display: 'flex',
                                    alignItems: 'center',
                                    whiteSpace: 'nowrap',
                                    padding: '6px 12px',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        '& .ki-logo, & .ki-text': {
                                            opacity: 0.85,
                                        }
                                    },
                                    backgroundColor: 'transparent',
                                }}
                            >
                                <Box
                                    className="ki-logo"
                                    component="img"
                                    src="/ki-storygen-logo.png"
                                    alt="Ki Storygen Logo"
                                    sx={{
                                        height: 38,
                                        width: 38,
                                        mr: 0.75,
                                        objectFit: 'contain',
                                        borderRadius: '50%',
                                        transition: 'opacity 0.2s ease-in-out',
                                    }}
                                />
                                <Typography component="span" className="ki-text"
                                            sx={{transition: 'opacity 0.2s ease-in-out'}}>
                                    Ki Storygen
                                </Typography>
                            </Button>

                            {/* User Menu */}
                            <IconButton
                                size="large"
                                edge="end"
                                aria-label="account of current user"
                                aria-controls="primary-search-account-menu"
                                aria-haspopup="true"
                                onClick={handleProfileMenuOpen}
                                color="inherit"
                            >
                                <AccountCircleIcon/>
                            </IconButton>
                            <Menu
                                id="primary-search-account-menu"
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={isMenuOpen}
                                onClose={handleMenuClose}
                                PaperProps={{
                                    sx: {
                                        mt: 1,
                                    }
                                }}
                            >
                                <MenuItem component={Link} href="/profile" onClick={handleMenuClose}>
                                    Profile
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>Logout</MenuItem>
                            </Menu>
                        </>
                    ) : ( // Not authenticated
                        <>
                            <Button color="inherit" component={Link} href="/login" sx={{whiteSpace: 'nowrap'}}>
                                Login
                            </Button>
                            <Button
                                variant="contained"
                                color="secondary"
                                component={Link}
                                href="/signup"
                                sx={{ml: 1.5, whiteSpace: 'nowrap'}}
                            >
                                Sign Up
                            </Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Header;