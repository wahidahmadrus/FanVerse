import { shareText } from '../utils/shareUtils.js'

export const shareAchievement = async ({ title, text, url }) =>
  shareText({ title, text, url })
