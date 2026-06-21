import type { Transition, Variants } from 'framer-motion'

/** Signature expo-out easing from the Linear/Modern system. */
export const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const durations = {
  quick: 0.2,
  base: 0.3,
  entrance: 0.6,
} as const

export const expoTransition: Transition = {
  duration: durations.base,
  ease: EASE_EXPO,
}

/** Fade up + in — the default entrance. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.entrance, ease: EASE_EXPO },
  },
}

/** Subtle scale + fade — for cards and surfaces. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: durations.entrance, ease: EASE_EXPO },
  },
}

/** Parent that staggers children entrances by 80ms. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}
