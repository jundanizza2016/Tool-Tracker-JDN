import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from "react";

type ToolStatus = "available" | "checked-out" | "maintenance" | "reserved";

interface Tool {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  status: ToolStatus;
  location: string;
  assignedTo?: string;
  lastMovement: string;
  checkoutTime?: string;
  condition: "good" | "fair" | "poor";
}

interface Movement {
  id: string;
  toolId: string;
  toolName: string;
  action: "checkout" | "return" | "transfer" | "maintenance";
  fromLocation: string;
  toLocation: string;
  user: string;
  timestamp: string;
  notes?: string;
}

const INITIAL_TOOLS: Tool[] = [
  { id: "T001", name: "Torque Wrench 50Nm", category: "Hand Tools", serialNumber: "TW-2847-A", status: "available", location: "Bay A", lastMovement: "2026-08-21 08:14", condition: "good" },
  { id: "T002", name: "Digital Caliper 150mm", category: "Measurement", serialNumber: "DC-0391-B", status: "checked-out", location: "Assembly Line 2", assignedTo: "Raka Setiawan", lastMovement: "2026-08-21 09:30", checkoutTime: "2026-08-21 09:30", condition: "good" },
  { id: "T003", name: "Impact Driver 18V", category: "Power Tools", serialNumber: "ID-7723-C", status: "maintenance", location: "Maintenance Workshop", lastMovement: "2026-08-20 16:45", condition: "poor" },
  { id: "T004", name: "Angle Grinder 115mm", category: "Power Tools", serialNumber: "AG-1156-D", status: "checked-out", location: "Fabrication Floor", assignedTo: "Budi Hartono", lastMovement: "2026-08-21 07:50", checkoutTime: "2026-08-21 07:50", condition: "good" },
  { id: "T005", name: "Multimeter FLUKE 117", category: "Measurement", serialNumber: "FM-4492-E", status: "available", location: "Bay B", lastMovement: "2026-08-20 17:00", condition: "good" },
  { id: "T006", name: "Hydraulic Jack 3 Ton", category: "Lifting", serialNumber: "HJ-8811-F", status: "reserved", location: "Bay C", assignedTo: "Dewi Kusuma", lastMovement: "2026-08-21 08:00", condition: "fair" },
  { id: "T007", name: "Oscilloscope 200MHz", category: "Electronics", serialNumber: "OS-3344-G", status: "available", location: "Electronics Lab", lastMovement: "2026-08-19 14:20", condition: "good" },
  { id: "T008", name: "Bench Vise 150mm", category: "Workholding", serialNumber: "BV-6677-H", status: "available", location: "Assembly Line 1", lastMovement: "2026-08-18 11:00", condition: "fair" },
  { id: "T009", name: "Pressure Gauge 0-16 Bar", category: "Measurement", serialNumber: "PG-9910-I", status: "checked-out", location: "Compressor Room", assignedTo: "Agus Purnomo", lastMovement: "2026-08-21 10:15", checkoutTime: "2026-08-21 10:15", condition: "good" },
  { id: "T010", name: "Pipe Wrench 24\"", category: "Hand Tools", serialNumber: "PW-2234-J", status: "available", location: "Assembly Line 1", lastMovement: "2026-08-17 09:30", condition: "good" },
  { id: "T011", name: "Hex Key Set 9pc", category: "Hand Tools", serialNumber: "HK-5521-K", status: "available", location: "Bay A", lastMovement: "2026-08-20 10:00", condition: "good" },
  { id: "T012", name: "Cordless Drill 18V", category: "Power Tools", serialNumber: "CD-3312-L", status: "checked-out", location: "Assembly Line 2", assignedTo: "Sari Wijaya", lastMovement: "2026-08-21 11:00", checkoutTime: "2026-08-21 11:00", condition: "good" },
];

