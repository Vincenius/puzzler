import Head from "next/head";
import useSWR, { useSWRConfig }  from 'swr'
import PuzzleBoard from "@/components/Chessboard";
import AccountHandler from "@/components/AccountHandler";
import { useState, useEffect } from "react";
import { Flex, Badge, Box, LoadingOverlay, Card, Title, Text, Tabs, Table, Modal, Image, ActionIcon, Popover } from '@mantine/core';
import { formatDate, getBeginningOfWeek, getEndOfWeek, getMonthDate, getDayAfter, formatISODate, getDayBefore, getFirstDayOfMonth, getLastDayOfMonth } from "@/utils/dateHelper";
import { fetcher } from "@/utils/fetcher";
import { IconArrowBigLeftLine, IconArrowBigRightLine } from '@tabler/icons-react'

function transformURL(url) {
  var match = url.match(/\#Some\((\d+)\)/);
  if (match && match[1]) {
      var number = match[1];
      return url.replace(/\#Some\(\d+\)/, '#' + number);
  }

  return url;
}

const HeadlineCard = ({ user, results, puzzleIndex, setResults, setPuzzleIndex }) => <Card withBorder shadow="sm">
<Flex justify="space-between" align="center" mb="sm">
  <Title order={1} size="h3">Puzzler Fun</Title>
  <AccountHandler {...{ user, setResults, setPuzzleIndex }} />
</Flex>
<Flex gap={{ base: 'xs' }} wrap="wrap">
  <ResultChip result={results[0]} active={puzzleIndex === 0}>&gt; 1200</ResultChip>
  <ResultChip result={results[1]} active={puzzleIndex === 1}>&gt; 1400</ResultChip>
  <ResultChip result={results[2]} active={puzzleIndex === 2}>&gt; 1600</ResultChip>
  <ResultChip result={results[3]} active={puzzleIndex === 3}>&gt; 1800</ResultChip>
  <ResultChip result={results[4]} active={puzzleIndex === 4}>&gt; 2000</ResultChip>
</Flex>
</Card>

const ResultChip = ({ children, result, active }) => <Badge
    color={result === true ? "green" : result === undefined ? "blue" : "red"}
    variant={result === undefined ? active ? 'light' : "outline" : "filled" }
    size="xs"
  >
    {children}
  </Badge>

export default function Home() {
  const { mutate } = useSWRConfig()
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('day');
  const [results, setResults] = useState([])
  const [isInit, setIsInit] = useState(false)
  const [leaderboardsFrom, setLeaderboardsFrom] = useState(formatISODate(new Date()))
  const [leaderboardsTo, setLeaderboardsTo] = useState(formatISODate(new Date()))
  const queryString = activeTab === 'allTime' ? '' : `?from=${leaderboardsFrom}&to=${leaderboardsTo}${activeTab === 'day' ? '&details=true' : ''}`
  const { data: puzzleData, isLoading: isPuzzleLoading } = useSWR('/api/puzzles', fetcher)
  const { data: user, isLoading: isUserLoading } = useSWR('/api/users', fetcher)
  const { data: { leaderboard, details } = {}, isLoading: isTableLoading } = useSWR(`/api/leaderboards${queryString}`, fetcher)
  const isLoading = isPuzzleLoading || isUserLoading
  const puzzles = puzzleData && puzzleData.sort((a,b) => parseInt(a.Rating) - parseInt(b.Rating))
  const nextDisabled = formatISODate(new Date()) === leaderboardsTo || new Date(leaderboardsTo) > new Date()

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
  }, [isLoading, puzzles, user, isInit])

  const fen = isLoading ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : puzzles[puzzleIndex].FEN
  const moves = isLoading ? "" : puzzles[puzzleIndex].Moves
  const gameUrl = isLoading ? "" : transformURL(puzzles[puzzleIndex].GameUrl)

  const refetchLeaderboards = () => {
    mutate(
      key => typeof key === 'string' && key.startsWith('/api/leaderboards'),
      undefined,
      { revalidate: true }
    )
  }

  const setSuccess = (success) => {
    if (!results[puzzleIndex]) {
      setResults([...results, success])
      fetch('/api/puzzles', {
        method: 'PUT',
        body: JSON.stringify({ success, id: puzzles[puzzleIndex]._id })
      }).then(() => {
        refetchLeaderboards()
      })
    }
  }

  const dateDisplay = activeTab === 'day'
    ? formatDate(new Date(leaderboardsFrom))
    : activeTab === 'week'
      ? `${formatDate(new Date(leaderboardsFrom))} - ${formatDate(new Date(leaderboardsTo))}`
      : activeTab === 'month'
        ? getMonthDate(new Date(leaderboardsFrom))
        : 'Gesamter Zeitraum'

  const handleTabChange = val => {
    refetchLeaderboards()
    if (val === 'day') {
      setLeaderboardsFrom(formatISODate(new Date()))
      setLeaderboardsTo(formatISODate(new Date()))
    } else if (val === 'week') {
      setLeaderboardsFrom(formatISODate(getBeginningOfWeek()))
      setLeaderboardsTo(formatISODate(getEndOfWeek()))
    } else if (val === 'month') {
      setLeaderboardsFrom(formatISODate(getFirstDayOfMonth()))
      setLeaderboardsTo(formatISODate(getLastDayOfMonth()))
    }
    setActiveTab(val)
  }

  const navigateLeaderboards = (direction) => {
    let newFrom
    let newTo
    if (activeTab === 'day' && direction === 'prev') {
      newFrom = getDayBefore(leaderboardsFrom)
      newTo = getDayBefore(leaderboardsTo)
    } else if (activeTab === 'day' && direction === 'next') {
      newFrom = getDayAfter(leaderboardsFrom)
      newTo = getDayAfter(leaderboardsTo)
    } else if (activeTab === 'week' && direction === 'prev') {
      newFrom = getDayBefore(leaderboardsFrom, 7)
      newTo = getDayBefore(leaderboardsTo, 7)
    } else if (activeTab === 'week' && direction === 'next') {
      newFrom = getDayAfter(leaderboardsFrom, 7)
      newTo = getDayAfter(leaderboardsTo, 7)
    } else if (activeTab === 'month' && direction === 'prev') {
      newFrom = getFirstDayOfMonth(getDayBefore(leaderboardsFrom, 7))
      newTo = getLastDayOfMonth(getDayBefore(leaderboardsFrom, 7))
    } else if (activeTab === 'month' && direction === 'next') {
      newFrom = getFirstDayOfMonth(getDayAfter(leaderboardsTo, 7))
      newTo = getLastDayOfMonth(getDayAfter(leaderboardsTo, 7))
    }

    setLeaderboardsFrom(formatISODate(newFrom))
    setLeaderboardsTo(formatISODate(newTo))
  }

  return (
    <>
      <Head>
        <title>Puzzler Fun</title>
        <meta name="description" content="A Puzzle Contest for you and your friends" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ paddingBottom: '2em' }}>
        <Flex align={{ base: "center", md: "flex-start" }} justify="center" mt="lg" p="md" direction={{ base: "column", md: "row" }} gap="xl">
          <Box display={{ base: 'block', md: 'none' }} w="100%" maw={450}>
            <HeadlineCard {...{ user, results, puzzleIndex, setResults, setPuzzleIndex }} />
          </Box>
          <Box pos="relative" w="100%" maw={450}>
            <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <PuzzleBoard
              fen={fen}
              moves={moves}
              gameUrl={gameUrl}
              setSuccess={setSuccess}
              goNext={() => {
                refetchLeaderboards()
                setPuzzleIndex(puzzleIndex+1)}
              }
              success={results[puzzleIndex]}
              isLast={puzzleIndex === 4}
            />
          </Box>
          <Box w="100%" maw={450}>
            <Box display={{ base: 'none', md: 'block' }} mb="md">
              <HeadlineCard {...{ user, results, puzzleIndex, setResults, setPuzzleIndex }} />
            </Box>
            <Card withBorder shadow="sm">
              <Tabs value={activeTab} onChange={handleTabChange} variant="pills" mb="sm">
                <Tabs.List grow>
                  <Tabs.Tab value="day">
                    Today
                  </Tabs.Tab>
                  <Tabs.Tab value="week">
                    Week
                  </Tabs.Tab>
                  <Tabs.Tab value="month">
                    Month
                  </Tabs.Tab>
                  <Tabs.Tab value="allTime">
                    All Time
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>

              <Flex>
                { activeTab !== 'allTime' && <ActionIcon variant="light" aria-label="go time back" onClick={() => navigateLeaderboards('prev')}>
                  <IconArrowBigLeftLine style={{ width: '70%', height: '70%' }} stroke={1.5} />
                </ActionIcon> }
                <Text fw={200} opacity={0.5} mb="sm" mx="md">{dateDisplay}</Text>
                { activeTab !== 'allTime' && <ActionIcon variant="light" aria-label="go time next" onClick={() => navigateLeaderboards('next')} disabled={nextDisabled}>
                  <IconArrowBigRightLine style={{ width: '70%', height: '70%' }} stroke={1.5} />
                </ActionIcon> }
              </Flex>

              <Box pos="relative">
                <LoadingOverlay visible={isTableLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th></Table.Th>
                      <Table.Th>Player</Table.Th>
                      <Table.Th>Points</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    { isTableLoading && <>
                      <Table.Tr></Table.Tr>
                      <Table.Tr></Table.Tr>
                      <Table.Tr></Table.Tr>
                    </> }
                    { !isTableLoading && leaderboard && leaderboard.sort((a, b) => b.solved - a.solved).map((u, index) => (
                      <Table.Tr key={u.id}>
                        <Table.Td>{index+1}.</Table.Td>
                        <Table.Td>
                          { user && user.id === u.id && <Text c="green" fw={600}>
                            {u.name || 'Anonym'}
                          </Text> }
                          { (!user || (user.id !== u.id)) && <>
                            {(details && details.length)
                              ? <Popover width={200} withArrow shadow="md" arrowPosition="side">
                                <Popover.Target>
                                  <Text c="blue" style={{ cursor: 'pointer' }}>{u.name || 'Anonym'}</Text>
                                </Popover.Target>
                                <Popover.Dropdown>
                                  <Flex justify="center">
                                    {details
                                      .sort((a, b) => parseInt(a.Rating) - parseInt(b.Rating))
                                      .map(p => {
                                        const result = p.solved[u.id]
                                        return <Badge
                                          key={`${u.id}-${p._id}`}
                                          circle
                                          color={result === true ? "green" : result === undefined ? "blue" : "red"}
                                          variant={result === undefined ? "outline" : "filled" }
                                          size="xs"
                                          mr="sm"
                                        >
                                          {/*  */}
                                        </Badge>
                                      })
                                    }
                                  </Flex>
                                </Popover.Dropdown>
                              </Popover>
                            : <Text>
                              {u.name || 'Anonym'}
                            </Text> }
                          </> }
                        </Table.Td>
                        <Table.Td>{u.solved}</Table.Td>
                      </Table.Tr>)
                    )}
                  </Table.Tbody>
                </Table>
              </Box>
            </Card>
          </Box>
        </Flex>
      </main>
    </>
  );
}
