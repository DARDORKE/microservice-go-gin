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
  
  const { isConnected, lastMessage } = useWebSocket(pollId);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const pollData = await pollService.getPoll(pollId);
        setPoll(pollData);
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
            if (option.id === lastMessage.option_id) {
              return { ...option, votes: lastMessage.votes || option.votes };
            }
            return option;
          });

          return {
            ...prevPoll,
            options: updatedOptions,
            total_votes: lastMessage.total_votes || prevPoll.total_votes,
          };
        });
      }
    }
  }, [lastMessage, poll]);

  const handleVote = async () => {
    if (!selectedOption || !poll) return;

    setIsVoting(true);
    setError('');

    try {
      await pollService.vote(pollId, { option_id: selectedOption });
      setHasVoted(true);
    } catch (err) {
      setError('Erreur lors du vote');
    } finally {
      setIsVoting(false);
    }
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
          <span>Total des votes: {poll.total_votes}</span>
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
                  disabled={hasVoted || !poll.is_active}
                />
                {option.text}
              </label>
              <span className="vote-count">{option.votes} votes</span>
            </div>
            <div className="vote-bar">
              <div
                className="vote-progress"
                style={{ width: `${getPercentage(option.votes, poll.total_votes)}%` }}
              />
              <span className="percentage">
                {getPercentage(option.votes, poll.total_votes)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="poll-actions">
        {!hasVoted && poll.is_active && (
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

        {!poll.is_active && (
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