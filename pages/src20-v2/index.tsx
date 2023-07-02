import { Box, Text, Center, VStack, Spacer, Button } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import wallet from '@/service/wallet'
import BackIcon from '@/component/BackIcon'
import { EXTENSION_ID } from '@/constant'

const Setting = () => {
  const router = useRouter()

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
        Send
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
          router.push('/src20/listing')
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
          router.push('/src20/myListing')
        }}
      >
        My Listings
      </Button>
    </Box>
  )
}

export default Setting
