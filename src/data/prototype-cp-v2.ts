export type ProjectStatus = "In flight" | "Pipeline" | "Complete" | "Idea";

export interface Person {
  name: string;
  initials: string;
  color: string;
  image?: string;
  photo?: "dark" | "light" | "portrait" | "blue" | "rose";
}

export interface CountSet {
  green: number;
  amber: number;
  red: number;
  grey: number;
}

export interface CpWorkstream {
  id: string;
  status: ProjectStatus;
  title: string;
  owner: Person;
  team: Person[];
  counts: CountSet;
  categories: number;
  serviceLines: string;
  initiatives: number;
  teamSize: number;
}

export interface CpProject {
  id: string;
  name: string;
  logo: "autoscout" | "efficio" | "roche" | "permira";
  clientType: string;
  sector: string;
  address: string;
  parent?: string;
  counts: CountSet;
  mainLeads: Person[];
  qualityLeads?: Person[];
  workstreams?: CpWorkstream[];
}

export interface CpInitiative {
  id: string;
  status: ProjectStatus;
  title: string;
  owner: Person;
}

export const people = {
  pm: { name: "Peter Mills", initials: "PM", color: "#003b40" },
  tm: { name: "Tara Malik", initials: "TM", color: "#003b40" },
  tn: { name: "Tina Noor", initials: "TN", color: "#003b40" },
  pn: { name: "Priya Nair", initials: "PN", color: "#003b40" },
  jw: { name: "James White", initials: "JW", color: "#d7def3", photo: "portrait" },
  an: { name: "Ana Novak", initials: "AN", color: "#f1d7d6", photo: "rose" },
  ew: { name: "Ella Wood", initials: "EW", color: "#d8f0fa", photo: "blue" },
  dw: { name: "Derek Wong", initials: "DW", color: "#003b40" },
};

export const projects: CpProject[] = [
  {
    id: "autoscout24",
    name: "AutoScout24",
    logo: "autoscout",
    clientType: "Private Equity",
    sector: "Telecoms, Media & Technology",
    address: "Bothestrasse 11-15, München, Germany",
    parent: "Hellman & Friedman LLC",
    counts: { green: 0, amber: 0, red: 0, grey: 6 },
    mainLeads: [people.jw],
  },
  {
    id: "efficio",
    name: "Efficio",
    logo: "efficio",
    clientType: "Private/Listed",
    sector: "Internal",
    address: "2 York Road, London, United Kingdom",
    counts: { green: 1, amber: 0, red: 1, grey: 14 },
    mainLeads: [people.jw, people.tn, people.pm, people.an],
    qualityLeads: [people.tn, people.jw, people.an],
    workstreams: [
      {
        id: "connected-platform",
        status: "In flight",
        title: "Connected Platform - Development Wo ...",
        owner: people.jw,
        team: [people.tn, people.an, people.pn],
        counts: { green: 1, amber: 0, red: 1, grey: 14 },
        categories: 5,
        serviceLines: "Sourcing ,Sustainable Procurement",
        initiatives: 16,
        teamSize: 12,
      },
    ],
  },
  {
    id: "roche",
    name: "F. Hoffmann-La Roche AG",
    logo: "roche",
    clientType: "Private/Listed",
    sector: "Healthcare & Pharmaceuticals",
    address: "Grenzacherstrasse 124, Basel, Switzerland",
    parent: "Roche (Parent account for Roche entities)",
    counts: { green: 2, amber: 0, red: 0, grey: 30 },
    mainLeads: [people.ew, people.jw, people.an],
    qualityLeads: [people.ew, people.jw, people.an],
  },
  {
    id: "permira",
    name: "McAfee",
    logo: "permira",
    clientType: "Private Equity",
    sector: "Telecoms, Media & Technology",
    address: "6220 America Center Drive, San Jose, United States",
    parent: "Permira",
    counts: { green: 0, amber: 0, red: 0, grey: 8 },
    mainLeads: [people.tm],
  },
];

export const initiatives: CpInitiative[] = [
  { id: "CP001-1014", status: "In flight", title: "sdasd", owner: people.pm },
  { id: "CP001-1011", status: "In flight", title: "CP - Sourcing - Cloud services", owner: people.jw },
  { id: "CP001-1009", status: "Pipeline", title: "DOWNLOAD REPORT TEST", owner: people.tm },
  { id: "CP001-1008", status: "Complete", title: "TEST CAT RESEARCH", owner: people.ew },
  { id: "CP001-1006", status: "Idea", title: "Sourcing initiative", owner: people.tm },
  { id: "CP001-1005", status: "Idea", title: "Research Pack Test", owner: people.tm },
  { id: "CP001-1004", status: "Idea", title: "Test default report", owner: people.tm },
];

export const workspaceSections = [
  "CategoryIQ",
  "RFP Builder",
  "RFP Analytics",
  "ClauseIQ",
  "Milestone Deliverables",
  "Guidance & Resources",
  "Task Manager",
];

export const insights = [
  { title: "Heavy Machinery ...", meta: "GPT | Step 1, 2" },
  { title: "test Diogo Insights ...", meta: "GPT | Step 1" },
  { title: "test Diogo Insights ...", meta: "GPT | Step 1, 2" },
];
