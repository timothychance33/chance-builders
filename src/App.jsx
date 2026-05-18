import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "chance_builders_v2";
const save = async (data) => { try { await window.storage.set(STORAGE_KEY, JSON.stringify(data)); } catch { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } };
const load = async () => { try { const r = await window.storage.get(STORAGE_KEY); return r ? JSON.parse(r.value) : null; } catch { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } };
const uid = () => Math.random().toString(36).slice(2, 9);
const num = (s) => { const v = parseFloat(s); return isNaN(v) ? 0 : v; };
const fmt = (n) => "$" + num(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const today = () => new Date().toLocaleDateString();
const now = () => new Date().toLocaleString();

// ── PHASE / TASK TEMPLATE ─────────────────────────────────────────────────
const DRAW_PHASES = [
  { id:"d1", name:"Draw 1 — Foundation & Pad", short:"Foundation", icon:"🏗️", tasks:[
    {id:"survey",name:"Land Survey & Lot Assessment"},
    {id:"plans",name:"Architectural Plans / Blueprints Finalized"},
    {id:"zoning",name:"Zoning Research Confirmed"},
    {id:"permits",name:"Permits Received (Building, Electrical, Plumbing, HVAC)"},
    {id:"insurance",name:"Builder's Risk Insurance Secured"},
    {id:"bids",name:"Sub Bids Collected & Contracts Signed"},
    {id:"financing",name:"Financing Confirmed"},
    {id:"demo",name:"Demo / Clearing (if needed)"},
    {id:"clear",name:"Lot Clearing — Trees, Debris, Structures"},
    {id:"grade",name:"Grading & Drainage Plan Executed"},
    {id:"util",name:"Underground Utilities Trenched (Water, Sewer, Electric)"},
    {id:"stake",name:"Lot Staked / Footprint Marked"},
    {id:"popo",name:"Port-O-Potty & Dumpster on Site"},
    {id:"termite",name:"Pre-Treat for Termites (Pre-Slab)"},
    {id:"footings",name:"Footings Dug, Formed & Poured"},
    {id:"rebar",name:"Form Material / Rebar Installed"},
    {id:"pump1",name:"Pump Truck — Slab"},
    {id:"slab",name:"Slab Poured & Reinforced"},
    {id:"cure",name:"Concrete Cure Period (min. 7 days)"},
    {id:"waterproof",name:"Waterproofing Membrane Applied"},
    {id:"found_insp",name:"Foundation Inspection — PASSED", isInspection:true},
  ]},
  { id:"d2", name:"Draw 2 — Frame & Dry-In", short:"Framing", icon:"🪵", tasks:[
    {id:"bldg_pkg",name:"Building Package / Lumber Order Delivered"},
    {id:"floor",name:"Floor System Framed"},
    {id:"walls",name:"Wall Framing Complete"},
    {id:"trusses",name:"Roof Trusses Installed & Sheathed"},
    {id:"housewrap",name:"House Wrap / Weather Barrier Installed"},
    {id:"windows",name:"Windows & Exterior Doors Set"},
    {id:"roofing",name:"Roofing (Decking, Flashing, Shingles)"},
    {id:"frame_insp",name:"Framing Inspection — PASSED", isInspection:true},
  ]},
  { id:"d3", name:"Draw 3 — Rough-In", short:"Rough-In", icon:"🔧", tasks:[
    {id:"rough_plumb",name:"Rough Plumbing"},
    {id:"rough_elec",name:"Rough Electrical"},
    {id:"hvac_rough",name:"HVAC Ductwork & Equipment Rough-In"},
    {id:"prewire",name:"Pre-Wire Audio / Media / Security"},
    {id:"rp_insp",name:"Rough Plumbing Inspection — PASSED", isInspection:true},
    {id:"re_insp",name:"Rough Electrical Inspection — PASSED", isInspection:true},
    {id:"rh_insp",name:"Rough HVAC Inspection — PASSED", isInspection:true},
  ]},
  { id:"d4", name:"Draw 4 — Top-Out", short:"Top-Out", icon:"🧱", tasks:[
    {id:"insul",name:"Insulation Installed"},
    {id:"insul_insp",name:"Insulation Inspection — PASSED", isInspection:true},
    {id:"drywall_hang",name:"Drywall Hung"},
    {id:"drywall_tape",name:"Drywall Taped, Mudded & Textured"},
    {id:"drywall_prime",name:"Drywall Primed / Sealed"},
  ]},
  { id:"d5", name:"Draw 5 — Finish", short:"Finish", icon:"🎨", tasks:[
    {id:"int_paint",name:"Interior Paint"},
    {id:"cabinets",name:"Cabinetry Installed"},
    {id:"countertops",name:"Countertops Installed"},
    {id:"int_doors",name:"Interior Doors Hung"},
    {id:"trim",name:"Trim & Crown Molding Installed"},
    {id:"tile",name:"Tile Flooring Installed"},
    {id:"hardwood",name:"Hardwood / Carpet Installed"},
    {id:"plumb_trim",name:"Plumbing Trim-Out (Fixtures, Faucets, Toilets)"},
    {id:"elec_trim",name:"Electrical Trim-Out (Outlets, Switches, Fixtures)"},
    {id:"lighting",name:"Lighting Installed"},
    {id:"hvac_trim",name:"HVAC Trim-Out (Registers, Thermostats, Commissioning)"},
    {id:"fixtures",name:"Fixtures / Water Heaters"},
    {id:"garage_doors",name:"Garage Doors Installed"},
    {id:"glass",name:"Glass & Mirrors"},
    {id:"hardware",name:"Door Hardware / Bath Hardware / Pulls"},
    {id:"lockout",name:"Lockout Trim / Final Hardware"},
  ]},
  { id:"d6", name:"Draw 6 — Final & Closeout", short:"Closeout", icon:"✅", tasks:[
    {id:"brick",name:"Brick / Siding / Stucco Applied"},
    {id:"ext_paint",name:"Exterior Paint"},
    {id:"drv_dirt",name:"Driveway Dirt / Pad Work"},
    {id:"drv_pump",name:"Pump Truck — Driveway"},
    {id:"drv_concrete",name:"Concrete Driveway Poured"},
    {id:"drv_labor",name:"Driveway Labor / Finish"},
    {id:"gutters",name:"Gutters Installed"},
    {id:"screens",name:"Screens Installed"},
    {id:"fence",name:"Fence (if applicable)"},
    {id:"landscape",name:"Flower Beds / Landscaping"},
    {id:"sod",name:"Sod / Final Grade"},
    {id:"cleanup",name:"Job Cleanup"},
    {id:"final_clean",name:"Final Clean / Power Wash"},
    {id:"fire",name:"Fire Equipment Installed"},
    {id:"fp_insp",name:"Final Plumbing Inspection — PASSED", isInspection:true},
    {id:"fe_insp",name:"Final Electrical Inspection — PASSED", isInspection:true},
    {id:"fh_insp",name:"Final HVAC Inspection — PASSED", isInspection:true},
    {id:"fb_insp",name:"Final Building Inspection — PASSED", isInspection:true},
    {id:"cert_occ",name:"Certificate of Occupancy Issued"},
    {id:"punch",name:"Builder Punch List Walk-Through Complete"},
    {id:"owner_walk",name:"Owner / Client Walk-Through & Sign-Off"},
  ]},
];

const buildPhases = () => DRAW_PHASES.map(ph=>({
  ...ph,
  tasks: ph.tasks.map(t=>({
    ...t, completed:false, na:false,
    contractorId:null, notes:"", failedInspections:[],
    lineItems:[], payments:[],
  }))
}));

// ── STYLES ────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d1117;color:#e6e2d8;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
:root{--gold:#c8a456;--dark:#0d1117;--card:#161b24;--card2:#1c2230;--border:#252d3d;--text:#e6e2d8;--muted:#6b7592;--red:#e05252;--green:#4dbb78;--blue:#4e90d9;--purple:#9b7fe8}
.app{max-width:430px;margin:0 auto;padding-bottom:72px;min-height:100vh}
.hdr{background:var(--card);border-bottom:1px solid var(--border);padding:13px 16px;position:sticky;top:0;z-index:100;display:flex;align-items:center;gap:10px}
.hdr-mark{width:33px;height:33px;background:var(--gold);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:17px;color:#0d1117;flex-shrink:0;border-radius:2px}
.hdr-title{font-family:'Bebas Neue',sans-serif;font-size:19px;color:var(--gold);letter-spacing:1.5px;line-height:1}
.hdr-sub{font-size:9px;color:var(--muted);letter-spacing:.8px;text-transform:uppercase;margin-top:1px}
.hdr-back{margin-left:auto;background:transparent;border:1px solid var(--border);color:var(--muted);padding:5px 11px;border-radius:6px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap}
.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:430px;background:var(--card);border-top:1px solid var(--border);display:flex;z-index:100}
.nb{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 0;cursor:pointer;background:none;border:none;color:var(--muted);font-size:9px;font-family:'DM Sans',sans-serif;text-transform:uppercase;letter-spacing:.5px;transition:color .15s}
.nb.on{color:var(--gold)}
.nb svg{width:18px;height:18px}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:15px;margin:10px 13px}
.c2{background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:10px}
.btn{background:var(--gold);color:#0d1117;border:none;border-radius:8px;padding:11px 18px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:14px;cursor:pointer;width:100%}
.btn:active{opacity:.85}
.bto{background:transparent;color:var(--gold);border:1px solid var(--gold);border-radius:8px;padding:8px 13px;font-family:'DM Sans',sans-serif;font-weight:500;font-size:13px;cursor:pointer}
.bts{background:transparent;color:var(--blue);border:1px solid var(--blue);border-radius:8px;padding:8px 13px;font-family:'DM Sans',sans-serif;font-weight:500;font-size:13px;cursor:pointer}
.btg{background:var(--card2);color:var(--muted);border:1px solid var(--border);border-radius:8px;padding:9px;font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;width:100%;margin-top:8px}
.btd{background:transparent;color:var(--red);border:1px solid rgba(224,82,82,.35);border-radius:6px;padding:5px 10px;font-family:'DM Sans',sans-serif;font-size:11px;cursor:pointer}
.inp{background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;width:100%;outline:none;-webkit-appearance:none}
.inp:focus{border-color:var(--gold)}
.inp::placeholder{color:var(--muted)}
.lbl{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;display:block}
.fld{margin-bottom:12px}
.sec{font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--gold);letter-spacing:1px;padding:13px 16px 5px}
.pb{height:3px;background:var(--border);border-radius:2px;overflow:hidden}
.pf{height:100%;background:var(--gold);border-radius:2px;transition:width .4s}
.tag{display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:500}
.tg{background:rgba(77,187,120,.12);color:var(--green)}
.tr{background:rgba(224,82,82,.12);color:var(--red)}
.tgo{background:rgba(200,164,86,.12);color:var(--gold)}
.tb{background:rgba(78,144,217,.12);color:var(--blue)}
.tp{background:rgba(155,127,232,.12);color:var(--purple)}
.tm{background:rgba(107,117,146,.12);color:var(--muted)}
.div{border:none;border-top:1px solid var(--border);margin:10px 0}
.cr{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}
.cr:last-child{border-bottom:none}
.ck{width:22px;height:22px;border-radius:5px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;margin-top:1px;transition:all .15s}
.ck.done{background:var(--gold);border-color:var(--gold)}
.ck.insp{border-color:var(--blue)}
.ck.insp.done{background:var(--green);border-color:var(--green)}
.ck.na{background:var(--border);border-color:var(--border)}
.cl{flex:1;font-size:13px;line-height:1.4}
.cl.done{text-decoration:line-through;color:var(--muted)}
.cl.na{color:var(--muted);font-style:italic}
.lkb{background:rgba(200,164,86,.07);border:1px solid rgba(200,164,86,.18);border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--gold);margin:0 13px 8px}
.mb{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:200;display:flex;align-items:flex-end;justify-content:center}
.modal{background:var(--card);border-radius:16px 16px 0 0;padding:20px 16px 28px;width:100%;max-width:430px;max-height:90vh;overflow-y:auto}
.mt{font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--gold);margin-bottom:14px;letter-spacing:1px}
.ph{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--card);border-bottom:1px solid var(--border);cursor:pointer;user-select:none}
.phn{font-weight:600;font-size:13px;flex:1}
.phc{font-size:11px;color:var(--muted);flex-shrink:0}
.cbdg{display:inline-flex;align-items:center;gap:4px;background:var(--card2);border:1px solid var(--border);border-radius:20px;padding:2px 8px;font-size:10px;color:var(--muted);margin-top:4px}
.igrid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px}
.icard{border:2px solid var(--border);border-radius:9px;overflow:hidden;cursor:pointer;transition:border-color .2s}
.icard.sel{border-color:var(--gold)}
.icard-lbl{padding:7px;font-size:12px;text-align:center;font-weight:500}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.stars{display:flex;gap:4px}
.star{font-size:20px;cursor:pointer;color:var(--border);transition:color .1s}
.star.on{color:var(--gold)}
select.inp option{background:#1c2230}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.pill{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;border:1px solid var(--border);cursor:pointer;font-family:'DM Sans',sans-serif}
.tab-row{display:flex;border-bottom:1px solid var(--border);margin-bottom:14px}
.tab{flex:1;padding:9px 4px;text-align:center;font-size:12px;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent}
.tab.on{color:var(--gold);border-bottom-color:var(--gold)}
`;

// ── ICONS ──────────────────────────────────────────────────────────────────
const Ic = {
  Home:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
  List:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>,
  People:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  Dollar:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  Eye:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Check:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  Plus:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Lock:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  Chev:({u})=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14,transform:u?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>,
  X:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Phone:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:11,height:11}}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 12.8a19.79 19.79 0 01-3.07-8.64A2 2 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  Trash:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:15,height:15}}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
  Dots:()=><svg viewBox="0 0 24 24" fill="currentColor" style={{width:15,height:15}}><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>,
  Log:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Palette:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="9" r="1.5" fill="currentColor"/><circle cx="15.5" cy="9" r="1.5" fill="currentColor"/><circle cx="12" cy="15" r="1.5" fill="currentColor"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2v-1c0-.55.45-1 1-1h1c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/></svg>,
};

// ── MODAL WRAPPER ──────────────────────────────────────────────────────────
function Modal({children,onClose,title}){
  return (
    <div className="mb" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          {title&&<div className="mt" style={{marginBottom:0}}>{title}</div>}
          <button style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",marginLeft:"auto",padding:2}} onClick={onClose}><Ic.X/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── APP ────────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("dash");
  const [projects,setProjects]=useState([]);
  const [contractors,setContractors]=useState([]);
  const [activeId,setActiveId]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [error,setError]=useState(null);
  const [saving,setSaving]=useState(false);

  // ── Load from Supabase on mount ──
  useEffect(()=>{
    Promise.all([loadProjects(), loadContractors()])
      .then(([projs, conts])=>{ setProjects(projs); setContractors(conts); setLoaded(true); })
      .catch(e=>{ console.error(e); setError("Could not connect to database. Check your connection."); setLoaded(true); });
  },[]);

  // ── Project ops ──
  const setProj = useCallback(async (updated, projectToSave) => {
    setProjects(updated);
    if(projectToSave){ setSaving(true); try{ await saveProject(projectToSave); }catch(e){ console.error(e); } finally{ setSaving(false); } }
  },[]);

  const updateActive = useCallback((u)=>{ setProj(projects.map(p=>p.id===u.id?u:p), u); },[projects, setProj]);

  const removeProject = useCallback(async (id)=>{ setProjects(prev=>prev.filter(p=>p.id!==id)); await deleteProject(id); },[]);

  // ── Contractor ops ──
  const setCont = useCallback(async (updated, contToSave, contToDelete) => {
    setContractors(updated);
    if(contToSave){ try{ await saveContractor(contToSave); }catch(e){ console.error(e); } }
    if(contToDelete){ try{ await deleteContractor(contToDelete); }catch(e){ console.error(e); } }
  },[]);

  const active=projects.find(p=>p.id===activeId);
  const openProject=(id)=>{setActiveId(id);setTab("check");};
  const needsProject=["check","fin","portal","log","finishes"].includes(tab)&&!active;
  const tabLabel={dash:"Project Dashboard",check:active?.name||"Checklist",fin:active?.name||"Financials",subs:"Subcontractors",portal:"Client Portal",log:"Job Log",finishes:"Finishes & Specs"};

  if(!loaded) return (
    <div>
      <style>{CSS}</style>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:16}}>
        <div style={{color:"var(--gold)",fontFamily:"'Bebas Neue',sans-serif",fontSize:26,letterSpacing:3}}>CHANCE BUILDERS</div>
        <div style={{color:"var(--muted)",fontSize:13}}>Connecting to database...</div>
      </div>
    </div>
  );

  return (
    <div>
      <style>{CSS}</style>
      <div className="app">
        <div className="hdr">
          <img src="/cb-logo.png" alt="Chance Builders" style={{height:"33px",width:"33px",objectFit:"cover",borderRadius:"2px",flexShrink:0}}/>
          <div>
            <div className="hdr-title">Chance Builders</div>
            <div className="hdr-sub" style={{display:"flex",alignItems:"center",gap:5}}>
              {tabLabel[tab]||""}
              {saving&&<span style={{fontSize:8,color:"var(--gold)",marginLeft:4}}>● saving</span>}
            </div>
          </div>
          {active&&["check","fin","portal","log","finishes"].includes(tab)&&
            <button className="hdr-back" onClick={()=>{setActiveId(null);setTab("dash")}}>← Projects</button>}
        </div>
        {error&&<div style={{margin:"10px 13px",padding:"10px 13px",background:"rgba(224,82,82,.1)",border:"1px solid rgba(224,82,82,.2)",borderRadius:8,fontSize:12,color:"var(--red)"}}>{error}</div>}
        {needsProject
          ?<div style={{padding:40,textAlign:"center"}}><div style={{fontSize:48,marginBottom:14}}>🏗️</div><div style={{color:"var(--muted)",marginBottom:18}}>Select a project first</div><button className="btn" style={{width:"auto",padding:"10px 28px"}} onClick={()=>setTab("dash")}>Go to Dashboard</button></div>
          :<div>
            {tab==="dash"&&<Dashboard projects={projects} contractors={contractors} onOpen={openProject} onUpdate={setProj} onDelete={removeProject}/>}
            {tab==="check"&&active&&<Checklist project={active} contractors={contractors} onUpdate={updateActive}/>}
            {tab==="fin"&&active&&<Financials project={active} onUpdate={updateActive}/>}
            {tab==="subs"&&<Subs contractors={contractors} onUpdate={setCont}/>}
            {tab==="portal"&&active&&<Portal project={active} onUpdate={updateActive}/>}
            {tab==="log"&&active&&<JobLog project={active} onUpdate={updateActive}/>}
            {tab==="finishes"&&active&&<Finishes project={active} onUpdate={updateActive}/>}
          </div>
        }
      </div>
      <nav className="bnav">
        {[{id:"dash",l:"Projects",Ic:Ic.Home},{id:"check",l:"Checklist",Ic:Ic.List},{id:"fin",l:"Financials",Ic:Ic.Dollar},{id:"subs",l:"Subs",Ic:Ic.People},{id:"portal",l:"Client",Ic:Ic.Eye},{id:"log",l:"Job Log",Ic:Ic.Log},{id:"finishes",l:"Finishes",Ic:Ic.Palette}]
          .map(({id,l,Ic:NavIc})=><button key={id} className={`nb${tab===id?" on":""}`} onClick={()=>setTab(id)} style={{fontSize:"8px"}}><NavIc/>{l}</button>)}
      </nav>
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
function Dashboard({projects,contractors,onOpen,onUpdate,onDelete}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({name:"",address:"",salePrice:"",markupPct:"10",startDate:"",type:"custom",clientName:"",clientEmail:""});

  const create=()=>{
    if(!form.name.trim()) return;
    const p={id:uid(),...form,clientPin:uid().toUpperCase().slice(0,6),createdAt:new Date().toISOString(),phases:buildPhases(),changeOrders:[],selections:[],jobLog:[],finishes:[]};
    onUpdate([...projects,p], p);
    setModal(false);
    setForm({name:"",address:"",salePrice:"",markupPct:"10",startDate:"",type:"custom",clientName:"",clientEmail:""});
  };

  const del=(id,e)=>{e.stopPropagation();if(confirm("Delete this project? Cannot be undone."))onDelete(id);};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 13px 4px"}}>
        <div className="sec" style={{padding:0}}>Active Builds</div>
        <button className="btn" style={{width:"auto",padding:"8px 13px",fontSize:12}} onClick={()=>setModal(true)}>+ New Project</button>
      </div>

      {projects.length===0&&<div className="card" style={{textAlign:"center",padding:34}}><div style={{fontSize:50,marginBottom:12}}>🏗️</div><div style={{color:"var(--muted)",marginBottom:16,lineHeight:1.6}}>No projects yet.<br/>Start your first build.</div><button className="btn" onClick={()=>setModal(true)}>Create First Project</button></div>}

      {projects.map(proj=>{
        const tasks=proj.phases.flatMap(ph=>ph.tasks);
        const active=tasks.filter(t=>!t.na);
        const done=active.filter(t=>t.completed).length;
        const pct=active.length?Math.round(done/active.length*100):0;
        const laborCost=tasks.flatMap(t=>t.lineItems||[]).reduce((s,li)=>s+num(li.labor),0);
        const matCost=tasks.flatMap(t=>t.lineItems||[]).reduce((s,li)=>s+num(li.material),0);
        const paid=tasks.flatMap(t=>t.payments||[]).reduce((s,p)=>s+num(p.amount),0);
        const coTotal=(proj.changeOrders||[]).filter(co=>co.status==="approved"||co.status==="complete").reduce((s,co)=>s+num(co.amount),0);
        const totalCost=laborCost+matCost+coTotal;
        const sale=num(proj.salePrice);
        const markup=totalCost*(num(proj.markupPct)/100);
        const margin=sale-(totalCost+markup);
        const cur=proj.phases.find(ph=>ph.tasks.some(t=>!t.completed&&!t.na));
        return (
          <div key={proj.id} className="card" style={{cursor:"pointer"}} onClick={()=>onOpen(proj.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:15,marginBottom:2}}>{proj.name}</div>{proj.address&&<div style={{fontSize:11,color:"var(--muted)"}}>{proj.address}</div>}</div>
              <span className={`tag ${proj.type==="spec"?"tb":"tgo"}`} style={{marginLeft:8,flexShrink:0}}>{proj.type==="spec"?"Spec":"Custom"}</span>
            </div>
            {cur&&<div style={{fontSize:11,color:"var(--muted)",marginTop:5}}>📍 {cur.short||cur.name}</div>}
            <div className="pb" style={{marginTop:7}}><div className="pf" style={{width:`${pct}%`}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:"var(--muted)"}}><span>{pct}% complete</span><span>{done}/{active.length} tasks</span></div>
            <div className="div"/>
            <div className="row3">
              {[{l:"Cost to Date",v:fmt(totalCost),c:"var(--text)"},{l:"Paid to Subs",v:fmt(paid),c:"var(--blue)"},{l:"Est. Margin",v:sale?fmt(margin):"—",c:margin>=0?"var(--green)":"var(--red)"}].map(({l,v,c})=>(
                <div key={l} className="c2"><div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".4px"}}>{l}</div><div style={{fontSize:12,fontWeight:600,marginTop:2,color:c}}>{v}</div></div>
              ))}
            </div>
            <div style={{marginTop:9,textAlign:"right"}}><button className="btd" onClick={e=>del(proj.id,e)}>Delete</button></div>
          </div>
        );
      })}

      {modal&&<Modal title="New Project" onClose={()=>setModal(false)}>
        {[{l:"Project Name *",k:"name",p:"e.g. 108 N Sibley",t:"text"},{l:"Address",k:"address",p:"Street address",t:"text"},{l:"Contract / Sale Price ($)",k:"salePrice",p:"e.g. 750000",t:"number"},{l:"Builder's Premium / Markup %",k:"markupPct",p:"10",t:"number"},{l:"Target Start Date",k:"startDate",p:"",t:"date"}].map(({l,k,p,t})=>(
          <div key={k} className="fld"><label className="lbl">{l}</label><input className="inp" type={t} placeholder={p} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>
        ))}
        <div className="fld"><label className="lbl">Build Type</label><select className="inp" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="custom">Custom (Client Build)</option><option value="spec">Spec House</option></select></div>
        <div className="div"/>
        <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:9}}>Client Portal (optional)</div>
        <div className="fld"><label className="lbl">Client Name</label><input className="inp" placeholder="John & Jane Smith" value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})}/></div>
        <div className="fld"><label className="lbl">Client Email</label><input className="inp" type="email" placeholder="client@email.com" value={form.clientEmail} onChange={e=>setForm({...form,clientEmail:e.target.value})}/></div>
        <button className="btn" onClick={create}>Create Project</button>
        <button className="btg" onClick={()=>setModal(false)}>Cancel</button>
      </Modal>}
    </div>
  );
}

// ── CHECKLIST ──────────────────────────────────────────────────────────────
function Checklist({project,contractors,onUpdate}){
  const [open,setOpen]=useState(0);
  const [taskModal,setTaskModal]=useState(null);
  const [draft,setDraft]=useState(null);
  const [failModal,setFailModal]=useState(null);
  const [failNote,setFailNote]=useState("");
  const [activeTab,setActiveTab]=useState("details");

  const effectiveDone=(ph)=>ph.tasks.filter(t=>t.completed||t.na).length===ph.tasks.length;
  const isUnlocked=(i)=>i===0||effectiveDone(project.phases[i-1]);

  const mutate=(phI,tI,upd)=>{
    const phases=project.phases.map((ph,pi)=>pi!==phI?ph:{...ph,tasks:ph.tasks.map((t,ti)=>ti!==tI?t:{...t,...upd})});
    onUpdate({...project,phases});
  };

  const toggle=(phI,tI)=>{ if(!isUnlocked(phI)) return; const t=project.phases[phI].tasks[tI]; if(t.na) return; mutate(phI,tI,{completed:!t.completed}); };
  const toggleNA=(phI,tI)=>{ const t=project.phases[phI].tasks[tI]; mutate(phI,tI,{na:!t.na,completed:false}); };

  const openEdit=(phI,tI)=>{ setDraft({...project.phases[phI].tasks[tI],lineItems:[...(project.phases[phI].tasks[tI].lineItems||[])],payments:[...(project.phases[phI].tasks[tI].payments||[])]}); setTaskModal({phI,tI}); setActiveTab("details"); };

  const saveEdit=()=>{ mutate(taskModal.phI,taskModal.tI,{contractorId:draft.contractorId,notes:draft.notes,lineItems:draft.lineItems,payments:draft.payments}); setTaskModal(null);setDraft(null); };

  const addLineItem=()=>setDraft({...draft,lineItems:[...draft.lineItems,{id:uid(),description:"",labor:"",material:""}]});
  const updLI=(id,k,v)=>setDraft({...draft,lineItems:draft.lineItems.map(li=>li.id===id?{...li,[k]:v}:li)});
  const delLI=(id)=>setDraft({...draft,lineItems:draft.lineItems.filter(li=>li.id!==id)});

  const addPayment=()=>setDraft({...draft,payments:[...draft.payments,{id:uid(),amount:"",date:today(),checkNum:"",lienWaiver:false,note:""}]});
  const updPay=(id,k,v)=>setDraft({...draft,payments:draft.payments.map(p=>p.id===id?{...p,[k]:v}:p)});
  const delPay=(id)=>setDraft({...draft,payments:draft.payments.filter(p=>p.id!==id)});

  const logFail=(phI,tI)=>{ const t=project.phases[phI].tasks[tI]; mutate(phI,tI,{failedInspections:[...(t.failedInspections||[]),{id:uid(),date:today(),note:failNote}]}); setFailModal(null);setFailNote(""); };

  return (
    <div>
      <div className="sec">6-Phase Build Checklist</div>
      {project.phases.map((ph,phI)=>{
        const unlocked=isUnlocked(phI);
        const activeTasks=ph.tasks.filter(t=>!t.na);
        const done=activeTasks.filter(t=>t.completed).length;
        const total=activeTasks.length;
        const pct=total?Math.round(done/total*100):100;
        const isOpen=open===phI;
        return (
          <div key={ph.id} style={{marginBottom:1}}>
            {!unlocked&&isOpen&&<div className="lkb"><Ic.Lock/> Complete previous phase to unlock</div>}
            <div className="ph" style={{opacity:unlocked?1:.5}} onClick={()=>setOpen(isOpen?-1:phI)}>
              <span style={{fontSize:19}}>{ph.icon}</span>
              <div style={{flex:1}}>
                <div className="phn">{ph.name}</div>
                <div className="pb" style={{marginTop:4}}><div className="pf" style={{width:`${pct}%`}}/></div>
              </div>
              <span className="phc">{done}/{total}</span><Ic.Chev u={isOpen}/>
            </div>
            {isOpen&&(
              <div style={{background:"var(--card)",borderBottom:"1px solid var(--border)",padding:"0 14px"}}>
                {ph.tasks.map((task,tI)=>{
                  const contractor=contractors.find(c=>c.id===task.contractorId);
                  const hasFails=(task.failedInspections||[]).length>0;
                  const liTotal=(task.lineItems||[]).reduce((s,li)=>s+num(li.labor)+num(li.material),0);
                  const paid=(task.payments||[]).reduce((s,p)=>s+num(p.amount),0);
                  const missingWaiver=(task.payments||[]).some(p=>num(p.amount)>0&&!p.lienWaiver);
                  return (
                    <div key={task.id} className="cr" style={{opacity:task.na?.65:1}}>
                      <div className={`ck${task.na?" na":task.completed?" done":""}${task.isInspection&&!task.completed&&!task.na?" insp":""}${task.isInspection&&task.completed?" insp done":""}`}
                        onClick={()=>toggle(phI,tI)} style={{opacity:unlocked?1:.35}}>
                        {task.completed&&!task.na&&<Ic.Check/>}
                        {task.na&&<span style={{fontSize:9,color:"var(--muted)",fontWeight:700}}>N/A</span>}
                      </div>
                      <div style={{flex:1}}>
                        <div className={`cl${task.completed?" done":""}${task.na?" na":""}`} style={{display:"flex",alignItems:"flex-start",gap:5,flexWrap:"wrap"}}>
                          <span>{task.name}</span>
                          {task.isInspection&&!task.na&&<span className="tag tb" style={{fontSize:9}}>INSP</span>}
                          {hasFails&&<span className="tag tr" style={{fontSize:9}}>⚠{task.failedInspections.length}</span>}
                          {missingWaiver&&<span className="tag tr" style={{fontSize:9}}>NO WAIVER</span>}
                        </div>
                        {contractor&&<div className="cbdg"><Ic.Phone/>{contractor.name}</div>}
                        {liTotal>0&&(
                          <div style={{display:"flex",gap:8,marginTop:5}}>
                            <span style={{fontSize:10,color:"var(--muted)"}}>Cost: <b style={{color:"var(--text)"}}>{fmt(liTotal)}</b></span>
                            <span style={{fontSize:10,color:"var(--muted)"}}>Paid: <b style={{color:paid>=liTotal?"var(--green)":"var(--blue)"}}>{fmt(paid)}</b></span>
                          </div>
                        )}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                        <button style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",padding:"2px 4px"}} onClick={()=>openEdit(phI,tI)}><Ic.Dots/></button>
                        {unlocked&&<button style={{background:"none",border:"none",color:task.na?"var(--gold)":"var(--muted)",cursor:"pointer",padding:"0 4px",fontSize:9,fontFamily:"'DM Sans',sans-serif"}} onClick={()=>toggleNA(phI,tI)}>{task.na?"↩":"N/A"}</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Task Edit Modal */}
      {taskModal&&draft&&(()=>{
        const task=project.phases[taskModal.phI].tasks[taskModal.tI];
        const liTotal=draft.lineItems.reduce((s,li)=>s+num(li.labor)+num(li.material),0);
        const laborTotal=draft.lineItems.reduce((s,li)=>s+num(li.labor),0);
        const matTotal=draft.lineItems.reduce((s,li)=>s+num(li.material),0);
        const paidTotal=draft.payments.reduce((s,p)=>s+num(p.amount),0);
        const owed=liTotal-paidTotal;
        return (
          <Modal title={task.name} onClose={()=>{setTaskModal(null);setDraft(null);}}>
            <div className="tab-row">
              {["details","costs","payments"].map(t=>(
                <div key={t} className={`tab${activeTab===t?" on":""}`} onClick={()=>setActiveTab(t)} style={{textTransform:"capitalize"}}>{t}</div>
              ))}
            </div>

            {activeTab==="details"&&<>
              <div className="fld"><label className="lbl">Assign Subcontractor</label>
                <select className="inp" value={draft.contractorId||""} onChange={e=>setDraft({...draft,contractorId:e.target.value||null})}>
                  <option value="">— Unassigned —</option>
                  {contractors.map(c=><option key={c.id} value={c.id}>{c.name} ({c.trade})</option>)}
                </select>
              </div>
              <div className="fld"><label className="lbl">Notes</label><textarea className="inp" rows={3} value={draft.notes||""} onChange={e=>setDraft({...draft,notes:e.target.value})} placeholder="Notes, materials specs, anything relevant..." style={{resize:"vertical"}}/></div>
              {task.isInspection&&<>
                <label className="lbl">Failed Inspections</label>
                {(task.failedInspections||[]).length===0&&<div style={{fontSize:12,color:"var(--muted)",marginBottom:8}}>None logged</div>}
                {(task.failedInspections||[]).map(f=><div key={f.id} className="c2" style={{marginBottom:6,fontSize:11}}><div style={{color:"var(--red)",fontWeight:600}}>{f.date}</div><div style={{color:"var(--muted)",marginTop:2}}>{f.note||"No details"}</div></div>)}
                <button className="btd" style={{width:"100%",padding:"8px",marginBottom:12}} onClick={()=>{setFailModal({...taskModal});setTaskModal(null);setDraft(null);}}>+ Log Failed Inspection</button>
              </>}
            </>}

            {activeTab==="costs"&&<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div>
                  <div style={{fontSize:11,color:"var(--muted)"}}>Total: <b style={{color:"var(--text)",fontSize:14}}>{fmt(liTotal)}</b></div>
                  <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>Labor: {fmt(laborTotal)} · Materials: {fmt(matTotal)}</div>
                </div>
                <button className="bto" style={{fontSize:11,padding:"5px 10px"}} onClick={addLineItem}>+ Line Item</button>
              </div>
              {draft.lineItems.length===0&&<div style={{fontSize:12,color:"var(--muted)",textAlign:"center",padding:"16px 0"}}>No line items yet. Add vendors, materials, labor separately.</div>}
              {draft.lineItems.map(li=>(
                <div key={li.id} className="c2" style={{marginBottom:8}}>
                  <div style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
                    <input className="inp" placeholder="Description (e.g. Johnson Plumbing labor)" value={li.description} onChange={e=>updLI(li.id,"description",e.target.value)} style={{flex:1,fontSize:12,padding:"7px 9px"}}/>
                    <button style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",flexShrink:0}} onClick={()=>delLI(li.id)}><Ic.Trash/></button>
                  </div>
                  <div className="row2">
                    <div><label className="lbl">Labor ($)</label><input className="inp" type="number" placeholder="0" value={li.labor} onChange={e=>updLI(li.id,"labor",e.target.value)} style={{fontSize:12,padding:"7px 9px"}}/></div>
                    <div><label className="lbl">Materials ($)</label><input className="inp" type="number" placeholder="0" value={li.material} onChange={e=>updLI(li.id,"material",e.target.value)} style={{fontSize:12,padding:"7px 9px"}}/></div>
                  </div>
                  <div style={{fontSize:10,color:"var(--muted)",marginTop:5,textAlign:"right"}}>Subtotal: <b style={{color:"var(--text)"}}>{fmt(num(li.labor)+num(li.material))}</b></div>
                </div>
              ))}
            </>}

            {activeTab==="payments"&&<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div>
                  <div style={{fontSize:11,color:"var(--muted)"}}>Paid: <b style={{color:"var(--green)",fontSize:14}}>{fmt(paidTotal)}</b></div>
                  {liTotal>0&&<div style={{fontSize:10,color:owed>0?"var(--red)":"var(--green)",marginTop:2}}>{owed>0?`Owed: ${fmt(owed)}`:"Fully paid"}</div>}
                </div>
                <button className="bto" style={{fontSize:11,padding:"5px 10px"}} onClick={addPayment}>+ Payment</button>
              </div>
              {draft.payments.length===0&&<div style={{fontSize:12,color:"var(--muted)",textAlign:"center",padding:"16px 0"}}>No payments logged yet.</div>}
              {draft.payments.map(p=>(
                <div key={p.id} className="c2" style={{marginBottom:8}}>
                  <div style={{display:"flex",gap:6,marginBottom:6}}>
                    <div style={{flex:1}}><label className="lbl">Amount ($)</label><input className="inp" type="number" placeholder="0" value={p.amount} onChange={e=>updPay(p.id,"amount",e.target.value)} style={{fontSize:12,padding:"7px 9px"}}/></div>
                    <div style={{flex:1}}><label className="lbl">Date</label><input className="inp" type="date" value={p.date} onChange={e=>updPay(p.id,"date",e.target.value)} style={{fontSize:12,padding:"7px 9px"}}/></div>
                    <button style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",alignSelf:"flex-end",paddingBottom:4,flexShrink:0}} onClick={()=>delPay(p.id)}><Ic.Trash/></button>
                  </div>
                  <div className="fld" style={{marginBottom:6}}><label className="lbl">Check # / Reference</label><input className="inp" placeholder="e.g. Check 1042" value={p.checkNum} onChange={e=>updPay(p.id,"checkNum",e.target.value)} style={{fontSize:12,padding:"7px 9px"}}/></div>
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:p.lienWaiver?"rgba(77,187,120,.08)":"rgba(224,82,82,.08)",border:`1px solid ${p.lienWaiver?"rgba(77,187,120,.2)":"rgba(224,82,82,.2)"}`,borderRadius:6,cursor:"pointer"}} onClick={()=>updPay(p.id,"lienWaiver",!p.lienWaiver)}>
                    <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${p.lienWaiver?"var(--green)":"var(--red)"}`,background:p.lienWaiver?"var(--green)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {p.lienWaiver&&<Ic.Check/>}
                    </div>
                    <span style={{fontSize:12,color:p.lienWaiver?"var(--green)":"var(--red)",fontWeight:500}}>Lien Waiver Received</span>
                  </div>
                </div>
              ))}
            </>}

            <button className="btn" style={{marginTop:14}} onClick={saveEdit}>Save Changes</button>
            <button className="btg" onClick={()=>{setTaskModal(null);setDraft(null);}}>Cancel</button>
          </Modal>
        );
      })()}

      {failModal&&<Modal title="Log Failed Inspection" onClose={()=>setFailModal(null)}>
        <div style={{color:"var(--muted)",fontSize:12,marginBottom:12}}>{project.phases[failModal.phI].tasks[failModal.tI].name}</div>
        <div className="fld"><label className="lbl">What did the inspector flag?</label><textarea className="inp" rows={3} value={failNote} onChange={e=>setFailNote(e.target.value)} placeholder="Describe the issue..." style={{resize:"vertical"}}/></div>
        <button className="btn" style={{background:"var(--red)"}} onClick={()=>logFail(failModal.phI,failModal.tI)}>Log Failure</button>
        <button className="btg" onClick={()=>setFailModal(null)}>Cancel</button>
      </Modal>}
    </div>
  );
}

