import type { Localized } from "./i18n";

export type Option = { label: "A" | "B" | "C" | "D"; text: Localized; points: number };
export type Question = { id: string; pillarId: string; prompt: Localized; options: Option[] };
export type Pillar = {
  id: string; name: Localized; weight: number; weakestBlurb: Localized; nextStep: Localized; nextStep2: Localized;
  // Short capability mention used only in the closing CTA once the weakest
  // pillar is known — deliberately Chekki-specific (unlike weakestBlurb/
  // nextStep/nextStep2, which stay neutral) since the closing ask is the one
  // place in the report where naming a product feature is the point.
  chekkiHook: Localized;
};

export const pillars: Pillar[] = [
  { id: "parentComm", name: { en: "Parent Communication & Reporting", ko: "학부모 소통 및 리포트" }, weight: 1.5,
    weakestBlurb: {
      en: "Usually the first thing parents notice — high-visibility fix, and directors consistently underestimate the staff hours recurring manual reports quietly consume.",
      ko: "학부모님이 가장 먼저 체감하는 부분이라 눈에 잘 띄는 개선 포인트입니다. 반복되는 수기 리포트 작성에 드는 직원 시간을 원장님들이 실제보다 적게 체감하는 경우가 많습니다.",
    },
    nextStep: {
      en: "Start with one recurring report (monthly progress notes work well) and move it to a shared template every teacher fills into the same system — that alone cuts the rewrite-from-scratch time before you touch automation.",
      ko: "반복되는 리포트 하나(월간 진도 안내가 적당합니다)부터 시작해, 모든 선생님이 같은 시스템에 입력하는 공통 양식으로 옮겨보세요. 자동화를 도입하기 전에도 매번 처음부터 작성하는 시간을 크게 줄일 수 있습니다.",
    },
    nextStep2: {
      en: "Set a standing rule for how fast a parent question gets answered (same day is a reasonable bar) — a template only helps if there's also a clear expectation for turnaround.",
      ko: "학부모님 질문에 얼마나 빨리 답할지 기준을 정해두세요(당일 답변이 적당한 기준입니다). 양식이 있어도 답변 속도에 대한 명확한 기준이 없으면 효과가 반감됩니다.",
    },
    chekkiHook: { en: "automated parent reporting", ko: "자동 학부모 리포트" } },
  { id: "safety", name: { en: "Safety & Peace of Mind", ko: "안전 및 학부모 안심" }, weight: 1.5,
    weakestBlurb: {
      en: "For Korean parents, this is often the single biggest driver of trust and retention — worth fixing even before academic-facing pillars.",
      ko: "한국 학부모님들에게는 이 부분이 신뢰와 재등록을 좌우하는 가장 큰 요소인 경우가 많습니다. 다른 영역보다 먼저 손볼 가치가 있습니다.",
    },
    nextStep: {
      en: "Put a same-day rule in writing: if a student misses a scheduled class with no advance notice, front desk calls the parent within the hour. That single policy closes most of the gap even before any notification system is in place.",
      ko: "'사전 연락 없이 결석 시, 프론트에서 한 시간 내 학부모님께 연락한다'는 규칙을 문서로 정해두세요. 별도 알림 시스템이 없어도 이 규칙 하나만으로 대부분의 공백을 메울 수 있습니다.",
    },
    nextStep2: {
      en: "Add arrival/departure notice as a second layer once the no-show rule is working — parents shouldn't have to wonder on a normal day either, not just when something goes wrong.",
      ko: "결석 대응 규칙이 자리 잡으면, 등하원 알림도 다음 단계로 추가해보세요. 문제가 생겼을 때뿐 아니라 평범한 날에도 학부모님이 불안해하지 않도록 하는 것이 중요합니다.",
    },
    chekkiHook: { en: "real-time absence and arrival alerts", ko: "실시간 등하원 및 결석 알림" } },
  { id: "operations", name: { en: "Operations & Admin", ko: "운영 및 행정 업무" }, weight: 1,
    weakestBlurb: {
      en: "Manual re-entry across attendance, billing, and reports is invisible until you add up the hours.",
      ko: "출결, 청구, 리포트 사이에서 반복되는 수작업 재입력은 시간을 다 합산해보기 전까지는 잘 드러나지 않습니다.",
    },
    nextStep: {
      en: "Pick whichever of attendance, billing, or scheduling currently eats the most staff hours and move that one first — consolidating all three at once is what stalls these projects.",
      ko: "출결, 청구, 스케줄링 중 직원 시간을 가장 많이 잡아먹는 업무 하나를 골라 먼저 개선하세요. 세 가지를 한 번에 바꾸려는 시도가 오히려 프로젝트를 멈추게 만드는 경우가 많습니다.",
    },
    nextStep2: {
      en: "Once that one is off spreadsheets, add automated reminders for whatever's left manual (payment due dates are usually the highest-value one) before tackling the rest.",
      ko: "그 업무를 스프레드시트에서 벗어나게 한 뒤에는, 남은 수작업 중 자동 리마인더가 필요한 부분(대개 결제일 안내가 가장 효과가 큽니다)을 다음으로 추가하세요.",
    },
    chekkiHook: { en: "connected attendance, billing, and scheduling", ko: "출결·청구·스케줄 연동" } },
  { id: "marketing", name: { en: "Marketing & Enrollment", ko: "마케팅 및 신입생 모집" }, weight: 1,
    weakestBlurb: {
      en: "If growth depends on word of mouth alone, it's capped by how fast word travels, not by how good the hagwon actually is.",
      ko: "성장이 입소문에만 의존한다면, 학원이 아무리 좋아도 입소문이 퍼지는 속도만큼만 성장할 수밖에 없습니다.",
    },
    nextStep: {
      en: "Build a simple follow-up checklist for parents who inquire but don't enroll on the spot — even a manual 3-day and 2-week check-in recovers enrollments that currently just go cold.",
      ko: "상담 후 바로 등록하지 않은 학부모님을 위한 간단한 후속 연락 체크리스트를 만드세요. 수기로라도 3일 후, 2주 후 연락만 챙겨도 지금은 그냥 놓치는 등록을 되살릴 수 있습니다.",
    },
    nextStep2: {
      en: "Once follow-up is consistent, add one more discovery channel beyond word of mouth (an active Instagram or Naver Blog is the lowest-effort next step) so growth isn't capped by referral speed alone.",
      ko: "후속 연락이 자리 잡으면, 입소문 외에 신규 채널을 하나 더 추가해보세요(인스타그램이나 네이버 블로그 운영이 가장 시작하기 쉽습니다). 성장이 입소문 속도에만 갇히지 않도록 하는 것이 목표입니다.",
    },
    chekkiHook: { en: "automated inquiry follow-up", ko: "자동 상담 후속 연락" } },
  { id: "teaching", name: { en: "Teaching & Curriculum Personalization", ko: "수업 및 맞춤형 커리큘럼" }, weight: 1,
    weakestBlurb: {
      en: "One-size-fits-all material is often why strong students get bored and struggling students fall further behind in the same room.",
      ko: "획일화된 교재는 잘하는 학생은 지루해하고, 부진한 학생은 같은 반에서 더 뒤처지게 만드는 원인인 경우가 많습니다.",
    },
    nextStep: {
      en: "Introduce even two or three leveled tracks within your existing classes before attempting full per-student personalization — it's the step that unblocks everything after it.",
      ko: "학생별 완전 맞춤화를 시도하기 전에, 기존 반 안에서 두세 개 레벨 트랙만이라도 먼저 도입해보세요. 이후 단계로 나아가는 데 필요한 첫걸음입니다.",
    },
    nextStep2: {
      en: "Pick one measurable benchmark (a reading level, an internal test score) and track it consistently per student — without a number to move, \"personalization\" stays a feeling instead of a result.",
      ko: "측정 가능한 기준(리딩 레벨, 내부 테스트 점수 등) 하나를 정해 학생별로 꾸준히 추적하세요. 움직일 수치가 없으면 '맞춤화'는 결과가 아니라 막연한 느낌에 그치게 됩니다.",
    },
    chekkiHook: { en: "AI-personalized curriculum tracking", ko: "AI 기반 맞춤 커리큘럼 추적" } },
  { id: "data", name: { en: "Data & Records", ko: "데이터 및 기록 관리" }, weight: 1,
    weakestBlurb: {
      en: "If you can't quickly answer \"which students need attention right now,\" you're finding out about problems later than you could be.",
      ko: "\"지금 당장 관심이 필요한 학생이 누구인지\" 바로 답할 수 없다면, 문제를 파악할 수 있는 시점보다 더 늦게 알게 되는 셈입니다.",
    },
    nextStep: {
      en: "Move scores and attendance into one shared spreadsheet or system every teacher updates — that single change is what makes a \"who's falling behind\" question answerable at all.",
      ko: "성적과 출결을 모든 선생님이 함께 업데이트하는 하나의 스프레드시트나 시스템으로 모으세요. 이 한 가지 변화만으로도 '누가 뒤처지고 있는지' 바로 답할 수 있게 됩니다.",
    },
    nextStep2: {
      en: "Once the data is in one place, set a recurring time (weekly is enough) to actually look at it and flag who needs attention — collecting data only pays off if someone reviews it.",
      ko: "데이터가 한곳에 모이면, 실제로 살펴보고 관심이 필요한 학생을 짚어내는 정기적인 시간(주 1회면 충분합니다)을 정하세요. 데이터를 모으는 것만으로는 부족하고, 누군가 실제로 검토해야 의미가 있습니다.",
    },
    chekkiHook: { en: "one connected view of student data", ko: "하나로 연결된 학생 데이터" } },
  { id: "staff", name: { en: "Staff & Culture", ko: "직원 및 조직 문화" }, weight: 1,
    weakestBlurb: {
      en: "Tools don't stick without someone owning adoption — often the real blocker even when other pillars look fine on paper.",
      ko: "누군가 책임지고 도입을 이끌지 않으면 도구는 정착하지 않습니다. 다른 영역이 다 괜찮아 보여도 실제로는 이 부분이 걸림돌인 경우가 많습니다.",
    },
    nextStep: {
      en: "Name one person — even part-time — as the owner of new tools and process changes. Without a named owner, every other fix on this list tends to quietly lapse after a few weeks.",
      ko: "새로운 도구와 프로세스 변화를 담당할 사람을 한 명 지정하세요. 파트타임이라도 괜찮습니다. 담당자가 없으면 다른 개선 사항들도 몇 주 후 흐지부지되는 경우가 많습니다.",
    },
    nextStep2: {
      en: "Give that person a small, visible win to start with — one fixed process, presented to the team as done — rather than a broad mandate to \"improve technology,\" which is hard to act on.",
      ko: "담당자에게 처음부터 눈에 보이는 작은 성공 사례를 만들어주세요. 하나의 프로세스를 확실히 개선해 팀에 공유하는 방식이, '기술을 개선하라'는 막연한 임무보다 실행하기 훨씬 쉽습니다.",
    },
    chekkiHook: { en: "guided rollout support", ko: "단계별 도입 지원" } },
];

