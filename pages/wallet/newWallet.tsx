import {
  Box,
  Text,
  Center,
  VStack,
  SimpleGrid,
  Spacer,
  Button,
  Input,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react'
import { useRouter } from 'next/router'
import wallet from '@/service/wallet'
import { useEffect, useState } from 'react'
import { Select } from '@/component/Select'
import { notify, notifyWarn } from '@/utils/common'
import { SettingLayout } from '@/component/SettingLayout'

const Home = () => {
  const router = useRouter()

  return (
    <SettingLayout center="New Wallet" right={null}>
      <Text mt="20px">
        Creating a new wallet will replace your old wallet. Make sure you have saved the old wallet
        seed phrase and all other critical information.
      </Text>

      <Text mt="20px">The data of your old wallet is not recoverable by us.</Text>

      <Text mt="20px">Only proceed when you have saved all the critical info!</Text>

      <Button
        fontSize="14px"
        mt="20px"
        w="100%"
        onClick={async () => {
          router.push('/welcome')
        }}
      >
        Confirm
      </Button>
    </SettingLayout>
  )
}

export default Home
