import React from 'react';
import { Box, Typography, Divider, Paper, Chip } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

// Regex to find chart placeholders like [CHART_NAME]
const CHART_PATTERN = /\[([A-Z][A-Z0-9_]+)\]/g;

// Define the schema for sanitization
const customSchema = {
    ...defaultSchema,
    tagNames: [
        ...defaultSchema.tagNames,
        'video', 'source', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i',
        'strong', 'em', 'strike', 'code', 'hr', 'br', 'pre',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'sup', 'section'
    ],
    attributes: {
        ...defaultSchema.attributes,
        video: [
            'src', 'controls', 'width', 'height', 'autoPlay', 'muted', 'loop', 'preload', 'poster'
        ],
        source: ['src', 'type'],
        img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
        a: ['href', 'name', 'target', 'title', 'id', 'ariaDescribedBy', 'ariaLabel', 'dataFootnoteRef', 'dataFootnoteBackref'],
        section: ['className', 'dataFootnotes'],
        li: ['id'],
        th: ['align'],
        td: ['align'],
        '*': ['className', 'id'],
    },
};

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

const headingComponent = (Tag) => ({ children, ...props }) => {
    const text = typeof children === 'string'
        ? children
        : Array.isArray(children)
            ? children.map(c => (typeof c === 'string' ? c : '')).join('')
            : '';
    return <Tag id={slugify(text)} {...props}>{children}</Tag>;
};

const markdownComponents = {
    h2: headingComponent('h2'),
    h3: headingComponent('h3'),
};

const markdownStyles = {
    '& h1': { mb: 2 },
    '& h2': { mb: 2 },
    '& h3': { mb: 1.5 },
    '& p': { mb: 1.5 },
    '& ul, & ol': { pl: 3, mb: 1.5 },
    '& blockquote': { borderLeft: '4px solid grey', pl: 2, ml: 0, fontStyle: 'italic' },
    '& pre': { p: 1, bgcolor: 'grey.100', overflowX: 'auto', borderRadius: 1 },
    '& code': { fontFamily: 'monospace' },
    '& img': { maxWidth: '100%', height: 'auto' },
    '& video': { maxWidth: '100%', height: 'auto' },
    '& table': {
        width: '100%',
        borderCollapse: 'collapse',
        mb: 2,
        fontSize: '0.9rem',
    },
    '& th, & td': {
        border: '1px solid',
        borderColor: 'divider',
        p: 1.5,
        textAlign: 'left',
    },
    '& th': {
        bgcolor: 'grey.100',
        fontWeight: 'bold',
    },
    '& tr:nth-of-type(even)': {
        bgcolor: 'grey.50',
    },
    overflowWrap: 'break-word',
};

/**
 * Parse content and split on chart placeholders
 */
function parseContentWithCharts(content) {
    const parts = [];
    let lastIndex = 0;
    let match;

    const regex = new RegExp(CHART_PATTERN);

    while ((match = regex.exec(content)) !== null) {
        // Add text before the placeholder
        if (match.index > lastIndex) {
            parts.push({
                type: 'markdown',
                content: content.slice(lastIndex, match.index),
            });
        }

        // Add chart placeholder
        parts.push({
            type: 'chart',
            name: match[1],
        });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        parts.push({
            type: 'markdown',
            content: content.slice(lastIndex),
        });
    }

    return parts;
}

/**
 * Render markdown content
 */
function MarkdownContent({ content }) {
    return (
        <Box component="div" sx={markdownStyles}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeRaw], [rehypeSanitize, customSchema]]}
                components={markdownComponents}
            >
                {content || ''}
            </ReactMarkdown>
        </Box>
    );
}

/**
 * Rich post renderer with chart injection support
 */
export default function RichPostRenderer({ post, charts = {} }) {
    if (!post) {
        return <Typography>Post not found.</Typography>;
    }

    const hasCharts = post.isLocalPost && Object.keys(charts).length > 0;
    const content = post.content || '';

    // Parse content for chart placeholders if this is a local post
    const parts = hasCharts ? parseContentWithCharts(content) : null;

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
                    <Chip label={post.category} color="secondary" variant="outlined" size="small" />
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

            {/* Render content with or without charts */}
            {hasCharts ? (
                parts.map((part, index) => {
                    if (part.type === 'markdown') {
                        return <MarkdownContent key={index} content={part.content} />;
                    }

                    if (part.type === 'chart') {
                        const ChartComponent = charts[part.name];
                        if (ChartComponent) {
                            return (
                                <Box key={index} sx={{ my: 3 }}>
                                    <ChartComponent />
                                </Box>
                            );
                        }
                        return (
                            <Box
                                key={index}
                                sx={{
                                    p: 2,
                                    bgcolor: 'grey.100',
                                    borderRadius: 1,
                                    my: 2,
                                    textAlign: 'center',
                                }}
                            >
                                <Typography color="text.secondary">
                                    Chart not found: {part.name}
                                </Typography>
                            </Box>
                        );
                    }

                    return null;
                })
            ) : (
                <MarkdownContent content={content} />
            )}
        </Paper>
    );
}
