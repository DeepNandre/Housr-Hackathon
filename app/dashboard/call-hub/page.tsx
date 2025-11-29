"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Clock,
  User,
  BarChart2,
  Search,
  Filter,
  Download,
  Share2,
  MoreHorizontal,
  PlayCircle,
} from "lucide-react";

const MOCK_CALLS = [
  {
    id: 101,
    agent: "Sarah J.",
    customer: "Student (Leeds)",
    duration: "4:12",
    sentiment: "Positive",
    score: 92,
    status: "Analyzed",
    topics: ["Viewing", "Availability", "Rent"],
    summary:
      "Student inquired about 4-bed flats in Leeds. Sarah confirmed availability for 'The Glassworks' and scheduled a viewing for Tuesday. Student seemed happy with the price.",
    transcript: [
      {
        speaker: "Agent",
        text: "Good morning, Housr student lettings, Sarah speaking.",
        time: "00:00",
      },
      {
        speaker: "Customer",
        text: "Hi, I'm looking for a 4-bed flat in Leeds for next academic year.",
        time: "00:05",
      },
      {
        speaker: "Agent",
        text: "Great! We have a few options left in the city centre and Headingley. What's your budget?",
        time: "00:12",
      },
      {
        speaker: "Customer",
        text: "Around £160 per week per person if possible.",
        time: "00:18",
      },
      {
        speaker: "Agent",
        text: "That works perfectly. 'The Glassworks' is £155pppw including bills. Would you like to see it?",
        time: "00:25",
      },
      {
        speaker: "Customer",
        text: "Yes please, that sounds amazing.",
        time: "00:30",
      },
    ],
  },
  {
    id: 102,
    agent: "Mike T.",
    customer: "Parent (London)",
    duration: "12:05",
    sentiment: "Negative",
    score: 45,
    status: "Attention Needed",
    topics: ["Complaint", "Maintenance", "Deposit"],
    summary:
      "Parent called regarding a delayed deposit return. Frustrated with lack of communication. Mike escalated to the finance team but the caller remained dissatisfied.",
    transcript: [
      {
        speaker: "Agent",
        text: "Hello, Housr support, Mike speaking.",
        time: "00:00",
      },
      {
        speaker: "Customer",
        text: "I've been waiting three weeks for my son's deposit return. This is unacceptable.",
        time: "00:04",
      },
      {
        speaker: "Agent",
        text: "I apologize for the delay. Let me pull up the file. Could I have the property address?",
        time: "00:10",
      },
      {
        speaker: "Customer",
        text: "Flat 4, 22 High St. You promised it within 10 days.",
        time: "00:15",
      },
      {
        speaker: "Agent",
        text: "I see here there was a pending check on the inventory. I'll chase this up with finance now.",
        time: "00:22",
      },
      {
        speaker: "Customer",
        text: "I expect an email confirmation by end of day or I'm taking this further.",
        time: "00:30",
      },
    ],
  },
  {
    id: 103,
    agent: "Sarah J.",
    customer: "Landlord (Bristol)",
    duration: "6:30",
    sentiment: "Neutral",
    score: 78,
    status: "Analyzed",
    topics: ["Contract", "Renewal", "Fees"],
    summary:
      "Landlord asked about management fee changes for the upcoming renewal. Sarah explained the new tiered structure. Landlord is considering the 'Premium' tier.",
    transcript: [
      {
        speaker: "Agent",
        text: "Hi David, thanks for calling back.",
        time: "00:00",
      },
      {
        speaker: "Customer",
        text: "Hi Sarah. Just wanted to check the renewal fees for the Bristol properties.",
        time: "00:05",
      },
      {
        speaker: "Agent",
        text: "Of course. For next year, the standard management fee is 12%, but we have a Premium tier at 15% which includes maintenance cover.",
        time: "00:15",
      },
      {
        speaker: "Customer",
        text: "Hmm, the maintenance cover sounds useful. Does that include boiler servicing?",
        time: "00:22",
      },
      {
        speaker: "Agent",
        text: "Yes it does, and annual gas safety checks.",
        time: "00:28",
      },
    ],
  },
];

