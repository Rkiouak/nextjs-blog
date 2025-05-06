import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; // Import Next.js router
import Link from 'next/link'; // Import Next.js link
import Head from 'next/head'; // Import Next.js Head
import { useAuth } from '../src/context/AuthContext'; // Adjust path if needed
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  Link as MuiLink, // Keep MUI Link for styling
  Snackbar,
} from '@mui/material';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success'); // 'success' or 'info' etc.

  const router = useRouter();
  const auth = useAuth();

  // Determine where to redirect after login
  // Read 'from' query parameter, default to '/'
  const from = router.query.from || '/';

  // Effect to show toast messages based on query parameters
  useEffect(() => {
    let message = '';
    let severity = 'success';
    let queryParamToRemove = null;

    if (router.query.validated === 'true') {
      message = 'Thank you for signing up! Please sign in with your new credentials.';
      severity = 'success';
      queryParamToRemove = 'validated';
    } else if (router.query.signup === 'success') {
      // Message from original signup flow (might be less common if validation flow is always used)
      message = 'Sign up initiated! Please check your email or sign in if validation complete.';
      severity = 'info';
      queryParamToRemove = 'signup';
    } else if (router.query.sessionExpired === 'true') {
      message = 'Your session has expired. Please log in again.';
      severity = 'warning';
      queryParamToRemove = 'sessionExpired';
    }

    if (message) {
      setToastMessage(message);
      setToastSeverity(severity);
      setToastOpen(true);

      // Clean the URL query parameter(s) after displaying the message
      // Create a shallow copy of the query object
      const newQuery = { ...router.query };
      if (queryParamToRemove) {
        delete newQuery[queryParamToRemove];
      }
      // Remove 'from' as well if you don't want it lingering? Optional.
      // delete newQuery.from;

      router.replace(
        {
          pathname: router.pathname,
          query: newQuery,
        },
        undefined,
        { shallow: true } // Perform shallow routing to avoid re-running data fetching functions
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query]); // Run effect when query params change


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
       // Assume auth.login resolves on success, throws on error
       // It should NOT navigate internally anymore
      await auth.login(username, password);
      // --- Navigation on Success (handled by page component) ---
      router.replace(from); // Use replace to avoid login page in history
      // --- End Navigation ---
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      // NOTE: If auth.login throws a specific error for unauthorized that the context already handles (like clearing state),
      // you might not need to set the error here, but typically login page shows "invalid credentials".
    } finally {
      setLoading(false);
    }
  };

  // Snackbar close handler
  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setToastOpen(false);
  };

  return (
    <>
      <Head>
        <title>Sign In - Musings</title>
        <meta name="description" content="Sign in to access your Musings account." />
      </Head>
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={3}
          sx={{
            marginTop: 8,
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 1, width: '100%' }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                {/* --- Use Next.js Link --- */}
                <Link href="/signup" passHref legacyBehavior>
                  <MuiLink variant="body2">
                    {"Don't have an account? Sign Up"}
                  </MuiLink>
                </Link>
                {/* --- End Next.js Link --- */}
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* --- Snackbar for Toasts --- */}
        <Snackbar
          open={toastOpen}
          autoHideDuration={6000}
          onClose={handleCloseToast}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseToast}
            severity={toastSeverity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {toastMessage}
          </Alert>
        </Snackbar>
        {/* --- End Snackbar --- */}
      </Container>
    </>
  );
}
