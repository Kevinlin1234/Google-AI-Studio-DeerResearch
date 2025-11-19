import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatInterface } from './components/ChatInterface';
import { ArtifactView } from './components/ArtifactView';
import { streamResearchReport, generateChatResponse } from './services/geminiService';
import { Message, ResearchArtifact, SidebarState, GroundingSource } from './types';

const App: React.FC = () => {
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Artifact State
  const [currentArtifact, setCurrentArtifact] = useState<ResearchArtifact | null>(null);
  const [artifactSources, setArtifactSources] = useState<GroundingSource[]>([]);
  
  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarState, setSidebarState] = useState<SidebarState>(SidebarState.VISIBLE);

  // Handlers
  const handleSendMessage = useCallback(async (content: string) => {
    const newMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsGenerating(true);
    
    // 1. Create a placeholder artifact immediately to show responsiveness
    const newArtifactId = uuidv4();
    setCurrentArtifact({
      id: newArtifactId,
      topic: content,
      content: '', // Empty initially
      status: 'streaming',
      lastUpdated: Date.now()
    });
    setArtifactSources([]); // Reset sources
    setSidebarState(SidebarState.VISIBLE); // Ensure sidebar is open

    try {
      // 2. Add initial assistant "Thinking/Starting" message
      const startId = uuidv4();
      setMessages(prev => [...prev, {
        id: startId,
        role: 'assistant',
        content: `I'm starting a deep research session on "${content}". I'll scan the web for broad context and deep dive into specific details. The full report is being generated in the panel on the right.`,
        timestamp: Date.now(),
      }]);

      // 3. Trigger the Heavy Research (Streams to Artifact)
      await streamResearchReport(
        content, 
        (chunkText) => {
          setCurrentArtifact(prev => {
            if (!prev) return null;
            return { ...prev, content: chunkText, lastUpdated: Date.now() };
          });
        },
        (sources) => {
           setArtifactSources(sources);
        }
      );

      // 4. Finalize Artifact state
      setCurrentArtifact(prev => prev ? { ...prev, status: 'completed' } : null);

      // 5. Add completion message to chat
      const completeId = uuidv4();
      setMessages(prev => [...prev, {
        id: completeId,
        role: 'assistant',
        content: `Research complete. I've compiled a report covering key aspects of "${content}" with referenced sources. Let me know if you'd like to explore a specific section further.`,
        timestamp: Date.now(),
      }]);

    } catch (error) {
      console.error(error);
      setCurrentArtifact(prev => prev ? { ...prev, status: 'error', content: prev.content + "\n\n**Error: Research interrupted.**" } : null);
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: "I encountered an error while conducting the research. Please try again.",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Layout Classes based on Sidebar State
  // Mobile: Stacked. Desktop: Split.
  const getGridCols = () => {
    if (sidebarState === SidebarState.EXPANDED) return 'md:grid-cols-[0fr_1fr]';
    if (sidebarState === SidebarState.HIDDEN) return 'md:grid-cols-[1fr_0fr]';
    return 'md:grid-cols-[400px_1fr]';
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-black text-white font-sans">
      <div className={`h-full grid grid-cols-1 ${getGridCols()} transition-all duration-500 ease-in-out`}>
        
        {/* Left Panel: Chat */}
        {/* Hidden on mobile if artifact is showing and actively researching, but typically we want user to see chat status. 
            For this design, we'll keep chat always accessible on mobile via toggle or standard scrolling if we were doing a single col,
            but here we use a grid that collapses the left column width to 0 in EXPANDED mode.
        */}
        <div className={`h-full overflow-hidden ${sidebarState === SidebarState.EXPANDED ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
          />
        </div>

        {/* Right Panel: Artifact */}
        <div className={`h-full overflow-hidden bg-[#0f0f0f] border-l border-neutral-800 relative ${sidebarState === SidebarState.HIDDEN ? 'hidden' : 'block'}`}>
          <ArtifactView 
            artifact={currentArtifact}
            sources={artifactSources}
            sidebarState={sidebarState}
            setSidebarState={setSidebarState}
          />
        </div>
      </div>
    </div>
  );
};

export default App;