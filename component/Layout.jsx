import { Box, useColorMode, Center, Spinner } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { StoreProvider } from '@/context/store'
import { useRouter } from 'next/router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import wallet from '@/service/wallet'

const queryClient = new QueryClient()

export default function Layout({ children }) {
  const { colorMode, toggleColorMode } = useColorMode()

  const router = useRouter()
  const [account, setAccount] = useState(null)

  const isUnlockPage = router.route === '/unlock'
  const isWelcomePage = router.route === '/welcome' || router.route === '/wallet'

  const isListingPage = ['/src20/listing', '/src20/myListing'].includes(router.route)

  console.log('query', router.query)
  if (router.asPath === '/index.html?route=src20Listing') {
    router.push('/src20/listing')
  } else if (router.asPath === '/index.html?route=src20MyListing') {
    router.push('/src20/myListing')
  }

  useEffect(() => {
    const tryLoadWallet = async () => {
      console.log('Try load wallet')
      const walletHasData = await wallet.localStorageHasData()

      if (walletHasData) {
        try {
          await wallet.load()
          console.log(router)
          if (!isUnlockPage && !isWelcomePage) {
            router.push(router.pathname)
          }
          console.log('wallet loaded')
        } catch (e) {
          console.log(e)
          console.log('Auto unlock fail. Redirect to manual unlock')
          if (!isUnlockPage) router.push('/unlock')
        }
      } else {
        if (!isWelcomePage) router.push('/welcome')
      }
    }

    try {
      if (!isWelcomePage) setAccount(wallet.getCurrentAccount())
    } catch (e) {
      tryLoadWallet()
    }
  }, [setAccount, router, isUnlockPage, isWelcomePage])

  // const webMode = window.innerHeight > 600
  const webMode = window.innerWidth > 600
  const marginTop = webMode ? '100px' : '0px'

  useEffect(() => {
    if (colorMode === 'light') {
      toggleColorMode()
    }
  })

  const waitForWallet = !isUnlockPage && !isWelcomePage && account === null

  const waitForWalletContent = (
    <Center mt="300px">
      <Spinner />
    </Center>
  )

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <Box
          mt={marginTop}
          maxW={webMode && isListingPage ? '760px' : '360px'}
          ml={webMode && isListingPage ? '-200px' : '0px'}
          maxH="600px"
          bgColor={'gray.800'}
          width="100vw"
          height="100vh"
          borderRadius={webMode ? '8px' : '0px'}
          borderColor={webMode ? 'gray.100' : 'gray.800'}
          borderWidth={webMode ? '1px' : '0px'}
          p="20px"
        >
          <div>{waitForWallet ? waitForWalletContent : children}</div>
        </Box>
      </StoreProvider>
    </QueryClientProvider>
  )
}
