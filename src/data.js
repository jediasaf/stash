// SAMPLE DATA ONLY. Everything in this file was written for the prototype and is labelled as sample in the UI.
// Real user data lives in the store (store.js) and never mixes with these records.

/**
 * @typedef {{id:string,name:string}} Skill
 * @typedef {{id:string,skill:string,title:string,link:string,note:string,date:string,kind:'project'}} Evidence   self-submitted, unverified
 * @typedef {{id:string,title:string,body:string[],try:string}} Idea
 * @typedef {{id:string,title:string,topic:string,minutes:number,outcomes:string[],skills:string[],ideas:Idea[],quiz:{q:string,options:string[],answer:number,why:string},sample:true}} Course
 * @typedef {{id:string,text:string,skill:string,must:boolean}} Requirement
 * @typedef {{id:string,title:string,employer:string,location:string,mode:string,requirements:Requirement[],sample:true,source:string,posted:null|string}} Job
 * @typedef {{n:number,heading:string,text:string,flag:null|'scanned'|'table',include:boolean,example?:string}} DocPage
 * @typedef {{id:string,title:string,name:string,size:number,pages:DocPage[],sample:boolean,extractor:'pdfjs'|'sample'|'none',addedAt:string,keepText:boolean}} Document
 * @typedef {{speaker:'A'|'B',text:string,kind:'source'|'added',page?:number,emph?:boolean}} Segment
 * @typedef {{id:string,docId:string,config:object,segments:Segment[],pron:{from:string,to:string}[],approved:boolean}} Script
 * @typedef {{id:string,key:string,scriptId:string,status:'running'|'failed'|'cancelled'|'done',stage:number,progress:number,attempts:number,error:null|string,episodeId:null|string}} ConversionJob
 * @typedef {{id:string,title:string,kind:'generated'|'sample'|'course',segments:(Segment&{t:number,d:number})[],duration:number,docId?:string,scriptId?:string,format?:string,jobKey?:string}} Episode
 */

export const SKILLS = {
  policy: 'Trust & Safety policy', ml: 'Detection models', forecasting: 'Forecasting', sql: 'SQL', python: 'Python', communication: 'Stakeholder communication',
  excel: 'Spreadsheet modelling', inventory: 'Inventory planning', cloud: 'Cloud deployment', apis: 'Working with APIs',
};
export const TOPICS = ['Trust & Safety', 'Data', 'Careers', 'Communication', 'Technology', 'Operations'];
export const ROLES = ['Trust & Safety Data Scientist', 'Supply Chain Analyst', 'Demand Planner', 'Solutions Engineer'];

