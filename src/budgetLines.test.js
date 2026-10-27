import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  amountString,
  budgetComparison,
  budgetLineFromInput,
  isOverBudget,
  moneyOrNull,
  summarizeRows,
  taskActual,
  upsertBudgetLine,
  variance,
} from "./budgetLines.js";
import { palmettoProject } from "./fixtures/palmetto.js";
import { parkersProject } from "./fixtures/parkers.js";

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.001, `${actual} ~= ${expected}`);

describe("variance", () => {
  it("computes actual vs bid and bid vs estimate in dollars and percent", () => {
    const actualVsBid = variance(12000, 10000);
    assert.equal(actualVsBid.dollars, 2000);
    assert.equal(actualVsBid.percent, 20);
    assert.equal(isOverBudget(actualVsBid), true);

    const bidVsEstimate = variance(9000, 10000);
    assert.equal(bidVsEstimate.dollars, -1000);
    assert.equal(bidVsEstimate.percent, -10);
    assert.equal(isOverBudget(bidVsEstimate), false);
  });

  it("does not divide by a zero baseline", () => {
    const vsZeroEstimate = variance(4100, 0);
    assert.equal(vsZeroEstimate.dollars, 4100);
    assert.equal(vsZeroEstimate.percent, null);
    assert.equal(Number.isFinite(vsZeroEstimate.percent), false);
    assert.equal(isOverBudget(vsZeroEstimate), true);

    const vsZeroBid = variance(0, 0);
    assert.equal(vsZeroBid.dollars, 0);
    assert.equal(vsZeroBid.percent, null);
    assert.equal(isOverBudget(vsZeroBid), false);
  });

  it("leaves blank estimate or bid as no comparison", () => {
    assert.deepEqual(variance(5000, null), { dollars: null, percent: null });
    assert.deepEqual(variance(null, 8000), { dollars: null, percent: null });
    assert.deepEqual(variance(null, null), { dollars: null, percent: null });
    assert.equal(isOverBudget(variance(5000, null)), false);
    assert.equal(moneyOrNull(""), null);
    assert.equal(moneyOrNull("  "), null);
    assert.equal(moneyOrNull(null), null);
    assert.equal(moneyOrNull("$1,200"), null);
    assert.equal(moneyOrNull("0"), 0);
    assert.equal(moneyOrNull("2500.50"), 2500.5);
    assert.equal(amountString("2500.50"), "2500.50");
    assert.equal(amountString(""), "");
    assert.equal(amountString("12abc"), "");
  });
});

