import React from 'react';
import { Card, CardActionArea, CardContent, CardMedia, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

function LinkPreview({ link }) {
    const theme = useTheme();

    if (!link || !link.url || !link.title) {
        return null;
    }

    return (
        <Card sx={{
            display: 'flex',
            transition: theme.transitions.create(['box-shadow', 'transform'], { duration: theme.transitions.duration.short }),
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[6],
            }
        }}>
            <CardActionArea
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: 'flex', textDecoration: 'none', color: 'inherit', justifyContent: 'flex-start' }}
            >
                {link.imageUrl && (
                    <CardMedia
                        component="img"
                        sx={{ width: 160, height: '100%', objectFit: 'cover', flexShrink: 0 }}
                        image={link.imageUrl}
                        alt={`Preview for ${link.title}`}
                    />
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <CardContent sx={{ flex: '1 0 auto' }}>
                        <Typography component="div" variant="h6">
                            {link.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {link.url}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {link.description}
                        </Typography>
                    </CardContent>
                </Box>
            </CardActionArea>
        </Card>
    );
}

export default LinkPreview;