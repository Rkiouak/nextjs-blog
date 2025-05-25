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
  // Grid, // Grid is no longer needed here for the old signup link
  // Link as MuiLink, // MuiLink is no longer needed for the old signup link
  Snackbar,
  Divider, // Added Divider for visual separation
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

  const from = router.query.from || '/';
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://musings-mr.net'}/login`;


  useEffect(() => {
    let message = '';
    let severity = 'success';
    let queryParamToRemove = null;

    if (router.query.validated === 'true') {
      message = 'Thank you for signing up! Please sign in with your new credentials.';
      severity = 'success';
      queryParamToRemove = 'validated';
    } else if (router.query.signup === 'success') {
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

      const newQuery = { ...router.query };
      if (queryParamToRemove) {
        delete newQuery[queryParamToRemove];
      }
      router.replace(
          {
            pathname: router.pathname,
            query: newQuery,
          },
          undefined,
          { shallow: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query]);


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await auth.login(username, password);
      router.replace(from);
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

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
          <link rel="canonical" href={canonicalUrl} />
        </Head>
        <Container component="main" maxWidth="xs" sx={{ pb: 4 }}> {/* Added padding bottom to container */}
          <Paper
              elevation={3}
              sx={{
                marginTop: 8,
                padding: { xs: 3, sm: 4 }, // Adjusted padding
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
              {/* Removed the old Grid for signup link from here */}
            </Box>
          </Paper>

          {/* New Prominent Sign-Up Section */}
          <Paper
              variant="outlined" // Use outlined variant for a slightly different feel
              sx={{
                marginTop: 4,
                padding: { xs: 2, sm: 3 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderColor: 'divider', // Use theme's divider color for the border
              }}
          >
            <Typography component="h2" variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
              New to Musings?
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
              Create an account and get 50 FREE story pages with illustrations per day and be able to comment on posts!
            </Typography>
            <Link href="/signup" passHref legacyBehavior>
              <Button
                  variant="contained"
                  color="secondary" // Use secondary color to differentiate
                  fullWidth
                  sx={{ py: 1.5 }} // Make button a bit taller
              >
                Create Your Account
              </Button>
            </Link>
          </Paper>


          {/* Snackbar for Toasts */}
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
        </Container>
      </>
  );
}
