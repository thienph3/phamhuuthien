import type { NavLink, Project } from './types'

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
  { label: 'Contact', href: '/#contact' },
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
