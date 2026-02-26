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
import AccountCircle from '@mui/icons-material/AccountCircle';
import Logout from '@mui/icons-material/Logout';
import Create from '@mui/icons-material/Create';
import LinkIcon from '@mui/icons-material/Link';
import LaunchIcon from '@mui/icons-material/Launch';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';


function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const [projectsAnchorEl, setProjectsAnchorEl] = useState(null);
    const projectsOpen = Boolean(projectsAnchorEl);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleProjectsMenu = (event) => {
        setProjectsAnchorEl(event.currentTarget);
    };

    const handleProjectsClose = () => {
        setProjectsAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleClose();
        router.push('/');
    };

    const isCurrentPage = (path) => router.pathname === path;

    const navButtonSx = (path) => ({
        whiteSpace: 'nowrap',
        backgroundColor: isCurrentPage(path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
        }
    });

    return (
        <AppBar position="static">
            <Toolbar sx={{ minHeight: '48px', '@media (min-width:600px)': { minHeight: '56px' }, py: 0.5, gap: 0.5 }}>
                <Typography variant="h6" component="div" sx={{ mr: 2 }}>
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        Musings
                    </Link>
                </Typography>

                <Button color="inherit" component={Link} href="/" sx={navButtonSx('/')}>
                    Home
                </Button>

                <Button color="inherit" component={Link} href="/tech-ai" sx={navButtonSx('/tech-ai')}>
                    Tech & AI
                </Button>

                <Button
                    color="inherit"
                    onClick={handleProjectsMenu}
                    endIcon={<ExpandMoreIcon />}
                    sx={{
                        whiteSpace: 'nowrap',
                        backgroundColor: projectsOpen ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        }
                    }}
                >
                    Projects
                </Button>
                <Menu
                    anchorEl={projectsAnchorEl}
                    open={projectsOpen}
                    onClose={handleProjectsClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                    <MenuItem
                        component="a"
                        href="https://middlesexbudget.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleProjectsClose}
                    >
                        <ListItemIcon>
                            <LaunchIcon fontSize="small" />
                        </ListItemIcon>
                        Middlesex Budget
                    </MenuItem>
                    <MenuItem
                        component="a"
                        href="https://ki-storygen.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleProjectsClose}
                    >
                        <ListItemIcon>
                            <LaunchIcon fontSize="small" />
                        </ListItemIcon>
                        Ki Storygen
                    </MenuItem>
                </Menu>

                <Button color="inherit" component={Link} href="/about" sx={navButtonSx('/about')}>
                    About
                </Button>

                <Box sx={{ flexGrow: 1 }} />

                {isAuthenticated && user?.email === 'mrkiouak@gmail.com' ? (
                    <div>
                        <IconButton
                            size="large"
                            aria-label="account menu"
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
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            keepMounted
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            open={open}
                            onClose={handleClose}
                        >
                            <MenuItem onClick={() => { router.push('/profile'); handleClose(); }}>
                                <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
                                Profile
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={() => { router.push('/create-post'); handleClose(); }}>
                                <ListItemIcon><Create fontSize="small" /></ListItemIcon>
                                Create Post
                            </MenuItem>
                            <MenuItem onClick={() => { router.push('/edit-posts'); handleClose(); }}>
                                <ListItemIcon><Create fontSize="small" /></ListItemIcon>
                                Edit Posts
                            </MenuItem>
                            <MenuItem onClick={() => { router.push('/create-link'); handleClose(); }}>
                                <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                                Create Link
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
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
