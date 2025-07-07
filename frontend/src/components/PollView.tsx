import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'rc-progress';
import { Poll, PollOption } from '../types/poll';
import { pollService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import Loader from './Loader';

interface PollViewProps {
  pollId: string;
}

const PollView: React.FC<PollViewProps> = ({ pollId }) => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isVoting, setIsVoting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isQRLoading, setIsQRLoading] = useState(false);
  
  const { isConnected, lastMessage, isConnecting } = useWebSocket(pollId);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const pollData = await pollService.getPoll(pollId);
        setPoll(pollData);
        
        // Check if user has already voted
        const userHasVoted = await pollService.hasVoted(pollId);
        setHasVoted(userHasVoted);
      } catch (err) {
        setError('Erreur lors du chargement du sondage');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoll();
  }, [pollId]);

  const updatePollVotes = useCallback((message: any) => {
    if (message.type === 'vote_update') {
      setPoll(prevPoll => {
        if (!prevPoll) return null;
        
        const updatedOptions = prevPoll.options.map(option => {
          if (option.id === message.data.option_id) {
            return { ...option, vote_count: message.data.votes || option.vote_count };
          }
          return option;
        });

        return {
          ...prevPoll,
          options: updatedOptions,
        };
      });
    }
  }, []);

  useEffect(() => {
    if (lastMessage) {
      updatePollVotes(lastMessage);
    }
  }, [lastMessage, updatePollVotes]);

  // Countdown for expiration
  useEffect(() => {
    if (!poll?.expires_at) {
      setTimeLeft('');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(poll.expires_at!).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}j ${hours}h ${minutes}m ${seconds}s`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      } else {
        setTimeLeft('Expiré');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [poll?.expires_at]);

  const handleVote = async () => {
    if (!selectedOption || !poll) return;

    setIsVoting(true);
    setError('');

    try {
      await pollService.vote(pollId, { option_ids: [selectedOption] });
      setHasVoted(true);
    } catch (err) {
      setError('Erreur lors du vote');
    } finally {
      setIsVoting(false);
    }
  };

  const isActive = (poll: Poll) => {
    if (!poll.expires_at) return true;
    if (timeLeft === 'Expiré') return false;
    return new Date(poll.expires_at) > new Date();
  };

  const getTotalVotes = (poll: Poll) => {
    return poll.options.reduce((total, option) => total + option.vote_count, 0);
  };

  const getPercentage = (votes: number, total: number) => {
    return total > 0 ? ((votes / total) * 100).toFixed(1) : '0.0';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getShareUrl = () => {
    return `${window.location.origin}?poll=${pollId}`;
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader text="Chargement du sondage..." />
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Erreur de chargement</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Sondage introuvable</h3>
        <p className="text-gray-600">Ce sondage n'existe pas ou n'est plus disponible.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Poll Header */}
      <div className="glass-card overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-white p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-shadow">
                {poll.title}
              </h2>
              {poll.description && (
                <p className="text-blue-100 text-lg leading-relaxed">
                  {poll.description}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Poll Meta Information */}
        <div className="bg-gray-50/80 backdrop-blur-sm p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Créé le</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(poll.created_at)}</p>
              </div>
            </div>

            {poll.expires_at && (
              <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Expire le</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(poll.expires_at)}</p>
                </div>
              </div>
            )}

            {timeLeft && (
              <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                <div className={`w-8 h-8 ${timeLeft === 'Expiré' ? 'bg-red-100' : 'bg-green-100'} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-4 h-4 ${timeLeft === 'Expiré' ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Temps restant</p>
                  <p className={`text-sm font-semibold ${timeLeft === 'Expiré' ? 'text-red-600' : 'text-green-600'}`}>
                    {timeLeft === 'Expiré' ? 'Expiré' : timeLeft}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total votes</p>
                <p className="text-sm font-semibold text-gray-800">{getTotalVotes(poll)}</p>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mt-4 flex justify-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-700' 
                : isConnecting 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isConnecting ? (
                <>
                  <Loader size="small" inline />
                  <span>Connexion...</span>
                </>
              ) : isConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Temps réel actif</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Hors ligne</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Poll Options */}
      <div className="space-y-4">
        {poll.options.map((option: PollOption, index: number) => (
          <div 
            key={option.id} 
            className={`glass-card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer animate-slide-in-up ${
              selectedOption === option.id ? 'ring-2 ring-primary-500 bg-primary-50/50' : ''
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => !hasVoted && isActive(poll) && setSelectedOption(option.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-4 cursor-pointer flex-1">
                <input
                  type="radio"
                  name="poll-option"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  disabled={hasVoted || !isActive(poll)}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-lg font-medium text-gray-800">{option.text}</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {option.vote_count} votes
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Line
                  percent={parseFloat(getPercentage(option.vote_count, getTotalVotes(poll)))}
                  strokeWidth={6}
                  strokeColor="url(#gradient)"
                  trailWidth={6}
                  trailColor="#e5e7eb"
                  strokeLinecap="round"
                />
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm">
                <span className="text-sm font-bold text-gray-800">
                  {getPercentage(option.vote_count, getTotalVotes(poll))}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Vote Actions */}
      <div className="glass-card p-6 text-center">
        {!hasVoted && isActive(poll) && (
          <button
            onClick={handleVote}
            disabled={!selectedOption || isVoting}
            className="btn-animated bg-gradient-to-r from-secondary-500 to-secondary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto"
          >
            {isVoting ? (
              <>
                <Loader size="small" inline />
                <span>Vote en cours...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Voter maintenant</span>
              </>
            )}
          </button>
        )}
        
        {hasVoted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-center gap-3 text-green-700">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-lg font-semibold">Votre vote a été enregistré avec succès !</span>
            </div>
          </div>
        )}

        {!isActive(poll) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center justify-center gap-3 text-red-700">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-lg font-semibold">Ce sondage a expiré</span>
            </div>
          </div>
        )}
      </div>

      {/* Share Section */}
      <div className="glass-card p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Partager ce sondage
          </h3>
          <p className="text-gray-600">Invitez d'autres personnes à participer à votre sondage</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={getShareUrl()}
              readOnly
              className="input-modern flex-1 font-mono text-sm"
            />
            <button
              onClick={copyShareUrl}
              className={`btn-animated px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                copySuccess 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              {copySuccess ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copié !
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copier
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              if (!showQR) {
                setIsQRLoading(true);
                setTimeout(() => setIsQRLoading(false), 500);
              }
              setShowQR(!showQR);
            }}
            className="btn-animated w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
            disabled={isQRLoading}
          >
            {isQRLoading ? (
              <>
                <Loader size="small" inline />
                <span>Génération...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>{showQR ? 'Masquer QR Code' : 'Afficher QR Code'}</span>
              </>
            )}
          </button>
        </div>

        {showQR && (
          <div className="mt-6 text-center animate-fade-in">
            {isQRLoading ? (
              <div className="py-8">
                <Loader text="Génération du QR code..." />
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 inline-block">
                <img
                  src={pollService.getQRCode(pollId)}
                  alt="QR Code du sondage"
                  className="w-48 h-48 mx-auto rounded-xl shadow-lg"
                />
                <p className="mt-4 text-sm text-gray-600 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Scannez ce QR code pour accéder au sondage
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PollView;