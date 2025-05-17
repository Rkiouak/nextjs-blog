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

// Story image component (used in storyDisplay view)
const StoryImageDisplay = ({ src, alt, sx }) => (
    <Box
        component="img"
        src={src || "https://images.unsplash.com/photo-1500902734059-c72a2f597845?auto=format&fit=crop&w=700&q=60"} // Default placeholder
        alt={alt || "Campfire scene"}
        sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '8px',
            border: '3px solid #555',
            ...sx,
        }}
    />
);

export default function CampfireStorytellingPage() {
    const router = useRouter();
    const theme = useTheme();
    const { isAuthenticated, isLoading: isAuthLoading, user, token } = useAuth();

    // View State
    const [currentView, setCurrentView] = useState('storyDisplay');
    const [animatingOut, setAnimatingOut] = useState(false);

    // Story Data State
    const [mainStoryContent, setMainStoryContent] = useState('');
    const [currentPrompt, setCurrentPrompt] = useState('What happens next?');
    const [storyImage, setStoryImage] = useState(''); // Updated to newImage from API

    // Chat/Input State
    const [userInput, setUserInput] = useState('');
    const [chatTurns, setChatTurns] = useState([]);

    // Loading and Error State
    const [isLoadingPage, setIsLoadingPage] = useState(true);
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
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: `Error fetching initial story: ${response.status}`}));
                throw new Error(errData.detail || `Error fetching initial story: ${response.status}`);
            }
            const data = await response.json();

            setMainStoryContent(data.storyContent || "The campfire awaits your story...");
            setCurrentPrompt(data.prompt || "What adventure unfolds?");
            setStoryImage(data.newImageUrl || "https://images.unsplash.com/photo-1500902734059-c72a2f597845?auto=format&fit=crop&w=700&q=60");
            setChatTurns(data.chatTurns || [{ id: 'start', sender: 'Storyteller', text: 'The adventure begins...' }]);

            if (data.hasActiveSessionToday && data.chatTurns && data.chatTurns.length > 1) {
                // If there's an active session with more than just an intro message,
                // show the story display first (Page 2).
                setCurrentView('storyDisplay');
            } else {
                // Otherwise, it's a new story or the session is just starting,
                // so go to the input screen (Page 1).
                // We might want to ensure the prompt here is for starting a new story.
                if (!data.hasActiveSessionToday) {
                    setCurrentPrompt(data.prompt || "Let's start a new story! What's the opening line?");
                }
                setCurrentView('chatInput');
                setTimeout(() => chatInputRef.current?.focus(), 0); // Focus input if starting here
            }

        } catch (err) {
            console.error("Failed to fetch initial story data:", err);
            setError(err.message || "Could not load the story.");
            setMainStoryContent("Failed to load story. The ancient spirits are uncooperative tonight.");
            setCurrentView('chatInput'); // Fallback to input view on error
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
                previousContent: mainStoryContent, // Current story state before this turn
                prompt: currentPrompt,           // The prompt the user is responding to
                inputText: currentTurnText,      // The user's new input
            };
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
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
                    } catch (e) { /* Keep original errorDetail */ }
                }
                throw new Error(errorDetail);
            }
            const data = await response.json();

            // Animate out the chat view
            setAnimatingOut(true);
            setTimeout(() => {
                setMainStoryContent(data.storyContent || mainStoryContent); // Fallback to old content if not provided
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
            setIsSubmitting(false); // Ensure this is reset on error
        }
        // isSubmitting will be set to false by the animatingOut logic or error catch
    };

    // Reset isSubmitting when animation completes if it was a successful submission
    useEffect(() => {
        if (currentView === 'storyDisplay' && !animatingOut && isSubmitting) {
            setIsSubmitting(false);
        }
    }, [currentView, animatingOut, isSubmitting]);


    if (isAuthLoading || (!isAuthenticated && isLoadingPage)) { // Still waiting for auth
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: targetContentHeight, bgcolor: '#0A0A23', color: '#E0E0E0' }}>
                <CircularProgress color="inherit" /> <Typography sx={{ ml: 2 }}>Warming up the campfire...</Typography>
            </Box>
        );
    }
    if (isAuthenticated && isLoadingPage) { // Authenticated, but initial data is fetching
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: targetContentHeight, bgcolor: '#0A0A23', color: '#E0E0E0' }}>
                <CircularProgress color="inherit" /> <Typography sx={{ ml: 2 }}>Gathering kindling for the story...</Typography>
            </Box>
        );
    }
    // If not loading page and not authenticated (should have been redirected, but as a safeguard)
    if (!isAuthenticated) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: targetContentHeight, bgcolor: '#0A0A23', color: '#E0E0E0' }}>
                <Typography sx={{ ml: 2 }}>Please log in to join the story.</Typography>
            </Box>
        );
    }

    const pageStyles = {
        display: 'flex', flexDirection: 'column',
        height: targetContentHeight,
        bgcolor: '#0A0A23',
        color: '#EAEAEA',
        p: { xs: 1, sm: 2 },
        overflow: 'hidden',
        position: 'relative',
    };

    return (
        <>
            <Head>
                <title>Campfire Storytelling - Musings</title>
                <meta name="description" content="Interactive campfire storytelling session." />
                <meta name="robots" content="noindex" />
            </Head>

            <Box sx={pageStyles}>
                {error && <Alert severity="error" sx={{position:'absolute', top: 10, left:10, right:10, zIndex: 1000, boxShadow:3}} onClose={() => setError('')}>{error}</Alert>}

                {/* View 1: Chat Input View */}
                <Slide direction="right" in={currentView === 'chatInput' && !animatingOut} mountOnEnter unmountOnExit timeout={300}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                        <Typography variant="h5" component="h1" sx={{ textAlign: 'center', color: '#FFD700', py: 1, flexShrink: 0 }}>
                            Your Turn...
                        </Typography>
                        <Paper ref={chatHistoryRef} elevation={2} sx={{
                            flexGrow: 1, overflowY: 'auto', p: 2, mb: 2,
                            bgcolor: 'rgba(20, 20, 50, 0.8)', border: '1px solid #FFA500',
                        }}>
                            {chatTurns.map(turn => (
                                <Box key={turn.id || Math.random()} sx={{ // Fallback key if id is missing
                                    mb: 1.5,
                                    textAlign: turn.sender.toLowerCase() !== (user?.username?.toLowerCase() || 'user_placeholder') ? 'left' : 'right', // Differentiate by sender
                                }}>
                                    <Typography variant="caption" sx={{ color: turn.sender.toLowerCase() !== (user?.username?.toLowerCase() || 'user_placeholder') ? '#FFD700' : '#FF8C00', fontWeight: 'bold', display:'block' }}>
                                        {turn.sender}:
                                    </Typography>
                                    <Paper elevation={1} sx={{ p: 1, display: 'inline-block', bgcolor: turn.sender.toLowerCase() !== (user?.username?.toLowerCase() || 'user_placeholder') ? 'rgba(50,50,80,0.9)' : 'rgba(80,50,20,0.9)', borderRadius: '10px', maxWidth: '80%' }}>
                                        <Typography variant="body2" sx={{ color: '#E0E0E0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{turn.text}</Typography>
                                    </Paper>
                                </Box>
                            ))}
                        </Paper>
                        <Box sx={{ display: 'flex', alignItems: 'stretch', p: 1, bgcolor: 'rgba(10,10,30,0.7)', borderRadius: '8px', flexShrink: 0 }}>
                            <TextField
                                inputRef={chatInputRef}
                                fullWidth multiline minRows={2} maxRows={5} variant="outlined"
                                placeholder={currentPrompt || "What happens next?"} value={userInput} onChange={handleInputChange}
                                onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitTurn(); }}}
                                sx={{
                                    bgcolor: 'rgba(44, 44, 44, 0.9)', borderRadius: '4px', mr: 1,
                                    '& .MuiOutlinedInput-root': { height: '100%', '& fieldset': { borderColor: '#FF8C00' } },
                                    '& .MuiInputBase-input': { color: '#EAEAEA', py: '10.5px' },
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleSubmitTurn}
                                disabled={isSubmitting || !userInput.trim()}
                                sx={{ bgcolor: '#FFA500', color: '#1a1a1a', '&:hover': { bgcolor: '#FF8C00' }, p: '0 16px' }}
                                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit"/> : <SendIcon />}
                            >
                                Send
                            </Button>
                        </Box>
                    </Box>
                </Slide>

                {/* View 2: Story Display View */}
                <Slide direction="left" in={currentView === 'storyDisplay' && !animatingOut} mountOnEnter unmountOnExit timeout={300}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                        <Typography variant="h4" component="h1" sx={{ textAlign: 'center', color: '#FFD700', py: {xs:1, md:2}, textShadow: '0 0 6px #FFA500', flexShrink: 0, fontSize: {xs: '1.5rem', md:'2rem'} }}>
                            The Campfire Story
                        </Typography>
                        <Grid container spacing={2} sx={{ flexGrow: 1, height: 'calc(100% - 60px)', overflow:'scroll' }}>
                            <Paper ref={storyTextRef} component="article" elevation={3} sx={{
                                flexGrow: 1,
                                p: {xs: 1.5, md: 2},
                                overflowY: 'auto',
                                bgcolor: '#2c2c2c',
                                border: '1px solid #444',
                                borderRadius: '8px',
                                color: '#f0f0f0',
                                fontFamily: '"Georgia", "Times New Roman", serif',
                            }}>
                                <Typography component="div" sx={{
                                    fontSize: {xs: '0.95rem', sm:'1rem', md: '1.1rem'},
                                    lineHeight: 1.7,
                                    whiteSpace: 'pre-wrap',
                                    textAlign: 'left',
                                    '& p': { mb: '15px !important' }
                                }}>
                                    {mainStoryContent.split('\n').map((paragraph, index, arr) => (
                                        <p key={index} style={{ marginBottom: index === arr.length - 1 ? 0 : '15px' }}>{paragraph}</p>
                                    ))}
                                </Typography>
                            </Paper>
                                <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', height: '100%', p:1 }}>
                            </Grid>

                            <Grid item xs={12} md={6} sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                p: 1
                            }}>
                                <StoryImageDisplay
                                    src={storyImage}
                                    alt="Current story scene"
                                    sx={{
                                        width: '100%',
                                        objectFit: 'contain',
                                        maxHeight: {xs: '70%', sm: '90%', md: 'calc(95% - 124px)'},
                                        flexShrink: 1
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleTransitionToChat}
                                    fullWidth
                                    sx={{
                                        mt: 'auto',
                                        flexShrink: 0,
                                        bgcolor: '#FF8C00',
                                        '&:hover': { bgcolor: '#FFA500' },
                                        fontSize: { xs: '0.9rem', md: '1rem' },
                                        p: { xs: 1, md: 1.5 },
                                        marginTop: theme.spacing(2),
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