// ── FINANCIALS ─────────────────────────────────────────────────────────────
function Financials({project,onUpdate}){
  const [coModal,setCoModal]=useState(false);
  const [coForm,setCoForm]=useState({description:"",amount:"",reason:"",date:"",status:"draft"});
  const [editSale,setEditSale]=useState(false);
  const [saleInput,setSaleInput]=useState(project.salePrice||"");
  const [markupInput,setMarkupInput]=useState(project.markupPct||"10");
  const [editMarkup,setEditMarkup]=useState(false);
  const [finTab,setFinTab]=useState("summary");

  const tasks=project.phases.flatMap(ph=>ph.tasks);
  const lineItems=tasks.flatMap(t=>t.lineItems||[]);
  const laborTotal=lineItems.reduce((s,li)=>s+num(li.labor),0);
  const matTotal=lineItems.reduce((s,li)=>s+num(li.material),0);
  const hardCost=laborTotal+matTotal;
  const cos=project.changeOrders||[];
  const approvedCOs=cos.filter(co=>co.status==="approved"||co.status==="complete").reduce((s,co)=>s+num(co.amount),0);
  const markup=hardCost*(num(project.markupPct||10)/100);
  const totalCost=hardCost+markup+approvedCOs;
  const sale=num(project.salePrice);
  const margin=sale-totalCost;
  const marginPct=sale?((margin/sale)*100).toFixed(1):0;
  const paidToDate=tasks.flatMap(t=>t.payments||[]).reduce((s,p)=>s+num(p.amount),0);
  const missingWaivers=tasks.flatMap(t=>t.payments||[]).filter(p=>num(p.amount)>0&&!p.lienWaiver).length;

  const addCO=()=>{
    if(!coForm.description||!coForm.amount) return;
    onUpdate({...project,changeOrders:[...cos,{id:uid(),...coForm,createdAt:new Date().toISOString()}]});
    setCoModal(false);setCoForm({description:"",amount:"",reason:"",date:"",status:"draft"});
  };
  const updateCOStatus=(id,status)=>onUpdate({...project,changeOrders:cos.map(co=>co.id===id?{...co,status}:co)});
  const deleteCO=(id)=>onUpdate({...project,changeOrders:cos.filter(co=>co.id!==id)});

  const COStatusColors={draft:"var(--muted)",presented:"var(--blue)",approved:"var(--green)",complete:"var(--gold)"};
  const COStatusLabels={draft:"Draft",presented:"Presented",approved:"Approved",complete:"Complete"};

  const phaseBD=project.phases.map(ph=>{
    const ts=ph.tasks;
    const lis=ts.flatMap(t=>t.lineItems||[]);
    return{name:ph.short||ph.name,icon:ph.icon,labor:lis.reduce((s,li)=>s+num(li.labor),0),material:lis.reduce((s,li)=>s+num(li.material),0)};
  }).filter(ph=>ph.labor||ph.material);

  return (
    <div>
      <div className="tab-row" style={{margin:"10px 13px 0",borderRadius:"8px 8px 0 0",overflow:"hidden",border:"1px solid var(--border)"}}>
        {["summary","breakdown","change orders"].map(t=>(
          <div key={t} className={`tab${finTab===t?" on":""}`} onClick={()=>setFinTab(t)} style={{textTransform:"capitalize",fontSize:11}}>{t}</div>
        ))}
      </div>

      {finTab==="summary"&&<div className="card" style={{borderRadius:"0 0 12px 12px",marginTop:0}}>
        {/* Sale Price */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
          <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".5px"}}>Sale / Contract Price</div>
          {!editSale?<button className="bto" style={{fontSize:11,padding:"3px 9px"}} onClick={()=>{setSaleInput(project.salePrice);setEditSale(true);}}>Edit</button>
            :<div style={{display:"flex",gap:5}}><input className="inp" type="number" value={saleInput} onChange={e=>setSaleInput(e.target.value)} style={{width:95,padding:"4px 8px",fontSize:12}}/><button className="btn" style={{width:"auto",padding:"4px 10px",fontSize:11}} onClick={()=>{onUpdate({...project,salePrice:saleInput});setEditSale(false);}}>Save</button></div>}
        </div>
        <div style={{fontSize:24,fontWeight:600,color:"var(--gold)",marginBottom:12}}>{sale?fmt(sale):"Not set"}</div>

        {[{l:"Labor Costs",v:laborTotal,c:"var(--text)"},{l:"Material Costs",v:matTotal,c:"var(--text)"},{l:"Hard Cost Total",v:hardCost,c:"var(--text)",bold:true},{l:`Builder's Premium (${project.markupPct||10}%)`,v:markup,c:"var(--gold)"},{l:`Approved Change Orders`,v:approvedCOs,c:approvedCOs>0?"var(--red)":"var(--muted)"},{l:"Total Project Cost",v:totalCost,c:"var(--text)",bold:true},{l:"Paid to Subs",v:paidToDate,c:"var(--blue)"}].map(({l,v,c,bold})=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid var(--border)"}}>
            <span style={{fontSize:12,color:"var(--muted)"}}>{l}</span>
            <span style={{fontSize:13,fontWeight:bold?700:600,color:c}}>{fmt(v)}</span>
          </div>
        ))}

        {/* Markup edit */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
          <span style={{fontSize:11,color:"var(--muted)"}}>Adjust markup %</span>
          {!editMarkup?<button className="bto" style={{fontSize:11,padding:"3px 9px"}} onClick={()=>{setMarkupInput(project.markupPct||"10");setEditMarkup(true);}}>Edit</button>
            :<div style={{display:"flex",gap:5}}><input className="inp" type="number" value={markupInput} onChange={e=>setMarkupInput(e.target.value)} style={{width:70,padding:"4px 8px",fontSize:12}}/><button className="btn" style={{width:"auto",padding:"4px 10px",fontSize:11}} onClick={()=>{onUpdate({...project,markupPct:markupInput});setEditMarkup(false);}}>Save</button></div>}
        </div>

        <div style={{marginTop:11,padding:12,background:margin>=0?"rgba(77,187,120,.08)":"rgba(224,82,82,.08)",border:`1px solid ${margin>=0?"rgba(77,187,120,.2)":"rgba(224,82,82,.2)"}`,borderRadius:8,textAlign:"center"}}>
          <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:3}}>{sale?"Projected Margin":"Set sale price to see margin"}</div>
          {sale&&<><div style={{fontSize:26,fontWeight:700,color:margin>=0?"var(--green)":"var(--red)"}}>{fmt(margin)}</div><div style={{fontSize:12,color:margin>=0?"var(--green)":"var(--red)",marginTop:2}}>{marginPct}% margin</div></>}
        </div>

        {missingWaivers>0&&<div style={{marginTop:10,padding:"8px 12px",background:"rgba(224,82,82,.08)",border:"1px solid rgba(224,82,82,.2)",borderRadius:8,fontSize:12,color:"var(--red)"}}>⚠ {missingWaivers} payment{missingWaivers>1?"s":""} missing lien waiver</div>}
      </div>}

      {finTab==="breakdown"&&<>
        {phaseBD.length===0&&<div className="card" style={{textAlign:"center",color:"var(--muted)",fontSize:12,padding:20}}>No cost data entered yet.</div>}
        {phaseBD.length>0&&<div className="card" style={{padding:0,overflow:"hidden"}}>
          {phaseBD.map((ph,i)=>(
            <div key={i} style={{padding:"10px 13px",borderBottom:"1px solid var(--border)"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}><span style={{fontSize:16}}>{ph.icon}</span><span style={{fontSize:12,fontWeight:600}}>{ph.name}</span><span style={{marginLeft:"auto",fontSize:13,fontWeight:600}}>{fmt(ph.labor+ph.material)}</span></div>
              <div className="row2">
                {[{l:"Labor",v:ph.labor,c:"var(--text)"},{l:"Materials",v:ph.material,c:"var(--blue)"}].map(({l,v,c})=>(
                  <div key={l} className="c2" style={{padding:"6px 8px"}}><div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase"}}>{l}</div><div style={{fontSize:12,fontWeight:600,marginTop:1,color:c}}>{v?fmt(v):"—"}</div></div>
                ))}
              </div>
            </div>
          ))}
        </div>}
      </>}

      {finTab==="change orders"&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 13px 4px"}}>
          <div style={{fontSize:12,color:"var(--muted)"}}>{cos.length} total · {fmt(approvedCOs)} approved</div>
          <button className="bto" style={{fontSize:12,padding:"6px 12px"}} onClick={()=>setCoModal(true)}>+ Add CO</button>
        </div>
        {cos.length===0&&<div className="card" style={{textAlign:"center",padding:18,color:"var(--muted)",fontSize:12}}>No change orders yet.</div>}
        {cos.map(co=>(
          <div key={co.id} className="card" style={{padding:13}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13}}>{co.description}</div>
                {co.reason&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{co.reason}</div>}
                {co.date&&<div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>{co.date}</div>}
              </div>
              <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                <div style={{fontWeight:700,fontSize:15,color:"var(--red)"}}>{fmt(co.amount)}</div>
                <button style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",marginTop:3}} onClick={()=>deleteCO(co.id)}><Ic.Trash/></button>
              </div>
            </div>
            <div className="div" style={{margin:"8px 0"}}/>
            <div style={{fontSize:10,color:"var(--muted)",marginBottom:6,textTransform:"uppercase",letterSpacing:".4px"}}>Approval Status</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {["draft","presented","approved","complete"].map(s=>(
                <button key={s} onClick={()=>updateCOStatus(co.id,s)} style={{padding:"4px 9px",borderRadius:20,border:`1px solid ${co.status===s?COStatusColors[s]:"var(--border)"}`,background:co.status===s?`${COStatusColors[s]}22`:"transparent",color:co.status===s?COStatusColors[s]:"var(--muted)",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textTransform:"capitalize"}}>{COStatusLabels[s]}</button>
              ))}
            </div>
          </div>
        ))}
      </>}

      {coModal&&<Modal title="New Change Order" onClose={()=>setCoModal(false)}>
        <div className="fld"><label className="lbl">Description *</label><input className="inp" placeholder="e.g. Upgraded to marble countertops" value={coForm.description} onChange={e=>setCoForm({...coForm,description:e.target.value})}/></div>
        <div className="fld"><label className="lbl">Amount ($) *</label><input className="inp" type="number" placeholder="e.g. 4500" value={coForm.amount} onChange={e=>setCoForm({...coForm,amount:e.target.value})}/></div>
        <div className="fld"><label className="lbl">Reason / Notes</label><textarea className="inp" rows={2} placeholder="Why was this change made?" value={coForm.reason} onChange={e=>setCoForm({...coForm,reason:e.target.value})} style={{resize:"vertical"}}/></div>
        <div className="fld"><label className="lbl">Date</label><input className="inp" type="date" value={coForm.date} onChange={e=>setCoForm({...coForm,date:e.target.value})}/></div>
        <div className="fld"><label className="lbl">Initial Status</label>
          <select className="inp" value={coForm.status} onChange={e=>setCoForm({...coForm,status:e.target.value})}>
            <option value="draft">Draft</option><option value="presented">Presented to Client</option><option value="approved">Approved</option>
          </select>
        </div>
        <button className="btn" onClick={addCO}>Add Change Order</button>
        <button className="btg" onClick={()=>setCoModal(false)}>Cancel</button>
      </Modal>}
    </div>
  );
}

