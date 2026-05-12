import Button from '../Button/Button.jsx'
import CharacterCard from '../CharacterCard/CharacterCard.jsx'
import FormMessage from '../FormMessage/FormMessage.jsx'
import { archiveCharacters } from '../../data/archiveCharacters.js'
import { getCharacterCardImageUrl } from '../../services/characterCardService.js'
import './FirstCardOnboarding.css'

function FirstCardOnboarding({
  characterCards = [],
  error,
  message,
  onChoose,
  savingCharacterId,
  selectedCharacter,
}) {
  return (
    <section className="first-card-onboarding">
      <div className="first-card-onboarding__intro">
        <p className="section-kicker">Archive Zero</p>
        <h1>Choose Your First Archive Card</h1>
        <p>
          Every fan journey begins with a feeling. Choose the character that
          speaks to you.
        </p>
      </div>

      <FormMessage type="success">{message}</FormMessage>
      <FormMessage type="error">{error}</FormMessage>

      <div className="first-card-onboarding__grid">
        {archiveCharacters.map((character) => (
          <CharacterCard
            actionLabel={
              selectedCharacter?.id === character.id ? 'Card Chosen' : 'Choose Card'
            }
            character={character}
            disabled={Boolean(savingCharacterId) || Boolean(selectedCharacter)}
            imageUrl={getCharacterCardImageUrl({
              cards: characterCards,
              character,
            })}
            isSelected={selectedCharacter?.id === character.id}
            isUnlocked={selectedCharacter?.id === character.id}
            key={character.id}
            onAction={onChoose}
          />
        ))}
      </div>

      {selectedCharacter && (
        <div className="first-card-onboarding__success glass-panel">
          <strong>Your first Archive Zero card has been unlocked.</strong>
          <p>
            {selectedCharacter.name} now marks the beginning of your story
            collection.
          </p>
          <div className="actions">
            <Button to={`/collectibles/characters/${selectedCharacter.id}`} variant="secondary">
              Read Story
            </Button>
            <Button to="/dashboard">Enter FanVerse</Button>
          </div>
        </div>
      )}
    </section>
  )
}

export default FirstCardOnboarding
