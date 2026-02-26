import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Alert, Box, Typography } from '@mui/material';

import RichPostRenderer from '../../src/components/RichPostRenderer';
import CommentList from '../../src/components/CommentList';
import TableOfContents from '../../src/components/TableOfContents';
import { getAllPosts, getPostById, extractHeadings } from '../../src/lib/posts';

// This function tells Next.js which dynamic paths to pre-render at build time.
export async function getStaticPaths() {
    const posts = await getAllPosts();

    const paths = posts.map((post) => ({
        params: { postId: String(post.id) },
    }));

    return {
        paths,
        fallback: false,
    };
}

// This function fetches data for a specific post page at build time.
export async function getStaticProps(context) {
    const { postId } = context.params;

    const post = await getPostById(postId);

    if (!post) {
        return { notFound: true };
    }

    // For local posts, determine which charts are available
    let chartNames = [];
    if (post.isLocalPost) {
        try {
            const slug = postId.replace('local-', '');
            const charts = await import(`../../content/posts/${slug}/charts`);
            chartNames = Object.keys(charts).filter(k => k !== 'default');
        } catch (e) {
            // No charts for this post
        }
    }

    const headings = post.isLocalPost ? extractHeadings(post.content) : [];

    return {
        props: {
            post,
            chartNames,
            headings,
        },
    };
}

// The main page component
export default function PostPage({ post, chartNames = [], headings = [], error }) {
    const [charts, setCharts] = useState({});

    // Load chart components client-side for local posts
    useEffect(() => {
        if (post?.isLocalPost && chartNames.length > 0) {
            const slug = post.id.replace('local-', '');
            import(`../../content/posts/${slug}/charts`)
                .then(module => {
                    // Extract named exports (chart components)
                    const chartComponents = {};
                    for (const name of chartNames) {
                        if (module[name]) {
                            chartComponents[name] = module[name];
                        }
                    }
                    setCharts(chartComponents);
                })
                .catch(err => {
                    console.error('Failed to load charts:', err);
                });
        }
    }, [post, chartNames]);

    if (error) {
        return (
            <Box sx={{ my: 3, mx: 'auto', maxWidth: 'md' }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!post) {
        return <Typography>Post not found.</Typography>;
    }

    return (
        <>
            <Head>
                <title>{post.title} - Musings</title>
                <meta name="description" content={post.snippet || 'A post from Musings.'} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.snippet || 'A post from Musings.'} />
                <meta property="og:image" content={post.imageUrl || ''} />
                <meta
                    property="og:url"
                    content={`https://musings-mr.net/post/${post.id}`}
                />
                <meta property="og:type" content="article" />
                <meta name="author" content={post.author || 'Matt Rkiouak'} />
                <link
                    rel="canonical"
                    href={`https://musings-mr.net/post/${post.id}`}
                />
            </Head>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                {headings.length > 0 && <TableOfContents headings={headings} />}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <RichPostRenderer post={post} charts={charts} />
                    <Box sx={{ maxWidth: 'md', mx: 'auto', mt: 4, mb: 4, px: { xs: 0, md: 2 } }}>
                        <CommentList postId={post.id} />
                    </Box>
                </Box>
            </Box>
        </>
    );
}