/** @type {Course[]} */
export const COURSES = [
  {
    id: 'detect', title: 'Detection that holds up', topic: 'Trust & Safety', minutes: 10, sample: true, skills: ['ml'],
    outcomes: ['Choose between precision and recall on purpose', 'Account for how rare harmful content is', 'Send the right items to human review first'],
    ideas: [
      { id: 'x1', title: 'Pick your error on purpose', body: ['Every detector trades missed harm against wrongly actioned content. Precision tells you how often an action was right; recall tells you how much of the harm you caught.', 'Decide which mistake is worse for this policy before tuning anything. Auto-removal needs high precision; a review queue can live with lower.'], try: 'For one policy area, write down which mistake costs more and why.' },
      { id: 'x2', title: 'Rare things fool accuracy', body: ['If one item in a thousand violates policy, a model that flags nothing is 99.9% accurate and useless.', 'Report precision and recall on the violating class, and say what share of traffic it is.'], try: 'Find the base rate of one violation type in last week\'s data.' },
      { id: 'x3', title: 'Rank the queue, do not just fill it', body: ['Reviewers have fixed hours. Sorting the queue by likely severity and reach matters as much as the classifier itself.', 'Measure how fast the worst items get a decision, not only how many items get one.'], try: 'Compare median time to decision for your highest-severity items and for everything else.' },
    ],
    quiz: { q: 'One item in a thousand violates policy. A model never flags anything. What is true?', options: ['It is 99.9% accurate and fit for use', 'It is 99.9% accurate and catches none of the harm', 'Its precision is 99.9%'], answer: 1, why: 'Accuracy is dominated by the safe majority. Recall on the violating class is zero.' },
  },
  {
    id: 'policy', title: 'Writing policy people can enforce', topic: 'Trust & Safety', minutes: 9, sample: true, skills: ['policy'],
    outcomes: ['Define the harm, not just the words', 'Give reviewers examples on both sides of the line', 'Record edge cases as they come up'],
    ideas: [
      { id: 'p1', title: 'Name the harm first', body: ['A rule that lists banned words will be both too wide and too narrow. The same word can be a slur, a quote, or someone reclaiming it.', 'Start the policy with the harm you are preventing. Reviewers can then reason about cases the wording never anticipated.'], try: 'Rewrite one rule so its first sentence names the harm it prevents.' },
      { id: 'p2', title: 'Show both sides of the line', body: ['Reviewers learn the boundary from examples, not definitions. One clear violation and one near miss teach more than a paragraph.', 'Pair every example with the reason it falls where it does.'], try: 'For one rule, write one example that breaks it and one that comes close but does not.' },
      { id: 'p3', title: 'Keep an edge-case log', body: ['Disagreements between reviewers are signals, not noise. Each one marks a place where the policy is unclear.', 'Log them with the decision taken, and fold the pattern back into the guidelines.'], try: 'Find two cases from last week where reviewers disagreed and write down why.' },
    ],
    quiz: { q: 'Why start a policy with the harm it prevents?', options: ['It makes the document shorter', 'Reviewers can reason about cases the wording did not foresee', 'It removes the need for examples'], answer: 1, why: 'Wording can never list every case. A stated purpose lets reviewers judge new ones consistently.' },
  },
  {
    id: 'triage', title: 'Triage when the queue is full', topic: 'Trust & Safety', minutes: 8, sample: true, skills: ['policy'],
    outcomes: ['Rank by severity and reach', 'Track time to action for the worst items', 'Escalate on clear triggers'],
    ideas: [
      { id: 't1', title: 'Severity times reach', body: ['A severe item seen by three people and a mild item seen by a million can both be urgent. Neither number alone sets the order.', 'Score both, and let the combination decide what a reviewer opens next.'], try: 'Sort today\'s queue by severity and by views. Note which items move most.' },
      { id: 't2', title: 'Watch the worst, not the average', body: ['Average handling time hides the cases that matter. A queue can look healthy while its most serious items wait for hours.', 'Report time to action for the highest-severity band separately.'], try: 'Calculate median time to action for your top severity band only.' },
      { id: 't3', title: 'Write escalation triggers down', body: ['When escalation depends on judgement alone, it varies by shift and by person.', 'List the signals that always escalate, such as risk to life or a minor involved, so nobody has to decide under pressure.'], try: 'Write three triggers that should always escalate, and who receives them.' },
    ],
    quiz: { q: 'What is the problem with reporting only average handling time?', options: ['It is hard to calculate', 'It can hide long waits for the most severe items', 'It overstates how busy reviewers are'], answer: 1, why: 'A healthy average can coexist with slow handling of the cases that cause the most harm.' },
  },
  {
    id: 'sqlts', title: 'SQL for enforcement data', topic: 'Data', minutes: 10, sample: true, skills: ['sql'],
    outcomes: ['Count items and decisions, not raw rows', 'Measure how often appeals overturn actions', 'Find repeat behaviour over time'],
    ideas: [
      { id: 'q1', title: 'Count the right thing', body: ['One item can be reported many times. Counting report rows inflates volume and hides what reviewers actually decided.', 'Use COUNT(DISTINCT item_id) for items, and count decisions from the actions table.'], try: 'Compare COUNT(*) with COUNT(DISTINCT item_id) on one week of reports.' },
      { id: 'q2', title: 'Join appeals to actions', body: ['The share of actions overturned on appeal is a quality signal. A rising rate points at a rule, a detector or a team that needs a look.', 'Left-join appeals to actions, then divide overturned appeals by actions taken.'], try: 'Calculate last month\'s overturn rate for one policy area.' },
      { id: 'q3', title: 'Use window functions for repeat behaviour', body: ['LAG and COUNT() OVER (PARTITION BY account_id ORDER BY created_at) show how often the same account comes back.', 'This finds repeat violators without a slow self-join.'], try: 'List accounts with three or more actions inside thirty days.' },
    ],
    quiz: { q: 'Many reports can point at one item. How do you count items reported?', options: ['COUNT(*) on the reports table', 'COUNT(DISTINCT item_id)', 'SUM(report_id)'], answer: 1, why: 'DISTINCT collapses duplicate reports so each item counts once.' },
  },
  {
    id: 'evasion', title: 'Thinking like an evader', topic: 'Trust & Safety', minutes: 8, sample: true, skills: ['ml'],
    outcomes: ['Expect spelling tricks', 'Look at networks, not single accounts', 'Re-measure after every launch'],
    ideas: [
      { id: 'v1', title: 'Words get disguised', body: ['Swapped letters, extra spaces and look-alike characters exist to slip past keyword rules.', 'Normalise text before matching, and test detectors on disguised examples as well as clean ones.'], try: 'Write five disguised spellings of one blocked term and test your rule against them.' },
      { id: 'v2', title: 'One account is rarely the story', body: ['Coordinated groups spread a task across many accounts so none looks unusual alone.', 'Shared signals such as creation time, device or posting rhythm reveal the group.'], try: 'Pick one flagged account and list three signals you could use to find its neighbours.' },
      { id: 'v3', title: 'Launching a rule changes behaviour', body: ['Once a rule bites, people adapt. Last month\'s precision says little about next month.', 'Schedule a re-measurement after every launch instead of treating evaluation as one-off.'], try: 'Set a date to re-check one detector you shipped recently.' },
    ],
    quiz: { q: 'Why re-measure a detector after it launches?', options: ['Evaders adapt once a rule starts working', 'Models get slower over time', 'Precision only matters before launch'], answer: 0, why: 'Behaviour shifts in response to enforcement, so earlier evaluation goes stale.' },
  },
  {
    id: 'forecasting', title: 'Forecasting fundamentals', topic: 'Data', minutes: 12, sample: true, skills: ['forecasting'],
    outcomes: ['Set a baseline before building a model', 'Test on periods the model has not seen', 'Report error in units the business uses'],
    ideas: [
      { id: 'f1', title: 'Start with a baseline', body: ['Before any model, write down the simplest forecast you can: last month repeated, or the same month last year.', 'Every later model has to beat that number. If it cannot, the extra complexity is cost without benefit.'], try: 'Take one product. Forecast next month as "same as last month". Keep that number.' },
      { id: 'f2', title: 'Respect time', body: ['A forecast is a claim about periods you have not seen. So test it the same way: train on the past, score on the months that came after.', 'Shuffling rows before splitting leaks the future into training and makes every model look better than it is.'], try: 'Hold out your last three months. Score the baseline on them only.' },
      { id: 'f3', title: 'Measure what the business feels', body: ['Percentage errors explode on small numbers and hide big misses on big ones.', 'Weight errors by volume, and say them in units: "we were 400 cases short in March" lands better than "MAPE was 18%".'], try: 'Rewrite one accuracy number as units over or under.' },
      { id: 'f4', title: 'Explain the misses', body: ['A number without a reason does not change a decision. Sort your errors and read the ten worst.', 'Most have a cause you can name: a promotion, a stock-out, a new customer. Name it next to the number.'], try: 'List your three largest misses and one likely cause for each.' },
    ],
    quiz: { q: 'Which comparison between two forecast models is fair?', options: ['Each model scored on the months it fits best', 'Both models scored on the same later months that neither was trained on', 'Both models scored on their training data'], answer: 1, why: 'Only the same unseen, later periods tell you how each model would have done in real use.' },
  },
  {
    id: 'decisions', title: 'From data to decisions', topic: 'Communication', minutes: 8, sample: true, skills: ['communication'],
    outcomes: ['Open with the decision, not the method', 'Show one example before the aggregate', 'State uncertainty plainly'],
    ideas: [
      { id: 'd1', title: 'Lead with the decision', body: ['Your reader wants to know what to do. Put that in the first sentence.', 'Method and caveats come after, for the people who need them.'], try: 'Rewrite your last update so the first line is the recommendation.' },
      { id: 'd2', title: 'One example first', body: ['An average is hard to picture. One real case is easy.', 'Show a single order, customer or week, then widen to the total.'], try: 'Pick one row that tells the story and put it first.' },
      { id: 'd3', title: 'Say how sure you are', body: ['"Probably" means different things to different people. Give a range instead.', 'A range invites a plan B. A single number invites blame.'], try: 'Replace one point estimate with a low and a high.' },
    ],
    quiz: { q: 'What should come first in an update to a manager?', options: ['How the data was cleaned', 'The recommended decision', 'A chart of every metric'], answer: 1, why: 'The decision is what the reader acts on. Everything else supports it.' },
  },
  {
    id: 'sql', title: 'SQL that stays fast', topic: 'Data', minutes: 10, sample: true, skills: ['sql'],
    outcomes: ['Filter early', 'Read a query plan', 'Know when an index helps'],
    ideas: [
      { id: 's1', title: 'Filter before you join', body: ['Joining two large tables and filtering afterwards moves far more rows than needed.', 'Cut each table down to the rows you need first.'], try: 'Find a slow query and move its WHERE clause inside a subquery or CTE.' },
      { id: 's2', title: 'Read the plan', body: ['EXPLAIN shows what the database will do. Look for full scans on big tables.', 'One scan in the wrong place usually explains most of the wait.'], try: 'Run EXPLAIN on one query and find the largest scan.' },
      { id: 's3', title: 'Index what you filter on', body: ['An index helps when you look up a small share of rows by a column.', 'It does not help when you read most of the table anyway.'], try: 'List the columns in your most common WHERE clauses.' },
    ],
    quiz: { q: 'When does an index help most?', options: ['When reading nearly every row', 'When selecting a small share of rows by the indexed column', 'When the table has three rows'], answer: 1, why: 'Indexes speed up selective lookups. Full reads ignore them.' },
  },
  {
    id: 'inventory', title: 'Safety stock without the folklore', topic: 'Operations', minutes: 9, sample: true, skills: ['inventory'],
    outcomes: ['Link safety stock to forecast error', 'Separate lead-time risk from demand risk', 'Review by item class'],
    ideas: [
      { id: 'i1', title: 'Stock covers error, not demand', body: ['Cycle stock covers what you expect to sell. Safety stock covers how wrong you might be.', 'So its size should follow forecast error, not sales volume.'], try: 'Compare safety stock with forecast error for five items.' },
      { id: 'i2', title: 'Two risks, two numbers', body: ['Late supply and surprise demand are different problems.', 'Measure them apart, then combine.'], try: 'Write down lead-time spread for one supplier.' },
      { id: 'i3', title: 'Not every item earns the same care', body: ['A few items carry most of the value. Give them tighter review.', 'The long tail can run on simple rules.'], try: 'Rank items by annual value and mark the top fifth.' },
    ],
    quiz: { q: 'What should safety stock scale with?', options: ['Sales volume', 'Forecast error and lead-time spread', 'Warehouse size'], answer: 1, why: 'It exists to absorb uncertainty, so it follows the size of that uncertainty.' },
  },
];

