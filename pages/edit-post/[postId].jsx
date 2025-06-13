// pages/edit-post/[postId].jsx
import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
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
    Input,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthContext';

export default function EditPostDynamicPage() {
    const router = useRouter();
    const { postId } = router.query; // Get postId from router query
    const { token, handleUnauthorized, user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

    const [initialPost, setInitialPost] = useState(null); // Store fetched post data
    const [title, setTitle] = useState('');
    const [snippet, setSnippet] = useState('');
    const [markdownContent, setMarkdownContent] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [currentImageUrl, setCurrentImageUrl] = useState('');
    const [isPreview, setIsPreview] = useState(false);
    const [loading, setLoading] = useState(false); // For form submission
    const [pageError, setPageError] = useState('');
    const [success, setSuccess] = useState('');
    const [pageLoading, setPageLoading] = useState(true); // For auth and data load

    useEffect(() => {
        if (!isAuthLoading) {
            if (!isAuthenticated || user?.email !== 'mrkiouak@gmail.com') {
                router.replace(`/login?from=/edit-post/${postId}`);
                return; // Stop further execution in this effect
            }
            // If authenticated and postId is available, fetch post data
            if (postId && token) {
                const fetchPost = async () => {
                    setPageLoading(true); // Start loading for fetch
                    try {
                        const postApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}`;
                        const res = await fetch(postApiUrl, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json'
                            }
                        });
                        if (res.status === 404) {
                            setPageError('Post not found.');
                            setInitialPost(null); // Ensure initialPost is null
                            return; // Stop if not found
                        }
                        if (!res.ok) {
                            const errorData = await res.json().catch(() => null);
                            const errorMessage = errorData?.detail || `Failed to fetch post: ${res.status}`;
                            throw new Error(errorMessage);
                        }
                        const fetchedPost = await res.json();
                        setInitialPost(fetchedPost);
                        setTitle(fetchedPost.title || '');
                        setSnippet(fetchedPost.snippet || '');
                        setMarkdownContent(fetchedPost.content || '');
                        setCategory(fetchedPost.category || '');
                        setDate(fetchedPost.date || new Date().toISOString().split('T')[0]);
                        setCurrentImageUrl(fetchedPost.imageUrl || '');
                        setPageError(''); // Clear previous errors
                    } catch (e) {
                        console.error(`Error fetching post ${postId}:`, e);
                        setPageError(e.message || 'Failed to load post data.');
                        setInitialPost(null); // Ensure initialPost is null on error
                    } finally {
                        setPageLoading(false);
                    }
                };
                fetchPost();
            } else if (!postId && router.isReady) { // If router is ready but no postId
                setPageError("Post ID is missing.");
                setPageLoading(false);
            }
        }
    }, [isAuthLoading, isAuthenticated, user, router, postId, token]); // Add postId and token to dependencies


    const handleImageChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            setImageFile(event.target.files[0]);
            setCurrentImageUrl('');
        } else {
            setImageFile(null);
        }
    };

    const handleSubmit = useCallback(
        async (event) => {
            event.preventDefault();
            setPageError('');
            setSuccess('');
            setLoading(true);

            if (!token) {
                setPageError('Authentication error. Please log in again.');
                setLoading(false);
                router.push(`/login?from=/edit-post/${postId}&sessionExpired=true`);
                return;
            }
            if (!title || !snippet || !markdownContent || !date || !category) {
                setPageError('Please fill in Title, Snippet, Category, Content, and Date.');
                setLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append('id', postId);
            formData.append('title', title);
            formData.append('snippet', snippet);
            formData.append('content', markdownContent);
            formData.append('category', category);
            formData.append('date', date);
            formData.append('author', initialPost?.author || user?.username || 'Unknown Author');

            if (imageFile) {
                formData.append('image_file', imageFile);
            }

            const updateUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}`;

            try {
                const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
                const response = await fetch(updateUrl, { method: 'POST', headers, body: formData });

                if (response.status === 401 || response.status === 403) {
                    handleUnauthorized();
                    router.push(`/login?sessionExpired=true&from=/edit-post/${postId}`);
                    throw new Error('Authorization failed.');
                }
                if (!response.ok) {
                    let errorMsg = `Failed to update post: ${response.status}`;
                    try { const errorData = await response.json(); errorMsg = errorData.detail || errorData.message || errorMsg; } catch (e) { /* ignore */ }
                    throw new Error(errorMsg);
                }

                const updatedPostData = await response.json();
                setSuccess(`Post "${updatedPostData.title}" updated successfully!`);
                setCurrentImageUrl(updatedPostData.imageUrl || '');
                setImageFile(null);
                setInitialPost(updatedPostData); // Update initialPost state with new data
            } catch (err) {
                console.error('Update post API call failed:', err);
                if (err.message !== 'Authorization failed.') {
                    setPageError(err.message || 'Failed to update post. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        },
        [postId, title, snippet, markdownContent, category, date, imageFile, token, router, handleUnauthorized, initialPost, user]
    );

    if (pageLoading || isAuthLoading || (router.isReady && !postId && !pageError)) { // Show loading if router not ready or postId not yet available
        return (
            <Container component="main" maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Container>
        );
    }
    if (!isAuthenticated || user?.email !== 'mrkiouak@gmail.com') {
        // This should be caught by useEffect redirect, but as a fallback.
        return (
            <Container component="main" maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">Access Denied. You will be redirected to login.</Alert>
            </Container>
        );
    }
    // If there's a pageError (and not just loading), show it before trying to render the form.
    // Especially if initialPost is null due to a fetch error or not found.
    if (pageError && !initialPost) {
        return (
            <Container component="main" maxWidth="md" sx={{ py: 4 }}>
                <Paper elevation={3} sx={{ marginTop: 4, padding: { xs: 2, md: 4 } }}>
                    <Typography component="h1" variant="h4" align="center" gutterBottom>
                        Edit Post
                    </Typography>
                    <Alert severity="error" sx={{ mb: 2 }}>{pageError}</Alert>
                </Paper>
            </Container>
        );
    }
    // If initialPost is still null after loading and auth checks (and no specific pageError yet for not found),
    // it might indicate an issue not caught, or still waiting for postId.
    // This condition is less likely if pageError is set correctly for 404s.
    if (!initialPost && !pageLoading && router.isReady && postId) {
        return <Container><Alert severity="warning">Loading post data or post not found...</Alert></Container>;
    }


    return (
        <>
            <Head>
                <title>Edit Post: {initialPost?.title || 'Loading...'} - Musings</title>
                <meta name="robots" content="noindex" />
            </Head>
            <Container component="main" maxWidth="md">
                <Paper elevation={3} sx={{ marginTop: 4, padding: { xs: 2, md: 4 } }}>
                    <Typography component="h1" variant="h4" align="center" gutterBottom>
                        Edit Post
                    </Typography>
                    {/* Display general page errors (like form validation or update errors) */}
                    {pageError && <Alert severity="error" sx={{ mb: 2 }}>{pageError}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField margin="normal" required fullWidth id="title" label="Post Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} autoFocus />
                        <TextField margin="normal" required fullWidth id="snippet" label="Snippet" name="snippet" value={snippet} onChange={(e) => setSnippet(e.target.value)} disabled={loading} />
                        <TextField margin="normal" required fullWidth id="category" label="Category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={loading} />
                        <TextField margin="normal" required fullWidth id="date" label="Publication Date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} disabled={loading} />

                        {currentImageUrl && !imageFile && (
                            <Box sx={{my: 2}}>
                                <Typography variant="subtitle2">Current Image:</Typography>
                                <img src={currentImageUrl} alt="Current post image" style={{maxWidth: '100%', maxHeight: '200px', display: 'block', marginTop: '8px'}} />
                            </Box>
                        )}
                        <FormControlLabel
                            control={ <Input type="file" id="imageUpload" name="imageUpload" onChange={handleImageChange} disabled={loading} sx={{ display: 'block', mt: 2, width: '100%' }} inputProps={{ accept: 'image/*' }} /> }
                            label={currentImageUrl ? "Replace Header Image (Optional)" : "Upload Header Image (Optional)"}
                            labelPlacement="top" sx={{ alignItems: 'flex-start', mb: 1, width: '100%' }}
                        />
                        {imageFile && <Typography variant="caption" display="block" sx={{ mb: 2 }}>New: {imageFile.name}</Typography>}

                        <FormControlLabel control={ <Switch checked={isPreview} onChange={() => setIsPreview(!isPreview)} disabled={loading} /> } label="Show Preview" sx={{ my: 2 }} />

                        {isPreview ? (
                            <Paper variant="outlined" sx={{ p: 2, mt: 1, mb: 2, minHeight: '300px', overflowWrap: 'break-word', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100', '& h1,& h2,& h3,& h4,& p,& ul,& ol,& blockquote,& pre': { mb: 1.5 }, '& blockquote': { borderLeft: '4px solid grey', pl: 2, ml: 0, fontStyle: 'italic' }, '& pre': { p: 1, bgcolor: 'grey.200', overflowX: 'auto' } }}>
                                {markdownContent ? <ReactMarkdown>{markdownContent}</ReactMarkdown> : <Typography color="textSecondary">Start writing content...</Typography>}
                            </Paper>
                        ) : (
                            <TextField margin="normal" required fullWidth id="markdownContent" label="Post Content (Markdown)" name="markdownContent" multiline rows={15} value={markdownContent} onChange={(e) => setMarkdownContent(e.target.value)} disabled={loading} placeholder="Write your post content..." />
                        )}
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Post'}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </>
    );
}