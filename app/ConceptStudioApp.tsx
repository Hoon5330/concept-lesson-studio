"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createDataStore, type DataStore, type PlainRecord } from "@/lib/data-store";
import { PROMPTS, type PromptKey } from "@/lib/prompts";

type View = "home" | "design" | "team" | "showcase" | "auction" | "report" | "admin";

type Profile = {
  name: string;
  subject: string;
  teamName: string;
  memberNames: string;
  sessionCode: string;
};

type RubricRow = {
  criterion: string;
  level4: string;
  level3: string;
  level2: string;
  level1: string;
};

type InquiryStage = {
  key: string;
  title: string;
  purpose: string;
  activity: string;
  strategy: string;
};

type WheretoSelfCheck = {
  score: number;
  evidence: string;
};

type ToolPlan = {
  feature: string;
  reason: string;
  examples: string;
  plan: string;
  planB: string;
};

type Draft = {
  ownerId: string;
  currentStep: number;
  completed: boolean;
  profile: Profile;
  goal: {
    grade: string;
    unit: string;
    standard: string;
    currentGoal: string;
    diagnosis: string;
    diagnosisReason: string;
    revisedGoalA: string;
    revisedGoalB: string;
    selectedGoal: string;
    transferCheck: string;
  };
  lens: {
    candidates: string;
    selected: string;
    reason: string;
    scopeCheck: string;
  };
  concept: {
    related: string;
    generalization1: string;
    generalization2: string;
    factual: string;
    conceptual: string;
    debatable: string;
    contribution: string;
  };
  grasps: {
    goal: string;
    role: string;
    audience: string;
    situation: string;
    product: string;
    standards: string;
    scenario: string;
    rubric: RubricRow[];
  };
  inquiry: {
    stages: InquiryStage[];
    whereto: Record<string, WheretoSelfCheck>;
    submittedAt: string;
  };
  tools: {
    selectedFeatures: string[];
    plans: ToolPlan[];
    titleDirect: string;
    titleConcept: string;
    titleEmotion: string;
    finalTitle: string;
  };
  final: {
    purchasedIdea: string;
    purchaseSource: string;
    revision: string;
    alignmentCheck: string;
    padletReady: boolean;
  };
  updatedAt: string;
};

type AppRecord = PlainRecord & { id: string };

type AuctionDraft = {
  buyerTeam: string;
  tokens: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const LENSES = [
  "변화", "관계", "체계", "상호의존", "갈등", "권력",
  "관점", "인과", "구조와 기능", "의사소통", "정체성", "지속가능성",
];

const TOOL_FEATURES = [
  "모든 학생의 의견 수집", "개념 간 관계 시각화", "공동 편집과 상호 피드백",
  "사고 과정 기록", "실시간 형성평가", "오답 유형 분석",
  "맞춤형 자료 제공", "재도전과 수정", "실제 청중과 공유",
  "토론과 근거 강화", "멀티미디어 표현", "학습 결과 시각화",
];

const WHERETO = [
  ["W", "Where·Why", "방향·이유", "학생이 목표와 배우는 이유를 아는가?"],
  ["H", "Hook", "흥미·몰입", "도입이 호기심을 일으키고 몰입을 유지하는가?"],
  ["E1", "Explore·Enable·Equip", "탐구·준비", "탐구에 필요한 지식과 기능을 갖추는가?"],
  ["R", "Rethink·Reflect", "재고·성찰", "다시 생각하고 수정·성찰할 기회가 있는가?"],
  ["E2", "Exhibit·Evaluate", "표현·평가", "배움을 드러내고 스스로 평가하는가?"],
  ["T", "Tailor", "개별화·맞춤", "학생의 수준과 특성에 따라 경로가 조정되는가?"],
  ["O", "Organize", "조직·배열", "활동이 이해와 전이를 향해 조직되는가?"],
];

const STEP_META = [
  ["01", "학습 목표 진단 및 재설계", "교육과정 범위 안에서 전이형 목표 만들기"],
  ["02", "개념적 렌즈 선택", "12가지 렌즈 중 수업을 관통할 초점 선택"],
  ["03", "일반화와 안내 질문", "전이 가능한 이해와 3종 질문 도출"],
  ["04", "GRASPS와 4수준 루브릭", "목표와 평가 증거를 한 줄로 정렬"],
  ["05", "탐구 7단계와 WHERETO", "개인 설계 후 3인 모둠 동료평가"],
  ["06", "AI·디지털 기능 매칭", "핵심 기능 3개·플랜 B·제목 도출"],
  ["07", "최종 설계안 완성", "완성된 설계안을 확인하고 PDF 결과 만들기"],
];

const INQUIRY_STAGES = [
  ["connect", "① 관계 맺기", "개념과 나, 타인, 세상을 연결하며 의미 만들기"],
  ["focus", "② 집중하기", "핵심 개념과 깊이 있는 질문을 탐색하기"],
  ["investigate", "③ 조사하기", "다양한 자료와 방법으로 정보를 수집하고 이해 넓히기"],
  ["organize", "④ 조직 및 정리하기", "수집한 정보를 분류·분석해 체계적으로 정리하기"],
  ["generalize", "⑤ 일반화하기", "핵심 개념을 도출하고 관계와 원리를 일반화하기"],
  ["transfer", "⑥ 전이하기", "배운 내용을 새로운 상황에 적용하고 실천하기"],
  ["reflect", "⑦ 성찰하기", "탐구의 전 과정을 돌아보고 배움을 내 것으로 만들기"],
];

const STEP_GUIDES = [
  {
    title: "개념 · 일반화 · 전이",
    summary: "기존 수업의 목표를 ‘무엇을 아는가’에서 ‘어디에 적용할 수 있는가’까지 확장할 때 사용하는 핵심 개념입니다.",
    items: [
      ["개념 (Concept)", "여러 대상이나 현상의 공통된 특성을 추출하여 형성된 보편적이고 추상적인 단어입니다."],
      ["일반화 (Generalization)", "둘 이상의 개념 간 유기적 관계를 현재 시제의 문장으로 진술한 전이 가능한 핵심 이해입니다."],
      ["전이 (Transfer)", "단원에서 도출한 일반화를 새로운 맥락, 다른 교과, 현실 세계의 자연·사회 현상에 확장·적용하는 과정입니다."],
    ],
  },
  {
    title: "개념적 렌즈 (Conceptual Lens)",
    summary: "단원의 파편화된 사실과 소재를 들여다보는 거시적 ‘생각의 초점’이자 관점 조직자입니다.",
    items: [
      ["역할", "단편적인 지식 암기에서 벗어나 깊이 있는 탐구와 전이 가능한 개념적 이해로 사고 수준을 끌어올립니다."],
      ["대표 예시", "변화, 관계, 체계, 상호의존, 갈등, 권력, 관점, 인과, 구조와 기능, 의사소통, 정체성, 지속가능성"],
    ],
  },
  {
    title: "세 종류의 안내 질문 (Guiding Questions)",
    summary: "사실에서 출발하여 개념 간 관계를 찾고, 관점과 근거를 검토하도록 질문의 깊이를 확장합니다.",
    items: [
      ["사실적 질문", "특정 상황에 고정되어 있고 답이 정해진 질문으로, 탐구의 기초 지식과 배경지식을 확인합니다."],
      ["개념적 질문", "사례를 넘어 전이되는 왜·어떻게의 질문으로, 개념 간 관계를 물어 일반화 도출을 직접 이끕니다."],
      ["논쟁적 질문", "정답이 하나로 정해지지 않고 관점과 가치 판단을 요구하여 근거 기반 토론과 다각적 사고를 이끕니다."],
    ],
  },
  {
    title: "GRASPS 수행과제 설계 도구",
    summary: "백워드 설계 2단계에서 학생이 개념적 이해에 도달했는지 확인할 실제적 수행과제를 구성하는 여섯 요소입니다.",
    items: [
      ["G · Goal", "학생이 해결해야 할 실제적 문제 및 도전 과제"],
      ["R · Role", "학생이 시나리오 속에서 맡게 되는 실제적 역할"],
      ["A · Audience", "학생의 산출물과 결과를 전달받을 실제 청중"],
      ["S · Situation", "수행이 이루어지는 실제적 맥락과 제약 조건"],
      ["P · Product", "학생이 창출할 수행 형태나 산출물"],
      ["S · Standards", "과제의 성공과 일반화 도달을 판단하며, 아래 평가 루브릭의 평가 준거가 되는 기준"],
    ],
  },
  {
    title: "개념기반 탐구 7단계와 WHERETO",
    summary: "사실에서 일반화를 구축해 전이까지 이끄는 학습 흐름을 설계하고, WHERETO로 빠진 경험이 없는지 점검합니다.",
    items: [
      ["① 관계 맺기", "사전지식을 활성화하고 개념과 나, 타인, 세상을 연결합니다."],
      ["② 집중하기", "개념적 렌즈와 핵심 개념 어휘를 도입하여 탐구 방향에 집중합니다."],
      ["③ 조사하기", "사례, 데이터, 실험을 통해 정보를 수집하고 이해를 넓힙니다."],
      ["④ 조직 및 정리하기", "정보를 분류·분석하여 패턴과 관계를 구조화합니다."],
      ["⑤ 일반화하기", "발견한 패턴으로부터 개념 간 관계를 도출하여 일반화 문장을 세웁니다."],
      ["⑥ 전이하기", "일반화를 새로운 상황, 실생활 문제, 다른 맥락에 적용합니다."],
      ["⑦ 성찰하기", "탐구 과정과 사고 변화를 돌아보고 배움을 내면화합니다."],
      ["WHERETO", "W 방향·이유 · H 흥미·몰입 · E 탐구·준비 · R 재고·성찰 · E 표현·평가 · T 개별화·맞춤 · O 조직·배열"],
    ],
  },
  {
    title: "AI·디지털 기능 매칭",
    summary: "도구 이름보다 수업에서 필요한 교육적 기능을 먼저 선택하고, 기기나 네트워크가 작동하지 않을 때의 플랜 B까지 설계합니다.",
    items: [
      ["교육적 기능", "탐구 단계와 학습 문제를 해결하기 위해 필요한 기능을 세 가지로 좁힙니다."],
      ["도구 매칭", "효과성·편의성·안전성을 기준으로 기능을 구현할 도구를 연결합니다."],
      ["플랜 B", "같은 학습 목적을 유지할 수 있는 아날로그 대체 활동을 준비합니다."],
    ],
  },
  {
    title: "최종 정렬과 수정",
    summary: "동료와 다른 모둠의 발표에서 얻은 아이디어를 내 맥락에 맞게 반영하고 전체 설계의 정합성을 마지막으로 확인합니다.",
    items: [
      ["정렬", "성취기준 → 일반화 → 수행과제 → 루브릭 → 탐구 활동 → 도구가 같은 이해와 전이를 향하는지 확인합니다."],
      ["수정", "좋은 아이디어를 그대로 복사하지 않고 내 학생과 수업 맥락에 맞게 다시 설계합니다."],
    ],
  },
];

const DEFAULT_RUBRIC: RubricRow[] = [
  { criterion: "개념적 이해", level4: "", level3: "", level2: "", level1: "" },
  { criterion: "탐구 근거", level4: "", level3: "", level2: "", level1: "" },
  { criterion: "전이 적용", level4: "", level3: "", level2: "", level1: "" },
  { criterion: "의사소통", level4: "", level3: "", level2: "", level1: "" },
];

function defaultDraft(): Draft {
  return {
    ownerId: "",
    currentStep: 0,
    completed: false,
    profile: {
      name: "", subject: "", teamName: "", memberNames: "", sessionCode: "",
    },
    goal: {
      grade: "", unit: "", standard: "", currentGoal: "", diagnosis: "",
      diagnosisReason: "", revisedGoalA: "", revisedGoalB: "", selectedGoal: "", transferCheck: "",
    },
    lens: { candidates: "", selected: "", reason: "", scopeCheck: "" },
    concept: {
      related: "", generalization1: "", generalization2: "", factual: "",
      conceptual: "", debatable: "", contribution: "",
    },
    grasps: {
      goal: "", role: "", audience: "", situation: "", product: "", standards: "", scenario: "",
      rubric: DEFAULT_RUBRIC,
    },
    inquiry: {
      stages: INQUIRY_STAGES.map(([key, title, purpose]) => ({ key, title, purpose, activity: "", strategy: "" })),
      whereto: Object.fromEntries(WHERETO.map(([key]) => [key, { score: -1, evidence: "" }])),
      submittedAt: "",
    },
    tools: {
      selectedFeatures: [], plans: [], titleDirect: "", titleConcept: "",
      titleEmotion: "", finalTitle: "",
    },
    final: { purchasedIdea: "", purchaseSource: "", revision: "", alignmentCheck: "", padletReady: false },
    updatedAt: new Date().toISOString(),
  };
}

function normalizeWhereto(value: unknown): Record<string, WheretoSelfCheck> {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(WHERETO.map(([key]) => {
    const current = source[key];
    if (current && typeof current === "object") {
      const item = current as Record<string, unknown>;
      const score = Number(item.score);
      return [key, {
        score: Number.isFinite(score) ? Math.max(-1, Math.min(2, score)) : -1,
        evidence: String(item.evidence || ""),
      }];
    }
    if (typeof current === "string" && current.trim()) {
      return [key, { score: 1, evidence: current }];
    }
    return [key, { score: -1, evidence: "" }];
  }));
}

function loadDraft() {
  if (typeof window === "undefined") return defaultDraft();
  try {
    const loaded = JSON.parse(
      localStorage.getItem("concept_studio_draft_v3") ||
      localStorage.getItem("concept_studio_draft_v2") ||
      "null",
    ) as Partial<Draft> | null;
    if (!loaded) return defaultDraft();
    const base = defaultDraft();
    const loadedInquiry = loaded.inquiry || base.inquiry;
    const loadedStages = Array.isArray(loadedInquiry.stages) ? loadedInquiry.stages : [];
    return {
      ...base,
      ...loaded,
      profile: { ...base.profile, ...(loaded.profile || {}) },
      goal: { ...base.goal, ...(loaded.goal || {}) },
      lens: { ...base.lens, ...(loaded.lens || {}) },
      concept: { ...base.concept, ...(loaded.concept || {}) },
      grasps: { ...base.grasps, ...(loaded.grasps || {}) },
      inquiry: {
        ...base.inquiry,
        ...loadedInquiry,
        stages: INQUIRY_STAGES.map(([key, title, purpose]) => {
          const existing = loadedStages.find((item) => item.key === key);
          return { key, title, purpose, activity: existing?.activity || "", strategy: existing?.strategy || "" };
        }),
        whereto: normalizeWhereto(loadedInquiry.whereto),
      },
      tools: { ...base.tools, ...(loaded.tools || {}) },
      final: { ...base.final, ...(loaded.final || {}) },
    };
  } catch {
    return defaultDraft();
  }
}

function recordString(record: AppRecord, key: string) {
  return String(record[key] ?? "");
}

function totalReviewScore(record: AppRecord) {
  const scores = (record.scores || {}) as Record<string, number>;
  return WHERETO.reduce((sum, [key]) => sum + Number(scores[key] || 0), 0);
}

function selfWheretoScore(design: AppRecord) {
  const inquiry = (design.inquiry || {}) as Record<string, unknown>;
  const whereto = (inquiry.whereto || {}) as Record<string, WheretoSelfCheck>;
  return WHERETO.reduce((sum, [key]) => sum + Math.max(0, Number(whereto[key]?.score || 0)), 0);
}

function representativeBaseScore(representative: AppRecord) {
  const stored = Number(representative.wheretoTotal);
  if (Number.isFinite(stored) && stored > 0) return stored;
  const peerTotal = Number(representative.peerScoreTotal);
  const selfTotal = Number(representative.selfWheretoScore);
  if (Number.isFinite(peerTotal) || Number.isFinite(selfTotal)) {
    return Math.max(0, peerTotal || 0) + Math.max(0, selfTotal || 0);
  }
  return Math.round(Math.max(0, Number(representative.wheretoAverage || 0)) * 2);
}

function safeId(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/(^-|-$)/g, "") || "team";
}