const INITIAL_MOVEMENTS: Movement[] = [
  { id: "M001", toolId: "T002", toolName: "Digital Caliper 150mm", action: "checkout", fromLocation: "Bay A", toLocation: "Assembly Line 2", user: "Raka Setiawan", timestamp: "2026-08-21 09:30", notes: "QC inspection batch #4421" },
  { id: "M002", toolId: "T004", toolName: "Angle Grinder 115mm", action: "checkout", fromLocation: "Bay A", toLocation: "Fabrication Floor", user: "Budi Hartono", timestamp: "2026-08-21 07:50" },
  { id: "M003", toolId: "T003", toolName: "Impact Driver 18V", action: "maintenance", fromLocation: "Bay B", toLocation: "Maintenance Workshop", user: "Teguh Santoso", timestamp: "2026-08-20 16:45", notes: "Trigger mechanism worn out" },
  { id: "M004", toolId: "T006", toolName: "Hydraulic Jack 3 Ton", action: "transfer", fromLocation: "Bay A", toLocation: "Bay C", user: "Dewi Kusuma", timestamp: "2026-08-21 08:00", notes: "Reserved for engine lift job #887" },
  { id: "M005", toolId: "T009", toolName: "Pressure Gauge 0-16 Bar", action: "checkout", fromLocation: "Measurement Rack", toLocation: "Compressor Room", user: "Agus Purnomo", timestamp: "2026-08-21 10:15" },
  { id: "M006", toolId: "T001", toolName: "Torque Wrench 50Nm", action: "return", fromLocation: "Engine Bay 1", toLocation: "Bay A", user: "Sari Wijaya", timestamp: "2026-08-21 08:14", notes: "Calibration still valid" },
  { id: "M007", toolId: "T012", toolName: "Cordless Drill 18V", action: "checkout", fromLocation: "Bay B", toLocation: "Assembly Line 2", user: "Sari Wijaya", timestamp: "2026-08-21 11:00" },
];

const STATUS_CONFIG: Record<ToolStatus, { label: string; labelId: string; color: string; dot: string; bg: string }> = {
  available:     { label: "Available",    labelId: "Tersedia",    color: "#22c55e", dot: "bg-green-400",  bg: "rgba(34,197,94,0.1)" },
  "checked-out": { label: "Checked Out",  labelId: "Dipinjam",    color: "#f97316", dot: "bg-orange-400", bg: "rgba(249,115,22,0.1)" },
  maintenance:   { label: "Maintenance",  labelId: "Maintenance", color: "#ef4444", dot: "bg-red-400",    bg: "rgba(239,68,68,0.1)" },
  reserved:      { label: "Reserved",     labelId: "Direservasi", color: "#3b82f6", dot: "bg-blue-400",   bg: "rgba(59,130,246,0.1)" },
};

const ACTION_CONFIG: Record<Movement["action"], { label: string; icon: string; color: string }> = {
  checkout:    { label: "Checkout",    icon: "↗", color: "#f97316" },
  return:      { label: "Return",      icon: "↙", color: "#22c55e" },
  transfer:    { label: "Transfer",    icon: "⇄", color: "#3b82f6" },
  maintenance: { label: "Maintenance", icon: "⚙", color: "#ef4444" },
};

const CATEGORIES = ["Hand Tools", "Power Tools", "Measurement", "Lifting", "Electronics", "Workholding", "Pneumatics", "Other"];

const EMPTY_TOOL: Omit<Tool, "id"> = {
  name: "", category: "Hand Tools", serialNumber: "",
  status: "available", location: "", condition: "good",
  lastMovement: "", assignedTo: undefined,
};

// ── Field (stable component – jangan didefinisikan di dalam component lain,
//    agar input tidak di-remount dan kehilangan fokus saat mengetik) ─────────
function Field({ label, fkey, form, setForm, opts }: {
  label: string; fkey: keyof Tool; form: Tool;
  setForm: Dispatch<SetStateAction<Tool>>; opts?: string[];
}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </label>
      {opts ? (
        <select value={form[fkey] as string} onChange={e => setForm(f => ({ ...f, [fkey]: e.target.value }))}
          className="w-full text-sm px-3 py-3 rounded outline-none cursor-pointer appearance-none"
          style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input value={(form[fkey] as string) ?? ""} onChange={e => setForm(f => ({ ...f, [fkey]: e.target.value }))}
          className="w-full text-sm px-3 py-3 rounded outline-none"
          style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
      )}
    </div>
  );
}

