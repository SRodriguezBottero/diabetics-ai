import prisma from './prisma'

export const FREE_TIER_LIMITS = {
  chatMessages: 10,
  insights: 5,
  mealsClassified: 3,
}

export const PREMIUM_PRICE = 9.99

export type SubscriptionStatus = 'free' | 'active' | 'canceled' | 'past_due'

export interface UsageInfo {
  chatMessagesUsed: number
  chatMessagesLimit: number
  insightsUsed: number
  insightsLimit: number
  mealsClassifiedUsed: number
  mealsClassifiedLimit: number
  isPremium: boolean
  subscriptionStatus: SubscriptionStatus
  currentPeriodEnd: Date | null
}

export async function getUserUsage(userId: string): Promise<UsageInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      currentPeriodEnd: true,
      chatMessagesUsed: true,
      insightsUsed: true,
      mealsClassifiedUsed: true,
      usageResetDate: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const isPremium = user.subscriptionStatus === 'active'

  return {
    chatMessagesUsed: user.chatMessagesUsed,
    chatMessagesLimit: isPremium ? Infinity : FREE_TIER_LIMITS.chatMessages,
    insightsUsed: user.insightsUsed,
    insightsLimit: isPremium ? Infinity : FREE_TIER_LIMITS.insights,
    mealsClassifiedUsed: user.mealsClassifiedUsed,
    mealsClassifiedLimit: isPremium ? Infinity : FREE_TIER_LIMITS.mealsClassified,
    isPremium,
    subscriptionStatus: (user.subscriptionStatus as SubscriptionStatus) || 'free',
    currentPeriodEnd: user.currentPeriodEnd,
  }
}

export async function checkAndResetUsage(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { usageResetDate: true },
  })

  if (!user) return

  const now = new Date()
  const resetDate = new Date(user.usageResetDate)
  
  const isNewMonth = 
    now.getMonth() !== resetDate.getMonth() ||
    now.getFullYear() !== resetDate.getFullYear()

  if (isNewMonth) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        chatMessagesUsed: 0,
        insightsUsed: 0,
        mealsClassifiedUsed: 0,
        usageResetDate: now,
      },
    })
  }
}

export type UsageType = 'chat' | 'insights' | 'meals'

export interface UsageCheckResult {
  allowed: boolean
  remaining: number
  limit: number
  used: number
  isPremium: boolean
}

export async function checkUsageLimit(
  userId: string,
  usageType: UsageType
): Promise<UsageCheckResult> {
  await checkAndResetUsage(userId)
  
  const usage = await getUserUsage(userId)

  const usageMap: Record<UsageType, { used: number; limit: number }> = {
    chat: { used: usage.chatMessagesUsed, limit: usage.chatMessagesLimit },
    insights: { used: usage.insightsUsed, limit: usage.insightsLimit },
    meals: { used: usage.mealsClassifiedUsed, limit: usage.mealsClassifiedLimit },
  }

  const { used, limit } = usageMap[usageType]
  const remaining = Math.max(0, limit - used)

  return {
    allowed: used < limit,
    remaining,
    limit,
    used,
    isPremium: usage.isPremium,
  }
}

export async function incrementUsage(
  userId: string,
  usageType: UsageType
): Promise<void> {
  const fieldMap: Record<UsageType, string> = {
    chat: 'chatMessagesUsed',
    insights: 'insightsUsed',
    meals: 'mealsClassifiedUsed',
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      [fieldMap[usageType]]: { increment: 1 },
    },
  })
}

export function getUpgradeMessage(usageType: UsageType): string {
  const messages: Record<UsageType, string> = {
    chat: 'Has alcanzado tu límite mensual de mensajes del chatbot. Actualiza a Premium para mensajes ilimitados.',
    insights: 'Has alcanzado tu límite mensual de análisis AI. Actualiza a Premium para análisis ilimitados.',
    meals: 'Has alcanzado tu límite mensual de clasificaciones de comida. Actualiza a Premium para clasificaciones ilimitadas.',
  }
  return messages[usageType]
}
