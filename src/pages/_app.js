import "@/styles/globals.css";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

const theme = createTheme({
  /** Put your mantine theme override here */
});

export default function App({ Component, pageProps }) {
  return <MantineProvider theme={theme}>
    <Notifications position="top-right" />
    <Component {...pageProps} />
  </MantineProvider>
}
