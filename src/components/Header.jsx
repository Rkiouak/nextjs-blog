import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Logout from '@mui/icons-material/Logout';
import Create from '@mui/icons-material/Create';
import LinkIcon from '@mui/icons-material/Link';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';


function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleClose();
        router.push('/');
    };

    const isCurrentPage = (path) => router.pathname === path;


    return (
        <AppBar position="static">
            <Toolbar sx={{ minHeight: '48px', '@media (min-width:600px)': { minHeight: '56px' }, py: 0.5 }}>
                <Typography variant="h6" component="div" sx={{ mr: 2 }}>
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        Musings
                    </Link>
                </Typography>

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

                <Button
                    color="inherit"
                    component={Link}
                    href="/links"
                    sx={{
                        whiteSpace: 'nowrap',
                        ml: 1,
                        backgroundColor: isCurrentPage('/links') ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        }
                    }}
                >
                    Links
                </Button>

                {isAuthenticated && user?.email === 'mrkiouak@gmail.com' && (
                    <Button
                        color="inherit"
                        component={Link}
                        href="/create-link"
                        startIcon={<LinkIcon />}
                        sx={{
                            whiteSpace: 'nowrap',
                            ml: 1,
                            backgroundColor: isCurrentPage('/create-link') ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            }
                        }}
                    >
                        Create Link
                    </Button>
                )}

                <Box sx={{ flexGrow: 1 }} />

                {isAuthenticated && user?.email === 'mrkiouak@gmail.com' ? (
                    <div>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenu}
                            color="inherit"
                        >
                            <AccountCircle />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
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
                            open={open}
                            onClose={handleClose}
                        >
                            <MenuItem onClick={() => {
                                router.push('/profile');
                                handleClose();
                            }}>
                                <ListItemIcon>
                                    <AccountCircle fontSize="small" />
                                </ListItemIcon>
                                Profile
                            </MenuItem>
                            {isAuthenticated && user?.email === 'mrkiouak@gmail.com' && (
                                <div>
                                    <Divider />
                                    <MenuItem onClick={() => {
                                        router.push('/create-post');
                                        handleClose();
                                    }}>
                                        <ListItemIcon>
                                            <Create fontSize="small" />
                                        </ListItemIcon>
                                        Create Post
                                    </MenuItem>
                                    <MenuItem onClick={() => {
                                        router.push('/edit-posts');
                                        handleClose();
                                    }}>
                                        <ListItemIcon>
                                            <Create fontSize="small" />
                                        </ListItemIcon>
                                        Edit Posts
                                    </MenuItem>
                                    <MenuItem onClick={() => {
                                        router.push('/create-link');
                                        handleClose();
                                    }}>
                                        <ListItemIcon>
                                            <LinkIcon fontSize="small" />
                                        </ListItemIcon>
                                        Create Link
                                    </MenuItem>
                                </div>
                            )}
                            <Divider />
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon>
                                    <Logout fontSize="small" />
                                </ListItemIcon>
                                Logout
                            </MenuItem>
                        </Menu>
                    </div>
                ) : (
                    <>
                        <Button color="inherit" component={Link} href="/login">Login</Button>
                        <Button color="inherit" component={Link} href="/signup">Sign Up</Button>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
}

export default Header;
