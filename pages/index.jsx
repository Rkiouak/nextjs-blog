import React from 'react';
import Head from 'next/head';
import NextLink from 'next/link'; // Changed import for Next.js Link to avoid conflict
import {
    Grid,
    Typography,
    Box,
    Alert,
    Paper,
    Divider,
    Button,
    Link as MuiLink, // Import MUI Link as MuiLink
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import BlogPostPreview from '../src/components/BlogPostPreview';
import CookieConsent from 'react-cookie-consent';

// This function runs at build time (or on-demand with revalidate) on the server-side.
export async function getStaticProps() {
    let posts = [];
    let error = null;
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/posts/`;

    try {
        const response = await fetch(apiUrl, {
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`HTTP error fetching posts: ${response.status}`);
            error = `Failed to load posts. Status: ${response.status}`;
        } else {
            posts = await response.json();
        }
    } catch (e) {
        console.error('Network or fetch error fetching posts:', e);
        error = 'Failed to load posts due to a network or fetch error.';
    }

    return {
        props: {
            posts: posts || [],
            error: error,
        },
    };
}

export default function HomePage({ posts, error }) {
    const theme = useTheme(); // Get the theme object

    return (
        <>
            <Head>
                <title>Musings - Home</title>
                <meta
                    name="description"
                    content="Welcome to Musings. A space for thoughts, reflections, and explorations."
                />
                <meta property="og:title" content="Musings - Home" />
                <meta
                    property="og:description"
                    content="Welcome to Musings. A space for thoughts, reflections, and explorations."
                />
            </Head>

            <Box>
                {/* --- Welcome Section --- */}
                <Paper
                    elevation={4}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        mb: 4,
                        textAlign: 'left',
                    }}
                >
                    <Typography variant="h4" component="h2" gutterBottom>
                        Welcome to Musings.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        You can find my personal blog posts & some AI experiments here, like Ki StoryGen.
                    </Typography>
                    {/* New, Emphasized CTA for Ki Storygen */}
                    <Box
                        sx={{
                            mt: 3,
                            p: { xs: 2, sm: 3 },
                            backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                            borderRadius: 2,
                            textAlign: 'center',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                            <Box
                                component="img"
                                src="/ki-storygen-logo.png"
                                alt="Ki Storygen Logo"
                                sx={{
                                    height: 42,
                                    width: 42,
                                    mr: 1.5,
                                    borderRadius: '50%',
                                    objectFit: 'contain',
                                }}
                            />
                            <Typography variant="h5" component="h3" color="secondary.dark" sx={{fontWeight: 'medium'}}>
                                Discover Ki Storygen!
                            </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ mb: 2, px:1 }}>
                            Unleash your creativity with our AI-powered interactive storytelling tool.
                        </Typography>
                        <NextLink href="/experiments" passHref legacyBehavior>
                            <Button variant="contained" color="secondary" size="large" sx={{ mb: 2.5, px: {xs: 3, sm:5}, py: {xs:1, sm:1.5} }}>
                                Start Your First Story
                            </Button>
                        </NextLink>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            <NextLink href="/signup" passHref legacyBehavior>
                                <MuiLink sx={{fontWeight:'bold', color: theme.palette.primary.main, cursor: 'pointer'}}>Sign up</MuiLink>
                            </NextLink> to get <strong style={{ color: theme.palette.text.primary }}>50 story turns with illustrations per day </strong>
                             and the ability to <strong style={{ color: theme.palette.text.primary }}>comment on posts</strong>!
                        </Typography>
                    </Box>
                </Paper>

                <Divider sx={{ mb: 4 }} />

                <Typography
                    id="latest-posts"
                    variant="h4"
                    component="h1"
                    gutterBottom
                    align="center"
                    sx={{ mb: 4, fontWeight: 'medium' }}
                >
                    Latest Posts
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ my: 3 }}>
                        {error} Please try refreshing the page later.
                    </Alert>
                )}

                {!error && (
                    <Grid container spacing={4}>
                        {posts.length > 0 ? (
                            posts.map((post) => (
                                <Grid item key={post.id} xs={12} sm={6} md={4}>
                                    <BlogPostPreview post={post} />
                                </Grid>
                            ))
                        ) : (
                            <Grid item xs={12}>
                                <Typography align="center" sx={{py: 3}}>No posts available yet.</Typography>
                            </Grid>
                        )}
                    </Grid>
                )}

                <CookieConsent
                    location="bottom"
                    buttonText="I Accept"
                    cookieName="musings-mr.net"
                    style={{ background: '#2B373B' }}
                    buttonStyle={{ color: '#4e503b', fontSize: '13px' }}
                    expires={150}
                >
                    This website uses cookies to better understand its audience.
                </CookieConsent>
            </Box>
        </>
    );
}