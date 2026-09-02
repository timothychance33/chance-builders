import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

export default supabase;

// ── Auth ──────────────────────────────────────────────────────────────────
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const onAuthChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return subscription;
};

// ── Projects ──────────────────────────────────────────────────────────────
export const loadProjects = async () => {
  const { data, error } = await supabase.from('projects').select('*').order('created_at');
  if (error) throw error;
  return data.map(row => ({ id: row.id, ...row.data }));
};

export const saveProject = async (project) => {
  const { id, ...data } = project;
  const { error } = await supabase.from('projects').upsert({ id, data }, { onConflict: 'id' });
  if (error) throw error;
};

export const deleteProject = async (id) => {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
};

// ── Contractors ───────────────────────────────────────────────────────────
export const loadContractors = async () => {
  const { data, error } = await supabase.from('contractors').select('*').order('created_at');
  if (error) throw error;
  return data.map(row => ({ id: row.id, ...row.data }));
};

export const saveContractor = async (contractor) => {
  const { id, ...data } = contractor;
  const { error } = await supabase.from('contractors').upsert({ id, data }, { onConflict: 'id' });
  if (error) throw error;
};

export const deleteContractor = async (id) => {
  const { error } = await supabase.from('contractors').delete().eq('id', id);
  if (error) throw error;
};

// ── Client Portal (public - no auth needed) ───────────────────────────────
export const loadProjectByPin = async (pin) => {
  const { data, error } = await supabase.from('projects').select('*');
  if (error) throw error;
  const match = data.find(row => row.data?.clientPin === pin.toUpperCase());
  if (!match) return null;
  return { id: match.id, ...match.data };
};

// ── Payment receipts (private bucket `job-receipts`) ──────────────────────
const RECEIPTS_BUCKET = 'job-receipts';
const SIGNED_URL_TTL = 3600;
const uid = () => Math.random().toString(36).slice(2, 9);

/** Strip path separators and unsafe characters from an original filename. */
export const sanitizeFilename = (name) => {
  const base = String(name || 'receipt').split(/[/\\]/).pop() || 'receipt';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^\.+/, '');
  return cleaned || 'receipt';
};

const uniqueStoredName = (originalName, mime) => {
  const safe = sanitizeFilename(originalName);
  const unique = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : uid();
  const dot = safe.lastIndexOf('.');
  if (dot > 0) return `${safe.slice(0, dot)}_${unique}${safe.slice(dot)}`;
  const ext = mime === 'application/pdf' ? '.pdf'
    : mime === 'image/jpeg' ? '.jpg'
    : mime === 'image/png' ? '.png'
    : mime === 'image/webp' ? '.webp'
    : mime === 'image/heic' ? '.heic'
    : mime === 'image/heif' ? '.heif'
    : '';
  return `${safe}_${unique}${ext}`;
};

const mimeFromName = (name) => {
  const n = String(name || '').toLowerCase();
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.heic')) return 'image/heic';
  if (n.endsWith('.heif')) return 'image/heif';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
};

/**
 * Upload a receipt/invoice file. Persists the Storage object path (never a signed URL).
 * Path: {projectId}/{taskId}/{paymentId}/{safeFilename}
 */
const uploadReceiptFile = async (path, file, mime, name) => {
  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, file, {
    contentType: mime,
    upsert: false,
  });
  if (error) throw error;
  return { id: uid(), path, name, mime };
};

export const uploadPaymentAttachment = async ({ projectId, taskId, paymentId, file }) => {
  const name = file?.name || 'receipt';
  const mime = file?.type || mimeFromName(name);
  const stored = uniqueStoredName(name, mime);
  const path = `${projectId}/${taskId}/${paymentId}/${stored}`;
  return uploadReceiptFile(path, file, mime, name);
};

/** Financing and utility bills (SWEPCO). Path: {projectId}/financing/{financingId}/{safeFilename} */
export const uploadFinancingAttachment = async ({ projectId, financingId, file }) => {
  const name = file?.name || 'receipt';
  const mime = file?.type || mimeFromName(name);
  const stored = uniqueStoredName(name, mime);
  const path = `${projectId}/financing/${financingId}/${stored}`;
  return uploadReceiptFile(path, file, mime, name);
};

/** Time-limited URL for viewing; do not persist this on the payment object. */
export const signedUrlFor = async (path) => {
  const { data, error } = await supabase.storage.from(RECEIPTS_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (error) throw error;
  return data.signedUrl;
};

/** Remove a file from storage. Missing objects are ignored. */
export const removePaymentAttachment = async (path) => {
  if (!path) return;
  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).remove([path]);
  if (!error) return;
  const status = String(error.statusCode ?? error.status ?? '');
  const msg = String(error.message || error.error || '').toLowerCase();
  if (status === '404' || msg.includes('not found') || msg.includes('not exist')) return;
  throw error;
};
