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
    id: 'proof-added',
    title: 'Proof Added',
    description: 'You added proof to make a memory more authentic.',
    icon: 'Proof',
    glow: 'blue',
    conditionType: 'proof_added',
    isUnlocked: (memories) =>
      memories.some((memory) => memory.has_proof || memory.proof_image_url),
  },
  {
    id: 'hundred-stars',
    title: '100 Stars',
    description: 'Your archive collected its first 100 stars.',
    icon: '100',
    glow: 'gold',
    conditionType: 'hundred_stars',
    isUnlocked: (memories) =>
      memories.reduce(
        (total, memory) => total + Number(memory.final_stars || memory.stars || 0),
        0,
      ) >= 100,
  },
  {
    id: 'fan-art-memory',
    title: 'Fan Art Memory',
    description: 'You archived a creative fan art moment.',
    icon: 'Art',
    glow: 'pink',
    conditionType: 'fan_art_memory',
    isUnlocked: (memories) => hasType(memories, 'Fan Art'),
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
