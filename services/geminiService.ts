import { GoogleGenAI, Type } from "@google/genai";
import { GroundingSource } from "../types";

// Initialize the client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to parse grounding chunks into a cleaner format
const extractSources = (groundingChunks: any[]): GroundingSource[] => {
  if (!groundingChunks || groundingChunks.length === 0) return [];
  
  const sources: GroundingSource[] = [];
  
  groundingChunks.forEach(chunk => {
    if (chunk.web?.uri && chunk.web?.title) {
      sources.push({
        title: chunk.web.title,
        uri: chunk.web.uri
      });
    }
  });
  
  // Deduplicate based on URI
  return Array.from(new Map(sources.map(item => [item.uri, item])).values());
};

export const streamResearchReport = async (
  topic: string,
  onChunk: (text: string) => void,
  onSources: (sources: GroundingSource[]) => void
) => {
  try {
    const model = "gemini-2.5-flash"; // Good balance of speed and reasoning
    
    const systemInstruction = `
      You are a Deep Research Agent. Your goal is to produce a high-quality, comprehensive research report in Markdown format.
      
      Structure:
      1. **Executive Summary**: Brief overview.
      2. **Key Findings**: detailed analysis.
      3. **Context & Background**: History or relevant context.
      4. **Analysis**: Pros, cons, implications, or technical details depending on the topic.
      5. **Conclusion**: Summary of thoughts.
      
      Formatting:
      - Use proper H1 (#), H2 (##), H3 (###) headers.
      - Use bullet points and tables where appropriate for data density.
      - Be objective, thorough, and academic yet accessible.
      - Automatically expand the breadth and depth of the user's request. If they ask about "EVs", cover batteries, market trends, environmental impact, and future tech.
      
      Do NOT include conversational filler like "Here is your report". Start directly with the Title (H1).
    `;

    const response = await ai.models.generateContentStream({
      model: model,
      contents: `Research topic: ${topic}`,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }], // Enable search grounding
      },
    });

    let fullText = "";
    let allSources: GroundingSource[] = [];

    for await (const chunk of response) {
      // Handle text streaming
      const textPart = chunk.text;
      if (textPart) {
        fullText += textPart;
        onChunk(fullText);
      }

      // Handle grounding (sources)
      // Note: In streaming, grounding metadata might appear in specific chunks, often at the end.
      if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const newSources = extractSources(chunk.candidates[0].groundingMetadata.groundingChunks);
        if (newSources.length > 0) {
          // Merge and dedupe logic could go here, but usually we just replace or add unique
           // Simple unique merge for now
           newSources.forEach(s => {
             if (!allSources.find(existing => existing.uri === s.uri)) {
               allSources.push(s);
             }
           });
           onSources([...allSources]);
        }
      }
    }
    
    return { text: fullText, sources: allSources };
    
  } catch (error) {
    console.error("Error generating research report:", error);
    throw error;
  }
};

export const generateChatResponse = async (
  history: { role: string; content: string }[],
  currentMessage: string
) => {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
       systemInstruction: "You are a helpful research assistant. Your job is to acknowledge the user's research request and provide brief updates or answer clarification questions. Do not generate the full report here; the report is generated in a separate view. Keep responses concise and encouraging."
    }
  });
  
  // Note: history implementation omitted for brevity in this specific function scope, 
  // but typically you'd populate history using history.forEach(msg => ...) or chat.sendMessage with context.
  // For this specific app flow, we are treating the chat as a command interface mostly.
  
  const response = await chat.sendMessageStream({
    message: currentMessage
  });
  
  return response;
};