// ── SUBS ───────────────────────────────────────────────────────────────────
function Subs({contractors,onUpdate}){
  const EMPTY_FORM={name:"",trade:"",phone:"",email:"",notes:"",rating:0,wouldUseAgain:true,
    // W-9
    w9OnFile:false,w9Date:"",ein:"",businessType:"",w9Notes:"",
    // Workers' Comp
    wcOnFile:false,wcCarrier:"",wcPolicyNum:"",wcExpiration:"",wcExempt:false,wcNotes:""
  };
  const [modal,setModal]=useState(false);
  const [detailId,setDetailId]=useState(null);
  const [form,setForm]=useState(EMPTY_FORM);
  const [subTab,setSubTab]=useState("info");
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");

  const TRADES=["Concrete / Foundation","Framing","Roofing","Plumbing","Electrical","HVAC","Insulation","Drywall","Painting","Flooring","Tile","Cabinetry","Countertops","Brick / Masonry","Landscaping","Driveway / Flatwork","Cleanup","Other"];
  const BIZ_TYPES=["Sole Proprietor","LLC","S-Corp","C-Corp","Partnership","Other"];

  const add=()=>{
    if(!form.name.trim()) return;
    const c={id:uid(),...form,createdAt:new Date().toISOString()};
    onUpdate([...contractors,c], c, null);
    setModal(false);setForm(EMPTY_FORM);setSubTab("info");
  };
  const del=(id)=>{if(confirm("Remove this sub?"))onUpdate(contractors.filter(c=>c.id!==id), null, id);};
  const updateSub=(id,updates)=>{ const updated=contractors.map(c=>c.id===id?{...c,...updates}:c); onUpdate(updated, updated.find(c=>c.id===id), null); };

  const wcExpired=(c)=>{
    if(!c.wcExpiration||c.wcExempt) return false;
    return new Date(c.wcExpiration)<new Date();
  };
  const wcExpiringSoon=(c)=>{
    if(!c.wcExpiration||c.wcExempt||wcExpired(c)) return false;
    const days=(new Date(c.wcExpiration)-new Date())/(1000*60*60*24);
    return days<=30;
  };

  const complianceIssues=(c)=>{
    const issues=[];
    if(!c.w9OnFile) issues.push("W-9 missing");
    if(!c.wcOnFile&&!c.wcExempt) issues.push("WC missing");
    if(wcExpired(c)) issues.push("WC expired");
    else if(wcExpiringSoon(c)) issues.push("WC expiring soon");
    return issues;
  };

  const filtered=contractors
    .filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.trade.toLowerCase().includes(search.toLowerCase()))
    .filter(c=>filter==="all"?true:filter==="issues"?complianceIssues(c).length>0:true);

  const totalIssues=contractors.reduce((s,c)=>s+complianceIssues(c).length,0);
  const detailSub=contractors.find(c=>c.id===detailId);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 13px 7px"}}>
        <div className="sec" style={{padding:0}}>Subcontractors</div>
        <button className="btn" style={{width:"auto",padding:"8px 13px",fontSize:12}} onClick={()=>{setForm(EMPTY_FORM);setSubTab("info");setModal(true);}}>+ Add Sub</button>
      </div>

      {/* Compliance alert banner */}
      {totalIssues>0&&(
        <div style={{margin:"0 13px 8px",padding:"9px 13px",background:"rgba(224,82,82,.08)",border:"1px solid rgba(224,82,82,.2)",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:"var(--red)"}}>⚠ {totalIssues} compliance issue{totalIssues>1?"s":""} need attention</span>
          <button onClick={()=>setFilter(filter==="issues"?"all":"issues")} style={{fontSize:11,color:"var(--red)",background:"none",border:"1px solid rgba(224,82,82,.4)",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{filter==="issues"?"Show All":"View"}</button>
        </div>
      )}

      <div style={{padding:"0 13px 9px"}}><input className="inp" placeholder="Search by name or trade..." value={search} onChange={e=>setSearch(e.target.value)}/></div>

      {filtered.length===0&&<div className="card" style={{textAlign:"center",padding:28,color:"var(--muted)",fontSize:12}}>{contractors.length===0?"No subs added yet.":"No results."}</div>}

      {filtered.map(c=>{
        const issues=complianceIssues(c);
        return (
          <div key={c.id} className="card" style={{padding:13,cursor:"pointer"}} onClick={()=>setDetailId(c.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14}}>{c.name}</div>
                <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap",alignItems:"center"}}>
                  <span className="tag tgo">{c.trade||"General"}</span>
                  {c.wouldUseAgain&&<span className="tag tg" style={{fontSize:9}}>✓ Use Again</span>}
                  {c.wouldUseAgain===false&&<span className="tag tr" style={{fontSize:9}}>✗ Do Not Use</span>}
                </div>
                {c.rating>0&&<div style={{display:"flex",gap:2,marginTop:5}}>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:13,color:s<=c.rating?"var(--gold)":"var(--border)"}}>★</span>)}</div>}
                {c.phone&&<div style={{display:"flex",alignItems:"center",gap:5,marginTop:6,fontSize:12,color:"var(--muted)"}} onClick={e=>e.stopPropagation()}><Ic.Phone/><a href={`tel:${c.phone}`} style={{color:"var(--text)",textDecoration:"none"}}>{c.phone}</a></div>}
                {/* Compliance badges */}
                <div style={{display:"flex",gap:5,marginTop:7,flexWrap:"wrap"}}>
                  <span className={`tag ${c.w9OnFile?"tg":"tr"}`} style={{fontSize:9}}>W-9 {c.w9OnFile?"✓":"Missing"}</span>
                  <span className={`tag ${c.wcExempt?"tm":wcExpired(c)?"tr":wcExpiringSoon(c)?"tgo":c.wcOnFile?"tg":"tr"}`} style={{fontSize:9}}>
                    WC {c.wcExempt?"Exempt":wcExpired(c)?"Expired":wcExpiringSoon(c)?"Expiring":c.wcOnFile?"✓":"Missing"}
                  </span>
                </div>
              </div>
              <button style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",padding:4}} onClick={e=>{e.stopPropagation();del(c.id);}}><Ic.Trash/></button>
            </div>
          </div>
        );
      })}

      {/* Add Sub Modal */}
      {modal&&<Modal title="Add Subcontractor" onClose={()=>setModal(false)}>
        <div className="tab-row">
          {["info","compliance"].map(t=><div key={t} className={`tab${subTab===t?" on":""}`} onClick={()=>setSubTab(t)} style={{textTransform:"capitalize"}}>{t}</div>)}
        </div>

        {subTab==="info"&&<>
          <div className="fld"><label className="lbl">Name / Company *</label><input className="inp" placeholder="e.g. Johnson Plumbing LLC" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div className="fld"><label className="lbl">Trade</label><select className="inp" value={form.trade} onChange={e=>setForm({...form,trade:e.target.value})}><option value="">— Select Trade —</option>{TRADES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
          <div className="row2" style={{gap:8,marginBottom:12}}>
            <div><label className="lbl">Phone</label><input className="inp" type="tel" placeholder="(318) 555-0100" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
            <div><label className="lbl">Email</label><input className="inp" type="email" placeholder="sub@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          </div>
          <div className="fld"><label className="lbl">Notes</label><textarea className="inp" rows={2} placeholder="e.g. Reliable, 30-day payment terms" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{resize:"vertical"}}/></div>
          <div className="fld"><label className="lbl">Rating</label><div className="stars">{[1,2,3,4,5].map(s=><span key={s} className={`star${s<=form.rating?" on":""}`} onClick={()=>setForm({...form,rating:s})}>★</span>)}</div></div>
          <div className="fld"><label className="lbl">Would Use Again?</label>
            <div style={{display:"flex",gap:8}}>
              {[{v:true,l:"✓ Yes"},{v:false,l:"✗ No"}].map(({v,l})=>(
                <button key={String(v)} onClick={()=>setForm({...form,wouldUseAgain:v})} style={{flex:1,padding:"8px",border:`1px solid ${form.wouldUseAgain===v?v?"var(--green)":"var(--red)":"var(--border)"}`,borderRadius:8,background:form.wouldUseAgain===v?v?"rgba(77,187,120,.1)":"rgba(224,82,82,.1)":"transparent",color:form.wouldUseAgain===v?v?"var(--green)":"var(--red)":"var(--muted)",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>{l}</button>
              ))}
            </div>
          </div>
        </>}

        {subTab==="compliance"&&<ComplianceForm form={form} setForm={setForm} BIZ_TYPES={BIZ_TYPES}/>}

        <button className="btn" onClick={add}>Add Subcontractor</button>
        <button className="btg" onClick={()=>setModal(false)}>Cancel</button>
      </Modal>}

      {/* Sub Detail / Edit Modal */}
      {detailSub&&<Modal title={detailSub.name} onClose={()=>setDetailId(null)}>
        <SubDetail sub={detailSub} onUpdate={(upd)=>updateSub(detailSub.id,upd)} BIZ_TYPES={BIZ_TYPES} TRADES={TRADES} wcExpired={wcExpired} wcExpiringSoon={wcExpiringSoon}/>
        <button className="btg" onClick={()=>setDetailId(null)}>Close</button>
      </Modal>}
    </div>
  );
}

