// pages/user/validate.jsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router'; // Use Next.js router
import Head from 'next/head';
import { Container, Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';

export default function ValidateUserPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter(); // Get the router object

  useEffect(() => {
    // Check if router is ready and query params are available
    if (!router.isReady) {
      return; // Wait for router to be ready
    }

    const challengeToken = router.query.challenge; // Get token from query params

    if (!challengeToken) {
      setError('Challenge token missing from URL.');
      setLoading(false);
      return;
    }

    const validateUser = async () => {
      setLoading(true);
      setError('');
      // Use environment variable for API URL if it's external
      const validateUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/`;

      try {
        const response = await fetch(validateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ challenge: challengeToken }),
        });

        if (!response.ok) {
          let errorMsg = `Validation failed with status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.detail || errorData.message || errorMsg;
          } catch (e) {
            // Keep the generic status message
          }
          throw new Error(errorMsg);
        }

        // --- MODIFICATION: Redirect with query parameter ---
        console.log('Validation successful, navigating to login with query param.');
        // Replace history state, navigate to login, add ?validated=true
        router.replace('/login?validated=true');
        // --- END MODIFICATION ---

      } catch (err) {
        console.error('User validation API call failed:', err);
        setError(err.message || 'Validation failed. Please try again or contact support.');
        setLoading(false); // Stop loading only on error
      }
      // Don't setLoading(false) on success because we are navigating away
    };

    validateUser();

  }, [router.isReady, router.query, router]); // Depend on router readiness and query

  // --- UI remains the same ---
  return (
     <>
       <Head>
         <title>Validating Account...</title>
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
           <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
             Validating Account
           </Typography>
           {loading && (
             <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
               <CircularProgress />
             </Box>
           )}
           {error && (
             <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
               {error}
             </Alert>
           )}
           {!loading && !error && (
             <Typography variant="body1" sx={{ mt: 2 }}>
               Validation successful. Redirecting...
             </Typography>
           )}
           {!loading && error && (
             <Typography variant="body2" sx={{ mt: 2 }}>
               If the problem persists, please contact support.
             </Typography>
           )}
         </Paper>
       </Container>
     </>
  );
}
