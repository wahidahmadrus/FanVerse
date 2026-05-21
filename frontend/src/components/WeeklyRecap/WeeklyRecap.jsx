import './WeeklyRecap.css'

const getRecentMemories = (memories) => {
  if (memories.length === 0) {
    return []
  }

  const latestTime = Math.max(
    ...memories.map((memory) =>
      new Date(`${memory.memory_date || memory.date}T00:00:00`).getTime(),
    ),
  )
  const weekAgo = latestTime - 6 * 24 * 60 * 60 * 1000

  return memories.filter((memory) => {
    const memoryTime = new Date(`${memory.memory_date || memory.date}T00:00:00`).getTime()
    return memoryTime >= weekAgo && memoryTime <= latestTime
  })
}

const getTopActivity = (memories) => {
  if (memories.length === 0) {
    return 'No activity yet'
  }

  const activityCounts = memories.reduce((counts, memory) => {
    const activityType = memory.activity_type || memory.type
    counts[activityType] = (counts[activityType] || 0) + 1
    return counts
  }, {})

  return Object.entries(activityCounts).sort((first, second) => second[1] - first[1])[0][0]
}

function WeeklyRecap({ memories }) {
  const recentMemories = getRecentMemories(memories)
  const recentStars = recentMemories.reduce(
    (totalStars, memory) => totalStars + Number(memory.stars || 0),
    0,
  )
  const topMood = recentMemories[0]?.mood || 'Reflective'

  return (
    <article className="weekly-recap">
      <div>
        <p className="section-kicker">Weekly Recap</p>
        <h2>A gentle snapshot of your recent support</h2>
        <p>
          You saved {recentMemories.length} memories and collected {recentStars}{' '}
          stars in this recent chapter.
        </p>
      </div>

      <dl className="weekly-recap__list">
        <div>
          <dt>Most saved activity</dt>
          <dd>{getTopActivity(recentMemories)}</dd>
        </div>
        <div>
          <dt>Leading mood</dt>
          <dd>{topMood}</dd>
        </div>
        <div>
          <dt>Archive note</dt>
          <dd>Track support at your own pace</dd>
        </div>
      </dl>
    </article>
  )
}

export default WeeklyRecap
