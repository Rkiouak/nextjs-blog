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
    Tooltip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_IMAGE_URL = "/campfire.jpeg";
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
            display: 'block', maxWidth: '100%', maxHeight: '100%',
            width: 'auto', height: 'auto', objectFit: 'contain', m: 'auto', ...sx,
        }}
    />
);

export default function CampfireStorytellingPage() {
    const router = useRouter();
    const theme = useTheme();
    const { isAuthenticated, isLoading: isAuthLoading, user, token } = useAuth();

    const { title: titleQueryParam } = router.query;

    const [currentView, setCurrentView] = useState('storyDisplay');
    const [animatingOut, setAnimatingOut] = useState(false);

    const [currentStoryId, setCurrentStoryId] = useState(null);
    const [storyTitle, setStoryTitle] = useState(titleQueryParam || 'A New Campfire Tale');
    const [editableStoryTitle, setEditableStoryTitle] = useState(titleQueryParam || 'A New Campfire Tale');
    const [isEditingTitle, setIsEditingTitle] = useState(false);

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
    const titleEditInputRef = useRef(null);

    const BASE_API_ENDPOINT = '/api/experiments/campfire';
    const headerHeight = theme.mixins?.toolbar?.minHeight || 64;
    const footerHeight = 57;

    useEffect(() => {
        if (router.isReady) {
            const newTitle = titleQueryParam || "A New Campfire Tale";
            setStoryTitle(newTitle);
            setEditableStoryTitle(newTitle);
            if (!titleQueryParam) {
                setCurrentStoryId(null);
            }
        }
    }, [titleQueryParam, router.isReady]);

    const updateDisplayedStorytellerTurn = useCallback((index, currentStorytellerTurns) => {
        if (currentStorytellerTurns?.length > 0 && index >= 0 && index < currentStorytellerTurns.length) {
            const turn = currentStorytellerTurns[index] || {};
            setDisplayedStoryText(turn.text || DEFAULT_TURN_TEXT);
            setDisplayedImage(turn.imageUrl || DEFAULT_IMAGE_URL);
            setPromptForNextTurnButton(turn.promptForUser || DEFAULT_PROMPT_FOR_USER);
        } else {
            setDisplayedStoryText(WAITING_FOR_TALE_TEXT);
            setDisplayedImage(DEFAULT_IMAGE_URL);
            setPromptForNextTurnButton(DEFAULT_PROMPT_FOR_USER);
            if (!titleQueryParam) {
                setPromptForChatInput(START_NEW_STORY_PROMPT_INPUT);
            }
        }
    }, [titleQueryParam]);

    const fetchInitialData = useCallback(async (currentStoryTitleFromQuery) => {
        if (!token || !isAuthenticated) {
            setIsLoadingPage(false); return;
        }
        setIsLoadingPage(true); setError('');
        setCurrentStoryId(null);

        let endpoint = BASE_API_ENDPOINT;
        if (currentStoryTitleFromQuery) {
            endpoint = `${BASE_API_ENDPOINT}?title=${encodeURIComponent(currentStoryTitleFromQuery)}`;
        }

        try {
            const response = await fetch(endpoint, {
                headers: {'Authorization': `Bearer ${token}`, 'Accept': 'application/json'}
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Error fetching story: ${response.statusText}`);
            }
            const data = await response.json() || {};

            setCurrentStoryId(data.id || null);

            const rawTurns = Array.isArray(data.chatTurns) ? data.chatTurns : [];
            const processedAllTurns = rawTurns.map((turn, idx) => ({
                id: turn?.id || `turn-${idx}-${Date.now()}`,
                sender: turn?.sender || 'System',
                text: turn?.text || (turn?.sender === 'User' ? 'User input' : DEFAULT_TURN_TEXT),
                imageUrl: turn?.imageUrl || null,
                promptForUser: turn?.promptForUser || null
            }));
            setAllChatTurns(processedAllTurns);

            const currentStorytellerTurns = processedAllTurns.filter(turn => turn.sender === "Storyteller");
            setStorytellerTurns(currentStorytellerTurns);

            const effectiveTitle = data.storyTitle || currentStoryTitleFromQuery || "A New Campfire Tale";
            setStoryTitle(effectiveTitle);
            setEditableStoryTitle(effectiveTitle);

            if (currentStorytellerTurns.length > 0) {
                setCurrentStorytellerTurnIndex(currentStoryTitleFromQuery ? 0 : currentStorytellerTurns.length - 1);
            } else {
                updateDisplayedStorytellerTurn(0, []);
            }

            const lastOverallTurn = processedAllTurns.length > 0 ? processedAllTurns[processedAllTurns.length - 1] : null;
            if (lastOverallTurn?.sender === "Storyteller" && lastOverallTurn.promptForUser) {
                setPromptForChatInput(lastOverallTurn.promptForUser);
            } else if (processedAllTurns.length === 0 && !currentStoryTitleFromQuery) {
                setPromptForChatInput(START_NEW_STORY_PROMPT_INPUT);
            } else if (currentStoryTitleFromQuery && currentStorytellerTurns.length > 0) {
                setPromptForChatInput(currentStorytellerTurns[0]?.promptForUser || DEFAULT_PROMPT_FOR_USER)
            } else {
                setPromptForChatInput(DEFAULT_PROMPT_FOR_USER);
            }

            if (currentStoryTitleFromQuery || (data.id && currentStorytellerTurns.length > 0) || (data.hasActiveSessionToday && currentStorytellerTurns.length > 0) ) {
                setCurrentView('storyDisplay');
            } else {
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
            const fromPath = titleQueryParam ? `/experiments/campfire-storytelling?title=${titleQueryParam}` : '/experiments/campfire-storytelling';
            router.push(`/login?from=${encodeURIComponent(fromPath)}`);
        } else if (isAuthenticated && token && router.isReady) {
            fetchInitialData(titleQueryParam);
        } else if (!isAuthLoading && !token) {
            setIsLoadingPage(false);
        }
    }, [isAuthenticated, isAuthLoading, router.isReady, titleQueryParam, token, fetchInitialData, router]);

    useEffect(() => { updateDisplayedStorytellerTurn(currentStorytellerTurnIndex, storytellerTurns); }, [currentStorytellerTurnIndex, storytellerTurns, updateDisplayedStorytellerTurn]);
    useEffect(() => { if (chatHistoryRef.current && currentView === 'chatInput') chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight; }, [allChatTurns, currentView]);
    useEffect(() => { if (storyTextRef.current && currentView === 'storyDisplay') storyTextRef.current.scrollTop = storyTextRef.current.scrollHeight; }, [displayedStoryText, currentView]);

    const handleInputChange = (event) => setUserInput(event.target.value);

    const handleTransitionToChat = () => {
        setAnimatingOut(true);
        const currentStorytellerTurn = storytellerTurns[currentStorytellerTurnIndex];
        setPromptForChatInput(currentStorytellerTurn?.promptForUser || [...allChatTurns].reverse().find(t => t.sender === "Storyteller" && t.promptForUser)?.promptForUser || DEFAULT_PROMPT_FOR_USER);
        setTimeout(() => { setCurrentView('chatInput'); setAnimatingOut(false); setTimeout(() => chatInputRef.current?.focus(), 0); }, 300);
    };

    const handleTransitionToStoryDisplay = () => {
        if (storytellerTurns.length > 0) {
            setAnimatingOut(true);
            if (!titleQueryParam && !currentStoryId) {
                setCurrentStorytellerTurnIndex(storytellerTurns.length - 1);
            }
            setTimeout(() => { setCurrentView('storyDisplay'); setAnimatingOut(false); }, 300);
        } else { setError("There are no story parts to display yet."); }
    };

    const handleTitleEditStart = () => {
        setEditableStoryTitle(storyTitle);
        setIsEditingTitle(true);
        setTimeout(() => titleEditInputRef.current?.focus(), 0);
    };

    const handleTitleEditSave = () => {
        const trimmedTitle = editableStoryTitle.trim();
        if (trimmedTitle) {
            setStoryTitle(trimmedTitle);
            if (currentStoryId) {
                console.log("Title changed for story ID:", currentStoryId, "to:", trimmedTitle, "(Backend update for title not implemented in this step)");
            }
        }
        setIsEditingTitle(false);
    };
    const handleTitleEditCancel = () => { setIsEditingTitle(false); setEditableStoryTitle(storyTitle); };

    const handleSubmitTurn = async (event) => {
        event.preventDefault();
        if (!userInput.trim() || !token) {
            setError(!token ? "You must be logged in." : "Input cannot be empty."); return;
        }

        if (titleQueryParam && currentStoryId && storytellerTurns.length > 0) {
            setError("You are viewing a specific past story. New turns can be added to the ongoing untitled story or by starting a new one.");
            return;
        }

        setIsSubmitting(true); setError('');
        const currentTurnText = userInput.trim();
        const lastTurnInAll = allChatTurns.length > 0 ? allChatTurns[allChatTurns.length - 1] : {};

        try {
            const payload = {
                previousContent: lastTurnInAll.text || WAITING_FOR_TALE_TEXT,
                inputText: currentTurnText,
                chatTurns: allChatTurns.map(ct => ({
                    id: ct.id, sender: ct.sender, text: ct.text,
                    imageUrl: ct.imageUrl, promptForUser: ct.promptForUser,
                })),
                storyTitle: storyTitle.trim() ? storyTitle.trim() : "Untitled Story"
            };

            if (currentStoryId) {
                payload.id = currentStoryId;
            }

            const response = await fetch(BASE_API_ENDPOINT, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json'},
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorDetail = `Error submitting turn: ${response.status}`;
                if (response.status === 401 || response.status === 403) errorDetail = "Session expired or unauthorized. Please log in again.";
                else try { const errData = await response.json(); errorDetail = errData?.detail || errorDetail; } catch (e) {/*ignore*/}
                throw new Error(errorDetail);
            }
            const data = await response.json() || {};

            if (data.id && !currentStoryId) {
                setCurrentStoryId(data.id);
            }
            if (data.storyTitle) {
                setStoryTitle(data.storyTitle);
                setEditableStoryTitle(data.storyTitle);
            }

            const updatedRawTurns = Array.isArray(data.chatTurns) ? data.chatTurns : [];
            const updatedProcessedAllTurns = updatedRawTurns.map((turn, idx) => ({
                id: turn?.id || `resp-turn-${idx}-${Date.now()}`, sender: turn?.sender || 'System',
                text: turn?.text || (turn?.sender === 'User' ? 'User input' : DEFAULT_TURN_TEXT),
                imageUrl: turn?.imageUrl || null, promptForUser: turn?.promptForUser || null
            }));
            setAllChatTurns(updatedProcessedAllTurns);

            const updatedStorytellerTurns = updatedProcessedAllTurns.filter(turn => turn.sender === "Storyteller");
            setStorytellerTurns(updatedStorytellerTurns);

            if (titleQueryParam && data.id && data.storyTitle && router.query.title) {
                const newQuery = { ...router.query };
                delete newQuery.title;
                router.replace({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
            }

            if (updatedStorytellerTurns.length > 0) setCurrentStorytellerTurnIndex(updatedStorytellerTurns.length - 1);

            const newLastOverallTurn = updatedProcessedAllTurns.length > 0 ? updatedProcessedAllTurns[updatedProcessedAllTurns.length - 1] : null;
            setPromptForChatInput(newLastOverallTurn?.sender === "Storyteller" && newLastOverallTurn.promptForUser ? newLastOverallTurn.promptForUser : ([...updatedProcessedAllTurns].reverse().find(t => t.sender === "Storyteller" && t.promptForUser)?.promptForUser || DEFAULT_PROMPT_FOR_USER));

            setAnimatingOut(true);
            setTimeout(() => { setUserInput(''); setCurrentView('storyDisplay'); setAnimatingOut(false); }, 300);

        } catch (err) {
            console.error("Failed to submit story turn:", err);
            setError(err.message || "Could not submit your turn.");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => { if (currentView === 'storyDisplay' && !animatingOut && isSubmitting) setIsSubmitting(false); }, [currentView, animatingOut, isSubmitting]);

    const handlePrevTurn = () => setCurrentStorytellerTurnIndex(prev => Math.max(0, prev - 1));
    const handleNextTurn = () => setCurrentStorytellerTurnIndex(prev => Math.min(storytellerTurns.length - 1, prev + 1));

    const pageContainerHeight = `calc(100vh - ${headerHeight}px - ${footerHeight}px)`;

    if (isAuthLoading || isLoadingPage) {
        return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: pageContainerHeight, bgcolor: '#0A0A23', color: '#E0E0E0' }}><CircularProgress color="inherit"/> <Typography sx={{ml: 2}}>Warming up the campfire...</Typography></Box>);
    }
    if (!isAuthenticated) {
        return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: pageContainerHeight, bgcolor: '#0A0A23', color: '#E0E0E0' }}><Typography sx={{ml: 2}}>Please log in to join the story.</Typography></Box>);
    }

    const pageStyles = { display: 'flex', flexDirection: 'column', height: pageContainerHeight, bgcolor: '#0A0A23', color: '#EAEAEA', p: { xs: 1, sm: 2 }, overflow: 'hidden', position: 'relative' };
    const canSubmitNewTurnOverall = !currentStoryId || storytellerTurns.length === 0 || !titleQueryParam;


    return (
        <>
            <Head><title>{storyTitle || "Campfire Story"} - Musings</title><meta name="description" content="Interactive campfire storytelling."/></Head>
            <Box sx={pageStyles}>
                {error && <Alert severity="error" sx={{position: 'absolute', top: theme.spacing(1), left: theme.spacing(1), right: theme.spacing(1), zIndex: 1000, boxShadow: 3}} onClose={() => setError('')}>{error}</Alert>}

                <Slide direction="right" in={currentView === 'chatInput' && !animatingOut} mountOnEnter unmountOnExit timeout={300}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, overflowY: 'auto' }}>
                        <Typography variant="h5" sx={{ textAlign: 'center', color: (promptForChatInput || "").includes("opening line") ? '#FFD700' : '#EAEAEA', mb: 1, flexShrink: 0 }}>
                            {promptForChatInput}
                        </Typography>
                        <Paper sx={{ flexGrow: 1, p: 2, overflowY: 'auto', mb: 2, bgcolor: 'rgba(20,20,40,0.8)', border: '1px solid #444' }} ref={chatHistoryRef}>
                            {allChatTurns.map((turn, index) => (
                                <Box key={turn.id || `chat-hist-${index}-${Math.random()}`}>
                                    {turn.sender === 'Storyteller' && turn.text && (<Typography paragraph sx={{ color: '#F0E68C', mb: 1, whiteSpace: 'pre-wrap' }}><strong>Storyteller:</strong> {turn.text}{turn.promptForUser && (<em style={{display: 'block', marginTop: '4px', color: '#c0b07c'}}>(Prompt: {turn.promptForUser})</em>)}</Typography>)}
                                    {turn.sender === 'User' && turn.text && (<Typography paragraph sx={{ color: '#ADD8E6', mb: 1, whiteSpace: 'pre-wrap' }}><strong>{user?.username || 'You'}:</strong> {turn.text}</Typography>)}
                                </Box>
                            ))}
                            {allChatTurns.length === 0 && (<Typography sx={{color: '#aaa', fontStyle: 'italic'}}>{titleQueryParam ? `Loading story: ${storyTitle}...` : WAITING_FOR_TALE_TEXT}</Typography>)}
                        </Paper>
                        <Box component="form" onSubmit={handleSubmitTurn} sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0, mt: 'auto' }}>
                            {canSubmitNewTurnOverall && (
                                <TextField fullWidth multiline maxRows={3} variant="outlined" placeholder="Your turn..." value={userInput} onChange={handleInputChange} inputRef={chatInputRef} disabled={isSubmitting}
                                           sx={{ bgcolor: 'rgba(50,50,70,0.8)', '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#666' }, '&:hover fieldset': { borderColor: '#888' }, '&.Mui-focused fieldset': { borderColor: '#FFD700' } }, '& .MuiInputBase-input': { color: '#E0E0E0' }}} />
                            )}
                            <Box sx={{display: 'flex', gap: 1}}>
                                <Button variant="outlined" startIcon={<MenuBookIcon />} onClick={handleTransitionToStoryDisplay} disabled={storytellerTurns.length === 0 || isSubmitting}
                                        sx={{borderColor: '#FF8C00', color: '#FF8C00', '&:hover': {borderColor: '#FFA500', color: '#FFA500', backgroundColor: 'rgba(255,165,0,0.1)'}}}>View Story</Button>
                                {canSubmitNewTurnOverall && (
                                    <Button type="submit" variant="contained" endIcon={<SendIcon />} disabled={isSubmitting || !userInput.trim()} sx={{flexGrow: 1, bgcolor: '#FF8C00', '&:hover': {bgcolor: '#FFA500'}}}>
                                        {isSubmitting ? <CircularProgress size={24} color="inherit"/> : "Send"}</Button>
                                )}
                                {!canSubmitNewTurnOverall && storytellerTurns.length > 0 && (
                                    <Typography sx={{ flexGrow: 1, textAlign: 'center', color: '#aaa', alignSelf: 'center' }}>
                                        Viewing a past story.
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Slide>

                <Slide direction="left" in={currentView === 'storyDisplay' && !animatingOut} mountOnEnter unmountOnExit timeout={300}>
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: { xs: 1, md: 1 }, flexShrink: 0, minHeight: '56px' }}>
                            {isEditingTitle ? (
                                <>
                                    <TextField
                                        value={editableStoryTitle}
                                        inputRef={titleEditInputRef}
                                        onChange={(e) => setEditableStoryTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleTitleEditSave()}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            mr: 1, flexGrow: 1,
                                            '& .MuiInputBase-input': { color: '#FFD700', fontSize: { xs: '1.3rem', md: '1.75rem' } },
                                            '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#FFD700' } }
                                        }}
                                    />
                                    <Tooltip title="Save Title"><IconButton onClick={handleTitleEditSave} sx={{ color: '#4CAF50' }}><SaveIcon /></IconButton></Tooltip>
                                    <Tooltip title="Cancel Edit"><IconButton onClick={handleTitleEditCancel} sx={{ color: '#FF7043' }}><CancelIcon /></IconButton></Tooltip>
                                </>
                            ) : (
                                <>
                                    <Typography variant="h4" component="h1" sx={{
                                        textAlign: 'center', color: 'rgba(228,165,0,0.82)', textShadow: '0 0 6px #FFA500',
                                        fontSize: { xs: '1.5rem', md: '2rem' }, flexGrow: 1,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        cursor: canSubmitNewTurnOverall ? 'pointer' : 'default',
                                        '&:hover': { opacity: canSubmitNewTurnOverall ? 0.8 : 1 }
                                    }}
                                                onClick={canSubmitNewTurnOverall ? handleTitleEditStart : undefined}
                                    >
                                        {storyTitle}
                                    </Typography>
                                    {canSubmitNewTurnOverall && (
                                        <Tooltip title="Edit Story Title">
                                            <IconButton onClick={handleTitleEditStart} sx={{ color: '#FFD700', ml: 1 }} size="small">
                                                <EditIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </>
                            )}
                        </Box>

                        <Grid container spacing={1} sx={{ flexGrow: 1, overflowY: 'scroll', minHeight: 0, p: { xs: 0.5, md: 1 }}}>
                            <Grid item size={{xs:12, md:6}} sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 0.5, md: 1 }}}>
                                <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow:'hidden', mb: { xs: 1, md: 0 }, borderRadius: '4px', border: '1px solid #444', background: 'rgba(0,0,0,0.2)' }}>
                                    <StoryImageDisplay src={displayedImage} alt="Current story scene" />
                                </Box>
                                {/* RESTORED ARROW CONTROLS START */}
                                {storytellerTurns?.length > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, width: '100%', flexShrink:0 }}>
                                        <IconButton onClick={handlePrevTurn} disabled={currentStorytellerTurnIndex === 0} sx={{color: '#FFD700'}}>
                                            <ArrowBackIcon />
                                        </IconButton>
                                        <Typography variant="caption" sx={{color: '#aaa'}}>
                                            Turn {currentStorytellerTurnIndex + 1} of {storytellerTurns.length}
                                        </Typography>
                                        <IconButton onClick={handleNextTurn} disabled={currentStorytellerTurnIndex >= storytellerTurns.length - 1} sx={{color: '#FFD700'}}>
                                            <ArrowForwardIcon />
                                        </IconButton>
                                    </Box>
                                )}
                                {/* RESTORED ARROW CONTROLS END */}
                            </Grid>
                            <Grid item size={{xs:12, md:6}} sx={{ display: 'flex', flexDirection: 'column', p: { xs: 0.5, md: 1 }, minWidth: 0, height: '100%'}}>
                                <Paper ref={storyTextRef} component="article" elevation={3}
                                       sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 1.5, md: 2 }, bgcolor: 'rgba(44, 44, 44, 0.85)', border: '1px solid #555', borderRadius: '8px', color: '#f0f0f0', fontFamily: '"Georgia", "Times New Roman", serif', mb: 2, minHeight: {xs: '150px', md: '200px' }, minWidth: 0, width: '100%' }}>
                                    <Typography component="div" sx={{ fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' }, lineHeight: 1.6, whiteSpace: 'pre-wrap', textAlign: 'left', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                        {displayedStoryText && displayedStoryText.trim() !== "" ? ( displayedStoryText.split('\n').map((paragraph, index, arr) => (<p key={`${index}-${currentStoryId || 'p'}-${Math.random()}`} style={{ marginBottom: index === arr.length - 1 ? 0 : '15px' }}>{paragraph}</p>)))
                                            : ( <p>{isLoadingPage ? "Loading story..." : WAITING_FOR_TALE_TEXT}</p> )}
                                    </Typography>
                                </Paper>
                                <Button variant="contained" onClick={handleTransitionToChat} fullWidth
                                        sx={{ flexShrink: 0, bgcolor: '#FF8C00', '&:hover': { bgcolor: '#FFA500' }, fontSize: { xs: '0.85rem', md: '0.95rem' }, p: { xs: 1, md: 1.25 }}}
                                        endIcon={<ArrowForwardIcon />}
                                        disabled={!!titleQueryParam && !!currentStoryId && storytellerTurns.length > 0}
                                >
                                    {!!titleQueryParam && !!currentStoryId && storytellerTurns.length > 0 ? "Viewing Past Story" : `And then... (${(promptForNextTurnButton || DEFAULT_PROMPT_FOR_USER).substring(0,17)}${(promptForNextTurnButton || DEFAULT_PROMPT_FOR_USER).length > 20 ? '...' : ''})`}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Slide>
            </Box>
        </>
    );
}