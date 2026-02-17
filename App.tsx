
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  Cpu, 
  ShieldAlert, 
  Terminal, 
  Trash2,
  Sword,
  Target,
  Zap,
  Info,
  Clock
} from 'lucide-react';
import { TabType, CombatCard, SubjectIntel } from './types';
import { EXAM_DATE, RAMADAN_SCHEDULE, SUBJECT_INTEL, ExtendedSubjectIntel } from './constants';
import { loginAnonymously, subscribeToCards, deleteCombatCard, saveCombatCard } from './firebase';
import { generateCombatCard } from './geminiService';

// --- Components ---

const Header: React.FC<{ activeTab: TabType; setTab: (t: TabType) => void }> = ({ activeTab, setTab }) => {
  const navItems = [
    { id: 'DASHBOARD', icon: LayoutDashboard, label: 'CMD CENTER' },
    { id: 'SCHEDULE', icon: Calendar, label: 'PROTOCOLS' },
    { id: 'DECKS', icon: BookOpen, label: 'WAR CHEST' },
    { id: 'INTEL', icon: Cpu, label: 'AI INTEL' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-orange-600/30 bg-slate-950/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="text-orange-600 h-6 w-6" />
          <h1 className="text-xl font-black tracking-tighter text-slate-100 uppercase">
            Warlord <span className="text-orange-600">Grade 8</span>
          </h1>
        </div>
        <nav className="hidden md:flex gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 transition-all duration-300 uppercase font-bold text-xs tracking-widest ${
                activeTab === item.id 
                  ? 'bg-orange-600 text-white' 
                  : 'text-slate-400 hover:text-orange-500 hover:bg-orange-600/10'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="md:hidden">
          <ShieldAlert className="text-orange-600 h-5 w-5" />
        </div>
      </div>
    </header>
  );
};

const FooterNav: React.FC<{ activeTab: TabType; setTab: (t: TabType) => void }> = ({ activeTab, setTab }) => {
  const navItems = [
    { id: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'SCHEDULE', icon: Calendar },
    { id: 'DECKS', icon: BookOpen },
    { id: 'INTEL', icon: Cpu },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-orange-600/30 grid grid-cols-4 h-16">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setTab(item.id as TabType)}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === item.id ? 'text-orange-600' : 'text-slate-500'
          }`}
        >
          <item.icon className="h-6 w-6" />
        </button>
      ))}
    </nav>
  );
};

const Countdown: React.FC<{ targetDate: Date; compact?: boolean }> = ({ targetDate, compact }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        secs: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const Unit: React.FC<{ val: number; label: string }> = ({ val, label }) => (
    <div className={`flex flex-col items-center bg-slate-900 hud-border ${compact ? 'p-2 min-w-[60px]' : 'p-4 min-w-[100px]'}`}>
      <span className={`${compact ? 'text-xl' : 'text-4xl'} font-black text-orange-600 tabular-nums leading-none`}>
        {String(val).padStart(2, '0')}
      </span>
      <span className={`${compact ? 'text-[8px]' : 'text-[10px]'} font-bold tracking-widest text-slate-500 uppercase mt-2`}>{label}</span>
    </div>
  );

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'justify-center'}`}>
      <Unit val={timeLeft.days} label="Days" />
      <Unit val={timeLeft.hours} label="Hrs" />
      <Unit val={timeLeft.mins} label="Mins" />
      <Unit val={timeLeft.secs} label="Secs" />
    </div>
  );
};

// --- View Components ---

