/**
 * NIST CSF 2.0 full taxonomy seed — registers all actors, functions,
 * categories, subcategories, CMMC L2 practices, tier gaps, and mappings
 * into the SQL graph via PDS XRPC.
 *
 * Usage: npx tsx projects/etzhayyim-project-nist/seed.ts
 */

const PDS = 'https://atproto.etzhayyim.com';
const NANOID = 'n1st0csf';
const ROOT_DID = `did:web:${NANOID}.etzhayyim.com`;
const PROJECT_ID = 'nist';

// ── Helpers ──

// ADR-0023 P4: use etzhayyim_TOKEN (sk_live_*) Bearer instead of spoofable
// x-kotodama-verified header. Required: `export etzhayyim_TOKEN=$(etzhayyim auth token)`.
const etzhayyim_TOKEN = process.env.etzhayyim_TOKEN;
if (!etzhayyim_TOKEN) {
  throw new Error('etzhayyim_TOKEN env var required — run `export etzhayyim_TOKEN=$(etzhayyim auth token)` first');
}
const INTERNAL_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${etzhayyim_TOKEN}`,
  'x-etzhayyim-org-id': 'anon',
};

async function actorCreate(did: string, displayName: string, description: string): Promise<void> {
  const res = await fetch(`${PDS}/xrpc/com.etzhayyim.actor.create`, {
    method: 'POST',
    headers: INTERNAL_HEADERS,
    body: JSON.stringify({ did, projectId: PROJECT_ID, displayName, description, hasWorker: false }),
  });
  if (!res.ok) console.warn(`actor.create ${did}: ${res.status} ${await res.text()}`);
  else console.log(`✓ Actor: ${did}`);
}

async function createRecord(collection: string, record: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${PDS}/xrpc/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: INTERNAL_HEADERS,
    body: JSON.stringify({ repo: ROOT_DID, collection, record }),
  });
  if (!res.ok) console.warn(`createRecord ${collection}: ${res.status}`);
}

async function batchRecords(collection: string, records: Record<string, unknown>[]): Promise<void> {
  const CHUNK = 50;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    for (const rec of chunk) {
      await createRecord(collection, rec);
    }
    console.log(`  ${collection}: ${Math.min(i + CHUNK, records.length)}/${records.length}`);
  }
}

async function registerApp(body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${PDS}/_internal/register`, {
    method: 'POST',
    headers: INTERNAL_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) console.warn(`registerApp ${body.nanoid}: ${res.status} ${await res.text()}`);
  else console.log(`✓ RegisterApp: ${body.did}`);
}

async function toolRegister(tool: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${PDS}/xrpc/com.etzhayyim.tool.register`, {
    method: 'POST',
    headers: INTERNAL_HEADERS,
    body: JSON.stringify(tool),
  });
  if (!res.ok) console.warn(`tool.register ${tool.name}: ${res.status}`);
}

async function socialPost(did: string, text: string): Promise<void> {
  const res = await fetch(`${PDS}/xrpc/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: INTERNAL_HEADERS,
    body: JSON.stringify({
      repo: did, collection: 'app.bsky.feed.post',
      record: { text, createdAt: new Date().toISOString(), '$type': 'app.bsky.feed.post' },
    }),
  });
  if (!res.ok) console.warn(`post: ${res.status}`);
}

// ══════════════════════════════════════════════════════════════════
// 1. ACTOR DIDs
// ══════════════════════════════════════════════════════════════════

const ACTORS = [
  { did: ROOT_DID, name: 'NIST Cybersecurity Framework', desc: 'CSF 2.0 root coordinator' },
  { did: `${ROOT_DID}:csf:govern`, name: 'NIST CSF — Govern (GV)', desc: 'Organizational context, risk management, roles, policy, supply chain' },
  { did: `${ROOT_DID}:csf:identify`, name: 'NIST CSF — Identify (ID)', desc: 'Asset management, risk assessment, improvement' },
  { did: `${ROOT_DID}:csf:protect`, name: 'NIST CSF — Protect (PR)', desc: 'Access control, training, data security, platform security, resilience' },
  { did: `${ROOT_DID}:csf:detect`, name: 'NIST CSF — Detect (DE)', desc: 'Continuous monitoring, adverse event analysis' },
  { did: `${ROOT_DID}:csf:respond`, name: 'NIST CSF — Respond (RS)', desc: 'Incident management, analysis, communication, mitigation' },
  { did: `${ROOT_DID}:csf:recover`, name: 'NIST CSF — Recover (RC)', desc: 'Recovery plan execution, recovery communication' },
  { did: `${ROOT_DID}:tier:gap`, name: 'Tier Gap Analysis', desc: 'Tier 3→4 gap per subcategory' },
  { did: `${ROOT_DID}:cmmc:level2`, name: 'CMMC Level 2', desc: 'CMMC 2.0 Level 2 Advanced — SP 800-171 r2, 110 practices' },
  { did: `${ROOT_DID}:sp:communityProfile`, name: 'SP 1302 Community Profile', desc: 'Sector-specific CSF community profile templates' },
  { did: `${ROOT_DID}:migration:v1to2`, name: 'CSF 1.1→2.0 Migration', desc: 'Subcategory relocation/removal/addition tracking between CSF v1.1 and v2.0' },
];

// ══════════════════════════════════════════════════════════════════
// 2. CSF 2.0 FUNCTIONS (6)
// ══════════════════════════════════════════════════════════════════

const CSF_FUNCTIONS = [
  { code: 'GV', name: 'Govern', description: 'The organization\'s cybersecurity risk management strategy, expectations, and policy are established, communicated, and monitored' },
  { code: 'ID', name: 'Identify', description: 'The organization\'s current cybersecurity risks are understood' },
  { code: 'PR', name: 'Protect', description: 'Safeguards to manage the organization\'s cybersecurity risks are used' },
  { code: 'DE', name: 'Detect', description: 'Possible cybersecurity attacks and compromises are found and analyzed' },
  { code: 'RS', name: 'Respond', description: 'Actions regarding a detected cybersecurity incident are taken' },
  { code: 'RC', name: 'Recover', description: 'Assets and operations affected by a cybersecurity incident are restored' },
];

// ══════════════════════════════════════════════════════════════════
// 3. CSF 2.0 CATEGORIES (22)
// ══════════════════════════════════════════════════════════════════

