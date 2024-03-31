import { useRouter } from 'next/router'
import useSWR  from 'swr'
import Layout from "@/components/Layout";
import { Title, Text, Table, Flex } from '@mantine/core';
import { fetcher } from "@/utils/fetcher";
import Calendar from "@/components/Calendar/Calendar";
import ResultChip from "@/components/ResultChip";
import Trophy from "@/components/Trophy/Trophy";

export default function Page() {
  const router = useRouter()
  const { data: profile, isLoading: isProfileLoading } = useSWR(`/api/profile?username=${router.query.slug}`, fetcher)

  const renderPuzzleTable = puzzles => {
    const userId = profile.user._id
    const groupedByDate = puzzles.reduce((acc, puzzle) => {
      const date = puzzle.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(puzzle);
      return acc;
    }, {});

    // Sort groups by date
    const sortedGroups = Object.entries(groupedByDate).sort((a, b) => new Date(b[0]) - new Date(a[0]));

    // Sort items within each group by Rating
    sortedGroups.forEach(group => {
      group[1].sort((a, b) => parseInt(a.Rating) - parseInt(b.Rating));
    });

    return <Table striped mt="xl" withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Date</Table.Th>
          <Table.Th>Puzzles</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{sortedGroups.map(([date, rowPuzzles]) => {
        return <Table.Tr key={`table-row-${date}`}>
          <Table.Td>{new Date(date).toLocaleDateString()}</Table.Td>
          <Table.Td>
            <Flex gap={{ base: 'xs' }} wrap="wrap" mr="md">
              <ResultChip result={rowPuzzles[0]?.solved[userId]} active={false}>&gt; 1200</ResultChip>
              <ResultChip result={rowPuzzles[1]?.solved[userId]} active={false}>&gt; 1400</ResultChip>
              <ResultChip result={rowPuzzles[2]?.solved[userId]} active={false}>&gt; 1600</ResultChip>
              <ResultChip result={rowPuzzles[3]?.solved[userId]} active={false}>&gt; 1800</ResultChip>
              <ResultChip result={rowPuzzles[4]?.solved[userId]} active={false}>&gt; 2000</ResultChip>
            </Flex>
          </Table.Td>
        </Table.Tr>
      })}
      </Table.Tbody>
    </Table>
  }

  return <Layout>
    <Flex justify="space-between">
      <Title order={2} size="h1" mb="lg">{router.query.slug}</Title>
      {!isProfileLoading && (profile?.user?.trophies || [].length) && <Flex>
        {profile.user.trophies.map(t => <span key={t.description}><Trophy { ...t } /></span>)}
      </Flex>}
    </Flex>

    {/* todo improved loading screen */}
    {isProfileLoading && <Text>Loading...</Text>}

    {!isProfileLoading && !profile?.user?.name && <Title order={3} size="h3">User could not be found...</Title>}
    {!isProfileLoading && profile?.user?.name && <>
      <Calendar puzzles={profile.puzzles} userId={profile.user._id} />

      { renderPuzzleTable(profile.puzzles) }
    </>}
  </Layout>
}