const DashboardView: React.FC<{ setTab: (t: TabType) => void; cardsCount: number }> = ({ setTab, cardsCount }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="text-center space-y-4">
        <h2 className="text-xs font-black tracking-[0.3em] text-orange-600 uppercase">Mission Countdown: Operation Dominance</h2>
        <Countdown targetDate={EXAM_DATE} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="hud-border bg-slate-900/50 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">Current Phase</h3>
            <p className="text-2xl font-black text-slate-100 uppercase">Pre-March Strike</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-emerald-500">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Defenses Online</span>
          </div>
        </div>

        <div className="hud-border bg-slate-900/50 p-6 flex flex-col justify-between border-l-4 border-l-orange-600">
          <div>
            <h3 className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">Ramadan Sync</h3>
            <p className="text-2xl font-black text-slate-100 uppercase">100% Active</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-orange-600">
            <Zap className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Peak Performance</span>
          </div>
        </div>

        <div className="hud-border bg-slate-900/50 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">Active Decks</h3>
            <p className="text-2xl font-black text-slate-100 uppercase">{cardsCount + 10} Modules</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-slate-400">
            <Info className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Total Intelligence</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-black tracking-[0.3em] text-orange-600 uppercase mb-6 flex items-center gap-3">
          <Target className="h-4 w-4" /> Deployment Lanes
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {SUBJECT_INTEL.map((subject) => (
            <button
              key={subject.id}
              onClick={() => setTab('DECKS')}
              className="group p-4 hud-border bg-slate-900 hover:bg-slate-800 transition-colors text-left"
            >
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-orange-500">{subject.strategy}</p>
              <p className="text-lg font-black text-slate-100 uppercase group-hover:text-white">{subject.name}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

const ScheduleView: React.FC = () => {
  return (
    <div className="animate-in slide-in-from-bottom duration-500">
      <h2 className="text-xs font-black tracking-[0.3em] text-orange-600 uppercase mb-6 text-center">Protocol: Ramadan Warlord Mode</h2>
      <div className="overflow-x-auto hud-border bg-slate-900">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-orange-600/30">
              <th className="p-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Timestamp</th>
              <th className="p-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Operation / Fuel Protocol</th>
              <th className="p-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {RAMADAN_SCHEDULE.map((item, idx) => (
              <tr 
                key={idx} 
                className={`border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                  item.isHighlighted ? 'bg-orange-600/10' : ''
                }`}
              >
                <td className="p-4 font-black tabular-nums text-slate-300 whitespace-nowrap">{item.time}</td>
                <td className="p-4">
                  <p className={`font-bold uppercase tracking-tight ${item.isHighlighted ? 'text-orange-600' : 'text-slate-100'}`}>
                    {item.activity}
                  </p>
                  {item.fuel && <p className="text-[10px] font-medium text-slate-500 uppercase mt-1">Sustenance Req: {item.fuel}</p>}
                </td>
                <td className="p-4">
                  <div className={`text-[10px] font-black px-2 py-1 inline-block whitespace-nowrap ${
                    item.isHighlighted ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {item.isHighlighted ? 'CRITICAL PHASE' : 'STABLE'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 p-4 bg-red-500/10 border-l-4 border-l-red-500">
        <h4 className="text-red-500 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" /> Warning: Sleep Hard Stop
        </h4>
        <p className="text-xs text-slate-400 uppercase leading-relaxed font-medium">
          Protocol 10:30 PM is non-negotiable. Cognitive decline begins past 23:00 hours. Zero exceptions. Hard rest for next strike.
        </p>
      </div>
    </div>
  );
};

const DecksView: React.FC<{ cards: CombatCard[] }> = ({ cards }) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('maths');
  
  const activeSubject = (SUBJECT_INTEL.find(s => s.id === selectedSubjectId) || SUBJECT_INTEL[0]) as ExtendedSubjectIntel;
  const filteredCards = cards.filter(c => c.subjectId === selectedSubjectId);

  const handleDelete = async (id: string) => {
    if (confirm("Terminate module? Action irreversible.")) {
      await deleteCombatCard(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-[10px] font-black tracking-widest text-orange-600 uppercase mb-4">Select Theater</h3>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {SUBJECT_INTEL.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectId(s.id)}
                className={`w-full text-left p-4 hud-border transition-all flex items-center justify-between group ${
                  selectedSubjectId === s.id ? 'bg-orange-600 border-orange-600' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                <span className={`font-black uppercase tracking-tighter text-sm ${selectedSubjectId === s.id ? 'text-white' : 'text-slate-100'}`}>
                  {s.name}
                </span>
                <Sword className={`h-4 w-4 ${selectedSubjectId === s.id ? 'text-white' : 'text-slate-600 group-hover:text-orange-500'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Breakdown Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="hud-border bg-slate-900 p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Target className="h-32 w-32" />
             </div>
             
             <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                <div>
                   <h2 className="text-4xl font-black text-slate-100 uppercase tracking-tighter mb-1">{activeSubject.name} Intel</h2>
                   <p className="text-xs font-bold text-orange-600 uppercase tracking-[0.2em] mb-4">Strategy Protocol: {activeSubject.strategy}</p>
                   
                   <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Time to Strike:</span>
                      <Countdown targetDate={activeSubject.examDate} compact />
                   </div>
                </div>
                <div className="bg-slate-950 p-4 hud-border text-center min-w-[140px]">
                   <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Combat Weight</span>
                   <span className="text-3xl font-black text-orange-600">{activeSubject.totalMarks}M</span>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {activeSubject.topics.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-sm font-bold text-slate-300 uppercase">{t.topic}</span>
                    <span className="text-sm font-black text-orange-600 tracking-tighter">{t.marks}M</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xs font-black tracking-[0.3em] text-orange-600 uppercase flex items-center gap-3">
          <ShieldAlert className="h-4 w-4" /> Master Dossier Intel (Non-Deletable)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeSubject.masterNotes.map((note, idx) => (
            <div key={`master-${idx}`} className="hud-border bg-slate-900/80 border-orange-600/50 flex flex-col group transition-all">
              <div className="bg-orange-600/20 p-3 border-b border-orange-600/30">
                <h3 className="text-sm font-black text-orange-500 uppercase tracking-tighter">
                  MASTER: {note.title}
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Target className="h-3 w-3" /> Core Protocol
                  </h4>
                  <ul className="space-y-2">
                    {note.summary.map((s, sIdx) => (
                      <li key={sIdx} className="text-xs text-slate-300 font-medium leading-relaxed pl-3 relative border-l border-orange-600/50">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                {note.formulas && note.formulas.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Sword className="h-3 w-3" /> The Armory
                    </h4>
                    <div className="bg-slate-950 p-3 hud-border border-orange-600/10 text-xs font-mono text-slate-400 space-y-1">
                      {note.formulas.map((f, fIdx) => <p key={fIdx}>{f}</p>)}
                    </div>
                  </div>
                )}
                {note.traps && note.traps.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <ShieldAlert className="h-3 w-3" /> The Trap
                    </h4>
                    <div className="bg-red-500/5 p-3 border-l-2 border-l-red-500 text-[11px] text-red-200/80 font-medium space-y-2 italic">
                      {note.traps.map((t, tIdx) => <p key={tIdx}>- {t}</p>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xs font-black tracking-[0.3em] text-orange-600 uppercase flex items-center gap-3">
          <BookOpen className="h-4 w-4" /> Personal Combat Modules ({filteredCards.length})
        </h2>
        
        {filteredCards.length === 0 ? (
          <div className="hud-border bg-slate-900/50 p-12 text-center">
            <p className="text-slate-500 uppercase font-black tracking-widest">No Augmented Intelligence Available</p>
            <p className="text-[10px] text-slate-600 uppercase mt-2">Deploy AI Intel generator to create field notes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCards.map((card) => (
              <div key={card.id} className="hud-border bg-slate-900 flex flex-col group transition-all hover:hud-border-focus">
                <div className="bg-slate-800 p-3 flex justify-between items-center">
                  <h3 className="text-sm font-black text-white uppercase tracking-tighter truncate max-w-[80%]">
                    {card.title}
                  </h3>
                  <button 
                    onClick={() => handleDelete(card.id!)}
                    className="text-white/30 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-6 space-y-6 flex-grow">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Target className="h-3 w-3" /> Field Summary
                    </h4>
                    <ul className="space-y-2">
                      {card.summary.map((s, idx) => (
                        <li key={idx} className="text-xs text-slate-300 font-medium leading-relaxed pl-3 relative border-l border-slate-700">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {card.criticalFormulas.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Sword className="h-3 w-3" /> Armory
                      </h4>
                      <div className="bg-slate-950 p-3 hud-border border-orange-600/20 text-xs font-mono text-slate-400 space-y-1">
                        {card.criticalFormulas.map((f, idx) => (
                          <p key={idx}>{f}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {card.traps.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ShieldAlert className="h-3 w-3" /> The Trap
                      </h4>
                      <div className="bg-red-500/5 p-3 border-l-2 border-l-red-500 text-[11px] text-red-200/80 font-medium space-y-2 italic">
                        {card.traps.map((t, idx) => (
                          <p key={idx}>- {t}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const IntelView: React.FC = () => {
  const [input, setInput] = useState('');
  const [subjectId, setSubjectId] = useState('maths');
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsGenerating(true);
    setSuccess(false);

    try {
      const result = await generateCombatCard(input);
      await saveCombatCard({
        subjectId,
        title: result.title,
        summary: result.summary,
        criticalFormulas: result.criticalFormulas,
        traps: result.traps,
      });
      setInput('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert("AI Uplink Failed. Verify text size and content.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-xs font-black tracking-[0.3em] text-orange-600 uppercase">AI Intel Augmentation</h2>
        <p className="text-slate-400 text-sm uppercase font-bold tracking-widest">Convert raw data into Combat Cards</p>
      </div>

      <div className="hud-border bg-slate-900 p-8 space-y-6">
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Theater Assignment</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {SUBJECT_INTEL.map(s => (
              <button
                key={s.id}
                onClick={() => setSubjectId(s.id)}
                className={`p-2 text-[10px] font-black uppercase tracking-tighter hud-border transition-all ${
                  subjectId === s.id ? 'bg-orange-600 border-orange-600 text-white' : 'bg-slate-950 text-slate-500 hover:text-slate-300'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Raw Intelligence Feed (Paste Chapter Notes)</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-64 bg-slate-950 hud-border p-4 text-slate-300 text-sm font-medium focus:outline-none focus:hud-border-focus transition-all resize-none"
            placeholder="PASTE INTEL HERE... TARGET HIGHEST WEIGHT TOPICS FIRST."
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !input.trim()}
          className={`w-full py-4 flex items-center justify-center gap-3 transition-all uppercase font-black tracking-[0.2em] ${
            isGenerating 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-[0.98]'
          }`}
        >
          {isGenerating ? (
            <>
              <Zap className="h-5 w-5 animate-pulse text-orange-500" />
              Processing Uplink...
            </>
          ) : (
            <>
              <Cpu className="h-5 w-5" />
              Generate Combat Card
            </>
          )}
        </button>

        {success && (
          <div className="bg-emerald-500/10 border-l-4 border-l-emerald-500 p-4 text-emerald-500 text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-in zoom-in duration-300">
            <Zap className="h-4 w-4" /> Card Deployed to War Chest Successfully
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20 md:pb-0">
        <div className="p-4 bg-slate-900/50 hud-border border-slate-800">
           <span className="text-orange-600 font-black text-[10px] uppercase block mb-1">Step 01</span>
           <p className="text-[10px] text-slate-500 uppercase font-bold">Copy text from PDF/Notes</p>
        </div>
        <div className="p-4 bg-slate-900/50 hud-border border-slate-800">
           <span className="text-orange-600 font-black text-[10px] uppercase block mb-1">Step 02</span>
           <p className="text-[10px] text-slate-500 uppercase font-bold">Paste into Intelligence Feed</p>
        </div>
        <div className="p-4 bg-slate-900/50 hud-border border-slate-800">
           <span className="text-orange-600 font-black text-[10px] uppercase block mb-1">Step 03</span>
           <p className="text-[10px] text-slate-500 uppercase font-bold">Review generated Combat Card</p>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [tab, setTab] = useState<TabType>('DASHBOARD');
  const [cards, setCards] = useState<CombatCard[]>([]);

  useEffect(() => {
    loginAnonymously();
    const unsubscribe = subscribeToCards((newCards) => {
      setCards(newCards);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen pb-16 md:pb-8 flex flex-col relative">
      <div className="scanline" />
      <Header activeTab={tab} setTab={setTab} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {tab === 'DASHBOARD' && <DashboardView setTab={setTab} cardsCount={cards.length} />}
        {tab === 'SCHEDULE' && <ScheduleView />}
        {tab === 'DECKS' && <DecksView cards={cards} />}
        {tab === 'INTEL' && <IntelView />}
      </main>

      <FooterNav activeTab={tab} setTab={setTab} />

      {/* Decorative corner accents */}
      <div className="fixed top-20 right-4 hidden lg:block opacity-20 select-none">
        <div className="text-[10px] font-mono text-orange-600 text-right">
          SYS_LOG: STANDBY<br />
          UPLINK: ACTIVE<br />
          COGNITION: MAX<br />
          VERSION: 1.1.2-MASTER-DOSSIER
        </div>
      </div>
    </div>
  );
}
