import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Container,
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
} from '@mui/material';
import { useAuth } from '@/context/AuthContext'; // Use path alias

// getServerSideProps HAS BEEN REMOVED as it's incompatible with static export

export default function ProfilePage() {
    // Auth context values
    const {
        token,
        handleUnauthorized, // Use context's handler for consistency
        isLoading: isAuthLoading, // Loading state from auth context (initial check)
        isAuthenticated, // Boolean indicating if user is authenticated
    } = useAuth();

    // Component-specific state
    const [userProfile, setUserProfile] = useState(null); // To store fetched profile data
    const [pageError, setPageError] = useState(''); // To store fetch/display errors
    const [pageLoading, setPageLoading] = useState(true); // Combined loading state for auth check + data fetch

    const router = useRouter(); // Hook for client-side navigation

    useEffect(() => {
        // 1. Wait for the authentication status to be determined by AuthProvider
        if (isAuthLoading) {
            setPageLoading(true); // Keep showing loading indicator
            return; // Exit effect early until auth status is known
        }

        // 2. If auth check is complete, and user is NOT authenticated, redirect
        if (!isAuthenticated) {
            console.log('ProfilePage: User not authenticated, redirecting to login.');
            // Use replace to avoid adding the profile page to browser history
            router.replace('/login?from=/profile');
            // Stop the page's loading indicator as we are navigating away
            // (Technically the component might unmount before this matters)
            setPageLoading(false);
            return; // Stop the effect
        }

        // 3. If authenticated and we have a token, proceed to fetch profile data
        if (token) {
            // Ensure loading state is true before starting fetch
            setPageLoading(true);
            setPageError(''); // Clear any previous errors
            setUserProfile(null); // Clear any previous profile data

            const fetchProfile = async () => {
                const profileUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/me/`;
                try {
                    const response = await fetch(profileUrl, {
                        method: 'GET', // Explicitly set method (optional for GET but good practice)
                        headers: {
                            Authorization: `Bearer ${token}`, // Use the token from auth context
                            Accept: 'application/json',
                        },
                    });

                    // Handle Authorization Errors (e.g., token expired)
                    if (response.status === 401 || response.status === 403) {
                        console.log(`ProfilePage: Auth error during fetch (${response.status}).`);
                        handleUnauthorized(); // Clear token/user in auth context
                        router.replace('/login?sessionExpired=true'); // Redirect client-side
                        // Throw an error to stop further processing in this try block
                        throw new Error('Authorization failed.');
                    }

                    // Handle Other Non-OK Fetch Errors
                    if (!response.ok) {
                        let errorMsg = `Failed to fetch profile data. Status: ${response.status}`;
                        try {
                            // Try to get more specific error from API response body
                            const errorData = await response.json();
                            errorMsg = errorData.detail || errorData.message || errorMsg;
                        } catch (e) {
                            // Ignore error if response body isn't valid JSON
                        }
                        throw new Error(errorMsg);
                    }

                    // Process Successful Response
                    const data = await response.json();
                    setUserProfile(data); // Update state with fetched profile

                } catch (err) {
                    console.error('Error fetching profile:', err);
                    // Only set the page error state if it wasn't the handled auth error
                    // (because the auth error leads to redirection)
                    if (err.message !== 'Authorization failed.') {
                        setPageError(err.message || 'Could not load profile data.');
                    }
                } finally {
                    // Stop the loading indicator once fetch attempt is complete
                    // (unless an auth error caused a redirect)
                    if (!router.asPath.startsWith('/login')) {
                        setPageLoading(false);
                    }
                }
            };

            fetchProfile();
        } else if (!isAuthLoading) {
            // Handle the unlikely case where isAuthenticated is true but token is null/missing
            console.warn('ProfilePage: Authenticated but no token found.');
            setPageError('Authentication token is missing. Please log in again.');
            setPageLoading(false);
            // Optionally redirect here too
            // router.replace('/login?sessionExpired=true');
        }
        // Ensure all external variables used in the effect are listed here
    }, [token, isAuthenticated, isAuthLoading, router, handleUnauthorized]);

    // Render loading state while checking auth or fetching data
    if (pageLoading) {
        return (
            <Container component="main" maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <Paper elevation={3} sx={{ padding: 4, textAlign: 'center', width: '100%' }}>
                    <Typography component="h1" variant="h4" align="center" gutterBottom>
                        User Profile
                    </Typography>
                    <CircularProgress sx={{ mt: 3, mb: 1 }}/>
                    <Typography color="text.secondary">Loading...</Typography>
                </Paper>
            </Container>
        );
    }

    // Render the main content once loading is complete
    return (
        <>
            <Head>
                <title>User Profile - Musings</title>
                <meta name="description" content="View your user profile on Musings." />
                <meta name="robots" content="noindex" /> {/* Prevent indexing */}
            </Head>

            <Container component="main" maxWidth="sm">
                <Paper elevation={3} sx={{ marginTop: 8, padding: 4 }}>
                    <Typography component="h1" variant="h4" align="center" gutterBottom>
                        User Profile
                    </Typography>

                    {/* Display Error if fetching failed */}
                    {pageError && (
                        <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 2 }}>
                            {pageError}
                        </Alert>
                    )}

                    {/* Display Profile Data if successful */}
                    {!pageError && userProfile && (
                        <Box sx={{ mt: 3, wordBreak: 'break-word' }}>
                            <Typography variant="h6" gutterBottom>
                                <strong>Username:</strong> {userProfile.username || 'N/A'}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                <strong>Email:</strong> {userProfile.email || 'N/A'}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                <strong>First Name:</strong> {userProfile.given_name || 'N/A'}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                <strong>Last Name:</strong> {userProfile.family_name || 'N/A'}
                            </Typography>
                            {/* Add more fields as available in your API response */}
                            {/* Example:
                            <Typography variant="body1" gutterBottom>
                                <strong>Member Since:</strong> {userProfile.date_joined ? new Date(userProfile.date_joined).toLocaleDateString() : 'N/A'}
                            </Typography>
                            */}
                        </Box>
                    )}

                    {/* Fallback message if no error, loading finished, but no profile data (should be rare) */}
                    {!pageError && !userProfile && !pageLoading && (
                        <Typography align="center" sx={{ mt: 2 }}>
                            Profile data not available.
                        </Typography>
                    )}

                </Paper>
            </Container>
        </>
    );
}