function ComplianceForm({form,setForm,BIZ_TYPES}){
  return (
    <>
      {/* W-9 Section */}
      <div style={{fontSize:11,color:"var(--gold)",textTransform:"uppercase",letterSpacing:".6px",marginBottom:10,fontWeight:600}}>W-9 Information</div>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:form.w9OnFile?"rgba(77,187,120,.08)":"rgba(224,82,82,.08)",border:`1px solid ${form.w9OnFile?"rgba(77,187,120,.2)":"rgba(224,82,82,.2)"}`,borderRadius:8,cursor:"pointer",marginBottom:12}} onClick={()=>setForm({...form,w9OnFile:!form.w9OnFile})}>
        <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${form.w9OnFile?"var(--green)":"var(--red)"}`,background:form.w9OnFile?"var(--green)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{form.w9OnFile&&<Ic.Check/>}</div>
        <span style={{fontSize:13,color:form.w9OnFile?"var(--green)":"var(--red)",fontWeight:500}}>W-9 On File</span>
      </div>
      {form.w9OnFile&&<>
        <div className="row2" style={{gap:8,marginBottom:12}}>
          <div><label className="lbl">Date Received</label><input className="inp" type="date" value={form.w9Date} onChange={e=>setForm({...form,w9Date:e.target.value})}/></div>
          <div><label className="lbl">EIN / SSN (last 4)</label><input className="inp" placeholder="e.g. **-***1234" value={form.ein} onChange={e=>setForm({...form,ein:e.target.value})}/></div>
        </div>
        <div className="fld"><label className="lbl">Business Type</label><select className="inp" value={form.businessType} onChange={e=>setForm({...form,businessType:e.target.value})}><option value="">— Select —</option>{BIZ_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
        <div className="fld"><label className="lbl">W-9 Notes</label><input className="inp" placeholder="Any notes..." value={form.w9Notes} onChange={e=>setForm({...form,w9Notes:e.target.value})}/></div>
      </>}

      <div className="div"/>

      {/* Workers' Comp Section */}
      <div style={{fontSize:11,color:"var(--gold)",textTransform:"uppercase",letterSpacing:".6px",marginBottom:10,fontWeight:600}}>Workers' Compensation</div>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:form.wcExempt?"rgba(107,117,146,.08)":"transparent",border:"1px solid var(--border)",borderRadius:8,cursor:"pointer",marginBottom:10}} onClick={()=>setForm({...form,wcExempt:!form.wcExempt,wcOnFile:false})}>
        <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${form.wcExempt?"var(--muted)":"var(--border)"}`,background:form.wcExempt?"var(--muted)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{form.wcExempt&&<Ic.Check/>}</div>
        <span style={{fontSize:13,color:"var(--muted)",fontWeight:500}}>Exempt from Workers' Comp (sole proprietor / owner-operator)</span>
      </div>
      {!form.wcExempt&&<>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:form.wcOnFile?"rgba(77,187,120,.08)":"rgba(224,82,82,.08)",border:`1px solid ${form.wcOnFile?"rgba(77,187,120,.2)":"rgba(224,82,82,.2)"}`,borderRadius:8,cursor:"pointer",marginBottom:12}} onClick={()=>setForm({...form,wcOnFile:!form.wcOnFile})}>
          <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${form.wcOnFile?"var(--green)":"var(--red)"}`,background:form.wcOnFile?"var(--green)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{form.wcOnFile&&<Ic.Check/>}</div>
          <span style={{fontSize:13,color:form.wcOnFile?"var(--green)":"var(--red)",fontWeight:500}}>Certificate of Insurance On File</span>
        </div>
        {form.wcOnFile&&<>
          <div className="fld"><label className="lbl">Insurance Carrier</label><input className="inp" placeholder="e.g. Zenith Insurance" value={form.wcCarrier} onChange={e=>setForm({...form,wcCarrier:e.target.value})}/></div>
          <div className="row2" style={{gap:8,marginBottom:12}}>
            <div><label className="lbl">Policy Number</label><input className="inp" placeholder="e.g. WC-0012345" value={form.wcPolicyNum} onChange={e=>setForm({...form,wcPolicyNum:e.target.value})}/></div>
            <div><label className="lbl">Expiration Date</label><input className="inp" type="date" value={form.wcExpiration} onChange={e=>setForm({...form,wcExpiration:e.target.value})}/></div>
          </div>
        </>}
        <div className="fld"><label className="lbl">WC Notes</label><input className="inp" placeholder="Any notes..." value={form.wcNotes} onChange={e=>setForm({...form,wcNotes:e.target.value})}/></div>
      </>}
    </>
  );
}

function SubDetail({sub,onUpdate,BIZ_TYPES,TRADES,wcExpired,wcExpiringSoon}){
  const [tab,setTab]=useState("info");
  const [draft,setDraft]=useState({...sub});
  const save=()=>onUpdate({...draft});

  return (
    <>
      <div className="tab-row">
        {["info","w-9","workers' comp"].map(t=><div key={t} className={`tab${tab===t?" on":""}`} onClick={()=>setTab(t)} style={{textTransform:"capitalize",fontSize:11}}>{t}</div>)}
      </div>

      {tab==="info"&&<>
        <div className="fld"><label className="lbl">Name / Company</label><input className="inp" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></div>
        <div className="fld"><label className="lbl">Trade</label><select className="inp" value={draft.trade} onChange={e=>setDraft({...draft,trade:e.target.value})}><option value="">— Select —</option>{TRADES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
        <div className="row2" style={{gap:8,marginBottom:12}}>
          <div><label className="lbl">Phone</label><input className="inp" value={draft.phone||""} onChange={e=>setDraft({...draft,phone:e.target.value})}/></div>
          <div><label className="lbl">Email</label><input className="inp" value={draft.email||""} onChange={e=>setDraft({...draft,email:e.target.value})}/></div>
        </div>
        <div className="fld"><label className="lbl">Notes</label><textarea className="inp" rows={2} value={draft.notes||""} onChange={e=>setDraft({...draft,notes:e.target.value})} style={{resize:"vertical"}}/></div>
        <div className="fld"><label className="lbl">Rating</label><div className="stars">{[1,2,3,4,5].map(s=><span key={s} className={`star${s<=(draft.rating||0)?" on":""}`} onClick={()=>setDraft({...draft,rating:s})}>★</span>)}</div></div>
        <div className="fld"><label className="lbl">Would Use Again?</label>
          <div style={{display:"flex",gap:8}}>
            {[{v:true,l:"✓ Yes"},{v:false,l:"✗ No"}].map(({v,l})=>(
              <button key={String(v)} onClick={()=>setDraft({...draft,wouldUseAgain:v})} style={{flex:1,padding:"8px",border:`1px solid ${draft.wouldUseAgain===v?v?"var(--green)":"var(--red)":"var(--border)"}`,borderRadius:8,background:draft.wouldUseAgain===v?v?"rgba(77,187,120,.1)":"rgba(224,82,82,.1)":"transparent",color:draft.wouldUseAgain===v?v?"var(--green)":"var(--red)":"var(--muted)",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>{l}</button>
            ))}
          </div>
        </div>
        <button className="btn" onClick={save}>Save Changes</button>
      </>}

      {tab==="w-9"&&<>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:draft.w9OnFile?"rgba(77,187,120,.08)":"rgba(224,82,82,.08)",border:`1px solid ${draft.w9OnFile?"rgba(77,187,120,.2)":"rgba(224,82,82,.2)"}`,borderRadius:8,cursor:"pointer",marginBottom:12}} onClick={()=>setDraft({...draft,w9OnFile:!draft.w9OnFile})}>
          <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${draft.w9OnFile?"var(--green)":"var(--red)"}`,background:draft.w9OnFile?"var(--green)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{draft.w9OnFile&&<Ic.Check/>}</div>
          <span style={{fontSize:13,color:draft.w9OnFile?"var(--green)":"var(--red)",fontWeight:500}}>W-9 On File</span>
        </div>
        <div className="row2" style={{gap:8,marginBottom:12}}>
          <div><label className="lbl">Date Received</label><input className="inp" type="date" value={draft.w9Date||""} onChange={e=>setDraft({...draft,w9Date:e.target.value})}/></div>
          <div><label className="lbl">EIN / SSN (last 4)</label><input className="inp" placeholder="**-***1234" value={draft.ein||""} onChange={e=>setDraft({...draft,ein:e.target.value})}/></div>
        </div>
        <div className="fld"><label className="lbl">Business Type</label><select className="inp" value={draft.businessType||""} onChange={e=>setDraft({...draft,businessType:e.target.value})}><option value="">— Select —</option>{BIZ_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
        <div className="fld"><label className="lbl">W-9 Notes</label><input className="inp" placeholder="Any notes..." value={draft.w9Notes||""} onChange={e=>setDraft({...draft,w9Notes:e.target.value})}/></div>
        <button className="btn" onClick={save}>Save Changes</button>
      </>}

      {tab==="workers' comp"&&<>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:draft.wcExempt?"rgba(107,117,146,.08)":"transparent",border:"1px solid var(--border)",borderRadius:8,cursor:"pointer",marginBottom:10}} onClick={()=>setDraft({...draft,wcExempt:!draft.wcExempt,wcOnFile:false})}>
          <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${draft.wcExempt?"var(--muted)":"var(--border)"}`,background:draft.wcExempt?"var(--muted)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{draft.wcExempt&&<Ic.Check/>}</div>
          <span style={{fontSize:13,color:"var(--muted)",fontWeight:500}}>Exempt (sole proprietor / owner-operator)</span>
        </div>
        {!draft.wcExempt&&<>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:draft.wcOnFile?"rgba(77,187,120,.08)":"rgba(224,82,82,.08)",border:`1px solid ${draft.wcOnFile?"rgba(77,187,120,.2)":"rgba(224,82,82,.2)"}`,borderRadius:8,cursor:"pointer",marginBottom:12}} onClick={()=>setDraft({...draft,wcOnFile:!draft.wcOnFile})}>
            <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${draft.wcOnFile?"var(--green)":"var(--red)"}`,background:draft.wcOnFile?"var(--green)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{draft.wcOnFile&&<Ic.Check/>}</div>
            <span style={{fontSize:13,color:draft.wcOnFile?"var(--green)":"var(--red)",fontWeight:500}}>Certificate of Insurance On File</span>
          </div>
          {draft.wcOnFile&&<>
            <div className="fld"><label className="lbl">Insurance Carrier</label><input className="inp" placeholder="e.g. Zenith Insurance" value={draft.wcCarrier||""} onChange={e=>setDraft({...draft,wcCarrier:e.target.value})}/></div>
            <div className="row2" style={{gap:8,marginBottom:12}}>
              <div><label className="lbl">Policy Number</label><input className="inp" placeholder="WC-0012345" value={draft.wcPolicyNum||""} onChange={e=>setDraft({...draft,wcPolicyNum:e.target.value})}/></div>
              <div><label className="lbl">Expiration Date</label><input className="inp" type="date" value={draft.wcExpiration||""} onChange={e=>setDraft({...draft,wcExpiration:e.target.value})}/></div>
            </div>
            {draft.wcExpiration&&(wcExpired(draft)?
              <div style={{padding:"8px 12px",background:"rgba(224,82,82,.1)",border:"1px solid rgba(224,82,82,.2)",borderRadius:6,fontSize:12,color:"var(--red)",marginBottom:12}}>⚠ This policy has expired. Get updated certificate before next payment.</div>
              :wcExpiringSoon(draft)?
              <div style={{padding:"8px 12px",background:"rgba(200,164,86,.1)",border:"1px solid rgba(200,164,86,.2)",borderRadius:6,fontSize:12,color:"var(--gold)",marginBottom:12}}>⚠ Policy expiring within 30 days. Request renewal.</div>
              :null
            )}
          </>}
          <div className="fld"><label className="lbl">WC Notes</label><input className="inp" placeholder="Any notes..." value={draft.wcNotes||""} onChange={e=>setDraft({...draft,wcNotes:e.target.value})}/></div>
        </>}
        <button className="btn" onClick={save}>Save Changes</button>
      </>}
    </>
  );
}

