export const USERNAME_COOLDOWN_DAYS = 14

export interface CooldownState {
  active: boolean
  daysRemaining: number
  availableAt: Date | null
}

export function usernameCooldown(
  lastChangedAt: string | null | undefined,
  createdAt: string | null | undefined,
  now: Date = new Date(),
): CooldownState {
  const anchor = lastChangedAt ?? createdAt ?? null
  if (!anchor) return { active: false, daysRemaining: 0, availableAt: null }
  const changed = new Date(anchor)
  if (Number.isNaN(changed.getTime())) return { active: false, daysRemaining: 0, availableAt: null }
  const availableAt = new Date(changed.getTime() + USERNAME_COOLDOWN_DAYS * 86400000)
  const active = availableAt.getTime() > now.getTime()
  const daysRemaining = active ? Math.ceil((availableAt.getTime() - now.getTime()) / 86400000) : 0
  return { active, daysRemaining, availableAt }
}