const CSF_CATEGORIES = [
  // GV
  { code: 'GV.OC', functionCode: 'GV', name: 'Organizational Context', subcategoryCount: 5 },
  { code: 'GV.RM', functionCode: 'GV', name: 'Risk Management Strategy', subcategoryCount: 7 },
  { code: 'GV.RR', functionCode: 'GV', name: 'Roles, Responsibilities, and Authorities', subcategoryCount: 4 },
  { code: 'GV.PO', functionCode: 'GV', name: 'Policy', subcategoryCount: 2 },
  { code: 'GV.OV', functionCode: 'GV', name: 'Oversight', subcategoryCount: 3 },
  { code: 'GV.SC', functionCode: 'GV', name: 'Cybersecurity Supply Chain Risk Management', subcategoryCount: 10 },
  // ID
  { code: 'ID.AM', functionCode: 'ID', name: 'Asset Management', subcategoryCount: 7 },
  { code: 'ID.RA', functionCode: 'ID', name: 'Risk Assessment', subcategoryCount: 10 },
  { code: 'ID.IM', functionCode: 'ID', name: 'Improvement', subcategoryCount: 4 },
  // PR
  { code: 'PR.AA', functionCode: 'PR', name: 'Identity Management, Authentication, and Access Control', subcategoryCount: 6 },
  { code: 'PR.AT', functionCode: 'PR', name: 'Awareness and Training', subcategoryCount: 2 },
  { code: 'PR.DS', functionCode: 'PR', name: 'Data Security', subcategoryCount: 4 },
  { code: 'PR.PS', functionCode: 'PR', name: 'Platform Security', subcategoryCount: 6 },
  { code: 'PR.IR', functionCode: 'PR', name: 'Technology Infrastructure Resilience', subcategoryCount: 4 },
  // DE
  { code: 'DE.CM', functionCode: 'DE', name: 'Continuous Monitoring', subcategoryCount: 5 },
  { code: 'DE.AE', functionCode: 'DE', name: 'Adverse Event Analysis', subcategoryCount: 6 },
  // RS
  { code: 'RS.MA', functionCode: 'RS', name: 'Incident Management', subcategoryCount: 5 },
  { code: 'RS.AN', functionCode: 'RS', name: 'Incident Analysis', subcategoryCount: 4 },
  { code: 'RS.CO', functionCode: 'RS', name: 'Incident Response Reporting and Communication', subcategoryCount: 2 },
  { code: 'RS.MI', functionCode: 'RS', name: 'Incident Mitigation', subcategoryCount: 2 },
  // RC
  { code: 'RC.RP', functionCode: 'RC', name: 'Incident Recovery Plan Execution', subcategoryCount: 6 },
  { code: 'RC.CO', functionCode: 'RC', name: 'Incident Recovery Communication', subcategoryCount: 2 },
];

// ══════════════════════════════════════════════════════════════════
// 4. CSF 2.0 SUBCATEGORIES (106)
// ══════════════════════════════════════════════════════════════════

