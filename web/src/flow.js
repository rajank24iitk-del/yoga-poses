export const HOLD_MS = 4000
export const TRANSITION_MS = 2000

export function startFlow(length) {
  return {
    index: 0,
    holdMs: 0,
    phase: 'pose',
    transitionMs: 0,
    done: false,
    length,
  }
}

export function stepFlow(state, matched, dt) {
  if (state.done || state.phase === 'done') return state

  if (state.phase === 'transition') {
    const transitionMs = state.transitionMs + dt
    if (transitionMs < TRANSITION_MS) {
      return { ...state, transitionMs }
    }
    const index = state.index + 1
    if (index >= state.length) {
      return {
        ...state,
        index: state.length,
        holdMs: 0,
        transitionMs: 0,
        phase: 'done',
        done: true,
      }
    }
    return {
      ...state,
      index,
      holdMs: 0,
      transitionMs: 0,
      phase: 'pose',
    }
  }

  const holdMs = matched ? state.holdMs + dt : 0
  if (holdMs >= HOLD_MS) {
    return { ...state, holdMs: HOLD_MS, phase: 'transition', transitionMs: 0 }
  }
  return { ...state, holdMs, phase: 'pose' }
}

export function stepHold(holdMs, matched, dt) {
  if (!matched) return 0
  return Math.min(holdMs + dt, HOLD_MS)
}