// ── JOB LOG ───────────────────────────────────────────────────────────────
function JobLog({project,onUpdate}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({note:"",weather:"",crew:"",date:today()});
  const logs=(project.jobLog||[]).slice().reverse();

  const add=()=>{
    if(!form.note.trim()) return;
    const entry={id:uid(),...form,createdAt:now()};
    onUpdate({...project,jobLog:[...(project.jobLog||[]),entry]});
    setModal(false);setForm({note:"",weather:"",crew:"",date:today()});
  };

  const del=(id)=>onUpdate({...project,jobLog:(project.jobLog||[]).filter(e=>e.id!==id)});

  const WEATHER=["☀️ Clear","⛅ Partly Cloudy","☁️ Overcast","🌧️ Rain — Delay","⛈️ Storm — No Work","🌬️ High Wind"];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 13px 7px"}}>
        <div className="sec" style={{padding:0}}>Daily Job Log</div>
        <button className="btn" style={{width:"auto",padding:"8px 13px",fontSize:12}} onClick={()=>setModal(true)}>+ Add Entry</button>
      </div>
      {logs.length===0&&<div className="card" style={{textAlign:"center",padding:28,color:"var(--muted)",fontSize:12}}>No log entries yet.<br/>Log daily progress, weather delays, and site notes.</div>}
      {logs.map(e=>(
        <div key={e.id} className="card" style={{padding:13}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
            <div>
              <div style={{fontWeight:600,fontSize:13}}>{e.date}</div>
              <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{e.createdAt}</div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {e.weather&&<span style={{fontSize:13}}>{e.weather.split(" ")[0]}</span>}
              <button style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer"}} onClick={()=>del(e.id)}><Ic.Trash/></button>
            </div>
          </div>
          <div style={{fontSize:13,lineHeight:1.5,marginBottom:e.crew?8:0}}>{e.note}</div>
          {e.crew&&<div style={{fontSize:11,color:"var(--muted)"}}>👷 {e.crew}</div>}
          {e.weather&&e.weather.includes("Delay")&&<div className="tag tr" style={{marginTop:6,display:"inline-block"}}>Weather Delay</div>}
          {e.weather&&e.weather.includes("No Work")&&<div className="tag tr" style={{marginTop:6,display:"inline-block"}}>No Work Day</div>}
        </div>
      ))}

      {modal&&<Modal title="New Log Entry" onClose={()=>setModal(false)}>
        <div className="fld"><label className="lbl">Date</label><input className="inp" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
        <div className="fld"><label className="lbl">Notes *</label><textarea className="inp" rows={4} placeholder="What happened on site today? Work completed, issues, deliveries, visitors..." value={form.note} onChange={e=>setForm({...form,note:e.target.value})} style={{resize:"vertical"}}/></div>
        <div className="fld">
          <label className="lbl">Weather</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {WEATHER.map(w=>(
              <button key={w} onClick={()=>setForm({...form,weather:form.weather===w?"":w})} style={{padding:"5px 10px",borderRadius:20,border:`1px solid ${form.weather===w?"var(--gold)":"var(--border)"}`,background:form.weather===w?"rgba(200,164,86,.1)":"transparent",color:form.weather===w?"var(--gold)":"var(--muted)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{w}</button>
            ))}
          </div>
        </div>
        <div className="fld"><label className="lbl">Crew / Subs on Site</label><input className="inp" placeholder="e.g. Framing crew (5), electrical rough-in started" value={form.crew} onChange={e=>setForm({...form,crew:e.target.value})}/></div>
        <button className="btn" onClick={add}>Add Entry</button>
        <button className="btg" onClick={()=>setModal(false)}>Cancel</button>
      </Modal>}
    </div>
  );
}

// ── PORTAL ─────────────────────────────────────────────────────────────────
function Portal({project,onUpdate}){
  const [view,setView]=useState("builder");
  const [selModal,setSelModal]=useState(false);
  const [selForm,setSelForm]=useState({title:"",description:"",optionA:"",optionB:"",imageA:"",imageB:""});
  const tasks=project.phases.flatMap(ph=>ph.tasks);
  const active=tasks.filter(t=>!t.na);
  const done=active.filter(t=>t.completed).length;
  const pct=active.length?Math.round(done/active.length*100):0;
  const cur=project.phases.find(ph=>ph.tasks.some(t=>!t.completed&&!t.na));
  const sels=project.selections||[];
  const pendingCOs=(project.changeOrders||[]).filter(co=>co.status==="presented");

  const addSel=()=>{
    if(!selForm.title) return;
    onUpdate({...project,selections:[...sels,{id:uid(),...selForm,chosen:null,chosenAt:null,createdAt:new Date().toISOString()}]});
    setSelModal(false);setSelForm({title:"",description:"",optionA:"",optionB:"",imageA:"",imageB:""});
  };
  const choose=(selId,option)=>onUpdate({...project,selections:sels.map(s=>s.id===selId?{...s,chosen:option,chosenAt:now()}:s)});
  const delSel=(id)=>onUpdate({...project,selections:sels.filter(s=>s.id!==id)});

  return (
    <div>
      <div style={{display:"flex",gap:7,padding:"13px 13px 5px"}}>
        {[["builder","🔨 Builder"],["client","👁️ Client View"]].map(([m,l])=>(
          <button key={m} onClick={()=>setView(m)} style={{flex:1,padding:"8px",border:`1px solid ${view===m?"var(--gold)":"var(--border)"}`,borderRadius:8,background:view===m?"rgba(200,164,86,.1)":"var(--card2)",color:view===m?"var(--gold)":"var(--muted)",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,cursor:"pointer"}}>{l}</button>
        ))}
      </div>

      {view==="builder"&&<>
        <div className="card">
          <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:9}}>Client Info</div>
          <div style={{fontWeight:600,fontSize:15}}>{project.clientName||"No client set"}</div>
          {project.clientEmail&&<div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{project.clientEmail}</div>}
          <div style={{marginTop:9,padding:"8px 11px",background:"var(--card2)",borderRadius:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:"var(--muted)"}}>Portal PIN</span>
            <span style={{fontFamily:"monospace",fontSize:15,color:"var(--gold)",letterSpacing:2}}>{project.clientPin||"——"}</span>
          </div>
        </div>

        {pendingCOs.length>0&&<div className="card" style={{padding:12,background:"rgba(78,144,217,.06)",borderColor:"rgba(78,144,217,.2)"}}>
          <div style={{fontSize:12,color:"var(--blue)",fontWeight:600,marginBottom:6}}>📋 {pendingCOs.length} Change Order{pendingCOs.length>1?"s":""} Awaiting Client Approval</div>
          {pendingCOs.map(co=><div key={co.id} style={{fontSize:11,color:"var(--muted)",marginBottom:3}}>• {co.description} — {fmt(co.amount)}</div>)}
        </div>}

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 13px 4px"}}>
          <div className="sec" style={{padding:0}}>Client Selections</div>
          <button className="bto" style={{fontSize:12,padding:"6px 12px"}} onClick={()=>setSelModal(true)}>+ Add</button>
        </div>
        {sels.length===0&&<div className="card" style={{textAlign:"center",padding:20,color:"var(--muted)",fontSize:12}}>No selections yet. Add A/B choices for flooring, countertops, fixtures, etc.</div>}
        {sels.map(s=>(
          <div key={s.id} className="card" style={{padding:13}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div><div style={{fontWeight:600,fontSize:13}}>{s.title}</div>{s.description&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{s.description}</div>}</div>
              <button style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer"}} onClick={()=>delSel(s.id)}><Ic.Trash/></button>
            </div>
            {s.chosen?<span className="tag tg">✓ Client chose: {s.chosen==="A"?s.optionA:s.optionB}</span>:<span className="tag tr">⏳ Awaiting client</span>}
            {s.chosenAt&&<div style={{fontSize:10,color:"var(--muted)",marginTop:4}}>{s.chosenAt}</div>}
          </div>
        ))}
      </>}

      {view==="client"&&<>
        <div className="card">
          <div style={{textAlign:"center",marginBottom:12}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:"var(--gold)",letterSpacing:1}}>Your Home Progress</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{project.name}</div>
          </div>
          <div style={{textAlign:"center",marginBottom:12}}>
            <div style={{fontSize:48,fontWeight:700,color:"var(--gold)"}}>{pct}%</div>
            <div style={{fontSize:12,color:"var(--muted)"}}>Complete</div>
          </div>
          <div className="pb" style={{height:5}}><div className="pf" style={{width:`${pct}%`}}/></div>
          {cur&&<div style={{textAlign:"center",marginTop:8,fontSize:12,color:"var(--muted)"}}>Currently working on: <b style={{color:"var(--text)"}}>{cur.short||cur.name}</b></div>}
        </div>

        {pendingCOs.length>0&&<div className="card" style={{padding:12,background:"rgba(224,82,82,.06)",borderColor:"rgba(224,82,82,.2)"}}>
          <div style={{fontSize:12,color:"var(--red)",fontWeight:600,marginBottom:6}}>⚠ Change Orders Requiring Your Approval</div>
          {pendingCOs.map(co=><div key={co.id} style={{fontSize:12,marginBottom:4}}><b>{co.description}</b> — {fmt(co.amount)}{co.reason&&<div style={{fontSize:11,color:"var(--muted)"}}>{co.reason}</div>}</div>)}
          <div style={{fontSize:11,color:"var(--muted)",marginTop:6}}>Contact your builder to review and approve.</div>
        </div>}

        <div className="sec">Build Phases</div>
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          {project.phases.map(ph=>{
            const activeTasks=ph.tasks.filter(t=>!t.na);
            const d=activeTasks.filter(t=>t.completed).length,tt=activeTasks.length;
            const complete=d===tt,inProg=d>0&&!complete;
            return (
              <div key={ph.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",borderBottom:"1px solid var(--border)"}}>
                <span style={{fontSize:18}}>{ph.icon}</span>
                <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500}}>{ph.short||ph.name}</div><div className="pb" style={{marginTop:3}}><div className="pf" style={{width:`${tt?Math.round(d/tt*100):100}%`}}/></div></div>
                <span className={`tag ${complete?"tg":inProg?"tgo":"tb"}`} style={{fontSize:9,flexShrink:0}}>{complete?"✓ Done":inProg?`${d}/${tt}`:"Upcoming"}</span>
              </div>
            );
          })}
        </div>

        {sels.length>0&&<>
          <div className="sec">Your Selections</div>
          {sels.map(s=>(
            <div key={s.id} className="card">
              <div style={{fontWeight:600,fontSize:14,marginBottom:3}}>{s.title}</div>
              {s.description&&<div style={{fontSize:12,color:"var(--muted)",marginBottom:9}}>{s.description}</div>}
              {s.chosen
                ?<div style={{textAlign:"center",padding:11,background:"rgba(77,187,120,.08)",border:"1px solid rgba(77,187,120,.2)",borderRadius:8}}><div style={{color:"var(--green)",fontWeight:600,fontSize:13}}>✓ You selected: {s.chosen==="A"?s.optionA:s.optionB}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>{s.chosenAt}</div></div>
                :<>
                  <div className="igrid">
                    {[{k:"A",l:s.optionA,img:s.imageA},{k:"B",l:s.optionB,img:s.imageB}].map(opt=>(
                      <div key={opt.k} className={`icard${s.chosen===opt.k?" sel":""}`} onClick={()=>choose(s.id,opt.k)}>
                        {opt.img?<img src={opt.img} alt={opt.l} style={{width:"100%",height:120,objectFit:"cover",display:"block"}} onError={e=>e.target.style.display="none"}/>:<div style={{height:100,background:"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontSize:12}}>Option {opt.k}</div>}
                        <div className="icard-lbl">{opt.l||`Option ${opt.k}`}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:10,color:"var(--muted)",textAlign:"center",marginTop:7}}>Tap to make your selection</div>
                </>
              }
            </div>
          ))}
        </>}
      </>}

      {selModal&&<Modal title="New Client Selection" onClose={()=>setSelModal(false)}>
        <div className="fld"><label className="lbl">Title *</label><input className="inp" placeholder="e.g. Flooring Choice — Living Room" value={selForm.title} onChange={e=>setSelForm({...selForm,title:e.target.value})}/></div>
        <div className="fld"><label className="lbl">Description</label><input className="inp" placeholder="e.g. Choose your living room flooring" value={selForm.description} onChange={e=>setSelForm({...selForm,description:e.target.value})}/></div>
        <div className="div"/>
        <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:9}}>Option A</div>
        <div className="fld"><label className="lbl">Label</label><input className="inp" placeholder="e.g. White Oak Hardwood" value={selForm.optionA} onChange={e=>setSelForm({...selForm,optionA:e.target.value})}/></div>
        <div className="fld"><label className="lbl">Image URL (optional)</label><input className="inp" placeholder="https://..." value={selForm.imageA} onChange={e=>setSelForm({...selForm,imageA:e.target.value})}/></div>
        <div className="div"/>
        <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:9}}>Option B</div>
        <div className="fld"><label className="lbl">Label</label><input className="inp" placeholder="e.g. Dark Walnut Hardwood" value={selForm.optionB} onChange={e=>setSelForm({...selForm,optionB:e.target.value})}/></div>
        <div className="fld"><label className="lbl">Image URL (optional)</label><input className="inp" placeholder="https://..." value={selForm.imageB} onChange={e=>setSelForm({...selForm,imageB:e.target.value})}/></div>
        <button className="btn" onClick={addSel}>Add Selection</button>
        <button className="btg" onClick={()=>setSelModal(false)}>Cancel</button>
      </Modal>}
    </div>
  );
}