/** @type {Job[]} */
export const JOBS = [
  { id: 'tsds', title: 'Trust & Safety Data Scientist', employer: 'Sample employer D', location: 'Singapore', mode: 'Hybrid', sample: true, source: 'Sample data, not a live posting', posted: null,
    requirements: [
      { id: 'r1', text: 'Query enforcement and reporting data with SQL', skill: 'sql', must: true },
      { id: 'r2', text: 'Analyse trends and build prototypes in Python', skill: 'python', must: true },
      { id: 'r3', text: 'Build and evaluate harmful-content detection models', skill: 'ml', must: true },
      { id: 'r4', text: 'Translate platform policy into measurable signals', skill: 'policy', must: true },
      { id: 'r5', text: 'Present findings to policy and operations teams', skill: 'communication', must: false },
    ] },
  { id: 'sca', title: 'Supply Chain Analyst', employer: 'Sample employer A', location: 'Singapore', mode: 'Hybrid', sample: true, source: 'Sample data, not a live posting', posted: null,
    requirements: [
      { id: 'r1', text: 'Build and maintain demand forecasts', skill: 'forecasting', must: true },
      { id: 'r2', text: 'Query large datasets with SQL', skill: 'sql', must: true },
      { id: 'r3', text: 'Present findings to planners and managers', skill: 'communication', must: true },
      { id: 'r4', text: 'Set safety stock and reorder points', skill: 'inventory', must: false },
      { id: 'r5', text: 'Automate reports with Python', skill: 'python', must: false },
    ] },
  { id: 'dp', title: 'Demand Planner', employer: 'Sample employer B', location: 'Singapore', mode: 'On-site', sample: true, source: 'Sample data, not a live posting', posted: null,
    requirements: [
      { id: 'r1', text: 'Own the monthly demand plan', skill: 'forecasting', must: true },
      { id: 'r2', text: 'Model scenarios in spreadsheets', skill: 'excel', must: true },
      { id: 'r3', text: 'Run the demand review meeting', skill: 'communication', must: true },
      { id: 'r4', text: 'Balance stock against service level', skill: 'inventory', must: false },
    ] },
  { id: 'ase', title: 'Associate Solutions Engineer', employer: 'Sample employer C', location: 'Remote (SEA)', mode: 'Remote', sample: true, source: 'Sample data, not a live posting', posted: null,
    requirements: [
      { id: 'r1', text: 'Integrate customer systems through APIs', skill: 'apis', must: true },
      { id: 'r2', text: 'Write Python for data pipelines', skill: 'python', must: true },
      { id: 'r3', text: 'Deploy services to a cloud platform', skill: 'cloud', must: true },
      { id: 'r4', text: 'Explain technical trade-offs to customers', skill: 'communication', must: false },
    ] },
];

