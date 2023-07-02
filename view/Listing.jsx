import {
  Box,
  Text,
  Center,
  Icon,
  Input,
  VStack,
  Spacer,
  Table,
  Th,
  Td,
  Tr,
  Tbody,
  TableContainer,
  Thead,
  TableCaption,
  Tfoot,
  Button,
  Flex,
  Spinner,
  Grid,
  GridItem,
} from '@chakra-ui/react'
import { PhoneIcon, AddIcon, WarningIcon, ArrowBackIcon } from '@chakra-ui/icons'
import { SlRefresh } from 'react-icons/sl'
import { BiExpand } from 'react-icons/bi'
import { useQuery } from '@tanstack/react-query'
import numeral from 'numeral'
import { prettyFloat } from '@/utils/common'
import { queryListing } from '../query/src20.js'
import { useRouter } from 'next/router'
import { debounce, last } from 'lodash'
import { notify, notifyWarn, getExplorerLink } from '@/utils/common'
import wallet from '@/service/wallet'
import { createContext, useContext, useState, useMemo, useEffect } from 'react'
import { queryBtcPrice } from '@/query/bitcoin'
import BackIcon from '@/component/BackIcon'
import { getReqBuyMeta, cancelSell } from '../query/src20'
import { SettingLayout } from '@/component/SettingLayout'
import { EXTENSION_ID } from '@/constant'

export default function Home({ showMyListing }) {
  console.log('showMyListing:', showMyListing)
  const router = useRouter()
  const defaultTick = showMyListing ? '' : ''
  console.log(defaultTick)
  const defaultStatus = showMyListing ? '' : 'init'
  const [tickInput, setAddressInput] = useState('')
  const [tick, setTick] = useState(defaultTick)
  const [status, setStatus] = useState(defaultStatus)

  const account = wallet.getCurrentAccount()
  const network = wallet.getNetwork()
  const seller = account?.address

  const { data: btcPrice } = useQuery(['queryBtcPrice', {}], queryBtcPrice, {
    refetchInterval: 120 * 1000,
    refetchOnWindowFocus: false,
  })

  const { data, isLoading, isFetching, refetch } = useQuery(
    ['queryListing', { tick, status, seller: showMyListing ? account?.address : '' }],
    queryListing,
    {
      refetchInterval: 180 * 1000,
      refetchOnWindowFocus: false,
    }
  )
  const listings = data || []

  const delayedUpdateAddress = useMemo(() => {
    return debounce((value) => {
      setTick(value)
      router.push(
        {
          pathname: router.pathname,
          query: {
            tick: value,
          },
        },
        `${router.pathname}?tick=${value}`,
        { shallow: true }
      )
    }, 1000)
  }, [setTick, router])

  const handleChangeTick = (value) => {
    setAddressInput(value)
    delayedUpdateAddress(value)
  }

  useEffect(() => {
    const temp = router.query.tick ?? defaultTick
    setAddressInput(temp)
    setTick(temp)
  }, [router.query.tick, defaultTick])

  const title = showMyListing ? 'My Listing' : 'Listing'

  const clickBuyHandler = async (e) => {
    const buyMeta = await getReqBuyMeta(e.tick, e.index, e.tx_hash)
    console.log(buyMeta)
    if (buyMeta.valid) {
      const url = `/src20/buy?recipient=${buyMeta.address}&message=${buyMeta.message}&btcValue=${buyMeta.totalFeeInBtc}&listingId=${e.tx_hash}`
      router.push(url)
    } else {
      notifyWarn({ title: `Invalid listing with status: ${buyMeta.status}`, duration: 3000 })
      refetch()
    }
  }

  const clickCancelHandler = async (e) => {
    const message = {
      action: 'cancel',
      id: e.id,
      address: e.seller,
      timestamp: Date.now(),
      nonce: `${Math.random()}`,
    }
    const signInfo = await wallet.sign(account.ecpair, JSON.stringify(message))
    const res = await cancelSell(signInfo)
    console.log('res', res)
    refetch()
    if (res === 1) {
      notify({ title: 'You have cancelled the listing', duration: 2000 })
    } else {
      notifyWarn({ title: 'Cannot be cancelled', duration: 3000 })
    }
    console.log(signInfo)
  }

  const transformStatus = (s) => {
    if (s === 'init') return 'WAIT_FOR_BUYER'
    if (s === 'locked') return 'BUYER_IS_BUYING'
    return s?.toUpperCase()
  }

  return (
    <SettingLayout center={title} right={null}>
      <Box>
        <Center>
          <Text fontSize="15px">Tick:</Text>
          <Input
            w="100px"
            ml="10px"
            value={tickInput}
            onChange={(e) => {
              handleChangeTick(e.target.value)
            }}
            placeholder=""
            size="sm"
          />
          {
            <Icon
              ml="15px"
              as={SlRefresh}
              boxSize="18px"
              cursor={'pointer'}
              onClick={() => {
                refetch()
              }}
            />
          }
          {
            <Icon
              ml="15px"
              as={BiExpand}
              boxSize="18px"
              cursor={'pointer'}
              onClick={() => {
                const route = showMyListing ? 'src20MyListing' : 'src20Listing'
                window.open(`chrome-extension://${EXTENSION_ID}/index.html?route=${route}`)
              }}
            />
          }
        </Center>

        {isFetching && (
          <Center mt="100px">
            <Spinner />
          </Center>
        )}

        {!isFetching && (
          <Center>
            <Box
              maxH="450px"
              overflowY={'scroll'}
              mt="15px"
              // sx={{
              //   msOverflowStyle: 'none',
              //   scrollbarWidth: 'none',
              //   '::-webkit-scrollbar': {
              //     display: 'none',
              //   },
              // }}
            >
              <TableContainer py="10px">
                <Table variant="simple" mt="0px" maxW="100px" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Token</Th>
                      <Th>Amount</Th>
                      <Th>Price</Th>
                      <Th>Unit Price</Th>
                      <Th>Action</Th>
                      {showMyListing && <Th>Status</Th>}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {listings.map((e, index) => {
                      return (
                        <Tr key={index}>
                          <Td>{e.tick.toUpperCase()}</Td>
                          <Td>{e.amt}</Td>
                          <Td>
                            {e.price} {btcPrice ? '($' + (e.price * btcPrice).toFixed(2) + ')' : ''}
                          </Td>
                          <Td>
                            {btcPrice ? '$' + (e.unit_price * btcPrice).toFixed(8) : 'loading...'}
                          </Td>
                          <Td>
                            {e.status !== 'init' ? (
                              <Center>-</Center>
                            ) : e.seller?.toLowerCase() === account?.address?.toLowerCase() ? (
                              <Button
                                onClick={() => clickCancelHandler(e)}
                                size="sm"
                                variant="link"
                                colorScheme="blue"
                                disabled
                              >
                                Cancel
                              </Button>
                            ) : (
                              <Button
                                onClick={() => clickBuyHandler(e)}
                                size="sm"
                                variant="link"
                                colorScheme="blue"
                                disabled
                              >
                                BUY
                              </Button>
                            )}
                          </Td>
                          {showMyListing && <Td>{transformStatus(e.status)}</Td>}
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </Center>
        )}
      </Box>
    </SettingLayout>
  )
}
