// src/components/Header.jsx
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ScienceIcon from '@mui/icons-material/Science';

function Header() {
    const { user, isAuthenticated, logout } = useAuth(); // Destructure user, isAuthenticated, and logout

    return (
        <AppBar position="static">
            <Toolbar>
                {/* Logo */}
                <Box
                    component="img"
                    sx={{
                        display: { xs: 'none', md: 'flex' },
                        mr: 1,
                        height: 52,
                        width: 52,
                        borderRadius: '50%',
                        objectFit: 'cover',
                    }}
                    alt="logo"
                    src={"/newfy.jpeg"}
                />

                {/* Group Title and Home Button */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" component="div" sx={{ mr: 2 }}>
                        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                            Musings
                        </Link>
                    </Typography>
                    <Button color="inherit" component={Link} href="/">
                        Home
                    </Button>
                </Box>

                {/* Spacer */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Auth Buttons Container */}
                <Box>
                    {isAuthenticated ? (
                        <>
                            {/* Conditionally render Create Post button */}
                            {user?.email === 'mrkiouak@gmail.com' && (
                                <Button
                                    color="inherit"
                                    component={Link}
                                    href="/create-post"
                                    startIcon={<AddCircleOutlineIcon />}
                                    sx={{ mr: 1.5 }}
                                >
                                    Create Post
                                </Button>
                            )}

                            <Button
                                color="inherit"
                                component={Link}
                                href="/experiments"
                                startIcon={<ScienceIcon />}
                                sx={{ mr: 1.5 }}
                            >
                                Experiments
                            </Button>

                            <IconButton
                                color="inherit"
                                component={Link}
                                href="/profile"
                                aria-label="account of current user"
                                sx={{ mr: 1.5 }}
                            >
                                <AccountCircleIcon />
                            </IconButton>
                            <Button color="inherit" onClick={logout}>
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button color="inherit" component={Link} href="/login">
                                Login
                            </Button>
                            <Button
                                variant="contained"
                                color="secondary"
                                component={Link}
                                href="/signup"
                                sx={{ ml: 1.5 }}
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