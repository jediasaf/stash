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
  { id: 'ep-baseline', title: 'Why a baseline comes first', kind: 'sample', topic: 'Data', by: 'Sample show written for this prototype',
    lines: [seg('A', 'Today, one habit that saves forecasting projects: the baseline.'), seg('B', 'Meaning the dumbest forecast that could possibly work.'), seg('A', 'Exactly. Last month, repeated. If your model cannot beat that, you have learned something useful and cheap.'), seg('B', 'And if it does beat it, you can say by how much, in units.'), seg('A', 'Which is the number a planner can act on.'), seg('B', 'So step one this week: write the baseline down before touching a model.')] },
  { id: 'ep-updates', title: 'Crafting updates people read to the end', kind: 'sample', topic: 'Communication', by: 'Sample show written for this prototype',
    lines: [seg('A', 'Most status updates bury the decision in paragraph four.'), seg('A', 'Move it to line one. Then give a single example. Then the range you are unsure about.'), seg('A', 'Three lines, and the reader knows what to do.')] },
];

const P = (n, heading, text, o = {}) => ({ n, heading, text, flag: null, include: true, ...o });
/** @type {Document} */
export const SAMPLE_DOC = {
  id: 'doc-sample', title: 'Forecasting essentials', name: 'Forecasting-essentials.pdf', size: 1843200, sample: true, extractor: 'sample', addedAt: '2026-10-10', keepText: true,
  pages: [
    P(1, 'Forecasting essentials', 'A short guide for planners. This guide covers baselines, validation over time, error measures and how to explain a miss.'),
    P(2, 'Use a baseline', 'Compare every model with a simple baseline such as last period repeated. A model earns its place only when it beats the baseline on unseen periods.', { example: 'For example, a canteen that sold 400 lunches last Monday can plan 400 for next Monday and then see if a model does better.' }),
    P(3, 'Choosing the baseline', 'Seasonal products need a seasonal baseline: the same month last year. Fast-moving items can use a moving average of the last three periods.'),
    P(4, 'What counts as unseen', 'Unseen periods are later than every period used in training. Random splits do not qualify because they mix future rows into the training set.'),
    P(5, 'Respect time', 'Use chronological holdouts. Train up to a cut-off date, forecast the following months, then roll the cut-off forward and repeat.', { example: 'In monthly demand planning that means training to June, scoring July to September, then training to July and scoring August to October.' }),
    P(6, 'Measure in units', 'Report error in the units the business orders in. Weight percentage errors by volume so small items do not dominate the result.'),
    P(7, '', '', { flag: 'scanned', include: false }),
    P(8, 'Error by item class', 'Class A 12 9 14 11 Class B 21 18 25 19 Class C 44 39 51 47 Total 19 16 22 18', { flag: 'table', include: false }),
    P(9, 'Explain the misses', 'Sort errors from largest to smallest and read the top ten. Most large misses have a cause that can be named: a promotion, a stock-out or a new customer.'),
    P(10, 'Bias', 'A forecast that is always high or always low is biased. Bias is easier to fix than noise because it points in one direction.'),
    P(11, 'A review routine', 'Each month, compare forecast with actuals, record the largest misses with a cause, and adjust one assumption at a time.'),
    P(12, 'References', 'Further reading and data sources.', { include: false }),
  ],
};

export const P2P_DEFAULTS = { format: 'duo', treatment: 'detailed', language: 'en', minutes: 10, voiceA: '', voiceB: '', focus: ['Key ideas', 'Examples'], note: '' };
export const P2P_LIMITS = { mb: 25, pages: 200 };
export const STAGES = ['Checking the approved script', 'Rendering voices', 'Timing the transcript', 'Saving the episode'];

/** Integration boundaries. Each entry says what runs today and what a live build needs. */
export const PROVIDERS = [
  ['Accounts', 'Demo: any valid email signs in on this device.', 'Auth service with email reset.'],
  ['PDF text extraction', 'Live in the browser with pdf.js. The file is never uploaded.', 'Server extraction for large files.'],
  ['OCR for scanned pages', 'Not connected. Pages can be typed in or excluded.', 'OCR provider behind the server.'],
  ['Script writing', 'Demo template: quotes sentences from your pages. No language model.', 'LLM endpoint, key kept server-side.'],
  ['Voice rendering', 'Demo: your device voice reads the script. No audio file is produced.', 'Text-to-speech provider, job queue, file storage.'],
  ['Job listings', 'Three sample listings.', 'Listings API with source and posting date.'],
  ['Resume reading', 'PDF read in the browser; skill keywords suggested, you confirm each. DOCX not read.', 'Server parser for DOCX and scanned resumes.'],
];
