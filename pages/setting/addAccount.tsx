import {
  Box,
  Text,
  Center,
  VStack,
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

const Home = () => {
  const [type, setType] = useState(typeOptions[0])
  const [hdKeyRingIndex, setHdKeyRingIndex] = useState({ value: 0, label: `Wallet #0` })
  const [hdPathIndex, setHdPathIndex] = useState(0)
  const [accountName, setAccountName] = useState('')
  const [wif, setWif] = useState('')
  const [addressType, setAddressType] = useState({ label: 'Segwit', value: 'segwit' })
  const [address, setAddress] = useState('')
  const router = useRouter()

  return (
    <SettingLayout>
      <Text mt="20px">Type:</Text>

      <Select options={typeOptions} value={type} onChange={setType} />
      {type.value === TYPE_OPTIONS.HD_WALLET_ACCOUNT && (
        <Box>
          <Text mt="20px">Wallet:</Text>
          <Select
            options={generateNumOptions(wallet.getHdKeyRingCount())}
            value={hdKeyRingIndex}
            onChange={setHdKeyRingIndex}
          />
          <Text mt="20px">Account Index:</Text>
          <NumberInput
            onChange={(valueAsString, valueAsNum) =>
              setHdPathIndex(Math.min(2100000, valueAsNum) || 0)
            }
            keepWithinRange
            defaultValue={0}
            min={0}
            max={maxHdPathIndex}
          >
            <NumberInputField />
          </NumberInput>
          <Text mt="20px">Address:</Text>
          <Text fontSize={'13px'}>
            {
              wallet
                .getHdKeyRing(hdKeyRingIndex.value)
                ?.getAccount(Math.min(maxHdPathIndex, hdPathIndex), wallet.getNetwork())?.address
            }
          </Text>

          <Text mt="20px">Name: (optional)</Text>
          <Input onChange={(e) => setAccountName(e.target.value)} value={accountName}></Input>
        </Box>
      )}
      {type.value === TYPE_OPTIONS.PRIVATE_KEY && (
        <Box>
          <Text mt="20px">Private Key (WIF):</Text>
          <Input
            onChange={(e) => {
              const wifInput = e.target.value
              const wifFormatted = wifInput.includes(':') ? wifInput.split(':')[1] : wifInput
              setWif(wifFormatted)
            }}
          ></Input>
          <Text mt="20px">Address Type:</Text>
          <Select
            options={[
              { label: 'Segwit (use this for bxxxx address)', value: 'segwit' },
              { label: 'Legacy (use this for 1xxxx address)', value: 'legacy' },
            ]}
            value={addressType}
            onChange={setAddressType}
          />
          {wif && (
            <>
              <Text mt="20px">Address:</Text>
              <Text fontSize={'13px'}>
                {new WifKeyRing(wif, addressType.value).getAccount(wallet.getNetwork()).address}
              </Text>
            </>
          )}

          <Text mt="20px">Name: (optional)</Text>
          <Input onChange={(e) => setAccountName(e.target.value)} value={accountName}></Input>
        </Box>
      )}

      {type.value === TYPE_OPTIONS.WATCH && (
        <Box>
          <Text mt="20px">Address:</Text>
          <Input onChange={(e) => setAddress(e.target.value)}></Input>
          <Text mt="20px">Name: (optional)</Text>
          <Input onChange={(e) => setAccountName(e.target.value)} value={accountName}></Input>
        </Box>
      )}

      {(type.value === TYPE_OPTIONS.HD_WALLET_ACCOUNT ||
        type.value === TYPE_OPTIONS.PRIVATE_KEY ||
        type.value === TYPE_OPTIONS.WATCH) && (
        <Box>
          <Button
            mt="20px"
            w="100%"
            onClick={() => {
              let res = false
              if (type.value === TYPE_OPTIONS.HD_WALLET_ACCOUNT) {
                res = wallet.addHdKeyRingAccount(hdKeyRingIndex.value, hdPathIndex, accountName)
              }
              if (type.value === TYPE_OPTIONS.PRIVATE_KEY) {
                res = wallet.addWifKeyRingAccount(wif, addressType.value, accountName)
              }
              if (type.value === TYPE_OPTIONS.WATCH) {
                res = wallet.addWatchKeyRingAccount(address, accountName)
              }

              if (res) {
                notify({ title: 'Account added' })
                router.back()
              } else {
                notifyWarn({
                  title: `You have added account index: #${hdPathIndex}. Please try a different index.`,
                  duration: 3000,
                })
              }
            }}
          >
            Add
          </Button>
        </Box>
      )}
    </SettingLayout>
  )
}

export default Home
