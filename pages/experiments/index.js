// pages/experiments/index.jsx
import React, { useEffect, useState } from 'react'; // Import useState
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
    TextField // Import TextField
} from '@mui/material';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ExperimentsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading, token } = useAuth();
    const [campfireDates, setCampfireDates] = useState([]);
    const [isLoadingCampfire, setIsLoadingCampfire] = useState(false);
    const [campfireError, setCampfireError] = useState('');
    const [newStoryTitleInput, setNewStoryTitleInput] = useState(''); // State for the new story title input

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login?from=/experiments');
        }
    }, [isAuthenticated, isAuthLoading, router]);

    // Fetch campfire story dates (these are identifiers, often dates, for existing stories)
    useEffect(() => {
        const fetchCampfireDates = async () => {
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
        };

        fetchCampfireDates();
    }, [isAuthenticated, token]);

    const handleNewStoryTitleChange = (event) => {
        setNewStoryTitleInput(event.target.value);
    };

    // Link for starting a new story, using 'title' as the query parameter
    const newStoryLink = newStoryTitleInput.trim()
        ? `/experiments/campfire-storytelling?title=${encodeURIComponent(newStoryTitleInput.trim())}`
        : "/experiments/campfire-storytelling"; // Fallback if no title, or could be disabled

    if (isAuthLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading experiments...</Typography>
            </Box>
        );
    }

    if (!isAuthenticated) {
        return (
            <Container maxWidth="md" sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="h6">Access Denied</Typography>
                <Typography>Please log in to view experiments.</Typography>
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
                <title>Stories - Musings</title>
                <meta name="description" content="A collection of experimental projects and features." />
                <meta name="robots" content="noindex" />
            </Head>
            <Container maxWidth="md">
                <Paper elevation={3} sx={{ marginTop: 4, padding: { xs: 2, md: 4 } }}>
                    <Typography variant="h6" component="h2" sx={{ mt: 3, mb: 1 }}>
                        Stories
                    </Typography>
                    {isLoadingCampfire && <CircularProgress size={24} />}
                    {campfireError && <Alert severity="error" sx={{ mb: 1 }}>{campfireError}</Alert>}
                    {!isLoadingCampfire && !campfireError && (
                        <List dense>
                            {campfireDates.length > 0 ? (
                                campfireDates.map((dateIdentifier, index) => ( // dateIdentifier is the unique ID from backend
                                    <React.Fragment key={`campfire-date-${dateIdentifier}-${index}`}>
                                        <ListItem
                                            disablePadding
                                        >
                                            {/* Links to existing stories now use title=dateIdentifier */}
                                            <Link href={`/experiments/campfire-storytelling?title=${encodeURIComponent(dateIdentifier)}`} passHref legacyBehavior>
                                                <MuiLink component="a" sx={{
                                                    display: 'block',
                                                    width: '100%',
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    p: 1,
                                                    '&:hover': {
                                                        backgroundColor: 'action.hover',
                                                        borderRadius: 1
                                                    },
                                                }}>
                                                    <ListItemText
                                                        primary={dateIdentifier}
                                                    />
                                                </MuiLink>
                                            </Link>
                                        </ListItem>
                                        {index < campfireDates.length - 1 && <Divider component="li" variant="inset" />}
                                    </React.Fragment>
                                ))
                            ) : (
                                <Typography sx={{ fontStyle: 'italic', ml: 2, mb: 1 }}>
                                    No past stories found.
                                </Typography>
                            )}
                            {/* New Story Title Input and Button */}
                            <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', mt: 2, px: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Enter a title for your new story"
                                    variant="outlined"
                                    value={newStoryTitleInput}
                                    onChange={handleNewStoryTitleChange}
                                    size="small"
                                    sx={{ mb: 1 }}
                                />
                                <Link href={newStoryLink} passHref legacyBehavior>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        component="a"
                                        fullWidth
                                        sx={{
                                            textTransform: 'none',
                                            p: 1,
                                            justifyContent: 'center',
                                        }}
                                        disabled={!newStoryTitleInput.trim()} // Optionally disable if no title
                                    >
                                        {newStoryTitleInput.trim() ? `Start Story: "${newStoryTitleInput.trim()}"` : "Start a New Story (Enter Title Above)"}
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