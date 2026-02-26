// pages/index.jsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
    Grid,
    Typography,
    Box,
    Alert,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Button,
    Divider,
    useTheme,
} from '@mui/material';
import BlogPostPreview from '../src/components/BlogPostPreview';
import CookieConsent from 'react-cookie-consent';
import { getAllPosts } from '../src/lib/posts';

export async function getStaticProps() {
    let posts = [];
    let blogError = null;

    try {
        const allPosts = await getAllPosts();
        // Filter to only Economics & Civics posts
        posts = allPosts.filter(
            post => post.category === 'Economics & Civics'
        );
    } catch (e) {
        console.error('Error fetching posts:', e);
        blogError = 'Failed to load posts.';
    }

    return {
        props: {
            posts: posts || [],
            blogError: blogError,
        },
    };
}


export default function HomePage({ posts, blogError }) {
    const theme = useTheme();
    const featuredPost = posts[0];
    const olderPosts = posts.slice(1);

    return (
        <>
            <Head>
                <title>Musings - Matt Rkiouak</title>
                <meta
                    name="description"
                    content="Thoughts on life, civics, economics and policy."
                />
                <meta property="og:title" content="Musings - Matt Rkiouak" />
                <meta
                    property="og:description"
                    content="Thoughts on life, civics, economics and policy."
                />
            </Head>
            <Box>
                {/* Header section */}
                <Box sx={{ mb: 5, textAlign: 'center' }}>
                    <Typography
                        variant="h3"
                        component="h1"
                        sx={{ fontWeight: 'medium', mb: 1 }}
                    >
                        Musings
                    </Typography>
                    <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{ fontWeight: 'normal', mb: 2 }}
                    >
                        Thoughts on life, civics, economics and policy.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        By{' '}
                        <Link href="/about" style={{ color: '#5b8a72', textDecoration: 'none' }}>
                            Matt Rkiouak
                        </Link>
                    </Typography>
                </Box>

                {blogError && (
                    <Alert severity="error" sx={{ my: 3 }}>
                        {blogError} Please try refreshing the page later.
                    </Alert>
                )}

                {!blogError && posts.length === 0 && (
                    <Typography align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No posts yet.
                    </Typography>
                )}

                {/* Featured post */}
                {!blogError && featuredPost && (
                    <Card sx={{ mb: 5 }}>
                        {featuredPost.imageUrl && (
                            <CardMedia
                                component="img"
                                image={featuredPost.imageUrl}
                                alt={featuredPost.title}
                                sx={{
                                    height: { xs: 200, sm: 300, md: 400 },
                                    objectFit: 'contain',
                                    backgroundColor: '#f0f0f0',
                                }}
                            />
                        )}
                        <CardContent sx={{ pb: 1 }}>
                            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'medium' }}>
                                {featuredPost.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                {featuredPost.date}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {featuredPost.snippet}
                            </Typography>
                        </CardContent>
                        <CardActions sx={{ px: 2, pb: 2 }}>
                            <Link href={`/post/${featuredPost.id}`} passHref legacyBehavior>
                                <Button variant="contained" color="secondary" component="a">
                                    Read More
                                </Button>
                            </Link>
                        </CardActions>
                    </Card>
                )}

                {/* Older posts */}
                {!blogError && olderPosts.length > 0 && (
                    <>
                        <Divider sx={{ mb: 4 }} />
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'medium' }}>
                            Previous Posts
                        </Typography>
                        <Grid container spacing={3}>
                            {olderPosts.map((post) => (
                                <Grid item key={post.id} size={{ xs: 12, sm: 6 }}>
                                    <BlogPostPreview post={post} />
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}

                <CookieConsent
                    location="bottom"
                    buttonText="I Accept"
                    cookieName="musings-mr.net-cookie-consent"
                    style={{ background: '#2B373B', zIndex: 1500 }}
                    buttonStyle={{ color: '#FFFFFF', background: theme.palette.primary.main, fontSize: '13px', borderRadius: '4px' }}
                    expires={150}
                    ariaAcceptLabel="Accept cookies"
                >
                    This website uses cookies to enhance user experience and analyze site traffic. By clicking &quot;I Accept&quot;, you consent to our use of cookies.
                </CookieConsent>
            </Box>
        </>
    );
}