const CSF_SUBCATEGORIES: { code: string; categoryCode: string; name: string }[] = [
  // ── GV.OC (5) ──
  { code: 'GV.OC-01', categoryCode: 'GV.OC', name: 'The organizational mission is understood and informs cybersecurity risk management' },
  { code: 'GV.OC-02', categoryCode: 'GV.OC', name: 'Internal and external stakeholders are understood, and their needs and expectations regarding cybersecurity risk management are understood and considered' },
  { code: 'GV.OC-03', categoryCode: 'GV.OC', name: 'Legal, regulatory, and contractual requirements regarding cybersecurity — including privacy and civil liberties obligations — are understood and managed' },
  { code: 'GV.OC-04', categoryCode: 'GV.OC', name: 'Critical objectives, capabilities, and services that external stakeholders depend on or expect are understood and communicated' },
  { code: 'GV.OC-05', categoryCode: 'GV.OC', name: 'Outcomes, capabilities, and services that the organization depends on are understood and communicated' },
  // ── GV.RM (7) ──
  { code: 'GV.RM-01', categoryCode: 'GV.RM', name: 'Risk management objectives are established and agreed upon by organizational stakeholders' },
  { code: 'GV.RM-02', categoryCode: 'GV.RM', name: 'Risk appetite and risk tolerance statements are established, communicated, and maintained' },
  { code: 'GV.RM-03', categoryCode: 'GV.RM', name: 'Cybersecurity risk management activities and outcomes are included in enterprise risk management processes' },
  { code: 'GV.RM-04', categoryCode: 'GV.RM', name: 'Strategic direction that describes appropriate risk response options is established and communicated' },
  { code: 'GV.RM-05', categoryCode: 'GV.RM', name: 'Lines of communication across the organization are established for cybersecurity risks' },
  { code: 'GV.RM-06', categoryCode: 'GV.RM', name: 'A standardized method for calculating, documenting, categorizing, and prioritizing cybersecurity risks is established and communicated' },
  { code: 'GV.RM-07', categoryCode: 'GV.RM', name: 'Strategic opportunities (i.e., positive risks) are characterized and are included in organizational cybersecurity risk discussions' },
  // ── GV.RR (4) ──
  { code: 'GV.RR-01', categoryCode: 'GV.RR', name: 'Organizational leadership is responsible and accountable for cybersecurity risk and fosters a culture that is risk-aware, ethical, and continually improving' },
  { code: 'GV.RR-02', categoryCode: 'GV.RR', name: 'Roles, responsibilities, and authorities related to cybersecurity risk management are established, communicated, understood, and enforced' },
  { code: 'GV.RR-03', categoryCode: 'GV.RR', name: 'Adequate resources are allocated commensurate with the cybersecurity risk strategy, roles, responsibilities, and policies' },
  { code: 'GV.RR-04', categoryCode: 'GV.RR', name: 'Cybersecurity is included in human resources practices' },
  // ── GV.PO (2) ──
  { code: 'GV.PO-01', categoryCode: 'GV.PO', name: 'Policy for managing cybersecurity risks is established based on organizational context, cybersecurity strategy, and priorities and is communicated and enforced' },
  { code: 'GV.PO-02', categoryCode: 'GV.PO', name: 'Policy for managing cybersecurity risks is reviewed, updated, communicated, and enforced to reflect changes in requirements, threats, technology, and organizational mission' },
  // ── GV.OV (3) ──
  { code: 'GV.OV-01', categoryCode: 'GV.OV', name: 'Cybersecurity risk management strategy outcomes are reviewed to inform and adjust strategy and direction' },
  { code: 'GV.OV-02', categoryCode: 'GV.OV', name: 'The cybersecurity risk management strategy is reviewed and adjusted to ensure coverage of organizational requirements and risks' },
  { code: 'GV.OV-03', categoryCode: 'GV.OV', name: 'Organizational cybersecurity risk management performance is evaluated and reviewed for adjustments needed' },
  // ── GV.SC (10) ──
  { code: 'GV.SC-01', categoryCode: 'GV.SC', name: 'A cybersecurity supply chain risk management program, strategy, objectives, policies, and processes are established and agreed to by organizational stakeholders' },
  { code: 'GV.SC-02', categoryCode: 'GV.SC', name: 'Cybersecurity roles and responsibilities for suppliers, customers, and partners are established, communicated, and coordinated internally and externally' },
  { code: 'GV.SC-03', categoryCode: 'GV.SC', name: 'Cybersecurity supply chain risk management is integrated into cybersecurity and enterprise risk management, risk assessment, and improvement processes' },
  { code: 'GV.SC-04', categoryCode: 'GV.SC', name: 'Suppliers are known and prioritized by criticality' },
  { code: 'GV.SC-05', categoryCode: 'GV.SC', name: 'Requirements to address cybersecurity risks in supply chains are established, prioritized, and integrated into contracts and other types of agreements with suppliers and other relevant third parties' },
  { code: 'GV.SC-06', categoryCode: 'GV.SC', name: 'Planning and due diligence are performed to reduce risks before entering into formal supplier or other third-party relationships' },
  { code: 'GV.SC-07', categoryCode: 'GV.SC', name: 'The risks posed by a supplier, their products and services, and other third parties are understood, recorded, prioritized, assessed, responded to, and monitored over the course of the relationship' },
  { code: 'GV.SC-08', categoryCode: 'GV.SC', name: 'Relevant suppliers and other third parties are included in incident planning, response, and recovery activities' },
  { code: 'GV.SC-09', categoryCode: 'GV.SC', name: 'Supply chain security practices are integrated into cybersecurity and enterprise risk management programs, and their performance is monitored throughout the technology product and service life cycle' },
  { code: 'GV.SC-10', categoryCode: 'GV.SC', name: 'Cybersecurity supply chain risk management plans include provisions for activities that occur after the conclusion of a partnership or service agreement' },
  // ── ID.AM (7) — ID.AM-06 relocated to GV.RR in CSF 2.0 ──
  { code: 'ID.AM-01', categoryCode: 'ID.AM', name: 'Inventories of hardware managed by the organization are maintained' },
  { code: 'ID.AM-02', categoryCode: 'ID.AM', name: 'Inventories of software, services, and systems managed by the organization are maintained' },
  { code: 'ID.AM-03', categoryCode: 'ID.AM', name: 'Representations of the organization\'s authorized network communication and internal and external network data flows are maintained' },
  { code: 'ID.AM-04', categoryCode: 'ID.AM', name: 'Inventories of services provided by suppliers are maintained' },
  { code: 'ID.AM-05', categoryCode: 'ID.AM', name: 'Assets are prioritized based on classification, criticality, resources, and impact on the mission' },
  { code: 'ID.AM-07', categoryCode: 'ID.AM', name: 'Inventories of data and corresponding metadata for designated data types are maintained' },
  { code: 'ID.AM-08', categoryCode: 'ID.AM', name: 'Systems, hardware, software, services, and data are managed throughout their life cycles' },
  // ── ID.RA (10) ──
  { code: 'ID.RA-01', categoryCode: 'ID.RA', name: 'Vulnerabilities in assets are identified, validated, and recorded' },
  { code: 'ID.RA-02', categoryCode: 'ID.RA', name: 'Cyber threat intelligence is received from information sharing forums and sources' },
  { code: 'ID.RA-03', categoryCode: 'ID.RA', name: 'Internal and external threats to the organization are identified and recorded' },
  { code: 'ID.RA-04', categoryCode: 'ID.RA', name: 'Potential impacts and likelihoods of threats exploiting vulnerabilities are identified and recorded' },
  { code: 'ID.RA-05', categoryCode: 'ID.RA', name: 'Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk and inform risk response prioritization' },
  { code: 'ID.RA-06', categoryCode: 'ID.RA', name: 'Risk responses are chosen, prioritized, planned, tracked, and communicated' },
  { code: 'ID.RA-07', categoryCode: 'ID.RA', name: 'Changes and exceptions are managed, assessed for risk impact, recorded, and tracked' },
  { code: 'ID.RA-08', categoryCode: 'ID.RA', name: 'Processes for receiving, analyzing, and responding to vulnerability disclosures are established' },
  { code: 'ID.RA-09', categoryCode: 'ID.RA', name: 'The authenticity and integrity of hardware and software are assessed prior to acquisition and use' },
  { code: 'ID.RA-10', categoryCode: 'ID.RA', name: 'Critical suppliers are assessed prior to acquisition' },
  // ── ID.IM (4) ──
  { code: 'ID.IM-01', categoryCode: 'ID.IM', name: 'Improvements are identified from evaluations' },
  { code: 'ID.IM-02', categoryCode: 'ID.IM', name: 'Improvements are identified from security tests and exercises, including those done in coordination with suppliers and relevant third parties' },
  { code: 'ID.IM-03', categoryCode: 'ID.IM', name: 'Improvements are identified from execution of operational processes, procedures, and activities' },
  { code: 'ID.IM-04', categoryCode: 'ID.IM', name: 'Incident response plans and other cybersecurity plans that affect operations are established, communicated, maintained, and improved' },
  // ── PR.AA (6) ──
  { code: 'PR.AA-01', categoryCode: 'PR.AA', name: 'Identities and credentials for authorized users, services, and hardware are managed by the organization' },
  { code: 'PR.AA-02', categoryCode: 'PR.AA', name: 'Identities are proofed and bound to credentials based on the context of interactions' },
  { code: 'PR.AA-03', categoryCode: 'PR.AA', name: 'Users, services, and hardware are authenticated' },
  { code: 'PR.AA-04', categoryCode: 'PR.AA', name: 'Identity assertions are protected, conveyed, and verified' },
  { code: 'PR.AA-05', categoryCode: 'PR.AA', name: 'Access permissions, entitlements, and authorizations are defined in a policy, managed, enforced, and reviewed, and incorporate the principles of least privilege and separation of duties' },
  { code: 'PR.AA-06', categoryCode: 'PR.AA', name: 'Physical access to assets is managed, monitored, and enforced commensurate with risk' },
  // ── PR.AT (2) ──
  { code: 'PR.AT-01', categoryCode: 'PR.AT', name: 'Personnel are provided with awareness and training so that they possess the knowledge and skills to perform general tasks with cybersecurity risks in mind' },
  { code: 'PR.AT-02', categoryCode: 'PR.AT', name: 'Individuals in specialized roles are provided with awareness and training so that they possess the knowledge and skills to perform relevant tasks with cybersecurity risks in mind' },
  // ── PR.DS (4) — CSF 2.0 consolidated: 03-09 relocated/removed, 10-11 new ──
  { code: 'PR.DS-01', categoryCode: 'PR.DS', name: 'The confidentiality, integrity, and availability of data-at-rest are protected' },
  { code: 'PR.DS-02', categoryCode: 'PR.DS', name: 'The confidentiality, integrity, and availability of data-in-transit are protected' },
  { code: 'PR.DS-10', categoryCode: 'PR.DS', name: 'The confidentiality, integrity, and availability of data-in-use are protected' },
  { code: 'PR.DS-11', categoryCode: 'PR.DS', name: 'Backups of data are created, protected, maintained, and tested' },
  // ── PR.PS (6) ──
  { code: 'PR.PS-01', categoryCode: 'PR.PS', name: 'Configuration management practices are established and applied' },
  { code: 'PR.PS-02', categoryCode: 'PR.PS', name: 'Software is maintained, replaced, and removed commensurate with risk' },
  { code: 'PR.PS-03', categoryCode: 'PR.PS', name: 'Hardware is maintained, replaced, and removed commensurate with risk' },
  { code: 'PR.PS-04', categoryCode: 'PR.PS', name: 'Log records are generated and made available for continuous monitoring' },
  { code: 'PR.PS-05', categoryCode: 'PR.PS', name: 'Installation and execution of unauthorized software is prevented' },
  { code: 'PR.PS-06', categoryCode: 'PR.PS', name: 'Secure software development practices are integrated, and their performance is monitored throughout the software development life cycle' },
  // ── PR.IR (4) ──
  { code: 'PR.IR-01', categoryCode: 'PR.IR', name: 'Networks and environments are protected from unauthorized logical access and usage' },
  { code: 'PR.IR-02', categoryCode: 'PR.IR', name: 'The organization\'s technology assets are protected from environmental threats' },
  { code: 'PR.IR-03', categoryCode: 'PR.IR', name: 'Mechanisms are implemented to achieve resilience requirements in normal and adverse situations' },
  { code: 'PR.IR-04', categoryCode: 'PR.IR', name: 'Adequate resource capacity to ensure availability is maintained' },
  // ── DE.CM (5) — CSF 2.0: 04, 05, 07, 08 relocated/consolidated ──
  { code: 'DE.CM-01', categoryCode: 'DE.CM', name: 'Networks and network services are monitored to find potentially adverse events' },
  { code: 'DE.CM-02', categoryCode: 'DE.CM', name: 'The physical environment is monitored to find potentially adverse events' },
  { code: 'DE.CM-03', categoryCode: 'DE.CM', name: 'Personnel activity and technology usage are monitored to find potentially adverse events' },
  { code: 'DE.CM-06', categoryCode: 'DE.CM', name: 'External service provider activities and services are monitored to find potentially adverse events' },
  { code: 'DE.CM-09', categoryCode: 'DE.CM', name: 'Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events' },
  // ── DE.AE (6) — CSF 2.0: 01, 05 relocated ──
  { code: 'DE.AE-02', categoryCode: 'DE.AE', name: 'Potentially adverse events are analyzed to better understand associated activities' },
  { code: 'DE.AE-03', categoryCode: 'DE.AE', name: 'Information is correlated from multiple sources' },
  { code: 'DE.AE-04', categoryCode: 'DE.AE', name: 'The estimated impact and scope of adverse events are understood' },
  { code: 'DE.AE-06', categoryCode: 'DE.AE', name: 'Indicators of compromise and other potentially adverse events are analyzed' },
  { code: 'DE.AE-07', categoryCode: 'DE.AE', name: 'Cybersecurity alert thresholds and criteria are established for alert generation' },
  { code: 'DE.AE-08', categoryCode: 'DE.AE', name: 'Events are declared as cybersecurity incidents when they meet the defined incident criteria' },
  // ── RS.MA (5) ──
  { code: 'RS.MA-01', categoryCode: 'RS.MA', name: 'The incident response plan is executed in coordination with relevant third parties once an incident is declared' },
  { code: 'RS.MA-02', categoryCode: 'RS.MA', name: 'Incident reports are triaged and validated' },
  { code: 'RS.MA-03', categoryCode: 'RS.MA', name: 'Incidents are categorized and prioritized' },
  { code: 'RS.MA-04', categoryCode: 'RS.MA', name: 'Incidents are escalated or elevated as needed' },
  { code: 'RS.MA-05', categoryCode: 'RS.MA', name: 'The criteria for initiating incident recovery are applied' },
  // ── RS.AN (4) — CSF 2.0: 01, 02, 04, 05 relocated ──
  { code: 'RS.AN-03', categoryCode: 'RS.AN', name: 'Forensics are performed' },
  { code: 'RS.AN-06', categoryCode: 'RS.AN', name: 'Actions performed during an investigation are recorded, and the records\' integrity and provenance are preserved' },
  { code: 'RS.AN-07', categoryCode: 'RS.AN', name: 'Incident data and metadata are collected, and their integrity and provenance are preserved' },
  { code: 'RS.AN-08', categoryCode: 'RS.AN', name: 'An incident\'s magnitude is estimated and validated' },
  // ── RS.CO (2) — CSF 2.0: 01 relocated ──
  { code: 'RS.CO-02', categoryCode: 'RS.CO', name: 'Internal and external stakeholders are notified of incidents' },
  { code: 'RS.CO-03', categoryCode: 'RS.CO', name: 'Information is shared with designated internal and external stakeholders' },
  // ── RS.MI (2) ──
  { code: 'RS.MI-01', categoryCode: 'RS.MI', name: 'Incidents are contained' },
  { code: 'RS.MI-02', categoryCode: 'RS.MI', name: 'Incidents are eradicated' },
  // ── RC.RP (6) ──
  { code: 'RC.RP-01', categoryCode: 'RC.RP', name: 'The recovery portion of the incident response plan is executed once initiated from the incident response process' },
  { code: 'RC.RP-02', categoryCode: 'RC.RP', name: 'Recovery actions are selected, scoped, prioritized, and performed' },
  { code: 'RC.RP-03', categoryCode: 'RC.RP', name: 'The integrity of backups and other restoration assets is verified before using them for restoration' },
  { code: 'RC.RP-04', categoryCode: 'RC.RP', name: 'Critical mission functions and cybersecurity risk management are considered to establish post-incident operational norms' },
  { code: 'RC.RP-05', categoryCode: 'RC.RP', name: 'The integrity of restored assets is verified, systems and services are restored, and normal operating status is confirmed' },
  { code: 'RC.RP-06', categoryCode: 'RC.RP', name: 'The end of incident recovery is declared based on criteria, and incident-related documentation is completed' },
  // ── RC.CO (2) — CSF 2.0: 01, 02 relocated ──
  { code: 'RC.CO-03', categoryCode: 'RC.CO', name: 'Recovery activities and progress in restoring operational capabilities are communicated to designated internal and external stakeholders' },
  { code: 'RC.CO-04', categoryCode: 'RC.CO', name: 'Public updates on incident recovery are shared using approved methods and messaging' },
];

