"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Users,
  Bot,
  ArrowRight,
  PhoneCall,
  MessageSquare,
  Database,
  CheckCircle2,
  Zap,
  Globe,
  Shield,
} from "lucide-react";

export default function VoiceAgentOverview() {
  const [leadCount, setLeadCount] = useState<number>(0);

  useEffect(() => {
    fetch("/api/leads")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          setLeadCount(data.count);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 text-[#063324] border border-[#063324] rounded-full hover:bg-[#063324] hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-semibold mb-6">
            <Zap size={16} />
            AI-Powered Voice Support
          </div>
          <h1 className="text-4xl font-bold text-[#063324] mb-3">
            Voice Support Agent
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Automated phone support powered by ElevenLabs AI. Handle student
            inquiries, capture leads, and provide 24/7 assistance.
          </p>
        </div>
      </header>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Link href="/dashboard/voice-agent/demo">
          <div className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-violet-200 transition-all duration-300 group cursor-pointer h-full">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <PhoneCall size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-3">Try Voice Demo</h3>
            <p className="text-violet-100 mb-6">
              Experience the AI voice agent in action. Start a simulated call
              and test the conversation flow.
            </p>
            <div className="flex items-center gap-2 font-semibold group-hover:gap-4 transition-all">
              Start Demo Call <ArrowRight size={20} />
            </div>
          </div>
        </Link>

        <Link href="/dashboard/voice-agent/leads">
          <div className="bg-white border border-gray-100 rounded-[2rem] p-8 hover:shadow-xl transition-all duration-300 group cursor-pointer h-full">
            <div className="w-16 h-16 rounded-2xl bg-[#063324] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-[#063324] mb-3">
              View Captured Leads
            </h3>
            <p className="text-gray-500 mb-6">
              Review all leads automatically captured by the voice agent.
              Currently tracking {leadCount} leads.
            </p>
            <div className="flex items-center gap-2 font-semibold text-[#063324] group-hover:gap-4 transition-all">
              View Leads <ArrowRight size={20} />
            </div>
          </div>
        </Link>
      </div>

      {/* Feature Overview */}
      <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 p-10 mb-10">
        <h2 className="text-2xl font-bold text-[#063324] mb-8 text-center">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <Phone className="text-violet-600" size={28} />
            </div>
            <h4 className="font-bold text-[#063324] mb-2">Inbound Calls</h4>
            <p className="text-gray-500 text-sm">
              Students & landlords call your support number. The AI agent
              answers instantly.
            </p>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="text-indigo-600" size={28} />
            </div>
            <h4 className="font-bold text-[#063324] mb-2">Natural Conversation</h4>
            <p className="text-gray-500 text-sm">
              AI handles FAQs about rent, bills, move-in dates, viewings, and
              more in natural voice.
            </p>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Database className="text-green-600" size={28} />
            </div>
            <h4 className="font-bold text-[#063324] mb-2">Lead Capture</h4>
            <p className="text-gray-500 text-sm">
              When callers express interest, the agent captures their details
              and creates a lead record.
            </p>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gradient-to-br from-[#063324] to-[#0a5240] rounded-[2rem] p-8 text-white">
          <h3 className="text-xl font-bold mb-6">Agent Capabilities</h3>
          <div className="space-y-4">
            {[
              "Answer FAQs about properties & rent",
              "Provide move-in & viewing information",
              "Explain bills & safety features",
              "Capture lead details automatically",
              "Handle multiple languages",
              "24/7 availability",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="text-green-400" size={20} />
                <span className="text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[2rem] p-8">
          <h3 className="text-xl font-bold text-[#063324] mb-6">
            Integration Options
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <Globe className="text-blue-500 mt-0.5" size={24} />
              <div>
                <h4 className="font-semibold text-[#063324]">Web Widget</h4>
                <p className="text-sm text-gray-500">
                  Embed voice support directly on your website
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <Phone className="text-green-500 mt-0.5" size={24} />
              <div>
                <h4 className="font-semibold text-[#063324]">Twilio/SIP</h4>
                <p className="text-sm text-gray-500">
                  Connect to real phone numbers via Twilio
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <Shield className="text-violet-500 mt-0.5" size={24} />
              <div>
                <h4 className="font-semibold text-[#063324]">Secure Webhooks</h4>
                <p className="text-sm text-gray-500">
                  Lead data securely sent to your backend
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ElevenLabs Tool Schema Reference */}
      <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-200">
        <h3 className="text-lg font-bold text-[#063324] mb-4 flex items-center gap-2">
          <Bot className="text-violet-500" size={24} />
          ElevenLabs Agent Tool Configuration
        </h3>
        <p className="text-gray-600 mb-4">
          Configure the <code className="bg-gray-200 px-2 py-1 rounded">create_lead</code> tool in your ElevenLabs Agent dashboard with this schema:
        </p>
        <pre className="bg-[#063324] text-green-400 rounded-xl p-6 overflow-x-auto text-sm">
{`{
  "name": "create_lead",
  "description": "Create a new housing lead in the Housr backend.",
  "input_schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "phone": { "type": "string" },
      "email": { "type": "string" },
      "city": { "type": "string" },
      "budget": { "type": "string" },
      "moveInDate": { "type": "string" },
      "preferences": { "type": "string" }
    },
    "required": ["name", "phone"]
  }
}

// Webhook URL: POST /api/agents/lead`}</pre>
      </div>
    </div>
  );
}

