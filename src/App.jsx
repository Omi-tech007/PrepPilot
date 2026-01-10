import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, Zap, Flame, Trophy, 
  Play, Pause, CheckCircle, X, ChevronRight, 
  Plus, Trash2, FileText, TrendingUp, LogOut,
  Timer as TimerIcon, StopCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- FIREBASE IMPORTS ---
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase"; 

/**
 * JEEPLANET PRO - v11.0 (New Timer UI + Stacked Bar Charts)
 */

// --- CONSTANTS ---
const SUBJECTS = ["Physics", "Maths", "Organic Chem", "Inorganic Chem", "Physical Chem"];
// Colors for Charts: Physics (Purple), Maths (Blue), Chem (Green)
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981']; 

const INITIAL_DATA = {
  dailyGoal: 10,
  tasks: [],
  subjects: SUBJECTS.reduce((acc, sub) => ({
    ...acc,
    [sub]: { chapters: [], timeSpent: 0 }
  }), {}),
  mockTests: [],
  history: {}, 
  xp: 0, 
  darkMode: true
};

// --- UTILITY COMPONENTS ---
const GlassCard = ({ children, className = "", hover = false }) => (
  <motion.div 
    whileHover={hover ? { scale: 1.01, backgroundColor: "rgba(255,255,255,0.08)" } : {}}
    className={`bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl ${className}`}
  >
    {children}
  </motion.div>
);

// --- 1. LOGIN SCREEN ---
const LoginScreen = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error logging in", error);
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="h-screen w-full bg-[#09090b] flex flex-col items-center justify-center text-center p-6">
      <div className="mb-8 p-6 bg-violet-600/20 rounded-full animate-pulse">
        <Zap size={64} className="text-violet-500" />
      </div>
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
        JEEPlanet <span className="text-violet-500">Pro</span>
      </h1>
      <p className="text-gray-400 mb-8 max-w-md">
        Sync your syllabus, track your streak, and analyze mock tests across all your devices.
      </p>
      <button 
        onClick={handleLogin}
        className="px-8 py-4 bg-white text-black font-bold rounded-xl flex items-center gap-3 hover:bg-gray-200 transition-transform active:scale-95 shadow-xl shadow-white/10"
      >
        <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
        Continue with Google
      </button>
    </div>
  );
};

// --- 2. NEW FULL PAGE FOCUS TIMER ---
const FocusTimer = ({ data, onSaveSession }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedSub, setSelectedSub] = useState(SUBJECTS[0]);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => setTimeLeft(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    setIsActive(false);
    if (timeLeft > 0) {
        if(window.confirm("End session and save time?")) {
            onSaveSession(selectedSub, timeLeft);
            setTimeLeft(0);
        }
    }
  };

  // Calculate Daily Goal Progress
  const today = new Date().toISOString().split('T')[0];
  const todayMins = data.history?.[today] || 0;
  const goalMins = data.dailyGoal * 60;
  const percent = Math.min((todayMins / goalMins) * 100, 100);

  return (
    <div className="h-full flex flex-col relative">
      
      {/* Top Left: Daily Goal Pill */}
      <div className="absolute top-0 left-0">
          <div className="bg-[#18181b] border border-white/10 rounded-full py-2 px-4 flex items-center gap-3 w-64 shadow-lg">
             <div className="flex flex-col flex-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-1">
                    <span>Daily Goal</span>
                    <span>{Math.round(todayMins/60)}h / {data.dailyGoal}h</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 transition-all duration-500" style={{width: `${percent}%`}}></div>
                </div>
             </div>
          </div>
      </div>

      {/* Main Timer Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-12">
         
         {/* Time Display */}
         <div className="text-center">
             <div className="text-[8rem] md:text-[10rem] font-bold font-mono tracking-tighter leading-none text-white tabular-nums drop-shadow-2xl">
                 {formatTime(timeLeft)}
             </div>
             <p className="text-gray-500 mt-2 font-medium tracking-wide">FOCUS SESSION</p>
         </div>

         {/* Controls Container */}
         <div className="bg-[#18181b] border border-white/10 p-2 rounded-2xl flex items-center gap-4 shadow-2xl">
            
            {/* Subject Selector */}
            <div className="relative group">
                <select 
                  className="appearance-none bg-[#27272a] hover:bg-[#3f3f46] text-white py-3 pl-4 pr-10 rounded-xl font-bold outline-none cursor-pointer transition-colors"
                  value={selectedSub}
                  onChange={(e) => setSelectedSub(e.target.value)}
                  disabled={isActive}
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronRight size={16} className="rotate-90" />
                </div>
            </div>

            {/* Main Action Button */}
            {!isActive ? (
                <button 
                  onClick={() => setIsActive(true)}
                  className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Play size={20} fill="currentColor" /> Start
                </button>
            ) : (
                <button 
                  onClick={() => setIsActive(false)}
                  className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Pause size={20} fill="currentColor" /> Pause
                </button>
            )}

            {/* Stop Button */}
            {(timeLeft > 0 || isActive) && (
                 <button 
                 onClick={handleStop}
                 className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors border border-red-500/20"
               >
                 <StopCircle size={20} />
               </button>
            )}
         </div>
      </div>
    </div>
  );
};

