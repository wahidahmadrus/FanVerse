import enCardImage from '../assets/images/characters/optimized/en.webp'
import onCardImage from '../assets/images/characters/optimized/on.webp'
import uanCardImage from '../assets/images/characters/optimized/uan.webp'
import yalCardImage from '../assets/images/characters/optimized/yal.webp'

const fallbackMemoryRequirements = [0, 3, 7, 15]

export const archiveCharacters = [
  {
    id: 'en',
    name: 'En',
    title: 'The Distant Devotee',
    fullTitle: 'The Distant Devotee',
    gender: 'boy',
    role: 'Quiet supporter',
    personalityTags: ['Sincere', 'Distant', 'Loyal'],
    shortDescription:
      'A hidden supporter who protects memories from far away.',
    storyPreview:
      'En never tries to get noticed. He supports from far away, saves memories, repairs broken fan archives, translates moments, and protects disappearing fandom history. He believes love does not need to be seen to be real, only sincere.',
    quote:
      "Even if I never reach your world, I'll help your light travel farther.",
    emotionalMeaning:
      'Represents quiet support, distant love, and sincere effort.',
    imageKey: 'en-character',
    imageUrl: '',
    cardImageUrl: enCardImage,
    coverImageUrl: '',
    collectibleCardId: '',
    themeColor: 'purple-blue',
    rarityType: 'Premium Character Fragment',
    fragments: [
      {
        id: 'en-fragment-1',
        title: 'Beginning',
        fragment_order: 1,
        required_memories: 0,
        content:
          'The first signal En saved was barely visible: one late-night post, one tiny translation, and one fan memory almost lost to time.',
      },
      {
        id: 'en-fragment-2',
        title: 'Silent Signal',
        fragment_order: 2,
        required_memories: 3,
        content:
          'When Archive Zero dimmed, En rebuilt the path between scattered memories so distant support could still reach the person it was meant for.',
      },
      {
        id: 'en-fragment-3',
        title: 'Hidden Channel',
        fragment_order: 3,
        required_memories: 7,
        content:
          'En learned to stitch together the smallest proofs of care until quiet support became a map no distance could erase.',
      },
      {
        id: 'en-fragment-4',
        title: 'Far Light',
        fragment_order: 4,
        required_memories: 15,
        content:
          'By the time the far light returned, En understood that unseen love could still leave a permanent signal in the archive.',
      },
    ],
  },
  {
    id: 'uan',
    name: 'Uan',
    title: 'The Endless Heart',
    fullTitle: 'The Endless Heart',
    gender: 'girl',
    role: 'Emotion seeker',
    personalityTags: ['Emotional', 'Curious', 'Intense'],
    shortDescription:
      'A searching heart who notices the hidden details others miss.',
    storyPreview:
      'Uan feels every artist like a new universe. She notices tiny details, hidden emotions, and the soft moments others miss. She often mistakes fascination for fate, not because she is careless, but because she is searching for the feeling of being fully understood.',
    quote: 'I keep mistaking fascination for fate.',
    emotionalMeaning:
      'Represents emotional attachment, connection, and the desire to be understood.',
    imageKey: 'uan-character',
    imageUrl: '',
    cardImageUrl: uanCardImage,
    coverImageUrl: '',
    collectibleCardId: '',
    themeColor: 'pink-lavender',
    rarityType: 'Premium Character Fragment',
    fragments: [
      {
        id: 'uan-fragment-1',
        title: 'Beginning',
        fragment_order: 1,
        required_memories: 0,
        content:
          'Uan found a hidden pattern in the archive: every saved detail glowed brighter when it came from a fan who wanted to be understood.',
      },
      {
        id: 'uan-fragment-2',
        title: 'Tiny Details',
        fragment_order: 2,
        required_memories: 3,
        content:
          'Uan followed a trail of tiny saved moments and realized every universe she loved was also teaching her how to name her own heart.',
      },
      {
        id: 'uan-fragment-3',
        title: 'Pattern of Light',
        fragment_order: 3,
        required_memories: 7,
        content:
          'The more memories Uan archived, the clearer the pattern became: longing was not a mistake, but a signal asking to be understood.',
      },
      {
        id: 'uan-fragment-4',
        title: 'Endless Heart',
        fragment_order: 4,
        required_memories: 15,
        content:
          'Uan stopped chasing every spark as destiny and began keeping the ones that helped her feel honest, steady, and real.',
      },
    ],
  },
  {
    id: 'on',
    name: 'On',
    title: 'The Unbreakable Pulse',
    fullTitle: 'The Unbreakable Pulse',
    gender: 'girl',
    role: 'Steady supporter',
    personalityTags: ['Positive', 'Loyal', 'Warm'],
    shortDescription:
      'A bright pulse who keeps support gentle, patient, and alive.',
    storyPreview:
      'On is the person fans look for when the fandom feels tired. She cheers others up, calms conflicts, supports artists without ownership, and reminds people why they became fans in the first place. Her support is not loud for attention; it is steady because she believes love should not disappear when things become difficult.',
    quote:
      "If you truly support someone, you don't disappear when things become difficult.",
    emotionalMeaning:
      'Represents healthy support, loyalty, patience, and positivity.',
    imageKey: 'on-character',
    imageUrl: '',
    cardImageUrl: onCardImage,
    coverImageUrl: '',
    collectibleCardId: '',
    themeColor: 'gold-blue',
    rarityType: 'Premium Character Fragment',
    fragments: [
      {
        id: 'on-fragment-1',
        title: 'Beginning',
        fragment_order: 1,
        required_memories: 0,
        content:
          'On restored warmth to a tired channel by saving the messages that helped fans remember why they started cheering.',
      },
      {
        id: 'on-fragment-2',
        title: 'Gentle Words',
        fragment_order: 2,
        required_memories: 3,
        content:
          'When the fandom split into noise, On archived the gentle words first, proving support could stay strong without becoming sharp.',
      },
      {
        id: 'on-fragment-3',
        title: 'Steady Pulse',
        fragment_order: 3,
        required_memories: 7,
        content:
          'On kept a pulse running through the archive by preserving the moments where fans chose patience over pressure.',
      },
      {
        id: 'on-fragment-4',
        title: 'Warm Signal',
        fragment_order: 4,
        required_memories: 15,
        content:
          'The warmest signal On saved was not the loudest cheer, but the quiet proof that care could survive difficult days.',
      },
    ],
  },
  {
    id: 'yal',
    name: 'Yal',
    title: 'The One Who Wanted More',
    fullTitle: 'The One Who Wanted More',
    gender: 'girl',
    role: 'Intense dreamer',
    personalityTags: ['Passionate', 'Dreamy', 'Conflicted'],
    shortDescription:
      'A powerful feeling trying to understand itself without disappearing.',
    storyPreview:
      'Yal feels too deeply. Every interaction feels meaningful, every kind word becomes a memory, and every small moment feels like possibility. She struggles to separate admiration from love, but her story is not about being wrong. It is about learning how to understand powerful emotions without losing herself.',
    quote:
      "I don't want to admire from far away. I want to understand what I'm really feeling.",
    emotionalMeaning:
      "Represents longing, emotional intensity, and the need to understand one's feelings.",
    imageKey: 'yal-character',
    imageUrl: '',
    cardImageUrl: yalCardImage,
    coverImageUrl: '',
    collectibleCardId: '',
    themeColor: 'violet-rose',
    rarityType: 'Premium Character Fragment',
    fragments: [
      {
        id: 'yal-fragment-1',
        title: 'Beginning',
        fragment_order: 1,
        required_memories: 0,
        content:
          'Yal entered Archive Zero through a memory that felt too bright to name, then began learning which feelings were hers to keep.',
      },
      {
        id: 'yal-fragment-2',
        title: 'Almost Confession',
        fragment_order: 2,
        required_memories: 3,
        content:
          'Yal found a card that reflected every almost-confession back at her, and for the first time she asked what longing was trying to protect.',
      },
      {
        id: 'yal-fragment-3',
        title: 'Bright Feeling',
        fragment_order: 3,
        required_memories: 7,
        content:
          'The archive did not ask Yal to feel less. It asked her to save each memory carefully enough to understand what was true.',
      },
      {
        id: 'yal-fragment-4',
        title: 'More Than Admiration',
        fragment_order: 4,
        required_memories: 15,
        content:
          'Yal finally saw that wanting more did not have to consume her. It could become a memory, a lesson, and a softer kind of strength.',
      },
    ],
  },
]