// ── ToolModal ──────────────────────────────────────────────────────────────
function ToolModal({ tool, isNew, onSave, onDelete, onClose }: {
  tool: Tool; isNew: boolean;
  onSave: (t: Tool) => void; onDelete: (id: string) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<Tool>({ ...tool });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", maxHeight: "92dvh" }}>

        {/* drag handle on mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border)" }} />
        </div>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="font-semibold text-base">{isNew ? "Tambah Tooling" : "Edit Tooling"}</h2>
            {!isNew && <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{tool.id} · {tool.serialNumber}</p>}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-xl cursor-pointer"
            style={{ color: "var(--muted-foreground)", backgroundColor: "var(--muted)" }}>×</button>
        </div>

        <div className="px-5 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(92dvh - 140px)" }}>
          <Field label="Nama Tooling" fkey="name" form={form} setForm={setForm} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategori" fkey="category" form={form} setForm={setForm} opts={CATEGORIES} />
            <Field label="Serial Number" fkey="serialNumber" form={form} setForm={setForm} />
          </div>
          <Field label="Lokasi" fkey="location" form={form} setForm={setForm} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status" fkey="status" form={form} setForm={setForm} opts={["available", "checked-out", "maintenance", "reserved"]} />
            <Field label="Kondisi" fkey="condition" form={form} setForm={setForm} opts={["good", "fair", "poor"]} />
          </div>
          {(form.status === "checked-out" || form.status === "reserved") && (
            <div>
              <label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Penanggung Jawab</label>
              <input value={form.assignedTo ?? ""} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value || undefined }))}
                placeholder="Nama peminjam / pemesan" className="w-full text-sm px-3 py-3 rounded outline-none"
                style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          {!isNew
            ? <button onClick={() => { onDelete(tool.id); onClose(); }} className="text-sm px-4 py-2.5 rounded-lg font-medium cursor-pointer"
                style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                Hapus
              </button>
            : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm px-4 py-2.5 rounded-lg font-medium cursor-pointer"
              style={{ backgroundColor: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>Batal</button>
            <button onClick={() => { onSave(form); onClose(); }}
              disabled={!form.name || !form.serialNumber || !form.location}
              className="text-sm px-6 py-2.5 rounded-lg font-semibold cursor-pointer disabled:opacity-40"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>Simpan</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── StatusBadge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ToolStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: cfg.color }} />
      {cfg.labelId}
    </span>
  );
}

// ── ToolCard (mobile) ──────────────────────────────────────────────────────
function ToolCard({ tool, onEdit }: { tool: Tool; onEdit: () => void }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{tool.name}</span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
            {tool.id} · {tool.serialNumber}
          </div>
        </div>
        <button onClick={onEdit} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
          style={{ backgroundColor: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
          Edit
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <StatusBadge status={tool.status} />
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>
          {tool.category}
        </span>
        <span className="text-xs font-medium" style={{ color: tool.condition === "good" ? "#22c55e" : tool.condition === "fair" ? "#f59e0b" : "#ef4444" }}>
          {tool.condition === "good" ? "Baik" : tool.condition === "fair" ? "Cukup" : "Buruk"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span style={{ color: "var(--muted-foreground)" }}>Lokasi</span>
          <div className="font-medium mt-0.5 truncate">{tool.location}</div>
        </div>
        <div>
          <span style={{ color: "var(--muted-foreground)" }}>Peminjam</span>
          <div className="font-medium mt-0.5 truncate">{tool.assignedTo ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}

// ── MovementCard (mobile) ──────────────────────────────────────────────────
function MovementCard({ m }: { m: Movement }) {
  const cfg = ACTION_CONFIG[m.action];
  return (
    <div className="rounded-xl p-4 flex gap-3" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base"
        style={{ backgroundColor: "var(--muted)", color: cfg.color }}>{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold truncate">{m.toolName}</span>
          <span className="text-xs flex-shrink-0" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{m.timestamp.slice(11)}</span>
        </div>
        <div className="text-xs mt-0.5 font-medium" style={{ color: cfg.color }}>{cfg.label}</div>
        <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
          {m.fromLocation} → <span style={{ color: "var(--foreground)" }}>{m.toLocation}</span>
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{m.user} · {m.timestamp.slice(0, 10)}</div>
        {m.notes && <div className="text-xs mt-1 italic" style={{ color: "var(--muted-foreground)" }}>"{m.notes}"</div>}
      </div>
    </div>
  );
}

// ── LinePanel ──────────────────────────────────────────────────────────────
function LinePanel({ lineName, tools }: { lineName: string; tools: Tool[] }) {
  const [open, setOpen] = useState(true);
  const avail = tools.filter(t => t.status === "available").length;
  const out = tools.filter(t => t.status === "checked-out").length;
  const maint = tools.filter(t => t.status === "maintenance").length;
  const res = tools.filter(t => t.status === "reserved").length;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ backgroundColor: "var(--muted)" }}>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{lineName}</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--secondary)", color: "var(--muted-foreground)" }}>
            {tools.length} tool
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-2">
            {avail > 0 && <span className="text-xs font-medium" style={{ color: "#22c55e" }}>{avail} tersedia</span>}
            {out > 0 && <span className="text-xs font-medium" style={{ color: "#f97316" }}>{out} dipinjam</span>}
            {maint > 0 && <span className="text-xs font-medium" style={{ color: "#ef4444" }}>{maint} maint.</span>}
            {res > 0 && <span className="text-xs font-medium" style={{ color: "#3b82f6" }}>{res} reservasi</span>}
          </div>
          <span className="text-xs" style={{ color: "var(--muted-foreground)", transform: open ? "rotate(180deg)" : "rotate(0)", display: "inline-block", transition: "transform 0.2s" }}>▼</span>
        </div>
      </button>

      {/* status mini-bar */}
      {tools.length > 0 && (
        <div className="h-1 flex" style={{ backgroundColor: "var(--muted)" }}>
          {[
            { n: avail, c: "#22c55e" }, { n: out, c: "#f97316" },
            { n: res, c: "#3b82f6" }, { n: maint, c: "#ef4444" },
          ].map((s, i) => s.n > 0 && (
            <div key={i} style={{ width: `${(s.n / tools.length) * 100}%`, backgroundColor: s.c }} />
          ))}
        </div>
      )}

      {open && (
        <div className="divide-y" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          {tools.map(tool => {
            const cfg = STATUS_CONFIG[tool.status];
            return (
              <div key={tool.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{tool.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{tool.serialNumber}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.labelId}</div>
                  {tool.assignedTo && <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{tool.assignedTo}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
type Tab = "dashboard" | "tools" | "movements" | "checkout";

const TAB_META: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dasbor", icon: "⊞" },
  { id: "tools",     label: "Tooling", icon: "⚒" },
  { id: "movements", label: "Log",     icon: "↕" },
  { id: "checkout",  label: "Check I/O", icon: "⇌" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [tools, setTools] = useState<Tool[]>(INITIAL_TOOLS);
  const [movements, setMovements] = useState<Movement[]>(INITIAL_MOVEMENTS);
  const [filterStatus, setFilterStatus] = useState<ToolStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [checkoutForm, setCheckoutForm] = useState({ toolId: "", user: "", toLocation: "", notes: "" });
  const [returnToolId, setReturnToolId] = useState("");
  const [checkoutMode, setCheckoutMode] = useState<"checkout" | "return">("checkout");
  const [editingTool, setEditingTool] = useState<{ tool: Tool; isNew: boolean } | null>(null);
  const [dashboardView, setDashboardView] = useState<"overview" | "lines">("overview");

  const stats = {
    total: tools.length,
    available: tools.filter(t => t.status === "available").length,
    checkedOut: tools.filter(t => t.status === "checked-out").length,
    maintenance: tools.filter(t => t.status === "maintenance").length,
    reserved: tools.filter(t => t.status === "reserved").length,
  };

  // group tools by location for line dashboard
  const lineGroups = tools.reduce<Record<string, Tool[]>>((acc, t) => {
    const k = t.location;
    if (!acc[k]) acc[k] = [];
    acc[k].push(t);
    return acc;
  }, {});

  const filteredTools = tools.filter(t => {
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch = q === "" ||
      t.name.toLowerCase().includes(q) ||
      t.serialNumber.toLowerCase().includes(q) ||
      t.location.toLowerCase().includes(q) ||
      (t.assignedTo ?? "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  function handleSaveTool(updated: Tool) {
    const now = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace("T", " ").slice(0, 16);
    setTools(prev => {
      const exists = prev.find(t => t.id === updated.id);
      if (exists) return prev.map(t => t.id === updated.id ? { ...updated, lastMovement: now } : t);
      const newId = `T${String(prev.length + 1).padStart(3, "0")}`;
      return [...prev, { ...updated, id: newId, lastMovement: now }];
    });
  }

  function handleDeleteTool(id: string) {
    setTools(prev => prev.filter(t => t.id !== id));
    setMovements(prev => prev.filter(m => m.toolId !== id));
  }

  function openAddTool() {
    setEditingTool({ tool: { id: "", ...EMPTY_TOOL }, isNew: true });
  }

  function handleCheckout() {
    if (!checkoutForm.toolId || !checkoutForm.user || !checkoutForm.toLocation) return;
    const tool = tools.find(t => t.id === checkoutForm.toolId);
    if (!tool || tool.status !== "available") return;
    const now = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace("T", " ").slice(0, 16);
    const mv: Movement = {
      id: `M${String(movements.length + 1).padStart(3, "0")}`,
      toolId: tool.id, toolName: tool.name, action: "checkout",
      fromLocation: tool.location, toLocation: checkoutForm.toLocation,
      user: checkoutForm.user, timestamp: now,
      notes: checkoutForm.notes || undefined,
    };
    setTools(prev => prev.map(t => t.id === checkoutForm.toolId
      ? { ...t, status: "checked-out", assignedTo: checkoutForm.user, location: checkoutForm.toLocation, lastMovement: now, checkoutTime: now }
      : t));
    setMovements(prev => [mv, ...prev]);
    setCheckoutForm({ toolId: "", user: "", toLocation: "", notes: "" });
  }

  function handleReturn() {
    if (!returnToolId) return;
    const tool = tools.find(t => t.id === returnToolId);
    if (!tool || tool.status !== "checked-out") return;
    const now = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace("T", " ").slice(0, 16);
    const returnLoc = "Bay A";
    const mv: Movement = {
      id: `M${String(movements.length + 1).padStart(3, "0")}`,
      toolId: tool.id, toolName: tool.name, action: "return",
      fromLocation: tool.location, toLocation: returnLoc,
      user: tool.assignedTo ?? "—", timestamp: now,
    };
    setTools(prev => prev.map(t => t.id === returnToolId
      ? { ...t, status: "available", assignedTo: undefined, location: returnLoc, lastMovement: now, checkoutTime: undefined }
      : t));
    setMovements(prev => [mv, ...prev]);
    setReturnToolId("");
  }

  const inputStyle = { backgroundColor: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" };
  const labelStyle = { color: "var(--muted-foreground)" };

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{ backgroundColor: "var(--background)", color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>

      {editingTool && (
        <ToolModal tool={editingTool.tool} isNew={editingTool.isNew}
          onSave={handleSaveTool} onDelete={handleDeleteTool} onClose={() => setEditingTool(null)} />
      )}

      {/* ── Desktop header ────────────────────────────── */}
      <header className="hidden sm:block sticky top-0 z-40" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center font-bold"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>⚒</div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">ToolTrack</h1>
              <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>Tooling Movement System</p>
            </div>
          </div>
          <div className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
            {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} · WIB
          </div>
        </div>
        <nav className="max-w-5xl mx-auto px-6 flex gap-1">
          {TAB_META.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)} className="px-4 py-3 text-sm font-medium transition-colors cursor-pointer"
              style={{ color: activeTab === id ? "var(--primary)" : "var(--muted-foreground)", borderBottom: activeTab === id ? "2px solid var(--primary)" : "2px solid transparent" }}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Mobile top bar ────────────────────────────── */}
      <div className="sm:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>⚒</div>
          <span className="font-semibold text-sm">ToolTrack</span>
        </div>
        <div className="text-xs px-2.5 py-1 rounded" style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
          {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
        </div>
      </div>

      {/* ── Page content ─────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">

        {/* ── DASHBOARD ──────────────────────────────── */}
        {activeTab === "dashboard" && (
          <div className="space-y-5">
            {/* View toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Dasbor</h2>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>Status tooling secara real-time</p>
              </div>
              <div className="flex rounded-lg p-1" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}>
                {(["overview", "lines"] as const).map(v => (
                  <button key={v} onClick={() => setDashboardView(v)}
                    className="px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-all"
                    style={{
                      backgroundColor: dashboardView === v ? "var(--primary)" : "transparent",
                      color: dashboardView === v ? "var(--primary-foreground)" : "var(--muted-foreground)",
                    }}>
                    {v === "overview" ? "Overview" : "Per Line"}
                  </button>
                ))}
              </div>
            </div>

            {dashboardView === "overview" && <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { label: "Total", value: stats.total, color: "var(--foreground)" },
                  { label: "Tersedia", value: stats.available, color: "#22c55e" },
                  { label: "Dipinjam", value: stats.checkedOut, color: "#f97316" },
                  { label: "Maintenance", value: stats.maintenance, color: "#ef4444" },
                  { label: "Direservasi", value: stats.reserved, color: "#3b82f6" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4"
                    style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="text-3xl font-bold" style={{ color: s.color, fontFamily: "var(--font-mono)" }}>{s.value}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Utilisasi bar */}
              <div className="rounded-xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Utilisasi</span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>
                    {Math.round(((stats.checkedOut + stats.reserved) / stats.total) * 100)}% digunakan
                  </span>
                </div>
                <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: "var(--muted)" }}>
                  {[
                    { n: stats.available, c: "#22c55e" }, { n: stats.checkedOut, c: "#f97316" },
                    { n: stats.reserved, c: "#3b82f6" }, { n: stats.maintenance, c: "#ef4444" },
                  ].map((s, i) => (
                    <div key={i} className="h-full transition-all" style={{ width: `${(s.n / stats.total) * 100}%`, backgroundColor: s.c }} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  {[
                    { label: "Tersedia", color: "#22c55e" }, { label: "Dipinjam", color: "#f97316" },
                    { label: "Direservasi", color: "#3b82f6" }, { label: "Maintenance", color: "#ef4444" },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent activity */}
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <div className="px-5 py-3.5" style={{ backgroundColor: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                  <span className="text-sm font-semibold">Aktivitas Terbaru</span>
                </div>
                <div className="divide-y" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                  {movements.slice(0, 7).map(m => {
                    const cfg = ACTION_CONFIG[m.action];
                    return (
                      <div key={m.id} className="px-4 sm:px-5 py-3.5 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm"
                          style={{ backgroundColor: "var(--muted)", color: cfg.color }}>{cfg.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-medium truncate">{m.toolName}</span>
                            <span className="text-xs flex-shrink-0" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{m.timestamp.slice(11)}</span>
                          </div>
                          <div className="text-xs mt-0.5">
                            <span className="font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                            <span style={{ color: "var(--muted-foreground)" }}> · {m.fromLocation} → {m.toLocation} · {m.user}</span>
                          </div>
                          {m.notes && <div className="text-xs mt-0.5 italic" style={{ color: "var(--muted-foreground)" }}>"{m.notes}"</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>}

            {dashboardView === "lines" && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {Object.keys(lineGroups).length} lokasi · {tools.length} tool total
                </p>
                {Object.entries(lineGroups)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([line, lineTools]) => (
                    <LinePanel key={line} lineName={line} tools={lineTools} />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ── TOOLS ──────────────────────────────────── */}
        {activeTab === "tools" && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Inventori</h2>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  {filteredTools.length} / {tools.length} ditampilkan
                </p>
              </div>
              <button onClick={openAddTool}
                className="flex-shrink-0 flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-xl font-semibold cursor-pointer"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>
                <span className="text-lg leading-none">+</span>
                <span className="hidden sm:inline">Tambah</span>
              </button>
            </div>

            {/* Search + filter */}
            <div className="flex gap-2">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama, S/N, lokasi..." className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none"
                style={inputStyle} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ToolStatus | "all")}
                className="text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer appearance-none"
                style={{ ...inputStyle, minWidth: "120px" }}>
                <option value="all">Semua</option>
                <option value="available">Tersedia</option>
                <option value="checked-out">Dipinjam</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Direservasi</option>
              </select>
            </div>

            {/* Mobile: cards */}
            <div className="sm:hidden space-y-3">
              {filteredTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} onEdit={() => setEditingTool({ tool, isNew: false })} />
              ))}
              {filteredTools.length === 0 && (
                <div className="text-center py-12 text-sm" style={{ color: "var(--muted-foreground)" }}>Tidak ada tooling ditemukan</div>
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="grid text-xs font-semibold uppercase tracking-widest px-5 py-3"
                style={{ gridTemplateColumns: "72px 1fr 120px 160px 130px 80px 56px", backgroundColor: "var(--muted)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
                <span>ID</span><span>Nama / S/N</span><span>Status</span><span>Lokasi</span>
                <span>Peminjam</span><span>Kondisi</span><span></span>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
                {filteredTools.map(tool => (
                  <div key={tool.id} className="grid items-center px-5 py-3.5 text-sm"
                    style={{ gridTemplateColumns: "72px 1fr 120px 160px 130px 80px 56px" }}>
                    <span className="font-medium" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>{tool.id}</span>
                    <div>
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{tool.serialNumber} · {tool.category}</div>
                    </div>
                    <StatusBadge status={tool.status} />
                    <span className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{tool.location}</span>
                    <span className="text-sm truncate" style={{ color: tool.assignedTo ? "var(--foreground)" : "var(--muted-foreground)" }}>{tool.assignedTo ?? "—"}</span>
                    <span className="text-xs font-medium" style={{ color: tool.condition === "good" ? "#22c55e" : tool.condition === "fair" ? "#f59e0b" : "#ef4444" }}>
                      {tool.condition === "good" ? "Baik" : tool.condition === "fair" ? "Cukup" : "Buruk"}
                    </span>
                    <button onClick={() => setEditingTool({ tool, isNew: false })}
                      className="text-xs px-2.5 py-1.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>Edit</button>
                  </div>
                ))}
                {filteredTools.length === 0 && (
                  <div className="text-center py-12 text-sm" style={{ color: "var(--muted-foreground)" }}>Tidak ada tooling ditemukan</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MOVEMENTS ──────────────────────────────── */}
        {activeTab === "movements" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Log Pergerakan</h2>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{movements.length} transaksi tercatat</p>
            </div>

            {/* Mobile: cards */}
            <div className="sm:hidden space-y-3">
              {movements.map(m => <MovementCard key={m.id} m={m} />)}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="grid text-xs font-semibold uppercase tracking-widest px-5 py-3"
                style={{ gridTemplateColumns: "64px 1fr 110px 1fr 130px 100px", backgroundColor: "var(--muted)", color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
                <span>ID</span><span>Tooling</span><span>Aksi</span><span>Pergerakan</span><span>User</span><span>Waktu</span>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
                {movements.map(m => {
                  const cfg = ACTION_CONFIG[m.action];
                  return (
                    <div key={m.id} className="grid items-start px-5 py-3.5 text-sm"
                      style={{ gridTemplateColumns: "64px 1fr 110px 1fr 130px 100px" }}>
                      <span style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>{m.id}</span>
                      <div>
                        <div className="font-medium">{m.toolName}</div>
                        {m.notes && <div className="text-xs mt-0.5 italic" style={{ color: "var(--muted-foreground)" }}>{m.notes}</div>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: cfg.color }}>{cfg.icon}</span>
                        <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {m.fromLocation} → <span style={{ color: "var(--foreground)" }}>{m.toLocation}</span>
                      </div>
                      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{m.user}</span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{m.timestamp}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── CHECK IN/OUT ────────────────────────────── */}
        {activeTab === "checkout" && (
          <div className="space-y-5 max-w-xl">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Check In / Out</h2>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>Catat peminjaman dan pengembalian tooling</p>
            </div>

            <div className="flex rounded-xl p-1" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}>
              {(["checkout", "return"] as const).map(mode => (
                <button key={mode} onClick={() => setCheckoutMode(mode)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
                  style={{
                    backgroundColor: checkoutMode === mode ? "var(--primary)" : "transparent",
                    color: checkoutMode === mode ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  }}>
                  {mode === "checkout" ? "Pinjam (Checkout)" : "Kembalikan (Check In)"}
                </button>
              ))}
            </div>

            {checkoutMode === "checkout" ? (
              <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="font-semibold">Form Peminjaman</h3>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider block mb-2" style={labelStyle}>Pilih Tooling</label>
                  <select value={checkoutForm.toolId} onChange={e => setCheckoutForm(f => ({ ...f, toolId: e.target.value }))}
                    className="w-full text-sm px-4 py-3 rounded-xl outline-none cursor-pointer appearance-none" style={inputStyle}>
                    <option value="">— Pilih tooling tersedia —</option>
                    {tools.filter(t => t.status === "available").map(t => (
                      <option key={t.id} value={t.id}>[{t.id}] {t.name} · {t.location}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider block mb-2" style={labelStyle}>Nama Peminjam</label>
                  <input value={checkoutForm.user} onChange={e => setCheckoutForm(f => ({ ...f, user: e.target.value }))}
                    placeholder="Masukkan nama peminjam" className="w-full text-sm px-4 py-3 rounded-xl outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider block mb-2" style={labelStyle}>Lokasi Tujuan</label>
                  <input value={checkoutForm.toLocation} onChange={e => setCheckoutForm(f => ({ ...f, toLocation: e.target.value }))}
                    placeholder="Contoh: Assembly Line 3, Bay C" className="w-full text-sm px-4 py-3 rounded-xl outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider block mb-2" style={labelStyle}>Catatan (opsional)</label>
                  <textarea value={checkoutForm.notes} onChange={e => setCheckoutForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Keperluan / instruksi khusus..." rows={3}
                    className="w-full text-sm px-4 py-3 rounded-xl outline-none resize-none" style={inputStyle} />
                </div>
                <button onClick={handleCheckout}
                  disabled={!checkoutForm.toolId || !checkoutForm.user || !checkoutForm.toLocation}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>
                  Konfirmasi Checkout
                </button>
              </div>
            ) : (
              <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="font-semibold">Form Pengembalian</h3>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider block mb-2" style={labelStyle}>Pilih Tooling yang Dikembalikan</label>
                  <select value={returnToolId} onChange={e => setReturnToolId(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl outline-none cursor-pointer appearance-none" style={inputStyle}>
                    <option value="">— Pilih tooling dipinjam —</option>
                    {tools.filter(t => t.status === "checked-out").map(t => (
                      <option key={t.id} value={t.id}>[{t.id}] {t.name} · {t.assignedTo}</option>
                    ))}
                  </select>
                </div>
                {returnToolId && (() => {
                  const tool = tools.find(t => t.id === returnToolId);
                  if (!tool) return null;
                  return (
                    <div className="rounded-xl p-4 space-y-2.5 text-sm" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}>
                      {[
                        ["Tooling", tool.name],
                        ["Serial Number", tool.serialNumber],
                        ["Peminjam", tool.assignedTo ?? "—"],
                        ["Waktu Checkout", tool.checkoutTime ?? "—"],
                        ["Lokasi Saat Ini", tool.location],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4">
                          <span style={{ color: "var(--muted-foreground)" }}>{k}</span>
                          <span className="font-medium text-right" style={{ fontFamily: k === "Serial Number" || k === "Waktu Checkout" ? "var(--font-mono)" : "inherit", fontSize: k === "Serial Number" || k === "Waktu Checkout" ? "12px" : "inherit" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <button onClick={handleReturn} disabled={!returnToolId}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#22c55e", color: "#0d0f12" }}>
                  Konfirmasi Pengembalian
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Mobile bottom tab bar ─────────────────────── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ backgroundColor: "var(--card)", borderTop: "1px solid var(--border)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TAB_META.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 cursor-pointer transition-colors"
            style={{ color: activeTab === id ? "var(--primary)" : "var(--muted-foreground)" }}>
            <span className="text-xl leading-none">{icon}</span>
            <span className="text-[10px] font-medium leading-tight">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