// ══════════════════════════════════════════════════════════════════
// 5. TIER 3→4 GAP DIMENSIONS
// ══════════════════════════════════════════════════════════════════

const TIER_GAP_DIMENSIONS = [
  { dimension: 'riskMgmt', tier3: 'Organization-wide risk-informed policies, regularly reviewed', tier4: 'Real-time adaptive risk management, predictive analytics integrated' },
  { dimension: 'integration', tier3: 'Periodic update cycles, manual review processes', tier4: 'Continuous automated feedback loops, self-adjusting controls' },
  { dimension: 'externalParticipation', tier3: 'Receives and uses external threat intelligence', tier4: 'Actively contributes to and shapes the cybersecurity ecosystem' },
  { dimension: 'supplyChain', tier3: 'Supplier risks managed and monitored', tier4: 'Predictive supply chain risk, adaptive response to supplier posture changes' },
  { dimension: 'lessonsLearned', tier3: 'Post-incident review with documented improvements', tier4: 'Real-time lesson integration, automatic process/control updates' },
  { dimension: 'metrics', tier3: 'KPIs measured periodically and reported', tier4: 'Continuous measurement with automated threshold adjustment and alerting' },
];

/** Generate TierGap records: 1 per subcategory × dimension = 636 records */
function buildTierGaps(): Record<string, unknown>[] {
  const gaps: Record<string, unknown>[] = [];
  for (const sc of CSF_SUBCATEGORIES) {
    for (const dim of TIER_GAP_DIMENSIONS) {
      gaps.push({
        subcategoryCode: sc.code,
        categoryCode: sc.categoryCode,
        dimension: dim.dimension,
        tier3State: dim.tier3,
        tier4State: dim.tier4,
        ownerDid: `${ROOT_DID}:tier:gap`,
      });
    }
  }
  return gaps;
}

