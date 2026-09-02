import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  collectCostGroups,
  collectJobReceipts,
  isUtilityCost,
  partitionJobCosts,
  sumAmounts,
  sumCostGroups,
} from "./costGroups.js";

// Shape taken from live Parkers Drug (78q3b8d). Amounts must match existing math.
const parkers = {
  id: "78q3b8d",
  name: "Parkers Drug",
  financingCosts: [
    { id: "mrr8arq", type: "other", amount: "1130.45", description: "SWEPCO electric" },
    { id: "swpb196", type: "other", amount: "196.85", description: "SWEPCO electric Unit B" },
    { id: "swp8538", type: "other", amount: "85.38", description: "SWEPCO electric" },
  ],
  phases: [
    {
      id: "cr3",
      short: "MEP",
      name: "MEP",
      tasks: [
        {
          id: "cr_plumb",
          name: "Plumbing Rough / Replacement",
          lineItems: [
            { id: "lnsewer", labor: "3500.00", material: "0", description: "Replace and reroute sewer line" },
            { id: "lnwline", labor: "690.00", material: "0", description: "Repair broken water line, meter and box" },
            { id: "lnwsrvc", labor: "500.00", material: "0", description: "New water service, 2 connections and stub outs" },
          ],
          payments: [
            {
              id: "paylnd1",
              amount: "4690.00",
              note: "Lindow job 59874, Chance Builders check 1091",
              attachments: [
                { id: "5ip84ym", name: "lindow-job-59874.jpg", mime: "image/jpeg", path: "78q3b8d/cr_plumb/paylnd1/lindow-job-59874.jpg" },
                { id: "w9xgz7m", name: "check-1091.jpg", mime: "image/jpeg", path: "78q3b8d/cr_plumb/paylnd1/check-1091.jpg" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "cr4",
      short: "Interiors",
      name: "Interiors",
      tasks: [
        {
          id: "cr_paint",
          name: "Paint / Wall Finishes",
          lineItems: [
            { id: "yc45xdx", labor: "4400.00", material: "0", description: "Ramos Remodeling labor" },
            { id: "vyt2kkc", labor: "0", material: "3524.26", description: "Ramos Receipts materials" },
          ],
          payments: [
            {
              id: "pay554r",
              amount: "1555.26",
              attachments: [
                { id: "t0wdrdt", name: "ramos-inv-554-receipts.png", mime: "image/png", path: "78q3b8d/cr_paint/pay554r/ramos.png" },
              ],
            },
          ],
        },
        {
          id: "cr_fix",
          name: "Fixtures / Lighting / Hardware",
          lineItems: [
            { id: "ol6s3tp", labor: "0", material: "2708.11", description: "Home Depot materials" },
            { id: "hd28mat", labor: "0", material: "242.67", description: "Home Depot materials 8/28" },
            { id: "hd29mat", labor: "0", material: "276.39", description: "Home Depot materials 8/29" },
            { id: "hd29pmt", labor: "0", material: "192.29", description: "Home Depot materials 8/29 PM" },
          ],
          payments: [
            { id: "linllwv", amount: "2708.11", note: "Home Depot", attachments: [] },
            {
              id: "payhd28",
              amount: "242.67",
              attachments: [
                { id: "l95nfpi", name: "home-depot-2026-08-28.jpg", mime: "image/jpeg", path: "78q3b8d/cr_fix/payhd28/hd28.jpg" },
              ],
            },
            {
              id: "payhd29",
              amount: "276.39",
              attachments: [
                { id: "f0jfwrr", name: "home-depot-2026-08-29.jpg", mime: "image/jpeg", path: "78q3b8d/cr_fix/payhd29/hd29.jpg" },
              ],
            },
            {
              id: "payhd2p",
              amount: "192.29",
              attachments: [
                { id: "e58fwha", name: "home-depot-2026-08-29-pm.jpg", mime: "image/jpeg", path: "78q3b8d/cr_fix/payhd2p/hd2p.jpg" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("collectCostGroups — no invented line/payment join", () => {
  it("puts Lindow labor + task receipts on cr_plumb, not on materials", () => {
    const labor = collectCostGroups(parkers, { kind: "labor" });
    const plumb = labor.find((g) => g.taskId === "cr_plumb");
    assert.ok(plumb);
    assert.equal(plumb.phaseName, "MEP");
    assert.equal(plumb.lines.length, 3);
    assert.equal(plumb.total, 4690);
    assert.deepEqual(plumb.receipts.map((a) => a.name), [
      "lindow-job-59874.jpg",
      "check-1091.jpg",
    ]);
    assert.equal(labor.some((g) => g.taskId === "cr_fix"), false);
  });

  it("puts Home Depot material lines + task photos on cr_fix, not on labor", () => {
    const material = collectCostGroups(parkers, { kind: "material" });
    const fix = material.find((g) => g.taskId === "cr_fix");
    assert.ok(fix);
    assert.equal(fix.phaseName, "Interiors");
    assert.equal(fix.lines.length, 4);
    assert.equal(fix.total, 2708.11 + 242.67 + 276.39 + 192.29);
    assert.deepEqual(fix.receipts.map((a) => a.name), [
      "home-depot-2026-08-28.jpg",
      "home-depot-2026-08-29.jpg",
      "home-depot-2026-08-29-pm.jpg",
    ]);
    assert.equal(material.some((g) => g.taskId === "cr_plumb"), false);
  });

  it("shows a mixed task's receipts on both kinds (group by task, no join)", () => {
    const laborPaint = collectCostGroups(parkers, { kind: "labor" }).find((g) => g.taskId === "cr_paint");
    const matPaint = collectCostGroups(parkers, { kind: "material" }).find((g) => g.taskId === "cr_paint");
    assert.equal(laborPaint.lines.length, 1);
    assert.equal(laborPaint.lines[0].amount, 4400);
    assert.equal(matPaint.lines.length, 1);
    assert.equal(matPaint.lines[0].amount, 3524.26);
    assert.equal(laborPaint.receipts[0].name, "ramos-inv-554-receipts.png");
    assert.equal(matPaint.receipts[0].name, "ramos-inv-554-receipts.png");
  });

  it("filters Breakdown to one phase without changing totals", () => {
    const mepLabor = collectCostGroups(parkers, { kind: "labor", phaseId: "cr3" });
    assert.deepEqual(mepLabor.map((g) => g.taskId), ["cr_plumb"]);
    assert.equal(sumCostGroups(mepLabor), 4690);
    const interiorsMat = collectCostGroups(parkers, { kind: "material", phaseId: "cr4" });
    assert.ok(interiorsMat.some((g) => g.taskId === "cr_fix"));
    assert.equal(interiorsMat.some((g) => g.taskId === "cr_plumb"), false);
  });

  it("does not pull financingCosts into labor/material groups", () => {
    const labor = collectCostGroups(parkers, { kind: "labor" });
    const material = collectCostGroups(parkers, { kind: "material" });
    assert.equal(labor.some((g) => /SWEPCO/i.test(g.taskName || "")), false);
    assert.equal(material.some((g) => /SWEPCO/i.test(g.taskName || "")), false);
    assert.equal(
      sumCostGroups(labor) + sumCostGroups(material),
      4690 + 4400 + 3524.26 + 2708.11 + 242.67 + 276.39 + 192.29
    );
  });
});

describe("collectJobReceipts", () => {
  it("lists every payment.attachments grouped by task", () => {
    const { groups, financing, utilities } = collectJobReceipts(parkers);
    assert.deepEqual(groups.map((g) => g.taskId), ["cr_plumb", "cr_paint", "cr_fix"]);
    const fix = groups.find((g) => g.taskId === "cr_fix");
    assert.equal(fix.payments.length, 3);
    assert.equal(fix.payments.flatMap((p) => p.attachments).length, 3);
    const plumb = groups.find((g) => g.taskId === "cr_plumb");
    assert.equal(plumb.payments[0].attachments.length, 2);
    assert.equal(financing.length, 0);
    assert.equal(utilities.length, 0);
  });

  it("includes financing attachments when present, still separate from tasks", () => {
    const withBill = {
      ...parkers,
      financingCosts: [
        {
          id: "mrr8arq",
          type: "other",
          amount: "1130.45",
          description: "SWEPCO electric",
          attachments: [{ id: "sw1", name: "swepco.jpg", path: "78q3b8d/financing/mrr8arq/swepco.jpg" }],
        },
      ],
    };
    const { groups, financing, utilities } = collectJobReceipts(withBill);
    assert.equal(groups.some((g) => g.taskId === "mrr8arq"), false);
    assert.equal(financing.length, 1);
    assert.equal(financing[0].description, "SWEPCO electric");
    assert.equal(utilities.length, 0);
  });

  it("lists utility bill photos under Utilities, not Other financing", () => {
    const withBill = {
      ...parkers,
      financingCosts: [
        {
          id: "mrr8arq",
          type: "utility",
          amount: "1130.45",
          description: "SWEPCO electric",
          attachments: [{ id: "sw1", name: "swepco.jpg", path: "78q3b8d/financing/mrr8arq/swepco.jpg" }],
        },
      ],
    };
    const { financing, utilities } = collectJobReceipts(withBill);
    assert.equal(financing.length, 0);
    assert.equal(utilities.length, 1);
    assert.equal(utilities[0].id, "mrr8arq");
    assert.equal(utilities[0].attachments[0].path, "78q3b8d/financing/mrr8arq/swepco.jpg");
  });
});

describe("partitionJobCosts — utility is not loan interest", () => {
  it("keeps live Parkers SWEPCO rows as other until Brick flips type", () => {
    const { utilities, financing } = partitionJobCosts(parkers.financingCosts);
    assert.deepEqual(financing.map((f) => f.id), ["mrr8arq", "swpb196", "swp8538"]);
    assert.equal(utilities.length, 0);
    assert.equal(sumAmounts(financing), 1130.45 + 196.85 + 85.38);
    assert.equal(sumAmounts(utilities), 0);
  });

  it("moves only type=utility into Utilities; amounts stay the same", () => {
    const flipped = parkers.financingCosts.map((f) =>
      f.id === "mrr8arq" || f.id === "swpb196" || f.id === "swp8538"
        ? { ...f, type: "utility" }
        : f
    );
    const { utilities, financing } = partitionJobCosts(flipped);
    assert.equal(financing.length, 0);
    assert.deepEqual(utilities.map((f) => f.id), ["mrr8arq", "swpb196", "swp8538"]);
    assert.equal(utilities.find((f) => f.id === "mrr8arq").amount, "1130.45");
    assert.equal(utilities.find((f) => f.id === "swpb196").amount, "196.85");
    assert.equal(utilities.find((f) => f.id === "swp8538").amount, "85.38");
    assert.equal(sumAmounts(utilities) + sumAmounts(financing), 1130.45 + 196.85 + 85.38);
  });

  it("leaves construction/lot/other in financing", () => {
    const mixed = [
      { id: "a", type: "construction", amount: "100" },
      { id: "b", type: "lot", amount: "50" },
      { id: "c", type: "other", amount: "25" },
      { id: "d", type: "utility", amount: "10" },
    ];
    const { utilities, financing } = partitionJobCosts(mixed);
    assert.deepEqual(financing.map((f) => f.id), ["a", "b", "c"]);
    assert.deepEqual(utilities.map((f) => f.id), ["d"]);
    assert.equal(isUtilityCost(mixed[3]), true);
    assert.equal(isUtilityCost(mixed[2]), false);
    assert.equal(sumAmounts(mixed), 185);
  });
});
