// src/components/FullBlogPost.jsx
import React from 'react';
import { Box, Typography, Divider, Paper, Chip } from '@mui/material'; // Added Chip
import ReactMarkdown from 'react-markdown';
import sanitizeHtml from 'sanitize-html';

function containsHtmlTags(content) {
    if (!content || typeof content !== 'string') {
        return false;
    }
    const htmlTagRegex = /<[a-z/][\s\S]*>/i;
    return htmlTagRegex.test(content);
}

function FullBlogPost({ post }) {
    if (!post) {
        return <Typography>Post not found.</Typography>;
    }

    const isHtmlContent = containsHtmlTags(post.content);

    const sanitizeOptions = {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
            'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'pre', 'video'
        ]),
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
            a: ['href', 'name', 'target', 'title'],
        },
    };

    return (
        <Paper elevation={2} sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h4" component="h1" gutterBottom>
                {post.title}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" color="text.secondary">
                    By {post.author} on {post.date}
                </Typography>
                {post.category && (
                    <Chip label={post.category} color="secondary" variant="outlined" size="small"/>
                )}
            </Box>
            {post.imageUrl && (
                <Box
                    component="img"
                    src={post.imageUrl}
                    alt={post.title || 'Blog post header image'}
                    sx={{
                        maxWidth: '100%',
                        height: 'auto',
                        maxHeight: '400px',
                        objectFit: 'contain',
                        display: 'block',
                        mx: 'auto',
                        mb: 3,
                    }}
                />
            )}
            <Divider sx={{ my: 3 }} />
                <Box component="div" sx={{
                    '& h1': { mb: 2 },
                    '& h2': { mb: 2 },
                    '& h3': { mb: 1.5 },
                    '& p': { mb: 1.5 },
                    '& ul, & ol': { pl: 3, mb: 1.5 },
                    '& blockquote': { borderLeft: '4px solid grey', pl: 2, ml: 0, fontStyle: 'italic' },
                    '& pre': { p: 1, bgcolor: 'grey.100', overflowX: 'auto', borderRadius: 1 },
                    '& code': { fontFamily: 'monospace' },
                    '& img': { maxWidth: '100%', height: 'auto' },
                    overflowWrap: 'break-word',
                }}>
                    <ReactMarkdown>{post.content || ''}</ReactMarkdown>
                </Box>
        </Paper>
    );
}

export default FullBlogPost;