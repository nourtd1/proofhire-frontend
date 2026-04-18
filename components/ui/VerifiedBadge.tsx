'use client'

import React from 'react'
import { ShieldCheck } from 'lucide-react'

type Props = { size?: 'sm' | 'md' | 'lg'; showLabel?: boolean }

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-10 h-10',
}

export default function VerifiedBadge({ size = 'md', showLabel = false }: Props): React.JSX.Element {
  const iconClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-6 h-6'
  return (
    <div
      className="inline-flex items-center gap-2"
      title="This candidate's skills have been verified by ProofHire"
    >
      <span className={['inline-flex items-center justify-center rounded-full bg-green-500 text-white', sizeClasses[size]].join(' ')}>
        <ShieldCheck className={iconClass} />
      </span>
      {showLabel ? <span className="text-green-600 font-medium text-sm">Verified</span> : null}
    </div>
  )
}

