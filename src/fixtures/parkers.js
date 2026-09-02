/** Compact Parkers Drug-shaped fixture for local Financials UI checks (`?fixture=parkers`). */
export const parkersProject = {
  id: "fixture-parkers",
  name: "Parkers Drug",
  type: "commercial_rehab",
  phases: [
    {
      id: "cr3",
      short: "MEP",
      name: "MEP",
      icon: "🔧",
      tasks: [
        {
          id: "cr_plumb",
          name: "Plumbing Rough / Replacement",
          completed: false,
          na: false,
          lineItems: [
            { id: "lnsewer", labor: "3500.00", material: "0", description: "Replace and reroute sewer line" },
            { id: "lnwline", labor: "690.00", material: "0", description: "Repair broken water line, meter and box" },
            { id: "lnwsrvc", labor: "500.00", material: "0", description: "New water service, 2 connections and stub outs" },
          ],
          payments: [
            {
              id: "paylnd1",
              amount: "4690.00",
              date: "8/31/2026",
              checkNum: "1091",
              note: "Lindow job 59874, Chance Builders check 1091",
              lienWaiver: false,
              attachments: [
                { id: "5ip84ym", mime: "image/jpeg", name: "lindow-job-59874.jpg", path: "78q3b8d/cr_plumb/paylnd1/lindow-job-59874_ec4a304c-2380-4bdf-97cb-981121c9fa1e.jpg" },
                { id: "w9xgz7m", mime: "image/jpeg", name: "check-1091.jpg", path: "78q3b8d/cr_plumb/paylnd1/check-1091_68924ec0-0d0f-4896-aa42-bc0cc4eebc7a.jpg" },
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
      icon: "🧱",
      tasks: [
        {
          id: "cr_fix",
          name: "Fixtures / Lighting / Hardware",
          completed: false,
          na: false,
          lineItems: [
            { id: "ol6s3tp", labor: "0", material: "2708.11", description: "Home Depot materials" },
            { id: "hd28mat", labor: "0", material: "242.67", description: "Home Depot materials 8/28" },
            { id: "hd29mat", labor: "0", material: "276.39", description: "Home Depot materials 8/29" },
            { id: "hd29pmt", labor: "0", material: "192.29", description: "Home Depot materials 8/29 PM" },
          ],
          payments: [
            { id: "linllwv", amount: "2708.11", date: "7/20/2026", note: "Home Depot", checkNum: "", lienWaiver: false, attachments: [] },
            {
              id: "payhd28",
              amount: "242.67",
              date: "8/28/2026",
              note: "Home Depot Airline Dr receipt, PO 111, card",
              checkNum: "",
              lienWaiver: false,
              attachments: [
                { id: "l95nfpi", mime: "image/jpeg", name: "home-depot-2026-08-28.jpg", path: "78q3b8d/cr_fix/payhd28/home-depot-2026-08-28_2597a4b4-518c-438f-ab1f-c535e8f2bb0f.jpg" },
              ],
            },
            {
              id: "payhd29",
              amount: "276.39",
              date: "8/29/2026",
              note: "Home Depot Airline Dr receipt, card",
              checkNum: "",
              lienWaiver: false,
              attachments: [
                { id: "f0jfwrr", mime: "image/jpeg", name: "home-depot-2026-08-29.jpg", path: "78q3b8d/cr_fix/payhd29/home-depot-2026-08-29_76ccaec8-f606-4f09-9a6c-dfc9e0418820.jpg" },
              ],
            },
            {
              id: "payhd2p",
              amount: "192.29",
              date: "8/29/2026",
              note: "Home Depot Airline Dr receipt, PO 111, AMEX",
              checkNum: "",
              lienWaiver: false,
              attachments: [
                { id: "e58fwha", mime: "image/jpeg", name: "home-depot-2026-08-29-pm.jpg", path: "78q3b8d/cr_fix/payhd2p/home-depot-2026-08-29-pm_9e1e908b-267e-4428-baec-727dfd90004e.jpg" },
              ],
            },
          ],
        },
      ],
    },
  ],
  financingCosts: [
    { id: "mrr8arq", date: "6/28/2026", type: "other", amount: "1130.45", description: "SWEPCO", attachments: [] },
  ],
  changeOrders: [],
};
