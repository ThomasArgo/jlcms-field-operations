import { useState, useEffect, useRef, useCallback } from "react"

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return isMobile
}

/* ---- Google Fonts ---- */
const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=IBM+Plex+Mono:wght@400;500;600&family=Barlow:wght@400;500;600&display=swap');
    :root {
      --app-bg: #0b1118;
      --panel-bg: #111a27;
      --card-bg: #121c2a;
      --border: #243246;
      --text: #f5f8ff;
      --subtext: #90a0b8;
      --accent: #f97316;
      --focus: #fb923c;
      --radius-md: 10px;
      --radius-lg: 14px;
      --shadow-card: 0 10px 28px rgba(2, 8, 20, 0.32);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { min-height: 100%; }
    body {
      background: var(--app-bg);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #1A2332; }
    ::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
    select option { background: #1F2937; color: #F9FAFB; }
    .row-fade { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
    .pulse-yellow { animation: pulseY 2s infinite; }
    @keyframes pulseY { 0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,0.4)} 50%{box-shadow:0 0 0 6px rgba(251,191,36,0)} }
    .slide-in { animation: slideIn 0.25s cubic-bezier(0.16,1,0.3,1); }
    @keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
    .fade-up { animation: fadeUp 0.3s ease; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .notif-in { animation: notifIn 0.35s cubic-bezier(0.16,1,0.3,1); }
    @keyframes notifIn { from{opacity:0;transform:translateX(120%)} to{opacity:1;transform:translateX(0)} }
    .notif-out { animation: notifOut 0.25s ease forwards; }
    @keyframes notifOut { to{opacity:0;transform:translateX(120%)} }
    input:focus, textarea:focus, select:focus {
      outline: 1px solid var(--focus) !important;
      box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.14);
    }
    button { transition: transform 0.12s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease; }
    button:active { transform: translateY(1px); }
    @media (min-width: 768px) and (max-width: 1199px) {
      body { font-size: 15px; }
    }
  `}</style>
)


/* -- Constants -- */
const WORK_TYPES = ["-- Select --","1 Story Demo","2 Story Demo","Multi-Family Demo","Clear & Grub","Tree Removal","Heavy Tree Removal","Vehicle Move & Return","Equipment on Site"]
const PERMIT_STATUSES = ["--","Started","Submitted","In Progress","Approved","Denied"]
const INSPECTOR_TYPES = ["Building Inspector","Fire Inspector","Environmental Inspector","Structural Inspector","Utility Inspector","Code Enforcement"]
const CONTRACTOR_TRADES = ["Demo / Demolition","Abatement","Electrical","Plumbing","Grading / Earthwork","Tree Service","Hauling / Disposal","General Contractor","Equipment Rental","Engineering","Other"]


const STATUS_META = {
  "--":           { color:"#6B7280", bg:"#1C2333", row:"#151D2B" },
  "Started":     { color:"#FBBF24", bg:"#2D1F00", row:"#1E1500" },
  "Submitted":   { color:"#60A5FA", bg:"#0F2040", row:"#0A1A30" },
  "In Progress": { color:"#FB923C", bg:"#2D1200", row:"#1E0D00" },
  "Approved":    { color:"#34D399", bg:"#002D1A", row:"#001C10" },
  "Denied":      { color:"#F87171", bg:"#2D0A0A", row:"#1E0606" },
}

/* ========================== GLOBAL UI SYSTEM ========================== */

const UI = {
  bg: "#0B1118",
  appBg: "radial-gradient(circle at 16% 10%, #19273A 0%, #0B1118 47%)",
  panel: "#111A27",
  card: "#121C2A",
  border: "#243246",
  text: "#F5F8FF",
  subtext: "#90A0B8",
  accent: "#F97316",
  success: "#34D399"
}

const cardStyle = {
  background: UI.card,
  border: `1px solid ${UI.border}`,
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 10px 28px rgba(2,8,20,0.32)"
}

const sectionLabel = {
  fontSize: 11,
  color: UI.subtext,
  marginBottom: 9,
  textTransform: "uppercase",
  letterSpacing: 1.2,
  fontWeight: 700
}

const titleStyle = {
  fontSize: 26,
  fontWeight: 800,
  color: UI.text
}

const buttonStyle = {
  background: "#182433",
  border: "1px solid #34475f",
  borderRadius: 9,
  padding: "9px 13px",
  fontSize: 14,
  color: UI.text,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(5,10,20,0.2)"
}

const LEGEND_ITEMS = [
  { status:"Started",     color:"#FBBF24", def:"Documents actively being filled out. Must be submitted within 24 hours." },
  { status:"Submitted",   color:"#60A5FA", def:"Package emailed/delivered to City. Submitted-to contact is logged." },
  { status:"In Progress", color:"#FB923C", def:"City/Authority received and is currently reviewing the application." },
  { status:"Approved",    color:"#34D399", def:"Permit granted. Row turns green - cleared to mobilize or invoice." },
  { status:"Denied",      color:"#F87171", def:"Application rejected. Must be corrected and resubmitted." },
  { status:"--",           color:"#6B7280", def:"No permit action taken yet on this property." },
]


/* -- Notification config -- */
const NOTIF_TYPES = {
  schedule:  { color:"#60A5FA", icon:"SCH", label:"Schedule"   },
  permit:    { color:"#F87171", icon:"PER", label:"Permit"     },
  deadline:  { color:"#FBBF24", icon:"DDL", label:"Deadline"   },
  site:      { color:"#F97316", icon:"SIT", label:"Site Visit" },
  job:       { color:"#34D399", icon:"JOB", label:"New Job"    },
  invoice:   { color:"#A78BFA", icon:"INV", label:"Invoice"    },
}


/* -- Role-based routing -- */
function routeNotif(type, data) {
  const all = ["all"]
  if (type === "schedule")  return all
  if (type === "permit")    return all
  if (type === "deadline")  return all
  if (type === "site")      return all
  if (type === "job")       return all
  if (type === "invoice")   return all
  return all
}


/* -- Helpers -- */
const uid      = () => Math.random().toString(36).slice(2,10)
const now      = () => new Date().toISOString()
const fmt      = (iso) => iso ? new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"}) : "--"
const fmtT     = (iso) => iso ? new Date(iso).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}) : ""
const hoursAgo = (iso) => iso ? ((Date.now()-new Date(iso).getTime())/3600000).toFixed(1) : null
const mapsUrl  = (a)   => `https://maps.google.com/maps?q=${encodeURIComponent(a)}&output=embed&z=17&t=k`
const roleLabel = (role = "") => String(role || "").trim().split(/[\s_-]+/).filter(Boolean).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ")
const pageLabel = (page = "") => String(page || "").replace(/([a-z])([A-Z])/g, "$1 $2").split(/[\s_-]+/).filter(Boolean).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ")
const cleanUiText = (value = "") =>
  String(value).replace(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu,
    ""
  ).replace(/\s{2,}/g, " ").trim()
const sanitizeMessages = (messageList = [], userList = []) => {
  const byId = new Map((userList || []).map(u=>[u.id, u]))
  return (messageList || []).filter(msg => {
    const kind = msg?.kind || "team"
    const sender = byId.get(msg?.senderId)
    if (!sender || !sender.approved) return false
    if (kind === "dm") {
      const recipient = byId.get(msg?.toUserId)
      if (!recipient || !recipient.approved) return false
      return sender.teamId && recipient.teamId && sender.teamId===recipient.teamId
    }
    return !!msg?.teamId && sender.teamId===msg.teamId
  })
}
const INVOICE_STATUSES = ["Draft","Sent","Paid","Cancelled"]
const WEEK_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
const emptyLineItem = () => ({ id:uid(), description:"", quantity:1, unitPrice:0 })
const toNumber = (v) => Number.parseFloat(v || 0) || 0
const calcInvoiceTotals = (invoice) => {
  const items = invoice?.lineItems || []
  const subtotal = items.reduce((sum, li) => sum + (toNumber(li.quantity) * toNumber(li.unitPrice)), 0)
  const taxPct = toNumber(invoice?.taxPct)
  const tax = subtotal * (taxPct / 100)
  const total = subtotal + tax
  return { subtotal, tax, total }
}
const isPropReady = (p) => (
  p.permitStatus==="Approved" &&
  p.electric &&
  p.gas &&
  p.water
)
const getBillingMeta = (prop, invoices) => {
  const invoice = prop?.invoiceId ? invoices.find(inv=>inv.id===prop.invoiceId) : null
  if (invoice?.status === "Paid") return { label:"Invoice Paid", color:"#34D399", bg:"#022C16" }
  if (invoice?.status === "Sent") return { label:"Invoice Sent", color:"#60A5FA", bg:"#0F2040" }
  if (invoice?.status === "Draft") return { label:"Invoice Drafted", color:"#A78BFA", bg:"#1E1040" }
  if (invoice?.status === "Cancelled") return { label:"Completed", color:"#FBBF24", bg:"#2D1F00" }
  if (prop?.isCompleted && prop?.clientId) return { label:"Ready for Invoice", color:"#F97316", bg:"#2D1200" }
  if (prop?.isCompleted) return { label:"Completed", color:"#FBBF24", bg:"#2D1F00" }
  if (isPropReady(prop)) return { label:"Ready to Mobilize", color:"#34D399", bg:"#022C16" }
  return { label:"Not Ready", color:"#9CA3AF", bg:"#111827" }
}
const normalizeProp = (p = {}) => ({
  ...p,
  workType: p.workType === "--- Select ---" ? "-- Select --" : (p.workType || "-- Select --"),
  permitStatus: p.permitStatus || "--",
  isCompleted: !!p.isCompleted,
  completedAt: p.completedAt || null,
  invoiceId: p.invoiceId || null,
  invoiceStatus: p.invoiceStatus || null
})


function timeToday(timeStr) {
  const [time, ampm] = timeStr.split(" ")
  let [h, m] = time.split(":").map(Number)
  if (ampm === "PM" && h !== 12) h += 12
  if (ampm === "AM" && h === 12) h = 0
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}


function genCode(name, trade, index) {
  const tradeAbbr = {"Demo / Demolition":"DEM","Abatement":"ABT","Electrical":"ELC","Plumbing":"PLM","Grading / Earthwork":"GRD","Tree Service":"TRE","Hauling / Disposal":"HAL","General Contractor":"GEN","Equipment Rental":"EQP","Engineering":"ENG","Other":"OTH"}
  const abbr = tradeAbbr[trade] || "OTH"
  const nameCode = name.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,3).padEnd(3,"X")
  return `${abbr}-${nameCode}-${String(index+1).padStart(3,"0")}`
}


async function storageSave(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)) } catch(e) {}
  try {
    localStorage.setItem(key, JSON.stringify(val))
    localStorage.setItem("hcg-sync-ts", String(Date.now()))
  } catch(e) {}
}
async function storageLoad(key, fallback=[]) {
  try {
    const local = localStorage.getItem(key)
    if (local) return JSON.parse(local)
  } catch(e) {}
  try { const r = await window.storage.get(key); if(r?.value) return JSON.parse(r.value) } catch(e) {}
  return fallback
}
const lsLoad = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch (e) { return fallback } }
const lsSave = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); localStorage.setItem("hcg-sync-ts", String(Date.now())) } catch (e) {} }
const userId = () => `user-${uid()}`
const viewportInfo = () => {
  const width = typeof window !== "undefined" ? window.innerWidth : 1280
  return {
    width,
    isPhone: width < 768,
    isTablet: width >= 768 && width < 1200
  }
}
const pageShell = (desktopMax = 1120) => {
  const { isPhone, isTablet } = viewportInfo()
  return {
    padding: isPhone ? 12 : isTablet ? 18 : 24,
    width: "100%",
    maxWidth: isPhone ? "100%" : (isTablet ? Math.min(desktopMax, 980) : desktopMax),
    margin: "0 auto"
  }
}

const FIXED_TEAM_ID = "team-main"
const FIXED_TEAM_NAME = "Company Workspace"
const FIXED_TEAM_INVITE_CODE = "1234"
const PAGE_KEYS = ["home","dashboard","invoices","team","chat","clients","schedule","permanentSchedule","vendors","inspectors","mileage","more"]
const ACTION_KEYS = ["view","add","edit","delete"]
const fullPerms = () => ({ view:true, add:true, edit:true, delete:true })
const viewOnlyPerms = () => ({ view:true, add:false, edit:false, delete:false })
const defaultRolePermissions = () => ({
  ceo:        Object.fromEntries(PAGE_KEYS.map(p=>[p, fullPerms()])),
  management: Object.fromEntries(PAGE_KEYS.map(p=>[p, fullPerms()])),
  operations: Object.fromEntries(PAGE_KEYS.map(p=>[p, fullPerms()])),
  member:     Object.fromEntries(PAGE_KEYS.map(p=>[p, viewOnlyPerms()]))
})
const FIXED_CEO_USER = {
  id:"user-ceo",
  name:"Greg",
  email:"greg@gmail.com",
  password:"TestCEO",
  role:"ceo",
  teamId:FIXED_TEAM_ID,
  approved:true,
  activeSessionId:null,
  lastLoginAt:null,
  createdAt:"2026-01-01T00:00:00.000Z"
}


/* ---- Push Notification helper ---- */
async function requestPushPermission() {
  if (!("Notification" in window)) return "unsupported"
  if (Notification.permission === "granted") return "granted"
  if (Notification.permission === "denied") return "denied"
  const result = await Notification.requestPermission()
  return result
}


function sendPushNotification(title, body, icon = "site") {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/favicon.ico", tag: uid(), requireInteraction: false })
    } catch(e) {}
  }
}


