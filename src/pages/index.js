import useSWR, { useSWRConfig }  from 'swr'
import PuzzleBoard from "@/components/Chessboard";
import Layout from "@/components/Layout";
import Link from "next/link";
import { useState } from "react";
import { Flex, Badge, Box, LoadingOverlay, Card, Text, Tabs, Table, ActionIcon, Popover } from '@mantine/core';
import { formatDate, getBeginningOfWeek, getEndOfWeek, getMonthDate, getDayAfter, formatISODate, getDayBefore, getFirstDayOfMonth, getLastDayOfMonth } from "@/utils/dateHelper";
import { fetcher } from "@/utils/fetcher";
import { IconArrowBigLeftLine, IconArrowBigRightLine } from '@tabler/icons-react'
import { usePuzzleIndexStore } from '@/stores/usePuzzleIndexStore'
import { useResultsStore } from '@/stores/useResultsStore'
import { useLoginModalOpen } from '@/stores/useLoginModalOpen'

function transformURL(url) {
  var match = url.match(/\#Some\((\d+)\)/);
  if (match && match[1]) {
      var number = match[1];
      return url.replace(/\#Some\(\d+\)/, '#' + number);
  }

  return url;
}

export default function Home() {
  // TODO read url param (success=true | false) and show notification and setLoginModalOpen(false)
  const { mutate } = useSWRConfig()
  const puzzleIndex = usePuzzleIndexStore(state => state.puzzleIndex)
  const setPuzzleIndex = usePuzzleIndexStore(state => state.setPuzzleIndex)
  const results = useResultsStore(state => state.results)
  const setResults = useResultsStore(state => state.setResults)
  const setLoginModalOpen = useLoginModalOpen(state => state.setIsOpen)

  const [activeTab, setActiveTab] = useState('day');
  const [leaderboardsFrom, setLeaderboardsFrom] = useState(formatISODate(new Date()))
  const [leaderboardsTo, setLeaderboardsTo] = useState(formatISODate(new Date()))
  const queryString = activeTab === 'allTime' ? '' : `?from=${leaderboardsFrom}&to=${leaderboardsTo}${activeTab === 'day' ? '&details=true' : ''}`
  const { data: puzzles, isLoading: isPuzzleLoading } = useSWR('/api/puzzles', fetcher)
  const { data: user, isLoading: isUserLoading } = useSWR('/api/users', fetcher)
  const { data: { leaderboard, details } = {}, isLoading: isTableLoading } = useSWR(`/api/leaderboards${queryString}`, fetcher)
  const isLoading = isPuzzleLoading || isUserLoading
  const nextDisabled = formatISODate(new Date()) === leaderboardsTo || new Date(leaderboardsTo) > new Date()

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
        : 'All Time'

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
    <Layout>
      <Flex justify="space-between" gap="md" direction={{ base: "column", sm: "row"}} >
        <Box pos="relative" w="100%" maw={{ base: "100%", sm: 450 }}>
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

        <Box w="100%" maw={{ base: "100%", sm: 450 }}>
          <Card withBorder shadow="sm" w="100%">
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
                    (user.id === u.id || u.name) && <Table.Tr key={u.id}>
                      <Table.Td>{index+1}.</Table.Td>
                      <Table.Td>
                        { user && user.id === u.id && <Flex gap="xs">
                          <Text c="green" fw={600}>
                            {u.name || 'You'}
                          </Text>
                          { !u.name && <Text><a href="#" onClick={e => {
                            e.preventDefault()
                            setLoginModalOpen(true)
                          }}>(Sign-up | Login)</a></Text> }
                        </Flex>}
                        { }
                        { (user.id !== u.id && u.name) && <>
                          <Popover width={200} withArrow shadow="md" arrowPosition="side">
                            <Popover.Target>
                              <Text c="blue" style={{ cursor: 'pointer' }}>{u.name}</Text>
                            </Popover.Target>
                            <Popover.Dropdown>
                              { details && details.length &&
                                <Flex justify="center" mb="sm">
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
                              }
                              <Text align="center">
                                <Link href={`/u/${u.name}`}>Visit Profile</Link>
                              </Text>
                            </Popover.Dropdown>
                          </Popover>
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
    </Layout>
  );
}