const seg = (speaker, text, kind = 'added', page) => ({ speaker, text, kind, page });
/** Sample episodes. No recorded audio exists; playback reads these lines with the device voice. */
export const SAMPLE_EPISODES = [
  { id: 'ep-recall', title: 'Precision, recall and the review queue', kind: 'sample', topic: 'Trust & Safety', by: 'Sample show written for this prototype',
    lines: [seg('A', 'Today: two numbers every detection team argues about.'), seg('B', 'Precision and recall.'), seg('A', 'Precision is how often the thing you actioned really broke the rule.'), seg('B', 'Recall is how much of the bad content you actually caught.'), seg('A', 'You rarely get both. So decide which mistake hurts more for this policy before you tune anything.'), seg('B', 'And remember the review queue: a lower-precision model is fine if people check its flags first.')] },
  { id: 'ep-baseline', title: 'Why a baseline comes first', kind: 'sample', topic: 'Data', by: 'Sample show written for this prototype',
    lines: [seg('A', 'Today, one habit that saves forecasting projects: the baseline.'), seg('B', 'Meaning the dumbest forecast that could possibly work.'), seg('A', 'Exactly. Last month, repeated. If your model cannot beat that, you have learned something useful and cheap.'), seg('B', 'And if it does beat it, you can say by how much, in units.'), seg('A', 'Which is the number a planner can act on.'), seg('B', 'So step one this week: write the baseline down before touching a model.')] },
  { id: 'ep-updates', title: 'Crafting updates people read to the end', kind: 'sample', topic: 'Communication', by: 'Sample show written for this prototype',
    lines: [seg('A', 'Most status updates bury the decision in paragraph four.'), seg('A', 'Move it to line one. Then give a single example. Then the range you are unsure about.'), seg('A', 'Three lines, and the reader knows what to do.')] },
];

