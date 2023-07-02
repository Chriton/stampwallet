import {
  Box,
  Text,
  Center,
  VStack,
  Spacer,
  Flex,
  InputGroup,
  InputRightElement,
  Button,
  Icon,
  Input,
  Link,
  useDisclosure,
} from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import wallet from '@/service/wallet'
import BackIcon from '@/component/BackIcon'
import QRCode from 'qrcode.react'
import { addressSummary, BITCOIN_TO_SATOSHI } from '@/utils/common'
import { notify, notifyWarn, getExplorerLink } from '@/utils/common'
import { FiCopy } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { queryUtxos, sendTransaction, queryMempoolFee } from '@/query/bitcoin'
import { reqLockListing } from '@/query/src20'
import { prepareSendBitcoin, sendBitcoin } from '@/service/bitcoin'
import { SendingConfirm } from '@/component/SendingConfirm'
import {
  setLocalItem,
  getLocalItem,
  setSessionItem,
  getSessionItem,
  removeSessionItem,
} from '@/service/storage'
import { LOCAL_STORAGE } from '@/constant'

export const Send = ({ recipientInput, btcValueInput, messageInput, listingId }) => {
  const router = useRouter()
  const [recipient, setRecipient] = useState(recipientInput ?? '')
  const [btcValue, setBtcValue] = useState(btcValueInput ?? '')
  const [feeRate, setFeeRate] = useState('')
  const [message, setMessage] = useState(messageInput ?? '')
  const [feeSum, setFeeSum] = useState('')
  const [feeTotal, setFeeTotal] = useState('')
  const [pendingTxHex, setPendingTxHex] = useState()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isSending, setIsSending] = useState()

  const account = wallet.getCurrentAccount()
  const network = wallet.getNetwork()

  const isNonSegwitAddress = account?.address.substring(0, 1) !== 'b'

  const { data: memPoolFeeRecommended, isLoading: isLoadingMemPoolFee } = useQuery(
    ['queryMempoolFee', {}],
    queryMempoolFee,
    {
      refetchInterval: 120 * 1000,
    }
  )
  const recommendedFeePerVb = memPoolFeeRecommended
    ? parseInt(memPoolFeeRecommended * 1.2 * (isNonSegwitAddress ? 1.8 : 1.0))
    : undefined

  useEffect(() => {
    if (recommendedFeePerVb) {
      if (feeRate === '') {
        setFeeRate(recommendedFeePerVb)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendedFeePerVb])

  const {
    data: utxosData,
    isLoading: isLoadingUtxo,
    isFetching: isFetchingUtxo,
    refetch: refetchUtxos,
  } = useQuery({
    queryKey: ['utxos', { network, address: account?.address, confirmed: true }],
    queryFn: queryUtxos,
  })

  const lockListing = async (id, txId) => {
    const message = {
      action: 'lockListing',
      id: id,
      txId: txId,
      address: account?.address || '',
      timestamp: Date.now(),
      nonce: `${Math.random()}`,
    }
    const signInfo = await wallet.sign(account.ecpair, JSON.stringify(message))
    const res = await reqLockListing(signInfo)
    console.log('res', res)
    if (res === 1) {
      notify({ title: 'You have locked the listing', duration: 2000 })
    } else {
      notifyWarn({ title: 'Listing is just locked by others', duration: 3000 })
    }
    return res
  }

  const handleClickSend = async () => {
    setIsSending(true)
    const ecPair = account?.ecpair
    try {
      const { txHex, fee, feeTotal } = await prepareSendBitcoin({
        ecPair,
        network,
        utxos,
        toAddress: recipient,
        changeAddress: account.address,
        value: parseInt(btcValue * BITCOIN_TO_SATOSHI),
        feeRate: feeRate,
        message,
      })
      setPendingTxHex(txHex)
      setFeeSum(fee)
      setFeeTotal(feeTotal)
      onOpen()
    } catch (e) {
      setIsSending(false)
      notifyWarn({ title: e.message })
    }
  }

  const utxos = utxosData || []

  const onCloseConfirm = () => {
    onClose()
    setIsSending(false)
  }

  const onConfirm = async () => {
    try {
      const txId = await sendTransaction(network, pendingTxHex)
      setPendingTxHex(null)
      const curActivities = JSON.parse((await getLocalItem(LOCAL_STORAGE.ACCOUNT_ACTIVITY)) || '[]')
      curActivities.push({ network, address: account.address, txId: txId, date: new Date() })
      await setLocalItem(LOCAL_STORAGE.ACCOUNT_ACTIVITY, JSON.stringify(curActivities))

      if (listingId) {
        const locked = await lockListing(listingId, txId)
        onCloseConfirm()
        if (!locked) return
      }

      router.push('/')
    } catch (e) {
      notifyWarn({ title: e.message })
      if (e.message.includes('conflict')) {
        console.log('mempool conflict')

        // in case of conflict, fetch utxo and resend
        await refetchUtxos()
        handleClickSend()
      }
    }
  }

  const title = recipientInput ? 'Confirm Buy' : 'Send Bitcoin'

  return (
    <Box>
      <BackIcon />

      <Center mb="50px">
        <Text fontSize={'15px'}>{title}</Text>
      </Center>

      <SendingConfirm
        isOpen={isOpen}
        onClose={onCloseConfirm}
        onConfirm={onConfirm}
        info={{
          network,
          recipient,
          btcValue,
          feeRate,
          feeInBtc: feeSum / BITCOIN_TO_SATOSHI,
          feeTotalInBtc: feeTotal / BITCOIN_TO_SATOSHI,
        }}
      />

      <Box>Recipient Address</Box>

      <Input
        mt="5px"
        variant="filled"
        size="md"
        fontSize="16px"
        placeholder="the recipient address"
        value={recipient}
        disabled={recipientInput}
        onChange={(e) => {
          setRecipient(e.target.value.replace(/\s\s+/g, ''))
        }}
      />

      <Box mt="10px">Amount of Bitcoin</Box>

      <Input
        mt="5px"
        variant="filled"
        size="md"
        placeholder="positive decimal number"
        fontSize="16px"
        value={btcValue}
        disabled={btcValueInput}
        onChange={(e) => {
          setBtcValue(e.target.value.replace(/[^0-9.]/g, ''))
        }}
      />

      <>
        <Box mt="10px">Message (optional)</Box>

        <Input
          mt="5px"
          variant="filled"
          size="md"
          placeholder="leave this empty by default(max: 40)"
          fontSize="16px"
          value={message}
          disabled={messageInput}
          onChange={(e) => {
            setMessage(e.target.value.substring(0, 40))
          }}
        />
      </>

      <Box mt="10px">Fee rate</Box>

      <InputGroup mt="5px">
        <Input
          variant="filled"
          size="md"
          placeholder="Fee rate (satoshi per vbyte)"
          fontSize="16px"
          value={feeRate}
          onChange={(e) => {
            setFeeRate(e.target.value.replace(/[^0-9.]/g, ''))
          }}
        />
        <InputRightElement color="gray.300" mr="20px">
          sat/vB
        </InputRightElement>
      </InputGroup>

      <Box fontSize="14px" color="rgb(160,171,187)">
        {memPoolFeeRecommended ? (
          <Flex>
            Current:
            <Link
              onClick={() => {
                window.open('https://mempool.space/')
              }}
              ml="3px"
            >
              {memPoolFeeRecommended} sat/vB
            </Link>
            <Spacer />
            <Text> Recommended: {recommendedFeePerVb} sat/vB</Text>
          </Flex>
        ) : (
          <Text>Loading fee...</Text>
        )}
      </Box>

      {recipientInput !== undefined && (
        <Box fontSize="14px" color="gray.300" mt="10px">
          <Text>Buy Fee: 1% commission on tokens for success buy.</Text>
        </Box>
      )}

      <Center mt="30px">
        <Button
          w="100%"
          isLoading={isLoadingUtxo || isSending}
          onClick={() => {
            handleClickSend()
          }}
        >
          Send
        </Button>
      </Center>
    </Box>
  )
}