export const getArchiveCharacterById = (characterId) =>
  archiveCharacters.find((character) => character.id === characterId)

export const getArchiveCharacterName = (characterId) =>
  getArchiveCharacterById(characterId)?.name || 'Archive Zero'

const getRequiredMemories = (fragment, index) => {
  const value = fragment.required_memories ?? fragment.requiredMemories

  if (value !== undefined && value !== null && value !== '') {
    return Math.max(0, Number(value) || 0)
  }

  return fallbackMemoryRequirements[index] ?? Math.max(0, index * 5)
}

const getLockedFragmentText = ({
  fragment,
  hasCharacterCard,
  memoryCount,
}) => {
  if (!hasCharacterCard) {
    return `Unlock this Premium Character Fragment card to reveal Fragment ${fragment.fragmentOrder}.`
  }

  const remainingMemories = Math.max(
    0,
    fragment.requiredMemories - Number(memoryCount || 0),
  )
  const memoryWord = remainingMemories === 1 ? 'memory' : 'memories'

  return `Add ${remainingMemories} more ${memoryWord} to reveal this fragment.`
}

export const isCharacterFragmentUnlocked = ({
  fragment,
  hasCharacterCard = false,
  hasPremiumFragment = false,
  memoryCount = 0,
}) =>
  (hasCharacterCard || hasPremiumFragment) &&
  Number(memoryCount || 0) >= Number(fragment.requiredMemories || 0)