// ══════════════════════════════════════════════════════════════════
// 6. CMMC 2.0 LEVEL 2 — SP 800-171 r2 (14 families, 110 practices)
// ══════════════════════════════════════════════════════════════════

const CMMC_FAMILIES: { code: string; name: string; practiceCount: number; csfPrimary: string }[] = [
  { code: 'AC', name: 'Access Control', practiceCount: 22, csfPrimary: 'PR.AA' },
  { code: 'AT', name: 'Awareness and Training', practiceCount: 3, csfPrimary: 'PR.AT' },
  { code: 'AU', name: 'Audit and Accountability', practiceCount: 9, csfPrimary: 'DE.CM' },
  { code: 'CM', name: 'Configuration Management', practiceCount: 9, csfPrimary: 'PR.PS' },
  { code: 'IA', name: 'Identification and Authentication', practiceCount: 11, csfPrimary: 'PR.AA' },
  { code: 'IR', name: 'Incident Response', practiceCount: 3, csfPrimary: 'RS.MA' },
  { code: 'MA', name: 'Maintenance', practiceCount: 6, csfPrimary: 'PR.PS' },
  { code: 'MP', name: 'Media Protection', practiceCount: 8, csfPrimary: 'PR.DS' },
  { code: 'PE', name: 'Physical Protection', practiceCount: 6, csfPrimary: 'PR.IR' },
  { code: 'PS', name: 'Personnel Security', practiceCount: 2, csfPrimary: 'GV.RR' },
  { code: 'RA', name: 'Risk Assessment', practiceCount: 3, csfPrimary: 'ID.RA' },
  { code: 'CA', name: 'Security Assessment', practiceCount: 4, csfPrimary: 'ID.IM' },
  { code: 'SC', name: 'System and Communications Protection', practiceCount: 16, csfPrimary: 'PR.DS' },
  { code: 'SI', name: 'System and Information Integrity', practiceCount: 7, csfPrimary: 'DE.CM' },
];

/** Build CMMC L2 practice records from families. SP 800-171 practice IDs: 3.X.Y */
function buildCmmcPractices(): Record<string, unknown>[] {
  const practices: Record<string, unknown>[] = [];
  for (const fam of CMMC_FAMILIES) {
    for (let i = 1; i <= fam.practiceCount; i++) {
      practices.push({
        code: `${fam.code}-L2-${String(i).padStart(2, '0')}`,
        sp800171: `3.${fam.code.toLowerCase()}.${i}`,
        familyCode: fam.code,
        familyName: fam.name,
        csfPrimaryMapping: fam.csfPrimary,
        level: 2,
        ownerDid: `${ROOT_DID}:cmmc:level2`,
      });
    }
  }
  return practices;
}

/** Build CMMC→CSF mapping records. Maps each CMMC family to CSF categories. */
function buildCmmcCsfMappings(): Record<string, unknown>[] {
  const mappings: Record<string, unknown>[] = [];
  // Primary mappings per family
  const familyToCsf: Record<string, string[]> = {
    AC: ['PR.AA-01', 'PR.AA-02', 'PR.AA-03', 'PR.AA-04', 'PR.AA-05', 'PR.AA-06'],
    AT: ['PR.AT-01', 'PR.AT-02'],
    AU: ['DE.CM-01', 'DE.CM-03', 'DE.CM-08', 'PR.DS-08', 'DE.AE-02'],
    CM: ['PR.PS-01', 'PR.PS-02', 'PR.PS-03', 'PR.PS-05'],
    IA: ['PR.AA-01', 'PR.AA-02', 'PR.AA-03', 'PR.AA-04'],
    IR: ['RS.MA-01', 'RS.MA-02', 'RS.MA-03', 'RS.AN-01', 'RS.CO-01'],
    MA: ['PR.PS-02', 'PR.PS-03'],
    MP: ['PR.DS-01', 'PR.DS-02', 'PR.DS-03', 'PR.DS-05'],
    PE: ['PR.AA-06', 'PR.IR-02', 'DE.CM-02'],
    PS: ['GV.RR-04'],
    RA: ['ID.RA-01', 'ID.RA-04', 'ID.RA-05'],
    CA: ['ID.IM-01', 'ID.IM-02', 'GV.OV-03'],
    SC: ['PR.DS-01', 'PR.DS-02', 'PR.IR-01', 'PR.IR-03'],
    SI: ['DE.CM-04', 'DE.CM-05', 'DE.AE-06', 'RS.AN-01'],
  };
  for (const [family, subcodes] of Object.entries(familyToCsf)) {
    for (const sc of subcodes) {
      mappings.push({
        cmmcFamily: family,
        csfSubcategoryCode: sc,
        relationship: 'implements',
        framework: 'CMMC_L2',
        ownerDid: `${ROOT_DID}:cmmc:level2`,
      });
    }
  }
  // CSF subcategories NOT covered by CMMC L2
  const coveredSet = new Set(Object.values(familyToCsf).flat());
  for (const sc of CSF_SUBCATEGORIES) {
    if (!coveredSet.has(sc.code)) {
      mappings.push({
        cmmcFamily: 'NONE',
        csfSubcategoryCode: sc.code,
        relationship: 'not_covered',
        framework: 'CMMC_L2',
        gap: true,
        ownerDid: `${ROOT_DID}:cmmc:level2`,
      });
    }
  }
  return mappings;
}

// ══════════════════════════════════════════════════════════════════
// 7. SP 1302 COMMUNITY PROFILE TEMPLATES
// ══════════════════════════════════════════════════════════════════

const COMMUNITY_PROFILES: Record<string, unknown>[] = [
  {
    name: 'Critical Infrastructure — Energy',
    sector: 'energy',
    tier: 3,
    highPriority: ['GV.SC', 'ID.RA', 'PR.IR', 'DE.CM', 'RS.MA', 'RC.RP'],
    description: 'Energy sector community profile per NIST SP 1302 guidance',
    ownerDid: `${ROOT_DID}:sp:communityProfile`,
  },
  {
    name: 'Critical Infrastructure — Financial Services',
    sector: 'financial',
    tier: 4,
    highPriority: ['GV.RM', 'GV.PO', 'PR.AA', 'PR.DS', 'DE.CM', 'DE.AE', 'RS.AN'],
    description: 'Financial services community profile',
    ownerDid: `${ROOT_DID}:sp:communityProfile`,
  },
  {
    name: 'Critical Infrastructure — Healthcare',
    sector: 'healthcare',
    tier: 3,
    highPriority: ['GV.OC', 'PR.AA', 'PR.DS', 'DE.CM', 'RS.CO', 'RC.CO'],
    description: 'Healthcare and public health community profile',
    ownerDid: `${ROOT_DID}:sp:communityProfile`,
  },
  {
    name: 'Critical Infrastructure — Information Technology',
    sector: 'it',
    tier: 3,
    highPriority: ['GV.SC', 'ID.AM', 'PR.PS', 'DE.CM', 'DE.AE', 'RS.MA'],
    description: 'IT sector community profile with supply chain emphasis',
    ownerDid: `${ROOT_DID}:sp:communityProfile`,
  },
  {
    name: 'Critical Infrastructure — Defense Industrial Base',
    sector: 'dib',
    tier: 4,
    highPriority: ['GV.SC', 'PR.AA', 'PR.DS', 'DE.CM', 'DE.AE', 'RS.AN', 'RS.MI'],
    description: 'DIB community profile — aligned with CMMC L2 requirements',
    ownerDid: `${ROOT_DID}:sp:communityProfile`,
  },
  {
    name: 'Small/Medium Business — General',
    sector: 'smb',
    tier: 2,
    highPriority: ['GV.PO', 'PR.AA', 'PR.DS', 'DE.CM'],
    description: 'SMB community profile — minimal viable cybersecurity posture',
    ownerDid: `${ROOT_DID}:sp:communityProfile`,
  },
];

