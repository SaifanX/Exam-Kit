
import { ScheduleItem, SubjectIntel } from './types';

export const RAMADAN_SCHEDULE: ScheduleItem[] = [
  { time: '04:00 AM', activity: 'Suhoor (Fuel: Oats/Eggs/Banana/Water)', isHighlighted: false, fuel: 'Oats, Eggs, Banana, Water (NO SUGAR)' },
  { time: '04:30 AM', activity: 'Fajr Prayer (Victory Protocol)', isHighlighted: false },
  { time: '05:00 AM', activity: 'PEAK 1: DEEP WORK (Maths - Golden Hour)', isHighlighted: true },
  { time: '07:00 AM', activity: 'School (Conservation Mode)', isHighlighted: false },
  { time: '03:30 PM', activity: 'The Nap (Critical 45 min Qailulah)', isHighlighted: false },
  { time: '04:30 PM', activity: 'Low Energy Study (Science/SST Diagrams)', isHighlighted: false },
  { time: '06:00 PM', activity: 'Spiritual Hour (Quran/Dua)', isHighlighted: false },
  { time: '07:00 PM', activity: 'Iftar (Dates/Water/Light Meal)', isHighlighted: false },
  { time: '07:30 PM', activity: 'PEAK 2: THE SPRINT (Kannada/English)', isHighlighted: true },
  { time: '09:00 PM', activity: 'Isha/Tarawih (Mind Reset)', isHighlighted: false },
  { time: '10:30 PM', activity: 'Sleep (HARD STOP - Phone Outside)', isHighlighted: false },
];

export interface ExtendedSubjectIntel extends SubjectIntel {
  examDate: Date;
  portions: string[];
  masterNotes: {
    title: string;
    summary: string[];
    formulas?: string[];
    traps?: string[];
  }[];
}

export const SUBJECT_INTEL: ExtendedSubjectIntel[] = [
  {
    id: 'kannada',
    name: 'Kannada',
    totalMarks: 80,
    strategy: 'The Boss Fight',
    examDate: new Date('2026-03-07T09:00:00'),
    portions: ["Unseen Passage (Apahita Gadyabhaga)", "Poetry (Vachanaamruta)", "Prose Chapters", "Grammar (Vyakarna)", "Letter Writing (Patra Lekhana)"],
    topics: [
      { topic: 'Prose/Poetry', marks: 40 },
      { topic: 'Grammar', marks: 20 },
      { topic: 'Letter Writing', marks: 10 },
    ],
    masterNotes: [
      {
        title: "Vachanaamruta Protocol",
        summary: ["Read unseen passage questions FIRST.", "Find matching keywords in text.", "Memorize one generic summary for all Vachana questions."],
      }
    ]
  },
  {
    id: 'english',
    name: 'English',
    totalMarks: 80,
    strategy: 'Architecture',
    examDate: new Date('2026-03-10T09:00:00'),
    portions: ["Literature: Noor Inayat Khan", "Poem: All The World's a Stage", "Supplementary: King Solomon's Mines", "Notice Writing", "Formal Letter Writing", "Grammar: Tenses & Voice"],
    topics: [
      { topic: 'Literature', marks: 40 },
      { topic: 'Writing', marks: 10 },
      { topic: 'Grammar', marks: 30 },
    ],
    masterNotes: [
      {
        title: "Noor Inayat Khan Intel",
        summary: ["Spy/Code name: Madeleine", "Pacifist descendant of Tipu Sultan", "Keywords: Grit, Gallantry, Sacrifice, Gestapo."],
      },
      {
        title: "The 7 Stages of Man",
        summary: ["Infant: Mewling/Puking", "Schoolboy: Snail-like", "Lover: Sighing like furnace", "Soldier: Bearded like pard", "Justice: Wise saws", "Pantaloon: Shrunk shank", "Second Childishness: Sans everything."],
      }
    ]
  },
  {
    id: 'science',
    name: 'Science',
    totalMarks: 80,
    strategy: 'Visual Warfare',
    examDate: new Date('2026-03-12T09:00:00'),
    portions: ["Physics: Human Eye & Light", "Physics: Sound", "Chemistry: Combustion & Flame", "Chemistry: Chemical Effects of Electric Current", "Biology: Reaching Age of Adolescence", "Biology: Microorganisms"],
    topics: [
      { topic: 'Physics', marks: 33 },
      { topic: 'Chemistry', marks: 27 },
      { topic: 'Biology', marks: 20 },
    ],
    masterNotes: [
      {
        title: "Human Eye Blueprint",
        summary: ["Label: Cornea, Iris, Pupil, Lens, Retina, Optic Nerve.", "CRITICAL: Image is INVERTED on Retina."],
      },
      {
        title: "Candle Flame Zones",
        summary: ["Outer: Blue (Hottest/Complete)", "Middle: Yellow (Moderate/Partial)", "Inner: Black (Least Hot/Unburnt)"],
      }
    ]
  },
  {
    id: 'sst',
    name: 'SST',
    totalMarks: 80,
    strategy: 'Memory Dump',
    examDate: new Date('2026-03-14T09:00:00'),
    portions: ["History: The Revolt of 1857", "History: Indian National Movement (1905-1947)", "Geography: Agriculture & Crops", "Geography: Industries & Resources", "Civics: The Judiciary", "Civics: Public Facilities"],
    topics: [
      { topic: 'History', marks: 33 },
      { topic: 'Geography', marks: 20 },
      { topic: 'Civics', marks: 27 },
    ],
    masterNotes: [
      {
        title: "Freedom Struggle Timeline",
        summary: ["1857: Revolt", "1919: Jallianwala Bagh", "1930: Dandi March", "1942: Quit India"],
      }
    ]
  },
  {
    id: 'hindi',
    name: 'Hindi',
    totalMarks: 40,
    strategy: 'Speed Run',
    examDate: new Date('2026-03-16T09:00:00'),
    portions: ["Grammar: Kaal (Tenses)", "Letter Writing (Patra)", "Unseen Passage", "Textbook Prose/Poetry Summaries"],
    topics: [
      { topic: 'Grammar', marks: 15 },
      { topic: 'Literature', marks: 20 },
      { topic: 'Writing', marks: 5 },
    ],
    masterNotes: [
      {
        title: "Grammar Dominance",
        summary: ["Vartaman (Hai)", "Bhoot (Tha)", "Bhavishya (Ga)"],
      }
    ]
  },
  {
    id: 'maths',
    name: 'Maths',
    totalMarks: 80,
    strategy: 'LETHAL',
    examDate: new Date('2026-03-18T09:00:00'),
    portions: ["Mensuration (Area & Volume)", "Factorisation", "Introduction to Graphs", "Data Handling", "Exponents & Powers", "Direct & Inverse Proportions"],
    topics: [
      { topic: 'Mensuration 3D', marks: 14 },
      { topic: 'Factorisation', marks: 13 },
      { topic: 'Graphs', marks: 21 },
      { topic: 'Exponents', marks: 12 },
      { topic: 'Direct/Inverse', marks: 20 },
    ],
    masterNotes: [
      {
        title: "Mensuration 3D Armory",
        summary: ["Cuboid V=lbh", "Cylinder V=πr²h", "1 m³ = 1000 Liters"],
        formulas: ["TSA = 2(lb+bh+hl)", "CSA Cylinder = 2πrh"],
        traps: ["Scenario: Road roller uses CSA only.", "Embankment: Soil Dug = Hollow Cylinder Volume."]
      }
    ],
  },
];

export const EXAM_DATE = new Date('2026-03-07T00:00:00');
