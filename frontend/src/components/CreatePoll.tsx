import React, { useState } from 'react';
import { pollService } from '../services/api';
import { CreatePollRequest } from '../types/poll';

interface CreatePollProps {
  onPollCreated: (pollId: string) => void;
}

const CreatePoll: React.FC<CreatePollProps> = ({ onPollCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [expiresAt, setExpiresAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const validOptions = options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        setError('Au moins 2 options sont requises');
        return;
      }

      const pollData: CreatePollRequest = {
        title: title.trim(),
        description: description.trim(),
        options: validOptions,
        expires_at: expiresAt || undefined,
      };

      const createdPoll = await pollService.createPoll(pollData);
      onPollCreated(createdPoll.id);
    } catch (err) {
      setError('Erreur lors de la création du sondage');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-poll">
      <h2>Créer un nouveau sondage</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Titre</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Titre du sondage"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description du sondage"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Options</label>
          {options.map((option, index) => (
            <div key={index} className="option-input">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                required
              />
              {options.length > 2 && (
                <button type="button" onClick={() => removeOption(index)}>
                  Supprimer
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addOption}>
            Ajouter une option
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="expiresAt">Date d'expiration (optionnel)</label>
          <input
            type="datetime-local"
            id="expiresAt"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Création...' : 'Créer le sondage'}
        </button>
      </form>
    </div>
  );
};

export default CreatePoll;