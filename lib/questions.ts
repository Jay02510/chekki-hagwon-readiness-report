export type Option = { label: "A" | "B" | "C" | "D"; text: string; points: number };
export type Question = { id: string; pillarId: string; prompt: string; options: Option[] };
export type Pillar = {
  id: string; name: string; weight: number; weakestBlurb: string;
  // DRAFT COPY — review before shipping. chekkiFit says whether Chekki's
  // current product covers this pillar ("covered") or would need a custom
  // build ("custom"); chekkiNote is the one-liner shown alongside the
  // weakestBlurb on weak/mid pillars.
  chekkiFit: "covered" | "custom";
  chekkiNote: string;
};

export const pillars: Pillar[] = [
  { id: "parentComm", name: "Parent Communication & Reporting", weight: 1.5,
    weakestBlurb: "Usually the first thing parents notice — high-visibility fix, and directors consistently underestimate the staff hours recurring manual reports quietly consume.",
    chekkiFit: "covered",
    chekkiNote: "Chekki's automated parent progress reports are built for exactly this." },
  { id: "safety", name: "Safety & Peace of Mind", weight: 1.5,
    weakestBlurb: "For Korean parents, this is often the single biggest driver of trust and retention — worth fixing even before academic-facing pillars.",
    chekkiFit: "custom",
    chekkiNote: "Not part of Chekki's core product today — open to scoping a custom build for the right hagwon." },
  { id: "operations", name: "Operations & Admin", weight: 1,
    weakestBlurb: "Manual re-entry across attendance, billing, and reports is invisible until you add up the hours.",
    chekkiFit: "custom",
    chekkiNote: "Outside Chekki's current scope — a candidate for a custom build if this is your top priority." },
  { id: "marketing", name: "Marketing & Enrollment", weight: 1,
    weakestBlurb: "If growth depends on word of mouth alone, it's capped by how fast word travels, not by how good the hagwon actually is.",
    chekkiFit: "custom",
    chekkiNote: "Not something Chekki addresses today — open to discussing a custom solution." },
  { id: "teaching", name: "Teaching & Curriculum Personalization", weight: 1,
    weakestBlurb: "One-size-fits-all material is often why strong students get bored and struggling students fall further behind in the same room.",
    chekkiFit: "covered",
    chekkiNote: "Chekki's Mistake Vault and AI practice sheets directly target this." },
  { id: "data", name: "Data & Records", weight: 1,
    weakestBlurb: "If you can't quickly answer \"which students need attention right now,\" you're finding out about problems later than you could be.",
    chekkiFit: "covered",
    chekkiNote: "Chekki's per-student analytics and teacher dashboard cover this." },
  { id: "staff", name: "Staff & Culture", weight: 1,
    weakestBlurb: "Tools don't stick without someone owning adoption — often the real blocker even when other pillars look fine on paper.",
    chekkiFit: "custom",
    chekkiNote: "Usually a people/ownership issue more than a tooling one — worth a conversation before assuming it needs a build." },
];

