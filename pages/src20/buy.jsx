import { Send } from '@/view/Send'
import { Box } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import _ from 'lodash'

const Page = () => {
  const router = useRouter()
  const { recipient, message, btcValue, listingId } = router.query
  if (_.isEmpty(recipient) || _.isEmpty(message) || _.isEmpty(btcValue)) {
    router.push('/src20')
    return <Box>...</Box>
  }

  return (
    <Send
      recipientInput={recipient}
      messageInput={message}
      btcValueInput={btcValue}
      listingId={listingId}
    ></Send>
  )
}

export default Page
