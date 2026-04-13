import { useState, useEffect } from "react";

const ADMIN_PASSWORD = "admin123";
const SOURCE_OPTIONS = ["Walk in", "Call in", "FB", "Online", "TMS", "介紹客"];
const COURSE_OPTIONS = ["ES", "PH", "EP", "EL", "SC", "WP"];
const STORAGE_KEY = "lead-rotation-data-v3";
const EMAIL_STORAGE_KEY = "lead-rotation-emails-v2";
const COUNSELORS_STORAGE_KEY = "lead-rotation-counselors";

const DEFAULT_COUNSELORS = ["Miya", "Rita", "Polly", "Elva"];
const DEFAULT_COLORS = [
  { bg: "#FFF0F6", accent: "#E75480", light: "#FFD6E7" },
  { bg: "#F0F4FF", accent: "#4F6EF7", light: "#C7D4FF" },
  { bg: "#F0FFF4", accent: "#2DA84E", light: "#B7EFC5" },
  { bg: "#FFF8F0", accent: "#E07B00", light: "#FFE0A0" },
  { bg: "#F5F0FF", accent: "#7C3AED", light: "#DDD6FE" },
  { bg: "#F0FFFE", accent: "#0891B2", light: "#A5F3FC" },
  { bg: "#FFF9F0", accent: "#D97706", light: "#FDE68A" },
  { bg: "#FFF0F0", accent: "#DC2626", light: "#FECACA" },
];

function getColor(index) { return DEFAULT_COLORS[index % DEFAULT_COLORS.length]; }

