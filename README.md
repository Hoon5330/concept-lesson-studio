# Concept Studio - 개념 기반 교수학습 설계 스튜디오

성취기준에서 출발하여 개념적 렌즈, 일반화, GRASPS 수행과제, 4수준 루브릭,
탐구 7단계, AI·디지털 기능과 플랜 B를 설계하는 교원 연수 웹앱입니다.

3인 모둠이 WHERETO로 서로의 설계안을 평가하고, 최고 평균점을 받은
모둠 대표안을 한 장 발표 화면으로 공유합니다.

## 주요 기능

1. 기존 교수학습설계안의 기본 정보 입력과 학습 목표 재설계
2. 12가지 개념적 렌즈 직접 선택
3. 일반화와 사실적·개념적·논쟁적 질문 작성
4. GRASPS 수행과제와 4수준 분석적 루브릭 작성
5. 개념 기반 탐구 7단계와 0~2점 WHERETO 자기점검
6. 3인 모둠 WHERETO 동료평가와 대표안 자동 계산
7. 모둠원 제출 대기 중 AI·디지털 기능 매칭 작성
8. 모둠 대표안 한 장 발표 화면
9. 6개 대표안 확정 후 실시간 경매 현황 게시판 자동 개방
10. 관리자 전용 낙찰 모둠·토큰 입력과 참여자 조회 전용 실시간 반영
11. 자기 모둠 발표안 점수와 낙찰 점수를 합산한 모둠별 순위
12. AI·디지털 기능 3개, 도구 예시, 활용 계획, 아날로그 플랜 B
13. 패들렛 공유 및 A4 최종 설계안 PDF 저장

각 설계 단계 상단에는 개념·일반화·전이, 개념적 렌즈, 세 종류의
안내질문, GRASPS, WHERETO, 탐구 7단계의 핵심 개념 안내가 표시됩니다.

## Firebase 연결

### 1. Authentication

Firebase Console의 `Authentication → 로그인 방법`에서 다음을 활성화합니다.

- 익명
- 이메일/비밀번호

강사용 이메일/비밀번호 계정도 하나 생성합니다.

### 2. Firestore

Firestore Database를 생성하고 이 프로젝트의 `firestore.rules` 전체 내용을
규칙 화면에 붙여넣어 게시합니다.

`firestore.rules`와 `public/firebase-config.js`의
`teacher@example.com`을 실제 강사 이메일로 똑같이 변경합니다.

### 3. 웹 앱 설정값

Firebase 프로젝트 설정에서 웹 앱을 등록한 뒤
`public/firebase-config.js`의 빈 값을 채웁니다.

```js
firebase: {
  apiKey: "...",
  authDomain: "...firebaseapp.com",
  projectId: "...",
  storageBucket: "...firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
},
sessionId: "concept-workshop-2026"
```

`sessionId`는 참여자가 직접 입력하지 않는 내부 연수 구분값입니다. 같은
Firebase 프로젝트에서 다른 기수의 데이터를 분리할 때 이 값만 바꿉니다.
패들렛 주소가 준비되면 `padletUrl`에도 입력합니다.

## GitHub와 Vercel

1. 이 프로젝트 폴더 전체를 새 GitHub 저장소에 업로드합니다.
2. Vercel에서 `Add New → Project`를 눌러 해당 저장소를 연결합니다.
3. Framework Preset은 Next.js로 자동 인식됩니다.
4. 별도의 Build Command나 Output Directory를 입력하지 않고 배포합니다.
5. Vercel 주소를 Firebase Authentication의 승인된 도메인에 추가합니다.

## Firestore 컬렉션

- `conceptParticipants`: 참여자·모둠 정보
- `conceptDesigns`: 개인 교수학습 설계안
- `conceptReviews`: WHERETO 동료평가
- `conceptRepresentatives`: 모둠별 대표 교수학습설계안
- `conceptAuctionResults`: 관리자 입력 낙찰 결과와 자동 계산 점수
- `conceptControls`: 강사의 동료평가 진행 상태

## 데모 모드

Firebase 설정값이 비어 있으면 현재 브라우저에만 저장되는 데모 모드로
실행됩니다. 데모 강사 비밀번호는 `1234`이며
`public/firebase-config.js`에서 변경할 수 있습니다.

실제 모둠 공동 작업과 강사 관제실 실시간 확인에는 Firebase 연결이 필요합니다.

## PDF 저장

최종 설계안 화면에서 `PDF로 저장`을 누른 뒤 브라우저 인쇄 창에서
대상을 `PDF로 저장`, 용지를 `A4`, 방향을 `세로`로 선택합니다.
