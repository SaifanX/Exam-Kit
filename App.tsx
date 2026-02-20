
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Calendar, BookOpen, Cpu, ShieldAlert, Terminal, 
  Trash2, Sword, Target, Zap, Info, Clock, Send, Play, Square, 
  RotateCcw, Download, Upload, LogIn, LogOut, Edit3, Save, X, Code, Copy, Check, 
  ChevronRight, Cloud, CloudOff, CloudSync, RefreshCw, Search, ExternalLink, Globe
} from 'lucide-react';
import { TabType, CombatCard, SubjectIntel, ChatMessage, UserProfile } from './types';
import { EXAM_DATE, RAMADAN_SCHEDULE, SUBJECT_INTEL, ExtendedSubjectIntel } from './constants';
import { 
  subscribeToCards, deleteCombatCard, saveCombatCard, updateCombatCard,
  getUserProfile, setUserProfile, exportDossier, importDossier 
} from './firebase';
import { generateCombatCard, askWarlordAdvisor, searchG8Intel } from './geminiService';
import { driveService } from './driveService';

// --- Utility: Format Date ---
const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// --- Component: Header ---
const Header: React.FC<{ activeTab: TabType; setTab: (t: TabType) => void; user: UserProfile | null; onAuth: () => void; isSyncing: boolean }> = ({ activeTab, setTab, user, onAuth, isSyncing }) => {
  const navItems = [
    { id: 'DASHBOARD', icon: LayoutDashboard, label: 'HQ' },
    { id: 'SCHEDULE', icon: Calendar, label: 'PROTO' },
    { id: 'DECKS', icon: BookOpen, label: 'WAR CHEST' },
    { id: 'INTEL', icon: Cpu, label: 'AUGMENT' },
    { id: 'FOCUS', icon: Clock, label: 'FOCUS' },
    { id: 'SEARCH', icon: Search, label: 'RECON' },
    { id: 'CHAT', icon: Send, label: 'ADVISOR' },
  ];

  const lastSync = driveService.getLastSyncTime();

  return (
    <header className="sticky top-0 z-50 border-b border-orange-600/30 bg-slate-950/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="text-orange-600 h-6 w-6" />
          <h1 className="text-xl font-black tracking-tighter text-slate-100 uppercase">
            Warlord <span className="text-orange-600">G8</span>
          </h1>
        </div>
        
        <nav className="hidden md:flex gap-1 overflow-x-auto max-w-[60%]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as TabType)}
              className={`flex items-center gap-2 px-3 py-2 transition-all duration-300 uppercase font-bold text-[10px] tracking-widest whitespace-nowrap ${
                activeTab === item.id ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-600/10'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {driveService.isConnected() && (
            <div className="hidden lg:flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-emerald-500 text-[8px] font-black uppercase tracking-widest">
                {isSyncing ? <RefreshCw className="h-2 w-2 animate-spin" /> : <Cloud className="h-2 w-2" />}
                {isSyncing ? 'Syncing...' : 'Drive Connected'}
              </div>
              {lastSync && <span className="text-[7px] text-slate-600 uppercase font-bold tracking-tighter">Last Sync: {lastSync}</span>}
            </div>
          )}
          <button onClick={onAuth} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-orange-600 uppercase transition-colors tracking-widest">
            {user ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {user ? user.username : 'AUTHENTICATE'}
          </button>
        </div>
      </div>
    </header>
  );
};

// --- Component: Countdown ---
const Countdown: React.FC<{ targetDate: Date; compact?: boolean; label?: string }> = ({ targetDate, compact, label }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) { clearInterval(timer); return; }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        secs: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const Unit = ({ val, label }: { val: number; label: string }) => (
    <div className={`flex flex-col items-center bg-slate-900/80 hud-border ${compact ? 'p-1 min-w-[50px]' : 'p-3 min-w-[80px]'}`}>
      <span className={`${compact ? 'text-lg' : 'text-3xl'} font-black text-orange-600 tabular-nums leading-none`}>{String(val).padStart(2, '0')}</span>
      <span className="text-[8px] font-bold tracking-widest text-slate-500 uppercase mt-1">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-[9px] font-black text-orange-600 uppercase tracking-[0.3em] text-center">{label}</span>}
      <div className={`flex gap-1 ${compact ? '' : 'justify-center'}`}>
        <Unit val={timeLeft.days} label="Days" />
        <Unit val={timeLeft.hours} label="Hrs" />
        <Unit val={timeLeft.mins} label="Mins" />
        <Unit val={timeLeft.secs} label="Secs" />
      </div>
    </div>
  );
};

// --- View: Dashboard ---
const DashboardView: React.FC<{ setTab: (t: TabType) => void; cardsCount: number }> = ({ setTab, cardsCount }) => {
  const now = new Date();
  const sortedExams = [...SUBJECT_INTEL].sort((a, b) => a.examDate.getTime() - b.examDate.getTime());
  const nextExam = sortedExams.find(e => e.examDate > now);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <section className="text-center space-y-4">
        <Countdown targetDate={EXAM_DATE} label="Global Mission Countdown" />
      </section>

      {nextExam && (
        <section className="bg-orange-600/5 border border-orange-600/40 p-8 hud-border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.8)]" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600" />
                <h3 className="text-xs font-black text-orange-600 uppercase tracking-[0.4em]">Primary Target Acquired</h3>
              </div>
              <p className="text-5xl font-black text-white uppercase tracking-tighter leading-none">{nextExam.name}</p>
              <div className="flex items-center gap-3 mt-4">
                <span className="px-2 py-1 bg-slate-800 text-orange-500 text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                  {formatDate(nextExam.examDate)}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Strike Time: 09:00 hrs</span>
              </div>
            </div>
            <div className="bg-slate-950/50 p-6 hud-border">
              <Countdown targetDate={nextExam.examDate} compact label="Window to Engagement" />
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="hud-border bg-slate-900/50 p-6 flex flex-col justify-between border-b-2 border-b-emerald-500">
          <h3 className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">Tactical Status</h3>
          <p className="text-3xl font-black text-slate-100 uppercase">Operational</p>
          <div className="mt-4 flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase">
            <Zap className="h-3 w-3" /> Core Systems Stable
          </div>
        </div>
        <div className="hud-border bg-slate-900/50 p-6 flex flex-col justify-between border-b-2 border-b-orange-600">
          <h3 className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">Sustenance Cycle</h3>
          <p className="text-3xl font-black text-slate-100 uppercase">Active Fast</p>
          <div className="mt-4 flex items-center gap-2 text-orange-600 text-[9px] font-black uppercase">
            <ShieldAlert className="h-3 w-3" /> Metabolic Preservation
          </div>
        </div>
        <div className="hud-border bg-slate-900/50 p-6 flex flex-col justify-between border-b-2 border-b-blue-600">
          <h3 className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">Total Intelligence</h3>
          <p className="text-3xl font-black text-slate-100 uppercase">{cardsCount + 10} Modules</p>
          <div className="mt-4 flex items-center gap-2 text-blue-500 text-[9px] font-black uppercase">
            <BookOpen className="h-3 w-3" /> War Chest Population
          </div>
        </div>
      </section>
    </div>
  );
};

// --- View: Schedule ---
const ScheduleView: React.FC = () => {
  return (
    <div className="animate-in slide-in-from-bottom duration-500 space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-xs font-black tracking-[0.4em] text-orange-600 uppercase">Mission Protocol: Ramadan Warlord</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Optimized for Cognitive Preservation & Metabolic Efficiency</p>
      </div>

      <style>{`
        @keyframes hud-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(234, 88, 12, 0.2); border-color: rgba(234, 88, 12, 0.3); }
          50% { box-shadow: 0 0 30px rgba(234, 88, 12, 0.6); border-color: rgba(234, 88, 12, 0.8); }
        }
        .animate-hud-glow { animation: hud-glow 1.5s infinite ease-in-out; }
      `}</style>

      <div className="hud-border bg-slate-900/50 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-orange-600/30 bg-slate-900">
              <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 uppercase">Time Code</th>
              <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 uppercase">Deployment Mission</th>
              <th className="p-4 text-[10px] font-black tracking-widest text-slate-500 uppercase">System Status</th>
            </tr>
          </thead>
          <tbody>
            {RAMADAN_SCHEDULE.map((item, idx) => (
              <tr 
                key={idx} 
                className={`border-b border-slate-800 transition-all ${
                  item.isHighlighted 
                    ? 'animate-hud-glow bg-orange-600/5 border-orange-500 relative z-10' 
                    : 'hover:bg-slate-800/30'
                }`}
              >
                <td className="p-4 font-black tabular-nums text-slate-300 whitespace-nowrap">{item.time}</td>
                <td className="p-4">
                  <p className={`font-black uppercase tracking-tight text-sm ${item.isHighlighted ? 'text-orange-500' : 'text-slate-100'}`}>
                    {item.activity}
                  </p>
                  {item.fuel && (
                    <div className="flex items-center gap-2 mt-2">
                      <Zap className="h-3 w-3 text-emerald-500" />
                      <p className="text-[9px] font-black text-slate-500 uppercase">Optimal Sustenance: {item.fuel}</p>
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <div className={`text-[9px] font-black px-3 py-1 inline-block tracking-widest ${
                    item.isHighlighted ? 'bg-orange-600 text-white shadow-[0_0_10px_rgba(234,88,12,0.5)]' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {item.isHighlighted ? 'PEAK PERFORMANCE' : 'NOMINAL OPS'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-red-600/10 border-l-4 border-l-red-600 hud-border">
        <h4 className="text-red-500 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" /> Final Warning: Circadian Compliance
        </h4>
        <p className="text-[10px] text-slate-400 uppercase leading-relaxed font-bold tracking-wide">
          10:30 PM HARD STOP IS MANDATORY. DEVIATION CAUSES COGNITIVE DEGRADATION. ALL MOBILE ARTIFACTS MUST BE DEPOSITED OUTSIDE THE SANCTUARY.
        </p>
      </div>
    </div>
  );
};

// --- View: Decks ---
const DecksView: React.FC<{ cards: CombatCard[]; setTab: (t: TabType) => void }> = ({ cards, setTab }) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('maths');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<Partial<CombatCard>>({});
  const [importJson, setImportJson] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const activeSubject = (SUBJECT_INTEL.find(s => s.id === selectedSubjectId) || SUBJECT_INTEL[0]) as ExtendedSubjectIntel;
  const filteredCards = cards.filter(c => c.subjectId === selectedSubjectId);

  const handleStartEdit = (card: CombatCard) => {
    setEditingCardId(card.id);
    setEditBuffer({ ...card });
  };

  const handleSaveEdit = async () => {
    if (editingCardId && editBuffer) {
      await updateCombatCard(editingCardId, editBuffer);
      setEditingCardId(null);
    }
  };

  const handleImport = () => {
    if (importDossier(importJson)) {
      setImportJson('');
      setIsImportModalOpen(false);
      alert("DOSSIER IMPORTED & SYNCED.");
    } else {
      alert("CHECKSUM FAILED. INVALID JSON FORMAT.");
    }
  };

  const copyTemplate = () => {
    const template = JSON.stringify({
      cards: [{
        subjectId: selectedSubjectId,
        title: "CUSTOM INTEL MODULE",
        summary: ["CORE POINT 1", "CORE POINT 2"],
        criticalFormulas: ["FORMULA 1"],
        traps: ["COMMON MISTAKE"]
      }]
    }, null, 2);
    navigator.clipboard.writeText(template);
    alert("TEMPLATE COPIED TO CLIPBOARD.");
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-24">
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-[10px] font-black tracking-widest text-orange-600 uppercase mb-4 px-2">Operational Theaters</h3>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {SUBJECT_INTEL.map(s => (
              <button 
                key={s.id} 
                onClick={() => setSelectedSubjectId(s.id)} 
                className={`w-full text-left p-4 hud-border transition-all flex flex-col group relative ${
                  selectedSubjectId === s.id ? 'bg-orange-600 border-orange-600 translate-x-1' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`font-black uppercase text-xs tracking-tighter ${selectedSubjectId === s.id ? 'text-white' : 'text-slate-100'}`}>
                    {s.name}
                  </span>
                  <Sword className={`h-4 w-4 ${selectedSubjectId === s.id ? 'text-white' : 'text-slate-600'}`} />
                </div>
                <div className={`mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${selectedSubjectId === s.id ? 'text-white/80' : 'text-orange-500'}`}>
                  <Calendar className="h-3 w-3" /> Exam: {formatDate(s.examDate)}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 p-4 hud-border bg-slate-950/80 space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Sync Intelligence</h4>
            <button onClick={exportDossier} className="w-full py-3 bg-slate-800 hover:bg-orange-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-colors border border-slate-700">
              <Download className="h-4 w-4" /> Local Dossier Export
            </button>
            <button onClick={() => setIsImportModalOpen(true)} className="w-full py-3 bg-slate-800 hover:bg-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-colors border border-slate-700">
              <Upload className="h-4 w-4" /> Import External Intel
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          <div className="hud-border bg-slate-900/50 p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Target className="h-48 w-48" />
             </div>
             <div className="z-10 text-center md:text-left">
                <h2 className="text-5xl font-black uppercase tracking-tighter text-white">{activeSubject.name} Dossier</h2>
                <p className="text-[11px] font-black text-orange-600 uppercase tracking-[0.4em] mt-2">Engage Strategy: {activeSubject.strategy}</p>
             </div>
             <div className="z-10">
                <Countdown targetDate={activeSubject.examDate} compact label="Strike Window" />
             </div>
          </div>

          {/* Tactical Portions Section */}
          <section className="hud-border bg-slate-900 p-6 space-y-4">
             <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Zap className="h-4 w-4 text-orange-500" />
                <h4 className="text-[10px] font-black text-slate-100 uppercase tracking-[0.3em]">Tactical Portions & Engagement Areas</h4>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeSubject.portions.map((portion, idx) => (
                   <div key={idx} className="flex items-center gap-3 bg-slate-950 p-3 hud-border border-orange-500/10 group hover:border-orange-500/40 transition-all">
                      <div className="h-5 w-5 bg-orange-600/10 flex items-center justify-center rounded border border-orange-600/20 group-hover:bg-orange-600 group-hover:text-white text-orange-600 transition-all">
                         <Check className="h-3 w-3" />
                      </div>
                      <span className="text-[11px] font-black uppercase text-slate-400 group-hover:text-slate-100 transition-colors tracking-tight">{portion}</span>
                   </div>
                ))}
             </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Master Notes (Static) */}
            {activeSubject.masterNotes.map((note, i) => (
              <div key={`master-${i}`} className="hud-border bg-slate-900 border-l-4 border-l-orange-500 p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest">MASTER PROTOCOL: {note.title}</h4>
                  <ShieldAlert className="h-4 w-4 text-orange-500/50" />
                </div>
                <div className="space-y-4">
                  <ul className="text-xs space-y-2 text-slate-300 font-bold leading-relaxed">
                    {note.summary.map((s, si) => <li key={si} className="flex gap-2"><span>•</span> {s}</li>)}
                  </ul>
                  {note.formulas && (
                    <div className="bg-slate-950 p-4 hud-border border-orange-500/10">
                      <p className="text-[9px] font-black text-orange-600 uppercase mb-2">The Armory (Formulas)</p>
                      <div className="text-[11px] font-mono text-slate-400 space-y-1">
                        {note.formulas.map((f, fi) => <p key={fi}>{f}</p>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* User Cards (Editable) */}
            {filteredCards.map((card) => (
              <div key={card.id} className="hud-border bg-slate-900 p-6 group relative transition-all hover:bg-slate-800/80">
                {editingCardId === card.id ? (
                  <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase">Module Title</label>
                      <input 
                        className="w-full bg-slate-950 hud-border p-3 text-sm text-white focus:outline-none focus:border-orange-600" 
                        value={editBuffer.title} 
                        onChange={e => setEditBuffer({ ...editBuffer, title: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase">Intel Summary (one per line)</label>
                      <textarea 
                        className="w-full bg-slate-950 hud-border p-3 text-xs text-white h-32 focus:outline-none focus:border-orange-600" 
                        value={editBuffer.summary?.join('\n')} 
                        onChange={e => setEditBuffer({ ...editBuffer, summary: e.target.value.split('\n') })} 
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingCardId(null)} 
                        className="flex-grow py-3 bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white"
                      >
                        Abort
                      </button>
                      <button 
                        onClick={handleSaveEdit} 
                        className="flex-grow py-3 bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700 flex items-center justify-center gap-2"
                      >
                        <Save className="h-4 w-4" /> Persist Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-xs font-black text-slate-300 uppercase tracking-tight">{card.title}</h4>
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleStartEdit(card)} className="text-slate-500 hover:text-orange-500 transition-colors"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => deleteCombatCard(card.id)} className="text-slate-500 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <ul className="text-xs space-y-2 text-slate-400 font-medium">
                      {card.summary.map((s, si) => <li key={si} className="flex gap-2"><span>•</span> {s}</li>)}
                    </ul>
                    {card.criticalFormulas.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <p className="text-[9px] font-black text-orange-600 uppercase mb-2">Field Formulas</p>
                        <div className="text-[10px] font-mono text-slate-500">{card.criticalFormulas.join(', ')}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          
          {filteredCards.length === 0 && (
             <div className="hud-border bg-slate-900/30 p-12 text-center space-y-4">
                <ShieldAlert className="h-12 w-12 text-slate-800 mx-auto" />
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">No Field Intelligence Detected</p>
                <button onClick={() => setTab('INTEL')} className="px-6 py-2 bg-slate-800 text-[10px] font-black uppercase text-slate-400 hover:text-orange-500 border border-slate-700 transition-all">Go to Augmentation Lab</button>
             </div>
          )}
        </div>
      </section>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          <div className="hud-border bg-slate-900 p-8 w-full max-w-xl space-y-6 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-3">
                <Code className="h-6 w-6 text-orange-600" /> Intelligence Import Lab
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-500 hover:text-white"><X className="h-6 w-6" /></button>
            </div>
            
            <p className="text-[10px] font-black text-slate-500 uppercase leading-relaxed">
              Paste your tactical dossier JSON below. Use the template to ensure data integrity.
            </p>

            <textarea 
              value={importJson} 
              onChange={e => setImportJson(e.target.value)} 
              placeholder='{"cards": [...]}' 
              className="w-full bg-slate-950 hud-border p-4 text-xs font-mono text-emerald-500 h-64 focus:outline-none focus:hud-border-focus"
            />

            <div className="flex gap-4">
              <button onClick={copyTemplate} className="flex-grow py-4 bg-slate-800 hover:bg-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-center gap-3">
                <Copy className="h-4 w-4" /> Copy Format Template
              </button>
              <button onClick={handleImport} className="flex-grow py-4 bg-orange-600 hover:bg-orange-700 text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(234,88,12,0.3)]">
                <Zap className="h-4 w-4" /> Deploy Intelligence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Focus (Pomodoro) ---
const FocusView: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');
  const [task, setTask] = useState('');
  const [subject, setSubject] = useState('maths');

  const totalTime = mode === 'FOCUS' ? 25 * 60 : 5 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      const nextMode = mode === 'FOCUS' ? 'BREAK' : 'FOCUS';
      setMode(nextMode);
      setTimeLeft(nextMode === 'FOCUS' ? 25 * 60 : 5 * 60);
      setIsActive(false);
      
      if (Notification.permission === 'granted') {
        new Notification(`Protocol Transition: ${nextMode} PHASE COMMENCED`);
      } else {
        alert(`${mode} COMPLETE. COMMENCING ${nextMode} PROTOCOL.`);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const requestNotif = () => {
    Notification.requestPermission();
  };

  // SVG ring radius calculation
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-in zoom-in duration-300 py-12">
      <div className="text-center space-y-4">
        <h2 className="text-xs font-black text-orange-600 uppercase tracking-[0.5em]">Cognitive Engagement Engine</h2>
        
        <div className="relative flex items-center justify-center py-10">
          <svg className="w-64 h-64">
            <circle
              className="text-slate-800"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="128"
              cy="128"
            />
            <circle
              className="text-orange-600 progress-ring-circle"
              strokeWidth="4"
              strokeDasharray={circumference}
              style={{ strokeDashoffset: offset }}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="128"
              cy="128"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl font-black text-white tabular-nums tracking-tighter">
              {formatTime(timeLeft)}
            </span>
            <span className={`text-[10px] font-black tracking-widest mt-2 uppercase transition-all ${mode === 'FOCUS' ? 'text-orange-500' : 'text-emerald-500'}`}>
              {mode} Protocol
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Operational Theater</label>
          <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-slate-950 hud-border p-4 text-xs uppercase font-black text-slate-100 focus:outline-none focus:border-orange-600">
            {SUBJECT_INTEL.map(s => <option key={s.id} value={s.id}>{s.name} - {s.strategy}</option>)}
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary Objective</label>
          <input value={task} onChange={e => setTask(e.target.value)} placeholder="ENTER TASK..." className="w-full bg-slate-950 hud-border p-4 text-xs uppercase font-black text-white focus:outline-none focus:border-orange-600" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => setIsActive(!isActive)} 
          className={`flex-grow py-6 flex items-center justify-center gap-4 font-black uppercase tracking-[0.2em] transition-all text-sm ${
            isActive ? 'bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-orange-600 hover:bg-orange-700 shadow-[0_0_20px_rgba(234,88,12,0.4)]'
          }`}
        >
          {isActive ? <Square className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          {isActive ? 'Cease Operations' : 'Commence Strike'}
        </button>
        <button onClick={() => { setIsActive(false); setTimeLeft(mode === 'FOCUS' ? 25 * 60 : 5 * 60); }} className="p-6 bg-slate-800 hover:bg-slate-700 hud-border border-slate-700 transition-colors">
          <RotateCcw className="h-6 w-6 text-slate-400" />
        </button>
      </div>

      <button onClick={requestNotif} className="w-full text-[9px] font-black text-slate-500 uppercase hover:text-slate-300 tracking-widest transition-colors">
        Enable Tactical Notifications
      </button>
    </div>
  );
};

// --- View: Recon (Search) ---
const ReconView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{text: string, chunks: any[]} | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await searchG8Intel(query);
      setResult({ text: res.text, chunks: res.groundingChunks });
    } catch (e) {
      alert("RECON FAILURE. UPLINK SATURATION.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-top duration-500 pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-xs font-black tracking-[0.5em] text-orange-600 uppercase">Field Reconnaissance Uplink</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Query Global Intelligence via Google Search Grounding</p>
      </div>

      <div className="hud-border bg-slate-900/50 p-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            placeholder="WHAT ARE YOU STUCK WITH, OPERATOR?" 
            className="w-full bg-slate-950 pl-12 pr-4 py-4 text-xs font-black uppercase text-white focus:outline-none border border-slate-800 focus:border-orange-600 transition-all" 
          />
        </div>
        <button 
          onClick={handleSearch} 
          disabled={loading || !query.trim()} 
          className="w-full md:w-auto px-8 py-4 bg-orange-600 text-white font-black uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          {loading ? 'Initiating Uplink...' : 'Commence Recon'}
        </button>
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom duration-500 space-y-8">
          <div className="hud-border bg-slate-900 p-8 space-y-4">
             <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Info className="h-4 w-4 text-orange-500" />
                <h4 className="text-[10px] font-black text-slate-100 uppercase tracking-[0.3em]">Intelligence Briefing</h4>
             </div>
             <div className="text-xs leading-relaxed font-bold text-slate-300 whitespace-pre-wrap">
               {result.text}
             </div>
          </div>

          {result.chunks && result.chunks.length > 0 && (
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-orange-600 pl-3">Source Intelligence Nodes</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {result.chunks.map((chunk: any, i: number) => (
                   chunk.web && (
                     <a 
                       key={i} 
                       href={chunk.web.uri} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="hud-border bg-slate-950 p-4 flex justify-between items-center group hover:bg-orange-600/10 transition-all border-l-4 border-l-orange-600/50"
                     >
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-black text-slate-100 truncate uppercase tracking-tight">{chunk.web.title || "External Module"}</p>
                          <p className="text-[8px] font-bold text-slate-600 truncate group-hover:text-orange-500 transition-colors">{chunk.web.uri}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-700 group-hover:text-orange-600 transition-all flex-shrink-0" />
                     </a>
                   )
                 ))}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- View: Chat (Warlord Advisor) ---
const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const response = await askWarlordAdvisor(userMsg, history);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: 'UPLINK ERROR. UPLINK SATURATION OR API TIMEOUT. RE-ATTEMPT PROTOCOL.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[75vh] hud-border bg-slate-950 overflow-hidden animate-in slide-in-from-top duration-500 shadow-2xl">
      <div className="bg-orange-600 p-4 flex items-center justify-between shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-white animate-pulse" />
          <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Warlord Tactical Advisor v3.1</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">Uplink: Pro-Thinking Active</span>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-6 bg-slate-900/40 relative">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-10">
            <Cpu className="h-20 w-20 mb-6" />
            <p className="text-sm uppercase font-black tracking-[0.5em]">Advisor Neural Link Standby</p>
            <p className="text-[10px] mt-4 max-w-xs font-bold uppercase leading-relaxed">Ask about exam patterns, subject weightage, or motivation strategies.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom duration-300`}>
            <div className={`max-w-[85%] p-4 text-xs leading-relaxed font-bold tracking-wide ${
              m.role === 'user' 
                ? 'bg-orange-600/10 hud-border border-orange-500/50 text-orange-50 text-right rounded-bl-xl rounded-tr-xl' 
                : 'bg-slate-800 text-slate-300 rounded-br-xl rounded-tl-xl'
            }`}>
              <div className={`text-[9px] font-black uppercase mb-2 tracking-widest ${m.role === 'user' ? 'text-orange-600' : 'text-slate-500'}`}>
                {m.role === 'user' ? 'Operator' : 'AI_Advisor'}
              </div>
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 p-4 hud-border border-orange-500/20 text-[10px] animate-pulse text-orange-500 font-black tracking-[0.2em]">
              ADVISOR IS PERFORMING DEEP COGNITIVE THINKING...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-4">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyPress={e => e.key === 'Enter' && handleSend()} 
          placeholder="ENTER TACTICAL QUERY..." 
          className="flex-grow bg-slate-950 p-4 text-xs font-black uppercase text-white focus:outline-none border border-slate-800 focus:border-orange-600 transition-all" 
        />
        <button 
          onClick={handleSend} 
          disabled={loading || !input.trim()} 
          className="p-4 bg-orange-600 text-white hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// --- View: Auth ---
const AuthModal: React.FC<{ onClose: () => void; onLogin: (name: string) => void; isSyncing: boolean; onSyncDrive: () => void }> = ({ onClose, onLogin, isSyncing, onSyncDrive }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNew, setIsNew] = useState(false);

  const driveConnected = driveService.isConnected();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
      <div className="hud-border bg-slate-900 p-10 w-full max-w-md relative shadow-3xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X className="h-6 w-6" /></button>
        <div className="text-center space-y-4 mb-8">
          <Terminal className="h-10 w-10 text-orange-600 mx-auto" />
          <h3 className="text-2xl font-black uppercase tracking-[0.4em] text-white">Identity Lock</h3>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{isNew ? 'Initialize New Profile' : 'Access Existing Dossier'}</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Operator Email</label>
            <input 
              type="email"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="saifan@warlord.cmd" 
              className="w-full bg-slate-950 p-4 hud-border text-sm font-bold text-slate-100 focus:outline-none focus:border-orange-600" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tactical Cipher</label>
            <input 
              type="password"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="w-full bg-slate-950 p-4 hud-border text-sm font-bold text-slate-100 focus:outline-none focus:border-orange-600" 
            />
          </div>
        </div>

        <button 
          onClick={() => onLogin(email.split('@')[0] || 'Operator')} 
          className="w-full py-5 bg-orange-600 text-white font-black uppercase tracking-[0.3em] hover:bg-orange-700 mt-8 shadow-[0_0_20px_rgba(234,88,12,0.5)] transition-all"
        >
          Verify Authenticity
        </button>

        <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-center">Cloud Integration</h4>
          <button 
            onClick={onSyncDrive}
            disabled={isSyncing}
            className={`w-full py-4 flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest transition-all ${
              driveConnected 
                ? 'bg-slate-800 text-emerald-500 border border-emerald-500/30' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : driveConnected ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
            {driveConnected ? 'Sync with Google Drive' : 'Connect Google Drive'}
          </button>
        </div>

        <button 
          onClick={() => setIsNew(!isNew)} 
          className="w-full text-center mt-6 text-[9px] font-black text-slate-500 uppercase hover:text-orange-500 tracking-widest transition-colors"
        >
          {isNew ? 'I already have a Cipher' : 'Need a new deployment code?'}
        </button>
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [tab, setTab] = useState<TabType>('DASHBOARD');
  const [cards, setCards] = useState<CombatCard[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setUser(getUserProfile());
    const unsubscribe = subscribeToCards(setCards);
    return () => unsubscribe();
  }, []);

  // Periodic Auto-Sync to Drive if connected
  useEffect(() => {
    if (driveService.isConnected() && cards.length > 0) {
      const interval = setInterval(() => {
        handleDriveSync();
      }, 60000); // Every 60 seconds
      return () => clearInterval(interval);
    }
  }, [cards, user]);

  const handleAuth = () => {
    if (user) {
      setUser(null);
      setUserProfile(null);
    } else {
      setShowAuth(true);
    }
  };

  const handleDriveSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      if (!driveService.isConnected()) {
        await driveService.authenticate();
      }
      await driveService.sync({ cards, user });
    } catch (e) {
      console.error("Drive Sync Fail:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const login = (name: string) => {
    const profile = { username: name.toUpperCase() };
    setUser(profile);
    setUserProfile(profile);
    setShowAuth(false);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8 flex flex-col relative bg-slate-950 text-slate-100 selection:bg-orange-600/30 selection:text-white">
      <div className="scanline" />
      <Header activeTab={tab} setTab={setTab} user={user} onAuth={handleAuth} isSyncing={isSyncing} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {tab === 'DASHBOARD' && <DashboardView setTab={setTab} cardsCount={cards.length} />}
        {tab === 'SCHEDULE' && <ScheduleView />}
        {tab === 'DECKS' && <DecksView cards={cards} setTab={setTab} />}
        {tab === 'INTEL' && <IntelView setTab={setTab} />}
        {tab === 'FOCUS' && <FocusView />}
        {tab === 'SEARCH' && <ReconView />}
        {tab === 'CHAT' && <ChatView />}
      </main>

      {/* Footer simple nav for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-t border-orange-600/30 grid grid-cols-7 h-16">
        {[
          { id: 'DASHBOARD', icon: LayoutDashboard },
          { id: 'SCHEDULE', icon: Calendar },
          { id: 'DECKS', icon: BookOpen },
          { id: 'INTEL', icon: Cpu },
          { id: 'FOCUS', icon: Clock },
          { id: 'SEARCH', icon: Search },
          { id: 'CHAT', icon: Send },
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => setTab(item.id as TabType)} 
            className={`flex items-center justify-center transition-all ${
              tab === item.id ? 'text-orange-500 bg-orange-600/10' : 'text-slate-500'
            }`}
          >
            <item.icon className="h-5 w-5" />
          </button>
        ))}
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={login} isSyncing={isSyncing} onSyncDrive={handleDriveSync} />}

      <div className="fixed top-20 right-4 hidden lg:block opacity-20 pointer-events-none text-right">
        <div className="text-[9px] font-mono text-orange-600 leading-tight">
          SECURE_UPLINK: {user ? 'IDENTIFIED' : 'ANONYMOUS'}<br />
          NEURAL_MODEL: GEMINI_3_FLASH_RECON<br />
          CLOUD_SYNC: {driveService.isConnected() ? 'LINKED' : 'LOCAL_ONLY'}<br />
          BUILD: 2.3.0-SEARCH-RECON
        </div>
      </div>
    </div>
  );
}

// Internal Augmentation Lab Component
const IntelView: React.FC<{setTab: (t: TabType) => void}> = ({setTab}) => {
  const [input, setInput] = useState('');
  const [subjectId, setSubjectId] = useState('maths');
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim() || isGenerating) return;
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
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("CRITICAL: AI LINK FAILURE. RE-ESTABLISH CONNECTION.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-right duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-xs font-black tracking-[0.5em] text-orange-600 uppercase">Augmentation Lab: Chapter Processor</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Compress raw syllabus intelligence into actionable combat modules</p>
      </div>

      <div className="hud-border bg-slate-900/50 p-8 space-y-8 shadow-2xl">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 block">Assigned Operational Theater</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SUBJECT_INTEL.map(s => (
              <button 
                key={s.id} 
                onClick={() => setSubjectId(s.id)} 
                className={`p-3 text-[10px] font-black uppercase tracking-widest hud-border transition-all ${
                  subjectId === s.id ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' : 'bg-slate-950 text-slate-500 hover:text-slate-300'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 block">Raw Intel Stream (Notes / Text / Summary)</label>
          <textarea 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            className="w-full h-80 bg-slate-950 hud-border p-6 text-slate-300 text-sm font-bold leading-relaxed focus:outline-none focus:hud-border-focus transition-all" 
            placeholder="DEPOSIT RAW SYLLABUS DATA HERE... HIGHEST WEIGHT TOPICS PREFERRED." 
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating || !input.trim()} 
            className={`flex-grow py-5 flex items-center justify-center gap-4 font-black uppercase tracking-[0.3em] transition-all ${
              isGenerating ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-[0.98]'
            }`}
          >
            {isGenerating ? <Zap className="h-6 w-6 animate-pulse text-orange-500" /> : <Cpu className="h-6 w-6" />}
            {isGenerating ? 'Synthesizing Tactical Data...' : 'Commence Intelligence Augmentation'}
          </button>
          
          <button 
            onClick={() => setTab('DECKS')} 
            className="px-8 py-5 bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            Return to War Chest
          </button>
        </div>

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-4 animate-in zoom-in duration-300">
            <Check className="h-5 w-5" /> Module Successfully Deployed to Combat Decks
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { step: "01", icon: Copy, label: "Capture syllabus text or personal notes." },
          { step: "02", icon: Zap, label: "Neural processing optimizes for high weightage topics." },
          { step: "03", icon: Save, label: "Stored in War Chest for immediate recall strikes." }
        ].map((item, idx) => (
          <div key={idx} className="p-6 bg-slate-900/40 hud-border border-slate-800 flex items-start gap-4">
            <span className="text-orange-600 font-black text-xl italic">{item.step}</span>
            <div className="space-y-1">
              <item.icon className="h-4 w-4 text-slate-500" />
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
