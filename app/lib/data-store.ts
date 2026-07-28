import { getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
  type Firestore,
} from "firebase/firestore";

export type PlainRecord = Record<string, unknown>;

export type AppConfig = {
  firebase?: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
  adminEmail?: string;
  demoAdminPassword?: string;
  sessionId?: string;
  sessionTitle?: string;
  padletUrl?: string;
  aiUrl?: string;
};

declare global {
  interface Window {
    APP_CONFIG?: AppConfig;
  }
}

export interface DataStore {
  mode: "firebase" | "local";
  config: AppConfig;
  uid(): string;
  set(collectionName: string, id: string, value: PlainRecord): Promise<void>;
  remove(collectionName: string, id: string): Promise<void>;
  all(collectionName: string): Promise<Array<PlainRecord & { id: string }>>;
  subscribe(collectionName: string, onChange: (records: Array<PlainRecord & { id: string }>) => void): () => void;
  loginAdmin(email: string, password: string): Promise<void>;
  logoutAdmin(): Promise<void>;
}

const LOCAL_DB_KEY = "concept_studio_shared_demo_v1";
const LOCAL_UID_KEY = "concept_studio_uid_v1";

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function readLocalDb(): Record<string, Record<string, PlainRecord>> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_DB_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLocalDb(db: Record<string, Record<string, PlainRecord>>) {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
}

class LocalStore implements DataStore {
  mode = "local" as const;
  config: AppConfig;
  private localUid: string;

  constructor(config: AppConfig) {
    this.config = config;
    this.localUid = localStorage.getItem(LOCAL_UID_KEY) || makeId();
    localStorage.setItem(LOCAL_UID_KEY, this.localUid);
  }

  uid() {
    return this.localUid;
  }

  async set(collectionName: string, id: string, value: PlainRecord) {
    const db = readLocalDb();
    db[collectionName] ||= {};
    db[collectionName][id] = { ...(db[collectionName][id] || {}), ...value };
    writeLocalDb(db);
    window.dispatchEvent(new Event("concept-store-change"));
  }

  async remove(collectionName: string, id: string) {
    const db = readLocalDb();
    if (db[collectionName]) {
      delete db[collectionName][id];
      writeLocalDb(db);
      window.dispatchEvent(new Event("concept-store-change"));
    }
  }

  async all(collectionName: string) {
    const group = readLocalDb()[collectionName] || {};
    return Object.entries(group).map(([id, value]) => ({ id, ...value }));
  }

  subscribe(collectionName: string, onChange: (records: Array<PlainRecord & { id: string }>) => void) {
    const emit = () => {
      void this.all(collectionName).then(onChange);
    };
    emit();
    window.addEventListener("concept-store-change", emit);
    return () => window.removeEventListener("concept-store-change", emit);
  }

  async loginAdmin(_email: string, password: string) {
    if (password !== (this.config.demoAdminPassword || "1234")) {
      throw new Error("강사 비밀번호가 올바르지 않습니다.");
    }
  }

  async logoutAdmin() {}
}

class FirebaseStore implements DataStore {
  mode = "firebase" as const;
  config: AppConfig;
  private db: Firestore;
  private auth: ReturnType<typeof getAuth>;
  private participantDb: Firestore;
  private participantAuth: ReturnType<typeof getAuth>;
  private anonymousUid = "";
  private adminAuth: ReturnType<typeof getAuth> | null = null;

  constructor(config: AppConfig, db: Firestore, auth: ReturnType<typeof getAuth>, uid: string) {
    this.config = config;
    this.db = db;
    this.auth = auth;
    this.participantDb = db;
    this.participantAuth = auth;
    this.anonymousUid = uid;
  }

  uid() {
    return this.auth.currentUser?.uid || this.anonymousUid;
  }

  async set(collectionName: string, id: string, value: PlainRecord) {
    await setDoc(doc(this.db, collectionName, id), value, { merge: true });
  }

  async remove(collectionName: string, id: string) {
    await deleteDoc(doc(this.db, collectionName, id));
  }

  async all(collectionName: string) {
    const snapshot = await getDocs(collection(this.db, collectionName));
    return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as PlainRecord) }));
  }

  subscribe(collectionName: string, onChange: (records: Array<PlainRecord & { id: string }>) => void) {
    return onSnapshot(collection(this.db, collectionName), (snapshot) => {
      onChange(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as PlainRecord) })));
    }, (error) => {
      console.error(`Realtime subscription failed for ${collectionName}.`, error);
    });
  }

  async loginAdmin(email: string, password: string) {
    try {
      const firebase = this.config.firebase || {};
      const adminApp = getApps().find((app) => app.name === "concept-studio-admin")
        || initializeApp(firebase, "concept-studio-admin");
      const adminAuth = getAuth(adminApp);
      await signInWithEmailAndPassword(adminAuth, email, password);
      this.adminAuth = adminAuth;
      this.auth = adminAuth;
      this.db = getFirestore(adminApp);
    } catch (error) {
      // Firebase Console에서 강사 계정을 만들기 전에는 계정을 자동 생성하지 않습니다.
      // 아래 분기는 개발 중 명확한 오류 전달을 위한 것입니다.
      if (String(error).includes("auth/user-not-found")) {
        throw new Error("Firebase Authentication에 강사 계정을 먼저 만들어 주세요.");
      }
      throw error;
    }
  }

  async logoutAdmin() {
    if (this.adminAuth?.currentUser) await signOut(this.adminAuth);
    this.adminAuth = null;
    this.auth = this.participantAuth;
    this.db = this.participantDb;
    this.anonymousUid = this.participantAuth.currentUser?.uid || this.anonymousUid;
  }
}

export async function createDataStore(): Promise<DataStore> {
  const config = window.APP_CONFIG || {};
  const firebase = config.firebase || {};
  const configured = Boolean(firebase.apiKey && firebase.projectId && firebase.appId);
  if (!configured) return new LocalStore(config);

  try {
    const app = getApps().find((item) => item.name === "[DEFAULT]") || initializeApp(firebase);
    const auth = getAuth(app);
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      await signOut(auth);
    }
    const credential = auth.currentUser ? { user: auth.currentUser } : await signInAnonymously(auth);
    const db = getFirestore(app);
    return new FirebaseStore(config, db, auth, credential.user.uid);
  } catch (error) {
    console.error("Firebase initialization failed; using local mode.", error);
    return new LocalStore(config);
  }
}

export async function createAdminAccountForSetup(
  email: string,
  password: string,
  config: AppConfig,
) {
  const firebase = config.firebase || {};
  const app = getApps()[0] || initializeApp(firebase);
  return createUserWithEmailAndPassword(getAuth(app), email, password);
}
