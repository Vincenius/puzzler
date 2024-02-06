import { Html, Head, Main, NextScript } from "next/document";
import { ColorSchemeScript } from '@mantine/core';

export default function Document() {
  return (
    <Html lang="de">
      <Head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <meta name="application-name" content="Happy Sunday Puzzler" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Happy Sunday Puzzler" />
        <meta name="description" content="Happy Sunday Puzzler" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2B5797" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#ffffff" />

        <link rel="apple-touch-icon" href="/icons/touch-icon-iphone.png" />
        <link rel="apple-touch-icon" sizes="200x200" href="/icons/favicon.png" />

        <link rel="icon" type="image/png" sizes="200x200" href="/icons/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#5bbad5" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
