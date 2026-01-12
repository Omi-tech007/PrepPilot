import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, BookOpen, Zap, Flame, Trophy, 
  Play, Pause, CheckCircle, X, ChevronRight, ChevronLeft,
  Plus, Trash2, FileText, TrendingUp, LogOut,
  Timer as TimerIcon, StopCircle, Target, User,
  Settings, Image as ImageIcon, ExternalLink, Maximize, Minimize,
  PieChart as PieChartIcon, Upload, Bell, Calendar, Edit3, Mail, Lock, KeyRound, CheckSquare,
  Tag, Menu, HelpCircle, MessageSquare, Send, Bot, Sparkles, ArrowRight, Paperclip, Image as ImgIcon
} from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
  Legend, LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- FIREBASE IMPORTS ---
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase"; 

/**
 * PREPPILOT - v42.0 (Image Support + Chat Save + Math Formatting)
 */

// --- CONSTANTS ---
const ALL_SUBJECTS = ["Physics", "Maths", "Biology", "Organic Chem", "Inorganic Chem", "Physical Chem"];
const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ec4899']; 

const EXAM_CONFIG = {
  "JEE Mains (Jan) 2027": { date: "2027-01-21", marks: 300, type: "Math" },
  "JEE Mains (April) 2027": { date: "2027-04-02", marks: 300, type: "Math" },
  "JEE Advanced 2026": { date: "2026-05-15", marks: 0, type: "Math" }, 
  "JEE Advanced 2027": { date: "2027-05-15", marks: 0, type: "Math" },
  "BITSAT 2027": { date: "2027-04-15", marks: 390, type: "Math" },
  "NEET 2026": { date: "2026-05-05", marks: 720, type: "Bio" },
  "NEET 2027": { date: "2027-05-05", marks: 720, type: "Bio" },
  "MHT-CET (PCM) 2026": { date: "2026-04-10", marks: 200, type: "Math" },
  "MHT-CET (PCB) 2026": { date: "2026-04-10", marks: 200, type: "Bio" },
  "MHT-CET (PCM) 2027": { date: "2027-04-10", marks: 200, type: "Math" },
  "MHT-CET (PCB) 2027": { date: "2027-04-10", marks: 200, type: "Bio" },
};

// --- THEME ENGINE ---
const THEME_COLORS = [
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Slate', hex: '#64748b' },
];

const getThemeStyles = (themeName) => {
  const safeName = themeName || 'Violet';
  const map = {
    'Teal': { bg: 'bg-teal-600', hover: 'hover:bg-teal-700', text: 'text-teal-500', border: 'border-teal-500', light: 'bg-teal-500/20', stroke: '#14b8a6', ring: 'ring-teal-500', msgUser: 'bg-teal-600', msgAi: 'bg-teal-900/40' },
    'Rose': { bg: 'bg-rose-600', hover: 'hover:bg-rose-700', text: 'text-rose-500', border: 'border-rose-500', light: 'bg-rose-500/20', stroke: '#f43f5e', ring: 'ring-rose-500', msgUser: 'bg-rose-600', msgAi: 'bg-rose-900/40' },
    'Violet': { bg: 'bg-violet-600', hover: 'hover:bg-violet-700', text: 'text-violet-500', border: 'border-violet-500', light: 'bg-violet-500/20', stroke: '#8b5cf6', ring: 'ring-violet-500', msgUser: 'bg-violet-600', msgAi: 'bg-violet-900/40' },
    'Amber': { bg: 'bg-amber-600', hover: 'hover:bg-amber-700', text: 'text-amber-500', border: 'border-amber-500', light: 'bg-amber-500/20', stroke: '#f59e0b', ring: 'ring-amber-500', msgUser: 'bg-amber-600', msgAi: 'bg-amber-900/40' },
    'Cyan': { bg: 'bg-cyan-600', hover: 'hover:bg-cyan-700', text: 'text-cyan-500', border: 'border-cyan-500', light: 'bg-cyan-500/20', stroke: '#06b6d4', ring: 'ring-cyan-500', msgUser: 'bg-cyan-600', msgAi: 'bg-cyan-900/40' },
    'Slate': { bg: 'bg-slate-600', hover: 'hover:bg-slate-700', text: 'text-slate-500', border: 'border-slate-500', light: 'bg-slate-500/20', stroke: '#64748b', ring: 'ring-slate-500', msgUser: 'bg-slate-600', msgAi: 'bg-slate-900/40' },
  };
  return map[safeName] || map['Violet'];
};

