import React, { useState, useEffect } from 'react'
import Head from "next/head";
import Link from "next/link";
import useSWR  from 'swr'
import AccountHandler from "@/components/AccountHandler";
import TrophyInfoModal from "@/components/Trophy/InfoModal";
import ResultChip from "@/components/ResultChip";
import Footer from "@/components/Footer";
import { Flex, Box, Card, Title } from '@mantine/core';
import { fetcher } from "@/utils/fetcher";
import { usePuzzleIndexStore } from '@/stores/usePuzzleIndexStore'
import { useResultsStore } from '@/stores/useResultsStore'

// TODO title
const Layout = ({ children }) => {
  const puzzleIndex = usePuzzleIndexStore(state => state.puzzleIndex)
  const setPuzzleIndex = usePuzzleIndexStore(state => state.setPuzzleIndex)
  const results = useResultsStore(state => state.results)
  const setResults = useResultsStore(state => state.setResults)

  const [isInit, setIsInit] = useState(false)
  const { data: puzzles, isLoading: isPuzzleLoading } = useSWR('/api/puzzles', fetcher)
  const { data: user, isLoading: isUserLoading } = useSWR('/api/users', fetcher)
  const isLoading = isPuzzleLoading || isUserLoading

  useEffect(() => {
    if (!isLoading && !isInit) {
      const initResults = puzzles.map(puzzle => {
        const result = puzzle.solved[user.id]
        if (result === true || result === false) {
          return result
        }
      }).filter(r => r !== undefined)
      setResults(initResults)
      setPuzzleIndex(initResults.length > 4 ? 4 : initResults.length)
      setIsInit(true)
    }
  }, [isLoading, puzzles, user, isInit, puzzleIndex, setPuzzleIndex, setResults])

  const title = "Puzzler"
  const description = "Improve your chess skills & challenge your friends with five daily puzzles."
  const image = "https://puzzler.fun/social.png"

  return <>
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="Chess, puzzles, improve, challenge, compete, daily, lichess, chess.com" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content="https://puzzler.fun" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

    </Head>
    <Box pb={{ base: 120, sm: 70 }} pos="relative" mih="100vh">
      <main>
        <Card w="100%" withBorder shadow="sm" p="xs">
          <Box maw={960} m="0 auto" w="100%" px={{ base: 'xs', sm: 'md' }}>
            <Flex justify="space-between" align="center">
              <Link href="/" style={{ color: '#000', textDecoration: 'none' }}>
                <Title order={1} size="h3">Puzzler</Title>
              </Link>

              <Flex align="center">
                <Flex display="flex" gap={{ base: 'xs' }} wrap="wrap" mr="md">
                  <ResultChip result={results[0]} active={puzzleIndex === 0} index={0} results={results}>
                    <Box display={{ base: 'none', sm: 'inline' }}>&gt; 1200</Box>
                    <Box display={{ base: 'inline', sm: 'none' }}>&nbsp;</Box>
                  </ResultChip>
                  <ResultChip result={results[1]} active={puzzleIndex === 1} index={1} results={results}>
                    <Box display={{ base: 'none', sm: 'inline' }}>&gt; 1500</Box>
                    <Box display={{ base: 'inline', sm: 'none' }}>&nbsp;</Box>
                  </ResultChip>
                  <ResultChip result={results[2]} active={puzzleIndex === 2} index={2} results={results}>
                    <Box display={{ base: 'none', sm: 'inline' }}>&gt; 1800</Box>
                    <Box display={{ base: 'inline', sm: 'none' }}>&nbsp;</Box>
                  </ResultChip>
                  <ResultChip result={results[3]} active={puzzleIndex === 3} index={3} results={results}>
                    <Box display={{ base: 'none', sm: 'inline' }}>&gt; 2100</Box>
                    <Box display={{ base: 'inline', sm: 'none' }}>&nbsp;</Box>
                  </ResultChip>
                  <ResultChip result={results[4]} active={puzzleIndex === 4} index={4} results={results}>
                    <Box display={{ base: 'none', sm: 'inline' }}>&gt; 2400</Box>
                    <Box display={{ base: 'inline', sm: 'none' }}>&nbsp;</Box>
                  </ResultChip>
                </Flex>
                <AccountHandler {...{ user, setResults, setPuzzleIndex }} />
              </Flex>
            </Flex>
          </Box>
        </Card>
        <Box maw={960} w="100%" mt="xl" mx="auto" px="md">
          {children}
        </Box>
      </main>

      <Footer />

      <TrophyInfoModal />
    </Box>
  </>
}

export default Layout
