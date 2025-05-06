import React, { useState } from 'react';
import Head from 'next/head'; // Import Next.js Head
import Link from 'next/link'; // Import Next.js Link
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

// Note: No useRouter is needed here because the current logic
// shows a toast on success instead of navigating immediately.

export default function SignUpPage() {
    // --- State Variables ---
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [givenName, setGivenName] = useState('');
    const [familyName, setFamilyName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false); // State for success toast

    // --- Form Submission Handler ---
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setShowSuccessToast(false); // Reset toast state on new submission

        // --- Basic Client-side Validation ---
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            // Increased minimum length example
            setError('Password must be at least 8 characters long.');
            return;
        }
        if (!givenName || !familyName) {
            setError('Please fill in your first and last name.');
            return;
        }
        if (!username || !email) {
            setError('Please fill in username and email.');
            return;
        }
        // Add more validation if needed (e.g., email format regex)
        // --- End Validation ---

        setLoading(true);

        // --- API Call ---
        const signUpUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/challenge/`; // Use ENV Var
        const userData = {
            username: username,
            email: email,
            given_name: givenName,
            family_name: familyName,
            password: password,
        };

        try {
            const response = await fetch(signUpUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                // Handle potential errors (e.g., username taken, validation errors from backend)
                let errorMsg = `Sign up failed with status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    // Flatten potential nested errors if your API returns them
                    if (typeof errorData.detail === 'object' && errorData.detail !== null) {
                        errorMsg = Object.entries(errorData.detail)
                            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                            .join(' ');
                    } else {
                        errorMsg = errorData.detail || errorData.message || errorMsg;
                    }
                } catch (e) {
                    errorMsg = `${errorMsg}. Could not parse error details.`;
                }
                throw new Error(errorMsg);
            }

            // --- SUCCESS HANDLING (Show Toast) ---
            // No navigation here in the current logic
            setShowSuccessToast(true); // Show success toast

            // Optionally clear the form fields after successful submission
            // setUsername(''); setEmail(''); setGivenName(''); setFamilyName('');
            // setPassword(''); setConfirmPassword('');

        } catch (err) {
            console.error('Sign up API call failed:', err);
            setError(err.message || 'Sign up failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- Snackbar close handler ---
    const handleCloseToast = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowSuccessToast(false);
    };

    // --- JSX ---
    return (
        <>
            <Head>
                <title>Sign Up - Musings</title>
                <meta
                    name="description"
                    content="Create an account to join Musings."
                />
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
                        Sign Up
                    </Typography>

                    {/* Display general errors (but not if success toast is showing) */}
                    {error && !showSuccessToast && (
                        <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ mt: 1, width: '100%' }}
                    >
                        {/* Form Fields */}
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="givenName"
                                    label="First Name"
                                    name="givenName"
                                    autoComplete="given-name"
                                    value={givenName}
                                    onChange={(e) => setGivenName(e.target.value)}
                                    disabled={loading}
                                    size="small" // Example: make fields smaller
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="familyName"
                                    label="Last Name"
                                    name="familyName"
                                    autoComplete="family-name"
                                    value={familyName}
                                    onChange={(e) => setFamilyName(e.target.value)}
                                    disabled={loading}
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            size="small"
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            size="small"
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            size="small"
                            helperText="Minimum 8 characters"
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            size="small"
                            // Specific inline error for password mismatch
                            error={password !== confirmPassword && confirmPassword !== ''}
                            helperText={
                                password !== confirmPassword && confirmPassword !== ''
                                    ? 'Passwords do not match'
                                    : ''
                            }
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
                                'Sign Up'
                            )}
                        </Button>
                        <Grid container justifyContent="flex-end">
                            <Grid item>
                                {/* --- Use Next.js Link --- */}
                                <Link href="/login" passHref legacyBehavior>
                                    <MuiLink variant="body2">
                                        Already have an account? Sign in
                                    </MuiLink>
                                </Link>
                                {/* --- End Next.js Link --- */}
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>

                {/* Snackbar for Success Toast */}
                <Snackbar
                    open={showSuccessToast}
                    autoHideDuration={8000} // Increased duration
                    onClose={handleCloseToast}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={handleCloseToast}
                        severity="success"
                        variant="filled"
                        sx={{ width: '100%' }}
                    >
                        Please check your email to complete the sign up process!
                    </Alert>
                </Snackbar>
            </Container>
        </>
    );
}