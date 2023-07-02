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
import WifKeyRing from '@/service/WifKeyRing'

enum TYPE_OPTIONS {
  HD_WALLET_ACCOUNT = 'hd_wallet_account',
  PRIVATE_KEY = 'private_key',
  WATCH = 'watch',
}

const typeOptions = [
  { value: TYPE_OPTIONS.HD_WALLET_ACCOUNT, label: 'New Wallet Account' },
  { value: TYPE_OPTIONS.PRIVATE_KEY, label: 'Import Private Key' },
  { value: TYPE_OPTIONS.WATCH, label: 'Watch Only' },
]

const generateNumOptions = (number) => {
  let options: any = []
  for (let i = 0; i < number; i++) {
    options.push({ value: i, label: `Wallet #${i}` })
  }
  return options
}

const maxHdPathIndex = 1000000

const generateSplits = (data) => {
  const res = data.split(' ')

  if (res.length === 12 || res.length === 24) return res

  if (res.length < 12) {
    while (res.length < 12) {
      res.push('')
    }
    return res.splice(0, 12)
  }

  if (res.length < 24) {
    while (res.length < 24) {
      res.push('')
    }
    return res.splice(0, 24)
  }

  return res.splice(0, 24)
}

const Home = () => {
  const [password, setPassword] = useState('')
  const [mnemonic, setMnemonic] = useState('')
  console.log(mnemonic)

  return (
    <SettingLayout center="Reveal Pass" right={null}>
      <Text mt="20px">Type your password again:</Text>
      <Input mt="10px" type="password" onChange={(e) => setPassword(e.target.value)}></Input>
      <Button
        fontSize="14px"
        mt="20px"
        w="100%"
        onClick={async () => {
          const res = await wallet.verifyPassword(password)
          if (!res) {
            notifyWarn({ title: 'Incorrect Password' })
            return
          }
          console.log(res)
          const hdKeyRings = wallet.getHdKeyRings()
          console.log(hdKeyRings)
          setMnemonic(hdKeyRings[0].mnemonic)
        }}
      >
        Show My 12/24 Word Pass Phrase
      </Button>

      {mnemonic && (
        <Box>
          <Box bg="gray.800" borderRadius="6px" p="20px" my="10px">
            <SimpleGrid columns={3} spacingX="40px" spacingY="20px">
              {generateSplits(mnemonic).map((each, index) => {
                return (
                  <Center key={index} height="20px">
                    <Text fontSize="14px" color="#888888" mr="5px">
                      {index + 1}
                    </Text>
                    <Text fontSize="14px">{each}</Text>
                  </Center>
                )
              })}
            </SimpleGrid>
          </Box>

          <Button
            w="100%"
            onClick={() => {
              navigator.clipboard.writeText(mnemonic)
              notify({
                title: `Seed Phrase Copied`,
              })
            }}
          >
            Copy
          </Button>
        </Box>
      )}
    </SettingLayout>
  )
}

export default Home
