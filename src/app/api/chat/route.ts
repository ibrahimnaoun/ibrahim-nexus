import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Define proper TypeScript interfaces
interface Project {
  title: string;
  description: string;
  technologies: string[];
}

interface KnowledgeBase {
  about: string;
  skills: string[];
  projects: Project[];
  contact: Record<string, string>;
  rules: string[];
}

interface FormattedKnowledgeBase {
  about: string;
  skills: string;
  projects: string;
  contact: string;
  rules: string;
}

interface ChatRequest {
  question: string;
}

interface ChatResponse {
  answer?: string;
  error?: string;
  details?: string;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const chatbotSystemPrompt = `
You are Ibrahim Naoun's professional AI portfolio assistant.
You must only answer questions about his work, experience, projects, or skills.
You can explain his background, skills, and projects in detail.
Do not answer anything personal - respond with:
"I can't answer that, but feel free to check Ibrahim's LinkedIn or contact him directly."
Do not answer anything inappropriate, or unrelated — respond with:
"I'm here to answer professional questions about Ibrahim's work. Please ask something relevant."
If the user's message is not in English, kindly inform them that while you will attempt to translate and respond accurately. Do your best to translate and assist them in a professional manner.

Use the following knowledge base: 
`;

const formatProjects = (projects: Project[]): string => {
  return projects.map(project => {
    return `
Project: ${project.title}
Description: ${project.description}
Technologies: ${project.technologies.join(', ')}
`;
  }).join('\n');
};

const getKnowledgeBase = (): FormattedKnowledgeBase => {
  try {
    const filePath = path.join(process.cwd(), "lib", "knowledge_base.json");
    const fileContent = readFileSync(filePath, "utf-8");
    const knowledgeBase: KnowledgeBase = JSON.parse(fileContent);
    
    // Format each section properly
    const formattedKnowledgeBase: FormattedKnowledgeBase = {
      about: knowledgeBase.about,
      skills: knowledgeBase.skills.join(', '),
      projects: formatProjects(knowledgeBase.projects),
      contact: Object.entries(knowledgeBase.contact)
        .map(([platform, url]) => `${platform}: ${url}`)
        .join('\n'),
      rules: knowledgeBase.rules.join('\n')
    };
    
    return formattedKnowledgeBase;
  } catch (error) {
    console.error("Error reading knowledge base:", error);
    throw new Error("Failed to load knowledge base");
  }
};

export async function POST(req: NextRequest): Promise<NextResponse<ChatResponse>> {
  let body: ChatRequest;
  
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { question } = body;

  if (!question || typeof question !== "string") {
    return NextResponse.json(
      { error: "Invalid question" },
      { status: 400 }
    );
  }

  try {
    const knowledgeBase = getKnowledgeBase();
    
    const knowledgeText = `
=== ABOUT ===
${knowledgeBase.about}

=== SKILLS ===
${knowledgeBase.skills}

=== PROJECTS ===
${knowledgeBase.projects}

=== CONTACT ===
${knowledgeBase.contact}

=== RULES ===
${knowledgeBase.rules}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `${chatbotSystemPrompt}\n\nKNOWLEDGE BASE:\n${knowledgeText}\n\nQUESTION: ${question}\n\nPlease answer based on the knowledge base above.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ answer: text });
  } catch (error) {
    console.error("Gemini chatbot error:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}