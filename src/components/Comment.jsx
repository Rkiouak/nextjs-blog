// src/components/Comment.jsx
import React from 'react';
import { Box, Typography, Paper, Avatar, Grid } from '@mui/material';
import { format } from 'date-fns'; // Using date-fns for date formatting

function Comment({ comment }) {
    if (!comment) {
        return null;
    }

    // Fallback for author name if not available
    const authorName = comment.author || 'Anonymous';
    const avatarText = authorName.substring(0, 1).toUpperCase();

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                mb: 2, // Margin bottom for spacing between comments
                backgroundColor: (theme) =>
                    theme.palette.mode === 'light' ? 'grey.50' : 'grey.800',
            }}
        >
            <Grid container wrap="nowrap" spacing={2}>
                <Grid item>
                    {/* You can replace Avatar with an actual image if you have user avatars */}
                    <Avatar sx={{ bgcolor: 'primary.main' }}>{avatarText}</Avatar>
                </Grid>
                <Grid item xs>
                    <Typography variant="subtitle2" component="div" gutterBottom>
                        <strong>{authorName}</strong>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                        >
                            {/* Format the date - ensure comment.created_at is a valid date string or timestamp */}
                            {comment.date
                                ? format(new Date(comment.date), 'PPpp')
                                : 'Date unknown'}
                        </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                        {comment.content || 'No content'}
                    </Typography>
                </Grid>
            </Grid>
        </Paper>
    );
}

export default Comment;