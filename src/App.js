import { useState, useEffect, useRef, useCallback } from "react"
import { getTeams } from "./services/teams"
import {
  getClients as fetchClientsFromSupabase,
  createClientRecord,
  updateClientRecord,
  deleteClientRecord
} from "./services/clients"
import {
  getVendors as fetchVendorsFromSupabase,
  createVendor,
  updateVendor,
  deleteVendor
} from "./services/vendors"
import {
  getInspectors as fetchInspectorsFromSupabase,
  createInspector,
  updateInspector,
  deleteInspector
} from "./services/inspectors"
import {
  createProperty as createSupabaseProperty,
  updateProperty as updateSupabaseProperty,
  deleteProperty as deleteSupabaseProperty
} from "./services/properties"
import {
  createUser as createSupabaseUser,
  updateUser as updateSupabaseUser,
  deleteUser as deleteSupabaseUser
} from "./services/users"
import { getOrCreateWorkspaceTeam, syncWorkspaceTeam } from "./services/workspace"
import { getWorkspaceState, saveWorkspaceState } from "./services/workspaceState"

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
  { status:"Approved",    color:"#34D399", def:"Permit granted. Row turns green - cleared for field mobilization once compliance is complete." },
  { status:"Denied",      color:"#F87171", def:"Application rejected. Must be corrected and resubmitted." },
  { status:"--",           color:"#6B7280", def:"No permit action taken yet on this property." },
]


