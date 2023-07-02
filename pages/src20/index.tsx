import { Box, Text, Center, VStack, Spacer, Button } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import wallet from '@/service/wallet'
import BackIcon from '@/component/BackIcon'
import { EXTENSION_ID } from '@/constant'

const Setting = () => {
  const router = useRouter()
  const webMode = window.innerWidth > 600

  return (
    <Box>
      <BackIcon />

      <Spacer mt="50px" />

      <Spacer mt="20px" />
      <Button
        w="100%"
        onClick={() => {
          router.push('/src20/send')
        }}
      >
        Transfer
      </Button>

      <Spacer mt="20px" />
      <Button
        w="100%"
        onClick={() => {
          router.push('/src20/mint')
        }}
      >
        Mint
      </Button>

      <Spacer mt="20px" />
      <Button
        w="100%"
        onClick={() => {
          router.push('/src20/deploy')
        }}
      >
        Deploy
      </Button>

      <Spacer mt="20px" />
      <Button
        w="100%"
        onClick={() => {
          if (webMode) {
            router.push('/src20/listing')
          } else {
            const route = 'src20Listing'
            window.open(`chrome-extension://${EXTENSION_ID}/index.html?route=${route}`)
          }
        }}
      >
        Buy
      </Button>

      <Spacer mt="20px" />
      <Button
        w="100%"
        onClick={() => {
          router.push('/src20/list')
        }}
      >
        Sell
      </Button>

      <Spacer mt="20px" />
      <Button
        w="100%"
        onClick={() => {
          if (webMode) {
            router.push('/src20/myListing')
          } else {
            const route = 'src20MyListing'
            window.open(`chrome-extension://${EXTENSION_ID}/index.html?route=${route}`)
          }
        }}
      >
        My Listings
      </Button>
    </Box>
  )
}

export default Setting
