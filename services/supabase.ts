import { getRaw, setRaw, removeRaw } from "./storage";

const SUPABASE_URL = "https://gyrzdjfbdjepxszuwisk.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cnpkamZiZGplcHhzenV3aXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzcwODgsImV4cCI6MjA5NzExMzA4OH0.z5i9P4uZuc1SXo2OI_zlMPoRsKY4rq9DiLnbKZdiaFw";
const SB_AUTH_KEY = "fin_sb_session";

export async function sbSession() {
  const raw = await getRaw(SB_AUTH_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function sbSetSession(session: unknown) {
  if (session) await setRaw(SB_AUTH_KEY, JSON.stringify(session));
  else await removeRaw(SB_AUTH_KEY);
}

export async function sbSignIn(email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || data.error_description || data.error || "登入失敗");
  await sbSetSession({ access_token: data.access_token, refresh_token: data.refresh_token, uid: data.user?.id, email });
  return true;
}

export async function sbSignOut() {
  await sbSetSession(null);
}

export async function sbFetch(path: string, opts: RequestInit = {}) {
  const session = await sbSession();
  const headers = {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${session?.access_token || SUPABASE_ANON}`,
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  return fetch(`${SUPABASE_URL}${path}`, { ...opts, headers });
}

export async function sbPush(encBlob: string) {
  const session = await sbSession();
  if (!session?.uid) throw new Error("尚未登入");
  const res = await sbFetch("/rest/v1/fin_data?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([{ id: session.uid, enc: encBlob, updated_at: new Date().toISOString() }]),
  });
  if (!res.ok) throw new Error(`上傳失敗：${(await res.text()).slice(0, 80)}`);
  return true;
}

export async function sbPull() {
  const session = await sbSession();
  if (!session?.uid) throw new Error("尚未登入");
  const res = await sbFetch(`/rest/v1/fin_data?id=eq.${session.uid}&select=enc`);
  if (!res.ok) throw new Error(`下載失敗：${(await res.text()).slice(0, 80)}`);
  const rows = await res.json();
  return rows?.[0]?.enc || null;
}
