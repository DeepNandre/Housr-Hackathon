"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff, Send, Bot, Sparkles, Volume2, VolumeX, Loader2, Home } from "lucide-react";

type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

type ChatBubble = { role: "bot" | "user"; text: string };

interface UserPreferences {
  city?: string;
  budget?: string;
  vibe?: string;
  moveInDate?: string;
  roomType?: string;
  amenities: string[];
}

interface Recommendation {
  title: string;
  price: string;
  summary: string;
}

export default function PublicVoiceConcierge() {
  const backendUrl = "/api/voice-concierge";
  
  const [started, setStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playback, setPlayback] = useState<HTMLAudioElement | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({ amenities: [] });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [finished, setFinished] = useState(false);
  
  const [inputValue, setInputValue] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isProcessingRef = useRef(false);
  const playbackRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount - stop audio and speech recognition
  useEffect(() => {
    return () => {
      // Stop any playing audio
      if (playbackRef.current) {
        playbackRef.current.pause();
        playbackRef.current.src = "";
        playbackRef.current = null;
      }
      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setSpeechSupported(false);
        return;
      }

      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = "en-US";
      recog.maxAlternatives = 1;

      recog.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        setInterimTranscript(interim);

        if (final && !isProcessingRef.current) {
          setInterimTranscript("");
          processUserMessage(final.trim());
        }
      };

      recog.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setError("Microphone access denied. Please allow microphone access and try again.");
          setSpeechSupported(false);
        }
      };

      recog.onend = () => {
        if (isListening && !isProcessingRef.current) {
          try {
            recog.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recog;
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, interimTranscript]);

  const speak = useCallback(async (text: string) => {
    if (!autoSpeak) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    
    setIsSpeaking(true);
    setError(null);
    
    try {
      const res = await fetch(`${backendUrl}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);

      const buffer = await res.arrayBuffer();
      const blob = new Blob([buffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Stop any existing playback
      if (playbackRef.current) {
        playbackRef.current.pause();
        playbackRef.current.src = "";
      }
      if (playback) playback.pause();
      
      const audio = new Audio(url);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      playbackRef.current = audio; // Store in ref for cleanup
      setPlayback(audio);
      await audio.play();
    } catch (err: any) {
      console.error("Voice generation error:", err);
      setIsSpeaking(false);
    }
  }, [autoSpeak, playback, backendUrl]);

  const sendToAI = useCallback(async (userMessage: string) => {
    const res = await fetch(`${backendUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        conversationHistory: messages,
        preferences,
      }),
    });
    if (!res.ok) throw new Error("Chat API failed");
    return res.json();
  }, [messages, preferences, backendUrl]);

  const processUserMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setIsLoading(true);
    setError(null);

    setMessages(prev => [...prev, { role: "user", text: text.trim() }]);

    try {
      const result = await sendToAI(text.trim());
      setPreferences(result.preferences);
      setMessages(prev => [...prev, { role: "bot", text: result.response }]);
      speak(result.response);

      if (result.shouldFinalize && result.recommendations) {
        setRecommendations(result.recommendations);
        setFinished(true);
      }
    } catch (err: any) {
      console.error("Error processing message:", err);
      setError("Sorry, I had trouble understanding. Could you try again?");
      const fallback = "I'm having a bit of trouble. Could you tell me more about what you're looking for?";
      setMessages(prev => [...prev, { role: "bot", text: fallback }]);
      speak(fallback);
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  }, [sendToAI, speak]);

  const beginJourney = useCallback(() => {
    if (started) return;
    setStarted(true);
    setFinished(false);
    setMessages([]);
    setRecommendations([]);
    setPreferences({ amenities: [] });
    
    const greeting = "Hi! I'm your Housr housing assistant. I'll help you find the perfect student accommodation in just 3 quick questions. First up - which city are you looking to live in?";
    setMessages([{ role: "bot", text: greeting }]);
    speak(greeting);
  }, [started, speak]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading) return;
    const current = inputValue.trim();
    setInputValue("");
    processUserMessage(current);
  }, [inputValue, isLoading, processUserMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }
  }, [isListening]);

  const resetConversation = useCallback(() => {
    // Stop any playing audio
    if (playbackRef.current) {
      playbackRef.current.pause();
      playbackRef.current.src = "";
    }
    if (playback) playback.pause();
    
    setStarted(false);
    setFinished(false);
    setMessages([]);
    setRecommendations([]);
    setPreferences({ amenities: [] });
    setIsListening(false);
    setInterimTranscript("");
    setIsSpeaking(false);
    if (recognitionRef.current) recognitionRef.current.stop();
  }, [playback]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#063324] via-[#0a4a38] to-[#063324]">
      {/* Header */}
      <header className="pt-8 pb-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white transition-colors"
          >
            <Home size={18} />
            Back to Home
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`p-2 rounded-full transition-colors ${
                autoSpeak ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/50"
              }`}
              title={autoSpeak ? "Voice On" : "Voice Off"}
            >
              {autoSpeak ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-emerald-300 text-sm font-medium mb-4">
              <Bot size={18} />
              AI-Powered Assistant
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Find Your Perfect Home
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto">
              Just talk to our AI assistant. Tell us what you need and we&apos;ll find the best student accommodation for you.
            </p>
          </div>

          {/* Chat Interface */}
          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden">
            {/* Status Bar */}
            <div className="bg-gradient-to-r from-[#063324] to-[#0a5240] text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isSpeaking ? "bg-emerald-400 animate-pulse" : "bg-white/20"
                  }`}>
                    {isSpeaking ? "🔊" : "🎧"}
                  </div>
                  <div>
                    <div className="font-semibold">Voice Concierge</div>
                    <div className="text-sm text-white/70">
                      {isSpeaking ? "Speaking..." : started ? "Ready to help" : "Click to start"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  {!started ? (
                    <button
                      onClick={beginJourney}
                      className="px-6 py-3 rounded-full bg-white text-[#063324] font-bold hover:scale-105 transition flex items-center gap-2"
                    >
                      🎙️ Start Talking
                    </button>
                  ) : (
                    <>
                      {finished && (
                        <button
                          onClick={resetConversation}
                          className="px-4 py-2 rounded-full bg-white/20 text-white font-medium hover:bg-white/30 transition"
                        >
                          Start Over
                        </button>
                      )}
                      {speechSupported && (
                        <button
                          onClick={toggleListening}
                          disabled={isLoading || isSpeaking}
                          className={`px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition ${
                            isListening
                              ? "bg-red-500 text-white animate-pulse"
                              : "bg-white text-[#063324] hover:scale-105"
                          } disabled:opacity-50`}
                        >
                          {isListening ? <><MicOff size={18} /> Stop</> : <><Mic size={18} /> Speak</>}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Live Transcription */}
            {interimTranscript && (
              <div className="bg-blue-50 border-b border-blue-100 p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-sm font-medium">Hearing:</span>
                  <span className="italic">&quot;{interimTranscript}&quot;</span>
                </div>
              </div>
            )}

            {/* Messages */}
            <div
              ref={scrollRef}
              className="p-6 space-y-4 max-h-[400px] overflow-y-auto bg-gray-50"
            >
              {messages.length === 0 && !started && (
                <div className="text-center py-16 text-gray-400">
                  <Bot size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Click &quot;Start Talking&quot; to begin</p>
                  <p className="text-sm mt-2">I&apos;ll help you find your perfect student home</p>
                </div>
              )}
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-5 py-3 rounded-2xl max-w-[80%] ${
                      m.role === "user"
                        ? "bg-[#063324] text-white rounded-br-sm"
                        : "bg-white text-gray-800 shadow-md rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white shadow-md rounded-2xl rounded-bl-sm px-5 py-3 flex items-center gap-2">
                    <Loader2 className="animate-spin text-[#063324]" size={18} />
                    <span className="text-gray-500">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center gap-3">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!started || isLoading || isSpeaking}
                  placeholder={!started ? "Click 'Start Talking' to begin" : "Type your message..."}
                  className="flex-1 px-5 py-3 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#063324]/30 disabled:bg-gray-100 disabled:text-gray-400"
                />
                <button
                  onClick={handleSend}
                  disabled={!started || isLoading || isSpeaking || !inputValue.trim()}
                  className="p-3 rounded-full bg-[#063324] text-white disabled:opacity-50 hover:bg-[#0a4a38] transition"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>

            {/* Recommendations */}
            {finished && recommendations.length > 0 && (
              <div className="p-6 bg-gradient-to-b from-emerald-50 to-white border-t border-emerald-100">
                <h3 className="font-bold text-[#063324] mb-4 flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={20} />
                  Your Perfect Matches
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition cursor-pointer border border-gray-100"
                    >
                      <div className="font-bold text-[#063324] mb-1">{rec.title}</div>
                      <div className="text-sm text-gray-500 mb-3">{rec.summary}</div>
                      <div className="text-xl font-bold text-emerald-600">{rec.price}</div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 bg-[#063324] text-white py-4 rounded-2xl font-bold hover:bg-[#0a4a38] transition flex items-center justify-center gap-2">
                  📞 Contact Us About These Properties
                </button>
              </div>
            )}
          </div>

          {/* Collected Info - Progress tracker */}
          {started && (preferences.city || preferences.budget || preferences.vibe) && (
            <div className="mt-6 bg-white/10 backdrop-blur rounded-2xl p-5 text-white">
              <div className="text-sm font-semibold text-emerald-300 mb-3">✓ Your Housing Profile</div>
              <div className="flex flex-wrap gap-3">
                {preferences.city && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">📍 {preferences.city}</span>
                )}
                {preferences.budget && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">💰 {preferences.budget}</span>
                )}
                {preferences.vibe && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">✨ {preferences.vibe}</span>
                )}
                {preferences.moveInDate && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">📅 {preferences.moveInDate}</span>
                )}
                {preferences.roomType && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">🏠 {preferences.roomType}</span>
                )}
              </div>
              {/* Progress indicator */}
              <div className="mt-4 flex items-center gap-2">
                <div className={`h-2 flex-1 rounded-full ${preferences.city ? 'bg-emerald-400' : 'bg-white/20'}`} />
                <div className={`h-2 flex-1 rounded-full ${preferences.budget ? 'bg-emerald-400' : 'bg-white/20'}`} />
                <div className={`h-2 flex-1 rounded-full ${preferences.vibe ? 'bg-emerald-400' : 'bg-white/20'}`} />
              </div>
              <div className="mt-2 text-xs text-white/60 text-center">
                {!preferences.city ? "Step 1: Location" : 
                 !preferences.budget ? "Step 2: Budget" : 
                 !preferences.vibe ? "Step 3: Vibe" : "✓ Ready for recommendations!"}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="mt-8 text-center text-white/60 text-sm space-y-1">
            <p>💡 <strong>3 simple questions:</strong> Location → Budget → Vibe</p>
            <p className="text-xs">Example: &quot;Manchester&quot; → &quot;£180 a week&quot; → &quot;Social and lively&quot;</p>
          </div>
        </div>
      </main>
    </div>
  );
}