describe("budget rollup", () => {
  const job = {
    id: "job1",
    phases: [
      {
        id: "d3",
        short: "Rough-In",
        tasks: [
          {
            id: "rough_plumb",
            name: "Rough Plumbing",
            lineItems: [
              { id: "a", labor: "3500.00", material: "0" },
              { id: "b", labor: "690.00", material: "0" },
              { id: "c", labor: "500.00", material: "0" },
            ],
            payments: [{ id: "p", amount: "99999" }],
          },
          {
            id: "rough_elec",
            name: "Rough Electrical",
            estimate: "999",
            bid: "111",
            lineItems: [],
            payments: [{ id: "p2", amount: "5000" }],
          },
        ],
      },
      {
        id: "d5",
        short: "Finish",
        tasks: [
          {
            id: "int_paint",
            name: "Interior Paint",
            estimate: "4000",
            bid: "3800",
            lineItems: [{ id: "m", labor: "0", material: "4500" }],
            payments: [],
          },
          {
            id: "hardware",
            name: "Hardware",
            na: true,
            lineItems: [{ id: "h", labor: "0", material: "842" }],
            payments: [{ id: "hp", amount: "1" }],
          },
          {
            id: "survey_na",
            name: "Skipped",
            na: true,
            lineItems: [],
            payments: [],
          },
        ],
      },
    ],
    financingCosts: [{ id: "u", type: "utility", amount: "1130.45" }],
    changeOrders: [{ id: "co", amount: "20000", status: "approved" }],
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
        bid: { amount: "6400", contractor_id: null, date: "", status: "received" },
      },
      {
        task_id: "hvac_rough",
        estimate: "12500",
        bid: { amount: "1000", contractor_id: null, date: "", status: "" },
      },
      { task_id: "", estimate: "50", bid: { amount: "50" } },
    ],
  };

  it("rolls line-item actuals onto the matching task_id and ignores payments, financing, and change orders", () => {
    const { rows, totals } = budgetComparison(job);
    const plumb = rows.find((r) => r.taskId === "rough_plumb");
    assert.equal(plumb.estimate, 8000);
    assert.equal(plumb.bidAmount, 7500);
    assert.equal(plumb.contractorId, "gn7xk0k");
    assert.equal(plumb.bidStatus, "accepted");
    assert.equal(plumb.actual, 4690);
    assert.equal(plumb.actualVsBid.dollars, 4690 - 7500);
    near(plumb.actualVsBid.percent, ((4690 - 7500) / 7500) * 100);
    assert.equal(plumb.bidVsEstimate.dollars, 7500 - 8000);
    assert.equal(isOverBudget(plumb.actualVsBid), false);

    const elec = rows.find((r) => r.taskId === "rough_elec");
    assert.equal(elec.fromBudgetLine, true);
    assert.equal(elec.estimate, null);
    assert.equal(elec.bidAmount, 6400);
    assert.equal(elec.actual, 0);
    assert.equal(elec.bidVsEstimate.dollars, null);
    assert.equal(elec.bidVsEstimate.percent, null);
    assert.equal(elec.actualVsBid.dollars, -6400);
    assert.equal(elec.actualVsBid.percent, -100);

    const paint = rows.find((r) => r.taskId === "int_paint");
    assert.equal(paint.fromBudgetLine, false);
    assert.equal(paint.estimate, 4000);
    assert.equal(paint.bidAmount, 3800);
    assert.equal(paint.actual, 4500);
    assert.equal(isOverBudget(paint.actualVsBid), true);

    assert.equal(rows.some((r) => r.taskId === "hvac_rough"), false);
    assert.equal(rows.some((r) => r.taskId === ""), false);

    const hardware = rows.find((r) => r.taskId === "hardware");
    assert.equal(hardware.na, true);
    assert.equal(hardware.actual, 842);

    assert.equal(totals.actual, 4690 + 4500 + 842);
    assert.equal(totals.estimate, 8000 + 4000);
    assert.equal(totals.bid, 7500 + 6400 + 3800);
    assert.notEqual(totals.actual, 99999);
    assert.ok(totals.actual < 20000);
  });

  it("treats an explicit zero estimate as zero and skips the percent", () => {
    const withZero = upsertBudgetLine(job, {
      taskId: "rough_plumb",
      estimate: "0",
      bidAmount: "7500",
      contractorId: "gn7xk0k",
      bidDate: "2026-10-20",
      bidStatus: "accepted",
    });
    const row = budgetComparison(withZero).rows.find((r) => r.taskId === "rough_plumb");
    assert.equal(row.estimate, 0);
    assert.equal(row.bidVsEstimate.dollars, 7500);
    assert.equal(row.bidVsEstimate.percent, null);
    assert.equal(isOverBudget(row.bidVsEstimate), true);
  });

  it("keeps a blank job renderable", () => {
    const empty = budgetComparison({ id: "new", phases: [{ id: "d1", tasks: [{ id: "survey", name: "Survey" }] }] });
    assert.equal(empty.rows.length, 1);
    assert.equal(empty.rows[0].estimate, null);
    assert.equal(empty.rows[0].bidAmount, null);
    assert.equal(empty.rows[0].actual, 0);
    assert.deepEqual(empty.rows[0].actualVsBid, { dollars: null, percent: null });
    assert.deepEqual(empty.rows[0].bidVsEstimate, { dollars: null, percent: null });
    assert.equal(empty.totals.estimate, null);
    assert.equal(empty.totals.bid, null);
    assert.equal(empty.totals.actual, 0);
    assert.equal(empty.totals.actualVsBid.percent, null);
    assert.equal(budgetComparison({}).rows.length, 0);
    assert.equal(budgetComparison(null).totals.actual, 0);
  });

  it("uses the last budget line when task_id is duplicated", () => {
    const duped = {
      phases: [{ id: "d1", tasks: [{ id: "survey", name: "Survey", lineItems: [] }] }],
      budget_lines: [
        { task_id: "survey", estimate: "100", bid: { amount: "90" } },
        { task_id: "survey", estimate: "2500", bid: { amount: "2400", status: "requested" } },
      ],
    };
    const row = budgetComparison(duped).rows[0];
    assert.equal(row.estimate, 2500);
    assert.equal(row.bidAmount, 2400);
    assert.equal(row.bidStatus, "requested");
  });

  it("falls back to task.actual only when line items sum to 0", () => {
    assert.equal(taskActual({ lineItems: [], actual: "325" }), 325);
    assert.equal(taskActual({ lineItems: [{ labor: "0", material: "0" }], actual: "325" }), 325);
    assert.equal(taskActual({ lineItems: [{ labor: "10", material: "2.5" }], actual: "325" }), 12.5);
    assert.equal(taskActual({ payments: [{ amount: "900" }] }), 0);
  });
});

