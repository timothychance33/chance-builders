/**
 * Local Financials preview for Estimate vs Bid vs Actual (`?fixture=budget`).
 * Sample amounts only. This is not job ot0e7y0 and nothing here is written to Supabase.
 * Task ids match the residential checklist so the screen uses the same keys as 224 Denali.
 */
export const budgetProject = {
  id: "fixture-denali",
  name: "224 Denali Dr",
  address: "224 Denali Dr",
  type: "spec",
  salePrice: "240000",
  markupPct: "10",
  phases: [
    {
      id: "d2",
      name: "Draw 2 — Frame & Dry-In",
      short: "Framing",
      icon: "🪵",
      tasks: [
        { id: "windows", name: "Windows & Exterior Doors Set", completed: false, na: false, lineItems: [], payments: [] },
      ],
    },
    {
      id: "d3",
      name: "Draw 3 — Rough-In",
      short: "Rough-In",
      icon: "🔧",
      tasks: [
        {
          id: "rough_plumb",
          name: "Rough Plumbing",
          completed: false,
          na: false,
          lineItems: [{ id: "pl1", description: "Rough plumbing", labor: "8200", material: "0" }],
          payments: [{ id: "plpay", amount: "4000", date: "10/1/2026", checkNum: "", note: "", lienWaiver: false, attachments: [] }],
        },
        { id: "rough_elec", name: "Rough Electrical", completed: false, na: false, lineItems: [], payments: [] },
        {
          id: "hvac_rough",
          name: "HVAC Ductwork & Equipment Rough-In",
          completed: false,
          na: false,
          lineItems: [],
          payments: [],
        },
      ],
    },
    {
      id: "d5",
      name: "Draw 5 — Finish",
      short: "Finish",
      icon: "🎨",
      tasks: [
        {
          id: "int_paint",
          name: "Interior Paint",
          completed: false,
          na: false,
          estimate: "4000",
          bid: "3800",
          lineItems: [{ id: "pt1", description: "Interior paint", labor: "4500", material: "0" }],
          payments: [],
        },
        {
          id: "hardware",
          name: "Door Hardware / Bath Hardware / Pulls",
          completed: false,
          na: false,
          lineItems: [{ id: "hw1", description: "Bath hardware", labor: "0", material: "842" }],
          payments: [],
        },
      ],
    },
  ],
  budget_lines: [
    {
      task_id: "rough_plumb",
      estimate: "8000",
      bid: {
        amount: "7500",
        contractor_id: "gn7xk0k",
        date: "2026-10-20",
        status: "accepted",
      },
    },
    {
      task_id: "rough_elec",
      estimate: "",
      bid: {
        amount: "6400",
        contractor_id: null,
        date: "2026-10-18",
        status: "received",
      },
    },
    {
      task_id: "hvac_rough",
      estimate: "0",
      bid: {
        amount: "4100",
        contractor_id: null,
        date: "",
        status: "requested",
      },
    },
  ],
  changeOrders: [],
  selections: [],
  jobLog: [],
  finishes: [],
  financingCosts: [],
};

export const budgetContractors = [
  { id: "gn7xk0k", name: "Precision Plumbing", trade: "Plumbing" },
  { id: "zjqfvzl", name: "Ramos Remodeling", trade: "Painting" },
  { id: "t6ehjf0", name: "Custom Wired Electric", trade: "Electrical" },
];