const P = (n, heading, text, o = {}) => ({ n, heading, text, flag: null, include: true, ...o });
/** @type {Document} */
export const SAMPLE_DOC = {
  id: 'doc-sample', title: 'Measuring moderation', name: 'Measuring-moderation.pdf', size: 1622016, sample: true, extractor: 'sample', addedAt: '2026-10-20', keepText: true,
  pages: [
    P(1, 'Measuring moderation', 'A short primer for trust and safety teams. It covers prevalence, precision and recall, appeals, and how to explain a change in the numbers.'),
    P(2, 'Start with prevalence', 'Prevalence is the share of content people see that breaks a policy. It describes the user experience better than the number of items removed.', { example: 'For example, removing more posts can mean the problem grew, not that enforcement improved.' }),
    P(3, 'Removals are not the goal', 'A rise in removals can come from more harm, better detection or a wider rule. Report removals next to prevalence so readers can tell which.'),
    P(4, 'Precision and recall', 'Precision is the share of actions that were correct. Recall is the share of violating content that was caught. Raising one usually lowers the other.'),
    P(5, 'Choose the error on purpose', 'Automatic removal needs high precision because mistakes reach users directly. A review queue can accept lower precision because people check each flag.', { example: 'In practice that means one threshold for auto-action and a lower one for sending items to reviewers.' }),
    P(6, 'Appeals as a quality signal', 'The share of actions overturned on appeal shows where rules or detectors are unclear. Track it by policy area, not only in total.'),
    P(7, '', '', { flag: 'scanned', include: false }),
    P(8, 'Overturn rate by policy area', 'Spam 3 4 3 5 Harassment 11 9 12 10 Misinformation 18 21 17 19 Total 9 9 8 9', { flag: 'table', include: false }),
    P(9, 'Explaining a change', 'When a number moves, check three things first: a policy change, a detector change and a change in the traffic itself.'),
    P(10, 'Reviewer agreement', 'If reviewers disagree on the same item, the policy is unclear. Agreement rates point at the guidelines that need examples.'),
    P(11, 'A monthly routine', 'Each month, compare prevalence with removals, read the most overturned decisions, and change one thing at a time.'),
    P(12, 'References', 'Further reading.', { include: false }),
  ],
};

