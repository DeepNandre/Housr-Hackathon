/**
 * Lead data model and in-memory storage for Voice Support Agent
 * Structured for easy swap to Prisma/PostgreSQL later
 */

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  budget: string;
  moveInDate: string;
  preferences: string;
  source: string;
  createdAt: Date;
}

export interface CreateLeadInput {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  budget?: string;
  moveInDate?: string;
  preferences?: string;
  source?: string;
}

// In-memory storage (replace with Prisma DB calls later)
const leadsStore: Lead[] = [
  // Sample leads for demo
  {
    id: "demo-1",
    name: "Sarah Johnson",
    phone: "+44 7911 123456",
    email: "sarah.j@student.manchester.ac.uk",
    city: "Manchester",
    budget: "£150 per week",
    moveInDate: "September 2025",
    preferences: "Near university, ensuite bathroom, quiet area",
    source: "voice-agent",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "demo-2",
    name: "James Chen",
    phone: "+44 7800 654321",
    email: "jchen22@imperial.ac.uk",
    city: "London",
    budget: "£200 per week",
    moveInDate: "October 2025",
    preferences: "Zone 2, bills included, gym nearby",
    source: "voice-agent",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
];

/**
 * Generate a simple UUID-like ID
 */
function generateId(): string {
  return 'lead-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Create a new lead
 */
export async function createLead(input: CreateLeadInput): Promise<Lead> {
  // Validate required fields
  if (!input.name || input.name.trim() === '') {
    throw new Error('Name is required');
  }
  
  if (!input.phone && !input.email) {
    throw new Error('Either phone or email is required');
  }

  const lead: Lead = {
    id: generateId(),
    name: input.name.trim(),
    phone: input.phone?.trim() || '',
    email: input.email?.trim() || '',
    city: input.city?.trim() || '',
    budget: input.budget?.trim() || '',
    moveInDate: input.moveInDate?.trim() || '',
    preferences: input.preferences?.trim() || '',
    source: input.source || 'voice-agent',
    createdAt: new Date(),
  };

  // Add to store (in production: await prisma.lead.create({ data: lead }))
  leadsStore.unshift(lead); // Add to beginning for newest first

  console.log('[Leads] Created new lead:', {
    id: lead.id,
    name: lead.name,
    city: lead.city,
  });

  return lead;
}

/**
 * Get all leads, sorted by createdAt descending (newest first)
 */
export async function getAllLeads(): Promise<Lead[]> {
  // In production: await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } })
  return [...leadsStore].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get a lead by ID
 */
export async function getLeadById(id: string): Promise<Lead | null> {
  // In production: await prisma.lead.findUnique({ where: { id } })
  return leadsStore.find(lead => lead.id === id) || null;
}

/**
 * Get lead count
 */
export async function getLeadCount(): Promise<number> {
  return leadsStore.length;
}

/**
 * Delete a lead (for admin purposes)
 */
export async function deleteLead(id: string): Promise<boolean> {
  const index = leadsStore.findIndex(lead => lead.id === id);
  if (index === -1) return false;
  
  leadsStore.splice(index, 1);
  return true;
}

