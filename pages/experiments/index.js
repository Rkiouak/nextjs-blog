import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Container,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    Paper,
    CircularProgress,
    Link as MuiLink,
    Divider,
    Button,
    Alert,
    TextField,
    IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@mui/material/styles'; // Import useTheme

export default function ExperimentsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading, token, handleUnauthorized } = useAuth();
    const [campfireDates, setCampfireDates] = useState([]);
    const [isLoadingCampfire, setIsLoadingCampfire] = useState(false);
    const [campfireError, setCampfireError] = useState('');
    const [newStoryTitleInput, setNewStoryTitleInput] = useState('');
    const theme = useTheme(); // Get theme

    const fetchCampfireDates = useCallback(async () => {
        if (isAuthenticated && token) {
            setIsLoadingCampfire(true);
            setCampfireError('');
            try {
                const response = await fetch('/api/experiments/campfire/list', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || `Failed to fetch campfire dates: ${response.status}`);
                }
                const data = await response.json();
                setCampfireDates(data.titles || []);
            } catch (err) {
                console.error("Error fetching campfire dates:", err);
                setCampfireError(err.message || "Could not load campfire story dates.");
            } finally {
                setIsLoadingCampfire(false);
            }
        }
    }, [isAuthenticated, token]);


    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login?from=/experiments');
        }
    }, [isAuthenticated, isAuthLoading, router]);

    useEffect(() => {
        fetchCampfireDates();
    }, [fetchCampfireDates]);

    const handleNewStoryTitleChange = (event) => {
        setNewStoryTitleInput(event.target.value);
    };

    const handleDeleteStory = async (storyTitleToDelete) => {
        if (!token) {
            setCampfireError("Authentication token not found. Please log in again.");
            return;
        }
        if (!confirm(`Are you sure you want to delete the story: "${storyTitleToDelete}"?`)) {
            return;
        }

        setIsLoadingCampfire(true);
        setCampfireError('');

        try {
            const response = await fetch(`/api/experiments/campfire?title=${encodeURIComponent(storyTitleToDelete)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.status === 401 || response.status === 403) {
                handleUnauthorized();
                router.push('/login?sessionExpired=true&from=/experiments');
                throw new Error('Authorization failed.');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Failed to delete story: ${response.status}`);
            }
            setCampfireDates(prevDates => prevDates.filter(date => date !== storyTitleToDelete));
        } catch (err) {
            console.error("Error deleting story:", err);
            if (err.message !== 'Authorization failed.') {
                setCampfireError(err.message || "Could not delete the story.");
            }
        } finally {
            if (!router.asPath.startsWith('/login')) {
                setIsLoadingCampfire(false);
            }
        }
    };


    const newStoryLink = newStoryTitleInput.trim()
        ? `/experiments/campfire-storytelling?title=${encodeURIComponent(newStoryTitleInput.trim())}`
        : "/experiments/campfire-storytelling";

    if (isAuthLoading && !isLoadingCampfire) { // Ensure initial page load also considers auth loading
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading Ki Storygen...</Typography>
            </Box>
        );
    }

    if (!isAuthenticated && !isAuthLoading) { // Prevent flash of content if auth is still loading
        return (
            <Container maxWidth="md" sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="h6">Access Denied</Typography>
                <Typography>Please log in to view Ki Storygen.</Typography>
                <Button
                    variant="contained"
                    onClick={() => router.push('/login?from=/experiments')}
                    sx={{ mt: 2 }}
                >
                    Login
                </Button>
            </Container>
        );
    }

    return (
        <>
            <Head>
                <title>Ki Storygen - Musings</title> {/* Updated Head Title */}
                <meta name="description" content="Create and manage your Ki Storygen interactive stories." />
                <meta name="robots" content="noindex" />
            </Head>
            <Container maxWidth="md">
                <Paper elevation={3} sx={{ marginTop: 4, padding: { xs: 2, md: 4 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                        <Box
                            component="img"
                            src="/ki-storygen-logo.png" // Assuming same logo as header/homepage
                            alt="Ki Storygen Logo"
                            sx={{
                                height: { xs: 40, sm: 50 }, // Responsive logo size
                                width: { xs: 40, sm: 50 },
                                mr: 2,
                                borderRadius: '50%', // Circular logo
                                objectFit: 'contain',
                            }}
                        />
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 'medium', color: theme.palette.text.primary }}> {/* Using secondary color from theme */}
                            Ki Storygen
                        </Typography>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
                        Manage your AI-powered interactive stories or start a new adventure.
                    </Typography>

                    {isLoadingCampfire && <Box sx={{display: 'flex', justifyContent:'center', my:2}}><CircularProgress size={28} /></Box>}
                    {campfireError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCampfireError('')}>{campfireError}</Alert>}

                    {(!isLoadingCampfire || campfireDates.length > 0 ) && !campfireError && ( // Show list or input even if loading, if there's data
                        <List dense>
                            <Typography variant="h6" component="h2" sx={{ mt: 3, mb: 1, fontSize:'1.1rem' }}>
                                Your Stories:
                            </Typography>
                            {campfireDates.length > 0 ? (
                                campfireDates.map((dateIdentifier, index) => (
                                    <React.Fragment key={`campfire-date-${dateIdentifier}-${index}`}>
                                        <ListItem
                                            disablePadding
                                            secondaryAction={
                                                <IconButton
                                                    edge="end"
                                                    aria-label="delete story"
                                                    onClick={() => handleDeleteStory(dateIdentifier)}
                                                    sx={{ color: 'rgba(255, 0, 0, 0.6)', '&:hover': { color: 'rgba(255, 0, 0, 0.8)'} }}
                                                    disabled={isLoadingCampfire}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            }
                                        >
                                            <Link href={`/experiments/campfire-storytelling?title=${encodeURIComponent(dateIdentifier)}`} passHref legacyBehavior>
                                                <MuiLink component="a" sx={{
                                                    display: 'block',
                                                    width: '100%',
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    p: 1.5, // Increased padding
                                                    pr: 5,
                                                    '&:hover': {
                                                        backgroundColor: 'action.hover',
                                                        borderRadius: 1
                                                    },
                                                }}>
                                                    <ListItemText
                                                        primary={dateIdentifier}
                                                        primaryTypographyProps={{variant: 'subtitle1'}}
                                                    />
                                                </MuiLink>
                                            </Link>
                                        </ListItem>
                                        {index < campfireDates.length - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                ))
                            ) : (
                                !isLoadingCampfire && // Only show "no stories" if not loading
                                <Typography sx={{ fontStyle: 'italic', ml: 2, my: 2 }}>
                                    No past stories found. Start a new one below!
                                </Typography>
                            )}
                            <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', mt: 3, pt:2, borderTop: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="h6" component="h3" sx={{ mb: 1.5, fontSize:'1.1rem' }}>
                                    Create New Story:
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Enter a title for your new story"
                                    variant="outlined"
                                    value={newStoryTitleInput}
                                    onChange={handleNewStoryTitleChange}
                                    size="small"
                                    sx={{ mb: 1.5 }}
                                    disabled={isLoadingCampfire}
                                />
                                <Link href={newStoryLink} passHref legacyBehavior>
                                    <Button
                                        variant="contained" // Changed to contained for more emphasis
                                        color="secondary" // Use secondary color
                                        component="a"
                                        fullWidth
                                        sx={{
                                            textTransform: 'none',
                                            p: 1.25, // Slightly larger padding
                                            fontSize: '1rem',
                                        }}
                                        disabled={!newStoryTitleInput.trim() || isLoadingCampfire}
                                    >
                                        {newStoryTitleInput.trim() ? `Start Story: "${newStoryTitleInput.trim()}"` : "Start a New Story"}
                                    </Button>
                                </Link>
                            </ListItem>
                        </List>
                    )}
                </Paper>
            </Container>
        </>
    );
}