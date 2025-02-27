import { Box, Text, Center, VStack, Spacer, Button, Flex, Spinner } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { PhoneIcon, AddIcon, WarningIcon, ArrowBackIcon } from '@chakra-ui/icons'
import { useQuery } from '@tanstack/react-query'
import numeral from 'numeral'
import { prettyFloat } from '@/utils/common'

export default function Home({ summary, isLoading }) {
  if (isLoading) {
    return (
      <Center mt="100px">
        <Spinner />
      </Center>
    )
  }

  return (
    <Box
      maxHeight={'300px'}
      overflowY={'scroll'}
      sx={{
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        '::-webkit-scrollbar': {
          display: 'none',
        },
      }}
    >
      {summary.map((item, index) => {
        return (
          <Box key={index} my="8px">
            <Flex>
              <Text fontSize={'lg'}>{item.tick.toUpperCase()}</Text>
              <Spacer />
              <Text fontSize={'lg'}>{prettyFloat(item.total_amt, 6, true)}</Text>
            </Flex>
          </Box>
        )
      })}
    </Box>
  )
}
