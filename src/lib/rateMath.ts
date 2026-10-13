const ZERO = BigInt(0)
const ONE = BigInt(1)
const TEN = BigInt(10)

/** 퍼센트 입력의 소수점을 두 자리 옮긴다. 0.7/100의 이진 오차를 만들지 않는다. */
export function percentageToRate(percent: number): number {
  if (!Number.isFinite(percent)) return percent / 100
  const [coefficient, exponent = '0'] = String(percent).split('e')
  return Number(`${coefficient}e${Number(exponent) - 2}`)
}

/** 표시된 십진수 요율을 분수로 읽는다. 지수 표기와 소수 금액도 처리한다. */
function fraction(value: number): [bigint, bigint] {
  const [coefficient, exponent = '0'] = String(value).split('e')
  const decimalPlaces = (coefficient.split('.')[1]?.length ?? 0) - Number(exponent)
  const numerator = BigInt(coefficient.replace('.', ''))
  return decimalPlaces >= 0
    ? [numerator, TEN ** BigInt(decimalPlaces)]
    : [numerator * TEN ** BigInt(-decimalPlaces), ONE]
}

function gcd(a: bigint, b: bigint): bigint {
  a = a < ZERO ? -a : a
  while (b !== ZERO) [a, b] = [b, a % b]
  return a
}

/** 요율/분모 요율을 정확한 분수로 준비하고, 원 단위 금액에 적용해 10원 미만을 버린다. */
export function createFloor10Rate(rate: number, divisorRate = 1): (amount: number) => number {
  if (!Number.isFinite(rate) || !Number.isFinite(divisorRate) || divisorRate <= 0) {
    throw new RangeError('유한한 요율과 양수 분모 요율이 필요합니다.')
  }
  const [rateNumerator, rateDenominator] = fraction(rate)
  const [divisorNumerator, divisorDenominator] = fraction(divisorRate)
  const numerator = rateNumerator * divisorDenominator
  const denominator = rateDenominator * divisorNumerator * TEN
  const common = gcd(numerator, denominator)
  const n = numerator / common
  const d = denominator / common
  const numberN = Number(n)
  const numberD = Number(d)
  const safeRatio = Number.isSafeInteger(numberN) && Number.isSafeInteger(numberD)

  return amount => {
    const product = amount * numberN
    // 일반 입력은 안전한 정수 Number 연산으로 처리해 역산 속도를 유지한다.
    if (safeRatio && Number.isSafeInteger(amount) && Number.isSafeInteger(product)) {
      return Math.floor(product / numberD) * 10
    }
    if (!Number.isFinite(amount)) return Math.floor(amount * rate / divisorRate / 10) * 10
    const [amountNumerator, amountDenominator] = fraction(amount)
    const fullNumerator = amountNumerator * n
    const fullDenominator = amountDenominator * d
    const quotient = fullNumerator / fullDenominator
    const floor = quotient - (fullNumerator < ZERO && fullNumerator % fullDenominator !== ZERO ? ONE : ZERO)
    return Number(floor) * 10
  }
}

/** 사용자 입력 요율용. 고정 요율은 createFloor10Rate로 한 번 준비해 재사용한다. */
export function applyRateFloor10(amount: number, rate: number): number {
  // 기존 공개 계산 함수의 비정상 요율 처리 계약을 유지한다.
  if (!Number.isFinite(rate)) return Math.floor(amount * rate / 10) * 10
  return createFloor10Rate(rate)(amount)
}
