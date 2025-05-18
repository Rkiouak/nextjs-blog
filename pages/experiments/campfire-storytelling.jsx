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
    // Container, // Not strictly needed for this page's core layout
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send'; // Assuming used in View 1
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '@/context/AuthContext';

const StoryImageDisplay = ({ src, alt, sx }) => (
    <Box
        component="img"
        src={src || "https://images.unsplash.com/photo-1500902734059-c72a2f597845?auto=format&fit=crop&w=700&q=60"}
        alt={alt || "Campfire scene"}
        sx={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            m: 'auto', // helps center if image is smaller than its containing Box
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
    const [mainStoryContent, setMainStoryContent] = useState("The campfire crackles, waiting for a tale...\n\nCaptain Gus, a fluffy Landseer Newfoundland with a tiny sailor hat, grinned as his boat gently rocked. Beside him, splashing happily, was his best friend, Willy the Blue Whale! The sun sparkled on the water as they sailed towards a mysterious island, a secret destination known only to them.");
    const [currentPrompt, setCurrentPrompt] = useState('What happens next?');
    const [storyImage, setStoryImage] = useState("https://storage.googleapis.com/musings-mr.net/campfire_images/mrkiouak%40gmail.com/f30bfdaf-1fd2-496a-9325-8755032b34f8.png");
    const [userInput, setUserInput] = useState('');
    const [chatTurns, setChatTurns] = useState([]); // Assuming this is for View 1
    const [isLoadingPage, setIsLoadingPage] = useState(true); // Start true to fetch initial data
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const chatInputRef = useRef(null); // For View 1
    const chatHistoryRef = useRef(null); // For View 1
    const storyTextRef = useRef(null); // For View 2

    const API_ENDPOINT = '/api/experiments/campfire';
    const headerHeight = theme.mixins?.toolbar?.minHeight || 64;
    const footerHeight = 57;

    const fetchInitialData = useCallback(async () => {
        if (!token || !isAuthenticated) {
            setIsLoadingPage(false); // Stop loading if no token/auth
            return;
        }
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
            // setCurrentView('chatInput'); // Or keep on storyDisplay with error
        } finally {
            setIsLoadingPage(false);
        }
    }, [token, isAuthenticated]);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login?from=/experiments/campfire-storytelling');
        } else if (isAuthenticated && token) { // Removed isLoadingPage from here to allow re-fetch if needed without full page reload state
            fetchInitialData();
        } else if (!isAuthLoading && !token) {
            setIsLoadingPage(false); // Ensure loading stops if not authenticated and no token
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, isAuthLoading, router, token]); // fetchInitialData removed to prevent loop if it's not stable, or add it if it is.

    useEffect(() => {
        if (chatHistoryRef.current && currentView === 'chatInput') {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatTurns, currentView]);

    useEffect(() => {
        if (storyTextRef.current && currentView === 'storyDisplay') {
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

    const handleSubmitTurn = async (event) => { // Added event for form submission
        event.preventDefault(); // Prevent default form submission
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
                    } catch (e) { /* Keep original errorDetail */ }
                }
                throw new Error(errorDetail);
            }
            const data = await response.json();

            setAnimatingOut(true);
            setTimeout(() => {
                setMainStoryContent(data.storyContent || mainStoryContent);
                setCurrentPrompt(data.prompt || "And then what happened?");
                if (data.newImageUrl) setStoryImage(data.newImageUrl);
                setChatTurns(data.chatTurns || chatTurns); // Update chatTurns if API returns them
                setUserInput('');
                setCurrentView('storyDisplay');
                setAnimatingOut(false);
            }, 300);
        } catch (err) {
            console.error("Failed to submit story turn:", err);
            setError(err.message || "Could not submit your turn.");
        } finally {
            // Only set isSubmitting to false if not transitioning (transition handles it)
            if (!(currentView === 'storyDisplay' && animatingOut)) {
                setIsSubmitting(false);
            }
        }
    };
    useEffect(() => {
        // This ensures isSubmitting is false after the transition to storyDisplay is complete
        if (currentView === 'storyDisplay' && !animatingOut && isSubmitting) {
            setIsSubmitting(false);
        }
    }, [currentView, animatingOut, isSubmitting]);


    const pageContainerHeight = `calc(100vh - ${headerHeight}px - ${footerHeight}px)`;

    if (isAuthLoading || isLoadingPage) { // Combined loading state
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: pageContainerHeight, bgcolor: '#0A0A23', color: '#E0E0E0' }}>
                <CircularProgress color="inherit"/> <Typography sx={{ml: 2}}>Warming up the campfire...</Typography>
            </Box>
        );
    }

    if (!isAuthenticated) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: pageContainerHeight, bgcolor: '#0A0A23', color: '#E0E0E0' }}>
                <Typography sx={{ml: 2}}>Please log in to join the story.</Typography>
            </Box>
        );
    }

    const pageStyles = {
        display: 'flex',
        flexDirection: 'column',
        height: pageContainerHeight,
        bgcolor: '#0A0A23', color: '#EAEAEA',
        p: { xs: 1, sm: 2 },
        overflow: 'hidden', // Page itself should not scroll; internal parts will
        position: 'relative',
    };

    return (
        <>
            <Head>
                <title>Campfire Storytelling - Musings</title>
                <meta name="description" content="Interactive campfire storytelling session."/>
            </Head>

            <Box sx={pageStyles}>
                {error && <Alert severity="error"
                                 sx={{position: 'absolute', top: theme.spacing(1), left: theme.spacing(1), right: theme.spacing(1), zIndex: 1000, boxShadow: 3}}
                                 onClose={() => setError('')}>{error}</Alert>}

                {/* View 1: Chat Input View */}
                <Slide direction="right" in={currentView === 'chatInput' && !animatingOut} mountOnEnter unmountOnExit timeout={300}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, overflowY: 'auto' }}>
                        <Typography variant="h5" sx={{ textAlign: 'center', color: currentPrompt.includes("opening line") ? '#FFD700' : '#EAEAEA', mb: 1, flexShrink: 0 }}>
                            {currentPrompt}
                        </Typography>
                        <Paper sx={{ flexGrow: 1, p: 2, overflowY: 'auto', mb: 2, bgcolor: 'rgba(20,20,40,0.8)', border: '1px solid #444' }} ref={chatHistoryRef}>
                            {chatTurns.map((turn, index) => (
                                <Typography key={index} paragraph sx={{ color: turn.sender === 'user' ? '#ADD8E6' : '#F0E68C', mb: 1, whiteSpace: 'pre-wrap' }}>
                                    <strong>{turn.sender}:</strong> {turn.text}
                                </Typography>
                            ))}
                        </Paper>
                        <Box component="form" onSubmit={handleSubmitTurn} sx={{ display: 'flex', mt: 'auto', gap: 1, flexShrink: 0 }}>
                            <TextField
                                fullWidth
                                multiline
                                maxRows={3}
                                variant="outlined"
                                placeholder="Your turn..."
                                value={userInput}
                                onChange={handleInputChange}
                                inputRef={chatInputRef}
                                disabled={isSubmitting}
                                sx={{
                                    bgcolor: 'rgba(50,50,70,0.8)',
                                    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#666' }, '&:hover fieldset': { borderColor: '#888' }, '&.Mui-focused fieldset': { borderColor: '#FFD700' } },
                                    '& .MuiInputBase-input': { color: '#E0E0E0' }
                                }}
                            />
                            <Button type="submit" variant="contained" endIcon={<SendIcon />} disabled={isSubmitting || !userInput.trim()} sx={{bgcolor: '#FF8C00', '&:hover': {bgcolor: '#FFA500'}}}>
                                {isSubmitting ? <CircularProgress size={24} color="inherit"/> : "Send"}
                            </Button>
                        </Box>
                    </Box>
                </Slide>

                {/* View 2: Story Display View */}
                <Slide direction="left" in={currentView === 'storyDisplay' && !animatingOut} mountOnEnter unmountOnExit timeout={300}>
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h4" component="h1" sx={{
                            textAlign: 'center', color: 'rgba(228,165,0,0.82)', py: { xs: 1, md: 2 },
                            textShadow: '0 0 6px #FFA500', flexShrink: 0,
                            fontSize: { xs: '1.5rem', md: '2rem' }
                        }}>
                            Storytime
                        </Typography>

                        <Grid container spacing={1} sx={{
                            flexGrow: 1,
                            overflowY: 'auto', // Allows Grid container itself to scroll if its single row content is too tall
                            minHeight: 0,
                            p: { xs: 0.5, md: 1 }
                        }}>
                            {/* Left Column: Image */}
                            <Grid item size={{xs:12, md:6}} sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: { xs: 'auto', md: '100%' }, // Allow item to take full height of the row on md
                                p: { xs: 0.5, md: 1 },
                            }}>
                                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <StoryImageDisplay
                                        src={storyImage}
                                        alt="Current story scene"
                                        sx={{ width: '100%', height: '100%', objectFit: 'contain' }} // Image fits within this box
                                    />
                                </Box>
                            </Grid>

                            {/* Right Column: Story Text and Button */}
                            <Grid item size={{xs:12, md:6}} sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                p: { xs: 0.5, md: 1 },
                                minWidth: 0, // Crucial: Allows this Grid item to shrink to its flex-basis
                                height: { xs: 'auto', md: '100%' }, // Allow item to take full height of the row on md
                            }}>
                                <Paper
                                    ref={storyTextRef}
                                    component="article"
                                    elevation={3}
                                    sx={{
                                        flexGrow: 1, // Paper takes available vertical space in this flex column
                                        overflowY: 'auto', // Scroll text content if it's too long
                                        p: { xs: 1.5, md: 2 },
                                        bgcolor: 'rgba(44, 44, 44, 0.85)',
                                        border: '1px solid #555', borderRadius: '8px', color: '#f0f0f0',
                                        fontFamily: '"Georgia", "Times New Roman", serif',
                                        mb: 2, // Margin between Paper and Button
                                        minHeight: {xs: '150px', md: '200px' }, // Ensure visibility and some space
                                        minWidth: 0, // Good for flex children
                                        width: '100%',
                                    }}
                                >
                                    <Typography component="div" sx={{
                                        fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                                        lineHeight: 1.6,
                                        whiteSpace: 'pre-wrap',   // Preserves newlines and spaces
                                        textAlign: 'left',
                                        wordBreak: 'break-word',  // Forces long words/strings to break
                                        overflowWrap: 'break-word',// Alternative/modern equivalent
                                    }}>
                                        {mainStoryContent && mainStoryContent.trim() !== "" ? (
                                            mainStoryContent.split('\n').map((paragraph, index, arr) => (
                                                <p key={index} style={{ marginBottom: index === arr.length - 1 ? 0 : '15px' }}>{paragraph}</p>
                                            ))
                                        ) : ( <p>The story is unfolding...</p> )}
                                    </Typography>
                                </Paper>
                                <Button
                                    variant="contained"
                                    onClick={handleTransitionToChat}
                                    fullWidth // Will be fullWidth of the constrained Grid item
                                    sx={{
                                        flexShrink: 0, // Prevent button from shrinking
                                        bgcolor: '#FF8C00',
                                        '&:hover': { bgcolor: '#FFA500' },
                                        fontSize: { xs: '0.85rem', md: '0.95rem' },
                                        p: { xs: 1, md: 1.25 },
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