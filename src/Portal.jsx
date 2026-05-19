import { useState } from "react";
import { loadProjectByPin } from "./supabase";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0d1117;color:#e6e2d8;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
  :root{--gold:#c8a456;--dark:#0d1117;--card:#161b24;--card2:#1c2230;--border:#252d3d;--text:#e6e2d8;--muted:#6b7592;--red:#e05252;--green:#4dbb78;--blue:#4e90d9}
  .app{max-width:430px;margin:0 auto;padding-bottom:40px;min-height:100vh}
  .card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:15px;margin:10px 13px}
  .pb{height:3px;background:var(--border);border-radius:2px;overflow:hidden;margin-top:7px}
  .pf{height:100%;background:var(--gold);border-radius:2px;transition:width .4s}
  .tag{display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:500}
  .tg{background:rgba(77,187,120,.12);color:var(--green)}
  .tr{background:rgba(224,82,82,.12);color:var(--red)}
  .tgo{background:rgba(200,164,86,.12);color:var(--gold)}
  .tb{background:rgba(78,144,217,.12);color:var(--blue)}
  .igrid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px}
  .icard{border:2px solid var(--border);border-radius:9px;overflow:hidden;cursor:pointer;transition:border-color .2s}
  .icard.sel{border-color:var(--gold)}
  .icard-lbl{padding:7px;font-size:12px;text-align:center;font-weight:500}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
