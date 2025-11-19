import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, ExternalLink, Copy, Check, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { ResearchArtifact, GroundingSource, SidebarState } from '../types';

interface ArtifactViewProps {
  artifact: ResearchArtifact | null;
  sources: GroundingSource[];
  sidebarState: SidebarState;
  setSidebarState: (state: SidebarState) => void;
}

export const ArtifactView: React.FC<ArtifactViewProps> = ({ 
  artifact, 
  sources,
  sidebarState, 
  setSidebarState 
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!artifact) return;
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!artifact) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-600 bg-[#0f0f0f]">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 rotate-3">
          <FileText size={32} className="text-neutral-700" />
        </div>
        <p className="font-medium">No active research</p>
        <p className="text-sm mt-2">Artifacts will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] text-neutral-200 relative">
      {/* Artifact Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#0f0f0f]/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
            {artifact.status === 'streaming' ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          </div>
          <div className="flex flex-col">
            <h2 className="font-semibold text-sm text-white truncate max-w-[200px] sm:max-w-xs">
              {artifact.topic || "Untitled Research"}
            </h2>
            <span className="text-xs text-neutral-500 flex items-center gap-1">
              {artifact.status === 'streaming' ? 'Generating report...' : 'Research completed'}
              {artifact.status === 'streaming' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
            title="Copy Markdown"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
          <button 
            onClick={() => setSidebarState(sidebarState === SidebarState.EXPANDED ? SidebarState.VISIBLE : SidebarState.EXPANDED)}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors hidden md:block"
          >
            {sidebarState === SidebarState.EXPANDED ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* The Markdown Content */}
          <div className="markdown-body animate-in fade-in duration-700">
            <ReactMarkdown>{artifact.content}</ReactMarkdown>
          </div>
          
          {/* Cursor for streaming effect */}
          {artifact.status === 'streaming' && (
             <div className="mt-4 h-4 w-1 bg-blue-500 animate-pulse"></div>
          )}

          {/* Sources Section */}
          {sources.length > 0 && (
            <div className="mt-12 pt-8 border-t border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-400 mb-4 flex items-center gap-2">
                <ExternalLink size={14} />
                Referenced Sources
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 transition-all group"
                  >
                    <span className="text-sm text-neutral-300 truncate mr-4 font-mono">{source.title}</span>
                    <ExternalLink size={14} className="text-neutral-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};