import React from 'react';
import Head from 'next/head'; // For page title
import Link from 'next/link'; // Use Next.js Link
import { Typography, Box, Button } from '@mui/material';

export default function Custom404() {
    return (
        <>
            <Head>
                <title>404 - Page Not Found</title>
            </Head>
            <Box
                sx={{
                    textAlign: 'center',
                    mt: 8, // Add top margin
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 'calc(100vh - 200px)', // Adjust based on header/footer height to center vertically
                    p: 3,
                }}
            >
                <Typography variant="h3" component="h1" gutterBottom>
                    404 - Page Not Found
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                    Oops! Looks like the page you are looking for does not exist.
                </Typography>
                {/* Use Next.js Link component */}
                <Link href="/" passHref legacyBehavior>
                    <Button variant="contained" component="a"> {/* Add component="a" for MUI */}
                        Go Back Home
                    </Button>
                </Link>
            </Box>
        </>
    );
}