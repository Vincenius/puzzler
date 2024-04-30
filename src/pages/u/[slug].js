import { useRouter } from 'next/router'
import useSWR  from 'swr'
import Layout from "@/components/Layout";
import { Title, Text, Table, Flex, Box } from '@mantine/core';
import { Cell, Pie, Tooltip, ResponsiveContainer, PieChart } from 'recharts';
import { fetcher } from "@/utils/fetcher";
import Calendar from "@/components/Calendar/Calendar";
import ResultChip from "@/components/ResultChip";
import Trophy from "@/components/Trophy/Trophy";

const COLORS = ['#37b24d', '#f03e3e'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

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

  const chartData = (profile?.puzzles || []).reduce((acc, curr) => {
    if (curr.solved[profile.user._id] === true) {
      return [{ name: 'Solved', value: acc[0].value + 1}, acc[1]]
    } else if (curr.solved[profile.user._id] === false) {
      return [acc[0], { name: 'Failed', value: acc[1].value + 1}]
    } else {
      return acc
    }
  }, [{ name: 'Solved', value: 0 }, { name: 'Failed', value: 0 }])

  return <Layout>
    <Flex justify="space-between">
      <Title order={2} size="h1" mb="lg">{router.query.slug}</Title>
      {!isProfileLoading && (profile?.user?.trophies || [].length > 0) && <Flex>
        {profile.user.trophies.map(t => <span key={t.description} style={{ marginLeft: '-15px' }}>
          <Trophy { ...t } />
        </span>)}
      </Flex>}
    </Flex>

    {/* todo improved loading screen */}
    {isProfileLoading && <Text>Loading...</Text>}

    {!isProfileLoading && !profile?.user?.name && <Title order={3} size="h3">User could not be found...</Title>}
    {!isProfileLoading && profile?.user?.name && <>
      <Flex gap="md" justify="space-between" align="center" direction={{ base: 'column', sm: 'row' }}>
        <Box>
          <Calendar puzzles={profile.puzzles} userId={profile.user._id} />
        </Box>
        <Box w="200px" h="200px">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart width={400} height={400}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Flex>

      { renderPuzzleTable(profile.puzzles) }
    </>}
  </Layout>
}