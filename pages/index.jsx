import React from 'react';
import Head from 'next/head'; // For managing the document head
import {
  Grid,
  Typography,
  Box,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import BlogPostPreview from '../src/components/BlogPostPreview'; // Adjust path if needed
import CookieConsent from 'react-cookie-consent';

// This function runs at build time (or on-demand with revalidate) on the server-side.
// It won't be bundled with the client-side code.
export async function getStaticProps() {
  let posts = [];
  let error = null;
  // Use the environment variable for the base API URL
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/posts/`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
        // No Authorization header needed here if the endpoint is public
      },
    });

    if (!response.ok) {
      // Don't throw an error that breaks the build, instead pass error prop
      console.error(`HTTP error fetching posts: ${response.status}`);
      error = `Failed to load posts. Status: ${response.status}`;
      // Optionally try to parse error details from response body
      // const errorData = await response.json().catch(() => null);
      // error = errorData?.detail || error;
    } else {
      posts = await response.json();
    }
  } catch (e) {
    console.error('Network or fetch error fetching posts:', e);
    error = 'Failed to load posts due to a network or fetch error.';
  }

  // Props returned will be passed to the page component
  return {
    props: {
      posts: posts || [], // Ensure posts is always an array
      error: error, // Pass error state to the component
    },
  };
}

// The HomePage component receives `posts` and `error` as props from getStaticProps
export default function HomePage({ posts, error }) {
  return (
    <>
      <Head>
        <title>Musings - Home</title>
        <meta
          name="description"
          content="Welcome to Musings. A space for thoughts, reflections, and explorations."
        />
        {/* Add other relevant meta tags for the homepage */}
        <meta property="og:title" content="Musings - Home" />
        <meta
          property="og:description"
          content="Welcome to Musings. A space for thoughts, reflections, and explorations."
        />
        {/* Add og:image, og:url specific to the homepage */}
      </Head>

      <Box>
        {/* --- Welcome Section --- */}
        <Paper elevation={1} sx={{ p: 3, mb: 4, textAlign: 'left' }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Welcome to musings.
          </Typography>
          <Typography variant="body1" paragraph>
            I share thoughts, reflections, explorations and miscellanea here.
          </Typography>
          <Typography variant="body1" paragraph>
            I may add random things to this site, under an experiments tab.
          </Typography>
        </Paper>

        <Divider sx={{ mb: 4 }} />

        {/* --- Latest Posts Section --- */}
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{ mb: 4 }}
        >
          Latest Posts
        </Typography>

        {/* Display error message if getStaticProps failed */}
        {error && (
          <Alert severity="error" sx={{ my: 3 }}>
            {error} Please try refreshing the page later.
          </Alert>
        )}

        {/* Display posts grid if no error */}
        {!error && (
          <Grid container spacing={4}>
            {posts.length > 0 ? (
              posts.map((post) => (
                <Grid item key={post.id} xs={12} sm={6} md={4}>
                  {/* Pass the post data fetched by getStaticProps */}
                  <BlogPostPreview post={post} />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography align="center">No posts available yet.</Typography>
              </Grid>
            )}
          </Grid>
        )}

        {/* --- Cookie Consent (Client-side only) --- */}
        <CookieConsent
          location="bottom"
          buttonText="I Accept"
          cookieName="musings-mr.net" // Use a relevant cookie name
          style={{ background: '#2B373B' }}
          buttonStyle={{ color: '#4e503b', fontSize: '13px' }}
          expires={150}
        >
          This website uses cookies to better understand its audience.{' '}
        </CookieConsent>
      </Box>
    </>
  );
}
