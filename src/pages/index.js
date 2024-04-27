import useSWR, { useSWRConfig }  from 'swr'
import PuzzleBoard from "@/components/Chessboard";
import Layout from "@/components/Layout";
import { notifications } from '@mantine/notifications';
import Link from "next/link";
import Image from "next/image";
import { useRouter } from 'next/router';
import { useState, useEffect } from "react";
import { Flex, Badge, Box, LoadingOverlay, Card, Text, Tabs, Table, ActionIcon, Popover, Pagination, Button, Tooltip, TextInput } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { formatDate, getBeginningOfWeek, getEndOfWeek, getMonthDate, getDayAfter, formatISODate, getDayBefore, getFirstDayOfMonth, getLastDayOfMonth } from "@/utils/dateHelper";
import { fetcher } from "@/utils/fetcher";
import { IconArrowBigLeftLine, IconArrowBigRightLine, IconFriends, IconSearch } from '@tabler/icons-react'
import { usePuzzleIndexStore } from '@/stores/usePuzzleIndexStore'
import { useResultsStore } from '@/stores/useResultsStore'
import { useLoginModalOpen } from '@/stores/useLoginModalOpen'

const LEADERBOARDS_COUNT = 10 // pagination

function transformURL(url) {
  var match = url.match(/\#Some\((\d+)\)/);
  if (match && match[1]) {
      var number = match[1];
      return url.replace(/\#Some\(\d+\)/, '#' + number);
  }

  return url;
}

function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export default function Home() {
  const { mutate } = useSWRConfig()
  const router = useRouter();
  const puzzleIndex = usePuzzleIndexStore(state => state.puzzleIndex)
  const setPuzzleIndex = usePuzzleIndexStore(state => state.setPuzzleIndex)
  const results = useResultsStore(state => state.results)
  const setResults = useResultsStore(state => state.setResults)
  const setLoginModalOpen = useLoginModalOpen(state => state.setIsOpen)

  const [activeTab, setActiveTab] = useState('day');
  const [leaderboardsFrom, setLeaderboardsFrom] = useState(formatISODate(new Date()))
  const [leaderboardsTo, setLeaderboardsTo] = useState(formatISODate(new Date()))
  const [leaderboardPage, setLeaderboardPage] = useState(0)
  const [isFriendLoading, setIsFriendLoading] = useState(false)
  const [friendFilter, setFriendFilter] = useLocalStorage({
    key: 'friend-filter',
    defaultValue: false,
  });
  const [search, setSearch] = useState()
  const dateQueryString = activeTab === 'allTime' ? '' : `?from=${leaderboardsFrom}&to=${leaderboardsTo}${activeTab === 'day' ? '&details=true' : ''}`
  const filterQueryString = friendFilter ? dateQueryString === '' ? '?filter=friends' : '&filter=friends' : ''
  const queryString = `${dateQueryString}${filterQueryString}`
  const { data: puzzles, isLoading: isPuzzleLoading } = useSWR('/api/puzzles', fetcher)
  const { data: user, isLoading: isUserLoading, mutate: mutateUser } = useSWR('/api/users', fetcher)
  const { data: { leaderboard, details } = {}, isLoading: isTableLoading } = useSWR(`/api/leaderboards${queryString}`, fetcher)
  const isLoading = isPuzzleLoading || isUserLoading
  const nextDisabled = formatISODate(new Date()) === leaderboardsTo || new Date(leaderboardsTo) > new Date()

  const fen = isLoading ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : puzzles[puzzleIndex].FEN
  const moves = isLoading ? "" : puzzles[puzzleIndex].Moves
  const gameUrl = isLoading ? "" : transformURL(puzzles[puzzleIndex].GameUrl)

  let prevPoints = null;
  let rank = 0;
  const sortedLeaderboard = (leaderboard || [])
    .filter(u => u.name || u.isPlayer) // filter anonymous
    .sort((a, b) => b.solved - a.solved)
    .map((u, index) => {
      if (u.solved !== prevPoints) {
        rank = index + 1;
      }
      prevPoints = u.solved; // Update previous points for the next iteration

      return { ...u, rank }
    })
    .filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()))

  const leaderboardPages = chunkArray(sortedLeaderboard, LEADERBOARDS_COUNT);
  const tablePage = search ? 0 : leaderboardPage-1
  const leaderboardTable = (!isTableLoading && leaderboard && leaderboardPage > 0 && (leaderboardPages[tablePage] || [])) || []

  useEffect(() => {
    if (leaderboardPage === 0 && leaderboardPages.length > 0) {
      if (user) {
        const index = leaderboardPages.findIndex(page => page.find(u => u.isPlayer))
        setLeaderboardPage(index === -1 ? 1 : index + 1)
      } else {
        setLeaderboardPage(0)
      }
    }
  }, [leaderboardPage, leaderboardPages, user])

  useEffect(() => {
    const { success } = router.query;

    if (success !== undefined) {
      if (success === 'true') {
        notifications.show({
          title: 'Success',
          message: 'Successfully logged in! 🥳',
          autoClose: 3000,
          color: 'green',
        })
      } else if (success === 'false') {
        notifications.show({
          title: 'Error',
          message: 'Could not login in...',
          autoClose: 3000,
          color: 'red',
        })
      }

      // Remove query parameter from URL
      const { pathname, query, asPath } = router;
      delete query.success;
      router.replace({ pathname, query }, undefined, { shallow: true });
    }
  });

  const refetchLeaderboards = () => {
    setLeaderboardPage(0)
    mutate(
      key => typeof key === 'string' && key.startsWith('/api/leaderboards'),
      undefined,
      { revalidate: true }
    )
  }

  const updateFriend = (e, id) => {
    const existingFriends = user.friends || []
    const type = existingFriends.includes(id) ? "REMOVE" : "ADD"
    e.preventDefault()
    setIsFriendLoading(true)
    fetch('/api/friends', {
      method: 'POST',
      body: JSON.stringify({ type, id })
    }).then(async () => {
      if (type === 'ADD') {
        mutateUser({ ...user, friends: [...existingFriends, id] })
      } else {
        mutateUser({ ...user, friends: existingFriends.filter(fId => fId !== id) })
      }

      notifications.show({
        title: 'Success',
        message: type === 'ADD' ? 'Successfully added friend.' : 'Successfully removed friend.',
        autoClose: 3000,
        color: 'green',
      })
    }).finally(() => {
      setIsFriendLoading(false)
    })
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

            <Flex mb="xs" gap="sm">
              {/* filled if active */}
              { user && user.name && <Tooltip label="Filter for friends">
                <Button leftSection={<IconFriends size={14} />} variant={friendFilter ? "filled" : "outline"} onClick={() => setFriendFilter(!friendFilter)} size="xs">
                  Friends
                </Button>
              </Tooltip> }
              <TextInput
                leftSection={<IconSearch style={{ width: 16, height: 16 }} />}
                size="xs"
                placeholder="Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </Flex>

            <Box pos="relative">
              <LoadingOverlay visible={isTableLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Place</Table.Th>
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
                  { leaderboardTable.map((u, index) => {
                    return <Table.Tr key={u.id}>
                      <Table.Td>{u.rank}.</Table.Td>
                      <Table.Td>
                        { u.isPlayer && <Flex gap="xs">
                          <Flex gap="xs" align="center">
                            <Text c="green" fw={600}>
                              {u.name || 'You'}
                            </Text>
                            {u.type === 'LICHESS' && <Image width={16} height={16} src="/lichess.svg" alt="lichess logo"/>}
                            {u.type === 'CHESSCOM' && <Image width={16} height={16} src="/chesscom.svg" alt="chess.com logo"/>}
                          </Flex>
                          { !u.name && <Text><a href="#" onClick={e => {
                            e.preventDefault()
                            setLoginModalOpen(true)
                          }}>(Sign-up | Login)</a></Text> }
                        </Flex>}
                        { (u.name && !u.isPlayer) && <>
                          <Popover width={200} withArrow shadow="md" arrowPosition="side">
                            <Popover.Target>
                              <Flex gap="xs" align="center">
                                <Text c="blue" style={{ cursor: 'pointer' }}>{u.name}</Text>
                                {u.type === 'LICHESS' && <Image width={16} height={16} src="/lichess.svg" alt="lichess logo"/>}
                                {u.type === 'CHESSCOM' && <Image width={16} height={16} src="/chesscom.svg" alt="chess.com logo"/>}
                              </Flex>
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
                              <Box>
                                <Button variant="outline" href={`/u/${u.name}`} component={Link} fullWidth mb="sm">
                                  Visit Profile
                                </Button>
                                { user && user.id && user.name && u.id !== user.id &&
                                  <Button
                                    variant="outline"
                                    onClick={e => updateFriend(e, u.id)}
                                    fullWidth
                                    loading={isFriendLoading}
                                    color={(user.friends || []).includes(u.id) ? 'red' : undefined}
                                  >
                                    { (user.friends || []).includes(u.id) ? 'Remove friend' : 'Add as friend' }
                                  </Button>
                                }
                              </Box>
                            </Popover.Dropdown>
                          </Popover>
                        </> }
                      </Table.Td>
                      <Table.Td>{u.solved}</Table.Td>
                  </Table.Tr> } )}
                </Table.Tbody>
              </Table>

              { leaderboardPages.length > 1 && leaderboardPage > 0 && !search &&
                <Pagination total={leaderboardPages.length} value={leaderboardPage} onChange={setLeaderboardPage} mt="sm" />
              }
            </Box>
          </Card>
        </Box>
      </Flex>
    </Layout>
  );
}
