// src/components/CommentList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Divider,
    Button,
    TextField,
} from '@mui/material';
import Comment from './Comment'; // Import the Comment component
import { useAuth } from '@/context/AuthContext'; // Assuming you might want auth for posting comments

function CommentList({ postId }) {
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { isAuthenticated, token, handleUnauthorized, user } = useAuth(); // Get auth context

    const fetchComments = useCallback(async () => {
        if (!postId) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/comments/`
            );
            if (!response.ok) {
                throw new Error(`Failed to fetch comments: ${response.status}`);
            }
            const data = await response.json();
            setComments(data || []); // Ensure comments is always an array
        } catch (err) {
            console.error('Error fetching comments:', err);
            setError(err.message || 'Could not load comments.');
        } finally {
            setIsLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleCommentSubmit = async (event) => {
        event.preventDefault();
        if (!newComment.trim()) {
            setError('Comment cannot be empty.');
            return;
        }
        if (!isAuthenticated || !token) {
            setError('You must be logged in to post a comment.');
            // Optionally, redirect to login: router.push('/login?from=/post/' + postId);
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/comments/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        content: newComment,
                        // author_name will likely be set by the backend based on the authenticated user
                    }),
                }
            );

            if (response.status === 401 || response.status === 403) {
                handleUnauthorized();
                setError('Authentication failed. Please log in again to comment.');
                setIsSubmitting(false);
                // Optionally redirect: router.push('/login?sessionExpired=true&from=/post/' + postId);
                return;
            }

            if (!response.ok) {
                let errorMsg = `Failed to post comment: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.detail || errorData.message || errorMsg;
                } catch (e) { /* ignore */ }
                throw new Error(errorMsg);
            }

            // const postedComment = await response.json(); // Get the newly posted comment
            setNewComment(''); // Clear the input field
            fetchComments(); // Refresh the comments list
        } catch (err) {
            console.error('Error posting comment:', err);
            setError(err.message || 'Could not post comment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                Comments
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Form to Add New Comment (Only if authenticated) */}
            {isAuthenticated && (
                <Box
                    component="form"
                    onSubmit={handleCommentSubmit}
                    sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        variant="outlined"
                        sx={{ mb: 1 }}
                        disabled={isSubmitting}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting || !newComment.trim()}
                    >
                        {isSubmitting ? <CircularProgress size={24} /> : 'Post Comment'}
                    </Button>
                </Box>
            )}
            {!isAuthenticated && (
                <Alert severity="info" sx={{mb: 2}}>
                    Please <a href={`/login?from=/post/${postId}`} style={{fontWeight: 'bold'}}>login</a> to post a comment.
                </Alert>
            )}


            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress />
                </Box>
            )}
            {error && (
                <Alert severity="error" sx={{ my: 2 }}>
                    {error}
                </Alert>
            )}
            {!isLoading && !error && comments.length === 0 && (
                <Typography color="text.secondary">
                    No comments yet. Be the first to comment!
                </Typography>
            )}
            {!isLoading && !error && comments.length > 0 && (
                <Box>
                    {comments.map((comment) => (
                        <Comment key={comment.id || comment.temp_id} comment={comment} /> // Use a stable key
                    ))}
                </Box>
            )}
        </Box>
    );
}

export default CommentList;