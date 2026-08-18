/**
 * WMS-9 Decision Operations Terminal: graphite rail-and-workbench layout, decision amber for actions,
 * operational status colors only for signals, and a persistent decision ledger as system memory.
 */
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Boxes,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Command,
  Factory,
  FileDown,
  Gauge,
  Headphones,
  Inbox,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  PackageCheck,
  PanelLeftClose,
  Plus,
  Radio,
  Send,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Truck,
  UserRound,
  UsersRound,
  Warehouse,
  X,
} from "lucide-react";
import { Link } from "wouter";

type View = "dashboard" | "orders" | "inventory" | "fulfillment" | "material" | "shipping" | "tracking" | "chat" | "analytics";
type Stage = "created" | "allocated" | "picking" | "packing" | "qc" | "qc-hold" | "dispatched" | "in-transit" | "delivered";
type Tone = "neutral" | "amber" | "green" | "red" | "blue";

type Order = {
  id: string;
  customer: string;
  destination: string;
  region: string;
  sku: string;
  quantity: number;
  priority: "VIP" | "High" | "Standard";
  score: number;
  sla: string;
  stage: Stage;
};

type LedgerEntry = { id: number; time: string; tone: Tone; source: string; title: string; detail: string };
type MaterialIssue = { id: string; sku: string; supplier: string; type: string; qty: number; batch: string; status: "open" | "quarantined" | "return" | "scrapped" | "released" };
type Shipment = { id: string; orderIds: string[]; carrier: string; service: "economy" | "standard" | "express"; trackingNumber: string; cost: number; status: "dispatched" | "in-transit" | "out-for-delivery" | "delivered" | "delayed" | "lost"; destination: string };
type ChatMessage = { id: number; author: string; role: string; text: string; time: string; template?: string };

const stages: { id: Stage; label: string }[] = [
  { id: "created", label: "Created" },
  { id: "allocated", label: "Allocated" },
  { id: "picking", label: "Picking" },
  { id: "packing", label: "Packing" },
  { id: "qc", label: "QC" },
  { id: "dispatched", label: "Dispatched" },
];

const initialOrders: Order[] = [
  { id: "ORD-4507", customer: "Arden & Co.", destination: "Mumbai, MH", region: "West", sku: "SKU-A23", quantity: 12, priority: "VIP", score: 94, sla: "01h 28m", stage: "qc" },
  { id: "ORD-4512", customer: "Northstar Living", destination: "Pune, MH", region: "West", sku: "SKU-B11", quantity: 8, priority: "High", score: 78, sla: "03h 12m", stage: "picking" },
  { id: "ORD-4515", customer: "Cedar Supply", destination: "Mumbai, MH", region: "West", sku: "SKU-C91", quantity: 18, priority: "Standard", score: 49, sla: "06h 45m", stage: "packing" },
  { id: "ORD-4519", customer: "Moss Studio", destination: "Bengaluru, KA", region: "South", sku: "SKU-A23", quantity: 6, priority: "High", score: 71, sla: "04h 02m", stage: "allocated" },
  { id: "ORD-4522", customer: "Forma Home", destination: "Mumbai, MH", region: "West", sku: "SKU-D08", quantity: 3, priority: "Standard", score: 36, sla: "10h 18m", stage: "created" },
];

const initialLedger: LedgerEntry[] = [
  { id: 1, time: "14:22", tone: "amber", source: "SHIP", title: "Carrier decision waiting", detail: "ORD-4507 has 1h 28m SLA remaining. Express assignment will preserve the VIP delivery promise." },
  { id: 2, time: "14:18", tone: "red", source: "MATERIAL", title: "Batch B-204 reported damaged", detail: "18 units of SKU-A23 moved out of allocatable stock. Reorder threshold is now breached." },
  { id: 3, time: "14:11", tone: "blue", source: "PICK", title: "Batch pick prepared for Aisle 04", detail: "ORD-4512 and ORD-4519 share bins A4-18 and A4-19. One picker can complete both routes." },
  { id: 4, time: "13:58", tone: "green", source: "QC", title: "QC released ORD-4498", detail: "Visual inspection passed. Shipment can now enter carrier selection." },
];

const initialIssues: MaterialIssue[] = [
  { id: "MI-028", sku: "SKU-A23", supplier: "Vector Materials", type: "damaged in storage", qty: 18, batch: "B-204", status: "open" },
  { id: "MI-027", sku: "SKU-F17", supplier: "Northline Paper", type: "incoming defect", qty: 6, batch: "B-199", status: "quarantined" },
  { id: "MI-026", sku: "SKU-B11", supplier: "Vector Materials", type: "mislabeled", qty: 4, batch: "B-188", status: "released" },
];

const initialShipments: Shipment[] = [
  { id: "SHP-9012", orderIds: ["ORD-4498"], carrier: "Aster Express", service: "express", trackingNumber: "AX-048-99120", cost: 420, status: "in-transit", destination: "Chennai, TN" },
  { id: "SHP-9008", orderIds: ["ORD-4489", "ORD-4491"], carrier: "Orbit Freight", service: "standard", trackingNumber: "OF-448-00318", cost: 260, status: "out-for-delivery", destination: "Pune, MH" },
];

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "fulfillment", label: "Fulfillment", icon: PackageCheck },
  { id: "material", label: "Material issues", icon: ShieldAlert },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "tracking", label: "Tracking", icon: MapPin },
  { id: "chat", label: "Team chat", icon: MessageSquareText },
  { id: "analytics", label: "Analytics", icon: Gauge },
];

