/** Parse a stored amount. Same rule as App.jsx `num` — do not change money math. */
export const num = (s) => {
  const v = parseFloat(s);
  return isNaN(v) ? 0 : v;
};

/** Stored `financingCosts[].type` values. Utility is electric/water/gas — not loan interest. */
export const FIN_TYPE_LABELS = {
  construction: "Construction Loan",
  lot: "Lot Loan",
  other: "Other Financing",
  utility: "Utility",
};

export const FIN_TYPE_OPTIONS = [
  { value: "construction", label: "Construction Loan Interest" },
  { value: "lot", label: "Lot Loan Interest" },
  { value: "other", label: "Other Financing Cost" },
  { value: "utility", label: "Utility (electric / water / gas)" },
];

export const isUtilityCost = (entry) => entry?.type === "utility";

/** Split financingCosts into Utilities vs loan-style financing. Amounts are not changed. */
export function partitionJobCosts(entries) {
  const utilities = [];
  const financing = [];
  for (const f of entries || []) {
    if (isUtilityCost(f)) utilities.push(f);
    else financing.push(f);
  }
  return { utilities, financing };
}

export const sumAmounts = (entries) =>
  (entries || []).reduce((s, f) => s + num(f.amount), 0);

/**
 * Compact Utilities drill-down rows.
 * Only financingCosts with type=utility. Amounts stay as stored.
 * Photos are that row’s attachments (same signed-URL path as financing).
 */
export function collectUtilityBills(project) {
  const { utilities } = partitionJobCosts(project?.financingCosts);
  return utilities.map((f) => ({
    id: f.id,
    description: String(f.description || "").trim() || "Untitled",
    date: f.date || "",
    amount: f.amount,
    attachments: f.attachments || [],
    type: f.type,
  }));
}

/**
 * Labor/material drill-down groups.
 *
 * Line items and payments are NOT linked. Do not invent a join.
 * A group is a task that has matching labor or material line items.
 * Receipts on that group are every payment.attachments on the same task.
 */
export function collectCostGroups(project, { kind, phaseId } = {}) {
  if (kind !== "labor" && kind !== "material") return [];
  const groups = [];
  for (const ph of project.phases || []) {
    if (phaseId && ph.id !== phaseId) continue;
    for (const t of ph.tasks || []) {
      const lines = (t.lineItems || [])
        .filter((li) => num(li[kind]) > 0)
        .map((li) => ({
          id: li.id,
          description: String(li.description || "").trim() || "Untitled",
          amount: num(li[kind]),
        }));
      if (!lines.length) continue;
      const receipts = [];
      for (const p of t.payments || []) {
        for (const att of p.attachments || []) receipts.push(att);
      }
      groups.push({
        taskId: t.id,
        taskName: t.name,
        phaseId: ph.id,
        phaseName: ph.short || ph.name,
        lines,
        receipts,
        total: lines.reduce((s, l) => s + l.amount, 0),
      });
    }
  }
  return groups;
}

export const sumCostGroups = (groups) =>
  (groups || []).reduce((s, g) => s + num(g.total), 0);

/**
 * Every payment.attachments on the job, grouped by task.
 * Utility and financing attachments are listed separately (they are not task payments).
 */
export function collectJobReceipts(project) {
  const groups = [];
  for (const ph of project.phases || []) {
    for (const t of ph.tasks || []) {
      const payments = (t.payments || []).filter(
        (p) => (p.attachments || []).length > 0
      );
      if (!payments.length) continue;
      groups.push({
        taskId: t.id,
        taskName: t.name,
        phaseName: ph.short || ph.name,
        payments: payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          date: p.date,
          checkNum: p.checkNum,
          note: p.note,
          attachments: p.attachments || [],
        })),
      });
    }
  }
  const withPhotos = (project.financingCosts || []).filter(
    (f) => (f.attachments || []).length > 0
  );
  const { utilities, financing } = partitionJobCosts(withPhotos);
  return { groups, financing, utilities };
}
