// pages/experiments/campfire-storytelling.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    useTheme, // Already imported
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import {
    DEFAULT_PROMPT_FOR_USER,
    WAITING_FOR_TALE_TEXT, // Will be updated from utils
    START_NEW_STORY_PROMPT_INPUT, // Will be updated from utils
    processChatTurns,
    getStorytellerTurns,
    getChatInputPrompt,
    prepareSubmitPayload,
    DEFAULT_IMAGE_URL, // Will be updated from utils
    DEFAULT_TURN_TEXT
} from '@/utils/campfireUtils';
import { ChatView, StoryDisplayView } from '@/components/CampfireComponents'; // These are now refactored

export default function CampfireStorytellingPage() {
    const router = useRouter();
    const theme = useTheme(); // Already here
    const { isAuthenticated, isLoading: isAuthLoading, user, token, handleUnauthorized } = useAuth(); // Added handleUnauthorized

    const { title: titleQueryParam } = router.query;

    const [currentView, setCurrentView] = useState('storyDisplay');
    const [animatingOut, setAnimatingOut] = useState(false);

    const defaultPageTitle = titleQueryParam || "New Ki Story"; // Updated default
    const [currentStoryId, setCurrentStoryId] = useState(null);
    const [storyTitle, setStoryTitle] = useState(defaultPageTitle);
    const [editableStoryTitle, setEditableStoryTitle] = useState(defaultPageTitle);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const [displayedStoryText, setDisplayedStoryText] = useState(WAITING_FOR_TALE_TEXT);
    const [displayedImage, setDisplayedImage] = useState(DEFAULT_IMAGE_URL);
    const [promptForNextTurnButton, setPromptForNextTurnButton] = useState(DEFAULT_PROMPT_FOR_USER);

    const [userInput, setUserInput] = useState('');
    const [allChatTurns, setAllChatTurns] = useState([]);
    const [storytellerTurns, setStorytellerTurns] = useState([]);
    const [currentStorytellerTurnIndex, setCurrentStorytellerTurnIndex] = useState(0);
    const [promptForChatInput, setPromptForChatInput] = useState(START_NEW_STORY_PROMPT_INPUT);

    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const chatInputRef = useRef(null);
    const chatHistoryRef = useRef(null);
    const storyTextRef = useRef(null);
    const titleEditInputRef = useRef(null);

    const BASE_API_ENDPOINT = '/api/experiments/campfire';
    const headerHeight = typeof theme.mixins?.toolbar?.minHeight === 'number' ? theme.mixins.toolbar.minHeight : 64;
    const footerHeight = 57; // Assuming a fixed footer height, adjust if dynamic

    useEffect(() => {
        if (router.isReady) {
            const newTitle = titleQueryParam || "New Ki Story"; // Updated default
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
            setDisplayedImage(turn.imageUrl || DEFAULT_IMAGE_URL); // Uses new default from utils
            setPromptForNextTurnButton(turn.promptForUser || DEFAULT_PROMPT_FOR_USER);
        } else {
            setDisplayedStoryText(WAITING_FOR_TALE_TEXT); // Uses new default from utils
            setDisplayedImage(DEFAULT_IMAGE_URL); // Uses new default from utils
            setPromptForNextTurnButton(DEFAULT_PROMPT_FOR_USER);
            if (!titleQueryParam) {
                setPromptForChatInput(START_NEW_STORY_PROMPT_INPUT); // Uses new default
            }
        }
    }, [titleQueryParam]);

    const fetchInitialData = useCallback(async (currentStoryTitleFromQuery) => {
        if (!token || !isAuthenticated) {
            setIsLoadingPage(false);
            return;
        }
        setIsLoadingPage(true);
        setError('');
        setCurrentStoryId(null);

        let endpoint = BASE_API_ENDPOINT;
        if (currentStoryTitleFromQuery) {
            endpoint = `${BASE_API_ENDPOINT}?title=${encodeURIComponent(currentStoryTitleFromQuery)}`;
        }

        try {
            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            });

            if (response.status === 401 || response.status === 403) {
                handleUnauthorized();
                router.push(`/login?from=${encodeURIComponent(router.asPath)}&sessionExpired=true`);
                throw new Error("Unauthorized access to story data.");
            }
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Error fetching story: ${response.statusText}`);
            }

            const data = await response.json() || {};
            setCurrentStoryId(data.id || null);
            const processedTurns = processChatTurns(data.chatTurns);
            setAllChatTurns(processedTurns);
            const currentStorytellerTurns = getStorytellerTurns(processedTurns);
            setStorytellerTurns(currentStorytellerTurns);
            const effectiveTitle = data.storyTitle || currentStoryTitleFromQuery || "New Ki Story"; // Updated
            setStoryTitle(effectiveTitle);
            setEditableStoryTitle(effectiveTitle);

            if (currentStorytellerTurns.length > 0) {
                setCurrentStorytellerTurnIndex(currentStorytellerTurns.length - 1);
            } else {
                updateDisplayedStorytellerTurn(0, []);
            }
            const isNewStorySession = !currentStoryTitleFromQuery && !data.id;
            setPromptForChatInput(getChatInputPrompt(processedTurns, isNewStorySession));

            if (currentStoryTitleFromQuery || (data.id && currentStorytellerTurns.length > 0) || (data.hasActiveSessionToday && currentStorytellerTurns.length > 0) ) {
                setCurrentView('storyDisplay');
            } else {
                setCurrentView('chatInput');
                setTimeout(() => chatInputRef.current?.focus(), 0);
            }
        } catch (err) {
            console.error("Failed to fetch initial story data:", err);
            if (err.message !== "Unauthorized access to story data.") {
                setError(err.message || "Could not load the story.");
            }
            updateDisplayedStorytellerTurn(0, []);
            setPromptForChatInput(START_NEW_STORY_PROMPT_INPUT);
        } finally {
            setIsLoadingPage(false);
        }
    }, [token, isAuthenticated, updateDisplayedStorytellerTurn, router, handleUnauthorized]); // Added router and handleUnauthorized

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            const fromPath = titleQueryParam ? `/experiments/campfire-storytelling?title=${titleQueryParam}` : '/experiments/campfire-storytelling';
            router.push(`/login?from=${encodeURIComponent(fromPath)}`);
        } else if (isAuthenticated && token && router.isReady) {
            fetchInitialData(titleQueryParam);
        } else if (!isAuthLoading && !token) {
            setIsLoadingPage(false);
        }
    }, [isAuthenticated, isAuthLoading, router, titleQueryParam, token, fetchInitialData]);


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

    const handleInputChange = (event) => setUserInput(event.target.value);

    const handleTransitionToChat = () => {
        setAnimatingOut(true);
        const currentStorytellerTurn = storytellerTurns[currentStorytellerTurnIndex];
        const nextPrompt = currentStorytellerTurn?.promptForUser ||
            [...allChatTurns].reverse().find(t => t.sender === "Storyteller" && t.promptForUser)?.promptForUser ||
            DEFAULT_PROMPT_FOR_USER;
        setPromptForChatInput(nextPrompt);
        setTimeout(() => {
            setCurrentView('chatInput');
            setAnimatingOut(false);
            setTimeout(() => chatInputRef.current?.focus(), 0);
        }, 300);
    };

    const handleTransitionToStoryDisplay = () => {
        if (storytellerTurns.length > 0) {
            setAnimatingOut(true);
            if (!titleQueryParam && currentStoryId) { // ensure latest turn for ongoing stories
                setCurrentStorytellerTurnIndex(storytellerTurns.length - 1);
            }
            setTimeout(() => {
                setCurrentView('storyDisplay');
                setAnimatingOut(false);
            }, 300);
        } else {
            setError("There are no story parts to display yet.");
        }
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
    const handleTitleEditCancel = () => {
        setIsEditingTitle(false);
        setEditableStoryTitle(storyTitle);
    };

    const handleSubmitTurn = async (event) => {
        event.preventDefault();
        if (!userInput.trim() || !token) {
            setError(!token ? "You must be logged in to continue the story." : "Input cannot be empty.");
            return;
        }
        if (titleQueryParam && currentStoryId && storytellerTurns.length > 0) {
            setError("You are viewing a specific past story. New turns can be added to the ongoing untitled story or by starting a new one from the Ki Storygen page.");
            return;
        }
        setIsSubmitting(true);
        setError('');
        const payload = prepareSubmitPayload({ userInput, allChatTurns, storyTitle, currentStoryId });

        try {
            const response = await fetch(BASE_API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.status === 401 || response.status === 403) {
                handleUnauthorized();
                router.push('/login?sessionExpired=true');
                throw new Error('Authorization failed.');
            }
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData?.detail || `Error submitting turn: ${response.status}`);
            }

            const data = await response.json() || {};
            if (data.id && !currentStoryId) setCurrentStoryId(data.id);
            if (data.storyTitle) {
                setStoryTitle(data.storyTitle);
                setEditableStoryTitle(data.storyTitle);
            }
            const updatedProcessedAllTurns = processChatTurns(data.chatTurns);
            setAllChatTurns(updatedProcessedAllTurns);
            const updatedStorytellerTurns = getStorytellerTurns(updatedProcessedAllTurns);
            setStorytellerTurns(updatedStorytellerTurns);

            if (titleQueryParam && data.id && data.storyTitle && router.query.title) {
                const newQuery = { ...router.query };
                delete newQuery.title;
                router.replace({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
            }
            if (updatedStorytellerTurns.length > 0) {
                setCurrentStorytellerTurnIndex(updatedStorytellerTurns.length - 1);
            }
            setPromptForChatInput(getChatInputPrompt(updatedProcessedAllTurns, false));
            setAnimatingOut(true);
            setTimeout(() => {
                setUserInput('');
                setCurrentView('storyDisplay');
                setAnimatingOut(false);
            }, 300);
        } catch (err) {
            console.error("Failed to submit story turn:", err);
            if(err.message !== 'Authorization failed.') setError(err.message || "Could not submit your turn.");
        } finally {
            if (currentView !== 'storyDisplay') setIsSubmitting(false); // Only if not transitioning
        }
    };
    useEffect(() => {
        if (currentView === 'storyDisplay' && !animatingOut && isSubmitting) {
            setIsSubmitting(false);
        }
    }, [currentView, animatingOut, isSubmitting]);

    const handlePrevTurn = () => setCurrentStorytellerTurnIndex(prev => Math.max(0, prev - 1));
    const handleNextTurn = () => setCurrentStorytellerTurnIndex(prev => Math.min(storytellerTurns.length - 1, prev + 1));

    const pageContainerHeight = `calc(100vh - ${headerHeight}px - ${footerHeight}px)`;

    if (isAuthLoading || isLoadingPage) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: pageContainerHeight, bgcolor: theme.palette.background.default }}>
                <CircularProgress color="primary"/>
                <Typography sx={{ml: 2, color: theme.palette.text.secondary }}>Loading Ki Storygen...</Typography> {/* Updated text & color */}
            </Box>
        );
    }
    if (!isAuthenticated) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: pageContainerHeight, bgcolor: theme.palette.background.default }}>
                <Typography sx={{ml: 2, color: theme.palette.text.secondary }}>Please log in to join the story.</Typography>
            </Box>
        );
    }

    const pageStyles = {
        display: 'flex',
        flexDirection: 'column',
        height: pageContainerHeight,
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        px: { xs: 1, sm: 2 },  // Horizontal padding remains
        overflow: 'scroll',
        position: 'relative'
    };

    const canSubmitNewTurnOverall = !currentStoryId || storytellerTurns.length === 0 || !titleQueryParam;

    return (
        <>
            <Head>
                <title>{storyTitle || "Ki Storygen"} - Musings</title> {/* Updated title */}
                <meta name="description" content="Interactive AI storytelling with Ki Storygen on Musings." />
                <meta name="robots" content="noindex" />
            </Head>
            <Box sx={pageStyles}>
                {error && (
                    <Alert
                        severity="error"
                        sx={{position: 'absolute', top: theme.spacing(1), left: theme.spacing(1), right: theme.spacing(1), zIndex: 1000, boxShadow: 3}}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}

                {currentView === 'chatInput' && (
                    <ChatView
                        inProp={currentView === 'chatInput' && !animatingOut}
                        promptForChatInput={promptForChatInput}
                        allChatTurns={allChatTurns}
                        userInput={userInput}
                        handleInputChange={handleInputChange}
                        handleSubmitTurn={handleSubmitTurn}
                        handleTransitionToStoryDisplay={handleTransitionToStoryDisplay}
                        isSubmitting={isSubmitting}
                        chatInputRef={chatInputRef}
                        chatHistoryRef={chatHistoryRef}
                        storytellerTurns={storytellerTurns}
                        canSubmitNewTurnOverall={canSubmitNewTurnOverall}
                        user={user}
                        storyTitle={storyTitle}
                        titleQueryParam={titleQueryParam}
                    />
                )}

                {currentView === 'storyDisplay' && (
                    <StoryDisplayView
                        inProp={currentView === 'storyDisplay' && !animatingOut}
                        storyTitle={storyTitle}
                        editableStoryTitle={editableStoryTitle}
                        setEditableStoryTitle={setEditableStoryTitle}
                        isEditingTitle={isEditingTitle}
                        handleTitleEditStart={handleTitleEditStart}
                        handleTitleEditSave={handleTitleEditSave}
                        handleTitleEditCancel={handleTitleEditCancel}
                        titleEditInputRef={titleEditInputRef}
                        displayedImage={displayedImage}
                        storytellerTurns={storytellerTurns}
                        currentStorytellerTurnIndex={currentStorytellerTurnIndex}
                        handlePrevTurn={handlePrevTurn}
                        handleNextTurn={handleNextTurn}
                        storyTextRef={storyTextRef}
                        displayedStoryText={displayedStoryText}
                        handleTransitionToChat={handleTransitionToChat}
                        promptForNextTurnButton={promptForNextTurnButton}
                        canSubmitNewTurnOverall={canSubmitNewTurnOverall}
                        currentStoryId={currentStoryId}
                        isLoadingPage={isLoadingPage}
                        titleQueryParam={titleQueryParam}
                        isSubmitting={isSubmitting}
                    />
                )}
            </Box>
        </>
    );
}