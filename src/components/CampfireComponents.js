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
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { DEFAULT_IMAGE_URL, WAITING_FOR_TALE_TEXT } from '@/utils/campfireUtils'; // Adjusted path

export const StoryImageDisplay = ({ src, alt, sx }) => (
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
                             canSubmitNewTurnOverall,
                             user,
                             storyTitle,
                             titleQueryParam,
                         }) => (
    <Slide direction="right" in={inProp} mountOnEnter unmountOnExit timeout={300}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, overflowY: 'auto' }}>
            <Typography variant="h5" sx={{ textAlign: 'center', color: (promptForChatInput || "").includes("opening line") ? '#FFD700' : '#EAEAEA', mb: 1, flexShrink: 0 }}>
                {promptForChatInput}
            </Typography>
            <Paper sx={{ flexGrow: 1, p: 2, overflowY: 'auto', mb: 2, bgcolor: 'rgba(20,20,40,0.8)', border: '1px solid #444' }} ref={chatHistoryRef}>
                {allChatTurns.map((turn, index) => (
                    <Box key={turn.id || `chat-hist-${index}-${Math.random()}`}>
                        {turn.sender === 'Storyteller' && turn.text && (
                            <Typography paragraph sx={{ color: '#F0E68C', mb: 1, whiteSpace: 'pre-wrap' }}>
                                <strong>Storyteller:</strong> {turn.text}
                                {turn.promptForUser && (<em style={{display: 'block', marginTop: '4px', color: '#c0b07c'}}>(Prompt: {turn.promptForUser})</em>)}
                            </Typography>
                        )}
                        {turn.sender === 'User' && turn.text && (
                            <Typography paragraph sx={{ color: '#ADD8E6', mb: 1, whiteSpace: 'pre-wrap' }}>
                                <strong>{user?.username || 'You'}:</strong> {turn.text}
                            </Typography>
                        )}
                    </Box>
                ))}
                {allChatTurns.length === 0 && (
                    <Typography sx={{color: '#aaa', fontStyle: 'italic'}}>
                        {titleQueryParam ? `Loading story: ${storyTitle}...` : WAITING_FOR_TALE_TEXT}
                    </Typography>
                )}
            </Paper>
            <Box component="form" onSubmit={handleSubmitTurn} sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0, mt: 'auto' }}>
                {canSubmitNewTurnOverall && (
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
                        sx={{ bgcolor: 'rgba(50,50,70,0.8)', '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#666' }, '&:hover fieldset': { borderColor: '#888' }, '&.Mui-focused fieldset': { borderColor: '#FFD700' } }, '& .MuiInputBase-input': { color: '#E0E0E0' }}}
                    />
                )}
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
                    {canSubmitNewTurnOverall && (
                        <Button
                            type="submit"
                            variant="contained"
                            endIcon={<SendIcon />}
                            disabled={isSubmitting || !userInput.trim()}
                            sx={{flexGrow: 1, bgcolor: '#FF8C00', '&:hover': {bgcolor: '#FFA500'}}}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit"/> : "Send"}
                        </Button>
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
);

export const StoryDisplayView = ({
                                     inProp,
                                     storyTitle,
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
                                     canSubmitNewTurnOverall,
                                     currentStoryId,
                                     isLoadingPage,
                                     titleQueryParam,
                                 }) => (
    <Slide direction="left" in={inProp} mountOnEnter unmountOnExit timeout={300}>
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
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
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
                </Grid>
                <Grid item size={{xs:12, md:6}} sx={{ display: 'flex', flexDirection: 'column', p: { xs: 0.5, md: 1 }, minWidth: 0, height: '100%'}}>
                    <Paper
                        ref={storyTextRef}
                        component="article"
                        elevation={3}
                        sx={{
                            flexGrow: 1, overflowY: 'auto', p: { xs: 1.5, md: 2 },
                            bgcolor: 'rgba(44, 44, 44, 0.85)', border: '1px solid #555', borderRadius: '8px',
                            color: '#f0f0f0', fontFamily: '"Georgia", "Times New Roman", serif', mb: 2,
                            minHeight: {xs: '150px', md: '200px' }, minWidth: 0, width: '100%'
                        }}
                    >
                        <Typography
                            component="div"
                            sx={{
                                fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                                lineHeight: 1.6, whiteSpace: 'pre-wrap', textAlign: 'left',
                                wordBreak: 'break-word', overflowWrap: 'break-word'
                            }}
                        >
                            {displayedStoryText && displayedStoryText.trim() !== "" ? (
                                displayedStoryText.split('\n').map((paragraph, index, arr) => (
                                    <p key={`${index}-${currentStoryId || 'p'}-${Math.random()}`} style={{ marginBottom: index === arr.length - 1 ? 0 : '15px' }}>
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
                        onClick={handleTransitionToChat}
                        fullWidth
                        sx={{
                            flexShrink: 0, bgcolor: '#FF8C00', '&:hover': { bgcolor: '#FFA500' },
                            fontSize: { xs: '0.85rem', md: '0.95rem' }, p: { xs: 1, md: 1.25 }
                        }}
                        endIcon={<ArrowForwardIcon />}
                        disabled={!!titleQueryParam && !!currentStoryId && storytellerTurns.length > 0}
                    >
                        {!!titleQueryParam && !!currentStoryId && storytellerTurns.length > 0
                            ? "Viewing Past Story"
                            : `And then... (${(promptForNextTurnButton || "What happens next?").substring(0,17)}${(promptForNextTurnButton || "What happens next?").length > 20 ? '...' : ''})`}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    </Slide>
);