// Cloud sync backed by Cloud Firestore. Each user's whole app state lives in
// one document at `userState/{uid}`. We push local changes up (debounced) and
// listen for changes from other devices in real time, so the same account
// stays in sync everywhere. Falls back to no-op when Firebase isn't configured
// or nobody is signed in.
//
// Conflict strategy — last-write-wins by a client clock:
// Every local edit stamps a monotonically-increasing `clientUpdatedAt` (ms),
// persisted in localStorage so it survives refreshes. On load we compare the
// cloud's clock with ours and the NEWER side wins wholesale. This makes
// deletions stick (a delete is just a newer local state) while never losing a
// fresh local edit to a stale cloud copy.
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

// ── Client clock (last local change) ───────────────────────────────
// Keyed per-account so switching/logging into a different account on the same
// device starts from that account's own clock (0 ⇒ adopt cloud), instead of
// inheriting the previous account's clock and clobbering its data.
const CLOCK_KEY = "monkmode-sync-clock";

function clockKey(): string {
  const uid = auth?.currentUser?.uid;
  return uid ? `${CLOCK_KEY}:${uid}` : CLOCK_KEY;
}

function getClock(): number {
  try {
    return Number(localStorage.getItem(clockKey())) || 0;
  } catch {
    return 0;
  }
}

function setClock(ts: number): void {
  try {
    localStorage.setItem(clockKey(), String(ts));
  } catch {
    /* storage unavailable */
  }
}

function cloudClock(data: DocumentData | undefined): number {
  return Number(data?.clientUpdatedAt) || 0;
}

function userDocRef() {
  const uid = auth?.currentUser?.uid;
  if (!isFirebaseConfigured || !uid) return null;
  return doc(db, "userState", uid);
}

function writePayload(): DocumentData {
  return {
    ...snapshotState(),
    clientUpdatedAt: getClock(),
    updatedAt: serverTimestamp(),
  };
}

// ── Manual push/pull (used by the "Sync now" / toggle buttons) ─────

/** Push the full local state to the cloud (this device wins). */
export async function pushState(): Promise<void> {
  const ref = userDocRef();
  if (!ref) throw new Error("Not signed in — can't sync.");
  setClock(Date.now());
  await setDoc(ref, writePayload());
}

/** Pull cloud state into the store. Returns true if a snapshot existed. */
export async function pullState(): Promise<boolean> {
  const ref = userDocRef();
  if (!ref) throw new Error("Not signed in — can't sync.");
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  applyRemote(snap.data());
  setClock(cloudClock(snap.data()));
  return true;
}

// ── Real-time auto-sync lifecycle ──────────────────────────────────

let unsubDoc: (() => void) | null = null;
let unsubStore: (() => void) | null = null;
let applyingRemote = false;
let writeTimer: ReturnType<typeof setTimeout> | null = null;
let writePending = false;

function applyRemote(data: DocumentData | undefined) {
  if (!data) return;
  applyingRemote = true;
  try {
    useStore.getState().importData(data as Record<string, unknown>);
  } finally {
    applyingRemote = false;
  }
}

function flushWrite() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = null;
  if (!writePending) return;
  writePending = false;
  const ref = userDocRef();
  if (!ref) return;
  setDoc(ref, writePayload()).catch(() => {
    /* offline cache will retry when back online */
  });
}

function scheduleWrite() {
  if (applyingRemote) return; // don't echo / re-stamp a change we just received
  const ref = userDocRef();
  if (!ref) return;
  setClock(Date.now()); // a genuine local edit — advance our clock
  writePending = true;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(flushWrite, 700);
}

// Push any pending edit up immediately when the tab is hidden or closed, so a
// refresh right after adding a task can't lose it inside the debounce window.
function flushOnHide() {
  if (document.visibilityState === "hidden") flushWrite();
}

/**
 * Begin syncing the signed-in user's data. On first connect it loads cloud
 * data only if the cloud is newer than this device (last-write-wins); a brand
 * new account is seeded from local. Then it keeps local ⇄ cloud mirrored live.
 */
export async function startCloudSync(): Promise<void> {
  const ref = userDocRef();
  if (!ref) return;
  stopCloudSync();

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      // Brand-new account — seed the cloud from this device.
      await setDoc(ref, writePayload());
    } else if (cloudClock(snap.data()) >= getClock()) {
      // Cloud is newer (or equal) — adopt it.
      applyRemote(snap.data());
      setClock(cloudClock(snap.data()));
    } else {
      // This device is newer — push our state up.
      await setDoc(ref, writePayload());
    }
  } catch {
    /* offline — the listener below will catch up later */
  }

  // Live updates from other devices: skip our own pending writes, and only
  // adopt a snapshot that is genuinely newer than our current state.
  unsubDoc = onSnapshot(ref, (snap) => {
    if (snap.metadata.hasPendingWrites || !snap.exists()) return;
    if (cloudClock(snap.data()) <= getClock()) return;
    applyRemote(snap.data());
    setClock(cloudClock(snap.data()));
  });

  // Push local edits up, debounced.
  unsubStore = useStore.subscribe(() => scheduleWrite());

  // Safety net: flush pending edits before the tab is hidden/closed.
  document.addEventListener("visibilitychange", flushOnHide);
  window.addEventListener("pagehide", flushWrite);
}

/** Stop syncing (called on logout). */
export function stopCloudSync(): void {
  flushWrite(); // don't drop a pending edit when tearing down
  if (unsubDoc) unsubDoc();
  if (unsubStore) unsubStore();
  if (writeTimer) clearTimeout(writeTimer);
  document.removeEventListener("visibilitychange", flushOnHide);
  window.removeEventListener("pagehide", flushWrite);
  unsubDoc = null;
  unsubStore = null;
  writeTimer = null;
}
