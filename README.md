# 연봉계산기

대한민국 근로자의 급여와 노동 관련 금액을 계산하는 Next.js 기반 웹 서비스입니다.

- 서비스: [연봉계산기.kr](https://연봉계산기.kr)
- 저장소: [YG-coder/salary-calculator](https://github.com/YG-coder/salary-calculator)

## 주요 기능

- 연봉 실수령액 계산
- 목표 실수령액 기준 필요 연봉 역산
- 급여 세금 계산
- 4대보험 계산
- 퇴직금 계산
- 연차수당 계산
- 실업급여 계산
- 주휴수당 계산

계산 결과는 참고용이며 실제 급여, 세금과 보험료는 회사 정책 및 개인별 조건에 따라 달라질 수 있습니다.

## 기술 구성

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- ESLint
- Vercel

## 로컬 실행

Node.js와 npm이 필요합니다.

```bash
npm install
npm run dev
```

개발 서버를 실행한 뒤 [http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 검증 명령

```bash
npm run typecheck
npm run lint
npm run build
```

OG 이미지를 다시 생성해야 할 때는 다음 명령을 사용합니다.

```bash
npm run gen:og
```

## 프로젝트 구조

```text
src/app/          페이지와 라우트
src/components/   공통 UI 및 계산기 컴포넌트
src/lib/          계산 엔진, 상수, 공통 함수
public/           정적 파일
scripts/          유지보수 스크립트
docs/             개선 계획과 변경 이력
```

## 문서

- [연봉계산기 개선 계획](docs/연봉계산기-개선계획.md)
- [연차수당 계산 정책](docs/annual-leave-policy.md)
- [목표 연봉 역산 계산기 변경 이력](docs/CHANGELOG-reverse-salary-calculator.md)
- [연봉 구간별 페이지 변경 이력](docs/CHANGELOG-salary-bracket-differentiation.md)

## 개발 원칙

- 계산 기준은 공식 법령과 관계 기관 자료를 우선한다.
- 불확실한 기준은 추정하여 계산식에 반영하지 않는다.
- 공통 세금·보험 계산은 하나의 계산 엔진에서 관리한다.
- 변경 후 타입 검사, 린트와 프로덕션 빌드를 확인한다.
- 계산 로직 변경과 콘텐츠·검색 정책 변경을 가능한 한 분리한다.

## 배포

프로덕션 배포는 GitHub 저장소와 연결된 Vercel을 통해 진행합니다. 변경 사항은 별도 브랜치에서 검증한 뒤 검토를 거쳐 기본 브랜치에 병합하는 방식을 권장합니다.
