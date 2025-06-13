import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head'; // Import Next.js Head for metadata
import { useRouter } from 'next/router'; // Import Next.js router
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Switch,
    FormControlLabel,
    Input, // Using Input for file upload styling flexibility
} from '@mui/material';
import ReactMarkdown from 'react-markdown'; // For preview

import { useAuth } from '@/context/AuthContext'; // Adjust path if needed

export default function CreatePostPage() {
    // --- State Variables ---
    const [title, setTitle] = useState('');
    const [snippet, setSnippet] = useState('');
    const [markdownContent, setMarkdownContent] = useState('');
    const [category, setCategory] = useState(''); // Added category state
    const [imageFile, setImageFile] = useState(null);
    // Default date to today in YYYY-MM-DD format
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isPreview, setIsPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // --- Hooks ---
    const router = useRouter(); // Next.js router for navigation
    const { token, handleUnauthorized, user, isAuthenticated, isLoading: isAuthLoading } = useAuth(); // Get auth state and functions

    // --- Client-side Auth Check (Runs on Mount/Auth Change) ---
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            console.log('CreatePostPage: User not authenticated on mount, redirecting.');
            router.push('/login?from=/create-post');
        }
    }, [isAuthenticated, isAuthLoading, router]);

    // --- Handlers ---
    const handleImageChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            setImageFile(event.target.files[0]);
        } else {
            setImageFile(null);
        }
    };

    const handleSubmit = useCallback(
        async (event) => {
            event.preventDefault();
            setError('');
            setSuccess('');
            setLoading(true);

            if (!token) {
                setError('Authentication error. Please log in again.');
                setLoading(false);
                router.push('/login?from=/create-post&sessionExpired=true');
                return;
            }

            if (!title || !snippet || !markdownContent || !date || !category) { // Added category check
                setError('Please fill in Title, Snippet, Category, Content, and Date.');
                setLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append('title', title);
            formData.append('snippet', snippet);
            formData.append('content', markdownContent);
            formData.append('category', category); // Added category to form data
            formData.append('date', date);
            formData.append('author', user?.username || 'Unknown Author');

            if (imageFile) {
                formData.append('image_file', imageFile);
            }

            const createUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/posts/`;

            try {
                const headers = {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                };

                const response = await fetch(createUrl, {
                    method: 'POST',
                    headers: headers,
                    body: formData,
                });

                if (response.status === 401 || response.status === 403) {
                    handleUnauthorized();
                    router.push('/login?sessionExpired=true');
                    throw new Error('Authorization failed.');
                }

                if (!response.ok) {
                    let errorMsg = `Failed to create post: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.detail || errorData.message || errorMsg;
                    } catch (e) {
                        console.warn('Could not parse error response body:', e);
                    }
                    throw new Error(errorMsg);
                }

                const createdPost = await response.json();
                setSuccess(`Post "${createdPost.title}" created successfully! Redirecting...`);

                setTimeout(() => {
                    router.push('/');
                }, 1500);

            } catch (err) {
                console.error('Create post API call failed:', err);
                if (err.message !== 'Authorization failed.') {
                    setError(err.message || 'Failed to create post. Please try again.');
                }
            } finally {
                if (success === '') {
                    setLoading(false);
                }
            }
        },
        [
            title,
            snippet,
            markdownContent,
            category, // Added category
            imageFile,
            date,
            user,
            token,
            router,
            handleUnauthorized,
            success
        ]
    );

    if (isAuthLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Head>
                <title>Create New Post - Musings</title>
                <meta name="description" content="Create a new blog post for Musings." />
                <meta name="robots" content="noindex" />
            </Head>

            <Container component="main" maxWidth="md">
                <Paper
                    elevation={3}
                    sx={{ marginTop: 4, padding: { xs: 2, md: 4 } }}
                >
                    <Typography
                        component="h1"
                        variant="h4"
                        align="center"
                        gutterBottom
                    >
                        Create New Post
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="title"
                            label="Post Title"
                            name="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="snippet"
                            label="Snippet (Short Description)"
                            name="snippet"
                            value={snippet}
                            onChange={(e) => setSnippet(e.target.value)}
                            disabled={loading}
                        />
                        {/* Category Field */}
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="category"
                            label="Category"
                            name="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={loading}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="date"
                            label="Publication Date"
                            name="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            disabled={loading}
                        />
                        <FormControlLabel
                            control={
                                <Input
                                    type="file"
                                    id="imageUpload"
                                    name="imageUpload"
                                    onChange={handleImageChange}
                                    disabled={loading}
                                    sx={{ display: 'block', mt: 2, width: '100%' }}
                                    inputProps={{ accept: 'image/*' }}
                                />
                            }
                            label="Upload Header Image (Optional)"
                            labelPlacement="top"
                            sx={{ alignItems: 'flex-start', mb: 1, width: '100%' }}
                        />
                        {imageFile && (
                            <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                                Selected: {imageFile.name}
                            </Typography>
                        )}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isPreview}
                                    onChange={() => setIsPreview(!isPreview)}
                                    disabled={loading}
                                />
                            }
                            label="Show Preview"
                            sx={{ my: 2 }}
                        />
                        {isPreview ? (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    mt: 1,
                                    mb: 2,
                                    minHeight: '300px',
                                    overflowWrap: 'break-word',
                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                                    '& h1, & h2, & h3, & h4, & p, & ul, & ol, & blockquote, & pre': {
                                        mb: 1.5,
                                    },
                                    '& blockquote': { borderLeft: '4px solid grey', pl: 2, ml: 0, fontStyle: 'italic' },
                                    '& pre': { p: 1, bgcolor: 'grey.200', overflowX: 'auto' }
                                }}
                            >
                                {markdownContent ? (
                                    <ReactMarkdown>{markdownContent}</ReactMarkdown>
                                ) : (
                                    <Typography color="textSecondary">
                                        Start writing content to see the preview...
                                    </Typography>
                                )}
                            </Paper>
                        ) : (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="markdownContent"
                                label="Post Content (Markdown)"
                                name="markdownContent"
                                multiline
                                rows={15}
                                value={markdownContent}
                                onChange={(e) => setMarkdownContent(e.target.value)}
                                disabled={loading}
                                placeholder="Write your post content here using Markdown..."
                            />
                        )}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading || !!success}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Save Post'
                            )}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </>
    );
}
