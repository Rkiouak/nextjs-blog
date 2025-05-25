// nextjs-blog/pages/resume.jsx
import React from 'react';
import Head from 'next/head';
import { Box, Typography, Paper, Container } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function ResumePage() {
    const theme = useTheme();
    const resumeUrl = '/matt-rkiouak-resume.pdf';

    return (
        <>
            <Head>
                <title>Matt Rkiouak's Resume</title>
                <meta name="description" content="View Matt Rkiouak's resume." />
            </Head>
            <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
                <Paper
                    elevation={3}
                    sx={{
                        width: '100%',
                        height: {
                            // Attempt to make it responsive, but embedding PDFs can be tricky
                            // Adjust these values as needed
                            xs: 'calc(100vh - 140px)', // Smaller screens
                            sm: 'calc(100vh - 160px)', // Small screens
                            md: 'calc(100vh - 180px)', // Medium screens
                        },
                        overflow: 'hidden', // Hide scrollbars from Paper, iframe will have its own
                    }}
                >
                    <Box
                        component="iframe"
                        src={resumeUrl}
                        title="Matt Rkiouak's Resume"
                        sx={{
                            width: '100%',
                            height: '100%',
                            border: 'none', // Remove iframe border
                        }}
                    />
                </Paper>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        If the PDF does not display, you can{' '}
                        <a href={resumeUrl} download="matt-rkiouak-resume.pdf" style={{ color: theme.palette.primary.main }}>
                            download it here
                        </a>.
                    </Typography>
                </Box>
            </Container>
        </>
    );
}