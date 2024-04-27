import React from 'react'
import Link from "next/link";
import { Flex, Box, Card, Text } from '@mantine/core';

const Footer = () => {
  return <footer>
    <Card w="100%" withBorder shadow="sm" p="xs" pos="absolute" bottom={0} left={0}>
      <Box maw={960} m="0 auto" w="100%" px={{ base: 'xs', sm: 'md' }}>
        <Flex justify="space-between">
          <Flex direction="column" align="start">
            <Text>created with ♟️ by <Link href="https://vincentwill.com/">Vincent Will</Link></Text>
          </Flex>

          <Flex direction={{ base: "column", sm: "row"}} gap={{ base: "none", sm: "md"}} align="end">
            <Link href="https://github.com/Vincenius/puzzler">GitHub</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="https://ko-fi.com/wweb_dev">Donate</Link>
          </Flex>
        </Flex>
      </Box>
    </Card>
  </footer>
}

export default Footer