const INITIAL_DATA = {
  dailyGoal: 10,
  tasks: [],
  subjects: ALL_SUBJECTS.reduce((acc, sub) => ({ ...acc, [sub]: { chapters: [], timeSpent: 0 } }), {}),
  mockTests: [],
  kppList: [],
  history: {}, 
  xp: 0, 
  settings: { theme: 'Violet', mode: 'Dark', username: '' },
  bgImage: "",
  selectedExams: [], 
};

const getUserSubjects = (selectedExams) => {
  let showMath = false, showBio = false;
  const exams = selectedExams || [];
  if (exams.length === 0) return ALL_SUBJECTS;
  
  exams.forEach(exam => {
    const type = EXAM_CONFIG[exam]?.type;
    if (type === 'Math') showMath = true;
    if (type === 'Bio') showBio = true;
  });
  return ALL_SUBJECTS.filter(sub => {
    if (sub === 'Maths' && !showMath) return false;
    if (sub === 'Biology' && !showBio) return false;
    return true;
  });
};

// --- UTILITY: SUPER SMART TEXT FORMATTER (MATH EDITION) ---
const formatMathSymbols = (text) => {
  if (!text) return "";
  return text
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\\int/g, "∫")
    .replace(/\\theta/g, "θ")
    .replace(/\\pi/g, "π")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\lambda/g, "λ")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\infty/g, "∞")
    .replace(/\\approx/g, "≈")
    .replace(/\\neq/g, "≠")
    .replace(/sqrt/g, "√")
    .replace(/->/g, "→");
};

const SmartText = ({ text }) => {
  if (!text) return null;
  const cleanedText = formatMathSymbols(text);
  const lines = cleanedText.split('\n');
  
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return <div key={i} className="flex gap-2 ml-2"><span className="text-gray-400 mt-1.5">•</span><p className="flex-1"><FormatInline text={line.trim().substring(2)} /></p></div>;
        }
        if (line.trim().endsWith(':')) return <h4 key={i} className="font-bold mt-3 mb-1 text-base"><FormatInline text={line} /></h4>;
        if (!line.trim()) return <div key={i} className="h-2"></div>;
        return <p key={i}><FormatInline text={line} /></p>;
      })}
    </div>
  );
};

const FormatInline = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return <>{parts.map((part, j) => part.startsWith('**') && part.endsWith('**') ? <strong key={j} className="font-bold text-inherit">{part.slice(2, -2)}</strong> : <span key={j}>{part}</span>)}</>;
};

