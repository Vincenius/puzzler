
import { useEffect, useRef, useState } from 'react'
import useSWR  from 'swr'
import { useDisclosure } from '@mantine/hooks';
import { Modal, Text, Box, Flex, Button } from '@mantine/core';
import party from 'party-js'
import { fetcher } from "@/utils/fetcher";
import Trophy from "@/components/Trophy/Trophy";

const InfoModal = () => {
  const confettiDom = useRef(null)
  const [active, setActive] = useState(0)
  const [isInit, setIsInit] = useState(false)
  const [opened, { open, close }] = useDisclosure(false);
  const [newTrophies, setNewTrophies] = useState([])
  const { data: user, isLoading: isUserLoading, mutate } = useSWR('/api/users', fetcher)

  useEffect(() => {
    const userTrophies = (user?.trophies || []).filter(t => t.new)
    if (userTrophies.length && !isInit) {
      setIsInit(true)
      setNewTrophies(userTrophies)
      open()

      setTimeout(() => {
        party.confetti(confettiDom.current, { count: 40 })
      }, 500)

      fetch('/api/trophies').then(() => mutate())
    }
  }, [user, open, isInit, mutate])

  // todo https://next-intl-docs.vercel.app/docs/getting-started/pages-router
  return (
    <Modal opened={opened} onClose={close} title="Trophäe erhalten">
      <Box ref={confettiDom}>
        {newTrophies.map((t, index) => <Box key={t.description} display={active === index ? 'block' : 'none'}>
          <Text>Herzlichen Glückwunsch! Du hast eine neue Trophäe erhalten!</Text>

          <Flex direction="column" align="center" my="sm">
            <Trophy { ...newTrophies[0] } size="lg"/>
            <Text>{newTrophies[0].description}</Text>
          </Flex>

          <Button onClick={() => {
            if (newTrophies.length === (index + 1)) {
              close()
            } else {
              setActive(active+1)
            }
          }} fullWidth mt="lg">
            {newTrophies.length === (index + 1) ? "Schließen" : "Weiter"}
          </Button>
        </Box>)}
      </Box>
    </Modal>
  );
}

export default InfoModal
