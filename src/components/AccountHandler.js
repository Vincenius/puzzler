import React, { useState } from 'react'
import useSWR, { useSWRConfig }  from 'swr'
import { Text, Tabs, NavLink, Modal, TextInput, PasswordInput, Button, Menu, Image, Divider } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { fetcher } from "@/utils/fetcher";
import { useLoginModalOpen } from '@/stores/useLoginModalOpen'
import Link from 'next/link';

const AccountHandler = ({ user, setResults, setPuzzleIndex }) => {
  const { mutate } = useSWRConfig()
  const { data: puzzleData } = useSWR('/api/puzzles', fetcher)
  const puzzles = puzzleData && puzzleData.sort((a,b) => parseInt(a.Rating) - parseInt(b.Rating))
  const loginModalOpen = useLoginModalOpen(state => state.isOpen)
  const setLoginModalOpen = useLoginModalOpen(state => state.setIsOpen)
  const [friendFilter, setFriendFilter] = useLocalStorage({
    key: 'friend-filter',
    defaultValue: false,
  });

  const [error, setError] = useState('')
  const [userLoading, setUserLoading] = useState(false);
  const [pwaModalOpen, setPwaModalOpen] = useState(false);

  const refetchLeaderboards = () => {
    mutate(
      key => typeof key === 'string' && key.startsWith('/api/leaderboards'),
      undefined,
      { revalidate: true }
    )
  }

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
        setLoginModalOpen(false)
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
        setLoginModalOpen(false)
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
      setFriendFilter(false)
    })
  }

  return <>
    { user && user.name
      ? <Menu shadow="md" width={200}>
        <Menu.Target>
          <NavLink component="button" label={user.name} w="auto" active variant="subtle" size="sm" />
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item component={Link} href={`/u/${user.name}`}>
            Profile
          </Menu.Item>
          <Menu.Item onClick={logout}>
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      : <NavLink component="button" label="Sign In" w="auto" active variant="light" onClick={() => setLoginModalOpen(true)} />
    }
    <Modal opened={loginModalOpen} onClose={() => {
      setLoginModalOpen(false)
      setError('')
    }}>
      <Tabs defaultValue="login" variant="outline" onChange={() => setError('')}>
        <Tabs.List grow mb="xl">
          <Tabs.Tab value="login" disabled={userLoading}>
            Login
          </Tabs.Tab>
          <Tabs.Tab value="register" disabled={userLoading}>
            Create Account
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="login">
          <Button
            fullWidth my="md" variant="outline" color="black"
            component="a"
            href="/api/lichess/oauth"
            onClick={e =>{
              e.preventDefault();
              setLoginModalOpen(false)
              window.location = "/api/lichess/oauth"
            }}
          >
            Login with Lichess
          </Button>

          <Button
            fullWidth my="md" variant="filled" color="#48772F"
            component="a"
            href="/api/chesscom/oauth"
            onClick={e =>{
              e.preventDefault();
              setLoginModalOpen(false)
              window.location = "/api/chesscom/oauth"
            }}
          >
            Login with Chess.com
          </Button>

          <Divider my="xs" label="or" labelPosition="center" />
          <form onSubmit={handleLogin}>
            <TextInput name="username" label="Username" mb="sm" required />
            <PasswordInput name="password" label="Passwort" mb="sm" required />
            { error && <Text c="red" mb="sm">{error}</Text> }
            <Button type="submit" loading={userLoading} disabled={userLoading}>Login</Button>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="register">
          <form onSubmit={handleRegister}>
            <TextInput name="username" label="Username" mb="sm" required />
            <PasswordInput name="password" label="Passwort" mb="sm" required />
            <PasswordInput name="passwordRepeat" label="Passwort wiederholen" mb="sm" required />
            { error && <Text c="red" mb="sm">{error}</Text> }
            <Button type="submit" loading={userLoading} disabled={userLoading}>Create Account</Button>
          </form>
        </Tabs.Panel>
      </Tabs>
    </Modal>

    <Modal opened={pwaModalOpen} onClose={() => setPwaModalOpen(false)}>
      <Text fw="bold">Great to have you on board!</Text>
      <Text mb="md">Did you know You can download the website as mobile App? Just press the three dots in your mobile browser and click &quot;Install&quot; (Firefox) or &quot;Install app&quot; (Chrome)</Text>

      {/* todo update screenshot! */}
      <Image
        alt="chrome screenshot"
        radius="md"
        src="/chrome.png"
      />
    </Modal>
  </>
}

export default AccountHandler