// --- 3. MOCK TEST TRACKER (Stacked Bar Chart) ---
const MockTestTracker = ({ data, setData }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState('All'); 
  const [testType, setTestType] = useState('Mains');
  const [newTest, setNewTest] = useState({ name: '', date: '', p: '', c: '', m: '', maxMarks: 300 });

  const addTest = () => {
    if (!newTest.name || !newTest.date) return;
    const p = parseFloat(newTest.p) || 0;
    const c = parseFloat(newTest.c) || 0;
    const m = parseFloat(newTest.m) || 0;
    const total = p + c + m;
    const max = testType === 'Mains' ? 300 : (parseInt(newTest.maxMarks) || 360);
    const testEntry = { id: Date.now(), type: testType, name: newTest.name, date: newTest.date, p, c, m, total, maxMarks: max };

    setData(prev => ({ ...prev, mockTests: [...(prev.mockTests || []), testEntry] }));
    setIsAdding(false);
    setNewTest({ name: '', date: '', p: '', c: '', m: '', maxMarks: 300 });
  };

  const deleteTest = (id) => {
    if(window.confirm("Delete record?")) setData(prev => ({ ...prev, mockTests: prev.mockTests.filter(t => t.id !== id) }));
  };

  const filteredTests = (data.mockTests || []).filter(t => {
    if (filterType === 'All') return true;
    return t.type === filterType || (!t.type && filterType === 'Mains'); 
  });
  
  const sortedTests = [...filteredTests].sort((a,b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2">Mock Test Analysis</h1>
           <p className="text-gray-400">Scores by Subject (Stacked)</p>
        </div>
        <div className="flex gap-2">
            {['All', 'Mains', 'Advanced'].map(t => (
                <button key={t} onClick={() => setFilterType(t)} className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${filterType===t ? 'bg-violet-600 text-white border-violet-600' : 'border-white/10 text-gray-400'}`}>{t}</button>
            ))}
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold flex items-center gap-2">
          {isAdding ? <X size={18}/> : <Plus size={18}/>} {isAdding ? 'Cancel' : 'Log Test'}
        </button>
      </div>

      {isAdding && (
        <GlassCard className="border-t-4 border-t-violet-500">
          <div className="flex gap-4 mb-6">
             {['Mains', 'Advanced'].map(t => (
                 <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" className="accent-violet-500" checked={testType === t} onChange={() => setTestType(t)} />
                    <span className={testType === t ? 'text-white font-bold' : 'text-gray-400'}>JEE {t}</span>
                 </label>
             ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
            <div className="col-span-2 space-y-2"><label className="text-xs text-gray-400 font-bold uppercase">Name</label><input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none" value={newTest.name} onChange={e => setNewTest({...newTest, name: e.target.value})} /></div>
            <div className="space-y-2"><label className="text-xs text-gray-400 font-bold uppercase">Date</label><input type="date" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none" value={newTest.date} onChange={e => setNewTest({...newTest, date: e.target.value})} /></div>
            <div className="space-y-2"><label className="text-xs text-violet-400 font-bold uppercase">Physics</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none" value={newTest.p} onChange={e => setNewTest({...newTest, p: e.target.value})} /></div>
            <div className="space-y-2"><label className="text-xs text-green-400 font-bold uppercase">Chem</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none" value={newTest.c} onChange={e => setNewTest({...newTest, c: e.target.value})} /></div>
            <div className="space-y-2"><label className="text-xs text-blue-400 font-bold uppercase">Maths</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none" value={newTest.m} onChange={e => setNewTest({...newTest, m: e.target.value})} /></div>
          </div>
          {testType === 'Advanced' && <div className="mt-4"><input type="number" placeholder="Total Max Marks (e.g. 360)" className="bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none" value={newTest.maxMarks} onChange={e => setNewTest({...newTest, maxMarks: e.target.value})} /></div>}
          <button onClick={addTest} className="mt-6 w-full py-3 font-bold rounded-lg bg-violet-600 text-white hover:bg-violet-700">Save Score</button>
        </GlassCard>
      )}

      {/* STACKED BAR CHART */}
      {sortedTests.length > 0 ? (
        <GlassCard className="h-[400px]">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={sortedTests} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
               <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
               <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
               <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff'}} />
               <Legend iconType="circle" />
               <Bar dataKey="p" name="Physics" stackId="a" fill="#8b5cf6" barSize={40} radius={[0,0,4,4]} />
               <Bar dataKey="c" name="Chemistry" stackId="a" fill="#10b981" barSize={40} />
               <Bar dataKey="m" name="Maths" stackId="a" fill="#3b82f6" barSize={40} radius={[4,4,0,0]} />
             </BarChart>
           </ResponsiveContainer>
        </GlassCard>
      ) : <div className="text-center py-10 text-gray-500">No tests logged.</div>}
    </div>
  );
};

// --- 4. SYLLABUS COMPONENT ---
const Syllabus = ({ data, setData }) => {
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [gradeView, setGradeView] = useState('11');

  const addChapter = () => {
    const name = prompt(`Enter Class ${gradeView} Chapter Name:`);
    const lectures = prompt("Total Main Lectures:");
    if (name && lectures) {
      const newChapter = { id: Date.now().toString(), name, totalLectures: parseInt(lectures), lectures: new Array(parseInt(lectures)).fill(false), grade: gradeView };
      const newData = { ...data };
      newData.subjects[selectedSubject].chapters.push(newChapter);
      setData(newData);
    }
  };

  const updateChapter = (updated) => {
    const newData = { ...data };
    const idx = newData.subjects[selectedSubject].chapters.findIndex(c => c.id === updated.id);
    newData.subjects[selectedSubject].chapters[idx] = updated;
    setData(newData);
  };

  const deleteChapter = (id) => {
    const newData = { ...data };
    newData.subjects[selectedSubject].chapters = newData.subjects[selectedSubject].chapters.filter(c => c.id !== id);
    setData(newData);
  };

  const filteredChapters = data.subjects[selectedSubject].chapters.filter(c => c.grade === gradeView || (!c.grade && gradeView === '11'));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Syllabus Tracker</h1>
        <button onClick={addChapter} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold flex items-center gap-2"><Plus size={18} /> Add Chapter</button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">{SUBJECTS.map(s => <button key={s} onClick={() => setSelectedSubject(s)} className={`px-6 py-3 rounded-xl font-bold transition ${selectedSubject === s ? 'bg-white text-black' : 'bg-[#121212] border border-white/10 text-gray-400'}`}>{s}</button>)}</div>
      <div className="grid gap-4">{filteredChapters.map(chapter => <ChapterItem key={chapter.id} chapter={chapter} onUpdate={updateChapter} onDelete={deleteChapter} />)}</div>
    </div>
  );
};

const ChapterItem = ({ chapter, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const completed = chapter.lectures.filter(l => l).length;
  const progress = chapter.totalLectures > 0 ? Math.round((completed/chapter.totalLectures)*100) : 0;
  const toggleLec = (i) => { const newLecs = [...chapter.lectures]; newLecs[i] = !newLecs[i]; onUpdate({ ...chapter, lectures: newLecs }); };

  return (
    <GlassCard>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${progress===100 ? 'bg-green-500/20 text-green-500' : 'bg-violet-500/20 text-violet-500'}`}>{progress===100 ? <CheckCircle size={24} /> : <BookOpen size={24} />}</div>
          <div><h3 className="text-xl font-bold text-white">{chapter.name}</h3><p className="text-sm text-gray-400">{completed}/{chapter.totalLectures} • {progress}%</p></div>
        </div>
        <div className="flex gap-2"><button onClick={(e) => {e.stopPropagation(); onDelete(chapter.id);}} className="text-gray-600 hover:text-red-500"><Trash2 size={18}/></button><ChevronRight className={`transition ${expanded?'rotate-90':''}`} /></div>
      </div>
      {expanded && <div className="mt-6 grid grid-cols-8 gap-2">{chapter.lectures.map((done, i) => <button key={i} onClick={() => toggleLec(i)} className={`p-2 rounded text-sm font-bold border ${done ? 'bg-violet-600 border-violet-600 text-white' : 'border-white/10 text-gray-500'}`}>{i+1}</button>)}</div>}
    </GlassCard>
  );
};

// --- 5. DASHBOARD ---
const Dashboard = ({ data, setData, goToTimer, user }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayMins = data.history?.[today] || 0;
  const xp = data.xp || 0;
  const level = Math.floor(xp / 1000);

  const getSubjectDistribution = () => {
    const pTime = data.subjects["Physics"]?.timeSpent || 0;
    const mTime = data.subjects["Maths"]?.timeSpent || 0;
    const cTime = (data.subjects["Organic Chem"]?.timeSpent || 0) + (data.subjects["Inorganic Chem"]?.timeSpent || 0) + (data.subjects["Physical Chem"]?.timeSpent || 0);
    if (pTime + cTime + mTime === 0) return [{name: 'No Data', value: 1}];
    return [{ name: 'Physics', value: pTime }, { name: 'Maths', value: mTime }, { name: 'Chemistry', value: cTime }];
  };

  const addTask = () => { const t = prompt("Task?"); if(t) setData(prev => ({ ...prev, tasks: [{ id: Date.now(), text: t, completed: false }, ...prev.tasks] })); };
  const toggleTask = (id) => setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) }));
  const removeTask = (id) => setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  const pieData = getSubjectDistribution();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-[#121212] border border-white/10 p-8 rounded-2xl flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2">Hello, {user?.displayName?.split(' ')[0]}! 👋</h1>
           <p className="text-gray-400">Level {level} • {xp.toLocaleString()} XP</p>
        </div>
        <button onClick={goToTimer} className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold flex items-center gap-2">
            <Play size={18} fill="currentColor" /> Start Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DONUT CHART */}
        <GlassCard className="min-h-[350px] flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-white mb-4 self-start">Subject Balance</h3>
          <div className="relative w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === 'No Data' ? '#333' : COLORS[index % COLORS.length]} stroke="none" />)}
                </Pie>
                <RechartsTooltip contentStyle={{backgroundColor: '#18181b', borderRadius: '8px', border:'none'}} formatter={(val) => `${Math.round(val/60)}m`} />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
               <span className="text-gray-500 text-xs font-bold uppercase">Total</span>
               <span className="text-white text-2xl font-bold">{Math.round(todayMins/60)}h</span>
            </div>
          </div>
        </GlassCard>

        {/* TASKS */}
        <GlassCard>
           <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-white">Tasks</h3><button onClick={addTask} className="text-xs px-3 py-1 bg-white/10 text-white rounded hover:bg-white/20">+ Add</button></div>
           <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
             {data.tasks.map(task => (
               <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-violet-500/50 transition cursor-pointer">
                 <div onClick={() => toggleTask(task.id)} className="flex items-center gap-3">
                   <div className={`w-5 h-5 rounded-full border-2 ${task.completed ? 'bg-violet-500 border-violet-500' : 'border-gray-600'}`}>{task.completed && <CheckCircle size={12} className="text-white mx-auto mt-0.5" />}</div>
                   <span className={task.completed ? 'text-gray-500 line-through text-sm' : 'text-gray-200 text-sm'}>{task.text}</span>
                 </div>
                 <button onClick={() => removeTask(task.id)} className="text-gray-600 hover:text-red-500"><X size={14}/></button>
               </div>
             ))}
             {data.tasks.length === 0 && <div className="text-center text-gray-600 py-8">No tasks today.</div>}
           </div>
        </GlassCard>
      </div>
    </div>
  );
};

