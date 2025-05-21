export const DEFAULT_IMAGE_URL = "/campfire.jpeg";
export const DEFAULT_PROMPT_FOR_USER = "What happens next?";
export const DEFAULT_TURN_TEXT = "The story continues...";
export const WAITING_FOR_TALE_TEXT = "The campfire crackles, waiting for a tale...";
export const START_NEW_STORY_PROMPT_INPUT = "Let's start a new story! What's the opening line?";

/**
 * Processes raw chat turns from the API.
 * @param {Array} rawTurns - Array of chat turns from the API.
 * @returns {Array} Processed chat turns.
 */
export const processChatTurns = (rawTurns) => {
    return (Array.isArray(rawTurns) ? rawTurns : []).map((turn, idx) => ({
        id: turn?.id || `turn-${idx}-${Date.now()}`,
        sender: turn?.sender || 'System',
        text: turn?.text || (turn?.sender === 'User' ? 'User input' : DEFAULT_TURN_TEXT),
        imageUrl: turn?.imageUrl || null,
        promptForUser: turn?.promptForUser || null,
    }));
};

/**
 * Filters storyteller turns from all chat turns.
 * @param {Array} allTurns - Array of all processed chat turns.
 * @returns {Array} Filtered storyteller turns.
 */
export const getStorytellerTurns = (allTurns) => {
    return allTurns.filter(turn => turn.sender === "Storyteller");
};

/**
 * Determines the prompt for the chat input based on the last turn.
 * @param {Array} allChatTurns - Array of all processed chat turns.
 * @param {boolean} isNewStory - Whether this is a new story.
 * @returns {string} The prompt for the chat input.
 */
export const getChatInputPrompt = (allChatTurns, isNewStory) => {
    const lastOverallTurn = allChatTurns.length > 0 ? allChatTurns[allChatTurns.length - 1] : null;
    if (lastOverallTurn?.sender === "Storyteller" && lastOverallTurn.promptForUser) {
        return lastOverallTurn.promptForUser;
    }
    if (isNewStory && allChatTurns.length === 0) {
        return START_NEW_STORY_PROMPT_INPUT;
    }
    // Find the most recent storyteller prompt if the last turn wasn't a storyteller with a direct prompt
    const lastStorytellerPrompt = [...allChatTurns].reverse().find(t => t.sender === "Storyteller" && t.promptForUser)?.promptForUser;
    return lastStorytellerPrompt || DEFAULT_PROMPT_FOR_USER;
};

/**
 * Prepares the payload for submitting a new turn.
 * @param {Object} params - Parameters for payload creation.
 * @param {string} params.userInput - The user's input text.
 * @param {Array} params.allChatTurns - All current chat turns.
 * @param {string} params.storyTitle - The current title of the story.
 * @param {string|null} params.currentStoryId - The ID of the current story, if it exists.
 * @returns {Object} The payload for the API.
 */
export const prepareSubmitPayload = ({ userInput, allChatTurns, storyTitle, currentStoryId }) => {
    const lastTurnInAll = allChatTurns.length > 0 ? allChatTurns[allChatTurns.length - 1] : {};
    const payload = {
        previousContent: lastTurnInAll.text || WAITING_FOR_TALE_TEXT,
        inputText: userInput.trim(),
        chatTurns: allChatTurns.map(ct => ({
            id: ct.id,
            sender: ct.sender,
            text: ct.text,
            imageUrl: ct.imageUrl,
            promptForUser: ct.promptForUser,
        })),
        storyTitle: storyTitle.trim() ? storyTitle.trim() : "Untitled Story",
    };

    if (currentStoryId) {
        payload.id = currentStoryId;
    }
    return payload;
};