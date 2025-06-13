// pages/edit-posts.jsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
    Container,
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button, // Keep if needed for other actions, though Edit button is IconButton
    IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '@/context/AuthContext';

export default function EditPostsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: isAuthLoading, token } = useAuth(); // Added token
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState('');
    const [pageLoading, setPageLoading] = useState(true); // Covers auth check and initial data load

    useEffect(() => {
        if (!isAuthLoading) {
            if (!isAuthenticated || user?.email !== 'mrkiouak@gmail.com') {
                router.replace('/login?from=/edit-posts');
            } else {
                // User is authenticated and authorized, now fetch posts
                const fetchPosts = async () => {
                    if (!token) {
                        setError("Authentication token not available.");
                        setPageLoading(false);
                        return;
                    }
                    try {
                        const postsApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/posts/`;
                        const res = await fetch(postsApiUrl, {
                            headers: {
                                'Authorization': `Bearer ${token}`, // Assuming posts list might be protected
                                'Accept': 'application/json'
                            }
                        });
                        if (!res.ok) {
                            const errorData = await res.json().catch(() => null);
                            const errorMessage = errorData?.detail || `Failed to fetch posts: ${res.status}`;
                            throw new Error(errorMessage);
                        }
                        const fetchedPosts = await res.json();
                        setPosts(fetchedPosts || []);
                    } catch (e) {
                        console.error('Error fetching posts for edit list:', e);
                        setError(e.message || 'Failed to load posts.');
                    } finally {
                        setPageLoading(false);
                    }
                };
                fetchPosts();
            }
        }
    }, [isAuthenticated, isAuthLoading, user, router, token]);


    if (pageLoading || isAuthLoading) {
        return (
            <Container component="main" maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh'  }}>
                <CircularProgress />
            </Container>
        );
    }

    // This check is somewhat redundant due to useEffect redirect, but good for clarity
    if (!isAuthenticated || user?.email !== 'mrkiouak@gmail.com') {
        return (
            <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">Access Denied. You will be redirected to login.</Alert>
            </Container>
        );
    }

    return (
        <>
            <Head>
                <title>Edit Posts - Musings</title>
                <meta name="robots" content="noindex" />
            </Head>
            <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
                <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        Edit Blog Posts
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {!error && posts.length === 0 && !pageLoading && ( // Ensure not to show "no posts" while loading
                        <Typography align="center" color="text.secondary" sx={{my: 3}}>No posts found to edit.</Typography>
                    )}
                    {!error && posts.length > 0 && (
                        <TableContainer component={Paper} sx={{mt: 2}}>
                            <Table sx={{ minWidth: 650 }} aria-label="posts table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Title</TableCell>
                                        <TableCell align="right">Publish Date</TableCell>
                                        <TableCell align="right">Category</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {posts.map((post) => (
                                        <TableRow
                                            key={post.id}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">
                                                {post.title}
                                            </TableCell>
                                            <TableCell align="right">{post.date}</TableCell>
                                            <TableCell align="right">{post.category || 'N/A'}</TableCell>
                                            <TableCell align="center">
                                                <Link href={`/edit-post/${post.id}`} passHref legacyBehavior>
                                                    <IconButton component="a" color="primary" aria-label="edit post">
                                                        <EditIcon />
                                                    </IconButton>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Container>
        </>
    );
}