/* -- Notification config -- */
const NOTIF_TYPES = {
  schedule:  { color:"#60A5FA", icon:"SCH", label:"Schedule"   },
  private_message: { color:"#38BDF8", icon:"DM", label:"Private Msg" },
  permit:    { color:"#F87171", icon:"PER", label:"Permit"     },
  deadline:  { color:"#FBBF24", icon:"DDL", label:"Deadline"   },
  site:      { color:"#F97316", icon:"SIT", label:"Site Visit" },
  job:       { color:"#34D399", icon:"JOB", label:"New Job"    },
  task:      { color:"#22C55E", icon:"TSK", label:"Task"       },
  invoice:   { color:"#A78BFA", icon:"INV", label:"Invoice"    },
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
const HCG_COMPANY_NAME = "HCG Management LLC"
const HCG_WORKSPACE_NAME = "HCG Management LLC / Honesty Construction Group"
const DEFAULT_COMPANY_SETTINGS = {
  companyAddress:"1234 Example Rd, Houston, TX 77001",
  billingContactName:"Greg Holloway",
  billingContactEmail:"billing@hcgmanagement.com",
  billingContactPhone:"713-555-0199",
  paymentTerms:"Net 15",
  acceptedPaymentMethods:"Check, ACH",
  paymentInstructions:"Please include invoice number with payment. Contact billing for ACH remittance details."
}
const COMPANY_SETTINGS_KEYS = Object.keys(DEFAULT_COMPANY_SETTINGS)
const DOCUMENT_CATEGORIES = ["Permit Copy","Electric Confirmation","Gas Confirmation","Water Documentation","Insurance Certificate","Subcontractor Agreement","TCEQ Documentation","Miscellaneous"]
const HCG_COMPLIANCE_FIELDS = {
  workOrderNumber:"",
  countyPmName:"",
  mobilizationDate:"",
  ticket811:"",
  ticket811VerifiedBy:"",
  ticket811VerifiedAt:"",
  permitPortalUrl:"",
  preparedBy:"",
  ownerVerified:false,
  jurisdictionVerified:false,
  hcadVerified:false,
  hcadLookupCompleted:false,
  liensChecked:false,
  permitActive:false,
  permitActiveVerifiedBy:"",
  permitActiveVerifiedAt:"",
  permitScopeConfirmed:false,
  noViolationsChecked:false,
  permitPosted:false,
  permitPostedVerifiedBy:"",
  permitPostedVerifiedAt:"",
  electricWrittenConfirm:false,
  electricDisconnectVerifiedBy:"",
  electricDisconnectVerifiedAt:"",
  gasWrittenConfirm:false,
  gasDisconnectVerifiedBy:"",
  gasDisconnectVerifiedAt:"",
  waterConfirmed:false,
  waterConfirmedVerifiedBy:"",
  waterConfirmedVerifiedAt:"",
  utilityContactNotes:"",
  utilityDisconnectConfirmedBy:"",
  utilityDisconnectConfirmedAt:"",
  lateralCapped:false,
  noActiveMeters:false,
  utilityPhotosComplete:false,
  asbestosSurveyRequired:false,
  asbestosSurveyComplete:false,
  leadSurveyRequired:false,
  leadSurveyComplete:false,
  tceqRequired:false,
  tceqComplete:false,
  abatementComplete:false,
  ustReviewed:false,
  siteVisitComplete:false,
  noOccupantsConfirmed:false,
  accessConfirmed:false,
  neighborNoticeRequired:false,
  neighborNoticeComplete:false,
  erosionControlRequired:false,
  erosionControlComplete:false,
  contractScopeConfirmed:false,
  workOrderApproved:false,
  ntpReceived:false,
  insuranceOnFile:false,
  subcontractorAgreementsComplete:false,
  safetyPlanReviewed:false,
  shovelsResearchNotes:"",
  tceqCaseNotes:"",
  preDemoPhotosComplete:false,
  preDemoPhotosVerifiedBy:"",
  preDemoPhotosVerifiedAt:"",
  pmSignoff:false,
  pmSignoffName:"",
  pmSignoffDate:"",
  safetySignoff:false,
  safetySignoffName:"",
  safetySignoffDate:"",
  notes:"",
  documents:[]
}
const QUICK_REFERENCE_ITEMS = [
  { label:"Harris County ePermits", value:"eng.hctx.net", href:"https://eng.hctx.net" },
  { label:"HCAD Property Search", value:"hcad.org", href:"https://hcad.org" },
  { label:"811 Underground Utilities", value:"Call 811 / texas811.org", href:"https://texas811.org" },
  { label:"CenterPoint Energy", value:"713-207-2222" },
  { label:"Atmos Gas", value:"888-286-6700" },
  { label:"Houston Water", value:"832-393-1000" },
  { label:"TCEQ Asbestos", value:"tceq.texas.gov", href:"https://www.tceq.texas.gov" },
  { label:"Shovels.ai", value:"permit research" },
  { label:"TCEQ UST Database", value:"tceq.texas.gov", href:"https://www.tceq.texas.gov" }
]
const QUICK_REFERENCE_FOOTER = "HCG Management LLC | Honesty Construction Group | Houston, TX | TIPS-Awarded Public Works Contractor"
const TODAY_FOCUS_PRESETS = [
  "Keep permit statuses current, clear readiness blockers, and route team updates through chat.",
  "Close open compliance gaps on active jobs before scheduling new field mobilizations.",
  "Confirm utility disconnects and required documents before marking jobs ready to mobilize.",
  "Review due tasks, update schedule assignments, and keep client-linked jobs moving cleanly.",
  "Focus on permit follow-up, readiness sign-offs, and clear field handoffs for the team.",
  "Verify job details early, remove blockers fast, and keep invoice-ready work documented."
]
const COMPLIANCE_GROUPS = [
  {
    key:"identification",
    title:"Property Identification",
    fields:[
      { key:"workOrderNumber", label:"Work Order Number", type:"text", required:true },
      { key:"countyPmName", label:"County PM Name", type:"text" },
      { key:"preparedBy", label:"Prepared By", type:"text", required:true },
      { key:"mobilizationDate", label:"Mobilization Date", type:"date" },
      { key:"ownerVerified", label:"Owner Verified", type:"boolean", required:true, source:"hcad.org", helper:"Verify property ownership in the HCAD property search." },
      { key:"jurisdictionVerified", label:"Jurisdiction Verified", type:"boolean", required:true, source:"eng.hctx.net", helper:"Confirm demolition jurisdiction and permitting path in Harris County ePermits." },
      { key:"hcadVerified", label:"HCAD Verified", type:"boolean", required:true, source:"hcad.org", helper:"Confirm HCAD account details and save a screenshot record if needed." },
      { key:"hcadLookupCompleted", label:"HCAD Lookup Completed", type:"boolean", source:"hcad.org", helper:"Mark once the parcel search and screenshot review are complete." },
      { key:"liensChecked", label:"Liens Checked", type:"boolean" }
    ]
  },
  {
    key:"permit",
    title:"Permit Verification",
    fields:[
      { key:"permitPortalUrl", label:"Permit Portal URL", type:"text", source:"eng.hctx.net", helper:"Optional direct link to the Harris County permit record for this job." },
      { key:"permitActive", label:"Permit Active", type:"boolean", required:true, blocker:"Permit is not active", source:"eng.hctx.net", helper:"Use Harris County ePermits to verify the demo permit is active and not expired." },
      { key:"permitActiveVerifiedBy", label:"Permit Active Verified By", type:"text", source:"eng.hctx.net", helper:"Record who verified the active permit status." },
      { key:"permitActiveVerifiedAt", label:"Permit Active Verified At", type:"datetime", source:"eng.hctx.net", helper:"Record the date/time the permit status was verified." },
      { key:"permitScopeConfirmed", label:"Permit Scope Confirmed", type:"boolean", required:true, source:"eng.hctx.net", helper:"Match permit scope to the HCG contract scope and planned demolition activity." },
      { key:"noViolationsChecked", label:"No Open Violations Checked", type:"boolean", required:true, source:"eng.hctx.net", helper:"Confirm no open violations or holds remain before mobilization." },
      { key:"permitPosted", label:"Permit Posted On Site", type:"boolean", required:true, blocker:"Permit not posted", source:"eng.hctx.net", helper:"Print and post the active permit before crew mobilization." },
      { key:"permitPostedVerifiedBy", label:"Permit Posted Verified By", type:"text", source:"eng.hctx.net", helper:"Record who confirmed permit posting on site." },
      { key:"permitPostedVerifiedAt", label:"Permit Posted Verified At", type:"datetime", source:"eng.hctx.net", helper:"Record the date/time permit posting was confirmed." }
    ]
  },
  {
    key:"utilities",
    title:"Utility Disconnect Verification",
    fields:[
      { key:"ticket811", label:"811 Ticket Number", type:"text", required:true, blocker:"Missing 811 ticket", source:"811 / texas811.org", helper:"Call 811 or use texas811.org to place the locate request before dig or lateral work." },
      { key:"ticket811VerifiedBy", label:"811 Verified By", type:"text", source:"811 / texas811.org", helper:"Record who verified the 811 locate ticket." },
      { key:"ticket811VerifiedAt", label:"811 Verified At", type:"datetime", source:"811 / texas811.org", helper:"Record the date/time 811 ticket verification was completed." },
      { key:"electricWrittenConfirm", label:"Electric Written Confirmation Logged", type:"boolean", required:true, blocker:"Electric written confirmation missing", source:"CenterPoint Energy", helper:"Log the CenterPoint confirmation for electric disconnect." },
      { key:"electricDisconnectVerifiedBy", label:"Electric Disconnect Verified By", type:"text", source:"CenterPoint Energy", helper:"Record who logged the electric disconnect confirmation." },
      { key:"electricDisconnectVerifiedAt", label:"Electric Disconnect Verified At", type:"datetime", source:"CenterPoint Energy", helper:"Record the date/time electric disconnect was confirmed." },
      { key:"gasWrittenConfirm", label:"Gas Written Confirmation Logged", type:"boolean", required:true, blocker:"Gas written confirmation missing", source:"Atmos Energy", helper:"Log the Atmos confirmation for gas disconnect." },
      { key:"gasDisconnectVerifiedBy", label:"Gas Disconnect Verified By", type:"text", source:"Atmos Energy", helper:"Record who logged the gas disconnect confirmation." },
      { key:"gasDisconnectVerifiedAt", label:"Gas Disconnect Verified At", type:"datetime", source:"Atmos Energy", helper:"Record the date/time gas disconnect was confirmed." },
      { key:"waterConfirmed", label:"Water Confirmed Off", type:"boolean", required:true, source:"Houston Water", helper:"Verify water disconnect with Houston Water before mobilization." },
      { key:"waterConfirmedVerifiedBy", label:"Water Confirmed By", type:"text", source:"Houston Water", helper:"Record who confirmed the water disconnect." },
      { key:"waterConfirmedVerifiedAt", label:"Water Confirmed At", type:"datetime", source:"Houston Water", helper:"Record the date/time water disconnect was confirmed." },
      { key:"utilityDisconnectConfirmedBy", label:"Disconnect Confirmed By", type:"text", source:"CenterPoint / Atmos / Houston Water", helper:"Record the contact name or rep who confirmed the disconnect." },
      { key:"utilityDisconnectConfirmedAt", label:"Disconnect Confirmed At", type:"datetime", source:"CenterPoint / Atmos / Houston Water", helper:"Record the date/time of the confirmation call or email." },
      { key:"utilityContactNotes", label:"Utility Contact Notes", type:"text", source:"CenterPoint / Atmos / Houston Water", helper:"Keep phone, email, and follow-up notes for utility coordination." },
      { key:"lateralCapped", label:"Lateral Capped", type:"boolean", required:true },
      { key:"noActiveMeters", label:"No Active Meters", type:"boolean", required:true },
      { key:"utilityPhotosComplete", label:"Utility Verification Photos Complete", type:"boolean", required:true }
    ]
  },
  {
    key:"environmental",
    title:"Environmental & Hazardous Materials",
    fields:[
      { key:"asbestosSurveyRequired", label:"Asbestos Survey Required", type:"boolean", source:"tceq.texas.gov", helper:"Use TCEQ guidance to determine asbestos survey and notification requirements." },
      { key:"asbestosSurveyComplete", label:"Asbestos Survey Complete", type:"boolean", dependsOn:"asbestosSurveyRequired", requiredWhenTrue:"asbestosSurveyRequired", source:"tceq.texas.gov", helper:"Track asbestos survey completion or notification support from TCEQ guidance." },
      { key:"leadSurveyRequired", label:"Lead Survey Required", type:"boolean" },
      { key:"leadSurveyComplete", label:"Lead Survey Complete", type:"boolean", dependsOn:"leadSurveyRequired", requiredWhenTrue:"leadSurveyRequired" },
      { key:"tceqRequired", label:"TCEQ Required", type:"boolean", source:"tceq.texas.gov", helper:"Confirm whether TCEQ asbestos or demolition notification applies." },
      { key:"tceqComplete", label:"TCEQ Complete", type:"boolean", dependsOn:"tceqRequired", requiredWhenTrue:"tceqRequired", source:"tceq.texas.gov", helper:"Mark once TCEQ-related filing or notification is complete." },
      { key:"abatementComplete", label:"Abatement Complete", type:"boolean" },
      { key:"tceqCaseNotes", label:"TCEQ Case Notes", type:"text", source:"tceq.texas.gov", helper:"Keep case notes, filing numbers, or notification references." },
      { key:"ustReviewed", label:"UST Reviewed", type:"boolean", required:true, source:"TCEQ UST database", helper:"Review the TCEQ UST database for underground storage tank history." }
    ]
  },
  {
    key:"site",
    title:"Site Conditions & Field Verification",
    fields:[
      { key:"siteVisitComplete", label:"Site Visit Complete", type:"boolean", required:true },
      { key:"noOccupantsConfirmed", label:"No Occupants Confirmed", type:"boolean", required:true },
      { key:"accessConfirmed", label:"Access Confirmed", type:"boolean", required:true },
      { key:"neighborNoticeRequired", label:"Neighbor Notice Required", type:"boolean" },
      { key:"neighborNoticeComplete", label:"Neighbor Notice Complete", type:"boolean", dependsOn:"neighborNoticeRequired", requiredWhenTrue:"neighborNoticeRequired" },
      { key:"erosionControlRequired", label:"Erosion Control Required", type:"boolean" },
      { key:"erosionControlComplete", label:"Erosion Control Complete", type:"boolean", dependsOn:"erosionControlRequired", requiredWhenTrue:"erosionControlRequired" },
      { key:"shovelsResearchNotes", label:"Shovels.ai Research Notes", type:"text", source:"Shovels.ai", helper:"Optional permit research support note for PM reference only." },
      { key:"preDemoPhotosComplete", label:"Pre-Demo Photos Complete", type:"boolean", required:true, blocker:"Pre-demo photos incomplete" },
      { key:"preDemoPhotosVerifiedBy", label:"Pre-Demo Photos Verified By", type:"text", helper:"Record who confirmed the pre-demo photo set is complete." },
      { key:"preDemoPhotosVerifiedAt", label:"Pre-Demo Photos Verified At", type:"datetime", helper:"Record the date/time photo verification was completed." }
    ]
  },
  {
    key:"contract",
    title:"Contract & Compliance Confirmation",
    fields:[
      { key:"contractScopeConfirmed", label:"Contract Scope Confirmed", type:"boolean", required:true },
      { key:"workOrderApproved", label:"Work Order Approved", type:"boolean", required:true },
      { key:"ntpReceived", label:"NTP Received", type:"boolean", required:true },
      { key:"insuranceOnFile", label:"Insurance On File", type:"boolean", required:true },
      { key:"subcontractorAgreementsComplete", label:"Subcontractor Agreements Complete", type:"boolean", required:true },
      { key:"safetyPlanReviewed", label:"Safety Plan Reviewed", type:"boolean", required:true }
    ]
  },
  {
    key:"signoff",
    title:"Final Sign-Off Before Mobilization",
    fields:[
      { key:"pmSignoff", label:"PM Sign-Off Complete", type:"boolean", required:true, blocker:"PM sign-off required" },
      { key:"pmSignoffName", label:"PM Sign-Off Name", type:"text", source:"Internal HCG sign-off", helper:"Record the PM name completing the final sign-off." },
      { key:"pmSignoffDate", label:"PM Sign-Off Date", type:"date", source:"Internal HCG sign-off", helper:"Record the PM sign-off date." },
      { key:"safetySignoff", label:"Safety Sign-Off Complete", type:"boolean", required:true, blocker:"Safety sign-off required" }
      ,{ key:"safetySignoffName", label:"Safety Sign-Off Name", type:"text", source:"Internal HCG sign-off", helper:"Record the safety reviewer completing the final sign-off." }
      ,{ key:"safetySignoffDate", label:"Safety Sign-Off Date", type:"date", source:"Internal HCG sign-off", helper:"Record the safety sign-off date." }
    ]
  }
]
const READINESS_META = {
  not_ready: { label:"Not Ready", color:"#9CA3AF", bg:"#111827" },
  pm_review: { label:"Ready for PM Review", color:"#FBBF24", bg:"#2D1F00" },
  mobilize: { label:"Ready to Mobilize", color:"#34D399", bg:"#022C16" }
}
const calcInvoiceTotals = (invoice) => {
  const items = invoice?.lineItems || []
  const subtotal = items.reduce((sum, li) => sum + (toNumber(li.quantity) * toNumber(li.unitPrice)), 0)
  const taxPct = toNumber(invoice?.taxPct)
  const tax = subtotal * (taxPct / 100)
  const total = subtotal + tax
  return { subtotal, tax, total }
}
const isTruthyText = (value) => String(value || "").trim().length > 0
const safeParseJSON = (raw, fallback) => {
  if (typeof raw !== "string" || !raw.trim()) return fallback
  try { return JSON.parse(raw) } catch (e) { return fallback }
}
const getTodayDateInput = () => {
  const current = new Date()
  return new Date(current.getTime() - current.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
const normalizeCompanySettings = (team = {}) => Object.fromEntries(
  COMPANY_SETTINGS_KEYS.map(key => {
    const rawValue = String(team?.[key] ?? "").trim()
    return [key, rawValue || DEFAULT_COMPANY_SETTINGS[key]]
  })
)
const normalizeDateInput = (value) => {
  const raw = String(value || "").trim()
  if (!raw) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ""
  return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
const normalizeDateTimeInput = (value) => {
  const raw = String(value || "").trim()
  if (!raw) return ""
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return raw
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(raw)) return raw.slice(0, 16)
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ""
  return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
const displayDate = (value) => {
  const normalized = normalizeDateInput(value)
  if (!normalized) return "--"
  const [year, month, day] = normalized.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })
}
const displayDateTime = (value) => {
  const normalized = normalizeDateTimeInput(value)
  if (!normalized) return "--"
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return "--"
  return parsed.toLocaleString("en-US", {
    month:"short",
    day:"numeric",
    year:"numeric",
    hour:"numeric",
    minute:"2-digit"
  })
}
const TIMESTAMP_FIELD_KEYS = [
  "ticket811VerifiedAt",
  "permitActiveVerifiedAt",
  "permitPostedVerifiedAt",
  "electricDisconnectVerifiedAt",
  "gasDisconnectVerifiedAt",
  "waterConfirmedVerifiedAt",
  "utilityDisconnectConfirmedAt",
  "preDemoPhotosVerifiedAt"
]
const DATE_ONLY_PROP_KEYS = [
  "submittedDate",
  "mobilizationDate",
  "pmSignoffDate",
  "safetySignoffDate"
]
const normalizePropDateFields = (prop = {}) => {
  const next = { ...prop }
  DATE_ONLY_PROP_KEYS.forEach(key => {
    next[key] = normalizeDateInput(next[key]) || ""
  })
  TIMESTAMP_FIELD_KEYS.forEach(key => {
    next[key] = normalizeDateTimeInput(next[key]) || String(next[key] || "").trim()
  })
  return next
}
const buildWorkOrderNumber = (existingProps = [], createdAtValue = now()) => {
  const stamp = new Date(createdAtValue)
  const source = Number.isNaN(stamp.getTime()) ? new Date() : stamp
  const yy = String(source.getFullYear()).slice(-2)
  const mmdd = `${String(source.getMonth() + 1).padStart(2, "0")}${String(source.getDate()).padStart(2, "0")}`
  const prefix = `WO-${yy}-${mmdd}`
  const used = new Set(
    (existingProps || [])
      .map(item => String(item?.workOrderNumber || "").trim().toUpperCase())
      .filter(Boolean)
  )
  let sequence = 1
  while (used.has(`${prefix}-${String(sequence).padStart(3, "0")}`)) sequence += 1
  return `${prefix}-${String(sequence).padStart(3, "0")}`
}
const normalizeMileageEntry = (entry = {}) => ({
  ...entry,
  id: entry.id || uid(),
  createdAt: entry.createdAt || now(),
  date: normalizeDateInput(entry.date || entry.createdAt || getTodayDateInput()) || getTodayDateInput(),
  vehicle: String(entry.vehicle || "").trim(),
  driver: String(entry.driver || "").trim(),
  miles: entry.miles == null ? "" : String(entry.miles),
  from: String(entry.from || "").trim(),
  to: String(entry.to || "").trim(),
  purpose: String(entry.purpose || "").trim(),
  propertyId: String(entry.propertyId || entry.jobId || "").trim(),
  clientId: String(entry.clientId || "").trim(),
  notes: String(entry.notes || "").trim()
})
const deriveInvoiceDueDate = (invoiceDate, paymentTerms = DEFAULT_COMPANY_SETTINGS.paymentTerms) => {
  const baseDate = normalizeDateInput(invoiceDate) || normalizeDateInput(now())
  const [year, month, day] = baseDate.split("-").map(Number)
  const due = new Date(year, month - 1, day)
  const match = String(paymentTerms || "").match(/net\s*(\d+)/i)
  const offsetDays = match ? Number(match[1]) : 15
  due.setDate(due.getDate() + offsetDays)
  return new Date(due.getTime() - due.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
const resolveInvoiceDates = (invoice = {}, paymentTerms = DEFAULT_COMPANY_SETTINGS.paymentTerms) => {
  const invoiceDate = normalizeDateInput(invoice.invoiceDate || invoice.createdAt || now()) || normalizeDateInput(now())
  const dueDate = normalizeDateInput(invoice.dueDate) || deriveInvoiceDueDate(invoiceDate, paymentTerms)
  return { invoiceDate, dueDate }
}
const isFieldApplicable = (prop, field) => {
  if (!field) return false
  if (field.requiredWhenTrue) return !!prop?.[field.requiredWhenTrue]
  if (field.dependsOn && !prop?.[field.dependsOn]) return false
  return true
}
const isChecklistFieldComplete = (prop, field) => {
  if (!field) return true
  if (!isFieldApplicable(prop, field)) return true
  const value = prop?.[field.key]
  if (field.type === "text" || field.type === "date" || field.type === "datetime") return isTruthyText(value)
  return !!value
}
const getRequiredDocumentLabels = (prop = {}) => {
  const labels = []
  if (prop.permitActive || prop.permitStatus === "Approved" || isTruthyText(prop.permitNumber)) labels.push("Permit Copy")
  if (prop.electricWrittenConfirm) labels.push("Electric Confirmation")
  if (prop.gasWrittenConfirm) labels.push("Gas Confirmation")
  if (prop.insuranceOnFile) labels.push("Insurance Certificate")
  if (prop.tceqRequired || prop.tceqComplete || isTruthyText(prop.tceqCaseNotes)) labels.push("TCEQ Documentation")
  if (prop.subcontractorAgreementsComplete || (prop.assignedVendors || []).length) labels.push("Subcontractor Agreement")
  return [...new Set(labels)]
}
const hasDocumentCategory = (prop = {}, category = "") =>
  (prop.documents || []).some(doc => String(doc?.category || "").trim() === category)
const getChecklistStatus = (prop = {}) => {
  const applicableFields = COMPLIANCE_GROUPS.flatMap(group => group.fields.filter(field => isFieldApplicable(prop, field)))
  const requiredFields = applicableFields.filter(field => field.required || field.requiredWhenTrue)
  const requiredDocuments = getRequiredDocumentLabels(prop)
  const completedChecklistCount = applicableFields.filter(field => isChecklistFieldComplete(prop, field)).length
  const completedRequiredDocuments = requiredDocuments.filter(label => hasDocumentCategory(prop, label))
  const missingDocuments = requiredDocuments.filter(label => !hasDocumentCategory(prop, label))
  const missingRequiredItems = requiredFields
    .filter(field => !isChecklistFieldComplete(prop, field))
    .map(field => field.label)
  const blockingIssues = [
    ...requiredFields
      .filter(field => field.blocker && !isChecklistFieldComplete(prop, field))
      .map(field => field.blocker),
    ...(prop.permitStatus !== "Approved" ? ["Permit status is not approved"] : []),
    ...(!prop.electric ? ["Electric disconnect not confirmed"] : []),
    ...(!prop.gas ? ["Gas disconnect not confirmed"] : []),
    ...(!prop.water ? ["Water disconnect not confirmed"] : []),
    ...missingDocuments.map(label => `Missing ${label}`)
  ]
  const baseReadyCount = requiredFields.filter(field => isChecklistFieldComplete(prop, field)).length
  const requiredCount = requiredFields.length || 1
  const opsRatio = baseReadyCount / requiredCount
  const canMobilize = [
    prop.permitStatus === "Approved",
    prop.permitActive,
    prop.electric,
    prop.gas,
    prop.water,
    prop.electricWrittenConfirm,
    prop.gasWrittenConfirm,
    prop.waterConfirmed,
    isTruthyText(prop.ticket811),
    prop.preDemoPhotosComplete,
    prop.permitPosted,
    prop.pmSignoff,
    prop.safetySignoff
  ].every(Boolean)
  const readinessKey = canMobilize
    ? "mobilize"
    : (opsRatio >= 0.8 && blockingIssues.length === 0 ? "pm_review" : "not_ready")
  const warnings = []
  if (!isTruthyText(prop.ticket811)) warnings.push("Cannot Mobilize: Missing 811 Ticket")
  if (!prop.pmSignoff) warnings.push("Cannot Mobilize: PM Sign-Off Required")
  if (!prop.safetySignoff) warnings.push("Cannot Mobilize: Safety Sign-Off Required")
  if (!prop.permitPosted) warnings.push("Cannot Mobilize: Permit Not Posted")
  if (!prop.permitActive) warnings.push("Cannot Mobilize: Permit Not Active")
  if (!prop.electricWrittenConfirm || !prop.gasWrittenConfirm) warnings.push("Waiting on Utility Written Confirmation")
  if (!prop.preDemoPhotosComplete) warnings.push("Cannot Mobilize: Pre-Demo Photos Incomplete")
  missingDocuments.forEach(label => warnings.push(`Missing Document: ${label}`))
  const totalCount = applicableFields.length + requiredDocuments.length
  const completedCount = completedChecklistCount + completedRequiredDocuments.length
  return {
    percentComplete: Math.round((completedCount / (totalCount || 1)) * 100),
    completedCount,
    totalCount,
    missingRequiredItems: [...new Set(missingRequiredItems)],
    missingDocuments: [...new Set(missingDocuments)],
    blockingIssues: [...new Set(blockingIssues)],
    warnings: [...new Set(warnings)],
    readinessKey,
    readiness: READINESS_META[readinessKey]
  }
}
const isPropReady = (p) => getChecklistStatus(p).readinessKey === "mobilize"
const getBillingMeta = (prop, invoices) => {
  const invoice = prop?.invoiceId ? invoices.find(inv=>inv.id===prop.invoiceId) : null
  if (invoice?.status === "Paid") return { label:"Invoice Paid", color:"#34D399", bg:"#022C16" }
  if (invoice?.status === "Sent") return { label:"Invoice Sent", color:"#60A5FA", bg:"#0F2040" }
  if (invoice?.status === "Draft") return { label:"Invoice Drafted", color:"#A78BFA", bg:"#1E1040" }
  if (invoice?.status === "Cancelled") return { label:"Completed", color:"#FBBF24", bg:"#2D1F00" }
  if (prop?.isCompleted && prop?.clientId) return { label:"Ready for Invoice", color:"#F97316", bg:"#2D1200" }
  if (prop?.isCompleted) return { label:"Completed", color:"#FBBF24", bg:"#2D1F00" }
  return { label:"Invoice Pending", color:"#9CA3AF", bg:"#111827" }
}
const DOCUMENT_DB_NAME = "hcg-property-documents"
const DOCUMENT_DB_VERSION = 1
const DOCUMENT_STORE_NAME = "documentPayloads"
const MAX_DOCUMENT_PERSIST_BYTES = 10 * 1024 * 1024
const STORAGE_ERROR_COOLDOWN_MS = 4000
const ONE_TIME_NOTIFICATION_STORAGE_KEY = "hcg-one-time-notification-ledger"
const storageErrorTimestamps = new Map()
const normalizeDocumentRecord = (doc = {}) => ({
  id: doc.id || uid(),
  name: String(doc.name || "").trim() || "Document",
  category: String(doc.category || "Miscellaneous").trim() || "Miscellaneous",
  uploadedAt: doc.uploadedAt || now(),
  notes: String(doc.notes || "").trim(),
  mimeType: String(doc.mimeType || "application/octet-stream").trim() || "application/octet-stream",
  size: Number(doc.size) > 0 ? Number(doc.size) : 0,
  data: typeof doc.data === "string" ? doc.data : "",
  dataStored: doc.dataStored != null ? !!doc.dataStored : !!doc.data,
  storageKind: String(doc.storageKind || (doc.data ? "indexeddb" : "")).trim(),
  persistenceWarning: String(doc.persistenceWarning || "").trim()
})
const normalizePhotoRecord = (photo = {}) => ({
  id: photo.id || uid(),
  name: String(photo.name || photo.displayName || "Photo").trim() || "Photo",
  displayName: String(photo.displayName || "").trim(),
  data: typeof photo.data === "string" ? photo.data : "",
  date: photo.date || now(),
  note: String(photo.note || "").trim()
})
const getPhotoDisplayName = (photo = {}) =>
  String(photo.displayName || photo.name || "Photo").trim() || "Photo"
const stripDocumentPayloadsFromProps = (propList = []) =>
  (propList || []).map(prop => normalizeProp({
    ...prop,
    documents: (prop.documents || []).map(doc => {
      const normalizedDoc = normalizeDocumentRecord(doc)
      return {
        ...normalizedDoc,
        data: "",
        dataStored: normalizedDoc.dataStored || !!normalizedDoc.data,
        storageKind: normalizedDoc.dataStored || normalizedDoc.storageKind ? (normalizedDoc.storageKind || "indexeddb") : normalizedDoc.storageKind
      }
    })
  }))
const reportStorageFailure = (message, error) => {
  const text = String(message || "Local storage failed.")
  const lastShown = storageErrorTimestamps.get(text) || 0
  if (Date.now() - lastShown < STORAGE_ERROR_COOLDOWN_MS) return
  storageErrorTimestamps.set(text, Date.now())
  console.error(text, error)
  if (typeof window !== "undefined" && typeof window.alert === "function") window.alert(text)
}
const loadOneTimeNotificationLedger = () => {
  return {}
}
const saveOneTimeNotificationLedger = (ledger = {}) => {
  return ledger
}
const getPropsStorageFailureMessage = (error) => {
  const errorText = String(error?.message || error || "")
  if (/quota|storage|space/i.test(errorText)) {
    return "Document could not be saved locally because storage limit was reached."
  }
  return "Local property data could not be saved. Recent document changes may not persist after refresh."
}
const getDocumentTooLargeMessage = (fileName = "") =>
  `${fileName || "This file"} is too large for local document storage. Files must be 10 MB or smaller.`
const getDocumentPersistenceFailureMessage = (fileName = "") =>
  `${fileName || "Document"} could not be saved locally because storage limit was reached or local file storage is unavailable.`
const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = event => resolve(event?.target?.result || "")
  reader.onerror = () => reject(reader.error || new Error("Unable to read file."))
  reader.readAsDataURL(file)
})
const openDocumentDb = () => new Promise((resolve, reject) => {
  if (typeof indexedDB === "undefined") {
    reject(new Error("IndexedDB is not available in this browser."))
    return
  }
  const request = indexedDB.open(DOCUMENT_DB_NAME, DOCUMENT_DB_VERSION)
  request.onupgradeneeded = () => {
    const db = request.result
    if (!db.objectStoreNames.contains(DOCUMENT_STORE_NAME)) {
      db.createObjectStore(DOCUMENT_STORE_NAME, { keyPath: "id" })
    }
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error || new Error("Unable to open document storage."))
})
const putDocumentPayload = async (payload = {}) => {
  const db = await openDocumentDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOCUMENT_STORE_NAME, "readwrite")
    const store = tx.objectStore(DOCUMENT_STORE_NAME)
    const request = store.put(payload)
    request.onsuccess = () => resolve(payload)
    request.onerror = () => reject(request.error || tx.error || new Error("Unable to save document payload."))
    tx.oncomplete = () => db.close()
    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error("Unable to save document payload."))
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error || new Error("Document storage transaction was aborted."))
    }
  })
}
const getAllDocumentPayloads = async () => {
  const db = await openDocumentDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOCUMENT_STORE_NAME, "readonly")
    const store = tx.objectStore(DOCUMENT_STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error || tx.error || new Error("Unable to read saved documents."))
    tx.oncomplete = () => db.close()
    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error("Unable to read saved documents."))
    }
  })
}
const deleteDocumentPayload = async (documentId) => {
  if (!documentId) return
  const db = await openDocumentDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOCUMENT_STORE_NAME, "readwrite")
    const store = tx.objectStore(DOCUMENT_STORE_NAME)
    const request = store.delete(documentId)
    request.onsuccess = () => resolve(true)
    request.onerror = () => reject(request.error || tx.error || new Error("Unable to remove saved document payload."))
    tx.oncomplete = () => db.close()
    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error("Unable to remove saved document payload."))
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error || new Error("Unable to remove saved document payload."))
    }
  })
}
const hydratePropsWithDocumentPayloads = async (propList = []) => {
  const normalizedProps = (propList || []).map(normalizeProp)
  let payloadById = new Map()
  try {
    const storedPayloads = await getAllDocumentPayloads()
    payloadById = new Map((storedPayloads || []).map(item => [item.id, item]))
  } catch (error) {
    reportStorageFailure("Saved document files could not be loaded from local document storage.", error)
  }

  const docsToMigrate = []
  const hydratedProps = normalizedProps.map(prop => normalizeProp({
    ...prop,
    documents: (prop.documents || []).map(rawDoc => {
      const doc = normalizeDocumentRecord(rawDoc)
      const storedPayload = payloadById.get(doc.id)
      if (storedPayload?.data) {
        return normalizeDocumentRecord({
          ...doc,
          data: storedPayload.data,
          size: doc.size || storedPayload.size || 0,
          dataStored: true,
          storageKind: "indexeddb",
          persistenceWarning: ""
        })
      }
      if (doc.data) {
        docsToMigrate.push({
          id: doc.id,
          name: doc.name,
          mimeType: doc.mimeType,
          size: doc.size,
          data: doc.data,
          uploadedAt: doc.uploadedAt
        })
        return normalizeDocumentRecord({
          ...doc,
          dataStored: true,
          storageKind: doc.storageKind || "indexeddb",
          persistenceWarning: ""
        })
      }
      return normalizeDocumentRecord({
        ...doc,
        data: "",
        dataStored: false,
        storageKind: doc.storageKind,
        persistenceWarning: doc.persistenceWarning || (rawDoc?.dataStored ? "Document file is missing from local storage. Re-upload required for download." : "")
      })
    })
  }))

  if (docsToMigrate.length) {
    const migrations = await Promise.allSettled(docsToMigrate.map(putDocumentPayload))
    const failedMigration = migrations.find(item => item.status === "rejected")
    if (failedMigration?.reason) {
      reportStorageFailure("Some previously uploaded documents could not be migrated into local document storage. Re-upload may be required for download.", failedMigration.reason)
    }
  }

  return hydratedProps
}
const normalizeProp = (p = {}) => {
  const normalizedDates = normalizePropDateFields(p)
  return ({
  ...normalizedDates,
  workType: p.workType === "--- Select ---" ? "-- Select --" : (p.workType || "-- Select --"),
  permitStatus: p.permitStatus || "--",
  isCompleted: !!p.isCompleted,
  completedAt: p.completedAt || null,
  invoiceId: p.invoiceId || null,
  invoiceStatus: p.invoiceStatus || null,
  workOrderNumber: p.workOrderNumber || "",
  countyPmName: p.countyPmName || "",
  mobilizationDate: normalizedDates.mobilizationDate || "",
  ticket811: p.ticket811 || "",
  permitPortalUrl: p.permitPortalUrl || "",
  preparedBy: p.preparedBy || "",
  ownerVerified: !!p.ownerVerified,
  jurisdictionVerified: !!p.jurisdictionVerified,
  hcadVerified: !!p.hcadVerified,
  hcadLookupCompleted: !!p.hcadLookupCompleted,
  liensChecked: !!p.liensChecked,
  permitActive: p.permitActive != null ? !!p.permitActive : p.permitStatus === "Approved",
  permitScopeConfirmed: !!p.permitScopeConfirmed,
  noViolationsChecked: !!p.noViolationsChecked,
  permitPosted: !!p.permitPosted,
  electricWrittenConfirm: !!p.electricWrittenConfirm,
  gasWrittenConfirm: !!p.gasWrittenConfirm,
  waterConfirmed: p.waterConfirmed != null ? !!p.waterConfirmed : !!p.water,
  utilityContactNotes: p.utilityContactNotes || "",
  utilityDisconnectConfirmedBy: p.utilityDisconnectConfirmedBy || "",
  utilityDisconnectConfirmedAt: normalizedDates.utilityDisconnectConfirmedAt || "",
  lateralCapped: !!p.lateralCapped,
  noActiveMeters: !!p.noActiveMeters,
  utilityPhotosComplete: !!p.utilityPhotosComplete,
  asbestosSurveyRequired: !!p.asbestosSurveyRequired,
  asbestosSurveyComplete: !!p.asbestosSurveyComplete,
  leadSurveyRequired: !!p.leadSurveyRequired,
  leadSurveyComplete: !!p.leadSurveyComplete,
  tceqRequired: !!p.tceqRequired,
  tceqComplete: !!p.tceqComplete,
  abatementComplete: !!p.abatementComplete,
  ustReviewed: !!p.ustReviewed,
  siteVisitComplete: !!p.siteVisitComplete,
  noOccupantsConfirmed: !!p.noOccupantsConfirmed,
  accessConfirmed: !!p.accessConfirmed,
  neighborNoticeRequired: !!p.neighborNoticeRequired,
  neighborNoticeComplete: !!p.neighborNoticeComplete,
  erosionControlRequired: !!p.erosionControlRequired,
  erosionControlComplete: !!p.erosionControlComplete,
  contractScopeConfirmed: !!p.contractScopeConfirmed,
  workOrderApproved: !!p.workOrderApproved,
  ntpReceived: !!p.ntpReceived,
  insuranceOnFile: !!p.insuranceOnFile,
  subcontractorAgreementsComplete: !!p.subcontractorAgreementsComplete,
  safetyPlanReviewed: !!p.safetyPlanReviewed,
  shovelsResearchNotes: p.shovelsResearchNotes || "",
  tceqCaseNotes: p.tceqCaseNotes || "",
  preDemoPhotosComplete: !!p.preDemoPhotosComplete,
  pmSignoff: !!p.pmSignoff,
  pmSignoffName: p.pmSignoffName || "",
  pmSignoffDate: normalizedDates.pmSignoffDate || "",
  safetySignoff: !!p.safetySignoff,
  safetySignoffName: p.safetySignoffName || "",
  safetySignoffDate: normalizedDates.safetySignoffDate || "",
  ticket811VerifiedBy: p.ticket811VerifiedBy || "",
  ticket811VerifiedAt: normalizedDates.ticket811VerifiedAt || "",
  permitActiveVerifiedBy: p.permitActiveVerifiedBy || "",
  permitActiveVerifiedAt: normalizedDates.permitActiveVerifiedAt || "",
  permitPostedVerifiedBy: p.permitPostedVerifiedBy || "",
  permitPostedVerifiedAt: normalizedDates.permitPostedVerifiedAt || "",
  electricDisconnectVerifiedBy: p.electricDisconnectVerifiedBy || "",
  electricDisconnectVerifiedAt: normalizedDates.electricDisconnectVerifiedAt || "",
  gasDisconnectVerifiedBy: p.gasDisconnectVerifiedBy || "",
  gasDisconnectVerifiedAt: normalizedDates.gasDisconnectVerifiedAt || "",
  waterConfirmedVerifiedBy: p.waterConfirmedVerifiedBy || "",
  waterConfirmedVerifiedAt: normalizedDates.waterConfirmedVerifiedAt || "",
  preDemoPhotosVerifiedBy: p.preDemoPhotosVerifiedBy || "",
  preDemoPhotosVerifiedAt: normalizedDates.preDemoPhotosVerifiedAt || "",
  notes: p.notes || "",
  documents: Array.isArray(p.documents) ? p.documents.map(normalizeDocumentRecord) : [],
  photos: Array.isArray(p.photos) ? p.photos.map(normalizePhotoRecord) : [],
  assignedVendors: Array.isArray(p.assignedVendors) ? p.assignedVendors : [],
  assignedInspectors: Array.isArray(p.assignedInspectors) ? p.assignedInspectors : [],
  clientId: p.clientId || "",
  complianceNotes: p.complianceNotes || ""
})
}
const getReferenceSourcesUsed = (prop = {}) => {
  const items = [
    {
      label:"Harris County ePermits",
      value:"eng.hctx.net",
      used: !!(prop.permitPortalUrl || prop.permitActive || prop.permitScopeConfirmed || prop.noViolationsChecked || prop.permitPosted || prop.permitStatus === "Approved")
    },
    {
      label:"HCAD Property Search",
      value:"hcad.org",
      used: !!(prop.hcadVerified || prop.hcadLookupCompleted || prop.hcadNumber || prop.ownerVerified)
    },
    {
      label:"811 Underground Utilities",
      value:"Call 811 / texas811.org",
      used: !!prop.ticket811
    },
    {
      label:"CenterPoint Energy",
      value:"713-207-2222",
      used: !!(prop.electricWrittenConfirm || prop.utilityContactNotes)
    },
    {
      label:"Atmos Gas",
      value:"888-286-6700",
      used: !!(prop.gasWrittenConfirm || prop.utilityContactNotes)
    },
    {
      label:"Houston Water",
      value:"832-393-1000",
      used: !!(prop.waterConfirmed || prop.utilityContactNotes)
    },
    {
      label:"TCEQ Asbestos",
      value:"tceq.texas.gov",
      used: !!(prop.asbestosSurveyRequired || prop.asbestosSurveyComplete || prop.tceqRequired || prop.tceqComplete || prop.tceqCaseNotes)
    },
    {
      label:"Shovels.ai",
      value:"permit research",
      used: !!prop.shovelsResearchNotes
    },
    {
      label:"TCEQ UST Database",
      value:"tceq.texas.gov",
      used: !!prop.ustReviewed
    }
  ]
  return items.filter(item => item.used)
}
const getQuickReferenceItem = (label = "") => QUICK_REFERENCE_ITEMS.find(item => item.label === label)
const escapeHtml = (value = "") => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;")
const printFieldValue = (prop, field) => {
  if (!field) return "--"
  const value = prop?.[field.key]
  if (!isFieldApplicable(prop, field)) return "N/A"
  if (field.type === "boolean") return value ? "Yes" : "No"
  if (field.type === "date") return displayDate(value)
  if (field.type === "datetime") return displayDateTime(value)
  return isTruthyText(value) ? value : "--"
}
const buildPrintableInvoiceHtml = (invoice = {}, client = {}, property = {}, companySettings = {}) => {
  const billingSettings = normalizeCompanySettings(companySettings)
  const configuredCompanyName = String(companySettings?.teamName || "").trim()
  const companyName = configuredCompanyName && configuredCompanyName !== FIXED_TEAM_NAME ? configuredCompanyName : HCG_COMPANY_NAME
  const { invoiceDate, dueDate } = resolveInvoiceDates(invoice, billingSettings.paymentTerms)
  const totals = calcInvoiceTotals(invoice)
  const lineRows = (invoice.lineItems || []).map(item => {
    const quantity = toNumber(item.quantity)
    const unitPrice = toNumber(item.unitPrice)
    const lineTotal = quantity * unitPrice
    return `
      <tr>
        <td>${escapeHtml(item.description || "--")}</td>
        <td>${escapeHtml(String(quantity))}</td>
        <td>$${unitPrice.toFixed(2)}</td>
        <td>$${lineTotal.toFixed(2)}</td>
      </tr>
    `
  }).join("")

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>HCG Invoice</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin:0; padding:0; background:#fff; color:#111; }
    body { font-family: Arial, sans-serif; line-height:1.5; }
    .page { max-width: 960px; margin: 0 auto; padding: 30px; }
    .topbar {
      display:flex;
      justify-content:space-between;
      gap:18px;
      align-items:flex-start;
      margin-bottom: 22px;
      padding-bottom: 18px;
      border-bottom: 2px solid #111827;
    }
    .eyebrow { font-size: 11px; color:#6b7280; text-transform: uppercase; letter-spacing: .14em; font-weight:700; }
    h1 { margin: 6px 0 4px; font-size: 27px; line-height:1.15; }
    h2 {
      margin: 0 0 10px;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      color:#1f2937;
    }
    .subhead { color:#4b5563; margin-bottom: 2px; }
    .invoice-header { text-align:right; min-width: 180px; }
    .invoice-title { font-size: 30px; font-weight: 800; letter-spacing: .16em; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 22px; }
    .box {
      border:1px solid #cbd5e1;
      border-radius: 12px;
      padding: 16px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    }
    .print-card { break-inside: avoid; page-break-inside: avoid; }
    .label { display:block; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#6b7280; margin-bottom:3px; }
    .value { margin-bottom:12px; color:#111827; }
    table { width:100%; border-collapse: collapse; margin-top: 8px; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    th, td { border:1px solid #d1d5db; padding: 9px 10px; text-align:left; vertical-align:top; }
    th {
      background:#eef2f7;
      color:#1f2937;
      font-size:11px;
      text-transform:uppercase;
      letter-spacing:.06em;
    }
    tr { break-inside: avoid; page-break-inside: avoid; }
    .table-wrap { break-inside: auto; page-break-inside: auto; }
    .totals {
      margin-top:16px;
      margin-left:auto;
      width: 320px;
      max-width:100%;
      border:2px solid #111827;
      border-radius:12px;
      padding:12px 14px;
      background:#fff;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .totals-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #e5e7eb; }
    .totals-row.total { font-size:18px; font-weight:700; border-bottom:none; padding-top:10px; color:#111827; }
    .detail-grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 18px; }
    .notes {
      border:1px solid #d1d5db;
      border-radius:10px;
      padding:12px 14px;
      white-space:pre-wrap;
      background:#fff;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .summary-strip { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:12px; margin: 18px 0 22px; }
    .summary-item {
      border:1px solid #cbd5e1;
      border-radius:10px;
      padding:12px 14px;
      background:#f8fafc;
    }
    .summary-value { font-size:22px; font-weight:700; margin-top:4px; color:#111827; }
    .footer {
      margin-top:28px;
      padding-top:14px;
      border-top:1px solid #d1d5db;
      font-size:12px;
      color:#6b7280;
    }
    .no-print { margin-bottom: 16px; }
    @media (max-width: 720px) {
      .topbar { flex-direction:column; }
      .invoice-header { text-align:left; min-width:0; }
      .grid, .detail-grid, .summary-strip { grid-template-columns: 1fr; }
    }
    @page { margin: 0.6in; }
    @media print {
      html, body { background:#fff; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { max-width:none; padding:0; }
      .no-print { display:none; }
      .topbar, .summary-strip, .grid, .box, .summary-item, .footer { break-inside: avoid; page-break-inside: avoid; }
      .box { background:#fff; box-shadow:none; }
      .table-wrap { overflow:visible; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="no-print"><button onclick="window.print()">Print</button></div>
    <div class="topbar">
      <div>
        <div class="eyebrow">Field Operations Platform</div>
        <h1>${escapeHtml(companyName)}</h1>
        <div class="subhead">Invoice</div>
      </div>
      <div class="invoice-header">
        <div class="invoice-title">INVOICE</div>
        <div class="subhead">Status: ${escapeHtml(invoice.status || "Draft")}</div>
      </div>
    </div>

    <div class="summary-strip print-card">
      <div class="summary-item">
        <span class="label">Invoice Status</span>
        <div class="summary-value">${escapeHtml(invoice.status || "Draft")}</div>
      </div>
      <div class="summary-item">
        <span class="label">Due Date</span>
        <div class="summary-value">${escapeHtml(displayDate(dueDate))}</div>
      </div>
      <div class="summary-item">
        <span class="label">Invoice Total</span>
        <div class="summary-value">$${totals.total.toFixed(2)}</div>
      </div>
    </div>

    <div class="grid print-card">
      <div class="box print-card">
        <h2>Invoice Info</h2>
        <span class="label">Invoice ID</span>
        <div class="value">${escapeHtml(invoice.invoiceId || "--")}</div>
        <span class="label">Invoice Date</span>
        <div class="value">${escapeHtml(displayDate(invoiceDate))}</div>
        <span class="label">Due Date</span>
        <div class="value">${escapeHtml(displayDate(dueDate))}</div>
        <span class="label">Date Created</span>
        <div class="value">${escapeHtml(fmt(invoice.createdAt))}</div>
        <span class="label">Client</span>
        <div class="value">${escapeHtml(client.name || invoice.clientName || "--")}</div>
        ${client.company ? `<span class="label">Company</span><div class="value">${escapeHtml(client.company)}</div>` : ""}
        <span class="label">Property Address</span>
        <div class="value">${escapeHtml(property.address || invoice.propertyAddress || "--")}</div>
      </div>

      <div class="box print-card">
        <h2>Bill To</h2>
        <span class="label">Client Name</span>
        <div class="value">${escapeHtml(client.name || invoice.clientName || "--")}</div>
        ${client.company ? `<span class="label">Company</span><div class="value">${escapeHtml(client.company)}</div>` : ""}
        ${client.email || invoice.clientEmail ? `<span class="label">Email</span><div class="value">${escapeHtml(client.email || invoice.clientEmail)}</div>` : ""}
        ${client.phone ? `<span class="label">Phone</span><div class="value">${escapeHtml(client.phone)}</div>` : ""}
        ${client.address ? `<span class="label">Address</span><div class="value">${escapeHtml(client.address)}</div>` : ""}
      </div>
    </div>

    <div class="box table-wrap">
      <h2>Line Items</h2>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${lineRows || `<tr><td colspan="4">No invoice line items.</td></tr>`}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row"><span>Subtotal</span><span>$${totals.subtotal.toFixed(2)}</span></div>
        <div class="totals-row"><span>Tax (${toNumber(invoice.taxPct).toFixed(2)}%)</span><span>$${totals.tax.toFixed(2)}</span></div>
        <div class="totals-row total"><span>Total</span><span>$${totals.total.toFixed(2)}</span></div>
      </div>
    </div>

    <div class="box print-card" style="margin-top:18px;">
      <h2>Payment Details</h2>
      <div class="detail-grid">
        <div>
          <span class="label">Payment Terms</span>
          <div class="value">${escapeHtml(billingSettings.paymentTerms)}</div>
        </div>
        <div>
          <span class="label">Due Date</span>
          <div class="value">${escapeHtml(displayDate(dueDate))}</div>
        </div>
        <div>
          <span class="label">Make Payment To</span>
          <div class="value">${escapeHtml(companyName)}</div>
        </div>
        <div>
          <span class="label">Remit To</span>
          <div class="value">${escapeHtml(billingSettings.companyAddress)}</div>
        </div>
        <div>
          <span class="label">Accepted Payment Methods</span>
          <div class="value">${escapeHtml(billingSettings.acceptedPaymentMethods)}</div>
        </div>
        <div>
          <span class="label">Billing Contact</span>
          <div class="value">${escapeHtml(billingSettings.billingContactName)}</div>
        </div>
        <div>
          <span class="label">Billing Contact Email</span>
          <div class="value">${escapeHtml(billingSettings.billingContactEmail)}</div>
        </div>
        <div>
          <span class="label">Billing Contact Phone</span>
          <div class="value">${escapeHtml(billingSettings.billingContactPhone)}</div>
        </div>
      </div>
      <span class="label">Payment Instructions</span>
      <div class="notes">${escapeHtml(billingSettings.paymentInstructions)}</div>
    </div>

    ${invoice.notes ? `
      <div class="box print-card" style="margin-top:18px;">
        <h2>Notes / Terms</h2>
        <div class="notes">${escapeHtml(invoice.notes)}</div>
      </div>
    ` : `
      <div class="box print-card" style="margin-top:18px;">
        <h2>Notes / Terms</h2>
        <div class="notes">No additional notes or payment terms were entered for this invoice.</div>
      </div>
    `}

    <div class="footer">
      <div>${escapeHtml(companyName)} | Houston, TX</div>
      <div>Generated by Field Operations Platform</div>
    </div>
  </div>
</body>
</html>`
}
const buildPrintablePropertyHtml = (prop, readiness, sourcesUsed) => {
  const utilityRows = [
    ["Electric Disconnect", prop.electric ? "Confirmed" : "Open"],
    ["Gas Disconnect", prop.gas ? "Confirmed" : "Open"],
    ["Water Disconnect", prop.water ? "Confirmed" : "Open"],
    ["Electric Written Confirmation", prop.electricWrittenConfirm ? "Logged" : "Missing"],
    ["Gas Written Confirmation", prop.gasWrittenConfirm ? "Logged" : "Missing"],
    ["Water Confirmed Off", prop.waterConfirmed ? "Yes" : "No"],
    ["811 Ticket", prop.ticket811 || "--"]
  ]
  const complianceSections = COMPLIANCE_GROUPS.map(group => {
    const rows = group.fields
      .filter(field => isFieldApplicable(prop, field))
      .map(field => `
        <tr>
          <td>${escapeHtml(field.label)}</td>
          <td>${escapeHtml(printFieldValue(prop, field))}</td>
        </tr>
      `)
      .join("")
    return `
      <section class="section">
        <h2>${escapeHtml(group.title)}</h2>
        <table>
          <tbody>${rows || `<tr><td colspan="2">No data recorded.</td></tr>`}</tbody>
        </table>
      </section>
    `
  }).join("")
  const documentRows = (prop.documents || []).map(doc => `
    <tr>
      <td>${escapeHtml(doc.category || "Miscellaneous")}</td>
      <td>${escapeHtml(doc.name || "--")}</td>
      <td>${escapeHtml(fmt(doc.uploadedAt))}</td>
      <td>${escapeHtml(doc.notes || "--")}</td>
    </tr>
  `).join("")
  const missingDocumentRows = (readiness.missingDocuments || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")
  const sourceRows = (sourcesUsed || []).map(item => `<li>${escapeHtml(item.label)}: ${escapeHtml(item.value)}</li>`).join("")
  const blockingRows = (readiness.blockingIssues || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")
  const warningRows = (readiness.warnings || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>HCG Compliance Packet</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin:0; padding:0; background:#fff; color:#111; }
    body { font-family: Arial, sans-serif; line-height:1.5; }
    .page { max-width: 960px; margin: 0 auto; padding: 26px; }
    h1, h2, h3 { margin:0 0 8px; color:#111; }
    h1 { font-size: 26px; line-height:1.15; }
    h2 {
      font-size: 14px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: .08em;
      color:#1f2937;
    }
    h3 { font-size: 15px; }
    p { margin:0; }
    .muted { color:#6b7280; }
    .hero {
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:16px;
      margin-bottom:18px;
      padding-bottom:16px;
      border-bottom:2px solid #111827;
    }
    .hero-card {
      border:1px solid #cbd5e1;
      border-radius:12px;
      padding:12px 14px;
      min-width:220px;
      background:#f8fafc;
    }
    .summary-grid { width:100%; border-collapse:collapse; margin-top:14px; }
    .summary-grid td { width:50%; border:1px solid #d1d5db; padding:8px 10px; vertical-align:top; background:#fff; }
    .label { font-size:10px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:.08em; display:block; margin-bottom:3px; }
    .section {
      margin-top:20px;
      border:1px solid #d1d5db;
      border-radius:12px;
      padding:14px;
      background:linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    table { width:100%; border-collapse:collapse; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    th, td { border:1px solid #d1d5db; padding:8px 10px; text-align:left; vertical-align:top; }
    th {
      background:#eef2f7;
      color:#1f2937;
      font-size:11px;
      text-transform:uppercase;
      letter-spacing:.06em;
    }
    tr { break-inside: avoid; page-break-inside: avoid; }
    ul { margin:8px 0 0 18px; padding:0; }
    li { margin:0 0 4px; }
    .note-box {
      border:1px solid #d1d5db;
      border-radius:10px;
      padding:10px 12px;
      white-space:pre-wrap;
      background:#fff;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .status-grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:12px; margin-top:14px; }
    .status-card {
      border:1px solid #cbd5e1;
      border-radius:12px;
      padding:12px 14px;
      background:#f8fafc;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .status-value { font-size:24px; font-weight:700; margin-top:2px; color:#111827; }
    .callout-grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:12px; margin-top:20px; }
    .callout {
      border:1px solid #d1d5db;
      border-radius:12px;
      padding:12px 14px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .callout.blocker { border-color:#ef4444; background:#fff5f5; }
    .callout.warning { border-color:#f59e0b; background:#fffaf0; }
    .no-print { margin-bottom:16px; }
    @media (max-width: 720px) {
      .hero { flex-direction:column; }
      .status-grid, .callout-grid { grid-template-columns: 1fr; }
    }
    @page { margin: 0.6in; }
    @media print {
      body { background:#fff; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { max-width:none; padding:0; }
      .no-print { display:none; }
      .hero, .hero-card, .summary-grid, .status-grid, .status-card, .callout-grid, .callout, .section, .note-box {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .section, .hero-card, .status-card { background:#fff; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="no-print"><button onclick="window.print()">Print</button></div>
    <div class="hero">
      <div>
        <h1>${escapeHtml(HCG_WORKSPACE_NAME)}</h1>
        <div class="muted">Property Compliance Packet</div>
      </div>
      <div class="hero-card">
        <span class="label">Readiness</span>
        <div style="font-size:20px;font-weight:700;">${escapeHtml(readiness.readiness?.label || "--")}</div>
        <div class="muted" style="margin-top:4px;">${escapeHtml(`${readiness.percentComplete}% complete across ${readiness.totalCount || 0} checklist items`)}</div>
      </div>
    </div>
    <table class="summary-grid">
      <tr>
        <td><span class="label">Address</span>${escapeHtml(prop.address || "--")}</td>
        <td><span class="label">Work Order Number</span>${escapeHtml(prop.workOrderNumber || "--")}</td>
      </tr>
      <tr>
        <td><span class="label">Permit Number</span>${escapeHtml(prop.permitNumber || "--")}</td>
        <td><span class="label">HCAD</span>${escapeHtml(prop.hcadNumber || "--")}</td>
      </tr>
      <tr>
        <td><span class="label">Work Type</span>${escapeHtml(prop.workType || "--")}</td>
        <td><span class="label">Permit Status</span>${escapeHtml(prop.permitStatus || "--")}</td>
      </tr>
      <tr>
        <td><span class="label">Readiness Status</span>${escapeHtml(readiness.readiness?.label || "--")}</td>
        <td><span class="label">Completion</span>${escapeHtml(`${readiness.percentComplete}%`)}</td>
      </tr>
      <tr>
        <td><span class="label">Photo Count</span>${escapeHtml(String((prop.photos || []).length))}</td>
        <td><span class="label">Document Count</span>${escapeHtml(String((prop.documents || []).length))}</td>
      </tr>
    </table>

    <div class="status-grid">
      <div class="status-card">
        <span class="label">Completion</span>
        <div class="status-value">${escapeHtml(`${readiness.percentComplete}%`)}</div>
      </div>
      <div class="status-card">
        <span class="label">Blocking Issues</span>
        <div class="status-value">${escapeHtml(String((readiness.blockingIssues || []).length))}</div>
      </div>
      <div class="status-card">
        <span class="label">Missing Required Documents</span>
        <div class="status-value">${escapeHtml(String((readiness.missingDocuments || []).length))}</div>
      </div>
    </div>

    <div class="callout-grid">
      <section class="callout blocker">
        <h2>Blocking Issues</h2>
        ${blockingRows ? `<ul>${blockingRows}</ul>` : "<p>No current blocking issues.</p>"}
      </section>

      <section class="callout warning">
        <h2>Warnings</h2>
        ${warningRows ? `<ul>${warningRows}</ul>` : "<p>No current warnings.</p>"}
      </section>
    </div>

    <section class="section">
      <h2>Utilities Summary</h2>
      <table><tbody>${utilityRows.map(row => `<tr><td>${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td></tr>`).join("")}</tbody></table>
    </section>

    ${complianceSections}

    <section class="section">
      <h2>Final Sign-Off</h2>
      <table>
        <tbody>
          <tr><td>PM Sign-Off Complete</td><td>${escapeHtml(prop.pmSignoff ? "Yes" : "No")}</td></tr>
          <tr><td>PM Sign-Off</td><td>${escapeHtml(prop.pmSignoffName || "--")} | ${escapeHtml(prop.pmSignoffDate || "--")}</td></tr>
          <tr><td>Safety Sign-Off Complete</td><td>${escapeHtml(prop.safetySignoff ? "Yes" : "No")}</td></tr>
          <tr><td>Safety Sign-Off</td><td>${escapeHtml(prop.safetySignoffName || "--")} | ${escapeHtml(prop.safetySignoffDate || "--")}</td></tr>
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>Documents Summary</h2>
      ${missingDocumentRows ? `<div class="note-box" style="margin-bottom:12px;"><strong>Still Missing:</strong><ul>${missingDocumentRows}</ul></div>` : ""}
      ${documentRows ? `<table><thead><tr><th>Category</th><th>File Name</th><th>Uploaded</th><th>Notes</th></tr></thead><tbody>${documentRows}</tbody></table>` : "<p>No compliance documents uploaded.</p>"}
    </section>

    <section class="section">
      <h2>Reference Sources Used</h2>
      ${sourceRows ? `<ul>${sourceRows}</ul>` : "<p>No reference sources logged.</p>"}
    </section>

    <section class="section">
      <h2>Compliance Notes</h2>
      <div class="note-box">${escapeHtml(prop.notes || "No compliance summary has been entered for this property yet.")}</div>
    </section>
  </div>
</body>
</html>`
}


function timeToday(timeStr) {
  const parsed = parseTimeValue(timeStr)
  const d = new Date()
  d.setHours(parsed?.hour24 ?? 0, parsed?.minute ?? 0, 0, 0)
  return d
}

function parseTimeValue(timeStr) {
  const raw = String(timeStr || "").trim()
  if (!raw) return null

  const twelveHourMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (twelveHourMatch) {
    let hour = Number(twelveHourMatch[1])
    const minute = Number(twelveHourMatch[2])
    const period = twelveHourMatch[3].toUpperCase()
    if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 1 || hour > 12 || minute < 0 || minute > 59) return null
    if (period === "PM" && hour !== 12) hour += 12
    if (period === "AM" && hour === 12) hour = 0
    return { hour24: hour, minute }
  }

  const twentyFourHourMatch = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (twentyFourHourMatch) {
    const hour = Number(twentyFourHourMatch[1])
    const minute = Number(twentyFourHourMatch[2])
    if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
    return { hour24: hour, minute }
  }

  return null
}

function formatTime12Hour(timeStr) {
  const parsed = parseTimeValue(timeStr)
  if (!parsed) return ""
  const period = parsed.hour24 >= 12 ? "PM" : "AM"
  const hour12 = parsed.hour24 % 12 || 12
  return `${String(hour12).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")} ${period}`
}

function formatTime24Hour(timeStr) {
  const parsed = parseTimeValue(timeStr)
  if (!parsed) return ""
  return `${String(parsed.hour24).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}`
}

function displayTimeValue(timeStr) {
  return formatTime12Hour(timeStr) || String(timeStr || "")
}


function genCode(name, trade, index) {
  const tradeAbbr = {"Demo / Demolition":"DEM","Abatement":"ABT","Electrical":"ELC","Plumbing":"PLM","Grading / Earthwork":"GRD","Tree Service":"TRE","Hauling / Disposal":"HAL","General Contractor":"GEN","Equipment Rental":"EQP","Engineering":"ENG","Other":"OTH"}
  const abbr = tradeAbbr[trade] || "OTH"
  const nameCode = name.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,3).padEnd(3,"X")
  return `${abbr}-${nameCode}-${String(index+1).padStart(3,"0")}`
}


const buildWorkspaceSnapshotPayload = ({
  props = [],
  mileage = [],
  invoices = [],
  tasks = [],
  oneOffScheduleBlocks = [],
  recurringWeeklySchedule = [],
  users = [],
  teams = [],
  messages = [],
  currentUser = null,
  notifications = [],
  shownOneTimeNotifications = {},
  lastSavedAt = ""
} = {}) => ({
  props: (props || []).map(normalizeProp),
  mileage: (mileage || []).map(normalizeMileageEntry),
  invoices: Array.isArray(invoices) ? invoices : [],
  tasks: Array.isArray(tasks) ? tasks : [],
  oneOffScheduleBlocks: Array.isArray(oneOffScheduleBlocks) ? oneOffScheduleBlocks : [],
  recurringWeeklySchedule: Array.isArray(recurringWeeklySchedule) ? recurringWeeklySchedule : [],
  users: Array.isArray(users) ? users : [],
  teams: Array.isArray(teams) ? teams : [],
  messages: Array.isArray(messages) ? messages : [],
  currentUser: currentUser || null,
  notifications: Array.isArray(notifications) ? notifications.slice(0, 100) : [],
  shownOneTimeNotifications: shownOneTimeNotifications || {},
  lastSavedAt: String(lastSavedAt || "").trim()
})
const toSupabaseUserPayload = (user, teamId) => ({
  team_id: teamId,
  legacy_user_id: user.id,
  name: user.name,
  email: user.email,
  role: user.role || "member",
  approved: user.approved !== false,
  profile_pic: user.profilePic || "",
  active_session_id: user.activeSessionId || null,
  last_login_at: user.lastLoginAt || null,
  must_reset_password: !!user.mustResetPassword,
  password_reset_source: String(user.passwordResetSource || "").trim(),
  metadata: {
    password: String(user.password || ""),
    createdAt: user.createdAt || now()
  }
})
const toSupabasePropertyPayload = (property, teamId) => {
  const normalized = normalizeProp(property)
  return {
    team_id: teamId,
    legacy_property_id: normalized.id,
    address: normalized.address,
    work_type: normalized.workType,
    permit_status: normalized.permitStatus,
    permit_number: normalized.permitNumber || "",
    hcad_number: normalized.hcadNumber || "",
    submitted_to: normalized.submittedTo || "",
    submitted_date: normalizeDateInput(normalized.submittedDate) || null,
    started_at: normalized.startedAt || null,
    electric: !!normalized.electric,
    gas: !!normalized.gas,
    water: !!normalized.water,
    notes: normalized.notes || "",
    is_completed: !!normalized.isCompleted,
    completed_at: normalized.completedAt || null,
    invoice_status: normalized.invoiceStatus || null,
    work_order_number: normalized.workOrderNumber || "",
    county_pm_name: normalized.countyPmName || "",
    mobilization_date: normalizeDateInput(normalized.mobilizationDate) || null,
    ticket811: normalized.ticket811 || "",
    permit_portal_url: normalized.permitPortalUrl || "",
    prepared_by: normalized.preparedBy || "",
    compliance_notes: normalized.complianceNotes || "",
    assigned_vendor_ids: [],
    assigned_inspector_ids: [],
    photos: normalized.photos || [],
    documents: normalized.documents || [],
    record: {
      ...normalized,
      clientId: normalized.clientId || "",
      invoiceId: normalized.invoiceId || null,
      assignedVendors: normalized.assignedVendors || [],
      assignedInspectors: normalized.assignedInspectors || []
    }
  }
}
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
const getDailyTodayFocus = (dateValue = getTodayDateInput()) => {
  const normalized = normalizeDateInput(dateValue) || getTodayDateInput()
  const seed = normalized.replace(/-/g, "").split("").reduce((sum, digit) => sum + Number(digit || 0), 0)
  return TODAY_FOCUS_PRESETS[seed % TODAY_FOCUS_PRESETS.length]
}

const FIXED_TEAM_ID = "team-main"
const FIXED_TEAM_NAME = HCG_WORKSPACE_NAME
const DEFAULT_INVITE_CODE = ""
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
const generateInviteCode = () => Math.random().toString(36).slice(2, 10).toUpperCase()
const buildSingleCompanyAuthState = (storedUsers = [], storedTeams = []) => {
  const storedMainTeam = (storedTeams || []).find(t=>t.teamId===FIXED_TEAM_ID)
  const baseUsers = (storedUsers || [])
    .filter(Boolean)
    .filter(u=>String(u.id || "") !== "user-ceo")
    .filter(u=>String(u.email || "").toLowerCase() !== "admin@hcgmanagement.local")
    .map(u=>({
      ...u,
      teamId:FIXED_TEAM_ID,
      role:u.role||"member",
      activeSessionId:u.activeSessionId||null,
      approved:u.approved !== false,
      mustResetPassword: !!u.mustResetPassword,
      passwordResetSource: String(u.passwordResetSource || "").trim()
    }))
  const resolvedTeamName = String(storedMainTeam?.teamName || FIXED_TEAM_NAME).trim() || FIXED_TEAM_NAME
  const resolvedInviteCode = String(storedMainTeam?.inviteCode || "").trim() || (baseUsers.length ? generateInviteCode() : DEFAULT_INVITE_CODE)
  const pendingRequests = baseUsers
    .filter(u=>u.teamId===FIXED_TEAM_ID && !u.approved)
    .map(u=>({
      userId:u.id,
      name:u.name,
      email:u.email,
      role:u.role || "member",
      requestedAt:u.createdAt || now()
    }))
  const members = baseUsers.filter(u=>u.teamId===FIXED_TEAM_ID && u.approved).map(u=>u.id)
  const normalizedTeams = [{
    teamId:FIXED_TEAM_ID,
    teamName:resolvedTeamName,
    inviteCode:resolvedInviteCode,
    todayFocusCustom: String(storedMainTeam?.todayFocusCustom || "").trim(),
    ...normalizeCompanySettings(storedMainTeam),
    members:[...new Set(members)],
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
  return { normalizedUsers:baseUsers, normalizedTeams }
}

const normalizeClientRecord = (client = {}) => ({
  id: String(client.id || client.legacy_client_id || "").trim() || uid(),
  name: String(client.name || "").trim(),
  company: String(client.company || "").trim(),
  address: String(client.address || "").trim(),
  phone: String(client.phone || "").trim(),
  email: String(client.email || "").trim(),
  jobId: String(client.jobId || client.job_id || "").trim(),
  notes: String(client.notes || "").trim(),
  createdAt: client.createdAt || client.created_at || now()
})

const normalizeVendorRecord = (vendor = {}) => ({
  id: String(vendor.id || vendor.legacy_vendor_id || "").trim() || uid(),
  code: String(vendor.code || "").trim(),
  company: String(vendor.company || "").trim(),
  trade: String(vendor.trade || CONTRACTOR_TRADES[0]).trim() || CONTRACTOR_TRADES[0],
  contact: String(vendor.contact || vendor.contact_name || "").trim(),
  phone: String(vendor.phone || "").trim(),
  email: String(vendor.email || "").trim(),
  license: String(vendor.license || "").trim(),
  notes: String(vendor.notes || "").trim(),
  active: vendor.active !== false,
  createdAt: vendor.createdAt || vendor.created_at || now()
})

const normalizeInspectorRecord = (inspector = {}) => ({
  id: String(inspector.id || inspector.legacy_inspector_id || "").trim() || uid(),
  name: String(inspector.name || "").trim(),
  inspectorType: String(inspector.inspectorType || inspector.inspector_type || INSPECTOR_TYPES[0]).trim() || INSPECTOR_TYPES[0],
  agency: String(inspector.agency || inspector.department || "").trim(),
  badge: String(inspector.badge || "").trim(),
  phone: String(inspector.phone || "").trim(),
  email: String(inspector.email || "").trim(),
  availability: String(inspector.availability || "").trim(),
  certifications: String(inspector.certifications || "").trim(),
  notes: String(inspector.notes || "").trim(),
  active: inspector.active !== false,
  createdAt: inspector.createdAt || inspector.created_at || now()
})

const toSupabaseClientPayload = (client, teamId) => ({
  team_id: teamId,
  legacy_client_id: client.id,
  name: client.name,
  company: client.company,
  address: client.address,
  phone: client.phone,
  email: client.email,
  notes: client.notes,
  metadata: {
    jobId: client.jobId || "",
    createdAt: client.createdAt || now()
  }
})

const fromSupabaseClientPayload = (client = {}) =>
  normalizeClientRecord({
    ...client,
    jobId: client?.metadata?.jobId || "",
    createdAt: client?.metadata?.createdAt || client.created_at
  })

const toSupabaseVendorPayload = (vendor, teamId) => ({
  team_id: teamId,
  legacy_vendor_id: vendor.id,
  code: vendor.code,
  company: vendor.company,
  trade: vendor.trade,
  contact_name: vendor.contact,
  phone: vendor.phone,
  email: vendor.email,
  notes: vendor.notes,
  metadata: {
    license: vendor.license || "",
    active: vendor.active !== false,
    createdAt: vendor.createdAt || now()
  }
})

const fromSupabaseVendorPayload = (vendor = {}) =>
  normalizeVendorRecord({
    ...vendor,
    contact: vendor.contact_name,
    license: vendor?.metadata?.license || "",
    active: vendor?.metadata?.active,
    createdAt: vendor?.metadata?.createdAt || vendor.created_at
  })

const toSupabaseInspectorPayload = (inspector, teamId) => ({
  team_id: teamId,
  legacy_inspector_id: inspector.id,
  name: inspector.name,
  inspector_type: inspector.inspectorType,
  department: inspector.agency,
  phone: inspector.phone,
  email: inspector.email,
  notes: inspector.notes,
  metadata: {
    badge: inspector.badge || "",
    availability: inspector.availability || "",
    certifications: inspector.certifications || "",
    active: inspector.active !== false,
    createdAt: inspector.createdAt || now()
  }
})

const fromSupabaseInspectorPayload = (inspector = {}) =>
  normalizeInspectorRecord({
    ...inspector,
    agency: inspector.department,
    badge: inspector?.metadata?.badge || "",
    availability: inspector?.metadata?.availability || "",
    certifications: inspector?.metadata?.certifications || "",
    active: inspector?.metadata?.active,
    createdAt: inspector?.metadata?.createdAt || inspector.created_at
  })


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
  const [showQuickRef, setShowQuickRef] = useState(false)
  const [addOpen,      setAddOpen]      = useState(false)
  const [newAddr,      setNewAddr]      = useState("")
  const [bulkOpen,     setBulkOpen]     = useState(false)
  const [activeUser,   setActiveUser]   = useState("")
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
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false)
  const [lastSavedAt,  setLastSavedAt]  = useState("")
  const [shownOneTimeNotifications, setShownOneTimeNotifications] = useState({})
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null)
  const [resetPasswordForm, setResetPasswordForm] = useState({ password:"", confirmPassword:"" })
  const [resetPasswordError, setResetPasswordError] = useState("")
  const firedRef = useRef(new Set())
  const propsLoadedRef = useRef(false)
  const workspaceLoadedRef = useRef(false)
  const workspaceTeamIdRef = useRef("")
  const syncedPropertyIdsRef = useRef([])

  const persistUserRecord = useCallback(async (userRecord) => {
    const workspace = await getOrCreateWorkspaceTeam()
    const payload = toSupabaseUserPayload(userRecord, workspace.id)
    return createSupabaseUser(payload).catch(async (error) => {
      if (String(error?.code || "") === "23505") {
        return updateSupabaseUser(userRecord.id, payload)
      }
      throw error
    })
  }, [])

  const persistPropertyRecord = useCallback(async (propertyRecord) => {
    const workspace = await getOrCreateWorkspaceTeam()
    const payload = toSupabasePropertyPayload(propertyRecord, workspace.id)
    return createSupabaseProperty(payload).catch(async (error) => {
      if (String(error?.code || "") === "23505") {
        return updateSupabaseProperty(propertyRecord.id, payload)
      }
      throw error
    })
  }, [])

  const saveClientRecord = useCallback(async (clientRecord) => {
    const normalized = normalizeClientRecord(clientRecord)
    setClients((prev) => {
      const exists = prev.some((item) => item.id === normalized.id)
      const next = exists
        ? prev.map((item) => (item.id === normalized.id ? normalized : item))
        : [normalized, ...prev];

      if (normalized.jobId) {
        return next.map((item) =>
          item.id !== normalized.id && item.jobId === normalized.jobId
            ? { ...item, jobId: "" }
            : item
        );
      }

      return next;
    });

    setProps((prev) =>
      prev.map((property) => {
        if (property.clientId === normalized.id && property.id !== normalized.jobId) {
          return { ...property, clientId: "" };
        }
        if (normalized.jobId && property.id === normalized.jobId) {
          return { ...property, clientId: normalized.id };
        }
        if (!normalized.jobId && property.clientId === normalized.id) {
          return { ...property, clientId: "" };
        }
        return property;
      })
    );

    try {
      const workspace = await getOrCreateWorkspaceTeam();
      const payload = toSupabaseClientPayload(normalized, workspace.id);
      const saved = await createClientRecord(payload).catch(async (error) => {
        if (String(error?.code || "") === "23505") {
          return updateClientRecord(normalized.id, payload);
        }
        throw error;
      });
      const mapped = fromSupabaseClientPayload(saved);
      setClients((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      return { ok: true, data: mapped };
    } catch (error) {
      console.error("Supabase client save failed, local state preserved.", error);
      return { ok: false, error };
    }
  }, []);

  const removeClientRecord = useCallback(async (clientId) => {
    setClients((prev) => prev.filter((client) => client.id !== clientId));
    setProps((prev) => prev.map((property) => property.clientId === clientId ? { ...property, clientId: "" } : property));

    try {
      await deleteClientRecord(clientId);
      return { ok: true };
    } catch (error) {
      console.error("Supabase client delete failed, local removal preserved.", error);
      return { ok: false, error };
    }
  }, []);

  const saveVendorRecord = useCallback(async (vendorRecord) => {
    const normalized = normalizeVendorRecord(vendorRecord);
    setVendors((prev) => {
      const exists = prev.some((item) => item.id === normalized.id);
      return exists
        ? prev.map((item) => (item.id === normalized.id ? normalized : item))
        : [...prev, normalized];
    });

    try {
      const workspace = await getOrCreateWorkspaceTeam();
      const payload = toSupabaseVendorPayload(normalized, workspace.id);
      const saved = await createVendor(payload).catch(async (error) => {
        if (String(error?.code || "") === "23505") {
          return updateVendor(normalized.id, payload);
        }
        throw error;
      });
      const mapped = fromSupabaseVendorPayload(saved);
      setVendors((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      return { ok: true, data: mapped };
    } catch (error) {
      console.error("Supabase vendor save failed, local state preserved.", error);
      return { ok: false, error };
    }
  }, []);

  const removeVendorRecord = useCallback(async (vendorId) => {
    setVendors((prev) => prev.filter((vendor) => vendor.id !== vendorId));

    try {
      await deleteVendor(vendorId);
      return { ok: true };
    } catch (error) {
      console.error("Supabase vendor delete failed, local removal preserved.", error);
      return { ok: false, error };
    }
  }, []);

  const saveInspectorRecord = useCallback(async (inspectorRecord) => {
    const normalized = normalizeInspectorRecord(inspectorRecord);
    setInspectors((prev) => {
      const exists = prev.some((item) => item.id === normalized.id);
      return exists
        ? prev.map((item) => (item.id === normalized.id ? normalized : item))
        : [...prev, normalized];
    });

    try {
      const workspace = await getOrCreateWorkspaceTeam();
      const payload = toSupabaseInspectorPayload(normalized, workspace.id);
      const saved = await createInspector(payload).catch(async (error) => {
        if (String(error?.code || "") === "23505") {
          return updateInspector(normalized.id, payload);
        }
        throw error;
      });
      const mapped = fromSupabaseInspectorPayload(saved);
      setInspectors((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      return { ok: true, data: mapped };
    } catch (error) {
      console.error("Supabase inspector save failed, local state preserved.", error);
      return { ok: false, error };
    }
  }, []);

  const removeInspectorRecord = useCallback(async (inspectorId) => {
    setInspectors((prev) => prev.filter((inspector) => inspector.id !== inspectorId));

    try {
      await deleteInspector(inspectorId);
      return { ok: true };
    } catch (error) {
      console.error("Supabase inspector delete failed, local removal preserved.", error);
      return { ok: false, error };
    }
  }, []);

  useEffect(() => {
    getTeams()
      .then((data) => {
        console.log("Supabase teams connection test:", data)
      })
      .catch((error) => {
        console.error("Supabase teams connection test failed:", error)
      })
  }, [])


  /* ---- Load / Save ---- */
  useEffect(() => {
    let cancelled = false
    const loadWorkspace = async () => {
      try {
        const workspace = await getOrCreateWorkspaceTeam()
        if (cancelled) return
        workspaceTeamIdRef.current = workspace.id

        const [remoteClients, remoteVendors, remoteInspectors, remoteState] = await Promise.all([
          fetchClientsFromSupabase().catch((error) => {
            console.error("Supabase clients load failed.", error)
            return []
          }),
          fetchVendorsFromSupabase().catch((error) => {
            console.error("Supabase vendors load failed.", error)
            return []
          }),
          fetchInspectorsFromSupabase().catch((error) => {
            console.error("Supabase inspectors load failed.", error)
            return []
          }),
          getWorkspaceState(workspace.id).catch((error) => {
            console.error("Supabase workspace state load failed.", error)
            return null
          })
        ])

        const snapshot = remoteState?.data || buildWorkspaceSnapshotPayload()
        const initialClients = (remoteClients || []).map(fromSupabaseClientPayload)
        const initialVendors = (remoteVendors || []).map(fromSupabaseVendorPayload)
        const initialInspectors = (remoteInspectors || []).map(fromSupabaseInspectorPayload)
        const remoteUsers = Array.isArray(snapshot?.users) ? snapshot.users : []
        const remoteTeams = Array.isArray(snapshot?.teams) && snapshot.teams.length
          ? snapshot.teams
          : [{
              teamId: FIXED_TEAM_ID,
              teamName: workspace.team_name || FIXED_TEAM_NAME,
              inviteCode: workspace.invite_code || DEFAULT_INVITE_CODE,
              todayFocusCustom: workspace.today_focus_custom || "",
              ...normalizeCompanySettings({
                companyAddress: workspace.company_address,
                billingContactName: workspace.billing_contact_name,
                billingContactEmail: workspace.billing_contact_email,
                billingContactPhone: workspace.billing_contact_phone,
                paymentTerms: workspace.payment_terms,
                acceptedPaymentMethods: workspace.accepted_payment_methods,
                paymentInstructions: workspace.payment_instructions
              }),
              members: [],
              pendingRequests: [],
              roles: Array.isArray(workspace.roles) ? workspace.roles : ["ceo","management","operations","member"],
              rolePermissions: workspace.role_permissions || defaultRolePermissions()
            }]
        const { normalizedUsers, normalizedTeams } = buildSingleCompanyAuthState(remoteUsers, remoteTeams)

        if (cancelled) return

        setProps((snapshot?.props || []).map(normalizeProp))
        setMileage((snapshot?.mileage || []).map(normalizeMileageEntry))
        setInvoices(Array.isArray(snapshot?.invoices) ? snapshot.invoices : [])
        setTasks(Array.isArray(snapshot?.tasks) ? snapshot.tasks : [])
        setOneOffScheduleBlocks(Array.isArray(snapshot?.oneOffScheduleBlocks) ? snapshot.oneOffScheduleBlocks : [])
        setRecurringWeeklySchedule(Array.isArray(snapshot?.recurringWeeklySchedule) ? snapshot.recurringWeeklySchedule : [])
        setNotifications(Array.isArray(snapshot?.notifications) ? snapshot.notifications : [])
        setUsers(normalizedUsers)
        setTeams(normalizedTeams)
        setNeedsInitialSetup(normalizedUsers.length===0)
        setMessages(sanitizeMessages(Array.isArray(snapshot?.messages) ? snapshot.messages : [], normalizedUsers))
        setCurrentUser(snapshot?.currentUser || null)
        setShownOneTimeNotifications(snapshot?.shownOneTimeNotifications || {})
        setLastSavedAt(String(snapshot?.lastSavedAt || remoteState?.updated_at || "").trim())
        setClients(initialClients)
        setVendors(initialVendors)
        setInspectors(initialInspectors)

        propsLoadedRef.current = true
        workspaceLoadedRef.current = true
        setAuthLoaded(true)
        if (typeof Notification !== "undefined" && Notification.permission === "granted") setPushEnabled(true)
      } catch (error) {
        console.error("Supabase workspace bootstrap failed.", error)
        propsLoadedRef.current = true
        workspaceLoadedRef.current = true
        setAuthLoaded(true)
      }
    }

    loadWorkspace()
    return () => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    if (!authLoaded || !workspaceLoadedRef.current || !workspaceTeamIdRef.current) return
    const savedAt = now()
    const payload = buildWorkspaceSnapshotPayload({
      props,
      mileage,
      invoices,
      tasks,
      oneOffScheduleBlocks,
      recurringWeeklySchedule,
      users,
      teams,
      messages: sanitizeMessages(messages, users),
      currentUser,
      notifications,
      shownOneTimeNotifications,
      lastSavedAt: savedAt
    })

    saveWorkspaceState(workspaceTeamIdRef.current, payload)
      .then(() => setLastSavedAt(savedAt))
      .catch((error) => {
        console.error("Supabase workspace state save failed.", error)
      })
  }, [
    authLoaded,
    props,
    mileage,
    invoices,
    tasks,
    oneOffScheduleBlocks,
    recurringWeeklySchedule,
    users,
    teams,
    messages,
    currentUser,
    notifications,
    shownOneTimeNotifications
  ])
  useEffect(() => {
    if (!authLoaded || !workspaceLoadedRef.current || !workspaceTeamIdRef.current) return
    Promise.all((props || []).map(persistPropertyRecord))
      .catch((error) => {
        console.error("Supabase properties sync failed.", error)
      })

    const currentIds = (props || []).map(item => item.id)
    const removedIds = syncedPropertyIdsRef.current.filter(id => !currentIds.includes(id))
    removedIds.forEach(id => {
      deleteSupabaseProperty(id).catch(error => {
        console.error("Supabase property delete sync failed.", error)
      })
    })
    syncedPropertyIdsRef.current = currentIds
  }, [authLoaded, props, persistPropertyRecord])
  useEffect(() => {
    if (!authLoaded || !workspaceLoadedRef.current) return
    const mainTeam = (teams || []).find(team => team.teamId === FIXED_TEAM_ID)
    if (!mainTeam) return
    syncWorkspaceTeam({
      team_name: mainTeam.teamName || FIXED_TEAM_NAME,
      invite_code: mainTeam.inviteCode || "",
      today_focus_custom: mainTeam.todayFocusCustom || "",
      company_address: mainTeam.companyAddress || DEFAULT_COMPANY_SETTINGS.companyAddress,
      billing_contact_name: mainTeam.billingContactName || DEFAULT_COMPANY_SETTINGS.billingContactName,
      billing_contact_email: mainTeam.billingContactEmail || DEFAULT_COMPANY_SETTINGS.billingContactEmail,
      billing_contact_phone: mainTeam.billingContactPhone || DEFAULT_COMPANY_SETTINGS.billingContactPhone,
      payment_terms: mainTeam.paymentTerms || DEFAULT_COMPANY_SETTINGS.paymentTerms,
      accepted_payment_methods: mainTeam.acceptedPaymentMethods || DEFAULT_COMPANY_SETTINGS.acceptedPaymentMethods,
      payment_instructions: mainTeam.paymentInstructions || DEFAULT_COMPANY_SETTINGS.paymentInstructions,
      roles: mainTeam.roles || ["ceo","management","operations","member"],
      role_permissions: mainTeam.rolePermissions || defaultRolePermissions()
    }).catch(error => {
      console.error("Supabase team settings sync failed.", error)
    })
  }, [authLoaded, teams])
  useEffect(() => {
    saveOneTimeNotificationLedger(shownOneTimeNotifications)
  }, [shownOneTimeNotifications])


  /* ---- Tick every 30s ---- */
  useEffect(()=>{ const t = setInterval(()=>setTick(x=>x+1), 30000); return()=>clearInterval(t) },[])
  useEffect(() => {
    window.scrollTo({ top:0, left:0, behavior:"auto" })
  }, [tab, selectedInvoiceId])


  /* ---- Fire notification ---- */
  const fireNotif = useCallback((type, title, body, recipients, dedupeKey = "") => {
    const key = dedupeKey || `${type}-${title}-${new Date().toDateString()}`
    if (firedRef.current.has(key)) return
    firedRef.current.add(key)

    const teamRecipients = users.filter(u=>u.approved && u.teamId===currentUser?.teamId).map(u=>u.id)
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
      sendPushNotification(`${HCG_COMPANY_NAME}: ${title}`, body)
    }
  },[pushEnabled, activeUser, users, currentUser?.teamId])
  const markOneTimeNotificationsShown = useCallback((userId, eventKeys = []) => {
    const cleanUserId = String(userId || "").trim()
    const cleanKeys = [...new Set((eventKeys || []).map(key => String(key || "").trim()).filter(Boolean))]
    if (!cleanUserId || !cleanKeys.length) return
    setShownOneTimeNotifications(prev => {
      const currentUserLedger = prev?.[cleanUserId] || {}
      const nextUserLedger = { ...currentUserLedger }
      let changed = false
      cleanKeys.forEach(key => {
        if (nextUserLedger[key]) return
        nextUserLedger[key] = now()
        changed = true
      })
      return changed ? { ...prev, [cleanUserId]: nextUserLedger } : prev
    })
  }, [])
  const notifyCurrentUserOneTimeEvent = useCallback(({ userId, eventKey, type, title, body }) => {
    const cleanUserId = String(userId || "").trim()
    const cleanEventKey = String(eventKey || "").trim()
    if (!cleanUserId || !cleanEventKey || currentUser?.id !== cleanUserId) return
    if (shownOneTimeNotifications?.[cleanUserId]?.[cleanEventKey]) return
    fireNotif(type, title, body, [cleanUserId], cleanEventKey)
    markOneTimeNotificationsShown(cleanUserId, [cleanEventKey])
  }, [currentUser?.id, fireNotif, markOneTimeNotificationsShown, shownOneTimeNotifications])
  useEffect(() => {
    const cleanUserId = String(currentUser?.id || "").trim()
    if (!cleanUserId || !currentUser?.approved) return
    const ledger = shownOneTimeNotifications?.[cleanUserId] || {}
    const pendingNotifications = []
    const previewText = (value = "") => {
      const clean = String(value || "").trim()
      return clean.length > 88 ? `${clean.slice(0, 85)}...` : clean
    }
    const todayIso = getTodayDateInput()

    messages
      .filter(message => (message.kind || "team") === "dm" && message.toUserId === cleanUserId)
      .forEach(message => {
        const eventKey = `dm:${message.id}`
        if (ledger[eventKey]) return
        pendingNotifications.push({
          userId: cleanUserId,
          eventKey,
          type: "private_message",
          title: `New Private Message from ${message.senderName || "Team Member"}`,
          body: previewText(message.message || "Open chat to review the message.")
        })
      })

    tasks
      .filter(task => task.assignedUserId === cleanUserId && String(task.status || "To Do") !== "Done")
      .forEach(task => {
        const eventKey = `task:${task.id}`
        if (ledger[eventKey]) return
        pendingNotifications.push({
          userId: cleanUserId,
          eventKey,
          type: "task",
          title: `Task Assigned - ${task.title || "Untitled Task"}`,
          body: `Due ${displayDate(task.dueDate)}${task.dueTime ? ` at ${displayTimeValue(task.dueTime)}` : ""}`
        })
      })

    oneOffScheduleBlocks
      .filter(entry => entry.userId === cleanUserId && (!entry.date || entry.date >= todayIso))
      .forEach(entry => {
        const eventKey = `schedule:oneoff:${entry.id}`
        if (ledger[eventKey]) return
        pendingNotifications.push({
          userId: cleanUserId,
          eventKey,
          type: "schedule",
          title: `Schedule Added - ${entry.title || "One-Off Block"}`,
          body: `${displayDate(entry.date)} | ${entry.start || "08:00 AM"} - ${entry.end || "05:00 PM"}`
        })
      })

    recurringWeeklySchedule
      .filter(entry => entry.userId === cleanUserId)
      .forEach(entry => {
        const eventKey = `schedule:recurring:${entry.id}`
        if (ledger[eventKey]) return
        pendingNotifications.push({
          userId: cleanUserId,
          eventKey,
          type: "schedule",
          title: `Recurring Schedule Added - ${entry.day || "Schedule"}`,
          body: `${entry.start || "08:00 AM"} - ${entry.end || "05:00 PM"}${entry.note ? ` | ${entry.note}` : ""}`
        })
      })

    if (!pendingNotifications.length) return
    pendingNotifications.forEach(item => {
      fireNotif(item.type, item.title, item.body, [item.userId], item.eventKey)
    })
    markOneTimeNotificationsShown(cleanUserId, pendingNotifications.map(item => item.eventKey))
  }, [currentUser?.approved, currentUser?.id, fireNotif, markOneTimeNotificationsShown, messages, oneOffScheduleBlocks, recurringWeeklySchedule, shownOneTimeNotifications, tasks])


  /* ---- Schedule checker ---- */
  useEffect(()=>{
    const teamMembers = users.filter(u=>u.teamId===currentUser?.teamId && u.approved)
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
          fireNotif("deadline", `Task Due in 30 Minutes - ${task.title}`, `Due at ${displayTimeValue(task.dueTime)}.`, [task.assignedUserId].filter(Boolean))
        }
        if (diff >= 14 && diff <= 16) {
          fireNotif("deadline", `Task Due in 15 Minutes - ${task.title}`, `Due at ${displayTimeValue(task.dueTime)}.`, [task.assignedUserId].filter(Boolean))
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
  },[tick, fireNotif, users, oneOffScheduleBlocks, recurringWeeklySchedule, tasks, currentUser?.teamId])


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
      if (field==="permitStatus") u.permitActive = val==="Approved" ? true : u.permitActive
      if (field==="water") u.waterConfirmed = !!val
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
    const createdAt = now()
    const p={ id:uid(), address:newAddr.trim(), workType:"-- Select --", permitStatus:"--",
      submittedTo:"", submittedDate:"", startedAt:null, permitNumber:"", hcadNumber:"",
      electric:false, gas:false, water:false, notes:"", photos:[], assignedVendors:[],
      assignedInspectors:[], clientId:"", isCompleted:false, completedAt:null, invoiceId:null, invoiceStatus:null, createdAt,
      ...HCG_COMPLIANCE_FIELDS,
      preparedBy:String(currentUser?.name || "").trim(),
      workOrderNumber:buildWorkOrderNumber(props, createdAt) }
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
    const nextUser = { ...found, activeSessionId:sessionId, lastLoginAt:loginAt }
    setUsers(prev=>prev.map(u=>u.id!==found.id?u:nextUser))
    setCurrentUser(nextUser)
    persistUserRecord(nextUser).catch(error => {
      console.error("Supabase user login sync failed.", error)
    })
    return { ok:true }
  }

  const runInitialAdminSetup = ({ name, email, password }) => {
    const cleanName = String(name || "").trim()
    const cleanEmail = String(email || "").trim().toLowerCase()
    if (!cleanName || !cleanEmail || !password) return { ok:false, error:"Please complete all required fields." }
    const loginAt = now()
    const sessionId = uid()
    const inviteCode = generateInviteCode()
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
      role:"ceo",
      mustResetPassword:false,
      passwordResetSource:""
    }
    const nextTeam = {
      teamId:FIXED_TEAM_ID,
      teamName:FIXED_TEAM_NAME,
      inviteCode,
      todayFocusCustom:"",
      ...DEFAULT_COMPANY_SETTINGS,
      members:[nextUser.id],
      pendingRequests:[],
      roles:["ceo","management","operations","member"],
      rolePermissions: defaultRolePermissions()
    }
    setUsers([nextUser])
    setTeams([nextTeam])
    setCurrentUser(nextUser)
    setNeedsInitialSetup(false)
    persistUserRecord(nextUser).catch(error => {
      console.error("Supabase admin user create failed.", error)
    })
    return { ok:true }
  }

  const signup = ({ name, email, password, invite }) => {
    if (needsInitialSetup) return { ok:false, error:"Complete initial admin setup before creating invited users." }
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanName || !cleanEmail || !password) return { ok:false, error:"Please complete all required fields." }
    if (users.some(u=>u.email.toLowerCase()===cleanEmail)) return { ok:false, error:"That email is already in use." }

    const enteredCode = (invite || "").trim().toUpperCase()
    const activeInviteCode = String(teams.find(t=>t.teamId===FIXED_TEAM_ID)?.inviteCode || "").toUpperCase()
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
      approved:false,
      activeSessionId:sessionId,
      lastLoginAt:loginAt,
      role:"member"
    }
    setUsers(prev=>[...prev, nextUser])
    setTeams(prev=>prev.map(t=>t.teamId!==FIXED_TEAM_ID?t:{
      ...t,
      pendingRequests:[
        ...(t.pendingRequests||[]),
        {
          userId:nextUser.id,
          name:nextUser.name,
          email:nextUser.email,
          role:nextUser.role,
          requestedAt:nextUser.createdAt
        }
      ]
    }))
    setCurrentUser(nextUser)
    persistUserRecord(nextUser).catch(error => {
      console.error("Supabase signup user create failed.", error)
    })
    return { ok:true }
  }

  const logout = () => {
    if (currentUser?.id) {
      const nextUser = { ...currentUser, activeSessionId:null }
      setUsers(prev=>prev.map(u=>u.id!==currentUser.id?u:nextUser))
      persistUserRecord(nextUser).catch(error => {
        console.error("Supabase user logout sync failed.", error)
      })
    }
    setCurrentUser(null)
  }

  const approveTeamRequest = (teamIdValue, userIdValue) => {
    const targetUser = users.find(u=>u.id===userIdValue)
    const nextUser = targetUser ? { ...targetUser, approved:true } : null
    setUsers(prev=>prev.map(u=>u.id!==userIdValue?u:{...u, approved:true}))
    setTeams(prev=>prev.map(t=>{
      if (t.teamId!==teamIdValue) return t
      const pending = (t.pendingRequests||[]).filter(r=>r.userId!==userIdValue)
      const members = (t.members||[]).includes(userIdValue) ? (t.members||[]) : [...(t.members||[]), userIdValue]
      return { ...t, pendingRequests:pending, members }
    }))
    if (nextUser) {
      persistUserRecord(nextUser).catch(error => {
        console.error("Supabase user approval sync failed.", error)
      })
    }
  }

  const denyTeamRequest = (teamIdValue, userIdValue) => {
    setUsers(prev=>prev.filter(u=>u.id!==userIdValue))
    setTeams(prev=>prev.map(t=>t.teamId!==teamIdValue?t:{...t,pendingRequests:(t.pendingRequests||[]).filter(r=>r.userId!==userIdValue)}))
    setMessages(prev=>prev.filter(m=>m.senderId!==userIdValue && m.toUserId!==userIdValue))
    if (currentUser?.id===userIdValue) setCurrentUser(null)
    deleteSupabaseUser(userIdValue).catch(error => {
      console.error("Supabase denied user cleanup failed.", error)
    })
  }

  const updateTeamInviteCode = (newCode) => {
    const clean = String(newCode || "").trim().toUpperCase().replace(/\s+/g,"")
    if (!clean) return { ok:false, error:"Invite code cannot be empty." }
    if (clean.length < 4) return { ok:false, error:"Invite code must be at least 4 characters." }
    setTeams(prev=>prev.map(t=>t.teamId!==FIXED_TEAM_ID?t:{...t,inviteCode:clean}))
    return { ok:true }
  }

  const forceLogoutTeamUser = (userIdValue) => {
    if (!userIdValue) return
    const targetUser = users.find(u=>u.id===userIdValue)
    const nextUser = targetUser ? { ...targetUser, activeSessionId:null } : null
    setUsers(prev=>prev.map(u=>u.id!==userIdValue?u:{...u,activeSessionId:null}))
    if (currentUser?.id===userIdValue) setCurrentUser(null)
    if (nextUser) {
      persistUserRecord(nextUser).catch(error => {
        console.error("Supabase force logout sync failed.", error)
      })
    }
  }

  const removeTeamUser = (userIdValue) => {
    if (!userIdValue) return
    setUsers(prev=>prev.filter(u=>u.id!==userIdValue))
    setTeams(prev=>prev.map(t=>t.teamId!==FIXED_TEAM_ID?t:{
      ...t,
      members:(t.members||[]).filter(id=>id!==userIdValue),
      pendingRequests:(t.pendingRequests||[]).filter(r=>r.userId!==userIdValue)
    }))
    setMessages(prev=>prev.filter(m=>m.senderId!==userIdValue && m.toUserId!==userIdValue))
    if (currentUser?.id===userIdValue) setCurrentUser(null)
    deleteSupabaseUser(userIdValue).catch(error => {
      console.error("Supabase user removal failed.", error)
    })
  }

  const updateCurrentProfile = (updates) => {
    if (!currentUser) return { ok:false, error:"No user session." }
    const nextName = String(updates.name ?? currentUser.name).trim()
    const nextEmail = String(updates.email ?? currentUser.email).trim().toLowerCase()
    const nextPhoto = updates.profilePic ?? currentUser.profilePic ?? ""
    const nextPassword = typeof updates.password === "string" && updates.password.length ? updates.password : currentUser.password
    const mustResetPassword = updates.mustResetPassword ?? currentUser.mustResetPassword
    const currentPasswordInput = String(updates.currentPassword ?? "")
    const emailChanged = nextEmail !== String(currentUser.email || "").trim().toLowerCase()
    const passwordChanged = nextPassword !== currentUser.password

    if (!nextName || !nextEmail) return { ok:false, error:"Name and email are required." }
    if (users.some(u=>u.id!==currentUser.id && String(u.email||"").toLowerCase()===nextEmail)) return { ok:false, error:"Email already used by another user." }
    if ((emailChanged || passwordChanged) && !currentPasswordInput) return { ok:false, error:"Enter your current password to change email or password." }
    if ((emailChanged || passwordChanged) && currentPasswordInput !== currentUser.password) return { ok:false, error:"Current password is incorrect." }

    setUsers(prev=>prev.map(u=>u.id!==currentUser.id?u:{
      ...u,
      name:nextName,
      email:nextEmail,
      profilePic:nextPhoto,
      password:nextPassword,
      mustResetPassword: !!mustResetPassword,
      passwordResetSource: passwordChanged ? "" : String(u.passwordResetSource || "").trim()
    }))
    persistUserRecord({
      ...currentUser,
      name:nextName,
      email:nextEmail,
      profilePic:nextPhoto,
      password:nextPassword,
      mustResetPassword: !!mustResetPassword,
      passwordResetSource: passwordChanged ? "" : String(currentUser.passwordResetSource || "").trim()
    }).catch(error => {
      console.error("Supabase profile update sync failed.", error)
    })
    return { ok:true }
  }

  const resetTeamUserPassword = useCallback((userIdValue, nextPassword) => {
    const cleanRole = String(currentUser?.role || "").toLowerCase()
    if (!["ceo","admin"].includes(cleanRole)) return { ok:false, error:"Only CEO or Admin can reset passwords." }
    const target = users.find(u=>u.id===userIdValue)
    if (!target) return { ok:false, error:"User not found." }
    if (target.teamId !== currentUser?.teamId) return { ok:false, error:"User is not in your workspace." }
    if (String(target.role || "").toLowerCase() === "ceo") return { ok:false, error:"CEO accounts must change passwords from their own profile." }
    const password = String(nextPassword || "")
    if (!password.trim()) return { ok:false, error:"Temporary password cannot be empty." }
    if (password.length < 8) return { ok:false, error:"Temporary password must be at least 8 characters." }
    setUsers(prev=>prev.map(u=>u.id!==userIdValue ? u : {
      ...u,
      password,
      mustResetPassword:true,
      passwordResetSource:"admin_reset"
    }))
    persistUserRecord({
      ...target,
      password,
      mustResetPassword:true,
      passwordResetSource:"admin_reset"
    }).catch(error => {
      console.error("Supabase password reset sync failed.", error)
    })
    return { ok:true }
  }, [currentUser?.role, currentUser?.teamId, persistUserRecord, users])

  const completeForcedPasswordReset = useCallback((nextPassword, confirmPassword) => {
    if (!currentUser?.id) return { ok:false, error:"No user session." }
    const password = String(nextPassword || "")
    const confirm = String(confirmPassword || "")
    if (!password.trim()) return { ok:false, error:"Enter a new password." }
    if (password.length < 8) return { ok:false, error:"New password must be at least 8 characters." }
    if (password !== confirm) return { ok:false, error:"Password confirmation does not match." }
    setUsers(prev=>prev.map(u=>u.id!==currentUser.id ? u : {
      ...u,
      password,
      mustResetPassword:false,
      passwordResetSource:""
    }))
    setCurrentUser(prev=>prev ? {
      ...prev,
      password,
      mustResetPassword:false,
      passwordResetSource:""
    } : prev)
    persistUserRecord({
      ...currentUser,
      password,
      mustResetPassword:false,
      passwordResetSource:""
    }).catch(error => {
      console.error("Supabase forced password reset completion sync failed.", error)
    })
    return { ok:true }
  }, [currentUser, persistUserRecord])

  const openResetPasswordModal = useCallback((user) => {
    if (!user) return
    setResetPasswordTarget(user)
    setResetPasswordForm({ password:"", confirmPassword:"" })
    setResetPasswordError("")
  }, [])

  const closeResetPasswordModal = useCallback(() => {
    setResetPasswordTarget(null)
    setResetPasswordForm({ password:"", confirmPassword:"" })
    setResetPasswordError("")
  }, [])

  const saveResetPassword = useCallback(() => {
    if (!resetPasswordTarget) return
    const password = String(resetPasswordForm.password || "")
    const confirmPassword = String(resetPasswordForm.confirmPassword || "")
    if (!password.trim()) {
      setResetPasswordError("Temporary password cannot be empty.")
      return
    }
    if (password.length < 8) {
      setResetPasswordError("Temporary password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setResetPasswordError("Password confirmation does not match.")
      return
    }
    const res = resetTeamUserPassword(resetPasswordTarget.id, password)
    if (!res?.ok) {
      setResetPasswordError(res?.error || "Unable to reset password.")
      return
    }
    window.alert(`${resetPasswordTarget.name || "This user"} now has a temporary password and will be required to change it at next login.`)
    closeResetPasswordModal()
  }, [closeResetPasswordModal, resetPasswordForm.confirmPassword, resetPasswordForm.password, resetPasswordTarget, resetTeamUserPassword])

  const updateCompanyName = (name) => {
    if (!isCurrentCeo) return { ok:false, error:"Only the CEO can change company name." }
    const clean = String(name||"").trim()
    if (!clean) return { ok:false, error:"Company name cannot be empty." }
    setTeams(prev=>prev.map(t=>t.teamId!==FIXED_TEAM_ID?t:{...t,...normalizeCompanySettings(t),teamName:clean}))
    return { ok:true }
  }

  const updateCompanySettings = (updates = {}) => {
    if (!isCurrentCeo) return { ok:false, error:"Only the CEO can update billing settings." }
    const nextSettings = {}
    COMPANY_SETTINGS_KEYS.forEach(key => {
      if (!(key in updates)) return
      const cleanValue = String(updates[key] ?? "").trim()
      nextSettings[key] = cleanValue || DEFAULT_COMPANY_SETTINGS[key]
    })
    setTeams(prev=>prev.map(t=>t.teamId!==FIXED_TEAM_ID ? t : { ...t, ...normalizeCompanySettings(t), ...nextSettings }))
    return { ok:true }
  }
  const updateTodayFocus = (value) => {
    if (!isCurrentCeo) return { ok:false, error:"Only the CEO can update Today's Focus." }
    const clean = String(value || "").trim()
    setTeams(prev=>prev.map(t=>t.teamId!==FIXED_TEAM_ID ? t : { ...t, todayFocusCustom:clean }))
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
    if (!currentTeam?.roles?.includes(cleanRole) && cleanRole!=="ceo") return { ok:false, error:"Role not in team role list." }
    const targetUser = users.find(u=>u.id===userIdValue)
    setUsers(prev=>prev.map(u=>u.id!==userIdValue?u:{...u,role:cleanRole}))
    if (targetUser) {
      persistUserRecord({ ...targetUser, role:cleanRole }).catch(error => {
        console.error("Supabase role assignment sync failed.", error)
      })
    }
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


  const deleteProp = (id) => {
    if(!window.confirm("Remove this property?")) return
    setProps(p=>p.filter(x=>x.id!==id))
    if(selected===id) setSelected(null)
  }


  const handlePhotos = (id, files) => {
    Array.from(files).forEach(file=>{
      const r=new FileReader(); r.onload=e=>{
        setProps(prev=>prev.map(p=>p.id!==id ? p : normalizeProp({
          ...p,
          photos:[
            ...(p.photos || []),
            normalizePhotoRecord({ id:uid(), name:file.name, displayName:file.name, data:e.target.result, date:now(), note:"" })
          ]
        })))
      }; r.readAsDataURL(file)
    })
  }
  const removePhoto = useCallback((propId, photoId) => {
    setProps(prev=>prev.map(p=>p.id!==propId ? p : normalizeProp({
      ...p,
      photos:(p.photos || []).filter(photo=>photo.id!==photoId)
    })))
  }, [])
  const renamePhoto = useCallback((propId, photoId, displayName) => {
    const nextDisplayName = String(displayName || "").trim()
    setProps(prev=>prev.map(p=>p.id!==propId ? p : normalizeProp({
      ...p,
      photos:(p.photos || []).map(photo=>photo.id!==photoId ? photo : normalizePhotoRecord({
        ...photo,
        displayName: nextDisplayName || photo.name
      }))
    })))
    return { ok:true }
  }, [])

  const handleDocuments = async (id, files, category, notes = "") => {
    for (const file of Array.from(files || [])) {
      const uploadedAt = now()
      const baseDocument = {
        id:uid(),
        name:file.name,
        category:category || "Miscellaneous",
        uploadedAt,
        notes:notes || "",
        mimeType:file.type || "application/octet-stream",
        size:file.size || 0
      }

      if ((file.size || 0) > MAX_DOCUMENT_PERSIST_BYTES) {
        const warning = getDocumentTooLargeMessage(file.name)
        reportStorageFailure(warning)
        setProps(prev=>prev.map(p=>p.id!==id ? p : normalizeProp({
          ...p,
          documents:[
            ...(p.documents || []),
            normalizeDocumentRecord({
              ...baseDocument,
              data:"",
              dataStored:false,
              storageKind:"metadata-only",
              persistenceWarning:warning
            })
          ]
        })))
        continue
      }

      try {
        const dataUrl = await readFileAsDataUrl(file)
        setProps(prev=>prev.map(p=>p.id!==id ? p : normalizeProp({
          ...p,
          documents:[
            ...(p.documents || []),
            normalizeDocumentRecord({
              ...baseDocument,
              data:dataUrl,
              dataStored:true,
              storageKind:"supabase",
              persistenceWarning:""
            })
          ]
        })))
      } catch (error) {
        const warning = getDocumentPersistenceFailureMessage(file.name)
        reportStorageFailure(warning, error)
        setProps(prev=>prev.map(p=>p.id!==id ? p : normalizeProp({
          ...p,
          documents:[
            ...(p.documents || []),
            normalizeDocumentRecord({
              ...baseDocument,
              data:"",
              dataStored:false,
              storageKind:"metadata-only",
              persistenceWarning:warning
            })
          ]
        })))
      }
    }
  }

  const removeDocument = useCallback((propId, documentId) => {
    setProps(prev=>prev.map(p=>p.id!==propId ? p : normalizeProp({
      ...p,
      documents:(p.documents || []).filter(doc=>doc.id!==documentId)
    })))
  }, [])

  const updateDocumentDetails = useCallback((propId, documentId, updates = {}) => {
    setProps(prev=>prev.map(p=>p.id!==propId ? p : normalizeProp({
      ...p,
      documents:(p.documents || []).map(doc=>doc.id!==documentId ? doc : normalizeDocumentRecord({
        ...doc,
        ...updates
      }))
    })))
    return { ok:true }
  }, [])

  const printPropertyPacket = useCallback((propId) => {
    const target = props.find(p=>p.id===propId)
    if (!target) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    const normalized = normalizeProp(target)
    const readiness = getChecklistStatus(normalized)
    const sourcesUsed = getReferenceSourcesUsed(normalized)
    const htmlString = buildPrintablePropertyHtml(normalized, readiness, sourcesUsed)
    printWindow.document.open()
    printWindow.document.write(htmlString)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 300)
  }, [props])

  const exportInvoicePacket = useCallback((invoicePayload) => {
    if (!invoicePayload) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    const invoice = {
      ...invoicePayload,
      lineItems: Array.isArray(invoicePayload.lineItems) ? invoicePayload.lineItems : []
    }
    const client = clients.find(c=>c.id===invoice.clientId) || {}
    const property = props.find(p=>p.id===invoice.propertyId) || {}
    const team = teams.find(t=>t.teamId===currentUser?.teamId) || teams.find(t=>t.teamId===FIXED_TEAM_ID) || {}
    const htmlString = buildPrintableInvoiceHtml(invoice, client, property, team)
    printWindow.document.open()
    printWindow.document.write(htmlString)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 300)
  }, [clients, props, teams, currentUser?.teamId])


  const enablePush = async () => {
    const result = await requestPushPermission()
    if (result === "granted") { setPushEnabled(true); fireNotif("schedule","Push Notifications On",`${HCG_COMPANY_NAME} will now send browser alerts to this device.`,[]) }
    else alert("Push notifications blocked. Please enable them in your browser settings, then refresh.")
  }


  const unreadCount = notifications.filter(n=>!n.read && n.recipients.includes(activeUser)).length
  const selProp = props.find(p=>p.id===selected)
  const clientMap = Object.fromEntries(clients.map(c=>[c.id, c]))
  const currentTeam = currentUser ? teams.find(t=>t.teamId===currentUser.teamId) : null
  const todayFocusMessage = String(currentTeam?.todayFocusCustom || "").trim() || getDailyTodayFocus(getTodayDateInput())
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
  const reopenJob = useCallback((propId) => {
    setProps(prev=>prev.map(p=>p.id!==propId ? p : normalizeProp({
      ...p,
      isCompleted:false,
      completedAt:null
    })))
  }, [])

  const addMileageEntry = useCallback((entry) => {
    if (!entry) return
    setMileage(prev=>[normalizeMileageEntry({ ...entry, id:uid(), createdAt:now() }), ...prev])
  }, [])

  const createInvoiceFromJob = useCallback((propId) => {
    const prop = props.find(p=>p.id===propId)
    if (!prop || !prop.isCompleted || !prop.clientId || prop.invoiceId) return null
    const client = clients.find(c=>c.id===prop.clientId)
    if (!client) return null
    const team = teams.find(t=>t.teamId===currentUser?.teamId) || teams.find(t=>t.teamId===FIXED_TEAM_ID) || {}
    const billingSettings = normalizeCompanySettings(team)
    const invoiceDate = normalizeDateInput(now())
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
      invoiceDate,
      dueDate:deriveInvoiceDueDate(invoiceDate, billingSettings.paymentTerms),
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
  }, [props, clients, teams, currentUser?.teamId])

  const updateInvoice = useCallback((invoiceId, updates) => {
    const team = teams.find(t=>t.teamId===currentUser?.teamId) || teams.find(t=>t.teamId===FIXED_TEAM_ID) || {}
    const billingSettings = normalizeCompanySettings(team)
    let latest = null
    setInvoices(prev=>prev.map(inv=>{
      if (inv.id!==invoiceId) return inv
      const merged = { ...inv, ...updates }
      const { invoiceDate, dueDate } = resolveInvoiceDates(merged, billingSettings.paymentTerms)
      latest = { ...merged, invoiceDate, dueDate }
      return latest
    }))
    if (!latest) return
    setProps(prev=>prev.map(p=>p.invoiceId!==invoiceId ? p : normalizeProp({
      ...p,
      invoiceStatus:latest.status
    })))
  }, [teams, currentUser?.teamId])

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

  const exportAllData = useCallback(() => {
    const payload = {
      exportedAt: now(),
      company: HCG_COMPANY_NAME,
      version: 1,
      data: {
        props,
        mileage,
        clients,
        invoices,
        tasks,
        oneOffScheduleBlocks,
        recurringWeeklySchedule,
        vendors,
        inspectors,
        notifications,
        users,
        teams,
        messages: sanitizeMessages(messages, users),
        currentUser
      }
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" })
    const href = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = href
    link.download = `hcg-backup-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  }, [props, mileage, clients, invoices, tasks, oneOffScheduleBlocks, recurringWeeklySchedule, vendors, inspectors, notifications, users, teams, messages, currentUser])

  const importAllData = useCallback(async (file) => {
    if (!file) return { ok:false, error:"No file selected." }
    try {
      const text = await file.text()
      const parsed = safeParseJSON(text, null)
      const incoming = parsed?.data
      if (!incoming || typeof incoming !== "object") return { ok:false, error:"Backup file is invalid." }

      const nextProps = await hydratePropsWithDocumentPayloads(
        Array.isArray(incoming.props) ? incoming.props.map(normalizeProp) : []
      )
      const { normalizedUsers, normalizedTeams } = buildSingleCompanyAuthState(
        Array.isArray(incoming.users) ? incoming.users : [],
        Array.isArray(incoming.teams) ? incoming.teams : []
      )
      const nextMessages = sanitizeMessages(Array.isArray(incoming.messages) ? incoming.messages : [], normalizedUsers)

      setProps(nextProps)
      setMileage(Array.isArray(incoming.mileage) ? incoming.mileage.map(normalizeMileageEntry) : [])
      setInvoices(Array.isArray(incoming.invoices) ? incoming.invoices : [])
      setTasks(Array.isArray(incoming.tasks) ? incoming.tasks : [])
      setOneOffScheduleBlocks(Array.isArray(incoming.oneOffScheduleBlocks) ? incoming.oneOffScheduleBlocks : [])
      setRecurringWeeklySchedule(Array.isArray(incoming.recurringWeeklySchedule) ? incoming.recurringWeeklySchedule : [])
      setNotifications(Array.isArray(incoming.notifications) ? incoming.notifications : [])
      setUsers(normalizedUsers)
      setTeams(normalizedTeams)
      setNeedsInitialSetup(normalizedUsers.length===0)
      setMessages(nextMessages)
      setCurrentUser(incoming.currentUser || null)

      const importedClients = Array.isArray(incoming.clients) ? incoming.clients.map(normalizeClientRecord) : []
      const importedVendors = Array.isArray(incoming.vendors) ? incoming.vendors.map(normalizeVendorRecord) : []
      const importedInspectors = Array.isArray(incoming.inspectors) ? incoming.inspectors.map(normalizeInspectorRecord) : []

      setClients(importedClients)
      setVendors(importedVendors)
      setInspectors(importedInspectors)

      await Promise.all([
        ...importedClients.map(saveClientRecord),
        ...importedVendors.map(saveVendorRecord),
        ...importedInspectors.map(saveInspectorRecord)
      ])

      setLastSavedAt(now())
      return { ok:true }
    } catch (error) {
      return { ok:false, error:"Unable to import backup file." }
    }
  }, [saveClientRecord, saveInspectorRecord, saveVendorRecord, setProps])

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
      const isReady = isPropReady(p)
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
      fresh.lastLoginAt !== currentUser.lastLoginAt ||
      !!fresh.mustResetPassword !== !!currentUser.mustResetPassword
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
    setShowQuickRef(false)
  }, [tab])
  useEffect(() => {
    if (!resetPasswordTarget) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [resetPasswordTarget])
  useEffect(() => {
    if (!notifPanel) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [notifPanel])

  if (!authLoaded) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0C1117",color:"#9CA3AF",fontFamily:"'Barlow',sans-serif"}}>
        Loading...
      </div>
    )
  }

  if (needsInitialSetup) {
    return <InitialAdminSetupScreen onCreate={runInitialAdminSetup} />
  }

  if (!currentUser) {
    return <AuthScreen onLogin={login} onSignup={signup} />
  }

  if (!currentUser.approved) {
    return <WaitingApprovalScreen currentUser={currentUser} team={currentTeam} onLogout={logout} />
  }

  if (currentUser.mustResetPassword) {
    return <ForcedPasswordResetScreen currentUser={currentUser} onSubmit={completeForcedPasswordReset} onLogout={logout} />
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
      {/* ---- TOP HEADER CONTROLS ---- */}
      <div style={{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center",
        gap:8,
        padding:"12px 16px",
        background:"#111A27",
        borderBottom:"1px solid #243246",
        boxShadow:"0 4px 20px rgba(2,8,20,0.35)",
        minWidth:0
      }}>
        <div style={{display:"flex",alignItems:"center",gap:isMobile ? 6 : 8,minWidth:0,flex:"1 1 auto",overflow:"hidden",whiteSpace:"nowrap"}}>
          <div
            style={{
              background:"linear-gradient(135deg,#FB923C 0%,#F97316 100%)",
              color:"#FFFFFF",
              borderRadius:7,
              border:"1px solid rgba(255,255,255,0.08)",
              padding:isMobile ? "4px 7px" : "4px 8px",
              fontSize:isMobile ? 10 : 10.5,
              fontWeight:900,
              fontFamily:"'Barlow Condensed',sans-serif",
              letterSpacing:0.9,
              lineHeight:1,
              whiteSpace:"nowrap",
              boxShadow:"inset 0 1px 0 rgba(255,255,255,0.15)"
            }}
          >
            JLCMS
          </div>
          {(() => {
            const brandText = isMobile ? "" : (viewportInfo().width < 980 ? "Field Ops" : "Field Operations")
            if (!brandText) return null
            return (
              <div style={{minWidth:0,overflow:"hidden",flex:"0 1 auto"}}>
                <div
                  style={{
                    color:"#F9FAFB",
                    fontFamily:"'Barlow Condensed',sans-serif",
                    fontSize:viewportInfo().width < 980 ? 13 : 15,
                    fontWeight:800,
                    letterSpacing:viewportInfo().width < 980 ? 0.75 : 1,
                    lineHeight:1,
                    whiteSpace:"nowrap",
                    overflow:"hidden",
                    textOverflow:"ellipsis"
                  }}
                >
                  {brandText}
                </div>
              </div>
            )
          })()}
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:8,flex:"0 0 auto",minWidth:0,whiteSpace:"nowrap"}}>

        {/* Notifications */}
        <button
          onClick={()=>{
            setShowLegend(false)
            setShowQuickRef(false)
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

        <button
          onClick={()=>{
            setNotifPanel(false)
            setShowLegend(false)
            setShowQuickRef(v=>!v)
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
          Portals
        </button>

        {/* KEY */}
        <button
          onClick={()=>{
            setNotifPanel(false)
            setShowQuickRef(false)
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
        <>
          <div
            onClick={()=>setNotifPanel(false)}
            style={{
              position:"fixed",
              inset:0,
              background:"rgba(0,0,0,0.6)",
              zIndex:199
            }}
          />
          <div
            className="slide-in"
            style={{
              position:"fixed",
              top:52,
              right:isMobile ? "5%" : 0,
              width:isMobile ? "90%" : 380,
              maxWidth:"100%",
              height:isMobile ? "auto" : "calc(100vh - 52px)",
              maxHeight:isMobile ? "80vh" : "100%",
              background:"#111827",
              borderLeft:"2px solid #60A5FA",
              borderRadius:isMobile ? 10 : 0,
              boxShadow:"0 24px 52px rgba(0,0,0,0.48)",
              zIndex:200,
              display:"flex",
              flexDirection:"column",
              overflow:"hidden"
            }}
          >
            <div style={{padding:"16px 20px",borderBottom:"1px solid #253449",background:"linear-gradient(90deg,#0F1B2D 0%,#111A27 100%)",flexShrink:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:"#60A5FA",letterSpacing:2}}>
                      NOTIFICATIONS
                    </div>
                    <span style={{background:"#0C1117",border:"1px solid #334155",borderRadius:999,padding:"2px 8px",fontSize:11,color:"#DCE7F5",fontWeight:700}}>
                      {unreadCount} unread
                    </span>
                  </div>
                  <div style={{fontSize:11,color:"#6B7280",marginTop:4,fontFamily:"'IBM Plex Mono',monospace"}}>
                    Showing alerts for {users.find(t=>t.id===activeUser)?.name || currentUser?.name || "Current User"}
                  </div>
                </div>
                <button
                  onClick={()=>setNotifPanel(false)}
                  style={{...btnGray,fontSize:11,padding:"4px 10px",flexShrink:0}}
                >
                  Close
                </button>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
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
              </div>
            </div>

            <div style={{padding:"8px 20px",background: pushEnabled?"#002D1A":"#2D1200",borderBottom:"1px solid #1F2937",fontSize:11,color:pushEnabled?"#34D399":"#FB923C",fontFamily:"'IBM Plex Mono',monospace",flexShrink:0}}>
              {pushEnabled ? "Browser push notifications active on this device" : "Push notifications not enabled. Enable push to receive browser alerts on this device."}
            </div>

            <div style={{flex:1,overflowY:"auto",overscrollBehavior:"contain",padding:12,display:"flex",flexDirection:"column",gap:8}}>
              {notifications.filter(n=>n.recipients.includes(activeUser)).length===0&&(
                <div style={{textAlign:"center",padding:32,color:"#4B5563",fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,letterSpacing:2,background:"#0C1117",border:"1px solid #1F2937",borderRadius:8}}>
                  NO NOTIFICATIONS
                </div>
              )}
              {notifications.filter(n=>n.recipients.includes(activeUser)).map(n=>{
                const nt = NOTIF_TYPES[n.type] || NOTIF_TYPES.schedule
                return(
                  <div
                    key={n.id}
                    style={{
                      background:n.read ? "#151E2B" : "#0F1923",
                      border:`1px solid ${n.read ? "#253449" : nt.color}44`,
                      borderLeft:`3px solid ${n.read ? "#374151" : nt.color}`,
                      borderRadius:8,
                      padding:"10px 12px",
                      boxSizing:"border-box"
                    }}
                  >
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:nt.color,padding:"1px 6px",border:`1px solid ${nt.color}`,borderRadius:6,flexShrink:0}}>{nt.icon}</span>
                      <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,color:nt.color,letterSpacing:1,flex:1,minWidth:0,overflowWrap:"anywhere"}}>{cleanUiText(n.title)}</span>
                      <span style={{fontSize:10,color:"#4B5563",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap",flexShrink:0}}>{fmtT(n.time)}</span>
                    </div>
                    <div style={{fontSize:12,color:"#9CA3AF",lineHeight:1.45,paddingLeft:22,overflowWrap:"anywhere",wordBreak:"break-word"}}>
                      {cleanUiText(n.body)}
                    </div>
                    <div style={{display:"flex",gap:4,marginTop:8,paddingLeft:22,flexWrap:"wrap"}}>
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
        </>
      )}

      {showQuickRef && !notifPanel && !showLegend && (
        <>
          <div
            onClick={()=>setShowQuickRef(false)}
            style={{
              position:"fixed",
              inset:0,
              background:"rgba(0,0,0,0.6)",
              zIndex:199
            }}
          />
          <QuickReferenceDrawer isMobile={isMobile} onClose={()=>setShowQuickRef(false)} />
        </>
      )}


      {/* ---- LEGEND ---- */}
      {showLegend && !notifPanel && !showQuickRef && (
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

      {resetPasswordTarget && (
        <>
          <div
            onClick={closeResetPasswordModal}
            style={{
              position:"fixed",
              inset:0,
              background:"rgba(0,0,0,0.68)",
              zIndex:390
            }}
          />
          <div style={getModalShellStyle(isMobile, 430)}>
            <div style={modalHeaderStyle}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                <div>
                  <div style={modalTitleStyle}>Reset Password</div>
                  <div style={modalSubtitleStyle}>
                    Save a temporary password for this user. They will be required to change it on their next login.
                  </div>
                </div>
                <button onClick={closeResetPasswordModal} style={{...btnGray,padding:"6px 10px",fontSize:12}}>Close</button>
              </div>
            </div>
            <div style={{padding:18,overflowY:"auto"}}>
              <div style={{...mutedPanelStyle,marginBottom:14}}>
                <div style={{fontSize:14,color:"#F9FAFB",fontWeight:700}}>{resetPasswordTarget.name}</div>
                <div style={{fontSize:12,color:"#9CA3AF",marginTop:4,wordBreak:"break-word"}}>{resetPasswordTarget.email}</div>
              </div>
              <div style={{...softInfoPanelStyle,marginBottom:14}}>
                This will save a temporary password for the selected user only. Their role, approval status, and team assignment will remain unchanged.
              </div>
              {resetPasswordError && (
                <div style={{background:"#2D0A0A",border:"1px solid #F87171",color:"#FCA5A5",padding:"8px 10px",borderRadius:8,fontSize:12,marginBottom:12}}>
                  {resetPasswordError}
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12}}>
                <div>
                  <Label>New Temporary Password</Label>
                  <input
                    type="password"
                    value={resetPasswordForm.password}
                    onChange={e=>setResetPasswordForm(f=>({...f,password:e.target.value}))}
                    onKeyDown={e=>{ if (e.key==="Enter") saveResetPassword() }}
                    style={iStyle}
                    placeholder="Minimum 8 characters"
                    autoFocus
                  />
                </div>
                <div>
                  <Label>Confirm Temporary Password</Label>
                  <input
                    type="password"
                    value={resetPasswordForm.confirmPassword}
                    onChange={e=>setResetPasswordForm(f=>({...f,confirmPassword:e.target.value}))}
                    onKeyDown={e=>{ if (e.key==="Enter") saveResetPassword() }}
                    style={iStyle}
                    placeholder="Re-enter temporary password"
                  />
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap",marginTop:16}}>
                <button onClick={closeResetPasswordModal} style={btnGray}>Cancel</button>
                <button onClick={saveResetPassword} style={btnGreen}>Save Reset</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================== TAB ROUTING (HOME / CLIENTS / MORE) ========================== */}
      {tab==="home" && <HomeTab props={props} invoices={invoices} billingCounts={billingCounts} setTab={setTab} currentUser={currentUser} todayFocus={todayFocusMessage} />}
      {tab==="chat" && (can("chat","view") ? <ChatTab currentUser={currentUser} users={users} messages={messages} setMessages={setMessages} modePref={chatModePref} peerPref={chatPeerPref} onModePrefApplied={()=>{ setChatModePref("team"); setChatPeerPref("") }} onImmediateOneTimeAlert={notifyCurrentUserOneTimeEvent} /> : <AccessDenied page="Chat" />)}
      {tab==="team" && (can("team","view") ? <TeamTab currentUser={currentUser} currentTeam={currentTeam} users={users} onMessage={openPrivateMessage} canManageUsers={can("team","edit")} canResetPasswords={can("team","edit") && ["ceo","admin"].includes((currentUser?.role||"").toLowerCase())} isCurrentCeo={isCurrentCeo} onAssignUserRole={assignUserRole} onForceLogoutUser={forceLogoutTeamUser} onRemoveUser={removeTeamUser} onOpenResetPasswordModal={openResetPasswordModal} /> : <AccessDenied page="Team" />)}
      {tab==="clients" && (can("clients","view") ? <ClientsTab clients={clients} setClients={setClients} props={props} setProps={setProps} canAdd={can("clients","add")} canEdit={can("clients","edit")} canDelete={can("clients","delete")} onSaveClient={saveClientRecord} onDeleteClient={removeClientRecord} /> : <AccessDenied page="Clients" />)}
      {tab==="invoices" && (can("invoices","view") ? <InvoicesTab invoices={invoices} props={props} clients={clients} selectedInvoiceId={selectedInvoiceId} setSelectedInvoiceId={setSelectedInvoiceId} onUpdateInvoice={updateInvoice} onDeleteInvoice={deleteInvoice} onExportInvoice={exportInvoicePacket} canAdd={can("invoices","add")} canEdit={can("invoices","edit")} canDelete={can("invoices","delete")} /> : <AccessDenied page="Invoices" />)}
      {tab==="more" && (can("more","view") ? <MoreTab currentUser={currentUser} currentTeam={currentTeam} users={users} isCurrentAdmin={isCurrentAdmin} isCurrentCeo={isCurrentCeo} canResetPasswords={can("team","edit") && ["ceo","admin"].includes((currentUser?.role||"").toLowerCase())} onApprove={approveTeamRequest} onDeny={denyTeamRequest} onUpdateInviteCode={updateTeamInviteCode} onForceLogoutUser={forceLogoutTeamUser} onRemoveUser={removeTeamUser} onOpenResetPasswordModal={openResetPasswordModal} onUpdateProfile={updateCurrentProfile} onUpdateCompanyName={updateCompanyName} onUpdateCompanySettings={updateCompanySettings} onUpdateTodayFocus={updateTodayFocus} onCreateTeamRole={createTeamRole} onRenameTeamRole={renameTeamRole} onDeleteTeamRole={deleteTeamRole} onAssignUserRole={assignUserRole} onUpdateRolePermission={updateRolePermission} onExportData={exportAllData} onImportData={importAllData} lastSavedAt={lastSavedAt} onLogout={logout} /> : <AccessDenied page="More" />)}

      {/* == DASHBOARD == */}
      {tab==="dashboard"&&(can("dashboard","view") ? (
        <div style={{
            display:"flex",
            flexDirection:"column",
            minHeight:isMobile ? "auto" : "calc(100vh - 52px)"
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
                  can("dashboard","add") ? (
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",width: isMobile ? "100%" : "auto"}}>
                      <button onClick={()=>setBulkOpen(true)} style={btnBlue}>Bulk Import</button>
                      <button onClick={()=>setAddOpen(true)} style={btnOrange}>+ Add One</button>
                    </div>
                  ) : null
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
              alignContent:"start",
              flex:1,
              overflowY:isMobile ? "visible" : "auto"
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
                const checklist = getChecklistStatus(p)
                const isReady = checklist.readinessKey==="mobilize"
                const billingMeta = getBillingMeta(p, invoices)
                const primaryVendor = vendors.find(v=>p.assignedVendors?.includes(v.id))
                const primaryInspector = inspectors.find(ins=>(p.assignedInspectors||[]).includes(ins.id))
                const assignedClient = clients.find(c=>c.id===p.clientId)
                const hours = p.permitStatus==="Started" ? hoursAgo(p.startedAt) : null
                const overdue = hours && parseFloat(hours) > 20
                const blockerBadges = checklist.warnings.slice(0, 2)
                const badgeStackWidth = isMobile ? 142 : 154
                const dashboardBadgeStyle = {
                  display:"inline-flex",
                  alignItems:"center",
                  justifyContent:"center",
                  minHeight:24,
                  width:"100%",
                  minWidth:badgeStackWidth,
                  maxWidth:isMobile ? 170 : 190,
                  padding:"4px 10px",
                  borderRadius:7,
                  fontSize:11,
                  fontWeight:700,
                  lineHeight:1.15,
                  whiteSpace:"nowrap",
                  textAlign:"center",
                  boxSizing:"border-box"
                }

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
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:isMobile?10:14,marginBottom:12}}>
                      <div style={{flex:1,minWidth:0,paddingRight:isMobile?0:4}}>
                        <div style={{...sectionLabel,marginBottom:4}}>Job {String(idx+1).padStart(2,"0")}</div>
                        <div style={{fontWeight:700,fontSize:15,lineHeight:1.25,color:isReady?UI.success:UI.text,wordBreak:"break-word"}}>{p.address}</div>
                        <div style={{fontSize:11,color:"#6B7280",marginTop:4}}>
                          Compliance {checklist.percentComplete}% complete
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"stretch",gap:6,flexShrink:0,width:isMobile?badgeStackWidth:"auto",minWidth:badgeStackWidth}}>
                        <span style={{...dashboardBadgeStyle,background:sm.bg,color:sm.color}}>
                          {p.permitStatus}
                        </span>
                        <span style={{...dashboardBadgeStyle,background:checklist.readiness.bg,color:checklist.readiness.color}}>
                          {checklist.readiness.label}
                        </span>
                        <span style={{...dashboardBadgeStyle,background:billingMeta.bg,color:billingMeta.color}}>
                          {billingMeta.label}
                        </span>
                        <span style={{...dashboardBadgeStyle,background:"#0C1117",color:"#9CA3AF",overflow:"hidden",textOverflow:"ellipsis"}}>
                          {p.workType}
                        </span>
                      </div>
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "repeat(2,minmax(0,1fr))",gap:10,marginBottom:10}}>
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

                    {!!blockerBadges.length && (
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                        {blockerBadges.map(item=>(
                          <span key={item} style={{background:"#2D0A0A",border:"1px solid #F87171",color:"#FCA5A5",padding:"3px 8px",borderRadius:999,fontSize:10,fontWeight:700}}>
                            {item.replace(/^Cannot Mobilize:\s*/,"")}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <div style={{fontSize:12,color:"#9CA3AF"}}>
                        24hr: {hours?`${hours}h${overdue?" (near deadline)":""}` :"--"} | Client: {assignedClient?.name || "--"} | Contractor: {primaryVendor?.code || "--"} | Inspector: {primaryInspector?.name || "--"} | Missing Required: {checklist.missingRequiredItems.length}
                      </div>
                      {can("dashboard","delete") && (
                        <button
                          onClick={(e)=>{e.stopPropagation(); deleteProp(p.id)}}
                          style={{...buttonStyle,padding:"6px 10px",fontSize:12}}
                        >
                          Remove
                        </button>
                      )}
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
                  onRemovePhoto={removePhoto}
                  onRenamePhoto={renamePhoto}
                  onDocuments={handleDocuments}
                  onRemoveDocument={removeDocument}
                  onUpdateDocumentDetails={updateDocumentDetails}
                  onPrintPacket={printPropertyPacket}
                  vendors={vendors}
                  inspectors={inspectors}
                  clients={clients}
                  invoices={invoices}
                  onMarkComplete={markJobComplete}
                  onReopenJob={reopenJob}
                  onCreateInvoice={createInvoiceFromJob}
                  canCreateInvoice={can("invoices","add")}
                  canEdit={can("dashboard","edit")}
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
      {tab==="schedule"&&(can("schedule","view") ? <ScheduleTab activeUser={activeUser} currentUser={currentUser} teamUsers={teamUsers} notifications={notifications} fireNotif={fireNotif} recurringWeeklySchedule={recurringWeeklySchedule} setRecurringWeeklySchedule={setRecurringWeeklySchedule} oneOffScheduleBlocks={oneOffScheduleBlocks} setOneOffScheduleBlocks={setOneOffScheduleBlocks} tasks={tasks} setTasks={setTasks} properties={props} clients={clients} canAdd={can("schedule","add")} canEdit={can("schedule","edit")} canDelete={can("schedule","delete")} canManagePermanent={can("permanentSchedule","add")} onImmediateOneTimeAlert={notifyCurrentUserOneTimeEvent} /> : <AccessDenied page="Schedule" />)}


      {tab==="vendors"&&(can("vendors","view") ? <VendorTab vendors={vendors} setVendors={setVendors} canAdd={can("vendors","add")} canEdit={can("vendors","edit")} canDelete={can("vendors","delete")} onSaveVendor={saveVendorRecord} onDeleteVendor={removeVendorRecord} /> : <AccessDenied page="Vendors" />)}
      {tab==="inspectors"&&(can("inspectors","view") ? <InspectorTab inspectors={inspectors} setInspectors={setInspectors} canAdd={can("inspectors","add")} canEdit={can("inspectors","edit")} canDelete={can("inspectors","delete")} onSaveInspector={saveInspectorRecord} onDeleteInspector={removeInspectorRecord} /> : <AccessDenied page="Inspectors" />)}
      {tab==="mileage"&&(can("mileage","view") ? <MileageTab mileage={mileage} setMileage={setMileage} addMileage={addMileageEntry} properties={props} clients={clients} canAdd={can("mileage","add")} canEdit={can("mileage","edit")} canDelete={can("mileage","delete")} /> : <AccessDenied page="Mileage" />)}

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
function HomeTab({ props, invoices, billingCounts, setTab, currentUser, todayFocus }) {
  const { isPhone: isMobile, isTablet } = viewportInfo()

  const ready = props.filter(p =>
    isPropReady(p)
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
          {todayFocus || getDailyTodayFocus(getTodayDateInput())}
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

function ChatTab({ currentUser, users, messages, setMessages, modePref="team", peerPref="", onModePrefApplied, onImmediateOneTimeAlert }) {
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
    const nextMessage = {
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
    setMessages(prev=>[
      ...prev,
      nextMessage
    ])
    if (mode==="dm" && peerId && onImmediateOneTimeAlert) {
      onImmediateOneTimeAlert({
        userId: peerId,
        eventKey: `dm:${nextMessage.id}`,
        type: "private_message",
        title: `New Private Message from ${currentUser.name || "Team Member"}`,
        body: text.length > 88 ? `${text.slice(0, 85)}...` : text
      })
    }
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

function TeamTab({ currentUser, currentTeam, users, onMessage, canManageUsers=false, canResetPasswords=false, isCurrentCeo=false, onAssignUserRole, onForceLogoutUser, onRemoveUser, onOpenResetPasswordModal }) {
  const { isPhone: isMobile } = viewportInfo()
  const members = users
    .filter(u=>u.teamId===currentUser?.teamId && u.approved)
    .sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0))

  const manageMembers = [...members].sort((a,b)=>{
    const roleA = String(a.role || "").toLowerCase()
    const roleB = String(b.role || "").toLowerCase()
    if (roleA === "ceo") return -1
    if (roleB === "ceo") return 1
    return String(a.name || "").localeCompare(String(b.name || ""))
  })
  const forceLogoutMember = (user) => {
    if (!window.confirm(`Force logout ${user.name}?\n\nThey will need to sign in again on this device.`)) return
    onForceLogoutUser?.(user.id)
    window.alert(`${user.name} was signed out and must log in again.`)
  }
  const removeMember = (user) => {
    if (!window.confirm(`Remove ${user.name} from this workspace?\n\nTheir team access and local session on this device will be removed.`)) return
    onRemoveUser?.(user.id)
    window.alert(`${user.name} was removed from this workspace.`)
  }

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

      {canManageUsers && (
        <div style={{...cardStyle,marginTop:20}}>
          <div style={{...sectionLabel,marginBottom:10}}>User Management</div>
          <div style={{fontSize:12,color:"#6B7280",marginBottom:12}}>
            Manage roles and account access directly from the team roster.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {manageMembers.map(user=>{
              const isCeoAccount = String(user.role || "").toLowerCase() === "ceo"
              const canShowReset = canResetPasswords && !isCeoAccount && user.id !== currentUser?.id
              const canShowCeoActions = isCurrentCeo && !isCeoAccount
              return (
                <div key={`manage-${user.id}`} style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "minmax(0,1fr) auto",alignItems:"center",gap:10,background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:14,color:"#F9FAFB",fontWeight:700}}>{user.name}</div>
                    <div style={{fontSize:12,color:"#6B7280",wordBreak:"break-word"}}>{user.email} | Role: {roleLabel(user.role || "member")}</div>
                  </div>
                  {isCeoAccount ? (
                    <span style={{fontSize:11,color:"#6B7280"}}>CEO account protected</span>
                  ) : (
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",justifyContent:isMobile?"flex-start":"flex-end",width:"100%",minWidth:0}}>
                      <select
                        value={user.role||"member"}
                        onChange={e=>onAssignUserRole?.(user.id, e.target.value)}
                        style={{...iStyle,width:isMobile?"100%":"auto",minWidth:isMobile?0:150,maxWidth:"100%",padding:"6px 8px",fontSize:12,flex:isMobile?"1 1 100%":"0 0 auto"}}
                      >
                        {(currentTeam?.roles||["member"]).map(role=><option key={role} value={role}>{roleLabel(role)}</option>)}
                      </select>
                      {canShowReset && (
                        <button onClick={()=>onOpenResetPasswordModal?.(user)} style={{...btnBlue,flex:isMobile?"1 1 calc(50% - 4px)":"0 0 auto"}}>Reset Password</button>
                      )}
                      {canShowCeoActions && (
                        <>
                          <button onClick={()=>forceLogoutMember(user)} style={{...btnGray,flex:isMobile?"1 1 calc(50% - 4px)":"0 0 auto"}}>Force Logout</button>
                          <button onClick={()=>removeMember(user)} style={{...btnDanger,flex:isMobile?"1 1 calc(50% - 4px)":"0 0 auto"}}>Remove User</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function InvoicesTab({ invoices, props, clients, selectedInvoiceId, setSelectedInvoiceId, onUpdateInvoice, onDeleteInvoice, onExportInvoice, canAdd=true, canEdit=true, canDelete=true }) {
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

  useEffect(() => {
    if (!activeInvoice) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [activeInvoice])

  const filteredInvoices = [...invoices]
    .filter(inv => {
      const client = clients.find(c=>c.id===inv.clientId)
      const job = props.find(p=>p.id===inv.propertyId)
      const query = search.trim().toLowerCase()
      const matchesSearch = !query || `${client?.name || inv.clientName || ""} ${client?.company || ""} ${job?.address || inv.propertyAddress || ""}`.toLowerCase().includes(query)
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
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12}}>
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
                  <div style={{fontSize:11,color:"#9CA3AF",marginBottom:4}}>
                    {client?.name || inv.clientName}
                    {client?.company ? ` | ${client.company}` : ""}
                    {client?.email || inv.clientEmail ? ` | ${client?.email || inv.clientEmail}` : ""}
                  </div>
                  <div style={{fontSize:11,color:"#9CA3AF",marginBottom:4}}>Subtotal {fmtMoney(t.subtotal)} | Tax {fmtMoney(t.tax)} | Total {fmtMoney(t.total)}</div>
                  <div style={{fontSize:11,color:"#6B7280",marginBottom:8}}>Created {fmt(inv.createdAt)}</div>
                  {(canEdit || canDelete || !!onExportInvoice) && (
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {canEdit && <button onClick={()=>setSelectedInvoiceId(inv.id)} style={{...btnBlue,padding:"6px 10px"}}>Edit</button>}
                      {onExportInvoice && <button onClick={()=>onExportInvoice(inv)} style={{...btnGray,padding:"6px 10px"}}>Export Invoice</button>}
                      {canDelete && <button onClick={()=>deleteInvoiceCard(inv.id, inv.invoiceId)} style={{...btnGray,padding:"6px 10px",border:"1px solid #EF4444",color:"#FCA5A5"}}>Delete</button>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeInvoice && canEdit && editor && (
        <>
          <div
            onClick={closeEditor}
            style={{
              position:"fixed",
              inset:0,
              background:"rgba(0,0,0,0.68)",
              zIndex:390
            }}
          />
          <div className="slide-in" style={{...getModalShellStyle(isMobile, isMobile ? 520 : 980)}}>
            <div style={modalHeaderStyle}>
              <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
                <div>
                  <div style={modalTitleStyle}>{activeInvoice.invoiceId}</div>
                  <div style={modalSubtitleStyle}>{activeInvoice.propertyAddress} | {activeInvoice.clientName}</div>
                </div>
                <button onClick={closeEditor} style={{...btnGray,padding:"6px 10px",fontSize:12}}>Close</button>
              </div>
            </div>

            <div style={{padding:18,overflowY:"auto"}}>
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

              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                <button onClick={()=>submitInvoiceAction("Draft")} style={btnBlue}>Save Draft</button>
                <button onClick={()=>submitInvoiceAction("Sent")} style={btnOrange}>Mark Sent</button>
                <button onClick={()=>submitInvoiceAction("Paid")} style={btnGreen}>Mark Paid</button>
              </div>
              <div style={{display:"flex",justifyContent:"flex-start"}}>
                <button onClick={()=>submitInvoiceAction("Cancelled")} style={{...btnGray,border:"1px solid #EF4444",color:"#FCA5A5"}}>Cancel Invoice</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ========================== CLIENTS TAB ========================== */
function ClientsTab({ clients, setClients, props, setProps, canAdd=true, canEdit=true, canDelete=true, onSaveClient, onDeleteClient }) {
  const { isPhone: isMobile } = viewportInfo()
  const blank = { name:"", company:"", address:"", phone:"", email:"", jobId:"", notes:"" }
  const [form,setForm] = useState(blank)
  const [editing,setEditing] = useState(null)
  const [search,setSearch] = useState("")
  const [sortBy,setSortBy] = useState("newest")
  const [clientFilterBy,setClientFilterBy] = useState("none")
  const [clientJobTypeFilter,setClientJobTypeFilter] = useState("All")
  const denyAccess = () => window.alert("You currently have view-only access. Ask management or the CEO to assign your role and permissions.")

  const save = async () => {
    if (!editing && !canAdd) { denyAccess(); return }
    if (editing && !canEdit) { denyAccess(); return }
    if (!form.name.trim()) return
    const clientId = editing || uid()
    if (onSaveClient) {
      await onSaveClient({
        id: clientId,
        ...form,
        createdAt: editing ? (clients.find(c=>c.id===editing)?.createdAt || now()) : now()
      })
    } else {
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
    }

    setForm(blank)
    setEditing(null)
  }

  const del = async (id) => {
    if (!canDelete) { denyAccess(); return }
    if (!window.confirm("Remove this client?\n\nAny linked job will stay in place, but the client assignment will be cleared.")) return
    if (onDeleteClient) {
      await onDeleteClient(id)
    } else {
      setClients(prev=>prev.filter(c=>c.id!==id))
      setProps(prev=>prev.map(p=>p.clientId===id ? { ...p, clientId:"" } : p))
    }
    if (editing===id) {
      setEditing(null)
      setForm(blank)
    }
  }

  const edit = (c) => {
    setEditing(c.id)
    setForm({
      name:c.name||"",
      company:c.company||"",
      address:c.address||"",
      phone:c.phone||"",
      email:c.email||"",
      jobId:c.jobId||"",
      notes:c.notes||""
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
      return `${c.name||""} ${c.company||""} ${c.address||""} ${c.notes||""} ${job?.address||""}`.toLowerCase().includes(q)
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

      {(canAdd || (editing && canEdit)) ? (
        <div style={{...cardStyle,marginBottom:20}}>
          <div style={{...sectionLabel,marginBottom:10}}>{editing?"Edit Client":"Add Client"}</div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,minmax(0,1fr))",gap:10}}>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Client name *" style={iStyle} />
            <input value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} placeholder="Company / organization (optional)" style={iStyle} />
            <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Client address" style={iStyle} />
            <select value={form.jobId} onChange={e=>setForm(f=>({...f,jobId:e.target.value}))} style={iStyle}>
              <option value="">Assign Job Order</option>
              {props.map(p=><option key={p.id} value={p.id}>{p.address}</option>)}
            </select>
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Phone" style={iStyle} />
            <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="Email" style={iStyle} />
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes (optional)" rows={4} style={{...iStyle,resize:"vertical",lineHeight:1.5,gridColumn:isMobile?"auto":"1 / -1"}} />
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <button onClick={save} style={btnBlue}>{editing?"Save":"Create Client"}</button>
              {editing && <button onClick={()=>{setEditing(null);setForm(blank)}} style={btnGray}>Cancel</button>}
            </div>
          </div>
        </div>
      ) : (
        canEdit ? (
          <div style={{...cardStyle,marginBottom:20,fontSize:12,color:"#94A3B8"}}>
            You can edit existing client records below. Creating new clients is restricted for your role.
          </div>
        ) : null
      )}

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
        {filtered.length===0 && (
          <div style={{...emptyStateCardStyle,gridColumn:"1 / -1"}}>
            {clients.length===0 ? "No clients have been added yet." : "No clients match the current filters."}
          </div>
        )}
        {filtered.map(c=>{
          const job = props.find(p=>p.id===c.jobId)
          return (
            <div key={c.id} style={cardStyle}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:16,color:"#F9FAFB"}}>{c.name}</div>
                  {!!c.company && <div style={{fontSize:12,color:"#CBD5E1",marginTop:2}}>{c.company}</div>}
                  <div style={{fontSize:12,color:"#6B7280"}}>{c.address || "No address"}</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {canEdit && <button onClick={()=>edit(c)} style={btnBlue}>Edit</button>}
                  {canDelete && <button onClick={()=>del(c.id)} style={btnGray}>Delete</button>}
                </div>
              </div>

              <div style={{fontSize:12,color:"#9CA3AF",display:"flex",flexDirection:"column",gap:4}}>
                {c.phone && <div>Phone: {c.phone}</div>}
                {c.email && <div>Email: {c.email}</div>}
                <div>Date Added: {fmt(c.createdAt)}</div>
                <div>Assigned Job: {job?.address || "Unassigned"}</div>
                <div>Job Type: {job?.workType || "--"}</div>
                {c.notes && <div style={{marginTop:4,color:"#CBD5E1",lineHeight:1.5}}>Notes: {c.notes}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ========================== AUTH SCREENS ========================== */
function InitialAdminSetupScreen({ onCreate }) {
  const { isPhone, isTablet } = viewportInfo()
  const [form, setForm] = useState({ name:"", email:"", password:"", confirmPassword:"" })
  const [error, setError] = useState("")

  const submit = () => {
    setError("")
    if (form.password.length < 8) {
      setError("Use a password with at least 8 characters.")
      return
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    const res = onCreate(form)
    if (!res.ok) setError(res.error || "Unable to complete initial admin setup.")
  }

  const outerPadding = isPhone ? 16 : isTablet ? 24 : 28
  const cardMaxWidth = isPhone ? 440 : 480
  const cardPadding = isPhone ? 20 : isTablet ? 24 : 28
  const titleSize = isPhone ? 30 : isTablet ? 32 : 34
  const subtitleSize = isPhone ? 13 : 14
  const metaSize = 11
  const fieldGap = isPhone ? 12 : 14

  const formControlStyle = {
    ...iStyle,
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    minHeight: isPhone ? 46 : 48,
    padding: isPhone ? "11px 12px" : "12px 14px",
    boxSizing: "border-box",
    display: "block"
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 15% 15%, #1A2740 0%, #0B1118 48%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: outerPadding,
        fontFamily: "'Barlow',sans-serif",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: cardMaxWidth,
          background: "#111A27",
          border: "1px solid #253449",
          borderRadius: 16,
          boxShadow: "0 24px 52px rgba(0,0,0,0.48)",
          overflow: "hidden",
          boxSizing: "border-box"
        }}
      >
        <div
          style={{
            padding: `${cardPadding}px ${cardPadding}px 14px`,
            borderBottom: "1px solid #253449",
            background: "linear-gradient(90deg,#0F1B2D 0%,#111A27 100%)",
            boxSizing: "border-box"
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: titleSize,
              fontWeight: 900,
              lineHeight: isPhone ? 1.02 : 1,
              color: "#F9FAFB",
              letterSpacing: 0.4,
              marginBottom: 6
            }}
          >
            HCG Management LLC
          </div>

          <div
            style={{
              fontSize: subtitleSize,
              color: "#CBD5E1",
              lineHeight: 1.4,
              marginBottom: 8
            }}
          >
            Field Operations Platform
          </div>

          <div
            style={{
              fontSize: metaSize,
              color: "#90A0B8",
              letterSpacing: 1,
              textTransform: "uppercase",
              fontWeight: 700
            }}
          >
            Initial Admin Setup
          </div>
        </div>

        <div
          style={{
            padding: cardPadding,
            boxSizing: "border-box"
          }}
        >
          <div
            style={{
              background: "#0C1117",
              border: "1px solid #1F2937",
              borderRadius: 10,
              padding: isPhone ? "12px 14px" : "13px 15px",
              fontSize: isPhone ? 12 : 13,
              color: "#9CA3AF",
              lineHeight: 1.6,
              marginBottom: fieldGap + 2,
              boxSizing: "border-box"
            }}
          >
            Create the first internal administrator for HCG. This setup screen is only available once. After setup, all future users must use the CEO-issued invite code.
          </div>

          {error && (
            <div
              style={{
                background: "#2D0A0A",
                border: "1px solid #F87171",
                color: "#FCA5A5",
                padding: "9px 11px",
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.45,
                marginBottom: fieldGap,
                boxSizing: "border-box"
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gap: fieldGap,
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box"
            }}
          >
            <div style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
              <Label>Admin Name</Label>
              <input
                value={form.name}
                onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                style={formControlStyle}
              />
            </div>

            <div style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
              <Label>Admin Email</Label>
              <input
                value={form.email}
                onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                style={formControlStyle}
              />
            </div>

            <div style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
              <Label>Temporary Password</Label>
              <input
                type="password"
                value={form.password}
                onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                style={formControlStyle}
              />
            </div>

            <div style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
              <Label>Confirm Password</Label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e=>setForm(f=>({...f,confirmPassword:e.target.value}))}
                style={formControlStyle}
              />
            </div>

            <button
              onClick={submit}
              style={{
                ...btnBlue,
                width: "100%",
                minWidth: 0,
                minHeight: isPhone ? 48 : 50,
                marginTop: 2,
                boxSizing: "border-box",
                display: "block"
              }}
            >
              Create Initial Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

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
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:30,fontWeight:900,color:"#F9FAFB",letterSpacing:1}}>{HCG_COMPANY_NAME}</div>
          <div style={{fontSize:12,color:"#90A0B8",marginTop:2}}>Internal demolition operations portal</div>
        </div>

        <div style={{padding:20,overflowX:"hidden"}}>
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            <button onClick={()=>setMode("login")} style={{...buttonStyle,flex:1,background:mode==="login"?"#0C1117":"#111827",color:mode==="login"?"#F97316":"#9CA3AF"}}>Login</button>
            <button onClick={()=>setMode("signup")} style={{...buttonStyle,flex:1,background:mode==="signup"?"#0C1117":"#111827",color:mode==="signup"?"#F97316":"#9CA3AF"}}>Create Account</button>
          </div>

          {error && <div style={{background:"#2D0A0A",border:"1px solid #F87171",color:"#FCA5A5",padding:"8px 10px",borderRadius:6,fontSize:12,marginBottom:14}}>{error}</div>}

          {mode==="login" ? (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
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
                Internal accounts require a valid HCG invite code issued by the CEO or management.
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
          Your account has been created and is pending admin approval.
          {currentUser?.name ? ` ${currentUser.name},` : ""} you will be able to access {team?.teamName || "the workspace"} as soon as an admin approves your request.
        </div>
        <div style={{fontSize:12,color:"#6B7280",marginBottom:16}}>Signed in as {currentUser?.email}</div>
        <button onClick={onLogout} style={btnGray}>Logout</button>
      </div>
    </div>
  )
}

function ForcedPasswordResetScreen({ currentUser, onSubmit, onLogout }) {
  const { isPhone: isMobile } = viewportInfo()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const isAdminReset = String(currentUser?.passwordResetSource || "").toLowerCase() === "admin_reset"

  const save = () => {
    setError("")
    const res = onSubmit(password, confirmPassword)
    if (!res?.ok) setError(res?.error || "Unable to update password.")
  }

  return (
    <div style={{minHeight:"100vh",background:UI.appBg,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"'Barlow',sans-serif"}}>
      <div style={{...getModalShellStyle(isMobile, isMobile ? 520 : 560),position:"relative",top:"auto",left:"auto",transform:"none"}}>
        <div style={modalHeaderStyle}>
          <div style={{...modalTitleStyle,fontSize:isMobile ? 24 : 28}}>Change Temporary Password</div>
          <div style={{...modalSubtitleStyle,marginTop:6}}>
            {isAdminReset
              ? "Your password was reset by an administrator. Please create a new password to continue."
              : "Create a new password before continuing into the workspace."}
          </div>
        </div>
        <div style={{padding:20,overflowY:"auto"}}>
          <div style={{...softInfoPanelStyle,marginBottom:14}}>
            <div><span style={{color:"#F9FAFB",fontWeight:700}}>User:</span> {currentUser?.name || "Team Member"}</div>
            <div><span style={{color:"#F9FAFB",fontWeight:700}}>Email:</span> {currentUser?.email || "--"}</div>
          </div>
          <div style={{...mutedPanelStyle,marginBottom:14}}>
            <div style={{fontSize:11,color:"#FBBF24",fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Password Update Required</div>
            <div style={{fontSize:12,color:"#CBD5E1",lineHeight:1.55}}>
              Use a strong password with at least 8 characters. After saving, you will enter the workspace normally with the new password.
            </div>
          </div>
          {error && (
            <div style={{background:"#2D0A0A",border:"1px solid #F87171",color:"#FCA5A5",padding:"8px 10px",borderRadius:8,fontSize:12,marginBottom:12}}>
              {error}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12}}>
            <div>
              <Label>New Password</Label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{ if (e.key==="Enter") save() }} style={iStyle} placeholder="Minimum 8 characters" autoFocus />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} onKeyDown={e=>{ if (e.key==="Enter") save() }} style={iStyle} placeholder="Re-enter new password" />
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap",marginTop:16}}>
            <button onClick={onLogout} style={btnGray}>Logout</button>
            <button onClick={save} style={btnGreen}>Save New Password</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ========================== MORE TAB ========================== */
function MoreTab({ currentUser, currentTeam, users, isCurrentAdmin, isCurrentCeo, canResetPasswords=false, onApprove, onDeny, onUpdateInviteCode, onForceLogoutUser, onRemoveUser, onOpenResetPasswordModal, onUpdateProfile, onUpdateCompanyName, onUpdateCompanySettings, onUpdateTodayFocus, onCreateTeamRole, onRenameTeamRole, onDeleteTeamRole, onAssignUserRole, onUpdateRolePermission, onExportData, onImportData, lastSavedAt, onLogout }) {
  const { isPhone: isMobile } = viewportInfo()
  const pending = currentTeam?.pendingRequests || []
  const [inviteInput, setInviteInput] = useState(currentTeam?.inviteCode || "")
  const [settingsMsg, setSettingsMsg] = useState("")
  const [companyNameInput, setCompanyNameInput] = useState(currentTeam?.teamName || "")
  const [companySettingsForm, setCompanySettingsForm] = useState(normalizeCompanySettings(currentTeam))
  const [todayFocusInput, setTodayFocusInput] = useState(currentTeam?.todayFocusCustom || "")
  const [newRole, setNewRole] = useState("")
  const [editingRole, setEditingRole] = useState("")
  const [roleNameInput, setRoleNameInput] = useState("")
  const [openPermRole, setOpenPermRole] = useState("")
  const [editingProfile, setEditingProfile] = useState(false)
  const [confirmIdentityOpen, setConfirmIdentityOpen] = useState(false)
  const [confirmIdentityPassword, setConfirmIdentityPassword] = useState("")
  const [confirmIdentityError, setConfirmIdentityError] = useState("")
  const importRef = useRef()
  const [profileForm, setProfileForm] = useState({
    name:currentUser?.name || "",
    email:currentUser?.email || "",
    profilePic:currentUser?.profilePic || "",
    password:"",
    confirmPassword:""
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
    setCompanySettingsForm(normalizeCompanySettings(currentTeam))
    setTodayFocusInput(currentTeam?.todayFocusCustom || "")
  }, [currentTeam])

  useEffect(() => {
    setProfileForm({
      name:currentUser?.name || "",
      email:currentUser?.email || "",
      profilePic:currentUser?.profilePic || "",
      password:"",
      confirmPassword:""
    })
  }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.profilePic])
  useEffect(() => {
    if (!confirmIdentityOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [confirmIdentityOpen])

  const saveInviteCode = () => {
    const res = onUpdateInviteCode(inviteInput)
    setSettingsMsg(res.ok ? "Invite code updated." : (res.error || "Unable to update code."))
  }
  const finalizeProfileSave = (currentPassword = "") => {
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      setSettingsMsg("Password confirmation does not match.")
      return { ok:false, error:"Password confirmation does not match." }
    }
    if (profileForm.password && profileForm.password.length < 8) {
      setSettingsMsg("New password must be at least 8 characters.")
      return { ok:false, error:"New password must be at least 8 characters." }
    }
    const res = onUpdateProfile({
      ...profileForm,
      currentPassword,
      password: profileForm.password,
      mustResetPassword: profileForm.password ? false : currentUser?.mustResetPassword
    })
    setSettingsMsg(res.ok ? "Profile updated." : (res.error || "Unable to update profile."))
    if (res.ok) {
      setEditingProfile(false)
      setConfirmIdentityOpen(false)
      setConfirmIdentityPassword("")
      setConfirmIdentityError("")
      setProfileForm({
        name: profileForm.name,
        email: profileForm.email,
        profilePic: profileForm.profilePic,
        password:"",
        confirmPassword:""
      })
      return { ok:true }
    }
    return { ok:false, error:res.error || "Unable to update profile." }
  }
  const saveProfile = () => {
    const emailChanged = String(profileForm.email || "").trim().toLowerCase() !== String(currentUser?.email || "").trim().toLowerCase()
    const passwordChanged = !!profileForm.password
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      setSettingsMsg("Password confirmation does not match.")
      return
    }
    if (profileForm.password && profileForm.password.length < 8) {
      setSettingsMsg("New password must be at least 8 characters.")
      return
    }
    if (emailChanged || passwordChanged) {
      setConfirmIdentityPassword("")
      setConfirmIdentityError("")
      setConfirmIdentityOpen(true)
      return
    }
    const res = finalizeProfileSave("")
    if (!res.ok && res.error) setSettingsMsg(res.error)
  }
  const confirmSensitiveProfileSave = () => {
    setConfirmIdentityError("")
    if (!confirmIdentityPassword) {
      setConfirmIdentityError("Enter your current password to continue.")
      return
    }
    const res = finalizeProfileSave(confirmIdentityPassword)
    if (!res.ok) {
      setConfirmIdentityError(res.error || "Unable to verify your password.")
    }
  }
  const saveCompanyName = () => {
    const res = onUpdateCompanyName(companyNameInput)
    setSettingsMsg(res.ok ? "Company name updated." : (res.error || "Unable to update company name."))
  }
  const saveCompanySettings = () => {
    const res = onUpdateCompanySettings(companySettingsForm)
    setSettingsMsg(res.ok ? "Billing and remittance settings updated." : (res.error || "Unable to update billing settings."))
  }
  const saveTodayFocus = () => {
    const res = onUpdateTodayFocus(todayFocusInput)
    setSettingsMsg(res.ok ? "Today's Focus updated." : (res.error || "Unable to update Today's Focus."))
  }
  const clearTodayFocus = () => {
    setTodayFocusInput("")
    const res = onUpdateTodayFocus("")
    setSettingsMsg(res.ok ? "Today's Focus reverted to the daily auto-generated message." : (res.error || "Unable to clear Today's Focus."))
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
  const kickUser = (u) => {
    if (!window.confirm(`Remove ${u.name} from this workspace?\n\nTheir access, local session, and team membership on this device will be removed.`)) return
    onRemoveUser(u.id)
    setSettingsMsg(`${u.name} was removed from this workspace.`)
  }
  const forceLogout = (u) => {
    if (!window.confirm(`Force logout ${u.name}?\n\nThey will need to sign in again on this device.`)) return
    onForceLogoutUser(u.id)
    setSettingsMsg(`${u.name} was signed out and must log in again.`)
  }
  const onProfilePicFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setProfileForm(f=>({...f,profilePic:e.target.result}))
    reader.readAsDataURL(file)
  }
  const onBackupImportFile = async (file) => {
    if (!file) return
    if (!window.confirm("Restore this backup JSON? This will replace the current local app data on this device.")) {
      if (importRef.current) importRef.current.value = ""
      return
    }
    const result = await onImportData(file)
    setSettingsMsg(result.ok ? "Backup restored." : (result.error || "Unable to import backup."))
    if (importRef.current) importRef.current.value = ""
  }

  return (
    <div style={pageShell(980)}>
      <div style={{marginBottom:20}}>
        <div style={titleStyle}>Control Panel</div>
        <div style={{fontSize:12,color:"#6B7280",marginTop:4}}>Profile, team access, permissions, and account settings</div>
      </div>

      <div style={{...cardStyle,marginBottom:16,overflow:"hidden"}}>
        <div style={sectionLabel}>Data Protection</div>
        <div style={{fontSize:12,color:"#9CA3AF",marginBottom:10}}>
          Last saved: <span style={{color:"#F9FAFB",fontWeight:600}}>{lastSavedAt ? `${fmt(lastSavedAt)} ${fmtT(lastSavedAt)}` : "No local save timestamp yet"}</span>
        </div>
        <div style={{fontSize:12,color:"#9CA3AF",lineHeight:1.5,marginBottom:12}}>
          Export a backup JSON regularly for HCG project retention and device recovery. Restoring a backup replaces the current local data on this device.
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={onExportData} style={btnBlue}>Export Backup JSON</button>
          <button onClick={()=>importRef.current?.click()} style={btnGray}>Restore From JSON</button>
          <input ref={importRef} type="file" accept="application/json,.json" style={{display:"none"}} onChange={e=>onBackupImportFile(e.target.files?.[0])} />
        </div>
      </div>

      <div style={{...cardStyle,marginBottom:16,overflow:"hidden"}}>
          <div style={sectionLabel}>Profile</div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginBottom:8,flexWrap:"wrap"}}>
          {!editingProfile ? (
            <button onClick={()=>setEditingProfile(true)} style={btnBlue}>Edit</button>
          ) : (
            <>
            <button onClick={saveProfile} style={btnGreen}>Save Profile</button>
              <button onClick={()=>{setEditingProfile(false);setConfirmIdentityOpen(false);setConfirmIdentityPassword("");setConfirmIdentityError("");setProfileForm({name:currentUser?.name||"",email:currentUser?.email||"",profilePic:currentUser?.profilePic||"",password:"",confirmPassword:""})}} style={btnGray}>Cancel</button>
            </>
          )}
        </div>
        <div style={{fontSize:12,color:"#9CA3AF",marginBottom:10,lineHeight:1.5}}>
          Team: <span style={{color:"#F9FAFB",fontWeight:600}}>{currentTeam?.teamName || "Unassigned"}</span> | Role: <span style={{color:"#F9FAFB",fontWeight:600,textTransform:"capitalize"}}>{currentUser?.role || "member"}</span>
        </div>
        {!!currentUser?.mustResetPassword && (
          <div style={{background:"#2D1200",border:"1px solid #FB923C",color:"#FDBA74",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:10,lineHeight:1.5}}>
            This account is still using a temporary password. Update it before using the app in day-to-day operations.
          </div>
        )}

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
          <div>
            <Label>New Password</Label>
            <input type="password" value={profileForm.password} onChange={e=>setProfileForm(f=>({...f,password:e.target.value}))} style={iStyle} disabled={!editingProfile} placeholder={editingProfile ? "Set a new password" : ""} />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <input type="password" value={profileForm.confirmPassword} onChange={e=>setProfileForm(f=>({...f,confirmPassword:e.target.value}))} style={iStyle} disabled={!editingProfile} placeholder={editingProfile ? "Re-enter password" : ""} />
          </div>
        </div>
      </div>

      {confirmIdentityOpen && (
        <>
          <div
            onClick={()=>{
              setConfirmIdentityOpen(false)
              setConfirmIdentityPassword("")
              setConfirmIdentityError("")
            }}
            style={{
              position:"fixed",
              inset:0,
              background:"rgba(0,0,0,0.68)",
              zIndex:390
            }}
          />
          <div style={getModalShellStyle(isMobile, 420)}>
            <div style={modalHeaderStyle}>
              <div style={modalTitleStyle}>Confirm Identity</div>
              <div style={modalSubtitleStyle}>
                Enter your current password to save sensitive account changes.
              </div>
            </div>
            <div style={{padding:18,overflowY:"auto"}}>
              {confirmIdentityError && (
                <div style={{background:"#2D0A0A",border:"1px solid #F87171",color:"#FCA5A5",padding:"8px 10px",borderRadius:8,fontSize:12,marginBottom:12}}>
                  {confirmIdentityError}
                </div>
              )}
              <div style={{marginBottom:14}}>
                <Label>Current Password</Label>
                <input
                  type="password"
                  value={confirmIdentityPassword}
                  onChange={e=>setConfirmIdentityPassword(e.target.value)}
                  onKeyDown={e=>{ if (e.key==="Enter") confirmSensitiveProfileSave() }}
                  style={iStyle}
                  autoFocus
                />
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap"}}>
                <button
                  onClick={()=>{
                    setConfirmIdentityOpen(false)
                    setConfirmIdentityPassword("")
                    setConfirmIdentityError("")
                  }}
                  style={btnGray}
                >
                  Cancel
                </button>
                <button onClick={confirmSensitiveProfileSave} style={btnGreen}>
                  Confirm & Save
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {isCurrentAdmin && (
        <div style={{...cardStyle,marginBottom:16,overflow:"hidden"}}>
          <div style={sectionLabel}>Pending Requests</div>
          {pending.length===0 ? (
            <div style={{fontSize:12,color:"#6B7280"}}>No pending access requests.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {pending.map(req=>(
                <div key={req.userId} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:isMobile?"wrap":"nowrap",background:"#0C1117",border:"1px solid #1F2937",borderRadius:6,padding:"10px 12px"}}>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{fontSize:14,color:"#F9FAFB",fontWeight:600}}>{req.name}</div>
                    <div style={{fontSize:12,color:"#6B7280",wordBreak:"break-word"}}>
                      {req.email} | Requested Role: {roleLabel(req.role || "member")} | Requested {fmt(req.requestedAt)}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",width:isMobile?"100%":"auto"}}>
                    <button onClick={()=>currentTeam?.teamId && onApprove(currentTeam.teamId, req.userId)} style={btnGreen}>Approve</button>
                    <button onClick={()=>currentTeam?.teamId && onDeny(currentTeam.teamId, req.userId)} style={btnGray}>Reject</button>
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
            <div style={{fontSize:12,color:"#6B7280",marginBottom:8}}>Dashboard Focus</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:10}}>
              <div>
                <Label>Today's Focus Override</Label>
                <textarea
                  value={todayFocusInput}
                  onChange={e=>setTodayFocusInput(e.target.value)}
                  rows={3}
                  placeholder="Optional custom focus message for all users"
                  style={{...iStyle,resize:"vertical",lineHeight:1.5}}
                />
                <div style={{fontSize:11,color:"#6B7280",marginTop:6,lineHeight:1.5}}>
                  Leave blank to use the automatically rotating daily focus message.
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap"}}>
                <button onClick={clearTodayFocus} style={btnGray}>Clear Custom Focus</button>
                <button onClick={saveTodayFocus} style={btnBlue}>Save Today's Focus</button>
              </div>
            </div>
          </div>

          <div style={{borderTop:"1px solid #1F2937",paddingTop:10,marginTop:8,marginBottom:10}}>
            <div style={{fontSize:12,color:"#6B7280",marginBottom:8}}>Billing & Remittance</div>
            <div style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
              <div>
                <Label>Company Address</Label>
                <input value={companySettingsForm.companyAddress} onChange={e=>setCompanySettingsForm(f=>({...f,companyAddress:e.target.value}))} style={iStyle} />
              </div>
              <div>
                <Label>Billing Contact Name</Label>
                <input value={companySettingsForm.billingContactName} onChange={e=>setCompanySettingsForm(f=>({...f,billingContactName:e.target.value}))} style={iStyle} />
              </div>
              <div>
                <Label>Billing Contact Email</Label>
                <input value={companySettingsForm.billingContactEmail} onChange={e=>setCompanySettingsForm(f=>({...f,billingContactEmail:e.target.value}))} style={iStyle} />
              </div>
              <div>
                <Label>Billing Contact Phone</Label>
                <input value={companySettingsForm.billingContactPhone} onChange={e=>setCompanySettingsForm(f=>({...f,billingContactPhone:e.target.value}))} style={iStyle} />
              </div>
              <div>
                <Label>Payment Terms</Label>
                <input value={companySettingsForm.paymentTerms} onChange={e=>setCompanySettingsForm(f=>({...f,paymentTerms:e.target.value}))} style={iStyle} />
              </div>
              <div>
                <Label>Accepted Payment Methods</Label>
                <input value={companySettingsForm.acceptedPaymentMethods} onChange={e=>setCompanySettingsForm(f=>({...f,acceptedPaymentMethods:e.target.value}))} style={iStyle} />
              </div>
              <div style={{gridColumn:isMobile ? "auto" : "1 / -1"}}>
                <Label>Payment Instructions</Label>
                <textarea
                  value={companySettingsForm.paymentInstructions}
                  onChange={e=>setCompanySettingsForm(f=>({...f,paymentInstructions:e.target.value}))}
                  rows={4}
                  style={{...iStyle,resize:"vertical",lineHeight:1.5}}
                />
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
              <button onClick={saveCompanySettings} style={btnBlue}>Save Billing Settings</button>
            </div>
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
                      <select value={u.role||"member"} onChange={e=>onAssignUserRole(u.id, e.target.value)} style={{...iStyle,width:isMobile?"100%":"auto",minWidth:isMobile?0:140,maxWidth:"100%",padding:"6px 8px",fontSize:12,flex:isMobile?"1 1 100%":"0 0 auto"}}>
                        {(currentTeam?.roles||["member"]).map(r=><option key={r} value={r}>{roleLabel(r)}</option>)}
                      </select>
                      {canResetPasswords && u.id !== currentUser?.id && (
                        <button onClick={()=>onOpenResetPasswordModal?.(u)} style={{...btnBlue,flex:isMobile?"1 1 calc(50% - 4px)":"0 0 auto"}}>Reset Password</button>
                      )}
                      {isCurrentCeo && (
                        <>
                          <button onClick={()=>forceLogout(u)} style={{...btnGray,flex:isMobile?"1 1 calc(50% - 4px)":"0 0 auto"}}>Force Logout</button>
                          <button onClick={()=>kickUser(u)} style={{...btnDanger,flex:isMobile?"1 1 calc(50% - 4px)":"0 0 auto"}}>Remove User</button>
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

function TimePicker({ value, onChange, style, allowEmpty=false, storageFormat="12h" }) {
  const parsed = parseTimeValue(value) || parseTimeValue(storageFormat === "24h" ? "08:00" : "08:00 AM") || { hour24:8, minute:0 }
  const [hour, setHour] = useState(String(parsed.hour24 % 12 || 12))
  const [minute, setMinute] = useState(String(parsed.minute).padStart(2, "0"))
  const [period, setPeriod] = useState(parsed.hour24 >= 12 ? "PM" : "AM")

  useEffect(() => {
    if (!value && allowEmpty) {
      setHour("")
      setMinute("00")
      setPeriod("AM")
      return
    }
    const next = parseTimeValue(value)
    if (!next) return
    setHour(String(next.hour24 % 12 || 12))
    setMinute(String(next.minute).padStart(2, "0"))
    setPeriod(next.hour24 >= 12 ? "PM" : "AM")
  }, [allowEmpty, value])

  const emitValue = (nextHour, nextMinute, nextPeriod) => {
    if (allowEmpty && !nextHour) {
      onChange("")
      return
    }
    const base = `${nextHour || "12"}:${nextMinute} ${nextPeriod}`
    onChange(storageFormat === "24h" ? formatTime24Hour(base) : formatTime12Hour(base))
  }

  const selectStyle = { ...iStyle, ...style, minWidth:0, width:"100%" }
  const wrapperStyle = {
    display:"grid",
    gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",
    gap:8
  }
  const minuteOptions = Array.from({ length:60 }, (_, index)=>String(index).padStart(2, "0"))
  const hourOptions = Array.from({ length:12 }, (_, index)=>String(index + 1))

  return (
    <div style={wrapperStyle}>
      <select
        value={hour}
        onChange={e=>{
          const nextHour = e.target.value
          setHour(nextHour)
          emitValue(nextHour, minute, period)
        }}
        style={selectStyle}
      >
        {allowEmpty && <option value="">No Time</option>}
        {hourOptions.map(option=><option key={option} value={option}>{option}</option>)}
      </select>
      <select
        value={minute}
        onChange={e=>{
          const nextMinute = e.target.value
          setMinute(nextMinute)
          emitValue(hour, nextMinute, period)
        }}
        style={selectStyle}
      >
        {minuteOptions.map(option=><option key={option} value={option}>{option}</option>)}
      </select>
      <select
        value={period}
        onChange={e=>{
          const nextPeriod = e.target.value
          setPeriod(nextPeriod)
          emitValue(hour, minute, nextPeriod)
        }}
        style={selectStyle}
      >
        {["AM","PM"].map(option=><option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  )
}

/* -------------------------- SCHEDULE TAB -------------------------- */
function ScheduleTab({ activeUser, currentUser, teamUsers = [], recurringWeeklySchedule = [], setRecurringWeeklySchedule, oneOffScheduleBlocks = [], setOneOffScheduleBlocks, tasks = [], setTasks, properties = [], clients = [], canAdd=true, canEdit=true, canDelete=true, canManagePermanent=false, fireNotif, onImmediateOneTimeAlert }) {
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
    window.scrollTo({ top:0, left:0, behavior:"auto" })
  }, [view])

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
    if (onImmediateOneTimeAlert) {
      onImmediateOneTimeAlert({
        userId: payload.userId,
        eventKey: `schedule:recurring:${payload.id}`,
        type: "schedule",
        title: `Recurring Schedule Added - ${payload.day}`,
        body: `${payload.start} - ${payload.end}${payload.note ? ` | ${payload.note}` : ""}`
      })
    }
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
    if (onImmediateOneTimeAlert) {
      onImmediateOneTimeAlert({
        userId: payload.userId,
        eventKey: `schedule:oneoff:${payload.id}`,
        type: "schedule",
        title: `Schedule Added - ${payload.title}`,
        body: `${displayDate(payload.date)} | ${payload.start} - ${payload.end}`
      })
    }
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
      fireNotif("task", `New Task Assigned - ${payload.title}`, `Due ${payload.dueDate}${payload.dueTime ? ` at ${displayTimeValue(payload.dueTime)}` : ""}.`, [payload.assignedUserId], `task:${payload.id}`)
    }
    if (taskEditId && fireNotif && editingTask && editingTask.assignedUserId!==payload.assignedUserId) {
      fireNotif("task", `Task Reassigned - ${payload.title}`, `Due ${payload.dueDate}${payload.dueTime ? ` at ${displayTimeValue(payload.dueTime)}` : ""}.`, [payload.assignedUserId], `task:${payload.id}`)
    }
    if (onImmediateOneTimeAlert) {
      onImmediateOneTimeAlert({
        userId: payload.assignedUserId,
        eventKey: `task:${payload.id}`,
        type: "task",
        title: `${taskEditId ? "Task Updated" : "Task Assigned"} - ${payload.title}`,
        body: `Due ${displayDate(payload.dueDate)}${payload.dueTime ? ` at ${displayTimeValue(payload.dueTime)}` : ""}`
      })
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
            <TimePicker value={oneOffForm.start} onChange={value=>setOneOffForm(f=>({...f,start:value}))} />
            <TimePicker value={oneOffForm.end} onChange={value=>setOneOffForm(f=>({...f,end:value}))} />
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
                    {row.tasks.length===0 ? <div style={{fontSize:11,color:"#4B5563"}}>No tasks due today</div> : row.tasks.map(task=><div key={task.id} style={{background:"#111827",border:"1px solid #1F2937",borderRadius:6,padding:"6px 8px",marginBottom:6}}><div style={{fontSize:12,color:"#F9FAFB",fontWeight:600}}>{task.title}</div><div style={{fontSize:11,color:"#9CA3AF"}}>{task.priority} | {task.status}{task.dueTime ? ` | ${displayTimeValue(task.dueTime)}` : ""}</div></div>)}
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
            {oneOffFiltered.length===0 ? <div style={{fontSize:11,color:"#4B5563"}}>No matching one-off blocks.</div> : oneOffFiltered.map(entry=><div key={entry.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,background:"#0C1117",border:"1px solid #1F2937",borderRadius:6,padding:"7px 8px",marginBottom:6}}><div style={{fontSize:11,color:"#D1D5DB"}}>{formatDateLong(entry.date)} | {entry.userName} | {entry.start} - {entry.end} | {entry.title} ({entry.type})</div>{canManageSchedule && <div style={{display:"flex",gap:6}}>{canEdit && <button onClick={()=>editOneOff(entry)} style={{...btnBlue,padding:"2px 8px",fontSize:11}}>Edit</button>}{canDelete && <button onClick={()=>removeOneOff(entry.id)} style={{...btnGray,padding:"2px 8px",fontSize:11,border:"1px solid #EF4444",color:"#FCA5A5"}}>Delete</button>}</div>}</div>)}
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
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.8fr 1.2fr",gap:sectionGap,marginBottom:sectionGap}}>
                <input value={taskForm.title} onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))} placeholder="Task title" style={iStyle} />
                <textarea
                  value={taskForm.detail}
                  onChange={e=>setTaskForm(f=>({...f,detail:e.target.value}))}
                  placeholder="Task detail"
                  rows={isMobile ? 3 : 2}
                  style={{...iStyle,resize:"vertical",lineHeight:1.45}}
                />
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(5,minmax(0,1fr))",gap:sectionGap,marginBottom:sectionGap}}>
                <select value={taskForm.assignedUserId} onChange={e=>setTaskForm(f=>({...f,assignedUserId:e.target.value}))} style={iStyle}><option value="">Assign User</option>{teamUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
                <input type="date" value={taskForm.dueDate} onChange={e=>setTaskForm(f=>({...f,dueDate:e.target.value}))} style={iStyle} />
                <TimePicker value={taskForm.dueTime} onChange={value=>setTaskForm(f=>({...f,dueTime:value}))} allowEmpty storageFormat="24h" />
                <select value={taskForm.priority} onChange={e=>setTaskForm(f=>({...f,priority:e.target.value}))} style={iStyle}>{["Low","Normal","High","Urgent"].map(p=><option key={p}>{p}</option>)}</select>
                <select value={taskForm.status} onChange={e=>setTaskForm(f=>({...f,status:e.target.value}))} style={iStyle}>{["To Do","In Progress","Done"].map(s=><option key={s}>{s}</option>)}</select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:sectionGap,marginBottom:sectionGap}}>
                <select value={taskForm.propertyId} onChange={e=>setTaskForm(f=>({...f,propertyId:e.target.value}))} style={iStyle}><option value="">Link Job (optional)</option>{properties.map(p=><option key={p.id} value={p.id}>{p.address}</option>)}</select>
                <select value={taskForm.clientId} onChange={e=>setTaskForm(f=>({...f,clientId:e.target.value}))} style={iStyle}><option value="">Link Client (optional)</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              <div style={{display:"flex",justifyContent:isMobile?"stretch":"flex-end"}}>
                <button onClick={saveTask} style={{...btnGreen,width:isMobile?"100%":180}}>{taskEditId ? "Save" : "Add"}</button>
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
            {filteredTasks.length===0 ? <div style={{fontSize:12,color:"#6B7280"}}>No tasks match these filters.</div> : <div style={{display:"flex",flexDirection:"column",gap:8}}>{filteredTasks.map(task=>{ const assigned = userMap[task.assignedUserId]; const linkedProp = properties.find(p=>p.id===task.propertyId); const linkedClient = clients.find(c=>c.id===task.clientId); const statusColor = task.status==="Done" ? "#34D399" : task.status==="In Progress" ? "#FBBF24" : "#60A5FA"; const priorityColor = task.priority==="Urgent" ? "#F87171" : task.priority==="High" ? "#FB923C" : task.priority==="Low" ? "#9CA3AF" : "#60A5FA"; return <div key={task.id} style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:10}}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start",flexWrap:"wrap"}}><div><div style={{fontSize:14,fontWeight:700,color:"#F9FAFB"}}>{task.title}</div><div style={{fontSize:11,color:"#9CA3AF"}}>{assigned?.name || "Unassigned"} | Due {formatDateLong(task.dueDate)}{task.dueTime ? ` ${displayTimeValue(task.dueTime)}` : ""}</div></div><div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}><span style={{fontSize:11,color:priorityColor,border:`1px solid ${priorityColor}`,borderRadius:12,padding:"1px 8px"}}>{task.priority}</span><select value={task.status} onChange={e=>updateTaskStatus(task.id, e.target.value)} style={{...iStyle,padding:"4px 8px",fontSize:11,width:110}} disabled={!canUpdateTaskStatus(task)}>{["To Do","In Progress","Done"].map(s=><option key={s}>{s}</option>)}</select>{(canManageTasks || canEdit) && <button onClick={()=>editTask(task)} style={{...btnBlue,padding:"4px 8px",fontSize:11}}>Edit</button>}{canDelete && <button onClick={()=>removeTask(task.id)} style={{...btnGray,padding:"4px 8px",fontSize:11,border:"1px solid #EF4444",color:"#FCA5A5"}}>Delete</button>}</div></div>{task.detail && <div style={{fontSize:12,color:"#D1D5DB",marginTop:6}}>{task.detail}</div>}<div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:6,fontSize:11,color:"#6B7280"}}><span style={{color:statusColor}}>Status: {task.status}</span>{linkedProp && <span>Job: {linkedProp.address}</span>}{linkedClient && <span>Client: {linkedClient.name}</span>}</div></div> })}</div>}
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
                <TimePicker value={recurringForm.start} onChange={value=>setRecurringForm(f=>({...f,start:value}))} />
                <TimePicker value={recurringForm.end} onChange={value=>setRecurringForm(f=>({...f,end:value}))} />
                <input value={recurringForm.note} onChange={e=>setRecurringForm(f=>({...f,note:e.target.value}))} placeholder="Optional note" style={iStyle} />
                <button onClick={saveRecurring} style={btnBlue}>{recurringEditId ? "Save" : "Add"}</button>
              </div>
            </div>
          )}

          <div style={{...cardStyle,padding:sectionPad}}>
            {recurringRows.length===0 ? <div style={{fontSize:12,color:"#6B7280"}}>No recurring schedule entries yet.</div> : <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,minmax(0,1fr))",gap:sectionGap}}>{WEEK_DAYS.map(day=>{ const entries = recurringRows.filter(r=>r.day===day); return <div key={day} style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:10}}><div style={{fontSize:13,fontWeight:700,color:"#F9FAFB",marginBottom:8}}>{day}</div>{entries.length===0 ? <div style={{fontSize:11,color:"#4B5563"}}>No recurring shifts</div> : entries.map(entry=><div key={entry.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,background:"#111827",border:"1px solid #1F2937",borderRadius:6,padding:"6px 8px",marginBottom:6}}><div style={{fontSize:11,color:"#D1D5DB"}}>{entry.userName} | {entry.start} - {entry.end}{entry.note ? ` | ${entry.note}` : ""}</div>{canManageRecurring && <div style={{display:"flex",gap:6}}>{canEdit && <button onClick={()=>editRecurring(entry)} style={{...btnBlue,padding:"2px 8px",fontSize:11}}>Edit</button>}{canDelete && <button onClick={()=>removeRecurring(entry.id)} style={{...btnGray,padding:"2px 8px",fontSize:11,border:"1px solid #EF4444",color:"#FCA5A5"}}>Delete</button>}</div>}</div>)}</div> })}</div>}
          </div>
        </>
      )}
    </div>
  )
}
/* PROPERTY PANEL ========================== */
function PropertyPanel({prop,update,onClose,onPhotos,onRemovePhoto,onRenamePhoto,onDocuments,onRemoveDocument,onUpdateDocumentDetails,onPrintPacket,vendors,inspectors,clients=[],invoices=[],onMarkComplete,onReopenJob,onCreateInvoice,canCreateInvoice=true,onOpenInvoicesTab,canEdit=true}) {
  const { isPhone: isMobile } = viewportInfo()
  const [ptab,setPtab]=useState("info")
  const [showIssuesDetail, setShowIssuesDetail] = useState(false)
  const panelScrollRef = useRef(null)
  const fileRef=useRef()
  const docFileRef=useRef()
  const [docCategory, setDocCategory] = useState("Permit Copy")
  const [docNotes, setDocNotes] = useState("")
  const [editingDocumentId, setEditingDocumentId] = useState("")
  const [documentEditForm, setDocumentEditForm] = useState({ category:"Permit Copy", notes:"" })
  const [previewPhotoId, setPreviewPhotoId] = useState("")
  const [editingPhotoId, setEditingPhotoId] = useState("")
  const [photoDisplayName, setPhotoDisplayName] = useState("")
  const sm=STATUS_META[prop.permitStatus]||STATUS_META["--"]
  const billingMeta = getBillingMeta(prop, invoices)
  const readiness = getChecklistStatus(prop)
  const referenceSourcesUsed = getReferenceSourcesUsed(prop)
  const assignedClient = clients.find(c=>c.id===prop.clientId)
  const hasInvoice = !!prop.invoiceId
  const previewPhoto = (prop.photos || []).find(photo => photo.id === previewPhotoId) || null
  const requiredDocuments = getRequiredDocumentLabels(prop)
  const uploadedRequiredDocuments = requiredDocuments.filter(item=>hasDocumentCategory(prop, item))
  const openIssueCount = readiness.blockingIssues.length + readiness.warnings.length + readiness.missingRequiredItems.length
  const issuePreviewText = readiness.blockingIssues[0] || readiness.warnings[0] || readiness.missingRequiredItems[0] || ""
  const toggleVendor=(vid)=>{ if (!canEdit) return; const cur=prop.assignedVendors||[]; update(prop.id,"assignedVendors",cur.includes(vid)?cur.filter(x=>x!==vid):[...cur,vid]) }
  const toggleInspector=(iid)=>{ if (!canEdit) return; const cur=prop.assignedInspectors||[]; update(prop.id,"assignedInspectors",cur.includes(iid)?cur.filter(x=>x!==iid):[...cur,iid]) }
  useEffect(() => {
    setShowIssuesDetail(false)
    setEditingDocumentId("")
    setDocumentEditForm({ category:"Permit Copy", notes:"" })
    setPreviewPhotoId("")
    setEditingPhotoId("")
    setPhotoDisplayName("")
  }, [prop.id])
  useEffect(() => {
    panelScrollRef.current?.scrollTo({ top:0, left:0, behavior:"auto" })
  }, [prop.id, ptab])
  useEffect(() => {
    if (!previewPhotoId) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [previewPhotoId])
  const beginDocumentEdit = (doc) => {
    setEditingDocumentId(doc.id)
    setDocumentEditForm({
      category: doc.category || "Miscellaneous",
      notes: doc.notes || ""
    })
  }
  const cancelDocumentEdit = () => {
    setEditingDocumentId("")
    setDocumentEditForm({ category:"Permit Copy", notes:"" })
  }
  const saveDocumentEdit = (docId) => {
    if (!docId || !onUpdateDocumentDetails) return
    onUpdateDocumentDetails(prop.id, docId, {
      category: documentEditForm.category,
      notes: documentEditForm.notes
    })
    cancelDocumentEdit()
  }
  const beginPhotoRename = (photo) => {
    setEditingPhotoId(photo.id)
    setPhotoDisplayName(getPhotoDisplayName(photo))
  }
  const cancelPhotoRename = () => {
    setEditingPhotoId("")
    setPhotoDisplayName("")
  }
  const savePhotoRename = (photoId) => {
    if (!photoId || !onRenamePhoto) return
    onRenamePhoto(prop.id, photoId, photoDisplayName)
    cancelPhotoRename()
  }
  const removePhotoRecord = (photoId) => {
    if (!photoId || !onRemovePhoto) return
    if (!window.confirm("Remove this site photo?\n\nThis will delete the saved image from this job record on this device.")) return
    onRemovePhoto(prop.id, photoId)
    if (previewPhotoId === photoId) setPreviewPhotoId("")
    if (editingPhotoId === photoId) cancelPhotoRename()
  }
  const removeDocumentRecord = (doc) => {
    if (!doc?.id || !onRemoveDocument) return
    if (!window.confirm(`Remove ${doc.name} from this property record?\n\nThe saved local file payload will also be removed from this device.`)) return
    onRemoveDocument(prop.id, doc.id)
  }
  const quickComplianceFields = [
    { key:"workOrderNumber", label:"Work Order #", type:"text" },
    { key:"countyPmName", label:"County PM", type:"text" },
    { key:"preparedBy", label:"Prepared By", type:"text" },
    { key:"mobilizationDate", label:"Mobilization Date", type:"date" },
    { key:"ticket811", label:"811 Ticket", type:"text" }
  ]
  const renderComplianceField = (field) => {
    if (!isFieldApplicable(prop, field)) return null
    if (field.type === "text" || field.type === "date" || field.type === "datetime") {
      const inputType = field.type === "datetime" ? "datetime-local" : (field.type === "date" ? "date" : "text")
      const inputValue = field.type === "datetime"
        ? normalizeDateTimeInput(prop[field.key])
        : field.type === "date"
          ? normalizeDateInput(prop[field.key])
          : (prop[field.key] || "")
      const hasLegacyDateTime = field.type === "datetime" && !inputValue && isTruthyText(prop[field.key])
      return (
        <div key={field.key}>
          <Label>{field.label}{field.required || field.requiredWhenTrue ? " *" : ""}</Label>
          {(field.source || field.helper) && (
            <div style={{fontSize:10,color:"#6B7280",marginBottom:6,lineHeight:1.4}}>
              {field.source ? `Source: ${field.source}` : ""}
              {field.source && field.helper ? " | " : ""}
              {field.helper || ""}
            </div>
          )}
          <input
            type={inputType}
            value={inputValue}
            onChange={e=>update(prop.id, field.key, e.target.value)}
            placeholder={field.type === "text" ? field.label : ""}
            style={iStyle}
            disabled={!canEdit}
          />
          {hasLegacyDateTime && (
            <div style={{fontSize:10,color:"#FBBF24",marginTop:6,lineHeight:1.4}}>
              Existing saved value could not be fully structured automatically: {String(prop[field.key])}
            </div>
          )}
        </div>
      )
    }
    return (
      <label key={field.key} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #1F2937",cursor:"pointer"}}>
        <input
          type="checkbox"
          checked={!!prop[field.key]}
          onChange={e=>update(prop.id, field.key, e.target.checked)}
          style={{width:16,height:16,cursor:"pointer",accentColor:"#34D399"}}
          disabled={!canEdit}
        />
        <div style={{flex:1}}>
          <div style={{fontSize:13,color:"#F9FAFB",fontWeight:600}}>{field.label}</div>
          {(field.required || field.requiredWhenTrue) && <div style={{fontSize:10,color:"#6B7280"}}>Required before mobilization</div>}
          {(field.source || field.helper) && (
            <div style={{fontSize:10,color:"#6B7280",marginTop:2,lineHeight:1.4}}>
              {field.source ? `Source: ${field.source}` : ""}
              {field.source && field.helper ? " | " : ""}
              {field.helper || ""}
            </div>
          )}
        </div>
        <span style={{fontSize:11,color:prop[field.key]?"#34D399":"#6B7280",fontWeight:700}}>
          {prop[field.key] ? "Done" : "Open"}
        </span>
      </label>
    )
  }
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{background:"#111827",padding:"12px 16px",borderBottom:"2px solid #F97316",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:isMobile?"wrap":"nowrap"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:"#F9FAFB",letterSpacing:1,lineHeight:1.1}}>{prop.address}</div>
            <div style={{marginTop:4,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{background:sm.bg,color:sm.color,border:`1px solid ${sm.color}`,borderRadius:3,padding:"2px 8px",fontSize:11,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{prop.permitStatus}</span>
              <span style={{background:readiness.readiness.bg,color:readiness.readiness.color,border:`1px solid ${readiness.readiness.color}`,borderRadius:3,padding:"2px 8px",fontSize:11,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{readiness.readiness.label}</span>
              <span style={{background:billingMeta.bg,color:billingMeta.color,border:`1px solid ${billingMeta.color}`,borderRadius:3,padding:"2px 8px",fontSize:11,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{billingMeta.label}</span>
              {prop.workType!=="-- Select --"&&<span style={{color:"#9CA3AF",fontSize:12}}>{prop.workType}</span>}
            </div>
            <div style={{marginTop:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#9CA3AF",marginBottom:4}}>
                <span>Compliance Progress</span>
                <span>{readiness.percentComplete}% complete</span>
              </div>
              <div style={{height:8,background:"#0C1117",borderRadius:999,overflow:"hidden",border:"1px solid #1F2937"}}>
                <div style={{height:"100%",width:`${readiness.percentComplete}%`,background:readiness.readiness.color}} />
              </div>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap",marginTop:6,fontSize:11,color:"#9CA3AF"}}>
                <span>{readiness.completedCount} of {readiness.totalCount} checklist items complete</span>
                <span style={{color:readiness.readiness.color,fontWeight:700}}>{readiness.readiness.label}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
              {[
                { label:"Priority Gaps", value:readiness.missingRequiredItems.length, color:"#F9FAFB" },
                { label:"Blockers", value:readiness.blockingIssues.length, color:"#FCA5A5" },
                { label:"Required Docs", value:`${uploadedRequiredDocuments.length} / ${requiredDocuments.length || 0}`, color:"#6EE7B7" },
                { label:"Client", value:assignedClient?.name || "Unassigned", color:"#F9FAFB" }
              ].map(item=>(
                <div key={item.label} style={{display:"flex",alignItems:"center",gap:6,background:"#0C1117",border:"1px solid #1F2937",borderRadius:999,padding:isMobile ? "5px 8px" : "5px 9px",minWidth:0,maxWidth:"100%"}}>
                  <span style={{fontSize:10,color:"#6B7280",fontWeight:700,textTransform:"uppercase",letterSpacing:0.7,whiteSpace:"nowrap"}}>{item.label}</span>
                  <span style={{fontSize:11,color:item.color,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{...buttonStyle,padding:"6px 10px",fontSize:12,flexShrink:0}}>Close</button>
        </div>
        {!canEdit && (
          <div style={{marginTop:8,background:"#0C1117",border:"1px solid #334155",color:"#CBD5E1",borderRadius:8,padding:"7px 9px",fontSize:11.5,lineHeight:1.4}}>
            View-only access. Compliance and job details can be reviewed here, but changes are restricted for your role.
          </div>
        )}
        {!!openIssueCount && (
          <div style={{marginTop:8,background:"#0C1117",border:"1px solid #243246",borderRadius:10,padding:"7px 9px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",minWidth:0}}>
                <div style={{fontSize:10,color:"#90A0B8",fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>
                  Open Issues
                </div>
                <span style={{fontSize:10,color:"#FCA5A5",fontWeight:700}}>Blockers: {readiness.blockingIssues.length}</span>
                <span style={{fontSize:10,color:"#FDBA74",fontWeight:700}}>Warnings: {readiness.warnings.length}</span>
                <span style={{fontSize:10,color:"#DCE7F5",fontWeight:700}}>Gaps: {readiness.missingRequiredItems.length}</span>
              </div>
              <button
                onClick={()=>setShowIssuesDetail(v=>!v)}
                style={{background:"transparent",border:"none",padding:0,color:"#DCE7F5",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}
              >
                {showIssuesDetail ? "Show less" : "Review"}
              </button>
            </div>
            {!showIssuesDetail && issuePreviewText && (
              <div style={{fontSize:10.5,color:"#9CA3AF",marginTop:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                {issuePreviewText}
              </div>
            )}
            {showIssuesDetail && (
              <div style={{marginTop:8,maxHeight:isMobile ? 170 : 190,overflowY:"auto",paddingRight:2,display:"flex",flexDirection:"column",gap:8}}>
                {!!readiness.blockingIssues.length && (
                  <div>
                    <div style={{fontSize:10,color:"#FCA5A5",fontWeight:800,letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>Blockers</div>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      {readiness.blockingIssues.map(item=>(
                        <div key={item} style={{fontSize:10.5,color:"#FECACA",lineHeight:1.3,background:"#1A1013",border:"1px solid #3F1A1E",borderRadius:7,padding:"5px 7px",overflowWrap:"anywhere"}}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!!readiness.warnings.length && (
                  <div>
                    <div style={{fontSize:10,color:"#FDBA74",fontWeight:800,letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>Warnings</div>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      {readiness.warnings.map(item=>(
                        <div key={item} style={{fontSize:10.5,color:"#FED7AA",lineHeight:1.3,background:"#1F1408",border:"1px solid #4A2A12",borderRadius:7,padding:"5px 7px",overflowWrap:"anywhere"}}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!!readiness.missingRequiredItems.length && (
                  <div>
                    <div style={{fontSize:10,color:"#DCE7F5",fontWeight:800,letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>Priority Gaps</div>
                    <div style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "repeat(2,minmax(0,1fr))",gap:4}}>
                      {readiness.missingRequiredItems.map(item=>(
                        <div key={item} style={{fontSize:10.5,color:"#D1D5DB",lineHeight:1.3,background:"#111827",border:"1px solid #1F2937",borderRadius:7,padding:"5px 7px",overflowWrap:"anywhere"}}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginTop:8,flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[["info","INFO"],["compliance","COMPLIANCE"],["documents","DOCUMENTS"],["map","MAP"],["team","TEAM"],["photos","PHOTOS"]].map(([k,l])=>(
              <button key={k} onClick={()=>setPtab(k)} style={{...buttonStyle,background:ptab===k?"#0C1117":"#111827",color:ptab===k?"#F97316":"#9CA3AF",padding:"4px 10px",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,letterSpacing:1}}>{l}</button>
            ))}
          </div>
          <button onClick={()=>onPrintPacket && onPrintPacket(prop.id)} style={{...btnBlue,padding:"5px 10px",fontSize:11.5}}>
            Print Compliance Packet
          </button>
        </div>
      </div>
      {ptab==="info"&&(
        <div ref={panelScrollRef} style={{padding:16,paddingBottom:110,overflowY:"auto",flex:1}}>
          <Section label="JOB SUMMARY">
            <div style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "repeat(2,minmax(0,1fr))",gap:10}}>
              {quickComplianceFields.map(field=>renderComplianceField(field))}
            </div>
          </Section>
          <Section label="PERMIT STATUS">
            <select value={prop.permitStatus} onChange={e=>update(prop.id,"permitStatus",e.target.value)} style={{background:sm.bg,border:`1px solid ${sm.color}`,borderRadius:4,color:sm.color,fontSize:13,padding:"6px 10px",width:"100%",fontWeight:700,cursor:"pointer"}} disabled={!canEdit}>
              {PERMIT_STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
            {prop.permitStatus==="Started"&&<div style={{marginTop:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#FBBF24"}}>Timer {fmt(prop.startedAt)} {fmtT(prop.startedAt)} - {hoursAgo(prop.startedAt)}h elapsed {parseFloat(hoursAgo(prop.startedAt))>20&&<span style={{color:"#F87171",marginLeft:8}}>NEAR DEADLINE</span>}</div>}
            {prop.permitStatus==="Submitted"&&<div style={{marginTop:8}}><Label>Submitted To</Label><input value={prop.submittedTo||""} onChange={e=>update(prop.id,"submittedTo",e.target.value)} placeholder="Name / email..." style={iStyle} disabled={!canEdit}/><Label style={{marginTop:8}}>Date Submitted</Label><input type="date" value={normalizeDateInput(prop.submittedDate)} onChange={e=>update(prop.id,"submittedDate",e.target.value)} style={iStyle} disabled={!canEdit}/></div>}
          </Section>
          <Section label="WORK TYPE"><select value={prop.workType} onChange={e=>update(prop.id,"workType",e.target.value)} style={{background:"#1F2937",border:"1px solid #374151",borderRadius:4,color:"#F9FAFB",fontSize:13,padding:"6px 10px",width:"100%",cursor:"pointer"}} disabled={!canEdit}>{WORK_TYPES.map(w=><option key={w}>{w}</option>)}</select></Section>
          <Section label="PERMIT INFORMATION"><Label>Demo Permit #</Label><input value={prop.permitNumber||""} onChange={e=>update(prop.id,"permitNumber",e.target.value)} placeholder="Harris County permit number..." style={iStyle} disabled={!canEdit}/><Label style={{marginTop:8}}>HCAD Account #</Label><input value={prop.hcadNumber||""} onChange={e=>update(prop.id,"hcadNumber",e.target.value)} placeholder="13-digit HCAD number..." style={{...iStyle,fontFamily:"'IBM Plex Mono',monospace"}} disabled={!canEdit}/></Section>
          <Section label="UTILITY DISCONNECTS">
            {[["electric","Electric","CenterPoint 713-207-2222"],["gas","Gas","Atmos 888-286-6700"],["water","Water","Houston Water 832-393-1000"]].map(([k,label,note])=>(
              <label key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid #1F2937",cursor:"pointer"}}>
                <input type="checkbox" checked={prop[k]||false} onChange={e=>update(prop.id,k,e.target.checked)} style={{width:16,height:16,cursor:"pointer",accentColor:"#34D399"}} disabled={!canEdit}/>
                <div><div style={{fontSize:13,color:prop[k]?"#34D399":"#9CA3AF",fontWeight:600}}>{label}</div><div style={{fontSize:10,color:"#4B5563"}}>{note}</div></div>
                {prop[k]&&<span style={{marginLeft:"auto",color:"#34D399",fontSize:12,fontWeight:700}}>CONFIRMED</span>}
              </label>
            ))}
          </Section>
          <Section label="READINESS SNAPSHOT">
            <div style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "repeat(3,minmax(0,1fr))",gap:8,marginBottom:10}}>
              <div style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:10}}>
                <div style={{fontSize:11,color:"#6B7280"}}>Priority Gaps</div>
                <div style={{fontSize:18,fontWeight:700,color:"#F9FAFB"}}>{readiness.missingRequiredItems.length}</div>
              </div>
              <div style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:10}}>
                <div style={{fontSize:11,color:"#6B7280"}}>Blocking Issues</div>
                <div style={{fontSize:18,fontWeight:700,color:"#FCA5A5"}}>{readiness.blockingIssues.length}</div>
              </div>
              <div style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:10}}>
                <div style={{fontSize:11,color:"#6B7280"}}>Required Documents On File</div>
                <div style={{fontSize:18,fontWeight:700,color:"#6EE7B7"}}>{uploadedRequiredDocuments.length} / {requiredDocuments.length || 0}</div>
              </div>
            </div>
            {!!readiness.missingRequiredItems.length && (
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                {readiness.missingRequiredItems.map(item=>(
                  <span key={item} style={{background:"#111827",border:"1px solid #334155",color:"#E2E8F0",padding:"4px 8px",borderRadius:999,fontSize:11,fontWeight:700}}>
                    {item}
                  </span>
                ))}
              </div>
            )}
            {!!readiness.missingDocuments?.length && (
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                {readiness.missingDocuments.map(item=>(
                  <span key={item} style={{background:"#2D0A0A",border:"1px solid #7F1D1D",color:"#FCA5A5",padding:"4px 8px",borderRadius:999,fontSize:11,fontWeight:700}}>
                    {item}
                  </span>
                ))}
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {readiness.blockingIssues.map(issue=>(
                <div key={issue} style={{fontSize:12,color:"#FCA5A5",padding:"8px 10px",background:"#111827",border:"1px solid #1F2937",borderRadius:8,lineHeight:1.5}}>{issue}</div>
              ))}
            </div>
            {!readiness.blockingIssues.length && <div style={{fontSize:12,color:"#34D399"}}>No blocking compliance issues right now.</div>}
          </Section>
          <Section label="REFERENCE SOURCES USED">
            {referenceSourcesUsed.length===0 ? (
              <div style={{fontSize:12,color:"#6B7280"}}>No portal/contact references logged for this property yet.</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {referenceSourcesUsed.map(item=>{
                  const quickItem = getQuickReferenceItem(item.label)
                  return (
                  <div key={item.label} style={{display:"flex",justifyContent:"space-between",gap:10,background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:"8px 10px"}}>
                    <span style={{fontSize:12,color:"#F9FAFB",fontWeight:600}}>{item.label}</span>
                    <span style={{fontSize:11,color:"#9CA3AF"}}>
                      {quickItem?.href ? <a href={quickItem.href} target="_blank" rel="noreferrer" style={{color:"#93C5FD"}}>{item.value}</a> : item.value}
                    </span>
                  </div>
                )})}
              </div>
            )}
          </Section>
          <Section label="JOB COMPLETION & INVOICE">
            <div style={{fontSize:12,color:"#9CA3AF",marginBottom:8}}>
              {readiness.readinessKey==="mobilize" ? "Property is cleared for mobilization." : readiness.readinessKey==="pm_review" ? "Checklist is ready for PM review." : "Complete the compliance checklist before mobilizing this job."}
            </div>
            <div style={{fontSize:12,color:prop.isCompleted?"#34D399":"#FBBF24",marginBottom:8}}>
              {prop.isCompleted ? `Completed ${fmt(prop.completedAt)} ${fmtT(prop.completedAt)}` : "Work not marked complete"}
            </div>
            {!prop.isCompleted && canEdit && (
              <button onClick={()=>onMarkComplete && onMarkComplete(prop.id)} style={{...btnGreen,marginBottom:8}}>
                Mark Job Complete
              </button>
            )}
            {prop.isCompleted && canEdit && (
              <button onClick={()=>onReopenJob && onReopenJob(prop.id)} style={{...btnGray,marginBottom:8}}>
                Reopen Job
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
      {ptab==="compliance"&&(
        <div ref={panelScrollRef} style={{padding:16,paddingBottom:110,overflowY:"auto",flex:1}}>
          {COMPLIANCE_GROUPS.map(group=>(
            <Section key={group.key} label={group.title}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginBottom:8}}>
                {group.fields.filter(field=>field.type==="text" || field.type==="date" || field.type==="datetime").map(field=>renderComplianceField(field))}
              </div>
              <div>
                {group.fields.filter(field=>field.type==="boolean").map(field=>renderComplianceField(field))}
              </div>
            </Section>
          ))}
          <Section label="REFERENCE SOURCES USED">
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {referenceSourcesUsed.length===0 ? (
                <div style={{fontSize:12,color:"#6B7280"}}>No source marked yet for this property.</div>
              ) : referenceSourcesUsed.map(item=>{
                const quickItem = getQuickReferenceItem(item.label)
                return (
                <div key={item.label} style={{display:"flex",justifyContent:"space-between",gap:10,background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:"8px 10px"}}>
                  <span style={{fontSize:12,color:"#F9FAFB",fontWeight:600}}>{item.label}</span>
                  <span style={{fontSize:11,color:"#9CA3AF"}}>
                    {quickItem?.href ? <a href={quickItem.href} target="_blank" rel="noreferrer" style={{color:"#93C5FD"}}>{item.value}</a> : item.value}
                  </span>
                </div>
              )})}
            </div>
          </Section>
          <Section label="COMPLIANCE NOTES">
            {!prop.notes && (
              <div style={{background:"#0C1117",border:"1px dashed #334155",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#94A3B8",lineHeight:1.5,marginBottom:10}}>
                Add a short project summary here for permit notes, utility confirmations, field observations, or anything the PM should see at a glance.
              </div>
            )}
            <textarea value={prop.notes||""} onChange={e=>update(prop.id,"notes",e.target.value)} placeholder="Summarize permit notes, utility calls, field verification, and next compliance actions..." rows={6} style={{...iStyle,resize:"vertical",lineHeight:1.5}} disabled={!canEdit}/>
          </Section>
          <Section label="KEY PORTALS & CONTACTS">
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {QUICK_REFERENCE_ITEMS.map(item=>(
                <div key={item.label} style={{display:"flex",justifyContent:"space-between",gap:10,background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:"8px 10px"}}>
                  <span style={{fontSize:12,color:"#F9FAFB",fontWeight:600}}>{item.label}</span>
                  <span style={{fontSize:11,color:"#9CA3AF",textAlign:"right"}}>
                    {item.href ? <a href={item.href} target="_blank" rel="noreferrer" style={{color:"#93C5FD"}}>{item.value}</a> : item.value}
                  </span>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:"#6B7280",marginTop:10,lineHeight:1.4}}>{QUICK_REFERENCE_FOOTER}</div>
          </Section>
        </div>
      )}
      {ptab==="documents"&&(
        <div ref={panelScrollRef} style={{flex:1,overflowY:"auto",padding:16,paddingBottom:110}}>
          <Section label="DOCUMENT RETENTION">
            <div style={{fontSize:12,color:"#9CA3AF",lineHeight:1.5,marginBottom:12}}>
              Upload and retain compliance support documents for this property. Checklist completion and retained records are tracked separately.
            </div>
            <div style={{fontSize:11,color:"#6B7280",lineHeight:1.5,marginBottom:12}}>
              File payloads are stored locally on this device for documents up to 10 MB each. If a file cannot be safely stored, the app will keep the document record and show a warning instead of pretending the download is available.
            </div>
            <input ref={docFileRef} type="file" multiple style={{display:"none"}} onChange={e=>{ if (!canEdit) return; onDocuments && onDocuments(prop.id, e.target.files, docCategory, docNotes); setDocNotes(""); if (docFileRef.current) docFileRef.current.value = "" }} />
            <div style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "repeat(2,minmax(0,1fr))",gap:10,marginBottom:12}}>
              <div>
                <Label>Document Category</Label>
                <select value={docCategory} onChange={e=>setDocCategory(e.target.value)} style={iStyle} disabled={!canEdit}>
                  {DOCUMENT_CATEGORIES.map(item=><option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <Label>Upload Notes</Label>
                <input value={docNotes} onChange={e=>setDocNotes(e.target.value)} placeholder="Optional document note" style={iStyle} disabled={!canEdit} />
              </div>
            </div>
            {canEdit ? (
              <button onClick={()=>docFileRef.current?.click()} style={{width:"100%",background:"#1F2937",border:"2px dashed #374151",borderRadius:8,padding:"16px",color:"#9CA3AF",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,letterSpacing:1,marginBottom:16}}>
                UPLOAD COMPLIANCE DOCUMENTS
              </button>
            ) : (
              <div style={{background:"#0C1117",border:"1px dashed #334155",borderRadius:8,padding:"14px 16px",fontSize:12,color:"#94A3B8",marginBottom:16}}>
                Uploaded documents can be reviewed here. New uploads are restricted for your role.
              </div>
            )}
          </Section>
          <Section label="REQUIRED DOCUMENT STATUS">
            {requiredDocuments.length===0 ? (
              <div style={{fontSize:12,color:"#6B7280"}}>No document requirements triggered yet for this property.</div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "repeat(3,minmax(0,1fr))",gap:8,marginBottom:10}}>
                <div style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:10}}>
                  <div style={{fontSize:11,color:"#6B7280"}}>Required Categories</div>
                  <div style={{fontSize:18,fontWeight:700,color:"#F9FAFB"}}>{requiredDocuments.length}</div>
                </div>
                <div style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:10}}>
                  <div style={{fontSize:11,color:"#6B7280"}}>Uploaded Required</div>
                  <div style={{fontSize:18,fontWeight:700,color:"#6EE7B7"}}>{uploadedRequiredDocuments.length}</div>
                </div>
                <div style={{background:"#0C1117",border:"1px solid #1F2937",borderRadius:8,padding:10}}>
                  <div style={{fontSize:11,color:"#6B7280"}}>Still Missing</div>
                  <div style={{fontSize:18,fontWeight:700,color:"#FCA5A5"}}>{readiness.missingDocuments.length}</div>
                </div>
              </div>
            )}
            {requiredDocuments.length>0 && (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {requiredDocuments.map(item=>{
                  const present = hasDocumentCategory(prop, item)
                  return (
                    <div key={item} style={{display:"flex",justifyContent:"space-between",gap:8,background:present?"#022C16":"#2D0A0A",border:`1px solid ${present?"#34D399":"#F87171"}`,borderRadius:8,padding:"8px 10px"}}>
                      <span style={{fontSize:12,color:"#F9FAFB",fontWeight:600}}>{item}</span>
                      <span style={{fontSize:11,color:present?"#6EE7B7":"#FCA5A5"}}>{present ? "On File" : "Missing"}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>
          <Section label="UPLOADED DOCUMENTS">
            {(!prop.documents || prop.documents.length===0) ? (
              <div style={emptyStateCardStyle}>No compliance documents have been uploaded for this property yet.</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {(prop.documents || []).map(doc=>{
                  const isEditingDoc = editingDocumentId === doc.id
                  const noteText = String(doc.notes || "").trim()
                  return (
                    <div
                      key={doc.id}
                      style={{
                        background:"#0F1722",
                        border:"1px solid #243246",
                        borderRadius:10,
                        padding:12,
                        boxSizing:"border-box",
                        overflow:"hidden"
                      }}
                    >
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap",marginBottom:10}}>
                        <div style={{flex:"1 1 240px",minWidth:0}}>
                          <div style={{fontSize:14,color:"#F9FAFB",fontWeight:700,lineHeight:1.4,overflowWrap:"anywhere"}}>{doc.name}</div>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
                            <span style={{background:"#182433",border:"1px solid #34475f",borderRadius:999,padding:"3px 8px",fontSize:11,color:"#DCE7F5",fontWeight:600}}>
                              {doc.category}
                            </span>
                            <span style={{background:"#111827",border:"1px solid #253449",borderRadius:999,padding:"3px 8px",fontSize:11,color:"#9CA3AF"}}>
                              Uploaded {fmt(doc.uploadedAt)} {fmtT(doc.uploadedAt)}
                            </span>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:isMobile?"flex-start":"flex-end",width:isMobile?"100%":"auto"}}>
                          {!!doc.data && (
                            <a
                              href={doc.data}
                              download={doc.name}
                              style={{...btnBlue,padding:"6px 10px",fontSize:11,textDecoration:"none"}}
                            >
                              Download
                            </a>
                          )}
                          {canEdit && !isEditingDoc && (
                            <button onClick={()=>beginDocumentEdit(doc)} style={{...btnGray,padding:"6px 10px",fontSize:11,color:"#DCE7F5",border:"1px solid #334155"}}>
                              Edit
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={()=>removeDocumentRecord(doc)}
                              style={{...btnDanger,padding:"6px 10px",fontSize:11}}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      {!doc.dataStored && (
                        <div style={{fontSize:11,color:"#FCA5A5",marginBottom:10,lineHeight:1.5,background:"#2D0A0A",border:"1px solid #7F1D1D",borderRadius:8,padding:"8px 10px",overflowWrap:"anywhere"}}>
                          {doc.persistenceWarning || "File payload is not stored locally. Re-upload required for download."}
                        </div>
                      )}

                      {isEditingDoc ? (
                        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,220px) 1fr",gap:10,alignItems:"start"}}>
                          <div style={{minWidth:0}}>
                            <Label>Category</Label>
                            <select
                              value={documentEditForm.category}
                              onChange={e=>setDocumentEditForm(form=>({ ...form, category:e.target.value }))}
                              style={iStyle}
                            >
                              {DOCUMENT_CATEGORIES.map(item=><option key={item} value={item}>{item}</option>)}
                            </select>
                          </div>
                          <div style={{minWidth:0}}>
                            <Label>Notes</Label>
                            <textarea
                              value={documentEditForm.notes}
                              onChange={e=>setDocumentEditForm(form=>({ ...form, notes:e.target.value }))}
                              placeholder="Add document notes"
                              rows={4}
                              style={{
                                ...iStyle,
                                minHeight:96,
                                resize:"vertical",
                                lineHeight:1.5,
                                whiteSpace:"pre-wrap",
                                overflowWrap:"anywhere",
                                wordBreak:"break-word",
                                boxSizing:"border-box"
                              }}
                            />
                          </div>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",gridColumn:isMobile?"auto":"1 / -1"}}>
                            <button onClick={()=>saveDocumentEdit(doc.id)} style={{...btnBlue,padding:"6px 12px",fontSize:11}}>
                              Save
                            </button>
                            <button onClick={cancelDocumentEdit} style={{...btnGray,padding:"6px 12px",fontSize:11}}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          <div style={{fontSize:10,color:"#6B7280",letterSpacing:1,textTransform:"uppercase",fontWeight:700}}>
                            Notes
                          </div>
                          <div
                            style={{
                              background:"#111827",
                              border:"1px solid #1F2937",
                              borderRadius:8,
                              padding:"10px 12px",
                              fontSize:12,
                              color:noteText ? "#D1D5DB" : "#6B7280",
                              lineHeight:1.6,
                              whiteSpace:"pre-wrap",
                              overflowWrap:"anywhere",
                              wordBreak:"break-word",
                              boxSizing:"border-box"
                            }}
                          >
                            {noteText || "No notes added for this document."}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
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
        <div ref={panelScrollRef} style={{padding:16,paddingBottom:110,overflowY:"auto",flex:1}}>
          <Section label="ASSIGNED CONTRACTORS">
            {vendors.length===0&&<div style={{color:"#4B5563",fontSize:13,padding:"8px 0"}}>No contractors yet.</div>}
            {vendors.map(v=>{ const assigned=(prop.assignedVendors||[]).includes(v.id); return(<label key={v.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #1F2937",cursor:"pointer"}}><input type="checkbox" checked={assigned} onChange={()=>toggleVendor(v.id)} style={{width:15,height:15,cursor:"pointer",accentColor:"#A78BFA"}} disabled={!canEdit}/><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#A78BFA",background:"#1E1040",padding:"2px 6px",borderRadius:3}}>{v.code}</span><span style={{fontSize:13,color:"#F9FAFB",fontWeight:600}}>{v.company}</span></div><div style={{fontSize:11,color:"#6B7280",marginTop:2}}>{v.trade} | {v.contact}</div></div>{assigned&&<span style={{color:"#A78BFA",fontSize:11,fontWeight:700}}>Assigned</span>}</label>) })}
          </Section>
          <Section label="ASSIGNED INSPECTORS">
            {inspectors.length===0&&<div style={{color:"#4B5563",fontSize:13,padding:"8px 0"}}>No inspectors yet.</div>}
            {inspectors.map(ins=>{ const assigned=(prop.assignedInspectors||[]).includes(ins.id); return(<label key={ins.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #1F2937",cursor:"pointer"}}><input type="checkbox" checked={assigned} onChange={()=>toggleInspector(ins.id)} style={{width:15,height:15,cursor:"pointer",accentColor:"#34D399"}} disabled={!canEdit}/><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:"#34D399",background:"#002D1A",padding:"2px 8px",borderRadius:3,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{ins.badge||ins.inspectorType?.slice(0,3).toUpperCase()}</span><span style={{fontSize:13,color:"#F9FAFB",fontWeight:600}}>{ins.name}</span></div><div style={{fontSize:11,color:"#6B7280",marginTop:2}}>{ins.inspectorType} | {ins.agency}</div></div>{assigned&&<span style={{color:"#34D399",fontSize:11,fontWeight:700}}>Assigned</span>}</label>) })}
          </Section>
        </div>
      )}
      {ptab==="photos"&&(
        <div ref={panelScrollRef} style={{flex:1,overflowY:"auto",padding:16,paddingBottom:110}}>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>{ if (!canEdit) return; onPhotos(prop.id,e.target.files) }}/>
          {canEdit ? (
            <button onClick={()=>fileRef.current?.click()} style={{width:"100%",background:"#1F2937",border:"2px dashed #374151",borderRadius:8,padding:"16px",color:"#9CA3AF",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,letterSpacing:1,marginBottom:16}}>Upload Site Photos</button>
          ) : (
            <div style={{background:"#0C1117",border:"1px dashed #334155",borderRadius:8,padding:"14px 16px",fontSize:12,color:"#94A3B8",marginBottom:16}}>
              Site photos can be reviewed here. Upload access is restricted for your role.
            </div>
          )}
          {(!prop.photos||prop.photos.length===0)&&<div style={emptyStateCardStyle}>No site photos have been added for this property yet.</div>}
          <div style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "repeat(2,minmax(0,1fr))",gap:12}}>
            {(prop.photos||[]).map(photo=>{
              const displayName = getPhotoDisplayName(photo)
              const isEditingPhoto = editingPhotoId === photo.id
              return (
                <div key={photo.id} style={{background:"#0F1722",borderRadius:10,overflow:"hidden",border:"1px solid #374151",boxShadow:"0 10px 24px rgba(2,8,20,0.28)"}}>
                  <button
                    onClick={()=>setPreviewPhotoId(photo.id)}
                    style={{display:"block",width:"100%",padding:0,border:"none",background:"#0B1118",cursor:"pointer"}}
                  >
                    {photo.data ? (
                      <img src={photo.data} alt={displayName} style={{width:"100%",height:isMobile ? 200 : 184,objectFit:"cover",display:"block"}}/>
                    ) : (
                      <div style={{height:isMobile ? 200 : 184,display:"flex",alignItems:"center",justifyContent:"center",color:"#6B7280",fontSize:12}}>
                        Preview unavailable
                      </div>
                    )}
                  </button>
                  <div style={{padding:12}}>
                    {isEditingPhoto ? (
                      <>
                        <Label>Photo Title</Label>
                        <input
                          value={photoDisplayName}
                          onChange={e=>setPhotoDisplayName(e.target.value)}
                          placeholder="Photo title"
                          style={{...iStyle,marginBottom:10}}
                        />
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          <button onClick={()=>savePhotoRename(photo.id)} style={{...btnBlue,padding:"6px 10px",fontSize:11}}>Save</button>
                          <button onClick={cancelPhotoRename} style={{...btnGray,padding:"6px 10px",fontSize:11}}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{fontSize:13,color:"#F9FAFB",fontWeight:700,lineHeight:1.4,marginBottom:6,overflowWrap:"anywhere"}}>{displayName}</div>
                        <div style={{fontSize:10,color:"#4B5563",fontFamily:"'IBM Plex Mono',monospace",marginBottom:10}}>
                          Uploaded {fmt(photo.date)} {fmtT(photo.date)}
                        </div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          <button onClick={()=>setPreviewPhotoId(photo.id)} style={{...btnBlue,padding:"6px 10px",fontSize:11}}>Preview</button>
                          {canEdit && (
                            <button onClick={()=>beginPhotoRename(photo)} style={{...btnGray,padding:"6px 10px",fontSize:11,border:"1px solid #334155",color:"#DCE7F5"}}>
                              Rename
                            </button>
                          )}
                          {canEdit && (
                            <button onClick={()=>removePhotoRecord(photo.id)} style={{...btnDanger,padding:"6px 10px",fontSize:11}}>
                              Delete
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {previewPhoto && (
            <>
              <div
                onClick={()=>setPreviewPhotoId("")}
                style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.74)",zIndex:360}}
              />
              <div
                style={{
                  ...getModalShellStyle(isMobile, 980),
                  inset:isMobile ? "6% 4%" : "8% 10%",
                  width:"auto",
                  top:"auto",
                  left:"auto",
                  transform:"none",
                  maxHeight:"none",
                  background:"#111827",
                  border:"1px solid #334155",
                  zIndex:370
                }}
              >
                <div style={{...modalHeaderStyle,padding:"12px 14px"}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#F9FAFB",overflowWrap:"anywhere"}}>{getPhotoDisplayName(previewPhoto)}</div>
                    <div style={{fontSize:11,color:"#6B7280",marginTop:4}}>Uploaded {fmt(previewPhoto.date)} {fmtT(previewPhoto.date)}</div>
                  </div>
                  <button onClick={()=>setPreviewPhotoId("")} style={{...btnGray,padding:"6px 10px",fontSize:11,flexShrink:0}}>Close</button>
                </div>
                <div style={{flex:1,background:"#0B1118",display:"flex",alignItems:"center",justifyContent:"center",padding:12,minHeight:0}}>
                  {previewPhoto.data ? (
                    <img src={previewPhoto.data} alt={getPhotoDisplayName(previewPhoto)} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",borderRadius:10}} />
                  ) : (
                    <div style={{fontSize:12,color:"#6B7280"}}>Preview unavailable</div>
                  )}
                </div>
              </div>
            </>
          )}
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
      createdAt:now(),
      ...HCG_COMPLIANCE_FIELDS
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
function VendorTab({vendors,setVendors,canAdd=true,canEdit=true,canDelete=true,onSaveVendor,onDeleteVendor}) {
  const { isPhone: isMobile } = viewportInfo()
  const blank={company:"",trade:CONTRACTOR_TRADES[0],contact:"",phone:"",email:"",license:"",notes:"",active:true}

  const [form,setForm]=useState(blank)
  const [editing,setEditing]=useState(null)
  const [search,setSearch]=useState("")
  const [filter,setFilter]=useState("All")
  const denyAccess = () => window.alert("You currently have view-only access. Ask management or the CEO to assign your role and permissions.")

  const save=async ()=>{
    if (!editing && !canAdd) { denyAccess(); return }
    if (editing && !canEdit) { denyAccess(); return }
    if(!form.company.trim()) return
    if(editing){
      if (onSaveVendor) {
        await onSaveVendor({ ...(vendors.find(v=>v.id===editing) || {}), ...form, id:editing })
      } else {
        setVendors(prev=>prev.map(v=>v.id!==editing?v:{...v,...form}))
      }
      setEditing(null)
    } else {
      const idx=vendors.length
      const code=genCode(form.company,form.trade,idx)
      if (onSaveVendor) {
        await onSaveVendor({id:uid(),code,...form,createdAt:now()})
      } else {
        setVendors(prev=>[...prev,{id:uid(),code,...form,createdAt:now()}])
      }
    }
    setForm(blank)
  }

  const del=async (id)=>{
    if (!canDelete) { denyAccess(); return }
    if(!window.confirm("Remove this contractor from the index?\n\nAssigned jobs will keep their saved vendor IDs until manually updated.")) return
    if (onDeleteVendor) {
      await onDeleteVendor(id)
    } else {
      setVendors(v=>v.filter(x=>x.id!==id))
    }
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

      {(canAdd || (editing && canEdit)) ? (
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
            gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr 1.5fr",
            gap:12,
            marginBottom:12
          }}>
            <div><Label>Contact</Label><input value={form.contact} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} style={iStyle}/></div>
            <div><Label>Phone</Label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={iStyle}/></div>
            <div><Label>Email</Label><input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={iStyle}/></div>
          </div>

          <div style={{marginBottom:14}}>
            <Label>Notes</Label>
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={4} style={{...iStyle,resize:"vertical",lineHeight:1.5}}/>
          </div>

          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button onClick={save} style={btnPurple}>{editing?"SAVE":"ADD CONTRACTOR"}</button>
            {editing&&<button onClick={()=>{setForm(blank);setEditing(null)}} style={btnGray}>CANCEL</button>}
          </div>
        </div>
      ) : (
        canEdit ? <div style={{...cardStyle,marginBottom:24,fontSize:12,color:"#94A3B8"}}>You can edit contractor records from the list below. Creating new contractors is restricted for your role.</div> : null
      )}

      {/* CARDS (NEW) */}
      <div style={{
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(320px,1fr))",
        gap:16
      }}>
        {filtered.length===0 && (
          <div style={{...emptyStateCardStyle,gridColumn:"1 / -1"}}>
            {vendors.length===0 ? "No contractors have been added yet." : "No contractors match the current filters."}
          </div>
        )}
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
                  {canEdit && <button onClick={()=>edit(v)} style={btnPurple}>Edit</button>}
                  {canDelete && <button onClick={()=>del(v.id)} style={btnGray}>Delete</button>}
                </div>
              </div>
            </div>

            <div style={{padding:12}}>
              {[["Code",v.code],["Contact",v.contact],["Phone",v.phone],["Email",v.email],["License",v.license],["Notes",v.notes]]
                .filter(([,val])=>val)
                .map(([label,val])=>(
                  <div key={label} style={{display:"flex",gap:10,padding:"4px 0"}}>
                    <span style={{minWidth:90,fontSize:11,color:"#6B7280"}}>{label}</span>
                    <span style={{fontSize:12,overflowWrap:"anywhere",wordBreak:"break-word"}}>{val}</span>
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
function InspectorTab({inspectors,setInspectors,canAdd=true,canEdit=true,canDelete=true,onSaveInspector,onDeleteInspector}) {
  const { isPhone: isMobile } = viewportInfo()

  const blank={name:"",inspectorType:INSPECTOR_TYPES[0],agency:"",badge:"",phone:"",email:"",availability:"",certifications:"",notes:"",active:true}

  const [form,setForm]=useState(blank)
  const [editing,setEditing]=useState(null)
  const [search,setSearch]=useState("")
  const denyAccess = () => window.alert("You currently have view-only access. Ask management or the CEO to assign your role and permissions.")

  const save=async ()=>{
    if (!editing && !canAdd) { denyAccess(); return }
    if (editing && !canEdit) { denyAccess(); return }
    if(!form.name.trim()) return
    if(editing){
      if (onSaveInspector) {
        await onSaveInspector({ ...(inspectors.find(ins=>ins.id===editing) || {}), ...form, id:editing })
      } else {
        setInspectors(prev=>prev.map(ins=>ins.id!==editing?ins:{...ins,...form}))
      }
      setEditing(null)
    } else {
      if (onSaveInspector) {
        await onSaveInspector({id:uid(),...form,createdAt:now()})
      } else {
        setInspectors(prev=>[...prev,{id:uid(),...form,createdAt:now()}])
      }
    }
    setForm(blank)
  }

  const del=async (id)=>{
    if (!canDelete) { denyAccess(); return }
    if(!window.confirm("Remove this inspector profile?")) return
    if (onDeleteInspector) {
      await onDeleteInspector(id)
    } else {
      setInspectors(v=>v.filter(x=>x.id!==id))
    }
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

      {(canAdd || (editing && canEdit)) ? (
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
              <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={4} style={{...iStyle,resize:"vertical",lineHeight:1.5}}/>
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
            <button onClick={save} style={btnGreen}>{editing?"SAVE":"ADD INSPECTOR"}</button>
            {editing&&<button onClick={()=>{setForm(blank);setEditing(null)}} style={btnGray}>CANCEL</button>}
          </div>
        </div>
      ) : (
        canEdit ? <div style={{...cardStyle,marginBottom:24,fontSize:12,color:"#94A3B8"}}>You can edit inspector profiles from the list below. Creating new inspectors is restricted for your role.</div> : null
      )}

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
                    {canEdit && <button onClick={()=>edit(ins)} style={btnGreen}>Edit</button>}
                    {canDelete && <button onClick={()=>del(ins.id)} style={btnGray}>Delete</button>}
                  </div>
                </div>
              </div>

              <div style={{padding:"12px 16px"}}>
                {[["Agency",ins.agency],["Badge #",ins.badge],["Phone",ins.phone],["Email",ins.email],["Availability",ins.availability],["Certifications",ins.certifications],["Notes",ins.notes]]
                  .filter(([,v])=>v)
                  .map(([label,val])=>(
                    <div key={label} style={{display:"flex",gap:10,padding:"5px 0"}}>
                      <span style={{minWidth:90,fontSize:11,color:"#6B7280"}}>{label}</span>
                      <span style={{fontSize:12,color:"#D1D5DB",overflowWrap:"anywhere",wordBreak:"break-word"}}>{val}</span>
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
function MileageTab({mileage,addMileage,setMileage,properties,clients,canAdd=true,canEdit=true,canDelete=true}) {
  const { isPhone: isMobile } = viewportInfo()
  const blankForm = {
    date:getTodayDateInput(),
    vehicle:"",
    driver:"",
    miles:"",
    from:"",
    to:"",
    purpose:"",
    propertyId:"",
    clientId:"",
    notes:""
  }
  const [form,setForm]=useState(blankForm)
  const [editingId,setEditingId]=useState("")
  const [editForm,setEditForm]=useState(blankForm)
  const [vehicleFilter,setVehicleFilter]=useState("")
  const [driverFilter,setDriverFilter]=useState("")
  const [sortDir,setSortDir]=useState("desc")
  const denyAccess = () => window.alert("You currently have view-only access. Ask management or the CEO to assign your role and permissions.")
  const mileageEntries = mileage.map(normalizeMileageEntry)
  const addresses=properties.map(p=>p.address)
  const propertyMap = Object.fromEntries(properties.map(p=>[p.id, p]))
  const clientMap = Object.fromEntries((clients || []).map(c=>[c.id, c]))
  const currentMonthKey = getTodayDateInput().slice(0, 7)
  useEffect(() => {
    if (!editingId) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [editingId])

  const submit=()=>{
    if (!canAdd) { denyAccess(); return }
    if(!form.date || !form.vehicle || !String(form.miles).trim()) return
    if (Number.isNaN(Number.parseFloat(form.miles))) return
    addMileage(form)
    setForm({ ...blankForm, date:getTodayDateInput() })
  }

  const openEdit = (entry) => {
    if (!canEdit) { denyAccess(); return }
    const normalized = normalizeMileageEntry(entry)
    setEditingId(normalized.id)
    setEditForm({
      date: normalized.date,
      vehicle: normalized.vehicle,
      driver: normalized.driver,
      miles: normalized.miles,
      from: normalized.from,
      to: normalized.to,
      purpose: normalized.purpose,
      propertyId: normalized.propertyId,
      clientId: normalized.clientId,
      notes: normalized.notes
    })
  }

  const closeEdit = () => {
    setEditingId("")
    setEditForm({ ...blankForm, date:getTodayDateInput() })
  }
  const removeMileageEntry = (entry) => {
    if (!canDelete) { denyAccess(); return }
    if (!window.confirm(`Delete this mileage entry for ${entry.vehicle || "the selected vehicle"} on ${displayDate(entry.date)}?`)) return
    setMileage(prev=>prev.filter(item=>normalizeMileageEntry(item).id!==entry.id))
  }

  const saveEdit = () => {
    if (!canEdit) { denyAccess(); return }
    if (!editingId) return
    if (!editForm.date || !editForm.vehicle || !String(editForm.miles).trim()) return
    if (Number.isNaN(Number.parseFloat(editForm.miles))) return
    setMileage(prev=>prev.map(entry=>{
      const normalized = normalizeMileageEntry(entry)
      if (normalized.id !== editingId) return normalized
      return normalizeMileageEntry({
        ...normalized,
        ...editForm,
        id: normalized.id,
        createdAt: normalized.createdAt || now()
      })
    }))
    closeEdit()
  }

  const renderMileageFields = (activeForm, setActiveForm) => (
    <>
      <input type="date" value={activeForm.date} onChange={e=>setActiveForm(f=>({...f,date:e.target.value}))} style={iStyle}/>
      <input value={activeForm.vehicle} onChange={e=>setActiveForm(f=>({...f,vehicle:e.target.value}))} placeholder="Vehicle" style={iStyle}/>
      <input value={activeForm.driver} onChange={e=>setActiveForm(f=>({...f,driver:e.target.value}))} placeholder="Driver" style={iStyle}/>
      <input type="number" value={activeForm.miles} onChange={e=>setActiveForm(f=>({...f,miles:e.target.value}))} placeholder="Miles" style={iStyle}/>
      <input value={activeForm.from} onChange={e=>setActiveForm(f=>({...f,from:e.target.value}))} list="prop-list" placeholder="From" style={iStyle}/>
      <input value={activeForm.to} onChange={e=>setActiveForm(f=>({...f,to:e.target.value}))} list="prop-list" placeholder="To" style={iStyle}/>
      <input value={activeForm.purpose} onChange={e=>setActiveForm(f=>({...f,purpose:e.target.value}))} placeholder="Purpose" style={iStyle}/>
      <select value={activeForm.propertyId} onChange={e=>setActiveForm(f=>({...f,propertyId:e.target.value}))} style={iStyle}>
        <option value="">Linked Property / Job</option>
        {properties.map(p=><option key={p.id} value={p.id}>{p.address}</option>)}
      </select>
      <select value={activeForm.clientId} onChange={e=>setActiveForm(f=>({...f,clientId:e.target.value}))} style={iStyle}>
        <option value="">Linked Client</option>
        {(clients || []).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <textarea
        value={activeForm.notes}
        onChange={e=>setActiveForm(f=>({...f,notes:e.target.value}))}
        rows={4}
        placeholder="Notes"
        style={{...iStyle,resize:"vertical",lineHeight:1.5,gridColumn:isMobile ? "auto" : "1 / -1"}}
      />
    </>
  )

  const total=mileageEntries.reduce((s,m)=>s+(parseFloat(m.miles)||0),0)
  const monthly=mileageEntries.filter(m=>String(m.date || "").startsWith(currentMonthKey))
    .reduce((s,m)=>s+(parseFloat(m.miles)||0),0)

  const vehicles=[...new Set(mileageEntries.map(m=>m.vehicle).filter(Boolean))]
  const drivers=[...new Set(mileageEntries.map(m=>m.driver).filter(Boolean))]

  const filtered=[...mileageEntries]
    .filter(m=>!vehicleFilter || m.vehicle===vehicleFilter)
    .filter(m=>!driverFilter || m.driver===driverFilter)
    .sort((a,b)=> sortDir==="desc"
      ? String(b.date).localeCompare(String(a.date))
      : String(a.date).localeCompare(String(b.date))
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

      {canAdd ? (
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
            {renderMileageFields(form, setForm)}
          </div>

          <datalist id="prop-list">{addresses.map(a=><option key={a} value={a}/>)}</datalist>

          <button onClick={submit} style={{...btnOrange,marginTop:14}}>LOG TRIP</button>
        </div>
      ) : (
        <div style={{...cardStyle,marginBottom:24,fontSize:12,color:"#94A3B8"}}>
          Trip history is available below. Creating new mileage entries is restricted for your role.
        </div>
      )}

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
        <div style={emptyStateCardStyle}>
          {mileageEntries.length===0 ? "No mileage entries have been logged yet." : "No mileage entries match the current filters."}
        </div>
      )}

      {/* CARDS */}
      <div style={{
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(320px,1fr))",
        gap:16
      }}>
        {filtered.map(m=>{
          const linkedProperty = propertyMap[m.propertyId]
          const linkedClient = clientMap[m.clientId]
          return (
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
                  <div style={{fontSize:11,color:"#9CA3AF"}}>{displayDate(m.date)}</div>
                </div>

                <div style={{display:"flex",gap:6,alignItems:"flex-start",flexWrap:"wrap"}}>
                  {canEdit && (
                    <button onClick={()=>openEdit(m)} style={{...btnBlue,padding:"4px 8px",fontSize:11}}>
                      Edit
                    </button>
                  )}
                  {canDelete && <button onClick={()=>removeMileageEntry(m)} style={{...btnDanger,padding:"4px 8px",fontSize:11}}>
                    Delete
                  </button>}
                </div>
              </div>
            </div>

            <div style={{padding:12}}>
              {[["Driver",m.driver],["From",m.from],["To",m.to],["Miles",parseFloat(m.miles||0).toFixed(1)],["Purpose",m.purpose],["Linked Job",linkedProperty?.address],["Linked Client",linkedClient ? [linkedClient.name, linkedClient.company].filter(Boolean).join(" | ") : ""]]
                .filter(([,v])=>v)
                .map(([l,v])=>(
                  <div key={l} style={{display:"flex",gap:10,padding:"4px 0"}}>
                    <span style={{minWidth:80,fontSize:11,color:"#6B7280"}}>{l}</span>
                    <span style={{fontSize:12}}>{v}</span>
                  </div>
                ))}
              {m.notes && (
                <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #1F2937"}}>
                  <div style={{fontSize:11,color:"#6B7280",marginBottom:4}}>Notes</div>
                  <div style={{fontSize:12,color:"#D1D5DB",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{m.notes}</div>
                </div>
              )}
            </div>
          </div>
        )})}
      </div>

      {editingId && (
        <>
          <div
            onClick={closeEdit}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.68)",zIndex:390}}
          />
          <div style={{...getModalShellStyle(isMobile, 760),maxHeight:"calc(100vh - 48px)"}}>
            <div style={modalHeaderStyle}>
              <div style={modalTitleStyle}>Edit Mileage Entry</div>
              <div style={modalSubtitleStyle}>
                Update trip details and save changes without creating a new entry.
              </div>
            </div>
            <div style={{padding:18,overflowY:"auto"}}>
              <div style={{display:"grid",gridTemplateColumns:isMobile ? "1fr" : "repeat(3,1fr)",gap:12}}>
                {renderMileageFields(editForm, setEditForm)}
              </div>
              <datalist id="prop-list">{addresses.map(a=><option key={a} value={a}/>)}</datalist>
              <div style={{display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap",marginTop:16}}>
                <button onClick={closeEdit} style={btnGray}>Cancel</button>
                <button onClick={saveEdit} style={btnGreen}>Save Changes</button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}

function QuickReferenceDrawer({ isMobile, onClose }) {
  return (
    <div
      className="slide-in"
      style={{
        position:"fixed",
        top:52,
        right:isMobile ? "5%" : 0,
        width:isMobile ? "90%" : 380,
        maxWidth:"100%",
        height:isMobile ? "auto" : "calc(100vh - 52px)",
        maxHeight:isMobile ? "80vh" : "100%",
        overflowY:"auto",
        background:"#111827",
        borderLeft:"2px solid #60A5FA",
        borderRadius:isMobile ? 10 : 0,
        zIndex:200,
        padding:20
      }}
    >
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:"#60A5FA",letterSpacing:2}}>
          KEY PORTALS & CONTACTS
        </div>
        <button onClick={onClose} style={{...btnGray,fontSize:11,padding:"4px 10px"}}>Close</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {QUICK_REFERENCE_ITEMS.map(item=>(
          <div key={item.label} style={{background:"#1F2937",border:"1px solid #374151",borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:12,color:"#F9FAFB",fontWeight:700}}>{item.label}</div>
            <div style={{fontSize:12,color:"#9CA3AF",marginTop:4}}>
              {item.href ? <a href={item.href} target="_blank" rel="noreferrer" style={{color:"#93C5FD"}}>{item.value}</a> : item.value}
            </div>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,color:"#6B7280",marginTop:16,lineHeight:1.5}}>
        {QUICK_REFERENCE_FOOTER}
      </div>
    </div>
  )
}


/* ---- Shared ---- */
function Section({label,children}){ return(<div style={{marginBottom:22}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:12,color:"#FB923C",letterSpacing:2,marginBottom:9,paddingBottom:5,borderBottom:"1px solid #243246"}}>{label}</div>{children}</div>) }
function Label({children,style}){ return <div style={{fontSize:11,color:"#90A0B8",marginBottom:5,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1.1,...style}}>{children}</div> }
const emptyStateCardStyle = {
  ...cardStyle,
  background:"#0F1722",
  border:"1px dashed #334155",
  color:"#94A3B8",
  textAlign:"center",
  padding:24
}
const mutedPanelStyle = {
  background:"#0C1117",
  border:"1px solid #1F2937",
  borderRadius:10,
  padding:"10px 12px"
}
const softInfoPanelStyle = {
  ...mutedPanelStyle,
  color:"#9CA3AF",
  lineHeight:1.5
}
const getModalShellStyle = (isMobile, width = 430) => ({
  position:"fixed",
  top:"50%",
  left:"50%",
  transform:"translate(-50%, -50%)",
  width:isMobile ? "calc(100% - 24px)" : width,
  maxWidth:"100%",
  maxHeight:"calc(100vh - 40px)",
  background:"#111A27",
  border:"1px solid #253449",
  borderRadius:14,
  boxShadow:"0 24px 52px rgba(0,0,0,0.48)",
  zIndex:400,
  overflow:"hidden",
  display:"flex",
  flexDirection:"column"
})
const modalHeaderStyle = {
  padding:"16px 18px",
  borderBottom:"1px solid #253449",
  background:"linear-gradient(90deg,#0F1B2D 0%,#111A27 100%)"
}
const modalTitleStyle = {
  fontFamily:"'Barlow Condensed',sans-serif",
  fontSize:24,
  fontWeight:900,
  color:"#F9FAFB",
  letterSpacing:0.8
}
const modalSubtitleStyle = {
  fontSize:12,
  color:"#90A0B8",
  marginTop:4,
  lineHeight:1.5
}
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
const btnDanger={...btnGray,border:"1px solid #7F1D1D",color:"#FCA5A5",background:"#1F1114"}
