import { Box, Text, Center, VStack, Spacer, Flex, Button, SimpleGrid } from '@chakra-ui/react'
import BackIcon from '@/component/BackIcon'

export const SettingLayout = (props) => {
  return (
    <Box>
      <Box>
        <BackIcon />
      </Box>
      <Center>{props.center}</Center>
      {props.right}

      <Spacer mt="30px" />
      {props.children}
    </Box>
  )
}