export default function CallIntelligence() {
  const [selectedCall, setSelectedCall] = useState<any>(null);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-[#063324] border border-[#063324] rounded-full hover:bg-[#063324] hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#063324] mb-2">
              Call Intelligence Hub
            </h1>
            <p className="text-gray-500">
              AI-driven analysis of support & sales interactions.
            </p>
          </div>
          {selectedCall && (
            <button
              onClick={() => setSelectedCall(null)}
              className="text-[#063324] font-semibold hover:underline"
            >
              Close Details
            </button>
          )}
        </div>
      </header>

      {selectedCall ? (
        /* --- Detail View --- */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Left Column: Transcript */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#063324] mb-1">
                    Call Transcript
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User size={14} /> {selectedCall.customer}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User size={14} /> {selectedCall.agent}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {selectedCall.duration}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition">
                    <Download size={20} className="text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition">
                    <Share2 size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {selectedCall.transcript.map((line: any, i: number) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-16 text-xs text-gray-400 pt-1 text-right font-mono shrink-0">
                      {line.time}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            line.speaker === "Agent"
                              ? "text-[#063324]"
                              : "text-blue-600"
                          }`}
                        >
                          {line.speaker}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {line.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Analysis */}
          <div className="flex flex-col gap-6">
            {/* Score Card */}
            <div className="bg-[#063324] text-white rounded-[2rem] p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="text-lg font-bold mb-2 relative z-10">
                AI Quality Score
              </h3>
              <div className="flex items-end gap-2 mb-4 relative z-10">
                <span className="text-5xl font-bold">{selectedCall.score}</span>
                <span className="text-xl text-white/60 mb-1">/ 100</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mb-4 relative z-10">
                <div
                  className={`h-full rounded-full ${
                    selectedCall.score > 80 ? "bg-green-400" : "bg-yellow-400"
                  }`}
                  style={{ width: `${selectedCall.score}%` }}
                ></div>
              </div>
              <p className="text-sm text-white/80 relative z-10">
                {selectedCall.score > 80
                  ? "Excellent handling of customer query."
                  : "Needs improvement in empathy cues."}
              </p>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-[#063324] mb-4 flex items-center gap-2">
                <FileText size={18} /> AI Summary
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                {selectedCall.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedCall.topics.map((topic: string) => (
                  <span
                    key={topic}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Sentiment Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-[#063324] mb-4 flex items-center gap-2">
                <BarChart2 size={18} /> Sentiment Analysis
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedCall.sentiment === "Positive"
                      ? "bg-green-100 text-green-600"
                      : selectedCall.sentiment === "Negative"
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {selectedCall.sentiment === "Positive" ? (
                    <CheckCircle size={24} />
                  ) : (
                    <AlertCircle size={24} />
                  )}
                </div>
                <div>
                  <div className="font-bold text-lg">
                    {selectedCall.sentiment}
                  </div>
                  <div className="text-xs text-gray-500">Overall Tone</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* --- List View --- */
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">
                Avg Sentiment Score
              </h3>
              <p className="text-3xl font-bold text-[#063324] mt-2">
                84.2<span className="text-sm text-gray-400 ml-2">/ 100</span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">
                Critical Alerts
              </h3>
              <p className="text-3xl font-bold text-red-500 mt-2">
                3
                <span className="text-sm text-gray-400 font-normal ml-2">
                  Requires Review
                </span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">
                Keyword Trend
              </h3>
              <p className="text-lg font-semibold text-[#063324] mt-3">
                &quot;Maintenance&quot; ↑ 12%
              </p>
            </div>
          </div>

          {/* Call List */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-bold text-lg text-[#063324]">
                Recent Interaction Transcripts
              </h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search calls..."
                    className="pl-10 pr-4 py-2 bg-[#F0F7F4] rounded-full text-sm text-[#063324] outline-none focus:ring-2 focus:ring-[#063324]/10"
                  />
                </div>
                <button className="p-2 bg-[#F0F7F4] rounded-full hover:bg-[#E0EBE6] transition-colors">
                  <Filter size={18} className="text-[#063324]" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {MOCK_CALLS.map((call) => (
                <div
                  key={call.id}
                  className="p-6 hover:bg-[#F0F7F4]/50 transition cursor-pointer group"
                  onClick={() => setSelectedCall(call)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-2xl ${
                          call.sentiment === "Negative"
                            ? "bg-red-50 text-red-600"
                            : call.sentiment === "Neutral"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-green-50 text-green-600"
                        }`}
                      >
                        {call.sentiment === "Negative" ? (
                          <AlertCircle size={24} />
                        ) : (
                          <CheckCircle size={24} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-[#063324] text-lg">
                            {call.customer}
                          </h4>
                          {call.status === "Attention Needed" && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                              Alert
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User size={12} /> {call.agent}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {call.duration}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pl-14 md:pl-0">
                      <div className="flex gap-2">
                        {call.topics.map((t) => (
                          <span
                            key={t}
                            className="hidden md:inline-block px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-500"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                      <div className="text-right min-w-[80px]">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Score
                        </span>
                        <span
                          className={`text-2xl font-bold ${
                            call.score < 60
                              ? "text-red-500"
                              : call.score < 80
                              ? "text-yellow-500"
                              : "text-[#063324]"
                          }`}
                        >
                          {call.score}%
                        </span>
                      </div>
                      <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#063324]/10 text-[#063324] font-semibold rounded-full text-sm hover:bg-[#063324] hover:text-white transition-all shadow-sm group-hover:shadow-md">
                        <FileText size={16} /> Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
