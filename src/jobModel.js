/** Job-type and finishes/products helpers. Pure so a type switch cannot drop tasks. */

export const isFlip = (type) => type === "flip";

/**
 * Checklist template family.
 * custom, spec, flip, and rental_rehab (and any future non-commercial type)
 * use the residential six-draw template. Only the two commercial types differ.
 */
export function phaseTemplateKind(type) {
  if (type === "commercial_rehab") return "commercial_rehab";
  if (type === "commercial") return "commercial";
  return "residential";
}

export const isResidential = (type) => phaseTemplateKind(type) === "residential";

export function projectTasks(project) {
  const tasks = [];
  for (const ph of project?.phases || []) {
    for (const t of ph?.tasks || []) tasks.push(t);
  }
  return tasks;
}

/**
 * Set `type` without replacing tasks, line items, or payments.
 * A job that already has tasks keeps its phase array (same reference).
 * A job with no tasks receives `seededPhases` — for rental_rehab that is
 * the same residential six-draw template as custom, spec, and flip.
 */
export function projectWithType(project, type, seededPhases) {
  const next = { ...project, type };
  if (projectTasks(project).length === 0 && seededPhases) {
    next.phases = seededPhases;
  }
  return next;
}

/** Client-portal A/B rows share `data.selections` with product rows. */
export function isClientSelection(row) {
  if (!row || typeof row !== "object") return false;
  return typeof row.title === "string" || "optionA" in row || "optionB" in row;
}

/** Finishes & Products row. `item` is required. Never a client A/B row. */
export function isProductSelection(row) {
  if (!row || typeof row !== "object") return false;
  if (typeof row.item !== "string") return false;
  if (isClientSelection(row)) return false;
  return true;
}

export function productSelections(project) {
  const raw = project?.selections;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isProductSelection);
}

/**
 * Replace product rows only. Client-portal rows stay, in their original order.
 * The rest of the project (phases, payments, finishes) is copied through the
 * same full-document object the app already saves.
 */
export function replaceProductSelections(project, products) {
  const raw = Array.isArray(project?.selections) ? project.selections : [];
  const kept = raw.filter((row) => !isProductSelection(row));
  return { ...project, selections: [...kept, ...(products || [])] };
}

/** Persist only `{id, path, name, mime}`. Signed URLs are never stored. */
export function selectionPhoto(photo) {
  if (!photo || typeof photo !== "object") return null;
  const { id, path } = photo;
  if (typeof id !== "string" || !id) return null;
  if (typeof path !== "string" || !path) return null;
  return {
    id,
    path,
    name: typeof photo.name === "string" ? photo.name : "",
    mime: typeof photo.mime === "string" ? photo.mime : "",
  };
}

const NO_ROOM = "No room";

export function groupSelectionsByRoom(rows) {
  const groups = new Map();
  for (const row of rows || []) {
    const room = String(row.room || "").trim() || NO_ROOM;
    if (!groups.has(room)) groups.set(room, []);
    groups.get(room).push(row);
  }
  const keys = [...groups.keys()].sort((a, b) => {
    if (a === NO_ROOM) return 1;
    if (b === NO_ROOM) return -1;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });
  return keys.map((room) => ({
    room,
    rows: groups.get(room).slice().sort((a, b) =>
      String(a.item || "").localeCompare(String(b.item || ""), undefined, { sensitivity: "base" })
    ),
  }));
}

export function safeLink(link) {
  const raw = String(link || "").trim();
  if (!raw) return "";
  if (/^javascript:/i.test(raw) || /^data:/i.test(raw)) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
}
