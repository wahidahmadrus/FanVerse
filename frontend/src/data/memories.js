export const activityTypes = [
  'All',
  'Concert',
  'Streaming',
  'Voting',
  'Fan Art',
  'Fan Event',
  'Fan Meet',
  'Merch',
  'Social Support',
  'Personal Memory',
  'Special Moment',
]

export const memoryActivityTypes = activityTypes.filter((type) => type !== 'All')

export const moodOptions = [
  'Excited',
  'Proud',
  'Inspired',
  'Motivated',
  'Grateful',
  'Peaceful',
  'Joyful',
]

export const mockMemories = [
  {
    id: 'memory-online-fan-event',
    title: 'Joined an Online Fan Event',
    artist: 'Luna Ray',
    type: 'Fan Event',
    date: '2026-05-10',
    mood: 'Excited',
    stars: 20,
    description:
      'I joined an online fan event and saved my favorite moment from the live session.',
  },
  {
    id: 'memory-streamed-new-album',
    title: 'Streamed the New Album',
    artist: 'Luna Ray',
    type: 'Streaming',
    date: '2026-05-08',
    mood: 'Proud',
    stars: 15,
    description: 'I listened to the new album and shared it with friends.',
  },
  {
    id: 'memory-created-fan-art',
    title: 'Created Fan Art',
    artist: 'Luna Ray',
    type: 'Fan Art',
    date: '2026-05-05',
    mood: 'Inspired',
    stars: 25,
    description:
      'I created a small fan art piece to celebrate the artist comeback.',
  },
  {
    id: 'memory-voted-music-awards',
    title: 'Voted in Music Awards',
    artist: 'Luna Ray',
    type: 'Voting',
    date: '2026-05-02',
    mood: 'Motivated',
    stars: 10,
    description:
      'I participated in a voting event and archived the moment as part of my support journey.',
  },
]