export const questions: Question[] = [
  { id: "q1", pillarId: "parentComm", prompt: "How do you currently share student progress updates with parents?",
    options: [
      { label: "A", text: "Handwritten notes or occasional phone calls", points: 1 },
      { label: "B", text: "Texts/KakaoTalk messages written manually by teachers", points: 2 },
      { label: "C", text: "A shared template or report sent monthly", points: 3 },
      { label: "D", text: "Automated, personalized reports generated from student data", points: 4 },
    ]},
  { id: "q2", pillarId: "parentComm", prompt: "If a parent asks \"how is my child doing compared to last month,\" how fast can you answer with specifics?",
    options: [
      { label: "A", text: "We'd need to dig through notes or ask the teacher", points: 1 },
      { label: "B", text: "We can find it, but it takes a while", points: 2 },
      { label: "C", text: "We can pull it up in a shared system within minutes", points: 3 },
      { label: "D", text: "It's already visible on a live parent dashboard", points: 4 },
    ]},
  { id: "q3", pillarId: "safety", prompt: "How do parents know when their child has arrived at or left the hagwon?",
    options: [
      { label: "A", text: "They don't, unless something goes wrong", points: 1 },
      { label: "B", text: "A teacher calls or texts if there's an issue", points: 2 },
      { label: "C", text: "A manual check-in system notifies parents", points: 3 },
      { label: "D", text: "Automatic real-time arrival/departure notifications", points: 4 },
    ]},
  { id: "q4", pillarId: "safety", prompt: "If a parent asks \"did my child make it to class safely today,\" how quickly and confidently can you answer?",
    options: [
      { label: "A", text: "We'd have to check attendance sheets or ask around", points: 1 },
      { label: "B", text: "We can find out, but it takes checking", points: 2 },
      { label: "C", text: "We can confirm quickly from our system", points: 3 },
      { label: "D", text: "It's already been automatically confirmed to them", points: 4 },
    ]},
  { id: "q5", pillarId: "operations", prompt: "How is attendance tracked?",
    options: [
      { label: "A", text: "Paper sign-in sheets", points: 1 },
      { label: "B", text: "A spreadsheet updated manually", points: 2 },
      { label: "C", text: "A dedicated attendance app", points: 3 },
      { label: "D", text: "Automated, with real-time alerts to parents", points: 4 },
    ]},
  { id: "q6", pillarId: "operations", prompt: "How are class schedules and makeup classes managed?",
    options: [
      { label: "A", text: "Phone calls and manual rebooking", points: 1 },
      { label: "B", text: "A shared calendar or spreadsheet", points: 2 },
      { label: "C", text: "Scheduling software", points: 3 },
      { label: "D", text: "Self-service booking with automatic conflict resolution", points: 4 },
    ]},
  { id: "q7", pillarId: "operations", prompt: "How is tuition billing and payment tracking handled?",
    options: [
      { label: "A", text: "Manual invoicing or cash, tracked on paper or memory", points: 1 },
      { label: "B", text: "Spreadsheet tracking with manual reminders", points: 2 },
      { label: "C", text: "Billing software with automated reminders", points: 3 },
      { label: "D", text: "Fully automated billing tied to attendance/enrollment", points: 4 },
    ]},
  { id: "q8", pillarId: "marketing", prompt: "How do new families typically find and choose your hagwon?",
    options: [
      { label: "A", text: "Word of mouth and walk-ins only", points: 1 },
      { label: "B", text: "Flyers or local ads, plus word of mouth", points: 2 },
      { label: "C", text: "Active Instagram or Naver Blog presence", points: 3 },
      { label: "D", text: "A content and referral system that consistently drives inquiries", points: 4 },
    ]},
  { id: "q9", pillarId: "marketing", prompt: "What happens when a parent inquires but doesn't enroll right away?",
    options: [
      { label: "A", text: "We usually don't follow up", points: 1 },
      { label: "B", text: "Occasional manual follow-up, if someone remembers", points: 2 },
      { label: "C", text: "A checklist or process for follow-up", points: 3 },
      { label: "D", text: "An automated, personalized follow-up sequence", points: 4 },
    ]},
  { id: "q10", pillarId: "teaching", prompt: "How is material adjusted for a struggling vs. advanced student in the same class?",
    options: [
      { label: "A", text: "It isn't — everyone gets the same material", points: 1 },
      { label: "B", text: "Teachers adjust informally, based on judgment", points: 2 },
      { label: "C", text: "We have leveled materials or tracks", points: 3 },
      { label: "D", text: "Materials are actively tailored per student using performance data", points: 4 },
    ]},
  { id: "q11", pillarId: "teaching", prompt: "How do you track and communicate each student's English proficiency progress (reading level, TOEFL Junior, internal benchmark, etc.)?",
    options: [
      { label: "A", text: "We don't track this formally", points: 1 },
      { label: "B", text: "Teachers keep informal notes", points: 2 },
      { label: "C", text: "We have a standard testing/leveling system", points: 3 },
      { label: "D", text: "Proficiency is tracked continuously and shown to parents in concrete terms", points: 4 },
    ]},
  { id: "q12", pillarId: "teaching", prompt: "Do your teachers use any AI tools for lesson prep, grading, or feedback?",
    options: [
      { label: "A", text: "No, everything is done manually", points: 1 },
      { label: "B", text: "A teacher or two experiments on their own", points: 2 },
      { label: "C", text: "Some tools are used team-wide, informally", points: 3 },
      { label: "D", text: "AI tools are a standard, expected part of the workflow", points: 4 },
    ]},
  { id: "q13", pillarId: "data", prompt: "Where does most student data live (scores, attendance, notes)?",
    options: [
      { label: "A", text: "Paper files", points: 1 },
      { label: "B", text: "Scattered across each teacher's own spreadsheet or notebook", points: 2 },
      { label: "C", text: "One shared system, though not fully used", points: 3 },
      { label: "D", text: "One central system everyone updates and can query", points: 4 },
    ]},
  { id: "q14", pillarId: "data", prompt: "If you needed a list of every student whose performance dropped this month, how hard would that be?",
    options: [
      { label: "A", text: "Nearly impossible without a lot of manual digging", points: 1 },
      { label: "B", text: "Possible, but very time-consuming", points: 2 },
      { label: "C", text: "Doable within a day", points: 3 },
      { label: "D", text: "A few clicks", points: 4 },
    ]},
  { id: "q15", pillarId: "staff", prompt: "When a new tool or process is introduced, how does staff typically respond?",
    options: [
      { label: "A", text: "Resistance or reluctance to change", points: 1 },
      { label: "B", text: "Mixed, depending on the person", points: 2 },
      { label: "C", text: "Generally open, if it's shown to help", points: 3 },
      { label: "D", text: "Staff proactively suggest and adopt new tools", points: 4 },
    ]},
  { id: "q16", pillarId: "staff", prompt: "Who is responsible for exploring new technology or AI tools at your hagwon?",
    options: [
      { label: "A", text: "No one — it isn't really anyone's job", points: 1 },
      { label: "B", text: "Me (the director), whenever I find time", points: 2 },
      { label: "C", text: "A staff member has informal ownership of it", points: 3 },
      { label: "D", text: "It's a defined part of someone's role", points: 4 },
    ]},
];