// ── FINISHES ───────────────────────────────────────────────────────────────
function Finishes({project,onUpdate}){
  const CATS=[
    {id:"exterior",label:"Exterior",icon:"🏠"},
    {id:"paint",label:"Paint",icon:"🎨"},
    {id:"flooring",label:"Flooring",icon:"🪵"},
    {id:"cabinets",label:"Cabinets & Millwork",icon:"🚪"},
    {id:"countertops",label:"Countertops",icon:"⬜"},
    {id:"plumbing",label:"Plumbing Fixtures",icon:"🚿"},
    {id:"lighting",label:"Electrical & Lighting",icon:"💡"},
    {id:"hvac",label:"HVAC & Insulation",icon:"❄️"},
    {id:"windows",label:"Windows & Doors",icon:"🪟"},
    {id:"misc",label:"Miscellaneous",icon:"📦"},
  ];
  const EMPTY={category:"exterior",item:"",brand:"",productLine:"",colorName:"",colorCode:"",sku:"",supplier:"",room:"",notes:"",favorite:false};
  const [modal,setModal]=useState(false);
  const [detailId,setDetailId]=useState(null);
  const [form,setForm]=useState(EMPTY);
  const [activeCat,setActiveCat]=useState("all");
  const [search,setSearch]=useState("");
  const finishes=project.finishes||[];

  const add=()=>{
    if(!form.item.trim()) return;
    onUpdate({...project,finishes:[...finishes,{id:uid(),...form,createdAt:new Date().toISOString()}]});
    setModal(false);setForm(EMPTY);
  };
  const del=(id)=>onUpdate({...project,finishes:finishes.filter(f=>f.id!==id)});
  const update=(id,upd)=>onUpdate({...project,finishes:finishes.map(f=>f.id===id?{...f,...upd}:f)});
  const toggleFav=(id)=>update(id,{favorite:!finishes.find(f=>f.id===id)?.favorite});

  const filtered=finishes
    .filter(f=>activeCat==="all"||f.category===activeCat)
    .filter(f=>!search||(f.item+f.brand+f.colorName+f.supplier+f.notes).toLowerCase().includes(search.toLowerCase()));

  const detail=finishes.find(f=>f.id===detailId);
  const catOf=(id)=>CATS.find(c=>c.id===id);
  const countFor=(catId)=>finishes.filter(f=>f.category===catId).length;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 13px 7px"}}>
        <div className="sec" style={{padding:0}}>Finishes & Specs</div>
        <button className="btn" style={{width:"auto",padding:"8px 13px",fontSize:12}} onClick={()=>{setForm(EMPTY);setModal(true);}}>+ Add Finish</button>
      </div>

      {/* Search */}
      <div style={{padding:"0 13px 9px"}}><input className="inp" placeholder="Search finishes..." value={search} onChange={e=>setSearch(e.target.value)}/></div>

      {/* Category filter pills */}
      <div style={{display:"flex",gap:6,padding:"0 13px 12px",overflowX:"auto",paddingBottom:12}}>
        <button onClick={()=>setActiveCat("all")} style={{flexShrink:0,padding:"5px 12px",borderRadius:20,border:`1px solid ${activeCat==="all"?"var(--gold)":"var(--border)"}`,background:activeCat==="all"?"rgba(200,164,86,.1)":"transparent",color:activeCat==="all"?"var(--gold)":"var(--muted)",fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>
          All ({finishes.length})
        </button>
        {CATS.filter(c=>countFor(c.id)>0||activeCat===c.id).map(c=>(
          <button key={c.id} onClick={()=>setActiveCat(c.id)} style={{flexShrink:0,padding:"5px 12px",borderRadius:20,border:`1px solid ${activeCat===c.id?"var(--gold)":"var(--border)"}`,background:activeCat===c.id?"rgba(200,164,86,.1)":"transparent",color:activeCat===c.id?"var(--gold)":"var(--muted)",fontFamily:"'DM Sans',sans-serif",fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>
            {c.icon} {c.label} ({countFor(c.id)})
          </button>
        ))}
      </div>

      {finishes.length===0&&<div className="card" style={{textAlign:"center",padding:32,color:"var(--muted)",fontSize:12}}>
        <div style={{fontSize:36,marginBottom:10}}>🎨</div>
        No finishes logged yet.<br/>Track paint colors, brick, flooring, fixtures — everything you'll want to reference later.
      </div>}

      {filtered.length===0&&finishes.length>0&&<div className="card" style={{textAlign:"center",padding:20,color:"var(--muted)",fontSize:12}}>No results for this filter.</div>}

      {/* Group by category when showing all */}
      {activeCat==="all"&&!search
        ? CATS.filter(c=>countFor(c.id)>0).map(cat=>(
            <div key={cat.id}>
              <div style={{padding:"10px 16px 4px",fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".6px",display:"flex",alignItems:"center",gap:6}}><span>{cat.icon}</span>{cat.label}</div>
              {finishes.filter(f=>f.category===cat.id).map(f=><FinishCard key={f.id} f={f} onTap={()=>setDetailId(f.id)} onFav={()=>toggleFav(f.id)} onDel={()=>del(f.id)}/>)}
            </div>
          ))
        : filtered.map(f=><FinishCard key={f.id} f={f} onTap={()=>setDetailId(f.id)} onFav={()=>toggleFav(f.id)} onDel={()=>del(f.id)}/>)
      }

      {/* Add Modal */}
      {modal&&<Modal title="Add Finish / Spec" onClose={()=>setModal(false)}>
        <div className="fld"><label className="lbl">Category</label>
          <select className="inp" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
            {CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <div className="fld"><label className="lbl">Item Name *</label><input className="inp" placeholder="e.g. Exterior Brick, Living Room Paint, Master Bath Tile" value={form.item} onChange={e=>setForm({...form,item:e.target.value})}/></div>
        <div className="fld"><label className="lbl">Room / Location</label><input className="inp" placeholder="e.g. Master Bath, All Bedrooms, Exterior Front" value={form.room} onChange={e=>setForm({...form,room:e.target.value})}/></div>
        <div className="div"/>
        <div className="row2" style={{gap:8,marginBottom:12}}>
          <div><label className="lbl">Brand / Manufacturer</label><input className="inp" placeholder="e.g. Sherwin-Williams" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}/></div>
          <div><label className="lbl">Product Line</label><input className="inp" placeholder="e.g. Emerald Interior" value={form.productLine} onChange={e=>setForm({...form,productLine:e.target.value})}/></div>
        </div>
        <div className="row2" style={{gap:8,marginBottom:12}}>
          <div><label className="lbl">Color Name</label><input className="inp" placeholder="e.g. Accessible Beige" value={form.colorName} onChange={e=>setForm({...form,colorName:e.target.value})}/></div>
          <div><label className="lbl">Color Code / #</label><input className="inp" placeholder="e.g. SW 7036" value={form.colorCode} onChange={e=>setForm({...form,colorCode:e.target.value})}/></div>
        </div>
        <div className="row2" style={{gap:8,marginBottom:12}}>
          <div><label className="lbl">SKU / Model #</label><input className="inp" placeholder="Optional" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/></div>
          <div><label className="lbl">Supplier / Store</label><input className="inp" placeholder="e.g. Ferguson, Lowe's" value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})}/></div>
        </div>
        <div className="fld"><label className="lbl">Notes</label><textarea className="inp" rows={2} placeholder="e.g. 2 coats, eggshell finish — client loved this, order extra" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{resize:"vertical"}}/></div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,cursor:"pointer"}} onClick={()=>setForm({...form,favorite:!form.favorite})}>
          <span style={{fontSize:22,color:form.favorite?"var(--gold)":"var(--border)"}}>★</span>
          <span style={{fontSize:13,color:form.favorite?"var(--gold)":"var(--muted)"}}>Mark as go-to spec for future builds</span>
        </div>
        <button className="btn" onClick={add}>Add Finish</button>
        <button className="btg" onClick={()=>setModal(false)}>Cancel</button>
      </Modal>}

      {/* Detail / Edit Modal */}
      {detail&&<Modal title={detail.item} onClose={()=>setDetailId(null)}>
        <FinishDetail finish={detail} CATS={CATS} onSave={(upd)=>{update(detail.id,upd);setDetailId(null);}} onClose={()=>setDetailId(null)}/>
      </Modal>}
    </div>
  );
}

