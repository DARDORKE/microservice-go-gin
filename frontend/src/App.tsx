import React, { useState } from 'react';
import './App.css';
import CreatePoll from './components/CreatePoll';
import PollView from './components/PollView';

function App() {
  const [currentView, setCurrentView] = useState<'create' | 'view'>('create');
  const [currentPollId, setCurrentPollId] = useState<string>('');
  const [pollIdInput, setPollIdInput] = useState<string>('');

  const handlePollCreated = (pollId: string) => {
    setCurrentPollId(pollId);
    setCurrentView('view');
  };

  const handleViewPoll = () => {
    if (pollIdInput.trim()) {
      setCurrentPollId(pollIdInput.trim());
      setCurrentView('view');
    }
  };

  const handleBackToCreate = () => {
    setCurrentView('create');
    setCurrentPollId('');
    setPollIdInput('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>QuickPoll</h1>
        <nav>
          <button
            onClick={handleBackToCreate}
            className={currentView === 'create' ? 'active' : ''}
          >
            Créer un sondage
          </button>
          <div className="view-poll-section">
            <input
              type="text"
              placeholder="ID du sondage"
              value={pollIdInput}
              onChange={(e) => setPollIdInput(e.target.value)}
            />
            <button onClick={handleViewPoll}>
              Voir le sondage
            </button>
          </div>
        </nav>
      </header>

      <main className="App-main">
        {currentView === 'create' ? (
          <CreatePoll onPollCreated={handlePollCreated} />
        ) : (
          <PollView pollId={currentPollId} />
        )}
      </main>

      <footer className="App-footer">
        <p>QuickPoll - Sondages en temps réel</p>
      </footer>
    </div>
  );
}

export default App;