export const P2P_DEFAULTS = { format: 'duo', treatment: 'detailed', language: 'en', minutes: 10, voiceA: 'af_heart', voiceB: 'am_michael', focus: ['Key ideas', 'Examples'], note: '', quality: 'high' };
export const P2P_LIMITS = { mb: 25, pages: 200 };
export const STAGES = ['Loading the voice', 'Rendering voices', 'Timing the transcript', 'Saving the episode'];

/** Integration boundaries. Each entry says what runs today and what a live build needs. */
export const PROVIDERS = [
  ['Accounts', 'Demo sign-in on this device. Sync uses a private code instead of a password.', 'Auth service with email reset.'],
  ['PDF text extraction', 'Live in the browser with pdf.js. The file is never uploaded.', 'Server extraction for very large files.'],
  ['OCR for scanned pages', 'Not connected. Pages can be typed in or excluded.', 'OCR provider behind the server.'],
  ['Script writing', 'Template that quotes sentences from your pages. No language model, by decision.', 'Optional LLM step, key kept server-side.'],
  ['Voice rendering', 'Live on the device: Kokoro-82M via kokoro-js, about 90 MB downloaded once.', 'Server rendering for slow phones.'],
  ['Job listings', 'Live from MyCareersFuture through /api/jobs, plus four samples.', 'More sources and saved searches.'],
  ['Sync', 'Live: AES-GCM encrypted on the device, stored in a private Vercel Blob store through /api/sync.', 'Accounts with recovery.'],
  ['Resume reading', 'PDF read in the browser; skill keywords suggested, you confirm each. DOCX not read.', 'Server parser for DOCX and scanned resumes.'],
];