const normalizeFragment = (fragment, index) => {
  const fragmentOrder = Number(
    fragment.fragment_order || fragment.fragmentOrder || index + 1,
  )

  return {
    id: fragment.id || `fragment-${index + 1}`,
    title: fragment.title || `Fragment ${fragmentOrder}`,
    content: fragment.content || '',
    fragmentOrder,
    requiredMemories: getRequiredMemories(fragment, index),
  }
}

export const getCharacterFragments = ({
  character,
  fragments = [],
  hasCharacterCard = false,
  hasPremiumFragment = false,
  memoryCount = 0,
}) => {
  const databaseFragments = fragments
    .filter((fragment) => fragment.character_id === character?.id)
    .sort(
      (firstFragment, secondFragment) =>
        Number(firstFragment.fragment_order || 0) -
        Number(secondFragment.fragment_order || 0),
    )
  const sourceFragments =
    databaseFragments.length > 0 ? databaseFragments : character?.fragments || []
  const characterCardUnlocked = hasCharacterCard || hasPremiumFragment

  return sourceFragments.map((fragment, index) => {
    const normalizedFragment = normalizeFragment(fragment, index)

    return {
      ...normalizedFragment,
      isUnlocked: isCharacterFragmentUnlocked({
        fragment: normalizedFragment,
        hasCharacterCard: characterCardUnlocked,
        memoryCount,
      }),
      lockedContent: getLockedFragmentText({
        fragment: normalizedFragment,
        hasCharacterCard: characterCardUnlocked,
        memoryCount,
      }),
    }
  })
}

export const createCharacterShareText = (character) =>
  `I unlocked ${character.name} - ${character.fullTitle} from Archive Zero on FanVerse Archive.`
