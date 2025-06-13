import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardMedia, Typography, CardActions, Button, Box, Chip } from '@mui/material'; // Added Chip
import { useTheme } from '@mui/material/styles';

function BlogPostPreview({ post }) {
    const theme = useTheme();

    if (!post || !post.id || !post.title) {
        console.warn('BlogPostPreview: Skipping render due to missing post data or ID/title.', post);
        return null;
    }
    const postUrl = `/post/${post.id}`;

    return (
        <Card sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            transition: theme.transitions.create(['box-shadow', 'transform'], { duration: theme.transitions.duration.short }),
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[6],
            }
        }}>
            {post.imageUrl && (
                <Box sx={{ overflow: 'hidden', height: 160 }}> {/* Set fixed height for the image container */}
                    <CardMedia
                        component="img"
                        image={post.imageUrl}
                        alt={post.title}
                        sx={{
                            objectFit: 'cover',
                            width: '100%',
                            height: '100%', // Make image fill the fixed-height container
                            transition: 'transform 0.35s ease-in-out',
                            '&:hover': {
                                transform: 'scale(1.05)',
                            }
                        }}
                    />
                </Box>
            )}
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 'medium' }}>
                    {post.title}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                        By {post.author || 'Unknown Author'} on {post.date || 'Unknown Date'}
                    </Typography>
                    {post.category && (
                        <Chip label={post.category} size="small" variant="outlined" sx={{ ml: 1 }} />
                    )}
                </Box>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mb: 2,
                        flexGrow: 1,
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {post.snippet}
                </Typography>
            </CardContent>
            <CardActions sx={{ mt: 'auto', pt: 0 }}>
                <Link href={postUrl} passHref legacyBehavior>
                    <Button size="small" component="a">
                        Read More
                    </Button>
                </Link>
            </CardActions>
        </Card>
    );
}

export default BlogPostPreview;