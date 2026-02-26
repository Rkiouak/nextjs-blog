// pages/about.jsx
import React from 'react';
import Head from 'next/head';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Button,
    Divider,
} from '@mui/material';
import Link from 'next/link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function AboutPage() {
    const skills = [
        'Distributed Systems',
        'APIs',
        'Python',
        'Java',
        'C++',
        'Clojure',
        'LLM Productization',
        'Kubernetes',
    ];

    return (
        <>
            <Head>
                <title>About - Matt Rkiouak</title>
                <meta
                    name="description"
                    content="Matt Rkiouak - Software engineer based in Vermont."
                />
            </Head>
            <Box sx={{ maxWidth: 700, mx: 'auto' }}>
                <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    sx={{ fontWeight: 'medium', mb: 3 }}
                >
                    About
                </Typography>

                <Typography variant="body1" paragraph>
                    Software engineer based in Middlesex, Vermont. Currently Engineering Lead at ScalePost,
                    building Answer Engine analytics and optimization tools, plus new products in media monitoring
                    and affiliate marketing attribution.
                </Typography>

                <Typography variant="body1" paragraph>
                    Previously at Google (Cloud AI Speech, Identity), Reify Health, and State Street.
                    Background in distributed systems, identity/auth, and ML infrastructure.
                </Typography>

                <Typography variant="body1" paragraph>
                    This site covers economics, civics, and local government. I also built{' '}
                    <a href="https://middlesexbudget.org" target="_blank" rel="noopener noreferrer" style={{ color: '#5b8a72' }}>
                        middlesexbudget.org
                    </a>{' '}
                    for municipal budget transparency.
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'medium' }}>
                    Skills
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {skills.map((skill) => (
                        <Chip
                            key={skill}
                            label={skill}
                            variant="outlined"
                            size="small"
                        />
                    ))}
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Button
                        variant="outlined"
                        component={Link}
                        href="/resume"
                        size="small"
                        sx={{ borderColor: '#5b8a72', color: '#5b8a72' }}
                    >
                        Resume
                    </Button>
                    <Button
                        variant="outlined"
                        component="a"
                        href="https://www.linkedin.com/in/mattrkiouak/"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        endIcon={<OpenInNewIcon fontSize="small" />}
                        sx={{ borderColor: '#5b8a72', color: '#5b8a72' }}
                    >
                        LinkedIn
                    </Button>
                    <Button
                        variant="outlined"
                        component={Link}
                        href="/links"
                        size="small"
                        sx={{ borderColor: '#5b8a72', color: '#5b8a72' }}
                    >
                        Reading List
                    </Button>
                </Box>
            </Box>
        </>
    );
}
