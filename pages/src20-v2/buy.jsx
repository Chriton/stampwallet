import { Send } from '@/view/Send'
import { Box } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import _ from 'lodash'

const Page = () => {
  const router = useRouter()
  const { recipient, message, btcValue } = router.query
  if (_.isEmpty(recipient) || _.isEmpty(message) || _.isEmpty(btcValue)) {
    return <Box>Invalid Input</Box>
  }

  return <Send recipientInput={recipient} messageInput={message} btcValueInput={btcValue}></Send>
}

export default Page
