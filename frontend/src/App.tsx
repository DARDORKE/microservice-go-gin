import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CreatePoll from './components/CreatePoll';
import PollView from './components/PollView';
import LanguageSwitch from './components/LanguageSwitch';

function App() {
  const { t, i18n } = useTranslation();
  const [currentView, setCurrentView] = useState<'create' | 'view'>('create');
  const [currentPollId, setCurrentPollId] = useState<string>('');

  // Check for poll parameter in URL on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pollIdFromUrl = urlParams.get('poll');
    if (pollIdFromUrl) {
      setCurrentPollId(pollIdFromUrl);
      setCurrentView('view');
      // Clean URL without page reload
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

  // Apply RTL for Arabic
  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-secondary-400/20 to-secondary-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-accent-400/10 to-accent-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center space-y-6">
            {/* Language Switch */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[100]">
              <LanguageSwitch />
            </div>
            
            {/* Logo and Title */}
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-black gradient-text text-shadow-lg mb-2">
                {t('app.title')}
              </h1>
              <p className="text-gray-600 text-lg font-medium">
                {t('app.subtitle')}
              </p>
            </div>

            {/* Navigation */}
            {currentView === 'view' && (
              <nav className="flex flex-wrap justify-center gap-4 animate-fade-in">
                <button
                  onClick={handleBackToCreate}
                  className="btn-animated bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('nav.createNewPoll')}
                </button>
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {currentView === 'create' ? (
            <div className="animate-fade-in">
              <CreatePoll onPollCreated={handlePollCreated} />
            </div>
          ) : (
            <div className="animate-fade-in">
              <PollView pollId={currentPollId} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-semibold">{t('app.title')}</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-gray-600"></div>
            <p className="text-gray-300">
              {t('app.footer.description')}
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t('app.footer.features.realtime')}
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {t('app.footer.features.responsive')}
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('app.footer.features.secure')}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              {t('app.footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;