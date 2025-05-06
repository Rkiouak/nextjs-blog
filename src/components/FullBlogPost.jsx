// src/components/FullBlogPost.jsx
import React from 'react';
import { Box, Typography, Divider, Paper } from '@mui/material';
import ReactMarkdown from 'react-markdown';
// Import the server-compatible sanitizer
import sanitizeHtml from 'sanitize-html';

// Function to check for HTML tags (can remain the same)
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

    // --- Configure sanitize-html ---
    // Define allowed tags and attributes. Adjust these based on the HTML
    // you expect and trust from your content source.
    const sanitizeOptions = {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
            'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'pre',
            // Add other tags you need, e.g., 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
        ]),
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes, // Keep defaults (like href on 'a')
            img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'], // Allow specific image attributes
            a: ['href', 'name', 'target', 'title'], // Customize allowed link attributes
            // Allow 'class' attribute on specific elements if needed for styling (use with caution)
            // p: ['class'],
            // pre: ['class'],
            // code: ['class'],
        },
        // Allow specific class names if needed (be restrictive)
        // allowedClasses: {
        //   'code': [ 'language-*', 'lang-*' ], // Example for code highlighting
        //   'pre': [ 'language-*', 'lang-*' ]
        // },
        // Add other options as needed (e.g., transformations, disallowedTagsMode)
        // See sanitize-html documentation for more options:
        // https://github.com/apostrophecms/sanitize-html#what-options-are-available
    };
    // --- End sanitize-html Configuration ---

    return (
        <Paper elevation={2} sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h4" component="h1" gutterBottom>
                {post.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                By {post.author} on {post.date}
            </Typography>
            {post.imageUrl && (
                <Box
                    component="img"
                    src={post.imageUrl}
                    alt={post.title || 'Blog post header image'} // Add default alt text
                    sx={{
                        maxWidth: '100%', // Make image responsive
                        height: 'auto', // Maintain aspect ratio
                        maxHeight: '400px', // Optional max height
                        objectFit: 'contain', // Changed from scale-down for better fit sometimes
                        display: 'block', // Avoid extra space below image
                        mx: 'auto', // Center image if needed
                        mb: 3,
                    }}
                />
            )}
            <Divider sx={{ my: 3 }} />

            {isHtmlContent ? (
                // Use sanitize-html - works server-side and client-side
                <Box
                    className="html-content" // Add a class for potential styling
                    dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(post.content || '', sanitizeOptions)
                    }}
                    sx={{
                        // Add basic styling for common HTML elements if needed
                        '& h1, & h2, & h3, & h4, & p, & ul, & ol, & blockquote, & pre': {
                            mb: 1.5,
                        },
                        '& blockquote': { borderLeft: '4px solid grey', pl: 2, ml: 0, fontStyle: 'italic' },
                        '& pre': { p: 1, bgcolor: 'grey.100', overflowX: 'auto', borderRadius: 1 },
                        '& code': { fontFamily: 'monospace' }, // Ensure code blocks use monospace
                        '& img': { maxWidth: '100%', height: 'auto' }, // Make images within content responsive
                        // Add more styles as needed
                    }}
                />
            ) : (
                // Use ReactMarkdown for markdown content
                <Box component="div" sx={{
                    '& h1': { mb: 2 },
                    '& h2': { mb: 2 },
                    '& h3': { mb: 1.5 },
                    '& p': { mb: 1.5 },
                    '& ul, & ol': { pl: 3, mb: 1.5 },
                    '& blockquote': { borderLeft: '4px solid grey', pl: 2, ml: 0, fontStyle: 'italic' },
                    '& pre': { p: 1, bgcolor: 'grey.100', overflowX: 'auto', borderRadius: 1 },
                    '& code': { fontFamily: 'monospace' }, // Ensure code blocks use monospace
                    '& img': { maxWidth: '100%', height: 'auto' }, // Make images within markdown responsive
                    overflowWrap: 'break-word', // Help prevent long words overflowing
                }}>
                    <ReactMarkdown>{post.content || ''}</ReactMarkdown>
                </Box>
            )}
        </Paper>
    );
}

export default FullBlogPost;