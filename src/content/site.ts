import type { Book, Job, NavLink, Project } from './types'

/** All page copy lives here. Lines marked DRAFT need your own facts. */
export const site = {
  name: 'Thien Pham',
  localName: 'Phạm Hữu Thiên',
  brand: 'thienph',
  // Formal title first, then real scope: never claim a title you do not hold.
  role: 'Senior Data Engineer · ML team lead',
  year: 2026,
  email: 'thienph3@gmail.com' as string | undefined,
  github: 'https://github.com/thienph3',
  linkedin: 'https://www.linkedin.com/in/thienph3' as string | undefined,
  // Career identity (should stay true across jobs); the current job goes in the lead.
  headline: 'I build data and ML systems from zero to',
  headlineAccent: 'production',
  lead: 'I’m Thien Pham (Phạm Hữu Thiên). Since 2016 I have built data platforms, ML models and backend services, and at be, Koina and FE Credit I was the first one in. Today I am a senior data engineer at Vinamilk, leading a team of seven ML engineers.',
  now: ['now: chatbot, search, document AI and OCR', 'reading: The Colle System'],
  about: [
    'I started in software, writing C++ at FPT Software in 2016 and full-stack code at i3 Solution, then moved into data at GHN in 2018. At be I was the only data engineer at first and later moved into ML; after that I redesigned part of a customer data platform at Tiki, built a data team at Koina, led data engineering at MoMo and spent a year in backend at FE Credit.',
    'I judge roles by scope more than title. I have been a company’s only data engineer, a head of data with a team of ten, a data engineering lead and the owner of core backend services. The move to backend in 2023 was deliberate, to learn systems at real scale, and in 2025 I came back to data and ML at Vinamilk, where my title is Senior Data Engineer and day to day I lead a team of seven ML engineers.',
    'Side projects keep my product skills sharp, such as SpeakEng, a Flutter app that coaches English pronunciation with speech AI.',
    'Outside work I play chess and practise my English, and both have turned into projects.',
  ],
  skills: [
    // DRAFT: add the data and ML tools you use at work (warehouse, orchestration, cloud, LLM stack). A data hiring manager looks for these first.
    { label: 'Data & ML', items: ['Python', 'SQL', 'XGBoost', 'YOLO', 'OCR'] },
    { label: 'Product', items: ['TypeScript', 'React', 'Next.js', 'Flutter', 'Supabase'] },
  ],
  contactNote: 'Happy to talk about data, ML and building teams.',
}

