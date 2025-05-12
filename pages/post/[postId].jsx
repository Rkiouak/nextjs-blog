import React from 'react';
import Head from 'next/head'; // Import Next.js Head for SEO
import {Alert, Box, CircularProgress, Typography} from '@mui/material'; // Keep for potential error display if needed

import FullBlogPost from '../../src/components/FullBlogPost'; // Adjust path
import CommentList from '../../src/components/CommentList'; // Import the CommentList component

// This function tells Next.js which dynamic paths to pre-render at build time.
export async function getStaticPaths() {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/posts/`;
    console.log(apiUrl);
    let paths = [];

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) {
            console.error(`Failed to fetch post list for paths: ${res.status}`);
            // Decide how to handle build failure: throw error or return empty paths
            // Returning empty paths means no pages are built initially, relies on fallback
            // Throwing error stops the build
            // throw new Error('Failed to fetch post list for static paths');
        } else {
            const posts = await res.json();
            // Ensure posts is an array and map it
            paths = Array.isArray(posts)
                ? posts.map((post) => ({
                    params: {postId: String(post.id)}, // postId must be a string
                }))
                : [];
        }
    } catch (error) {
        console.error('Error fetching post list for paths:', error);
        // Handle build failure as above
    }

    return {
        paths: paths,
        fallback: false,
    };
}

// This function fetches data for a specific post page at build time or on-demand.
export async function getStaticProps(context) {
    const {postId} = context.params; // Get postId from the URL parameters
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}`;

    try {
        const response = await fetch(apiUrl, {
            headers: {
                Accept: 'application/json',
                // No Authorization needed if posts are public
            },
        });

        // Handle Not Found
        if (response.status === 404) {
            return {notFound: true}; // Triggers the 404 page
        }

        // Handle other non-OK statuses
        if (!response.ok) {
            console.error(`HTTP error fetching post ${postId}: ${response.status}`);
            // Throwing an error here will show the Next.js 500 page
            throw new Error(`Failed to fetch post data. Status: ${response.status}`);
            // Alternatively, pass an error prop: return { props: { error: `Failed...` } };
        }

        const post = await response.json();

        // Pass post data to the page via props
        return {
            props: {
                post,
            },
        };
    } catch (error) {
        console.error(`Error fetching post ${postId}:`, error);
        // Ensure build doesn't fail silently, throw error for 500 page
        throw new Error(`Failed to fetch post ${postId}. Reason: ${error.message}`);
        // Or return { props: { error: `Failed...` } } if you handle error in component
    }
}

// The main page component - receives `post` as a prop
export default function PostPage({post, error}) {
    // Although getStaticProps/Paths handle loading/404,
    // you might still get an error prop if you choose to pass it from getStaticProps
    if (error) {
        return (
            <Box sx={{my: 3, mx: 'auto', maxWidth: 'md'}}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    // If fallback: true was used in getStaticPaths, you'd need loading state handling:
    // const router = useRouter();
    // if (router.isFallback) {
    //   return <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>;
    // }

    // Ensure post exists before trying to access its properties (important with fallback: true)
    if (!post) {
        return <Typography>Post not found.</Typography> // Should ideally be caught by notFound: true or fallback handler
    }

    return (
        <>
            {/* --- Head Section for SEO --- */}
            <Head>
                <title>{post.title} - Musings</title>
                {/* Transfer meta tags from FullBlogPost here */}
                <meta name="description" content={post.snippet || 'A post from Musings.'}/>
                <meta property="og:title" content={post.title}/>
                <meta property="og:description" content={post.snippet || 'A post from Musings.'}/>
                <meta property="og:image" content={post.imageUrl || ''}/>
                <meta
                    property="og:url"
                    content={`https://musings-mr.net/post/${post.id}`} // Replace with your actual domain
                />
                <meta property="og:type" content="article"/>
                <meta name="author" content={post.author || 'Matt Rkiouak'}/>
                <link
                    rel="canonical"
                    href={`https://musings-mr.net/post/${post.id}`} // Replace with your actual domain
                />
                {/* Add any other relevant meta tags (keywords, etc.) */}
                {/* <meta name="keywords" content="some, keywords" /> */}
            </Head>

            {/* --- Main Content --- */}
            {/* Render the FullBlogPost component with the fetched post data */}
            <FullBlogPost post={post}/>
            <Box sx={{maxWidth: 'md', mx: 'auto', mt: 4, mb: 4, px: {xs: 0, md: 2}}}>
                <CommentList postId={post.id}/>
            </Box>
        </>
    );
}
