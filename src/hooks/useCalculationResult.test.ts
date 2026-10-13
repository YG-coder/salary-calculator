import { createElement, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { useCalculationResult } from './useCalculationResult'

type Inputs = {
  salary: string
  family: number
  attendance: boolean | null
}
type Result = { monthlyNet: number }
type State = ReturnType<typeof useCalculationResult<Result, Inputs>>
type Stage = { input: Inputs; check: (state: State) => void }

const BASE: Inputs = { salary: '40,000,000', family: 1, attendance: null }
const RESULT: Result = { monthlyNet: 2_893_713 }

/** Exercise real React hook state across render-phase updates, without a DOM dependency. */
function runStages(stages: Stage[]) {
  let visited = 0
  function Scenario() {
    const [step, setStep] = useState(0)
    const state = useCalculationResult<Result, Inputs>(stages[step].input)
    stages[step].check(state)
    visited++
    if (step + 1 < stages.length) setStep(step + 1)
    return null
  }
  renderToString(createElement(Scenario))
  expect(visited).toBe(stages.length)
}

describe('useCalculationResult', () => {
  it('starts without a result or a stale-input notice', () => {
    runStages([{ input: BASE, check: (state) => {
      expect(state.result).toBeNull()
      expect(state.submittedInput).toBeNull()
      expect(state.isStale).toBe(false)
    } }])
  })

  it('keeps the result across rerenders with equivalent form values', () => {
    runStages([
      { input: BASE, check: (state) => state.setResult(RESULT) },
      { input: { ...BASE }, check: (state) => {
        expect(state.result).toEqual(RESULT)
        expect(state.submittedInput).toEqual(BASE)
        expect(state.isStale).toBe(false)
      } },
    ])
  })

  it.each<Partial<Inputs>>([
    { salary: '50,000,000' },
    { salary: '' },
    { family: 2 },
    { attendance: true },
    { attendance: false },
  ])('hides a result immediately when a form value changes: %j', (change) => {
    runStages([
      { input: BASE, check: (state) => state.setResult(RESULT) },
      { input: { ...BASE, ...change }, check: (state) => {
        expect(state.result).toBeNull()
        expect(state.isStale).toBe(true)
        expect(state.submittedInput).toEqual(BASE)
      } },
    ])
  })

  it('recalculates using the new inputs and clears the notice', () => {
    const changed = { ...BASE, salary: '50,000,000' }
    const newResult = { monthlyNet: 3_500_000 }
    runStages([
      { input: BASE, check: (state) => state.setResult(RESULT) },
      { input: changed, check: (state) => state.setResult(newResult) },
      { input: changed, check: (state) => {
        expect(state.result).toEqual(newResult)
        expect(state.submittedInput).toEqual(changed)
        expect(state.isStale).toBe(false)
      } },
    ])
  })

  it('can show the previous result again only when its exact inputs are restored', () => {
    runStages([
      { input: BASE, check: (state) => state.setResult(RESULT) },
      { input: { ...BASE, family: 2 }, check: (state) => expect(state.result).toBeNull() },
      { input: BASE, check: (state) => {
        expect(state.result).toEqual(RESULT)
        expect(state.isStale).toBe(false)
      } },
    ])
  })

  it('reset removes both the stored result and its input snapshot', () => {
    runStages([
      { input: BASE, check: (state) => state.setResult(RESULT) },
      { input: { ...BASE, salary: '' }, check: (state) => state.setResult(null) },
      { input: BASE, check: (state) => {
        expect(state.result).toBeNull()
        expect(state.submittedInput).toBeNull()
        expect(state.isStale).toBe(false)
      } },
    ])
  })

  it('copies the input snapshot rather than retaining a mutable input object', () => {
    const mutable = { ...BASE }
    runStages([
      { input: mutable, check: (state) => {
        state.setResult(RESULT)
        mutable.salary = '50,000,000'
      } },
      { input: mutable, check: (state) => {
        expect(state.submittedInput).toEqual(BASE)
        expect(state.result).toBeNull()
        expect(state.isStale).toBe(true)
      } },
    ])
  })
})