export const navLinks: NavLink[] = [
  { label: 'About', href: '/#about' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Library', href: '/#library' },
  { label: 'Contact', href: '/#contact' },
]

/**
 * Work history, most recent first. Former employers' work: keep it at CV level (design and impact only;
 * no internal data, sources, features or images).
 */
export const experience: Job[] = [
  {
    company: 'Vinamilk',
    companyNote: 'Dairy, Vietnam',
    period: '2025 – now',
    role: 'Senior Data Engineer (formal title) · leads a team of seven ML engineers',
    highlights: [
      {
        title: 'Leading a team of seven ML engineers',
        // DRAFT: add one result each for document AI and OCR for retail, or a range if exact numbers are confidential.
        text: 'I joined as a data engineer and worked as an ML engineer on the chatbot and the search system. I now lead seven ML engineers across four projects: document AI, OCR for retail, the chatbot and search.',
        tags: ['Leadership', 'Document AI', 'OCR'],
      },
      {
        title: 'Chatbot answers in 5–7 seconds on average, down from 15–20',
        text: 'An LLM alone took 15–20 seconds on average to answer. I added ML models to the chatbot’s pipeline, and the average response time fell to about 5–7 seconds.',
        tags: ['Chatbot', 'LLM', 'ML'],
      },
      {
        title: 'Search ranking the business can tune',
        text: 'I built the backend that lets each business unit set the order of products in search results through configuration, ranked by its own metrics.',
        tags: ['Search', 'Ranking', 'Backend'],
      },
    ],
  },
  {
    company: 'FE Credit',
    companyNote: 'Consumer finance, Vietnam',
    period: '2023 – 2024',
    role: 'Senior Staff Backend Engineer',
    highlights: [
      {
        title: 'Owned two core services',
        text: 'I joined as the first backend engineer on the team and took over two core services: the one behind sales, and the eKYC service that verifies customers’ identity. I took the role to learn backend systems at real scale, and there is no faster way than owning them.',
        tags: ['Backend', 'eKYC', 'Service ownership'],
      },
    ],
  },
  {
    company: 'MoMo',
    companyNote: 'E-wallet and super app, Vietnam',
    period: '2022 – 2023',
    role: 'Data Engineering Lead',
    highlights: [
      {
        title: 'One event structure for every mini app',
        text: 'MoMo runs many mini apps inside one super app, and each tracked events its own way. I designed a standard event structure for all of them, so every internal user reads an event the same way. That was the real problem: a design problem, not a tooling one.',
        tags: ['Event design', 'Data modelling'],
      },
      {
        title: 'Funnel reporting on top of it',
        text: 'With the standard in place, my team of data engineers and analysts built an application for automatic reporting: internal users set up a mini app’s funnel with a few settings and follow users across their journey.',
        tags: ['Product analytics', 'Funnels', 'Leadership'],
      },
    ],
  },
  {
    company: 'Koina',
    companyNote: 'Startup building a digital marketplace for Vietnamese agriculture',
    period: '2021 – 2022',
    role: 'Head of Data',
    highlights: [
      {
        title: 'Built and led the data team',
        text: 'I left Tiki for the chance to build a data team from scratch. I hired and led it, grew it to ten people at its peak, and set its vision. Koina closed during COVID.',
        tags: ['Team of 10', 'Hiring', 'Leadership'],
      },
      {
        // DRAFT: replace with one concrete example (e.g. a metric or dashboard every team used).
        title: 'A data mindset for the company',
        text: 'Beyond the team, my job was to get the whole company working with data: helping teams ask questions the data could answer and make decisions with it.',
        tags: ['Data culture'],
      },
    ],
  },
  {
    company: 'Tiki',
    companyNote: 'E-commerce, Vietnam',
    period: '2021',
    role: 'Senior Software Engineer',
    highlights: [
      {
        title: 'Customer data platform redesign',
        text: 'Tiki’s customer data platform lets internal teams build audiences for their campaigns. In six months I redesigned its customer space into layers of filters. Metric queries now take 75% less time, because the SQL builder reads the raw tables O(n) times instead of O(n²).',
        tags: ['Data platform', 'SQL', 'CDP'],
        status: 'production',
      },
    ],
  },
  {
    company: 'be',
    companyNote: 'beGroup JSC, ride-hailing, Vietnam',
    period: '2018 – 2021',
    role: 'Senior Data Engineer, then Senior ML Engineer',
    highlights: [
      {
        title: 'Config-driven ELT platform',
        text: 'As the only data engineer at the start, I built a platform where one YAML file brings a new source into the warehouse. Every 15 minutes it appends what changed; views on top deduplicate and normalise it. New sources became quick to add, without a data engineer writing each pipeline.',
        tags: ['ELT', 'YAML', 'Data warehouse'],
        status: 'production',
      },
      {
        title: 'Trip dispatch model',
        text: 'My first ML project. be sent each ride to the three nearest drivers; with a senior data scientist, I built an XGBoost model to pick the drivers most likely to accept. It went live with better results.',
        tags: ['ML', 'XGBoost'],
        status: 'production',
      },
      {
        title: 'Driver ID card reader',
        text: 'A prototype to read drivers’ Vietnamese ID cards (CCCD): YOLO finds the card and each field, then OCR reads the text. It worked in the lab but was not released.',
        tags: ['Computer vision', 'YOLO', 'OCR'],
        status: 'prototype',
      },
    ],
  },
  {
    company: 'GHN',
    early: true,
    companyNote: 'Giao Hàng Nhanh, e-commerce delivery, Vietnam',
    period: '2018',
    role: 'Senior Data Engineer',
    highlights: [
      {
        title: 'What data a company needs as it scales',
        text: 'My first data engineering job, at one of Vietnam’s largest e-commerce delivery networks, in 2018, when data talent in the country was still scarce. GHN was scaling fast, and it showed me which data a company really needs as it grows.',
        tags: ['Data engineering', 'Logistics'],
      },
    ],
  },
  {
    company: 'i3 Solution',
    early: true,
    companyNote: 'Healthcare software, Vietnam',
    period: '2017',
    role: 'Senior Full-stack Developer',
    highlights: [
      {
        title: 'Thinking in whole products',
        text: 'The first time I owned a whole product rather than one small service: full-stack, on a healthcare system. I have built that way ever since.',
        tags: ['Full-stack', 'Healthcare'],
      },
    ],
  },
  {
    company: 'FPT Software',
    early: true,
    companyNote: 'IT outsourcing, Vietnam',
    period: '2016',
    role: 'Fresher, then Junior Software Engineer',
    highlights: [
      {
        title: 'Messaging for a proton therapy system',
        // Client and internal system names removed until permission is confirmed (Hitachi; iSale/iFace at FE Credit).
        text: 'My first job, on an outsourced project for a Japanese medical-device client’s proton beam cancer therapy system. I built a C++ service that passes messages over sockets, like a small pub/sub system. Messages were packed bit by bit, and in a medical system every bit has to be right. FPT Software works at CMMI Level 5, and it taught me how disciplined software delivery works.',
        tags: ['C++', 'Sockets', 'Pub/sub', 'Medical'],
      },
    ],
  },
]

/** Side projects. Not shown on the home page for now (see Home.tsx). */
export const projects: Project[] = [
  {
    title: 'SpeakEng',
    summary: 'A pronunciation coach for Vietnamese learners of English: shadowing with phoneme-level feedback, plus AI conversation practice.',
    tags: ['ML', 'Flutter', 'Azure Speech', 'Supabase'],
    href: 'https://github.com/thienph3/english-speaking',
  },
  {
    title: 'Chess opening repertoire',
    summary: 'Turns a chess book into one move tree: reads every lesson and exercise, merges about 1,200 moves by position, and checks each move with Stockfish.',
    tags: ['Data', 'TypeScript', 'Stockfish'],
    href: '/books/colle-system',
  },
  {
    title: 'This website',
    summary: 'A small React component library and the site built from it, with an interactive chess opening explorer.',
    tags: ['Web', 'React', 'MUI', 'Cloudflare'],
    href: 'https://github.com/thienph3/phamhuuthien',
  },
]

export const books: Book[] = [
  {
    slug: 'colle-system',
    title: 'The Colle System',
    author: 'George Koltanowski',
    topics: ['chess'],
    status: 'reading',
    intro:
      'Most openings ask you to memorise what to play. The Colle System asks you to understand why. You put the same pieces on the same squares almost every game, wait for the right moment to break in the centre, then turn everything towards the black king.',
    sections: [
      {
        title: 'Why I picked it up',
        paragraphs: [
          // DRAFT: the first paragraph is your reason for reading the book. Rewrite it in your own words.
          'I wanted a White opening I could trust without a long memory. The Colle gives you a plan from the first move: d4, Nf3, e3, Bd3, Nbd2 and castle, against almost anything Black does. The thinking goes into when and how to strike, not into remembering the twentieth move of a sharp line.',
          'Koltanowski knew Edgard Colle, who gave the system his name, and he teaches it like a coach: short lessons built around model games, with questions at the end that make you find the move yourself.',
        ],
      },
      {
        title: 'Five core ideas',
        numbered: true,
        paragraphs: ['The whole repertoire follows these five ideas.'],
        items: [
          'The same setup every game: d4, Nf3, e3, Bd3, Nbd2 and castle. The pawn on e3 looks modest, but it is only waiting for its moment.',
          'One break to aim for: e4. White prepares it with c3 (the classical Colle) or develops the other bishop with b3 and Bb2 (the Zukertort version). Against …c5 the book reaches for b3 a little more often than c3.',
          'When the centre opens, attack. The bishop on d3 already points at h7. The e4 break turns up in three out of four of the book’s master games; the Bxh7+ sacrifice in about one in five.',
          'Answer an early bishop with c4. If Black plays …Bf5 or …Bg4 before …e6, White strikes at d5 at once: every time after 2…Bf5, and in most lines after 2…Bg4.',
          'Know what is coming. Black usually meets 1.d4 with 1…d5 and 2.Nf3 with 2…Nf6; next come 2…c5, 2…Bf5, 2…Nc6 and 2…Bg4. The tree below covers them all.',
        ],
      },
      {
        title: 'The opening tree',
        demoHelp:
          'Every line from the lessons and exercises, about 1,200 moves, merged into one tree. Click a move to follow it: the bar shows how many of the book’s lines play that move, and “my line” marks the lines I play. Not every move is one to copy; some show ideas the book warns against.',
        demo: { type: 'repertoire', slug: 'colle-system' },
      },
      {
        title: 'How to read the book',
        items: [
          'Do the questions before you look at the answers. They are the best part.',
          'Set up a board. The lines are short and only make sense when you see the pieces move.',
          'Keep the master games for later. The second half shows the same ideas against strong opponents, with a whole part on the King’s Indian.',
          'Read it as a course in ideas. It is a book from 1990, not a database of best moves. I ran every White move in the tree through Stockfish: of about 590, it questions around twenty, mostly moves the book shows on purpose or mistakes from historical games.',
        ],
      },
      {
        title: 'Why it is worth it',
        paragraphs: [
          'If you want a White opening you can play for years with very little theory, this is a good place to start. The book teaches the plans through model games and questions, not lists of moves.',
          'Every move in the tree comes from the book. For the explanations behind them, and the master games, read The Colle System by George Koltanowski (Chess Enterprises).',
        ],
      },
    ],
  },
]
