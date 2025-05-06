import * as React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import createEmotionServer from '@emotion/server/create-instance';
import theme from '../src/theme'; // Adjust path if your theme is elsewhere
import createEmotionCache from '../src/createEmotionCache'; // Adjust path

export default class MyDocument extends Document {
  render() {
    return (
        <Html lang="en">
          <Head>
            {/* PWA primary color */}
            <meta name="theme-color" content={theme.palette.primary.main} />
            {/* Favicon is usually linked in _app.js or Head component, but can be here too */}
            {/* <link rel="shortcut icon" href="/favicon.ico" /> */}

            {/* Insertion point for Emotion styles (needed for client-side cache) */}
            <meta name="emotion-insertion-point" content="" />

            {/* Inject MUI styles first */}
            {/* This is filled by getInitialProps */}
            {this.props.emotionStyleTags}

            {/* Add Font links here if needed, e.g., Google Fonts */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
            />
          </Head>
          <body>
          <Main />
          <NextScript />
          </body>
        </Html>
    );
  }
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with static-site generation (SSG).
MyDocument.getInitialProps = async (ctx) => {

  const originalRenderPage = ctx.renderPage;

  // You can consider sharing the same Emotion cache between all the SSR requests to speed up performance.
  // However, be aware that it can have global side effects.
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App) =>
            // Use a function component type for the enhanced App
            function EnhanceApp(props) {
              // Pass the cache generated for this request down to _app.js
              return <App emotionCache={cache} {...props} />;
            },
      });

  const initialProps = await Document.getInitialProps(ctx);
  // This is important. It prevents Emotion from rendering invalid HTML.
  // See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
      <style
          data-emotion={`${style.key} ${style.ids.join(' ')}`}
          key={style.key}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: style.css }}
      />
  ));

  return {
    ...initialProps,
    emotionStyleTags, // Pass the extracted styles as props
  };
};