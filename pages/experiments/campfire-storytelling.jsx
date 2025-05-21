import React, { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    useTheme,
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import {
    DEFAULT_PROMPT_FOR_USER,
    WAITING_FOR_TALE_TEXT,
    START_NEW_STORY_PROMPT_INPUT,
    processChatTurns,
    getStorytellerTurns,
    getChatInputPrompt,
    prepareSubmitPayload,
    DEFAULT_IMAGE_URL,
    DEFAULT_TURN_TEXT
} from '@/utils/campfireUtils';
import { ChatView, StoryDisplayView } from '@/components/CampfireComponents';

export default function CampfireStorytellingPage() {
    const router = useRouter();
    const theme = useTheme();
    const { isAuthenticated, isLoading: isAuthLoading, user, token } = useAuth();

    const { title: titleQueryParam } = router.query;

    const [currentView, setCurrentView] = useState('storyDisplay');
    const [animatingOut, setAnimatingOut] = useState(false);

    // Story and Turn Management State
    const [currentStoryId, setCurrentStoryId] = useState(null);
    const [storyTitle, setStoryTitle] = useState(titleQueryParam || 'A New Campfire Tale');
    const [editableStoryTitle, setEditableStoryTitle] = useState(titleQueryParam || 'A New Campfire Tale');
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    // For StoryDisplay View
    const [displayedStoryText, setDisplayedStoryText] = useState(WAITING_FOR_TALE_TEXT);
    const [displayedImage, setDisplayedImage] = useState(DEFAULT_IMAGE_URL);
    const [promptForNextTurnButton, setPromptForNextTurnButton] = useState(DEFAULT_PROMPT_FOR_USER);

    // For ChatInput View
    const [userInput, setUserInput] = useState('');
    const [allChatTurns, setAllChatTurns] = useState([]); // Holds all turns (User and Storyteller)
    const [storytellerTurns, setStorytellerTurns] = useState([]); // Just storyteller turns for navigation
    const [currentStorytellerTurnIndex, setCurrentStorytellerTurnIndex] = useState(0);
    const [promptForChatInput, setPromptForChatInput] = useState(START_NEW_STORY_PROMPT_INPUT);

    // UI State
    const [isLoadingPage, setIsLoadingPage] = useState(true); // For initial data load
    const [isSubmitting, setIsSubmitting] = useState(false); // For turn submission
    const [error, setError] = useState('');

    // Refs
    const chatInputRef = useRef(null);
    const chatHistoryRef = useRef(null); // For scrolling chat
    const storyTextRef = useRef(null); // For scrolling story text
    const titleEditInputRef = useRef(null);


    const BASE_API_ENDPOINT = '/api/experiments/campfire'; // Or process.env.NEXT_PUBLIC_CAMPFIRE_API_URL
    const headerHeight = theme.mixins?.toolbar?.minHeight || 64;
    const footerHeight = 57;

    // Effect to update story title from query param
    useEffect(() => {
        if (router.isReady) {
            const newTitle = titleQueryParam || "A New Campfire Tale";
            setStoryTitle(newTitle);
            setEditableStoryTitle(newTitle);
            if (!titleQueryParam) {
                // If there's no title query param, it implies a new or ongoing session,
                // not fetching a specific past story by title initially.
                // This code should probably never be reached.
                setCurrentStoryId(null);
            }
        }
    }, [titleQueryParam, router.isReady]);


    // Update displayed storyteller turn content
    const updateDisplayedStorytellerTurn = useCallback((index, currentStorytellerTurns) => {
        if (currentStorytellerTurns?.length > 0 && index >= 0 && index < currentStorytellerTurns.length) {
            const turn = currentStorytellerTurns[index] || {};
            setDisplayedStoryText(turn.text || DEFAULT_TURN_TEXT);
            setDisplayedImage(turn.imageUrl || DEFAULT_IMAGE_URL);
            setPromptForNextTurnButton(turn.promptForUser || DEFAULT_PROMPT_FOR_USER);
        } else {
            // Default state if no storyteller turns or index is out of bounds
            setDisplayedStoryText(WAITING_FOR_TALE_TEXT);
            setDisplayedImage(DEFAULT_IMAGE_URL);
            setPromptForNextTurnButton(DEFAULT_PROMPT_FOR_USER);
            // If it's a new story (no title query param), set initial chat prompt.
            if (!titleQueryParam) {
                setPromptForChatInput(START_NEW_STORY_PROMPT_INPUT);
            }
        }
    }, [titleQueryParam]); // titleQueryParam helps differentiate new vs existing story loading

    // Initial data fetching logic
    const fetchInitialData = useCallback(async (currentStoryTitleFromQuery) => {
        if (!token || !isAuthenticated) {
            setIsLoadingPage(false);
            return;
        }
        setIsLoadingPage(true);
        setError('');
        setCurrentStoryId(null); // Reset story ID before fetch

        let endpoint = BASE_API_ENDPOINT;
        // If a title is provided (viewing a specific past story), append it
        if (currentStoryTitleFromQuery) {
            endpoint = `${BASE_API_ENDPOINT}?title=${encodeURIComponent(currentStoryTitleFromQuery)}`;
        }
        // If no title, it will fetch the user's latest ongoing story or start a new session context

        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({})); // Gracefully handle non-JSON error response
                throw new Error(errData.detail || `Error fetching story: ${response.statusText}`);
            }

            const data = await response.json() || {}; // Ensure data is an object

            setCurrentStoryId(data.id || null); // Set the story ID if present (new or existing)

            const processedTurns = processChatTurns(data.chatTurns);
            setAllChatTurns(processedTurns);

            const currentStorytellerTurns = getStorytellerTurns(processedTurns);
            setStorytellerTurns(currentStorytellerTurns);

            const effectiveTitle = data.storyTitle || currentStoryTitleFromQuery || "A New Campfire Tale";
            setStoryTitle(effectiveTitle);
            setEditableStoryTitle(effectiveTitle);


            if (currentStorytellerTurns.length > 0) {
                setCurrentStorytellerTurnIndex(currentStorytellerTurns.length - 1);
            } else {
                // No storyteller turns yet, set display to default waiting state.
                updateDisplayedStorytellerTurn(0, []); // Pass empty array to trigger default
            }

            // Determine the next prompt for the chat input
            const isNewStorySession = !currentStoryTitleFromQuery && !data.id; // Heuristic for a new story
            setPromptForChatInput(getChatInputPrompt(processedTurns, isNewStorySession));


            // Decide initial view: If loading a specific past story, or if there's content for an ongoing story, show story display.
            // Otherwise (new story, no turns yet), go to chat input.
            if (currentStoryTitleFromQuery || (data.id && currentStorytellerTurns.length > 0) || (data.hasActiveSessionToday && currentStorytellerTurns.length > 0) ) {
                setCurrentView('storyDisplay');
            } else {
                setCurrentView('chatInput');
                setTimeout(() => chatInputRef.current?.focus(), 0); // Focus input after view transition
            }

        } catch (err) {
            console.error("Failed to fetch initial story data:", err);
            setError(err.message || "Could not load the story.");
            updateDisplayedStorytellerTurn(0, []); // Reset to default on error
            setPromptForChatInput(START_NEW_STORY_PROMPT_INPUT); // Reset prompt
        } finally {
            setIsLoadingPage(false);
        }
    }, [token, isAuthenticated, updateDisplayedStorytellerTurn]);


    // Auth check and initial data load trigger
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            const fromPath = titleQueryParam ? `/experiments/campfire-storytelling?title=${titleQueryParam}` : '/experiments/campfire-storytelling';
            router.push(`/login?from=${encodeURIComponent(fromPath)}`);
        } else if (isAuthenticated && token && router.isReady) {
            // router.isReady ensures query params like titleQueryParam are available
            fetchInitialData(titleQueryParam);
        } else if (!isAuthLoading && !token) {
            // If auth is loaded but no token (e.g., logged out), stop loading indicator.
            setIsLoadingPage(false);
        }
    }, [isAuthenticated, isAuthLoading, router.isReady, titleQueryParam, token, fetchInitialData, router]);


    // Update displayed turn when index or storytellerTurns change
    useEffect(() => {
        updateDisplayedStorytellerTurn(currentStorytellerTurnIndex, storytellerTurns);
    }, [currentStorytellerTurnIndex, storytellerTurns, updateDisplayedStorytellerTurn]);

    // Scroll chat/story text to bottom
    useEffect(() => {
        if (chatHistoryRef.current && currentView === 'chatInput') {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [allChatTurns, currentView]); // Trigger on allChatTurns change when in chat view

    useEffect(() => {
        if (storyTextRef.current && currentView === 'storyDisplay') {
            storyTextRef.current.scrollTop = storyTextRef.current.scrollHeight;
        }
    }, [displayedStoryText, currentView]); // Trigger on displayedStoryText change when in story view


    const handleInputChange = (event) => setUserInput(event.target.value);

    // --- View Transition Handlers ---
    const handleTransitionToChat = () => {
        setAnimatingOut(true);
        // Determine the prompt before switching
        const currentStorytellerTurn = storytellerTurns[currentStorytellerTurnIndex];
        const nextPrompt = currentStorytellerTurn?.promptForUser ||
            [...allChatTurns].reverse().find(t => t.sender === "Storyteller" && t.promptForUser)?.promptForUser ||
            DEFAULT_PROMPT_FOR_USER;
        setPromptForChatInput(nextPrompt);
        setTimeout(() => {
            setCurrentView('chatInput');
            setAnimatingOut(false);
            setTimeout(() => chatInputRef.current?.focus(), 0); // Focus after animation
        }, 300); // Corresponds to Slide timeout
    };

    const handleTransitionToStoryDisplay = () => {
        if (storytellerTurns.length > 0) {
            setAnimatingOut(true);
            // If it's an ongoing story (no title query, or story ID exists without title query)
            // and we are transitioning from chat, ensure we show the *latest* storyteller turn.
            if (!titleQueryParam && !currentStoryId) { // Heuristic: if no title in query, it's the "live" session
                setCurrentStorytellerTurnIndex(storytellerTurns.length - 1);
            }
            // If titleQueryParam is set, currentStorytellerTurnIndex should already be 0 (or user navigated)
            setTimeout(() => {
                setCurrentView('storyDisplay');
                setAnimatingOut(false);
            }, 300);
        } else {
            setError("There are no story parts to display yet.");
        }
    };

    // --- Title Edit Handlers ---
    const handleTitleEditStart = () => {
        setEditableStoryTitle(storyTitle); // Initialize with current title
        setIsEditingTitle(true);
        setTimeout(() => titleEditInputRef.current?.focus(), 0);
    };

    const handleTitleEditSave = () => {
        const trimmedTitle = editableStoryTitle.trim();
        if (trimmedTitle) {
            setStoryTitle(trimmedTitle);
            // TODO: If currentStoryId exists, consider an API call to update the story title on the backend
            if (currentStoryId) {
                console.log("Title changed for story ID:", currentStoryId, "to:", trimmedTitle, "(Backend update for title not implemented in this step)");
                // Example: updateStoryTitleOnBackend(currentStoryId, trimmedTitle);
            }
        }
        setIsEditingTitle(false);
    };

    const handleTitleEditCancel = () => {
        setIsEditingTitle(false);
        setEditableStoryTitle(storyTitle); // Reset to original if cancelled
    };


    // --- Turn Submission Logic ---
    const handleSubmitTurn = async (event) => {
        event.preventDefault();
        if (!userInput.trim() || !token) {
            setError(!token ? "You must be logged in to continue the story." : "Input cannot be empty.");
            return;
        }

        // Prevent adding turns if viewing a specific past story via title query param
        if (titleQueryParam && currentStoryId && storytellerTurns.length > 0) {
            setError("You are viewing a specific past story. New turns can be added to the ongoing untitled story or by starting a new one from the experiments page.");
            return;
        }


        setIsSubmitting(true);
        setError('');

        const payload = prepareSubmitPayload({
            userInput,
            allChatTurns,
            storyTitle,
            currentStoryId
        });

        try {
            const response = await fetch(BASE_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorDetail = `Error submitting turn: ${response.status}`;
                if (response.status === 401 || response.status === 403) {
                    errorDetail = "Session expired or unauthorized. Please log in again.";
                    // Potentially call a global logout/redirect handler from AuthContext here
                    // auth.handleUnauthorized(); // If you have one
                    router.push('/login?sessionExpired=true');
                } else {
                    try {
                        const errData = await response.json();
                        errorDetail = errData?.detail || errorDetail;
                    } catch (e) { /* ignore if error response isn't JSON */ }
                }
                throw new Error(errorDetail);
            }

            const data = await response.json() || {};

            // Update story ID if a new story was created
            if (data.id && !currentStoryId) {
                setCurrentStoryId(data.id);
            }
            // Update story title if the backend modified or assigned it
            if (data.storyTitle) {
                setStoryTitle(data.storyTitle);
                setEditableStoryTitle(data.storyTitle); // Keep editable title in sync
            }


            const updatedProcessedAllTurns = processChatTurns(data.chatTurns);
            setAllChatTurns(updatedProcessedAllTurns);

            const updatedStorytellerTurns = getStorytellerTurns(updatedProcessedAllTurns);
            setStorytellerTurns(updatedStorytellerTurns);

            // If a new story was just started (no title in query, but now we have an ID and title from backend),
            // remove the "title" query param if the user somehow navigated back to add a turn to a "named" story that was actually new.
            // This is a bit of an edge case cleanup.
            if (titleQueryParam && data.id && data.storyTitle && router.query.title) {
                const newQuery = { ...router.query };
                delete newQuery.title; // Remove the title param as it's now an ongoing story
                router.replace({
                    pathname: router.pathname,
                    query: newQuery,
                }, undefined, { shallow: true });
            }


            // Set index to the latest storyteller turn
            if (updatedStorytellerTurns.length > 0) {
                setCurrentStorytellerTurnIndex(updatedStorytellerTurns.length - 1);
            }

            // Update prompt for the next chat input based on the new turns
            setPromptForChatInput(getChatInputPrompt(updatedProcessedAllTurns, false)); // false because it's not a "new" story anymore

            // Transition to story display view
            setAnimatingOut(true);
            setTimeout(() => {
                setUserInput(''); // Clear input after successful submission
                setCurrentView('storyDisplay');
                setAnimatingOut(false);
            }, 300);


        } catch (err) {
            console.error("Failed to submit story turn:", err);
            setError(err.message || "Could not submit your turn. Please try again.");
        } finally {
            setIsSubmitting(false); // Only set if not transitioning on success
        }
    };

    // Reset isSubmitting if view changes away from chat while it was true (e.g., error, manual navigation)
    // This was causing issues with the story display button remaining disabled.
    useEffect(() => {
        if (currentView === 'storyDisplay' && !animatingOut && isSubmitting) {
            setIsSubmitting(false);
        }
    }, [currentView, animatingOut, isSubmitting]);


    // Navigation for storyteller turns
    const handlePrevTurn = () => setCurrentStorytellerTurnIndex(prev => Math.max(0, prev - 1));
    const handleNextTurn = () => setCurrentStorytellerTurnIndex(prev => Math.min(storytellerTurns.length - 1, prev + 1));

    // --- Page Layout and Render ---
    const pageContainerHeight = `calc(100vh - ${headerHeight}px - ${footerHeight}px)`;

    // Loading and Auth States
    if (isAuthLoading || isLoadingPage) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: pageContainerHeight, bgcolor: '#0A0A23', color: '#E0E0E0' }}>
                <CircularProgress color="inherit"/>
                <Typography sx={{ml: 2}}>Warming up the campfire...</Typography>
            </Box>
        );
    }
    if (!isAuthenticated) { // Should be handled by useEffect redirect, but as a fallback
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: pageContainerHeight, bgcolor: '#0A0A23', color: '#E0E0E0' }}>
                <Typography sx={{ml: 2}}>Please log in to join the story.</Typography>
            </Box>
        );
    }

    const pageStyles = {
        display: 'flex', flexDirection: 'column', height: pageContainerHeight,
        bgcolor: '#0A0A23', color: '#EAEAEA',
        p: { xs: 1, sm: 2 }, overflow: 'hidden', position: 'relative'
    };

    // Determine if user can submit a new turn. They cannot if they are viewing a specific, named past story.
    const canSubmitNewTurnOverall = !currentStoryId || storytellerTurns.length === 0 || !titleQueryParam;


    return (
        <>
            <Head>
                <title>{storyTitle || "Campfire Story"} - Musings</title>
                <meta name="description" content="Interactive campfire storytelling experiment on Musings." />
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
                    />
                )}
            </Box>
        </>
    );
}