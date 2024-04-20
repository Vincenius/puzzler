import React from 'react'
import Link from "next/link";
import { Flex, Box, Card } from '@mantine/core';

const Footer = () => {
  return <footer>
    <Card w="100%" withBorder shadow="sm" p="xs" pos="absolute" bottom={0} left={0}>
      <Box maw={960} m="0 auto" w="100%" px={{ base: 'xs', sm: 'md' }}>
        <Flex justify="space-between">
          <span></span>

          <Flex gap="md">
            <Link href="https://github.com/Vincenius/puzzler">GitHub</Link>
            {/* <Link href="/privacy">Privacy</Link> */}
          </Flex>
        </Flex>
      </Box>
    </Card>
  </footer>
}

export default Footer