function FinishCard({f,onTap,onFav,onDel}){
  const colorDot=f.colorCode&&(f.colorCode.startsWith("#")||f.brand?.toLowerCase().includes("sherwin")||f.brand?.toLowerCase().includes("benjamin"));
  return (
    <div className="card" style={{padding:13,cursor:"pointer"}} onClick={onTap}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontWeight:600,fontSize:14}}>{f.item}</div>
            {f.favorite&&<span style={{color:"var(--gold)",fontSize:14}}>★</span>}
          </div>
          {f.room&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>📍 {f.room}</div>}
          <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap",alignItems:"center"}}>
            {f.brand&&<span className="tag tgo" style={{fontSize:9}}>{f.brand}</span>}
            {f.colorName&&<span className="tag tb" style={{fontSize:9}}>{f.colorName}{f.colorCode?` · ${f.colorCode}`:""}</span>}
            {f.supplier&&<span className="tag tm" style={{fontSize:9}}>{f.supplier}</span>}
          </div>
          {f.productLine&&<div style={{fontSize:11,color:"var(--muted)",marginTop:5}}>{f.productLine}{f.sku?` · SKU: ${f.sku}`:""}</div>}
          {f.notes&&<div style={{fontSize:11,color:"var(--muted)",marginTop:4,fontStyle:"italic"}}>{f.notes}</div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginLeft:8,flexShrink:0}}>
          <button style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:f.favorite?"var(--gold)":"var(--border)",padding:"0 2px"}} onClick={e=>{e.stopPropagation();onFav();}}>★</button>
          <button style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",padding:"2px"}} onClick={e=>{e.stopPropagation();if(confirm("Delete this finish?"))onDel();}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:15,height:15}}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg></button>
        </div>
      </div>
    </div>
  );
}

