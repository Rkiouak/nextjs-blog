import React from 'react';
import Head from 'next/head';
import { Container, Typography, Grid, Alert } from '@mui/material';
import LinkPreview from '../src/components/LinkPreview';

export async function getStaticProps() {
    let links = [];
    let error = null;
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/interesting-links/`;

    try {
        const response = await fetch(apiUrl, {
            headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
            console.error(`HTTP error fetching links: ${response.status}`);
            error = `Failed to load links. Status: ${response.status}`;
        } else {
            links = await response.json();
        }
    } catch (e) {
        console.error('Network error fetching links:', e);
        error = 'Failed to load links due to a network error.';
    }

    return {
        props: {
            links: links || [],
            error: error,
        },
    };
}

export default function LinksPage({ links, error }) {
    return (
        <>
            <Head>
                <title>Reading List - Musings</title>
                <meta name="description" content="A curated list of interesting links from around the web." />
            </Head>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Reading List
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 5 }}>
                    Links worth reading.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3} direction="column">
                    {links.length > 0 ? (
                        links.map((link) => (
                            <Grid item key={link.id} size={{xs:12}}>
                                <LinkPreview link={link} />
                            </Grid>
                        ))
                    ) : (
                        !error && (
                            <Typography sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
                                No links have been added yet.
                            </Typography>
                        )
                    )}
                </Grid>
            </Container>
        </>
    );
}
