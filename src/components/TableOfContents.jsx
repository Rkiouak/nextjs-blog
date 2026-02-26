import React, { useState } from 'react';
import { Box, Typography, Drawer, IconButton, Fab } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

function HeadingList({ headings, onClickLink }) {
    return headings.map((heading) => (
        <Box
            key={heading.id}
            component="a"
            href={`#${heading.id}`}
            onClick={onClickLink}
            sx={{
                display: 'block',
                fontSize: '0.82rem',
                color: 'text.secondary',
                textDecoration: 'none',
                py: 0.4,
                pl: heading.level === 3 ? 2 : 0,
                '&:hover': {
                    color: 'primary.main',
                },
            }}
        >
            {heading.text}
        </Box>
    ));
}

export default function TableOfContents({ headings }) {
    const [drawerOpen, setDrawerOpen] = useState(false);

    if (!headings || headings.length === 0) return null;

    return (
        <>
            {/* Desktop sticky sidebar */}
            <Box
                component="nav"
                sx={{
                    position: 'sticky',
                    top: 80,
                    width: 220,
                    flexShrink: 0,
                    display: { xs: 'none', md: 'block' },
                    alignSelf: 'flex-start',
                    maxHeight: 'calc(100vh - 100px)',
                    overflowY: 'auto',
                    pr: 2,
                }}
            >
                <Typography
                    variant="overline"
                    sx={{ fontWeight: 'bold', color: 'text.secondary', mb: 1, display: 'block' }}
                >
                    Contents
                </Typography>
                <HeadingList headings={headings} />
            </Box>

            {/* Mobile FAB */}
            <Fab
                size="small"
                color="primary"
                aria-label="Table of contents"
                onClick={() => setDrawerOpen(true)}
                sx={{
                    display: { xs: 'flex', md: 'none' },
                    position: 'fixed',
                    bottom: 24,
                    left: 24,
                    zIndex: 1200,
                }}
            >
                <MenuIcon />
            </Fab>

            {/* Mobile drawer */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{ display: { md: 'none' } }}
                PaperProps={{ sx: { width: 260, p: 2, pt: 3 } }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="overline" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                        Contents
                    </Typography>
                    <IconButton size="small" onClick={() => setDrawerOpen(false)}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <HeadingList headings={headings} onClickLink={() => setDrawerOpen(false)} />
            </Drawer>
        </>
    );
}
