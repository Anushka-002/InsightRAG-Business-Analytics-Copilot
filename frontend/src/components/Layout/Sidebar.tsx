import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  Database, 
  FileText, 
  Clock, 
  FlaskConical, 
  Settings,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { ViewType } from '../../types';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  isDemoMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView, isDemoMode }) => {
  const navItems: Array<{ id: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'chat', label: 'Ask InsightRAG', icon: Sparkles },
    { id: 'explorer', label: 'Data Explorer', icon: Database },
    { id: 'documents', label: 'Documents & Knowledge', icon: FileText },
    { id: 'history', label: 'Query History', icon: Clock },
    { id: 'evaluation', label: 'Evaluation Lab', icon: FlaskConical },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-bg-sidebar border-r border-border-subtle flex flex-col h-screen select-none shrink-0">
      {/* Brand Logo & Name */}
      <div className="h-16 px-5 flex items-center border-b border-border-subtle space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-accent-blue to-accent-cyan flex items-center justify-center text-bg-main shadow-lg shadow-blue-500/10">
          <Sparkles className="w-5 h-5 text-bg-main" />
        </div>
        <div>
          <span className="font-semibold text-content-main tracking-tight text-base block">InsightRAG</span>
          <span className="text-[10px] text-content-muted uppercase tracking-wider block font-medium">Analytics Copilot</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-content-muted">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive 
                  ? 'bg-bg-elevated text-accent-blue border border-border-subtle shadow-sm' 
                  : 'text-content-muted hover:text-content-main hover:bg-bg-card'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-accent-blue' : 'text-content-muted'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-accent-blue" />}
            </button>
          );
        })}
      </nav>

      {/* Mode Status Pill */}
      <div className="p-3 border-t border-border-subtle">
        <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-accent-cyan" />
            <span className="text-xs font-medium text-content-main">Engine Engine</span>
          </div>
          <p className="text-[11px] text-content-muted mt-1 leading-relaxed">
            {isDemoMode ? (
              <span className="text-status-success font-medium">Deterministic Demo Mode (Offline Safe)</span>
            ) : (
              <span className="text-accent-blue font-medium">Live Hybrid LLM + RAG Connected</span>
            )}
          </p>
        </div>
      </div>
    </aside>
  );
};
