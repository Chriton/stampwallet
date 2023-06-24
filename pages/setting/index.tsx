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
      <Button
        w="100%"
        onClick={() => {
          window.open(`chrome-extension://${EXTENSION_ID}/index.html`)
        }}
      >
        Open in new tab
      </Button>

      <Spacer mt="20px" />
      <Button
        w="100%"
        onClick={() => {
          router.push('/setting/accounts')
        }}
      >
        Accounts
      </Button>

      <Spacer mt="20px" />
      <Button
        w="100%"
        onClick={() => {
          router.push('/setting/network')
        }}
      >
        Network
      </Button>

      <Spacer mt="20px" />
      <Button
        w="100%"
        onClick={() => {
          router.push('/lock')
        }}
      >
        Lock
      </Button>
    </Box>
  )
}

export default Setting
