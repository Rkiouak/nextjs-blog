// pages/index.jsx
import React, { useState, useRef, useEffect } from 'react'; // Added useState
import Head from 'next/head';
import NextLink from 'next/link';
import {
    Grid,
    Typography,
    Box,
    Alert,
    Paper,
    Divider,
    Button,
    Link as MuiLink,
    CircularProgress,
    Accordion, // Added
    AccordionSummary, // Added
    AccordionDetails, // Added
    useTheme, // Moved useTheme import higher
    alpha,
} from '@mui/material';
import BlogPostPreview from '../src/components/BlogPostPreview';
import CookieConsent from 'react-cookie-consent';

// getStaticProps function remains the same as your last working version
export async function getStaticProps() {
    let posts = [];
    let blogError = null;
    const postsApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/posts/`;

    let publicStories = [];
    let storiesError = null;
    const storiesApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/experiments/campfire/public/list`;

    try {
        const postsResponse = await fetch(postsApiUrl, {
            headers: { Accept: 'application/json' },
        });
        if (!postsResponse.ok) {
            console.error(`HTTP error fetching posts: ${postsResponse.status}`);
            blogError = `Failed to load posts. Status: ${postsResponse.status}`;
        } else {
            posts = await postsResponse.json();
        }
    } catch (e) {
        console.error('Network or fetch error fetching posts:', e);
        blogError = 'Failed to load posts due to a network or fetch error.';
    }

    try {
        const storiesResponse = await fetch(storiesApiUrl, {
            headers: { Accept: 'application/json' },
        });
        if (!storiesResponse.ok) {
            console.error(`HTTP error fetching public stories: ${storiesResponse.status}`);
            storiesError = `Failed to load public stories. Status: ${storiesResponse.status}`;
        } else {
            const storiesData = await storiesResponse.json();
            publicStories = storiesData || [];
        }
    } catch (e) {
        console.error('Network or fetch error fetching public stories:', e);
        storiesError = 'Failed to load public stories due to a network or fetch error.';
    }

    return {
        props: {
            posts: posts || [],
            blogError: blogError,
            publicStories: publicStories || [],
            storiesError: storiesError,
        },
        // Removed revalidate based on previous discussions if output: 'export' is used
    };
}


export default function HomePage({ posts, blogError, publicStories, storiesError }) {
    const theme = useTheme();
    const [isPublicStoriesExpanded, setIsPublicStoriesExpanded] = useState(false);
    const publicStoriesAccordionRef = useRef(null);

    const handleAccordionChange = (event, isExpanded) => {
        setIsPublicStoriesExpanded(isExpanded);
    };

    // Effect to scroll to the accordion when it's expanded
    useEffect(() => {
        if (isPublicStoriesExpanded && publicStoriesAccordionRef.current) {
            console.log('isPublicStoriesExpanded', isPublicStoriesExpanded);
            // Timeout to ensure the element is rendered and layout is complete
            setTimeout(() => {
                publicStoriesAccordionRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start', // Scrolls to the top of the element
                });
            }, 100); // Adjust timeout if necessary
        }
    }, [isPublicStoriesExpanded]);

    return (
        <>
            <Head>
                <title>Musings - Home</title>
                <meta
                    name="description"
                    content="Matt Rkiouak's personal website and blog."
                />
                <meta property="og:title" content="Musings - Home" />
                <meta
                    property="og:description"
                    content="Matt Rkiouak's personal website and blog."
                />
            </Head>
            <Box>
                <Paper
                    elevation={4}
                    sx={{
                        textAlign: 'left',
                    }}
                >
                    <Box
                        sx={{
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
                        <Box sx={{ mb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ml: 1}}>
                            Collaboratively tell family-friendly stories with illustrations and interactive elements. You describe the story, and generative Ai fills in the details & drawings.
                        </Typography>
                        </Box>
                        <NextLink href="https://ki-storygen.com" passHref legacyBehavior>
                            <Button variant="contained" color="secondary" size="large" sx={{ mb: 2.5, px: {xs: 3, sm:5}, py: {xs:1, sm:1.5} }}>
                                Start Your First Story
                            </Button>
                        </NextLink>
                    </Box>
                </Paper>

                <Divider sx={{ my: 4 }} />
                {/* Divider before Latest Posts, ensure it's not too close if stories are collapsed */}
                <Divider sx={{ mb: 4, mt: isPublicStoriesExpanded ? 0 : 2 }} />


                {/* --- Latest Blog Posts Section --- */}
                <Typography
                    id="latest-posts"
                    variant="h4"
                    component="h2"
                    gutterBottom
                    align="center"
                    sx={{ mb: 4, fontWeight: 'medium' }}
                >
                    Matt's Latest Blog Posts
                </Typography>
                {blogError && (
                    <Alert severity="error" sx={{ my: 3 }}>
                        {blogError} Please try refreshing the page later.
                    </Alert>
                )}
                {!blogError && (
                    <Grid container spacing={4}>
                        {posts.length > 0 ? (
                            posts.map((post) => (
                                <Grid item key={post.id} xs={12} sm={6} md={4}>
                                    <BlogPostPreview post={post} />
                                </Grid>
                            ))
                        ) : (
                            <Grid item xs={12}>
                                <Typography align="center" sx={{py: 3, color: 'text.secondary'}}>
                                    No posts available yet.
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
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