import { Box, Text, Center, VStack, Spacer, Flex, Button, SimpleGrid } from '@chakra-ui/react'
import BackIcon from '@/component/BackIcon'

export const SettingLayout = (props) => {
  return (
    <Box>
      <SimpleGrid columns={3} spacing={6}>
        <Box>
          <BackIcon />
        </Box>
        <Center fontSize={'14px'}>{props.center}</Center>
        <Flex>
          <Spacer />
          {props.right}
        </Flex>
      </SimpleGrid>

      <Spacer mt="30px" />
      {props.children}
    </Box>
  )
}
