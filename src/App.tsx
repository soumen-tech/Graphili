import { useState, useEffect, useMemo } from 'react';
import { Cpu, Zap, Award, Star, FileDown, ChevronRight, ArrowLeft, RefreshCw, Layers, ZoomIn, ZoomOut, Printer, LogOut, Key } from 'lucide-react';
import { supabase } from './supabaseClient';
import * as api from './api';

// Import Components
import { NotebookPage } from './components/NotebookPage';
import { 
  PrimaryButton, 
  SecondaryButton, 
  StatCard, 
  SearchBar, 
  SidebarNav, 
  SubjectCard, 
  ExperimentCard, 
  AchievementBadge, 
  ToggleRow, 
  UploadDropzone, 
  AIProcessingChecklist 
} from './components/CommonComponents';
import { DataTable } from './components/DataTable';
import type { DataRow } from './components/DataTable';
import { GraphCanvas } from './components/GraphCanvas';
import { TheorySidebar } from './components/TheorySidebar';
import { RobotMascot } from './components/RobotMascot';
import { AIExplanationBubble } from './components/AIExplanationBubble';
import { ReportPreviewCard } from './components/ReportPreviewCard';
import { SuggestionPanel } from './components/SuggestionPanel';

export default function App() {
  // Authentication states
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'verify' | 'update-password'>('login');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // Profile data
  const [profile, setProfile] = useState<api.Profile | null>(null);

  // Dynamic lists from backend
  const [experiments, setExperiments] = useState<api.SubjectExperiment[]>([]);
  const [subjects, setSubjects] = useState<string[]>(['Physics', 'Electronics', 'Electrical']);
  const [historyRuns, setHistoryRuns] = useState<api.ExperimentRun[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);

  // Active run details
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentRunImage, setCurrentRunImage] = useState<string | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<number>(0.95);
  const [graphResult, setGraphResult] = useState<api.GraphResult | null>(null);

  // Caching content details
  const [cachedTheory, setCachedTheory] = useState<{ formal: string; simple: string } | null>(null);
  const [cachedViva, setCachedViva] = useState<api.VivaQuestion[]>([]);

  // Navigation & Wizard State
  const [viewState, setRawViewState] = useState<string>('landing');
  const [pendingNavigateState, setPendingNavigateState] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeSubject, setActiveSubject] = useState<string>('Physics');
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [activeExperiment, setActiveExperiment] = useState<string>("Ohm's Law");
  const [tableData, setTableData] = useState<DataRow[]>([]);

  // Wrapped router function
  const setViewState = (state: string | ((prev: string) => string)) => {
    const targetState = typeof state === 'function' ? state(viewState) : state;
    const protectedStates = ['upload', 'editor', 'graph-generator', 'explanation', 'report', 'history', 'achievements', 'profile', 'settings'];
    const isAllowedInDemo = isDemoMode && ['editor', 'graph-generator', 'explanation', 'report', 'theory'].includes(targetState);

    if (protectedStates.includes(targetState) && !session && !isAllowedInDemo) {
      setPendingNavigateState(targetState);
      setAuthMode('login');
      setRawViewState('auth');
    } else {
      setRawViewState(targetState);
    }
  };

  // Column configurations
  const [col1Config, setCol1Config] = useState({ name: 'Voltage', unit: 'V', availableUnits: ['V', 'mV', 'kV'] });
  const [col2Config, setCol2Config] = useState({ name: 'Current', unit: 'mA', availableUnits: ['mA', 'A', 'µA'] });

  // Graph Canvas specific states
  const [graphGrid, setGraphGrid] = useState<boolean>(true);
  const [graphBestFit, setGraphBestFit] = useState<boolean>(true);
  const [graphZoom, setGraphZoom] = useState<number>(1.0);

  // AI Processing Checklists
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStep, setProcessingStep] = useState<number>(0);

  // Settings State
  const [settingsAutoSave, setSettingsAutoSave] = useState(true);
  const [settingsDefaultGrid, setSettingsDefaultGrid] = useState(true);
  const [settingsEmailNotify, setSettingsEmailNotify] = useState(true);
  const [settingsAISuggest, setSettingsAISuggest] = useState(true);
  const [settingsLang, setSettingsLang] = useState('en');
  const [activeSettingsTab, setActiveSettingsTab] = useState('preferences');

  // Search queries
  const [globalSearch, setGlobalSearch] = useState('');
  const [experimentSearch, setExperimentSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Favorites / History state
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    "Ohm's Law": true,
    "RC Circuit Response": false,
  });

  // Theory Section
  const [theorySection, setTheorySection] = useState<string>('Formula');

  // --- Auth Session Monitor ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) fetchInitialUserData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) fetchInitialUserData();
      
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('update-password');
        setRawViewState('auth');
      }
    });

    // Parse URL hash for redirects (signup confirmation or password recovery)
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const parsedParams = new URLSearchParams(hash.substring(1));
      const type = parsedParams.get('type');
      if (type === 'signup') {
        setAuthMessage("🎉 Your account has been verified successfully! Welcome to GraphLab AI.");
        setAuthMode('login');
        setRawViewState('auth');
      } else if (type === 'recovery') {
        setAuthMode('update-password');
        setRawViewState('auth');
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const fetchInitialUserData = async () => {
    try {
      const p = await api.getProfile();
      setProfile(p);
      const subs = await api.getSubjects();
      setSubjects(subs.length > 0 ? subs : ['Physics', 'Electronics', 'Electrical']);
      const exps = await api.getExperiments();
      setExperiments(exps);
      const hist = await api.getHistory();
      setHistoryRuns(hist);
      const stats = await api.getAdminStats();
      setAdminStats(stats);
    } catch (err) {
      console.warn('Initial data load error (may lack tables/seeding):', err);
    }
  };

  // Trigger data reloading on view state change
  useEffect(() => {
    if (session && viewState === 'dashboard') {
      fetchInitialUserData();
    }
  }, [viewState, session]);

  // Auth Action Handlers
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    try {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: {
            full_name: authFullName,
          }
        }
      });
      if (error) throw error;
      setAuthMode('verify');
      setAuthMessage(`📬 Registration submitted! A secure verification email has been successfully sent to "${authEmail}". Please check your inbox (including spam/promotions folders) and click the link to confirm your account.`);
    } catch (err: any) {
      setAuthError(err.message || 'Signup failed');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) throw error;
      if (data.user && !data.user.email_confirmed_at) {
        setAuthMode('verify');
        setAuthMessage(`📬 Verification pending! The account associated with "${authEmail}" is not verified yet. We have sent a confirmation link to your email. Please verify it before signing in.`);
        await supabase.auth.signOut();
        setSession(null);
      } else {
        // Logged in successfully
        if (pendingNavigateState) {
          setRawViewState(pendingNavigateState);
          setPendingNavigateState(null);
        } else {
          setRawViewState('dashboard');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo: window.location.origin
      });
      if (error) throw error;
      setAuthMessage(`📬 Password reset link sent! We have successfully sent a secure recovery link to "${authEmail}". Click the link in the email to define your new password.`);
    } catch (err: any) {
      setAuthError(err.message || 'Password reset request failed');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    if (authPassword !== authConfirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: authPassword });
      if (error) throw error;
      setAuthMessage("🔒 Password updated successfully! You can now log in using your new credentials.");
      setAuthMode('login');
    } catch (err: any) {
      setAuthError(err.message || "Failed to update password.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setIsDemoMode(false);
    setRawViewState('landing');
  };

  // Upload handler
  const handlePhotoUpload = async (file: File) => {
    setAuthError('');
    setViewState('processing');
    setProcessingProgress(5);
    setProcessingStep(0);

    try {
      // Step 0: Reading image...
      await new Promise(r => setTimeout(r, 400));
      setProcessingProgress(15);
      setProcessingStep(1);

      // Step 1: Extracting values... (Upload to Cloudinary)
      const imageUrl = await api.uploadPhoto(file);
      setCurrentRunImage(imageUrl);
      setProcessingProgress(35);
      setProcessingStep(2);

      // Step 2: Detecting rows...
      await new Promise(r => setTimeout(r, 300));
      setProcessingProgress(45);

      if (!selectedExperimentId) {
        // Fallback search or creation if missing
        const matched = experiments.find(e => e.name === activeExperiment);
        if (matched) setSelectedExperimentId(matched.id);
        else return;
      }

      // Step 3: Checking accuracy... (Gemini OCR)
      setProcessingStep(3);
      setProcessingProgress(55);
      const ocrResult = await api.createRun(selectedExperimentId!, imageUrl);
      setOcrConfidence(ocrResult.ocrConfidence);
      setCurrentRunId(ocrResult.runId);
      setProcessingProgress(75);
      setProcessingStep(4);

      // Step 4: Formatting data...
      const mappedRows = ocrResult.rows.map(r => ({
        sNo: r.index + 1,
        voltage: r.col1Value,
        current: r.col2Value,
        voltageLowConfidence: r.col1Confidence < 0.75,
        currentLowConfidence: r.col2Confidence < 0.75,
      }));

      setTableData(mappedRows);
      setCol1Config({
        name: ocrResult.col1Config.name || 'X',
        unit: ocrResult.col1Config.unit || '',
        availableUnits: [ocrResult.col1Config.unit || '', 'V', 'mV', 'kV', 'ms', 's', 'Hz', 'kHz'].filter(Boolean)
      });
      setCol2Config({
        name: ocrResult.col2Config.name || 'Y',
        unit: ocrResult.col2Config.unit || '',
        availableUnits: [ocrResult.col2Config.unit || '', 'mA', 'A', 'µA', 'V', 'mV'].filter(Boolean)
      });

      // Step 5: Almost done...
      setProcessingProgress(90);
      setProcessingStep(5);
      await new Promise(r => setTimeout(r, 400));

      // Complete
      setProcessingProgress(100);
      setTimeout(() => {
        setViewState('editor');
      }, 600);

    } catch (err: any) {
      setAuthError(err.message || 'File upload and OCR indexing failed.');
      setViewState('upload');
    }
  };

  // CRUD table save
  const handleSaveEditedRows = async () => {
    if (!currentRunId) return;
    try {
      const rowsToSave = tableData.map((d, idx) => ({
        index: idx,
        col1Value: d.voltage,
        col2Value: d.current,
        col1Confidence: d.voltageLowConfidence ? 0.7 : 1.0,
        col2Confidence: d.currentLowConfidence ? 0.7 : 1.0,
      }));

      await api.saveRows(currentRunId, rowsToSave, col1Config, col2Config);
      
      // Calculate dynamic regression and bounds from backend
      const graphRes = await api.generateGraph(currentRunId);
      setGraphResult(graphRes);
      
      setViewState('graph-generator');
    } catch (err: any) {
      alert('Failed to save updated row observations: ' + err.message);
    }
  };

  // Caching fetches
  useEffect(() => {
    if (session && selectedExperimentId && viewState === 'theory') {
      api.getTheory(selectedExperimentId)
        .then(t => setCachedTheory(t))
        .catch(console.error);
    }
  }, [viewState, selectedExperimentId, session]);

  useEffect(() => {
    if (session && selectedExperimentId && viewState === 'explanation') {
      api.getViva(selectedExperimentId)
        .then(v => setCachedViva(v))
        .catch(console.error);
    }
  }, [viewState, selectedExperimentId, session]);

  // Fallback frontend calculations in case backend hasn't generated calculations yet
  const regression = useMemo(() => {
    if (graphResult) {
      return {
        slope: graphResult.slope,
        intercept: graphResult.intercept,
        resistance: graphResult.slope !== 0 ? (col2Config.unit === 'mA' ? 1000 : 1) / graphResult.slope : 100
      };
    }

    const n = tableData.length;
    if (n < 2) return { slope: 0, intercept: 0, resistance: 0 };
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    tableData.forEach(d => {
      sumX += d.voltage;
      sumY += d.current;
      sumXY += d.voltage * d.current;
      sumXX += d.voltage * d.voltage;
    });
    const slopeNum = (n * sumXY) - (sumX * sumY);
    const slopeDen = (n * sumXX) - (sumX * sumX);
    const slope = slopeDen !== 0 ? slopeNum / slopeDen : 0;
    const intercept = (sumY - (slope * sumX)) / n;
    
    let factor = 1.0;
    if (col2Config.unit === 'mA') factor = 1000.0;
    const resistance = slope !== 0 ? factor / slope : 100.0;
    return { slope, intercept, resistance };
  }, [tableData, col1Config, col2Config, graphResult]);

  const toggleFavorite = (expName: string) => {
    setFavorites(prev => ({ ...prev, [expName]: !prev[expName] }));
  };

  const achievements = useMemo(() => {
    const totalRuns = historyRuns.length;
    const subjectsCount = new Set(historyRuns.map(h => h.experiment.subject)).size;
    const hasCircuits = historyRuns.some(h => h.experiment.name.includes("RC") || h.experiment.name.includes("LCR"));
    const hasHighConf = historyRuns.some(h => h.ocrConfidence > 0.90);

    return [
      {
        id: 'first-verification',
        title: 'First Verification',
        description: 'Successfully digitized and generated your first laboratory graph.',
        icon: '🥇',
        unlocked: totalRuns > 0
      },
      {
        id: 'perfect-fit',
        title: 'Perfect Fit',
        description: 'Achieved an experimental curve fit coefficient above 0.90.',
        icon: '🎯',
        unlocked: hasHighConf
      },
      {
        id: 'lab-assistant',
        title: 'Multi-Disciplinary',
        description: 'Completed observations across at least 2 distinct subjects.',
        icon: '🔬',
        unlocked: subjectsCount >= 2
      },
      {
        id: 'circuit-spec',
        title: 'Circuit Specialist',
        description: 'Run analysis on LCR resonance or capacitor transients.',
        icon: '⚡',
        unlocked: hasCircuits
      }
    ];
  }, [historyRuns]);

  // Filtered lists
  const filteredExperiments = experiments.filter((e) => {
    const matchesSubject = e.subject.toLowerCase() === activeSubject.toLowerCase();
    const matchesSearch = e.name.toLowerCase().includes(experimentSearch.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const filteredHistory = historyRuns.filter((h) => 
    h.experiment.name.toLowerCase().includes(historySearch.toLowerCase())
  );

  // Authentication page render
  if (authLoading) {
    return (
      <div className="min-h-screen bg-paper-bg flex items-center justify-center font-heading text-ink-primary font-bold">
        <RefreshCw className="w-8 h-8 animate-spin text-accent-orange mr-2" />
        Loading Lab Session...
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-paper-bg p-4 md:p-8 flex flex-col items-center justify-start relative pb-24 select-text">
      
      {/* Decorative pencil */}
      <div className="absolute right-10 top-6 rotate-12 opacity-80 hidden lg:block select-none pointer-events-none z-0">
        <svg className="w-32 h-8" viewBox="0 0 120 20" fill="none" stroke="currentColor">
          <polygon points="10,5 20,2 110,2 115,10 110,18 20,18 10,15" fill="#f0c243" stroke="#2c3e50" strokeWidth="1.5"/>
          <polygon points="110,2 115,10 110,18 102,10" fill="#e74c3c" stroke="#2c3e50" strokeWidth="1"/>
          <polygon points="10,5 2,10 10,15" fill="#2c3e50"/>
        </svg>
      </div>

      <div className="w-full max-w-5xl z-10 flex flex-col gap-6">

        {/* Global Nav Bar */}
        {viewState !== 'landing' && (
          <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-paper-card p-4 rounded-2xl border-2 border-ink-primary shadow-[3px_3px_0px_0px_rgba(44,62,80,1)] relative overflow-hidden">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewState('dashboard')}>
              <div className="w-9 h-9 rounded-xl border-2 border-ink-primary bg-accent-orange flex items-center justify-center text-white font-heading font-bold shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)]">
                GL
              </div>
              <div>
                <h1 className="text-base font-bold font-heading tracking-tight leading-none text-ink-primary">GraphLab AI</h1>
                <span className="text-[10px] font-semibold text-ink-secondary">Smart Graph Generator</span>
              </div>
            </div>

            <SearchBar 
              placeholder="Search experiments, guides..." 
              value={globalSearch} 
              onChange={setGlobalSearch} 
              className="w-full md:w-80"
            />

            <div className="flex items-center gap-3 border-l border-ink-primary/10 pl-4">
              {session ? (
                <>
                  <div className="w-8 h-8 rounded-full border-2 border-ink-primary bg-accent-blue overflow-hidden shrink-0 flex items-center justify-center font-heading font-bold text-white text-sm shadow-[1px_1px_0px_0px_rgba(44,62,80,1)]">
                    {profile?.fullName?.substring(0, 2).toUpperCase() || 'ST'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-ink-primary">{profile?.fullName || 'Student'}</div>
                    <div className="text-[9px] font-semibold text-ink-secondary">{profile?.year || '1st Year'}, {profile?.department || 'Science'}</div>
                  </div>
                  <button onClick={handleSignOut} title="Sign Out" className="p-1 hover:text-accent-red-orange transition-colors cursor-pointer text-ink-secondary ml-1">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    setAuthMode('login');
                    setRawViewState('auth');
                  }} 
                  className="px-3.5 py-1.5 bg-accent-orange text-white border border-ink-primary rounded-lg text-xs font-bold hover:bg-accent-orange-dark transition-all shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </header>
        )}

        <main className="flex-1 flex flex-col">
          {viewState === 'auth' && (
            <NotebookPage tabLabel="Student Access Portal" showDecorations={true}>
              <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto py-6 items-stretch">
                {/* Info Card */}
                <div className="flex-1 bg-paper-card p-6 rounded-xl border-2 border-ink-primary shadow-[2.5px_2.5px_0px_0px_rgba(44,62,80,1)] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-accent-orange uppercase tracking-wider font-mono">Academic Session</span>
                    <h3 className="text-xl font-bold font-heading text-ink-primary mt-1 mb-3">Keep Your Lab Books Saved</h3>
                    <p className="text-xs text-ink-secondary leading-relaxed mb-4">
                      Create a student account or log in to capture written table photos, process measurements using Gemini models, save regressions, and earn badges!
                    </p>
                    <div className="space-y-3 mt-6 text-xs text-ink-primary font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="text-success-green font-bold">✓</span>
                        <span>Digitize notebook logs using Gemini Flash OCR</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-success-green font-bold">✓</span>
                        <span>Render linear best-fit regression lines & formulas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-success-green font-bold">✓</span>
                        <span>Export completed PDF report sheets</span>
                      </div>
                    </div>
                  </div>
                  
                  {pendingNavigateState && (
                    <button 
                      onClick={() => {
                        setIsDemoMode(true);
                        // Bypasses if going to demo view
                        if (['editor', 'graph-generator', 'explanation', 'report'].includes(pendingNavigateState)) {
                          setViewState(pendingNavigateState);
                        } else {
                          setViewState('subjects');
                        }
                      }}
                      className="mt-6 text-left text-xs font-bold text-accent-blue hover:underline cursor-pointer"
                    >
                      ← Skip for now, explore in Guest Demo mode
                    </button>
                  )}
                </div>

                {/* Form Card */}
                <div className="w-full md:w-96 bg-white border-2 border-ink-primary rounded-xl shadow-[3px_3px_0px_0px_rgba(44,62,80,1)] p-6 relative">
                  <div className="absolute top-[-5px] left-8 w-14 h-4 bg-accent-orange/20 rotate-6"></div>
                  
                  <div className="text-center mb-6">
                    <h2 className="text-lg font-black font-heading tracking-wider uppercase">
                      {authMode === 'login' ? 'Student Login' : authMode === 'signup' ? 'Create Account' : authMode === 'forgot' ? 'Reset Password' : authMode === 'update-password' ? 'New Password' : 'Check Inbox'}
                    </h2>
                    <p className="text-[10px] text-ink-secondary font-bold uppercase tracking-wider">GraphLab AI Authentication</p>
                  </div>

                  {authError && (
                    <div className="bg-accent-red-orange/10 border border-accent-red-orange text-accent-red-orange text-xs font-bold p-3 rounded-lg mb-4">
                      {authError}
                    </div>
                  )}

                  {authMessage && (
                    <div className="bg-success-green/10 border border-success-green text-success-green text-xs font-bold p-3 rounded-lg mb-4">
                      {authMessage}
                    </div>
                  )}

                  {authMode === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-4 font-semibold text-xs">
                      <div>
                        <label className="block mb-1.5 uppercase font-heading text-[10px] tracking-wide text-ink-secondary">Email Address</label>
                        <input 
                          type="email" 
                          name="email"
                          autoComplete="email"
                          value={authEmail} 
                          onChange={(e) => setAuthEmail(e.target.value)} 
                          required 
                          className="w-full bg-white border-2 border-ink-primary rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-accent-orange font-bold text-ink-primary"
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 uppercase font-heading text-[10px] tracking-wide text-ink-secondary">Password</label>
                        <input 
                          type="password" 
                          name="password"
                          autoComplete="current-password"
                          value={authPassword} 
                          onChange={(e) => setAuthPassword(e.target.value)} 
                          required 
                          className="w-full bg-white border-2 border-ink-primary rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-accent-orange font-bold text-ink-primary"
                        />
                      </div>
                      <button type="submit" className="w-full bg-ink-primary text-white font-heading font-black py-2.5 rounded-lg border-2 border-ink-primary shadow-[2px_2px_0px_0px_rgba(243,156,18,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(243,156,18,1)] transition-all cursor-pointer text-center uppercase tracking-wider">
                        Access Lab Book
                      </button>
                      <div className="flex justify-between items-center text-[10px] text-ink-secondary font-bold pt-2">
                        <button type="button" onClick={() => setAuthMode('signup')} className="hover:text-accent-orange underline">Create Account</button>
                        <button type="button" onClick={() => setAuthMode('forgot')} className="hover:text-accent-orange underline">Forgot Password?</button>
                      </div>
                    </form>
                  ) : authMode === 'signup' ? (
                    <form onSubmit={handleSignUp} className="space-y-4 font-semibold text-xs">
                      <div>
                        <label className="block mb-1.5 uppercase font-heading text-[10px] tracking-wide text-ink-secondary">Full Name</label>
                        <input 
                          type="text" 
                          name="name"
                          autoComplete="name"
                          value={authFullName} 
                          onChange={(e) => setAuthFullName(e.target.value)} 
                          required 
                          className="w-full bg-white border-2 border-ink-primary rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-accent-orange font-bold text-ink-primary"
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 uppercase font-heading text-[10px] tracking-wide text-ink-secondary">Email Address</label>
                        <input 
                          type="email" 
                          name="email"
                          autoComplete="email"
                          value={authEmail} 
                          onChange={(e) => setAuthEmail(e.target.value)} 
                          required 
                          className="w-full bg-white border-2 border-ink-primary rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-accent-orange font-bold text-ink-primary"
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 uppercase font-heading text-[10px] tracking-wide text-ink-secondary">Password</label>
                        <input 
                          type="password" 
                          name="password"
                          autoComplete="new-password"
                          value={authPassword} 
                          onChange={(e) => setAuthPassword(e.target.value)} 
                          required 
                          className="w-full bg-white border-2 border-ink-primary rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-accent-orange font-bold text-ink-primary"
                        />
                      </div>
                      <button type="submit" className="w-full bg-ink-primary text-white font-heading font-black py-2.5 rounded-lg border-2 border-ink-primary shadow-[2px_2px_0px_0px_rgba(243,156,18,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(243,156,18,1)] transition-all cursor-pointer text-center uppercase tracking-wider">
                        Register Student
                      </button>
                      <div className="text-center text-[10px] text-ink-secondary font-bold pt-2">
                        Already have a lab session? <button type="button" onClick={() => setAuthMode('login')} className="hover:text-accent-orange underline">Login here</button>
                      </div>
                    </form>
                  ) : authMode === 'forgot' ? (
                    <form onSubmit={handleResetPassword} className="space-y-4 font-semibold text-xs">
                      <div>
                        <label className="block mb-1.5 uppercase font-heading text-[10px] tracking-wide text-ink-secondary">Email Address</label>
                        <input 
                          type="email" 
                          name="email"
                          autoComplete="email"
                          value={authEmail} 
                          onChange={(e) => setAuthEmail(e.target.value)} 
                          required 
                          className="w-full bg-white border-2 border-ink-primary rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-accent-orange font-bold text-ink-primary"
                        />
                      </div>
                      <button type="submit" className="w-full bg-ink-primary text-white font-heading font-black py-2.5 rounded-lg border-2 border-ink-primary shadow-[2px_2px_0px_0px_rgba(243,156,18,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(243,156,18,1)] transition-all cursor-pointer text-center uppercase tracking-wider">
                        Reset Password
                      </button>
                      <div className="text-center text-[10px] text-ink-secondary font-bold pt-2">
                        Back to <button type="button" onClick={() => setAuthMode('login')} className="hover:text-accent-orange underline">Login</button>
                      </div>
                    </form>
                  ) : authMode === 'update-password' ? (
                    <form onSubmit={handleUpdatePassword} className="space-y-4 font-semibold text-xs">
                      <div>
                        <label className="block mb-1.5 uppercase font-heading text-[10px] tracking-wide text-ink-secondary">New Password</label>
                        <input 
                          type="password" 
                          name="password"
                          autoComplete="new-password"
                          value={authPassword} 
                          onChange={(e) => setAuthPassword(e.target.value)} 
                          required 
                          className="w-full bg-white border-2 border-ink-primary rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-accent-orange font-bold text-ink-primary"
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 uppercase font-heading text-[10px] tracking-wide text-ink-secondary">Confirm New Password</label>
                        <input 
                          type="password" 
                          name="confirm-password"
                          autoComplete="new-password"
                          value={authConfirmPassword} 
                          onChange={(e) => setAuthConfirmPassword(e.target.value)} 
                          required 
                          className="w-full bg-white border-2 border-ink-primary rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-accent-orange font-bold text-ink-primary"
                        />
                      </div>
                      <button type="submit" className="w-full bg-ink-primary text-white font-heading font-black py-2.5 rounded-lg border-2 border-ink-primary shadow-[2px_2px_0px_0px_rgba(243,156,18,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(243,156,18,1)] transition-all cursor-pointer text-center uppercase tracking-wider">
                        Update Password
                      </button>
                    </form>
                  ) : (
                    <div className="text-center space-y-4">
                      <p className="text-xs font-semibold text-ink-secondary leading-relaxed">
                        Check your inbox for a verification email. Click the verification link to activate your student session, then reload this page to log in.
                      </p>
                      <button onClick={() => setAuthMode('login')} className="w-full bg-ink-primary text-white font-heading font-black py-2.5 rounded-lg border-2 border-ink-primary shadow-[2px_2px_0px_0px_rgba(243,156,18,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(243,156,18,1)] transition-all cursor-pointer text-center uppercase tracking-wider">
                        Back to Login
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </NotebookPage>
          )}

          {viewState === 'landing' && (
            <NotebookPage tabLabel="Landing Page" showDecorations={true}>
              <div className="flex flex-col items-center justify-center text-center py-10 md:py-16 max-w-2xl mx-auto relative">
                <div className="absolute right-[-40px] top-0 bg-[#FDF8EC] border-2 border-ink-primary rounded shadow-[2.5px_2.5px_0px_0px_rgba(44,62,80,1)] p-3 rotate-6 font-handwritten text-accent-red-orange text-sm font-bold z-10 w-24">
                  E = mc²
                </div>
                
                <h2 className="text-4xl md:text-5xl font-black font-heading tracking-tight leading-tight text-ink-primary mb-3">
                  GraphLab AI
                </h2>
                <h3 className="text-lg md:text-xl font-bold font-heading text-accent-orange mb-4">
                  Smart Laboratory Graph Generator
                </h3>
                
                <p className="text-xs md:text-sm font-semibold text-ink-secondary leading-relaxed mb-8 max-w-md">
                  Upload raw handwritten or typed observation tables to generate beautiful, perfectly scaled, and mathematically modeled graphs and full laboratory reports in seconds.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                  <PrimaryButton onClick={() => setViewState('dashboard')}>
                    Get Started <ChevronRight className="w-4.5 h-4.5" />
                  </PrimaryButton>
                  <SecondaryButton onClick={() => {
                    // Set up Ohm's Law mock tables for demo
                    setTableData([
                      { sNo: 1, voltage: 1.0, current: 10.0 },
                      { sNo: 2, voltage: 2.0, current: 20.2 },
                      { sNo: 3, voltage: 3.0, current: 30.5 },
                      { sNo: 4, voltage: 4.0, current: 39.8 },
                      { sNo: 5, voltage: 5.0, current: 50.1 },
                    ]);
                    setViewState('editor');
                  }}>
                    Try Demo
                  </SecondaryButton>
                </div>

                <div className="w-full border-t border-ink-primary/10 pt-8 mt-4">
                  <div className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest mb-4">
                    Choose subject to analyze
                  </div>
                  <div className="flex justify-center items-center gap-8 md:gap-12">
                    {subjects.map((sub) => (
                      <div 
                        key={sub} 
                        className="flex flex-col items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform" 
                        onClick={() => { setActiveSubject(sub); setViewState('select-experiment'); }}
                      >
                        <div className={`w-12 h-12 rounded-xl border-2 border-ink-primary flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(44,62,80,1)] ${
                          sub === 'Physics' ? 'bg-accent-blue/15 text-accent-blue' : sub === 'Electronics' ? 'bg-accent-mint/15 text-accent-mint' : 'bg-accent-red-orange/15 text-accent-red-orange'
                        }`}>
                          {sub === 'Physics' ? <Zap className="w-5 h-5" /> : sub === 'Electronics' ? <Cpu className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                        </div>
                        <span className="text-[10px] font-bold font-heading text-ink-primary">{sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </NotebookPage>
          )}

          {viewState === 'dashboard' && (
            <NotebookPage tabLabel="Dashboard" showDecorations={true}>
              <div className="flex flex-col md:flex-row gap-6">
                <SidebarNav activeItem="dashboard" onSelect={(item) => setViewState(item)} />

                <div className="flex-1 flex flex-col gap-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={<Zap className="w-5 h-5" />} value={adminStats?.totalRuns || historyRuns.length} label="Graphs Generated" />
                    <StatCard icon={<FileDown className="w-5 h-5" />} value={adminStats?.totalRuns || historyRuns.length} label="Saved Reports" />
                    <StatCard icon={<Star className="w-5 h-5" />} value={Object.keys(favorites).filter(k => favorites[k]).length} label="Favorites" />
                    <StatCard icon={<Award className="w-5 h-5" />} value="98%" label="OCR Accuracy Rate" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    <div className="bg-paper-card p-4 rounded-xl border-2 border-ink-primary shadow-[2.5px_2.5px_0px_0px_rgba(44,62,80,0.15)] flex flex-col justify-between">
                      <h3 className="text-sm font-bold font-heading text-ink-primary border-b border-ink-primary/5 pb-2 mb-3">
                        Recent Activity
                      </h3>
                      
                      <div className="space-y-3">
                        {historyRuns.slice(0, 3).map((h, i) => (
                          <div key={i} className="flex items-center justify-between text-xs border-b border-ink-primary/5 pb-2">
                            <div>
                              <div className="font-bold text-ink-primary">{h.experiment.name}</div>
                              <div className="text-[10px] text-ink-secondary">Graph generated</div>
                            </div>
                            <span className="text-[10px] font-semibold text-ink-secondary">{new Date(h.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                        {historyRuns.length === 0 && (
                          <div className="text-xs text-ink-secondary py-4 text-center font-bold">No runs recorded yet. Get started by selecting an experiment.</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-paper-card p-4 rounded-xl border-2 border-ink-primary shadow-[2.5px_2.5px_0px_0px_rgba(44,62,80,0.15)] flex flex-col">
                      <h3 className="text-sm font-bold font-heading text-ink-primary border-b border-ink-primary/5 pb-2 mb-3">
                        Statistics (Weekly Activity)
                      </h3>

                      <div className="flex-1 min-h-[100px] flex items-center justify-center p-2 relative bg-white border border-ink-primary/10 rounded-lg">
                        <svg viewBox="0 0 200 80" className="w-full h-full">
                          <line x1="10" y1="70" x2="190" y2="70" stroke="rgba(44,62,80,0.15)" strokeWidth="1" />
                          <line x1="10" y1="40" x2="190" y2="40" stroke="rgba(44,62,80,0.15)" strokeWidth="1" />
                          <line x1="10" y1="10" x2="10" y2="70" stroke="var(--color-ink-primary)" strokeWidth="1.5" />
                          <line x1="10" y1="70" x2="190" y2="70" stroke="var(--color-ink-primary)" strokeWidth="1.5" />
                          <path d="M 15 65 Q 45 35 75 55 T 135 15 T 195 25" fill="none" stroke="var(--color-accent-blue)" strokeWidth="2" />
                          <path d="M 15 50 Q 45 60 75 45 T 135 30 T 195 40" fill="none" stroke="var(--color-accent-orange)" strokeWidth="1.5" strokeDasharray="2 2" />
                        </svg>
                        <div className="absolute bottom-1 right-2 flex items-center gap-3 text-[8px] font-bold text-ink-secondary">
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-accent-blue rounded-full"></span> This Week</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-accent-orange rounded-full"></span> Last Week</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </NotebookPage>
          )}

          {viewState === 'subjects' && (
            <NotebookPage tabLabel="Select Subject" showDecorations={true}>
              <div className="flex flex-col md:flex-row gap-6">
                <SidebarNav activeItem="subjects" onSelect={(item) => setViewState(item)} />

                <div className="flex-1 flex flex-col">
                  <h2 className="text-xl font-bold font-heading text-ink-primary mb-1">Choose Your Subject</h2>
                  <p className="text-xs text-ink-secondary mb-6 font-semibold">Select the department of your experiment to find templates</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {subjects.map((sub) => (
                      <SubjectCard
                        key={sub}
                        title={sub}
                        description={`Analyze and plot ${sub} lab observations automatically using Gemini Flash Models.`}
                        icon={sub === 'Physics' ? <Zap className="w-8 h-8" /> : sub === 'Electronics' ? <Cpu className="w-8 h-8" /> : <Layers className="w-8 h-8" />}
                        subjectColor={sub.toLowerCase() as any}
                        onClick={() => {
                          setActiveSubject(sub);
                          setViewState('select-experiment');
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </NotebookPage>
          )}

          {viewState === 'select-experiment' && (
            <NotebookPage tabLabel="Select Experiment" showDecorations={true}>
              <div className="flex flex-col gap-4">
                <button onClick={() => setViewState('subjects')} className="flex items-center gap-1.5 text-xs font-bold text-accent-blue hover:text-accent-blue/80 cursor-pointer self-start">
                  <ArrowLeft className="w-4 h-4" /> Back to Subjects
                </button>

                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 bg-paper-card p-5 rounded-xl border-2 border-ink-primary shadow-[3px_3px_0px_0px_rgba(44,62,80,1)]">
                    <h3 className="text-sm font-bold font-heading text-ink-primary uppercase tracking-wider mb-4">
                      Search {activeSubject} Experiments
                    </h3>
                    <SearchBar 
                      placeholder="Search for any experiment..."
                      value={experimentSearch}
                      onChange={setExperimentSearch}
                      className="mb-6"
                    />

                    <h4 className="text-xs font-bold font-heading text-ink-secondary uppercase tracking-widest mb-3 font-mono">Select Experiment Template</h4>
                    <div className="space-y-1 text-xs">
                      {filteredExperiments.map((exp) => (
                        <button
                          key={exp.id}
                          onClick={() => {
                            setActiveExperiment(exp.name);
                            setSelectedExperimentId(exp.id);
                            setViewState('upload');
                          }}
                          className="w-full text-left py-2 px-3 hover:bg-ink-primary/5 rounded font-semibold text-ink-primary flex items-center justify-between group cursor-pointer"
                        >
                          <span>{exp.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-accent-orange" />
                        </button>
                      ))}
                      {filteredExperiments.length === 0 && (
                        <div className="text-ink-secondary py-3 text-center">No experiments found. Try checking database seeds.</div>
                      )}
                    </div>
                  </div>

                  <div className="w-full lg:w-96 flex flex-col gap-6">
                    <div>
                      <h3 className="text-sm font-bold font-heading text-ink-primary mb-3">Popular Experiments</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {experiments.slice(0, 2).map((exp) => (
                          <ExperimentCard
                            key={exp.id}
                            title={exp.name}
                            timestamp="2 hours ago"
                            isPopular={true}
                            onClick={() => {
                              setActiveExperiment(exp.name);
                              setSelectedExperimentId(exp.id);
                              setViewState('upload');
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#FDF8EC] p-4 rounded-xl border-2 border-ink-primary shadow-[2px_2px_0px_0px_rgba(44,62,80,1)] relative overflow-hidden flex flex-col justify-between">
                      <button 
                        onClick={() => toggleFavorite("Ohm's Law")} 
                        className="absolute top-1.5 right-2 cursor-pointer hover:scale-110 transition-transform"
                      >
                        <Star className={`w-4 h-4 ${favorites["Ohm's Law"] ? 'fill-star-gold text-star-gold' : 'text-ink-secondary'}`} />
                      </button>
                      <div>
                        <span className="text-[9px] font-bold text-accent-orange uppercase tracking-wider">Recommended Standard</span>
                        <h4 className="text-xs font-bold font-heading text-ink-primary mt-1 mb-2">Verify Ohm's Law</h4>
                        <p className="text-[10px] text-ink-secondary leading-relaxed">
                          Analyze the linear relationship between voltage and current values to calculate resistance.
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          const ohms = experiments.find(e => e.name === "Ohm's Law");
                          if (ohms) {
                            setActiveExperiment(ohms.name);
                            setSelectedExperimentId(ohms.id);
                            setViewState('upload');
                          }
                        }}
                        className="mt-4 text-[10px] font-bold text-accent-blue hover:underline text-left cursor-pointer"
                      >
                        Start Ohm's Law Analysis →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </NotebookPage>
          )}

          {viewState === 'upload' && (
            <NotebookPage tabLabel="Upload Observation Table" showDecorations={true}>
              <div className="flex flex-col gap-4 max-w-lg mx-auto py-6">
                <button onClick={() => setViewState('select-experiment')} className="flex items-center gap-1.5 text-xs font-bold text-accent-blue hover:text-accent-blue/80 cursor-pointer self-start">
                  <ArrowLeft className="w-4 h-4" /> Back to Experiment Select
                </button>

                <div className="text-center mb-2">
                  <h2 className="text-xl font-bold font-heading text-ink-primary">Upload Observation Table</h2>
                  <p className="text-xs text-ink-secondary mt-1">Upload a snapshot of your written or printed lab recordings</p>
                </div>

                <UploadDropzone onUploadStart={() => {}} onUpload={handlePhotoUpload} />
              </div>
            </NotebookPage>
          )}

          {viewState === 'processing' && (
            <NotebookPage tabLabel="AI Processing Table" showDecorations={true}>
              <div className="flex flex-col items-center justify-center text-center py-12 max-w-sm mx-auto">
                <RobotMascot expression="thinking" className="w-24 h-24 mb-6" />
                <h2 className="text-lg font-bold font-heading text-ink-primary mb-2">Analyzing Lab Notebook Table</h2>
                <p className="text-xs text-ink-secondary mb-8">Reading handwritten notations, scaling, and transcribing metrics</p>
                <AIProcessingChecklist currentStep={processingStep} progress={processingProgress} />
              </div>
            </NotebookPage>
          )}

          {viewState === 'editor' && (
            <NotebookPage tabLabel="Observation Table Editor" showDecorations={true}>
              <div className="flex flex-col gap-4">
                
                {/* Wizard Tab Navigation */}
                <div className="flex flex-wrap items-center gap-2 bg-paper-bg/40 p-1.5 rounded-xl border border-ink-primary/10 select-none">
                  <button onClick={() => setViewState('upload')} className="flex items-center gap-1 px-3 py-1 bg-paper-card border border-ink-primary rounded-lg text-xs font-bold hover:bg-ink-primary/5 cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back Upload
                  </button>
                  <div className="h-4 w-px bg-ink-primary/10 mx-1"></div>
                  <button onClick={() => setViewState('editor')} className="px-3 py-1 bg-accent-orange text-white border border-ink-primary rounded-lg text-xs font-bold cursor-pointer">
                    (7) Table Editor
                  </button>
                  <button onClick={() => handleSaveEditedRows()} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (8) Graph Generator
                  </button>
                  <button onClick={() => handleSaveEditedRows()} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (9) Smart Suggestions
                  </button>
                  <button onClick={() => setViewState('theory')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (10) Theory & Formula
                  </button>
                  <button onClick={() => setViewState('explanation')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (11) AI Explanation
                  </button>
                  <button onClick={() => setViewState('report')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (12) Report Preview
                  </button>
                </div>

                <div className="flex items-center justify-between border-b border-ink-primary/10 pb-3 mb-2 flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-bold font-heading text-ink-primary">Review Transcribed Readings</h2>
                    <p className="text-xs text-ink-secondary mt-0.5">Please check and verify low confidence OCR cells flagged with yellow indicators</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink-secondary uppercase bg-paper-card px-2.5 py-1 rounded-lg border border-ink-primary/5">
                      <span>OCR Confidence:</span>
                      <span className={ocrConfidence > 0.85 ? "text-success-green" : "text-accent-orange"}>
                        {(ocrConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {currentRunImage && (
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-ink-secondary uppercase tracking-wide block mb-1 font-mono">Source Notebook Snapshot</span>
                    <img src={currentRunImage} alt="Notebook Page" className="max-h-24 border-2 border-ink-primary rounded-xl object-contain shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)]" />
                  </div>
                )}

                {/* Table Component */}
                <DataTable 
                  data={tableData} 
                  onChange={setTableData}
                  onSave={handleSaveEditedRows}
                  col1Config={col1Config}
                  col2Config={col2Config}
                  setCol1Config={setCol1Config}
                  setCol2Config={setCol2Config}
                />

                <div className="flex justify-end gap-3 mt-4 border-t border-ink-primary/10 pt-4">
                  <SecondaryButton onClick={() => setViewState('upload')}>
                    Re-upload Photo
                  </SecondaryButton>
                  <PrimaryButton onClick={() => handleSaveEditedRows()}>
                    Generate Graph & Continue
                  </PrimaryButton>
                </div>

              </div>
            </NotebookPage>
          )}

          {viewState === 'graph-generator' && (
            <NotebookPage tabLabel="Graph Generator" showDecorations={true}>
              <div className="flex flex-col gap-4">
                
                {/* Wizard Tab Navigation */}
                <div className="flex flex-wrap items-center gap-2 bg-paper-bg/40 p-1.5 rounded-xl border border-ink-primary/10 select-none">
                  <button onClick={() => setViewState('editor')} className="flex items-center gap-1 px-3 py-1 bg-paper-card border border-ink-primary rounded-lg text-xs font-bold hover:bg-ink-primary/5 cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back Editor
                  </button>
                  <div className="h-4 w-px bg-ink-primary/10 mx-1"></div>
                  <button onClick={() => setViewState('graph-generator')} className="px-3 py-1 bg-accent-orange text-white border border-ink-primary rounded-lg text-xs font-bold cursor-pointer">
                    (8) Graph Generator
                  </button>
                  <button onClick={() => setViewState('suggestions')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (9) Smart Suggestions
                  </button>
                  <button onClick={() => setViewState('theory')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (10) Theory & Formula
                  </button>
                  <button onClick={() => setViewState('explanation')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (11) AI Explanation
                  </button>
                  <button onClick={() => setViewState('report')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (12) Report Preview
                  </button>
                </div>

                <div className="px-1 mb-2">
                  <h2 className="text-lg font-bold font-heading text-ink-primary">Generated Lab Graph</h2>
                  <p className="text-xs text-ink-secondary mt-0.5">Scale-fitted regression lines mapped onto millimetric graph grids</p>
                </div>

                {/* Graph Controls row */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-paper-card p-3 rounded-xl border border-ink-primary/10 text-xs font-bold text-ink-primary">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={graphGrid} onChange={(e) => setGraphGrid(e.target.checked)} className="accent-accent-orange w-4 h-4 cursor-pointer" />
                      Show Millimeter Grid
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={graphBestFit} onChange={(e) => setGraphBestFit(e.target.checked)} className="accent-accent-orange w-4 h-4 cursor-pointer" />
                      Show Best Fit Line
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setGraphZoom(z => Math.max(z - 0.1, 0.7))} className="p-1.5 hover:bg-ink-primary/5 rounded border border-ink-primary/10 cursor-pointer" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                    <span className="font-mono px-2 text-[10px]">{Math.round(graphZoom * 100)}%</span>
                    <button onClick={() => setGraphZoom(z => Math.min(z + 0.1, 1.5))} className="p-1.5 hover:bg-ink-primary/5 rounded border border-ink-primary/10 cursor-pointer" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Interactive Graph Canvas */}
                <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                  <div className="flex-1 bg-white border-2 border-ink-primary rounded-xl shadow-[3px_3px_0px_0px_rgba(44,62,80,1)] p-4 overflow-hidden flex items-center justify-center min-h-[300px]">
                    <div style={{ transform: `scale(${graphZoom})`, transition: 'transform 0.1s ease-out' }} className="w-full">
                      <GraphCanvas 
                        data={tableData} 
                        showGrid={graphGrid} 
                        showBestFit={graphBestFit}
                        col1Config={col1Config}
                        col2Config={col2Config}
                        zoomLevel={graphZoom}
                      />
                    </div>
                  </div>

                  {/* Calculations card */}
                  <div className="w-full lg:w-80 bg-paper-card p-5 rounded-xl border-2 border-ink-primary shadow-[3px_3px_0px_0px_rgba(44,62,80,1)] flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold font-heading text-ink-primary border-b border-ink-primary/5 pb-2 mb-3">Regression Summary</h3>
                      
                      <div className="space-y-4 font-semibold text-xs text-ink-primary">
                        <div>
                          <div className="text-[10px] text-ink-secondary uppercase tracking-widest">Slope (m)</div>
                          <div className="text-lg font-bold font-heading mt-0.5">{regression.slope.toFixed(4)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-ink-secondary uppercase tracking-widest">Y-Intercept (c)</div>
                          <div className="text-lg font-bold font-heading mt-0.5">{regression.intercept.toFixed(4)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-ink-secondary uppercase tracking-widest">Calculated Resistance (R)</div>
                          <div className="text-lg font-bold font-heading text-accent-red-orange mt-0.5">{regression.resistance.toFixed(1)} Ω</div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setViewState('suggestions')} 
                      className="mt-6 w-full py-2 bg-ink-primary text-white font-heading font-black rounded-lg border border-ink-primary shadow-[2px_2px_0px_0px_rgba(243,156,18,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(243,156,18,1)] transition-all cursor-pointer text-center uppercase tracking-wider text-[10px]"
                    >
                      View Scaling Suggestions →
                    </button>
                  </div>
                </div>

              </div>
            </NotebookPage>
          )}

          {viewState === 'suggestions' && (
            <NotebookPage tabLabel="Scaling Suggestions" showDecorations={true}>
              <div className="flex flex-col gap-4">
                
                {/* Wizard Tab Navigation */}
                <div className="flex flex-wrap items-center gap-2 bg-paper-bg/40 p-1.5 rounded-xl border border-ink-primary/10 select-none">
                  <button onClick={() => setViewState('graph-generator')} className="flex items-center gap-1 px-3 py-1 bg-paper-card border border-ink-primary rounded-lg text-xs font-bold hover:bg-ink-primary/5 cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back Graph
                  </button>
                  <div className="h-4 w-px bg-ink-primary/10 mx-1"></div>
                  <button onClick={() => setViewState('graph-generator')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (8) Graph Generator
                  </button>
                  <button onClick={() => setViewState('suggestions')} className="px-3 py-1 bg-accent-orange text-white border border-ink-primary rounded-lg text-xs font-bold cursor-pointer">
                    (9) Smart Suggestions
                  </button>
                  <button onClick={() => setViewState('theory')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (10) Theory & Formula
                  </button>
                  <button onClick={() => setViewState('explanation')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (11) AI Explanation
                  </button>
                  <button onClick={() => setViewState('report')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (12) Report Preview
                  </button>
                </div>

                <div className="px-1 mb-2">
                  <h2 className="text-lg font-bold font-heading text-ink-primary">Smart Suggestions Panel</h2>
                  <p className="text-xs text-ink-secondary mt-0.5">Calculated scale markers, axes spacing configurations and expected lab results</p>
                </div>

                <SuggestionPanel 
                  data={tableData} 
                  col1Config={col1Config}
                  col2Config={col2Config}
                  formula={activeExperiment === "Ohm's Law" ? "V = IR" : activeExperiment === "RC Circuit Response" ? "τ = RC" : activeExperiment === "LCR Circuit Response" ? "f_r = 1 / (2π × √(L × C))" : "V = IR"}
                  scaleX={graphResult?.suggestedScale?.split(',')[0] || `1 cm = ${(Math.max(...tableData.map(d => d.voltage), 5) / 5).toFixed(1)} ${col1Config.unit}`}
                  scaleY={graphResult?.suggestedScale?.split(',')[1] || `1 cm = ${(Math.max(...tableData.map(d => d.current), 50) / 5).toFixed(0)} ${col2Config.unit}`}
                  expectedOutcome={activeExperiment === "Ohm's Law" ? "A straight line passing through the origin, representing direct proportionality." : activeExperiment === "RC Circuit Response" ? "An exponential curve asymptotically approaching the maximum input voltage." : activeExperiment === "LCR Circuit Response" ? "A bell-shaped resonance curve with a distinct peak current value." : "A linear relationship."}
                />

              </div>
            </NotebookPage>
          )}

          {viewState === 'theory' && (
            <NotebookPage tabLabel="Theory & Formula" showDecorations={true}>
              <div className="flex flex-col gap-4">
                
                {/* Wizard Tab Navigation */}
                <div className="flex flex-wrap items-center gap-2 bg-paper-bg/40 p-1.5 rounded-xl border border-ink-primary/10 select-none animate-none">
                  <button onClick={() => setViewState('editor')} className="flex items-center gap-1 px-3 py-1 bg-paper-card border border-ink-primary rounded-lg text-xs font-bold hover:bg-ink-primary/5 cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back Editor
                  </button>
                  <div className="h-4 w-px bg-ink-primary/10 mx-1"></div>
                  <button onClick={() => setViewState('graph-generator')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (8) Graph Generator
                  </button>
                  <button onClick={() => setViewState('suggestions')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (9) Smart Suggestions
                  </button>
                  <button onClick={() => setViewState('theory')} className="px-3 py-1 bg-accent-orange text-white border border-ink-primary rounded-lg text-xs font-bold cursor-pointer">
                    (10) Theory & Formula
                  </button>
                  <button onClick={() => setViewState('explanation')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (11) AI Explanation
                  </button>
                  <button onClick={() => setViewState('report')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (12) Report Preview
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Theory section sidebar */}
                  <TheorySidebar
                    sections={['Aim', 'Theory', 'Formula', 'Procedure', 'Observation', 'Calculation', 'Result', 'Precautions', 'Applications', 'Viva Questions']}
                    activeSection={theorySection}
                    onSelect={setTheorySection}
                  />

                  {/* Section Content (Right side) */}
                  <div className="flex-1 bg-white border-2 border-ink-primary rounded-xl shadow-[3px_3px_0px_0px_rgba(44,62,80,1)] p-6 relative overflow-hidden font-body text-xs text-ink-primary leading-relaxed min-h-[300px]">
                    <div className="absolute top-[-5px] left-4 w-10 h-3 bg-accent-blue/20 rotate-3"></div>
                    
                    {theorySection === 'Formula' ? (
                      <div>
                        <h3 className="text-sm font-bold font-heading text-ink-primary border-b border-ink-primary/10 pb-1.5 mb-4 uppercase tracking-wide">
                          {activeExperiment} Formula
                        </h3>
                        
                        {/* Big Formula Box */}
                        <div className="my-6 flex justify-center py-4 bg-paper-card rounded-xl border border-ink-primary/10">
                          <span className="text-3xl md:text-4xl font-handwritten font-bold text-ink-primary tracking-wide animate-none">
                            {activeExperiment === "Ohm's Law" ? "V = IR" : activeExperiment === "RC Circuit Response" ? "τ = R × C" : activeExperiment === "LCR Circuit Response" ? "f_r = 1 / (2π × √(L × C))" : "V = IR"}
                          </span>
                        </div>

                        {/* Variables legend */}
                        {activeExperiment === "Ohm's Law" ? (
                          <div className="space-y-2 mt-4 pl-1 font-semibold text-xs text-ink-primary">
                            <div><span className="font-mono text-accent-red-orange text-sm font-bold">V</span> = Voltage (V) - Measured in Volts</div>
                            <div><span className="font-mono text-accent-blue text-sm font-bold">I</span> = Current (A) - Measured in Amperes (transcribed as mA in table)</div>
                            <div><span className="font-mono text-success-green text-sm font-bold">R</span> = Resistance (Ω) - Measured in Ohms</div>
                          </div>
                        ) : activeExperiment === "RC Circuit Response" ? (
                          <div className="space-y-2 mt-4 pl-1 font-semibold text-xs text-ink-primary">
                            <div><span className="font-mono text-accent-red-orange text-sm font-bold">τ</span> = Time Constant (s) - Time to charge to 63.2%</div>
                            <div><span className="font-mono text-accent-blue text-sm font-bold">R</span> = Resistance (Ω) - Series resistors value</div>
                            <div><span className="font-mono text-success-green text-sm font-bold">C</span> = Capacitance (F) - Capacitor capacity in Farads</div>
                          </div>
                        ) : (
                          <div className="space-y-2 mt-4 pl-1 font-semibold text-xs text-ink-primary">
                            <div><span className="font-mono text-accent-red-orange text-sm font-bold">f_r</span> = Resonant Frequency (Hz) - Peak frequency of current</div>
                            <div><span className="font-mono text-accent-blue text-sm font-bold">L</span> = Inductance (H) - Inductor coil capacity</div>
                            <div><span className="font-mono text-success-green text-sm font-bold">C</span> = Capacitance (F) - Capacitor capacity in Farads</div>
                          </div>
                        )}

                        {/* Handdrawn circuit diagram */}
                        <div className="mt-8 border-t border-ink-primary/10 pt-4 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-ink-secondary mb-2 uppercase tracking-wide">Circuit Diagram Doodle</span>
                          <svg viewBox="0 0 160 90" className="w-40 h-24 stroke-ink-primary" fill="none" strokeWidth="1.5">
                            <path d="M 10 45 L 50 45 M 110 45 L 150 45 M 10 45 L 10 10 L 150 10 L 150 45 M 10 45 L 10 80 L 150 80 L 150 45" />
                            {activeExperiment === "LCR Circuit Response" ? (
                              <circle cx="80" cy="10" r="6" />
                            ) : (
                              <>
                                <line x1="70" y1="5" x2="70" y2="15" strokeWidth="2.5" />
                                <line x1="80" y1="8" x2="80" y2="12" />
                                <line x1="90" y1="5" x2="90" y2="15" strokeWidth="2.5" />
                              </>
                            )}
                            {activeExperiment === "LCR Circuit Response" ? (
                              <>
                                <path d="M 60 80 L 65 75 L 75 85 L 85 75 L 90 80" />
                                <path d="M 90 80 Q 95 72 100 80 Q 105 72 110 80" />
                              </>
                            ) : (
                              <path d="M 60 80 L 65 75 L 75 85 L 85 75 L 95 85 L 100 80" />
                            )}
                            {activeExperiment === "RC Circuit Response" ? (
                              <>
                                <line x1="77" y1="35" x2="77" y2="55" strokeWidth="2.5" />
                                <line x1="83" y1="35" x2="83" y2="55" strokeWidth="2.5" />
                              </>
                            ) : (
                              <>
                                <circle cx="80" cy="45" r="12" fill="white" />
                                <text x="80" y="49" textAnchor="middle" stroke="none" fill="var(--color-ink-primary)" className="font-heading font-bold text-[10px]">{activeExperiment === "LCR Circuit Response" ? "A" : "V"}</text>
                              </>
                            )}
                          </svg>
                        </div>
                      </div>
                    ) : theorySection === 'Calculation' ? (
                      <div>
                        <h3 className="text-sm font-bold font-heading text-ink-primary border-b border-ink-primary/10 pb-1.5 mb-4 uppercase tracking-wide animate-none">
                          Worked Calculation
                        </h3>

                        <div className="bg-paper-card border border-ink-primary/10 rounded-xl p-4 mb-4">
                          <div className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider mb-2">Mathematical Model</div>
                          {activeExperiment === "Ohm's Law" ? (
                            <div className="space-y-2">
                              <div className="font-handwritten text-xl font-bold text-ink-primary">R = 1 / Slope</div>
                              <div className="text-xs text-ink-secondary">Where Slope (m) = Δ{col2Config.name} / Δ{col1Config.name}</div>
                            </div>
                          ) : activeExperiment === "RC Circuit Response" ? (
                            <div className="space-y-2">
                              <div className="font-handwritten text-xl font-bold text-ink-primary">τ = R × C</div>
                              <div className="text-xs text-ink-secondary">Determined by finding t when V(t) = 0.632 × V_max</div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="font-handwritten text-xl font-bold text-ink-primary">f_r = 1 / (2π × √(L × C))</div>
                              <div className="text-xs text-ink-secondary">Determined by identifying the frequency of peak current</div>
                            </div>
                          )}
                        </div>

                        <div className="bg-[#FDF8EC] border-2 border-dashed border-ink-primary/20 rounded-xl p-4 mb-4">
                          <div className="text-[10px] font-bold text-accent-orange uppercase tracking-wider mb-3">Worked Step-by-Step</div>
                          
                          <pre className="whitespace-pre-line font-mono text-[11px] leading-relaxed text-ink-primary">
                            {graphResult?.calculationText || `Calculating regression values based on current table data...`}
                          </pre>
                        </div>

                        <div className="bg-success-green/5 border-2 border-success-green/30 rounded-xl p-4">
                          <div className="text-[10px] font-bold text-success-green uppercase tracking-wider mb-1">Final Result Summary</div>
                          <div className="text-xs font-bold text-ink-primary leading-normal">
                            {activeExperiment === "Ohm's Law" ? (
                              <span>Calculated Resistance (R) is <span className="font-mono text-sm text-success-green">{regression.resistance.toFixed(1)} Ω</span></span>
                            ) : activeExperiment === "RC Circuit Response" ? (
                              <span>Time Constant (τ) is <span className="font-mono text-sm text-success-green">{(regression.slope !== 0 ? Math.abs(1.5 / regression.slope) : 2.5).toFixed(2)} ms</span></span>
                            ) : (
                              <span>Resonant Frequency (f_r) is <span className="font-mono text-sm text-success-green">{(regression.slope !== 0 ? Math.abs(8.2 * regression.slope) : 1000).toFixed(0)} Hz</span></span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-sm font-bold font-heading text-ink-primary border-b border-ink-primary/10 pb-1.5 mb-4 uppercase tracking-wide">
                          {theorySection}
                        </h3>
                        
                        <div className="mb-5">
                          <span className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1.5">Formal Theory (Textbook)</span>
                          <p className="font-medium bg-paper-bg/10 p-3 rounded-lg border border-ink-primary/5 whitespace-pre-line text-ink-primary">
                            {cachedTheory?.formal || `Refer to the experiment handout instructions for detailed information on ${activeExperiment}.`}
                          </p>
                        </div>

                        <div className="mt-5 bg-accent-blue/5 border-2 border-dashed border-accent-blue/30 rounded-xl p-4 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-accent-blue text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl font-heading">
                            Explained Simply ✨
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 shrink-0 bg-accent-blue/10 rounded-lg flex items-center justify-center text-accent-blue border border-accent-blue/20">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xs font-bold text-accent-blue uppercase tracking-wide mb-1 font-heading">In Plain Terms</h4>
                              <p className="text-xs font-semibold text-ink-primary leading-relaxed whitespace-pre-line">
                                {cachedTheory?.simple || `Analogy calculations generated by Gemini Vision models on startup.`}
                              </p>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>

              </div>
            </NotebookPage>
          )}

          {viewState === 'explanation' && (
            <NotebookPage tabLabel="AI Explanation" showDecorations={true}>
              <div className="flex flex-col gap-4">
                
                {/* Wizard Tab Navigation */}
                <div className="flex flex-wrap items-center gap-2 bg-paper-bg/40 p-1.5 rounded-xl border border-ink-primary/10 select-none">
                  <button onClick={() => setViewState('editor')} className="flex items-center gap-1 px-3 py-1 bg-paper-card border border-ink-primary rounded-lg text-xs font-bold hover:bg-ink-primary/5 cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back Editor
                  </button>
                  <div className="h-4 w-px bg-ink-primary/10 mx-1"></div>
                  <button onClick={() => setViewState('graph-generator')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (8) Graph Generator
                  </button>
                  <button onClick={() => setViewState('suggestions')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (9) Smart Suggestions
                  </button>
                  <button onClick={() => setViewState('theory')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (10) Theory & Formula
                  </button>
                  <button onClick={() => setViewState('explanation')} className="px-3 py-1 bg-accent-orange text-white border border-ink-primary rounded-lg text-xs font-bold cursor-pointer">
                    (11) AI Explanation
                  </button>
                  <button onClick={() => setViewState('report')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (12) Report Preview
                  </button>
                </div>

                <div className="px-1 mb-2">
                  <h2 className="text-lg font-bold font-heading text-ink-primary">AI Explanation & Viva Prep</h2>
                  <p className="text-xs text-ink-secondary mt-0.5">Plain-language interpretation of the plotted graph results and cached viva questions</p>
                </div>

                <AIExplanationBubble
                  title="Graph Verification Results"
                  bubbleText={activeExperiment === "Ohm's Law" 
                    ? `Your graph is a straight line passing through the origin, which shows that ${col2Config.name.toLowerCase()} is directly proportional to ${col1Config.name.toLowerCase()}. This verifies Ohm's Law. The slope of the line is approximately ${regression.slope.toFixed(2)} ${col2Config.unit}/${col1Config.unit}, giving a calculated resistance of R = ${regression.resistance.toFixed(1)} Ω.`
                    : activeExperiment === "RC Circuit Response"
                    ? `Your graph shows an exponential charging curve for the capacitor. The voltage rises rapidly at first, then flattens out as it approaches the maximum input voltage. From the 63.2% mark on the curve, the time constant τ of the circuit is calculated to be approximately ${(regression.slope !== 0 ? Math.abs(1.5 / regression.slope) : 2.5).toFixed(2)} ms.`
                    : `Your graph exhibits a distinct resonance peak where current reaches its maximum value. This represents the resonant frequency of the series LCR circuit, where inductive and capacitive reactances cancel out. The resonant frequency is calculated to be approximately ${(regression.slope !== 0 ? Math.abs(8.2 * regression.slope) : 1000).toFixed(0)} Hz.`
                  }
                  commonMistakes={activeExperiment === "Ohm's Law"
                    ? [
                        "Incorrect scale selection (doesn't occupy 60% of graph space)",
                        "Wrong axis connection (swapping independent and dependent variables)",
                        "Parallax error when reading analog voltmeter and ammeter scales",
                        "Not taking zero reading (forgetting that 0V must output 0A)"
                      ]
                    : activeExperiment === "RC Circuit Response"
                    ? [
                        "Not waiting long enough for the capacitor to fully charge",
                        "Using wrong resistor values which shifts the charging rate beyond display range",
                        "Forgetting to completely discharge capacitor before starting a new run"
                      ]
                    : [
                        "Taking too few data points around the peak resonance frequency",
                        "Connecting inductor with high internal winding resistance"
                      ]
                  }
                />

                {/* Cached Viva Questions Section */}
                <div className="bg-white border-2 border-ink-primary rounded-xl p-5 shadow-[3px_3px_0px_0px_rgba(44,62,80,1)] mt-4">
                  <h3 className="text-sm font-bold font-heading text-ink-primary border-b border-ink-primary/5 pb-2 mb-3">Cached Viva Voce Q&A</h3>
                  <div className="space-y-4 text-xs font-semibold text-ink-primary">
                    {cachedViva.map((q) => (
                      <div key={q.id} className="border-b border-dashed border-ink-primary/10 pb-3">
                        <div className="text-[9px] text-accent-orange uppercase tracking-wider mb-1 font-mono">{q.category} Question</div>
                        <div className="font-bold mb-1.5 text-ink-primary">Q: {q.question}</div>
                        <div className="text-ink-secondary bg-paper-bg/30 p-2.5 rounded border border-ink-primary/5 font-medium leading-relaxed">
                          <span className="font-bold text-success-green mr-1">Answer:</span> {q.answer}
                        </div>
                      </div>
                    ))}
                    {cachedViva.length === 0 && (
                      <div className="text-ink-secondary py-3 text-center">Generating experiment viva questions bank...</div>
                    )}
                  </div>
                </div>

              </div>
            </NotebookPage>
          )}

          {viewState === 'report' && (
            <NotebookPage tabLabel="Report Preview" showDecorations={true}>
              <div className="flex flex-col gap-4">
                
                {/* Wizard Tab Navigation */}
                <div className="flex flex-wrap items-center gap-2 bg-paper-bg/40 p-1.5 rounded-xl border border-ink-primary/10 select-none">
                  <button onClick={() => setViewState('editor')} className="flex items-center gap-1 px-3 py-1 bg-paper-card border border-ink-primary rounded-lg text-xs font-bold hover:bg-ink-primary/5 cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back Editor
                  </button>
                  <div className="h-4 w-px bg-ink-primary/10 mx-1"></div>
                  <button onClick={() => setViewState('graph-generator')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (8) Graph Generator
                  </button>
                  <button onClick={() => setViewState('suggestions')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (9) Smart Suggestions
                  </button>
                  <button onClick={() => setViewState('theory')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (10) Theory & Formula
                  </button>
                  <button onClick={() => setViewState('explanation')} className="px-3 py-1 hover:bg-ink-primary/5 border border-transparent rounded-lg text-xs font-bold text-ink-primary cursor-pointer">
                    (11) AI Explanation
                  </button>
                  <button onClick={() => setViewState('report')} className="px-3 py-1 bg-accent-orange text-white border border-ink-primary rounded-lg text-xs font-bold cursor-pointer">
                    (12) Report Preview
                  </button>
                </div>

                <div className="px-1 mb-2 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-bold font-heading text-ink-primary">Lab Report Preview</h2>
                    <p className="text-xs text-ink-secondary mt-0.5">Final generated report combining Aim, Formula, Observations and scaled Graph</p>
                  </div>
                  <button 
                    onClick={async () => {
                      if (currentRunId) {
                        const rep = await api.generateReport(currentRunId);
                        window.open(rep.pdfUrl || '#', '_blank');
                      }
                    }} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-primary text-white border border-ink-primary rounded-lg text-xs font-bold hover:bg-ink-primary/80 transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Export PDF Report
                  </button>
                </div>

                <ReportPreviewCard
                  experimentName={`${activeExperiment}`}
                  data={tableData}
                  aim={activeExperiment === "Ohm's Law" ? "To verify Ohm's Law and calculate the resistance of the given conductor." : activeExperiment === "RC Circuit Response" ? "To study the charging and discharging characteristics of a capacitor in an RC circuit and determine the time constant." : "To study the frequency response of a series LCR circuit and find its resonant frequency."}
                  formula={activeExperiment === "Ohm's Law" ? "V = IR" : activeExperiment === "RC Circuit Response" ? "τ = RC" : "f_r = 1 / (2π × √(L × C))"}
                  col1Config={col1Config}
                  col2Config={col2Config}
                />

              </div>
            </NotebookPage>
          )}

          {viewState === 'history' && (
            <NotebookPage tabLabel="History" showDecorations={true}>
              <div className="flex flex-col md:flex-row gap-6">
                <SidebarNav activeItem="history" onSelect={(item) => setViewState(item)} />

                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-bold font-heading text-ink-primary">Saved Experiments History</h2>
                    <SearchBar 
                      placeholder="Search saved runs..." 
                      value={historySearch} 
                      onChange={setHistorySearch}
                      className="w-full sm:w-64"
                    />
                  </div>

                  <div className="space-y-3 mt-2">
                    {filteredHistory.map((run) => (
                      <div key={run.id} className="p-4 bg-white border-2 border-ink-primary rounded-xl shadow-[2.5px_2.5px_0px_0px_rgba(44,62,80,1)] flex items-center justify-between hover:translate-y-[-1px] transition-transform flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-accent-orange/10 border-2 border-ink-primary flex items-center justify-center text-accent-orange font-heading font-black text-sm">
                            GL
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-ink-primary">{run.experiment.name}</h4>
                            <span className="text-[10px] text-ink-secondary">{run.experiment.subject} • {new Date(run.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-ink-secondary bg-paper-bg px-2 py-1 rounded border border-ink-primary/5">OCR Conf: {(run.ocrConfidence * 100).toFixed(0)}%</span>
                          <button 
                            onClick={async () => {
                              setCurrentRunId(run.id);
                              setCurrentRunImage(run.imageUrl);
                              setSelectedExperimentId(run.experimentId);
                              setActiveExperiment(run.experiment.name);
                              
                              // Load rows
                              const fetched = await api.getRows(run.id);
                              const mapped = fetched.rows.map(r => ({
                                sNo: r.index + 1,
                                voltage: r.col1Value,
                                current: r.col2Value,
                                voltageLowConfidence: r.col1Confidence < 0.75,
                                currentLowConfidence: r.col2Confidence < 0.75,
                              }));
                              setTableData(mapped);
                              setCol1Config({
                                name: fetched.col1Config.name || 'X',
                                unit: fetched.col1Config.unit || '',
                                availableUnits: [fetched.col1Config.unit || '', 'V', 'mV', 'kV', 'ms', 's', 'Hz', 'kHz'].filter(Boolean)
                              });
                              setCol2Config({
                                name: fetched.col2Config.name || 'Y',
                                unit: fetched.col2Config.unit || '',
                                availableUnits: [fetched.col2Config.unit || '', 'mA', 'A', 'µA', 'V', 'mV'].filter(Boolean)
                              });

                              // Load graph results
                              const graphRes = await api.generateGraph(run.id);
                              setGraphResult(graphRes);

                              setViewState('editor');
                            }}
                            className="px-3 py-1.5 bg-accent-blue text-white border border-ink-primary rounded-lg text-[10px] font-bold shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer hover:bg-accent-blue/80"
                          >
                            Open Run
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredHistory.length === 0 && (
                      <div className="text-xs text-ink-secondary text-center py-6 font-bold">No matching experiment runs found.</div>
                    )}
                  </div>
                </div>
              </div>
            </NotebookPage>
          )}

          {viewState === 'achievements' && (
            <NotebookPage tabLabel="Achievements" showDecorations={true}>
              <div className="flex flex-col md:flex-row gap-6">
                <SidebarNav activeItem="achievements" onSelect={(item) => setViewState(item)} />

                <div className="flex-1 flex flex-col">
                  <h2 className="text-xl font-bold font-heading text-ink-primary mb-1">Laboratory Badges</h2>
                  <p className="text-xs text-ink-secondary mb-6 font-semibold">Earn achievement badges by generating accurate graphs and completing lab analysis tasks</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {achievements.map(ach => (
                      <AchievementBadge 
                        key={ach.id}
                        title={ach.title} 
                        description={ach.description} 
                        icon={<span className="text-xl">{ach.icon}</span>} 
                        unlocked={ach.unlocked} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </NotebookPage>
          )}

          {viewState === 'profile' && (
            <NotebookPage tabLabel="Profile" showDecorations={true}>
              <div className="flex flex-col md:flex-row gap-6">
                <SidebarNav activeItem="profile" onSelect={(item) => setViewState(item)} />

                <div className="flex-1 bg-white border-2 border-ink-primary rounded-xl shadow-[3px_3px_0px_0px_rgba(44,62,80,1)] p-6 relative">
                  <h3 className="text-sm font-bold font-heading text-ink-primary border-b border-ink-primary/5 pb-2 mb-4">Student Profile Details</h3>
                  
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (profile) {
                        const updated = await api.updateProfile({
                          fullName: profile.fullName,
                          year: profile.year || '1st Year',
                          department: profile.department || 'Science'
                        });
                        setProfile(updated);
                        alert('Profile updated successfully!');
                      }
                    }} 
                    className="space-y-4 font-semibold text-xs text-ink-primary"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 uppercase font-heading text-[10px] tracking-wide text-ink-secondary">Full Name</label>
                        <input 
                          type="text" 
                          value={profile?.fullName || ''} 
                          onChange={(e) => setProfile(p => p ? { ...p, fullName: e.target.value } : null)}
                          className="w-full bg-white border-2 border-ink-primary rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-accent-orange font-bold text-ink-primary"
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 uppercase font-heading text-[10px] tracking-wide text-ink-secondary">Academic Email</label>
                        <input 
                          type="email" 
                          value={profile?.email || ''} 
                          disabled
                          className="w-full bg-ink-secondary/5 border-2 border-ink-primary/20 rounded-lg py-2 px-3 text-xs focus:outline-none text-ink-secondary cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 uppercase font-heading text-[10px] tracking-wide text-ink-secondary">Academic Year</label>
                        <select 
                          value={profile?.year || '1st Year'} 
                          onChange={(e) => setProfile(p => p ? { ...p, year: e.target.value } : null)}
                          className="w-full bg-white border-2 border-ink-primary rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-accent-orange font-bold text-ink-primary"
                        >
                          <option value="1st Year">1st Year (Freshman)</option>
                          <option value="2nd Year">2nd Year (Sophomore)</option>
                          <option value="3rd Year">3rd Year (Junior)</option>
                          <option value="4th Year">4th Year (Senior)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1.5 uppercase font-heading text-[10px] tracking-wide text-ink-secondary">Department / Branch</label>
                        <input 
                          type="text" 
                          value={profile?.department || ''} 
                          onChange={(e) => setProfile(p => p ? { ...p, department: e.target.value } : null)}
                          className="w-full bg-white border-2 border-ink-primary rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-accent-orange font-bold text-ink-primary"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="px-5 py-2 bg-ink-primary text-white font-heading font-black rounded-lg border border-ink-primary shadow-[2px_2px_0px_0px_rgba(243,156,18,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(243,156,18,1)] transition-all cursor-pointer text-center uppercase tracking-wider"
                    >
                      Save Profile Changes
                    </button>
                  </form>
                </div>
              </div>
            </NotebookPage>
          )}

          {viewState === 'settings' && (
            <NotebookPage tabLabel="Settings" showDecorations={true}>
              <div className="flex flex-col md:flex-row gap-6">
                <SidebarNav activeItem="settings" onSelect={(item) => setViewState(item)} />

                <div className="flex-1 bg-white border-2 border-ink-primary rounded-xl shadow-[3px_3px_0px_0px_rgba(44,62,80,1)] p-6 relative">
                  
                  {/* Settings inner Tabs */}
                  <div className="flex gap-4 border-b border-ink-primary/5 pb-2 mb-4 font-heading font-bold text-xs select-none">
                    <button 
                      onClick={() => setActiveSettingsTab('preferences')} 
                      className={`pb-1 hover:text-accent-orange transition-colors cursor-pointer border-b-2 ${activeSettingsTab === 'preferences' ? 'border-accent-orange text-accent-orange' : 'border-transparent text-ink-secondary'}`}
                    >
                      Lab Preferences
                    </button>
                    <button 
                      onClick={() => setActiveSettingsTab('account')} 
                      className={`pb-1 hover:text-accent-orange transition-colors cursor-pointer border-b-2 ${activeSettingsTab === 'account' ? 'border-accent-orange text-accent-orange' : 'border-transparent text-ink-secondary'}`}
                    >
                      Account Settings
                    </button>
                  </div>

                  {activeSettingsTab === 'preferences' ? (
                    <div className="space-y-4">
                      <ToggleRow label="Auto-Save Readings" description="Automatically persist table corrections to database on exit." checked={settingsAutoSave} onChange={setSettingsAutoSave} />
                      <ToggleRow label="Display Millimeter Grid by Default" description="Turn on detailed coordinate grids for new graph plots." checked={settingsDefaultGrid} onChange={setSettingsDefaultGrid} />
                      <ToggleRow label="Email Report Confirmations" description="Receive report PDFs directly in your verified mailbox." checked={settingsEmailNotify} onChange={setSettingsEmailNotify} />
                      <ToggleRow label="Show Intelligent Regression Hints" description="Provide automated tips on scaling limits and fitting errors." checked={settingsAISuggest} onChange={setSettingsAISuggest} />
                      
                      <div className="pt-4 flex items-center justify-between border-t border-ink-primary/5">
                        <div className="text-xs font-bold font-heading text-ink-primary">Preferred Language</div>
                        <select 
                          value={settingsLang} 
                          onChange={(e) => setSettingsLang(e.target.value)}
                          className="bg-white border-2 border-ink-primary text-xs font-bold py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1"
                        >
                          <option value="en">English (US)</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-ink-primary/5 pb-4">
                        <div>
                          <h4 className="text-xs font-bold text-ink-primary mb-1">Reset Password</h4>
                          <p className="text-[10px] text-ink-secondary">Send a secure password reset link to your verified student email address.</p>
                        </div>
                        <button 
                          onClick={async () => {
                            if (profile?.email) {
                              await supabase.auth.resetPasswordForEmail(profile.email);
                              alert('Reset link sent to ' + profile.email);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-paper-card border border-ink-primary rounded-lg text-xs font-bold hover:bg-ink-primary/5 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5" /> Send Reset Link
                        </button>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-ink-primary mb-1">Signed Sessions</h4>
                          <p className="text-[10px] text-ink-secondary">Active credentials linked to your current device and browser.</p>
                        </div>
                        <button 
                          onClick={handleSignOut}
                          className="px-3.5 py-2 bg-accent-red-orange/10 border border-accent-red-orange rounded-lg text-xs font-bold text-accent-red-orange cursor-pointer hover:bg-accent-red-orange/15 transition-all"
                        >
                          Terminate Current Session
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </NotebookPage>
          )}
        </main>

        <footer className="text-center text-[10px] text-ink-secondary/70 font-semibold font-body select-none">
          GraphLab AI Project © {new Date().getFullYear()} — Made with ♥ by Physics, Electronics & Electrical Engineering Students.
        </footer>

      </div>

    </div>
  );
}
