import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2, Mic, MicOff, Bot, AlertTriangle, Keyboard } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_ACTIONS = [
  { icon: "⚡", label: "Best route today" },
  { icon: "⏱️", label: "Show delayed payments" },
  { icon: "💰", label: "How to reduce fees?" },
  { icon: "📊", label: "Settlement report" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

// Speech recognition typing
const SpeechRecognition: any =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied" | "unsupported">(
    SpeechRecognition ? "unknown" : "unsupported"
  );
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hey there 👋 I'm **Settle**, your AI payment co-pilot.\n\nAsk me about routes, fees, settlements — or tap the mic and just talk to me.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(
    async (text?: string) => {
      const userText = (text ?? input).trim();
      if (!userText || loading) return;
      setInput("");
      const userMsg: Msg = { role: "user", content: userText };
      const baseMessages = [...messages, userMsg];
      setMessages(baseMessages);
      setLoading(true);

      let acc = "";
      let started = false;
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          signal: ctrl.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: baseMessages.map(m => ({ role: m.role, content: m.content })),
          }),
        });
        if (resp.status === 429) {
          toast.error("Rate limit reached. Try again shortly.");
          setLoading(false);
          return;
        }
        if (resp.status === 402) {
          toast.error("AI credits exhausted.");
          setLoading(false);
          return;
        }
        if (!resp.ok || !resp.body) throw new Error("Failed");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let streamDone = false;

        const pushDelta = (chunk: string) => {
          acc += chunk;
          if (!started) {
            started = true;
            setMessages(prev => [...prev, { role: "assistant", content: acc }]);
          } else {
            setMessages(prev =>
              prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m))
            );
          }
        };

        while (!streamDone) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line || line.startsWith(":")) continue;
            if (!line.startsWith("data: ")) continue;
            const j = line.slice(6).trim();
            if (j === "[DONE]") {
              streamDone = true;
              break;
            }
            try {
              const p = JSON.parse(j);
              const c = p.choices?.[0]?.delta?.content;
              if (c) pushDelta(c);
            } catch {
              buf = line + "\n" + buf;
              break;
            }
          }
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error(e);
          toast.error("Couldn't reach AI. Please try again.");
        }
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [input, loading, messages]
  );

  const toggleMic = async () => {
    if (!SpeechRecognition) {
      toast.error("Voice input isn't supported in this browser. Please type your question instead.");
      setMicPermission("unsupported");
      inputRef.current?.focus();
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    // Try to query permission state via Permissions API for a clearer UX
    let permState: PermissionState | null = null;
    try {
      if (navigator.permissions && (navigator.permissions as any).query) {
        const result = await (navigator.permissions as any).query({ name: "microphone" });
        permState = result.state;
        result.onchange = () => {
          setMicPermission(result.state === "granted" ? "granted" : result.state === "denied" ? "denied" : "unknown");
        };
      }
    } catch {
      // Permissions API may not support microphone on some browsers — continue anyway
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => {
      setListening(true);
      setMicPermission("granted");
    };

    rec.onerror = (e: any) => {
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicPermission("denied");
        toast.error("Microphone access blocked.", {
          description: "Tap the mic icon again to retry, or type your question below.",
          duration: 5000,
        });
      } else if (e.error === "no-speech") {
        toast.info("No speech detected. Try speaking closer to the mic, or type your question.", { duration: 4000 });
      } else if (e.error === "audio-capture" || e.error === "not-found") {
        toast.error("No microphone found.", {
          description: "Please check your device audio settings, or type your question instead.",
          duration: 5000,
        });
        setMicPermission("unsupported");
      } else if (e.error === "network") {
        toast.error("Voice recognition network error.", {
          description: "Please type your question while we retry the connection.",
          duration: 5000,
        });
      } else if (e.error !== "aborted") {
        toast.error("Voice input failed: " + e.error, {
          description: "You can always type your question below.",
          duration: 4000,
        });
      }
    };

    rec.onend = () => {
      setListening(false);
    };

    rec.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
      const last = event.results[event.results.length - 1];
      if (last.isFinal && transcript.trim()) {
        rec.stop();
        send(transcript.trim());
      }
    };

    recognitionRef.current = rec;

    try {
      rec.start();
    } catch (err: any) {
      setListening(false);
      if (err?.name === "NotAllowedError") {
        setMicPermission("denied");
        toast.error("Microphone permission denied.", {
          description: "Please allow mic access in your browser settings, or type your question below.",
          duration: 6000,
        });
      } else {
        toast.error("Could not start voice input. Please type your question instead.");
      }
    }
  };

  return (
    <>
      {/* Floating button — unique morphing orb */}
      <motion.button
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.4 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 group"
        aria-label="Open Settle AI"
      >
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neon-purple via-neon-blue to-neon-cyan blur-xl opacity-60 group-hover:opacity-90 transition-opacity animate-pulse" />
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-purple via-neon-blue to-neon-cyan p-[2px] shadow-2xl">
          <div className="w-full h-full rounded-2xl bg-background/90 backdrop-blur-xl flex items-center justify-center relative overflow-hidden">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent"
            />
            <Bot className="w-6 h-6 text-neon-cyan relative z-10" strokeWidth={2.2} />
          </div>
        </div>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-neon-green rounded-full border-2 border-background flex items-center justify-center">
          <span className="w-1.5 h-1.5 bg-background rounded-full" />
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="fixed z-50 flex flex-col overflow-hidden
                         inset-x-3 bottom-3 top-16 rounded-3xl
                         md:inset-auto md:right-6 md:bottom-6 md:top-auto md:w-[420px] md:h-[640px]
                         bg-gradient-to-br from-card via-card to-card/95
                         border border-neon-purple/30 shadow-[0_0_60px_-15px_hsl(var(--neon-purple)/0.5)]"
            >
              {/* Animated aurora background */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <motion.div
                  animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-neon-purple/40 blur-3xl"
                />
                <motion.div
                  animate={{ x: [0, -80, 0], y: [0, 80, 0] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 -right-20 w-60 h-60 rounded-full bg-neon-blue/40 blur-3xl"
                />
              </div>

              {/* Header */}
              <div className="relative flex items-center justify-between px-4 py-3.5 border-b border-border/30 bg-background/40 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple via-neon-blue to-neon-cyan p-[1.5px]">
                      <div className="w-full h-full rounded-[10px] bg-card flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-neon-cyan" />
                      </div>
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-neon-green rounded-full border-2 border-card animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      Settle
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-neon-purple/20 text-neon-purple uppercase tracking-wider">
                        AI
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span className="w-1 h-1 bg-neon-green rounded-full" />
                      Active · powered by SmartSettle
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-3 py-4 space-y-3">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue flex-shrink-0 flex items-center justify-center mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 text-sm break-words ${
                        m.role === "user"
                          ? "bg-gradient-to-br from-neon-blue to-neon-purple text-white rounded-2xl rounded-br-md shadow-lg shadow-neon-blue/20"
                          : "bg-background/60 backdrop-blur-md border border-border/40 text-foreground rounded-2xl rounded-bl-md"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_strong]:text-neon-cyan [&_code]:text-neon-cyan [&_code]:bg-muted/30 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                          <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
                {loading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue flex-shrink-0 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                    </div>
                    <div className="bg-background/60 border border-border/40 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                          className="w-1.5 h-1.5 bg-neon-cyan rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick suggestions */}
              {messages.length <= 1 && (
                <div className="relative px-3 pb-2 grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map(q => (
                    <motion.button
                      key={q.label}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => send(q.label)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/40 backdrop-blur-md hover:bg-background/70 text-xs text-foreground border border-border/40 hover:border-neon-cyan/40 transition-all text-left"
                    >
                      <span className="text-base">{q.icon}</span>
                      <span className="truncate">{q.label}</span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Mic permission denied banner */}
              <AnimatePresence>
                {micPermission === "denied" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative px-4 py-2.5 bg-yellow-500/10 border-t border-yellow-500/30 flex items-start gap-2.5"
                  >
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-yellow-200 font-medium">Microphone access is blocked</p>
                      <p className="text-[10px] text-yellow-200/70 mt-0.5">
                        You can type your question below, or{" "}
                        <button
                          onClick={() => {
                            setMicPermission("unknown");
                            toggleMic();
                          }}
                          className="underline hover:text-yellow-100 transition-colors"
                        >
                          retry microphone access
                        </button>
                        .
                      </p>
                    </div>
                    <button
                      onClick={() => setMicPermission("unknown")}
                      className="text-[10px] text-yellow-200/60 hover:text-yellow-100 px-1.5 py-0.5 rounded-md hover:bg-yellow-500/10 transition-colors flex-shrink-0"
                    >
                      Dismiss
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Listening indicator */}
              <AnimatePresence>
                {listening && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative px-4 py-2 bg-neon-purple/10 border-t border-neon-purple/30 flex items-center gap-3"
                  >
                    <div className="flex gap-0.5 items-end h-4">
                      {[0, 1, 2, 3, 4].map(i => (
                        <motion.span
                          key={i}
                          animate={{ height: ["20%", "100%", "20%"] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                          className="w-0.5 bg-neon-purple rounded-full"
                          style={{ height: "20%" }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-neon-purple font-medium">Listening… speak now</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">Tap mic again to stop</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input */}
              <div className="relative p-3 border-t border-border/30 bg-background/40 backdrop-blur-xl flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && send()}
                    placeholder={
                      listening
                        ? "Listening…"
                        : micPermission === "denied"
                          ? "Type your question here…"
                          : micPermission === "unsupported"
                            ? "Voice unavailable — type here…"
                            : "Ask Settle anything…"
                    }
                    className="w-full px-4 py-2.5 pr-8 rounded-full bg-background/60 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-cyan/60 focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                  />
                  {(micPermission === "denied" || micPermission === "unsupported") && (
                    <Keyboard className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
                  )}
                </div>
                <button
                  onClick={toggleMic}
                  className={`p-2.5 rounded-full transition-all ${
                    listening
                      ? "bg-neon-purple text-white shadow-lg shadow-neon-purple/40"
                      : micPermission === "denied"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30"
                        : micPermission === "unsupported"
                          ? "bg-muted/30 text-muted-foreground/40 border border-border/20 cursor-not-allowed"
                          : "bg-background/60 hover:bg-muted/50 text-muted-foreground border border-border/40"
                  }`}
                  title={
                    listening
                      ? "Stop listening"
                      : micPermission === "denied"
                        ? "Microphone blocked — click to retry"
                        : micPermission === "unsupported"
                          ? "Voice input not available"
                          : "Voice input"
                  }
                  disabled={micPermission === "unsupported"}
                >
                  {listening ? (
                    <MicOff className="w-4 h-4" />
                  ) : micPermission === "denied" ? (
                    <Mic className="w-4 h-4" />
                  ) : micPermission === "unsupported" ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="p-2.5 rounded-full bg-gradient-to-br from-neon-blue via-neon-purple to-neon-cyan disabled:opacity-30 transition-opacity shadow-lg shadow-neon-purple/30"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
