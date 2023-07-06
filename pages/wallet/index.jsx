import {
  Box,
  Text,
  Center,
  VStack,
  Spacer,
  Button,
  SimpleGrid,
  InputGroup,
  InputRightElement,
  Input,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { notifyWarn, notify } from '@/utils/common'
import PasswordInput from '@/component/PasswordInput'
import wallet from '@/service/wallet'

const STEP_MNEMONIC_IMPORT = 'mnemonic_import'
const STEP_PASSWORD = 'password'

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

export default function Wallet() {
  const [mnemonic, setMnemonic] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const router = useRouter()

  const [step, setStep] = useState(router.query.step)
  if (mnemonic.split(' ').length > 24) {
    notifyWarn({
      title: `Seed phrase error: invalid words length: ${mnemonic.split(' ').length}`,
    })
  }

  useEffect(() => {
    if (router.query.step !== STEP_MNEMONIC_IMPORT) setMnemonic(wallet.generateMnemonic())
  }, [router.query.step])

  if (step === STEP_PASSWORD) {
    return (
      <Box>
        <Box mt="100px">
          <Text>We will encrypt your wallet and save it in your browser.</Text>
          <Text>Please enter your password:</Text>
        </Box>
        <PasswordInput password={password} setPassword={setPassword} />

        <Box mt="30px">
          <Text>Confirm your password:</Text>
        </Box>
        <PasswordInput password={passwordConfirm} setPassword={setPasswordConfirm} />

        <Center>
          <Button
            w="250px"
            onClick={() => {
              setPassword('')
              setPasswordConfirm('')
              setStep(router.query.step)
            }}
          >
            Back
          </Button>
          <Spacer m="4px" />
          <Button
            w="250px"
            onClick={async () => {
              if (password.length < 8) {
                notifyWarn({
                  title: 'Password needs to be at least 8 characters.',
                })
              } else if (password !== passwordConfirm) {
                notifyWarn({
                  title: 'Password not match',
                })
              } else {
                try {
                  await wallet.addMnemonic(mnemonic)
                } catch (e) {
                  console.error(e)
                  if (e?.message?.includes('detect the used word list')) {
                    notifyWarn({
                      title: 'Invalid seed phrase.',
                    })
                  }
                  return
                }

                await wallet.updatePasswordHash(password)
                await wallet.persist()
                router.push('/')
              }
            }}
          >
            Continue
          </Button>
        </Center>
      </Box>
    )
  }

  if (step === STEP_MNEMONIC_IMPORT) {
    return (
      <Box>
        <Box mt="100px">
          <Text>Please input your 12 or 24 words seed phrase:</Text>
        </Box>

        <Input
          pr="4.5rem"
          my="10px"
          variant="filled"
          size="sm"
          fontSize="12px"
          onChange={(e) => {
            setMnemonic(e.target.value.replace(/\s\s+/g, ' ').trim())
          }}
        />
        <Box bg="gray.800" borderRadius="6px" p="20px" my="10px">
          <SimpleGrid columns={3} spacingX="40px" spacingY="10px">
            {generateSplits(mnemonic).map((each, index) => {
              return (
                <Center key={index} height="16px">
                  <Text fontSize="14px">{each}</Text>
                </Center>
              )
            })}
          </SimpleGrid>
        </Box>
        <Spacer mt="50px" />
        <Center>
          <Button
            w="250px"
            onClick={() => {
              router.push('/welcome')
            }}
          >
            Back
          </Button>
          <Spacer m="4px" />
          <Button
            w="250px"
            onClick={() => {
              setStep(STEP_PASSWORD)
            }}
          >
            Continue
          </Button>
        </Center>
      </Box>
    )
  }

  // default is generate
  return (
    <Box>
      <Box mt="100px">
        <Text>Please write down your seed phrase and keep it in a safe place:</Text>
      </Box>

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
      <Spacer mt="50px" />
      <Center>
        <Button
          w="250px"
          onClick={() => {
            setMnemonic(wallet.generateMnemonic())
          }}
        >
          Regenerate
        </Button>
        <Spacer m="4px" />

        <Button
          w="250px"
          onClick={() => {
            navigator.clipboard.writeText(mnemonic)
            notify({
              title: `Seed Phrase Copied`,
            })
          }}
        >
          Copy
        </Button>
      </Center>

      <Center mt="30px">
        <Button
          w="250px"
          onClick={() => {
            router.back()
          }}
        >
          Back
        </Button>
        <Spacer m="4px" />

        <Button
          w="250px"
          onClick={() => {
            setStep(STEP_PASSWORD)
          }}
        >
          Continue
        </Button>
      </Center>
    </Box>
  )
}
