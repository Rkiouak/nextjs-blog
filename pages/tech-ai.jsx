// pages/tech-ai.jsx
import React, { useState } from 'react';
import Head from 'next/head';
import {
    Grid,
    Typography,
    Box,
    Alert,
    Tabs,
    Tab,
} from '@mui/material';
import BlogPostPreview from '../src/components/BlogPostPreview';
import { getAllPosts } from '../src/lib/posts';

const TECH_AI_CATEGORIES = ['Tech', 'GenAI', 'Creativity & AI'];

export async function getStaticProps() {
    let posts = [];
    let blogError = null;
    let categories = ['All'];

    try {
        const allPosts = await getAllPosts();
        // Filter to only Tech & AI related posts
        posts = allPosts.filter(
            post => TECH_AI_CATEGORIES.includes(post.category)
        );
        // Build categories from available posts
        const uniqueCategories = new Set(posts.map(p => p.category).filter(Boolean));
        categories = ['All', ...Array.from(uniqueCategories)];
    } catch (e) {
        console.error('Error fetching posts:', e);
        blogError = 'Failed to load posts.';
    }

    return {
        props: {
            posts: posts || [],
            blogError: blogError,
            categories: categories,
        },
    };
}


export default function TechAIPage({ posts, blogError, categories }) {
    const [selectedCategory, setSelectedCategory] = useState('All');

    const handleCategoryChange = (event, newValue) => {
        setSelectedCategory(newValue);
    };

    const filteredPosts = selectedCategory === 'All'
        ? posts
        : posts.filter(post => post.category === selectedCategory);

    return (
        <>
            <Head>
                <title>Musings - Tech & AI</title>
                <meta
                    name="description"
                    content="Matt Rkiouak's writings on technology, generative AI, and creative applications of AI."
                />
                <meta property="og:title" content="Musings - Tech & AI" />
                <meta
                    property="og:description"
                    content="Matt Rkiouak's writings on technology, generative AI, and creative applications of AI."
                />
            </Head>
            <Box>
                <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    align="center"
                    sx={{ mb: 2, fontWeight: 'medium' }}
                >
                    Tech & AI
                </Typography>

                {blogError && (
                    <Alert severity="error" sx={{ my: 3 }}>
                        {blogError} Please try refreshing the page later.
                    </Alert>
                )}
                {!blogError && (
                    <>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                            <Tabs
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                                aria-label="tech and AI post categories"
                                centered
                                indicatorColor="secondary"
                                textColor="secondary"
                                variant="scrollable"
                                scrollButtons="auto"
                            >
                                {categories.map((category) => (
                                    <Tab label={category} value={category} key={category} />
                                ))}
                            </Tabs>
                        </Box>
                        <Grid container spacing={4}>
                            {filteredPosts.length > 0 ? (
                                filteredPosts.map((post) => (
                                    <Grid item key={post.id} size={{xs:12, sm:6, md:6}}>
                                        <BlogPostPreview post={post} />
                                    </Grid>
                                ))
                            ) : (
                                <Grid item size={{xs:12}}>
                                    <Typography align="center" sx={{py: 3, color: 'text.secondary'}}>
                                        No posts found for this category.
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    </>
                )}
            </Box>
        </>
    );
}