/* ================================== MAIN APP ================================== */
export default function JLCMSApp() {
  
  const isMobile = useIsMobile()

  const [props,        setProps]        = useState([])
  const [mileage,      setMileage]      = useState([])
  const [clients,      setClients]      = useState([])
  const [invoices,     setInvoices]     = useState([])
  const [tasks,        setTasks]        = useState([])
  const [oneOffScheduleBlocks,setOneOffScheduleBlocks]=useState([])
  const [recurringWeeklySchedule,setRecurringWeeklySchedule]=useState([])
  const [vendors,      setVendors]      = useState([])
  const [inspectors,   setInspectors]   = useState([])
  const [selected,     setSelected]     = useState(null)
  const [tab,          setTab]          = useState("home")
  const [showLegend,   setShowLegend]   = useState(false)
  const [addOpen,      setAddOpen]      = useState(false)
  const [newAddr,      setNewAddr]      = useState("")
  const [bulkOpen,     setBulkOpen]     = useState(false)
  const [activeUser,   setActiveUser]   = useState(FIXED_CEO_USER.id)
  const [notifPanel,   setNotifPanel]   = useState(false)
  const [notifications,setNotifications]= useState([])
  const [toasts,       setToasts]       = useState([])
  const [pushEnabled,  setPushEnabled]  = useState(false)
  const [tick,         setTick]         = useState(0)
  const [dashSearch,   setDashSearch]   = useState("")
  const [dashSort,     setDashSort]     = useState("newest")
  const [dashStatus,   setDashStatus]   = useState("All")
  const [dashWorkType, setDashWorkType] = useState("All")
  const [dashVendor,   setDashVendor]   = useState("All")
  const [dashInspector,setDashInspector]= useState("All")
  const [dashClient,   setDashClient]   = useState("All")
  const [dashReadyOnly,setDashReadyOnly]= useState(false)
  const [users,        setUsers]        = useState([])
  const [teams,        setTeams]        = useState([])
  const [messages,     setMessages]     = useState([])
  const [currentUser,  setCurrentUser]  = useState(null)
  const [chatModePref, setChatModePref] = useState("team")
  const [chatPeerPref, setChatPeerPref] = useState("")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("")
  const [authLoaded,   setAuthLoaded]   = useState(false)
  const firedRef = useRef(new Set())


  /* ---- Load / Save ---- */
  useEffect(() => {
    storageLoad("hcg-props").then(d=>{ if(d.length) setProps(d.map(normalizeProp)) })
    storageLoad("hcg-mileage").then(d=>{ if(d.length) setMileage(d) })
    storageLoad("hcg-clients").then(d=>{ if(d.length) setClients(d) })
    storageLoad("hcg-invoices",[]).then(d=>{ if(d.length) setInvoices(d) })
    storageLoad("hcg-tasks",[]).then(d=>{
      if (d.length) {
        setTasks(d)
        return
      }
      storageLoad("hcg-workflow",[]).then(old=>{
        if (old.length) {
          setTasks(old.map(item=>({
            id:item.id || uid(),
            title:item.title || "",
            detail:item.notes || "",
            assignedUserId:item.owner || "",
            propertyId:"",
            clientId:"",
            dueDate:item.due || "",
            dueTime:"",
            priority:"Normal",
            status:item.status==="done" ? "Done" : item.status==="in-progress" ? "In Progress" : "To Do",
            createdAt:item.createdAt || now()
          })))
        }
      })
    })
    storageLoad("hcg-oneoff-schedule-blocks",[]).then(d=>{
      if (d.length) {
        setOneOffScheduleBlocks(d)
        return
      }
      storageLoad("hcg-custom-schedule",[]).then(old=>{
        if (old.length) {
          setOneOffScheduleBlocks(old.map(entry=>({
            id:entry.id || uid(),
            userId:"",
            date:"",
            start:entry.time || "08:00 AM",
            end:entry.end || "05:00 PM",
            title:entry.label || "One-Off Block",
            detail:entry.detail || "",
            type:"supplement",
            createdBy:entry.createdBy || "",
            createdAt:entry.createdAt || now()
          })))
        }
      })
    })
    storageLoad("hcg-recurring-weekly-schedule",[]).then(d=>{
      if (d.length) {
        setRecurringWeeklySchedule(d)
        return
      }
      storageLoad("hcg-weekly-schedule",[]).then(old=>{ if(old.length) setRecurringWeeklySchedule(old) })
    })
    storageLoad("hcg-vendors").then(d=>{ if(d.length) setVendors(d) })
    storageLoad("hcg-inspectors").then(d=>{ if(d.length) setInspectors(d) })
    storageLoad("hcg-notifications",[]).then(d=>{ if(d.length) setNotifications(d) })
    const storedUsers = lsLoad("users", [])
    const storedTeams = lsLoad("teams", [])
    const storedMainTeam = storedTeams.find(t=>t.teamId===FIXED_TEAM_ID)
    const resolvedInviteCode = String(storedMainTeam?.inviteCode || FIXED_TEAM_INVITE_CODE).trim() || FIXED_TEAM_INVITE_CODE
    const resolvedTeamName = String(storedMainTeam?.teamName || FIXED_TEAM_NAME).trim() || FIXED_TEAM_NAME
    const normalizedUsers = [
      FIXED_CEO_USER,
      ...storedUsers
        .filter(u=>u.id!==FIXED_CEO_USER.id && String(u.email||"").toLowerCase()!==FIXED_CEO_USER.email.toLowerCase())
        .map(u=>({ ...u, teamId:FIXED_TEAM_ID, role:u.role||"member", activeSessionId:u.activeSessionId||null }))
    ]
    const pendingRequests = normalizedUsers
      .filter(u=>u.teamId===FIXED_TEAM_ID && !u.approved)
      .map(u=>({
        userId:u.id,
        name:u.name,
        email:u.email,
        requestedAt:u.createdAt || now()
      }))
    const members = normalizedUsers
      .filter(u=>u.teamId===FIXED_TEAM_ID && u.approved)
      .map(u=>u.id)
    const normalizedTeams = [{
      teamId:FIXED_TEAM_ID,
      teamName:resolvedTeamName,
      inviteCode:resolvedInviteCode,
      members:[...new Set([FIXED_CEO_USER.id, ...members])],
      pendingRequests,
      roles:Array.isArray(storedMainTeam?.roles) && storedMainTeam.roles.length
        ? storedMainTeam.roles
        : ["ceo","management","operations","member"],
      rolePermissions: (() => {
        const base = defaultRolePermissions()
        const stored = storedMainTeam?.rolePermissions || {}
        const out = { ...base }
        Object.keys(stored || {}).forEach(role=>{
          out[role] = out[role] || Object.fromEntries(PAGE_KEYS.map(p=>[p, fullPerms()]))
          PAGE_KEYS.forEach(page=>{
            const existing = stored?.[role]?.[page]
            if (!existing) return
            out[role][page] = {
              view: existing.view !== false,
              add: existing.add !== false,
              edit: existing.edit !== false,
              delete: existing.delete !== false
            }
          })
        })
        return out
      })()
    }]
    setUsers(normalizedUsers)
    setTeams(normalizedTeams)
    setMessages(sanitizeMessages(lsLoad("messages", []), normalizedUsers))
    setCurrentUser(lsLoad("currentUser", null))
    setAuthLoaded(true)
    // Check push permission
    if (typeof Notification !== "undefined" && Notification.permission === "granted") setPushEnabled(true)
  },[])
  useEffect(()=>{ storageSave("hcg-props",props) },[props])
  useEffect(()=>{ storageSave("hcg-mileage",mileage) },[mileage])
  useEffect(()=>{ storageSave("hcg-clients",clients) },[clients])
  useEffect(()=>{ storageSave("hcg-invoices",invoices) },[invoices])
  useEffect(()=>{ storageSave("hcg-tasks",tasks) },[tasks])
  useEffect(()=>{ storageSave("hcg-oneoff-schedule-blocks",oneOffScheduleBlocks) },[oneOffScheduleBlocks])
  useEffect(()=>{ storageSave("hcg-recurring-weekly-schedule",recurringWeeklySchedule) },[recurringWeeklySchedule])
  useEffect(()=>{ storageSave("hcg-vendors",vendors) },[vendors])
  useEffect(()=>{ storageSave("hcg-inspectors",inspectors) },[inspectors])
  useEffect(()=>{ if(notifications.length) storageSave("hcg-notifications",notifications.slice(0,100)) },[notifications])
  useEffect(()=>{ if(authLoaded) lsSave("users",users) },[users, authLoaded])
  useEffect(()=>{ if(authLoaded) lsSave("teams",teams) },[teams, authLoaded])
  useEffect(()=>{ if(authLoaded) lsSave("messages", sanitizeMessages(messages, users)) },[messages, users, authLoaded])
  useEffect(()=>{ if(authLoaded) lsSave("currentUser",currentUser) },[currentUser, authLoaded])

  useEffect(() => {
    const syncFromStorage = async () => {
      const [p,m,c,inv,t,os,rs,v,i,n] = await Promise.all([
        storageLoad("hcg-props",[]),
        storageLoad("hcg-mileage",[]),
        storageLoad("hcg-clients",[]),
        storageLoad("hcg-invoices",[]),
        storageLoad("hcg-tasks",[]),
        storageLoad("hcg-oneoff-schedule-blocks",[]),
        storageLoad("hcg-recurring-weekly-schedule",[]),
        storageLoad("hcg-vendors",[]),
        storageLoad("hcg-inspectors",[]),
        storageLoad("hcg-notifications",[])
      ])
      setProps((p||[]).map(normalizeProp))
      setMileage(m||[])
      setClients(c||[])
      setInvoices(inv||[])
      setTasks(t||[])
      setOneOffScheduleBlocks(os||[])
      setRecurringWeeklySchedule(rs||[])
      setVendors(v||[])
      setInspectors(i||[])
      setNotifications(n||[])
      const syncedUsers = lsLoad("users", [])
      setUsers(syncedUsers)
      setTeams(lsLoad("teams", []))
      setMessages(sanitizeMessages(lsLoad("messages", []), syncedUsers))
    }

    const onStorage = (e) => {
      if (e.key==="hcg-sync-ts") syncFromStorage()
    }
    window.addEventListener("storage", onStorage)
    const onVisible = () => { if (!document.hidden) syncFromStorage() }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.removeEventListener("storage", onStorage)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])


  /* ---- Tick every 30s ---- */
  useEffect(()=>{ const t = setInterval(()=>setTick(x=>x+1), 30000); return()=>clearInterval(t) },[])


  /* ---- Fire notification ---- */
  const fireNotif = useCallback((type, title, body, recipients) => {
    const key = `${type}-${title}-${new Date().toDateString()}`
    let persisted = {}
    try { persisted = JSON.parse(localStorage.getItem("hcg-fired-notif-keys") || "{}") || {} } catch (e) {}
    if (firedRef.current.has(key) || persisted[key]) return
    firedRef.current.add(key)
    try {
      persisted[key] = now()
      localStorage.setItem("hcg-fired-notif-keys", JSON.stringify(persisted))
    } catch (e) {}

    const teamRecipients = users.filter(u=>u.teamId===FIXED_TEAM_ID && u.approved).map(u=>u.id)
    const normalizedRecipients = (recipients || [])
      .map(r => {
        const raw = String(r || "").trim()
        if (!raw) return ""
        const direct = users.find(u => u.id === raw)
        if (direct) return direct.id
        const byName = users.find(u => String(u.name || "").toLowerCase() === raw.toLowerCase())
        return byName?.id || raw
      })
      .filter(Boolean)
    const finalRecipients = normalizedRecipients.length ? normalizedRecipients : teamRecipients
    const notif = { id:uid(), type, title, body, recipients:finalRecipients, time:now(), read:false }
    setNotifications(prev=>[notif,...prev.slice(0,99)])


    // In-app toast
    const toast = { id:uid(), type, title, body, recipients:finalRecipients }
    setToasts(prev=>[...prev, toast])
    setTimeout(()=>setToasts(prev=>prev.filter(t=>t.id!==toast.id)), 6000)


    // Browser push - only if current user is a recipient
    if (pushEnabled && finalRecipients.includes(activeUser)) {
      sendPushNotification(`JLCMS: ${title}`, body)
    }
  },[pushEnabled, activeUser, users])


  /* ---- Schedule checker ---- */
  useEffect(()=>{
    const teamMembers = users.filter(u=>u.teamId===FIXED_TEAM_ID && u.approved)
    if (!teamMembers.length) return
    const now_ = new Date()
    const h = now_.getHours(), m = now_.getMinutes()
    const totalMin = h * 60 + m
    const localDate = new Date(now_.getTime() - now_.getTimezoneOffset() * 60000).toISOString().slice(0,10)
    const dayKey = WEEK_DAYS[(now_.getDay() + 6) % 7]

    const oneOffToday = oneOffScheduleBlocks
      .filter(e=>e.date===localDate && e.userId)
      .map(e=>({
        ...e,
        start:e.start || "08:00 AM",
        end:e.end || "05:00 PM",
        title:e.title || "One-Off Block",
        detail:e.detail || ""
      }))
    const overrideUsers = new Set(oneOffToday.filter(e=>String(e.type||"").toLowerCase()==="override").map(e=>e.userId))
    const recurringToday = recurringWeeklySchedule
      .filter(e=>e.day===dayKey && e.userId && !overrideUsers.has(e.userId))
      .map(e=>({
        ...e,
        start:e.start || "08:00 AM",
        end:e.end || "05:00 PM",
        title:e.note || "Recurring Shift",
        detail:e.note || ""
      }))

    const scheduleBlocks = [...recurringToday, ...oneOffToday]
    scheduleBlocks.forEach(block => {
      const user = teamMembers.find(u=>u.id===block.userId)
      const startTime = timeToday(block.start)
      const blockMin = startTime.getHours() * 60 + startTime.getMinutes()
      const diff = blockMin - totalMin
      const titleBase = `${user?.name || "Team Member"}: ${block.title || "Shift"}`
      if (diff >= 14 && diff <= 16) {
        fireNotif("schedule", `Upcoming in 15 min - ${titleBase}`, `${block.start} - ${block.end}`, [block.userId])
      }
      if (diff >= -1 && diff <= 1) {
        fireNotif("schedule", `Starting now - ${titleBase}`, `${block.start} - ${block.end}`, [block.userId])
      }
    })

    const pendingTasks = tasks.filter(t=>String(t.status||"To Do")!=="Done")
    const dueToday = pendingTasks.filter(t=>t.dueDate===localDate)

    pendingTasks
      .filter(t=>t.dueDate===localDate && t.dueTime)
      .forEach(task=>{
        const [hh, mm] = String(task.dueTime || "").split(":").map(Number)
        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return
        const dueMin = hh * 60 + mm
        const diff = dueMin - totalMin
        if (diff >= 29 && diff <= 31) {
          fireNotif("deadline", `Task Due in 30 Minutes - ${task.title}`, `Due at ${task.dueTime}.`, [task.assignedUserId].filter(Boolean))
        }
        if (diff >= 14 && diff <= 16) {
          fireNotif("deadline", `Task Due in 15 Minutes - ${task.title}`, `Due at ${task.dueTime}.`, [task.assignedUserId].filter(Boolean))
        }
      })

    const toDate = (task) => {
      if (!task?.dueDate) return null
      const timePart = task.dueTime ? `${task.dueTime}:00` : "23:59:59"
      const out = new Date(`${task.dueDate}T${timePart}`)
      return Number.isNaN(out.getTime()) ? null : out
    }
    pendingTasks
      .filter(t=>String(t.priority||"Normal")==="Urgent")
      .forEach(task=>{
        const due = toDate(task)
        if (!due) return
        if (due.getTime() < now_.getTime()) {
          fireNotif("deadline", `Urgent Task Overdue - ${task.title}`, "Urgent assignment is overdue.", [task.assignedUserId].filter(Boolean))
        }
      })

    if (h===7 && m<=1) {
      teamMembers.forEach(member=>{
        const blocksToday = scheduleBlocks.filter(b=>b.userId===member.id).length
        const tasksToday = dueToday.filter(t=>t.assignedUserId===member.id).length
        if (blocksToday || tasksToday) {
          fireNotif("schedule", "Daily Assignment Summary", `${blocksToday} schedule blocks and ${tasksToday} tasks due today.`, [member.id])
        }
      })
    }
  },[tick, fireNotif, users, oneOffScheduleBlocks, recurringWeeklySchedule, tasks])


  /* ---- Permit & deadline checker ---- */
  useEffect(()=>{
    props.forEach(p => {
      // 24hr started deadline
      if (p.permitStatus === "Started" && p.startedAt) {
        const hrs = parseFloat(hoursAgo(p.startedAt))
        if (hrs >= 20 && hrs < 21) {
          fireNotif("deadline", "Permit Deadline Approaching", `${p.address} - ${(24-hrs).toFixed(1)}hrs remaining to submit`, [])
        }
        if (hrs >= 23) {
          fireNotif("deadline", "PERMIT OVERDUE", `${p.address} - exceeded 24hr submission window`, [])
        }
      }
      // Permit expiring within 24hrs
      if (p.expiryDate) {
        const hoursLeft = (new Date(p.expiryDate) - new Date()) / 3600000
        if (hoursLeft > 0 && hoursLeft <= 24) {
          fireNotif("permit", "Permit Expiring in 24hrs", `${p.address} - permit expires ${fmt(p.expiryDate)}`, [])
        }
      }
    })
  },[tick, props, fireNotif])


  /* ---- updateProp ---- */
  const updateProp = useCallback((id, field, val) => {
    setProps(prev=>prev.map(p=>{
      if(p.id!==id) return p
      const u={...p,[field]:val}
      if(field==="permitStatus"&&val==="Started"&&!p.startedAt) u.startedAt=now()
      if(field==="permitStatus"&&val!=="Started") u.startedAt=null
      return u
    }))
  },[])


  /* ---- addProperty ---- */
  const addProperty = () => {
    if (!can("dashboard","add")) {
      showRoleRequiredAlert()
      return
    }
    if(!newAddr.trim()) return
    const p={ id:uid(), address:newAddr.trim(), workType:"-- Select --", permitStatus:"--",
      submittedTo:"", submittedDate:"", startedAt:null, permitNumber:"", hcadNumber:"",
      electric:false, gas:false, water:false, notes:"", photos:[], assignedVendors:[],
      assignedInspectors:[], clientId:"", isCompleted:false, completedAt:null, invoiceId:null, invoiceStatus:null, createdAt:now() }
    setProps(prev=>[normalizeProp(p),...prev])
    setNewAddr(""); setAddOpen(false); setSelected(p.id)
    fireNotif("job","New Job Order Added", p.address, [])
  }

  const login = (email, password) => {
    const e = email.trim().toLowerCase()
    const found = users.find(u=>u.email.toLowerCase()===e && u.password===password)
    if (!found) return { ok:false, error:"Invalid email or password." }
    const sessionId = uid()
    const loginAt = now()
    setUsers(prev=>prev.map(u=>u.id!==found.id?u:{...u,activeSessionId:sessionId,lastLoginAt:loginAt}))
    setCurrentUser({ ...found, activeSessionId:sessionId, lastLoginAt:loginAt })
    return { ok:true }
  }

  const signup = ({ name, email, password, invite }) => {
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanName || !cleanEmail || !password) return { ok:false, error:"Please complete all required fields." }
    if (users.some(u=>u.email.toLowerCase()===cleanEmail)) return { ok:false, error:"That email is already in use." }
    if (cleanEmail===FIXED_CEO_USER.email.toLowerCase()) return { ok:false, error:"CEO account is fixed and already provisioned." }

    const enteredCode = (invite || "").trim().toUpperCase()
    const activeInviteCode = String(teams.find(t=>t.teamId===FIXED_TEAM_ID)?.inviteCode || FIXED_TEAM_INVITE_CODE).toUpperCase()
    if (!enteredCode) return { ok:false, error:"Enter the team invite code provided by the CEO." }
    if (enteredCode!==activeInviteCode) return { ok:false, error:"Invalid team invite code." }

    const sessionId = uid()
    const loginAt = now()

    const nextUser = {
      id:userId(),
      name:cleanName,
      email:cleanEmail,
      password,
      createdAt:loginAt,
      teamId:FIXED_TEAM_ID,
      approved:true,
      activeSessionId:sessionId,
      lastLoginAt:loginAt,
      role:"member"
    }
    setUsers(prev=>[...prev, nextUser])
    setTeams(prev=>prev.map(t=>t.teamId!==FIXED_TEAM_ID?t:{
      ...t,
      members:[...(t.members||[]), nextUser.id]
    }))
    setCurrentUser(nextUser)
    return { ok:true }
  }

  const logout = () => {
    if (currentUser?.id) {
      setUsers(prev=>prev.map(u=>u.id!==currentUser.id?u:{...u,activeSessionId:null}))
    }
    setCurrentUser(null)
  }

  const approveTeamRequest = (teamIdValue, userIdValue) => {
    setUsers(prev=>prev.map(u=>u.id!==userIdValue?u:{...u, approved:true}))
    setTeams(prev=>prev.map(t=>{
      if (t.teamId!==teamIdValue) return t
      const pending = (t.pendingRequests||[]).filter(r=>r.userId!==userIdValue)
      const members = (t.members||[]).includes(userIdValue) ? (t.members||[]) : [...(t.members||[]), userIdValue]
      return { ...t, pendingRequests:pending, members }
    }))
  }

  const denyTeamRequest = (teamIdValue, userIdValue) => {
    if (userIdValue===FIXED_CEO_USER.id) return
    setUsers(prev=>prev.filter(u=>u.id!==userIdValue))
    setTeams(prev=>prev.map(t=>t.teamId!==teamIdValue?t:{...t,pendingRequests:(t.pendingRequests||[]).filter(r=>r.userId!==userIdValue)}))
    setMessages(prev=>prev.filter(m=>m.senderId!==userIdValue && m.toUserId!==userIdValue))
    if (currentUser?.id===userIdValue) setCurrentUser(null)
  }

  const updateTeamInviteCode = (newCode) => {
    const clean = String(newCode || "").trim().toUpperCase().replace(/\s+/g,"")
    if (!clean) return { ok:false, error:"Invite code cannot be empty." }
    if (clean.length < 4) return { ok:false, error:"Invite code must be at least 4 characters." }
    setTeams(prev=>prev.map(t=>t.teamId!==FIXED_TEAM_ID?t:{...t,inviteCode:clean}))
    return { ok:true }
  }

  const forceLogoutTeamUser = (userIdValue) => {
    if (!userIdValue || userIdValue===FIXED_CEO_USER.id) return
    setUsers(prev=>prev.map(u=>u.id!==userIdValue?u:{...u,activeSessionId:null}))
    if (currentUser?.id===userIdValue) setCurrentUser(null)
  }

  const removeTeamUser = (userIdValue) => {
    if (!userIdValue || userIdValue===FIXED_CEO_USER.id) return
    setUsers(prev=>prev.filter(u=>u.id!==userIdValue))
    setTeams(prev=>prev.map(t=>t.teamId!==FIXED_TEAM_ID?t:{
      ...t,
      members:(t.members||[]).filter(id=>id!==userIdValue),
      pendingRequests:(t.pendingRequests||[]).filter(r=>r.userId!==userIdValue)
    }))
    setMessages(prev=>prev.filter(m=>m.senderId!==userIdValue && m.toUserId!==userIdValue))
    if (currentUser?.id===userIdValue) setCurrentUser(null)
  }

  const updateCurrentProfile = (updates) => {
    if (!currentUser) return { ok:false, error:"No user session." }
    const nextName = String(updates.name ?? currentUser.name).trim()
    const nextEmail = String(updates.email ?? currentUser.email).trim().toLowerCase()
    const nextPhoto = updates.profilePic ?? currentUser.profilePic ?? ""

    if (!nextName || !nextEmail) return { ok:false, error:"Name and email are required." }
    if (users.some(u=>u.id!==currentUser.id && String(u.email||"").toLowerCase()===nextEmail)) return { ok:false, error:"Email already used by another user." }
    if (currentUser.id!==FIXED_CEO_USER.id && nextEmail===FIXED_CEO_USER.email.toLowerCase()) return { ok:false, error:"Email not allowed." }

    setUsers(prev=>prev.map(u=>u.id!==currentUser.id?u:{
      ...u,
      name:nextName,
      email:nextEmail,
      profilePic:nextPhoto
    }))
    return { ok:true }
  }

  const updateCompanyName = (name) => {
    if (!isCurrentCeo) return { ok:false, error:"Only the CEO can change company name." }
    const clean = String(name||"").trim()
    if (!clean) return { ok:false, error:"Company name cannot be empty." }
    setTeams(prev=>prev.map(t=>t.teamId!==FIXED_TEAM_ID?t:{...t,teamName:clean}))
    return { ok:true }
  }

  const createTeamRole = (roleName) => {
    if (!isCurrentCeo) return { ok:false, error:"Only the CEO can create roles." }
    const clean = String(roleName||"").trim().toLowerCase()
    if (!clean) return { ok:false, error:"Role name cannot be empty." }
    if (clean==="ceo") return { ok:false, error:"Role reserved." }
    if (currentTeam?.roles?.includes(clean)) return { ok:false, error:"Role already exists." }
    setTeams(prev=>prev.map(t=>t.teamId!==FIXED_TEAM_ID?t:{...t,roles:[...(t.roles||[]), clean]}))
    return { ok:true }
  }

  const renameTeamRole = (oldRole, newRole) => {
    if (!isCurrentCeo) return { ok:false, error:"Only the CEO can rename roles." }
    const from = String(oldRole||"").trim().toLowerCase()
    const to = String(newRole||"").trim().toLowerCase()
    if (!from || !to) return { ok:false, error:"Role name cannot be empty." }
    if (from==="ceo" || to==="ceo") return { ok:false, error:"CEO role is fixed." }
    if (!currentTeam?.roles?.includes(from)) return { ok:false, error:"Role not found." }
    if (currentTeam?.roles?.includes(to)) return { ok:false, error:"Role already exists." }

    setUsers(prev=>prev.map(u=>u.role===from?{...u,role:to}:u))
    setTeams(prev=>prev.map(t=>{
      if (t.teamId!==FIXED_TEAM_ID) return t
      const nextRoles = (t.roles||[]).map(r=>r===from?to:r)
      const rp = { ...(t.rolePermissions||defaultRolePermissions()) }
      if (rp[from]) {
        rp[to] = { ...(rp[to] || {}), ...rp[from] }
        delete rp[from]
      }
      return { ...t, roles:nextRoles, rolePermissions:rp }
    }))
    return { ok:true }
  }

  const deleteTeamRole = (role) => {
    if (!isCurrentCeo) return { ok:false, error:"Only the CEO can delete roles." }
    const clean = String(role||"").trim().toLowerCase()
    if (!clean || clean==="ceo") return { ok:false, error:"CEO role is fixed." }
    if (!currentTeam?.roles?.includes(clean)) return { ok:false, error:"Role not found." }
    setUsers(prev=>prev.map(u=>u.role===clean?{...u,role:"member"}:u))
    setTeams(prev=>prev.map(t=>{
      if (t.teamId!==FIXED_TEAM_ID) return t
      const nextRoles = (t.roles||[]).filter(r=>r!==clean)
      const rp = { ...(t.rolePermissions||defaultRolePermissions()) }
      delete rp[clean]
      return { ...t, roles:nextRoles, rolePermissions:rp }
    }))
    return { ok:true }
  }

  const assignUserRole = (userIdValue, role) => {
    const roleLower = String(currentUser?.role || "").toLowerCase()
    if (!["ceo","admin","management"].includes(roleLower)) return { ok:false, error:"Only CEO, Admin, or Management can assign roles." }
    const cleanRole = String(role||"").trim().toLowerCase()
    if (!cleanRole) return { ok:false, error:"Invalid role." }
    if (userIdValue===FIXED_CEO_USER.id && cleanRole!=="ceo") return { ok:false, error:"CEO role is fixed." }
    if (!currentTeam?.roles?.includes(cleanRole) && cleanRole!=="ceo") return { ok:false, error:"Role not in team role list." }
    setUsers(prev=>prev.map(u=>u.id!==userIdValue?u:{...u,role:cleanRole}))
    return { ok:true }
  }

  const updateRolePermission = (role, page, action, value) => {
    if (!isCurrentCeo) return { ok:false, error:"Only the CEO can change permissions." }
    if (!PAGE_KEYS.includes(page) || !ACTION_KEYS.includes(action)) return { ok:false, error:"Invalid permission target." }
    const cleanRole = String(role||"").trim().toLowerCase()
    if (!cleanRole) return { ok:false, error:"Invalid role." }
    setTeams(prev=>prev.map(t=>{
      if (t.teamId!==FIXED_TEAM_ID) return t
      const rp = { ...(t.rolePermissions || defaultRolePermissions()) }
      if (!rp[cleanRole]) rp[cleanRole] = Object.fromEntries(PAGE_KEYS.map(p=>[p, fullPerms()]))
      rp[cleanRole] = { ...rp[cleanRole], [page]: { ...(rp[cleanRole][page] || fullPerms()), [action]: !!value } }
      return { ...t, rolePermissions: rp }
    }))
    return { ok:true }
  }


  const deleteProp = (id) => { if(!window.confirm("Remove this property?")) return; setProps(p=>p.filter(x=>x.id!==id)); if(selected===id) setSelected(null) }


  const handlePhotos = (id, files) => {
    Array.from(files).forEach(file=>{
      const r=new FileReader(); r.onload=e=>{
        setProps(prev=>prev.map(p=>p.id!==id?p:{...p,photos:[...(p.photos||[]),{id:uid(),name:file.name,data:e.target.result,date:now(),note:""}]}))
      }; r.readAsDataURL(file)
    })
  }


  const enablePush = async () => {
    const result = await requestPushPermission()
    if (result === "granted") { setPushEnabled(true); fireNotif("schedule","Push Notifications On","JLCMS will now send browser alerts to this device.",[]) }
    else alert("Push notifications blocked. Please enable them in your browser settings, then refresh.")
  }


  const unreadCount = notifications.filter(n=>!n.read && n.recipients.includes(activeUser)).length
  const selProp = props.find(p=>p.id===selected)
  const clientMap = Object.fromEntries(clients.map(c=>[c.id, c]))
  const currentTeam = currentUser ? teams.find(t=>t.teamId===currentUser.teamId) : null
  const teamUsers = users.filter(u=>u.teamId===currentUser?.teamId && u.approved)
  const isCurrentAdmin = currentUser ? ["admin","ceo","management"].includes((currentUser.role||"").toLowerCase()) : false
  const isCurrentCeo = currentUser ? (currentUser.role||"").toLowerCase()==="ceo" : false
  const showRoleRequiredAlert = useCallback(() => {
    window.alert("You currently have view-only access. Ask management or the CEO to assign your role and permissions.")
  }, [])
  const can = useCallback((page, action="view") => {
    if (!currentUser || !currentTeam) return false
    if ((currentUser.role||"").toLowerCase()==="ceo") return true
    const role = (currentUser.role || "member").toLowerCase()
    if (role==="member" && action!=="view") return false
    const rp = currentTeam.rolePermissions || {}
    const pagePerm = rp?.[role]?.[page]
    if (!pagePerm) return true
    return pagePerm[action] !== false
  }, [currentUser, currentTeam])

  const markJobComplete = useCallback((propId) => {
    setProps(prev=>prev.map(p=>p.id!==propId ? p : normalizeProp({
      ...p,
      isCompleted:true,
      completedAt:p.completedAt || now()
    })))
  }, [])

  const createInvoiceFromJob = useCallback((propId) => {
    const prop = props.find(p=>p.id===propId)
    if (!prop || !prop.isCompleted || !prop.clientId || prop.invoiceId) return null
    const client = clients.find(c=>c.id===prop.clientId)
    if (!client) return null
    const invId = `INV-${Date.now().toString().slice(-6)}`
    const invoice = {
      id:uid(),
      invoiceId:invId,
      propertyId:prop.id,
      propertyAddress:prop.address,
      clientId:client.id,
      clientName:client.name || "",
      clientEmail:client.email || "",
      createdAt:now(),
      status:"Draft",
      lineItems:[emptyLineItem()],
      taxPct:8.25,
      notes:""
    }
    setInvoices(prev=>[invoice, ...prev])
    setProps(prev=>prev.map(p=>p.id!==propId ? p : normalizeProp({
      ...p,
      invoiceId:invoice.id,
      invoiceStatus:"Draft"
    })))
    setSelectedInvoiceId(invoice.id)
    return invoice
  }, [props, clients])

  const updateInvoice = useCallback((invoiceId, updates) => {
    let latest = null
    setInvoices(prev=>prev.map(inv=>{
      if (inv.id!==invoiceId) return inv
      latest = { ...inv, ...updates }
      return latest
    }))
    if (!latest) return
    setProps(prev=>prev.map(p=>p.invoiceId!==invoiceId ? p : normalizeProp({
      ...p,
      invoiceStatus:latest.status
    })))
  }, [])

  const deleteInvoice = useCallback((invoiceId) => {
    setInvoices(prev=>prev.filter(inv=>inv.id!==invoiceId))
    setProps(prev=>prev.map(p=>p.invoiceId!==invoiceId ? p : normalizeProp({
      ...p,
      invoiceId:null,
      invoiceStatus:null
    })))
    setSelectedInvoiceId(prev=>prev===invoiceId ? "" : prev)
  }, [])

  const openPrivateMessage = useCallback((userIdValue) => {
    setChatModePref("dm")
    setChatPeerPref(userIdValue || "")
    setTab("chat")
  }, [])

  const billingCounts = {
    readyForInvoice: props.filter(p=>p.isCompleted && p.clientId && !p.invoiceId).length,
    draft: invoices.filter(inv=>inv.status==="Draft").length,
    sent: invoices.filter(inv=>inv.status==="Sent").length,
    paid: invoices.filter(inv=>inv.status==="Paid").length
  }

  const dashboardProps = [...props]
    .filter(p => {
      const search = dashSearch.trim().toLowerCase()
      const vendorNames = (p.assignedVendors||[]).map(id=>vendors.find(v=>v.id===id)?.company||"").join(" ")
      const inspectorNames = (p.assignedInspectors||[]).map(id=>inspectors.find(i=>i.id===id)?.name||"").join(" ")
      const clientName = clientMap[p.clientId]?.name || ""
      const haystack = `${p.address} ${p.permitNumber||""} ${p.hcadNumber||""} ${p.submittedTo||""} ${clientName} ${vendorNames} ${inspectorNames}`.toLowerCase()
      const matchesSearch = !search || haystack.includes(search)
      const matchesStatus = dashStatus==="All" || p.permitStatus===dashStatus
      const matchesWork = dashWorkType==="All" || p.workType===dashWorkType
      const matchesVendor = dashVendor==="All" || (p.assignedVendors||[]).includes(dashVendor)
      const matchesInspector = dashInspector==="All" || (p.assignedInspectors||[]).includes(dashInspector)
      const matchesClient = dashClient==="All" || p.clientId===dashClient
      const isReady = p.permitStatus==="Approved"&&p.electric&&p.gas&&p.water
      const matchesReady = !dashReadyOnly || isReady
      return matchesSearch && matchesStatus && matchesWork && matchesVendor && matchesInspector && matchesClient && matchesReady
    })
    .sort((a,b)=>{
      if (dashSort === "oldest") return new Date(a.createdAt||0)-new Date(b.createdAt||0)
      return new Date(b.createdAt||0)-new Date(a.createdAt||0)
    })
  const readyDashboardProps = dashboardProps.filter(isPropReady)

  useEffect(() => {
    if (!selProp) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [selProp])

  useEffect(() => {
    if (!currentUser) return
    const fresh = users.find(u=>u.id===currentUser.id)
    if (!fresh) {
      setCurrentUser(null)
      return
    }
    if ((fresh.activeSessionId || null) !== (currentUser.activeSessionId || null)) {
      setCurrentUser(null)
      return
    }
    if (
      fresh.approved !== currentUser.approved ||
      fresh.name !== currentUser.name ||
      fresh.email !== currentUser.email ||
      fresh.teamId !== currentUser.teamId ||
      fresh.role !== currentUser.role ||
      fresh.lastLoginAt !== currentUser.lastLoginAt
    ) {
      setCurrentUser(fresh)
    }
  }, [users, currentUser])

  useEffect(() => {
    if (currentUser?.id) setActiveUser(currentUser.id)
  }, [currentUser?.id])

  useEffect(() => {
    if (!users.length) return
    setMessages(prev => {
      const cleaned = sanitizeMessages(prev, users)
      return cleaned.length===prev.length ? prev : cleaned
    })
  }, [users])

  useEffect(() => {
    if (!users.length || !recurringWeeklySchedule.length) return
    const teamMembers = users.filter(u=>u.teamId===FIXED_TEAM_ID && u.approved)
    if (!teamMembers.length) return
    let changed = false
    const migrated = recurringWeeklySchedule.map(entry => {
      if (entry.userId) return entry
      const roleMatch = teamMembers.find(u => String(u.role || "").toLowerCase() === String(entry.role || "").toLowerCase())
      const fallback = teamMembers[0]
      const userIdValue = roleMatch?.id || fallback?.id || ""
      if (!userIdValue) return entry
      changed = true
      return {
        id: entry.id || uid(),
        userId: userIdValue,
        day: entry.day || "Mon",
        start: entry.start || "08:00 AM",
        end: entry.end || "05:00 PM",
        note: entry.note || entry.label || "Regular Shift",
        createdBy: entry.createdBy || "",
        createdAt: entry.createdAt || now()
      }
    })
    if (changed) setRecurringWeeklySchedule(migrated)
  }, [users, recurringWeeklySchedule])

  useEffect(() => {
    setNotifPanel(false)
    setShowLegend(false)
  }, [tab])

  if (!authLoaded) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0C1117",color:"#9CA3AF",fontFamily:"'Barlow',sans-serif"}}>
        Loading...
      </div>
    )
  }

  if (!currentUser) {
    return <AuthScreen onLogin={login} onSignup={signup} />
  }

  if (!currentUser.approved) {
    return <WaitingApprovalScreen currentUser={currentUser} team={currentTeam} onLogout={logout} />
  }


  return (
      <div style={{
        fontFamily:"'Barlow',sans-serif",
        background:UI.appBg,
        minHeight:"100vh",
        color:UI.text,

        overflowX:"hidden",
        width:"100%",
        maxWidth:"100%",

        paddingBottom:92
      }}>
      <FontLink/>
      {/* ---- TOP RIGHT CONTROLS (NON-FLOATING) ---- */}
      <div style={{
        display:"flex",
        justifyContent:"flex-end",
        gap:8,
        padding:"12px 16px",
        background:"#111A27",
        borderBottom:"1px solid #243246",
        boxShadow:"0 4px 20px rgba(2,8,20,0.35)"
      }}>

        {/* Notifications */}
        <button
          onClick={()=>{
            setShowLegend(false)
            setNotifPanel(v=>!v)
            setNotifications(prev=>prev.map(n=>n.recipients.includes(activeUser)?{...n,read:true}:n))
          }}
          style={{
            background:"#1A2332",
            border:"1px solid #4B5563",
            color:"#F9FAFB",
            borderRadius:8,
            padding:"7px 12px",
            fontSize:12,
            fontWeight:700,
            letterSpacing:0.6,
            cursor:"pointer",
            position:"relative"
          }}
        >
          Alerts
          {unreadCount>0&&(
            <span style={{
              position:"absolute",
              top:-4,
              right:-4,
              background:"#F87171",
              color:"#fff",
              borderRadius:"50%",
              width:16,
              height:16,
              fontSize:10,
              display:"flex",
              alignItems:"center",
              justifyContent:"center"
            }}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* KEY */}
        <button
          onClick={()=>{
            setNotifPanel(false)
            setShowLegend(v=>!v)
          }}
          style={{
          background:"#1A2332",
          border:"1px solid #4B5563",
          color:"#F9FAFB",
          borderRadius:8,
          padding:"7px 12px",
          fontSize:12,
          fontWeight:700,
          letterSpacing:0.6,
          cursor:"pointer"
        }}
        >
          KEY
        </button>

      </div>

      {/* ---- TOAST STACK ---- */}
      <div style={{position:"fixed",bottom:24,right:24,zIndex:1000,display:"flex",flexDirection:"column",gap:10,maxWidth:340}}>
        {toasts.filter(t=>(t.recipients||[]).includes(activeUser)).map(t=>{
          const nt = NOTIF_TYPES[t.type] || NOTIF_TYPES.schedule
          return(
            <div key={t.id} className="notif-in" style={{background:"#111827",border:`1px solid ${nt.color}`,borderLeft:`4px solid ${nt.color}`,borderRadius:8,padding:"10px 14px",boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:nt.color,padding:"1px 6px",border:`1px solid ${nt.color}`,borderRadius:6}}>{nt.icon}</span>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,color:nt.color,letterSpacing:1}}>{cleanUiText(t.title)}</span>
              </div>
              <div style={{fontSize:12,color:"#9CA3AF",lineHeight:1.4}}>{cleanUiText(t.body)}</div>
            </div>
          )
        })}
      </div>


      


      {/* ---- NOTIFICATION PANEL ---- */}
      {notifPanel&&(
        <div className="slide-in" style={{
              position:"fixed",
              top:52,
              right:0,

              width: isMobile ? "100%" : 380,
              maxWidth:"100%",

              background:"#111827",
              borderLeft:"2px solid #1D4ED8",

              height:"calc(100vh - 52px)",
              overflowY:"auto",

              zIndex:200,
              display:"flex",
              flexDirection:"column"
            }}>
          <div style={{padding:"16px 20px",borderBottom:"1px solid #1F2937",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:"#60A5FA",letterSpacing:2}}>NOTIFICATIONS</div>
              <div style={{fontSize:11,color:"#6B7280",marginTop:2,fontFamily:"'IBM Plex Mono',monospace"}}>
                Showing alerts for {users.find(t=>t.id===activeUser)?.name || currentUser?.name || "Current User"}
              </div>
            </div>
            <div style={{
              display:"flex",
              gap:8,
              flexWrap:"wrap"
            }}>
              {!pushEnabled&&(
                <button 
                  onClick={enablePush} 
                  style={{...btnBlue,fontSize:11,padding:"4px 10px"}}
                >
                  Enable Push
                </button>
              )}

              <button 
                onClick={()=>setNotifications([])} 
                style={{...btnGray,fontSize:11,padding:"4px 10px"}}
              >
                Clear All
              </button>

              <button 
                onClick={()=>setNotifPanel(false)}
                style={{...btnGray,fontSize:11,padding:"4px 10px"}}
              >
                Close
              </button>
            </div>
          </div>


          {/* Push status */}
          <div style={{padding:"8px 20px",background: pushEnabled?"#002D1A":"#2D1200",borderBottom:"1px solid #1F2937",fontSize:11,color:pushEnabled?"#34D399":"#FB923C",fontFamily:"'IBM Plex Mono',monospace"}}>
            {pushEnabled ? "Browser push notifications active on this device" : "Push notifications not enabled - click 'Enable Push' above"}
          </div>


          {/* Notification list */}
          <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
            {notifications.filter(n=>n.recipients.includes(activeUser)).length===0&&(
              <div style={{textAlign:"center",padding:40,color:"#4B5563",fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,letterSpacing:2}}>NO NOTIFICATIONS</div>
            )}
            {notifications.filter(n=>n.recipients.includes(activeUser)).map(n=>{
              const nt = NOTIF_TYPES[n.type] || NOTIF_TYPES.schedule
              return(
                <div key={n.id} style={{padding:"10px 20px",borderBottom:"1px solid #1F2937",borderLeft:`3px solid ${n.read?"#374151":nt.color}`,background:n.read?"transparent":"#0F1923"}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:nt.color,padding:"1px 6px",border:`1px solid ${nt.color}`,borderRadius:6}}>{nt.icon}</span>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,color:nt.color,letterSpacing:1,flex:1}}>{cleanUiText(n.title)}</span>
                    <span style={{fontSize:10,color:"#4B5563",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>{fmtT(n.time)}</span>
                  </div>
                  <div style={{fontSize:12,color:"#9CA3AF",lineHeight:1.4,paddingLeft:22}}>{cleanUiText(n.body)}</div>
                  <div style={{display:"flex",gap:4,marginTop:6,paddingLeft:22}}>
                    {n.recipients.map(r=>{
                      const tm = users.find(t=>t.id===r)
                      return tm ? <span key={r} style={{fontSize:10,color:"#93C5FD",background:"#1D4ED833",padding:"1px 6px",borderRadius:10,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{tm.name}</span> : null
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}


      {/* ---- LEGEND ---- */}
      {showLegend && !notifPanel && (
  <>
        {/* BACKDROP (click to close) */}
        <div
          onClick={()=>setShowLegend(false)}
          style={{
            position:"fixed",
            inset:0,
            background:"rgba(0,0,0,0.6)",
            zIndex:199
          }}
        />

        {/* PANEL */}
        <div
          className="slide-in"
          style={{
            position:"fixed",
            top:52,
            right: isMobile ? "5%" : 0,

            width: isMobile ? "90%" : 360,
            maxWidth:"100%",

            height: isMobile ? "auto" : "calc(100vh - 52px)",
            maxHeight: isMobile ? "80vh" : "100%",

            overflowY:"auto",

            background:"#111827",
            borderLeft:"2px solid #1D4ED8",
            borderRadius: isMobile ? 10 : 0,

            zIndex:200,
            padding:20
          }}
        >
          <div style={{
            fontFamily:"'Barlow Condensed',sans-serif",
            fontWeight:900,
            fontSize:22,
            color:"#60A5FA",
            letterSpacing:2,
            marginBottom:16
          }}>
            STATUS KEY
          </div>

          {LEGEND_ITEMS.map(it=>(
            <div key={it.status} style={{
              background:"#1F2937",
              borderLeft:`4px solid ${it.color}`,
              borderRadius:4,
              padding:"10px 14px",
              marginBottom:10
            }}>
              <div style={{
                fontFamily:"'Barlow Condensed',sans-serif",
                fontWeight:700,
                fontSize:16,
                color:it.color,
                letterSpacing:1,
                marginBottom:4
              }}>
                {it.status}
              </div>
              <div style={{
                fontSize:13,
                color:"#D1D5DB",
                lineHeight:1.5
              }}>
                {it.def}
              </div>
            </div>
          ))}

          <div style={{
            marginTop:20,
            borderTop:"1px solid #374151",
            paddingTop:16
          }}>
            <div style={{
              fontFamily:"'Barlow Condensed',sans-serif",
              fontWeight:900,
              fontSize:16,
              color:"#F97316",
              letterSpacing:2,
              marginBottom:8
            }}>
              NOTIFICATION ROUTING
            </div>

            {Object.entries(NOTIF_TYPES).map(([k,v])=>(
              <div key={k} style={{
                display:"flex",
                gap:10,
                padding:"5px 0",
                borderBottom:"1px solid #1F2937",
                fontSize:12
              }}>
                <span style={{color:v.color,minWidth:24}}>{v.icon}</span>

                <span style={{
                  color:v.color,
                  fontWeight:700,
                  minWidth:80,
                  fontFamily:"'Barlow Condensed',sans-serif",
                  letterSpacing:1
                }}>
                  {v.label}
                </span>

                <span style={{color:"#9CA3AF"}}>All Approved Team Members</span>
              </div>
            ))}
          </div>
        </div>
      </>
    )}

      {/* ========================== TAB ROUTING (HOME / CLIENTS / MORE) ========================== */}
      {tab==="home" && <HomeTab props={props} invoices={invoices} billingCounts={billingCounts} setTab={setTab} currentUser={currentUser} />}
      {tab==="chat" && (can("chat","view") ? <ChatTab currentUser={currentUser} users={users} messages={messages} setMessages={setMessages} modePref={chatModePref} peerPref={chatPeerPref} onModePrefApplied={()=>{ setChatModePref("team"); setChatPeerPref("") }} /> : <AccessDenied page="Chat" />)}
      {tab==="team" && (can("team","view") ? <TeamTab currentUser={currentUser} users={users} onMessage={openPrivateMessage} /> : <AccessDenied page="Team" />)}
      {tab==="clients" && (can("clients","view") ? <ClientsTab clients={clients} setClients={setClients} props={props} setProps={setProps} canAdd={can("clients","add")} canEdit={can("clients","edit")} canDelete={can("clients","delete")} /> : <AccessDenied page="Clients" />)}
      {tab==="invoices" && (can("invoices","view") ? <InvoicesTab invoices={invoices} props={props} clients={clients} selectedInvoiceId={selectedInvoiceId} setSelectedInvoiceId={setSelectedInvoiceId} onUpdateInvoice={updateInvoice} onDeleteInvoice={deleteInvoice} canAdd={can("invoices","add")} canEdit={can("invoices","edit")} canDelete={can("invoices","delete")} /> : <AccessDenied page="Invoices" />)}
      {tab==="more" && (can("more","view") ? <MoreTab currentUser={currentUser} currentTeam={currentTeam} users={users} isCurrentAdmin={isCurrentAdmin} isCurrentCeo={isCurrentCeo} onApprove={approveTeamRequest} onDeny={denyTeamRequest} onUpdateInviteCode={updateTeamInviteCode} onForceLogoutUser={forceLogoutTeamUser} onRemoveUser={removeTeamUser} onUpdateProfile={updateCurrentProfile} onUpdateCompanyName={updateCompanyName} onCreateTeamRole={createTeamRole} onRenameTeamRole={renameTeamRole} onDeleteTeamRole={deleteTeamRole} onAssignUserRole={assignUserRole} onUpdateRolePermission={updateRolePermission} onLogout={logout} /> : <AccessDenied page="More" />)}

      {/* == DASHBOARD == */}
      {tab==="dashboard"&&(can("dashboard","view") ? (
        <div style={{
            display: isMobile ? "block" : "flex",
            height: isMobile ? "auto" : "calc(100vh - 52px)"
          }}>
          <div style={{
            display: isMobile ? "block" : "flex",
            height: isMobile ? "auto" : "calc(100vh - 52px)"
          }}>
            {bulkOpen&&<BulkImportModal onClose={()=>setBulkOpen(false)} vendors={vendors} onImport={(rows)=>{ setProps(prev=>[...rows.map(normalizeProp),...prev]); setBulkOpen(false); fireNotif("job",`${rows.length} Job Orders Imported`,`Bulk import complete - ${rows.length} properties added`,[]) }}/>}


            {/* toolbar */}
            <div style={{padding:"12px 16px",background:"#111827",borderBottom:"1px solid #1F2937",position:"sticky",top:0,zIndex:50,display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#6B7280"}}>{dashboardProps.length} OF {props.length} PROPERTIES</span>
                <div style={{flex:1}}/>
                {addOpen?(
                  <div style={{
                      display:"flex",
                      gap:8,
                      alignItems:"center",
                      flexWrap: isMobile ? "wrap" : "nowrap",
                      width: isMobile ? "100%" : "auto"
                    }}>
                  <input value={newAddr} onChange={e=>setNewAddr(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addProperty()}
                    placeholder="Enter full property address..." autoFocus
                    style={{...iStyle,width: isMobile ? "100%" : 340}}
                    disabled={!can("dashboard","add")}
                  />
                    <button onClick={addProperty} style={btnOrange} disabled={!can("dashboard","add")}>ADD</button>
                    <button onClick={()=>{setAddOpen(false);setNewAddr("")}} style={btnGray}>Cancel</button>
                  </div>
                ):(
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",width: isMobile ? "100%" : "auto"}}>
                    <button onClick={()=>setBulkOpen(true)} style={btnBlue} disabled={!can("dashboard","add")}>Bulk Import</button>
                    <button onClick={()=>setAddOpen(true)} style={btnOrange} disabled={!can("dashboard","add")}>+ Add One</button>
                  </div>
                )}
              </div>

              <div style={{
                display:"grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr repeat(6,minmax(0,1fr))",
                gap:8
              }}>
                <input
                  value={dashSearch}
                  onChange={e=>setDashSearch(e.target.value)}
                  placeholder="Search address, permit #, HCAD, client, contractor, inspector..."
                  style={{...iStyle,gridColumn:isMobile?"1 / -1":"auto"}}
                />
                <select value={dashSort} onChange={e=>setDashSort(e.target.value)} style={iStyle}>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
                <select value={dashStatus} onChange={e=>setDashStatus(e.target.value)} style={iStyle}>
                  <option value="All">All Statuses</option>
                  {PERMIT_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <select value={dashWorkType} onChange={e=>setDashWorkType(e.target.value)} style={iStyle}>
                  <option value="All">All Job Types</option>
                  {WORK_TYPES.slice(1).map(w=><option key={w} value={w}>{w}</option>)}
                </select>
                <select value={dashVendor} onChange={e=>setDashVendor(e.target.value)} style={iStyle}>
                  <option value="All">All Contractors</option>
                  {vendors.map(v=><option key={v.id} value={v.id}>{v.company}</option>)}
                </select>
                <select value={dashInspector} onChange={e=>setDashInspector(e.target.value)} style={iStyle}>
                  <option value="All">All Inspectors</option>
                  {inspectors.map(ins=><option key={ins.id} value={ins.id}>{ins.name}</option>)}
                </select>
                <select value={dashClient} onChange={e=>setDashClient(e.target.value)} style={iStyle}>
                  <option value="All">All Clients</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#9CA3AF"}}>
                <input type="checkbox" checked={dashReadyOnly} onChange={e=>setDashReadyOnly(e.target.checked)} />
                Ready to mobilize only
              </label>

              {(dashSearch || dashStatus!=="All" || dashWorkType!=="All" || dashVendor!=="All" || dashInspector!=="All" || dashClient!=="All" || dashSort!=="newest" || dashReadyOnly) && (
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:11,color:"#6B7280",textTransform:"uppercase",letterSpacing:0.8}}>Active Filters</span>
                  {dashSearch && <span style={{background:"#0C1117",border:"1px solid #1F2937",color:"#9CA3AF",borderRadius:999,padding:"2px 8px",fontSize:11}}>Search</span>}
                  {dashStatus!=="All" && <span style={{background:"#0C1117",border:"1px solid #1F2937",color:"#9CA3AF",borderRadius:999,padding:"2px 8px",fontSize:11}}>Status: {dashStatus}</span>}
                  {dashWorkType!=="All" && <span style={{background:"#0C1117",border:"1px solid #1F2937",color:"#9CA3AF",borderRadius:999,padding:"2px 8px",fontSize:11}}>Job: {dashWorkType}</span>}
                  {dashVendor!=="All" && <span style={{background:"#0C1117",border:"1px solid #1F2937",color:"#9CA3AF",borderRadius:999,padding:"2px 8px",fontSize:11}}>Contractor</span>}
                  {dashInspector!=="All" && <span style={{background:"#0C1117",border:"1px solid #1F2937",color:"#9CA3AF",borderRadius:999,padding:"2px 8px",fontSize:11}}>Inspector</span>}
                  {dashClient!=="All" && <span style={{background:"#0C1117",border:"1px solid #1F2937",color:"#9CA3AF",borderRadius:999,padding:"2px 8px",fontSize:11}}>Client</span>}
                  {dashSort!=="newest" && <span style={{background:"#0C1117",border:"1px solid #1F2937",color:"#9CA3AF",borderRadius:999,padding:"2px 8px",fontSize:11}}>Sort: Oldest</span>}
                  {dashReadyOnly && <span style={{background:"#0C1117",border:"1px solid #1F2937",color:"#9CA3AF",borderRadius:999,padding:"2px 8px",fontSize:11}}>Ready only</span>}
                </div>
              )}
            </div>


            {/* cards */}
            <div style={{
              padding:12,
              display:"grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(340px,1fr))",
              gap:12,
              alignContent:"start"
            }}>

              {dashboardProps.length === 0 && (
                <div style={{
                  ...cardStyle,
                  textAlign:"center",
                  color:"#6B7280",
                  padding:40,
                  gridColumn:"1 / -1"
                }}>
                  NO MATCHING PROPERTIES
                </div>
              )}

              {dashboardProps.map((p, idx) => {
                const sm = STATUS_META[p.permitStatus] || STATUS_META["--"]
                const isReady = isPropReady(p)
                const billingMeta = getBillingMeta(p, invoices)
                const primaryVendor = vendors.find(v=>p.assignedVendors?.includes(v.id))
                const primaryInspector = inspectors.find(ins=>(p.assignedInspectors||[]).includes(ins.id))
                const assignedClient = clients.find(c=>c.id===p.clientId)
                const hours = p.permitStatus==="Started" ? hoursAgo(p.startedAt) : null
                const overdue = hours && parseFloat(hours) > 20

                return (
                  <div
                    key={p.id}
                    onClick={()=>setSelected(selected===p.id?null:p.id)}
                    style={{
                      ...cardStyle,
                      borderLeft:`4px solid ${isReady ? "#34D399" : sm.color}`,
                      cursor:"pointer",
                      background:selected===p.id ? "#0F1923" : UI.card
                    }}
                  >
                    <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:10}}>
                      <div>
                        <div style={{...sectionLabel,marginBottom:4}}>Job {String(idx+1).padStart(2,"0")}</div>
                        <div style={{fontWeight:700,fontSize:15,color:isReady?UI.success:UI.text}}>{p.address}</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                        <span style={{background:sm.bg,color:sm.color,padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>
                          {p.permitStatus}
                        </span>
                        <span style={{background:billingMeta.bg,color:billingMeta.color,padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>
                          {billingMeta.label}
                        </span>
                        <span style={{background:"#0C1117",color:"#9CA3AF",padding:"2px 8px",borderRadius:6,fontSize:11}}>
                          {p.workType}
                        </span>
                      </div>
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10,marginBottom:10}}>
                      <div>
                        <div style={sectionLabel}>Permit</div>
                        <input value={p.permitNumber||""} onChange={e=>updateProp(p.id,"permitNumber",e.target.value)} style={iStyle} disabled={!can("dashboard","edit")}/>
                      </div>
                      <div>
                        <div style={sectionLabel}>HCAD</div>
                        <input value={p.hcadNumber||""} onChange={e=>updateProp(p.id,"hcadNumber",e.target.value)} style={iStyle} disabled={!can("dashboard","edit")}/>
                      </div>
                      <div>
                        <div style={sectionLabel}>Work Type</div>
                        <select value={p.workType} onChange={e=>updateProp(p.id,"workType",e.target.value)} style={iStyle} disabled={!can("dashboard","edit")}>
                          {WORK_TYPES.map(w=><option key={w}>{w}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={sectionLabel}>Status</div>
                        <select value={p.permitStatus} onChange={e=>updateProp(p.id,"permitStatus",e.target.value)} style={iStyle} disabled={!can("dashboard","edit")}>
                          {PERMIT_STATUSES.map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{marginBottom:10}}>
                      <div style={sectionLabel}>Submitted To</div>
                      <input value={p.submittedTo||""} onChange={e=>updateProp(p.id,"submittedTo",e.target.value)} style={iStyle} disabled={!can("dashboard","edit")}/>
                    </div>

                    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
                      {[["electric","Electric"],["gas","Gas"],["water","Water"]].map(([u,label])=>(
                        <label key={u} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#D1D5DB"}}>
                          <input type="checkbox" checked={p[u]||false} onChange={e=>updateProp(p.id,u,e.target.checked)} disabled={!can("dashboard","edit")}/>
                          {label}
                        </label>
                      ))}
                    </div>

                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <div style={{fontSize:12,color:"#9CA3AF"}}>
                        24hr: {hours?`${hours}h${overdue?" (near deadline)":""}` :"--"} | Client: {assignedClient?.name || "--"} | Contractor: {primaryVendor?.code || "--"} | Inspector: {primaryInspector?.name || "--"} | Photos: {p.photos?.length || "--"}
                      </div>
                      <button
                        onClick={(e)=>{e.stopPropagation(); deleteProp(p.id)}}
                        style={{...buttonStyle,padding:"6px 10px",fontSize:12}}
                        disabled={!can("dashboard","delete")}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>


            {readyDashboardProps.length>0&&(
              <div style={{background:"#111827",borderTop:"2px solid #34D399",padding:"10px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:"#34D399",letterSpacing:2}}>READY TO MOBILIZE</span>
                {readyDashboardProps.map(p=><span key={p.id} style={{background:"#022C16",border:"1px solid #34D399",borderRadius:4,padding:"3px 10px",fontSize:12,color:"#6EE7B7"}}>{p.address}</span>)}
              </div>
            )}
          </div>


          {selProp && (
            <>
              <div
                onClick={()=>setSelected(null)}
                style={{
                  position:"fixed",
                  inset:0,
                  background:"rgba(0,0,0,0.6)",
                  zIndex:330
                }}
              />
              <div
                className="slide-in"
                style={{
                  width: isMobile ? "100%" : 460,
                  maxWidth:"100%",
                  position:"fixed",
                  top:52,
                  right:0,
                  height:"calc(100vh - 128px)",
                  background:"#111827",
                  borderLeft:"2px solid #1F2937",
                  overflowY:"auto",
                  zIndex:340,
                  flexShrink:0
                }}
              >
                <PropertyPanel
                  prop={selProp}
                  update={updateProp}
                  onClose={()=>setSelected(null)}
                  onPhotos={handlePhotos}
                  vendors={vendors}
                  inspectors={inspectors}
                  clients={clients}
                  invoices={invoices}
                  onMarkComplete={markJobComplete}
                  onCreateInvoice={createInvoiceFromJob}
                  canCreateInvoice={can("invoices","add")}
                  onOpenInvoicesTab={()=>{
                    setTab("invoices")
                    setSelected(null)
                  }}
                />
              </div>
            </>
          )}
        </div>
      ) : <AccessDenied page="Dashboard" />)}

      
      
      {/* == SCHEDULE TAB == */}
      {tab==="schedule"&&(can("schedule","view") ? <ScheduleTab activeUser={activeUser} currentUser={currentUser} teamUsers={teamUsers} notifications={notifications} fireNotif={fireNotif} recurringWeeklySchedule={recurringWeeklySchedule} setRecurringWeeklySchedule={setRecurringWeeklySchedule} oneOffScheduleBlocks={oneOffScheduleBlocks} setOneOffScheduleBlocks={setOneOffScheduleBlocks} tasks={tasks} setTasks={setTasks} properties={props} clients={clients} canAdd={can("schedule","add")} canEdit={can("schedule","edit")} canDelete={can("schedule","delete")} canManagePermanent={can("permanentSchedule","add")} /> : <AccessDenied page="Schedule" />)}


      {tab==="vendors"&&(can("vendors","view") ? <VendorTab vendors={vendors} setVendors={setVendors} canAdd={can("vendors","add")} canEdit={can("vendors","edit")} canDelete={can("vendors","delete")} /> : <AccessDenied page="Vendors" />)}
      {tab==="inspectors"&&(can("inspectors","view") ? <InspectorTab inspectors={inspectors} setInspectors={setInspectors} canAdd={can("inspectors","add")} canEdit={can("inspectors","edit")} canDelete={can("inspectors","delete")} /> : <AccessDenied page="Inspectors" />)}
      {tab==="mileage"&&(can("mileage","view") ? <MileageTab mileage={mileage} setMileage={setMileage} addMileage={e=>setMileage(prev=>[{id:uid(),...e,date:now()},...prev])} properties={props} canAdd={can("mileage","add")} canDelete={can("mileage","delete")} /> : <AccessDenied page="Mileage" />)}

      {/* ========================== BOTTOM NAVIGATION ========================== */}
      <div style={{
        position:"fixed",
        bottom:0,
        left:0,
        width:"100%",
        background:"rgba(17,26,39,0.94)",
        borderTop:"1px solid #2B3A4E",
        backdropFilter:"blur(8px)",
        display:"flex",
        justifyContent:"space-around",
        gap:8,
        padding:"10px 10px max(10px, env(safe-area-inset-bottom))",
        zIndex:300
      }}>
        <button
        onClick={()=>setTab("home")}
        style={{
          ...buttonStyle,
          background:tab==="home" ? "#0B1220" : "#111827",
          border:tab==="home" ? "1px solid #334155" : "1px solid #1F2937",
          color:tab==="home" ? "#F97316" : "#9CA3AF",
          fontSize:12,
          fontWeight:600,
          padding:"8px 12px",
          borderRadius:10
        }}
      >
        Home
      </button>

      <button
        onClick={()=>setTab("dashboard")}
        style={{
          ...buttonStyle,
          background:tab==="dashboard" ? "#0B1220" : "#111827",
          border:tab==="dashboard" ? "1px solid #334155" : "1px solid #1F2937",
          color:tab==="dashboard" ? "#F97316" : "#9CA3AF",
          fontSize:12,
          fontWeight:600,
          padding:"8px 12px",
          borderRadius:10
        }}
      >
        Dashboard
      </button>

      <button
        onClick={()=>setTab("chat")}
        style={{
          ...buttonStyle,
          background:tab==="chat" ? "#0B1220" : "#111827",
          border:tab==="chat" ? "1px solid #334155" : "1px solid #1F2937",
          color:tab==="chat" ? "#F97316" : "#9CA3AF",
          fontSize:12,
          fontWeight:600,
          padding:"8px 12px",
          borderRadius:10
        }}
      >
        Chat
      </button>

      <button
        onClick={()=>setTab("clients")}
        style={{
          ...buttonStyle,
          background:tab==="clients" ? "#0B1220" : "#111827",
          border:tab==="clients" ? "1px solid #334155" : "1px solid #1F2937",
          color:tab==="clients" ? "#F97316" : "#9CA3AF",
          fontSize:12,
          fontWeight:600,
          padding:"8px 12px",
          borderRadius:10
        }}
      >
        Clients
      </button>

      <button
        onClick={()=>setTab("more")}
        style={{
          ...buttonStyle,
          background:tab==="more" ? "#0B1220" : "#111827",
          border:tab==="more" ? "1px solid #334155" : "1px solid #1F2937",
          color:tab==="more" ? "#F97316" : "#9CA3AF",
          fontSize:12,
          fontWeight:600,
          padding:"8px 12px",
          borderRadius:10
        }}
      >
        More
      </button>
      </div>

      </div>
      )
      }

/* ========================== HOME TAB (SYSTEM STYLE) ========================== */
function HomeTab({ props, invoices, billingCounts, setTab, currentUser }) {
  const { isPhone: isMobile, isTablet } = viewportInfo()

  const ready = props.filter(p =>
    p.permitStatus==="Approved" && p.electric && p.gas && p.water
  )
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening"

  return (
    <div style={pageShell(isTablet ? 1020 : 980)}>

      {/* HEADER */}
      <div style={{marginBottom:24}}>
        <div style={titleStyle}>{greeting}, {currentUser?.name || "User"}</div>
        <div style={{fontSize:13,color:UI.subtext,marginTop:4}}>
          Team workspace overview
        </div>
      </div>

      <div style={{...cardStyle,marginBottom:16,background:"linear-gradient(135deg,#111827 0%,#0F172A 100%)",border:"1px solid #253043"}}>
        <div style={{fontSize:14,color:"#D1D5DB",marginBottom:6}}>Today Focus</div>
        <div style={{fontSize:12,color:"#9CA3AF",lineHeight:1.5}}>
          Keep permit statuses current, clear readiness blockers, and route team updates through chat.
        </div>
      </div>

      {/* STATS */}
      <div style={{
        display:"grid",
        gridTemplateColumns:isMobile ? "1fr" : "repeat(4,minmax(0,1fr))",
        gap:12,
        marginBottom:24
      }}>
        <div style={cardStyle}>
          <div style={sectionLabel}>Properties</div>
          <div style={{fontSize:20,fontWeight:700}}>
            {props.length}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionLabel}>Ready</div>
          <div style={{fontSize:20,fontWeight:700,color:UI.success}}>
            {ready.length}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={sectionLabel}>Blocked</div>
          <div style={{fontSize:20,fontWeight:700,color:"#FBBF24"}}>
            {Math.max(props.length-ready.length,0)}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={sectionLabel}>Invoices</div>
          <div style={{fontSize:20,fontWeight:700,color:"#A78BFA"}}>
            {invoices.length}
          </div>
        </div>
      </div>

      <div style={{...cardStyle,marginBottom:24}}>
        <div style={{...sectionLabel,marginBottom:10}}>Billing Snapshot</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,minmax(0,1fr))",gap:10}}>
          <div style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:6,padding:"10px 12px"}}>
            <div style={{fontSize:11,color:"#9CA3AF"}}>Ready for Invoice</div>
            <div style={{fontSize:20,fontWeight:700,color:"#F97316"}}>{billingCounts.readyForInvoice}</div>
          </div>
          <div style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:6,padding:"10px 12px"}}>
            <div style={{fontSize:11,color:"#9CA3AF"}}>Draft Invoices</div>
            <div style={{fontSize:20,fontWeight:700,color:"#A78BFA"}}>{billingCounts.draft}</div>
          </div>
          <div style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:6,padding:"10px 12px"}}>
            <div style={{fontSize:11,color:"#9CA3AF"}}>Sent Invoices</div>
            <div style={{fontSize:20,fontWeight:700,color:"#60A5FA"}}>{billingCounts.sent}</div>
          </div>
          <div style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:6,padding:"10px 12px"}}>
            <div style={{fontSize:11,color:"#9CA3AF"}}>Paid Invoices</div>
            <div style={{fontSize:20,fontWeight:700,color:"#34D399"}}>{billingCounts.paid}</div>
          </div>
        </div>
      </div>

      {/* QUICK ACCESS */}
      <div style={{marginBottom:24}}>
        <div style={sectionLabel}>Quick Access</div>

        <div style={{
          display:"grid",
          gridTemplateColumns:isMobile ? "1fr" : "1fr 1fr 1fr",
          gap:10
        }}>
          <button style={buttonStyle} onClick={()=>setTab("schedule")}>Schedule</button>
          <button style={buttonStyle} onClick={()=>setTab("vendors")}>Contractors</button>
          <button style={buttonStyle} onClick={()=>setTab("inspectors")}>Inspectors</button>
          <button style={buttonStyle} onClick={()=>setTab("mileage")}>Mileage</button>
          <button style={buttonStyle} onClick={()=>setTab("chat")}>Team Chat</button>
          <button style={buttonStyle} onClick={()=>setTab("team")}>Team</button>
          <button style={buttonStyle} onClick={()=>setTab("invoices")}>Invoices</button>
        </div>
      </div>

      {/* RECENT */}
      <div style={{marginBottom:24}}>
        <div style={sectionLabel}>Recent</div>

        {props.length === 0 ? (
          <div style={cardStyle}>
            <div style={{color:UI.subtext}}>No jobs yet</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {props.slice(0,3).map(p=>(
              <div key={p.id} style={cardStyle}>
                <div style={{fontWeight:600}}>{p.address}</div>
                <div style={{fontSize:12,color:UI.subtext}}>
                  {p.permitStatus}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function AccessDenied({ page }) {
  return (
    <div style={{padding:24,maxWidth:760,margin:"0 auto"}}>
      <div style={{...cardStyle,textAlign:"center"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,color:"#F87171",letterSpacing:1}}>ACCESS RESTRICTED</div>
        <div style={{fontSize:13,color:"#9CA3AF",marginTop:8}}>
          You do not have permission to view {page}.
        </div>
      </div>
    </div>
  )
}

function ChatTab({ currentUser, users, messages, setMessages, modePref="team", peerPref="", onModePrefApplied }) {
  const [mode, setMode] = useState("team")
  const [peerId, setPeerId] = useState("")
  const [chatText, setChatText] = useState("")
  const teammates = users.filter(u=>u.teamId===currentUser?.teamId && u.id!==currentUser?.id && u.approved)
  const activeUsersById = new Map(teammates.concat(currentUser ? [currentUser] : []).map(u=>[u.id, u]))
  const filteredMessages = [...messages]
    .filter(m=>{
      const kind = m.kind || "team"
      const sender = activeUsersById.get(m.senderId)
      if (!sender || !sender.approved) return false
      if (mode==="team") {
        return kind==="team" && m.teamId===currentUser?.teamId && sender.teamId===currentUser?.teamId
      }
      if (!peerId) return false
      const recipient = activeUsersById.get(m.toUserId)
      if (!recipient || !recipient.approved || recipient.teamId!==currentUser?.teamId) return false
      return kind==="dm" && (
        (m.senderId===currentUser?.id && m.toUserId===peerId) ||
        (m.senderId===peerId && m.toUserId===currentUser?.id)
      )
    })
    .sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp))

  useEffect(() => {
    if (modePref==="dm") {
      setMode("dm")
      setPeerId(peerPref || "")
      if (onModePrefApplied) onModePrefApplied()
    }
  }, [modePref, peerPref, onModePrefApplied])

  const sendMessage = () => {
    const text = chatText.trim()
    if (!text || !currentUser) return
    if (mode==="dm" && !peerId) return
    setMessages(prev=>[
      ...prev,
      {
        id:uid(),
        senderId:currentUser.id,
        senderName:currentUser.name,
        senderPhoto:currentUser.profilePic || "",
        message:text,
        timestamp:now(),
        teamId:currentUser.teamId,
        kind: mode==="team" ? "team" : "dm",
        toUserId: mode==="team" ? null : peerId
      }
    ])
    setChatText("")
  }

  return (
    <div style={pageShell(1000)}>
      <div style={{marginBottom:16}}>
        <div style={titleStyle}>Team Chat</div>
        <div style={{fontSize:12,color:"#6B7280",marginTop:4}}>Real-time team thread for your workspace</div>
      </div>

      <div style={{...cardStyle,padding:12}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8,marginBottom:10}}>
          <select value={mode} onChange={e=>setMode(e.target.value)} style={iStyle}>
            <option value="team">Team Chat</option>
            <option value="dm">Private Message</option>
          </select>
          {mode==="dm" && (
            <select value={peerId} onChange={e=>setPeerId(e.target.value)} style={iStyle}>
              <option value="">Choose User</option>
              {teammates.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
        </div>
        <div style={{height:"58vh",overflowY:"auto",border:"1px solid #1F2937",borderRadius:8,padding:10,background:"#0C1117",marginBottom:10}}>
          {filteredMessages.length===0 && (
            <div style={{fontSize:12,color:"#6B7280",textAlign:"center",padding:"20px 0"}}>No team messages yet</div>
          )}
          {filteredMessages.map(msg=>{
            const mine = msg.senderId===currentUser?.id
            const sender = users.find(u=>u.id===msg.senderId)
            const avatar = sender?.profilePic || msg.senderPhoto || ""
            const displayName = sender?.name || msg.senderName
            return (
              <div key={msg.id} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",marginBottom:10}}>
                <div style={{maxWidth:"88%",display:"flex",gap:8,flexDirection:mine?"row-reverse":"row",alignItems:"flex-start"}}>
                  <div style={{width:24,height:24,borderRadius:"50%",overflow:"hidden",border:"1px solid #374151",background:"#111827",flexShrink:0}}>
                    {avatar
                      ? <img src={avatar} alt={displayName} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                      : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#9CA3AF"}}>{(displayName||"?").slice(0,1).toUpperCase()}</div>}
                  </div>
                  <div style={{
                    background:mine?"#1F3A2E":"#111827",
                    border:`1px solid ${mine?"#34D399":"#1F2937"}`,
                    borderRadius:8,
                    padding:"8px 10px"
                  }}>
                    <div style={{fontSize:11,color:mine?"#6EE7B7":"#9CA3AF",marginBottom:4}}>
                      {displayName} | {fmtT(msg.timestamp)}
                    </div>
                    <div style={{fontSize:13,color:"#F9FAFB",lineHeight:1.35,wordBreak:"break-word"}}>{msg.message}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input
            value={chatText}
            onChange={e=>setChatText(e.target.value)}
            onKeyDown={e=>{ if (e.key==="Enter") sendMessage() }}
            placeholder={mode==="team"?"Write a message to your team...":"Write a private message..."}
            style={iStyle}
          />
          <button onClick={sendMessage} style={{...btnBlue,minWidth:84}} disabled={mode==="dm" && !peerId}>Send</button>
        </div>
      </div>
    </div>
  )
}

function TeamTab({ currentUser, users, onMessage }) {
  const { isPhone: isMobile } = viewportInfo()
  const members = users
    .filter(u=>u.teamId===currentUser?.teamId && u.approved)
    .sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0))

  return (
    <div style={pageShell(980)}>
      <div style={{marginBottom:20}}>
        <div style={titleStyle}>Team Directory</div>
        <div style={{fontSize:12,color:"#6B7280",marginTop:4}}>Active workspace members and direct message access</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
        {members.map(member=>{
          const isOnline = !!member.activeSessionId
          return (
            <div key={member.id} style={{...cardStyle,padding:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{width:42,height:42,borderRadius:"50%",overflow:"hidden",border:"1px solid #374151",background:"#0C1117"}}>
                  {member.profilePic
                    ? <img src={member.profilePic} alt={member.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#9CA3AF"}}>{(member.name||"?").slice(0,1).toUpperCase()}</div>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:15,color:"#F9FAFB"}}>{member.name}</div>
                  <div style={{fontSize:12,color:"#9CA3AF"}}>{roleLabel(member.role || "member")}</div>
                </div>
                <span style={{fontSize:11,color:isOnline?"#34D399":"#6B7280"}}>{isOnline?"Online":"Offline"}</span>
              </div>
              <div style={{fontSize:12,color:"#9CA3AF",marginBottom:4}}>{member.email}</div>
              <div style={{fontSize:12,color:"#6B7280",marginBottom:10}}>Joined {fmt(member.createdAt)}</div>
              {member.id!==currentUser?.id ? (
                <button onClick={()=>onMessage(member.id)} style={{...btnBlue,width:"100%"}}>Message</button>
              ) : (
                <div style={{fontSize:11,color:"#6B7280"}}>This is your account</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InvoicesTab({ invoices, props, clients, selectedInvoiceId, setSelectedInvoiceId, onUpdateInvoice, onDeleteInvoice, canAdd=true, canEdit=true, canDelete=true }) {
  const { isPhone: isMobile } = viewportInfo()
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [statusFilter, setStatusFilter] = useState("All")
  const activeInvoice = invoices.find(inv=>inv.id===selectedInvoiceId) || null
  const fmtMoney = (v) => `$${toNumber(v).toFixed(2)}`
  const [editor, setEditor] = useState(null)

  useEffect(() => {
    if (!activeInvoice) {
      setEditor(null)
      return
    }
    setEditor({
      status: activeInvoice.status || "Draft",
      taxPct: activeInvoice.taxPct ?? 0,
      notes: activeInvoice.notes || "",
      lineItems: (activeInvoice.lineItems || []).map(li=>({ ...li }))
    })
  }, [activeInvoice])

  const filteredInvoices = [...invoices]
    .filter(inv => {
      const client = clients.find(c=>c.id===inv.clientId)
      const job = props.find(p=>p.id===inv.propertyId)
      const query = search.trim().toLowerCase()
      const matchesSearch = !query || `${client?.name || inv.clientName || ""} ${job?.address || inv.propertyAddress || ""}`.toLowerCase().includes(query)
      const matchesStatus = statusFilter==="All" || inv.status===statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a,b)=>{
      const totalA = calcInvoiceTotals(a).total
      const totalB = calcInvoiceTotals(b).total
      if (sortBy==="oldest") return new Date(a.createdAt)-new Date(b.createdAt)
      if (sortBy==="highest") return totalB-totalA
      if (sortBy==="lowest") return totalA-totalB
      return new Date(b.createdAt)-new Date(a.createdAt)
    })

  const closeEditor = () => setSelectedInvoiceId("")

  const updateLineItem = (lineId, field, value) => {
    setEditor(prev=>prev ? {
      ...prev,
      lineItems: prev.lineItems.map(li=>li.id!==lineId ? li : { ...li, [field]: value })
    } : prev)
  }

  const addLineItem = () => setEditor(prev=>prev ? ({ ...prev, lineItems:[...prev.lineItems, emptyLineItem()] }) : prev)
  const removeLineItem = (lineId) => setEditor(prev=>prev ? ({ ...prev, lineItems:prev.lineItems.filter(li=>li.id!==lineId) }) : prev)

  const submitInvoiceAction = (statusOverride = null) => {
    if (!activeInvoice || !editor || !canEdit) return
    const payload = {
      status: statusOverride || editor.status,
      taxPct: editor.taxPct,
      notes: editor.notes,
      lineItems: editor.lineItems
    }
    onUpdateInvoice(activeInvoice.id, payload)
    closeEditor()
  }

  const deleteInvoiceCard = (invoiceId, invoiceCode) => {
    if (!canDelete) return
    if (!window.confirm(`Delete invoice ${invoiceCode}?`)) return
    onDeleteInvoice(invoiceId)
  }

  const totals = editor ? calcInvoiceTotals(editor) : { subtotal:0, tax:0, total:0 }

  return (
    <div style={pageShell(1200)}>
      <div style={{marginBottom:20}}>
        <div style={titleStyle}>Invoices</div>
        <div style={{fontSize:12,color:"#6B7280",marginTop:4}}>Draft, review, send, and payment tracking</div>
      </div>

      <div style={{...cardStyle,marginBottom:12,padding:12}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr 1fr",gap:8}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search client or property address..." style={iStyle} />
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={iStyle}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={iStyle}>
            <option value="All">All Statuses</option>
            {INVOICE_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {filteredInvoices.length===0 ? (
        <div style={{...cardStyle,textAlign:"center",color:"#6B7280",padding:30}}>
          {invoices.length===0
            ? "No invoices yet. Complete a job and attach a client, then create an invoice from the job panel."
            : "No invoices match your current filters."}
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":(activeInvoice && canEdit ? "360px 1fr" : "1fr"),gap:12}}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filteredInvoices.map(inv=>{
              const job = props.find(p=>p.id===inv.propertyId)
              const client = clients.find(c=>c.id===inv.clientId)
              const t = calcInvoiceTotals(inv)
              return (
                <div key={inv.id} style={{...cardStyle,padding:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:8}}>
                    <div style={{fontWeight:700,color:"#F9FAFB"}}>{inv.invoiceId}</div>
                    <span style={{fontSize:11,color:inv.status==="Paid"?"#34D399":inv.status==="Sent"?"#60A5FA":inv.status==="Cancelled"?"#F87171":"#A78BFA"}}>{inv.status}</span>
                  </div>
                  <div style={{fontSize:12,color:"#D1D5DB",marginBottom:4}}>{job?.address || inv.propertyAddress}</div>
                  <div style={{fontSize:11,color:"#9CA3AF",marginBottom:4}}>{client?.name || inv.clientName} {client?.email || inv.clientEmail ? `| ${client?.email || inv.clientEmail}` : ""}</div>
                  <div style={{fontSize:11,color:"#9CA3AF",marginBottom:4}}>Subtotal {fmtMoney(t.subtotal)} | Tax {fmtMoney(t.tax)} | Total {fmtMoney(t.total)}</div>
                  <div style={{fontSize:11,color:"#6B7280",marginBottom:8}}>Created {fmt(inv.createdAt)}</div>
                  {(canEdit || canDelete) && (
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {canEdit && <button onClick={()=>setSelectedInvoiceId(inv.id)} style={{...btnBlue,padding:"6px 10px"}}>Edit</button>}
                      {canDelete && <button onClick={()=>deleteInvoiceCard(inv.id, inv.invoiceId)} style={{...btnGray,padding:"6px 10px",border:"1px solid #EF4444",color:"#FCA5A5"}}>Delete</button>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {activeInvoice && canEdit && editor && (
            <div style={cardStyle}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,marginBottom:12,flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:18,fontWeight:700,color:"#F9FAFB"}}>{activeInvoice.invoiceId}</div>
                  <div style={{fontSize:12,color:"#9CA3AF"}}>{activeInvoice.propertyAddress} | {activeInvoice.clientName}</div>
                </div>
                <button onClick={closeEditor} style={btnGray}>Close</button>
              </div>

              <div style={{fontSize:12,color:"#6B7280",marginBottom:8}}>Line Items</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
                {(editor.lineItems || []).map(li=>(
                  <div key={li.id} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr 1fr 1fr auto",gap:8,alignItems:"center"}}>
                    <input value={li.description || ""} onChange={e=>updateLineItem(li.id,"description",e.target.value)} placeholder="Description" style={iStyle} />
                    <input type="number" min="0" step="0.01" value={li.quantity} onChange={e=>updateLineItem(li.id,"quantity",e.target.value)} placeholder="Qty" style={iStyle} />
                    <input type="number" min="0" step="0.01" value={li.unitPrice} onChange={e=>updateLineItem(li.id,"unitPrice",e.target.value)} placeholder="Unit Price" style={iStyle} />
                    <div style={{fontSize:12,color:"#9CA3AF",textAlign:isMobile?"left":"right"}}>{fmtMoney(toNumber(li.quantity) * toNumber(li.unitPrice))}</div>
                    <button onClick={()=>removeLineItem(li.id)} style={{...btnGray,padding:"8px 10px",border:"1px solid #EF4444",color:"#FCA5A5"}}>Remove</button>
                  </div>
                ))}
              </div>
              <button onClick={addLineItem} style={{...btnBlue,marginBottom:12}}>Add Line Item</button>

              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 220px",gap:10,marginBottom:10}}>
                <textarea value={editor.notes || ""} onChange={e=>setEditor(prev=>prev?{...prev,notes:e.target.value}:prev)} rows={4} placeholder="Invoice notes" style={{...iStyle,resize:"vertical"}} />
                <div style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#9CA3AF",marginBottom:4}}><span>Subtotal</span><span>{fmtMoney(totals.subtotal)}</span></div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12,color:"#9CA3AF",marginBottom:4}}>
                    <span>Tax %</span>
                    <input type="number" min="0" step="0.01" value={editor.taxPct ?? 0} onChange={e=>setEditor(prev=>prev?{...prev,taxPct:e.target.value}:prev)} style={{...iStyle,width:90,padding:"4px 8px"}} />
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#9CA3AF",marginBottom:4}}><span>Tax</span><span>{fmtMoney(totals.tax)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:15,color:"#F9FAFB",fontWeight:700}}><span>Total</span><span>{fmtMoney(totals.total)}</span></div>
                </div>
              </div>

              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={()=>submitInvoiceAction("Draft")} style={btnBlue}>Save Draft</button>
                <button onClick={()=>submitInvoiceAction("Sent")} style={btnOrange}>Mark Sent</button>
                <button onClick={()=>submitInvoiceAction("Paid")} style={btnGreen}>Mark Paid</button>
                <button onClick={()=>submitInvoiceAction("Cancelled")} style={{...btnGray,border:"1px solid #EF4444",color:"#FCA5A5"}}>Cancel Invoice</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ========================== CLIENTS TAB ========================== */
function ClientsTab({ clients, setClients, props, setProps, canAdd=true, canEdit=true, canDelete=true }) {
  const { isPhone: isMobile } = viewportInfo()
  const blank = { name:"", address:"", phone:"", email:"", jobId:"" }
  const [form,setForm] = useState(blank)
  const [editing,setEditing] = useState(null)
  const [search,setSearch] = useState("")
  const [sortBy,setSortBy] = useState("newest")
  const [clientFilterBy,setClientFilterBy] = useState("none")
  const [clientJobTypeFilter,setClientJobTypeFilter] = useState("All")
  const denyAccess = () => window.alert("You currently have view-only access. Ask management or the CEO to assign your role and permissions.")

  const save = () => {
    if (!editing && !canAdd) { denyAccess(); return }
    if (editing && !canEdit) { denyAccess(); return }
    if (!form.name.trim()) return
    const clientId = editing || uid()
    setClients(prev => {
      let next = editing
        ? prev.map(c=>c.id===editing?{...c,...form}:c)
        : [{ id:clientId, ...form, createdAt:now() }, ...prev]

      if (form.jobId) {
        next = next.map(c=>c.id!==clientId && c.jobId===form.jobId ? { ...c, jobId:"" } : c)
      }
      return next
    })

    setProps(prev=>prev.map(p=>{
      if (p.clientId===clientId && p.id!==form.jobId) return { ...p, clientId:"" }
      if (form.jobId && p.id===form.jobId) return { ...p, clientId:clientId }
      if (!form.jobId && p.clientId===clientId) return { ...p, clientId:"" }
      return p
    }))

    setForm(blank)
    setEditing(null)
  }

  const del = (id) => {
    if (!canDelete) { denyAccess(); return }
    if (!window.confirm("Remove client?")) return
    setClients(prev=>prev.filter(c=>c.id!==id))
    setProps(prev=>prev.map(p=>p.clientId===id ? { ...p, clientId:"" } : p))
    if (editing===id) {
      setEditing(null)
      setForm(blank)
    }
  }

  const edit = (c) => {
    setEditing(c.id)
    setForm({
      name:c.name||"",
      address:c.address||"",
      phone:c.phone||"",
      email:c.email||"",
      jobId:c.jobId||""
    })
  }

  const clearFilters = () => {
    setSearch("")
    setSortBy("newest")
    setClientFilterBy("none")
    setClientJobTypeFilter("All")
  }

  const filtered = [...clients]
    .filter(c=>{
      const job = props.find(p=>p.id===c.jobId)
      const q = search.trim().toLowerCase()
      if (!q) return true
      return `${c.name||""} ${c.address||""} ${job?.address||""}`.toLowerCase().includes(q)
    })
    .filter(c=>{
      if (clientFilterBy !== "jobType") return true
      const job = props.find(p=>p.id===c.jobId)
      if (clientJobTypeFilter === "All") return true
      return job?.workType === clientJobTypeFilter
    })
    .sort((a,b)=>{
      if (sortBy==="oldest") return new Date(a.createdAt||0)-new Date(b.createdAt||0)
      return new Date(b.createdAt||0)-new Date(a.createdAt||0)
    })

  return (
    <div style={pageShell(1000)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:12,flexWrap:"wrap",marginBottom:20}}>
        <div>
          <div style={titleStyle}>Clients</div>
          <div style={{fontSize:12,color:"#6B7280"}}>{clients.length} total clients</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,width:isMobile?"100%":"auto"}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",width:isMobile?"100%":"auto"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or address..." style={{...iStyle,width:isMobile?"100%":260}} />
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...iStyle,width:isMobile?"100%":170}}>
            <option value="newest">Date Added: Newest</option>
            <option value="oldest">Date Added: Oldest</option>
          </select>
          <select value={clientFilterBy} onChange={e=>setClientFilterBy(e.target.value)} style={{...iStyle,width:isMobile?"100%":180}}>
            <option value="none">No Extra Filter</option>
            <option value="jobType">Filter by Job Type</option>
          </select>
          <button onClick={clearFilters} style={btnGray}>Reset</button>
          </div>
          {clientFilterBy==="jobType" && (
            <select value={clientJobTypeFilter} onChange={e=>setClientJobTypeFilter(e.target.value)} style={{...iStyle,width:isMobile?"100%":220}}>
              <option value="All">All Job Types</option>
              {WORK_TYPES.slice(1).map(w=><option key={w} value={w}>{w}</option>)}
            </select>
          )}
          {(search || sortBy!=="newest" || clientFilterBy!=="none" || (clientFilterBy==="jobType"&&clientJobTypeFilter!=="All")) && (
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:11,color:"#6B7280",textTransform:"uppercase",letterSpacing:0.8}}>Active Filters</span>
              {search && <span style={{background:"#0C1117",border:"1px solid #1F2937",color:"#9CA3AF",borderRadius:999,padding:"2px 8px",fontSize:11}}>Search</span>}
              {sortBy==="oldest" && <span style={{background:"#0C1117",border:"1px solid #1F2937",color:"#9CA3AF",borderRadius:999,padding:"2px 8px",fontSize:11}}>Sort: Oldest</span>}
              {clientFilterBy==="jobType" && <span style={{background:"#0C1117",border:"1px solid #1F2937",color:"#9CA3AF",borderRadius:999,padding:"2px 8px",fontSize:11}}>Filter: Job Type</span>}
              {clientFilterBy==="jobType" && clientJobTypeFilter!=="All" && <span style={{background:"#0C1117",border:"1px solid #1F2937",color:"#9CA3AF",borderRadius:999,padding:"2px 8px",fontSize:11}}>Job: {clientJobTypeFilter}</span>}
            </div>
          )}
        </div>
      </div>

      <div style={{...cardStyle,marginBottom:20}}>
        <div style={{...sectionLabel,marginBottom:10}}>{editing?"Edit Client":"Add Client"}</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,minmax(0,1fr))",gap:10}}>
          <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Client name *" style={iStyle} />
          <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Client address" style={iStyle} />
          <select value={form.jobId} onChange={e=>setForm(f=>({...f,jobId:e.target.value}))} style={iStyle}>
            <option value="">Assign Job Order</option>
            {props.map(p=><option key={p.id} value={p.id}>{p.address}</option>)}
          </select>
          <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Phone" style={iStyle} />
          <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="Email" style={iStyle} />
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <button onClick={save} style={btnBlue} disabled={editing?!canEdit:!canAdd}>{editing?"Save":"Create Client"}</button>
            {editing && <button onClick={()=>{setEditing(null);setForm(blank)}} style={btnGray}>Cancel</button>}
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
        {filtered.length===0 && (
          <div style={{...cardStyle,color:"#6B7280",textAlign:"center",gridColumn:"1 / -1"}}>No clients found</div>
        )}
        {filtered.map(c=>{
          const job = props.find(p=>p.id===c.jobId)
          return (
            <div key={c.id} style={cardStyle}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:16,color:"#F9FAFB"}}>{c.name}</div>
                  <div style={{fontSize:12,color:"#6B7280"}}>{c.address || "No address"}</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>edit(c)} style={btnBlue} disabled={!canEdit}>Edit</button>
                  <button onClick={()=>del(c.id)} style={btnGray} disabled={!canDelete}>Delete</button>
                </div>
              </div>

              <div style={{fontSize:12,color:"#9CA3AF",display:"flex",flexDirection:"column",gap:4}}>
                {c.phone && <div>Phone: {c.phone}</div>}
                {c.email && <div>Email: {c.email}</div>}
                <div>Date Added: {fmt(c.createdAt)}</div>
                <div>Assigned Job: {job?.address || "Unassigned"}</div>
                <div>Job Type: {job?.workType || "--"}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ========================== AUTH SCREENS ========================== */
function AuthScreen({ onLogin, onSignup }) {
  const [mode, setMode] = useState("login")
  const [loginForm, setLoginForm] = useState({ email:"", password:"" })
  const [signupForm, setSignupForm] = useState({ name:"", email:"", password:"", invite:"" })
  const [error, setError] = useState("")

  const authInputStyle = {
    ...iStyle,
    width:"100%",
    maxWidth:"100%",
    minWidth:0,
    display:"block",
    boxSizing:"border-box"
  }

  const submitLogin = () => {
    setError("")
    const res = onLogin(loginForm.email, loginForm.password)
    if (!res.ok) setError(res.error || "Login failed.")
  }

  const submitSignup = () => {
    setError("")
    const res = onSignup(signupForm)
    if (!res.ok) setError(res.error || "Sign up failed.")
  }

  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(circle at 15% 15%, #1A2740 0%, #0B1118 48%)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"'Barlow',sans-serif"}}>
      <div style={{width:"min(480px,100%)",maxWidth:"100%",background:"#111A27",border:"1px solid #253449",borderRadius:14,overflow:"hidden",boxShadow:"0 24px 52px rgba(0,0,0,0.48)"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #253449",background:"linear-gradient(90deg,#0F1B2D 0%,#111A27 100%)"}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:30,fontWeight:900,color:"#F9FAFB",letterSpacing:1}}>JLCMS</div>
          <div style={{fontSize:12,color:"#90A0B8",marginTop:2}}>Single-company operations portal</div>
        </div>

        <div style={{padding:20,overflowX:"hidden"}}>
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            <button onClick={()=>setMode("login")} style={{...buttonStyle,flex:1,background:mode==="login"?"#0C1117":"#111827",color:mode==="login"?"#F97316":"#9CA3AF"}}>Login</button>
            <button onClick={()=>setMode("signup")} style={{...buttonStyle,flex:1,background:mode==="signup"?"#0C1117":"#111827",color:mode==="signup"?"#F97316":"#9CA3AF"}}>Create Account</button>
          </div>

          {error && <div style={{background:"#2D0A0A",border:"1px solid #F87171",color:"#FCA5A5",padding:"8px 10px",borderRadius:6,fontSize:12,marginBottom:14}}>{error}</div>}

          {mode==="login" ? (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:6,padding:"8px 10px",fontSize:12,color:"#9CA3AF"}}>
                CEO test login: greg@gmail.com / TestCEO
              </div>
              <div>
                <Label>Email</Label>
                <input value={loginForm.email} onChange={e=>setLoginForm(f=>({...f,email:e.target.value}))} style={authInputStyle} />
              </div>
              <div>
                <Label>Password</Label>
                <input type="password" value={loginForm.password} onChange={e=>setLoginForm(f=>({...f,password:e.target.value}))} style={authInputStyle} />
              </div>
              <button onClick={submitLogin} style={{...btnBlue,marginTop:6}}>Login</button>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:6,padding:"8px 10px",fontSize:12,color:"#9CA3AF"}}>
                Management accounts must use the invite code from the CEO.
              </div>
              <div>
                <Label>Name</Label>
                <input value={signupForm.name} onChange={e=>setSignupForm(f=>({...f,name:e.target.value}))} style={authInputStyle} />
              </div>
              <div>
                <Label>Email</Label>
                <input value={signupForm.email} onChange={e=>setSignupForm(f=>({...f,email:e.target.value}))} style={authInputStyle} />
              </div>
              <div>
                <Label>Password</Label>
                <input type="password" value={signupForm.password} onChange={e=>setSignupForm(f=>({...f,password:e.target.value}))} style={authInputStyle} />
              </div>
              <div>
                <Label>Team Invite Code</Label>
                <input value={signupForm.invite} onChange={e=>setSignupForm(f=>({...f,invite:e.target.value}))} placeholder="Enter invite code" style={authInputStyle} />
              </div>
              <button onClick={submitSignup} style={{...btnBlue,marginTop:6}}>Create Account</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WaitingApprovalScreen({ currentUser, team, onLogout }) {
  return (
    <div style={{minHeight:"100vh",background:UI.appBg,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"'Barlow',sans-serif"}}>
      <div style={{width:"100%",maxWidth:560,background:"#111A27",border:"1px solid #253449",borderRadius:12,padding:20,boxShadow:"0 14px 32px rgba(2,8,20,0.35)"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900,color:"#F9FAFB",letterSpacing:1,marginBottom:8}}>Waiting for Approval</div>
        <div style={{fontSize:13,color:"#9CA3AF",lineHeight:1.45,marginBottom:14}}>
          {currentUser?.name}, your request has been submitted to {team?.teamName || "the team"}.
          You will be able to access the dashboard as soon as an admin approves your account.
        </div>
        <div style={{fontSize:12,color:"#6B7280",marginBottom:16}}>Signed in as {currentUser?.email}</div>
        <button onClick={onLogout} style={btnGray}>Logout</button>
      </div>
    </div>
  )
}

/* ========================== MORE TAB ========================== */
function MoreTab({ currentUser, currentTeam, users, isCurrentAdmin, isCurrentCeo, onApprove, onDeny, onUpdateInviteCode, onForceLogoutUser, onRemoveUser, onUpdateProfile, onUpdateCompanyName, onCreateTeamRole, onRenameTeamRole, onDeleteTeamRole, onAssignUserRole, onUpdateRolePermission, onLogout }) {
  const { isPhone: isMobile } = viewportInfo()
  const pending = currentTeam?.pendingRequests || []
  const [inviteInput, setInviteInput] = useState(currentTeam?.inviteCode || "")
  const [settingsMsg, setSettingsMsg] = useState("")
  const [companyNameInput, setCompanyNameInput] = useState(currentTeam?.teamName || "")
  const [newRole, setNewRole] = useState("")
  const [editingRole, setEditingRole] = useState("")
  const [roleNameInput, setRoleNameInput] = useState("")
  const [openPermRole, setOpenPermRole] = useState("")
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name:currentUser?.name || "",
    email:currentUser?.email || "",
    profilePic:currentUser?.profilePic || ""
  })
  const teamMembers = users
    .filter(u=>u.teamId===currentTeam?.teamId && u.approved)
    .sort((a,b)=>{
      if ((a.role||"")===(b.role||"")) return String(a.name||"").localeCompare(String(b.name||""))
      if ((a.role||"").toLowerCase()==="ceo") return -1
      if ((b.role||"").toLowerCase()==="ceo") return 1
      return 0
    })
  const canAssignRoles = ["ceo","admin","management"].includes(String(currentUser?.role || "").toLowerCase())

  useEffect(() => {
    setInviteInput(currentTeam?.inviteCode || "")
    setCompanyNameInput(currentTeam?.teamName || "")
  }, [currentTeam?.inviteCode, currentTeam?.teamName])

  useEffect(() => {
    setProfileForm({
      name:currentUser?.name || "",
      email:currentUser?.email || "",
      profilePic:currentUser?.profilePic || ""
    })
  }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.profilePic])

  const saveInviteCode = () => {
    const res = onUpdateInviteCode(inviteInput)
    setSettingsMsg(res.ok ? "Invite code updated." : (res.error || "Unable to update code."))
  }
  const saveProfile = () => {
    const res = onUpdateProfile(profileForm)
    setSettingsMsg(res.ok ? "Profile updated." : (res.error || "Unable to update profile."))
    if (res.ok) setEditingProfile(false)
  }
  const saveCompanyName = () => {
    const res = onUpdateCompanyName(companyNameInput)
    setSettingsMsg(res.ok ? "Company name updated." : (res.error || "Unable to update company name."))
  }
  const createRole = () => {
    const res = onCreateTeamRole(newRole)
    setSettingsMsg(res.ok ? "Role created." : (res.error || "Unable to create role."))
    if (res.ok) setNewRole("")
  }
  const renameRole = (role) => {
    const res = onRenameTeamRole(role, roleNameInput)
    setSettingsMsg(res.ok ? "Role renamed." : (res.error || "Unable to rename role."))
    if (res.ok) { setEditingRole(""); setRoleNameInput("") }
  }
  const deleteRole = (role) => {
    if (!window.confirm(`Delete role ${roleLabel(role)}? Users with this role will be reassigned to Member.`)) return
    const res = onDeleteTeamRole(role)
    setSettingsMsg(res.ok ? "Role deleted." : (res.error || "Unable to delete role."))
  }
  const kickUser = (u) => { if (window.confirm(`Remove ${u.name} from this workspace?`)) onRemoveUser(u.id) }
  const forceLogout = (u) => { if (window.confirm(`Force logout for ${u.name}?`)) onForceLogoutUser(u.id) }
  const onProfilePicFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setProfileForm(f=>({...f,profilePic:e.target.result}))
    reader.readAsDataURL(file)
  }

  return (
    <div style={pageShell(980)}>
      <div style={{marginBottom:20}}>
        <div style={titleStyle}>Control Panel</div>
        <div style={{fontSize:12,color:"#6B7280",marginTop:4}}>Profile, team access, permissions, and account settings</div>
      </div>

      <div style={{...cardStyle,marginBottom:16,overflow:"hidden"}}>
        <div style={sectionLabel}>Profile</div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginBottom:8,flexWrap:"wrap"}}>
          {!editingProfile ? (
            <button onClick={()=>setEditingProfile(true)} style={btnBlue}>Edit</button>
          ) : (
            <>
              <button onClick={saveProfile} style={btnGreen}>Save Profile</button>
              <button onClick={()=>{setEditingProfile(false);setProfileForm({name:currentUser?.name||"",email:currentUser?.email||"",profilePic:currentUser?.profilePic||""})}} style={btnGray}>Cancel</button>
            </>
          )}
        </div>
        <div style={{fontSize:12,color:"#9CA3AF",marginBottom:10}}>
          Team: <span style={{color:"#F9FAFB",fontWeight:600}}>{currentTeam?.teamName || "Unassigned"}</span> | Role: <span style={{color:"#F9FAFB",fontWeight:600,textTransform:"capitalize"}}>{currentUser?.role || "member"}</span>
        </div>

        <div style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "repeat(auto-fit,minmax(220px,1fr))",gap:10,alignItems:"end"}}>
          <div>
            <Label>Name</Label>
            <input value={profileForm.name} onChange={e=>setProfileForm(f=>({...f,name:e.target.value}))} style={iStyle} disabled={!editingProfile} />
          </div>
          <div>
            <Label>Email</Label>
            <input value={profileForm.email} onChange={e=>setProfileForm(f=>({...f,email:e.target.value}))} style={iStyle} disabled={!editingProfile} />
          </div>
          <div>
            <Label>Profile Picture</Label>
            <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0,flexWrap:isMobile?"wrap":"nowrap"}}>
              <div style={{width:44,height:44,minWidth:44,borderRadius:"50%",overflow:"hidden",border:"1px solid #374151",background:"#0C1117"}}>
                {profileForm.profilePic
                  ? <img src={profileForm.profilePic} alt="Profile" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#9CA3AF"}}>{(currentUser?.name||"?").slice(0,1).toUpperCase()}</div>}
              </div>
              <input type="file" accept="image/*" onChange={e=>onProfilePicFile(e.target.files?.[0])} style={{...iStyle,padding:"6px 8px",width:isMobile?"100%":"auto",minWidth:0}} disabled={!editingProfile} />
            </div>
          </div>
        </div>
      </div>

      {isCurrentAdmin && (
        <div style={{...cardStyle,marginBottom:16,overflow:"hidden"}}>
          <div style={sectionLabel}>Team Management</div>
          {pending.length===0 ? (
            <div style={{fontSize:12,color:"#6B7280"}}>No pending access requests.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {pending.map(req=>(
                <div key={req.userId} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:isMobile?"wrap":"nowrap",background:"#0C1117",border:"1px solid #1F2937",borderRadius:6,padding:"10px 12px"}}>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{fontSize:14,color:"#F9FAFB",fontWeight:600}}>{req.name}</div>
                    <div style={{fontSize:12,color:"#6B7280",wordBreak:"break-word"}}>{req.email} | Requested {fmt(req.requestedAt)}</div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",width:isMobile?"100%":"auto"}}>
                    <button onClick={()=>currentTeam?.teamId && onApprove(currentTeam.teamId, req.userId)} style={btnGreen}>Approve</button>
                    <button onClick={()=>currentTeam?.teamId && onDeny(currentTeam.teamId, req.userId)} style={btnGray}>Deny</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isCurrentCeo && (
        <div style={{...cardStyle,marginBottom:16,overflow:"hidden"}}>
          <div style={sectionLabel}>CEO Settings</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "repeat(auto-fit,minmax(220px,1fr))",gap:10,marginBottom:10}}>
            <div><Label>Team Invite Code</Label><input value={inviteInput} onChange={e=>setInviteInput(e.target.value.toUpperCase())} style={iStyle} /></div>
            <div style={{display:"flex",alignItems:"flex-end"}}><button onClick={saveInviteCode} style={btnBlue}>Update Code</button></div>
            <div><Label>Company Name</Label><input value={companyNameInput} onChange={e=>setCompanyNameInput(e.target.value)} style={iStyle} /></div>
            <div style={{display:"flex",alignItems:"flex-end"}}><button onClick={saveCompanyName} style={btnBlue}>Update Company</button></div>
          </div>

          <div style={{borderTop:"1px solid #1F2937",paddingTop:10,marginTop:8,marginBottom:10}}>
            <div style={{fontSize:12,color:"#6B7280",marginBottom:8}}>Role Management</div>
            <div style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "repeat(auto-fit,minmax(220px,1fr))",gap:10,marginBottom:10}}>
              <div><Label>Create Role</Label><input value={newRole} onChange={e=>setNewRole(e.target.value)} placeholder="e.g. scheduler" style={iStyle} /></div>
              <div style={{display:"flex",alignItems:"flex-end"}}><button onClick={createRole} style={btnBlue}>Add Role</button></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {(currentTeam?.roles||[]).map(r=>(
                <div key={r} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:isMobile?"wrap":"nowrap",background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:"8px 10px"}}>
                  <div style={{fontSize:12,color:"#E5E7EB",fontWeight:600}}>{roleLabel(r)}</div>
                  {r==="ceo" ? (
                    <span style={{fontSize:11,color:"#6B7280"}}>Fixed</span>
                  ) : editingRole===r ? (
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",width:isMobile?"100%":"auto"}}>
                      <input value={roleNameInput} onChange={e=>setRoleNameInput(e.target.value)} style={{...iStyle,width:isMobile?"100%":140,padding:"6px 8px",fontSize:12}} />
                      <button onClick={()=>renameRole(r)} style={{...btnBlue,padding:"6px 8px"}}>Save</button>
                      <button onClick={()=>{setEditingRole("");setRoleNameInput("")}} style={{...btnGray,padding:"6px 8px"}}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",width:isMobile?"100%":"auto"}}>
                      <button onClick={()=>{setEditingRole(r);setRoleNameInput(roleLabel(r))}} style={{...btnBlue,padding:"6px 8px"}}>Rename</button>
                      <button onClick={()=>deleteRole(r)} style={{...btnGray,padding:"6px 8px",border:"1px solid #EF4444",color:"#FCA5A5"}}>Delete</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{borderTop:"1px solid #1F2937",paddingTop:10,marginTop:8}}>
            <div style={{fontSize:12,color:"#6B7280",marginBottom:8}}>Role Permissions by Page</div>
            {(currentTeam?.roles||[]).map(role=>{
              const open = openPermRole===role
              return (
                <div key={role} style={{marginBottom:10,border:"1px solid #1F2937",borderRadius:6,background:"#0C1117"}}>
                  <button onClick={()=>setOpenPermRole(open ? "" : role)} style={{...btnGray,width:"100%",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>{roleLabel(role)}</span>
                    <span style={{fontSize:11,color:"#9CA3AF"}}>{open ? "Hide" : "Edit"}</span>
                  </button>
                  {open && (
                    <div style={{padding:8,display:"grid",gridTemplateColumns:isMobile ? "1fr" : "repeat(auto-fit,minmax(220px,1fr))",gap:6}}>
                      {PAGE_KEYS.map(page=>{
                        const p = currentTeam?.rolePermissions?.[role]?.[page] || fullPerms()
                        return (
                          <div key={`${role}-${page}`} style={{border:"1px solid #1F2937",borderRadius:6,padding:6}}>
                            <div style={{fontSize:11,color:"#9CA3AF",marginBottom:4}}>{pageLabel(page)}</div>
                            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                              {ACTION_KEYS.map(action=>(
                                <label key={action} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#D1D5DB",textTransform:"capitalize"}}>
                                  <input type="checkbox" checked={p[action]!==false} onChange={e=>onUpdateRolePermission(role,page,action,e.target.checked)} />
                                  {action}
                                </label>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {settingsMsg && <div style={{fontSize:12,color:"#9CA3AF",marginTop:12}}>{settingsMsg}</div>}
        </div>
      )}

      {canAssignRoles && (
        <div style={{...cardStyle,marginBottom:16,overflow:"hidden"}}>
          <div style={sectionLabel}>Role Assignment</div>
          {teamMembers.length===0 ? (
            <div style={{fontSize:12,color:"#6B7280"}}>No active members.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {teamMembers.map(u=>(
                <div key={u.id} style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "minmax(0,1fr) auto",alignItems:"center",gap:10,background:"#0C1117",border:"1px solid #1F2937",borderRadius:6,padding:"10px 12px"}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:14,color:"#F9FAFB",fontWeight:600}}>{u.name}</div>
                    <div style={{fontSize:12,color:"#6B7280",wordBreak:"break-word"}}>{u.email} | Role: {roleLabel(u.role || "member")}</div>
                  </div>
                  {(u.role||"").toLowerCase()==="ceo" ? (
                    <span style={{fontSize:11,color:"#6B7280"}}>Protected</span>
                  ) : (
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",justifyContent:isMobile?"flex-start":"flex-end",width:"100%",minWidth:0}}>
                      <select value={u.role||"member"} onChange={e=>onAssignUserRole(u.id, e.target.value)} style={{...iStyle,width:isMobile?"100%":140,maxWidth:"100%",padding:"6px 8px",fontSize:12}}>
                        {(currentTeam?.roles||["member"]).map(r=><option key={r} value={r}>{roleLabel(r)}</option>)}
                      </select>
                      {isCurrentCeo && (
                        <>
                          <button onClick={()=>forceLogout(u)} style={btnGray}>Force Logout</button>
                          <button onClick={()=>kickUser(u)} style={{...btnGray,border:"1px solid #EF4444",color:"#FCA5A5"}}>Remove User</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={cardStyle}>
        <div style={sectionLabel}>Session</div>
        <button onClick={onLogout} style={btnGray}>Logout</button>
      </div>
    </div>
  )
}

/* -------------------------- SCHEDULE TAB -------------------------- */
function ScheduleTab({ activeUser, currentUser, teamUsers = [], recurringWeeklySchedule = [], setRecurringWeeklySchedule, oneOffScheduleBlocks = [], setOneOffScheduleBlocks, tasks = [], setTasks, properties = [], clients = [], canAdd=true, canEdit=true, canDelete=true, canManagePermanent=false, fireNotif }) {
  const { isPhone: isMobile } = viewportInfo()
  const sectionPad = isMobile ? 10 : 14
  const sectionGap = isMobile ? 8 : 10
  const sectionMargin = isMobile ? 12 : 16
  const userRole = String(currentUser?.role || "").toLowerCase()
  const isManagerRole = ["ceo","admin","management"].includes(userRole)
  const canManageSchedule = isManagerRole && canAdd
  const canManageRecurring = canManageSchedule && canManagePermanent
  const canManageTasks = canManageSchedule
  const [view, setView] = useState("today")

  const localNow = new Date()
  const todayDate = new Date(localNow.getTime() - localNow.getTimezoneOffset() * 60000).toISOString().slice(0,10)
  const todayDay = WEEK_DAYS[(localNow.getDay() + 6) % 7]
  const userMap = Object.fromEntries(teamUsers.map(u=>[u.id, u]))

  const [oneOffFilterUser, setOneOffFilterUser] = useState("All")
  const [taskUserFilter, setTaskUserFilter] = useState("All")
  const [taskStatusFilter, setTaskStatusFilter] = useState("All")
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("All")
  const [taskDateFilter, setTaskDateFilter] = useState("")

  const [recurringEditId, setRecurringEditId] = useState("")
  const [recurringForm, setRecurringForm] = useState({ userId:"", day:todayDay, start:"08:00 AM", end:"05:00 PM", note:"" })
  const [oneOffEditId, setOneOffEditId] = useState("")
  const [oneOffForm, setOneOffForm] = useState({ userId:"", date:todayDate, start:"08:00 AM", end:"05:00 PM", title:"Site Assignment", detail:"", type:"supplement" })
  const [taskEditId, setTaskEditId] = useState("")
  const [taskForm, setTaskForm] = useState({ title:"", detail:"", assignedUserId:"", propertyId:"", clientId:"", dueDate:todayDate, dueTime:"", priority:"Normal", status:"To Do" })
  const denyAccess = () => window.alert("You currently have view-only access. Ask management or the CEO to assign your role and permissions.")

  useEffect(() => {
    if (!teamUsers.length) return
    if (!recurringForm.userId) setRecurringForm(f=>({ ...f, userId:teamUsers[0].id }))
    if (!oneOffForm.userId) setOneOffForm(f=>({ ...f, userId:teamUsers[0].id }))
    if (!taskForm.assignedUserId) setTaskForm(f=>({ ...f, assignedUserId:teamUsers[0].id }))
  }, [teamUsers, recurringForm.userId, oneOffForm.userId, taskForm.assignedUserId])

  const toMin = (timeStr) => {
    const t = timeToday(timeStr || "12:00 AM")
    return t.getHours() * 60 + t.getMinutes()
  }
  const toISODate = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,10)
  const formatDateLong = (iso) => iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}) : "--"

  const weekStart = (() => {
    const d = new Date()
    const shift = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - shift)
    d.setHours(0,0,0,0)
    return d
  })()
  const weekDays = WEEK_DAYS.map((day, idx)=>{
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + idx)
    return { day, date: toISODate(d), label:d.toLocaleDateString("en-US",{month:"short",day:"numeric"}) }
  })

  const recurringRows = recurringWeeklySchedule
    .map(entry=>({ ...entry, userName:userMap[entry.userId]?.name || "Team Member", start:entry.start || "08:00 AM", end:entry.end || "05:00 PM", note:entry.note || "" }))
    .filter(entry=>entry.userId)
    .sort((a,b)=>toMin(a.start)-toMin(b.start))

  const oneOffRows = oneOffScheduleBlocks
    .map(entry=>({ ...entry, userName:userMap[entry.userId]?.name || "Team Member", date:entry.date || "", start:entry.start || "08:00 AM", end:entry.end || "05:00 PM", title:entry.title || "One-Off Block", detail:entry.detail || "", type:entry.type || "supplement" }))
    .filter(entry=>entry.userId && entry.date)
    .sort((a,b)=> a.date!==b.date ? a.date.localeCompare(b.date) : toMin(a.start)-toMin(b.start))

  const getBlocksForDate = (dateIso, dayKey) => {
    const oneOff = oneOffRows.filter(entry=>entry.date===dateIso)
    const overrideUsers = new Set(oneOff.filter(entry=>String(entry.type||"").toLowerCase()==="override").map(entry=>entry.userId))
    const recurring = recurringRows.filter(entry=>entry.day===dayKey && !overrideUsers.has(entry.userId)).map(entry=>({ ...entry, source:"recurring", title:entry.note || "Recurring Shift" }))
    const temporary = oneOff.map(entry=>({ ...entry, source:"oneoff" }))
    return [...recurring, ...temporary].sort((a,b)=>toMin(a.start)-toMin(b.start))
  }

  const todayBlocks = getBlocksForDate(todayDate, todayDay)
  const todayTasks = tasks.map(t=>({ ...t, status:t.status || "To Do", priority:t.priority || "Normal" })).filter(t=>t.assignedUserId && t.dueDate===todayDate && t.status!=="Done")

  const todayByUser = teamUsers
    .map(user=>({ user, blocks:todayBlocks.filter(b=>b.userId===user.id), tasks:todayTasks.filter(t=>t.assignedUserId===user.id) }))
    .filter(row=>row.blocks.length || row.tasks.length)

  const weekRows = weekDays.map(day=>({ ...day, blocks:getBlocksForDate(day.date, day.day) }))

  const saveRecurring = () => {
    if (!canManageRecurring) { denyAccess(); return }
    if (!recurringForm.userId || !recurringForm.day || !recurringForm.start || !recurringForm.end) return
    const payload = { id: recurringEditId || uid(), userId: recurringForm.userId, day: recurringForm.day, start: recurringForm.start, end: recurringForm.end, note: recurringForm.note.trim(), createdBy: currentUser?.id || "", createdAt: recurringEditId ? (recurringWeeklySchedule.find(x=>x.id===recurringEditId)?.createdAt || now()) : now() }
    setRecurringWeeklySchedule(prev=> recurringEditId ? prev.map(x=>x.id===recurringEditId ? payload : x) : [...prev, payload])
    setRecurringEditId("")
    setRecurringForm(f=>({ ...f, note:"" }))
  }
  const editRecurring = (entry) => {
    setRecurringEditId(entry.id)
    setRecurringForm({ userId: entry.userId || "", day: entry.day || "Mon", start: entry.start || "08:00 AM", end: entry.end || "05:00 PM", note: entry.note || "" })
  }
  const removeRecurring = (id) => {
    if (!canManageRecurring || !canDelete) { denyAccess(); return }
    setRecurringWeeklySchedule(prev=>prev.filter(x=>x.id!==id))
  }

  const saveOneOff = () => {
    if (!canManageSchedule) { denyAccess(); return }
    if (!oneOffForm.userId || !oneOffForm.date || !oneOffForm.start || !oneOffForm.end || !oneOffForm.title.trim()) return
    const payload = { id: oneOffEditId || uid(), userId: oneOffForm.userId, date: oneOffForm.date, start: oneOffForm.start, end: oneOffForm.end, title: oneOffForm.title.trim(), detail: oneOffForm.detail.trim(), type: oneOffForm.type || "supplement", createdBy: currentUser?.id || "", createdAt: oneOffEditId ? (oneOffScheduleBlocks.find(x=>x.id===oneOffEditId)?.createdAt || now()) : now() }
    setOneOffScheduleBlocks(prev=> oneOffEditId ? prev.map(x=>x.id===oneOffEditId ? payload : x) : [...prev, payload])
    setOneOffEditId("")
    setOneOffForm(f=>({ ...f, title:"Site Assignment", detail:"", type:"supplement" }))
  }
  const editOneOff = (entry) => {
    setOneOffEditId(entry.id)
    setOneOffForm({ userId:entry.userId || "", date:entry.date || todayDate, start:entry.start || "08:00 AM", end:entry.end || "05:00 PM", title:entry.title || "", detail:entry.detail || "", type:entry.type || "supplement" })
    setView("today")
  }
  const removeOneOff = (id) => {
    if (!canManageSchedule || !canDelete) { denyAccess(); return }
    setOneOffScheduleBlocks(prev=>prev.filter(x=>x.id!==id))
  }

  const saveTask = () => {
    if (!canManageTasks) { denyAccess(); return }
    if (!taskForm.title.trim() || !taskForm.assignedUserId || !taskForm.dueDate) return
    const editingTask = taskEditId ? tasks.find(x=>x.id===taskEditId) : null
    const payload = { id: taskEditId || uid(), title: taskForm.title.trim(), detail: taskForm.detail.trim(), assignedUserId: taskForm.assignedUserId, propertyId: taskForm.propertyId || "", clientId: taskForm.clientId || "", dueDate: taskForm.dueDate, dueTime: taskForm.dueTime || "", priority: taskForm.priority || "Normal", status: taskForm.status || "To Do", createdAt: taskEditId ? (tasks.find(x=>x.id===taskEditId)?.createdAt || now()) : now() }
    setTasks(prev=> taskEditId ? prev.map(x=>x.id===taskEditId ? payload : x) : [payload, ...prev])
    if (!taskEditId && fireNotif) {
      fireNotif("job", `New Task Assigned - ${payload.title}`, `Due ${payload.dueDate}${payload.dueTime ? ` at ${payload.dueTime}` : ""}.`, [payload.assignedUserId])
    }
    if (taskEditId && fireNotif && editingTask && editingTask.assignedUserId!==payload.assignedUserId) {
      fireNotif("job", `Task Reassigned - ${payload.title}`, `Due ${payload.dueDate}${payload.dueTime ? ` at ${payload.dueTime}` : ""}.`, [payload.assignedUserId])
    }
    setTaskEditId("")
    setTaskForm({ title:"", detail:"", assignedUserId:taskForm.assignedUserId, propertyId:"", clientId:"", dueDate:todayDate, dueTime:"", priority:"Normal", status:"To Do" })
  }
  const editTask = (task) => {
    setTaskEditId(task.id)
    setTaskForm({ title:task.title || "", detail:task.detail || "", assignedUserId:task.assignedUserId || "", propertyId:task.propertyId || "", clientId:task.clientId || "", dueDate:task.dueDate || todayDate, dueTime:task.dueTime || "", priority:task.priority || "Normal", status:task.status || "To Do" })
    setView("tasks")
  }
  const removeTask = (id) => {
    if (!canDelete) { denyAccess(); return }
    setTasks(prev=>prev.filter(x=>x.id!==id))
  }
  const canUpdateTaskStatus = (task) => canEdit || task.assignedUserId===currentUser?.id
  const updateTaskStatus = (id, status) => {
    const target = tasks.find(t=>t.id===id)
    if (!target || !canUpdateTaskStatus(target)) return
    setTasks(prev=>prev.map(t=>t.id!==id ? t : { ...t, status }))
  }

  const filteredTasks = [...tasks]
    .map(t=>({ ...t, status:t.status || "To Do", priority:t.priority || "Normal" }))
    .filter(t=>taskUserFilter==="All" || t.assignedUserId===taskUserFilter)
    .filter(t=>taskStatusFilter==="All" || t.status===taskStatusFilter)
    .filter(t=>taskPriorityFilter==="All" || t.priority===taskPriorityFilter)
    .filter(t=>!taskDateFilter || t.dueDate===taskDateFilter)
    .sort((a,b)=>`${a.dueDate || "9999-12-31"} ${a.dueTime || "23:59"}`.localeCompare(`${b.dueDate || "9999-12-31"} ${b.dueTime || "23:59"}`))

  const oneOffFiltered = oneOffRows.filter(r=>oneOffFilterUser==="All" || r.userId===oneOffFilterUser).filter(r=>!taskDateFilter || r.date===taskDateFilter)

  return (
    <div style={pageShell(1120)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:10,flexWrap:"wrap",marginBottom:16}}>
        <div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:isMobile?26:30,color:"#F97316",letterSpacing:2}}>OPERATIONS PLANNER</div>
          <div style={{fontSize:12,color:"#6B7280",fontFamily:"'IBM Plex Mono',monospace"}}>Schedule and task assignments for field operations</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,140px))",gap:8,marginBottom:sectionMargin}}>
        {[{ key:"today", label:"Today" },{ key:"week", label:"Week" },{ key:"tasks", label:"Tasks" },{ key:"recurring", label:"Recurring" }].map(item=>(
          <button key={item.key} onClick={()=>setView(item.key)} style={{...buttonStyle,padding:"8px 10px",background:view===item.key ? "#0C1117" : "#111827",border:view===item.key ? "1px solid #F97316" : "1px solid #1F2937",color:view===item.key ? "#F97316" : "#9CA3AF"}}>{item.label}</button>
        ))}
      </div>

      {(view==="today" || view==="week") && canManageSchedule && (
        <div style={{background:"#111827",border:"1px solid #1F2937",borderRadius:8,padding:sectionPad,marginBottom:sectionMargin}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:"#34D399",letterSpacing:1,marginBottom:8}}>ONE-OFF SCHEDULE BLOCK</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.2fr 1fr 1fr 1fr 1fr 1.2fr 1.2fr auto",gap:sectionGap}}>
            <select value={oneOffForm.userId} onChange={e=>setOneOffForm(f=>({...f,userId:e.target.value}))} style={iStyle}><option value="">Select User</option>{teamUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
            <input type="date" value={oneOffForm.date} onChange={e=>setOneOffForm(f=>({...f,date:e.target.value}))} style={iStyle} />
            <input value={oneOffForm.start} onChange={e=>setOneOffForm(f=>({...f,start:e.target.value}))} placeholder="8:00 AM" style={iStyle} />
            <input value={oneOffForm.end} onChange={e=>setOneOffForm(f=>({...f,end:e.target.value}))} placeholder="5:00 PM" style={iStyle} />
            <select value={oneOffForm.type} onChange={e=>setOneOffForm(f=>({...f,type:e.target.value}))} style={iStyle}><option value="supplement">Supplement</option><option value="override">Override</option></select>
            <input value={oneOffForm.title} onChange={e=>setOneOffForm(f=>({...f,title:e.target.value}))} placeholder="Title" style={iStyle} />
            <input value={oneOffForm.detail} onChange={e=>setOneOffForm(f=>({...f,detail:e.target.value}))} placeholder="Detail" style={iStyle} />
            <button onClick={saveOneOff} style={btnGreen}>{oneOffEditId ? "Save" : "Add"}</button>
          </div>
        </div>
      )}

      {view==="today" && (
        <>
          <div style={{...cardStyle,padding:sectionPad,marginBottom:sectionMargin}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:"#60A5FA",letterSpacing:1,marginBottom:8}}>TODAY OVERVIEW - {formatDateLong(todayDate)}</div>
            {todayByUser.length===0 ? <div style={{fontSize:12,color:"#6B7280"}}>No schedule blocks or due tasks for today.</div> : (
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(330px,1fr))",gap:sectionGap}}>
                {todayByUser.map(row=>(
                  <div key={row.user.id} style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:10}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#F9FAFB"}}>{row.user.name}</div>
                    <div style={{fontSize:11,color:"#6B7280",marginBottom:8}}>{roleLabel(row.user.role || "member")}</div>
                    <div style={{fontSize:11,color:"#9CA3AF",marginBottom:4}}>Schedule Blocks</div>
                    {row.blocks.length===0 ? <div style={{fontSize:11,color:"#4B5563",marginBottom:8}}>No blocks</div> : row.blocks.map(block=><div key={block.id} style={{display:"flex",justifyContent:"space-between",gap:8,background:"#111827",border:"1px solid #1F2937",borderRadius:6,padding:"6px 8px",marginBottom:6}}><div style={{fontSize:11,color:"#D1D5DB"}}>{block.start} - {block.end}</div><div style={{fontSize:11,color:block.source==="oneoff"?"#34D399":"#60A5FA"}}>{block.title || "Shift"}</div></div>)}
                    <div style={{fontSize:11,color:"#9CA3AF",marginBottom:4,marginTop:6}}>Due Tasks</div>
                    {row.tasks.length===0 ? <div style={{fontSize:11,color:"#4B5563"}}>No tasks due today</div> : row.tasks.map(task=><div key={task.id} style={{background:"#111827",border:"1px solid #1F2937",borderRadius:6,padding:"6px 8px",marginBottom:6}}><div style={{fontSize:12,color:"#F9FAFB",fontWeight:600}}>{task.title}</div><div style={{fontSize:11,color:"#9CA3AF"}}>{task.priority} | {task.status}{task.dueTime ? ` | ${task.dueTime}` : ""}</div></div>)}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{...cardStyle,padding:sectionPad}}>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 200px",gap:sectionGap,marginBottom:8}}>
              <input value={taskDateFilter} onChange={e=>setTaskDateFilter(e.target.value)} type="date" style={iStyle} />
              <select value={oneOffFilterUser} onChange={e=>setOneOffFilterUser(e.target.value)} style={iStyle}><option value="All">All Users</option>{teamUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
            </div>
            <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>One-Off Blocks</div>
            {oneOffFiltered.length===0 ? <div style={{fontSize:11,color:"#4B5563"}}>No matching one-off blocks.</div> : oneOffFiltered.map(entry=><div key={entry.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,background:"#0C1117",border:"1px solid #1F2937",borderRadius:6,padding:"7px 8px",marginBottom:6}}><div style={{fontSize:11,color:"#D1D5DB"}}>{formatDateLong(entry.date)} | {entry.userName} | {entry.start} - {entry.end} | {entry.title} ({entry.type})</div>{canManageSchedule && <div style={{display:"flex",gap:6}}><button onClick={()=>editOneOff(entry)} style={{...btnBlue,padding:"2px 8px",fontSize:11}} disabled={!canEdit}>Edit</button><button onClick={()=>removeOneOff(entry.id)} style={{...btnGray,padding:"2px 8px",fontSize:11,border:"1px solid #EF4444",color:"#FCA5A5"}} disabled={!canDelete}>Delete</button></div>}</div>)}
          </div>
        </>
      )}

      {view==="week" && (
        <div style={{...cardStyle,padding:sectionPad}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:"#60A5FA",letterSpacing:1,marginBottom:8}}>THIS WEEK</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,minmax(0,1fr))",gap:sectionGap}}>
            {weekRows.map(day=><div key={day.day} style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:10}}><div style={{fontSize:13,fontWeight:700,color:"#F9FAFB"}}>{day.day}</div><div style={{fontSize:11,color:"#6B7280",marginBottom:8}}>{day.label}</div>{day.blocks.length===0 ? <div style={{fontSize:11,color:"#4B5563"}}>No schedule blocks</div> : day.blocks.map(block=><div key={`${day.day}-${block.id}`} style={{display:"flex",justifyContent:"space-between",gap:8,background:"#111827",border:"1px solid #1F2937",borderRadius:6,padding:"6px 8px",marginBottom:6}}><div style={{fontSize:11,color:"#D1D5DB"}}>{block.userName}</div><div style={{fontSize:11,color:"#9CA3AF"}}>{block.start} - {block.end}</div><div style={{fontSize:11,color:block.source==="oneoff"?"#34D399":"#60A5FA"}}>{block.title || "Shift"}</div></div>)}</div>)}
          </div>
        </div>
      )}

      {view==="tasks" && (
        <>
          {canManageTasks && (
            <div style={{background:"#111827",border:"1px solid #1F2937",borderRadius:8,padding:sectionPad,marginBottom:sectionMargin}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:"#34D399",letterSpacing:1,marginBottom:8}}>TASK ASSIGNMENT</div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.6fr 1fr 1fr 1fr 1fr 1fr 1fr",gap:sectionGap,marginBottom:sectionGap}}>
                <input value={taskForm.title} onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))} placeholder="Task title" style={iStyle} />
                <select value={taskForm.assignedUserId} onChange={e=>setTaskForm(f=>({...f,assignedUserId:e.target.value}))} style={iStyle}><option value="">Assign User</option>{teamUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
                <input type="date" value={taskForm.dueDate} onChange={e=>setTaskForm(f=>({...f,dueDate:e.target.value}))} style={iStyle} />
                <input type="time" value={taskForm.dueTime} onChange={e=>setTaskForm(f=>({...f,dueTime:e.target.value}))} style={iStyle} />
                <select value={taskForm.priority} onChange={e=>setTaskForm(f=>({...f,priority:e.target.value}))} style={iStyle}>{["Low","Normal","High","Urgent"].map(p=><option key={p}>{p}</option>)}</select>
                <select value={taskForm.status} onChange={e=>setTaskForm(f=>({...f,status:e.target.value}))} style={iStyle}>{["To Do","In Progress","Done"].map(s=><option key={s}>{s}</option>)}</select>
                <button onClick={saveTask} style={btnGreen}>{taskEditId ? "Save" : "Add"}</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr 1fr",gap:sectionGap}}>
                <input value={taskForm.detail} onChange={e=>setTaskForm(f=>({...f,detail:e.target.value}))} placeholder="Task detail" style={iStyle} />
                <select value={taskForm.propertyId} onChange={e=>setTaskForm(f=>({...f,propertyId:e.target.value}))} style={iStyle}><option value="">Link Job (optional)</option>{properties.map(p=><option key={p.id} value={p.id}>{p.address}</option>)}</select>
                <select value={taskForm.clientId} onChange={e=>setTaskForm(f=>({...f,clientId:e.target.value}))} style={iStyle}><option value="">Link Client (optional)</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
            </div>
          )}

          <div style={{...cardStyle,padding:sectionPad}}>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(5,minmax(0,1fr))",gap:sectionGap,marginBottom:sectionGap}}>
              <select value={taskUserFilter} onChange={e=>setTaskUserFilter(e.target.value)} style={iStyle}><option value="All">All Users</option>{teamUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
              <select value={taskStatusFilter} onChange={e=>setTaskStatusFilter(e.target.value)} style={iStyle}><option value="All">All Statuses</option>{["To Do","In Progress","Done"].map(s=><option key={s}>{s}</option>)}</select>
              <select value={taskPriorityFilter} onChange={e=>setTaskPriorityFilter(e.target.value)} style={iStyle}><option value="All">All Priorities</option>{["Low","Normal","High","Urgent"].map(p=><option key={p}>{p}</option>)}</select>
              <input type="date" value={taskDateFilter} onChange={e=>setTaskDateFilter(e.target.value)} style={iStyle} />
              <button onClick={()=>{setTaskUserFilter("All");setTaskStatusFilter("All");setTaskPriorityFilter("All");setTaskDateFilter("")}} style={btnGray}>Reset</button>
            </div>
            {filteredTasks.length===0 ? <div style={{fontSize:12,color:"#6B7280"}}>No tasks match these filters.</div> : <div style={{display:"flex",flexDirection:"column",gap:8}}>{filteredTasks.map(task=>{ const assigned = userMap[task.assignedUserId]; const linkedProp = properties.find(p=>p.id===task.propertyId); const linkedClient = clients.find(c=>c.id===task.clientId); const statusColor = task.status==="Done" ? "#34D399" : task.status==="In Progress" ? "#FBBF24" : "#60A5FA"; const priorityColor = task.priority==="Urgent" ? "#F87171" : task.priority==="High" ? "#FB923C" : task.priority==="Low" ? "#9CA3AF" : "#60A5FA"; return <div key={task.id} style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:10}}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start",flexWrap:"wrap"}}><div><div style={{fontSize:14,fontWeight:700,color:"#F9FAFB"}}>{task.title}</div><div style={{fontSize:11,color:"#9CA3AF"}}>{assigned?.name || "Unassigned"} | Due {formatDateLong(task.dueDate)} {task.dueTime || ""}</div></div><div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}><span style={{fontSize:11,color:priorityColor,border:`1px solid ${priorityColor}`,borderRadius:12,padding:"1px 8px"}}>{task.priority}</span><select value={task.status} onChange={e=>updateTaskStatus(task.id, e.target.value)} style={{...iStyle,padding:"4px 8px",fontSize:11,width:110}} disabled={!canUpdateTaskStatus(task)}>{["To Do","In Progress","Done"].map(s=><option key={s}>{s}</option>)}</select>{(canManageTasks || canEdit) && <button onClick={()=>editTask(task)} style={{...btnBlue,padding:"4px 8px",fontSize:11}}>Edit</button>}{canDelete && <button onClick={()=>removeTask(task.id)} style={{...btnGray,padding:"4px 8px",fontSize:11,border:"1px solid #EF4444",color:"#FCA5A5"}}>Delete</button>}</div></div>{task.detail && <div style={{fontSize:12,color:"#D1D5DB",marginTop:6}}>{task.detail}</div>}<div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:6,fontSize:11,color:"#6B7280"}}><span style={{color:statusColor}}>Status: {task.status}</span>{linkedProp && <span>Job: {linkedProp.address}</span>}{linkedClient && <span>Client: {linkedClient.name}</span>}</div></div> })}</div>}
          </div>
        </>
      )}

      {view==="recurring" && (
        <>
          {canManageRecurring && (
            <div style={{background:"#111827",border:"1px solid #1F2937",borderRadius:8,padding:sectionPad,marginBottom:sectionMargin}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:"#38BDF8",letterSpacing:1,marginBottom:8}}>MANAGE RECURRING WEEKLY SCHEDULE</div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.2fr 1fr 1fr 1fr 2fr auto",gap:sectionGap}}>
                <select value={recurringForm.userId} onChange={e=>setRecurringForm(f=>({...f,userId:e.target.value}))} style={iStyle}><option value="">Select User</option>{teamUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
                <select value={recurringForm.day} onChange={e=>setRecurringForm(f=>({...f,day:e.target.value}))} style={iStyle}>{WEEK_DAYS.map(d=><option key={d}>{d}</option>)}</select>
                <input value={recurringForm.start} onChange={e=>setRecurringForm(f=>({...f,start:e.target.value}))} placeholder="8:00 AM" style={iStyle} />
                <input value={recurringForm.end} onChange={e=>setRecurringForm(f=>({...f,end:e.target.value}))} placeholder="5:00 PM" style={iStyle} />
                <input value={recurringForm.note} onChange={e=>setRecurringForm(f=>({...f,note:e.target.value}))} placeholder="Optional note" style={iStyle} />
                <button onClick={saveRecurring} style={btnBlue}>{recurringEditId ? "Save" : "Add"}</button>
              </div>
            </div>
          )}

          <div style={{...cardStyle,padding:sectionPad}}>
            {recurringRows.length===0 ? <div style={{fontSize:12,color:"#6B7280"}}>No recurring schedule entries yet.</div> : <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,minmax(0,1fr))",gap:sectionGap}}>{WEEK_DAYS.map(day=>{ const entries = recurringRows.filter(r=>r.day===day); return <div key={day} style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:10}}><div style={{fontSize:13,fontWeight:700,color:"#F9FAFB",marginBottom:8}}>{day}</div>{entries.length===0 ? <div style={{fontSize:11,color:"#4B5563"}}>No recurring shifts</div> : entries.map(entry=><div key={entry.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,background:"#111827",border:"1px solid #1F2937",borderRadius:6,padding:"6px 8px",marginBottom:6}}><div style={{fontSize:11,color:"#D1D5DB"}}>{entry.userName} | {entry.start} - {entry.end}{entry.note ? ` | ${entry.note}` : ""}</div>{canManageRecurring && <div style={{display:"flex",gap:6}}><button onClick={()=>editRecurring(entry)} style={{...btnBlue,padding:"2px 8px",fontSize:11}} disabled={!canEdit}>Edit</button><button onClick={()=>removeRecurring(entry.id)} style={{...btnGray,padding:"2px 8px",fontSize:11,border:"1px solid #EF4444",color:"#FCA5A5"}} disabled={!canDelete}>Delete</button></div>}</div>)}</div> })}</div>}
          </div>
        </>
      )}
    </div>
  )
}
/* PROPERTY PANEL ========================== */
function PropertyPanel({prop,update,onClose,onPhotos,vendors,inspectors,clients=[],invoices=[],onMarkComplete,onCreateInvoice,canCreateInvoice=true,onOpenInvoicesTab}) {
  const [ptab,setPtab]=useState("info")
  const fileRef=useRef()
  const sm=STATUS_META[prop.permitStatus]||STATUS_META["--"]
  const billingMeta = getBillingMeta(prop, invoices)
  const isReady = isPropReady(prop)
  const assignedClient = clients.find(c=>c.id===prop.clientId)
  const hasInvoice = !!prop.invoiceId
  const toggleVendor=(vid)=>{ const cur=prop.assignedVendors||[]; update(prop.id,"assignedVendors",cur.includes(vid)?cur.filter(x=>x!==vid):[...cur,vid]) }
  const toggleInspector=(iid)=>{ const cur=prop.assignedInspectors||[]; update(prop.id,"assignedInspectors",cur.includes(iid)?cur.filter(x=>x!==iid):[...cur,iid]) }
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{background:"#111827",padding:"12px 16px",borderBottom:"2px solid #F97316",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:"#F9FAFB",letterSpacing:1,lineHeight:1.1}}>{prop.address}</div>
            <div style={{marginTop:4,display:"flex",gap:8,alignItems:"center"}}>
              <span style={{background:sm.bg,color:sm.color,border:`1px solid ${sm.color}`,borderRadius:3,padding:"2px 8px",fontSize:11,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{prop.permitStatus}</span>
              <span style={{background:billingMeta.bg,color:billingMeta.color,border:`1px solid ${billingMeta.color}`,borderRadius:3,padding:"2px 8px",fontSize:11,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{billingMeta.label}</span>
              {prop.workType!=="-- Select --"&&<span style={{color:"#9CA3AF",fontSize:12}}>{prop.workType}</span>}
            </div>
          </div>
          <button 
          onClick={onClose}
          style={{...buttonStyle,padding:"6px 10px",fontSize:12}}
        >
          Close
        </button>
        </div>
        <div style={{display:"flex",gap:4,marginTop:10}}>
          {[["info","INFO"],["map","MAP"],["team","TEAM"],["photos","PHOTOS"]].map(([k,l])=>(
            <button key={k} onClick={()=>setPtab(k)} style={{...buttonStyle,background:ptab===k?"#0C1117":"#111827",color:ptab===k?"#F97316":"#9CA3AF",padding:"4px 10px",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,letterSpacing:1}}>{l}</button>
          ))}
        </div>
      </div>
      {ptab==="info"&&(
        <div style={{padding:16,paddingBottom:110,overflowY:"auto",flex:1}}>
          <Section label="PERMIT STATUS">
            <select value={prop.permitStatus} onChange={e=>update(prop.id,"permitStatus",e.target.value)} style={{background:sm.bg,border:`1px solid ${sm.color}`,borderRadius:4,color:sm.color,fontSize:13,padding:"6px 10px",width:"100%",fontWeight:700,cursor:"pointer"}}>
              {PERMIT_STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
            {prop.permitStatus==="Started"&&<div style={{marginTop:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#FBBF24"}}>Timer {fmt(prop.startedAt)} {fmtT(prop.startedAt)} - {hoursAgo(prop.startedAt)}h elapsed {parseFloat(hoursAgo(prop.startedAt))>20&&<span style={{color:"#F87171",marginLeft:8}}>NEAR DEADLINE</span>}</div>}
            {prop.permitStatus==="Submitted"&&<div style={{marginTop:8}}><Label>Submitted To</Label><input value={prop.submittedTo||""} onChange={e=>update(prop.id,"submittedTo",e.target.value)} placeholder="Name / email..." style={iStyle}/><Label style={{marginTop:8}}>Date Submitted</Label><input type="date" value={prop.submittedDate||""} onChange={e=>update(prop.id,"submittedDate",e.target.value)} style={iStyle}/></div>}
          </Section>
          <Section label="WORK TYPE"><select value={prop.workType} onChange={e=>update(prop.id,"workType",e.target.value)} style={{background:"#1F2937",border:"1px solid #374151",borderRadius:4,color:"#F9FAFB",fontSize:13,padding:"6px 10px",width:"100%",cursor:"pointer"}}>{WORK_TYPES.map(w=><option key={w}>{w}</option>)}</select></Section>
          <Section label="PERMIT INFORMATION"><Label>Demo Permit #</Label><input value={prop.permitNumber||""} onChange={e=>update(prop.id,"permitNumber",e.target.value)} placeholder="Harris County permit number..." style={iStyle}/><Label style={{marginTop:8}}>HCAD Account #</Label><input value={prop.hcadNumber||""} onChange={e=>update(prop.id,"hcadNumber",e.target.value)} placeholder="13-digit HCAD number..." style={{...iStyle,fontFamily:"'IBM Plex Mono',monospace"}}/></Section>
          <Section label="UTILITY DISCONNECTS">
            {[["electric","Electric","CenterPoint 713-207-2222"],["gas","Gas","Atmos 888-286-6700"],["water","Water","Houston Water 832-393-1000"]].map(([k,label,note])=>(
              <label key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid #1F2937",cursor:"pointer"}}>
                <input type="checkbox" checked={prop[k]||false} onChange={e=>update(prop.id,k,e.target.checked)} style={{width:16,height:16,cursor:"pointer",accentColor:"#34D399"}}/>
                <div><div style={{fontSize:13,color:prop[k]?"#34D399":"#9CA3AF",fontWeight:600}}>{label}</div><div style={{fontSize:10,color:"#4B5563"}}>{note}</div></div>
                {prop[k]&&<span style={{marginLeft:"auto",color:"#34D399",fontSize:12,fontWeight:700}}>CONFIRMED</span>}
              </label>
            ))}
          </Section>
          <Section label="FIELD NOTES"><textarea value={prop.notes||""} onChange={e=>update(prop.id,"notes",e.target.value)} placeholder="Site conditions, crew instructions..." rows={4} style={{...iStyle,resize:"vertical",lineHeight:1.5}}/></Section>
          <Section label="READINESS">
            {[{label:"Work Type Set",done:prop.workType!=="-- Select --"},{label:"Permit Number",done:!!prop.permitNumber},{label:"HCAD Number",done:!!prop.hcadNumber},{label:"Electric",done:prop.electric},{label:"Gas",done:prop.gas},{label:"Water",done:prop.water},{label:"Permit Approved",done:prop.permitStatus==="Approved"},{label:"Contractor Assigned",done:(prop.assignedVendors||[]).length>0},{label:"Inspector Assigned",done:(prop.assignedInspectors||[]).length>0}].map(item=>(
              <div key={item.label} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #1F2937",fontSize:12}}><span style={{color:"#9CA3AF"}}>{item.label}</span><span style={{color:item.done?"#34D399":"#4B5563",fontWeight:700}}>{item.done?"Done":"Pending"}</span></div>
            ))}
          </Section>
          <Section label="JOB COMPLETION & INVOICE">
            <div style={{fontSize:12,color:"#9CA3AF",marginBottom:8}}>
              {isReady ? "Job is ready to mobilize." : "Complete readiness items before mobilizing this job."}
            </div>
            <div style={{fontSize:12,color:prop.isCompleted?"#34D399":"#FBBF24",marginBottom:8}}>
              {prop.isCompleted ? `Completed ${fmt(prop.completedAt)} ${fmtT(prop.completedAt)}` : "Work not marked complete"}
            </div>
            {!prop.isCompleted && (
              <button onClick={()=>onMarkComplete && onMarkComplete(prop.id)} style={{...btnGreen,marginBottom:8}}>
                Mark Job Complete
              </button>
            )}
            {prop.isCompleted && !assignedClient && (
              <div style={{fontSize:12,color:"#FCA5A5",marginBottom:8}}>Attach a client before creating invoice.</div>
            )}
            {prop.isCompleted && assignedClient && !hasInvoice && canCreateInvoice && (
              <button
                onClick={()=>{
                  const created = onCreateInvoice ? onCreateInvoice(prop.id) : null
                  if (created && onOpenInvoicesTab) onOpenInvoicesTab()
                }}
                style={{...btnBlue,marginBottom:8}}
              >
                Create Invoice
              </button>
            )}
            {prop.isCompleted && assignedClient && !hasInvoice && !canCreateInvoice && (
              <div style={{fontSize:12,color:"#6B7280",marginBottom:8}}>You do not have permission to create invoices.</div>
            )}
            {hasInvoice && (
              <button onClick={()=>onOpenInvoicesTab && onOpenInvoicesTab()} style={btnOrange}>
                Open Invoice
              </button>
            )}
          </Section>
        </div>
      )}
      {ptab==="map"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"8px 16px",background:"#111827",fontSize:12,color:"#9CA3AF",borderBottom:"1px solid #1F2937"}}>Aerial - {prop.address}</div>
          <iframe src={mapsUrl(prop.address)} title="Map" style={{flex:1,border:"none",width:"100%"}} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>
          <div style={{padding:10,background:"#111827",fontSize:11,color:"#6B7280",textAlign:"center"}}><a href={`https://maps.google.com/maps?q=${encodeURIComponent(prop.address)}`} target="_blank" rel="noreferrer" style={{color:"#60A5FA"}}>Open full map</a></div>
        </div>
      )}
      {ptab==="team"&&(
        <div style={{padding:16,paddingBottom:110,overflowY:"auto",flex:1}}>
          <Section label="ASSIGNED CONTRACTORS">
            {vendors.length===0&&<div style={{color:"#4B5563",fontSize:13,padding:"8px 0"}}>No contractors yet.</div>}
            {vendors.map(v=>{ const assigned=(prop.assignedVendors||[]).includes(v.id); return(<label key={v.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #1F2937",cursor:"pointer"}}><input type="checkbox" checked={assigned} onChange={()=>toggleVendor(v.id)} style={{width:15,height:15,cursor:"pointer",accentColor:"#A78BFA"}}/><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#A78BFA",background:"#1E1040",padding:"2px 6px",borderRadius:3}}>{v.code}</span><span style={{fontSize:13,color:"#F9FAFB",fontWeight:600}}>{v.company}</span></div><div style={{fontSize:11,color:"#6B7280",marginTop:2}}>{v.trade} | {v.contact}</div></div>{assigned&&<span style={{color:"#A78BFA",fontSize:11,fontWeight:700}}>Assigned</span>}</label>) })}
          </Section>
          <Section label="ASSIGNED INSPECTORS">
            {inspectors.length===0&&<div style={{color:"#4B5563",fontSize:13,padding:"8px 0"}}>No inspectors yet.</div>}
            {inspectors.map(ins=>{ const assigned=(prop.assignedInspectors||[]).includes(ins.id); return(<label key={ins.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #1F2937",cursor:"pointer"}}><input type="checkbox" checked={assigned} onChange={()=>toggleInspector(ins.id)} style={{width:15,height:15,cursor:"pointer",accentColor:"#34D399"}}/><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:"#34D399",background:"#002D1A",padding:"2px 8px",borderRadius:3,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{ins.badge||ins.inspectorType?.slice(0,3).toUpperCase()}</span><span style={{fontSize:13,color:"#F9FAFB",fontWeight:600}}>{ins.name}</span></div><div style={{fontSize:11,color:"#6B7280",marginTop:2}}>{ins.inspectorType} | {ins.agency}</div></div>{assigned&&<span style={{color:"#34D399",fontSize:11,fontWeight:700}}>Assigned</span>}</label>) })}
          </Section>
        </div>
      )}
      {ptab==="photos"&&(
        <div style={{flex:1,overflowY:"auto",padding:16,paddingBottom:110}}>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>onPhotos(prop.id,e.target.files)}/>
          <button onClick={()=>fileRef.current?.click()} style={{width:"100%",background:"#1F2937",border:"2px dashed #374151",borderRadius:8,padding:"16px",color:"#9CA3AF",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,letterSpacing:1,marginBottom:16}}>UPLOAD SITE PHOTOS</button>
          {(!prop.photos||prop.photos.length===0)&&<div style={{textAlign:"center",color:"#4B5563",padding:40,fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,letterSpacing:1}}>NO PHOTOS YET</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {(prop.photos||[]).map(photo=>(
              <div key={photo.id} style={{background:"#1F2937",borderRadius:6,overflow:"hidden",border:"1px solid #374151"}}>
                {photo.data&&<img src={photo.data} alt={photo.name} style={{width:"100%",height:140,objectFit:"cover",display:"block"}}/>}
                <div style={{padding:"6px 8px"}}><div style={{fontSize:11,color:"#9CA3AF",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{photo.name}</div><div style={{fontSize:10,color:"#4B5563",fontFamily:"'IBM Plex Mono',monospace"}}>{fmt(photo.date)}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


/* ========================== BULK IMPORT MODAL ========================== */
function BulkImportModal({ onClose, vendors, onImport }) {
  const isMobile = window.innerWidth < 768

  const [paste,setPaste]=useState("")
  const [defaultWork,setDefaultWork]=useState("1 Story Demo")
  const [defaultVendor,setDefaultVendor]=useState("")
  const [woPrefix,setWoPrefix]=useState("")
  const [previewed,setPreviewed]=useState(null)
  const [done,setDone]=useState(false)

  const WORK_KEYWORDS={"1 Story Demo":["1 story","one story","single story","1-story"],"2 Story Demo":["2 story","two story","2-story"],"Multi-Family Demo":["multi","duplex","triplex","apartment"],"Clear & Grub":["clear","grub","c&g"],"Tree Removal":["tree removal","tree"],"Heavy Tree Removal":["heavy tree","large tree"],"Vehicle Move & Return":["vehicle","move & return"],"Equipment on Site":["equipment","crane","excavator"]}

  function detectWorkType(line){
    const lower=line.toLowerCase()
    for(const [type,kws] of Object.entries(WORK_KEYWORDS)){
      if(kws.some(k=>lower.includes(k))) return type
    }
    return null
  }

  function cleanAddress(raw){
    return raw.replace(/[-|]\s*(demo|clear|grub|tree|vehicle|equipment|1 story|2 story|multi|duplex).*/i,"")
      .replace(/\t+/g," ")
      .replace(/\s{2,}/g," ")
      .replace(/^\d+[.)]\s*/,"")
      .trim()
  }

  function parseLines(raw){
    return raw.split(/\n/)
      .map(l=>l.trim())
      .filter(l=>l.length>5)
      .map((line,idx)=>{
        const det=detectWorkType(line)
        const address=cleanAddress(line)
        const wo=woPrefix?`${woPrefix}-${String(idx+1).padStart(3,"0")}`:""

        return{
          _line:idx+1,
          address,
          workType:det||defaultWork,
          autoDetected:!!det,
          workOrderNumber:wo,
          valid:address.length>5
        }
      }).filter(r=>r.valid)
  }

  const parsed=parseLines(paste)

  function handleImport(){
    const rows=(previewed||[]).map(r=>({
      id:uid(),
      address:r.address,
      workType:r.workType,
      permitStatus:"--",
      submittedTo:"",
      submittedDate:"",
      startedAt:null,
      permitNumber:"",
      hcadNumber:"",
      electric:false,
      gas:false,
      water:false,
      notes:"",
      photos:[],
      assignedVendors:defaultVendor?[defaultVendor]:[],
      assignedInspectors:[],
      clientId:"",
      isCompleted:false,
      completedAt:null,
      invoiceId:null,
      invoiceStatus:null,
      workOrderNumber:r.workOrderNumber,
      createdAt:now()
    }))
    setTimeout(()=>{
      onImport(rows)
      setDone(true)
    },400)
  }

  function updatePreviewRow(idx,field,val){
    setPreviewed(prev=>prev.map((r,i)=>i===idx?{...r,[field]:val}:r))
  }

  return(
    <div style={{
      position:"fixed",
      inset:0,
      background:"rgba(0,0,0,0.85)",
      zIndex:300,
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      padding:16
    }}>

      <div style={{
        background:"#111827",
        border:"2px solid #1D4ED8",
        borderRadius:10,
        width:"100%",
        maxWidth:800,
        maxHeight:"90vh",
        display:"flex",
        flexDirection:"column",
        overflow:"hidden"
      }}>

        {/* HEADER */}
        <div style={{
          padding:"16px 20px",
          borderBottom:"1px solid #1F2937",
          display:"flex",
          justifyContent:"space-between",
          alignItems:"center"
        }}>
          <div>
            <div style={{
              fontSize:22,
              fontWeight:900,
              color:"#60A5FA"
            }}>
              BULK JOB ORDER IMPORT
            </div>
            <div style={{
              fontSize:12,
              color:"#6B7280"
            }}>
              Paste up to 500 addresses
            </div>
          </div>

          <button onClick={onClose} style={{...btnGray,fontSize:12,padding:"6px 10px"}}>Close</button>
        </div>

        <div style={{overflowY:"auto",padding:20}}>

          {!previewed ? (
            <>
              {/* SETTINGS */}
              <div style={{
                display:"grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
                gap:12,
                marginBottom:16
              }}>
                <select value={defaultWork} onChange={e=>setDefaultWork(e.target.value)} style={iStyle}>
                  {WORK_TYPES.slice(1).map(w=><option key={w}>{w}</option>)}
                </select>

                <input value={woPrefix} onChange={e=>setWoPrefix(e.target.value.toUpperCase())} placeholder="WO Prefix" style={iStyle}/>

                <select value={defaultVendor} onChange={e=>setDefaultVendor(e.target.value)} style={iStyle}>
                  <option value="">Assign Contractor</option>
                  {vendors.map(v=><option key={v.id} value={v.id}>{v.company}</option>)}
                </select>
              </div>

              {/* TEXTAREA */}
              <textarea
                value={paste}
                onChange={e=>setPaste(e.target.value)}
                rows={10}
                placeholder="Paste addresses..."
                style={{...iStyle,width:"100%"}}
              />

              {/* BUTTONS */}
              <div style={{display:"flex",gap:10,marginTop:16}}>
                <button onClick={()=>setPreviewed(parsed)} style={btnBlue}>
                  PREVIEW ({parsed.length})
                </button>
                <button onClick={onClose} style={btnGray}>CANCEL</button>
              </div>
            </>
          ) : done ? (
            <div style={{textAlign:"center",padding:40}}>
              <div style={{fontSize:26,color:"#34D399",fontWeight:700}}>Complete</div>
              <div>{previewed.length} CREATED</div>
              <button onClick={onClose} style={btnGreen}>DONE</button>
            </div>
          ) : (
            <>
              <div style={{
                display:"flex",
                justifyContent:"space-between",
                marginBottom:16
              }}>
                <button onClick={()=>setPreviewed(null)} style={btnGray}>BACK</button>
                <button onClick={handleImport} style={btnGreen}>
                  CREATE ALL ({previewed.length})
                </button>
              </div>

              {/* CARDS INSTEAD OF TABLE */}
              <div style={{
                display:"grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap:12
              }}>
                {previewed.map((row,idx)=>(
                  <div key={idx} style={{
                    background:"#111827",
                    border:"1px solid #1F2937",
                    borderRadius:8,
                    padding:12
                  }}>
                    <input
                      value={row.address}
                      onChange={e=>updatePreviewRow(idx,"address",e.target.value)}
                      style={{...iStyle,width:"100%",marginBottom:6}}
                    />

                    <select
                      value={row.workType}
                      onChange={e=>updatePreviewRow(idx,"workType",e.target.value)}
                      style={{...iStyle,width:"100%",marginBottom:6}}
                    >
                      {WORK_TYPES.slice(1).map(w=><option key={w}>{w}</option>)}
                    </select>

                    <input
                      value={row.workOrderNumber||""}
                      onChange={e=>updatePreviewRow(idx,"workOrderNumber",e.target.value)}
                      placeholder="Work Order #"
                      style={{...iStyle,width:"100%"}}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}


/* ========================== VENDOR TAB ========================== */
function VendorTab({vendors,setVendors,canAdd=true,canEdit=true,canDelete=true}) {
  const { isPhone: isMobile } = viewportInfo()
  const blank={company:"",trade:CONTRACTOR_TRADES[0],contact:"",phone:"",email:"",license:"",notes:"",active:true}

  const [form,setForm]=useState(blank)
  const [editing,setEditing]=useState(null)
  const [search,setSearch]=useState("")
  const [filter,setFilter]=useState("All")
  const denyAccess = () => window.alert("You currently have view-only access. Ask management or the CEO to assign your role and permissions.")

  const save=()=>{
    if (!editing && !canAdd) { denyAccess(); return }
    if (editing && !canEdit) { denyAccess(); return }
    if(!form.company.trim()) return
    if(editing){
      setVendors(prev=>prev.map(v=>v.id!==editing?v:{...v,...form}))
      setEditing(null)
    } else {
      const idx=vendors.length
      const code=genCode(form.company,form.trade,idx)
      setVendors(prev=>[...prev,{id:uid(),code,...form,createdAt:now()}])
    }
    setForm(blank)
  }

  const del=(id)=>{
    if (!canDelete) { denyAccess(); return }
    if(!window.confirm("Remove contractor?")) return
    setVendors(v=>v.filter(x=>x.id!==id))
  }

  const edit=(v)=>{
    setForm({
      company:v.company,
      trade:v.trade,
      contact:v.contact,
      phone:v.phone,
      email:v.email,
      license:v.license,
      notes:v.notes,
      active:v.active
    })
    setEditing(v.id)
  }

  const trades=["All",...new Set(vendors.map(v=>v.trade))]

  const filtered=vendors.filter(v=>{
    const ms=!search||v.company.toLowerCase().includes(search.toLowerCase())||v.code?.toLowerCase().includes(search.toLowerCase())
    const mf=filter==="All"||v.trade===filter
    return ms&&mf
  })

  return(
    <div style={pageShell(900)}>

      {/* HEADER */}
      <div style={{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center",
        gap:16,
        marginBottom:24,
        flexWrap:"wrap"
      }}>
        <div>
          <div style={{
            fontFamily:"'Barlow Condensed',sans-serif",
            fontWeight:900,
            fontSize:28,
            color:"#A78BFA",
            letterSpacing:2
          }}>
            CONTRACTOR INDEX
          </div>
          <div style={{
            fontFamily:"'IBM Plex Mono',monospace",
            fontSize:12,
            color:"#6B7280",
            marginTop:2
          }}>
            {vendors.length} vendors
          </div>
        </div>

        <div style={{
          display:"flex",
          gap:10,
          width: isMobile ? "100%" : "auto"
        }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{...iStyle,width: isMobile ? "100%" : 200,fontSize:12}}/>
          <select value={filter} onChange={e=>setFilter(e.target.value)} style={{...iStyle,width: isMobile ? "100%" : 160,fontSize:12}}>
            {trades.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* FORM (UNCHANGED) */}
      <div style={{
        background:"#111827",
        border:`1px solid ${editing?"#A78BFA":"#374151"}`,
        borderRadius:8,
        padding:20,
        marginBottom:24
      }}>
        <div style={{
          fontFamily:"'Barlow Condensed',sans-serif",
          fontWeight:700,
          fontSize:14,
          color:editing?"#A78BFA":"#9CA3AF",
          letterSpacing:2,
          marginBottom:14
        }}>
          {editing?"EDITING":"ADD CONTRACTOR"}
        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns: isMobile ? "1fr" : "2fr 1.5fr 1fr 1fr",
          gap:12,
          marginBottom:12
        }}>
          <div><Label>Company *</Label><input value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} style={iStyle}/></div>
          <div><Label>Trade *</Label><select value={form.trade} onChange={e=>setForm(f=>({...f,trade:e.target.value}))} style={iStyle}>{CONTRACTOR_TRADES.map(t=><option key={t}>{t}</option>)}</select></div>
          <div><Label>License #</Label><input value={form.license} onChange={e=>setForm(f=>({...f,license:e.target.value}))} style={iStyle}/></div>
          <div style={{display:"flex",alignItems:"flex-end"}}>
            <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#9CA3AF"}}>
              <input type="checkbox" checked={form.active} onChange={e=>setForm(f=>({...f,active:e.target.checked}))}/>
              Active
            </label>
          </div>
        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr 1.5fr 2fr",
          gap:12,
          marginBottom:14
        }}>
          <div><Label>Contact</Label><input value={form.contact} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} style={iStyle}/></div>
          <div><Label>Phone</Label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={iStyle}/></div>
          <div><Label>Email</Label><input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={iStyle}/></div>
          <div><Label>Notes</Label><input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={iStyle}/></div>
        </div>

        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={save} style={btnPurple} disabled={editing?!canEdit:!canAdd}>{editing?"SAVE":"ADD CONTRACTOR"}</button>
          {editing&&<button onClick={()=>{setForm(blank);setEditing(null)}} style={btnGray}>CANCEL</button>}
        </div>
      </div>

      {/* CARDS (NEW) */}
      <div style={{
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(320px,1fr))",
        gap:16
      }}>
        {filtered.map(v=>(
          <div key={v.id} style={{
            background:"#111827",
            borderRadius:8,
            border:"1px solid #1F2937",
            borderTop:"3px solid #A78BFA"
          }}>

            <div style={{padding:"14px 16px",background:"#111827"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontWeight:900,fontSize:18}}>{v.company}</div>
                  <div style={{fontSize:11,color:"#A78BFA"}}>{v.trade}</div>
                </div>

                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>edit(v)} style={btnPurple} disabled={!canEdit}>Edit</button>
                  <button onClick={()=>del(v.id)} style={btnGray} disabled={!canDelete}>Delete</button>
                </div>
              </div>
            </div>

            <div style={{padding:12}}>
              {[["Code",v.code],["Contact",v.contact],["Phone",v.phone],["Email",v.email],["License",v.license],["Notes",v.notes]]
                .filter(([,val])=>val)
                .map(([label,val])=>(
                  <div key={label} style={{display:"flex",gap:10,padding:"4px 0"}}>
                    <span style={{minWidth:90,fontSize:11,color:"#6B7280"}}>{label}</span>
                    <span style={{fontSize:12}}>{val}</span>
                  </div>
                ))}
            </div>

          </div>
        ))}
      </div>

    </div>
  )
}


/* ========================== INSPECTOR TAB ========================== */
function InspectorTab({inspectors,setInspectors,canAdd=true,canEdit=true,canDelete=true}) {
  const { isPhone: isMobile } = viewportInfo()

  const blank={name:"",inspectorType:INSPECTOR_TYPES[0],agency:"",badge:"",phone:"",email:"",availability:"",certifications:"",notes:"",active:true}

  const [form,setForm]=useState(blank)
  const [editing,setEditing]=useState(null)
  const [search,setSearch]=useState("")
  const denyAccess = () => window.alert("You currently have view-only access. Ask management or the CEO to assign your role and permissions.")

  const save=()=>{
    if (!editing && !canAdd) { denyAccess(); return }
    if (editing && !canEdit) { denyAccess(); return }
    if(!form.name.trim()) return
    if(editing){
      setInspectors(prev=>prev.map(ins=>ins.id!==editing?ins:{...ins,...form}))
      setEditing(null)
    } else {
      setInspectors(prev=>[...prev,{id:uid(),...form,createdAt:now()}])
    }
    setForm(blank)
  }

  const del=(id)=>{
    if (!canDelete) { denyAccess(); return }
    if(!window.confirm("Remove inspector?")) return
    setInspectors(v=>v.filter(x=>x.id!==id))
  }

  const edit=(ins)=>{
    setForm({
      name:ins.name,
      inspectorType:ins.inspectorType,
      agency:ins.agency,
      badge:ins.badge,
      phone:ins.phone,
      email:ins.email,
      availability:ins.availability,
      certifications:ins.certifications,
      notes:ins.notes,
      active:ins.active
    })
    setEditing(ins.id)
  }

  const filtered=inspectors.filter(ins=>
    !search ||
    ins.name.toLowerCase().includes(search.toLowerCase()) ||
    ins.agency?.toLowerCase().includes(search.toLowerCase())
  )

  const typeColors={
    "Building Inspector":"#60A5FA",
    "Fire Inspector":"#F87171",
    "Environmental Inspector":"#34D399",
    "Structural Inspector":"#FBBF24",
    "Utility Inspector":"#FB923C",
    "Code Enforcement":"#A78BFA"
  }

  return(
    <div style={pageShell(900)}>

      {/* HEADER */}
      <div style={{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center",
        gap:16,
        marginBottom:24,
        flexWrap:"wrap"
      }}>
        <div>
          <div style={{
            fontFamily:"'Barlow Condensed',sans-serif",
            fontWeight:900,
            fontSize:28,
            color:"#34D399",
            letterSpacing:2
          }}>
            INSPECTOR PROFILES
          </div>
          <div style={{
            fontFamily:"'IBM Plex Mono',monospace",
            fontSize:12,
            color:"#6B7280",
            marginTop:2
          }}>
            {inspectors.length} inspectors
          </div>
        </div>

        <input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="Search..."
          style={{
            ...iStyle,
            width: isMobile ? "100%" : 240,
            fontSize:12
          }}
        />
      </div>

      {/* FORM */}
      <div style={{
        background:"#111827",
        border:`1px solid ${editing?"#34D399":"#374151"}`,
        borderRadius:8,
        padding:20,
        marginBottom:24
      }}>
        <div style={{
          fontFamily:"'Barlow Condensed',sans-serif",
          fontWeight:700,
          fontSize:14,
          color:editing?"#34D399":"#9CA3AF",
          letterSpacing:2,
          marginBottom:14
        }}>
          {editing?"EDITING":"ADD INSPECTOR"}
        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns: isMobile ? "1fr" : "2fr 1.5fr 1.5fr 1fr",
          gap:12,
          marginBottom:12
        }}>
          <div><Label>Name *</Label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={iStyle}/></div>
          <div><Label>Type</Label><select value={form.inspectorType} onChange={e=>setForm(f=>({...f,inspectorType:e.target.value}))} style={iStyle}>{INSPECTOR_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
          <div><Label>Agency</Label><input value={form.agency} onChange={e=>setForm(f=>({...f,agency:e.target.value}))} style={iStyle}/></div>
          <div><Label>Badge #</Label><input value={form.badge} onChange={e=>setForm(f=>({...f,badge:e.target.value}))} style={iStyle}/></div>
        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1.5fr 1.5fr",
          gap:12,
          marginBottom:14
        }}>
          <div><Label>Phone</Label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={iStyle}/></div>
          <div><Label>Email</Label><input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={iStyle}/></div>
          <div><Label>Availability</Label><input value={form.availability} onChange={e=>setForm(f=>({...f,availability:e.target.value}))} style={iStyle}/></div>
          <div><Label>Certifications</Label><input value={form.certifications} onChange={e=>setForm(f=>({...f,certifications:e.target.value}))} style={iStyle}/></div>
        </div>

        <div style={{
          display:"flex",
          flexDirection: isMobile ? "column" : "row",
          gap:12,
          alignItems: isMobile ? "stretch" : "flex-end",
          marginBottom:14
        }}>
          <div style={{flex:1}}>
            <Label>Notes</Label>
            <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={iStyle}/>
          </div>

          <label style={{
            display:"flex",
            alignItems:"center",
            gap:6,
            fontSize:13,
            color:"#9CA3AF"
          }}>
            <input type="checkbox" checked={form.active} onChange={e=>setForm(f=>({...f,active:e.target.checked}))}/>
            Active
          </label>
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={save} style={btnGreen} disabled={editing?!canEdit:!canAdd}>{editing?"SAVE":"ADD INSPECTOR"}</button>
          {editing&&<button onClick={()=>{setForm(blank);setEditing(null)}} style={btnGray}>CANCEL</button>}
        </div>
      </div>

      {/* EMPTY */}
      {filtered.length===0&&(
        <div style={{textAlign:"center",padding:60,color:"#4B5563",fontSize:18,letterSpacing:2}}>
          {inspectors.length===0?"NO INSPECTORS YET":"NO RESULTS"}
        </div>
      )}

      {/* CARDS */}
      <div style={{
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(320px,1fr))",
        gap:16
      }}>
        {filtered.map(ins=>{
          const tc=typeColors[ins.inspectorType]||"#9CA3AF"
          return(
            <div key={ins.id} style={{
              background:"#111827",
              borderRadius:8,
              border:"1px solid #1F2937",
              borderTop:`3px solid ${tc}`
            }}>

              <div style={{padding:"14px 16px",background:"#111827"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontWeight:900,fontSize:20}}>{ins.name}</div>
                    <div style={{fontSize:11,color:tc}}>{ins.inspectorType}</div>
                  </div>

                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>edit(ins)} style={btnGreen} disabled={!canEdit}>Edit</button>
                    <button onClick={()=>del(ins.id)} style={btnGray} disabled={!canDelete}>Delete</button>
                  </div>
                </div>
              </div>

              <div style={{padding:"12px 16px"}}>
                {[["Agency",ins.agency],["Badge #",ins.badge],["Phone",ins.phone],["Email",ins.email],["Availability",ins.availability],["Certifications",ins.certifications],["Notes",ins.notes]]
                  .filter(([,v])=>v)
                  .map(([label,val])=>(
                    <div key={label} style={{display:"flex",gap:10,padding:"5px 0"}}>
                      <span style={{minWidth:90,fontSize:11,color:"#6B7280"}}>{label}</span>
                      <span style={{fontSize:12,color:"#D1D5DB"}}>{val}</span>
                    </div>
                  ))}
              </div>

            </div>
          )
        })}
      </div>

    </div>
  )
}


/* ========================== MILEAGE TAB ========================== */
function MileageTab({mileage,addMileage,setMileage,properties,canAdd=true,canDelete=true}) {
  const { isPhone: isMobile } = viewportInfo()

  const [form,setForm]=useState({vehicle:"",driver:"",from:"",to:"",miles:"",purpose:""})
  const [vehicleFilter,setVehicleFilter]=useState("")
  const [driverFilter,setDriverFilter]=useState("")
  const [sortDir,setSortDir]=useState("desc")
  const denyAccess = () => window.alert("You currently have view-only access. Ask management or the CEO to assign your role and permissions.")

  const addresses=properties.map(p=>p.address)

  const submit=()=>{
    if (!canAdd) { denyAccess(); return }
    if(!form.vehicle||!form.miles) return
    addMileage(form)
    setForm({vehicle:"",driver:"",from:"",to:"",miles:"",purpose:""})
  }

  const total=mileage.reduce((s,m)=>s+(parseFloat(m.miles)||0),0)
  const monthly=mileage.filter(m=>new Date(m.date).getMonth()===new Date().getMonth())
    .reduce((s,m)=>s+(parseFloat(m.miles)||0),0)

  const vehicles=[...new Set(mileage.map(m=>m.vehicle).filter(Boolean))]
  const drivers=[...new Set(mileage.map(m=>m.driver).filter(Boolean))]

  const filtered=[...mileage]
    .filter(m=>!vehicleFilter || m.vehicle===vehicleFilter)
    .filter(m=>!driverFilter || m.driver===driverFilter)
    .sort((a,b)=> sortDir==="desc"
      ? new Date(b.date)-new Date(a.date)
      : new Date(a.date)-new Date(b.date)
    )

  return(
    <div style={pageShell(900)}>

      {/* HEADER */}
      <div style={{
        fontFamily:"'Barlow Condensed',sans-serif",
        fontWeight:900,
        fontSize:28,
        color:"#F97316",
        letterSpacing:2,
        marginBottom:20
      }}>
        VEHICLE MILEAGE TRACKER
      </div>

      {/* STATS */}
      <div style={{
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
        gap:12,
        marginBottom:24
      }}>
        {[{label:"Total Miles",val:total.toFixed(1)},{label:"Total Trips",val:mileage.length},{label:"This Month",val:monthly.toFixed(1)}].map(s=>(
          <div key={s.label} style={{
            background:"#111827",
            border:"1px solid #374151",
            borderRadius:8,
            padding:"16px"
          }}>
            <div style={{
              fontFamily:"'IBM Plex Mono',monospace",
              fontSize:26,
              fontWeight:600,
              color:"#F97316"
            }}>{s.val}</div>
            <div style={{
              fontSize:12,
              color:"#9CA3AF",
              marginTop:4,
              letterSpacing:1
            }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* FORM */}
      <div style={{
        background:"#111827",
        border:"1px solid #374151",
        borderRadius:8,
        padding:20,
        marginBottom:24
      }}>
        <div style={{fontWeight:700,fontSize:14,color:"#9CA3AF",marginBottom:14}}>
          LOG NEW TRIP
        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
          gap:12
        }}>
          <input value={form.vehicle} onChange={e=>setForm(f=>({...f,vehicle:e.target.value}))} placeholder="Vehicle" style={iStyle}/>
          <input value={form.driver} onChange={e=>setForm(f=>({...f,driver:e.target.value}))} placeholder="Driver" style={iStyle}/>
          <input type="number" value={form.miles} onChange={e=>setForm(f=>({...f,miles:e.target.value}))} placeholder="Miles" style={iStyle}/>
          <input value={form.from} onChange={e=>setForm(f=>({...f,from:e.target.value}))} list="prop-list" placeholder="From" style={iStyle}/>
          <input value={form.to} onChange={e=>setForm(f=>({...f,to:e.target.value}))} list="prop-list" placeholder="To" style={iStyle}/>
          <input value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))} placeholder="Purpose" style={iStyle}/>
        </div>

        <datalist id="prop-list">{addresses.map(a=><option key={a} value={a}/>)}</datalist>

        <button onClick={submit} style={{...btnOrange,marginTop:14}} disabled={!canAdd}>LOG TRIP</button>
      </div>

      {/* FILTERS */}
      <div style={{
        display:"flex",
        gap:10,
        marginBottom:16,
        flexWrap:"wrap"
      }}>
        <select value={vehicleFilter} onChange={e=>setVehicleFilter(e.target.value)} style={iStyle}>
          <option value="">All Vehicles</option>
          {vehicles.map(v=><option key={v}>{v}</option>)}
        </select>

        <select value={driverFilter} onChange={e=>setDriverFilter(e.target.value)} style={iStyle}>
          <option value="">All Drivers</option>
          {drivers.map(d=><option key={d}>{d}</option>)}
        </select>

        <select value={sortDir} onChange={e=>setSortDir(e.target.value)} style={iStyle}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {/* EMPTY */}
      {filtered.length===0&&(
        <div style={{
          textAlign:"center",
          padding:50,
          color:"#4B5563",
          letterSpacing:2
        }}>
          NO TRIPS LOGGED YET
        </div>
      )}

      {/* CARDS */}
      <div style={{
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(320px,1fr))",
        gap:16
      }}>
        {filtered.map(m=>(
          <div key={m.id} style={{
            background:"#111827",
            borderRadius:8,
            border:"1px solid #1F2937",
            borderTop:"3px solid #F97316"
          }}>
            <div style={{padding:"12px 16px",background:"#111827"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontWeight:700}}>{m.vehicle}</div>
                  <div style={{fontSize:11,color:"#9CA3AF"}}>{fmt(m.date)}</div>
                </div>

                <button onClick={()=>{ if(!canDelete){ denyAccess(); return }; setMileage(p=>p.filter(x=>x.id!==m.id)) }} style={{
                  background:"#1F2937",
                  border:"1px solid #EF4444",
                  color:"#EF4444",
                  padding:"4px 8px",
                  borderRadius:4,
                  cursor:"pointer"
                }} disabled={!canDelete}>
                  Delete
                </button>
              </div>
            </div>

            <div style={{padding:12}}>
              {[["Driver",m.driver],["From",m.from],["To",m.to],["Miles",parseFloat(m.miles||0).toFixed(1)],["Purpose",m.purpose]]
                .filter(([,v])=>v)
                .map(([l,v])=>(
                  <div key={l} style={{display:"flex",gap:10,padding:"4px 0"}}>
                    <span style={{minWidth:80,fontSize:11,color:"#6B7280"}}>{l}</span>
                    <span style={{fontSize:12}}>{v}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}


/* ---- Shared ---- */
function Section({label,children}){ return(<div style={{marginBottom:22}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:12,color:"#FB923C",letterSpacing:2,marginBottom:9,paddingBottom:5,borderBottom:"1px solid #243246"}}>{label}</div>{children}</div>) }
function Label({children,style}){ return <div style={{fontSize:11,color:"#90A0B8",marginBottom:5,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1.1,...style}}>{children}</div> }
const iStyle = {
  background:"#0D1521",
  border:"1px solid #2A3A50",
  borderRadius:9,
  color:"#F5F8FF",
  fontSize:13,
  padding:"9px 12px",

  width:"100%",
  maxWidth:"100%",

  fontFamily:"'Barlow',sans-serif",
  boxShadow:"inset 0 1px 0 rgba(255,255,255,0.02)"
}
const btnOrange={background:"linear-gradient(180deg,#F97316,#EA580C)",color:"#FFF7ED",border:"1px solid #FB923C",padding:"8px 12px",borderRadius:9,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:13,letterSpacing:1,cursor:"pointer",boxShadow:"0 8px 18px rgba(249,115,22,0.24)"}
const btnGray={background:"#182433",color:"#E2E8F0",border:"1px solid #334155",padding:"8px 12px",borderRadius:9,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,letterSpacing:1,cursor:"pointer"}
const btnPurple={background:"linear-gradient(180deg,#7C3AED,#6D28D9)",color:"#F5F3FF",border:"1px solid #8B5CF6",padding:"8px 12px",borderRadius:9,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:13,letterSpacing:1,cursor:"pointer",boxShadow:"0 8px 18px rgba(124,58,237,0.24)"}
const btnGreen={background:"linear-gradient(180deg,#16A34A,#15803D)",color:"#ECFDF5",border:"1px solid #22C55E",padding:"8px 12px",borderRadius:9,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:13,letterSpacing:1,cursor:"pointer",boxShadow:"0 8px 18px rgba(22,163,74,0.24)"}
const btnBlue={background:"linear-gradient(180deg,#2563EB,#1D4ED8)",color:"#EFF6FF",border:"1px solid #60A5FA",padding:"8px 12px",borderRadius:9,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:13,letterSpacing:1,cursor:"pointer",boxShadow:"0 8px 18px rgba(37,99,235,0.24)"}
