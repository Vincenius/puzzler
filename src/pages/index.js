import Head from "next/head";
import { Inter } from "next/font/google";
import useSWR, { useSWRConfig }  from 'swr'
import PuzzleBoard from "@/components/Chessboard";
import { useState, useEffect } from "react";
import { Flex, Badge, Box, LoadingOverlay, Card, Title, Text, Tabs, Table, NavLink, Modal, TextInput, Image, PasswordInput, Button, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { formatDate, getBeginningOfWeek, getEndOfWeek, getMonthDate } from "@/utils/dateHelper";

const inter = Inter({ subsets: ["latin"] });
const fetcher = (...args) => fetch(...args).then(res => res.json())

function transformURL(url) {
  var match = url.match(/\#Some\((\d+)\)/);
  if (match && match[1]) {
      var number = match[1];
      return url.replace(/\#Some\(\d+\)/, '#' + number);
  }

  return url;
}

const HeadlineCard = ({ user, logout, results, puzzleIndex, open }) => <Card withBorder shadow="sm">
<Flex justify="space-between" align="center" mb="sm">
  <Title order={1} size="h3">Happy Sunday Puzzler</Title>
  { user && user.name
    ? <Menu shadow="md" width={200}>
        <Menu.Target>
          <NavLink component="button" label={user.name} w="auto" active variant="subtle" />
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={logout}>
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    : <NavLink component="button" label="Anmelden" w="auto" active variant="subtle" onClick={open} />
  }
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
    checked={result !== undefined}
    color={result === true ? "green" : result === undefined ? "blue" : "red"}
    variant={result === undefined ? active ? 'light' : "outline" : "filled" }
    size="xs"
  >
    {children}
  </Badge>

export default function Home() {
  const { mutate } = useSWRConfig()
  const [opened, { open, close }] = useDisclosure(false);
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('day');
  const [results, setResults] = useState([])
  const [isInit, setIsInit] = useState(false)
  const [error, setError] = useState('')
  const [userLoading, setUserLoading] = useState(false)
  const [pwaModalOpen, setPwaModalOpen] = useState(false)
  const { data: puzzleData, isLoading: isPuzzleLoading } = useSWR('/api/puzzles', fetcher)
  const { data: user, isLoading: isUserLoading } = useSWR('/api/users', fetcher)
  const { data: tableData, isLoading: isTableLoading } = useSWR(`/api/leaderboards?q=${activeTab}`, fetcher)
  const isLoading = isPuzzleLoading || isUserLoading
  const puzzles = puzzleData && puzzleData.sort((a,b) => parseInt(a.Rating) - parseInt(b.Rating))

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
    mutate('/api/leaderboards?q=day')
    mutate('/api/leaderboards?q=week')
    mutate('/api/leaderboards?q=month')
    mutate('/api/leaderboards?q=allTime')
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
    ? formatDate(new Date())
    : activeTab === 'week'
      ? `${getBeginningOfWeek()} - ${getEndOfWeek()}`
      : activeTab === 'month'
        ? getMonthDate()
        : 'Gesamter Zeitraum'

  const handleRegister = e => {
    e.preventDefault();
    setUserLoading(true);
    const username = e.target.elements.username.value;
    const password = e.target.elements.password.value;
    const passwordRepeat = e.target.elements.passwordRepeat.value;

    fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ type: "CREATE", username, password, passwordRepeat })
    }).then(res => res.json())
    .then(res => {
      if (!res.error) {
        mutate('/api/users')
        refetchLeaderboards()
        setError('')
        close()
        setPwaModalOpen(true)
      } else {
        setError(res.msg)
      }
    }).catch(err => {
      console.error(err)
    }).finally(() => setUserLoading(false))
  }

  const handleLogin = e => {
    e.preventDefault();
    setUserLoading(true);
    const username = e.target.elements.username.value;
    const password = e.target.elements.password.value;

    fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ type: "LOGIN", username, password })
    }).then(res => res.json())
    .then(res => {
      if (!res.error) {
        setError('')
        mutate('/api/users')
        refetchLeaderboards()

        const userId = res.id
        const initResults = puzzles.map(puzzle => {
          const result = puzzle.solved[userId]
          if (result === true || result === false) {
            return result
          }
        }).filter(r => r !== undefined)
        setResults(initResults)
        setPuzzleIndex(initResults.length > 4 ? 4 : initResults.length)
        close('')
      } else {
        setError(res.msg)
      }
    }).catch(err => {
      console.error(err)
    }).finally(() => setUserLoading(false))
  }

  const logout = () => {
    fetch('/api/logout').then(() => {
      mutate('/api/users')
      refetchLeaderboards()
      setResults([])
      setPuzzleIndex(0)
    })
  }

  return (
    <>
      <Head>
        <title>Puzzler | Happy Sunday</title>
        <meta name="description" content="Puzzle Contest für die Happy Sunday Gruppe" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ paddingBottom: '2em' }}>
        <Flex align={{ base: "center", md: "flex-start" }} justify="center" mt="lg" p="md" direction={{ base: "column", md: "row" }} gap="xl">
          <Box display={{ base: 'block', md: 'none' }} w="100%" maw={450}>
            <HeadlineCard {...{ user, logout, results, puzzleIndex, open }} />
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
              <HeadlineCard {...{ user, logout, results, puzzleIndex, open }} />
            </Box>
            <Card withBorder shadow="sm">
              <Tabs value={activeTab} onChange={setActiveTab} variant="pills" mb="sm">
                <Tabs.List grow>
                  <Tabs.Tab value="day">
                    Heute
                  </Tabs.Tab>
                  <Tabs.Tab value="week">
                    Woche
                  </Tabs.Tab>
                  <Tabs.Tab value="month">
                    Monat
                  </Tabs.Tab>
                  <Tabs.Tab value="allTime">
                    Alle
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>

              <Text fw={200} opacity={0.5} mb="sm">{dateDisplay}</Text>

              <Box pos="relative">
                <LoadingOverlay visible={isTableLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th></Table.Th>
                      <Table.Th>Spieler</Table.Th>
                      <Table.Th>Punkte</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    { isTableLoading && <>
                      <Table.Tr></Table.Tr>
                      <Table.Tr></Table.Tr>
                      <Table.Tr></Table.Tr>
                    </> }
                    { !isTableLoading && tableData && tableData.sort((a, b) => b.solved - a.solved).map((u, index) => (
                      <Table.Tr key={u.id}>
                        <Table.Td>{index+1}.</Table.Td>
                        <Table.Td>
                          { user && user.id === u.id && <Text c="green" fw={600}>
                            {u.name || 'Anonym'}
                          </Text> }
                          { !user || (user.id !== u.id) && <Text>
                            {u.name || 'Anonym'}
                          </Text> }
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

        <Modal opened={opened} onClose={() => {
          close()
          setError('')
        }}>
          <Tabs defaultValue="register" variant="outline" onChange={() => setError('')}>
            <Tabs.List grow mb="md">
              <Tabs.Tab value="register" disabled={userLoading}>
                Registrieren
              </Tabs.Tab>
              <Tabs.Tab value="login" disabled={userLoading}>
                Einloggen
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="register">
              <form onSubmit={handleRegister}>
                <TextInput name="username" label="Username" mb="sm" required />
                <PasswordInput name="password" label="Passwort" mb="sm" required />
                <PasswordInput name="passwordRepeat" label="Passwort wiederholen" mb="sm" required />
                { error && <Text c="red" mb="sm">{error}</Text> }
                <Button type="submit" loading={userLoading} disabled={userLoading}>Account Erstellen</Button>
              </form>
            </Tabs.Panel>

            <Tabs.Panel value="login">
              <form onSubmit={handleLogin}>
                <TextInput name="username" label="Username" mb="sm" required />
                <PasswordInput name="password" label="Passwort" mb="sm" required />
                { error && <Text c="red" mb="sm">{error}</Text> }
                <Button type="submit" loading={userLoading} disabled={userLoading}>Einloggen</Button>
              </form>
            </Tabs.Panel>
          </Tabs>
        </Modal>

        <Modal opened={pwaModalOpen} onClose={() => setPwaModalOpen(false)}>
          <Text fw="bold">Schön dass du dabei bist!</Text>
          <Text mb="md">Du kannst die Website übrigens auch als App abspeichern. Drücke dafür auf die drei Punkte in deinem mobilen Browser und auf &quot;Installieren&quot; (Firefox) oder &quot;App installieren&quot; (Chrome)</Text>

          <Image
            alt="chrome screenshot"
            radius="md"
            src="/chrome.png"
          />
        </Modal>
      </main>
    </>
  );
}
