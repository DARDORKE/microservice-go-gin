import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Poll, PollOption } from '../types/poll';
import { pollService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import Loader from './Loader';
import ProgressBar from './ProgressBar';

interface PollViewProps {
  pollId: string;
}

const PollView: React.FC<PollViewProps> = ({ pollId }) => {
  const { t, i18n } = useTranslation();
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
        setError(t('poll.loadingError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoll();
  }, [pollId]); // eslint-disable-line react-hooks/exhaustive-deps

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
          setTimeLeft(`${days}${t('poll.time.days')} ${hours}${t('poll.time.hours')} ${minutes}${t('poll.time.minutes')} ${seconds}${t('poll.time.seconds')}`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}${t('poll.time.hours')} ${minutes}${t('poll.time.minutes')} ${seconds}${t('poll.time.seconds')}`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}${t('poll.time.minutes')} ${seconds}${t('poll.time.seconds')}`);
        } else {
          setTimeLeft(`${seconds}${t('poll.time.seconds')}`);
        }
      } else {
        setTimeLeft(t('poll.expired'));
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [poll?.expires_at, t]);

  const handleVote = async () => {
    if (!selectedOption || !poll) return;

    setIsVoting(true);
    setError('');

    try {
      await pollService.vote(pollId, { option_ids: [selectedOption] });
      setHasVoted(true);
    } catch (err) {
      setError(t('poll.error'));
    } finally {
      setIsVoting(false);
    }
  };

  const isActive = (poll: Poll) => {
    if (!poll.expires_at) return true;
    if (timeLeft === t('poll.expired')) return false;
    return new Date(poll.expires_at) > new Date();
  };

  const getTotalVotes = (poll: Poll) => {
    return poll.options.reduce((total, option) => total + option.vote_count, 0);
  };

  const getPercentage = (votes: number, total: number) => {
    return total > 0 ? ((votes / total) * 100).toFixed(1) : '0.0';
  };

  const formatDate = (dateString: string) => {
    const localeMap: { [key: string]: string } = {
      'en': 'en-US',
      'es': 'es-ES',
      'nl': 'nl-NL',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR',
      'zh': 'zh-CN',
      'ar': 'ar-SA',
      'ru': 'ru-RU',
      'fr': 'fr-FR'
    };
    return new Date(dateString).toLocaleString(localeMap[i18n.language] || 'fr-FR');
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
      // Error copying to clipboard - user will not see visual feedback
    }
  };

  const shareOnFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    const title = encodeURIComponent(poll?.title || '');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`, '_blank', 'width=555,height=333');
  };

  const shareOnTwitter = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(`${poll?.title || ''} - ${t('poll.share.twitterText')}`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=555,height=333');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(getShareUrl());
    const title = encodeURIComponent(poll?.title || '');
    const summary = encodeURIComponent(poll?.description || '');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, '_blank', 'width=555,height=333');
  };

  const shareOnWhatsApp = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(`${poll?.title || ''} - ${t('poll.share.whatsappText')}`);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  };

  const shareOnTelegram = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(`${poll?.title || ''} - ${t('poll.share.telegramText')}`);
    window.open(`https://telegram.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const shareByEmail = () => {
    const url = getShareUrl();
    const subject = encodeURIComponent(`${t('poll.share.emailSubject')}: ${poll?.title || ''}`);
    const body = encodeURIComponent(`${t('poll.share.emailBody')}\n\n${poll?.title || ''}\n${poll?.description || ''}\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader text={t('poll.loading')} />
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
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('common.error')}</h3>
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
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('poll.notFound')}</h3>
        <p className="text-gray-600">{t('poll.notFoundDescription')}</p>
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
                <p className="text-xs text-gray-500 font-medium">{t('poll.createdOn')}</p>
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
                  <p className="text-xs text-gray-500 font-medium">{t('poll.expiresOn')}</p>
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
                  <p className="text-xs text-gray-500 font-medium">{t('poll.timeRemaining')}</p>
                  <p className={`text-sm font-semibold ${timeLeft === t('poll.expired') ? 'text-red-600' : 'text-green-600'}`}>
                    {timeLeft === t('poll.expired') ? t('poll.expired') : timeLeft}
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
                <p className="text-xs text-gray-500 font-medium">{t('poll.totalVotes')}</p>
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
                  <span>{t('poll.connecting')}</span>
                </>
              ) : isConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{t('poll.realtimeActive')}</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>{t('poll.offline')}</span>
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
                  {option.vote_count} {option.vote_count === 1 ? t('poll.vote') : t('poll.votes')}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <ProgressBar
                  percentage={parseFloat(getPercentage(option.vote_count, getTotalVotes(poll)))}
                  size="lg"
                  color="auto"
                  animated={true}
                  className="mb-1"
                />
                {/* Vote count indicator below progress bar */}
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>{option.vote_count} {option.vote_count === 1 ? t('poll.vote') : t('poll.votes')}</span>
                  <span>{getTotalVotes(poll)} {t('poll.total')}</span>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-xl shadow-md min-w-[4rem] text-center text-white font-bold text-sm ${
                parseFloat(getPercentage(option.vote_count, getTotalVotes(poll))) >= 70 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                  : parseFloat(getPercentage(option.vote_count, getTotalVotes(poll))) >= 40
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600'
                  : parseFloat(getPercentage(option.vote_count, getTotalVotes(poll))) >= 20
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                  : 'bg-gradient-to-r from-red-500 to-red-600'
              }`}>
                {getPercentage(option.vote_count, getTotalVotes(poll))}%
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
                <span>{t('poll.voting')}</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t('poll.submit')}</span>
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
              <span className="text-lg font-semibold">{t('poll.success')}</span>
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
              <span className="text-lg font-semibold">{t('poll.expired')}</span>
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
            {t('poll.share.title')}
          </h3>
          <p className="text-gray-600">{t('poll.share.description')}</p>
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
                  {t('poll.share.copied')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {t('poll.share.copyLink')}
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
                <span>{t('poll.share.generating')}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>{showQR ? t('poll.share.hideQR') : t('poll.share.showQR')}</span>
              </>
            )}
          </button>

          {/* Social Media Share Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              {t('poll.share.socialTitle')}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Facebook */}
              <button
                onClick={shareOnFacebook}
                className="btn-animated flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </button>

              {/* Twitter */}
              <button
                onClick={shareOnTwitter}
                className="btn-animated flex items-center justify-center gap-2 bg-blue-400 hover:bg-blue-500 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span>Twitter</span>
              </button>

              {/* LinkedIn */}
              <button
                onClick={shareOnLinkedIn}
                className="btn-animated flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>LinkedIn</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={shareOnWhatsApp}
                className="btn-animated flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span>WhatsApp</span>
              </button>

              {/* Telegram */}
              <button
                onClick={shareOnTelegram}
                className="btn-animated flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span>Telegram</span>
              </button>

              {/* Email */}
              <button
                onClick={shareByEmail}
                className="btn-animated flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Email</span>
              </button>
            </div>
          </div>
        </div>

        {showQR && (
          <div className="mt-6 text-center animate-fade-in">
            {isQRLoading ? (
              <div className="py-8">
                <Loader text={t('poll.share.generatingQR')} />
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 inline-block">
                <img
                  src={pollService.getQRCode(pollId)}
                  alt={t('poll.share.qrAlt')}
                  className="w-48 h-48 mx-auto rounded-xl shadow-lg"
                />
                <p className="mt-4 text-sm text-gray-600 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {t('poll.share.qrDescription')}
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