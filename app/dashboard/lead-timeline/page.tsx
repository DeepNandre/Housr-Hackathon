"use client";

import React, { useState } from 'react';
import { Calendar, Phone, Mail, MessageSquare, CheckCircle2, Clock, MapPin, User, Plus, Filter, Search, X } from 'lucide-react';

type TimelineEvent = {
  id: number;
  type: 'call' | 'email' | 'viewing' | 'message' | 'note';
  title: string;
  date: string;
  agent: string;
  description: string;
  tags: string[];
};

const INITIAL_DATA: TimelineEvent[] = [
  {
    id: 1,
    type: 'call',
    title: 'Initial Inquiry Call',
    date: 'Today, 10:30 AM',
    agent: 'Sarah J.',
    description: 'Student interested in 4-bed flats in Fallowfield. Budget £170pppw.',
    tags: ['Inbound', 'High Intent']
  },
  {
    id: 2,
    type: 'email',
    title: 'Matches Sent',
    date: 'Today, 10:45 AM',
    agent: 'AI System',
    description: 'Sent 3 properties matching criteria: HSR-101, HSR-410, HSR-309.',
    tags: ['Automated', 'Delivered']
  },
  {
    id: 3,
    type: 'viewing',
    title: 'Viewing Booked',
    date: 'Today, 2:15 PM',
    agent: 'Mike T.',
    description: 'Viewing confirmed for HSR-101 (Bright Ensuite) for tomorrow at 11 AM.',
    tags: ['Scheduled']
  },
  {
    id: 4,
    type: 'message',
    title: 'WhatsApp Question',
    date: 'Yesterday, 4:20 PM',
    agent: 'Sarah J.',
    description: 'Asked about bills included policy. Replied with standard bills package info.',
    tags: ['Resolved']
  }
];

export default function LeadTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>(INITIAL_DATA);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // New Event State
  const [newEvent, setNewEvent] = useState({
    type: 'note',
    description: '',
    title: ''
  });

  const handleAddEvent = () => {
    if (!newEvent.description) return;
    
    const event: TimelineEvent = {
      id: Date.now(),
      type: newEvent.type as any,
      title: newEvent.title || 'New Activity',
      date: 'Just now',
      agent: 'You',
      description: newEvent.description,
      tags: ['Manual Entry']
    };

    setEvents([event, ...events]);
    setIsAdding(false);
    setNewEvent({ type: 'note', description: '', title: '' });
  };

  const filteredEvents = events.filter(e => {
    const matchesFilter = filter === 'all' || e.type === filter;
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) || 
                          e.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone size={16} />;
      case 'email': return <Mail size={16} />;
      case 'viewing': return <MapPin size={16} />;
      case 'message': return <MessageSquare size={16} />;
      default: return <CheckCircle2 size={16} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'call': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'email': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'viewing': return 'bg-green-50 text-green-600 border-green-100';
      case 'message': return 'bg-purple-50 text-purple-600 border-purple-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#063324] mb-2">Lead Timeline</h1>
          <p className="text-gray-500">Track interactions and log new activities.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-white px-4 py-2 rounded-full border border-gray-200 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 bg-[#F0F7F4] rounded-full flex items-center justify-center text-[#063324]">
              <User size={16} />
            </div>
            <div className="text-sm">
              <div className="font-bold text-[#063324]">Aisha M.</div>
              <div className="text-xs text-gray-500">Active Lead</div>
            </div>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#063324] text-white px-4 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#0A4532] transition shadow-lg shadow-[#063324]/20"
          >
            <Plus size={18} /> Log Activity
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {['all', 'call', 'email', 'viewing', 'message', 'note'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all whitespace-nowrap ${
                filter === f 
                  ? 'bg-[#063324] text-white shadow-md' 
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search history..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-sm outline-none focus:border-[#063324] transition-colors"
          />
        </div>
      </div>

      {/* Add Event Modal Overlay */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-[#063324]">Log New Activity</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                <div className="flex gap-2">
                  {['call', 'email', 'note'].map(t => (
                    <button
                      key={t}
                      onClick={() => setNewEvent({...newEvent, type: t})}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                        newEvent.type === t 
                          ? 'bg-[#063324] text-white border-[#063324]' 
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                <input 
                  type="text" 
                  className="w-full bg-[#F0F7F4] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#063324]/10"
                  placeholder="e.g. Follow-up Call"
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea 
                  className="w-full bg-[#F0F7F4] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#063324]/10 resize-none h-24"
                  placeholder="What happened?"
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                />
              </div>

              <button 
                onClick={handleAddEvent}
                className="w-full bg-[#063324] text-white font-bold py-3 rounded-xl hover:bg-[#0A4532] transition shadow-lg shadow-[#063324]/20"
              >
                Save Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm min-h-[400px]">
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-100"></div>

          <div className="space-y-8">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No activities found matching your filters.
              </div>
            ) : (
              filteredEvents.map((item) => (
                <div key={item.id} className="relative flex gap-6 group">
                  {/* Icon Bubble */}
                  <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center border-[3px] border-white shadow-sm shrink-0 transition-transform group-hover:scale-110 ${getColor(item.type)}`}>
                    {getIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-[#063324] text-base">{item.title}</h3>
                      <span className="text-xs font-medium text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                        <Clock size={12} /> {item.date}
                      </span>
                    </div>
                    <div className="bg-[#F0F7F4] rounded-2xl p-5 border border-[#063324]/5 hover:border-[#063324]/10 transition-colors group-hover:shadow-sm">
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{item.description}</p>
                      <div className="flex items-center justify-between border-t border-black/5 pt-3">
                        <div className="flex gap-2 flex-wrap">
                          {item.tags.map(tag => (
                            <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white rounded-md text-[#063324]/70 border border-[#063324]/5">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-[#063324]/50 flex items-center gap-1">
                          <User size={12} /> {item.agent}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
