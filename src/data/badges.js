const hasType = (memories, type) => memories.some((memory) => memory.type === type)

const countRecentMemories = (memories) => {
  if (memories.length === 0) {
    return 0
  }

  const latestTime = Math.max(
    ...memories.map((memory) => new Date(`${memory.date}T00:00:00`).getTime()),
  )
  const weekAgo = latestTime - 6 * 24 * 60 * 60 * 1000

  return memories.filter((memory) => {
    const memoryTime = new Date(`${memory.date}T00:00:00`).getTime()
    return memoryTime >= weekAgo && memoryTime <= latestTime
  }).length
}

export const badgeCatalog = [
  {
    id: 'first-memory',
    title: 'First Memory',
    description: 'You archived your first fan memory.',
    icon: 'First',
    glow: 'gold',
    conditionType: 'first_memory',
    isUnlocked: (memories) => memories.length > 0,
  },
  {
    id: 'concert-star',
    title: 'Concert Star',
    description: 'You saved a concert or live event memory.',
    icon: 'Live',
    glow: 'pink',
    conditionType: 'concert_star',
    isUnlocked: (memories) =>
      hasType(memories, 'Concert') || hasType(memories, 'Fan Event'),
  },
  {
    id: 'streaming-hero',
    title: 'Streaming Hero',
    description: 'You documented your streaming support.',
    icon: 'Stream',
    glow: 'blue',
    conditionType: 'streaming_hero',
    isUnlocked: (memories) => hasType(memories, 'Streaming'),
  },
  {
    id: 'fan-project-contributor',
    title: 'Fan Project Contributor',
    description: 'You joined or supported a fan project.',
    icon: 'Project',
    glow: 'purple',
    conditionType: 'fan_project',
    isUnlocked: (memories) =>
      hasType(memories, 'Fan Event') || hasType(memories, 'Social Support'),
  },
  {
    id: 'positive-fan',
    title: 'Positive Fan',
    description: 'You supported your artist in a healthy and meaningful way.',
    icon: 'Care',
    glow: 'gold',
    conditionType: 'positive_fan',
    isUnlocked: (memories) => memories.length >= 3,
  },
  {
    id: 'seven-day-supporter',
    title: '7-Day Supporter',
    description: 'You showed consistent support over time.',
    icon: '7 Days',
    glow: 'blue',
    conditionType: 'seven_day_supporter',
    isUnlocked: (memories) => countRecentMemories(memories) >= 4,
  },
]

export const getBadgesForMemories = (memories) =>
  badgeCatalog.map((badge) => ({
    ...badge,
    unlocked: badge.isUnlocked(memories),
  }))
