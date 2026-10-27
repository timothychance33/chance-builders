# Estimate, bid, and actual

Chance Builders stores this on `public.projects.data` (jsonb). The row key is `projects.id`. The app loads a project as `{ id, ...data }` and saves it with `saveProject`, which upserts the whole `data` object. Do not replace `data` with a partial object.

Actual job costs stay where they already are: `phases[].tasks[].lineItems[]` (`labor` and `material` strings). Payments stay on `phases[].tasks[].payments[]`. This feature does not move those.

## `data.budget_lines`

Optional array. If the key is missing, null, or not an array, the job still opens. Each object is one trade/task.

The key is `task_id`, and it must equal an existing `phases[].tasks[].id` on that job. Actuals roll up by that id. A `task_id` that is not on the job is ignored. One object per `task_id`. If the same id appears twice, the last object wins.

```json
{
  "task_id": "rough_plumb",
  "estimate": "12500",
  "bid": {
    "amount": "11800",
    "contractor_id": "gn7xk0k",
    "date": "2026-10-15",
    "status": "received"
  }
}
```

| Field | Rule |
| --- | --- |
| `task_id` | Required string. `phases[].tasks[].id` from this job. |
| `estimate` | Dollar amount as a string, no `$` and no commas. `""` means blank. `"0"` is a real zero. Missing key is treated as blank. |
| `bid` | Object. The app always writes one. |
| `bid.amount` | Same amount rules as `estimate`. |
| `bid.contractor_id` | Optional. `contractors.id`, or `null` when no vendor is attached. |
| `bid.date` | Optional. `YYYY-MM-DD`, or `""`. |
| `bid.status` | Optional. `requested`, `received`, `accepted`, `rejected`, or `""`. |

A budget line does not store actual. Actual for that task is the sum of its line-item `labor` and `material`. If that sum is 0, the screen falls back to a legacy `task.actual` string. Checks (`payments`), `financingCosts`, and `changeOrders` are not added into this actual.

### Jobs that already have numbers

Some tasks already have string fields `estimate`, `bid`, and `actual` on the task itself (the old budget screen wrote those). There is no `budget_lines` array on current jobs.

- No `budget_lines` entry for that `task_id`: the screen shows `task.estimate` and `task.bid`.
- An entry exists: that entry is what the screen shows, even when `estimate` is `""`. The old task fields are left as they are.

Tasks with neither still show on the job. Their estimate and bid are blank, and their variance is blank. Blank or zero does not divide by zero.

### Variance

Per task, and again on the phase and job totals:

| Comparison | Dollars | Percent |
| --- | --- | --- |
| Actual vs bid | actual − bid | (actual − bid) / bid × 100 |
| Bid vs estimate | bid − estimate | (bid − estimate) / estimate × 100 |

If that side is blank (`""` or missing), dollars and percent are blank. If the baseline amount is `"0"`, dollars still show and percent is blank.

Over budget means the dollar variance is greater than 0. The screen shows that in red. Under budget is green. A blank comparison is not red.

Job totals add every task. A task with no bid still counts in the actual total, so unbid costs show up against the bid total. Estimate and bid totals skip blank amounts and include explicit zeros.

## 224 Denali (`ot0e7y0`)

Spec job, residential six-draw checklist. It has no `budget_lines` yet and no line-item costs yet. Add the array on the existing `data` object. Do not rewrite `phases`.

Repeat the example object once per trade you are pricing. `task_id` values on this job:

| Phase | `task_id` | Task |
| --- | --- | --- |
| Foundation `d1` | `survey` | Land Survey & Lot Assessment |
| Foundation `d1` | `plans` | Architectural Plans / Blueprints Finalized |
| Foundation `d1` | `zoning` | Zoning Research Confirmed |
| Foundation `d1` | `permits` | Permits Received (Building, Electrical, Plumbing, HVAC) |
| Foundation `d1` | `insurance` | Builder's Risk Insurance Secured |
| Foundation `d1` | `bids` | Sub Bids Collected & Contracts Signed |
| Foundation `d1` | `financing` | Financing Confirmed |
| Foundation `d1` | `demo` | Demo / Clearing (if needed) |
| Foundation `d1` | `clear` | Lot Clearing — Trees, Debris, Structures |
| Foundation `d1` | `grade` | Grading & Drainage Plan Executed |
| Foundation `d1` | `util` | Underground Utilities Trenched (Water, Sewer, Electric) |
| Foundation `d1` | `stake` | Lot Staked / Footprint Marked |
| Foundation `d1` | `popo` | Port-O-Potty & Dumpster on Site |
| Foundation `d1` | `termite` | Pre-Treat for Termites (Pre-Slab) |
| Foundation `d1` | `footings` | Footings Dug, Formed & Poured |
| Foundation `d1` | `rebar` | Form Material / Rebar Installed |
| Foundation `d1` | `pump1` | Pump Truck — Slab |
| Foundation `d1` | `slab` | Slab Poured & Reinforced |
| Foundation `d1` | `cure` | Concrete Cure Period (min. 7 days) |
| Foundation `d1` | `waterproof` | Waterproofing Membrane Applied |
| Foundation `d1` | `found_insp` | Foundation Inspection — PASSED |
| Framing `d2` | `bldg_pkg` | Building Package / Lumber Order Delivered |
| Framing `d2` | `floor` | Floor System Framed |
| Framing `d2` | `walls` | Wall Framing Complete |
| Framing `d2` | `trusses` | Roof Trusses Installed & Sheathed |
| Framing `d2` | `housewrap` | House Wrap / Weather Barrier Installed |
| Framing `d2` | `windows` | Windows & Exterior Doors Set |
| Framing `d2` | `roofing` | Roofing (Decking, Flashing, Shingles) |
| Framing `d2` | `frame_insp` | Framing Inspection — PASSED |
| Rough-In `d3` | `rough_plumb` | Rough Plumbing |
| Rough-In `d3` | `rough_elec` | Rough Electrical |
| Rough-In `d3` | `hvac_rough` | HVAC Ductwork & Equipment Rough-In |
| Rough-In `d3` | `prewire` | Pre-Wire Audio / Media / Security |
| Rough-In `d3` | `rp_insp` | Rough Plumbing Inspection — PASSED |
| Rough-In `d3` | `re_insp` | Rough Electrical Inspection — PASSED |
| Rough-In `d3` | `rh_insp` | Rough HVAC Inspection — PASSED |
| Top-Out `d4` | `insul` | Insulation Installed |
| Top-Out `d4` | `insul_insp` | Insulation Inspection — PASSED |
| Top-Out `d4` | `drywall_hang` | Drywall Hung |
| Top-Out `d4` | `drywall_tape` | Drywall Taped, Mudded & Textured |
| Top-Out `d4` | `drywall_prime` | Drywall Primed / Sealed |
| Finish `d5` | `int_paint` | Interior Paint |
| Finish `d5` | `cabinets` | Cabinetry Installed |
| Finish `d5` | `countertops` | Countertops Installed |
| Finish `d5` | `int_doors` | Interior Doors Hung |
| Finish `d5` | `trim` | Trim & Crown Molding Installed |
| Finish `d5` | `tile` | Tile Flooring Installed |
| Finish `d5` | `hardwood` | Hardwood / Carpet Installed |
| Finish `d5` | `plumb_trim` | Plumbing Trim-Out (Fixtures, Faucets, Toilets) |
| Finish `d5` | `elec_trim` | Electrical Trim-Out (Outlets, Switches, Fixtures) |
| Finish `d5` | `lighting` | Lighting Installed |
| Finish `d5` | `hvac_trim` | HVAC Trim-Out (Registers, Thermostats, Commissioning) |
| Finish `d5` | `fixtures` | Fixtures / Water Heaters |
| Finish `d5` | `garage_doors` | Garage Doors Installed |
| Finish `d5` | `glass` | Glass & Mirrors |
| Finish `d5` | `hardware` | Door Hardware / Bath Hardware / Pulls |
| Finish `d5` | `lockout` | Lockout Trim / Final Hardware |
| Closeout `d6` | `brick` | Brick / Siding / Stucco Applied |
| Closeout `d6` | `ext_paint` | Exterior Paint |
| Closeout `d6` | `drv_dirt` | Driveway Dirt / Pad Work |
| Closeout `d6` | `drv_pump` | Pump Truck — Driveway |
| Closeout `d6` | `drv_concrete` | Concrete Driveway Poured |
| Closeout `d6` | `drv_labor` | Driveway Labor / Finish |
| Closeout `d6` | `gutters` | Gutters Installed |
| Closeout `d6` | `screens` | Screens Installed |
| Closeout `d6` | `fence` | Fence (if applicable) |
| Closeout `d6` | `landscape` | Flower Beds / Landscaping |
| Closeout `d6` | `sod` | Sod / Final Grade |
| Closeout `d6` | `cleanup` | Job Cleanup |
| Closeout `d6` | `final_clean` | Final Clean / Power Wash |
| Closeout `d6` | `fire` | Fire Equipment Installed |
| Closeout `d6` | `fp_insp` | Final Plumbing Inspection — PASSED |
| Closeout `d6` | `fe_insp` | Final Electrical Inspection — PASSED |
| Closeout `d6` | `fh_insp` | Final HVAC Inspection — PASSED |
| Closeout `d6` | `fb_insp` | Final Building Inspection — PASSED |
| Closeout `d6` | `cert_occ` | Certificate of Occupancy Issued |
| Closeout `d6` | `punch` | Builder Punch List Walk-Through Complete |
| Closeout `d6` | `owner_walk` | Owner / Client Walk-Through & Sign-Off |

Skip a task you are not pricing. Do not invent new task ids. Contractor ids already on the directory include `gn7xk0k` (Precision Plumbing) and `zjqfvzl` (Ramos Remodeling). Leave `contractor_id` null until you know the vendor.

### Writing rows directly

1. `select data from projects where id = 'ot0e7y0'`.
2. If `data.budget_lines` is missing, start from `[]`.
3. Append or replace objects, matched on `task_id`.
4. Upsert the **full** `data` object, including `phases`, line items, and payments.

Commercial jobs use their own task ids (`cr_plumb`, `c_plumb`, and the rest of that template). Read `phases` on that row instead of the Denali list above.