/** Short skill checks. Passing records "Passed skill check": a recall-level check written for the prototype, not a certification. */
export const CHECK_PASS = 3;
export const CHECKS = {
  sql: [
    { q: 'Which clause filters rows after GROUP BY has aggregated them?', options: ['WHERE', 'HAVING', 'ORDER BY'], answer: 1 },
    { q: 'A LEFT JOIN from actions to appeals returns what for actions with no appeal?', options: ['Nothing; those actions are dropped', 'The action, with NULL appeal columns', 'An error'], answer: 1 },
    { q: 'What does COUNT(DISTINCT item_id) count?', options: ['Every row', 'Each item once, however many rows mention it', 'Only items with no duplicates'], answer: 1 },
    { q: 'Which gives a running count per account without a self-join?', options: ['COUNT(*) OVER (PARTITION BY account_id ORDER BY created_at)', 'GROUP BY created_at', 'SELECT DISTINCT account_id'], answer: 0 },
  ],
  python: [
    { q: 'In pandas, what does df.groupby("policy")["item_id"].nunique() return?', options: ['The number of rows per policy', 'The number of distinct items per policy', 'The first item per policy'], answer: 1 },
    { q: 'Which is a list comprehension?', options: ['[x * 2 for x in values]', '{x: 2}', 'lambda x: x * 2'], answer: 0 },
    { q: 'What does "with open(path) as f:" make sure of?', options: ['The file is closed when the block ends', 'The file is read faster', 'The file is created if missing'], answer: 0 },
    { q: 'df[df["score"] > 0.9] returns what?', options: ['A boolean', 'Rows where score is above 0.9', 'The column named score'], answer: 1 },
  ],
  ml: [
    { q: 'A detector flags 100 items and 80 truly violate policy. What is its precision?', options: ['20%', '80%', 'It cannot be known'], answer: 1 },
    { q: 'Raising a classifier\'s decision threshold usually does what?', options: ['Raises precision and lowers recall', 'Raises both', 'Lowers both'], answer: 0 },
    { q: 'Why is accuracy misleading when violations are rare?', options: ['A model that flags nothing scores highly', 'Accuracy ignores the safe majority', 'Accuracy needs labelled data'], answer: 0 },
    { q: 'Why evaluate on data from after the training period?', options: ['It is faster', 'Behaviour changes, and the model must work on new content', 'Older data has no labels'], answer: 1 },
  ],
  policy: [
    { q: 'What should a policy state first?', options: ['A list of banned words', 'The harm it prevents', 'The penalty'], answer: 1 },
    { q: 'Reviewers keep disagreeing on one kind of case. What does that suggest?', options: ['Reviewers need replacing', 'The policy is unclear there and needs examples', 'The case should be ignored'], answer: 1 },
    { q: 'Which measure best reflects what users actually see?', options: ['Number of removals', 'Prevalence of violating content', 'Number of reports'], answer: 1 },
    { q: 'What is a rising appeal-overturn rate a sign of?', options: ['Users appealing too often', 'Possible problems with a rule or detector', 'Better enforcement'], answer: 1 },
  ],
  communication: [
    { q: 'What belongs in the first line of an update to a busy manager?', options: ['How the data was cleaned', 'The decision or recommendation', 'Every metric you tracked'], answer: 1 },
    { q: 'Why show one concrete example before an aggregate?', options: ['It is easier to picture', 'It hides the total', 'It replaces the data'], answer: 0 },
    { q: 'What is the better way to state uncertainty?', options: ['"Probably"', 'A range, such as 40 to 60', 'Leaving it out'], answer: 1 },
    { q: 'A policy team asks why removals rose. What do you check first?', options: ['Policy, detector and traffic changes', 'Reviewer headcount only', 'Nothing; more removals is good'], answer: 0 },
  ],
};
