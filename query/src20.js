import { axios } from '../utils/axios.js'

const srcBaseUrl = process.env.NEXT_PUBLIC_STAMP_INDEXER_URL

export const getReqListMeta = async () => {
  const res = await axios.get(`${srcBaseUrl}/market/reqListMeta`)
  return res.data
}

export const getReqMintMeta = async () => {
  const res = await axios.get(`${srcBaseUrl}/market/reqMintMeta`)
  return res.data
}

export const getReqDeployMeta = async () => {
  const res = await axios.get(`${srcBaseUrl}/market/reqDeployMeta`)
  return res.data
}

export const getReqBuyMeta = async (tick, index, tx_hash) => {
  const res = await axios.get(
    `${srcBaseUrl}/market/reqBuyMeta?tick=${tick}&index=${index}&tx_hash=${tx_hash}`
  )
  return res.data
}

export const querySrc20ByAddress = async ({ queryKey }) => {
  const [_key, { address }] = queryKey

  if (address?.length < 10) return []

  const res = await axios.get(`${srcBaseUrl}/src20/mintByAddressV1?address=${address}`)
  return res
}

export const queryListing = async ({ queryKey }) => {
  const [_key, { tick, status, seller }] = queryKey

  const limit = 500
  let url = `${srcBaseUrl}/market/listing?limit=${limit}`
  if (tick) url += `&tick=${tick}`
  if (status) url += `&status=${status}`
  if (seller) url += `&seller=${seller}`

  const res = await axios.get(url)
  return res.data
}

export const cancelSell = async (signInfo) => {
  let url = `${srcBaseUrl}/market/cancelSell`
  const payload = signInfo

  let res = {}
  try {
    res = await axios.post(url, payload)
  } catch (e) {
    console.error(e)
    res = e.response
  }
  return res.data?.cancelled
}

export const reqLockListing = async (signInfo) => {
  let url = `${srcBaseUrl}/market/reqLockListing`
  const payload = signInfo

  let res = {}
  try {
    res = await axios.post(url, payload)
  } catch (e) {
    console.error(e)
    res = e.response
  }
  return res.data?.locked
}
