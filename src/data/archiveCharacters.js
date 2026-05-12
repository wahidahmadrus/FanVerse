import enCardImage from '../assets/images/characters/en.png'
import onCardImage from '../assets/images/characters/on.png'
import uanCardImage from '../assets/images/characters/uan.png'
import yalCardImage from '../assets/images/characters/yal.png'

const lockedFragmentText =
  'Unlock more character fragments to reveal this part of the story.'

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
    rarityType: 'Premium Monthly',
    fragments: [
      {
        id: 'fragment-1',
        title: 'Beginning',
        unlockLevel: 'default',
        content:
          'The first signal En saved was barely visible: one late-night post, one tiny translation, and one fan memory almost lost to time.',
      },
      {
        id: 'fragment-2',
        title: 'First Choice',
        unlockLevel: 'chosen_character',
        content:
          'When Archive Zero dimmed, En rebuilt the path between scattered memories so distant support could still reach the person it was meant for.',
      },
      {
        id: 'fragment-3',
        title: 'Hidden Chapter',
        unlockLevel: 'locked',
        content:
          'The next En fragment is sealed inside a premium character card.',
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
    rarityType: 'Premium Monthly',
    fragments: [
      {
        id: 'fragment-1',
        title: 'Beginning',
        unlockLevel: 'default',
        content:
          'Uan found a hidden pattern in the archive: every saved detail glowed brighter when it came from a fan who wanted to be understood.',
      },
      {
        id: 'fragment-2',
        title: 'First Choice',
        unlockLevel: 'chosen_character',
        content:
          'Uan followed a trail of tiny saved moments and realized every universe she loved was also teaching her how to name her own heart.',
      },
      {
        id: 'fragment-3',
        title: 'Hidden Chapter',
        unlockLevel: 'locked',
        content:
          'The next Uan fragment is sealed inside a premium character card.',
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
    rarityType: 'Premium Monthly',
    fragments: [
      {
        id: 'fragment-1',
        title: 'Beginning',
        unlockLevel: 'default',
        content:
          'On restored warmth to a tired channel by saving the messages that helped fans remember why they started cheering.',
      },
      {
        id: 'fragment-2',
        title: 'First Choice',
        unlockLevel: 'chosen_character',
        content:
          'When the fandom split into noise, On archived the gentle words first, proving support could stay strong without becoming sharp.',
      },
      {
        id: 'fragment-3',
        title: 'Hidden Chapter',
        unlockLevel: 'locked',
        content:
          'The next On fragment is sealed inside a premium character card.',
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
    rarityType: 'Premium Monthly',
    fragments: [
      {
        id: 'fragment-1',
        title: 'Beginning',
        unlockLevel: 'default',
        content:
          'Yal entered Archive Zero through a memory that felt too bright to name, then began learning which feelings were hers to keep.',
      },
      {
        id: 'fragment-2',
        title: 'First Choice',
        unlockLevel: 'chosen_character',
        content:
          'Yal found a card that reflected every almost-confession back at her, and for the first time she asked what longing was trying to protect.',
      },
      {
        id: 'fragment-3',
        title: 'Hidden Chapter',
        unlockLevel: 'locked',
        content:
          'The next Yal fragment is sealed inside a premium character card.',
      },
    ],
  },
]

export const getArchiveCharacterById = (characterId) =>
  archiveCharacters.find((character) => character.id === characterId)

export const getArchiveCharacterName = (characterId) =>
  getArchiveCharacterById(characterId)?.name || 'Archive Zero'

export const isCharacterFragmentUnlocked = ({
  character,
  firstCharacterId = '',
  fragment,
  hasPremiumFragment = false,
}) => {
  const unlockLevel = fragment.unlockLevel || fragment.unlock_rule

  if (unlockLevel === 'default') {
    return true
  }

  if (unlockLevel === 'chosen_character') {
    return character.id === firstCharacterId
  }

  if (unlockLevel === 'premium_fragment') {
    return hasPremiumFragment
  }

  return false
}

const normalizeFragment = (fragment, index) => ({
  id: fragment.id || `fragment-${index + 1}`,
  title: fragment.title || `Fragment ${index + 1}`,
  unlockLevel: fragment.unlockLevel || fragment.unlock_rule || 'locked',
  content: fragment.content || '',
  fragmentOrder: Number(fragment.fragment_order || fragment.fragmentOrder || index + 1),
})

export const getCharacterFragments = ({
  character,
  firstCharacterId = '',
  fragments = [],
  hasPremiumFragment = false,
}) => {
  const databaseFragments = fragments
    .filter((fragment) => fragment.character_id === character?.id)
    .sort(
      (firstFragment, secondFragment) =>
        Number(firstFragment.fragment_order || 0) -
        Number(secondFragment.fragment_order || 0),
    )
  const sourceFragments = databaseFragments.length > 0 ? databaseFragments : character?.fragments || []

  return sourceFragments.map((fragment, index) => {
    const normalizedFragment = normalizeFragment(fragment, index)

    return {
      ...normalizedFragment,
      isUnlocked: isCharacterFragmentUnlocked({
        character,
        firstCharacterId,
        fragment: normalizedFragment,
        hasPremiumFragment,
      }),
      lockedContent: lockedFragmentText,
    }
  })
}

export const createCharacterShareText = (character) => {
  const action = character.id === 'en' ? 'I chose' : 'I discovered'

  return `${action} ${character.name} \u2014 ${character.fullTitle} from Archive Zero on FanVerse Archive.`
}