function FinishDetail({finish,CATS,onSave,onClose}){
  const [d,setD]=useState({...finish});
  return (
    <>
      <div className="fld"><label className="lbl">Category</label>
        <select className="inp" value={d.category} onChange={e=>setD({...d,category:e.target.value})}>
          {CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
      </div>
      <div className="fld"><label className="lbl">Item Name</label><input className="inp" value={d.item} onChange={e=>setD({...d,item:e.target.value})}/></div>
      <div className="fld"><label className="lbl">Room / Location</label><input className="inp" placeholder="e.g. Master Bath" value={d.room||""} onChange={e=>setD({...d,room:e.target.value})}/></div>
      <div className="div"/>
      <div className="row2" style={{gap:8,marginBottom:12}}>
        <div><label className="lbl">Brand</label><input className="inp" value={d.brand||""} onChange={e=>setD({...d,brand:e.target.value})}/></div>
        <div><label className="lbl">Product Line</label><input className="inp" value={d.productLine||""} onChange={e=>setD({...d,productLine:e.target.value})}/></div>
      </div>
      <div className="row2" style={{gap:8,marginBottom:12}}>
        <div><label className="lbl">Color Name</label><input className="inp" value={d.colorName||""} onChange={e=>setD({...d,colorName:e.target.value})}/></div>
        <div><label className="lbl">Color Code / #</label><input className="inp" value={d.colorCode||""} onChange={e=>setD({...d,colorCode:e.target.value})}/></div>
      </div>
      <div className="row2" style={{gap:8,marginBottom:12}}>
        <div><label className="lbl">SKU / Model #</label><input className="inp" value={d.sku||""} onChange={e=>setD({...d,sku:e.target.value})}/></div>
        <div><label className="lbl">Supplier</label><input className="inp" value={d.supplier||""} onChange={e=>setD({...d,supplier:e.target.value})}/></div>
      </div>
      <div className="fld"><label className="lbl">Notes</label><textarea className="inp" rows={2} value={d.notes||""} onChange={e=>setD({...d,notes:e.target.value})} style={{resize:"vertical"}}/></div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,cursor:"pointer"}} onClick={()=>setD({...d,favorite:!d.favorite})}>
        <span style={{fontSize:22,color:d.favorite?"var(--gold)":"var(--border)"}}>★</span>
        <span style={{fontSize:13,color:d.favorite?"var(--gold)":"var(--muted)"}}>Go-to spec for future builds</span>
      </div>
      <button className="btn" onClick={()=>onSave(d)}>Save Changes</button>
      <button className="btg" onClick={onClose}>Cancel</button>
    </>
  );
}
