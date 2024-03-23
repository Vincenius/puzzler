import React from 'react'
import { Badge } from '@mantine/core';

const ResultChip = ({ children, result, active }) => {
  return <Badge
    color={result === true ? "green" : result === undefined ? "blue" : "red"}
    variant={result === undefined ? active ? 'light' : "outline" : "filled" }
    size="xs"
    >
    {children}
  </Badge>
}

export default ResultChip
