"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff, Send, Bot, Sparkles } from "lucide-react";

type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

type ChatBubble = { role: "bot" | "user"; text: string };

export default function VoiceConcierge() {
  const backendUrl = (
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001"
  ).replace(/\/$/, "");
  const [started, setStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playback, setPlayback] = useState<HTMLAudioElement | null>(null);
  const [messages, setMessages] = useState<ChatBubble[]>([
    {
      role: "bot",
      text: "Welcome to Housr! Tell me what you need and I&apos;ll speak back with next steps.",
    },
  ]);
  const [askedCount, setAskedCount] = useState(0);
  const [questionLimit, setQuestionLimit] = useState(5);
  const [finished, setFinished] = useState(false);
  const [recommendations, setRecommendations] = useState<
    { title: string; price: string; summary: string }[]
  >([]);
  const [lastBotText, setLastBotText] = useState(
    "Welcome to Housr! Tell me what you need and I&apos;ll speak back with next steps."
  );
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const processUserMessageRef = useRef<(text: string) => void>(() => {});
  const sessionId = React.useMemo(() => `session_${Date.now()}`, []);
  const agentId =
    process.env.NEXT_PUBLIC_ELEVEN_AGENT_ID ||
    "agent_6301kb88z22ee3cr98333t8vyw7g";
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const followUps = [
    "When do you need to move in?",
    "What monthly budget works for you?",
    "Do you prefer studio, en-suite, or shared?",
    "Any must-haves like bills included or near campus?",
    "Want me to line up a virtual tour or in-person viewing?",
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = false;
        recog.lang = "en-US";
        recog.onresult = (event: SpeechRecognitionEvent) => {
          const lastResultIndex = event.results.length - 1;
          const transcript = event.results[lastResultIndex][0].transcript;
          setInputValue("");
          processUserMessageRef.current(transcript);
        };
        recog.onend = () => {
          if (isListening) {
            recog.start();
          }
        };
        recognitionRef.current = recog;
      }
    }
  }, [isListening]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          agent_id: agentId,
          stream: false,
          output_format: "mp3_44100_128",
        }),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(
          message || `TTS request failed with status ${res.status}`
        );
      }

      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") || "audio/mpeg";
      const blob = new Blob([buffer], { type: contentType });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      if (playback) {
        playback.pause();
        playback.currentTime = 0;
      }
      const audio = new Audio(url);
      setPlayback(audio);
      await audio.play();
    } catch (err: any) {
      let errorMessage = err?.message || "Unable to generate speech";
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        errorMessage = `Cannot connect to backend at ${backendUrl}. Make sure the backend server is running.`;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const beginJourney = () => {
    if (started) return;
    setStarted(true);
    setFinished(false);
    const limit = Math.floor(Math.random() * 4) + 5; // 5-8 questions
    setQuestionLimit(limit);
    const prompt =
      "Tell me about the city, timing, budget, and anything you care about.";
    setMessages((prev) => [...prev, { role: "bot", text: prompt }]);
    setAskedCount(1);
    speak(prompt);
    setLastBotText(prompt);
  };

  const nextFollowUp = () =>
    followUps[Math.floor(Math.random() * followUps.length)];

  const buildSmartReply = (userText: string) => {
    const lower = userText.toLowerCase();
    const cityMatch = lower.match(/(?:in|at)\s+([a-z\s]+)/i);
    const budgetMatch = userText.match(/([£$]\s?\d{3,4})/);
    const wantsStudio = lower.includes("studio");
    const wantsShared = lower.includes("shared");
    const wantsEnsuite = lower.includes("en-suite") || lower.includes("ensuite");

    const snippets = [];
    if (cityMatch) snippets.push(`Noted city preference: ${cityMatch[1].trim()}.`);
    if (budgetMatch) snippets.push(`Targeting options around ${budgetMatch[1]}.`);
    if (wantsStudio) snippets.push("Studio-friendly picks added.");
    if (wantsShared) snippets.push("Including calm shared houses.");
    if (wantsEnsuite) snippets.push("Prioritizing en-suite rooms.");

    const follow = nextFollowUp();
    const base = snippets.length
      ? snippets.join(" ")
      : "Got it. I&apos;ll tailor options.";
    return `${base} ${follow}`;
  };

  const processUserMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    if (finished) return;

    const totalAsked = askedCount;
    if (totalAsked >= questionLimit) {
      finalizeConversation(trimmed);
      return;
    }

    const reply = buildSmartReply(trimmed);
    setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    setLastBotText(reply);
    setAskedCount((prev) => prev + 1);
    speak(reply);
  };
  processUserMessageRef.current = processUserMessage;

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const current = inputValue;
    setInputValue("");
    processUserMessage(current);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const finalizeConversation = (lastAnswer: string) => {
    const closing =
      "Thanks. I have enough to suggest some places. Want me to call a representative for you?";
    const recs = [
      {
        title: "City Centre En-Suite",
        price: "$820/mo",
        summary: "Bills included, 8 min walk to campus, quiet block.",
      },
      {
        title: "Shared House Near Uni",
        price: "$690/mo",
        summary: "3-bed shared, garden space, utilities capped.",
      },
      {
        title: "Modern Studio",
        price: "$940/mo",
        summary: "Gym onsite, furnished, flexible lease start.",
      },
    ];
    setRecommendations(recs);
    setMessages((prev) => [...prev, { role: "bot", text: closing }]);
    setLastBotText(closing);
    speak(closing);
    setFinished(true);
    logSession(recs, lastAnswer);
  };

  const logSession = async (
    recs: { title: string; price: string; summary: string }[],
    lastAnswer: string
  ) => {
    try {
      await fetch(`${backendUrl}/session-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          conversation: messages.concat([
            { role: "user", text: lastAnswer },
            { role: "bot", text: "Session ended with recommendations." },
          ]),
          recommendations: recs,
        }),
      });
    } catch (err) {
      console.error("Failed to log session", err);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    setIsListening(false);
    recognitionRef.current.stop();
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 text-[#063324] border border-[#063324] rounded-full hover:bg-[#063324] hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="bg-white/70 backdrop-blur border border-[#063324]/10 rounded-2xl px-4 py-3 text-sm text-[#063324] shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#063324] text-white flex items-center justify-center font-bold">
              AI
            </div>
            <div>
              <div className="font-semibold">Live Voice</div>
              <div className="text-xs text-[#063324]/70">
                Powered by ElevenLabs
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Bot className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#063324]">
              Voice Concierge
            </h1>
            <p className="text-gray-500">
              Speak with our AI to find your perfect student housing
            </p>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Chat Interface */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-[#063324]/10 space-y-6">
            {/* Status Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#063324] text-white flex items-center justify-center font-bold">
                  🎧
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#063324]/70 uppercase tracking-[0.2em]">
                    Voice Chat
                  </div>
                  <div className="text-xl font-bold text-[#063324]">
                    Talk to the Bot
                  </div>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isLoading
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {isLoading
                  ? "Speaking..."
                  : started
                  ? isListening
                    ? "Mic Live"
                    : "Waiting for you"
                  : "Ready"}
              </div>
            </div>

            {/* Control Panel */}
            <div className="bg-gradient-to-r from-[#063324] to-[#0c4c37] text-white rounded-2xl p-5 flex flex-wrap gap-3 items-center justify-between shadow-lg shadow-[#063324]/20">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-white/70">
                  Status
                </div>
                <div className="font-semibold">
                  {started
                    ? isListening
                      ? "Listening..."
                      : "Say something or type"
                    : "Tap start to begin"}
                </div>
              </div>
              <div className="flex gap-3">
                {!started && (
                  <button
                    onClick={beginJourney}
                    className="px-4 py-2 rounded-full bg-white text-[#063324] font-bold hover:scale-105 transition"
                  >
                    Begin Journey
                  </button>
                )}
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={!started}
                  className={`px-4 py-2 rounded-full font-bold border border-white/50 flex items-center gap-2 ${
                    isListening
                      ? "bg-white/20 text-white"
                      : "bg-white text-[#063324]"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isListening ? (
                    <>
                      <MicOff size={16} /> Stop
                    </>
                  ) : (
                    <>
                      <Mic size={16} /> Speak
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              ref={scrollRef}
              className="space-y-4 max-h-[400px] overflow-y-auto pr-2 bg-[#F8FBF9] border border-[#063324]/10 rounded-2xl p-4"
            >
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-[#063324] text-white rounded-br-none"
                        : "bg-white text-[#063324] border border-[#063324]/10 rounded-bl-none shadow-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!started || isLoading}
                placeholder={
                  started ? "Type or dictate your answer..." : "Tap start first"
                }
                className="flex-1 px-4 py-3 rounded-2xl border border-[#063324]/15 bg-white focus:outline-none focus:ring-2 focus:ring-[#063324]/30 disabled:bg-gray-100 disabled:text-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={!started || isLoading || !inputValue.trim()}
                className="p-3 rounded-2xl bg-[#063324] text-white font-semibold hover:translate-y-[-1px] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>

            {/* Recommendations */}
            {finished && recommendations.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="text-sm font-semibold text-[#063324]/70 uppercase tracking-[0.2em]">
                  Recommendations
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.title}
                      className="border border-[#063324]/10 rounded-2xl p-4 bg-gradient-to-br from-white to-[#F8FBF9] shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="font-bold text-[#063324]">{rec.title}</div>
                      <div className="text-sm text-[#063324]/70 mt-1">
                        {rec.summary}
                      </div>
                      <div className="text-lg font-bold text-emerald-600 mt-2">
                        {rec.price}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full bg-[#063324] text-white py-3 rounded-2xl font-bold hover:translate-y-[-1px] transition-transform">
                  Call a Representative
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="text-red-600 bg-red-50 border border-red-100 rounded-2xl p-3 text-sm">
                {error}
              </div>
            )}

            {/* Audio Player */}
            {audioUrl && (
              <div className="flex items-center gap-3 bg-[#063324]/5 border border-[#063324]/10 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-full bg-[#063324] text-white flex items-center justify-center font-bold">
                  ▶
                </div>
                <audio controls src={audioUrl} className="w-full" />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Helpful Prompts */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#063324]/10 space-y-3">
            <div className="text-sm font-semibold text-[#063324]/70 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles className="text-amber-500" size={16} />
              Helpful Prompts
            </div>
            <div className="text-sm text-[#063324]/80 space-y-2">
              <p className="bg-gray-50 rounded-xl p-3">
                &quot;I need an en-suite near campus, budget $800.&quot;
              </p>
              <p className="bg-gray-50 rounded-xl p-3">
                &quot;Moving in next month, quiet area, bills included.&quot;
              </p>
              <p className="bg-gray-50 rounded-xl p-3">
                &quot;Studio preferred, but open to shared if close to uni.&quot;
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-[#063324] text-white rounded-2xl p-6 shadow-md border border-[#063324]/20 space-y-3">
            <div className="text-sm uppercase tracking-[0.2em] font-semibold text-white/70">
              How It Works
            </div>
            <ul className="space-y-2 text-sm leading-relaxed text-white/90">
              <li>1. Tap &quot;Begin Journey&quot;, then press &quot;Speak&quot;.</li>
              <li>
                2. Your voice is transcribed, sent, and echoed back with a
                follow-up.
              </li>
              <li>
                3. Audio is generated via ElevenLabs using your API key/model.
              </li>
            </ul>
          </div>

          {/* Backend Setup Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h4 className="font-semibold text-amber-800 mb-2 text-sm">
              Backend Required
            </h4>
            <p className="text-xs text-amber-700">
              This feature requires the Python backend running at{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded">
                {backendUrl}
              </code>
              . Run <code className="bg-amber-100 px-1.5 py-0.5 rounded">python main.py</code> in the backend folder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

