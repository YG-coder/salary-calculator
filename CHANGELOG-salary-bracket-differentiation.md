# 연봉별 실수령액 페이지 구간 차별화 패치 (2026-08, rev3 · 배포 승인본)

## 목적
/salary/[amount] 27개 페이지의 근접중복(doorway) 신호를 줄이기 위해, 인위적
연봉 구간 없이 각 연봉의 실제 계산 숫자 + 엔진 임계점 이벤트로 차별화한다.
sitemap 복귀는 이 패치에 포함하지 않음(HTML 대조로 근접중복 감소 확인 후 별도).

## rev2에서 반영된 리뷰 (4)
1. approx 제거: taxBracketChange 이벤트 및 근사 과세표준 계산 전부 삭제.
   엔진이 실제 계산한 사실(상한·고소득 산식)만 노출. "근사" 표기 없음.
2. 엔진/표시 모델 분리: SalaryResult에서 표시용 monthlyTaxable 제거.
   flags(pensionCapped, usedHighIncomeTaxFormula)만 유지. 월 과세소득은
   salaryPageData에서 재계산.
3. 증분 하드코딩 제거: "한 단계 오르면"의 500만원을 amountMan-prevAmountMan
   으로 계산(prevStepMan). 스텝 값이 바뀌어도 안전.
4. Q&A 형태: 이벤트/기본 섹션을 질문 → 원인 → 이 연봉의 숫자 순서로 재구성.


## rev3 문구 수정 (배포 전 최종)
5. 국민연금 이벤트 detail: 반사실("상한 없었다면 ... 덜 냅니다") 제거.
   "요율 전체 적용액 vs 실제 상한 본인부담액 vs 두 금액의 차이"만 진술.
   (요율은 RATES.nationalPension에서 도출. 내부 변수 monthlySaving→monthlyDifference)
6. 기본 섹션 한계 실수령률: "연봉 높아질수록 낮아지는 경향" 일반화 제거.
   실제로 국민연금 상한 진입 시 한계 실수령률이 상승하는 구간이 있어 단조 감소가
   성립하지 않음(예: 7,500만원 66.3% → 8,000만원 71.1%). "구간·공제 구조에 따라
   달라진다"로 정정.

## 변경 파일 (4)
1. src/lib/incomeTax.ts       — HIGH_INCOME_MONTHLY_THRESHOLD + isHighIncomeMonthly() 추출·export
2. src/lib/salary.ts          — SalaryResult에 flags 추가(monthlyTaxable는 미포함)
3. src/lib/salaryPageData.ts  — buildSalaryPageData(): 기본지표 + exact 이벤트(Q&A)
4. src/app/salary/[amount]/page.tsx — 모듈 소비, 보일러플레이트 제거, Q&A 렌더

## 검증
- npx tsc --noEmit : 통과
- npm run build : 통과, /salary/[amount] 27개 정적 생성
- HTML 대조: 3000(이벤트 없음)/8000(상한 진입)/12500(상한+고소득 진입) 등에서
  Q&A·숫자가 페이지별로 상이함을 생성 HTML로 확인

## 알려진 한계 / 후속
- 2000~7500 구간은 엔진 임계점이 없어 이벤트가 없다. 숫자 기반 기본 섹션 +
  FAQ로만 차별화된다(문장 템플릿 동일, 숫자 상이). 저연봉 구간 exact 신호는 추후 검토.
- sitemap.ts 미변경.
- 다음 작업: 목표 실수령액 역산 계산기.
