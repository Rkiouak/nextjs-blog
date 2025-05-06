import React from 'react';
import Link from 'next/link'; // Use Next.js Link
import { Card, CardContent, CardMedia, Typography, CardActions, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Expects a 'post' object prop with id, title, snippet, imageUrl, date, author
function BlogPostPreview({ post }) {
    const theme = useTheme(); // Get the theme object

    // --- Defensive Check ---
    // If post data or essential fields like id or title are missing, render nothing or a placeholder
    if (!post || !post.id || !post.title) {
        console.warn('BlogPostPreview: Skipping render due to missing post data or ID/title.', post);
        return null; // Don't render the card if data is incomplete
    }
    // --- End Check ---

    // Construct the link URL safely now that we know post.id exists
    const postUrl = `/post/${post.id}`;

    return (
        <Card sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%', // Ensure cards in a grid row have same height
            transition: theme.transitions.create(['box-shadow', 'transform'], { duration: theme.transitions.duration.short }),
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4],
            }
        }}>
            {post.imageUrl && (
                <CardMedia
                    component="img"
                    height="140" // Fixed height for consistency
                    image={post.imageUrl}
                    alt={post.title}
                    sx={{ objectFit: 'cover' }} // Ensure image covers the area
                />
            )}
            <CardContent sx={{ flexGrow: 1 }}> {/* Allow content to grow */}
                <Typography gutterBottom variant="h5" component="div">
                    {post.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {/* Add defensive checks for author/date if they might be missing */}
                    By {post.author || 'Unknown Author'} on {post.date || 'Unknown Date'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {post.snippet}
                </Typography>
            </CardContent>
            <CardActions>
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