// --- UTILITY COMPONENTS ---
const GlassCard = ({ children, className = "", hover = false, isDark = true }) => (
  <motion.div 
    whileHover={hover ? { scale: 1.01, backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" } : {}}
    className={`${isDark ? 'bg-[#121212] border-white/10' : 'bg-white border-black/10 shadow-lg'} border rounded-2xl p-6 shadow-xl ${className}`}
  >
    {children}
  </motion.div>
);

const StudyHeatmap = ({ history, theme, isDark }) => {
  const year = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i);
  const getCellColor = (minutes) => {
      if (!minutes) return isDark ? 'bg-white/5' : 'bg-gray-100'; 
      if (minutes > 0 && minutes <= 60) return `${theme.light} opacity-60`;
      if (minutes > 60 && minutes <= 180) return `${theme.light} opacity-100`;
      if (minutes > 180 && minutes <= 360) return theme.bg;
      return `${theme.bg} brightness-110 shadow-[0_0_8px_rgba(255,255,255,0.3)]`;
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {months.map(monthIndex => {
        const date = new Date(year, monthIndex, 1);
        const monthName = date.toLocaleString('default', { month: 'long' });
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const startDay = date.getDay();
        const slots = [];
        for(let i=0; i<startDay; i++) slots.push(null);
        for(let i=1; i<=daysInMonth; i++) {
            const dayStr = `${year}-${String(monthIndex+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const safeHistory = history || {};
            slots.push({ date: dayStr, day: i, mins: safeHistory[dayStr] || 0 });
        }
        return (
          <div key={monthIndex} className={`p-4 rounded-2xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
            <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{monthName}</h4>
            <div className="grid grid-cols-7 gap-1 mb-2">{['S','M','T','W','T','F','S'].map(d => (<div key={d} className="text-[10px] text-center text-gray-500 font-bold">{d}</div>))}</div>
            <div className="grid grid-cols-7 gap-1.5">{slots.map((slot, k) => !slot ? <div key={k} className="w-full h-full" /> : (<div key={k} title={`${slot.date}: ${Math.round(slot.mins/60)}h`} className={`aspect-square rounded-md transition-all hover:scale-110 cursor-pointer ${getCellColor(slot.mins)}`}></div>))}</div>
          </div>
        );
      })}
    </div>
  );
};

const SettingsView = ({ data, setData, user, onBack, theme, isDark }) => {
  const currentTheme = data.settings?.theme || 'Violet';
  const currentMode = data.settings?.mode || 'Dark';
  const username = data.settings?.username || user.displayName?.split(' ')[0] || "User";
  const handleUpdate = (field, value) => { setData(prev => ({ ...prev, settings: { ...(prev.settings || {}), [field]: value } })); };
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-500';
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className={`p-2 rounded-full transition ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}><ChevronRight className={`rotate-180 ${textPrimary}`} size={24} /></button>
        <div><h1 className={`text-3xl font-bold ${textPrimary}`}>Settings</h1><p className={textSecondary}>Manage your account and preferences</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
            <GlassCard isDark={isDark}>
              <h3 className={`flex items-center gap-2 text-xl font-bold ${textPrimary} mb-6`}><User size={24} className={theme.text} /> Profile</h3>
              <div className={`flex items-center gap-4 mb-8 p-4 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-black/5'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white uppercase border-2 ${theme.border} bg-gray-800`}>{user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" /> : username[0]}</div>
                <div><h4 className={`${textPrimary} font-bold text-lg`}>{user.displayName || "Pilot"}</h4><p className={textSecondary + " text-sm"}>{user.email}</p></div>
              </div>
              <div className="space-y-4"><label className="text-xs font-bold text-gray-500 uppercase">Username</label><div className="flex gap-2"><input type="text" value={username} onChange={(e) => handleUpdate('username', e.target.value)} className={`flex-1 border rounded-xl px-4 py-3 outline-none transition focus:${theme.border} ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}/></div></div>
            </GlassCard>
            <GlassCard isDark={isDark}>
                <h3 className={`flex items-center gap-2 text-xl font-bold ${textPrimary} mb-4`}><HelpCircle size={24} className={theme.text} /> Support & Feedback</h3>
                <p className={`${textSecondary} text-sm mb-6 leading-relaxed`}>Need help? Found a bug, or have a feature request? Your feedback is invaluable for improving <strong>PrepPilot</strong>.</p>
                <div className={`p-4 rounded-xl border flex flex-col items-center text-center gap-3 ${isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-black/5'}`}>
                    <MessageSquare size={32} className={theme.text} />
                    <div><p className={`text-sm font-bold ${textPrimary} mb-1`}>Contact Developer</p><a href="mailto:omkarbg0110@gmail.com" className={`text-lg font-bold hover:underline ${theme.text}`}>omkarbg0110@gmail.com</a></div>
                </div>
            </GlassCard>
        </div>
        <GlassCard isDark={isDark} className="h-full">
          <h3 className={`flex items-center gap-2 text-xl font-bold ${textPrimary} mb-6`}><ImageIcon size={24} className={theme.text} /> Appearance</h3>
          <div className="mb-8"><label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Theme</label><div className="grid grid-cols-2 gap-3">{THEME_COLORS.map((t) => { const isActive = currentTheme === t.name; return ( <button key={t.name} onClick={() => handleUpdate('theme', t.name)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isActive ? `${theme.light} ${theme.border}` : `bg-transparent ${isDark ? 'border-white/10 hover:border-white/30' : 'border-black/10 hover:border-black/30'}`}`}><div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.hex }}></div><span className={`text-sm font-bold ${isActive ? textPrimary : textSecondary}`}>{t.name}</span>{isActive && <CheckCircle size={16} className={theme.text} />}</button> )})}</div></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Display Mode</label><button onClick={() => handleUpdate('mode', currentMode === 'Dark' ? 'Light' : 'Dark')} className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}><span className={`text-sm font-bold ${textPrimary}`}>{currentMode} Mode</span><div className={`w-12 h-6 rounded-full border border-white/10 relative transition-colors ${currentMode === 'Dark' ? theme.bg : 'bg-gray-400'}`}><div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-all ${currentMode === 'Dark' ? 'left-6' : 'left-1'}`} /></div></button></div>
        </GlassCard>
      </div>
    </div>
  );
};

// --- PREPAI VIEW (FULL SCREEN + IMAGE + PERSISTENCE) ---
const PrepAIView = ({ data, theme, isDark }) => {
  // Load from local storage or default
  const loadHistory = () => {
    const saved = localStorage.getItem('prepai_history');
    return saved ? JSON.parse(saved) : [{ role: 'model', text: 'Hello! I am PrepAI. Ask me to solve a doubt, explain a topic, or analyze your study data. You can also upload images of questions!' }];
  };

  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const textCol = isDark ? 'text-white' : 'text-gray-900';
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // Save history on change
  useEffect(() => { localStorage.setItem('prepai_history', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const clearChat = () => {
    if(window.confirm("Delete chat history?")) {
      const reset = [{ role: 'model', text: 'Chat cleared. Ready for new doubts!' }];
      setMessages(reset);
      localStorage.setItem('prepai_history', JSON.stringify(reset));
    }
  };

  // Helper: Convert File to Base64 for Gemini
  async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setImage(file);
  };

  const handleSend = async () => {
    if (!input.trim() && !image) return;
    const userMsg = { role: 'user', text: input, image: image ? URL.createObjectURL(image) : null };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentImage = image; // Capture for async
    setImage(null);
    setLoading(true);

    try {
      // --- API KEY HERE ---
      const genAI = new GoogleGenerativeAI("AIzaSyCUxcGF6dYqYm4uoZavFWOZyC7n795Hxso");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // 1.5 Flash supports images

      const context = `SYSTEM: You are PrepAI, an expert JEE/NEET tutor. Use clear formatting. If the user sends an image, solve the question in it step-by-step.`;
      
      let promptParts = [context + "\n\nUser: " + userMsg.text];
      if (currentImage) {
        const imagePart = await fileToGenerativePart(currentImage);
        promptParts.push(imagePart);
      }

      const result = await model.generateContent(promptParts);
      const response = await result.response;
      setMessages(prev => [...prev, { role: 'model', text: response.text() }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to AI. Please check your API key and Internet." }]);
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col w-full relative">
      {/* Top Bar (Full Width) */}
      <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-white/10 bg-[#09090b]' : 'border-gray-200 bg-white'}`}>
        <h1 className={`text-2xl font-bold flex items-center gap-2 ${textCol}`}><Sparkles className={theme.text} /> PrepAI</h1>
        <button onClick={clearChat} className="p-2 text-gray-500 hover:text-red-500 transition"><Trash2 size={20}/></button>
      </div>
      
      {/* Chat Area (Full Screen) */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar ${isDark ? 'bg-[#09090b]' : 'bg-gray-50'}`}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1 ${theme.bg} text-white`}><Bot size={16} /></div>}
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? `${theme.msgUser} text-white rounded-br-none` : `${isDark ? 'bg-white/10 text-gray-200' : 'bg-white text-gray-800'} rounded-bl-none`}`}>
              {msg.image && <img src={msg.image} alt="User upload" className="mb-3 rounded-lg max-h-60 object-contain" />}
              <SmartText text={msg.text} />
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start items-center gap-2 text-xs text-gray-500 ml-11"><span className="animate-pulse">Thinking & Solving...</span></div>}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t ${isDark ? 'border-white/10 bg-[#09090b]' : 'border-gray-200 bg-white'}`}>
        {image && (
          <div className="flex items-center gap-2 mb-2 p-2 rounded bg-gray-100 dark:bg-white/10 w-fit">
            <ImgIcon size={14} className={textCol}/> 
            <span className={`text-xs ${textCol}`}>Image selected</span>
            <button onClick={()=>setImage(null)}><X size={14} className="text-gray-500"/></button>
          </div>
        )}
        <div className={`flex items-center gap-3 p-2 rounded-xl border ${isDark ? 'bg-black/20 border-white/10' : 'bg-gray-100 border-transparent'}`}>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
          <button onClick={() => fileInputRef.current.click()} className={`p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 ${image ? theme.text : ''}`}>
            <Paperclip size={20} />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a math problem, or upload a photo..." 
            className={`flex-1 bg-transparent outline-none text-sm ${textCol} placeholder-gray-500`}
          />
          <button onClick={handleSend} disabled={loading} className={`p-2 rounded-lg ${theme.bg} text-white hover:scale-105 transition disabled:opacity-50`}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD ---
const Dashboard = ({ data, setData, goToTimer, setView, user, theme, isDark }) => {
  const today = new Date().toISOString().split('T')[0];
  const history = data.history || {}; const todayMins = history[today] || 0;
  let streak = 0; if ((history[today] || 0) > 0) streak++; let d = new Date(); d.setDate(d.getDate() - 1); while (true) { const dateStr = d.toISOString().split('T')[0]; if ((history[dateStr] || 0) > 0) { streak++; d.setDate(d.getDate() - 1); } else break; }
  const getCountdowns = () => { const exams = data.selectedExams || []; return exams.map(exam => { const config = EXAM_CONFIG[exam]; if (!config) return null; const diff = new Date(config.date) - new Date(); if (diff < 0) return null; return { exam, days: Math.floor(diff / (1000 * 60 * 60 * 24)) }; }).filter(Boolean).sort((a,b) => a.days - b.days); };
  const countdowns = getCountdowns();
  const getWeeklyData = () => { const now = new Date(); const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); const chart = []; for(let i=0; i<7; i++){ const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); chart.push({ name: d.toLocaleDateString('en-US',{weekday:'short'}), hours: parseFloat(((history[d.toISOString().split('T')[0]]||0)/60).toFixed(1)) }); } return chart; };
  const addTask = () => { const t = prompt("Task Name:"); if(!t) return; const sub = prompt("Subject? (P, C, M, B or Leave empty)"); let subjectTag = "General"; if(sub) { if(sub.toLowerCase().startsWith('p')) subjectTag = "Physics"; if(sub.toLowerCase().startsWith('c')) subjectTag = "Chemistry"; if(sub.toLowerCase().startsWith('m')) subjectTag = "Maths"; if(sub.toLowerCase().startsWith('b')) subjectTag = "Biology"; } setData(prev => ({ ...prev, tasks: [{ id: Date.now(), text: t, subject: subjectTag, completed: false }, ...prev.tasks] })); };
  const toggleTask = (id) => setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) }));
  const removeTask = (id) => setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  const textCol = isDark ? 'text-white' : 'text-gray-900';

  const [briefing, setBriefing] = useState("");
  const [loadingBrief, setLoadingBrief] = useState(false);

  const generateBriefing = async () => {
    setLoadingBrief(true);
    try {
      // --- API KEY HERE ---
      const genAI = new GoogleGenerativeAI("AIzaSyCUxcGF6dYqYm4uoZavFWOZyC7n795Hxso");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Give me a 2-sentence summary of my day. Data: Studied ${Math.floor(todayMins/60)}h ${Math.round(todayMins%60)}m. Streak: ${streak}. Pending Tasks: ${data.tasks.filter(t=>!t.completed).length}.`;
      const result = await model.generateContent(prompt);
      setBriefing(result.response.text());
    } catch (e) { setBriefing("Unable to generate briefing."); }
    setLoadingBrief(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="text-center space-y-8 py-4">
          <div><p className="text-gray-500 text-xs font-bold tracking-widest mb-2 uppercase">TODAY'S FOCUS</p><h1 className={`text-8xl font-bold ${textCol} tracking-tighter`}>{Math.floor(todayMins/60)}h <span className="text-4xl text-gray-500">{Math.round(todayMins%60)}m</span></h1></div>
          <div className="flex flex-wrap justify-center gap-4">
              <div className={`border p-4 rounded-2xl flex flex-col items-center min-w-[140px] ${isDark ? 'bg-[#18181b] border-white/10' : 'bg-white border-gray-200'}`}><div className={`text-3xl font-bold ${textCol} mb-1`}>{streak} <span className="text-sm text-orange-500">🔥</span></div><span className="text-[10px] text-gray-500 uppercase font-bold">Streak</span></div>
              {countdowns.map((cd, i) => (
                  <div key={i} className={`border p-4 rounded-2xl flex flex-col items-center min-w-[140px] ${isDark ? 'bg-[#18181b] border-white/10' : 'bg-white border-gray-200'}`}>
                      <div className={`text-3xl font-bold ${textCol} mb-1`}>{cd.days} <span className={`text-sm ${theme.text}`}>d</span></div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold truncate max-w-[120px]">{cd.exam}</span>
                  </div>
              ))}
          </div>
      </div>

      <GlassCard className={`relative overflow-hidden ${isDark ? `border-${theme.border} bg-white/5` : 'bg-white border-gray-200'}`} isDark={isDark}>
        <div className="flex justify-between items-start gap-4">
            <div>
                <h3 className={`font-bold flex items-center gap-2 ${textCol} mb-2`}><Sparkles size={18} className="text-yellow-400" /> AI Daily Briefing</h3>
                {briefing ? (
                    <div className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}><SmartText text={briefing} /></div>
                ) : (
                    <p className="text-xs text-gray-500 italic">Get a quick summary of your progress and tasks.</p>
                )}
            </div>
            <div className="flex flex-col gap-2">
                {!briefing && <button onClick={generateBriefing} disabled={loadingBrief} className={`px-4 py-2 rounded-lg text-xs font-bold ${theme.bg} text-white`}>{loadingBrief ? '...' : 'Generate'}</button>}
                <button onClick={() => setView('prepai')} className={`px-4 py-2 rounded-lg text-xs font-bold border flex items-center gap-2 ${isDark ? 'border-white/10 hover:bg-white/10 text-white' : 'border-gray-200 hover:bg-gray-100 text-black'}`}>Ask PrepAI <ArrowRight size={12} /></button>
            </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="min-h-[300px] flex flex-col" isDark={isDark}>
          <h3 className={`text-lg font-bold ${textCol} mb-6`}>This Week</h3>
          <div className="flex-1 w-full min-h-[200px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={getWeeklyData()}><defs><linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.stroke} stopOpacity={0.8}/><stop offset="95%" stopColor={theme.stroke} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} /><YAxis hide /><RechartsTooltip contentStyle={{backgroundColor: isDark ? '#18181b' : '#fff', borderColor: isDark ? '#27272a' : '#ddd', color: isDark?'#fff':'#000'}} /><Area type="monotone" dataKey="hours" stroke={theme.stroke} strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" /></AreaChart></ResponsiveContainer></div>
        </GlassCard>
        <GlassCard isDark={isDark}>
            <div className="flex justify-between items-center mb-6"><h3 className={`text-lg font-bold ${textCol}`}>Tasks</h3><button onClick={addTask} className={`text-xs px-3 py-1 rounded ${isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>+ Add</button></div>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {data.tasks.map(task => (
                <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${isDark ? 'bg-white/5 border-white/5 hover:border-white/20' : 'bg-gray-50 border-black/5 hover:border-black/20'}`}>
                  <div onClick={() => toggleTask(task.id)} className="flex items-center gap-3"><div className={`w-5 h-5 rounded-full border-2 ${task.completed ? `${theme.bg} ${theme.border}` : 'border-gray-500'}`}>{task.completed && <CheckCircle size={12} className="text-white mx-auto mt-0.5" />}</div><div><span className={`block text-sm ${task.completed ? 'text-gray-500 line-through' : textCol}`}>{task.text}</span>{task.subject && <span className="text-[10px] text-gray-400">{task.subject}</span>}</div></div>
                  <button onClick={() => removeTask(task.id)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                </div>
              ))}
            </div>
        </GlassCard>
      </div>
    </div>
  );
};

// --- PROFILE DROPDOWN ---
const ProfileDropdown = ({ user, onLogout, onChangeExam, data, setView, theme, isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => { const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
  const textCol = isDark ? 'text-white' : 'text-gray-900';
  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-2 p-1 rounded-full transition-colors border ${isDark ? 'hover:bg-white/5 border-transparent hover:border-white/10' : 'hover:bg-black/5 border-transparent hover:border-black/10'}`}>
        <div className="hidden md:block text-right mr-1"><p className={`text-xs font-bold ${textCol} leading-none`}>{data.settings?.username || user.displayName?.split(' ')[0] || "User"}</p></div>
        {user.photoURL ? <img src={user.photoURL} alt="Profile" className={`w-8 h-8 rounded-full border-2 ${theme.border}`} /> : <div className={`w-8 h-8 rounded-full ${theme.bg} flex items-center justify-center text-white font-bold border-2 ${theme.border} text-xs uppercase`}>{user.email?.[0] || "U"}</div>}
      </button>
      <AnimatePresence>{isOpen && (<motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className={`absolute right-0 mt-2 w-60 border rounded-xl shadow-2xl z-50 overflow-hidden ${isDark ? 'bg-[#18181b] border-white/10' : 'bg-white border-black/10'}`}><div className={`p-3 border-b ${isDark ? 'border-white/5 bg-white/5' : 'border-black/5 bg-gray-50'}`}><p className={`${textCol} font-bold text-sm`}>{data.settings?.username || user.displayName || "User"}</p><p className="text-[10px] text-gray-400 mt-0.5 truncate">{user.email}</p></div><div className="p-1 space-y-1"><button onClick={() => { setIsOpen(false); setView('settings'); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs font-bold ${isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-600 hover:bg-black/5'}`}><Settings size={14} /> Settings</button><button onClick={() => { setIsOpen(false); onChangeExam(); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs font-bold ${isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-600 hover:bg-black/5'}`}><Edit3 size={14} /> Change Exams</button><button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs font-bold"><LogOut size={14} /> Log Out</button></div></motion.div>)}</AnimatePresence>
    </div>
  );
};

// --- APP SHELL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(INITIAL_DATA);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showExamSelect, setShowExamSelect] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open

  const theme = getThemeStyles(data?.settings?.theme || 'Violet');
  const isDark = (data?.settings?.mode || 'Dark') === 'Dark';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, "users", u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) { setData(docSnap.data()); if(!docSnap.data().selectedExams?.length) setShowExamSelect(true); }
        else { await setDoc(docRef, INITIAL_DATA); setShowExamSelect(true); }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { if (user && !loading) { const t = setTimeout(async () => { await setDoc(doc(db, "users", user.uid), data); }, 1000); return () => clearTimeout(t); } }, [data, user, loading]);
  const handleLogout = async () => { await signOut(auth); setData(INITIAL_DATA); };
  const saveSession = (subject, seconds) => { const mins = parseFloat((seconds/60).toFixed(2)); const today = new Date().toISOString().split('T')[0]; const newHistory = { ...data.history, [today]: (data.history?.[today] || 0) + mins }; const newSubjects = { ...data.subjects, [subject]: { ...data.subjects[subject], timeSpent: data.subjects[subject].timeSpent + seconds } }; setData(prev => ({ ...prev, subjects: newSubjects, history: newHistory, xp: (prev.xp || 0) + Math.floor(mins) })); };
  const handleExamSelect = (exams) => { setData(prev => ({ ...prev, selectedExams: exams })); setShowExamSelect(false); };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <LoginScreen />;
  if (!user.emailVerified) return <div className="h-screen bg-black flex flex-col items-center justify-center text-white"><h1 className="text-2xl font-bold mb-4">Verify Email</h1><p className="mb-6">Link sent to {user.email}</p><button onClick={()=>window.location.reload()} className="px-6 py-2 bg-violet-600 rounded-lg">Refresh</button></div>;
  if (showExamSelect) return <ExamSelectionScreen onSave={handleExamSelect} />;

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' }, 
    { id: 'prepai', icon: Bot, label: 'PrepAI' }, 
    { id: 'timer', icon: TimerIcon, label: 'Timer' }, 
    { id: 'analysis', icon: PieChartIcon, label: 'Analysis' }, 
    { id: 'syllabus', icon: BookOpen, label: 'Syllabus' }, 
    { id: 'mocks', icon: FileText, label: 'Mock Tests' }, 
    { id: 'kpp', icon: Target, label: 'Physics KPP' }
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 flex ${isDark ? 'bg-[#09090b] text-gray-200' : 'bg-gray-100 text-gray-900'}`}>
      <aside className={`fixed left-0 top-0 h-full border-r flex flex-col transition-all duration-300 z-40 hidden md:flex ${isSidebarOpen ? 'w-64' : 'w-20'} ${isDark ? 'bg-[#09090b] border-white/10' : 'bg-white border-black/10'}`}>
        <div className="flex items-center justify-between p-6">
            <div className={`flex items-center gap-3 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
               <Zap size={24} className={theme.text} />
               <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>PrepPilot</span>
            </div>
            {!isSidebarOpen && <Zap size={24} className={`${theme.text} mx-auto mb-4`} />}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1 rounded hover:bg-white/10 transition ${!isSidebarOpen && 'mx-auto'}`}><div className={isDark ? 'text-white' : 'text-black'}>{isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}</div></button>
        </div>
        <nav className="flex flex-col gap-2 w-full px-4 mt-4">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={`relative flex items-center gap-4 py-3 px-3 rounded-xl transition-all duration-200 group ${view === item.id ? `${theme.bg} text-white shadow-lg` : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
              <item.icon size={22} />
              {isSidebarOpen && <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>}
              {!isSidebarOpen && <span className={`absolute left-14 z-50 px-2 py-1 text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className={`flex-1 p-6 md:p-10 pb-24 h-screen overflow-y-auto custom-scrollbar transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        {view !== 'prepai' && (
          <div className={`flex justify-between items-center mb-8 sticky top-0 backdrop-blur-md z-30 py-2 -mt-4 border-b ${isDark ? 'bg-[#09090b]/90 border-white/5' : 'bg-gray-100/90 border-black/5'}`}>
             <h2 className={`text-xl font-bold capitalize flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{view === 'kpp' ? 'Physics KPP' : view}</h2>
             <ProfileDropdown user={user} onLogout={handleLogout} onChangeExam={() => setShowExamSelect(true)} data={data} setView={setView} theme={theme} isDark={isDark} />
          </div>
        )}

        {view === 'dashboard' && <Dashboard data={data} setData={setData} goToTimer={() => setView('timer')} setView={setView} user={user} theme={theme} isDark={isDark} />}
        {view === 'prepai' && <PrepAIView data={data} theme={theme} isDark={isDark} />}
        {view === 'analysis' && <Analysis data={data} theme={theme} isDark={isDark} />} 
        {view === 'timer' && <FocusTimer data={data} setData={setData} onSaveSession={saveSession} theme={theme} isDark={isDark} />} 
        {view === 'syllabus' && <Syllabus data={data} setData={setData} theme={theme} isDark={isDark} />}
        {view === 'mocks' && <MockTestTracker data={data} setData={setData} theme={theme} isDark={isDark} />}
        {view === 'kpp' && <PhysicsKPP data={data} setData={setData} theme={theme} isDark={isDark} />} 
        {view === 'settings' && <SettingsView data={data} setData={setData} user={user} onBack={() => setView('dashboard')} theme={theme} isDark={isDark} />}
      </main>

      <div className={`md:hidden fixed bottom-0 left-0 w-full backdrop-blur-md border-t p-4 flex justify-around z-50 ${isDark ? 'bg-[#09090b]/95 border-white/10' : 'bg-white/95 border-black/10'}`}>
        <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? theme.text : 'text-gray-500'}><LayoutDashboard /></button>
        <button onClick={() => setView('timer')} className={view === 'timer' ? theme.text : 'text-gray-500'}><TimerIcon /></button>
        <button onClick={() => setView('syllabus')} className={view === 'syllabus' ? theme.text : 'text-gray-500'}><BookOpen /></button>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500"><Menu /></button>
      </div>
    </div>
  );
}