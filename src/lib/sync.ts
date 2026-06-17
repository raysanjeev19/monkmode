// Cloud sync backed by Cloud Firestore. Each user's whole app state lives in
// one document at `userState/{uid}`. We push local changes up (debounced) and
// listen for changes from other devices in real time, so the same account
// stays in sync everywhere. Falls back to no-op when Firebase isn't configured
// or nobody is signed in.
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { useStore } from "../store/useStore";

// State slices that are mirrored to the cloud (same shape as Export/Import).
const SLICES = [
  "profile",
  "items",
  "goals",
  "habits",
  "journal",
  "weight",
  "water",
] as const;

function snapshotState(): DocumentData {
  const s = useStore.getState() as unknown as Record<string, unknown>;
  const out: DocumentData = {};
  for (const k of SLICES) out[k] = s[k];
  return out;
}

function userDocRef() {
  const uid = auth?.currentUser?.uid;
  if (!isFirebaseConfigured || !uid) return null;
  return doc(db, "userState", uid);
}

// ── Manual push/pull (used by the "Sync now" button) ───────────────

/** Push the full local state to the cloud. */
export async function pushState(): Promise<void> {
  const ref = userDocRef();
  if (!ref) throw new Error("Not signed in — can't sync.");
  await setDoc(ref, { ...snapshotState(), updatedAt: serverTimestamp() });
}

/** Pull cloud state into the store. Returns true if a snapshot existed. */
export async function pullState(): Promise<boolean> {
  const ref = userDocRef();
  if (!ref) throw new Error("Not signed in — can't sync.");
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  applyRemote(snap.data());
  return true;
}

// ── Real-time auto-sync lifecycle ──────────────────────────────────

let unsubDoc: (() => void) | null = null;
let unsubStore: (() => void) | null = null;
let applyingRemote = false;
let writeTimer: ReturnType<typeof setTimeout> | null = null;

function applyRemote(data: DocumentData | undefined) {
  if (!data) return;
  applyingRemote = true;
  try {
    useStore.getState().importData(data as Record<string, unknown>);
  } finally {
    applyingRemote = false;
  }
}

function scheduleWrite() {
  if (applyingRemote) return; // don't echo a change we just received
  const ref = userDocRef();
  if (!ref) return;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    setDoc(ref, { ...snapshotState(), updatedAt: serverTimestamp() }).catch(() => {
      /* offline cache will retry when back online */
    });
  }, 700);
}

/**
 * Begin syncing the signed-in user's data. On first connect it loads any
 * existing cloud data (or seeds the cloud from local for brand-new accounts),
 * then keeps local ⇄ cloud mirrored live.
 */
export async function startCloudSync(): Promise<void> {
  const ref = userDocRef();
  if (!ref) return;
  stopCloudSync();

  // 1. Hydrate from cloud, or seed the cloud if this account has no data yet.
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) applyRemote(snap.data());
    else await setDoc(ref, { ...snapshotState(), updatedAt: serverTimestamp() });
  } catch {
    /* offline — the listener below will catch up later */
  }

  // 2. Live updates from other devices (skip our own pending writes).
  unsubDoc = onSnapshot(ref, (snap) => {
    if (snap.metadata.hasPendingWrites || !snap.exists()) return;
    applyRemote(snap.data());
  });

  // 3. Push local edits up, debounced.
  unsubStore = useStore.subscribe(() => scheduleWrite());
}

/** Stop syncing (called on logout). */
export function stopCloudSync(): void {
  if (unsubDoc) unsubDoc();
  if (unsubStore) unsubStore();
  if (writeTimer) clearTimeout(writeTimer);
  unsubDoc = null;
  unsubStore = null;
  writeTimer = null;
}
