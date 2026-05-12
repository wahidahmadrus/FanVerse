export const shareAchievement = async ({ title, text }) => {
  if (navigator.share) {
    await navigator.share({ title, text })
    return 'Ready to share.'
  }

  await navigator.clipboard.writeText(text)
  return 'Copied. Ready to share!'
}
