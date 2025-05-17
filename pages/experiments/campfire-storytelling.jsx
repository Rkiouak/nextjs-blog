// pages/experiments/campfire-storytelling.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Box,
    Grid,
    Typography,
    TextField,
    Button,
    Paper,
    CircularProgress,
    IconButton,
    Alert,
    useTheme,
    Slide,
    Fade,
    Container,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '@/context/AuthContext';

const StoryImageDisplay = ({ src, alt, sx }) => (
    <Box
        component="img"
        src={src || "https://images.unsplash.com/photo-1500902734059-c72a2f597845?auto=format&fit=crop&w=700&q=60"}
        alt={alt || "Campfire scene"}
        sx={{
            width: '100%',    // Fill container width
            height: 'auto',   // Maintain aspect ratio by default if container height is also auto
            maxHeight: '100%', // Don't exceed container height if container has a fixed height
            objectFit: 'contain', // Ensure whole image is visible
            ...sx,
        }}
    />
);

export default function CampfireStorytellingPage() {
    const router = useRouter();
    const theme = useTheme();
    const { isAuthenticated, isLoading: isAuthLoading, user, token } = useAuth();

    const [currentView, setCurrentView] = useState('storyDisplay');
    const [animatingOut, setAnimatingOut] = useState(false);
    const [mainStoryContent, setMainStoryContent] = useState("The campfire crackles, waiting for a tale...\n\nCaptain Gus, a fluffy Landseer Newfoundland with a tiny sailor hat, grinned as his boat gently rocked. Beside him, splashing happily, was his best friend, Willy the Blue Whale! The sun sparkled on the water as they sailed towards a mysterious island, a secret destination known only to them."); // Default test content
    const [currentPrompt, setCurrentPrompt] = useState('What happens next?');
    const [storyImage, setStoryImage] = useState("https://storage.googleapis.com/musings-mr.net/campfire_images/mrkiouak%40gmail.com/f30bfdaf-1fd2-496a-9325-8755032b34f8.png"); // Default test image
    const [userInput, setUserInput] = useState('');
    const [chatTurns, setChatTurns] = useState([]);
    const [isLoadingPage, setIsLoadingPage] = useState(false); // Set to false for testing layout directly
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const chatInputRef = useRef(null);
    const chatHistoryRef = useRef(null);
    const storyTextRef = useRef(null);

    const API_ENDPOINT = '/api/experiments/campfire';
    const headerHeight = (theme.mixins?.toolbar?.minHeight || 64);
    const footerHeight = 57;
    const targetContentHeight = `calc(100vh - ${headerHeight}px - ${footerHeight}px)`;

    const fetchInitialData = useCallback(async () => {
        if (!token || !isAuthenticated) return;
        setIsLoadingPage(true);
        setError('');
        try {
            const response = await fetch(API_ENDPOINT, {
                headers: {'Authorization': `Bearer ${token}`, 'Accept': 'application/json'}
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({detail: `Error fetching initial story: ${response.status}`}));
                throw new Error(errData.detail || `Error fetching initial story: ${response.status}`);
            }
            const data = await response.json();

            setMainStoryContent(data.storyContent || "The campfire awaits your story...");
            setCurrentPrompt(data.prompt || "What adventure unfolds?");
            setStoryImage(data.newImageUrl || "https://images.unsplash.com/photo-1500902734059-c72a2f597845?auto=format&fit=crop&w=700&q=60");
            setChatTurns(data.chatTurns || [{id: 'start', sender: 'Storyteller', text: 'The adventure begins...'}]);

            if (data.hasActiveSessionToday && data.chatTurns && data.chatTurns.length > 1) {
                setCurrentView('storyDisplay');
            } else {
                if (!data.hasActiveSessionToday) {
                    setCurrentPrompt(data.prompt || "Let's start a new story! What's the opening line?");
                }
                setCurrentView('chatInput');
                setTimeout(() => chatInputRef.current?.focus(), 0);
            }

        } catch (err) {
            console.error("Failed to fetch initial story data:", err);
            setError(err.message || "Could not load the story.");
            setMainStoryContent("Failed to load story. The ancient spirits are uncooperative tonight.");
            setCurrentView('chatInput');
        } finally {
            setIsLoadingPage(false);
        }
    }, [token, isAuthenticated]);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login?from=/experiments/campfire-storytelling');
        } else if (isAuthenticated && token && isLoadingPage) {
            fetchInitialData();
        }
    }, [isAuthenticated, isAuthLoading, router, token, fetchInitialData, isLoadingPage]);

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatTurns, currentView]);

    useEffect(() => {
        if (storyTextRef.current) {
            storyTextRef.current.scrollTop = storyTextRef.current.scrollHeight;
        }
    }, [mainStoryContent, currentView]);

    const handleInputChange = (event) => {
        setUserInput(event.target.value);
    };

    const handleTransitionToChat = () => {
        setAnimatingOut(true);
        setTimeout(() => {
            setCurrentView('chatInput');
            setAnimatingOut(false);
            setTimeout(() => chatInputRef.current?.focus(), 0);
        }, 300);
    };

    const handleSubmitTurn = async () => {
        if (!userInput.trim() || !token) {
            setError(!token ? "You must be logged in." : "Input cannot be empty.");
            return;
        }
        setIsSubmitting(true);
        setError('');
        const currentTurnText = userInput.trim();

        try {
            const payload = {
                previousContent: mainStoryContent,
                prompt: currentPrompt,
                inputText: currentTurnText,
            };
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorDetail = `Error submitting turn: ${response.status}`;
                if (response.status === 401 || response.status === 403) {
                    errorDetail = "Session expired or unauthorized. Please log in again.";
                } else {
                    try {
                        const errData = await response.json();
                        errorDetail = errData.detail || errorDetail;
                    } catch (e) { /* Keep original errorDetail */
                    }
                }
                throw new Error(errorDetail);
            }
            const data = await response.json();

            setAnimatingOut(true);
            setTimeout(() => {
                setMainStoryContent(data.storyContent || mainStoryContent);
                setCurrentPrompt(data.prompt || "And then what happened?");
                if (data.newImageUrl) setStoryImage(data.newImageUrl);
                setChatTurns(data.chatTurns || chatTurns);
                setUserInput('');
                setCurrentView('storyDisplay');
                setAnimatingOut(false);
            }, 300);

        } catch (err) {
            console.error("Failed to submit story turn:", err);
            setError(err.message || "Could not submit your turn.");
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (currentView === 'storyDisplay' && !animatingOut && isSubmitting) {
            setIsSubmitting(false);
        }
    }, [currentView, animatingOut, isSubmitting]);

    if (isAuthLoading || (!isAuthenticated && isLoadingPage)) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: targetContentHeight,
                bgcolor: '#0A0A23',
                color: '#E0E0E0'
            }}>
                <CircularProgress color="inherit"/> <Typography sx={{ml: 2}}>Warming up the campfire...</Typography>
            </Box>
        );
    }
    if (isAuthenticated && isLoadingPage) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: targetContentHeight,
                bgcolor: '#0A0A23',
                color: '#E0E0E0'
            }}>
                <CircularProgress color="inherit"/> <Typography sx={{ml: 2}}>Gathering kindling for the
                story...</Typography>
            </Box>
        );
    }
    if (!isAuthenticated) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: targetContentHeight,
                bgcolor: '#0A0A23',
                color: '#E0E0E0'
            }}>
                <Typography sx={{ml: 2}}>Please log in to join the story.</Typography>
            </Box>
        );
    }

    const pageStyles = {
        flexDirection: 'column',
        height: targetContentHeight, // Fixed height for the entire page content area
        bgcolor: '#0A0A23', color: '#EAEAEA',
        p: { xs: 1, sm: 2 },
        overflowY: 'auto', // ALLOW THIS PAGE TO SCROLL if content exceeds targetContentHeight
        position: 'relative',
    };

    if (isLoadingPage && isAuthenticated) { // Keep a loading state if you use it
        return (
            <Box sx={{ justifyContent: 'center', alignItems: 'center', height: targetContentHeight, bgcolor: '#0A0A23', color: '#E0E0E0' }}>
                <CircularProgress color="inherit" /> <Typography sx={{ ml: 2 }}>Loading Story...</Typography>
            </Box>
        );
    }

    console.log('mainStoryContent: ', mainStoryContent);
    return (
        <>
            <Head>
                <title>Campfire Storytelling - Musings</title>
                <meta name="description" content="Interactive campfire storytelling session."/>
            </Head>

            <Box sx={pageStyles}>
                {error && <Alert severity="error"
                                 sx={{position: 'absolute', top: 10, left: 10, right: 10, zIndex: 1000, boxShadow: 3}}
                                 onClose={() => setError('')}>{error}</Alert>}

                {/* View 1: Chat Input View (remains the same) */}
                <Slide direction="right" in={currentView === 'chatInput' && !animatingOut} mountOnEnter unmountOnExit
                       timeout={300}>
                    {/* ... (content of chatInput view) ... */}
                </Slide>

                {/* View 2: Story Display View */}
                <Slide direction="left" in={currentView === 'storyDisplay' && !animatingOut} mountOnEnter unmountOnExit timeout={300}>
                    {/* This Box is the direct child of Slide, flex column for Title + Grid Area */}
                    <Box sx={{ width: '100%'}}>
                        <Typography variant="h4" component="h1" sx={{
                            textAlign: 'center', color: '#FFD700', py: { xs: 1, md: 2 },
                            textShadow: '0 0 6px #FFA500', flexShrink: 0,
                            fontSize: { xs: '1.5rem', md: '2rem' }
                        }}>
                            The Campfire Story
                        </Typography>

                        {/* Grid container for the two columns/stacked items */}
                        <Grid container spacing={2}>
                            {/* Left Column: Image */}
                            <Grid item columns={{xs:12, md: 5}}>
                                <Box sx={{ width: '100%', height: {xs: 'auto', md: `calc(${targetContentHeight} - 100px)`}, maxHeight: { xs: '50vh', md: '80vh' } }}> {/* Approx title height */}
                                    <StoryImageDisplay src={storyImage} alt="Current story scene" />
                                </Box>
                            </Grid>

                            {/* Right Column: Story Text and Button */}
                            <Grid item columns={{xs:5, md: 5}} sx={{
                                order: { xs: 2, md: 2 } // Default order
                            }}>
                                <Paper
                                    ref={storyTextRef}
                                    component="article"
                                    elevation={3}
                                    sx={{
                                        flexGrow: { xs: 0, md: 1 }, // Grow on md to fill allocated height
                                        height: { xs: 'auto', md: 'auto' }, // Auto height for content, grow fills it on md
                                        minHeight: { md: '0' },
                                        overflowY: 'auto',
                                        p: { xs: 1.5, md: 2 },
                                        bgcolor: 'rgba(44, 44, 44, 0.85)',
                                        border: '1px solid #555', borderRadius: '8px', color: '#f0f0f0',
                                        fontFamily: '"Georgia", "Times New Roman", serif',
                                        mb: 2,
                                    }}
                                >
                                    <Typography component="div" sx={{
                                        fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                                        lineHeight: 1.6, whiteSpace: 'pre-wrap', textAlign: 'left',
                                        '& p:last-child': { mb: 0 }, '& p': { mb: '15px !important' }
                                    }}>
                                        {mainStoryContent && mainStoryContent.trim() !== "" ? (
                                            mainStoryContent.split('\n').map((paragraph, index, arr) => (
                                                <p key={index} style={{ marginBottom: index === arr.length - 1 ? 0 : '15px' }}>{paragraph}</p>
                                            ))
                                        ) : ( <p>The story is unfolding...</p> )}
                                    </Typography>
                                </Paper>
                                <Button
                                    variant="contained" onClick={handleTransitionToChat} fullWidth
                                    sx={{
                                        flexShrink: 0, bgcolor: '#FF8C00', '&:hover': { bgcolor: '#FFA500' },
                                        fontSize: { xs: '0.85rem', md: '0.95rem' }, p: { xs: 1, md: 1.25 },
                                    }}
                                    endIcon={<ArrowForwardIcon />}
                                >
                                    And then...
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Slide>
            </Box>
        </>
    );
}