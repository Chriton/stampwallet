import Layout from '@/component/Layout'
import '@/styles/globals.css'
import { Box, useColorMode, Center, Spinner } from '@chakra-ui/react'
import NoSSRWrapper from '@/component/no-ssr-wrapper'

import { ChakraProvider } from '@chakra-ui/react'

export default function App({ Component, pageProps }) {
  return (
    <NoSSRWrapper>
      <Box>
        <Box>
          <ChakraProvider toastOptions={{ defaultOptions: { position: 'top' } }}>
            <Layout>
              <Component {...pageProps} />{' '}
            </Layout>
          </ChakraProvider>
        </Box>
      </Box>
    </NoSSRWrapper>
  )
}