`;

export default function Portal() {
  const [pin, setPin] = useState("");
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const proj = await loadProjectByPin(pin.trim());
      if (!proj) {
        setError("Invalid PIN. Please check with your builder.");
      } else {
        setProject(proj);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!project) {
    return (
      <>
        <style>{CSS}</style>
        <div style={{
          minHeight: "100vh", background: "#0d1117",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "24px",
        }}>
          <img src="/cb-logo.PNG" alt="Chance Builders"
            style={{ width: 120, height: 120, objectFit: "contain", marginBottom: 8 }}
            onError={e => e.target.style.display = "none"}
          />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#c8a456", letterSpacing: 3, marginBottom: 4 }}>
            Chance Builders
          </div>
          <div style={{ fontSize: 11, color: "#6b7592", letterSpacing: 2, textTransform: "uppercase", marginBottom: 40 }}>
            Client Portal
          </div>

          <div style={{ background: "#161b24", border: "1px solid #252d3d", borderRadius: 12, padding: "28px 24px", width: "100%", maxWidth: 380 }}>
            <div style={{ fontSize: 13, color: "#6b7592", marginBottom: 20, lineHeight: 1.6, textAlign: "center" }}>
              Enter the 6-digit PIN provided by your builder to view your project progress.
            </div>
            <form onSubmit={handlePin}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: "#6b7592", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 5 }}>
                  Project PIN
                </label>
                <input
                  type="text"
                  value={pin}
                  onChange={e => setPin(e.target.value.toUpperCase())}
                  placeholder="e.g. AB1C2D"
                  maxLength={6}
                  required
                  style={{
                    width: "100%", background: "#1c2230", border: "1px solid #252d3d",
                    borderRadius: 8, padding: "12px", color: "#e6e2d8",
                    fontFamily: "monospace", fontSize: 20, outline: "none",
                    letterSpacing: 4, textAlign: "center", textTransform: "uppercase",
                  }}
                  onFocus={e => e.target.style.borderColor = "#c8a456"}
                  onBlur={e => e.target.style.borderColor = "#252d3d"}
                />
              </div>
              {error && (
                <div style={{ background: "rgba(224,82,82,.1)", border: "1px solid rgba(224,82,82,.2)", borderRadius: 8, padding: "9px 12px", fontSize: 12, color: "#e05252", marginBottom: 14 }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} style={{
                width: "100%", background: loading ? "#6b7592" : "#c8a456",
                color: "#0d1117", border: "none", borderRadius: 8, padding: "12px",
                fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
              }}>
                {loading ? "Looking up..." : "View My Project →"}
              </button>
            </form>
          </div>

          <div style={{ marginTop: 28, fontSize: 12, color: "#6b7592" }}>
            Builder?{" "}
            <a href="/" style={{ color: "#c8a456", textDecoration: "none" }}>Sign in here →</a>
          </div>
        </div>
      </>
    );
  }

  // Project view
  const tasks = project.phases?.flatMap(ph => ph.tasks) || [];
  const activeTasks = tasks.filter(t => !t.na);
  const done = activeTasks.filter(t => t.completed).length;
  const pct = activeTasks.length ? Math.round(done / activeTasks.length * 100) : 0;
  const curPhase = project.phases?.find(ph => ph.tasks.some(t => !t.completed && !t.na));
  const sels = project.selections || [];
  const pendingCOs = (project.changeOrders || []).filter(co => co.status === "presented");

  const choose = (selId, option) => {
    const updated = { ...project, selections: sels.map(s => s.id === selId ? { ...s, chosen: option, chosenAt: new Date().toLocaleString() } : s) };
    setProject(updated);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* Header */}
        <div style={{ background: "#161b24", borderBottom: "1px solid #252d3d", padding: "13px 16px", position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/cb-logo.PNG" alt="CB" style={{ width: 33, height: 33, objectFit: "cover", borderRadius: 2 }} onError={e => e.target.style.display = "none"} />
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#c8a456", letterSpacing: 1.5, lineHeight: 1 }}>Chance Builders</div>
            <div style={{ fontSize: 9, color: "#6b7592", letterSpacing: .8, textTransform: "uppercase", marginTop: 1 }}>Client Portal</div>
          </div>
          <button onClick={() => setProject(null)} style={{ marginLeft: "auto", background: "transparent", border: "1px solid #252d3d", color: "#6b7592", padding: "5px 11px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Sign Out
          </button>
        </div>

        {/* Progress card */}
        <div className="card">
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#c8a456", letterSpacing: 1 }}>Your Home Progress</div>
            <div style={{ fontSize: 12, color: "#6b7592", marginTop: 2 }}>{project.name}</div>
            {project.clientName && <div style={{ fontSize: 12, color: "#6b7592" }}>{project.clientName}</div>}
          </div>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: "#c8a456" }}>{pct}%</div>
            <div style={{ fontSize: 12, color: "#6b7592" }}>Complete</div>
          </div>
          <div className="pb" style={{ height: 5 }}><div className="pf" style={{ width: `${pct}%` }} /></div>
          {curPhase && <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "#6b7592" }}>Currently working on: <b style={{ color: "#e6e2d8" }}>{curPhase.short || curPhase.name}</b></div>}
        </div>

        {/* Pending COs */}
        {pendingCOs.length > 0 && (
          <div className="card" style={{ background: "rgba(224,82,82,.06)", borderColor: "rgba(224,82,82,.2)", padding: 13 }}>
            <div style={{ fontSize: 13, color: "#e05252", fontWeight: 600, marginBottom: 8 }}>⚠ Change Orders Requiring Your Approval</div>
            {pendingCOs.map(co => (
              <div key={co.id} style={{ marginBottom: 6, fontSize: 12 }}>
                <b>{co.description}</b> — ${Number(co.amount).toLocaleString()}
                {co.reason && <div style={{ fontSize: 11, color: "#6b7592" }}>{co.reason}</div>}
              </div>
            ))}
            <div style={{ fontSize: 11, color: "#6b7592", marginTop: 8 }}>Contact your builder to review and approve.</div>
          </div>
        )}

        {/* Phase list */}
        <div style={{ fontSize: 11, color: "#c8a456", textTransform: "uppercase", letterSpacing: 1, padding: "13px 16px 5px", fontFamily: "'Bebas Neue',sans-serif", fontSize: 16 }}>Build Phases</div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {project.phases?.map(ph => {
            const active = ph.tasks.filter(t => !t.na);
            const d = active.filter(t => t.completed).length;
            const tt = active.length;
            const complete = d === tt;
            const inProg = d > 0 && !complete;
            return (
              <div key={ph.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", borderBottom: "1px solid #252d3d" }}>
                <span style={{ fontSize: 18 }}>{ph.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{ph.short || ph.name}</div>
                  <div className="pb" style={{ marginTop: 3 }}><div className="pf" style={{ width: `${tt ? Math.round(d / tt * 100) : 100}%` }} /></div>
                </div>
                <span className={`tag ${complete ? "tg" : inProg ? "tgo" : "tb"}`} style={{ fontSize: 9, flexShrink: 0 }}>
                  {complete ? "✓ Done" : inProg ? `${d}/${tt}` : "Upcoming"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selections */}
        {sels.length > 0 && <>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: "#c8a456", letterSpacing: 1, padding: "13px 16px 5px" }}>Your Selections</div>
          {sels.map(s => (
            <div key={s.id} className="card">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{s.title}</div>
              {s.description && <div style={{ fontSize: 12, color: "#6b7592", marginBottom: 9 }}>{s.description}</div>}
              {s.chosen
                ? <div style={{ textAlign: "center", padding: 11, background: "rgba(77,187,120,.08)", border: "1px solid rgba(77,187,120,.2)", borderRadius: 8 }}>
                    <div style={{ color: "#4dbb78", fontWeight: 600, fontSize: 13 }}>✓ You selected: {s.chosen === "A" ? s.optionA : s.optionB}</div>
                    <div style={{ fontSize: 10, color: "#6b7592", marginTop: 3 }}>{s.chosenAt}</div>
                  </div>
                : <>
                    <div className="igrid">
                      {[{ k: "A", l: s.optionA, img: s.imageA }, { k: "B", l: s.optionB, img: s.imageB }].map(opt => (
                        <div key={opt.k} className={`icard${s.chosen === opt.k ? " sel" : ""}`} onClick={() => choose(s.id, opt.k)}>
                          {opt.img
                            ? <img src={opt.img} alt={opt.l} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} onError={e => e.target.style.display = "none"} />
                            : <div style={{ height: 100, background: "#1c2230", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7592", fontSize: 12 }}>Option {opt.k}</div>
                          }
                          <div className="icard-lbl">{opt.l || `Option ${opt.k}`}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: "#6b7592", textAlign: "center", marginTop: 7 }}>Tap to make your selection</div>
                  </>
              }
            </div>
          ))}
        </>}
      </div>
    </>
  );
}
