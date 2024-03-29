import React from 'react'
import { usePuzzleIndexStore } from '@/stores/usePuzzleIndexStore'
import { Badge } from '@mantine/core';

const ResultChip = ({ children, result, active, index = null, results = [] }) => {
  const setPuzzleIndex = usePuzzleIndexStore(state => state.setPuzzleIndex)
  const allowIndexChange = index !== null && (index === 0 || results[index-1] !== undefined)

  const handleClick = () => {
    if (allowIndexChange) {
      setPuzzleIndex(index)
    }
  }
  return <Badge
    color={result === true ? "green" : result === undefined ? "blue" : "red"}
    variant={active ? 'light' : (result === undefined ? "outline" : "filled") }
    size="xs"
    style={{ cursor: allowIndexChange ? 'pointer' : 'default' }}
    onClick={handleClick}
  >
    {children}
  </Badge>
}

export default ResultChip