function opts(a: Localized, b: Localized, c: Localized, d: Localized): Option[] {
  return [
    { label: "A", text: a, points: 1 },
    { label: "B", text: b, points: 2 },
    { label: "C", text: c, points: 3 },
    { label: "D", text: d, points: 4 },
  ];
}

export const questions: Question[] = [
  { id: "q1", pillarId: "parentComm",
    prompt: { en: "How do you currently share student progress updates with parents?", ko: "현재 학부모님께 학생의 학습 진도를 어떻게 공유하고 계신가요?" },
    options: opts(
      { en: "Handwritten notes or occasional phone calls", ko: "손편지나 가끔 하는 전화통화로 전달합니다" },
      { en: "Texts/KakaoTalk messages written manually by teachers", ko: "선생님이 직접 문자나 카카오톡으로 보냅니다" },
      { en: "A shared template or report sent monthly", ko: "매달 공통 양식지를 만들어 보냅니다" },
      { en: "Automated, personalized reports generated from student data", ko: "학생 데이터를 기반으로 자동 생성된 맞춤 리포트를 보냅니다" },
    ) },
  { id: "q2", pillarId: "parentComm",
    prompt: { en: "If a parent asks \"how is my child doing compared to last month,\" how fast can you answer with specifics?", ko: "\"지난달과 비교해서 우리 아이는 어떤가요\"라는 학부모님 질문에 얼마나 빨리, 구체적으로 답할 수 있나요?" },
    options: opts(
      { en: "We'd need to dig through notes or ask the teacher", ko: "메모를 뒤지거나 선생님께 따로 물어봐야 합니다" },
      { en: "We can find it, but it takes a while", ko: "찾을 수는 있지만 시간이 좀 걸립니다" },
      { en: "We can pull it up in a shared system within minutes", ko: "공유 시스템에서 몇 분 안에 확인할 수 있습니다" },
      { en: "It's already visible on a live parent dashboard", ko: "학부모 대시보드에 이미 실시간으로 보입니다" },
    ) },
  { id: "q3", pillarId: "safety",
    prompt: { en: "How do parents know when their child has arrived at or left the hagwon?", ko: "학부모님은 자녀가 학원에 도착하고 하원했는지 어떻게 아시나요?" },
    options: opts(
      { en: "They don't, unless something goes wrong", ko: "특별한 일이 없으면 따로 알려드리지 않습니다" },
      { en: "A teacher calls or texts if there's an issue", ko: "문제가 생기면 선생님이 전화나 문자를 드립니다" },
      { en: "A manual check-in system notifies parents", ko: "수기 출결 확인 후 학부모님께 알립니다" },
      { en: "Automatic real-time arrival/departure notifications", ko: "등하원 시 자동으로 실시간 알림이 전송됩니다" },
    ) },
  { id: "q4", pillarId: "safety",
    prompt: { en: "If a student doesn't show up for a scheduled class and no one called ahead, what happens?", ko: "학생이 예정된 수업에 나타나지 않았고 사전 연락도 없었다면, 어떻게 되나요?" },
    options: opts(
      { en: "Nothing, until a parent asks", ko: "학부모님이 먼저 물어보기 전까지는 아무 조치도 없습니다" },
      { en: "A teacher notices eventually and might call", ko: "선생님이 뒤늦게 알아차리고 연락드릴 수도 있습니다" },
      { en: "Front desk checks attendance and calls the parent same day", ko: "프론트에서 출결을 확인하고 당일 학부모님께 연락드립니다" },
      { en: "An automatic absence alert goes to the parent immediately", ko: "결석 시 학부모님께 자동으로 알림이 즉시 전송됩니다" },
    ) },
  { id: "q5", pillarId: "operations",
    prompt: { en: "How is attendance tracked?", ko: "출결은 어떻게 관리하고 계신가요?" },
    options: opts(
      { en: "Paper sign-in sheets", ko: "종이 출석부에 서명하는 방식입니다" },
      { en: "A spreadsheet updated manually", ko: "스프레드시트에 수기로 입력합니다" },
      { en: "A dedicated attendance app", ko: "전용 출결 관리 앱을 사용합니다" },
      { en: "Automated, with real-time alerts to parents", ko: "자동으로 기록되고 학부모님께 실시간 알림이 갑니다" },
    ) },
  { id: "q6", pillarId: "operations",
    prompt: { en: "How are class schedules and makeup classes managed?", ko: "수업 시간표와 보강 수업은 어떻게 관리하시나요?" },
    options: opts(
      { en: "Phone calls and manual rebooking", ko: "전화로 일일이 다시 잡습니다" },
      { en: "A shared calendar or spreadsheet", ko: "공유 캘린더나 스프레드시트를 사용합니다" },
      { en: "Scheduling software", ko: "전용 스케줄링 소프트웨어를 사용합니다" },
      { en: "Self-service booking with automatic conflict resolution", ko: "학부모님이 직접 예약하고 시간 충돌은 자동으로 조정됩니다" },
    ) },
  { id: "q7", pillarId: "operations",
    prompt: { en: "How is tuition billing and payment tracking handled?", ko: "수강료 청구와 납부 관리는 어떻게 하고 계신가요?" },
    options: opts(
      { en: "Manual invoicing or cash, tracked on paper or memory", ko: "수기 청구서나 현금으로, 종이나 기억에 의존해 관리합니다" },
      { en: "Spreadsheet tracking with manual reminders", ko: "스프레드시트로 관리하고 리마인더도 직접 보냅니다" },
      { en: "Billing software with automated reminders", ko: "청구 소프트웨어를 사용하고 리마인더는 자동으로 갑니다" },
      { en: "Fully automated billing tied to attendance/enrollment", ko: "출결·등록 현황과 연동되어 청구가 완전히 자동화되어 있습니다" },
    ) },
  { id: "q8", pillarId: "marketing",
    prompt: { en: "How do new families typically find and choose your hagwon?", ko: "신규 학부모님들은 보통 어떻게 우리 학원을 알고 등록을 결정하시나요?" },
    options: opts(
      { en: "Word of mouth and walk-ins only", ko: "입소문과 방문 상담이 전부입니다" },
      { en: "Flyers or local ads, plus word of mouth", ko: "전단지나 지역 광고, 그리고 입소문입니다" },
      { en: "Active Instagram or Naver Blog presence", ko: "인스타그램이나 네이버 블로그를 활발히 운영합니다" },
      { en: "A content and referral system that consistently drives inquiries", ko: "콘텐츠와 추천 시스템을 통해 꾸준히 문의가 들어옵니다" },
    ) },
  { id: "q9", pillarId: "marketing",
    prompt: { en: "What happens when a parent inquires but doesn't enroll right away?", ko: "상담만 받고 바로 등록하지 않은 학부모님께는 어떻게 하시나요?" },
    options: opts(
      { en: "We usually don't follow up", ko: "대부분 별도로 연락드리지 않습니다" },
      { en: "Occasional manual follow-up, if someone remembers", ko: "생각나면 가끔 연락드리는 정도입니다" },
      { en: "A checklist or process for follow-up", ko: "후속 연락을 위한 체크리스트나 절차가 있습니다" },
      { en: "An automated, personalized follow-up sequence", ko: "자동화된 맞춤형 후속 연락 시퀀스가 있습니다" },
    ) },
  { id: "q10", pillarId: "teaching",
    prompt: { en: "How is material adjusted for a struggling vs. advanced student in the same class?", ko: "같은 반 안에서 학습이 부진한 학생과 우수한 학생의 교재는 어떻게 다르게 적용하시나요?" },
    options: opts(
      { en: "It isn't — everyone gets the same material", ko: "따로 구분하지 않고 모두 같은 교재를 사용합니다" },
      { en: "Teachers adjust informally, based on judgment", ko: "선생님이 그때그때 판단해서 조절합니다" },
      { en: "We have leveled materials or tracks", ko: "레벨별 교재나 트랙이 마련되어 있습니다" },
      { en: "Materials are actively tailored per student using performance data", ko: "학생별 성취도 데이터를 바탕으로 교재를 적극적으로 맞춤화합니다" },
    ) },
  { id: "q11", pillarId: "teaching",
    prompt: { en: "If a parent asked exactly how much their child's English level has improved this year, could you show them a number?", ko: "학부모님이 올해 자녀의 영어 실력이 정확히 얼마나 향상되었는지 물어보신다면, 구체적인 수치로 보여드릴 수 있나요?" },
    options: opts(
      { en: "We don't track this formally", ko: "따로 공식적으로 추적하지 않습니다" },
      { en: "Teachers keep informal notes", ko: "선생님이 비공식적으로 메모해 둡니다" },
      { en: "We have a standard testing/leveling system", ko: "정기적인 테스트나 레벨 측정 시스템이 있습니다" },
      { en: "Proficiency is tracked continuously and shown to parents in concrete terms", ko: "실력을 지속적으로 추적하고 구체적인 수치로 학부모님께 보여드립니다" },
    ) },
  { id: "q12", pillarId: "teaching",
    prompt: { en: "Do your teachers use any AI tools for lesson prep, grading, or feedback?", ko: "선생님들이 수업 준비, 채점, 피드백에 AI 도구를 사용하고 계신가요?" },
    options: opts(
      { en: "No, everything is done manually", ko: "아니요, 모두 수작업으로 합니다" },
      { en: "A teacher or two experiments on their own", ko: "한두 명이 개인적으로 시도해 보는 정도입니다" },
      { en: "Some tools are used team-wide, informally", ko: "일부 도구를 팀 전체가 비공식적으로 사용합니다" },
      { en: "AI tools are a standard, expected part of the workflow", ko: "AI 도구가 업무의 표준적인 일부로 자리 잡았습니다" },
    ) },
  { id: "q13", pillarId: "data",
    prompt: { en: "If you needed a student's scores, attendance, and notes all at once, where would you have to look?", ko: "한 학생의 성적, 출결, 특이사항을 한 번에 확인해야 한다면, 어디를 봐야 하나요?" },
    options: opts(
      { en: "Paper files", ko: "종이 서류로 보관합니다" },
      { en: "Scattered across each teacher's own spreadsheet or notebook", ko: "선생님마다 각자의 스프레드시트나 노트에 흩어져 있습니다" },
      { en: "One shared system, though not fully used", ko: "공유 시스템이 하나 있지만 완전히 활용되지는 않습니다" },
      { en: "One central system everyone updates and can query", ko: "모두가 업데이트하고 조회할 수 있는 하나의 중앙 시스템이 있습니다" },
    ) },
  { id: "q14", pillarId: "data",
    prompt: { en: "If you needed a list of every student whose performance dropped this month, how hard would that be?", ko: "이번 달 성적이 떨어진 학생 명단을 뽑아야 한다면, 얼마나 어려울까요?" },
    options: opts(
      { en: "Nearly impossible without a lot of manual digging", ko: "수작업으로 일일이 찾아야 해서 거의 불가능합니다" },
      { en: "Possible, but very time-consuming", ko: "가능은 하지만 시간이 매우 많이 걸립니다" },
      { en: "Doable within a day", ko: "하루 정도면 정리할 수 있습니다" },
      { en: "A few clicks", ko: "몇 번 클릭이면 바로 나옵니다" },
    ) },
  { id: "q15", pillarId: "staff",
    prompt: { en: "When a new tool or process is introduced, how does staff typically respond?", ko: "새로운 도구나 프로세스를 도입할 때 직원들은 보통 어떻게 반응하시나요?" },
    options: opts(
      { en: "Resistance or reluctance to change", ko: "변화에 저항하거나 꺼려합니다" },
      { en: "Mixed, depending on the person", ko: "사람에 따라 반응이 다릅니다" },
      { en: "Generally open, if it's shown to help", ko: "도움이 된다고 보여지면 대체로 열려 있습니다" },
      { en: "Staff proactively suggest and adopt new tools", ko: "직원들이 먼저 새로운 도구를 제안하고 적극적으로 도입합니다" },
    ) },
  { id: "q16", pillarId: "staff",
    prompt: { en: "Who is responsible for exploring new technology or AI tools at your hagwon?", ko: "학원에서 새로운 기술이나 AI 도구를 살펴보는 일은 누구의 역할인가요?" },
    options: opts(
      { en: "No one — it isn't really anyone's job", ko: "딱히 담당자가 없습니다" },
      { en: "Me (the director), whenever I find time", ko: "원장인 제가 시간 날 때마다 합니다" },
      { en: "A staff member has informal ownership of it", ko: "직원 한 명이 비공식적으로 맡고 있습니다" },
      { en: "It's a defined part of someone's role", ko: "특정 직원의 정식 업무 역할로 정해져 있습니다" },
    ) },
];
