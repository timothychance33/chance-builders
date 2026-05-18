import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

export default supabase;

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
