"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Banknote,
  RefreshCw,
  PhoneCall,
  Sparkles,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  budget: string;
  moveInDate: string;
  preferences: string;
  source: string;
  createdAt: string;
}

export default function VoiceAgentLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeads = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/leads");
      const data = await response.json();

      if (data.status === "ok") {
        setLeads(data.leads);
        setError(null);
      } else {
        setError(data.message || "Failed to fetch leads");
      }
    } catch (err) {
      setError("Failed to connect to server");
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // Auto-refresh every 10 seconds to catch new leads from voice agent
    const interval = setInterval(fetchLeads, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
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
            <Link
              href="/dashboard/voice-agent/demo"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200"
            >
              <PhoneCall size={18} />
              Test Voice Agent
            </Link>

            <button
              onClick={() => fetchLeads()}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#063324] text-white rounded-full hover:bg-[#063324]/90 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <Users className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#063324]">
              Voice Agent Leads
            </h1>
            <p className="text-gray-500">
              Leads captured by the AI Voice Support Agent
            </p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Users className="text-violet-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#063324]">
                {leads.length}
              </div>
              <div className="text-xs text-gray-500">Total Leads</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Calendar className="text-green-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#063324]">
                {
                  leads.filter((l) => {
                    const date = new Date(l.createdAt);
                    const now = new Date();
                    return now.getTime() - date.getTime() < 24 * 60 * 60 * 1000;
                  }).length
                }
              </div>
              <div className="text-xs text-gray-500">Today</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <MapPin className="text-blue-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#063324]">
                {new Set(leads.map((l) => l.city).filter(Boolean)).size}
              </div>
              <div className="text-xs text-gray-500">Cities</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Sparkles className="text-amber-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#063324]">AI</div>
              <div className="text-xs text-gray-500">Voice Captured</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading leads...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-red-600 font-medium mb-2">{error}</p>
            <button
              onClick={() => fetchLeads()}
              className="text-[#063324] underline"
            >
              Try again
            </button>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="text-violet-500" size={40} />
            </div>
            <h3 className="text-xl font-bold text-[#063324] mb-2">
              No leads yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Test the Voice Agent to capture your first lead. The agent will
              collect caller information and create lead records automatically.
            </p>
            <Link
              href="/dashboard/voice-agent/demo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg"
            >
              <PhoneCall size={20} />
              Try Voice Agent Demo
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#063324] to-[#0a5240] text-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    City
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Budget
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Move-in
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Preferences
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead, index) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-violet-50/50 transition-colors ${
                      index === 0 ? "bg-violet-50/30" : ""
                    }`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[#063324]">
                            {lead.name}
                          </div>
                          {index === 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                              <Sparkles size={10} /> New
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone size={14} className="text-gray-400" />
                            {lead.phone}
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail size={14} className="text-gray-400" />
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {lead.city ? (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-blue-500" />
                          <span className="text-[#063324]">{lead.city}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {lead.budget ? (
                        <div className="flex items-center gap-2">
                          <Banknote size={14} className="text-green-500" />
                          <span className="text-[#063324]">{lead.budget}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {lead.moveInDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-amber-500" />
                          <span className="text-[#063324]">
                            {lead.moveInDate}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5 max-w-xs">
                      {lead.preferences ? (
                        <p className="text-sm text-gray-600 truncate">
                          {lead.preferences}
                        </p>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-gray-500">
                        {formatDate(lead.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-4 text-center text-sm text-gray-400">
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Auto-refreshing every 10 seconds
        </span>
      </div>
    </div>
  );
}

