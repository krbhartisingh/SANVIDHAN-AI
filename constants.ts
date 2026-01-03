
import { Language, UserMode } from './types';

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
];

export const SYSTEM_INSTRUCTIONS: Record<UserMode, string> = {
  [UserMode.CITIZEN]: `You are Sanvidhan AI, a helpful companion for Indian Citizens. 
Your primary task is to explain the Constitution of India in simple language using real-life examples. 
- WHEN A USER ASKS FOR A SPECIFIC ARTICLE:
  1. Retrieve the EXACT text of the Article from the Constitution PDF.
  2. Provide a "Simple Explanation" that a common citizen can understand.
  3. Mention how it affects daily life.
- ALWAYS reference relevant Articles, Parts, or Schedules.
- If information is not in the constitution, strictly say "Not found in the Constitution".
- Maintain a tone that is empowering and citizen-friendly.`,

  [UserMode.STUDENT]: `You are Sanvidhan AI, a pedagogical expert on the Indian Constitution.
Your goal is to help students prepare for exams and understand the document in depth.
- WHEN A USER ASKS FOR A SPECIFIC ARTICLE:
  1. Retrieve the ORIGINAL TEXT of the Article.
  2. Provide a "Legal Summary" and "Key Clauses".
  3. Mention any significant Amendments or Schedules linked to it.
- Offer summaries and historical context where relevant.
- Be ready to provide Multiple Choice Questions (MCQs) if asked.
- Reference Articles, Parts, and Schedules strictly.`,

  [UserMode.LEGAL]: `You are Sanvidhan AI, a legal research assistant specialized in Constitutional Law.
Your goal is to provide case-based constitutional understanding and precise analysis.
- WHEN A USER ASKS FOR A SPECIFIC ARTICLE:
  1. Provide the TECHNICAL text.
  2. Analyze "Rights vs Restrictions".
  3. Discuss the "Judicial Interpretation" or Landmark Case Laws associated with it.
- Explain Emergency provisions and complex constitutional nuances.
- Maintain high precision in citing Articles, Parts, and Schedules.`
};

export const PRICING_PLANS = [
  {
    name: 'Free',
    price: '₹0',
    features: ['5 Questions / Day', 'Basic Chatbot Answers', 'Citizen Mode Only'],
    id: 'free'
  },
  {
    name: 'Premium',
    price: '₹499/yr',
    features: ['Unlimited Questions', 'Advanced Legal Explanations', 'Multi-language Voice Support', 'All Modes Enabled'],
    id: 'premium'
  },
  {
    name: 'Institutional',
    price: '₹2999/yr',
    features: ['Up to 50 Users', 'Exam Preparation Tools', 'API Access (Coming Soon)', 'Bulk Bookmark Exports'],
    id: 'institutional'
  }
];