describe("upsertBudgetLine", () => {
  const project = {
    id: "ot0e7y0",
    name: "224 Denali Dr",
    phases: [{
      id: "d3",
      tasks: [{
        id: "rough_plumb",
        name: "Rough Plumbing",
        estimate: "100",
        lineItems: [{ id: "li", labor: "50", material: "25" }],
        payments: [{ id: "pay", amount: "50" }],
      }],
    }],
    financingCosts: [{ id: "fin", amount: "10" }],
  };

  it("writes the budget line and leaves phases, costs, and payments in place", () => {
    const next = upsertBudgetLine(project, {
      taskId: "rough_plumb",
      estimate: "12500",
      bidAmount: "11800.50",
      contractorId: "gn7xk0k",
      bidDate: "2026-10-27",
      bidStatus: "received",
    });
    assert.equal(next.phases, project.phases);
    assert.equal(next.phases[0].tasks[0].lineItems[0].labor, "50");
    assert.equal(next.phases[0].tasks[0].payments[0].amount, "50");
    assert.equal(next.phases[0].tasks[0].estimate, "100");
    assert.equal(next.financingCosts, project.financingCosts);
    assert.deepEqual(next.budget_lines, [{
      task_id: "rough_plumb",
      estimate: "12500",
      bid: {
        amount: "11800.50",
        contractor_id: "gn7xk0k",
        date: "2026-10-27",
        status: "received",
      },
    }]);
    const row = budgetComparison(next).rows[0];
    assert.equal(row.estimate, 12500);
    assert.equal(row.estimateRaw, "12500");
    assert.equal(row.bidAmount, 11800.5);
    assert.equal(row.actual, 75);
    assert.equal(row.fromBudgetLine, true);
  });

  it("replaces one line in place and drops invalid status and date", () => {
    const once = upsertBudgetLine(project, { taskId: "rough_plumb", estimate: "1", bidAmount: "2", bidStatus: "accepted" });
    const twice = upsertBudgetLine(once, {
      taskId: "survey",
      estimate: "2500",
      bidAmount: "",
      bidStatus: "nope",
      bidDate: "10/27/2026",
      contractorId: "",
    });
    assert.equal(twice.budget_lines.length, 2);
    assert.equal(twice.budget_lines[0].estimate, "1");
    assert.equal(twice.budget_lines[1].task_id, "survey");
    assert.equal(twice.budget_lines[1].bid.status, "");
    assert.equal(twice.budget_lines[1].bid.date, "");
    assert.equal(twice.budget_lines[1].bid.contractor_id, null);
    assert.equal(twice.phases, project.phases);

    const cleared = upsertBudgetLine(twice, { taskId: "rough_plumb", estimate: "", bidAmount: "" });
    assert.equal(cleared.budget_lines[0].estimate, "");
    const row = budgetComparison(cleared).rows[0];
    assert.equal(row.estimate, null);
    assert.equal(row.fromBudgetLine, true);
    assert.equal(cleared.phases[0].tasks[0].estimate, "100");
  });

  it("ignores an empty task id", () => {
    assert.equal(upsertBudgetLine(project, { taskId: "  ", estimate: "5" }), project);
  });

  it("round-trips the stored shape", () => {
    const line = budgetLineFromInput({
      task_id: "cabinets",
      estimate: "9000",
      bid: { amount: "8700", contractor_id: "zjqfvzl", date: "2026-11-01", status: "rejected" },
    });
    assert.deepEqual(line, {
      task_id: "cabinets",
      estimate: "9000",
      bid: { amount: "8700", contractor_id: "zjqfvzl", date: "2026-11-01", status: "rejected" },
    });
  });
});

