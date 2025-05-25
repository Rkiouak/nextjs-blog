// src/components/CampfireComponents.js
import React from 'react';
import {
    Box,
    Grid,
    Typography,
    TextField,
    Button,
    Paper,
    IconButton,
    Tooltip,
    CircularProgress,
    Slide,
    useTheme,
    alpha,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddCommentIcon from '@mui/icons-material/AddComment';
import PublicIcon from '@mui/icons-material/Public';
import { DEFAULT_IMAGE_URL, WAITING_FOR_TALE_TEXT } from '@/utils/campfireUtils';

export const StoryImageDisplay = ({ src, alt, sx }) => (
    <Box
        component="img"
        src={src || DEFAULT_IMAGE_URL}
        alt={alt || "Ki Storygen Scene"}
        sx={{
            display: 'block', maxWidth: '100%', maxHeight: '100%',
            width: 'auto', height: 'auto', objectFit: 'contain', m: 'auto',
            borderRadius: 1,
            ...sx,
        }}
    />
);

export const ChatView = ({
                             inProp,
                             promptForChatInput,
                             allChatTurns,
                             userInput,
                             handleInputChange,
                             handleSubmitTurn,
                             handleTransitionToStoryDisplay,
                             isSubmitting,
                             chatInputRef,
                             chatHistoryRef,
                             storytellerTurns,
                             user,
                             storyTitle,
                             titleQueryParam,
                         }) => {
    const theme = useTheme();

    return (
        <Slide direction="right" in={inProp} mountOnEnter unmountOnExit timeout={300}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 1, sm: 1.5 } }}>
                <Paper
                    elevation={0}
                    sx={{
                        flexGrow: 1,
                        p: {xs: 1, sm: 2},
                        overflowY: 'auto',
                        mb: 2,
                        bgcolor: theme.palette.background.default,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: theme.shape.borderRadius,
                    }}
                    ref={chatHistoryRef}
                >
                    {allChatTurns.map((turn, index) => (
                        <Box
                            key={turn.id || `chat-hist-${index}-${Math.random()}`}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: turn.sender === 'User' ? 'flex-end' : 'flex-start',
                                mb: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    p: theme.spacing(1.25, 2),
                                    borderRadius: theme.shape.borderRadius * 2.5,
                                    maxWidth: '85%',
                                    bgcolor: turn.sender === 'User'
                                        ? alpha(theme.palette.primary.main, 0.12)
                                        : alpha(theme.palette.secondary.main, 0.12),
                                    border: `1px solid ${turn.sender === 'User' ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.secondary.main, 0.3)}`,
                                    boxShadow: theme.shadows[1],
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    component="div"
                                    sx={{
                                        fontWeight: 'bold',
                                        color: turn.sender === 'User' ? theme.palette.primary.dark : theme.palette.text.primary,
                                        mb: 0.5,
                                    }}
                                >
                                    {turn.sender === 'User' ?  (user?.username || 'You') : 'Ki Storygen'}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: theme.palette.text.primary,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {turn.text}
                                </Typography>
                                {turn.sender === 'Storyteller' && turn.promptForUser && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            mt: 1,
                                            color: theme.palette.text.secondary,
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        (Prompt: {turn.promptForUser})
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    ))}
                    {allChatTurns.length === 0 && (
                        <Typography sx={{color: theme.palette.text.secondary, fontStyle: 'italic', textAlign: 'center', py: 2}}>
                            {titleQueryParam ? `Loading story: ${storyTitle}...` : WAITING_FOR_TALE_TEXT}
                        </Typography>
                    )}
                </Paper>
                <Box component="form" onSubmit={handleSubmitTurn} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flexShrink: 0, mt: 'auto' }}>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            color: theme.palette.primary.dark,
                            mb: 1,
                            px: 0.5,
                            fontWeight: 'medium',
                            textAlign: 'left',
                        }}
                    >
                        {promptForChatInput}
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        variant="outlined"
                        placeholder="What happens next?"
                        value={userInput}
                        onChange={handleInputChange}
                        inputRef={chatInputRef}
                        disabled={isSubmitting}
                        sx={{ bgcolor: theme.palette.background.paper }}
                    />
                    <Box sx={{display: 'flex', gap: 1.5}}>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<MenuBookIcon />}
                            onClick={handleTransitionToStoryDisplay}
                            disabled={storytellerTurns.length === 0 || isSubmitting}
                            sx={{ flexGrow: 1 }}
                        >
                            View Story
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="secondary"
                            endIcon={<SendIcon />}
                            disabled={isSubmitting || !userInput.trim()}
                            sx={{flexGrow: 1}}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit"/> : "Send"}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Slide>
    );
};


