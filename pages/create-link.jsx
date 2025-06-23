import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../src/context/AuthContext';
import {
    Container,
    Typography,
    TextField,
    Button,
    Box,
    CircularProgress,
    Alert,
    Paper
} from '@mui/material';

/**
 * A page for creating a new "Interesting Link".
 * This page is protected and only accessible by the admin user.
 */
export default function CreateLinkPage() {
    const { token, user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();

    // State for form fields
    const [formData, setFormData] = useState({
        url: '',
        title: '',
        description: '',
        imageUrl: '',
    });

    // State for form submission status
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Effect to handle authorization.
    // It redirects to the home page if the user is not authenticated
    // or is not the allowed admin user ('mrkouak@gmail.com').
    useEffect(() => {
        // Wait until authentication status is resolved
        if (!authLoading) {
            if (!isAuthenticated || user?.email !== 'mrkiouak@gmail.com') {
                router.push('/');
            }
        }
    }, [user, isAuthenticated, authLoading, router]);

    // Handles changes in the form's text fields
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Handles the form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            // POST the form data to the backend API
            const response = await fetch('/api/interesting-links/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                // Try to parse error details from the response body
                const errorData = await response.json().catch(() => ({ detail: 'Failed to create link.' }));
                throw new Error(errorData.detail || `HTTP Error: ${response.status}`);
            }

            setSuccess('Link created successfully!');
            // Reset form fields after successful submission
            setFormData({ url: '', title: '', description: '', imageUrl: '' });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Display a loading spinner while authentication is being checked
    if (authLoading || !isAuthenticated) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
            </Container>
        );
    }

    // Fallback check to prevent rendering the form for unauthorized users
    // before the redirect effect kicks in.
    if (user.email !== 'mrkiouak@gmail.com') {
        return (
            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Alert severity="error">You are not authorized to view this page.</Alert>
            </Container>
        );
    }

    return (
        <>
            <Head>
                <title>Create New Link - Musings</title>
                <meta name="robots" content="noindex" />
            </Head>
            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Paper sx={{ p: { xs: 2, sm: 4 }, mt: 3 }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        Create a New Interesting Link
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="title"
                            label="Title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="url"
                            label="URL"
                            name="url"
                            type="url"
                            value={formData.url}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            id="description"
                            label="Description (Optional)"
                            name="description"
                            multiline
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            id="imageUrl"
                            label="Image URL (Optional)"
                            name="imageUrl"
                            type="url"
                            value={formData.imageUrl}
                            onChange={handleChange}
                        />
                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}
                        {success && (
                            <Alert severity="success" sx={{ mt: 2, '& .MuiAlert-message': { width: '100%' } }} onClose={() => setSuccess(null)}>
                                {success}
                            </Alert>
                        )}
                        <Box sx={{ position: 'relative', mt: 3 }}>
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={isSubmitting}
                            >
                                Create Link
                            </Button>
                            {isSubmitting && (
                                <CircularProgress
                                    size={24}
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        marginTop: '-12px',
                                        marginLeft: '-12px',
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </>
    );
}
