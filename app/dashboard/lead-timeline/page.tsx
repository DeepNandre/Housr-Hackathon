"use client";

import React from 'react';
import { Calendar, Phone, Mail, MessageSquare, CheckCircle2, Clock, MapPin, User } from 'lucide-react';

const TIMELINE_DATA = [
  {
    id: 1,
    type: 'call',
    icon: <Phone size={16} />,
    title: 'Initial Inquiry Call',
    date: 'Today, 10:30 AM',
    agent: 'Sarah J.',
    description: 'Student interested in 4-bed flats in Fallowfield. Budget £170pppw.',
    tags: ['Inbound', 'High Intent']
  },
  {
    id: 2,
    type: 'email',
    icon: <Mail size={16} />,
    title: 'Matches Sent',
    date: 'Today, 10:45 AM',
    agent: 'AI System',
    description: 'Sent 3 properties matching criteria: HSR-101, HSR-410, HSR-309.',
    tags: ['Automated', 'Delivered']
  },
  {
    id: 3,
    type: 'viewing',
    icon: <MapPin size={16} />,
    title: 'Viewing Booked',
    date: 'Today, 2:15 PM',
    agent: 'Mike T.',
    description: 'Viewing confirmed for HSR-101 (Bright Ensuite) for tomorrow at 11 AM.',
    tags: ['Scheduled']
  },
  {
    id: 4,
    type: 'message',
    icon: <MessageSquare size={16} />,
    title: 'WhatsApp Question',
    date: 'Yesterday, 4:20 PM',
    agent: 'Sarah J.',
    description: 'Asked about bills included policy. Replied with standard bills package info.',
    tags: ['Resolved']
  }
];

export default function LeadTimeline() {
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#063324] mb-2">Lead Timeline</h1>
          <p className="text-gray-500">Interaction history for active leads.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-full border border-gray-200 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 bg-[#F0F7F4] rounded-full flex items-center justify-center text-[#063324]">
            <User size={16} />
          </div>
          <div className="text-sm">
            <div className="font-bold text-[#063324]">Aisha M.</div>
            <div className="text-xs text-gray-500">Active Lead</div>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100"></div>

          <div className="space-y-8">
            {TIMELINE_DATA.map((item) => (
              <div key={item.id} className="relative flex gap-6">
                {/* Icon Bubble */}
                <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white shadow-sm shrink-0 ${
                  item.type === 'call' ? 'bg-blue-50 text-blue-600' :
                  item.type === 'email' ? 'bg-yellow-50 text-yellow-600' :
                  item.type === 'viewing' ? 'bg-green-50 text-green-600' :
                  'bg-purple-50 text-purple-600'
                }`}>
                  {item.icon}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#063324]">{item.title}</h3>
                    <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {item.date}
                    </span>
                  </div>
                  <div className="bg-[#F0F7F4] rounded-xl p-4 border border-[#063324]/5">
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {item.tags.map(tag => (
                          <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white rounded-md text-[#063324]/70 border border-[#063324]/5">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-[#063324]/60">
                        By: {item.agent}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