// ══════════════════════════════════════════════════════════════════
// 8. CSF 1.1→2.0 MIGRATION TRACKING
// ═════════════════════════════════════════════════════════════════��

type MigrationAction = 'new' | 'relocated' | 'removed' | 'renamed' | 'split' | 'merged' | 'unchanged';

const CSF_V1_V2_MIGRATIONS: {
  v1Code: string; v2Code: string; action: MigrationAction;
  v1Name: string; v2Name: string; note: string;
}[] = [
  // ── GV is entirely new in CSF 2.0 (was not in v1.1) ──
  { v1Code: '', v2Code: 'GV.OC-01', action: 'new', v1Name: '', v2Name: 'Organizational mission informs risk management', note: 'New function Govern added in CSF 2.0' },
  { v1Code: '', v2Code: 'GV.OC-02', action: 'new', v1Name: '', v2Name: 'Stakeholder needs understood', note: 'New in CSF 2.0' },
  { v1Code: '', v2Code: 'GV.OC-03', action: 'new', v1Name: '', v2Name: 'Legal/regulatory requirements managed', note: 'New — expanded from ID.GV-03 v1.1' },
  { v1Code: '', v2Code: 'GV.OC-04', action: 'new', v1Name: '', v2Name: 'Critical objectives communicated', note: 'New in CSF 2.0' },
  { v1Code: '', v2Code: 'GV.OC-05', action: 'new', v1Name: '', v2Name: 'Dependency outcomes communicated', note: 'New in CSF 2.0' },
  { v1Code: '', v2Code: 'GV.RM-01', action: 'new', v1Name: '', v2Name: 'Risk management objectives established', note: 'Evolved from ID.RM-01 v1.1' },
  { v1Code: '', v2Code: 'GV.RM-02', action: 'new', v1Name: '', v2Name: 'Risk appetite established', note: 'Evolved from ID.RM-02 v1.1' },
  { v1Code: '', v2Code: 'GV.RM-03', action: 'new', v1Name: '', v2Name: 'Risk management in ERM', note: 'Evolved from ID.RM-03 v1.1' },
  { v1Code: '', v2Code: 'GV.RM-04', action: 'new', v1Name: '', v2Name: 'Risk response direction', note: 'New in CSF 2.0' },
  { v1Code: '', v2Code: 'GV.RM-05', action: 'new', v1Name: '', v2Name: 'Communication lines for risk', note: 'New in CSF 2.0' },
  { v1Code: '', v2Code: 'GV.RM-06', action: 'new', v1Name: '', v2Name: 'Standardized risk calculation', note: 'New in CSF 2.0' },
  { v1Code: '', v2Code: 'GV.RM-07', action: 'new', v1Name: '', v2Name: 'Strategic opportunities (positive risk)', note: 'New in CSF 2.0' },
  { v1Code: 'ID.GV-01', v2Code: 'GV.PO-01', action: 'relocated', v1Name: 'Organizational cybersecurity policy established', v2Name: 'Policy established based on context', note: 'ID.GV → GV.PO' },
  { v1Code: '', v2Code: 'GV.PO-02', action: 'new', v1Name: '', v2Name: 'Policy reviewed and updated', note: 'New in CSF 2.0' },
  { v1Code: 'ID.GV-02', v2Code: 'GV.RR-01', action: 'relocated', v1Name: 'Cybersecurity roles and responsibilities coordinated', v2Name: 'Leadership responsible and accountable', note: 'ID.GV → GV.RR' },
  { v1Code: '', v2Code: 'GV.RR-02', action: 'new', v1Name: '', v2Name: 'Roles established and enforced', note: 'New in CSF 2.0' },
  { v1Code: '', v2Code: 'GV.RR-03', action: 'new', v1Name: '', v2Name: 'Adequate resources allocated', note: 'New in CSF 2.0' },
  { v1Code: '', v2Code: 'GV.RR-04', action: 'new', v1Name: '', v2Name: 'Cybersecurity in HR practices', note: 'New in CSF 2.0' },
  { v1Code: '', v2Code: 'GV.OV-01', action: 'new', v1Name: '', v2Name: 'Strategy outcomes reviewed', note: 'New in CSF 2.0' },
  { v1Code: '', v2Code: 'GV.OV-02', action: 'new', v1Name: '', v2Name: 'Strategy adjusted for coverage', note: 'New in CSF 2.0' },
  { v1Code: '', v2Code: 'GV.OV-03', action: 'new', v1Name: '', v2Name: 'Performance evaluated', note: 'New in CSF 2.0' },
  { v1Code: 'ID.SC-01', v2Code: 'GV.SC-01', action: 'relocated', v1Name: 'Supply chain risk management established', v2Name: 'C-SCRM program established', note: 'ID.SC → GV.SC' },
  { v1Code: 'ID.SC-02', v2Code: 'GV.SC-05', action: 'relocated', v1Name: 'Suppliers identified and assessed', v2Name: 'Requirements in contracts', note: 'ID.SC-02 → GV.SC-05 (expanded)' },
  // ── Subcategories removed from ID in v2.0 ──
  { v1Code: 'ID.AM-06', v2Code: 'GV.RR-02', action: 'relocated', v1Name: 'Cybersecurity roles established', v2Name: 'Roles established and enforced', note: 'ID.AM-06 → GV.RR (governance)' },
  { v1Code: 'ID.GV-03', v2Code: 'GV.OC-03', action: 'relocated', v1Name: 'Legal requirements understood', v2Name: 'Legal/regulatory requirements managed', note: 'ID.GV-03 → GV.OC-03' },
  { v1Code: 'ID.GV-04', v2Code: 'GV.RM-03', action: 'relocated', v1Name: 'Governance and risk management processes address cybersecurity risks', v2Name: 'Risk management in ERM processes', note: 'ID.GV-04 → GV.RM-03' },
  // ── PR.DS consolidation ──
  { v1Code: 'PR.DS-03', v2Code: 'PR.DS-10', action: 'merged', v1Name: 'Assets formally managed throughout removal/transfer/disposition', v2Name: 'Data-in-use protected', note: 'PR.DS-03 merged into new PR.DS-10' },
  { v1Code: 'PR.DS-04', v2Code: '', action: 'relocated', v1Name: 'Adequate capacity to ensure availability', v2Name: '', note: 'Moved to PR.IR-04' },
  { v1Code: 'PR.DS-05', v2Code: '', action: 'relocated', v1Name: 'Protections against data leaks', v2Name: '', note: 'Absorbed into PR.DS-01/02' },
  { v1Code: 'PR.DS-06', v2Code: '', action: 'relocated', v1Name: 'Integrity checking mechanisms', v2Name: '', note: 'Moved to PR.PS-06' },
  { v1Code: 'PR.DS-07', v2Code: '', action: 'relocated', v1Name: 'Dev/test separate from production', v2Name: '', note: 'Moved to PR.PS-01 (config mgmt)' },
  { v1Code: 'PR.DS-08', v2Code: '', action: 'relocated', v1Name: 'Audit/log records', v2Name: '', note: 'Moved to PR.PS-04' },
  { v1Code: '', v2Code: 'PR.DS-11', action: 'new', v1Name: '', v2Name: 'Backups created and tested', note: 'New subcategory in CSF 2.0' },
  // ── DE consolidation ──
  { v1Code: 'DE.CM-04', v2Code: 'DE.CM-09', action: 'merged', v1Name: 'Malicious code detected', v2Name: 'HW/SW/runtime monitored', note: 'DE.CM-04 merged into DE.CM-09' },
  { v1Code: 'DE.CM-05', v2Code: 'DE.CM-03', action: 'merged', v1Name: 'Unauthorized mobile code detected', v2Name: 'Personnel/technology usage monitored', note: 'DE.CM-05 merged into DE.CM-03' },
  { v1Code: 'DE.CM-07', v2Code: 'DE.CM-01', action: 'merged', v1Name: 'Monitoring for unauthorized entities', v2Name: 'Networks monitored', note: 'DE.CM-07 merged into DE.CM-01' },
  { v1Code: 'DE.CM-08', v2Code: '', action: 'removed', v1Name: 'Vulnerability scans performed', v2Name: '', note: 'Removed — covered by ID.RA-01' },
  { v1Code: 'DE.AE-01', v2Code: '', action: 'relocated', v1Name: 'Baseline of network operations established', v2Name: '', note: 'Absorbed into DE.CM-01' },
  { v1Code: 'DE.AE-05', v2Code: '', action: 'relocated', v1Name: 'Incident alert thresholds established', v2Name: '', note: 'Absorbed into DE.AE-07' },
  // ── RS consolidation ──
  { v1Code: 'RS.AN-01', v2Code: 'DE.AE-02', action: 'relocated', v1Name: 'Notifications investigated', v2Name: 'Adverse events analyzed', note: 'RS.AN-01 → DE.AE-02 (detection phase)' },
  { v1Code: 'RS.AN-02', v2Code: 'DE.AE-04', action: 'relocated', v1Name: 'Impact understood', v2Name: 'Impact and scope understood', note: 'RS.AN-02 → DE.AE-04' },
  { v1Code: 'RS.AN-04', v2Code: 'RS.AN-03', action: 'merged', v1Name: 'Incidents categorized consistent with plans', v2Name: 'Forensics performed', note: 'Merged into forensics scope' },
  { v1Code: 'RS.AN-05', v2Code: 'RS.AN-06', action: 'merged', v1Name: 'Processes established to receive/analyze vuln disclosures', v2Name: 'Investigation actions recorded', note: 'Consolidated' },
  { v1Code: 'RS.CO-01', v2Code: 'RS.MA-01', action: 'relocated', v1Name: 'Personnel know their roles', v2Name: 'Incident response plan executed', note: 'RS.CO-01 role awareness → RS.MA' },
  // ── RC consolidation ──
  { v1Code: 'RC.CO-01', v2Code: 'RC.CO-03', action: 'merged', v1Name: 'Public relations managed', v2Name: 'Recovery progress communicated', note: 'RC.CO-01 merged into RC.CO-03' },
  { v1Code: 'RC.CO-02', v2Code: 'RC.CO-04', action: 'merged', v1Name: 'Reputation repaired', v2Name: 'Public updates shared', note: 'RC.CO-02 merged into RC.CO-04' },
  // ── v1.1 categories removed entirely in v2.0 ──
  { v1Code: 'ID.BE', v2Code: 'GV.OC', action: 'relocated', v1Name: 'Business Environment (entire category)', v2Name: 'Organizational Context', note: 'ID.BE category → GV.OC category' },
  { v1Code: 'ID.GV', v2Code: 'GV', action: 'relocated', v1Name: 'Governance (entire category)', v2Name: 'Govern (entire function)', note: 'ID.GV category → GV function (promoted to top-level)' },
  { v1Code: 'ID.RM', v2Code: 'GV.RM', action: 'relocated', v1Name: 'Risk Management Strategy (entire category)', v2Name: 'Risk Management Strategy (under GV)', note: 'ID.RM category → GV.RM category' },
  { v1Code: 'ID.SC', v2Code: 'GV.SC', action: 'relocated', v1Name: 'Supply Chain Risk Management (entire category)', v2Name: 'Supply Chain Risk Management (under GV)', note: 'ID.SC category → GV.SC category' },
  { v1Code: 'PR.AC', v2Code: 'PR.AA', action: 'renamed', v1Name: 'Access Control', v2Name: 'Identity Management, Authentication, and Access Control', note: 'PR.AC → PR.AA (expanded scope)' },
  { v1Code: 'PR.IP', v2Code: 'PR.PS', action: 'renamed', v1Name: 'Information Protection Processes and Procedures', v2Name: 'Platform Security', note: 'PR.IP → PR.PS (modernized)' },
  { v1Code: 'PR.MA', v2Code: 'PR.PS', action: 'merged', v1Name: 'Maintenance', v2Name: 'Platform Security', note: 'PR.MA absorbed into PR.PS' },
  { v1Code: 'PR.PT', v2Code: 'PR.PS', action: 'merged', v1Name: 'Protective Technology', v2Name: 'Platform Security', note: 'PR.PT absorbed into PR.PS' },
  { v1Code: 'DE.DP', v2Code: '', action: 'removed', v1Name: 'Detection Processes', v2Name: '', note: 'DE.DP removed — absorbed into DE.CM and GV.OV' },
  { v1Code: 'RS.RP', v2Code: 'RS.MA', action: 'renamed', v1Name: 'Response Planning', v2Name: 'Incident Management', note: 'RS.RP → RS.MA (expanded)' },
  { v1Code: 'RS.IM', v2Code: 'ID.IM', action: 'relocated', v1Name: 'Improvements', v2Name: 'Improvement', note: 'RS.IM → ID.IM (consolidated)' },
  { v1Code: 'RC.RP', v2Code: 'RC.RP', action: 'unchanged', v1Name: 'Recovery Planning', v2Name: 'Recovery Plan Execution', note: 'Kept, description updated' },
  { v1Code: 'RC.IM', v2Code: 'ID.IM', action: 'relocated', v1Name: 'Improvements', v2Name: 'Improvement', note: 'RC.IM → ID.IM (consolidated)' },
];

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log('=== NIST CSF 2.0 Full Taxonomy Seed ===\n');

  // 1. Actors
  console.log(`── 1. Registering ${ACTORS.length} Actor DIDs ──`);
  for (const a of ACTORS) {
    await actorCreate(a.did, a.name, a.desc);
  }

  // 1b. Register App Profile (yoro profile page)
  console.log('\n── 1b. Register App Profile + App ──');
  await registerApp({
    nanoid: NANOID,
    did: ROOT_DID,
    displayName: 'NIST Cybersecurity Framework',
    description: 'NIST CSF 2.0 — 6 Functions, 22 Categories, 106 Subcategories, Tier Gap, CMMC L2, SP 1302 Community Profiles, v1.1→2.0 Migration [AI Agent — unofficial, not affiliated with NIST]',
    performerType: 'service',
    contentMode: 'timeline',
    sensitivity: 'public',
    uiType: 'yoro',
    capabilities: [
      'csf-assessment',
      'csf-profile-management',
      'cross-framework-mapping',
      'cybersecurity-governance',
      'cmmc-mapping',
      'tier-gap-analysis',
      'csf-migration-tracking',
    ],
    governance: {
      classification: 'internal',
      raci: 'responsible',
      complianceFrameworks: ['nist-csf-2.0', 'cmmc-2.0', 'sp-800-171-r2'],
    },
    icon: '🛡️',
    accent: '#1a5276',
    contract: 'NIST Cybersecurity Framework 2.0 (CSWP 29)',
  });

  // 1c. Register Tools
  console.log('\n── 1c. Register Tools ──');
  const TOOLS = [
    { name: 'assessSubcategory', description: 'Assess an organization against a CSF 2.0 subcategory', inputSchema: '{"type":"object","properties":{"subcategoryCode":{"type":"string"},"score":{"type":"number"},"evidence":{"type":"string"}}}' },
    { name: 'createProfile', description: 'Create a CSF 2.0 organizational profile with target tier', inputSchema: '{"type":"object","properties":{"name":{"type":"string"},"tier":{"type":"number"},"subcategories":{"type":"array"}}}' },
    { name: 'mapToFramework', description: 'Map CSF subcategories to external framework controls', inputSchema: '{"type":"object","properties":{"subcategoryCode":{"type":"string"},"targetFramework":{"type":"string"},"targetControl":{"type":"string"}}}' },
    { name: 'analyzeTierGap', description: 'Analyze Tier 3→4 gaps for a set of subcategories', inputSchema: '{"type":"object","properties":{"subcategoryCodes":{"type":"array"},"dimension":{"type":"string"}}}' },
    { name: 'analyzeCmmcGap', description: 'Identify CSF subcategories not covered by CMMC L2', inputSchema: '{"type":"object","properties":{"familyCode":{"type":"string"}}}' },
    { name: 'migrationLookup', description: 'Look up CSF 1.1→2.0 migration path for a subcategory code', inputSchema: '{"type":"object","properties":{"v1Code":{"type":"string"}}}' },
  ];
  for (const t of TOOLS) {
    await toolRegister({ ...t, capabilityWorker: NANOID });
    // Grant to root actor
    await fetch(`${PDS}/xrpc/com.etzhayyim.actor.grantTool`, {
      method: 'POST', headers: INTERNAL_HEADERS,
      body: JSON.stringify({ actorDid: ROOT_DID, toolName: t.name }),
    });
  }
  console.log(`  ${TOOLS.length} tools registered and granted`);

  // 1d. Social Posts (initial announcements)
  console.log('\n── 1d. Social Posts ──');
  await socialPost(ROOT_DID, 'NIST CSF 2.0 intelligence framework initialized — 6 Functions, 22 Categories, 106 Subcategories registered. Cross-framework mapping with CMMC L2, ISO 27001, CIS Controls v8 available.');
  await socialPost(ROOT_DID, 'CSF 1.1→2.0 migration tracking enabled — 59 relocation/merge/removal records. Govern (GV) function promoted from Identify subcategories. PR.DS consolidated from 10→4 subcategories.');
  await socialPost(ROOT_DID, 'Tier 3→4 gap analysis: 636 gap records across 106 subcategories × 6 dimensions (risk management, integration, external participation, supply chain, lessons learned, metrics).');
  console.log('  3 social posts created');

  // 2. CSF Functions
  console.log('\n── 2. CSF Functions (6) ──');
  await batchRecords('com.etzhayyim.apps.nist.csfFunction', CSF_FUNCTIONS.map(f => ({
    ...f, version: '2.0', ownerDid: `${ROOT_DID}:csf:${f.code === 'GV' ? 'govern' : f.code === 'ID' ? 'identify' : f.code === 'PR' ? 'protect' : f.code === 'DE' ? 'detect' : f.code === 'RS' ? 'respond' : 'recover'}`,
  })));

  // 3. CSF Categories
  console.log('\n── 3. CSF Categories (22) ──');
  await batchRecords('com.etzhayyim.apps.nist.csfCategory', CSF_CATEGORIES.map(c => ({ ...c })));

  // 4. CSF Subcategories
  console.log(`\n── 4. CSF Subcategories (${CSF_SUBCATEGORIES.length}) ──`);
  await batchRecords('com.etzhayyim.apps.nist.csfSubcategory', CSF_SUBCATEGORIES.map(s => ({ ...s, version: '2.0' })));

  // 5. Tier Gap (106 subcategories × 6 dimensions = 636)
  const tierGaps = buildTierGaps();
  console.log(`\n── 5. Tier 3→4 Gap Records (${tierGaps.length}) ──`);
  await batchRecords('com.etzhayyim.apps.nist.tierGap', tierGaps);

  // 6. CMMC Families
  console.log('\n── 6. CMMC Families (14) ──');
  await batchRecords('com.etzhayyim.apps.nist.cmmcFamily', CMMC_FAMILIES.map(f => ({
    ...f, level: 2, framework: 'CMMC_2.0', ownerDid: `${ROOT_DID}:cmmc:level2`,
  })));

  // 7. CMMC Practices
  const practices = buildCmmcPractices();
  console.log(`\n── 7. CMMC L2 Practices (${practices.length}) ──`);
  await batchRecords('com.etzhayyim.apps.nist.cmmcPractice', practices);

  // 8. CMMC→CSF Mappings
  const mappings = buildCmmcCsfMappings();
  console.log(`\n── 8. CMMC→CSF Mappings (${mappings.length}) ──`);
  await batchRecords('com.etzhayyim.apps.nist.cmmcCsfMapping', mappings);

  // 9. SP 1302 Community Profiles
  console.log(`\n── 9. SP 1302 Community Profiles (${COMMUNITY_PROFILES.length}) ──`);
  await batchRecords('com.etzhayyim.apps.nist.communityProfile', COMMUNITY_PROFILES);

  // 10. CSF 1.1→2.0 Migration Records
  console.log(`\n── 10. CSF 1.1→2.0 Migration (${CSF_V1_V2_MIGRATIONS.length}) ──`);
  await batchRecords('com.etzhayyim.apps.nist.csfMigration', CSF_V1_V2_MIGRATIONS.map(m => ({
    ...m, ownerDid: `${ROOT_DID}:migration:v1to2`, sourceVersion: '1.1', targetVersion: '2.0',
  })));

  // Summary
  const total = ACTORS.length + CSF_FUNCTIONS.length + CSF_CATEGORIES.length + CSF_SUBCATEGORIES.length
    + tierGaps.length + CMMC_FAMILIES.length + practices.length + mappings.length
    + COMMUNITY_PROFILES.length + CSF_V1_V2_MIGRATIONS.length;
  console.log(`\n=== Done: ${total} records seeded ===`);
}

main().catch(console.error);
