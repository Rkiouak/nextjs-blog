import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
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
    Link as MuiLink,
    Snackbar,
    IconButton, // Added
    Collapse,   // Added
    AlertTitle, // Added
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // Added

export default function SignUpPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [givenName, setGivenName] = useState('');
    const [familyName, setFamilyName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [showHelp, setShowHelp] = useState(false); // State for help panel
    const [signupSubmitted, setSignupSubmitted] = useState(false); // State for post-submission UI

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setShowSuccessToast(false);

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 8) {
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

        setLoading(true);

        const signUpUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/challenge/`;
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
                let errorMsg = `Sign up failed with status: ${response.status}`;
                try {
                    const errorData = await response.json();
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

            // --- SUCCESS HANDLING ---
            setShowSuccessToast(true);  // Show toast
            setSignupSubmitted(true);   // Update page UI
            // Clear form fields
            setUsername('');
            // We keep the email to display it in the success message, but it won't be in a field
            setGivenName('');
            setFamilyName('');
            setPassword('');
            setConfirmPassword('');

        } catch (err) {
            console.error('Sign up API call failed:', err);
            setError(err.message || 'Sign up failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseToast = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowSuccessToast(false);
    };

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
                        padding: { xs: 3, sm: 4 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', mb: 1 }}>
                        <Typography component="h1" variant="h5" sx={{ textAlign: 'center', flexGrow: 1 }}>
                            Sign Up
                        </Typography>
                        <IconButton onClick={() => setShowHelp(!showHelp)} size="small" aria-label="Show help">
                            <HelpOutlineIcon />
                        </IconButton>
                    </Box>

                    <Collapse in={showHelp} sx={{ width: '100%', mb: showHelp ? 2 : 0 }}>
                        <Alert severity="info" onClose={() => setShowHelp(false)}>
                            <AlertTitle>How to Sign Up</AlertTitle>
                            1. Fill in your details in the form below. <br />
                            2. Click the "Sign Up" button. <br />
                            3. Check your email for a validation link to activate your account.
                        </Alert>
                    </Collapse>

                    {/* Display general errors (but not if success toast is showing or submission is successful) */}
                    {error && !showSuccessToast && !signupSubmitted && (
                        <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 1 }}>
                            {error}
                        </Alert>
                    )}

                    {!signupSubmitted ? (
                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            sx={{ mt: 1, width: '100%' }}
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        margin="dense" // Changed margin for tighter packing
                                        required
                                        fullWidth
                                        id="givenName"
                                        label="First Name"
                                        name="givenName"
                                        autoComplete="given-name"
                                        value={givenName}
                                        onChange={(e) => setGivenName(e.target.value)}
                                        disabled={loading}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        margin="dense"
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
                                margin="dense"
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
                                margin="dense"
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
                                margin="dense"
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
                                margin="dense"
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
                                sx={{ mt: 2, mb: 2 }} // Adjusted margins
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
                                    <Link href="/login" passHref legacyBehavior>
                                        <MuiLink variant="body2">
                                            Already have an account? Sign in
                                        </MuiLink>
                                    </Link>
                                </Grid>
                            </Grid>
                        </Box>
                    ) : (
                        // Post-submission success message
                        <Box sx={{ textAlign: 'center', py: 3, width: '100%' }}>
                            <Alert severity="success" icon={false} sx={{justifyContent: 'center', mb:2}}>
                                <AlertTitle sx={{fontWeight: 'bold'}}>Registration Submitted!</AlertTitle>
                            </Alert>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                A validation email has been sent to: <br/><strong>{email}</strong>
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Please check your inbox (and your <strong>spam/junk</strong> folder for an email from <strong>matt@rkiouak.com</strong>) to complete your registration by clicking the validation link.
                            </Typography>
                            <Typography variant="body2">
                                Once validated, you can{' '}
                                <Link href="/login" passHref legacyBehavior>
                                    <MuiLink>sign in</MuiLink>
                                </Link>.
                            </Typography>
                        </Box>
                    )}
                </Paper>

                <Snackbar
                    open={showSuccessToast}
                    autoHideDuration={8000}
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