// --- MAIN APP SHELL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(INITIAL_DATA);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setData(docSnap.data());
        else await setDoc(docRef, INITIAL_DATA);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !loading) {
      const timeoutId = setTimeout(async () => {
        await setDoc(doc(db, "users", user.uid), data);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [data, user, loading]);

  const saveSession = (subject, seconds) => {
    const mins = parseFloat((seconds/60).toFixed(2));
    const today = new Date().toISOString().split('T')[0];
    setData(prev => ({
      ...prev,
      subjects: { ...prev.subjects, [subject]: { ...prev.subjects[subject], timeSpent: prev.subjects[subject].timeSpent + seconds } },
      history: { ...prev.history, [today]: (prev.history?.[today] || 0) + mins },
      xp: (prev.xp || 0) + Math.floor(mins),
    }));
  };

  const handleLogout = async () => { await signOut(auth); setData(INITIAL_DATA); };

  if (loading) return <div className="h-screen bg-[#09090b] flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans selection:bg-violet-500/30 flex">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="fixed left-0 top-0 h-full w-20 bg-[#09090b] border-r border-white/10 flex flex-col items-center py-8 z-40 hidden md:flex">
        <div className="mb-12 p-3 bg-white/5 rounded-xl border border-white/10"><Zap size={24} className="text-white" /></div>
        <nav className="flex flex-col gap-8 w-full">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
            { id: 'timer', icon: TimerIcon, label: 'Timer' }, // NEW TAB
            { id: 'syllabus', icon: BookOpen, label: 'Syllabus' },
            { id: 'mocks', icon: FileText, label: 'Mocks' },
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={`relative group w-full flex justify-center py-3 border-l-2 transition-all duration-300 ${view === item.id ? 'border-violet-500 text-white' : 'border-transparent text-gray-600 hover:text-violet-400'}`}>
              <item.icon size={24} />
              <span className="absolute left-14 bg-white text-black px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">{item.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="mt-auto p-3 text-gray-600 hover:text-red-500 transition"><LogOut size={24} /></button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="md:ml-20 flex-1 p-6 md:p-10 pb-24 h-screen overflow-y-auto">
        {view === 'dashboard' && <Dashboard data={data} setData={setData} goToTimer={() => setView('timer')} user={user} />}
        {view === 'timer' && <FocusTimer data={data} onSaveSession={saveSession} />} 
        {view === 'syllabus' && <Syllabus data={data} setData={setData} />}
        {view === 'mocks' && <MockTestTracker data={data} setData={setData} />}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#09090b]/95 backdrop-blur-md border-t border-white/10 p-4 flex justify-around z-50">
        <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'text-violet-500' : 'text-gray-500'}><LayoutDashboard /></button>
        <button onClick={() => setView('timer')} className={view === 'timer' ? 'text-violet-500' : 'text-gray-500'}><TimerIcon /></button>
        <button onClick={() => setView('syllabus')} className={view === 'syllabus' ? 'text-violet-500' : 'text-gray-500'}><BookOpen /></button>
        <button onClick={() => setView('mocks')} className={view === 'mocks' ? 'text-violet-500' : 'text-gray-500'}><FileText /></button>
      </div>
    </div>
  );
}