describe("existing jobs with no budget_lines", () => {
  it("shows Palmetto hardware actual from the line item and a blank estimate", () => {
    const { rows, totals } = budgetComparison(palmettoProject);
    assert.equal(palmettoProject.budget_lines, undefined);
    const hardware = rows.find((r) => r.taskId === "hardware");
    assert.equal(hardware.actual, 842);
    assert.equal(hardware.estimate, null);
    assert.equal(hardware.bidAmount, null);
    assert.equal(hardware.actualVsBid.percent, null);
    assert.equal(totals.estimate, null);
    near(totals.actual, 842);
  });

  it("rolls Parkers line items by task and leaves utility bills out of the total", () => {
    const { rows, totals } = budgetComparison(parkersProject);
    const plumb = rows.find((r) => r.taskId === "cr_plumb");
    const fix = rows.find((r) => r.taskId === "cr_fix");
    assert.equal(plumb.actual, 4690);
    near(fix.actual, 2708.11 + 242.67 + 276.39 + 192.29);
    near(totals.actual, plumb.actual + fix.actual);
    assert.ok(totals.actual < 20000);
    assert.equal(totals.estimate, null);
    assert.equal(totals.bid, null);
  });

  it("reads legacy task.estimate strings when budget_lines is absent", () => {
    const sequoia = {
      id: "he2l6vt",
      phases: [{
        id: "d1",
        short: "Foundation",
        tasks: [
          { id: "survey", name: "Land Survey & Lot Assessment", estimate: "2500", bid: "", actual: "", lineItems: [] },
          { id: "plans", name: "Architectural Plans / Blueprints Finalized", estimate: "4000", bid: "", actual: "" },
          { id: "permits", name: "Permits Received", lineItems: [{ labor: "0", material: "15" }] },
        ],
      }],
    };
    const { rows, totals } = budgetComparison(sequoia);
    assert.equal(rows[0].estimate, 2500);
    assert.equal(rows[0].bidAmount, null);
    assert.equal(rows[1].estimate, 4000);
    assert.equal(rows[2].actual, 15);
    assert.equal(totals.estimate, 6500);
    assert.equal(totals.bid, null);
    assert.equal(totals.bidVsEstimate.dollars, null);
    const summed = summarizeRows(rows);
    assert.equal(summed.estimate, 6500);
    assert.equal(summed.actual, 15);
  });
});

describe("app wiring", () => {
  const app = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

  it("saves estimate and bid through budget_lines and compares actual vs bid", () => {
    const model = readFileSync(new URL("./budgetLines.js", import.meta.url), "utf8");
    assert.match(app, /upsertBudgetLine\(project,/);
    assert.match(app, /budgetComparison/);
    assert.match(app, /Actual vs bid/);
    assert.match(app, /Bid vs estimate/);
    assert.doesNotMatch(app, /updateTask\(editTask/);
    assert.match(model, /budget_lines/);
    assert.match(model, /task_id/);
    assert.match(model, /contractor_id/);
  });
});
