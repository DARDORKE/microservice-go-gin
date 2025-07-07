import React, { useState, useEffect } from 'react';
import { Poll, PollOption } from '../types/poll';
import { pollService } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

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
  
  const { isConnected, lastMessage } = useWebSocket(pollId);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const pollData = await pollService.getPoll(pollId);
        setPoll(pollData);
        
        // Vérifier si l'utilisateur a déjà voté
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

  useEffect(() => {
    if (lastMessage && poll) {
      if (lastMessage.type === 'vote_update') {
        setPoll(prevPoll => {
          if (!prevPoll) return null;
          
          const updatedOptions = prevPoll.options.map(option => {
            if (option.id === lastMessage.data.option_id) {
              return { ...option, vote_count: lastMessage.data.votes || option.vote_count };
            }
            return option;
          });

          return {
            ...prevPoll,
            options: updatedOptions,
          };
        });
      }
    }
  }, [lastMessage, poll]);

  // Compte à rebours pour l'expiration
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

  if (isLoading) {
    return <div className="loading">Chargement...</div>;
  }

  if (error && !poll) {
    return <div className="error">{error}</div>;
  }

  if (!poll) {
    return <div className="error">Sondage introuvable</div>;
  }

  return (
    <div className="poll-view">
      <div className="poll-header">
        <h2>{poll.title}</h2>
        {poll.description && <p className="description">{poll.description}</p>}
        <div className="poll-meta">
          <span>Créé le: {formatDate(poll.created_at)}</span>
          {poll.expires_at && (
            <span>Expire le: {formatDate(poll.expires_at)}</span>
          )}
          {timeLeft && (
            <span className={`countdown ${timeLeft === 'Expiré' ? 'expired' : ''}`}>
              {timeLeft === 'Expiré' ? '⏰ Expiré' : `⏱️ ${timeLeft}`}
            </span>
          )}
          <span>Total des votes: {getTotalVotes(poll)}</span>
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Temps réel' : '🔴 Hors ligne'}
          </span>
        </div>
      </div>

      <div className="poll-options">
        {poll.options.map((option: PollOption) => (
          <div key={option.id} className="poll-option">
            <div className="option-header">
              <label>
                <input
                  type="radio"
                  name="poll-option"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  disabled={hasVoted || !isActive(poll)}
                />
                {option.text}
              </label>
              <span className="vote-count">{option.vote_count} votes</span>
            </div>
            <div className="vote-bar">
              <div
                className="vote-progress"
                style={{ width: `${getPercentage(option.vote_count, getTotalVotes(poll))}%` }}
              />
              <span className="percentage">
                {getPercentage(option.vote_count, getTotalVotes(poll))}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="poll-actions">
        {!hasVoted && isActive(poll) && (
          <button
            onClick={handleVote}
            disabled={!selectedOption || isVoting}
            className="vote-button"
          >
            {isVoting ? 'Vote en cours...' : 'Voter'}
          </button>
        )}
        
        {hasVoted && (
          <div className="vote-success">✅ Votre vote a été enregistré</div>
        )}

        {!isActive(poll) && (
          <div className="poll-expired">⏰ Ce sondage a expiré</div>
        )}

        <button
          onClick={() => setShowQR(!showQR)}
          className="qr-button"
        >
          {showQR ? 'Masquer QR' : 'Afficher QR Code'}
        </button>
      </div>

      {showQR && (
        <div className="qr-code-container">
          <h3>Partager ce sondage</h3>
          <img
            src={pollService.getQRCode(pollId)}
            alt="QR Code du sondage"
            className="qr-code"
          />
          <p>Scannez ce QR code pour accéder au sondage</p>
        </div>
      )}
    </div>
  );
};

export default PollView;