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
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuBookIcon from '@mui/icons-material/MenuBook'; // Icon for View Story button
import { useAuth } from '@/context/AuthContext';

const DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1500902734059-c72a2f597845?auto=format&fit=crop&w=700&q=60";
const DEFAULT_PROMPT_FOR_USER = "What happens next?";
const DEFAULT_TURN_TEXT = "The story continues...";
const WAITING_FOR_TALE_TEXT = "The campfire crackles, waiting for a tale...";
const START_NEW_STORY_PROMPT_INPUT = "Let's start a new story! What's the opening line?";

const StoryImageDisplay = ({ src, alt, sx }) => (
    <Box
        component="img"
        src={src || DEFAULT_IMAGE_URL}
        alt={alt || "Campfire scene"}
        sx={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            m: 'auto',
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

    const [displayedStoryText, setDisplayedStoryText] = useState(WAITING_FOR_TALE_TEXT);
    const [displayedImage, setDisplayedImage] = useState(DEFAULT_IMAGE_URL);
    const [promptForNextTurnButton, setPromptForNextTurnButton] = useState(DEFAULT_PROMPT_FOR_USER);

    const [promptForChatInput, setPromptForChatInput] = useState(START_NEW_STORY_PROMPT_INPUT);
    const [userInput, setUserInput] = useState('');

    const [allChatTurns, setAllChatTurns] = useState([]);
    const [storytellerTurns, setStorytellerTurns] = useState([]);
    const [currentStorytellerTurnIndex, setCurrentStorytellerTurnIndex] = useState(0);

    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const chatInputRef = useRef(null);
    const chatHistoryRef = useRef(null);
    const storyTextRef = useRef(null);

    const API_ENDPOINT = '/api/experiments/campfire';
    const headerHeight = theme.mixins?.toolbar?.minHeight || 64;
    const footerHeight = 57;

    const updateDisplayedStorytellerTurn = useCallback((index, currentStorytellerTurns) => {
        if (currentStorytellerTurns && currentStorytellerTurns.length > 0 && index >= 0 && index < currentStorytellerTurns.length) {
            const turn = currentStorytellerTurns[index] || {};
            setDisplayedStoryText(turn.text || DEFAULT_TURN_TEXT);
            setDisplayedImage(turn.imageUrl || DEFAULT_IMAGE_URL);
            setPromptForNextTurnButton(turn.promptForUser || DEFAULT_PROMPT_FOR_USER);
        } else {
            setDisplayedStoryText(WAITING_FOR_TALE_TEXT);
            setDisplayedImage(DEFAULT_IMAGE_URL);
            setPromptForNextTurnButton(DEFAULT_PROMPT_FOR_USER);
        }
    }, []);

    const fetchInitialData = useCallback(async () => {
        if (!token || !isAuthenticated) {
            setIsLoadingPage(false);
            return;
        }
        setIsLoadingPage(true);
        setError('');
        try {
            const response = await fetch(API_ENDPOINT, {
                headers: {'Authorization': `Bearer ${token}`, 'Accept': 'application/json'}
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Error fetching initial story: ${response.statusText}`);
            }
            const data = await response.json() || {};

            const rawTurns = Array.isArray(data.chatTurns) ? data.chatTurns : [];
            const processedAllTurns = rawTurns.map((turn, idx) => {
                const currentTurn = turn || {};
                return {
                    id: currentTurn.id || `turn-${idx}-${Date.now()}`,
                    sender: currentTurn.sender || 'System',
                    text: currentTurn.text || (currentTurn.sender === 'User' ? 'User input' : DEFAULT_TURN_TEXT),
                    imageUrl: currentTurn.imageUrl || null,
                    promptForUser: currentTurn.promptForUser || null
                };
            });
            setAllChatTurns(processedAllTurns);

            const currentStorytellerTurns = processedAllTurns.filter(turn => turn.sender === "Storyteller");
            setStorytellerTurns(currentStorytellerTurns);

            if (currentStorytellerTurns.length > 0) {
                setCurrentStorytellerTurnIndex(currentStorytellerTurns.length - 1);
            } else {
                updateDisplayedStorytellerTurn(0, []);
            }

            const lastOverallTurn = processedAllTurns.length > 0 ? processedAllTurns[processedAllTurns.length - 1] : null;
            if (lastOverallTurn && lastOverallTurn.sender === "Storyteller" && lastOverallTurn.promptForUser) {
                setPromptForChatInput(lastOverallTurn.promptForUser);
            } else if (processedAllTurns.length === 0) {
                setPromptForChatInput(START_NEW_STORY_PROMPT_INPUT);
            } else {
                setPromptForChatInput(DEFAULT_PROMPT_FOR_USER);
            }

            const hasActiveSession = data.hasActiveSessionToday || false;
            if (hasActiveSession && currentStorytellerTurns.length > 0) { // If there are storyteller turns, default to story view
                setCurrentView('storyDisplay');
            } else { // Otherwise, or if no active session, go to input
                setCurrentView('chatInput');
                setTimeout(() => chatInputRef.current?.focus(), 0);
            }

        } catch (err) {
            console.error("Failed to fetch initial story data:", err);
            setError(err.message || "Could not load the story.");
            updateDisplayedStorytellerTurn(0, []);
            setPromptForChatInput(START_NEW_STORY_PROMPT_INPUT);
        } finally {
            setIsLoadingPage(false);
        }
    }, [token, isAuthenticated, updateDisplayedStorytellerTurn]);


    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login?from=/experiments/campfire-storytelling');
        } else if (isAuthenticated && token) {
            fetchInitialData();
        } else if (!isAuthLoading && !token) {
            setIsLoadingPage(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, isAuthLoading, router, token]);

    useEffect(() => {
        updateDisplayedStorytellerTurn(currentStorytellerTurnIndex, storytellerTurns);
    }, [currentStorytellerTurnIndex, storytellerTurns, updateDisplayedStorytellerTurn]);


    useEffect(() => {
        if (chatHistoryRef.current && currentView === 'chatInput') {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [allChatTurns, currentView]);

    useEffect(() => {
        if (storyTextRef.current && currentView === 'storyDisplay') {
            storyTextRef.current.scrollTop = storyTextRef.current.scrollHeight;
        }
    }, [displayedStoryText, currentView]);


    const handleInputChange = (event) => {
        setUserInput(event.target.value);
    };

    const handleTransitionToChat = () => { // From View 2 to View 1
        setAnimatingOut(true);
        const currentStorytellerTurn = storytellerTurns[currentStorytellerTurnIndex];
        if (currentStorytellerTurn && currentStorytellerTurn.promptForUser) {
            setPromptForChatInput(currentStorytellerTurn.promptForUser);
        } else {
            const lastOverallTurn = allChatTurns.length > 0 ? allChatTurns[allChatTurns.length - 1] : null;
            if (lastOverallTurn && lastOverallTurn.promptForUser && lastOverallTurn.sender === "Storyteller") {
                setPromptForChatInput(lastOverallTurn.promptForUser);
            } else {
                setPromptForChatInput(DEFAULT_PROMPT_FOR_USER);
            }
        }
        setTimeout(() => {
            setCurrentView('chatInput');
            setAnimatingOut(false);
            setTimeout(() => chatInputRef.current?.focus(), 0);
        }, 300);
    };

    const handleTransitionToStoryDisplay = () => { // From View 1 to View 2
        if (storytellerTurns.length > 0) {
            setAnimatingOut(true);
            // Ensure we are on the latest storyteller turn when switching
            setCurrentStorytellerTurnIndex(storytellerTurns.length - 1);
            setTimeout(() => {
                setCurrentView('storyDisplay');
                setAnimatingOut(false);
            }, 300);
        } else {
            setError("There are no story parts to display yet.");
        }
    };


    const handleSubmitTurn = async (event) => {
        event.preventDefault();
        if (!userInput.trim() || !token) {
            setError(!token ? "You must be logged in." : "Input cannot be empty.");
            return;
        }
        setIsSubmitting(true);
        setError('');
        const currentTurnText = userInput.trim();

        const lastTurnInAll = allChatTurns.length > 0 ? (allChatTurns[allChatTurns.length - 1] || {}) : {};
        const previousContentForPayload = lastTurnInAll.text || WAITING_FOR_TALE_TEXT;

        try {
            const payload = {
                previousContent: previousContentForPayload,
                inputText: currentTurnText,
                chatTurns: allChatTurns.map(ct => ({
                    id: ct.id || undefined,
                    sender: ct.sender || 'System',
                    text: ct.text || '',
                    imageUrl: ct.imageUrl || null,
                    promptForUser: ct.promptForUser || null,
                })),
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
                        errorDetail = (errData || {}).detail || errorDetail;
                    } catch (e) { /* Keep original errorDetail */ }
                }
                throw new Error(errorDetail);
            }
            const data = await response.json() || {};

            const updatedRawTurns = Array.isArray(data.chatTurns) ? data.chatTurns : [];
            const updatedProcessedAllTurns = updatedRawTurns.map((turn, idx) => {
                const currentTurn = turn || {};
                return {
                    id: currentTurn.id || `resp-turn-${idx}-${Date.now()}`,
                    sender: currentTurn.sender || 'System',
                    text: currentTurn.text || (currentTurn.sender === 'User' ? 'User input' : DEFAULT_TURN_TEXT),
                    imageUrl: currentTurn.imageUrl || null,
                    promptForUser: currentTurn.promptForUser || null
                };
            });
            setAllChatTurns(updatedProcessedAllTurns);

            const updatedStorytellerTurns = updatedProcessedAllTurns.filter(turn => turn.sender === "Storyteller");
            setStorytellerTurns(updatedStorytellerTurns);

            if (updatedStorytellerTurns.length > 0) {
                setCurrentStorytellerTurnIndex(updatedStorytellerTurns.length - 1);
            }

            const newLastOverallTurn = updatedProcessedAllTurns.length > 0 ? updatedProcessedAllTurns[updatedProcessedAllTurns.length - 1] : null;
            if (newLastOverallTurn && newLastOverallTurn.sender === "Storyteller" && newLastOverallTurn.promptForUser) {
                setPromptForChatInput(newLastOverallTurn.promptForUser);
            } else {
                // If the last turn isn't a storyteller prompt, find the most recent one or default
                const lastStorytellerPromptTurn = [...updatedProcessedAllTurns].reverse().find(t => t.sender === "Storyteller" && t.promptForUser);
                setPromptForChatInput(lastStorytellerPromptTurn?.promptForUser || DEFAULT_PROMPT_FOR_USER);
            }

            setAnimatingOut(true);
            setTimeout(() => {
                setUserInput('');
                setCurrentView('storyDisplay'); // Go to story display after submit
                setAnimatingOut(false);
            }, 300);

        } catch (err) {
            console.error("Failed to submit story turn:", err);
            setError(err.message || "Could not submit your turn.");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (currentView === 'storyDisplay' && !animatingOut && isSubmitting) {
            setIsSubmitting(false);
        }
    }, [currentView, animatingOut, isSubmitting]);

    const handlePrevTurn = () => {
        setCurrentStorytellerTurnIndex(prev => Math.max(0, prev - 1));
    };

    const handleNextTurn = () => {
        setCurrentStorytellerTurnIndex(prev => Math.min(storytellerTurns.length - 1, prev + 1));
    };

    const pageContainerHeight = `calc(100vh - ${headerHeight}px - ${footerHeight}px)`;

    if (isAuthLoading || isLoadingPage) {
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
        overflow: 'hidden',
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
                        <Typography variant="h5" sx={{ textAlign: 'center', color: (promptForChatInput || "").includes("opening line") ? '#FFD700' : '#EAEAEA', mb: 1, flexShrink: 0 }}>
                            {promptForChatInput || DEFAULT_PROMPT_FOR_USER}
                        </Typography>
                        <Paper sx={{ flexGrow: 1, p: 2, overflowY: 'auto', mb: 2, bgcolor: 'rgba(20,20,40,0.8)', border: '1px solid #444' }} ref={chatHistoryRef}>
                            {allChatTurns.map((turn, index) => (
                                <Box key={turn.id || `chat-hist-${index}`}>
                                    {turn.sender === 'Storyteller' && turn.text && (
                                        <Typography paragraph sx={{ color: '#F0E68C', mb: 1, whiteSpace: 'pre-wrap' }}>
                                            <strong>Storyteller:</strong> {turn.text}
                                            {turn.promptForUser && ( // Show prompt associated with this storyteller text
                                                <em style={{display: 'block', marginTop: '4px', color: '#c0b07c'}}>(Prompt: {turn.promptForUser})</em>
                                            )}
                                        </Typography>
                                    )}
                                    {turn.sender === 'User' && turn.text && (
                                        <Typography paragraph sx={{ color: '#ADD8E6', mb: 1, whiteSpace: 'pre-wrap' }}>
                                            <strong>{user?.username || 'You'}:</strong> {turn.text}
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Paper>
                        {/* Form for submitting input or viewing story */}
                        <Box component="form" onSubmit={handleSubmitTurn} sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0, mt: 'auto' }}>
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
                            <Box sx={{display: 'flex', gap: 1}}>
                                <Button
                                    variant="outlined"
                                    startIcon={<MenuBookIcon />}
                                    onClick={handleTransitionToStoryDisplay}
                                    disabled={storytellerTurns.length === 0 || isSubmitting}
                                    sx={{borderColor: '#FF8C00', color: '#FF8C00', '&:hover': {borderColor: '#FFA500', color: '#FFA500', backgroundColor: 'rgba(255,165,0,0.1)'}}}
                                >
                                    View Story
                                </Button>
                                <Button type="submit" variant="contained" endIcon={<SendIcon />} disabled={isSubmitting || !userInput.trim()} sx={{flexGrow: 1, bgcolor: '#FF8C00', '&:hover': {bgcolor: '#FFA500'}}}>
                                    {isSubmitting ? <CircularProgress size={24} color="inherit"/> : "Send"}
                                </Button>
                            </Box>
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
                            Stories & Tales
                        </Typography>

                        <Grid container spacing={1} sx={{
                            flexGrow: 1,
                            overflowY: 'hidden',
                            minHeight: 0,
                            p: { xs: 0.5, md: 1 }
                        }}>
                            <Grid item size={{xs:12, md: 6}} sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 0.5, md: 1 }}}>
                                <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow:'hidden', mb: { xs: 1, md: 0 }, borderRadius: '4px', border: '1px solid #444', background: 'rgba(0,0,0,0.2)' }}>
                                    <StoryImageDisplay
                                        src={displayedImage}
                                        alt="Current story scene"
                                    />
                                </Box>
                                {storytellerTurns && storytellerTurns.length > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, width: '100%', flexShrink:0 }}>
                                        <IconButton onClick={handlePrevTurn} disabled={currentStorytellerTurnIndex === 0} sx={{color: '#FFD700'}}>
                                            <ArrowBackIcon />
                                        </IconButton>
                                        <Typography variant="caption" sx={{color: '#aaa'}}>
                                            Storyteller Turn {currentStorytellerTurnIndex + 1} of {storytellerTurns.length}
                                        </Typography>
                                        <IconButton onClick={handleNextTurn} disabled={currentStorytellerTurnIndex >= storytellerTurns.length - 1} sx={{color: '#FFD700'}}>
                                            <ArrowForwardIcon />
                                        </IconButton>
                                    </Box>
                                )}
                            </Grid>
                            <Grid item size={{xs:12, md: 6}} sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                p: { xs: 0.5, md: 1 },
                                minWidth: 0,
                                height: '100%',
                            }}>
                                <Paper
                                    ref={storyTextRef}
                                    component="article"
                                    elevation={3}
                                    sx={{
                                        flexGrow: 1,
                                        overflowY: 'auto',
                                        p: { xs: 1.5, md: 2 },
                                        bgcolor: 'rgba(44, 44, 44, 0.85)',
                                        border: '1px solid #555', borderRadius: '8px', color: '#f0f0f0',
                                        fontFamily: '"Georgia", "Times New Roman", serif',
                                        mb: 2,
                                        minHeight: {xs: '150px', md: '200px' },
                                        minWidth: 0,
                                        width: '100%',
                                    }}
                                >
                                    <Typography component="div" sx={{
                                        fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                                        lineHeight: 1.6,
                                        whiteSpace: 'pre-wrap',
                                        textAlign: 'left',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                    }}>
                                        {displayedStoryText && displayedStoryText.trim() !== "" ? (
                                            displayedStoryText.split('\n').map((paragraph, index, arr) => (
                                                <p key={index} style={{ marginBottom: index === arr.length - 1 ? 0 : '15px' }}>{paragraph}</p>
                                            ))
                                        ) : ( <p>{WAITING_FOR_TALE_TEXT}</p> )}
                                    </Typography>
                                </Paper>
                                <Button
                                    variant="contained"
                                    onClick={handleTransitionToChat}
                                    fullWidth
                                    sx={{
                                        flexShrink: 0,
                                        bgcolor: '#FF8C00',
                                        '&:hover': { bgcolor: '#FFA500' },
                                        fontSize: { xs: '0.85rem', md: '0.95rem' },
                                        p: { xs: 1, md: 1.25 },
                                    }}
                                    endIcon={<ArrowForwardIcon />}
                                >
                                    And then... ({(promptForNextTurnButton || DEFAULT_PROMPT_FOR_USER).length > 20 ? (promptForNextTurnButton || DEFAULT_PROMPT_FOR_USER).substring(0,17) + '...' : (promptForNextTurnButton || DEFAULT_PROMPT_FOR_USER)})
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Slide>
            </Box>
        </>
    );
}