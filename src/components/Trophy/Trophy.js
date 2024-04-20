import React from 'react'
import Image from 'next/image'
import { Tooltip } from '@mantine/core';
import styles from './Trophy.module.css'

const Trophy = ({ description, color, category, size }) => {
  const trophySize = size === 'lg' ? "100" : "50"
  const src = `/pawn-${color}.svg`
  return <Tooltip label={description} position="bottom">
    <Image
      className={styles[color]}
      src={src} alt="trophy" width={trophySize} height={trophySize} />
  </Tooltip>
}

export default Trophy
