import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Container, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import LinkPreview from '../src/components/LinkPreview';

export default function LinksPage() {
    // State to hold the links, loading status, and any errors
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect to fetch data when the component mounts
    useEffect(() => {
        const fetchLinks = async () => {
            try {
                // Fetch from the new API endpoint
                const response = await fetch('/api/interesting-links/');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setLinks(data); // Set the fetched links into state
            } catch (e) {
                setError(e.message); // Set error state if something goes wrong
                console.error("Failed to fetch interesting links:", e);
            } finally {
                setLoading(false); // Set loading to false once done
            }
        };

        fetchLinks();
    }, []); // Empty dependency array ensures this effect runs only once on mount

    // Render loading state
    if (loading) {
        return (
            <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading links...</Typography>
            </Container>
        );
    }

    // Render error state
    if (error) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">
                    <strong>Failed to Load Links</strong><br />
                    There was a problem retrieving the links. Please try again later.<br />
                    <Typography variant="caption">Error: {error}</Typography>
                </Alert>
            </Container>
        );
    }

    return (
        <>
            <Head>
                <title>Links I Found Interesting - Musings</title>
                <meta name="description" content="A curated list of interesting links from around the web." />
            </Head>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Interesting Links
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 5 }}>
                    A list of links worth reading.
                </Typography>
                <Grid container spacing={3} direction="column">
                    {links.length > 0 ? (
                        links.map((link) => (
                            <Grid item key={link.id} size={{xs:12}}>
                                <LinkPreview link={link} />
                            </Grid>
                        ))
                    ) : (
                        <Typography sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
                            No interesting links have been added yet.
                        </Typography>
                    )}
                </Grid>
            </Container>
        </>
    );
}