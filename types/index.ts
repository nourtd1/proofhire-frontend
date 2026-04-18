// proofhire-frontend/types/index.ts

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
}

export interface Skill {
  id: string;
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface TalentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  resumeUrl?: string;
  portfolioUrl?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  status: 'Open' | 'Closed' | 'Draft';
  createdAt: string;
  updatedAt: string;
}

export interface Applicant {
  id: string;
  jobId: string;
  profile: TalentProfile;
  status: 'Pending' | 'Screening' | 'Shortlisted' | 'Rejected' | 'Hired';
  appliedAt: string;
}

export interface ScreeningResult {
  id: string;
  applicantId: string;
  jobId: string;
  score: number;
  aiAnalysis: string;
  strengths: string[];
  weaknesses: string[];
  createdAt: string;
}

// P6 dashboard / AI screening results shape (backend returns this for GET /api/screening/:jobId)
export interface ScreeningResultWithApplicant {
  _id: string;
  jobId: string;
  applicantId: {
    _id: string;
    profile: TalentProfile;
    source: 'platform' | 'upload';
  };
  matchScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: 'Hire' | 'Maybe' | 'Pass';
  reasoning: string;
  rank: number;
  createdAt?: string;
}
