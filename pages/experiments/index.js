// pages/experiments/index.jsx
import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Container,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    Paper,
    CircularProgress,
    Link as MuiLink,
    Divider,
} from '@mui/material';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ExperimentsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login?from=/experiments');
        }
    }, [isAuthenticated, isAuthLoading, router]);

    if (isAuthLoading || !isAuthenticated) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading experiments...</Typography>
            </Box>
        );
    }

    const experiments = [
        { id: 'campfire-storytelling', title: 'Campfire Storytelling', description: 'Interactive, themed storytelling session.' },
        { id: 'exp2', title: 'Experiment Beta (Placeholder)', description: 'Description for Beta.' },
        { id: 'exp3', title: 'Experiment Gamma (Placeholder)', description: 'Description for Gamma.' },
    ];

    return (
        <>
            <Head>
                <title>Experiments - Musings</title>
                <meta name="description" content="A collection of experimental projects and features." />
                <meta name="robots" content="noindex" />
            </Head>
            <Container maxWidth="md">
                <Paper elevation={3} sx={{ marginTop: 4, padding: { xs: 2, md: 4 } }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        Experiments
                    </Typography>
                    <Typography variant="body1" paragraph align="center">
                        Welcome to the lab! Here are some ongoing experiments:
                    </Typography>
                    <List>
                        {experiments.map((exp, index) => (
                            <React.Fragment key={exp.id}>
                                <ListItem
                                    disablePadding
                                >
                                    <Link href={`/experiments/${exp.id}`} passHref legacyBehavior>
                                        <MuiLink component="a" sx={{
                                            display: 'block',
                                            width: '100%',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            p: 1.5, // Increased padding
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                                borderRadius: 1
                                            },
                                        }}>
                                            <ListItemText
                                                primaryTypographyProps={{variant: 'h6'}}
                                                primary={exp.title}
                                                secondary={exp.description}
                                            />
                                        </MuiLink>
                                    </Link>
                                </ListItem>
                                {index < experiments.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                        {experiments.length === 0 && (
                            <Typography sx={{ textAlign: 'center', fontStyle: 'italic', mt: 2 }}>
                                No experiments available at the moment. Check back later!
                            </Typography>
                        )}
                    </List>
                </Paper>
            </Container>
        </>
    );
}