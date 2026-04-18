# ProofHire

> "Don't just claim it. Prove it."

An AI-powered talent screening tool for recruiters built for the Umurava AI Hackathon.

## What it does
- Recruiters create job openings with required skills and experience level
- Candidates are ingested via structured JSON profiles or CSV uploads
- Gemini AI analyzes ALL candidates simultaneously and ranks them by fit
- Each candidate gets a match score (0-100), strengths, gaps, and a hiring recommendation
- Top candidates receive a "Verified" badge after passing a skill challenge

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Redux Toolkit
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose)
- **AI Engine**: Google Gemini 1.5 Flash
- **Deployment**: Vercel (frontend) + Railway (backend)

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google AI Studio API key (Gemini)

### Frontend
```bash
cd proofhire-frontend
npm install
cp .env.local.example .env.local
# Add your NEXT_PUBLIC_API_URL
npm run dev
```

### Backend
```bash
cd proofhire-backend
npm install
cp .env.example .env
# Add your MONGODB_URI and GEMINI_API_KEY
npm run seed   # populate test data
npm run dev
```

## Environment Variables

### Frontend (.env.local)
| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_API_URL | Backend URL (http://localhost:5000 in dev) |

### Backend (.env)
| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 5000) |
| MONGODB_URI | MongoDB Atlas connection string |
| GEMINI_API_KEY | Google AI Studio API key |

## AI Decision Flow
1. Recruiter triggers screening for a job
2. Backend fetches all applicants for that job from MongoDB
3. All profiles are compiled into a single structured prompt
4. Gemini 1.5 Flash evaluates each candidate against job requirements
5. Gemini returns a ranked JSON array with scores, strengths, gaps, and recommendations
6. Results are saved to MongoDB and returned to the frontend
7. Frontend displays the ranked shortlist with expandable AI reasoning

## Assumptions & Limitations
- Gemini API rate limits may affect screening of large batches (50+ candidates)
- CSV import supports basic profile fields only (not full nested experience/education)
- AI scores are indicative — final hiring decisions remain with the recruiter

## Team
Built at the Umurava AI Hackathon by [NovaTalent]