const toneLabel: Record<Tone, string> = { neutral: "Neutral", amber: "Decision", green: "Resolved", red: "Critical", blue: "In progress" };
const stageLabel = (stage: Stage) => stage.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const statusTone = (status: Stage | Shipment["status"] | MaterialIssue["status"]): Tone => {
  if (["delivered", "released", "return", "scrapped"].includes(status)) return "green";
  if (["qc-hold", "lost", "open"].includes(status)) return "red";
  if (["picking", "packing", "qc", "in-transit", "out-for-delivery", "quarantined"].includes(status)) return "blue";
  if (["created", "allocated", "delayed"].includes(status)) return "amber";
  return "neutral";
};

function Tag({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}

function DecisionLedger({ entries, compact = false }: { entries: LedgerEntry[]; compact?: boolean }) {
  const show = compact ? entries.slice(0, 4) : entries;
  return (
    <section className={`ledger ${compact ? "ledger--compact" : ""}`}>
      <div className="panel-head">
        <div>
          <p className="eyebrow"><Command size={13} /> System memory</p>
          <h2>Decision Ledger</h2>
        </div>
        <span className="live-pulse"><i /> LIVE</span>
      </div>
      <div className="ledger-list">
        {show.map((entry) => (
          <article className="ledger-entry" key={entry.id}>
            <span className={`ledger-dot ledger-dot--${entry.tone}`} aria-hidden="true" />
            <div className="ledger-entry__body">
              <div className="ledger-entry__top"><span className="mono ledger-source">{entry.source}</span><time className="mono">{entry.time}</time></div>
              <strong>{entry.title}</strong>
              <p>{entry.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value, change, tone = "neutral", icon: Icon }: { label: string; value: string; change: string; tone?: Tone; icon: typeof Box }) {
  return <article className={`metric metric--${tone}`}>
    <div><span className="metric-label">{label}</span><strong>{value}</strong><span className="metric-change">{change}</span></div>
    <span className="metric-icon"><Icon size={19} /></span>
  </article>;
}

export default function Home({ customerMode = false }: { customerMode?: boolean }) {
  const [view, setView] = useState<View>("dashboard");
  const [railOpen, setRailOpen] = useState(true);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [issues, setIssues] = useState<MaterialIssue[]>(initialIssues);
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments);
  const [ledger, setLedger] = useState<LedgerEntry[]>(initialLedger);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, author: "Neha Rao", role: "Picking", text: "I’m at Aisle 04. Starting the batch pick for ORD-4512 + ORD-4519.", time: "14:11" },
    { id: 2, author: "System", role: "Decision", text: "Batch route created from matching bins A4-18 and A4-19.", time: "14:11", template: "Batch pick" },
    { id: 3, author: "Samir Khan", role: "QC", text: "ORD-4507 is on the QC bench. Packaging scan is clean.", time: "14:19" },
  ]);

  const addLedger = (tone: Tone, source: string, title: string, detail: string) => {
    setLedger((existing) => [{ id: Date.now(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }), tone, source, title, detail }, ...existing]);
  };

  const advanceOrder = (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order || order.stage === "qc-hold") return;
    const currentIndex = stages.findIndex((stage) => stage.id === order.stage);
    const next = stages[Math.min(currentIndex + 1, stages.length - 1)].id;
    if (order.stage === "qc" && next === "dispatched") {
      addLedger("amber", "SHIP", `${order.id} needs carrier selection`, `QC passed for ${order.id}. Carrier choice is now required to protect its ${order.sla} SLA.`);
      setView("shipping");
      return;
    }
    setOrders((existing) => existing.map((item) => item.id === orderId ? { ...item, stage: next } : item));
    addLedger("blue", "FLOW", `${order.id} moved to ${stageLabel(next)}`, `Warehouse action advanced the order from ${stageLabel(order.stage)} to ${stageLabel(next)}.`);
  };

  const quarantineIssue = (issueId: string) => {
    const issue = issues.find((item) => item.id === issueId);
    if (!issue || issue.status !== "open") return;
    setIssues((existing) => existing.map((item) => item.id === issueId ? { ...item, status: "quarantined" } : item));
    addLedger("red", "MATERIAL", `${issue.qty} units quarantined`, `${issue.sku} batch ${issue.batch} is now in the virtual Quarantine bin and excluded from new allocations.`);
    setTimeout(() => addLedger("amber", "REORDER", `Reorder recommended for ${issue.sku}`, `Quarantine reduces available stock below safety level. Create a replenishment request with ${issue.supplier}.`), 120);
  };

  const resolveIssue = (issueId: string, disposition: "return" | "scrapped" | "released") => {
    const issue = issues.find((item) => item.id === issueId);
    if (!issue) return;
    setIssues((existing) => existing.map((item) => item.id === issueId ? { ...item, status: disposition } : item));
    addLedger(disposition === "released" ? "green" : "amber", "MATERIAL", `${issue.id} marked ${disposition}`, `${issue.qty} units of ${issue.sku} received a final disposition. Allocation rules were updated automatically.`);
  };

  const assignCarrier = (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;
    const shipment: Shipment = { id: `SHP-${9020 + shipments.length}`, orderIds: [order.id], carrier: "Aster Express", service: "express", trackingNumber: `AX-048-${99200 + shipments.length}`, cost: 420, status: "dispatched", destination: order.destination };
    setShipments((existing) => [shipment, ...existing]);
    setOrders((existing) => existing.map((item) => item.id === orderId ? { ...item, stage: "dispatched" } : item));
    addLedger("amber", "SHIP", `${order.id} assigned to Aster Express`, `${order.sla} SLA remaining and ${order.priority} priority justify Express over Standard despite +₹120 cost.`);
  };

  const consolidate = () => addLedger("green", "SHIP", "West region manifest suggested", "ORD-4515 and ORD-4522 share Mumbai destination and have more than 6h SLA slack. Combine into one Standard manifest to save ₹86.");

  const advanceShipment = (shipmentId: string) => {
    const shipment = shipments.find((item) => item.id === shipmentId);
    if (!shipment) return;
    const transitions: Record<Shipment["status"], Shipment["status"]> = { dispatched: "in-transit", "in-transit": "out-for-delivery", "out-for-delivery": "delivered", delivered: "delivered", delayed: "in-transit", lost: "lost" };
    const next = transitions[shipment.status];
    setShipments((existing) => existing.map((item) => item.id === shipmentId ? { ...item, status: next } : item));
    addLedger(next === "delivered" ? "green" : "blue", "TRACK", `${shipment.trackingNumber} moved to ${next.replaceAll("-", " ")}`, `${shipment.carrier} recorded a new checkpoint for ${shipment.destination}.`);
  };

  const reportDelay = (shipmentId: string) => {
    const shipment = shipments.find((item) => item.id === shipmentId);
    if (!shipment) return;
    setShipments((existing) => existing.map((item) => item.id === shipmentId ? { ...item, status: "delayed" } : item));
    addLedger("red", "TRACK", `${shipment.trackingNumber} is delayed`, `The shipment has passed its target checkpoint. Customer-facing alert draft is ready for review.`);
  };

  const postQuickAction = (template: "Need backup at bin" | "Item not found" | "QC hold" | "Ready for pickup") => {
    const textByTemplate = { "Need backup at bin": "Need backup at bin A4-18 for the shared batch pick.", "Item not found": "Item not found in the expected bin. Please verify the last scan.", "QC hold": "QC hold: packaging integrity needs supervisor review.", "Ready for pickup": "Ready for pickup at Dock 03." };
    const message: ChatMessage = { id: Date.now(), author: "You", role: "Shift lead", text: textByTemplate[template], time: "now", template };
    setChatMessages((existing) => [...existing, message]);
    if (template === "QC hold") {
      setOrders((existing) => existing.map((item) => item.id === "ORD-4507" ? { ...item, stage: "qc-hold" } : item));
      addLedger("red", "CHAT", "QC hold raised for ORD-4507", "Shift lead paused the order at quality control. Shipping is blocked until a supervisor releases the hold.");
    } else {
      addLedger(template === "Ready for pickup" ? "green" : "amber", "CHAT", `Quick action: ${template}`, `Shift lead posted a structured action in #shift-floor so the handoff is visible in the operating record.`);
    }
  };

  const activeOrders = useMemo(() => orders.filter((order) => !["dispatched", "in-transit", "delivered"].includes(order.stage)), [orders]);
  const pageTitle: Record<View, [string, string]> = {
    dashboard: ["Shift overview", "A decision-first read on today’s warehouse flow."],
    orders: ["Order queue", "Priority-ranked work with SLA context and allocation evidence."],
    inventory: ["Inventory health", "Available stock, safety thresholds, and material exposure."],
    fulfillment: ["Fulfillment board", "Advance work through each physical stage without losing decision context."],
    material: ["Material issues", "Protect allocation quality by quarantining, resolving, and learning from stock issues."],
    shipping: ["Shipping decisions", "Turn QC-cleared work into accountable carrier assignments and lower-cost manifests."],
    tracking: ["Shipment tracking", "Advance live checkpoints and resolve in-transit exceptions before delivery fails."],
    chat: ["Team coordination", "Keep floor conversation connected to every operational decision."],
    analytics: ["Operations intelligence", "Current throughput, inventory health, and supplier quality signals."],
  };

  if (customerMode) return <CustomerTracking shipments={shipments} />;

  return (
    <div className={`ops-app ${railOpen ? "ops-app--rail-open" : "ops-app--rail-closed"}`}>
      <aside className="sidebar">
        <div className="brand-lockup">
          <img src="/manus-storage/wms9-logo_604e9648.png" alt="WMS-9" className="brand-mark" />
          <div><strong>WMS-9</strong><span>OPERATIONS</span></div>
          <button className="rail-toggle" onClick={() => setRailOpen((value) => !value)} aria-label="Toggle sidebar"><PanelLeftClose size={16} /></button>
        </div>
        <div className="shift-card">
          <span className="live-pulse"><i /> SHIFT LIVE</span>
          <strong>Afternoon shift</strong>
          <p><UsersRound size={14} /> 14 active operators</p>
        </div>
        <nav className="nav-stack" aria-label="Warehouse navigation">
          <span className="nav-label">Workspaces</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-item ${view === item.id ? "nav-item--active" : ""}`} onClick={() => setView(item.id)}><Icon size={18} /><span>{item.label}</span>{item.id === "material" && <b>2</b>}</button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/track" className="customer-link"><Headphones size={16} /><span>Customer tracking</span><ArrowRight size={15} /></Link>
          <div className="profile"><span className="avatar">AR</span><div><strong>Alex Rivera</strong><span>Shift supervisor</span></div><MoreHorizontal size={18} /></div>
        </div>
      </aside>

      <main className="main-workbench">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setRailOpen((value) => !value)}><Menu size={20} /></button>
          <div><p className="eyebrow">TUESDAY / 18 AUG / 14:26 IST</p><h1>{pageTitle[view][0]}</h1><p className="page-subtitle">{pageTitle[view][1]}</p></div>
          <div className="topbar-actions"><button className="icon-button"><Inbox size={18} /><span className="notify-dot" /></button><button className="command-button"><Sparkles size={16} /> Ask WMS-9 <span>⌘ K</span></button></div>
        </header>

        {view === "dashboard" && <Dashboard orders={orders} ledger={ledger} issues={issues} onView={setView} onSelectOrder={setSelectedOrder} />}
        {view === "orders" && <OrdersView orders={orders} onSelect={setSelectedOrder} />}
        {view === "inventory" && <InventoryView issues={issues} onView={setView} />}
        {view === "fulfillment" && <FulfillmentView orders={activeOrders} onAdvance={advanceOrder} />}
        {view === "material" && <MaterialView issues={issues} onQuarantine={quarantineIssue} onResolve={resolveIssue} />}
        {view === "shipping" && <ShippingView orders={orders} shipments={shipments} onAssign={assignCarrier} onConsolidate={consolidate} />}
        {view === "tracking" && <TrackingView shipments={shipments} onAdvance={advanceShipment} onDelay={reportDelay} />}
        {view === "chat" && <ChatView messages={chatMessages} onQuickAction={postQuickAction} />}
        {view === "analytics" && <AnalyticsView issues={issues} ledger={ledger} />}
      </main>

      {selectedOrder && <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} onAdvance={() => { advanceOrder(selectedOrder.id); setSelectedOrder(null); }} />}
    </div>
  );
}

function Dashboard({ orders, ledger, issues, onView, onSelectOrder }: { orders: Order[]; ledger: LedgerEntry[]; issues: MaterialIssue[]; onView: (view: View) => void; onSelectOrder: (order: Order) => void }) {
  const activeIssues = issues.filter((issue) => ["open", "quarantined"].includes(issue.status));
  return <div className="dashboard-view enter-view">
    <section className="hero-strip">
      <img src="/manus-storage/wms9-warehouse-hero_f2c73447.jpg" alt="Abstract warehouse operational view" />
      <div className="hero-strip__overlay" />
      <div className="hero-strip__content"><p className="eyebrow"><Radio size={13} /> Operating signal</p><h2>Resolve 3 decisions<br />before 16:00.</h2><p>One VIP shipment, one quarantined batch, and one at-risk pickup require a named next action.</p><button onClick={() => onView("shipping")} className="button button--amber">Review decisions <ArrowRight size={16} /></button></div>
      <div className="hero-strip__stats"><span><strong>91.4%</strong> on-time exit</span><span><strong>4.8h</strong> avg. order cycle</span></div>
    </section>
    <section className="metrics-row">
      <Metric label="Open orders" value="42" change="+6 since 12:00" icon={ShoppingCart} />
      <Metric label="At-risk SLA" value="03" change="needs a decision" tone="amber" icon={Clock3} />
      <Metric label="Quarantined" value={`${activeIssues.length} batches`} change="22 units protected" tone="red" icon={ShieldAlert} />
      <Metric label="Dispatch ready" value="07" change="2 can consolidate" tone="green" icon={Truck} />
    </section>
    <section className="stage-panel">
      <div className="panel-head"><div><p className="eyebrow"><Factory size={13} /> Flow control</p><h2>Orders by stage</h2></div><button className="text-button" onClick={() => onView("fulfillment")}>Open board <ChevronRight size={16} /></button></div>
      <div className="stage-rail">{stages.map((stage, index) => { const count = orders.filter((order) => order.stage === stage.id).length; return <div className="stage-rail__item" key={stage.id}><span className={`stage-rail__dot ${count ? "stage-rail__dot--active" : ""}`} /><div><span>{stage.label}</span><strong>{count.toString().padStart(2, "0")}</strong></div>{index < stages.length - 1 && <i />}</div>; })}</div>
    </section>
    <div className="dashboard-grid">
      <section className="priority-panel"><div className="panel-head"><div><p className="eyebrow"><CircleAlert size={13} /> Queue intelligence</p><h2>Priority queue</h2></div><button className="text-button" onClick={() => onView("orders")}>All orders <ChevronRight size={16} /></button></div><div className="order-list">{orders.slice(0, 4).map((order) => <button className="order-row" onClick={() => onSelectOrder(order)} key={order.id}><span className="order-score" style={{ "--score": `${order.score}%` } as React.CSSProperties}><i />{order.score}</span><span className="order-main"><strong className="mono">{order.id}</strong><span>{order.customer} · {order.destination}</span></span><span className="order-sla"><Tag tone={order.sla.startsWith("01") ? "amber" : "neutral"}>{order.priority}</Tag><strong>{order.sla}</strong></span><ChevronRight size={17} /></button>)}</div></section>
      <DecisionLedger entries={ledger} compact />
    </div>
  </div>;
}

function OrdersView({ orders, onSelect }: { orders: Order[]; onSelect: (order: Order) => void }) {
  return <section className="data-panel enter-view"><div className="panel-head"><div><p className="eyebrow"><ShoppingCart size={13} /> Allocation queue</p><h2>Priority-ranked orders</h2></div><button className="button button--muted"><Plus size={16} /> Create order</button></div><div className="table-shell"><table><thead><tr><th>Order</th><th>Priority signal</th><th>Fulfillment state</th><th>Allocation</th><th>SLA remaining</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong className="mono">{order.id}</strong><span>{order.customer}</span></td><td><div className="score-line"><i style={{ width: `${order.score}%` }} /><strong>{order.score}</strong></div></td><td><Tag tone={statusTone(order.stage)}>{stageLabel(order.stage)}</Tag></td><td><span className="mono">{order.sku} · {order.quantity} u</span></td><td className={order.sla.startsWith("01") ? "critical-text" : ""}>{order.sla}</td><td><button className="row-action" onClick={() => onSelect(order)}>Inspect <ChevronRight size={14} /></button></td></tr>)}</tbody></table></div></section>;
}

function InventoryView({ issues, onView }: { issues: MaterialIssue[]; onView: (view: View) => void }) {
  const quarantineCount = issues.filter((issue) => issue.status === "quarantined").reduce((total, issue) => total + issue.qty, 0);
  const inventory = [{ sku: "SKU-A23", name: "Ribbed vessel / charcoal", available: 26, reorder: 40, bin: "A4-18", status: "critical" }, { sku: "SKU-B11", name: "Paper wrap / large", available: 188, reorder: 72, bin: "C2-04", status: "healthy" }, { sku: "SKU-C91", name: "Desk tray / ivory", available: 48, reorder: 45, bin: "B1-09", status: "caution" }, { sku: "SKU-D08", name: "Care insert / standard", available: 650, reorder: 180, bin: "C8-11", status: "healthy" }];
  return <div className="enter-view"><section className="inventory-callout"><div><p className="eyebrow"><Box size={13} /> Allocation safeguard</p><h2>{quarantineCount} units are invisible<br />to allocation.</h2><p>Quarantine is a virtual bin: held batches cannot be assigned to a new order until a disposition is logged.</p></div><button className="button button--amber" onClick={() => onView("material")}>Review material issues <ArrowRight size={16} /></button></section><section className="data-panel"><div className="panel-head"><div><p className="eyebrow"><Warehouse size={13} /> Stock ledger</p><h2>Available inventory</h2></div><span className="helper-text">Reorder point = daily usage × lead time + safety stock</span></div><div className="table-shell"><table><thead><tr><th>SKU / item</th><th>Allocatable</th><th>Reorder point</th><th>Storage bin</th><th>Health</th><th /></tr></thead><tbody>{inventory.map((item) => <tr key={item.sku}><td><strong className="mono">{item.sku}</strong><span>{item.name}</span></td><td><strong>{item.available} u</strong></td><td>{item.reorder} u</td><td className="mono">{item.bin}</td><td><Tag tone={item.status === "critical" ? "red" : item.status === "caution" ? "amber" : "green"}>{item.status}</Tag></td><td><button className="row-action" onClick={() => onView("material")}>Report issue <ChevronRight size={14} /></button></td></tr>)}</tbody></table></div></section></div>;
}

function FulfillmentView({ orders, onAdvance }: { orders: Order[]; onAdvance: (orderId: string) => void }) {
  return <section className="board-wrap enter-view"><div className="board-note"><Sparkles size={16} /><p><strong>Batch-pick suggestion:</strong> Assign one picker to ORD-4512 and ORD-4519 — both route through Aisle 04.</p><button className="button button--muted">Apply batch route</button></div><div className="kanban">{stages.slice(0, 5).map((stage) => { const items = orders.filter((order) => order.stage === stage.id || (stage.id === "qc" && order.stage === "qc-hold")); return <section className="kanban-column" key={stage.id}><header><span>{stage.label}</span><b>{items.length}</b></header><div>{items.map((order) => <article className="work-card" key={order.id}><div><span className="mono">{order.id}</span><Tag tone={order.priority === "VIP" ? "amber" : "blue"}>{order.priority}</Tag></div><strong>{order.customer}</strong><p>{order.sku} · {order.quantity} units</p><footer><span className={order.sla.startsWith("01") ? "critical-text" : ""}><Clock3 size={13} /> {order.sla}</span>{order.stage === "qc-hold" ? <Tag tone="red">blocked</Tag> : <button onClick={() => onAdvance(order.id)}>Advance <ArrowRight size={14} /></button>}</footer></article>)}</div></section>; })}</div></section>;
}

function MaterialView({ issues, onQuarantine, onResolve }: { issues: MaterialIssue[]; onQuarantine: (id: string) => void; onResolve: (id: string, status: "return" | "scrapped" | "released") => void }) {
  return <div className="material-view enter-view"><section className="material-hero"><div><p className="eyebrow"><ShieldAlert size={13} /> Quarantine workflow</p><h2>Protect the next allocation.</h2><p>Every material issue changes inventory eligibility immediately, then ends with an auditable supplier or disposal decision.</p><div className="material-hero__facts"><span><strong>18</strong> active units held</span><span><strong>1.7%</strong> supplier defect rate</span></div></div><img src="/manus-storage/wms9-quarantine-vignette_929c9616.jpg" alt="Abstract quarantined warehouse tote" /></section><div className="material-layout"><section className="issue-list"><div className="panel-head"><div><p className="eyebrow"><CircleAlert size={13} /> Issue register</p><h2>Material dispositions</h2></div><span className="helper-text">No unresolved issue is a dead end.</span></div>{issues.map((issue) => <article className="issue-card" key={issue.id}><div className="issue-card__top"><div><span className="mono">{issue.id}</span><h3>{issue.type}</h3></div><Tag tone={statusTone(issue.status)}>{issue.status}</Tag></div><p><span className="mono">{issue.sku}</span> · Batch <span className="mono">{issue.batch}</span> · {issue.qty} units · {issue.supplier}</p><footer>{issue.status === "open" && <button className="button button--danger" onClick={() => onQuarantine(issue.id)}>Quarantine batch <ShieldAlert size={15} /></button>}{issue.status === "quarantined" && <div className="resolution-actions"><button onClick={() => onResolve(issue.id, "return")}>Return to supplier</button><button onClick={() => onResolve(issue.id, "scrapped")}>Scrap</button><button onClick={() => onResolve(issue.id, "released")}>Release</button></div>}{["return", "scrapped", "released"].includes(issue.status) && <span className="resolution-complete"><ClipboardCheck size={15} /> Disposition logged</span>}</footer></article>)}</section><section className="supplier-card"><p className="eyebrow"><UserRound size={13} /> Supplier scorecard</p><h2>Vector Materials</h2><div className="supplier-metric"><span>Defect rate</span><strong className="critical-text">2.6%</strong><i><b style={{ width: "64%" }} /></i><small>Above 1.5% watch level</small></div><div className="supplier-metric"><span>Avg. resolution</span><strong>14.2h</strong><i><b style={{ width: "42%" }} /></i><small>Target: under 18h</small></div><button className="button button--muted">Draft supplier report <FileDown size={15} /></button></section></div></div>;
}

function ShippingView({ orders, shipments, onAssign, onConsolidate }: { orders: Order[]; shipments: Shipment[]; onAssign: (id: string) => void; onConsolidate: () => void }) {
  const VIPOrder = orders.find((order) => order.id === "ORD-4507");
  const alreadyAssigned = shipments.some((shipment) => shipment.orderIds.includes("ORD-4507"));
  return <div className="shipping-view enter-view"><section className="shipping-decision"><div className="shipping-copy"><p className="eyebrow"><Sparkles size={13} /> Carrier recommendation</p><h2>Choose speed because the SLA says so.</h2><p><span className="mono">ORD-4507</span> is VIP with 1h 28m remaining. Express keeps the delivery promise; Standard introduces a 37-minute projected breach.</p><div className="carrier-options"><article className="carrier-option"><span>Economy</span><strong>₹180</strong><small>tomorrow · 38% breach risk</small></article><article className="carrier-option"><span>Standard</span><strong>₹300</strong><small>today 18:30 · 37m late</small></article><article className="carrier-option carrier-option--recommended"><span>Express <Tag tone="amber">recommended</Tag></span><strong>₹420</strong><small>today 16:10 · 22m buffer</small></article></div><button disabled={alreadyAssigned} className="button button--amber" onClick={() => onAssign("ORD-4507")}>{alreadyAssigned ? "Express assigned" : "Assign Aster Express"} <ArrowRight size={16} /></button></div><img src="/manus-storage/wms9-shipment-vignette_5c412e13.jpg" alt="Abstract parcel at warehouse dock" /></section><section className="consolidate-bar"><div><p className="eyebrow"><Truck size={13} /> Cost decision</p><h3>Mumbai orders can share one manifest.</h3><p>ORD-4515 + ORD-4522 have no critical SLA and share the West region route.</p></div><button className="button button--muted" onClick={onConsolidate}>Suggest consolidation <ArrowRight size={15} /></button></section><section className="data-panel"><div className="panel-head"><div><p className="eyebrow"><PackageCheck size={13} /> Outbound register</p><h2>Recent shipments</h2></div></div><div className="table-shell"><table><thead><tr><th>Shipment / orders</th><th>Carrier service</th><th>Destination</th><th>Cost</th><th>Status</th><th /></tr></thead><tbody>{shipments.map((shipment) => <tr key={shipment.id}><td><strong className="mono">{shipment.trackingNumber}</strong><span>{shipment.orderIds.join(" · ")}</span></td><td><strong>{shipment.carrier}</strong><span>{shipment.service}</span></td><td>{shipment.destination}</td><td>₹{shipment.cost}</td><td><Tag tone={statusTone(shipment.status)}>{shipment.status.replaceAll("-", " ")}</Tag></td><td><button className="row-action">Label <FileDown size={14} /></button></td></tr>)}</tbody></table></div></section></div>;
}

function TrackingView({ shipments, onAdvance, onDelay }: { shipments: Shipment[]; onAdvance: (id: string) => void; onDelay: (id: string) => void }) {
  return <div className="tracking-view enter-view"><section className="tracking-top"><div><p className="eyebrow"><MapPin size={13} /> Post-dispatch control</p><h2>Move shipments forward.<br />Intercept failures early.</h2><p>Simulate a carrier checkpoint or introduce a delay to see the same decision pattern extend beyond dispatch.</p></div><div className="tracking-stat"><span>Live shipments</span><strong>{shipments.length + 5}</strong><small><i /> 2 new checkpoints this hour</small></div></section><div className="shipment-stack">{shipments.map((shipment) => <article className="tracking-card" key={shipment.id}><div className="tracking-card__identity"><span className="tracking-carrier">{shipment.carrier.split(" ").map((part) => part[0]).join("")}</span><div><span className="mono">{shipment.trackingNumber}</span><h3>{shipment.destination}</h3><p>{shipment.orderIds.join(" · ")} · {shipment.carrier}</p></div></div><div className="tracking-timeline"><span className={shipment.status === "dispatched" ? "active" : "done"}><i /> Dispatched</span><span className={["in-transit", "delayed"].includes(shipment.status) ? "active" : ["out-for-delivery", "delivered"].includes(shipment.status) ? "done" : ""}><i /> In transit</span><span className={shipment.status === "out-for-delivery" ? "active" : shipment.status === "delivered" ? "done" : ""}><i /> Out for delivery</span><span className={shipment.status === "delivered" ? "resolved" : ""}><i /> Delivered</span></div><div className="tracking-card__actions"><Tag tone={statusTone(shipment.status)}>{shipment.status.replaceAll("-", " ")}</Tag><button className="button button--muted" onClick={() => onDelay(shipment.id)} disabled={shipment.status === "delivered"}>Simulate delay</button><button className="button button--amber" onClick={() => onAdvance(shipment.id)} disabled={shipment.status === "delivered"}>Advance checkpoint <ArrowRight size={15} /></button></div></article>)}</div></div>;
}

function ChatView({ messages, onQuickAction }: { messages: ChatMessage[]; onQuickAction: (action: "Need backup at bin" | "Item not found" | "QC hold" | "Ready for pickup") => void }) {
  const [text, setText] = useState("");
  const [localMessages, setLocalMessages] = useState(messages);
  const sendMessage = () => { if (!text.trim()) return; setLocalMessages((existing) => [...existing, { id: Date.now(), author: "You", role: "Shift lead", text, time: "now" }]); setText(""); };
  const selectAction = (action: "Need backup at bin" | "Item not found" | "QC hold" | "Ready for pickup") => { onQuickAction(action); setLocalMessages((existing) => [...existing, { id: Date.now(), author: "You", role: "Shift lead", text: action, time: "now", template: action }]); };
  return <div className="chat-view enter-view"><aside className="channel-rail"><div className="panel-head"><div><p className="eyebrow"><UsersRound size={13} /> Channels</p><h2>Coordination</h2></div><button className="icon-button"><Plus size={16} /></button></div><button className="channel channel--active"><span>#</span><div><strong>shift-floor</strong><small>14 active</small></div></button><button className="channel"><span>⊙</span><div><strong>ORD-4507</strong><small>order thread</small></div></button><button className="channel"><span>!</span><div><strong>MI-028</strong><small>exception thread</small></div></button><div className="presence"><p className="eyebrow"><Radio size={13} /> On shift</p>{["Neha Rao", "Samir Khan", "Alex Rivera", "Jia Wong"].map((name, index) => <span key={name}><i className={index === 3 ? "away" : ""} />{name}</span>)}</div></aside><section className="chat-panel"><header><div><p className="eyebrow"># SHIFT-FLOOR</p><h2>Afternoon handoffs</h2></div><span className="live-pulse"><i /> 14 active</span></header><div className="quick-actions"><span>Structured actions</span>{(["Need backup at bin", "Item not found", "QC hold", "Ready for pickup"] as const).map((action) => <button key={action} onClick={() => selectAction(action)}>{action}</button>)}</div><div className="messages">{localMessages.map((message) => <article className={`message ${message.author === "You" ? "message--self" : ""}`} key={message.id}><span className="message-avatar">{message.author === "System" ? "∷" : message.author.split(" ").map((part) => part[0]).join("")}</span><div><header><strong>{message.author}</strong><span>{message.role}</span><time>{message.time}</time></header>{message.template && <Tag tone={message.template === "QC hold" ? "red" : "blue"}>{message.template}</Tag>}<p>{message.text}</p></div></article>)}</div><footer className="message-compose"><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Message #shift-floor" onKeyDown={(event) => { if (event.key === "Enter") sendMessage(); }} /><button onClick={sendMessage}><Send size={17} /></button></footer></section></div>;
}

function AnalyticsView({ issues, ledger }: { issues: MaterialIssue[]; ledger: LedgerEntry[] }) {
  return <div className="analytics-view enter-view"><section className="analytics-grid"><article className="chart-card chart-card--large"><div className="panel-head"><div><p className="eyebrow"><Gauge size={13} /> Throughput</p><h2>Orders exited per hour</h2></div><Tag tone="green">+12.4%</Tag></div><div className="bars">{[34, 48, 42, 66, 58, 82, 74, 93, 70, 88, 92, 78].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><div className="axis"><span>08:00</span><span>11:00</span><span>14:00</span><span>17:00</span></div></article><article className="chart-card"><p className="eyebrow"><Boxes size={13} /> Inventory health</p><h2>92% allocatable</h2><div className="donut"><div><strong>92</strong><span>%</span></div></div><p className="helper-text">22 units quarantined across {issues.filter((issue) => issue.status === "quarantined").length} batches.</p></article><article className="risk-card"><p className="eyebrow"><AlertTriangle size={13} /> At-risk SKUs</p><div><span className="mono">SKU-A23</span><strong>Critical</strong><p>26 allocatable vs. 40 reorder point</p></div><div><span className="mono">SKU-C91</span><strong>Watch</strong><p>3.2 days of cover remaining</p></div></article></section><section className="analytics-lower"><DecisionLedger entries={ledger} compact /><article className="supplier-card"><p className="eyebrow"><UserRound size={13} /> Supplier quality</p><h2>Most reported this week</h2><div className="supplier-row"><span>Vector Materials</span><strong className="critical-text">2.6%</strong></div><div className="supplier-row"><span>Northline Paper</span><strong>1.2%</strong></div><div className="supplier-row"><span>Atlas Components</span><strong>0.4%</strong></div></article></section></div>;
}

function OrderDetail({ order, onClose, onAdvance }: { order: Order; onClose: () => void; onAdvance: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="order-modal" role="dialog" aria-modal="true" aria-label={`Order ${order.id} details`} onMouseDown={(event) => event.stopPropagation()}><button className="close-modal" onClick={onClose}><X size={18} /></button><p className="eyebrow"><ShoppingCart size={13} /> Order detail</p><div className="order-modal__heading"><div><h2 className="mono">{order.id}</h2><p>{order.customer} · {order.destination}</p></div><Tag tone={order.priority === "VIP" ? "amber" : "blue"}>{order.priority}</Tag></div><div className="detail-score"><span>Priority score</span><strong>{order.score}</strong><i><b style={{ width: `${order.score}%` }} /></i></div><div className="allocation-reason"><p className="eyebrow"><Sparkles size={13} /> Allocation reasoning</p><p>Allocated from <span className="mono">A4-18</span> because it is the nearest verified bin with the required quantity and it supports a shared route with ORD-4512.</p></div><div className="modal-meta"><span><small>Current stage</small><strong>{stageLabel(order.stage)}</strong></span><span><small>SLA remaining</small><strong className={order.sla.startsWith("01") ? "critical-text" : ""}>{order.sla}</strong></span><span><small>Allocation</small><strong className="mono">{order.sku} · {order.quantity}u</strong></span></div><button disabled={order.stage === "qc-hold"} className="button button--amber button--wide" onClick={onAdvance}>{order.stage === "qc-hold" ? "QC hold must be released" : `Advance from ${stageLabel(order.stage)}`} <ArrowRight size={16} /></button></section></div>;
}

function CustomerTracking({ shipments }: { shipments: Shipment[] }) {
  const [lookup, setLookup] = useState("AX-048-99120");
  const shipment = shipments.find((item) => item.trackingNumber.toLowerCase() === lookup.toLowerCase()) || shipments[0];
  return <main className="customer-page"><header><Link href="/" className="customer-brand"><img src="/manus-storage/wms9-logo_604e9648.png" alt="WMS-9" /> <span>WMS-9 <small>TRACKING</small></span></Link><Link href="/" className="back-to-ops">Operations sign in <ArrowRight size={15} /></Link></header><section className="customer-card"><div className="customer-card__image" aria-hidden="true"><div className="tracking-gridmark">{Array.from({ length: 9 }, (_, index) => <i key={index} className={index === 8 ? "tracking-gridmark__decision" : ""} />)}</div><span className="mono">TRACK / 048</span><p>STATUS EVIDENCE<br />IS TIME-ORDERED.</p></div><div className="customer-card__body"><p className="eyebrow"><Truck size={13} /> Public tracking record</p><h1>Shipment is in transit.</h1><p className="customer-lede">The carrier confirmed the latest checkpoint at 12:06 IST. Next operational outcome: final-mile handoff for {shipment.destination}.</p><div className="tracking-search"><input value={lookup} onChange={(event) => setLookup(event.target.value)} aria-label="Tracking number" /><button><ArrowRight size={18} /></button></div><p className="customer-helper">Try <span className="mono">AX-048-99120</span> or <span className="mono">OF-448-00318</span></p><div className="customer-evidence"><span><small>Tracking ID</small><strong className="mono">{shipment.trackingNumber}</strong></span><span><small>Carrier event</small><strong>18 AUG · 12:06 IST</strong></span><span><small>Next check</small><strong>Final-mile dispatch</strong></span></div><div className="customer-status"><Tag tone={statusTone(shipment.status)}>{shipment.status.replaceAll("-", " ")}</Tag><div><strong>Carrier evidence accepted. Shipment is moving through the active network.</strong><p>{shipment.carrier} recorded a Chennai routing checkpoint; no delivery exception is open.</p></div></div><div className="customer-timeline"><span className="previous"><i /> Dispatched <small>18 Aug, 09:42</small></span><span className={["in-transit", "out-for-delivery"].includes(shipment.status) ? "active" : shipment.status === "delivered" ? "previous" : ""}><i /> In transit <small>18 Aug, 12:06</small></span><span className={shipment.status === "out-for-delivery" ? "active" : shipment.status === "delivered" ? "previous" : ""}><i /> Out for delivery <small>Expected today</small></span><span className={shipment.status === "delivered" ? "resolved" : ""}><i /> Delivered</span></div></div></section></main>;
}