function hasInquirySubmission(design: AppRecord | undefined) {
  const inquiry = (design?.inquiry || {}) as Record<string, unknown>;
  return Boolean(inquiry.submittedAt);
}

function memberList(value: string) {
  return value.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean);
}

export default function ConceptStudioApp() {
  const [view, setView] = useState<View>("home");
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [step, setStep] = useState(0);
  const [store, setStore] = useState<DataStore | null>(null);
  const [ready, setReady] = useState(false);
  const [promptKey, setPromptKey] = useState<PromptKey | null>(null);
  const [toast, setToast] = useState("");
  const [teamRecords, setTeamRecords] = useState<AppRecord[]>([]);
  const [teamDesigns, setTeamDesigns] = useState<AppRecord[]>([]);
  const [reviews, setReviews] = useState<AppRecord[]>([]);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { scores: Record<string, number>; strength: string; improvement: string }>>({});
  const [representatives, setRepresentatives] = useState<AppRecord[]>([]);
  const [selectedRepresentativeId, setSelectedRepresentativeId] = useState("");
  const [auctionResults, setAuctionResults] = useState<AppRecord[]>([]);
  const [selectedAuctionId, setSelectedAuctionId] = useState("");
  const [auctionDraft, setAuctionDraft] = useState<AuctionDraft>({ buyerTeam: "", tokens: "" });
  const [controls, setControls] = useState<AppRecord | null>(null);
  const [teamReadyPopup, setTeamReadyPopup] = useState(false);
  const [readyNoticeKey, setReadyNoticeKey] = useState("");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminRecords, setAdminRecords] = useState<AppRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [expandedGuides, setExpandedGuides] = useState<Record<number, boolean>>({});
  const [presentationMode, setPresentationMode] = useState(false);
  const [rankChanges, setRankChanges] = useState<Record<string, number>>({});
  const [newAuctionResultIds, setNewAuctionResultIds] = useState<string[]>([]);
  const previousRanksRef = useRef<Record<string, number>>({});
  const previousAuctionIdsRef = useRef<Set<string>>(new Set());
  const auctionSnapshotReadyRef = useRef(false);

  const persistDraft = async (next: Draft) => {
    localStorage.setItem("concept_studio_draft_v3", JSON.stringify(next));
    if (store && next.ownerId && view !== "admin" && !adminLoggedIn) {
      await Promise.all([
        store.set("conceptParticipants", next.ownerId, {
          uid: next.ownerId,
          ...next.profile,
          updatedAt: next.updatedAt,
        }),
        store.set("conceptDesigns", next.ownerId, { ...next }),
      ]);
    }
  };

  useEffect(() => {
    // The first client render restores the device-local draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(loadDraft());
    createDataStore().then((created) => {
      setStore(created);
      setDraft((current) => ({
        ...current,
        ownerId: (current.ownerId || current.profile.name.trim()) ? created.uid() : "",
        profile: {
          ...current.profile,
          sessionCode: created.config.sessionId || "concept-workshop-2026",
        },
      }));
      try {
        const savedGuideState = JSON.parse(localStorage.getItem("concept_studio_guide_state_v1") || "{}");
        if (savedGuideState && typeof savedGuideState === "object") {
          setExpandedGuides(savedGuideState as Record<number, boolean>);
        }
      } catch {
        setExpandedGuides({});
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const statusTimer = window.setTimeout(() => setSaveState("saving"), 0);
    const timer = window.setTimeout(async () => {
      const next = { ...draft, currentStep: step, updatedAt: new Date().toISOString() };
      try {
        await persistDraft(next);
        setLastSavedAt(next.updatedAt);
        setSaveState("saved");
      } catch (error) {
        console.error("Autosave failed.", error);
        setSaveState("error");
      }
    }, 650);
    return () => {
      window.clearTimeout(statusTimer);
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, step, ready, store, view]);

  useEffect(() => {
    if (!store || !draft.profile.sessionCode) return;
    if (view === "team") refreshTeam();
    if (view === "showcase") refreshShowcase();
    if (view === "admin" && adminLoggedIn) refreshAdmin();
    const interval = window.setInterval(() => {
      if (view === "team") refreshTeam();
      if (view === "showcase") refreshShowcase();
      if (view === "admin" && adminLoggedIn) refreshAdmin();
    }, 7000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, store, adminLoggedIn, draft.profile.sessionCode, draft.profile.teamName]);

  useEffect(() => {
    if (!store || !draft.profile.sessionCode) return;
    const session = draft.profile.sessionCode;
    const unsubscribeRepresentatives = store.subscribe("conceptRepresentatives", (records) => {
      const filtered = records.filter((item) => recordString(item, "sessionCode") === session);
      setRepresentatives(filtered);
      setSelectedRepresentativeId((current) => current || filtered[0]?.id || "");
    });
    const unsubscribeAuction = store.subscribe("conceptAuctionResults", (records) => {
      setAuctionResults(records.filter((item) => recordString(item, "sessionCode") === session));
    });
    const unsubscribeControls = store.subscribe("conceptControls", (records) => {
      setControls(records.find((item) => item.id === session) || null);
    });
    return () => {
      unsubscribeRepresentatives();
      unsubscribeAuction();
      unsubscribeControls();
    };
  }, [store, draft.profile.sessionCode]);

  useEffect(() => {
    const currentIds = new Set(auctionResults.map((item) => item.id));
    if (!auctionSnapshotReadyRef.current) {
      auctionSnapshotReadyRef.current = true;
      previousAuctionIdsRef.current = currentIds;
      return;
    }
    const added = Array.from(currentIds).filter((id) => !previousAuctionIdsRef.current.has(id));
    previousAuctionIdsRef.current = currentIds;
    if (!added.length) return;
    setNewAuctionResultIds(added);
    const timer = window.setTimeout(() => setNewAuctionResultIds([]), 2400);
    return () => window.clearTimeout(timer);
  }, [auctionResults]);

  useEffect(() => {
    if (!presentationMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPresentationMode(false);
      if (!representatives.length) return;
      const currentIndex = Math.max(0, representatives.findIndex((item) => item.id === selectedRepresentativeId));
      if (event.key === "ArrowRight") {
        setSelectedRepresentativeId(representatives[(currentIndex + 1) % representatives.length].id);
      }
      if (event.key === "ArrowLeft") {
        setSelectedRepresentativeId(representatives[(currentIndex - 1 + representatives.length) % representatives.length].id);
      }
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setPresentationMode(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [presentationMode, representatives, selectedRepresentativeId]);

  const allTeamSubmitted = useMemo(() =>
    teamRecords.length >= 3 &&
    teamRecords.every((member) => hasInquirySubmission(teamDesigns.find((design) => design.id === member.id))),
  [teamRecords, teamDesigns]);

  const auctionReady = representatives.length >= 6;

  const teamStandings = useMemo(() => {
    const teams = Array.from(new Set(representatives.map((item) => recordString(item, "teamName")).filter(Boolean)));
    return teams.map((teamName) => {
      const ownRepresentative = representatives.find((item) => recordString(item, "teamName") === teamName);
      const ownScore = ownRepresentative ? representativeBaseScore(ownRepresentative) : 0;
      const purchases = auctionResults.filter((item) => recordString(item, "buyerTeam") === teamName);
      const purchaseScore = purchases.reduce((sum, item) => {
        const representative = representatives.find((candidate) => candidate.id === recordString(item, "representativeId"));
        const base = representative ? representativeBaseScore(representative) : Number(item.baseScore || 0);
        return sum + base * Number(item.tokens || 0);
      }, 0);
      const tokensSpent = purchases.reduce((sum, item) => sum + Number(item.tokens || 0), 0);
      return {
        teamName,
        ownScore,
        purchaseScore,
        total: ownScore + purchaseScore,
        tokensSpent,
        purchaseCount: purchases.length,
      };
    }).sort((a, b) => b.total - a.total || a.teamName.localeCompare(b.teamName, "ko"));
  }, [representatives, auctionResults]);

  useEffect(() => {
    if (!auctionReady || !teamStandings.length) return;
    const currentRanks = Object.fromEntries(teamStandings.map((team, index) => [team.teamName, index + 1]));
    const previousRanks = previousRanksRef.current;
    if (Object.keys(previousRanks).length) {
      const changes = Object.fromEntries(teamStandings.map((team, index) => [
        team.teamName,
        Number(previousRanks[team.teamName] || index + 1) - (index + 1),
      ]));
      setRankChanges(changes);
      const timer = window.setTimeout(() => setRankChanges({}), 2600);
      previousRanksRef.current = currentRanks;
      return () => window.clearTimeout(timer);
    }
    previousRanksRef.current = currentRanks;
  }, [auctionReady, teamStandings]);

  const registered = Boolean(
    draft.profile.name.trim() && draft.profile.teamName.trim() &&
    draft.profile.memberNames.trim() && draft.profile.sessionCode.trim(),
  );

  const completedCount = useMemo(() => {
    const checks = [
      Boolean(draft.goal.selectedGoal),
      Boolean(draft.lens.selected),
      Boolean(draft.concept.generalization1 && draft.concept.conceptual),
      Boolean(draft.grasps.goal && draft.grasps.product && draft.grasps.standards),
      draft.inquiry.stages.every((item) => item.activity.trim()),
      draft.tools.selectedFeatures.length === 3 && Boolean(draft.tools.finalTitle),
      Boolean(draft.completed),
    ];
    return checks.filter(Boolean).length;
  }, [draft]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const updateProfile = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setDraft((current) => ({ ...current, profile: { ...current.profile, [key]: value } }));

  const updateSection = (section: keyof Draft, key: string, value: unknown) => {
    setDraft((current) => ({
      ...current,
      [section]: { ...(current[section] as object), [key]: value },
    }));
  };

  const registerParticipant = async () => {
    if (!store) return;
    if (!registered) {
      showToast("나의 이름, 모둠명, 모둠원 이름을 모두 입력해 주세요.");
      return;
    }
    const ownerId = draft.ownerId || store.uid();
    const next = { ...draft, ownerId, updatedAt: new Date().toISOString() };
    setDraft(next);
    await store.set("conceptParticipants", ownerId, { uid: ownerId, ...next.profile, updatedAt: next.updatedAt });
    await store.set("conceptDesigns", ownerId, { ...next });
    setStep(0);
    setView("design");
    showToast("Step 1을 시작합니다.");
  };

  const validateStep = (index: number) => {
    if (index === 0) return Boolean(draft.goal.grade && draft.profile.subject && draft.goal.unit && draft.goal.standard && draft.goal.currentGoal && draft.goal.selectedGoal);
    if (index === 1) return Boolean(draft.lens.selected);
    if (index === 2) return Boolean(draft.concept.generalization1 && draft.concept.generalization2 && draft.concept.factual && draft.concept.conceptual && draft.concept.debatable);
    if (index === 3) return Boolean(draft.grasps.goal && draft.grasps.role && draft.grasps.audience && draft.grasps.situation && draft.grasps.product && draft.grasps.standards);
    if (index === 4) return draft.inquiry.stages.every((item) => item.activity.trim() && item.strategy.trim()) &&
      WHERETO.every(([key]) => {
        const check = draft.inquiry.whereto[key];
        return check && check.score >= 0 && (check.score === 0 || check.evidence.trim());
      });
    if (index === 5) return draft.tools.selectedFeatures.length === 3 && draft.tools.plans.every((item) => item.reason && item.plan && item.planB) && Boolean(draft.tools.finalTitle);
    return true;
  };

  const missingCountForStep = (index: number) => {
    const missing = (values: unknown[]) => values.filter((value) =>
      typeof value === "string" ? !value.trim() : !value,
    ).length;
    if (index === 0) return missing([
      draft.goal.grade, draft.profile.subject, draft.goal.unit,
      draft.goal.standard, draft.goal.currentGoal, draft.goal.selectedGoal,
    ]);
    if (index === 1) return missing([draft.lens.selected]);
    if (index === 2) return missing([
      draft.concept.generalization1, draft.concept.generalization2,
      draft.concept.factual, draft.concept.conceptual, draft.concept.debatable,
    ]);
    if (index === 3) return missing([
      draft.grasps.goal, draft.grasps.role, draft.grasps.audience,
      draft.grasps.situation, draft.grasps.product, draft.grasps.standards,
    ]);
    if (index === 4) {
      const stageMissing = draft.inquiry.stages.reduce((total, item) =>
        total + missing([item.activity, item.strategy]), 0);
      const checkMissing = WHERETO.reduce((total, [key]) => {
        const check = draft.inquiry.whereto[key];
        return total + (!check || check.score < 0 || (check.score > 0 && !check.evidence.trim()) ? 1 : 0);
      }, 0);
      return stageMissing + checkMissing;
    }
    if (index === 5) {
      const featureMissing = Math.max(0, 3 - draft.tools.selectedFeatures.length);
      const planMissing = draft.tools.plans.reduce((total, item) =>
        total + missing([item.reason, item.plan, item.planB]), 0);
      return featureMissing + planMissing + missing([draft.tools.finalTitle]);
    }
    return 0;
  };

  const retrySave = async () => {
    const next = { ...draft, currentStep: step, updatedAt: new Date().toISOString() };
    setSaveState("saving");
    try {
      await persistDraft(next);
      setLastSavedAt(next.updatedAt);
      setSaveState("saved");
    } catch (error) {
      console.error("Manual save retry failed.", error);
      setSaveState("error");
    }
  };

  const toggleConceptGuide = (index: number) => {
    setExpandedGuides((current) => {
      const next = { ...current, [index]: !current[index] };
      localStorage.setItem("concept_studio_guide_state_v1", JSON.stringify(next));
      return next;
    });
  };

  const startPresentationMode = async () => {
    if (!selectedRepresentativeId && representatives[0]) {
      setSelectedRepresentativeId(representatives[0].id);
    }
    setPresentationMode(true);
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // 브라우저가 전체화면을 막아도 발표 전용 레이아웃은 유지합니다.
    }
  };

  const exitPresentationMode = async () => {
    setPresentationMode(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // 이미 전체화면이 종료된 경우에는 레이아웃만 복원합니다.
    }
  };

  const goNext = async () => {
    if (!validateStep(step)) {
      showToast("필수 항목을 작성한 뒤 다음 단계로 이동해 주세요.");
      return;
    }
    if (step === 4) {
      const next = {
        ...draft,
        currentStep: 5,
        inquiry: { ...draft.inquiry, submittedAt: new Date().toISOString() },
        updatedAt: new Date().toISOString(),
      };
      setSaveState("saving");
      try {
        await persistDraft(next);
        setDraft(next);
        setStep(5);
        setLastSavedAt(next.updatedAt);
        setSaveState("saved");
        setView("team");
        showToast("개인 설계안을 제출했습니다. 모둠원의 설계안을 확인해 주세요.");
      } catch (error) {
        console.error("Inquiry submission failed.", error);
        setSaveState("error");
        showToast("개인 설계안 제출에 실패했습니다. 저장 상태를 확인하고 다시 시도해 주세요.");
      }
      return;
    }
    if (step < 6) {
      setStep((current) => current + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const next = { ...draft, currentStep: 6, completed: true, updatedAt: new Date().toISOString() };
      setSaveState("saving");
      try {
        await persistDraft(next);
        setDraft(next);
        setLastSavedAt(next.updatedAt);
        setSaveState("saved");
        setView("report");
        showToast("최종 설계안이 완성되었습니다.");
      } catch (error) {
        console.error("Final submission failed.", error);
        setSaveState("error");
        showToast("최종 설계안 저장에 실패했습니다. 다시 시도해 주세요.");
      }
    }
  };

  const openDesign = () => {
    if (!registered) {
      setView("home");
      document.getElementById("start-card")?.scrollIntoView({ behavior: "smooth" });
      showToast("먼저 이름과 모둠 정보를 입력해 주세요.");
      return;
    }
    setView("design");
  };

  const copyPrompt = async () => {
    if (!promptKey) return;
    await navigator.clipboard.writeText(PROMPTS[promptKey].text);
    showToast("프롬프트를 복사했습니다.");
  };

  async function refreshTeam() {
    if (!store) return;
    const [participants, designs, allReviews, allControls] = await Promise.all([
      store.all("conceptParticipants"),
      store.all("conceptDesigns"),
      store.all("conceptReviews"),
      store.all("conceptControls"),
    ]);
    const sameTeam = participants.filter((item) =>
      recordString(item, "sessionCode") === draft.profile.sessionCode &&
      recordString(item, "teamName") === draft.profile.teamName,
    );
    const ownerIds = new Set(sameTeam.map((item) => item.id));
    const sameTeamDesigns = designs.filter((item) => ownerIds.has(item.id));
    setTeamRecords(sameTeam);
    setTeamDesigns(sameTeamDesigns);
    const noticeKey = `${draft.profile.sessionCode}__${draft.profile.teamName}`;
    const everyoneSubmitted = sameTeam.length >= 3 &&
      sameTeam.every((member) => hasInquirySubmission(sameTeamDesigns.find((design) => design.id === member.id)));
    if (everyoneSubmitted && readyNoticeKey !== noticeKey) {
      setReadyNoticeKey(noticeKey);
      setTeamReadyPopup(true);
    }
    const relevantReviews = allReviews.filter((item) =>
      recordString(item, "sessionCode") === draft.profile.sessionCode &&
      recordString(item, "teamName") === draft.profile.teamName,
    );
    setReviews(relevantReviews);
    setControls(allControls.find((item) => item.id === draft.profile.sessionCode) || null);
    const nextDrafts: typeof reviewDrafts = {};
    sameTeam.filter((item) => item.id !== draft.ownerId).forEach((target) => {
      const existing = relevantReviews.find((item) =>
        recordString(item, "reviewerId") === draft.ownerId &&
        recordString(item, "targetId") === target.id,
      );
      nextDrafts[target.id] = existing ? {
        scores: (existing.scores || {}) as Record<string, number>,
        strength: recordString(existing, "strength"),
        improvement: recordString(existing, "improvement"),
      } : {
        scores: Object.fromEntries(WHERETO.map(([key]) => [key, -1])),
        strength: "",
        improvement: "",
      };
    });
    setReviewDrafts(nextDrafts);
  }

  const submitReview = async (target: AppRecord) => {
    if (!store || !draft.ownerId) return;
    const review = reviewDrafts[target.id];
    if (!review || Object.values(review.scores).some((score) => score < 0) || !review.strength.trim() || !review.improvement.trim()) {
      showToast("WHERETO 7개 점수와 강점·보완 의견을 모두 입력해 주세요.");
      return;
    }
    const id = `${safeId(draft.profile.sessionCode)}__${draft.ownerId}__${target.id}`;
    await store.set("conceptReviews", id, {
      sessionCode: draft.profile.sessionCode,
      teamName: draft.profile.teamName,
      reviewerId: draft.ownerId,
      reviewerName: draft.profile.name,
      targetId: target.id,
      targetName: recordString(target, "name"),
      scores: review.scores,
      strength: review.strength,
      improvement: review.improvement,
      total: Object.values(review.scores).reduce((sum, score) => sum + Number(score), 0),
      updatedAt: new Date().toISOString(),
    });
    await refreshTeam();
    showToast(`${recordString(target, "name")} 선생님 평가를 저장했습니다.`);
  };

  const scoreFor = (ownerId: string) => {
    const received = reviews.filter((item) => recordString(item, "targetId") === ownerId);
    if (!received.length) return { average: 0, total: 0, count: 0 };
    const total = received.reduce((sum, item) => sum + Number(item.total || totalReviewScore(item)), 0);
    return { average: total / received.length, total, count: received.length };
  };

  const topCandidate = useMemo(() => {
    const scored = teamRecords.map((participant) => ({ participant, ...scoreFor(participant.id) }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.average - a.average);
    return scored[0] || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamRecords, reviews]);

  const publishRepresentative = async () => {
    if (!store || !topCandidate) return;
    const allReviewsComplete = teamRecords.length >= 3 &&
      teamRecords.every((participant) => scoreFor(participant.id).count >= 2);
    if (!allReviewsComplete) {
      showToast("세 명 모두 서로의 설계안 평가를 마치면 대표안을 확정할 수 있습니다.");
      return;
    }
    const design = teamDesigns.find((item) => item.id === topCandidate.participant.id);
    if (!design) {
      showToast("대표 후보의 설계안이 아직 저장되지 않았습니다.");
      return;
    }
    const concept = (design.concept || {}) as Record<string, unknown>;
    const goal = (design.goal || {}) as Record<string, unknown>;
    const lens = (design.lens || {}) as Record<string, unknown>;
    const grasps = (design.grasps || {}) as Record<string, unknown>;
    const inquiry = (design.inquiry || {}) as Record<string, unknown>;
    const stages = (inquiry.stages || []) as InquiryStage[];
    const ownCheckScore = selfWheretoScore(design);
    const peerScoreTotal = topCandidate.total;
    const id = `${safeId(draft.profile.sessionCode)}__${safeId(draft.profile.teamName)}`;
    await store.set("conceptRepresentatives", id, {
      sessionCode: draft.profile.sessionCode,
      teamName: draft.profile.teamName,
      ownerId: topCandidate.participant.id,
      ownerName: recordString(topCandidate.participant, "name"),
      subject: recordString(topCandidate.participant, "subject"),
      grade: String(goal.grade || ""),
      unit: String(goal.unit || ""),
      title: `${String(goal.unit || recordString(topCandidate.participant, "subject"))} 개념기반 탐구수업`,
      selectedGoal: String(goal.selectedGoal || ""),
      lens: String(lens.selected || ""),
      lensReason: String(lens.reason || ""),
      generalization1: String(concept.generalization1 || ""),
      generalization2: String(concept.generalization2 || ""),
      factualQuestion: String(concept.factual || ""),
      conceptualQuestion: String(concept.conceptual || ""),
      debatableQuestion: String(concept.debatable || ""),
      performanceTask: [
        `G 목표: ${String(grasps.goal || "")}`,
        `R 역할: ${String(grasps.role || "")}`,
        `A 청중: ${String(grasps.audience || "")}`,
        `S 상황: ${String(grasps.situation || "")}`,
        `P 결과물: ${String(grasps.product || "")}`,
        `S 성공 기준: ${String(grasps.standards || "")}`,
      ].join("\n"),
      scenario: String(grasps.scenario || ""),
      successStandards: String(grasps.standards || ""),
      stages: stages.map((item) => ({
        key: item.key,
        title: item.title,
        activity: item.activity,
        strategy: item.strategy,
      })),
      wheretoAverage: Number(topCandidate.average.toFixed(1)),
      selfWheretoScore: ownCheckScore,
      peerScoreTotal,
      wheretoTotal: ownCheckScore + peerScoreTotal,
      submittedAt: new Date().toISOString(),
    });
    await refreshShowcase();
    setSelectedRepresentativeId(id);
    setView("showcase");
    showToast("모둠 대표 설계안을 발표 화면에 등록했습니다.");
  };

  async function refreshShowcase() {
    if (!store) return;
    const allRepresentatives = await store.all("conceptRepresentatives");
    const filtered = allRepresentatives.filter((item) =>
      recordString(item, "sessionCode") === draft.profile.sessionCode,
    );
    setRepresentatives(filtered);
    setSelectedRepresentativeId((current) => current || filtered[0]?.id || "");
  }

  const openAuctionRecord = (representative: AppRecord) => {
    if (!adminLoggedIn) return;
    const existing = auctionResults.find((item) => recordString(item, "representativeId") === representative.id);
    setSelectedAuctionId(representative.id);
    setAuctionDraft({
      buyerTeam: existing ? recordString(existing, "buyerTeam") : "",
      tokens: existing ? String(existing.tokens || "") : "",
    });
  };

  const saveAuctionResult = async () => {
    if (!store || !adminLoggedIn) return;
    const representative = representatives.find((item) => item.id === selectedAuctionId);
    if (!representative) {
      showToast("발표안을 다시 선택해 주세요.");
      return;
    }
    const sellerTeam = recordString(representative, "teamName");
    const tokens = Number(auctionDraft.tokens);
    if (!auctionDraft.buyerTeam || auctionDraft.buyerTeam === sellerTeam) {
      showToast("발표 모둠이 아닌 낙찰 모둠을 선택해 주세요.");
      return;
    }
    if (!Number.isInteger(tokens) || tokens < 1 || tokens > 7) {
      showToast("낙찰 토큰은 1~7 사이의 정수로 입력해 주세요.");
      return;
    }
    const alreadySpent = auctionResults
      .filter((item) => item.id !== representative.id && recordString(item, "buyerTeam") === auctionDraft.buyerTeam)
      .reduce((sum, item) => sum + Number(item.tokens || 0), 0);
    if (alreadySpent + tokens > 7) {
      showToast(`${auctionDraft.buyerTeam}의 토큰 사용 합계가 7개를 넘습니다.`);
      return;
    }
    const baseScore = representativeBaseScore(representative);
    await store.set("conceptAuctionResults", representative.id, {
      sessionCode: draft.profile.sessionCode,
      representativeId: representative.id,
      sellerTeam,
      buyerTeam: auctionDraft.buyerTeam,
      tokens,
      baseScore,
      finalScore: baseScore * tokens,
      updatedAt: new Date().toISOString(),
    });
    setSelectedAuctionId("");
    setAuctionDraft({ buyerTeam: "", tokens: "" });
    showToast(`${sellerTeam} 발표안의 낙찰 결과를 반영했습니다.`);
  };

  async function refreshAdmin() {
    if (!store) return;
    const [participants, designs, allReviews, allRepresentatives, allAuctionResults, allControls] = await Promise.all([
      store.all("conceptParticipants"),
      store.all("conceptDesigns"),
      store.all("conceptReviews"),
      store.all("conceptRepresentatives"),
      store.all("conceptAuctionResults"),
      store.all("conceptControls"),
    ]);
    const session = draft.profile.sessionCode;
    setAdminRecords(participants.filter((item) => !session || recordString(item, "sessionCode") === session));
    setTeamDesigns(designs.filter((item) => !session || recordString((item.profile || {}) as AppRecord, "sessionCode") === session));
    setReviews(allReviews.filter((item) => !session || recordString(item, "sessionCode") === session));
    setRepresentatives(allRepresentatives.filter((item) => !session || recordString(item, "sessionCode") === session));
    setAuctionResults(allAuctionResults.filter((item) => !session || recordString(item, "sessionCode") === session));
    setControls(allControls.find((item) => item.id === session) || null);
  }

  const createAuctionTestData = async () => {
    if (!store || !adminLoggedIn || busy) return;
    const sessionCode = draft.profile.sessionCode || store.config.sessionId || "concept-workshop-2026";
    const lenses = ["변화", "관계", "체계", "상호의존", "관점", "지속가능성"];
    const subjects = ["국어", "수학", "사회", "과학", "영어", "예술"];
    const peerScores = [22, 24, 25, 26, 27, 28];
    setBusy(true);
    try {
      await Promise.all(Array.from({ length: 6 }, async (_, index) => {
        const number = index + 1;
        const id = `${safeId(sessionCode)}__auction-test-${number}`;
        const teamName = `${number}모둠`;
        const lens = lenses[index];
        const subject = subjects[index];
        await store.set("conceptRepresentatives", id, {
          sessionCode,
          teamName,
          ownerId: `auction-test-owner-${number}`,
          ownerName: `테스트 교사 ${number}`,
          subject,
          grade: "중·고등학교",
          unit: `${subject} 개념 탐구 단원`,
          title: `[테스트] ${lens}의 렌즈로 다시 보는 ${subject} 수업`,
          selectedGoal: `학습한 개념의 관계를 설명하고 새로운 상황에 적용하여 해결 방안을 제안할 수 있다.`,
          lens,
          lensReason: `${lens}의 관점이 단편적인 사실을 연결하고 새로운 맥락으로 전이하는 데 적합하기 때문이다.`,
          generalization1: `개념 간의 관계는 현상을 해석하는 관점을 형성한다.`,
          generalization2: `근거를 바탕으로 구성한 이해는 새로운 상황의 문제 해결에 전이된다.`,
          factualQuestion: `이 단원에서 확인해야 할 핵심 사실과 사례는 무엇인가?`,
          conceptualQuestion: `${lens}은 현상을 이해하는 방식에 어떻게 영향을 주는가?`,
          debatableQuestion: `새로운 문제를 해결할 때 하나의 관점만으로 충분한가?`,
          performanceTask: `G 실제 문제 해결 · R 분야 전문가 · A 학교 공동체 · S 새로운 상황과 제약 조건 · P 해결안 발표 자료 · S 개념 관계, 탐구 근거, 전이 적용, 의사소통`,
          scenario: `나는 학교 공동체의 문제 해결 전문가로서 여러 자료를 분석하고, 핵심 개념의 관계를 새로운 상황에 적용한 해결안을 제안한다.`,
          successStandards: `개념 관계의 정확성, 근거의 타당성, 새로운 상황으로의 전이, 명료한 의사소통`,
          stages: INQUIRY_STAGES.map(([key, title], stageIndex) => ({
            key,
            title,
            activity: `${stageIndex + 1}단계 테스트 학생 활동`,
            strategy: `${lens} 중심 탐구 전략`,
          })),
          wheretoAverage: Number((peerScores[index] / 2).toFixed(1)),
          selfWheretoScore: 12,
          peerScoreTotal: peerScores[index],
          wheretoTotal: 12 + peerScores[index],
          isTestData: true,
          submittedAt: new Date().toISOString(),
        });
      }));
      await refreshAdmin();
      showToast("6개 모둠의 경매 테스트 대표안을 생성했습니다.");
    } catch (error) {
      console.error(error);
      showToast("테스트 데이터 생성에 실패했습니다. Firestore 규칙을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const deleteAuctionTestData = async () => {
    if (!store || !adminLoggedIn || busy) return;
    const testRepresentatives = representatives.filter((item) => Boolean(item.isTestData));
    if (!testRepresentatives.length) {
      showToast("삭제할 경매 테스트 데이터가 없습니다.");
      return;
    }
    if (!window.confirm("테스트 대표안과 해당 낙찰 결과만 삭제할까요? 실제 연수 자료는 유지됩니다.")) return;
    setBusy(true);
    try {
      await Promise.all(testRepresentatives.flatMap((item) => [
        store.remove("conceptAuctionResults", item.id),
        store.remove("conceptRepresentatives", item.id),
      ]));
      setSelectedAuctionId("");
      await refreshAdmin();
      showToast("경매 테스트 데이터만 삭제했습니다.");
    } catch (error) {
      console.error(error);
      showToast("테스트 데이터 삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const loginAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!store) return;
    setBusy(true);
    try {
      if (store.mode === "firebase" && store.config.adminEmail && adminEmail !== store.config.adminEmail) {
        throw new Error("허용된 강사 이메일이 아닙니다.");
      }
      await store.loginAdmin(adminEmail, adminPassword);
      setAdminLoggedIn(true);
      await refreshAdmin();
      showToast("강사 관제실에 로그인했습니다.");
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "로그인 정보를 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const saveControls = async (patch: Record<string, boolean>) => {
    if (!store || !draft.profile.sessionCode) {
      showToast("연수 설정을 불러오지 못했습니다.");
      return;
    }
    const next = {
      reviewsOpen: controls?.reviewsOpen ?? true,
      scoresRevealed: controls?.scoresRevealed ?? false,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await store.set("conceptControls", draft.profile.sessionCode, next);
    await refreshAdmin();
    showToast("연수 진행 상태를 변경했습니다.");
  };

  const renderHome = () => (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">AI·디지털 기반 교수학습 설계 워크숍</span>
          <h1>수업의 소재를 넘어,<br /><em>전이되는 이해</em>를 설계하세요.</h1>
          <p>
            성취기준에서 출발해 개념적 렌즈, 일반화, 수행과제, 탐구 활동을 한 줄로 정렬합니다.
            동료의 WHERETO 평가를 거쳐 모둠 대표안을 발표하고 실행 가능한 수업설계안으로 완성합니다.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={openDesign}>내 설계안 시작하기 <span>→</span></button>
            <button className="text-action" onClick={() => document.getElementById("process")?.scrollIntoView({ behavior: "smooth" })}>전체 과정 살펴보기 ↓</button>
          </div>
          <div className="hero-meta">
            <span><b>7</b> 설계 단계</span><span><b>3</b> 인 모둠평가</span>
            <span><b>1</b> 장 대표안</span><span><b>PDF</b> 최종 산출물</span>
          </div>
        </div>
        <div className="hero-board">
          <div className="board-top"><span>오늘의 설계 여정</span><b>{completedCount} / 7 완료</b></div>
          <div className="board-progress"><span style={{ width: `${Math.max(7, completedCount / 7 * 100)}%` }} /></div>
          <button className="board-card featured" onClick={openDesign}>
            <span className="board-number">0{Math.min(completedCount + 1, 7)}</span>
            <div><small>{completedCount ? "CONTINUE" : "START HERE"}</small><h2>{STEP_META[Math.min(completedCount, 6)][1]}</h2><p>{STEP_META[Math.min(completedCount, 6)][2]}</p></div>
            <span className="board-arrow">↗</span>
          </button>
          <div className="board-grid">
            {STEP_META.slice(1, 5).map(([num, title, desc]) => <article key={num}><span>{num}</span><b>{title}</b><small>{desc}</small></article>)}
          </div>
          <div className="insight-strip"><span className="concept-mark">C</span><div><b>좋은 아이디어는 함께 커집니다.</b><small>WHERETO 동료평가로 모둠 대표안을 선정하고 한 장으로 발표합니다.</small></div></div>
        </div>
      </section>

      <section className="start-section" id="start-card">
        <div className="start-copy">
          <span className="eyebrow">START · 바로 시작하기</span>
          <h2>모둠 정보만 입력하면 Step 1이 열립니다.</h2>
          <p>교육과정 파일을 확인하거나 업로드하지 않습니다. 기존 교수학습설계안에서 바꾸고 싶은 수업의 정보는 Step 1에서 입력합니다.</p>
          <div className={`mode-notice ${store?.mode === "firebase" ? "connected" : ""}`}>
            <span>{store?.mode === "firebase" ? "●" : "○"}</span>
            {store?.mode === "firebase" ? "공동 연수 모드 연결됨" : "현재 기기 데모 모드 · Firebase 설정 후 모둠 공동 작업 가능"}
          </div>
        </div>
        <div className="start-form-card">
          <div className="form-grid">
            <label>나의 이름<input value={draft.profile.name} onChange={(event) => updateProfile("name", event.target.value)} placeholder="예: 김정보" /></label>
            <label>모둠명<input value={draft.profile.teamName} onChange={(event) => updateProfile("teamName", event.target.value)} placeholder="예: 과학 교과군" /></label>
            <label className="wide">모둠원 이름<input value={draft.profile.memberNames} onChange={(event) => updateProfile("memberNames", event.target.value)} placeholder="본인을 포함한 3명의 이름을 쉼표로 구분" /></label>
          </div>
          <button className="primary-btn full" onClick={registerParticipant}>Step 1 바로 시작하기 <span>→</span></button>
        </div>
      </section>

      <section className="process-section" id="process">
        <div className="section-heading"><span className="eyebrow">Backward Design Journey</span><h2>하나의 질문에서 완성된 수업까지</h2><p>각 단계의 결과가 다음 단계의 입력이 되도록 설계했습니다.</p></div>
        <div className="process-grid">
          {STEP_META.map(([num, title, desc], index) => (
            <article className="process-card" key={num}><span className="process-num">{num}</span><h3>{title}</h3><p>{desc}</p>{index < 6 && <span className="flow-arrow">→</span>}</article>
          ))}
        </div>
      </section>
    </>
  );

  const stepPromptKey = (index: number): PromptKey => {
    if (index === 0) return "goal";
    if (index === 1) return "lens";
    if (index === 2) return "generalization";
    if (index === 3 || index === 4) return "integrated";
    return "tools";
  };

  const renderStepHeader = () => (
    <div className="workspace-heading">
      <div><span className="eyebrow">STEP {step + 1} OF 7</span><h1>{STEP_META[step][1]}</h1><p>{STEP_META[step][2]}</p></div>
      {step < 6 && <button className="prompt-btn" onClick={() => setPromptKey(stepPromptKey(step))}><span>✦</span> 작성이 어렵다면? 프롬프트 보기</button>}
    </div>
  );

  const renderConceptGuide = (index: number) => {
    const guide = STEP_GUIDES[index];
    const expanded = Boolean(expandedGuides[index]);
    return <section className={`concept-guide ${expanded ? "expanded" : "collapsed"}`}>
      <div className="concept-guide-heading"><div><span>먼저 알아둘 개념</span><h2>{guide.title}</h2><p>{guide.summary}</p></div><button type="button" aria-expanded={expanded} onClick={() => toggleConceptGuide(index)}>{expanded ? "간단히 보기 ↑" : "개념 안내 자세히 보기 ↓"}</button></div>
      {expanded && <div className="concept-guide-grid">{guide.items.map(([term, description]) =>
        <article key={term}><b>{term}</b><p>{description}</p></article>
      )}</div>}
    </section>;
  };

  const renderGoalStep = () => (
    <div className="step-stack">
      {renderConceptGuide(0)}
      <section className="step-instruction"><span>기존 설계안에서 가져오기</span><div><h2>바꾸고 싶은 수업 한 장면을 기준으로 입력하세요.</h2><p>현재 사용 중인 교수학습설계안에서 개선하고 싶은 수업을 하나 고른 뒤, 그 설계안의 학년·교과, 단원·주제, 성취기준, 현재 학습 목표를 수정하지 말고 먼저 그대로 옮겨 적습니다.</p></div></section>
      <section className="input-card"><h2>1. 기존 교수학습설계안의 수업 기본 정보</h2><div className="form-grid three">
        <label>학년 / 학교급<input value={draft.goal.grade} onChange={(e) => updateSection("goal", "grade", e.target.value)} placeholder="예: 고등학교 1학년" /></label>
        <label>교과<input value={draft.profile.subject} onChange={(e) => updateProfile("subject", e.target.value)} placeholder="예: 통합과학2" /></label>
        <label>단원 / 주제<input value={draft.goal.unit} onChange={(e) => updateSection("goal", "unit", e.target.value)} placeholder="예: 산과 염기의 반응" /></label>
      </div><label className="field">성취기준<textarea value={draft.goal.standard} onChange={(e) => updateSection("goal", "standard", e.target.value)} placeholder="교육과정 자료에서 해당 성취기준을 붙여넣으세요." /></label>
      <label className="field">현재 학습 목표<textarea value={draft.goal.currentGoal} onChange={(e) => updateSection("goal", "currentGoal", e.target.value)} placeholder="기존 설계안에 적혀 있는 학습 목표를 그대로 입력하세요." /></label></section>
      <section className="input-card"><h2>2. 목표 진단</h2><div className="choice-row">
        {["사실·절차 암기형", "개념 이해·전이형"].map((value) => <button key={value} className={`choice-chip ${draft.goal.diagnosis === value ? "selected" : ""}`} onClick={() => updateSection("goal", "diagnosis", value)}>{value}</button>)}
      </div><label className="field">판정 근거<textarea value={draft.goal.diagnosisReason} onChange={(e) => updateSection("goal", "diagnosisReason", e.target.value)} placeholder="목표의 어떤 표현을 근거로 판정했나요?" /></label></section>
      <section className="input-card"><h2>3. 개념 이해·전이형 목표 후보</h2><div className="compare-grid">
        <label>After A<textarea value={draft.goal.revisedGoalA} onChange={(e) => updateSection("goal", "revisedGoalA", e.target.value)} placeholder="재설계 목표 후보 1" /></label>
        <label>After B<textarea value={draft.goal.revisedGoalB} onChange={(e) => updateSection("goal", "revisedGoalB", e.target.value)} placeholder="재설계 목표 후보 2" /></label>
      </div><label className="field">최종 선택 목표<textarea value={draft.goal.selectedGoal} onChange={(e) => updateSection("goal", "selectedGoal", e.target.value)} placeholder="두 후보 중 선택하거나 결합한 최종 학습 목표" /></label>
      <label className="field">학년 수준·전이 기준 점검<textarea value={draft.goal.transferCheck} onChange={(e) => updateSection("goal", "transferCheck", e.target.value)} placeholder="교육과정 범위를 넘지 않는가? 둘 이상의 개념 관계와 새로운 맥락의 전이가 있는가?" /></label></section>
    </div>
  );

  const renderLensStep = () => (
    <div className="step-stack">
      {renderConceptGuide(1)}
      <section className="context-ribbon"><span>선택한 학습 목표</span><p>{draft.goal.selectedGoal || "Step 1에서 최종 목표를 먼저 선택하세요."}</p></section>
      <section className="input-card"><h2>개념적 렌즈 선택</h2><p className="card-guide">수업의 소재가 아니라 여러 맥락으로 전이될 수 있는 거시 개념 하나를 바로 선택합니다.</p><div className="lens-grid">
        {LENSES.map((lens) => <button key={lens} className={`lens-card ${draft.lens.selected === lens ? "selected" : ""}`} onClick={() => updateSection("lens", "selected", lens)}><span>{draft.lens.selected === lens ? "✓" : "○"}</span><b>{lens}</b></button>)}
      </div><label className="field">선정 이유<textarea value={draft.lens.reason} onChange={(e) => updateSection("lens", "reason", e.target.value)} placeholder="이 렌즈가 학습 목표와 어떻게 연결되는지 간단히 적으세요." /></label></section>
    </div>
  );

  const renderConceptStep = () => (
    <div className="step-stack">
      {renderConceptGuide(2)}
      <section className="context-ribbon split"><div><span>개념적 렌즈</span><strong>{draft.lens.selected || "미선택"}</strong></div><div><span>학습 목표</span><p>{draft.goal.selectedGoal}</p></div></section>
      <section className="input-card"><h2>1. 관련 개념과 일반화</h2><label className="field">관련 개념 3~5개<input value={draft.concept.related} onChange={(e) => updateSection("concept", "related", e.target.value)} placeholder="쉼표로 구분" /></label><div className="compare-grid">
        <label>일반화 1<textarea value={draft.concept.generalization1} onChange={(e) => updateSection("concept", "generalization1", e.target.value)} placeholder="둘 이상의 개념 관계를 현재 시제로 진술" /></label>
        <label>일반화 2<textarea value={draft.concept.generalization2} onChange={(e) => updateSection("concept", "generalization2", e.target.value)} placeholder="시대와 장소를 넘어 전이 가능한 문장" /></label>
      </div></section>
      <section className="input-card"><h2>2. 세 종류의 안내 질문</h2><div className="question-grid">
        <label><span className="question-type fact">사실적</span><textarea value={draft.concept.factual} onChange={(e) => updateSection("concept", "factual", e.target.value)} placeholder="정해진 답이 있는 질문 3개" /></label>
        <label><span className="question-type concept">개념적</span><textarea value={draft.concept.conceptual} onChange={(e) => updateSection("concept", "conceptual", e.target.value)} placeholder="왜·어떻게를 묻는 질문 3개" /></label>
        <label><span className="question-type debate">논쟁적</span><textarea value={draft.concept.debatable} onChange={(e) => updateSection("concept", "debatable", e.target.value)} placeholder="근거에 따라 입장이 갈리는 질문 2개" /></label>
      </div><div className="contribution-grid">
        <article><span className="question-type fact">사실적 질문의 기여</span><p>학생들이 탐구에 필요한 기초 지식을 확인하고, 개념 형성의 바탕이 되는 사실적 토대를 구축하게 합니다.</p></article>
        <article><span className="question-type concept">개념적 질문의 기여</span><p>학생들이 사실 속 패턴을 넘어 개념과 개념의 관계를 설명하며 일반화 문장을 도출하게 합니다.</p></article>
        <article><span className="question-type debate">논쟁적 질문의 기여</span><p>학생들이 서로 다른 관점과 근거를 비교하며 일반화의 적용 범위와 타당성을 검토하고 사고를 확장하게 합니다.</p></article>
      </div></section>
    </div>
  );

  const updateRubric = (rowIndex: number, key: keyof RubricRow, value: string) => {
    const rubric = draft.grasps.rubric.map((row, index) => index === rowIndex ? { ...row, [key]: value } : row);
    updateSection("grasps", "rubric", rubric);
  };

  const renderGraspsStep = () => (
    <div className="step-stack">
      {renderConceptGuide(3)}
      <section className="alignment-line"><span>성취기준</span><i>→</i><span>일반화</span><i>→</i><strong>수행과제</strong><i>→</i><strong>루브릭</strong></section>
      <section className="input-card"><h2>1. GRASPS 수행과제</h2><div className="grasps-grid">
        {[
          ["goal", "G", "목표", "학생이 해결해야 할 실제 문제·도전"],
          ["role", "R", "역할", "학생이 맡을 실제적 역할"],
          ["audience", "A", "청중", "결과물을 전달할 실제 대상"],
          ["situation", "S", "상황·제약", "과제가 이루어지는 실제적 맥락과 제약"],
          ["product", "P", "산출물", "학생이 제작하거나 수행할 결과물 선택지"],
          ["standards", "S", "성공 기준 → 루브릭 평가 준거", "일반화 도달을 확인할 관찰 가능한 기준"],
        ].map(([key, letter, title, placeholder]) => <label className={`grasps-item ${key === "standards" ? "standards-link" : ""}`} key={key}><span>{letter}</span><b>{title}</b><textarea value={String(draft.grasps[key as keyof typeof draft.grasps] || "")} onChange={(e) => updateSection("grasps", key, e.target.value)} placeholder={placeholder} /></label>)}
      </div><label className="field">학생용 1인칭 상황 시나리오<textarea className="tall" value={draft.grasps.scenario} onChange={(e) => updateSection("grasps", "scenario", e.target.value)} placeholder="학생에게 그대로 제시할 수 있는 1문단 상황 글" /></label></section>
      <section className="input-card wide-card"><div className="rubric-link-note"><b>위 S(성공 기준)</b><span>↓ 평가 가능한 기준으로 구체화</span><strong>아래 루브릭의 평가 준거</strong></div><h2>2. 4수준 분석적 평가 루브릭</h2><p className="card-guide">성공 기준을 평가 준거로 옮기고, 각 수준에서 학생이 실제로 한 행동이 관찰되도록 작성합니다.</p><div className="table-scroll"><table className="rubric-table"><thead><tr><th>평가 준거</th><th>4 매우 우수</th><th>3 우수</th><th>2 보통</th><th>1 노력 요함</th></tr></thead><tbody>
        {draft.grasps.rubric.map((row, index) => <tr key={row.criterion}><th><input value={row.criterion} onChange={(e) => updateRubric(index, "criterion", e.target.value)} /></th>{(["level4", "level3", "level2", "level1"] as const).map((level) => <td key={level}><textarea value={row[level]} onChange={(e) => updateRubric(index, level, e.target.value)} placeholder="관찰 가능한 행동" /></td>)}</tr>)}
      </tbody></table></div></section>
    </div>
  );

  const updateInquiryStage = (index: number, key: keyof InquiryStage, value: string) => {
    const stages = draft.inquiry.stages.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item);
    updateSection("inquiry", "stages", stages);
  };

  const renderInquiryStep = () => (
    <div className="step-stack">
      {renderConceptGuide(4)}
      <section className="input-card wide-card"><div className="card-title-row"><div><h2>1. 개념 기반 탐구 7단계</h2><p className="card-guide">각 단계의 학생 활동과 핵심 탐구 전략을 작성합니다.</p></div><span className="stage-badge">개인 설계</span></div><div className="inquiry-list">
        {draft.inquiry.stages.map((item, index) => <article className="inquiry-row no-lessons" key={item.key}><div className="stage-title"><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{item.title.replace(/^[①-⑦]\s/, "")}</h3><p>{item.purpose}</p></div></div><label>주요 학생 활동<textarea value={item.activity} onChange={(e) => updateInquiryStage(index, "activity", e.target.value)} placeholder="학생이 무엇을 말하고, 만들고, 판단하는가?" /></label><label>핵심 탐구 전략<textarea value={item.strategy} onChange={(e) => updateInquiryStage(index, "strategy", e.target.value)} placeholder="질문, 비교, 분류, 근거, 성찰 등" /></label></article>)}
      </div></section>
      <section className="input-card"><div className="card-title-row"><div><h2>2. WHERETO 자기점검</h2><p className="card-guide">각 항목을 0~2점으로 선택합니다. 0점은 ‘해당 없음’으로 자동 기록되며, 1·2점은 설계안의 내용과 근거를 작성합니다.</p></div><span className="stage-badge">제출 후 모둠평가</span></div><div className="whereto-self-grid">
        {WHERETO.map(([key, english, korean, question]) => {
          const check = draft.inquiry.whereto[key];
          return <div className="whereto-self scored" key={key}><span>{key}</span><div><b>{korean}</b><small>{english}</small><p>{question}</p><div className="self-score-buttons">{[0, 1, 2].map((score) => <button key={score} className={check.score === score ? "selected" : ""} onClick={() => updateSection("inquiry", "whereto", {
            ...draft.inquiry.whereto,
            [key]: {
              score,
              evidence: score === 0 ? "해당 없음" : check.evidence === "해당 없음" ? "" : check.evidence,
            },
          })}><b>{score}점</b><small>{score === 0 ? "해당 없음" : score === 1 ? "일부 반영" : "명확히 반영"}</small></button>)}</div>{check.score === 0 ? <div className="not-applicable">해당 없음</div> : check.score > 0 ? <textarea value={check.evidence} onChange={(e) => updateSection("inquiry", "whereto", { ...draft.inquiry.whereto, [key]: { ...check, evidence: e.target.value } })} placeholder="해당 내용이 어느 단계에 어떻게 반영되었는지 근거를 작성하세요." /> : <p className="score-help">0점, 1점, 2점 중 하나를 선택하세요.</p>}</div></div>;
        })}
      </div></section>
    </div>
  );

  const toggleFeature = (feature: string) => {
    const selected = draft.tools.selectedFeatures;
    if (selected.includes(feature)) {
      updateSection("tools", "selectedFeatures", selected.filter((item) => item !== feature));
      updateSection("tools", "plans", draft.tools.plans.filter((item) => item.feature !== feature));
      return;
    }
    if (selected.length >= 3) {
      showToast("핵심 기능은 3개만 선택합니다.");
      return;
    }
    updateSection("tools", "selectedFeatures", [...selected, feature]);
    updateSection("tools", "plans", [...draft.tools.plans, { feature, reason: "", examples: "", plan: "", planB: "" }]);
  };

  const updateToolPlan = (index: number, key: keyof ToolPlan, value: string) => {
    const plans = draft.tools.plans.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item);
    updateSection("tools", "plans", plans);
  };

  const renderToolsStep = () => (
    <div className="step-stack">
      {renderConceptGuide(5)}
      <section className="input-card"><h2>1. 깊이 있는 학습에 필요한 핵심 기능 3개</h2><p className="card-guide">도구 이름보다 먼저 필요한 교육적 기능을 선택합니다. 현재 {draft.tools.selectedFeatures.length}/3개 선택했습니다.</p><div className="feature-grid">
        {TOOL_FEATURES.map((feature) => <button key={feature} className={`feature-card ${draft.tools.selectedFeatures.includes(feature) ? "selected" : ""}`} onClick={() => toggleFeature(feature)}><span>{draft.tools.selectedFeatures.includes(feature) ? "✓" : "+"}</span>{feature}</button>)}
      </div></section>
      {draft.tools.plans.map((plan, index) => <section className="input-card tool-plan" key={plan.feature}><div className="tool-plan-title"><span>0{index + 1}</span><h2>{plan.feature}</h2></div><div className="form-grid">
        <label>추천 이유·효과성·편의성·안전성<textarea value={plan.reason} onChange={(e) => updateToolPlan(index, "reason", e.target.value)} placeholder="수업의 어느 단계와 목적에 기여하나요?" /></label>
        <label>대표 도구 예시<textarea value={plan.examples} onChange={(e) => updateToolPlan(index, "examples", e.target.value)} placeholder="적용 가능한 에듀테크·AI 도구" /></label>
        <label>교사·학생의 구체적 활용 계획<textarea value={plan.plan} onChange={(e) => updateToolPlan(index, "plan", e.target.value)} placeholder="교사와 학생이 각각 무엇을 하나요?" /></label>
        <label>아날로그 플랜 B<textarea value={plan.planB} onChange={(e) => updateToolPlan(index, "planB", e.target.value)} placeholder="네트워크·기기 오류 시 대체 활동" /></label>
      </div></section>)}
      <section className="input-card"><h2>2. 최종 수업 제목</h2><div className="title-options">
        {[["titleDirect", "① 직관·명확형", "핵심 주제와 활동이 드러나는 제목"], ["titleConcept", "② 개념·탐구형", "렌즈와 탐구 질문이 강조되는 제목"], ["titleEmotion", "③ 감성·흥미형", "호기심과 동기를 자극하는 제목"]].map(([key, title, desc]) => <label className={`title-option ${draft.tools.finalTitle && draft.tools.finalTitle === draft.tools[key as keyof typeof draft.tools] ? "selected" : ""}`} key={key}><span>{title}</span><small>{desc}</small><input value={String(draft.tools[key as keyof typeof draft.tools])} onChange={(e) => updateSection("tools", key, e.target.value)} placeholder="추천 제목 입력" /><button onClick={() => updateSection("tools", "finalTitle", String(draft.tools[key as keyof typeof draft.tools]))}>이 제목 선택</button></label>)}
      </div><label className="field">최종 선택 제목<input value={draft.tools.finalTitle} onChange={(e) => updateSection("tools", "finalTitle", e.target.value)} placeholder="수정하여 직접 입력할 수도 있습니다." /></label></section>
    </div>
  );

  const renderFinalStep = () => (
    <div className="step-stack final-ready-step">
      <section className="final-callout"><span className="concept-mark large">✓</span><div><span className="eyebrow">READY TO COMPLETE</span><h2>교수학습설계안 작성이 모두 끝났습니다.</h2><p>아래 미리보기를 확인한 뒤 ‘최종 설계안 완성’ 버튼을 누르면 PDF 저장 화면으로 이동합니다.</p></div></section>
      <section className="report-preview compact"><span className="eyebrow">FINAL PREVIEW</span><h2>{draft.tools.finalTitle || "최종 수업 제목"}</h2><p>{draft.goal.selectedGoal}</p><div className="preview-chips"><span>{draft.lens.selected}</span><span>{draft.profile.subject}</span><span>{draft.goal.unit}</span></div></section>
    </div>
  );

  const renderDesign = () => {
    const missingCount = missingCountForStep(step);
    const savedTime = lastSavedAt
      ? new Date(lastSavedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      : "";
    const saveLabel = saveState === "saving"
      ? "저장 중…"
      : saveState === "saved"
        ? "저장됨 ✓"
        : saveState === "error"
          ? "저장 실패"
          : ready ? "자동 저장 준비" : "불러오는 중";
    return <div className="workspace-layout">
      <aside className="step-sidebar">
        <div className="participant-mini"><span>{draft.profile.name.slice(0, 1) || "?"}</span><div><b>{draft.profile.name || "참여자"}</b><small>{draft.profile.teamName} · {draft.profile.subject}</small></div></div>
        <div className="sidebar-progress"><div><span>설계 진행률</span><b>{completedCount}/7</b></div><div><span style={{ width: `${completedCount / 7 * 100}%` }} /></div></div>
        <ol>{STEP_META.map(([num, title], index) => <li key={num}><button className={`${step === index ? "active" : ""} ${index < completedCount ? "done" : ""}`} onClick={() => setStep(index)}><span>{index < completedCount ? "✓" : num}</span><b>{title}</b></button></li>)}</ol>
        <button className="sidebar-link" onClick={() => setView("team")}>모둠평가실 <span>↗</span></button>
        <button className="sidebar-link showcase" onClick={() => setView("showcase")}>대표안 발표 <span>↗</span></button>
        <small className={`autosave ${saveState}`}>{saveLabel}{savedTime && saveState === "saved" ? ` · ${savedTime}` : ""}</small>
      </aside>
      <section className="workspace-main">{renderStepHeader()}{step === 0 && renderGoalStep()}{step === 1 && renderLensStep()}{step === 2 && renderConceptStep()}{step === 3 && renderGraspsStep()}{step === 4 && renderInquiryStep()}{step === 5 && renderToolsStep()}{step === 6 && renderFinalStep()}
        <div className="step-actions"><button className="secondary-btn" disabled={step === 0} onClick={() => { setStep((current) => Math.max(0, current - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>← 이전 단계</button><div className={`sticky-save-status ${saveState}`}>{saveState === "error" ? <button type="button" onClick={retrySave}>저장 실패 · 다시 시도</button> : <><b>{saveLabel}</b>{savedTime && <small>마지막 저장 {savedTime}</small>}</>}<span className={missingCount ? "missing" : "complete"}>{missingCount ? `필수 항목 ${missingCount}개 남음` : "현재 단계 필수 항목 완료"}</span></div><button className="primary-btn" onClick={goNext}>{step === 4 ? "개인 설계 제출하고 모둠평가실 열기" : step === 6 ? "최종 설계안 완성" : "다음 단계"} <span>→</span></button></div>
      </section>
    </div>;
  };

  const renderTeam = () => {
    const reviewsOpen = controls ? Boolean(controls.reviewsOpen) : true;
    const expectedNames = memberList(draft.profile.memberNames);
    const submittedCount = teamRecords.filter((member) =>
      hasInquirySubmission(teamDesigns.find((design) => design.id === member.id)),
    ).length;
    const allReviewsComplete = teamRecords.length >= 3 &&
      teamRecords.every((participant) => scoreFor(participant.id).count >= 2);
    const teamProgressRows = [
      ...teamRecords.map((member) => {
        const submitted = hasInquirySubmission(teamDesigns.find((design) => design.id === member.id));
        const reviewCount = reviews.filter((review) => recordString(review, "reviewerId") === member.id).length;
        return {
          id: member.id,
          name: recordString(member, "name"),
          isMe: member.id === draft.ownerId,
          connected: true,
          submitted,
          reviewCount,
          status: !submitted ? "작성 중" : reviewCount >= 2 ? "완료" : reviewCount > 0 ? "평가 중" : "평가 대기",
          statusKey: !submitted ? "writing" : reviewCount >= 2 ? "done" : reviewCount > 0 ? "reviewing" : "waiting",
        };
      }),
      ...expectedNames.filter((name) =>
        !teamRecords.some((member) => recordString(member, "name").trim() === name.trim()),
      ).map((name) => ({
        id: `expected-${name}`,
        name,
        isMe: false,
        connected: false,
        submitted: false,
        reviewCount: 0,
        status: "접속 대기",
        statusKey: "offline",
      })),
    ];
    return <section className="page-container">
      <div className="page-hero team-hero"><div><span className="eyebrow">3인 모둠 협력</span><h1>WHERETO 동료평가실</h1><p>개인 설계를 제출한 뒤 자기 자신을 제외한 두 명의 설계안을 각각 확인하고 7개 기준으로 평가합니다.</p></div><div className="team-code"><small>모둠명</small><b>{draft.profile.teamName || "-"}</b><span>{submittedCount}/3명 개인 설계 제출</span></div></div>
      {!registered ? <EmptyState title="모둠 정보가 필요합니다." text="첫 화면에서 이름과 모둠 정보를 먼저 입력하세요." action={() => setView("home")} actionLabel="시작 화면으로 이동" /> :
      <>
        <div className="room-status"><span className={reviewsOpen ? "open" : "closed"}>{reviewsOpen ? "평가 가능" : "강사가 평가를 마감했습니다"}</span><b>{submittedCount}/3명 제출 · {teamRecords.length}/3명 접속</b><button className="mini-btn" onClick={refreshTeam}>새로고침</button></div>
        <section className="team-progress-board"><div className="team-progress-heading"><div><span className="eyebrow">TEAM PROGRESS</span><h2>모둠원 진행 상황</h2></div><small>누구의 제출과 평가를 기다리고 있는지 확인하세요.</small></div><div className="team-progress-table"><div className="team-progress-header"><span>모둠원</span><span>설계 제출</span><span>동료평가</span><span>현재 상태</span></div>{teamProgressRows.map((member) => <article className={`${member.isMe ? "me" : ""} ${!member.connected ? "offline" : ""}`} key={member.id}><div className="team-member-name"><span>{member.name.slice(0, 1) || "?"}</span><b>{member.name}{member.isMe ? " · 나" : ""}</b></div><div><b className={member.submitted ? "status-done" : "status-wait"}>{member.submitted ? "완료" : member.connected ? "작성 중" : "대기"}</b></div><div><strong>{member.reviewCount}/2</strong></div><div><em className={`progress-status ${member.statusKey}`}>{member.status}</em></div></article>)}</div></section>
        {!allTeamSubmitted && <section className="waiting-workspace"><div className="waiting-banner"><span>동료 제출 대기 중</span><div><h2>기다리는 동안 Step 6을 먼저 작성하세요.</h2><p>세 명의 개인 설계가 모두 제출되면 알림창이 열리고 WHERETO 동료평가로 바로 안내합니다.</p></div></div>{renderToolsStep()}</section>}
        {teamRecords.filter((member) => member.id !== draft.ownerId).map((target) => {
          const design = teamDesigns.find((item) => item.id === target.id);
          const targetDraft = reviewDrafts[target.id];
          const submitted = hasInquirySubmission(design);
          const goal = (design?.goal || {}) as Record<string, unknown>;
          const lens = (design?.lens || {}) as Record<string, unknown>;
          const concept = (design?.concept || {}) as Record<string, unknown>;
          const grasps = (design?.grasps || {}) as Record<string, unknown>;
          const inquiry = (design?.inquiry || {}) as Record<string, unknown>;
          const stages = (inquiry.stages || []) as InquiryStage[];
          return <article className={`peer-review-card ${!submitted ? "waiting" : ""}`} key={target.id}><div className="peer-title"><div><span className="eyebrow">PEER REVIEW</span><h2>{recordString(target, "name")} 선생님의 설계안</h2><p>{recordString(target, "subject") || "교과 입력 전"} · {recordString(target, "teamName")}</p></div><span className="review-total">{targetDraft ? Object.values(targetDraft.scores).reduce((sum, value) => sum + Math.max(0, Number(value)), 0) : 0}<small>/14</small></span></div>
            {!submitted ? <div className="peer-waiting"><span>작성 중</span><p>{recordString(target, "name")} 선생님이 Step 5 개인 설계안을 제출하면 이곳에 전체 내용과 채점표가 열립니다.</p></div> : <details className="design-summary" open><summary>제출한 교수학습설계안 보기</summary><div className="peer-overview"><article><b>학습 목표</b><p>{String(goal.selectedGoal || "")}</p></article><article><b>개념적 렌즈</b><p>{String(lens.selected || "")}</p></article><article><b>일반화</b><p>{String(concept.generalization1 || "")}</p></article><article><b>GRASPS 수행과제</b><p>{String(grasps.scenario || grasps.product || "")}</p></article></div>{stages.map((item) => <div key={item.key}><b>{item.title}</b><p>{item.activity || "작성 중"}</p><small>{item.strategy}</small></div>)}</details>}
            {submitted && <>
            <div className="peer-score-grid">{WHERETO.map(([key, english, korean, question]) => <div className="peer-score" key={key}><span>{key}</span><div><b>{korean}</b><small>{question}</small></div><div className="score-buttons">{[0, 1, 2].map((score) => <button key={score} disabled={!reviewsOpen} className={targetDraft?.scores[key] === score ? "selected" : ""} onClick={() => setReviewDrafts((current) => ({ ...current, [target.id]: { ...current[target.id], scores: { ...current[target.id].scores, [key]: score } } }))}>{score}<small>{score === 0 ? "미반영" : score === 1 ? "일부" : "명확"}</small></button>)}</div><i>{english}</i></div>)}</div>
            <div className="form-grid"><label>가장 잘 설계된 부분<textarea disabled={!reviewsOpen} value={targetDraft?.strength || ""} onChange={(e) => setReviewDrafts((current) => ({ ...current, [target.id]: { ...current[target.id], strength: e.target.value } }))} placeholder="설계안의 구체적인 근거와 함께 작성" /></label><label>보완하면 더 좋아질 부분<textarea disabled={!reviewsOpen} value={targetDraft?.improvement || ""} onChange={(e) => setReviewDrafts((current) => ({ ...current, [target.id]: { ...current[target.id], improvement: e.target.value } }))} placeholder="다음 수정 행동이 드러나도록 작성" /></label></div><button className="primary-btn" disabled={!reviewsOpen} onClick={() => submitReview(target)}>동료평가 저장</button>
            </>}
          </article>;
        })}
        <section className="nomination-panel"><div><span className="eyebrow">TEAM REPRESENTATIVE</span><h2>모둠 대표 교수학습설계안</h2><p>세 명이 서로 두 번씩 평가를 마치면 WHERETO 평균 점수가 가장 높은 설계안이 대표안으로 확정됩니다.</p></div>{allReviewsComplete && topCandidate ? <div className="nominee-result"><span className="winner-crown">★</span><div><b>{recordString(topCandidate.participant, "name")} 선생님</b><small>평균 {topCandidate.average.toFixed(1)}점 · 동료 2명 평가 완료</small></div><button className="primary-btn" onClick={publishRepresentative}>대표안 확정하고 한 장으로 보기</button></div> : <div className="waiting-box">모둠원 세 명의 상호평가가 모두 저장되면 대표안이 자동 계산됩니다.</div>}</section>
      </>}
    </section>;
  };

  const renderShowcase = () => {
    const selected = representatives.find((item) => item.id === selectedRepresentativeId) || representatives[0];
    const stages = ((selected?.stages || []) as Array<Record<string, unknown>>);
    const selectedIndex = Math.max(0, representatives.findIndex((item) => item.id === selected?.id));
    const movePresentation = (direction: number) => {
      if (!representatives.length) return;
      const nextIndex = (selectedIndex + direction + representatives.length) % representatives.length;
      setSelectedRepresentativeId(representatives[nextIndex].id);
    };
    return <section className="page-container showcase-page">
      <div className="page-hero showcase-hero"><div><span className="eyebrow">ONE PAGE PRESENTATION</span><h1>모둠 대표안 발표</h1><p>WHERETO 동료평가로 선정된 각 모둠의 대표 교수학습설계안을 한 장씩 넘겨 보며 발표합니다.</p></div><div className="hero-actions"><button className="secondary-btn" onClick={refreshShowcase}>대표안 새로고침</button>{representatives.length > 0 && <button className="secondary-btn presentation-start" onClick={startPresentationMode}>발표 모드 시작 ⛶</button>}{auctionReady && <button className="primary-btn" onClick={() => setView("auction")}>경매 현황으로 이동 →</button>}</div></div>
      {representatives.length === 0 ? <EmptyState title="아직 확정된 모둠 대표안이 없습니다." text="모둠평가실에서 세 명의 상호평가를 마치고 대표안을 확정하세요." action={() => setView("team")} actionLabel="모둠평가실 이동" /> : <>
        {presentationMode && <div className="showcase-presenter-controls"><button onClick={() => movePresentation(-1)} aria-label="이전 모둠">←</button><div><b>{recordString(selected, "teamName")}</b><span>{selectedIndex + 1} / {representatives.length} 모둠</span><small>← → 방향키로 이동 · Esc로 종료</small></div><button onClick={() => movePresentation(1)} aria-label="다음 모둠">→</button><button className="presentation-exit" onClick={exitPresentationMode}>발표 모드 종료</button></div>}
        <div className="showcase-tabs">{representatives.map((item) => <button className={selected?.id === item.id ? "active" : ""} key={item.id} onClick={() => setSelectedRepresentativeId(item.id)}><b>{recordString(item, "teamName")}</b><small>{recordString(item, "ownerName")} 선생님</small></button>)}</div>
        {selected && <article className="presentation-sheet">
          <header><div><span>{recordString(selected, "teamName")} · 모둠 대표안</span><h2>{recordString(selected, "title")}</h2><p>{recordString(selected, "ownerName")} 선생님 · {recordString(selected, "subject")} · {recordString(selected, "grade")}</p></div><strong>{Number(selected.wheretoAverage || 0).toFixed(1)}<small>WHERETO 평균</small></strong></header>
          <section className="presentation-core"><article><span>학습 목표</span><p>{recordString(selected, "selectedGoal")}</p></article><article><span>개념적 렌즈</span><h3>{recordString(selected, "lens")}</h3><p>{recordString(selected, "unit")}</p></article></section>
          <section className="presentation-generalizations"><article><span>일반화 1</span><p>{recordString(selected, "generalization1")}</p></article><article><span>일반화 2</span><p>{recordString(selected, "generalization2")}</p></article></section>
          <section className="presentation-grid"><article><span>핵심 개념적 질문</span><p className="multiline">{recordString(selected, "conceptualQuestion")}</p><span>논쟁적 질문</span><p className="multiline">{recordString(selected, "debatableQuestion")}</p></article><article><span>GRASPS 수행과제</span><p>{recordString(selected, "performanceTask")}</p><span>성공 기준</span><p>{recordString(selected, "successStandards")}</p></article></section>
          <section className="presentation-stages">
            <div className="presentation-stages-heading"><div><span>LEARNING JOURNEY</span><h3>개념기반 탐구 7단계</h3></div><p>사실에서 출발해 일반화를 만들고 새로운 맥락으로 전이하는 학습의 흐름</p></div>
            <ol>{stages.map((item, index) => <li key={String(item.key || index)}><div className="stage-card-number"><b>{String(index + 1).padStart(2, "0")}</b><span>{["ENGAGE", "FOCUS", "INVESTIGATE", "ORGANIZE", "GENERALIZE", "TRANSFER", "REFLECT"][index]}</span></div><h3>{String(item.title || "").replace(/^[①-⑦]\s/, "")}</h3><p>{String(item.activity || "주요 학생 활동을 확인하세요.")}</p></li>)}</ol>
          </section>
        </article>}
      </>}
    </section>;
  };

  const renderAuction = () => {
    const completedResults = auctionResults.filter((item) =>
      representatives.some((representative) => representative.id === recordString(item, "representativeId")),
    );
    const selectedAuction = representatives.find((item) => item.id === selectedAuctionId);
    const selectedBaseScore = selectedAuction ? representativeBaseScore(selectedAuction) : 0;
    const selectedTokens = Number(auctionDraft.tokens || 0);
    const teamNames = Array.from(new Set(representatives.map((item) => recordString(item, "teamName")).filter(Boolean)));
    const selectedBuyerSpent = auctionResults
      .filter((item) => item.id !== selectedAuctionId && recordString(item, "buyerTeam") === auctionDraft.buyerTeam)
      .reduce((sum, item) => sum + Number(item.tokens || 0), 0);
    const scoreDetailsVisible = adminLoggedIn || Boolean(controls?.scoresRevealed);
    return <section className="page-container auction-status-page">
      <div className="page-hero auction-status-hero"><div><span className="eyebrow">LIVE IDEA AUCTION</span><h1>경매 현황 게시판</h1><p>{scoreDetailsVisible ? "관리자가 세부 결과를 공개했습니다. 낙찰 토큰과 최종 점수를 함께 확인하세요." : "낙찰 현황과 실시간 순위만 공개됩니다. 토큰과 세부 점수는 관리자가 결과를 공개한 뒤 확인할 수 있습니다."}</p></div><div className="auction-live-count"><b>{completedResults.length}</b><span>/ 6개 결과 입력</span><small>{adminLoggedIn ? "관리자 기록 모드" : scoreDetailsVisible ? "세부 결과 공개" : "순위만 공개"}</small></div></div>
      {!auctionReady ? <EmptyState title="대표안 선정을 기다리고 있습니다." text={`현재 ${representatives.length}/6개 모둠의 대표안이 확정되었습니다. 6개가 모두 선정되면 경매 현황이 열립니다.`} action={() => setView("showcase")} actionLabel="대표안 발표 화면" /> : <>
        {!scoreDetailsVisible && <section className="score-hidden-notice"><span>🔒</span><div><b>현재는 순위와 낙찰 모둠만 공개됩니다.</b><p>토큰 수, WHERETO 점수, 최종 점수는 관리자가 최종 결과를 공개한 뒤 표시됩니다.</p></div></section>}
        {scoreDetailsVisible && <section className="auction-formula"><b>모둠 총점 계산</b><span>자기 모둠 발표안 WHERETO 종합점수</span><i>+</i><span>낙찰받은 발표안의 점수 합계</span><small>낙찰 발표안 점수 = 해당 발표안 WHERETO 종합점수 × 낙찰 토큰</small></section>}
        <div className="auction-result-grid">{representatives.map((representative, index) => {
          const result = auctionResults.find((item) => recordString(item, "representativeId") === representative.id);
          const baseScore = representativeBaseScore(representative);
          const tokens = Number(result?.tokens || 0);
          const finalScore = baseScore * tokens;
          const recentlyUpdated = Boolean(result && newAuctionResultIds.includes(result.id));
          const content = <>
            <div className="auction-result-head"><span>{index + 1}</span><div><b>{recordString(representative, "teamName")} 발표안</b><small>{recordString(representative, "ownerName")} 선생님{scoreDetailsVisible ? ` · WHERETO 종합 ${baseScore}점` : ""}</small></div><em className={result ? "sold" : "pending"}>{result ? "낙찰 완료" : "결과 대기"}</em></div>
            {result ? scoreDetailsVisible
              ? <div className="auction-result-live"><p><b>{recordString(representative, "teamName")}</b> 발표안이 <strong>{recordString(result, "buyerTeam")}</strong>에게</p><span><b>{tokens}</b>토큰에 낙찰</span><small>{baseScore}점 × {tokens}토큰 = <strong>{finalScore}점</strong></small></div>
              : <div className="auction-result-live auction-result-hidden"><p><b>{recordString(representative, "teamName")}</b> 발표안이</p><strong>{recordString(result, "buyerTeam")}</strong><span>에게 낙찰되었습니다</span><small>토큰과 세부 점수는 결과 공개 후 확인할 수 있습니다.</small></div>
              : <div className="auction-result-waiting"><span>관리자 입력 대기 중</span><small>발표와 현장 경매가 끝나면 결과가 이곳에 바로 표시됩니다.</small></div>}
          </>;
          return adminLoggedIn
            ? <button className={`auction-result-card admin-selectable ${result ? "completed" : ""} ${recentlyUpdated ? "recently-updated" : ""}`} key={representative.id} onClick={() => openAuctionRecord(representative)}>{content}<span className="admin-edit-hint">{result ? "결과 수정" : "낙찰 결과 입력"} →</span></button>
            : <article className={`auction-result-card ${result ? "completed" : ""} ${recentlyUpdated ? "recently-updated" : ""}`} key={representative.id}>{content}</article>;
        })}</div>
        <section className="scoreboard-panel"><div className="section-heading"><span className="eyebrow">{scoreDetailsVisible ? "SCORE REVEALED" : "LIVE RANKING"}</span><h2>{scoreDetailsVisible ? "모둠 최종 순위와 점수" : "실시간 모둠 순위"}</h2><p>{scoreDetailsVisible ? "자기 모둠 발표안 점수와 낙찰받은 발표안 점수를 합산한 결과입니다." : "점수와 토큰은 가리고 현재 순위만 보여줍니다. 관리자가 결과를 공개하면 세부 점수가 표시됩니다."}</p></div><div className={`scoreboard-table ${scoreDetailsVisible ? "" : "rank-only"}`}>{teamStandings.map((team, index) => {
          const movement = Number(rankChanges[team.teamName] || 0);
          return <article className={team.teamName === draft.profile.teamName ? "my-team" : ""} key={team.teamName}><span className="score-rank">{index + 1}</span><div className="score-team"><b>{team.teamName}</b><small>{team.teamName === draft.profile.teamName ? "나의 모둠" : "현재 순위"}</small></div>{!scoreDetailsVisible && <span className={`rank-movement ${movement > 0 ? "up" : movement < 0 ? "down" : "steady"}`}>{movement > 0 ? `▲ ${movement}단계` : movement < 0 ? `▼ ${Math.abs(movement)}단계` : "변동 없음"}</span>}{scoreDetailsVisible && <><div><small>자기 발표안</small><b>{team.ownScore}</b></div><i>+</i><div><small>낙찰 점수</small><b>{team.purchaseScore}</b></div><strong>{team.total}<small>점</small></strong><div className="token-remaining"><small>토큰</small><b>{team.tokensSpent}/7</b></div></>}</article>;
        })}</div></section>
      </>}
      {adminLoggedIn && selectedAuction && <div className="prompt-backdrop" onMouseDown={() => setSelectedAuctionId("")}><section className="auction-admin-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedAuctionId("")}>×</button><span className="eyebrow">AUCTION RESULT ENTRY</span><h2>{recordString(selectedAuction, "teamName")} 대표 교수학습설계안</h2><p className="auction-modal-lead">발표 내용을 확인한 뒤 낙찰 모둠과 토큰을 입력하세요. 저장 즉시 참여자 게시판이 갱신됩니다.</p>
        <div className="auction-detail-grid">
          <article><span>1</span><div><b>최종 선정 학습 목표</b><p>{recordString(selectedAuction, "selectedGoal")}</p></div></article>
          <article><span>2</span><div><b>개념적 렌즈 · 선정 이유</b><h3>{recordString(selectedAuction, "lens")}</h3><p>{recordString(selectedAuction, "lensReason") || "선정 이유가 입력되지 않았습니다."}</p></div></article>
          <article><span>3</span><div><b>일반화</b><p>① {recordString(selectedAuction, "generalization1")}</p><p>② {recordString(selectedAuction, "generalization2")}</p></div></article>
          <article><span>4</span><div><b>세 종류의 안내질문</b><p><strong>사실적</strong> {recordString(selectedAuction, "factualQuestion")}</p><p><strong>개념적</strong> {recordString(selectedAuction, "conceptualQuestion")}</p><p><strong>논쟁적</strong> {recordString(selectedAuction, "debatableQuestion")}</p></div></article>
          <article><span>5</span><div><b>GRASPS</b><p>{recordString(selectedAuction, "performanceTask")}</p></div></article>
          <article><span>6</span><div><b>1인칭 상황 시나리오</b><p>{recordString(selectedAuction, "scenario") || recordString(selectedAuction, "performanceTask")}</p></div></article>
        </div>
        <section className="auction-entry-panel"><div className="auction-base-score"><small>WHERETO 종합점수</small><b>{selectedBaseScore}점</b><span>자가점검 + 동료평가 합계</span></div><div><label>낙찰 모둠</label><div className="team-choice-grid">{teamNames.filter((team) => team !== recordString(selectedAuction, "teamName")).map((team) => <button className={auctionDraft.buyerTeam === team ? "selected" : ""} key={team} onClick={() => setAuctionDraft((current) => ({ ...current, buyerTeam: team }))}>{team}</button>)}</div></div><label>낙찰 토큰<input type="number" min="1" max="7" step="1" value={auctionDraft.tokens} onChange={(event) => setAuctionDraft((current) => ({ ...current, tokens: event.target.value }))} placeholder="1~7" /></label><div className="auction-calculation"><span>{selectedBaseScore}점 × {selectedTokens || 0}토큰</span><b>{selectedBaseScore * selectedTokens}점</b><small>{auctionDraft.buyerTeam ? `${auctionDraft.buyerTeam} 사용 예정 ${selectedBuyerSpent + selectedTokens}/7토큰` : "낙찰 모둠을 선택하세요."}</small></div><button className="primary-btn" onClick={saveAuctionResult}>낙찰 결과 저장·실시간 반영</button></section>
      </section></div>}
    </section>;
  };

  const reportSections = [
    ["01 성취기준과 목표", <><h3>성취기준</h3><p>{draft.goal.standard}</p><h3>최종 학습 목표</h3><p>{draft.goal.selectedGoal}</p><h3>목표 재설계 점검</h3><p>{draft.goal.transferCheck}</p></>],
    ["02 개념적 렌즈·일반화·안내 질문", <><h3>개념적 렌즈</h3><p>{draft.lens.selected} — {draft.lens.reason}</p><h3>관련 개념</h3><p>{draft.concept.related}</p><h3>일반화</h3><ol><li>{draft.concept.generalization1}</li><li>{draft.concept.generalization2}</li></ol><h3>사실적 질문</h3><p>{draft.concept.factual}</p><h3>개념적 질문</h3><p>{draft.concept.conceptual}</p><h3>논쟁적 질문</h3><p>{draft.concept.debatable}</p></>],
    ["03 GRASPS 수행과제", <><div className="report-grasps"><b>G</b><p>{draft.grasps.goal}</p><b>R</b><p>{draft.grasps.role}</p><b>A</b><p>{draft.grasps.audience}</p><b>S</b><p>{draft.grasps.situation}</p><b>P</b><p>{draft.grasps.product}</p><b>S</b><p>{draft.grasps.standards}</p></div><h3>학생용 시나리오</h3><p>{draft.grasps.scenario}</p></>],
  ];

  const renderReport = () => (
    <section className="report-page">
      <div className="report-toolbar no-print"><button className="secondary-btn" onClick={() => setView("design")}>← 설계안 수정</button><div><a className="secondary-btn" href={store?.config.padletUrl || "#"} target={store?.config.padletUrl ? "_blank" : undefined} onClick={(event) => { if (!store?.config.padletUrl) { event.preventDefault(); showToast("firebase-config.js에 패들렛 주소를 입력해 주세요."); } }}>패들렛 열기 ↗</a><button className="primary-btn" onClick={() => window.print()}>PDF로 저장</button></div></div>
      <article className="print-report">
        <header className="report-cover"><span>CONCEPT STUDIO · FINAL LESSON DESIGN</span><h1>{draft.tools.finalTitle || "개념 기반 교수학습 설계안"}</h1><p>{draft.profile.name} · {draft.profile.teamName} · {draft.profile.subject}</p><div><span>{draft.goal.grade}</span><span>{draft.goal.unit}</span><span>개념적 렌즈 · {draft.lens.selected}</span></div></header>
        {reportSections.map(([title, content]) => <section className="report-section" key={String(title)}><h2>{title}</h2><div>{content}</div></section>)}
        <section className="report-section"><h2>04 4수준 분석적 평가 루브릭</h2><div className="table-scroll"><table className="report-table"><thead><tr><th>평가 준거</th><th>4 매우 우수</th><th>3 우수</th><th>2 보통</th><th>1 노력 요함</th></tr></thead><tbody>{draft.grasps.rubric.map((row) => <tr key={row.criterion}><th>{row.criterion}</th><td>{row.level4}</td><td>{row.level3}</td><td>{row.level2}</td><td>{row.level1}</td></tr>)}</tbody></table></div></section>
        <section className="report-section"><h2>05 개념 기반 탐구 7단계</h2><div className="table-scroll"><table className="report-table inquiry"><thead><tr><th>단계</th><th>주요 학생 활동</th><th>핵심 탐구 전략</th></tr></thead><tbody>{draft.inquiry.stages.map((item) => <tr key={item.key}><th>{item.title}</th><td>{item.activity}</td><td>{item.strategy}</td></tr>)}</tbody></table></div><h3>WHERETO 자기점검</h3><div className="report-whereto">{WHERETO.map(([key, , korean]) => { const check = draft.inquiry.whereto[key]; return <div key={key}><b>{key} · {korean} · {check.score}점</b><p>{check.score === 0 ? "해당 없음" : check.evidence}</p></div>; })}</div></section>
        <section className="report-section"><h2>06 AI·디지털 기능과 플랜 B</h2><div className="report-tools">{draft.tools.plans.map((plan) => <article key={plan.feature}><h3>{plan.feature}</h3><b>추천 이유</b><p>{plan.reason}</p><b>도구 예시</b><p>{plan.examples}</p><b>활용 계획</b><p>{plan.plan}</p><b>아날로그 플랜 B</b><p>{plan.planB}</p></article>)}</div></section>
        <footer className="report-footer">개념 기반 교수학습 설계 워크숍 · {new Date().toLocaleDateString("ko-KR")}</footer>
      </article>
    </section>
  );

  const leaveAdminForParticipant = async () => {
    try {
      await store?.logoutAdmin();
      setAdminLoggedIn(false);
      setSaveState("idle");
      setView("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Admin logout failed.", error);
      showToast("참여자 화면 전환에 실패했습니다. 페이지를 새로고침해 주세요.");
    }
  };

  const renderAdmin = () => {
    const participantCount = adminRecords.length;
    const teamCount = new Set(adminRecords.map((item) => recordString(item, "teamName"))).size;
    const inquirySubmitted = teamDesigns.filter((item) => hasInquirySubmission(item)).length;
    const adminReviewsOpen = controls ? Boolean(controls.reviewsOpen) : true;
    const scoresRevealed = Boolean(controls?.scoresRevealed);
    if (!adminLoggedIn) return <section className="admin-login-page"><form className="admin-login-card" onSubmit={loginAdmin}><span className="brand-mark">C</span><span className="eyebrow">INSTRUCTOR CONTROL</span><h1>강사 관제실</h1><p>연수 진행 상태, 개인 설계 제출, 동료평가와 모둠 대표안을 확인합니다.</p><label>강사 이메일<input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder={store?.config.adminEmail || "teacher@example.com"} /></label><label>비밀번호<input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder={store?.mode === "local" ? "데모 비밀번호 1234" : "Firebase 강사 계정 비밀번호"} /></label><button className="primary-btn full" disabled={busy}>{busy ? "확인 중..." : "관제실 입장"}</button></form></section>;
    return <section className="page-container admin-page"><div className="page-hero admin-hero"><div><span className="eyebrow">INSTRUCTOR CONTROL</span><h1>강사 관제실</h1><p>개인 설계 제출, 모둠별 상호평가, 대표안 선정과 경매 결과를 관리합니다.</p></div><div className="admin-hero-actions"><button className="secondary-btn" onClick={leaveAdminForParticipant}>참여자 화면으로</button><button className="secondary-btn" onClick={async () => { await store?.logoutAdmin(); setAdminLoggedIn(false); }}>로그아웃</button></div></div>
      <div className="admin-stats"><article><small>참여자</small><b>{participantCount}</b><span>명</span></article><article><small>모둠</small><b>{teamCount}</b><span>개</span></article><article><small>Step 5 제출</small><b>{inquirySubmitted}</b><span>명</span></article><article><small>동료평가</small><b>{reviews.length}</b><span>건</span></article><article><small>대표안</small><b>{representatives.length}</b><span>/6</span></article><article><small>낙찰 결과</small><b>{auctionResults.length}</b><span>/6</span></article></div>
      <section className="control-panel"><div><span className="eyebrow">LIVE CONTROL</span><h2>평가·경매 진행 제어</h2><p>관리자의 변경 사항은 참여자 화면에 즉시 반영됩니다.</p></div><div className="control-buttons"><button className={adminReviewsOpen ? "on" : ""} onClick={() => saveControls({ reviewsOpen: !adminReviewsOpen })}><span>WHERETO 평가</span><b>{adminReviewsOpen ? "진행 중" : "마감"}</b></button><button className={auctionReady ? "reveal" : ""} disabled={!auctionReady} onClick={() => setView("auction")}><span>경매 현황</span><b>{auctionReady ? "관리자 입력 화면 열기" : `대표안 ${representatives.length}/6`}</b></button><button className={scoresRevealed ? "on" : ""} disabled={!auctionReady} onClick={() => saveControls({ scoresRevealed: !scoresRevealed })}><span>참여자 세부 점수</span><b>{scoresRevealed ? "공개 중 · 다시 숨기기" : "최종 결과 공개"}</b></button></div></section>
      <section className="control-panel"><div><span className="eyebrow">SAFE TEST MODE</span><h2>경매 기능 빠른 테스트</h2><p>실제 참여자 자료와 분리된 6개 모둠 대표안을 생성합니다. 테스트가 끝나면 테스트 자료만 한 번에 삭제할 수 있습니다.</p></div><div className="control-buttons"><button className="reveal" disabled={busy} onClick={createAuctionTestData}><span>테스트 데이터</span><b>{busy ? "처리 중..." : "6모둠 생성"}</b></button><button disabled={busy || !representatives.some((item) => Boolean(item.isTestData))} onClick={deleteAuctionTestData}><span>테스트 종료</span><b>데이터 삭제</b></button></div></section>
      <div className="admin-grid"><section className="admin-panel"><div className="panel-heading"><h2>참여자·설계 진행</h2><button className="mini-btn" onClick={refreshAdmin}>새로고침</button></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>이름</th><th>교과군</th><th>교과</th><th>현재 단계</th><th>완성</th></tr></thead><tbody>{adminRecords.map((item) => { const design = teamDesigns.find((d) => d.id === item.id); return <tr key={item.id}><td>{recordString(item, "name")}</td><td>{recordString(item, "teamName")}</td><td>{recordString(item, "subject")}</td><td>Step {Number(design?.currentStep ?? 0) + 1}</td><td>{design?.completed ? "완료" : "진행 중"}</td></tr>})}</tbody></table></div></section>
      <section className="admin-panel"><div className="panel-heading"><h2>모둠 대표안</h2><button className="mini-btn" onClick={() => setView("showcase")}>한 장 발표 화면</button></div><div className="admin-ranking">{representatives.length ? representatives.map((item, index) => <article key={item.id}><span>{index + 1}</span><div><b>{recordString(item, "title")}</b><small>{recordString(item, "teamName")} · {recordString(item, "ownerName")}</small></div><strong>{representativeBaseScore(item)}<small>종합점</small></strong></article>) : <p className="empty-line">아직 확정된 대표안이 없습니다.</p>}</div></section></div>
    </section>;
  };

  const navTo = (target: View) => {
    if ((target === "design" || target === "team" || target === "showcase" || target === "auction" || target === "report") && !registered) {
      setView("home");
      showToast("먼저 이름과 모둠 정보를 입력해 주세요.");
      return;
    }
    if (target === "auction" && !auctionReady) {
      showToast(`6개 모둠 대표안이 모두 선정되면 경매 현황이 열립니다. 현재 ${representatives.length}/6개입니다.`);
      return;
    }
    setView(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className={`app-shell view-${view} ${presentationMode ? "presentation-mode" : ""} ${adminLoggedIn ? "admin-mode" : ""}`}>
      <header className="topbar no-print">
        <button className="brand" onClick={() => adminLoggedIn ? void leaveAdminForParticipant() : navTo("home")} aria-label="홈"><span className="brand-mark">C</span><span><b>Concept Studio</b><small>개념 기반 교수학습 설계</small></span></button>
        {adminLoggedIn && <span className="admin-mode-badge">관리자 모드</span>}
        <nav aria-label="주요 메뉴">
          <button className={`nav-link ${view === "design" ? "active" : ""}`} onClick={() => navTo("design")}>설계하기</button>
          <button className={`nav-link ${view === "team" ? "active" : ""}`} onClick={() => navTo("team")}>모둠평가</button>
          <button className={`nav-link ${view === "showcase" ? "active" : ""}`} onClick={() => navTo("showcase")}>대표안 발표</button>
          {auctionReady && <button className={`nav-link live ${view === "auction" ? "active" : ""}`} onClick={() => navTo("auction")}>경매 현황 <span>LIVE</span></button>}
          <button className={`nav-link ${view === "report" ? "active" : ""}`} onClick={() => navTo("report")}>최종 설계안</button>
          <button className={`nav-link ${view === "admin" ? "active" : ""}`} onClick={() => navTo("admin")}>강사 관제실</button>
        </nav>
        <button className="header-action" onClick={openDesign}>{registered ? `Step ${step + 1} 계속` : "설계 시작"}</button>
      </header>

      {view === "home" && renderHome()}
      {view === "design" && renderDesign()}
      {view === "team" && renderTeam()}
      {view === "showcase" && renderShowcase()}
      {view === "auction" && renderAuction()}
      {view === "report" && renderReport()}
      {view === "admin" && renderAdmin()}

      {promptKey && <div className="prompt-backdrop" onMouseDown={() => setPromptKey(null)}><section className="prompt-drawer" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setPromptKey(null)}>×</button><span className="eyebrow">AI WRITING SUPPORT</span><h2>{PROMPTS[promptKey].title}</h2><p>{PROMPTS[promptKey].description}</p><pre>{PROMPTS[promptKey].text}</pre><div className="prompt-actions"><a className="secondary-btn" href={store?.config.aiUrl || "https://chatgpt.com/"} target="_blank">ChatGPT 열기 ↗</a><button className="primary-btn" onClick={copyPrompt}>프롬프트 복사</button></div></section></div>}
      {teamReadyPopup && <div className="prompt-backdrop"><section className="ready-popup"><span className="ready-icon">✓</span><span className="eyebrow">모둠 제출 완료</span><h2>세 명의 설계안이 모두 도착했습니다.</h2><p>AI·디지털 기능 작성을 잠시 멈추고, 아래에서 두 모둠원의 설계안을 각각 확인한 뒤 WHERETO 점수를 부여해 주세요.</p><button className="primary-btn" onClick={() => { setTeamReadyPopup(false); window.scrollTo({ top: 620, behavior: "smooth" }); }}>WHERETO 동료평가 시작</button></section></div>}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function EmptyState({ title, text, action, actionLabel }: { title: string; text: string; action: () => void; actionLabel: string }) {
  return <section className="empty-state"><span>◇</span><h2>{title}</h2><p>{text}</p><button className="primary-btn" onClick={action}>{actionLabel}</button></section>;
}
