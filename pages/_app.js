import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head'; // Import Head for metadata defaults
import Script from 'next/script'; // Import Script for GA
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react'; // Needed for Emotion SSR with MUI

import theme from '../src/theme'; // Adjust path if needed
import { AuthProvider } from '@/context/AuthContext'; // Adjust path if needed
import createEmotionCache from '../src/createEmotionCache'; // Utility for MUI SSR (see below)
import Layout from '../src/components/Layout'; // Import your main Layout
import { GoogleAnalytics } from '@next/third-parties/google';

// Import global styles
import '../src/styles/globals.css';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export default function MyApp(props) {
  // If you have custom emotion cache logic, use it here, otherwise default
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  // Determine if the Layout should be used.
  // Example: Don't use layout on a specific page like a dedicated fullscreen map
  const useLayout = Component.useLayout !== false; // Pages can opt-out by exporting `useLayout = false`

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        {/* Set default viewport and potentially other static head elements */}
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        {/* Favicon link moved from index.html - place favicon in /public */}
        <link rel="icon" type="image/jpeg" href="/newf-head.jpeg" />
      </Head>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstarts an elegant, consistent, simple baseline to build upon. */}
        <CssBaseline />
        <AuthProvider>
          {/* Conditionally wrap with Layout */}
          {useLayout ? (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          ) : (
            <Component {...pageProps} />
          )}
        </AuthProvider>
      </ThemeProvider>
        <GoogleAnalytics gaId={"G-0NWQCXZFW7"}/>
    </CacheProvider>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  emotionCache: PropTypes.object,
  pageProps: PropTypes.object.isRequired,
};
