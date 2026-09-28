import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  groupSelectionsByRoom,
  isClientSelection,
  isFlip,
  isProductSelection,
  isResidential,
  phaseTemplateKind,
  productSelections,
  projectWithType,
  replaceProductSelections,
  selectionPhoto,
} from "./jobModel.js";

const hardwareTask = {
  id: "hardware",
  name: "Door Hardware / Bath Hardware / Pulls",
  completed: true,
  na: false,
  lineItems: [{ id: "hwli1", description: "Bath hardware", labor: "0", material: "842" }],
  payments: [{ id: "hwpay1", amount: "842", date: "9/1/2026", checkNum: "1102", note: "Hardware", attachments: [] }],
};

const palmetto = {
  id: "pm0cwjy",
  name: "1001 Palmetto",
  type: "custom",
  phases: [{ id: "d5", name: "Draw 5 — Finish", tasks: [hardwareTask] }],
  selections: [
    { id: "legacy1", title: "Countertops", optionA: "Quartz", optionB: "Granite", chosen: null },
  ],
};

describe("rental_rehab job type", () => {
  it("treats rental_rehab as residential and keeps flip profit flip-only", () => {
    for (const type of ["custom", "spec", "flip", "rental_rehab", undefined]) {
      assert.equal(phaseTemplateKind(type), "residential");
      assert.equal(isResidential(type), true);
    }
    assert.equal(phaseTemplateKind("commercial"), "commercial");
    assert.equal(phaseTemplateKind("commercial_rehab"), "commercial_rehab");
    assert.equal(isResidential("commercial"), false);
    assert.equal(isResidential("commercial_rehab"), false);
    assert.equal(isFlip("flip"), true);
    assert.equal(isFlip("rental_rehab"), false);
    assert.equal(isFlip("custom"), false);
  });

  it("keeps existing tasks, line items, and payments when switching to rental_rehab", () => {
    const seeded = [{ id: "d1", tasks: [{ id: "survey", lineItems: [], payments: [] }] }];
    const next = projectWithType(palmetto, "rental_rehab", seeded);
    assert.equal(next.type, "rental_rehab");
    assert.equal(next.phases, palmetto.phases);
    assert.equal(next.phases[0].tasks[0], hardwareTask);
    assert.equal(next.phases[0].tasks[0].payments[0].amount, "842");
    assert.equal(next.phases[0].tasks[0].lineItems[0].material, "842");
    assert.equal(next.selections, palmetto.selections);
    assert.equal(next.name, "1001 Palmetto");
  });

  it("seeds phases only when the job has no tasks", () => {
    const seeded = [{ id: "d1", tasks: [{ id: "survey", lineItems: [], payments: [] }] }];
    const empty = { id: "new", type: "custom", phases: [{ id: "d1", tasks: [] }] };
    const next = projectWithType(empty, "rental_rehab", seeded);
    assert.equal(next.phases, seeded);
    assert.equal(next.type, "rental_rehab");

    const missing = { id: "new2", type: "flip" };
    assert.equal(projectWithType(missing, "rental_rehab", seeded).phases, seeded);
  });
});

describe("data.selections product rows", () => {
  it("defaults a missing selections array to no product rows", () => {
    assert.deepEqual(productSelections({}), []);
    assert.deepEqual(productSelections({ selections: null }), []);
  });

  it("tells product rows from client-portal rows", () => {
    const product = { id: "abc1234", item: "Faucet", room: "Bath" };
    const client = { id: "legacy1", title: "Countertops", optionA: "Quartz", optionB: "Granite" };
    assert.equal(isProductSelection(product), true);
    assert.equal(isClientSelection(product), false);
    assert.equal(isProductSelection(client), false);
    assert.equal(isClientSelection(client), true);
    assert.equal(isProductSelection({ id: "x", item: "Paint", title: "Nope", optionA: "A" }), false);
  });

  it("replaces product rows without dropping client rows, tasks, or payments", () => {
    const products = [{
      id: "sel0001",
      item: "Vanity faucet",
      room: "Bath",
      brand: "Delta",
      model: "",
      color: "",
      vendor: "",
      link: "",
      notes: "",
      photo: null,
      createdAt: "2026-09-28T00:00:00.000Z",
      updatedAt: "2026-09-28T00:00:00.000Z",
    }];
    const next = replaceProductSelections(palmetto, products);
    assert.equal(next.phases, palmetto.phases);
    assert.equal(next.phases[0].tasks[0].payments[0].id, "hwpay1");
    assert.equal(next.selections[0].id, "legacy1");
    assert.equal(next.selections[1].item, "Vanity faucet");
    assert.deepEqual(productSelections(next).map((r) => r.id), ["sel0001"]);

    const replaced = replaceProductSelections(next, [{ ...products[0], color: "Chrome", updatedAt: "2026-09-28T01:00:00.000Z" }]);
    assert.equal(replaced.selections.filter(isClientSelection).length, 1);
    assert.equal(productSelections(replaced)[0].color, "Chrome");
    assert.equal(replaced.phases[0].tasks[0].lineItems[0].description, "Bath hardware");
  });

  it("stores a photo as id, path, name, and mime only", () => {
    assert.equal(selectionPhoto(null), null);
    assert.equal(selectionPhoto({ id: "p1" }), null);
    assert.deepEqual(
      selectionPhoto({ id: "p1", path: "pm0cwjy/selections/sel0001/faucet.jpg", name: "faucet.jpg", mime: "image/jpeg", signedUrl: "https://example.test/secret" }),
      { id: "p1", path: "pm0cwjy/selections/sel0001/faucet.jpg", name: "faucet.jpg", mime: "image/jpeg" },
    );
  });

  it("groups by room and sorts rooms, with No room last", () => {
    const groups = groupSelectionsByRoom([
      { id: "1", item: "Tile", room: "Kitchen" },
      { id: "2", item: "Paint", room: "" },
      { id: "3", item: "Faucet", room: "Bath" },
      { id: "4", item: "Mirror", room: "Bath" },
    ]);
    assert.deepEqual(groups.map((g) => g.room), ["Bath", "Kitchen", "No room"]);
    assert.deepEqual(groups[0].rows.map((r) => r.item), ["Faucet", "Mirror"]);
  });
});

describe("app wiring", () => {
  const app = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  const supabase = readFileSync(new URL("./supabase.js", import.meta.url), "utf8");

  it("registers the rental rehab label and residential draws", () => {
    assert.match(app, /value:"rental_rehab", label:"Residential Rehab \/ Rental", short:"Rental"/);
    assert.match(app, /phaseTemplateKind/);
    assert.match(app, /projectWithType/);
    assert.match(app, /Finishes & Products/);
    assert.doesNotMatch(app, /isFlip\s*=\s*\(type\)\s*=>\s*type === "flip" \|\| type === "rental_rehab"/);
  });

  it("uploads selection photos with the job-receipts path convention", () => {
    assert.match(supabase, /uploadSelectionPhoto/);
    assert.match(supabase, /\/selections\//);
    assert.match(supabase, /job-receipts/);
    assert.match(supabase, /return \{ id: uid\(\), path, name, mime \}/);
  });
});
