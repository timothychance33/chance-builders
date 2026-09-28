/**
 * Local stand-in for 1001 Palmetto (`?fixture=palmetto`).
 * Money is already on task "hardware". Nothing here is written to Supabase.
 */
export const palmettoProject = {
  id: "pm0cwjy",
  name: "1001 Palmetto",
  address: "1001 Palmetto",
  type: "custom",
  salePrice: "240000",
  markupPct: "10",
  clientName: "Palmetto Owner",
  clientEmail: "owner@example.com",
  clientPin: "PAL001",
  createdAt: "2026-06-01T00:00:00.000Z",
  phases: [
    {
      id: "d5",
      name: "Draw 5 — Finish",
      short: "Finish",
      icon: "🎨",
      tasks: [
        {
          id: "hardware",
          name: "Door Hardware / Bath Hardware / Pulls",
          completed: true,
          na: false,
          contractorId: null,
          notes: "Schlage",
          failedInspections: [],
          lineItems: [
            { id: "hwli1", description: "Bath hardware", labor: "0", material: "842" },
          ],
          payments: [
            {
              id: "hwpay1",
              amount: "842",
              date: "9/1/2026",
              checkNum: "1102",
              lienWaiver: false,
              note: "Hardware",
              attachments: [],
            },
          ],
        },
      ],
    },
  ],
  changeOrders: [],
  selections: [
    {
      id: "legacy1",
      title: "Countertops",
      description: "Kitchen",
      optionA: "Quartz",
      optionB: "Granite",
      imageA: "",
      imageB: "",
      chosen: null,
      chosenAt: null,
      createdAt: "2026-06-02T00:00:00.000Z",
    },
  ],
  jobLog: [],
  finishes: [],
};