export const StoryDisplayView = ({
                                     inProp,
                                     storyTitle, // Keep storyTitle prop
                                     editableStoryTitle,
                                     setEditableStoryTitle,
                                     isEditingTitle,
                                     handleTitleEditStart,
                                     handleTitleEditSave,
                                     handleTitleEditCancel,
                                     titleEditInputRef,
                                     displayedImage,
                                     storytellerTurns,
                                     currentStorytellerTurnIndex,
                                     handlePrevTurn,
                                     handleNextTurn,
                                     storyTextRef,
                                     displayedStoryText,
                                     handleTransitionToChat,
                                     promptForNextTurnButton,
                                     // currentStoryId, // No longer primary for this button's logic
                                     isLoadingPage,
                                     titleQueryParam,
                                     isSubmitting,
                                     isStoryPublic,
                                     onOpenMakePublicDialog,
                                     isMakePublicDialogOpen,
                                     onCloseMakePublicDialog,
                                     onConfirmMakePublic,
                                     isMakingPublic,
                                 }) => {
    const theme = useTheme();
    const canEditTitleCurrentStory = !isStoryPublic;

    // Determine if any icon will be shown to the right of the title
    const showEditIcon = canEditTitleCurrentStory;
    const showMakePublicIcon = storyTitle && storyTitle.trim() !== "" && storyTitle.trim() !== "New Ki Story" && !isStoryPublic;
    const showIsPublicIcon = storyTitle && storyTitle.trim() !== "" && storyTitle.trim() !== "New Ki Story" && isStoryPublic;
    const anyRightIconVisible = showEditIcon || showMakePublicIcon || showIsPublicIcon;


    return (
        <Slide direction="left" in={inProp} mountOnEnter unmountOnExit timeout={300}>
            <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: {xs: 0.5, sm: 1} }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pt: 0.5,
                    pb: 1.5,
                    mb: 1.5,
                    flexShrink: 0,
                    minHeight: '56px',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    position: 'relative',
                }}>
                    <Box
                        component="img"
                        src="/ki-storygen-logo.png"
                        alt="Ki Storygen"
                        sx={{ height: {xs:32, sm:40}, width: {xs:32, sm:40}, mr: 1.5, borderRadius:'50%', objectFit:'contain' }}
                    />
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
                                    '& .MuiInputBase-input': { color: theme.palette.primary.dark, fontSize: { xs: '1.3rem', md: '1.75rem' } },
                                }}
                                disabled={isStoryPublic}
                            />
                            <Tooltip title="Save Title"><IconButton onClick={handleTitleEditSave} sx={{ color: theme.palette.success.main }}><SaveIcon /></IconButton></Tooltip>
                            <Tooltip title="Cancel Edit"><IconButton onClick={handleTitleEditCancel} sx={{ color: theme.palette.error.main }}><CancelIcon /></IconButton></Tooltip>
                        </>
                    ) : (
                        <>
                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{
                                    textAlign: 'center',
                                    color: theme.palette.text.primary,
                                    fontSize: { xs: '1.5rem', md: '2rem' },
                                    flexGrow: 1,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    cursor: canEditTitleCurrentStory ? 'pointer' : 'default',
                                    '&:hover': { opacity: canEditTitleCurrentStory ? 0.8 : 1 },
                                    pr: anyRightIconVisible ? {xs: 6, sm: 8} : 0,
                                }}
                                onClick={canEditTitleCurrentStory ? handleTitleEditStart : undefined}
                            >
                                {storyTitle || "Ki Story"}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', position: 'absolute', right: theme.spacing(1)}}>
                                {canEditTitleCurrentStory && (
                                    <Tooltip title="Edit Story Title">
                                        <IconButton onClick={handleTitleEditStart} sx={{ color: theme.palette.text.secondary }} size="small">
                                            <EditIcon fontSize="inherit" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {/* Make Public button logic: show if storyTitle is meaningful and not public */}
                                {storyTitle && storyTitle.trim() !== "" && storyTitle.trim() !== "New Ki Story" && !isStoryPublic && (
                                    <Tooltip title="Make Story Public">
                                        <IconButton
                                            onClick={onOpenMakePublicDialog}
                                            sx={{ color: theme.palette.info.main, ml: canEditTitleCurrentStory ? 0.5 : 0 }}
                                            size="small"
                                            disabled={isMakingPublic}
                                        >
                                            <PublicIcon fontSize="inherit" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {storyTitle && storyTitle.trim() !== "" && storyTitle.trim() !== "New Ki Story" && isStoryPublic && (
                                    <Tooltip title="Story is Public">
                                        <PublicIcon fontSize="inherit" sx={{ color: theme.palette.success.main, ml: 0.5, cursor: 'default' }} />
                                    </Tooltip>
                                )}
                            </Box>
                        </>
                    )}
                </Box>

                <Grid container spacing={{xs: 1, sm:2}} sx={{ flexGrow: 1, overflowY: 'scroll', minHeight: 0 }}>
                    <Grid item size={{ xs:12, md:7 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 0.5, md: 1 }}}>
                        <Paper
                            elevation={3}
                            sx={{
                                width: '100%',
                                flexGrow: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow:'hidden',
                                mb: { xs: 1, md: 0 },
                                p: 1.5,
                                bgcolor: theme.palette.background.default,
                            }}
                        >
                            <StoryImageDisplay src={displayedImage} alt="Current story scene" />
                        </Paper>
                        {storytellerTurns?.length > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, width: '100%', flexShrink:0 }}>
                                <IconButton onClick={handlePrevTurn} disabled={currentStorytellerTurnIndex === 0} color="primary">
                                    <ArrowBackIcon />
                                </IconButton>
                                <Typography variant="caption" color="text.secondary">
                                    Turn {currentStorytellerTurnIndex + 1} of {storytellerTurns.length}
                                </Typography>
                                <IconButton onClick={handleNextTurn} disabled={currentStorytellerTurnIndex >= storytellerTurns.length - 1} color="primary">
                                    <ArrowForwardIcon />
                                </IconButton>
                            </Box>
                        )}
                    </Grid>
                    <Grid item size={{ xs:12, md:5 }} sx={{ display: 'flex', flexDirection: 'column', p: { xs: 0.5, md: 1 }, minWidth: 0, height: '100%'}}>
                        <Paper
                            ref={storyTextRef}
                            component="article"
                            elevation={3}
                            sx={{
                                flexGrow: 1, overflowY: 'auto', p: { xs: 1.5, md: 2.5 },
                                bgcolor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                color: theme.palette.text.primary,
                                fontFamily: theme.typography.fontFamily,
                                mb: 2,
                                minHeight: {xs: '150px', md: '200px' }, width: '100%'
                            }}
                        >
                            <Typography
                                component="div"
                                sx={{
                                    fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                                    lineHeight: 1.7, whiteSpace: 'pre-wrap', textAlign: 'left',
                                    wordBreak: 'break-word', overflowWrap: 'break-word'
                                }}
                            >
                                {displayedStoryText && displayedStoryText.trim() !== "" ? (
                                    displayedStoryText.split('\n').map((paragraph, index, arr) => (
                                        <p key={`${index}-${storyTitle}-${Math.random()}`} style={{ marginBottom: index === arr.length - 1 ? 0 : '1em' }}>
                                            {paragraph}
                                        </p>
                                    ))
                                ) : (
                                    <p>{isLoadingPage ? "Loading story..." : WAITING_FOR_TALE_TEXT}</p>
                                )}
                            </Typography>
                        </Paper>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleTransitionToChat}
                            fullWidth
                            sx={{
                                flexShrink: 0,
                                fontSize: { xs: '0.85rem', md: '0.95rem' }, p: { xs: 1, md: 1.25 }
                            }}
                            disabled={(!!titleQueryParam && storytellerTurns.length > 0 && storytellerTurns[currentStorytellerTurnIndex]?.promptForUser === null) || isSubmitting }
                        >
                            {(!!titleQueryParam && storytellerTurns.length > 0 && storytellerTurns[currentStorytellerTurnIndex]?.promptForUser === null)
                                ? "Viewing Past Story (End)"
                                : `Continue... (${(promptForNextTurnButton || "What's next?").substring(0,20)}${(promptForNextTurnButton || "What's next?").length > 20 ? '...' : ''})`}
                        </Button>
                    </Grid>
                </Grid>

                <Dialog
                    open={isMakePublicDialogOpen}
                    onClose={onCloseMakePublicDialog}
                    aria-labelledby="make-public-dialog-title"
                    aria-describedby="make-public-dialog-description"
                >
                    <DialogTitle id="make-public-dialog-title">Make Story Public?</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="make-public-dialog-description">
                            Are you sure you want to make this story public?
                            <br /><br />
                            Once public, the story title, the generated story content, and associated images will be visible to everyone.
                            Your prompts (the text you type to guide the story) will <strong>not</strong> be made public.
                            <br /><br />
                            This action cannot be undone through this interface.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onCloseMakePublicDialog} color="primary" disabled={isMakingPublic}>
                            Cancel
                        </Button>
                        <Button onClick={onConfirmMakePublic} color="secondary" variant="contained" disabled={isMakingPublic}>
                            {isMakingPublic ? <CircularProgress size={24} color="inherit" /> : "Make Public"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Slide>
    );
};