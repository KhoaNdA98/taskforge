/**
 * Centralized UI strings — all English.
 * Money values remain in VND (formatted via formatMoney).
 */

/* ── Nav ─────────────────────────────────────────────────────────────── */
export const NAV = {
  dashboard: "Dashboard",
  tasks: "Tasks",
  clients: "Clients",
  settings: "Settings",
  signOut: "Sign out",
} as const;

/* ── Task ─────────────────────────────────────────────────────────────── */
export const TASK = {
  title: "Tasks",
  subtitle: "Track work, log hours, and export reports.",
  addTask: "New task",
  editTask: "Edit task",
  saveTask: "Save",
  saving: "Saving…",
  deleteConfirm: (name: string) => `Delete task "${name}"?`,
  deleteConfirmDetail: "This action cannot be undone.",

  fields: {
    name: "Task name",
    namePlaceholder: "e.g. Fix login bug",
    type: "Type",
    date: "Date",
    client: "Client",
    status: "Status",
    hours: "Hours",
    hoursPlaceholder: "e.g. 2.5",
    hoursHint: "Amount = hours × rate (snapshot taken at creation).",
    note: "Note",
    unassigned: "(no client)",
  },

  type: {
    maintain: "Maintain",
    on_demand: "On-demand",
  },

  status: {
    todo: "To do",
    doing: "In progress",
    done: "Done",
  },

  empty: {
    title: "No tasks found",
    description: (month: string) =>
      `No tasks match the current filters for ${month}. Add a new task or change the filters.`,
  },

  summary: (count: number, hours: number, amount: string) =>
    `${count} task${count !== 1 ? "s" : ""} · ${hours}h on-demand · ${amount}`,
} as const;

/* ── Filters ─────────────────────────────────────────────────────────── */
export const FILTER = {
  month: "Month",
  type: "Type",
  client: "Client",
  status: "Status",
  search: "Search",
  searchPlaceholder: "Task name…",
  all: "All",
  none: "(unassigned)",
  clearAll: "Clear filters",
  groupBy: "Group by",
  groupByNone: "None",
  groupByStatus: "Status",
  groupByClient: "Client",
  groupByType: "Type",
} as const;

/* ── Client ──────────────────────────────────────────────────────────── */
export const CLIENT = {
  title: "Clients",
  subtitle: "Manage clients and monthly retainer fees.",
  addClient: "New client",
  editClient: "Edit client",
  save: "Save",
  saving: "Saving…",
  deleteConfirm: (name: string) => `Delete client "${name}"? Tasks will be unlinked.`,

  fields: {
    name: "Client name",
    retainer: "Monthly retainer",
    retainerHint: "Fixed monthly fee (retainer). Set to 0 if no maintain contract.",
    maintainActive: "Maintain active",
    maintainActiveHint: "When enabled, the retainer is counted in monthly revenue.",
    note: "Note",
  },

  noRetainer: "No maintain",
  maintainActive: "Maintain active",
  retainerLabel: "retainer",
  perMonth: "/mo",

  empty: {
    title: "No clients yet",
    description: "Add a client to assign tasks and set monthly retainer fees.",
  },
} as const;

/* ── Settings ────────────────────────────────────────────────────────── */
export const SETTINGS = {
  title: "Settings",
  subtitle: "Default hourly rate and currency for on-demand billing.",
  save: "Save settings",
  saving: "Saving…",
  saved: "Saved",

  fields: {
    rate: "Hourly rate",
    rateHint:
      "Applied to new on-demand tasks. Changing the rate does not affect previously created tasks.",
    currency: "Currency",
  },

  currencies: {
    VND: "VND — Vietnamese Dong",
    USD: "USD — US Dollar",
  },
} as const;

/* ── Dashboard ───────────────────────────────────────────────────────── */
export const DASHBOARD = {
  title: "Dashboard",
  subtitle: (month: string, rate: string) =>
    `Overview for ${month} · rate ${rate}/h`,

  stats: {
    onDemandHours: "On-demand hours",
    onDemandRevenue: "On-demand revenue",
    retainer: "Retainer (maintain)",
    total: "Total revenue",
  },

  recentTasks: "Recent tasks",
  viewAll: "View all",
  revenueByClient: "On-demand revenue by client",
  noRevenue: "No on-demand revenue yet",
  noTasks: "No tasks this month",
  noTasksDetail: "Add tasks on the Tasks page to start tracking.",
  taskCount: (n: number) => `${n} task${n !== 1 ? "s" : ""}`,
  doneCount: (n: number) => `${n} done`,
} as const;

/* ── Auth ────────────────────────────────────────────────────────────── */
export const AUTH = {
  brand: "TaskForge",
  tagline: "task & billing tracker for freelancers",
  signIn: "Sign in",
  signUp: "Sign up",
  signingIn: "Signing in…",
  signingUp: "Creating account…",
  switchToSignUp: "Don't have an account? Sign up",
  switchToSignIn: "Already have an account? Sign in",
  email: "Email",
  emailPlaceholder: "you@email.com",
  password: "Password",
  errors: {
    missingFields: "Enter your email and password.",
    weakPassword: "Password must be at least 6 characters.",
    invalidCredentials: "Invalid email or password.",
  },
  signUpSuccess:
    "Account created. Check your email to confirm, then sign in.",
} as const;

/* ── General ─────────────────────────────────────────────────────────── */
export const UI = {
  export: "Export Excel",
  delete: "Delete",
  edit: "Edit",
  cancel: "Cancel",
  confirm: "Confirm",
  close: "Close",
  console: "console",
  version: "v1.0",
} as const;
