import { useEffect, useMemo, useState } from 'react'
import FirstCardOnboarding from '../../components/FirstCardOnboarding/FirstCardOnboarding.jsx'
import { useAuth } from '../../context/useAuth.js'
import { getArchiveCharacterById } from '../../data/archiveCharacters.js'
import {
  chooseFirstArchiveCharacter,
  getFirstArchiveCharacterId,
} from '../../services/characterCardService.js'
import { getUserCollectibleCards } from '../../services/collectibleService.js'

function FirstCardOnboardingPage() {
  const { profile, refreshProfile, user } = useAuth()
  const [selectedCharacterId, setSelectedCharacterId] = useState(() =>
    getFirstArchiveCharacterId({ profile, userId: user?.id }),
  )
  const [savingCharacterId, setSavingCharacterId] = useState('')
  const [characterCards, setCharacterCards] = useState([])
  const [message, setMessage] = useState(
    selectedCharacterId ? 'Your first Archive Zero card has been unlocked.' : '',
  )
  const [error, setError] = useState('')

  const selectedCharacter = useMemo(
    () => getArchiveCharacterById(selectedCharacterId),
    [selectedCharacterId],
  )

  useEffect(() => {
    let cancelled = false

    const loadCharacterCards = async () => {
      if (!user?.id) {
        return
      }

      try {
        const nextCards = await getUserCollectibleCards(user.id)

        if (!cancelled) {
          setCharacterCards(nextCards)
        }
      } catch {
        if (!cancelled) {
          setCharacterCards([])
        }
      }
    }

    loadCharacterCards()

    return () => {
      cancelled = true
    }
  }, [user])

  const handleChoose = async (character) => {
    if (!user?.id || selectedCharacterId) {
      return
    }

    try {
      setError('')
      setMessage('')
      setSavingCharacterId(character.id)
      await chooseFirstArchiveCharacter({
        characterId: character.id,
        userId: user.id,
      })
      setSelectedCharacterId(character.id)
      await refreshProfile(user.id)
      setMessage('Your first Archive Zero card has been unlocked.')
    } catch (chooseError) {
      setError(chooseError.message)
    } finally {
      setSavingCharacterId('')
    }
  }

  return (
    <div className="page-shell">
      <FirstCardOnboarding
        characterCards={characterCards}
        error={error}
        message={message}
        onChoose={handleChoose}
        savingCharacterId={savingCharacterId}
        selectedCharacter={selectedCharacter}
      />
    </div>
  )
}

export default FirstCardOnboardingPage