function load(key, fallback) {
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch {}
  return fallback;
}
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function exportToExcel(leads) {
  const headers = ["登入日期", "中文姓名", "英文姓名", "家長電話", "課程", "來源", "負責顧問", "分配時間"];
  const rows = leads.map(l => [
    l.date, l.nameCN || "", l.nameEN || "", l.phone,
    l.course || "", l.source || "", l.counselor, l.createdAt || ""
  ]);
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(","))
    .join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `潛在學生名單_${new Date().toLocaleDateString("zh-TW").replace(/\//g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function openOutlook(email, counselorName, lead) {
  if (!email) return false;
  const name = lead.nameCN || lead.nameEN || "（未填姓名）";
  const subject = encodeURIComponent(`【新潛在生通知】${name} 已分配給您`);
  const body = encodeURIComponent(
    `Hi ${counselorName}，\n\n您有一位新的潛在生已分配給您，詳細資料如下：\n\n` +
    `姓名：${lead.nameCN || "—"}／${lead.nameEN || "—"}\n` +
    `家長電話：${lead.phone}\n課程：${lead.course || "—"}\n` +
    `來源：${lead.source || "—"}\n登入日期：${lead.date}\n\n請盡快與家長聯繫，謝謝！`
  );
  window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  return true;
}

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  nameCN: "", nameEN: "", phone: "", course: "", source: "",
};

// ─── LOGIN SCREEN ───────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("choose"); // "choose" | "admin" | "counselor"
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [counselors] = useState(() => load(COUNSELORS_STORAGE_KEY, DEFAULT_COUNSELORS));

  const tryAdmin = () => {
    if (pw === ADMIN_PASSWORD) { onLogin("admin", "管理員"); }
    else { setPwError(true); setTimeout(() => setPwError(false), 1500); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1A1A2E", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Sans TC','PingFang TC',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#8888AA", textTransform: "uppercase", marginBottom: 8 }}>Branch Lead System</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff" }}>潛在學生輪流分配表</h1>
          <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>天母校</div>
        </div>

        {mode === "choose" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={() => setMode("admin")} style={{
              padding: "16px", borderRadius: 12, border: "2px solid #4F6EF7",
              background: "#4F6EF720", color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer", transition: "all .2s",
            }}>🔐 管理員登入</button>
            <button onClick={() => setMode("counselor")} style={{
              padding: "16px", borderRadius: 12, border: "2px solid #444",
              background: "#ffffff10", color: "#CCC", fontSize: 15, fontWeight: 700,
              cursor: "pointer", transition: "all .2s",
            }}>👤 顧問登入</button>
          </div>
        )}

        {mode === "admin" && (
          <div style={{ background: "#ffffff08", borderRadius: 16, padding: 24, border: "1px solid #333" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>🔐 管理員登入</div>
            <input
              type="password" placeholder="請輸入管理員密碼" value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && tryAdmin()}
              style={{
                width: "100%", padding: "12px", borderRadius: 8, fontSize: 14,
                border: `2px solid ${pwError ? "#E75480" : "#333"}`,
                background: "#ffffff10", color: "#fff", boxSizing: "border-box",
                outline: "none", marginBottom: 12,
                transition: "border-color .2s",
              }}
            />
            {pwError && <div style={{ color: "#E75480", fontSize: 12, marginBottom: 10 }}>密碼錯誤，請再試一次</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setMode("choose"); setPw(""); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #444", background: "transparent", color: "#888", cursor: "pointer" }}>返回</button>
              <button onClick={tryAdmin} style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: "#4F6EF7", color: "#fff", fontWeight: 700, cursor: "pointer" }}>登入</button>
            </div>
          </div>
        )}

        {mode === "counselor" && (
          <div style={{ background: "#ffffff08", borderRadius: 16, padding: 24, border: "1px solid #333" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>👤 選擇你的名字</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {counselors.map((c, i) => (
                <button key={c} onClick={() => onLogin("counselor", c)} style={{
                  padding: "12px 16px", borderRadius: 10, border: `2px solid ${getColor(i).accent}40`,
                  background: `${getColor(i).accent}15`, color: "#fff",
                  fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: getColor(i).accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14 }}>{c[0]}</div>
                  {c}
                </button>
              ))}
            </div>
            <button onClick={() => setMode("choose")} style={{ marginTop: 12, width: "100%", padding: 10, borderRadius: 8, border: "1px solid #444", background: "transparent", color: "#888", cursor: "pointer", fontSize: 13 }}>返回</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(null); // null | { role, name }
  const [data, setData] = useState(() => load(STORAGE_KEY, { leads: [], nextIndex: 0 }));
  const [counselors, setCounselors] = useState(() => load(COUNSELORS_STORAGE_KEY, DEFAULT_COUNSELORS));
  const [emails, setEmails] = useState(() => load(EMAIL_STORAGE_KEY, {}));
  const [emailDraft, setEmailDraft] = useState(() => load(EMAIL_STORAGE_KEY, {}));
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState("add");
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [newStaffName, setNewStaffName] = useState("");

  useEffect(() => save(STORAGE_KEY, data), [data]);
  useEffect(() => save(EMAIL_STORAGE_KEY, emails), [emails]);
  useEffect(() => save(COUNSELORS_STORAGE_KEY, counselors), [counselors]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (!auth) return <LoginScreen onLogin={(role, name) => {
    setAuth({ role, name });
    setTab(role === "admin" ? "add" : "table");
  }} />;

  const isAdmin = auth.role === "admin";
  const nextCounselor = counselors[data.nextIndex % counselors.length];

  const colorOf = (name) => {
    const i = counselors.indexOf(name);
    return i >= 0 ? getColor(i) : { bg: "#F0F0F0", accent: "#888", light: "#DDD" };
  };

  const handleSubmit = () => {
    if (!form.nameCN && !form.nameEN) return showToast("請填入姓名", "error");
    if (!form.phone) return showToast("請填入家長電話", "error");
    if (!selectedCounselor) return showToast("請選擇負責顧問", "error");
    const isRecommended = selectedCounselor === nextCounselor;
    const newLead = { ...form, counselor: selectedCounselor, isRecommended, id: Date.now(), createdAt: new Date().toLocaleString("zh-TW") };
    setData(prev => ({ leads: [newLead, ...prev.leads], nextIndex: prev.nextIndex + 1 }));
    const sent = openOutlook(emails[selectedCounselor], selectedCounselor, newLead);
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setSelectedCounselor("");
    showToast(`✓ 已分配給 ${selectedCounselor}${sent ? "，Outlook 已開啟" : ""}`);
    setTab("table");
  };

  const handleDelete = (id) => {
    setData(prev => ({ ...prev, leads: prev.leads.filter(l => l.id !== id) }));
    setDeleteId(null);
    showToast("已刪除", "error");
  };

  const addStaff = () => {
    const name = newStaffName.trim();
    if (!name) return showToast("請填入姓名", "error");
    if (counselors.includes(name)) return showToast("此名稱已存在", "error");
    setCounselors(prev => [...prev, name]);
    setNewStaffName("");
    showToast(`✓ 已新增 ${name}`);
  };

  const removeStaff = (name) => {
    if (!window.confirm(`確定要移除 ${name}？此操作不會刪除已分配的名單。`)) return;
    setCounselors(prev => prev.filter(c => c !== name));
    showToast(`已移除 ${name}`, "error");
  };

  const stats = counselors.map(c => ({ name: c, count: data.leads.filter(l => l.counselor === c).length }));
  const maxCount = Math.max(...stats.map(s => s.count), 1);

  const adminTabs = [["add","＋ 新增潛在生"], ["table","📋 總覽名單"], ["stats","📊 分配統計"], ["settings","⚙ 設定"]];
  const counselorTabs = [["table","📋 總覽名單"], ["stats","📊 分配統計"]];
  const tabs = isAdmin ? adminTabs : counselorTabs;

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5F0", fontFamily: "'Noto Sans TC','PingFang TC',sans-serif", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: "#1A1A2E", padding: "20px 24px 0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 11, letterSpacing: 4, color: "#8888AA", textTransform: "uppercase" }}>Branch Lead System</span>
              <h1 style={{ margin: "4px 0 16px", fontSize: 22, fontWeight: 800, color: "#fff" }}>潛在學生輪流分配表</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
              <div style={{ fontSize: 13, color: "#888" }}>
                {isAdmin ? "🔐 管理員" : `👤 ${auth.name}`}
              </div>
              <button onClick={() => { setAuth(null); setTab("add"); }} style={{
                padding: "6px 12px", borderRadius: 8, border: "1px solid #444",
                background: "transparent", color: "#888", cursor: "pointer", fontSize: 12,
              }}>登出</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            {tabs.map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                padding: "10px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: tab === key ? "#F7F5F0" : "transparent",
                color: tab === key ? "#1A1A2E" : "#AAA",
                borderRadius: "8px 8px 0 0", transition: "all .2s",
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

        {/* ── ADD TAB (admin only) ── */}
        {tab === "add" && isAdmin && (
          <div>
            <div style={{
              background: colorOf(nextCounselor).bg, border: `2px solid ${colorOf(nextCounselor).light}`,
              borderRadius: 14, padding: "16px 20px", marginBottom: 24,
              display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
            }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: colorOf(nextCounselor).accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 20 }}>{nextCounselor[0]}</div>
              <div>
                <div style={{ fontSize: 11, color: "#888", letterSpacing: 2, textTransform: "uppercase" }}>建議下一位輪到</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: colorOf(nextCounselor).accent }}>{nextCounselor}</div>
                {emails[nextCounselor] ? <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>✉ {emails[nextCounselor]}</div> : <div style={{ fontSize: 12, color: "#CCC", marginTop: 2 }}>尚未設定 email</div>}
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {counselors.map((c, i) => (
                  <div key={c} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: data.nextIndex % counselors.length === i ? colorOf(c).accent : "#E8E8E8", color: data.nextIndex % counselors.length === i ? "#fff" : "#666" }}>{c}</div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 16px #0001" }}>
              <h2 style={{ margin: "0 0 22px", fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>填入潛在生資料</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="登入日期 *">
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={inputStyle} />
                </Field>
                <Field label="中文姓名">
                  <input placeholder="王小明" value={form.nameCN} onChange={e => setForm({...form, nameCN: e.target.value})} style={inputStyle} />
                </Field>
                <Field label="英文姓名">
                  <input placeholder="Ming Wang" value={form.nameEN} onChange={e => setForm({...form, nameEN: e.target.value})} style={inputStyle} />
                </Field>
                <Field label="家長電話 *">
                  <input placeholder="09xx-xxx-xxx" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={inputStyle} />
                </Field>
                <Field label="課程" style={{ gridColumn: "span 2" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {COURSE_OPTIONS.map(c => (
                      <button key={c} onClick={() => setForm({...form, course: form.course === c ? "" : c})} style={{
                        padding: "9px 18px", borderRadius: 8, border: "2px solid",
                        borderColor: form.course === c ? "#1A1A2E" : "#DDD",
                        background: form.course === c ? "#1A1A2E" : "#fff",
                        color: form.course === c ? "#fff" : "#888",
                        cursor: "pointer", fontSize: 13, fontWeight: 700, letterSpacing: 1, transition: "all .15s",
                      }}>{c}</button>
                    ))}
                  </div>
                </Field>
                <Field label="來源">
                  <select value={form.source} onChange={e => setForm({...form, source: e.target.value})} style={inputStyle}>
                    <option value="">請選擇</option>
                    {SOURCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <div />
                <Field label="負責顧問 *" style={{ gridColumn: "span 2" }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {counselors.map(c => {
                      const isNext = c === nextCounselor;
                      const isSelected = selectedCounselor === c;
                      const col = colorOf(c);
                      return (
                        <button key={c} onClick={() => setSelectedCounselor(isSelected ? "" : c)} style={{
                          position: "relative", padding: "10px 24px", borderRadius: 10, border: "2px solid",
                          borderColor: isSelected ? col.accent : isNext ? col.light : "#DDD",
                          background: isSelected ? col.bg : "#fff",
                          color: isSelected ? col.accent : "#666",
                          cursor: "pointer", fontSize: 14, fontWeight: 700, transition: "all .15s",
                          boxShadow: isSelected ? `0 0 0 3px ${col.light}` : "none",
                        }}>
                          {c}
                          {isNext && <span style={{ position: "absolute", top: -9, right: -4, background: col.accent, color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 10 }}>建議</span>}
                        </button>
                      );
                    })}
                  </div>
                  {selectedCounselor && (
                    <div style={{ marginTop: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      {emails[selectedCounselor]
                        ? <span style={{ color: "#2DA84E" }}>✉ 分配後將自動開啟 Outlook 寄信給 {emails[selectedCounselor]}</span>
                        : <span style={{ color: "#AAA" }}>此顧問尚未設定 email，可至 ⚙ 設定填入</span>}
                      {selectedCounselor !== nextCounselor && <span style={{ color: "#E07B00", marginLeft: 8 }}>⚠ 非建議順序</span>}
                    </div>
                  )}
                </Field>
              </div>
              <button onClick={handleSubmit} style={{ marginTop: 24, width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "#1A1A2E", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>
                新增潛在生並分配
              </button>
            </div>
          </div>
        )}

        {/* ── TABLE TAB ── */}
        {tab === "table" && (
          <div>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, color: "#888" }}>共 <strong style={{ color: "#1A1A2E" }}>{data.leads.length}</strong> 筆資料
                {!isAdmin && <span style={{ marginLeft: 8, fontSize: 12, color: "#BBB" }}>（唯讀）</span>}
              </div>
              {data.leads.length > 0 && (
                <button onClick={() => exportToExcel(data.leads)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #2DA84E", background: "transparent", color: "#2DA84E", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>⬇ 匯出 Excel</button>
              )}
              {isAdmin && data.leads.length > 0 && (
                <button onClick={() => { if(window.confirm("確定要清除所有資料？")) { setData({ leads: [], nextIndex: 0 }); showToast("已清除", "error"); }}} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #F00A", background: "transparent", color: "#C00", cursor: "pointer", fontSize: 12 }}>清除全部</button>
              )}
            </div>
            {data.leads.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#AAA", fontSize: 15 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>還沒有任何潛在生資料
              </div>
            ) : (
              <div style={{ overflowX: "auto", borderRadius: 14, boxShadow: "0 2px 16px #0001" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#1A1A2E", color: "#fff" }}>
                      {["登入日期","中文姓名","英文姓名","家長電話","課程","來源","負責顧問", isAdmin ? "寄信" : null, isAdmin ? "操作" : null].filter(Boolean).map(h => (
                        <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.leads.map((lead, i) => (
                      <tr key={lead.id} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                        <td style={{ padding: "11px 14px", color: "#666", whiteSpace: "nowrap" }}>{lead.date}</td>
                        <td style={{ padding: "11px 14px", fontWeight: 600 }}>{lead.nameCN || "—"}</td>
                        <td style={{ padding: "11px 14px" }}>{lead.nameEN || "—"}</td>
                        <td style={{ padding: "11px 14px", fontFamily: "monospace" }}>{lead.phone}</td>
                        <td style={{ padding: "11px 14px" }}>
                          {lead.course ? <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "#1A1A2E", color: "#fff", letterSpacing: 1 }}>{lead.course}</span> : "—"}
                        </td>
                        <td style={{ padding: "11px 14px" }}>{lead.source || "—"}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: colorOf(lead.counselor).light, color: colorOf(lead.counselor).accent }}>{lead.counselor}</span>
                            {!lead.isRecommended && <span title="非建議順序" style={{ fontSize: 11 }}>⚠️</span>}
                          </div>
                        </td>
                        {isAdmin && (
                          <td style={{ padding: "11px 14px" }}>
                            {emails[lead.counselor]
                              ? <button onClick={() => openOutlook(emails[lead.counselor], lead.counselor, lead)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: colorOf(lead.counselor).light, color: colorOf(lead.counselor).accent, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>✉ 寄信</button>
                              : <span style={{ color: "#CCC", fontSize: 12 }}>未設定</span>}
                          </td>
                        )}
                        {isAdmin && (
                          <td style={{ padding: "11px 14px" }}>
                            <button onClick={() => setDeleteId(lead.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #F00A", background: "transparent", color: "#C00", cursor: "pointer", fontSize: 12 }}>刪除</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── STATS TAB ── */}
        {tab === "stats" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {stats.map(({ name, count }) => (
              <div key={name} style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px #0001", borderLeft: `5px solid ${colorOf(name).accent}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: colorOf(name).accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 18 }}>{name[0]}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: "#1A1A2E" }}>{name}</div>
                    {emails[name] ? <div style={{ fontSize: 11, color: "#888" }}>✉ {emails[name]}</div> : <div style={{ fontSize: 11, color: "#CCC" }}>未設定 email</div>}
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 32, fontWeight: 900, color: colorOf(name).accent }}>{count}</div>
                </div>
                <div style={{ height: 8, background: "#F0F0F0", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, background: colorOf(name).accent, width: `${(count / maxCount) * 100}%`, transition: "width .5s ease" }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#AAA" }}>{data.leads.length > 0 ? `佔比 ${Math.round((count / data.leads.length) * 100)}%` : "尚無資料"}</div>
                <div style={{ marginTop: 16 }}>
                  {data.leads.filter(l => l.counselor === name).slice(0, 3).map(l => (
                    <div key={l.id} style={{ padding: "6px 10px", borderRadius: 8, background: colorOf(name).bg, marginBottom: 4, fontSize: 12, color: "#555", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>{l.nameCN || l.nameEN || "（未填姓名）"}</span>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {l.course && <span style={{ background: "#1A1A2E", color: "#fff", borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{l.course}</span>}
                        <span style={{ color: "#AAA" }}>{l.date}</span>
                      </div>
                    </div>
                  ))}
                  {count > 3 && <div style={{ fontSize: 12, color: "#AAA", paddingLeft: 10 }}>...還有 {count - 3} 位</div>}
                  {count === 0 && <div style={{ fontSize: 12, color: "#CCC", paddingLeft: 10 }}>尚未分配任何潛在生</div>}
                </div>
              </div>
            ))}
            <div style={{ gridColumn: "span 2", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px #0001" }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>📊 均衡度檢視</div>
              {data.leads.length === 0 ? <div style={{ color: "#AAA", fontSize: 14 }}>尚無資料</div> : (() => {
                const counts = stats.map(s => s.count);
                const min = Math.min(...counts), max = Math.max(...counts);
                const diff = max - min;
                const isBalanced = diff <= 1;
                return (
                  <div style={{ padding: 16, borderRadius: 10, background: isBalanced ? "#F0FFF4" : "#FFF8F0", border: `1px solid ${isBalanced ? "#B7EFC5" : "#FFE0A0"}` }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{isBalanced ? "✅" : "⚠️"}</div>
                    <div style={{ fontWeight: 700, color: isBalanced ? "#2DA84E" : "#E07B00" }}>{isBalanced ? "分配十分均衡！" : `最多差距 ${diff} 筆，建議檢查`}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>最多：{stats.find(s => s.count === max)?.name}（{max} 筆）｜最少：{stats.find(s => s.count === min)?.name}（{min} 筆）</div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB (admin only) ── */}
        {tab === "settings" && isAdmin && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
            {/* Email settings */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 16px #0001" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>✉ 顧問 Email</h2>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#999" }}>分配後自動開啟 Outlook 寄通知信</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {counselors.map((c, i) => (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: getColor(i).accent, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 13 }}>{c[0]}</div>
                    <div style={{ fontWeight: 700, width: 48, color: getColor(i).accent, fontSize: 13 }}>{c}</div>
                    <input type="email" placeholder={`${c.toLowerCase()}@company.com`} value={emailDraft[c] || ""} onChange={e => setEmailDraft(prev => ({ ...prev, [c]: e.target.value }))} style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
                  </div>
                ))}
              </div>
              <button onClick={() => { setEmails({ ...emailDraft }); showToast("✓ Email 設定已儲存"); }} style={{ marginTop: 20, width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#1A1A2E", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>儲存 Email 設定</button>
            </div>

            {/* Staff management */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 16px #0001" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>👥 顧問管理</h2>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#999" }}>新增或移除輪流名單中的顧問</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {counselors.map((c, i) => (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: getColor(i).bg, border: `1px solid ${getColor(i).light}` }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: getColor(i).accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 13 }}>{c[0]}</div>
                    <span style={{ fontWeight: 700, color: getColor(i).accent, flex: 1 }}>{c}</span>
                    <span style={{ fontSize: 12, color: "#AAA" }}>{data.leads.filter(l => l.counselor === c).length} 筆</span>
                    <button onClick={() => removeStaff(c)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #F00A", background: "transparent", color: "#C00", cursor: "pointer", fontSize: 12 }}>移除</button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input placeholder="新顧問姓名" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} onKeyDown={e => e.key === "Enter" && addStaff()} style={{ ...inputStyle, flex: 1 }} />
                <button onClick={addStaff} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#1A1A2E", color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>＋ 新增</button>
              </div>
              <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: "#FFF8F0", border: "1px solid #FFE0A0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#E07B00", marginBottom: 4 }}>⚠ 管理員密碼</div>
                <div style={{ fontSize: 12, color: "#888" }}>目前密碼：<code style={{ background: "#F0F0F0", padding: "2px 6px", borderRadius: 4 }}>{ADMIN_PASSWORD}</code></div>
                <div style={{ fontSize: 11, color: "#BBB", marginTop: 4 }}>如需修改請聯繫系統管理員變更程式碼</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? "#C00" : toast.type === "warn" ? "#E07B00" : "#1A1A2E", color: "#fff", padding: "12px 28px", borderRadius: 30, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px #0004", animation: "fadeIn .2s ease", whiteSpace: "nowrap", zIndex: 200 }}>{toast.msg}</div>
      )}

      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "#0005", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={() => setDeleteId(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 320, width: "90%" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>確定要刪除？</div>
            <div style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>此操作無法復原。</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #DDD", background: "#fff", cursor: "pointer" }}>取消</button>
              <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#C00", color: "#fff", fontWeight: 700, cursor: "pointer" }}>確定刪除</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity:0; transform: translateX(-50%) translateY(8px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", letterSpacing: .5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E0E0E0",
  fontSize: 14, outline: "none", background: "#FAFAFA",
  transition: "border-color .15s", width: "100%", boxSizing: "border-box",
};
