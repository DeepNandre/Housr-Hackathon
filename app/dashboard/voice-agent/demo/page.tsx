"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Users,
  Sparkles,
  Bot,
  MessageCircle,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";

export default function VoiceAgentDemo() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [agentStatus, setAgentStatus] = useState<"idle" | "connecting" | "connected" | "speaking" | "listening">("idle");
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Call duration timer
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Simulated call flow for demo (replace with real ElevenLabs widget)
  const handleStartCall = () => {
    setAgentStatus("connecting");
    setTimeout(() => {
      setIsCallActive(true);
      setAgentStatus("connected");
      setTimeout(() => {
        setAgentStatus("speaking");
        setTimeout(() => {
          setAgentStatus("listening");
        }, 3000);
      }, 500);
    }, 1500);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setAgentStatus("idle");
    setCallDuration(0);
  };

  const sampleQuestions = [
    "What rooms are available in Manchester?",
    "How much is rent including bills?",
    "When can I move in?",
    "Can I book a viewing?",
    "I'm looking for housing near the university",
  ];

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

          <Link
            href="/dashboard/voice-agent/leads"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#063324] text-white rounded-full hover:bg-[#063324]/90 transition-colors"
          >
            <Users size={18} />
            View Captured Leads
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#063324] flex items-center justify-center shadow-lg shadow-[#063324]/20">
            <Bot className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#063324]">
              Voice Support Agent Demo
            </h1>
            <p className="text-gray-500">
              Test the AI-powered phone support experience
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Call Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
            {/* Call Header */}
            <div className="bg-[#063324] text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Housr Voice Assistant</h2>
                    <p className="text-[#D2E6DE] text-sm">
                      Powered by ElevenLabs
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCallActive ? "bg-green-400 animate-pulse" : "bg-white/40"
                    }`}
                  ></span>
                  <span className="text-sm">
                    {agentStatus === "idle" && "Ready"}
                    {agentStatus === "connecting" && "Connecting..."}
                    {agentStatus === "connected" && "Connected"}
                    {agentStatus === "speaking" && "Agent Speaking"}
                    {agentStatus === "listening" && "Listening..."}
                  </span>
                </div>
              </div>
            </div>

            {/* Call Body */}
            <div className="p-8">
              {/* Visual Feedback Area */}
              <div className="relative h-48 bg-[#F0F7F4] rounded-3xl flex items-center justify-center mb-8 overflow-hidden border border-[#063324]/5">
                {/* Animated Background */}
                {isCallActive && (
                  <div className="absolute inset-0">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`absolute inset-0 rounded-full border-2 border-[#063324]/10 ${
                          agentStatus === "speaking" ? "animate-ping" : "opacity-0"
                        }`}
                        style={{
                          animationDelay: `${i * 0.3}s`,
                          animationDuration: "1.5s",
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Center Icon */}
                <div
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCallActive
                      ? "bg-[#063324] scale-110 shadow-xl shadow-[#063324]/20"
                      : "bg-gray-200"
                  }`}
                >
                  {agentStatus === "connecting" ? (
                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isCallActive ? (
                    <Volume2 className="text-white" size={40} />
                  ) : (
                    <Phone className="text-gray-500" size={36} />
                  )}
                </div>

                {/* Audio Visualizer */}
                {isCallActive && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 bg-[#063324] rounded-full transition-all duration-100 ${
                          agentStatus === "speaking" || agentStatus === "listening"
                            ? "animate-pulse"
                            : ""
                        }`}
                        style={{
                          height: isCallActive
                            ? `${Math.random() * 100}%`
                            : "10%",
                          animationDelay: `${i * 0.05}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Call Duration */}
              {isCallActive && (
                <div className="text-center mb-6">
                  <span className="text-3xl font-mono font-bold text-[#063324]">
                    {formatDuration(callDuration)}
                  </span>
                </div>
              )}

              {/* Call Controls */}
              <div className="flex items-center justify-center gap-4">
                {!isCallActive ? (
                  <button
                    onClick={handleStartCall}
                    disabled={agentStatus === "connecting"}
                    className="flex items-center gap-3 px-8 py-4 bg-[#063324] text-white rounded-full hover:bg-[#0a5240] transition-all shadow-lg shadow-[#063324]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Phone size={24} />
                    <span className="font-semibold text-lg">Start Call</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                        isMuted
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    <button
                      onClick={handleEndCall}
                      className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                    >
                      <PhoneOff size={28} />
                    </button>

                    <button
                      className="w-14 h-14 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-all"
                    >
                      <Volume2 size={24} />
                    </button>
                  </>
                )}
              </div>

              {/* ElevenLabs Widget Container */}
              <div
                ref={widgetContainerRef}
                id="elevenlabs-widget"
                className="mt-6"
              >
                {/* 
                  To integrate the real ElevenLabs Conversational AI widget:
                  
                  1. Create an agent in the ElevenLabs dashboard
                  2. Add this script to your page:
                  
                  <script
                    src="https://elevenlabs.io/convai-widget.js"
                    data-agent-id="YOUR_AGENT_ID"
                    data-mode="voice"
                  ></script>
                  
                  Or use their React SDK for more control.
                */}
              </div>
            </div>
          </div>

          {/* Agent Configuration Note */}
          <div className="mt-6 bg-[#F0F7F4] border border-[#063324]/10 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Lightbulb className="text-[#063324] mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-[#063324] mb-1">
                  ElevenLabs Agent Setup
                </h4>
                <p className="text-sm text-gray-600">
                  To enable the real voice agent, configure your ElevenLabs Agent
                  with the <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200">create_lead</code> tool 
                  pointing to <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200">/api/agents/lead</code>.
                  See the tool schema in the setup documentation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* How It Works */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-[#063324] mb-4 flex items-center gap-2">
              <MessageCircle className="text-[#063324]" size={20} />
              How It Works
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F0F7F4] text-[#063324] flex items-center justify-center text-xs font-bold border border-[#063324]/10">
                  1
                </div>
                <p className="text-sm text-gray-600">
                  Click &quot;Start Call&quot; to connect with the AI voice agent
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F0F7F4] text-[#063324] flex items-center justify-center text-xs font-bold border border-[#063324]/10">
                  2
                </div>
                <p className="text-sm text-gray-600">
                  Ask about housing, rent, availability, or express interest
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F0F7F4] text-[#063324] flex items-center justify-center text-xs font-bold border border-[#063324]/10">
                  3
                </div>
                <p className="text-sm text-gray-600">
                  If you&apos;re a potential lead, the agent captures your details
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#063324] text-white flex items-center justify-center">
                  <CheckCircle2 size={14} />
                </div>
                <p className="text-sm text-gray-600">
                  Your lead appears in the Leads Dashboard automatically!
                </p>
              </div>
            </div>
          </div>

          {/* Sample Questions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-[#063324] mb-4 flex items-center gap-2">
              <Sparkles className="text-[#D2E6DE]" fill="#063324" size={20} />
              Try Asking
            </h3>
            <div className="space-y-2">
              {sampleQuestions.map((q, i) => (
                <div
                  key={i}
                  className="text-sm text-gray-600 bg-[#F0F7F4] rounded-xl px-4 py-3 hover:bg-[#D2E6DE] transition-colors cursor-pointer border border-transparent hover:border-[#063324]/10"
                >
                  &quot;{q}&quot;
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-[#063324] rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/dashboard/voice-agent/leads"
                className="flex items-center gap-3 text-sm text-[#D2E6DE] hover:text-white transition-colors"
              >
                <Users size={16} />
                View All Leads
              </Link>
              <a
                href="https://elevenlabs.io/docs/conversational-ai/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-[#D2E6DE] hover:text-white transition-colors"
              >
                <Bot size={16} />
                ElevenLabs Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
