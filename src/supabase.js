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
