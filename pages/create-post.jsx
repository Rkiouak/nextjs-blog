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

// --- Server-side Protection (Recommended) ---
// Although we add client-side checks, protecting this page server-side
// is more secure. You would typically do this with getServerSideProps
// to redirect unauthenticated users *before* the page even renders.
// Example (add this function outside the component):
/*
export async function getServerSideProps(context) {
  // Replace with your actual server-side session/token check logic
  // (e.g., using next-auth, iron-session, or checking cookies)
  const token = context.req.cookies['authToken']; // Example cookie check

  if (!token) {
    // If no token, redirect to login, preserving the intended destination
    return {
      redirect: {
        destination: '/login?from=/create-post', // Redirect to login
        permanent: false, // Not a permanent redirect
      },
    };
  }

  // If authenticated, return empty props to allow page rendering
  return { props: {} };
}
*/
// If using getServerSideProps, the useEffect check below becomes less critical,
// but can still be useful for handling token expiry during an active session.

export default function CreatePostPage() {
  // --- State Variables ---
  const [title, setTitle] = useState('');
  const [snippet, setSnippet] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
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
  // This redirects if the user isn't logged in when the component mounts.
  // Less critical if using getServerSideProps, but good for robustness.
  useEffect(() => {
    // Wait until authentication status is determined
    if (!isAuthLoading && !isAuthenticated) {
      console.log('CreatePostPage: User not authenticated on mount, redirecting.');
      router.push('/login?from=/create-post'); // Redirect to login
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // --- Handlers ---
  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    } else {
      setImageFile(null); // Clear if no file selected
    }
  };

  // Form submission handler
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setError('');
      setSuccess('');
      setLoading(true);

      // Double-check token existence before submitting (though useEffect should catch most cases)
      if (!token) {
        setError('Authentication error. Please log in again.');
        setLoading(false);
        router.push('/login?from=/create-post&sessionExpired=true'); // Redirect if token disappears unexpectedly
        return;
      }

      // Basic client-side validation (optional, add more as needed)
      if (!title || !snippet || !markdownContent || !date) {
          setError('Please fill in Title, Snippet, Content, and Date.');
          setLoading(false);
          return;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('title', title);
      formData.append('snippet', snippet);
      formData.append('content', markdownContent);
      formData.append('date', date);
      // Use username from auth context, default if somehow unavailable
      formData.append('author', user?.username || 'Unknown Author');

      if (imageFile) {
        formData.append('image_file', imageFile);
      }

      const createUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/posts/`;

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          // 'Content-Type': 'multipart/form-data' is set automatically by browser for FormData
        };

        const response = await fetch(createUrl, {
          method: 'POST',
          headers: headers,
          body: formData,
        });

        // --- Handle Authorization Errors (401/403) ---
        if (response.status === 401 || response.status === 403) {
          handleUnauthorized(); // Clear token state in context
          // Manually redirect to login page
          router.push('/login?sessionExpired=true');
          // Throw specific error to prevent further processing in this try block
          throw new Error('Authorization failed.');
        }
        // --- End Authorization Error Handling ---

        if (!response.ok) {
          // Handle other errors (e.g., 400 Bad Request, 500 Server Error)
          let errorMsg = `Failed to create post: ${response.status}`;
          try {
            // Try to parse more specific error details from the API response
            const errorData = await response.json();
            errorMsg = errorData.detail || errorData.message || errorMsg;
          } catch (e) {
            console.warn('Could not parse error response body:', e);
          }
          throw new Error(errorMsg);
        }

        // --- Handle Success ---
        const createdPost = await response.json();
        setSuccess(`Post "${createdPost.title}" created successfully! Redirecting...`);

        // Clear form fields on success (optional)
        // setTitle(''); setSnippet(''); setMarkdownContent(''); setImageFile(null);

        // Navigate to home page (or the new post page) after a short delay
        setTimeout(() => {
          router.push('/');
          // Or navigate to the new post: router.push(`/post/${createdPost.id}`);
        }, 1500); // Delay allows user to see success message

      } catch (err) {
        console.error('Create post API call failed:', err);
        // Only set the local error state if it wasn't the handled auth error
        if (err.message !== 'Authorization failed.') {
          setError(err.message || 'Failed to create post. Please try again.');
        }
        // If it *was* the auth error, navigation already happened.
      } finally {
        // Only set loading false if not successful (to keep button disabled during redirect delay)
        if (success === '') { // Check if success message was set
             setLoading(false);
        }
      }
    },
    // Dependencies for useCallback
    [
      title,
      snippet,
      markdownContent,
      imageFile,
      date,
      user,
      token,
      router,
      handleUnauthorized,
      success // Include success to prevent re-running after success message is set
    ]
  );

  // Render Loading state while checking auth on initial load
   if (isAuthLoading) {
     return (
       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
         <CircularProgress />
       </Box>
     );
   }

  // --- JSX ---
  return (
    <>
      <Head>
        <title>Create New Post - Musings</title>
        <meta name="description" content="Create a new blog post for Musings." />
        {/* Add meta robots noindex if you don't want this page indexed */}
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

          {/* Display Error or Success Messages */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {/* Title Field */}
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

            {/* Snippet Field */}
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

            {/* Date Field */}
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
              InputLabelProps={{ shrink: true }} // Keep label floated
              disabled={loading}
            />

            {/* Image Upload */}
            <FormControlLabel
              control={
                <Input
                  type="file"
                  id="imageUpload"
                  name="imageUpload"
                  onChange={handleImageChange}
                  disabled={loading}
                  sx={{ display: 'block', mt: 2, width: '100%' }} // Basic styling
                  inputProps={{ accept: 'image/*' }} // Specify accepted file types
                />
              }
              label="Upload Header Image (Optional)"
              labelPlacement="top" // Place label above input
              sx={{ alignItems: 'flex-start', mb: 1, width: '100%' }}
            />
            {/* Display selected file name */}
            {imageFile && (
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Selected: {imageFile.name}
              </Typography>
            )}

            {/* Preview Switch */}
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

            {/* Content Area (Markdown Editor or Preview) */}
            {isPreview ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mt: 1,
                  mb: 2,
                  minHeight: '300px',
                  overflowWrap: 'break-word',
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100', // Adjust background for theme
                  '& h1, & h2, & h3, & h4, & p, & ul, & ol, & blockquote, & pre': { // Basic Markdown styling
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
                rows={15} // Adjust rows as needed
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                disabled={loading}
                placeholder="Write your post content here using Markdown..."
              />
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !!success} // Disable while loading or after success
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
