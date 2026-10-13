'use client'

import { useCallback, useState } from 'react'

type InputValues = Readonly<Record<string, string | number | boolean | null>>

interface Calculation<Result, Input> {
  result: Result
  input: Input
  inputKey: string
}

/**
 * Store a result with the exact form values used to calculate it.
 * Changed inputs hide the result immediately, without waiting for an effect.
 * Returning to the same inputs can safely show the matching result again.
 * Inputs must be a flat object of finite, JSON-serializable form values.
 */
export function useCalculationResult<Result, Input extends InputValues>(inputs: Input) {
  const inputKey = JSON.stringify(inputs)
  const [calculation, setCalculation] = useState<Calculation<Result, Input> | null>(null)

  const setResult = useCallback((result: Result | null) => {
    setCalculation(result === null ? null : {
      result,
      input: JSON.parse(inputKey) as Input,
      inputKey,
    })
  }, [inputKey])

  const isStale = calculation !== null && calculation.inputKey !== inputKey

  return {
    result: isStale ? null : calculation?.result ?? null,
    submittedInput: calculation?.input ?? null,
    isStale,
    setResult,
  }
}
