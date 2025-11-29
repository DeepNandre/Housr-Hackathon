"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff, Send, Bot, Sparkles, Volume2, VolumeX, Loader2 } from "lucide-react";

type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

type ChatBubble = { role: "bot" | "user"; text: string };

interface UserPreferences {
  city?: string;
  budget?: string;
  moveInDate?: string;
  roomType?: string;
  amenities: string[];
  otherNotes: string[];
}

interface Recommendation {
  title: string;
  price: string;
  summary: string;
}

export default function VoiceConcierge() {
  const backendUrl = "/api/voice-concierge";
  
  const [started, setStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playback, setPlayback] = useState<HTMLAudioElement | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({ amenities: [], otherNotes: [] });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [finished, setFinished] = useState(false);
  
  const [inputValue, setInputValue] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isProcessingRef = useRef(false);

  // Initialize speech recognition with interim results
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
      recog.interimResults = true; // Enable interim results for live feedback
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
        // Restart if still listening and not processing
        if (isListening && !isProcessingRef.current) {
          try {
            recog.start();
          } catch (e) {
            // Already started
          }
        }
      };

      recognitionRef.current = recog;
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, interimTranscript]);

  // Speak text using TTS
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

      if (!res.ok) {
        throw new Error(`TTS failed: ${res.status}`);
      }

      const buffer = await res.arrayBuffer();
      const blob = new Blob([buffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      if (playback) {
        playback.pause();
      }
      
      const audio = new Audio(url);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      setPlayback(audio);
      await audio.play();
    } catch (err: any) {
      console.error("Voice generation error:", err);
      setIsSpeaking(false);
      // Don't show error - just skip voice
    }
  }, [autoSpeak, playback, backendUrl]);

  // Send message to AI chat endpoint
  const sendToAI = useCallback(async (userMessage: string): Promise<{
    response: string;
    preferences: UserPreferences;
    shouldFinalize: boolean;
    recommendations: Recommendation[] | null;
  }> => {
    const res = await fetch(`${backendUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        conversationHistory: messages,
        preferences,
      }),
    });

    if (!res.ok) {
      throw new Error("Chat API failed");
    }

    return res.json();
  }, [messages, preferences, backendUrl]);

  // Process user message
  const processUserMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setIsLoading(true);
    setError(null);

    // Add user message
    setMessages(prev => [...prev, { role: "user", text: text.trim() }]);

    try {
      const result = await sendToAI(text.trim());
      
      // Update preferences
      setPreferences(result.preferences);
      
      // Add bot response
      setMessages(prev => [...prev, { role: "bot", text: result.response }]);
      
      // Speak the response
      speak(result.response);

      // Handle finalization
      if (result.shouldFinalize && result.recommendations) {
        setRecommendations(result.recommendations);
        setFinished(true);
      }
    } catch (err: any) {
      console.error("Error processing message:", err);
      setError("Sorry, I had trouble understanding. Could you try again?");
      // Add a fallback response
      const fallback = "I'm having a bit of trouble. Could you tell me more about what you're looking for?";
      setMessages(prev => [...prev, { role: "bot", text: fallback }]);
      speak(fallback);
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  }, [sendToAI, speak]);

  // Begin conversation
  const beginJourney = useCallback(() => {
    if (started) return;
    setStarted(true);
    setFinished(false);
    setMessages([]);
    setRecommendations([]);
    setPreferences({ amenities: [], otherNotes: [] });
    
    const greeting = "Hi! I'm your Housr housing assistant. I'll help you find the perfect student accommodation. Tell me - what city are you looking in, and when do you need to move?";
    setMessages([{ role: "bot", text: greeting }]);
    speak(greeting);
  }, [started, speak]);

  // Handle manual send
  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading) return;
    const current = inputValue.trim();
    setInputValue("");
    processUserMessage(current);
  }, [inputValue, isLoading, processUserMessage]);

  // Handle enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Toggle listening
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
      } catch (e) {
        // Already started
      }
    }
  }, [isListening]);

  // Reset conversation
  const resetConversation = useCallback(() => {
    setStarted(false);
    setFinished(false);
    setMessages([]);
    setRecommendations([]);
    setPreferences({ amenities: [], otherNotes: [] });
    setIsListening(false);
    setInterimTranscript("");
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`p-2 rounded-full transition-colors ${
                autoSpeak ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
              }`}
              title={autoSpeak ? "Voice On" : "Voice Off"}
            >
              {autoSpeak ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <div className="bg-white/70 backdrop-blur border border-[#063324]/10 rounded-2xl px-4 py-3 text-sm text-[#063324] shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#063324] text-white flex items-center justify-center font-bold">
                AI
              </div>
              <div>
                <div className="font-semibold">Live Voice</div>
                <div className="text-xs text-[#063324]/70">Powered by ElevenLabs</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Bot className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#063324]">Voice Concierge</h1>
            <p className="text-gray-500">Speak naturally to find your perfect student housing</p>
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
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors ${
                  isSpeaking ? "bg-emerald-500 text-white animate-pulse" : "bg-[#063324] text-white"
                }`}>
                  {isSpeaking ? "🔊" : "🎧"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#063324]/70 uppercase tracking-[0.2em]">
                    Voice Chat
                  </div>
                  <div className="text-xl font-bold text-[#063324]">
                    {isSpeaking ? "Speaking..." : "Talk to the Bot"}
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isLoading ? "bg-yellow-100 text-yellow-700" :
                isListening ? "bg-red-100 text-red-700 animate-pulse" :
                isSpeaking ? "bg-emerald-100 text-emerald-700" :
                started ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}>
                {isLoading ? "Thinking..." :
                 isListening ? "🎤 Listening..." :
                 isSpeaking ? "Speaking" :
                 started ? "Ready" : "Tap to Start"}
              </div>
            </div>

            {/* Control Panel */}
            <div className="bg-gradient-to-r from-[#063324] to-[#0c4c37] text-white rounded-2xl p-5 flex flex-wrap gap-3 items-center justify-between shadow-lg shadow-[#063324]/20">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-white/70">Status</div>
                <div className="font-semibold">
                  {!started ? "Ready to begin" :
                   isListening ? "Speak now - I'm listening" :
                   isSpeaking ? "Please wait, I'm responding" :
                   "Say something or type below"}
                </div>
              </div>
              <div className="flex gap-3">
                {!started ? (
                  <button
                    onClick={beginJourney}
                    className="px-5 py-2.5 rounded-full bg-white text-[#063324] font-bold hover:scale-105 transition"
                  >
                    🎙️ Begin Journey
                  </button>
                ) : (
                  <>
                    {finished && (
                      <button
                        onClick={resetConversation}
                        className="px-4 py-2 rounded-full bg-white/20 text-white font-bold border border-white/30 hover:bg-white/30 transition"
                      >
                        Start Over
                      </button>
                    )}
                    {speechSupported && (
                      <button
                        onClick={toggleListening}
                        disabled={isLoading || isSpeaking}
                        className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 transition ${
                          isListening
                            ? "bg-red-500 text-white border-2 border-white"
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

            {/* Live Transcription Feedback */}
            {interimTranscript && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-2 text-blue-700">
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-sm font-medium">Hearing:</span>
                </div>
                <p className="text-blue-800 mt-1 italic">&quot;{interimTranscript}&quot;</p>
              </div>
            )}

            {/* Chat Messages */}
            <div
              ref={scrollRef}
              className="space-y-4 max-h-[400px] overflow-y-auto pr-2 bg-[#F8FBF9] border border-[#063324]/10 rounded-2xl p-4"
            >
              {messages.length === 0 && !started && (
                <div className="text-center py-12 text-gray-400">
                  <Bot size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Click &quot;Begin Journey&quot; to start chatting</p>
                </div>
              )}
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-[#063324] text-white rounded-br-none"
                        : "bg-white text-[#063324] border border-[#063324]/10 rounded-bl-none shadow-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-[#063324] border border-[#063324]/10 rounded-2xl rounded-bl-none shadow-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!started || isLoading || isSpeaking}
                placeholder={
                  !started ? "Click 'Begin Journey' to start" :
                  isLoading ? "Processing..." :
                  isSpeaking ? "Waiting for response..." :
                  "Type your message or use the mic..."
                }
                className="flex-1 px-4 py-3 rounded-2xl border border-[#063324]/15 bg-white focus:outline-none focus:ring-2 focus:ring-[#063324]/30 disabled:bg-gray-100 disabled:text-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={!started || isLoading || isSpeaking || !inputValue.trim()}
                className="p-3 rounded-2xl bg-[#063324] text-white font-semibold hover:translate-y-[-1px] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>

            {/* Recommendations */}
            {finished && recommendations.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-[#063324]/10">
                <div className="text-sm font-semibold text-[#063324]/70 uppercase tracking-[0.2em]">
                  🏠 Your Matches
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="border border-[#063324]/10 rounded-2xl p-4 bg-gradient-to-br from-white to-[#F8FBF9] shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
                    >
                      <div className="font-bold text-[#063324]">{rec.title}</div>
                      <div className="text-sm text-[#063324]/70 mt-1">{rec.summary}</div>
                      <div className="text-lg font-bold text-emerald-600 mt-2">{rec.price}</div>
                    </div>
                  ))}
                </div>
                <button className="w-full bg-[#063324] text-white py-3 rounded-2xl font-bold hover:translate-y-[-1px] transition-transform flex items-center justify-center gap-2">
                  📞 Call a Representative
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="text-red-600 bg-red-50 border border-red-100 rounded-2xl p-3 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Collected Preferences */}
          {started && (preferences.city || preferences.budget || preferences.moveInDate) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <div className="text-sm font-semibold text-emerald-800 uppercase tracking-[0.2em]">
                ✓ What I Know
              </div>
              <div className="space-y-2 text-sm">
                {preferences.city && (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <span className="font-medium">City:</span> {preferences.city}
                  </div>
                )}
                {preferences.budget && (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <span className="font-medium">Budget:</span> {preferences.budget}
                  </div>
                )}
                {preferences.moveInDate && (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <span className="font-medium">Move-in:</span> {preferences.moveInDate}
                  </div>
                )}
                {preferences.roomType && (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <span className="font-medium">Type:</span> {preferences.roomType}
                  </div>
                )}
                {preferences.amenities.length > 0 && (
                  <div className="flex items-start gap-2 text-emerald-700">
                    <span className="font-medium">Wants:</span>
                    <span>{preferences.amenities.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#063324]/10 space-y-3">
            <div className="text-sm font-semibold text-[#063324]/70 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles className="text-amber-500" size={16} />
              Try Saying
            </div>
            <div className="text-sm text-[#063324]/80 space-y-2">
              <p className="bg-gray-50 rounded-xl p-3 hover:bg-[#063324]/5 cursor-pointer transition">
                &quot;I need a place in Manchester for September&quot;
              </p>
              <p className="bg-gray-50 rounded-xl p-3 hover:bg-[#063324]/5 cursor-pointer transition">
                &quot;Budget around 180 pounds per week&quot;
              </p>
              <p className="bg-gray-50 rounded-xl p-3 hover:bg-[#063324]/5 cursor-pointer transition">
                &quot;Looking for an en-suite with bills included&quot;
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-[#063324] text-white rounded-2xl p-6 shadow-md space-y-3">
            <div className="text-sm uppercase tracking-[0.2em] font-semibold text-white/70">
              How It Works
            </div>
            <ul className="space-y-2 text-sm leading-relaxed text-white/90">
              <li>1. Click &quot;Begin Journey&quot; to start</li>
              <li>2. Speak naturally or type your needs</li>
              <li>3. I&apos;ll understand and ask follow-ups</li>
              <li>4. Get personalized housing matches!</li>
            </ul>
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#063324]/10">
              <div className="text-xs font-semibold text-[#063324]/60 mb-2">Last Response</div>
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

