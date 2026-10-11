import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { OverviewView } from './views/OverviewView';
import { AskInsightRAGView } from './views/AskInsightRAGView';
import { DataExplorerView } from './views/DataExplorerView';
import { DocumentsView } from './views/DocumentsView';
import { HistoryView } from './views/HistoryView';
import { EvaluationLabView } from './views/EvaluationLabView';
import { SettingsView } from './views/SettingsView';
import { ViewType } from './types';
import { api } from './api/client';

export function App() {
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [dbReady, setDbReady] = useState(true);
  const [totalDocs, setTotalDocs] = useState(10);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string>('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const health = await api.getHealth();
      setDbReady(health.database_ready);
      setTotalDocs(health.documents_indexed);
      setIsDemoMode(health.demo_mode);
    } catch {
      // Fallback
    }
  };

  const handleResetDemo = async () => {
    try {
      setIsLoadingDemo(true);
      await api.loadDemoDataset();
      await fetchStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleAskQuestionFromOutside = (q: string) => {
    setActiveQuestion(q);
    setCurrentView('chat');
  };

  return (
    <div className="flex h-screen w-screen bg-bg-main text-content-main overflow-hidden font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onSelectView={setCurrentView} 
        isDemoMode={isDemoMode}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header 
          currentView={currentView}
          dbStatus={dbReady}
          totalDocs={totalDocs}
          onResetDemo={handleResetDemo}
          isLoadingDemo={isLoadingDemo}
        />

        <main className="flex-1 overflow-y-auto">
          {currentView === 'overview' && (
            <OverviewView 
              onAskQuestion={handleAskQuestionFromOutside}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'chat' && (
            <AskInsightRAGView 
              key={activeQuestion}
              initialQuestion={activeQuestion}
            />
          )}

          {currentView === 'explorer' && <DataExplorerView />}

          {currentView === 'documents' && <DocumentsView />}

          {currentView === 'history' && (
            <HistoryView onReplayQuestion={handleAskQuestionFromOutside} />
          )}

          {currentView === 'evaluation' && <EvaluationLabView />}

          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

export default App;
