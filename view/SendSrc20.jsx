import {
  Box,
  Text,
  Center,
  VStack,
  Spacer,
  Flex,
  Button,
  InputGroup,
  InputRightElement,
  Icon,
  Input,
  Link,
  useDisclosure,
} from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import wallet from '@/service/wallet'
import BackIcon from '@/component/BackIcon'
import { addressSummary, BITCOIN_TO_SATOSHI } from '@/utils/common'
import { notify, notifyWarn, getExplorerLink } from '@/utils/common'
import { FiCopy } from 'react-icons/fi'
import { RiAccountCircleLine } from 'react-icons/ri'
import { useQuery } from '@tanstack/react-query'
import { queryUtxos, sendTransaction, queryMempoolFee, queryBtcPrice } from '@/query/bitcoin'
import { prepareSendSrc20 } from '@/service/bitcoin'
import { SendingSrc20Confirm } from '@/component/SendingSrc20Confirm'
import {
  setLocalItem,
  getLocalItem,
  setSessionItem,
  getSessionItem,
  removeSessionItem,
} from '@/service/storage'
import { LOCAL_STORAGE } from '@/constant'

export const SendSrc20 = ({ action }) => {
  const MIN_FEE_RATE = 30
  const router = useRouter()
  const [recipient, setRecipient] = useState('')
  const [token, setToken] = useState('')
  const [amount, setAmount] = useState('')
  const [lim, setLim] = useState('')
  const [max, setMax] = useState('')
  const [price, setPrice] = useState('')
  const [feeRate, setFeeRate] = useState('')
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
      refetchOnWindowFocus: false,
    }
  )

  const { data: btcPrice } = useQuery(['queryBtcPrice', {}], queryBtcPrice, {
    refetchInterval: 120 * 1000,
    refetchOnWindowFocus: false,
  })

  const recommendedFeePerVb = memPoolFeeRecommended
    ? Math.max(
        MIN_FEE_RATE,
        parseInt(memPoolFeeRecommended * 2.0 * (isNonSegwitAddress ? 1.25 : 1.0))
      )
    : undefined

  useEffect(() => {
    if (recommendedFeePerVb) {
      if (feeRate === '') {
        setFeeRate(recommendedFeePerVb)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendedFeePerVb])

  const minimumSellPrice = 0.00002
  const maximumSellPrice = 0.05

  const {
    data: utxosData,
    isLoading: isLoadingUtxo,
    isFetching: isFetchingUtxo,
    refetch: refetchUtxos,
  } = useQuery({
    queryKey: ['utxos', { network, address: account?.address, confirmed: true }],
    queryFn: queryUtxos,
  })

  const listForSell = action === 'list'

  const handleClickGo = async () => {
    if (!listForSell && recipient.length < 10) {
      notifyWarn({ title: `Invalid recipient address` })
      return
    }

    if (token.length === 0 || token.length > 5) {
      notifyWarn({ title: `Invalid token` })
      return
    }

    if (parseFloat(feeRate || '0') < MIN_FEE_RATE) {
      notifyWarn({ title: `Fee cannot be lower than ${MIN_FEE_RATE} sat/vB` })
      return
    }

    setIsSending(true)
    const ecPair = account?.ecpair
    try {
      let transferString = `stamp:{"p":"src-20","op":"transfer","tick":"${token}","amt":"${parseFloat(
        amount
      )}"}`

      if (listForSell) {
        const parsedPrice = parseFloat(price)

        if (parsedPrice < minimumSellPrice) {
          notifyWarn({ title: `Price too low: ${parsedPrice}; min: ${minimumSellPrice}` })
          setIsSending(false)
          return
        }

        if (parsedPrice > maximumSellPrice) {
          notifyWarn({ title: `Value too high: ${parsedPrice}; max: ${maximumSellPrice}` })
          setIsSending(false)
          return
        }

        transferString = `stamp:{"p":"src-20","op":"transfer","tick":"${token}","amt":"${amount}","s":"${parsedPrice}"}`
      }

      if (action === 'mint') {
        transferString = `stamp:{"p":"src-20","op":"mint","tick":"${token}","amt":"${amount}"}`
      }

      if (action === 'deploy') {
        transferString = `stamp:{"p":"src-20","op":"deploy","tick":"${token}","lim":"${lim}", "max":"${max}"}`
      }

      const { txHex, fee, feeTotal } = await prepareSendSrc20({
        ecPair,
        network,
        utxos,
        toAddress: recipient,
        changeAddress: account.address,
        feeRate: feeRate,
        transferString,
        action,
        sellPrice: listForSell ? price : undefined,
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
      onCloseConfirm()
      router.push('/')
    } catch (e) {
      notifyWarn({ title: e.message })
      if (e.message.includes('conflict')) {
        console.log('mempool conflict')

        // in case of conflict, fetch utxo and resend
        await refetchUtxos()
        handleClickGo()
      }
    }
  }

  const getTitle = () => {
    let title = 'Send SRC20'
    if (action === 'list') {
      title = 'List SRC20'
    } else if (action === 'mint') {
      title = 'Mint SRC20'
    } else if (action === 'deploy') {
      title = 'Deploy SRC20'
    } else if (action === 'send') {
      title = 'Send SRC20'
    }
    return title
  }

  const title = getTitle()

  return (
    <Box>
      <BackIcon />

      <Center mb="30px">
        <Text fontSize={'15px'}>{title}</Text>
      </Center>

      <SendingSrc20Confirm
        isOpen={isOpen}
        onClose={onCloseConfirm}
        onConfirm={onConfirm}
        info={{
          network,
          recipient,
          token,
          amount,
          feeRate,
          feeInBtc: feeSum / BITCOIN_TO_SATOSHI,
          feeTotalInBtc: feeTotal / BITCOIN_TO_SATOSHI,
        }}
      />

      {!listForSell && (
        <>
          <Box>Recipient</Box>

          <Input
            mt="5px"
            variant="filled"
            size="md"
            fontSize="16px"
            placeholder="The recipient address"
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value.replace(/\s\s+/g, ''))
            }}
          />
        </>
      )}

      <Box mt="10px">Token</Box>

      <Input
        mt="5px"
        variant="filled"
        size="md"
        fontSize="16px"
        placeholder="case insensitive"
        value={token}
        onChange={(e) => {
          setToken(e.target.value.replace(/\s\s+/g, ''))
        }}
      />

      {action === 'deploy' && (
        <>
          <Box mt="10px">Limit:</Box>
          <Input
            mt="5px"
            variant="filled"
            size="md"
            placeholder="positive integer"
            fontSize="16px"
            value={lim}
            onChange={(e) => {
              setLim(e.target.value.replace(/[^0-9]/g, ''))
            }}
          />

          <Box mt="10px">Max:</Box>
          <Input
            mt="5px"
            variant="filled"
            size="md"
            placeholder="positive integer"
            fontSize="16px"
            value={max}
            onChange={(e) => {
              setMax(e.target.value.replace(/[^0-9]/g, ''))
            }}
          />
        </>
      )}

      {action === 'mint' && (
        <>
          <Box mt="10px">Amount</Box>
          <Input
            mt="5px"
            variant="filled"
            size="md"
            placeholder={'positive integer'}
            fontSize="16px"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^0-9]/g, ''))
            }}
          />
        </>
      )}

      {(action === 'send' || action === 'list') && (
        <>
          <Box mt="10px">Amount</Box>
          <Input
            mt="5px"
            variant="filled"
            size="md"
            placeholder={'positive decimal number'}
            fontSize="16px"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^0-9.]/g, ''))
            }}
          />
        </>
      )}

      {listForSell && (
        <>
          <Box mt="10px">Price in BTC</Box>
          <InputGroup mt="5px">
            <Input
              variant="filled"
              size="md"
              placeholder="total price, positive number"
              fontSize="16px"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value.replace(/[^0-9.]/g, ''))
              }}
            />
            <InputRightElement color="gray.300" mr="20px">
              BTC
            </InputRightElement>
          </InputGroup>
          {btcPrice && price && amount && (
            <Text mt="1px" color="rgb(160,171,187)" fontSize="14px">
              USD Price: ${(btcPrice * price).toFixed(2)} ($
              {((btcPrice * price) / amount).toFixed(6)} per token)
            </Text>
          )}
        </>
      )}

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

      {action === 'list' && (
        <Box fontSize="14px" color="gray.300" mt="10px">
          <Text>List Fee: 0.000222 BTC for listing; 1.8% commission on success sale.</Text>
        </Box>
      )}

      <Center mt="30px">
        <Button
          w="100%"
          isLoading={isLoadingUtxo || isSending}
          onClick={() => {
            handleClickGo()
          }}
        >
          {title?.split(' ')[0]}
        </Button>
      </Center>
    </Box>
  )
}
