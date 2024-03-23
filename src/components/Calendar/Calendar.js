import React from 'react'
import { Badge, Flex, Tooltip, Text } from '@mantine/core'
import useWindowSize from '@/utils/useWindowSize'
import styles from './Calendar.module.css'

const Calendar = ({ puzzles = [], userId }) => {
  const size = useWindowSize()
  const rows = 7
  const columns = size.width >= 520 ? 20 : 10

  return (
    <>
      <Flex ml="xs">
        <Badge mr={3} className={styles.future} readOnly />
        {[...Array(columns)]
          .map((x, i) => {
            const date = new Date()
            date.setDate(date.getDate() + ((7 + (7 - date.getDay())) % 7))
            const days = 7 * i
            date.setDate(date.getDate() - days)
            const month = date.toLocaleString('en-US', { month: 'short' })
            date.setDate(date.getDate() - 7)

            return (
              <Text
                key={`month-${i}`}
                c='dimmed'
                mr={3}
                style={{
                  fontSize: '0.7em',
                  width: '20px',
                  overflow: 'visible',
                }}
              >
                {date.getDate() <= 7 ? month : ''}
              </Text>
            )
          })
          .reverse()}
      </Flex>
      <Flex>
      <Flex direction='column' mr='sm'>
        <Text c='dimmed' style={{ fontSize: '0.7em', lineHeight: '2em' }}>
          Mo
        </Text>
        <Text c='dimmed' style={{ fontSize: '0.7em', lineHeight: '2em' }}>
          Tu
        </Text>
        <Text c='dimmed' style={{ fontSize: '0.7em', lineHeight: '2em' }}>
          We
        </Text>
        <Text c='dimmed' style={{ fontSize: '0.7em', lineHeight: '2em' }}>
          Th
        </Text>
        <Text c='dimmed' style={{ fontSize: '0.7em', lineHeight: '2em' }}>
          Fr
        </Text>
        <Text c='dimmed' style={{ fontSize: '0.7em', lineHeight: '2em' }}>
          Sa
        </Text>
        <Text c='dimmed' style={{ fontSize: '0.7em', lineHeight: '2em' }}>
          Su
        </Text>
      </Flex>
      {[...Array(columns)]
        .map((x, i) => {
          return (
            <Flex
              key={`calendar-${i}`}
              direction="column"
            >
              {[...Array(rows)]
                .map((x, j) => {
                  const date = new Date()
                  date.setDate(
                    date.getDate() + ((7 + (7 - date.getDay())) % 7)
                  ) // make it next sunday

                  const days = 7 * i + j
                  date.setDate(date.getDate() - days)
                  const dayPuzzle = puzzles.filter(
                    (p) => p.date === date.toISOString().slice(0, 10)
                  )
                  const solved = dayPuzzle.filter((p) =>p.solved[userId]).length

                  const isToday =
                    new Date().toDateString() === date.toDateString()
                  const isFuture = new Date() < date
                  const className = isToday
                    ? styles.today
                    : isFuture
                    ? styles.future
                    : ''

                  return (
                    <Tooltip
                      label={date.toDateString()} // add solved count
                      key={`calendar-${j}-${i}`}
                    >
                      <Badge
                        variant={solved === 0 ? 'outline' : 'filled'}
                        color={solved === 0 ? 'gray' : `blue.${(solved*2) - 1}`}
                        mr={3}
                        mb={3}
                        className={className}
                        readOnly
                        size="md"
                        radius="xs"
                      />
                    </Tooltip>
                  )
                })
                .reverse()}
            </Flex>
          )
        }).reverse()}
      </Flex>
      <Flex mt="md">
        <Text size="xs" mr="md">Solved none</Text>
        {[0,1,3,5,7,9].map(i => <Badge
          key={`demo-badge-${i}`}
          variant={i === 0 ? 'outline' : 'filled'}
          color={i === 0 ? 'gray' : `blue.${i}`}
          mr={3}
          mb={3}
          readOnly
          size="sm"
          radius="xs"
        />)}
        <Text size="xs" ml="md">Solved all</Text>
      </Flex>
    </>
  )
}

export default Calendar
