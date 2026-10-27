/**
 * Estimate vs bid vs actual for one job.
 *
 * Stored on `projects.data.budget_lines` (jsonb). One object per checklist task.
 * `task_id` is `phases[].tasks[].id` — the same id actual line items already use.
 * Amounts are numeric strings, same as line items and payments. "" means blank.
 *
 * Actual is not stored here. It is the task's labor + material line items
 * (or legacy `task.actual` when those sum to 0). Payments are not added in.
 *
 * A missing `budget_lines` key, or a task with no entry, still renders:
 * legacy `task.estimate` / `task.bid` strings are used when present.
 * Once an entry exists for a task_id, that entry wins, even if estimate is "".
 */

import { num } from "./costGroups.js";

export const BID_STATUSES = ["requested", "received", "accepted", "rejected"];

export const BID_STATUS_LABELS = {
  requested: "Requested",
  received: "Received",
  accepted: "Accepted",
  rejected: "Rejected",
};

const AMOUNT_RE = /^-?\d+(\.\d+)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const cents = (n) => Math.round(n * 100) / 100;

/** Blank, missing, or non-numeric → null. "0" and 0 stay 0. */
export function moneyOrNull(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s || !AMOUNT_RE.test(s)) return null;
  return parseFloat(s);
}

/** Canonical stored amount. Keeps a valid numeric string, including "0". */
export function amountString(value) {
  if (typeof value === "string") {
    const s = value.trim();
    return AMOUNT_RE.test(s) ? s : "";
  }
  const n = moneyOrNull(value);
  return n === null ? "" : String(n);
}

export function dateString(value) {
  if (typeof value !== "string") return "";
  const s = value.trim();
  if (!DATE_RE.test(s)) return "";
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return "";
  return s;
}

export function statusString(value) {
  return BID_STATUSES.includes(value) ? value : "";
}

function idOrNull(value) {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s ? s : null;
}

/**
 * Dollar and percent variance of `value` against `baseline`.
 * Null on either side → no comparison (both null).
 * Baseline 0 → dollars are value − 0, percent is null (no divide by zero).
 */
export function variance(value, baseline) {
  if (value === null || value === undefined || baseline === null || baseline === undefined) {
    return { dollars: null, percent: null };
  }
  const dollars = cents(value - baseline);
  const percent = baseline === 0 ? null : ((value - baseline) / baseline) * 100;
  return { dollars, percent };
}

/** Over budget when the dollar gap is positive. A missing comparison is not over. */
export function isOverBudget(result) {
  return !!result && typeof result.dollars === "number" && result.dollars > 0;
}

/** Labor + material on the task. Payments are ignored. Falls back to task.actual when line items sum to 0. */
export function taskActual(task) {
  const items = Array.isArray(task?.lineItems) ? task.lineItems : [];
  const fromLines = items.reduce((s, li) => s + num(li?.labor) + num(li?.material), 0);
  const raw = fromLines ? fromLines : num(task?.actual);
  return cents(raw);
}

function indexBudgetLines(project) {
  const map = new Map();
  const raw = project?.budget_lines;
  if (!Array.isArray(raw)) return map;
  for (const line of raw) {
    if (!line || typeof line !== "object") continue;
    if (typeof line.task_id !== "string" || !line.task_id) continue;
    map.set(line.task_id, line);
  }
  return map;
}

function readBid(line) {
  const bid = line?.bid && typeof line.bid === "object" ? line.bid : {};
  return {
    amount: moneyOrNull(bid.amount),
    amountRaw: amountString(bid.amount),
    contractorId: idOrNull(bid.contractor_id),
    date: dateString(bid.date),
    status: statusString(bid.status),
  };
}

function readLegacy(task) {
  return {
    estimate: moneyOrNull(task?.estimate),
    estimateRaw: amountString(task?.estimate),
    amount: moneyOrNull(task?.bid),
    amountRaw: amountString(task?.bid),
    contractorId: null,
    date: "",
    status: "",
  };
}

function rowFromTask(ph, task, line) {
  const fromBudgetLine = !!line;
  const legacy = fromBudgetLine ? null : readLegacy(task);
  const bid = fromBudgetLine ? readBid(line) : legacy;
  const estimate = fromBudgetLine ? moneyOrNull(line.estimate) : legacy.estimate;
  const estimateRaw = fromBudgetLine ? amountString(line.estimate) : legacy.estimateRaw;
  const actual = taskActual(task);
  return {
    taskId: task.id,
    taskName: task.name || task.id,
    phaseId: ph.id,
    phaseName: ph.short || ph.name || "",
    phaseIcon: ph.icon || "",
    na: !!task.na,
    estimate,
    estimateRaw,
    bidAmount: bid.amount,
    bidAmountRaw: bid.amountRaw,
    contractorId: bid.contractorId,
    bidDate: bid.date,
    bidStatus: bid.status,
    actual,
    actualVsBid: variance(actual, bid.amount),
    bidVsEstimate: variance(bid.amount, estimate),
    fromBudgetLine,
  };
}

function sumNullable(values) {
  let any = false;
  let sum = 0;
  for (const v of values) {
    if (v === null || v === undefined) continue;
    any = true;
    sum += v;
  }
  return any ? cents(sum) : null;
}

export function summarizeRows(rows) {
  const list = rows || [];
  const estimate = sumNullable(list.map((r) => r.estimate));
  const bid = sumNullable(list.map((r) => r.bidAmount));
  const actual = cents(list.reduce((s, r) => s + (r.actual || 0), 0));
  return {
    estimate,
    bid,
    actual,
    actualVsBid: variance(bid === null ? null : actual, bid),
    bidVsEstimate: variance(bid, estimate),
  };
}

/**
 * One row per task, in phase order. Orphan budget_lines (unknown task_id) are ignored.
 * Totals include every task, including N/A.
 */
export function budgetComparison(project) {
  const lines = indexBudgetLines(project);
  const rows = [];
  for (const ph of project?.phases || []) {
    if (!ph || typeof ph !== "object") continue;
    for (const task of ph.tasks || []) {
      if (!task || typeof task.id !== "string" || !task.id) continue;
      rows.push(rowFromTask(ph, task, lines.get(task.id)));
    }
  }
  return { rows, totals: summarizeRows(rows) };
}

/** Stored shape for one trade/task. Unknown input fields are dropped. */
export function budgetLineFromInput(input) {
  const taskId = String(input?.taskId ?? input?.task_id ?? "").trim();
  const bidSrc = input?.bid && typeof input.bid === "object" ? input.bid : {};
  return {
    task_id: taskId,
    estimate: amountString(input?.estimate),
    bid: {
      amount: amountString(input?.bidAmount ?? bidSrc.amount),
      contractor_id: idOrNull(input?.contractorId ?? bidSrc.contractor_id),
      date: dateString(input?.bidDate ?? bidSrc.date),
      status: statusString(input?.bidStatus ?? bidSrc.status),
    },
  };
}

/**
 * Insert or replace one budget line. Does not copy or modify phases, line items, or payments.
 * Returns the same project reference when task_id is empty.
 */
export function upsertBudgetLine(project, input) {
  const next = budgetLineFromInput(input);
  if (!next.task_id) return project;
  const raw = Array.isArray(project?.budget_lines) ? project.budget_lines : [];
  let found = false;
  const budget_lines = raw.map((line) => {
    if (line && line.task_id === next.task_id) {
      found = true;
      return next;
    }
    return line;
  });
  if (!found) budget_lines.push(next);
  return { ...project, budget_lines };
}
