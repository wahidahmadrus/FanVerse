export const activityStarValues = {
  'Personal Memory': 5,
  'Social Support': 8,
  Streaming: 10,
  Voting: 12,
  'Fan Art': 15,
  Merch: 15,
  'Fan Event': 20,
  Concert: 30,
  'Fan Meet': 35,
  'Special Moment': 25,
}

export const calculateBaseStars = (activityType) =>
  activityStarValues[activityType] || activityStarValues['Personal Memory']

export const calculateMemoryReward = ({ activityType, hasProof }) => {
  const baseStars = calculateBaseStars(activityType)
  const finalStars = hasProof ? baseStars * 2 : baseStars

  return {
    baseStars,
    finalStars,
    proofMultiplier: hasProof ? 2 : 1,
  }
}

export const getProofRewardPreview = (activityType) => {
  const baseStars = calculateBaseStars(activityType)

  return {
    baseStars,
    proofStars: baseStars * 2,
  }
}
