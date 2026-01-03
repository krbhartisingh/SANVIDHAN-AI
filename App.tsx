
import React, { useState, useEffect, useRef } from 'react';
import { 
  Scale, 
  MessageSquare, 
  BookMarked, 
  Search, 
  ShieldCheck, 
  Settings, 
  Crown, 
  Moon, 
  Sun,
  Menu,
  X,
  Languages,
  Mic,
  MicOff,
  Volume2,
  FileUp,
  CreditCard,
  CheckCircle2,
  Info,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { UserMode, SubscriptionPlan, Message, Bookmark, AppState } from './types';
import { LANGUAGES, PRICING_PLANS } from './constants';
import { chatWithSanvidhan, generateSpeech, decodeBase64, decodeAudioData } from './services/gemini';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    mode: UserMode.CITIZEN,
    plan: SubscriptionPlan.FREE,
    language: 'en',
    isDarkMode: false,
    messages: [
      {
        id: '1',
        role: 'model',
        content: 'Namaste! I am Sanvidhan AI, your constitutional companion. How can I help you understand the laws and rights that govern our nation today?',
        timestamp: Date.now()
      }
    ],
    bookmarks: [],
    constitutionPdf: null
  });

  const [input, setInput] = useState('');
  const [articleSearch, setArticleSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSendMessage(transcript, true);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [state.language, state.mode]);

  const handleSendMessage = async (customPrompt?: string, fromVoice: boolean = false) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
      isVoice: fromVoice
    };

    setState(prev => ({ ...prev, messages: [...prev.messages, userMessage] }));
    if (!customPrompt) setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithSanvidhan(
        [...state.messages, userMessage],
        state.mode,
        state.language,
        state.constitutionPdf
      );

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response,
        timestamp: Date.now()
      };

      setState(prev => ({ ...prev, messages: [...prev.messages, modelMessage] }));
      
      // Auto-play voice if input was voice and user is premium
      if (fromVoice && state.plan === SubscriptionPlan.PREMIUM) {
        playVoice(response);
      }
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I'm having trouble connecting. Please check your network or API configuration.",
        timestamp: Date.now()
      };
      setState(prev => ({ ...prev, messages: [...prev.messages, errorMessage] }));
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (state.plan === SubscriptionPlan.FREE) {
      setShowPricing(true);
      return;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.lang = state.language === 'hi' ? 'hi-IN' : 'en-IN';
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  const playVoice = async (text: string) => {
    if (state.plan === SubscriptionPlan.FREE) {
      setShowPricing(true);
      return;
    }

    if (isSpeaking) return;

    try {
      setIsSpeaking(true);
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      console.error(e);
      setIsSpeaking(false);
    }
  };

  const handleArticleLookup = () => {
    if (!articleSearch.trim()) return;
    const prompt = `Retrieve and provide a simple explanation for Article ${articleSearch} of the Indian Constitution.`;
    handleSendMessage(prompt);
    setArticleSearch('');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setState(prev => ({ ...prev, constitutionPdf: base64 }));
        alert("Constitution PDF uploaded and active as source of truth!");
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleBookmark = (message: Message) => {
    const existing = state.bookmarks.find(b => b.id === message.id);
    if (existing) {
      setState(prev => ({ ...prev, bookmarks: prev.bookmarks.filter(b => b.id !== message.id) }));
    } else {
      const newBookmark: Bookmark = {
        id: message.id,
        articleId: 'Extracted',
        title: message.content.substring(0, 30) + '...',
        content: message.content
      };
      setState(prev => ({ ...prev, bookmarks: [...prev.bookmarks, newBookmark] }));
    }
  };

  const simulatePayment = (planName: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowPaymentSuccess(true);
      setState(prev => ({ ...prev, plan: SubscriptionPlan.PREMIUM }));
      setTimeout(() => {
        setShowPaymentSuccess(false);
        setShowPricing(false);
      }, 3000);
    }, 2000);
  };

  return (
    <div className={`flex h-screen ${state.isDarkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-slate-900'}`}>
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
        ${state.isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}
        border-r flex flex-col
      `}>
        <div className="p-6 border-b border-inherit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <Scale size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Sanvidhan AI</h1>
              <p className="text-xs opacity-60">Constitutional Companion</p>
            </div>
          </div>

          <div className="space-y-1">
            <button 
              onClick={() => setState(prev => ({ ...prev, mode: UserMode.CITIZEN }))}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${state.mode === UserMode.CITIZEN ? 'bg-orange-50 text-orange-600' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
            >
              <ShieldCheck size={18} /> Citizen Mode
            </button>
            <button 
              onClick={() => setState(prev => ({ ...prev, mode: UserMode.STUDENT }))}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${state.mode === UserMode.STUDENT ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
            >
              <BookMarked size={18} /> Student Mode
            </button>
            <button 
              onClick={() => setState(prev => ({ ...prev, mode: UserMode.LEGAL }))}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${state.mode === UserMode.LEGAL ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
            >
              <Scale size={18} /> Legal Awareness
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-50 flex items-center gap-2">
              <Search size={14} /> Quick Article Lookup
            </h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g. 14, 21, 370"
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleArticleLookup()}
                className={`flex-1 text-xs p-2 rounded border focus:outline-none focus:ring-1 focus:ring-orange-500 ${state.isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
              />
              <button 
                onClick={handleArticleLookup}
                className="p-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-50">Saved Articles</h3>
            {state.bookmarks.length === 0 ? (
              <p className="text-xs opacity-40 italic">No bookmarks yet</p>
            ) : (
              <ul className="space-y-2">
                {state.bookmarks.map(b => (
                  <li key={b.id} className={`text-xs p-2 rounded cursor-pointer line-clamp-2 ${state.isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    {b.title}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-50">Knowledge Base</h3>
            <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${state.isDarkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileUp className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-[10px] text-gray-500 text-center px-4">{state.constitutionPdf ? 'Constitution PDF Active' : 'Upload Sanvidhan PDF'}</p>
              </div>
              <input type="file" className="hidden" accept="application/pdf" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-inherit">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
               <Languages size={16} />
               <select 
                value={state.language}
                onChange={(e) => setState(prev => ({ ...prev, language: e.target.value }))}
                className="text-xs bg-transparent focus:outline-none font-medium cursor-pointer"
               >
                 {LANGUAGES.map(lang => (
                   <option key={lang.code} value={lang.code}>{lang.nativeName}</option>
                 ))}
               </select>
             </div>
             <button 
              onClick={() => setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }))}
              className={`p-2 rounded-full transition-colors ${state.isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
             >
               {state.isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
             </button>
          </div>
          
          <button 
            onClick={() => setShowPricing(true)}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {state.plan === SubscriptionPlan.FREE ? (
              <>
                <Crown size={16} />
                Upgrade to Premium
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Premium Active
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Header */}
        <header className={`h-16 border-b flex items-center justify-between px-6 ${state.isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 md:hidden hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="font-semibold text-sm">Sanvidhan AI Live</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-500 items-center gap-1">
              <Info size={12} /> {state.mode} Mode
            </div>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {state.messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[85%] rounded-2xl p-4 shadow-sm
                  ${message.role === 'user' 
                    ? 'bg-orange-500 text-white' 
                    : state.isDarkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800 border border-gray-100'}
                `}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                      {message.role === 'user' ? 'Citizen' : 'Sanvidhan AI'}
                    </span>
                    <div className="flex gap-2">
                      {message.role === 'model' && (
                        <>
                          <button 
                            onClick={() => playVoice(message.content)}
                            className={`p-1 hover:bg-black/5 rounded transition-colors ${isSpeaking ? 'animate-pulse text-orange-500' : ''}`}
                          >
                            <Volume2 size={14} />
                          </button>
                          <button 
                            onClick={() => toggleBookmark(message)}
                            className={`p-1 hover:bg-black/5 rounded ${state.bookmarks.find(b => b.id === message.id) ? 'text-yellow-500' : ''}`}
                          >
                            <BookMarked size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none prose-slate dark:prose-invert">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`${state.isDarkMode ? 'bg-slate-800' : 'bg-white'} border border-gray-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm`}>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={`p-6 border-t ${state.isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="max-w-4xl mx-auto">
            {isListening && (
              <div className="flex items-center justify-center gap-4 mb-4 text-orange-500 animate-pulse">
                <div className="flex gap-1 items-end h-6">
                  <div className="w-1 bg-orange-500 rounded-full animate-[height_0.5s_ease-in-out_infinite] h-2"></div>
                  <div className="w-1 bg-orange-500 rounded-full animate-[height_0.5s_ease-in-out_0.1s_infinite] h-4"></div>
                  <div className="w-1 bg-orange-500 rounded-full animate-[height_0.5s_ease-in-out_0.2s_infinite] h-6"></div>
                  <div className="w-1 bg-orange-500 rounded-full animate-[height_0.5s_ease-in-out_0.3s_infinite] h-3"></div>
                  <div className="w-1 bg-orange-500 rounded-full animate-[height_0.5s_ease-in-out_0.4s_infinite] h-5"></div>
                </div>
                <span className="text-sm font-semibold">Listening to you...</span>
              </div>
            )}
            
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isListening ? "Speak clearly now..." : `Ask about the Constitution in ${LANGUAGES.find(l => l.code === state.language)?.name}...`}
                  className={`w-full py-4 pl-6 pr-14 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all ${state.isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
                <button 
                  onClick={isListening ? () => { recognitionRef.current?.stop(); setIsListening(false); } : startListening}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isListening ? 'bg-orange-500 text-white animate-pulse' : 'hover:bg-gray-200 text-gray-400'}`}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              </div>
              <button 
                onClick={() => handleSendMessage()}
                disabled={isLoading || !input.trim()}
                className="p-4 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : <MessageSquare size={24} />}
              </button>
            </div>
            <p className="text-[10px] text-center mt-4 opacity-40">
              Disclaimer: This is an AI-based constitutional information system, not a lawyer. Strictly referenced from the Sanvidhan.
            </p>
          </div>
        </div>

        {/* Pricing Modal */}
        {showPricing && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
            <div className={`max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row ${state.isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="flex-1 p-8 md:p-12">
                <div className="flex justify-between items-start mb-8">
                  <h2 className="text-3xl font-bold">Unlock Premium Features</h2>
                  <button onClick={() => setShowPricing(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {PRICING_PLANS.slice(0, 2).map((plan) => (
                    <div key={plan.id} className={`p-6 rounded-2xl border-2 transition-all ${plan.id === 'premium' ? 'border-orange-500 ring-4 ring-orange-500/10' : state.isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                      <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                      <p className="text-2xl font-bold text-orange-500 mb-6">{plan.price}</p>
                      <ul className="space-y-3 mb-8">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-sm opacity-80">
                            <CheckCircle2 size={16} className="text-green-500" /> {f}
                          </li>
                        ))}
                      </ul>
                      <button 
                        onClick={() => plan.id === 'premium' ? simulatePayment(plan.name) : setShowPricing(false)}
                        className={`w-full py-3 rounded-xl font-bold transition-all ${plan.id === 'premium' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02]' : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200'}`}
                      >
                        {plan.id === 'premium' ? 'Select Premium' : 'Current Plan'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden md:block w-72 bg-orange-500 p-8 text-white relative overflow-hidden">
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <ShieldCheck size={48} className="mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Voice & AI Powered</h3>
                  <p className="text-sm opacity-90">Experience seamless voice interactions and deep legal insights with our Premium tier.</p>
                </div>
                <Scale className="absolute -top-10 -right-10 w-48 h-48 opacity-10 rotate-12" />
              </div>
            </div>
          </div>
        )}

        {/* Payment Success Overlay */}
        {showPaymentSuccess && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-6 backdrop-blur-md">
            <div className="bg-white rounded-3xl p-12 flex flex-col items-center text-center animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
              <p className="text-slate-500 mb-8">Welcome to Sanvidhan AI Premium. Voice features are now unlocked.</p>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <style>{`
        @keyframes height {
          0%, 100% { height: 4px; }
          50% { height: 24px; }
        }
      `}</style>
    </div>
  );
};

export default App;
