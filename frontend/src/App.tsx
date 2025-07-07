import React, { useState, useEffect } from 'react';
import './App.css';
import CreatePoll from './components/CreatePoll';
import PollView from './components/PollView';

function App() {
  const [currentView, setCurrentView] = useState<'create' | 'view'>('create');
  const [currentPollId, setCurrentPollId] = useState<string>('');

  // Vérifier s'il y a un paramètre poll dans l'URL au chargement
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pollIdFromUrl = urlParams.get('poll');
    if (pollIdFromUrl) {
      setCurrentPollId(pollIdFromUrl);
      setCurrentView('view');
      // Nettoyer l'URL sans recharger la page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handlePollCreated = (pollId: string) => {
    setCurrentPollId(pollId);
    setCurrentView('view');
  };

  const handleBackToCreate = () => {
    setCurrentView('create');
    setCurrentPollId('');
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
