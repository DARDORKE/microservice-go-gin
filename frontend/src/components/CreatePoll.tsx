import React, { useState } from 'react';
import { pollService } from '../services/api';
import { CreatePollRequest } from '../types/poll';

interface ValidationErrors {
  title?: string;
  description?: string;
  options?: string[];
  expiresIn?: string;
  general?: string;
}

interface CreatePollProps {
  onPollCreated: (pollId: string) => void;
}

const CreatePoll: React.FC<CreatePollProps> = ({ onPollCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [expiresIn, setExpiresIn] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

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
    
    // Clear validation errors for this option when user starts typing
    if (validationErrors.options?.[index]) {
      const newErrors = { ...validationErrors };
      if (newErrors.options) {
        newErrors.options[index] = '';
        setValidationErrors(newErrors);
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validation du titre
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = 'Le titre est requis';
      isValid = false;
    } else if (trimmedTitle.length < 3) {
      errors.title = 'Le titre doit contenir au moins 3 caractères';
      isValid = false;
    } else if (trimmedTitle.length > 255) {
      errors.title = 'Le titre ne peut pas dépasser 255 caractères';
      isValid = false;
    }

    // Validation de la description
    if (description.trim().length > 500) {
      errors.description = 'La description ne peut pas dépasser 500 caractères';
      isValid = false;
    }

    // Validation des options
    const validOptions = options.filter(opt => opt.trim() !== '');
    const optionErrors: string[] = [];
    
    if (validOptions.length < 2) {
      errors.general = 'Au moins 2 options sont requises';
      isValid = false;
    } else if (validOptions.length > 10) {
      errors.general = 'Maximum 10 options autorisées';
      isValid = false;
    }

    // Validation de chaque option
    options.forEach((option, index) => {
      const trimmedOption = option.trim();
      if (trimmedOption && trimmedOption.length > 255) {
        optionErrors[index] = 'Une option ne peut pas dépasser 255 caractères';
        isValid = false;
      }
    });

    // Vérification des doublons
    const lowerCaseOptions = validOptions.map(opt => opt.trim().toLowerCase());
    const uniqueOptions = lowerCaseOptions.filter((option, index) => 
      lowerCaseOptions.indexOf(option) === index
    );
    if (lowerCaseOptions.length !== uniqueOptions.length) {
      errors.general = 'Les options dupliquées ne sont pas autorisées';
      isValid = false;
    }

    if (optionErrors.length > 0) {
      errors.options = optionErrors;
    }

    // Validation de l'expiration
    if (expiresIn) {
      const expirationValue = parseInt(expiresIn);
      if (isNaN(expirationValue) || expirationValue < 1) {
        errors.expiresIn = 'La durée d\'expiration doit être d\'au moins 1 minute';
        isValid = false;
      } else if (expirationValue > 10080) {
        errors.expiresIn = 'La durée d\'expiration ne peut pas dépasser 1 semaine (10080 minutes)';
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const validOptions = options.filter(opt => opt.trim() !== '');
      
      const pollData: CreatePollRequest = {
        title: title.trim(),
        description: description.trim(),
        options: validOptions,
        expires_in: expiresIn ? parseInt(expiresIn) : undefined,
      };

      const createdPoll = await pollService.createPoll(pollData);
      onPollCreated(createdPoll.id);
    } catch (err: any) {
      // Gérer les erreurs de validation du backend
      if (err.response?.data?.error) {
        const backendError = err.response.data.error;
        if (typeof backendError === 'object') {
          setValidationErrors(backendError);
        } else {
          setError(backendError);
        }
      } else {
        setError('Erreur lors de la création du sondage');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-poll">
      <div className="create-poll-header">
        <h2>Créer un nouveau sondage</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="create-poll-form">
        <div className="form-group">
          <label htmlFor="title">Titre *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              // Clear title validation error when user starts typing
              if (validationErrors.title) {
                setValidationErrors({ ...validationErrors, title: undefined });
              }
            }}
            className={validationErrors.title ? 'error' : ''}
            required
            placeholder="Titre du sondage"
            minLength={3}
            maxLength={255}
          />
          {validationErrors.title && (
            <span className="error-message">{validationErrors.title}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              // Clear description validation error when user starts typing
              if (validationErrors.description) {
                setValidationErrors({ ...validationErrors, description: undefined });
              }
            }}
            className={validationErrors.description ? 'error' : ''}
            placeholder="Description du sondage"
            rows={3}
            maxLength={500}
          />
          <small className={`char-count ${
            description.length > 450 ? 'warning' : ''
          } ${
            description.length > 500 ? 'error' : ''
          }`}>
            {description.length}/500 caractères
          </small>
          {validationErrors.description && (
            <span className="error-message">{validationErrors.description}</span>
          )}
        </div>

        <div className="form-group">
          <label>Options * (min 2, max 10)</label>
          <div className="options-container">
            {options.map((option, index) => (
              <div key={index} className="option-input">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className={validationErrors.options?.[index] ? 'error' : ''}
                  placeholder={`Option ${index + 1}`}
                  required
                  maxLength={255}
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(index)} className="remove-option">
                    Supprimer
                  </button>
                )}
                {validationErrors.options?.[index] && (
                  <span className="error-message">{validationErrors.options[index]}</span>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <button type="button" onClick={addOption} className="add-option-btn">
                Ajouter une option
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="expiresIn">Expiration en minutes (optionnel)</label>
          <input
            type="number"
            id="expiresIn"
            value={expiresIn}
            onChange={(e) => {
              setExpiresIn(e.target.value);
              // Clear expiration validation error when user starts typing
              if (validationErrors.expiresIn) {
                setValidationErrors({ ...validationErrors, expiresIn: undefined });
              }
            }}
            className={validationErrors.expiresIn ? 'error' : ''}
            placeholder="60"
            min="1"
            max="10080"
          />
          <small>Laissez vide pour un sondage sans expiration (max 1 semaine)</small>
          {validationErrors.expiresIn && (
            <span className="error-message">{validationErrors.expiresIn}</span>
          )}
        </div>

        {validationErrors.general && (
          <div className="error-message general-error">{validationErrors.general}</div>
        )}
        {error && <div className="error-message general-error">{error}</div>}

        <button type="submit" disabled={isLoading} className="submit-btn">
          {isLoading ? 'Création...' : 'Créer le sondage'}
        </button>
      </form>
    </div>
  );
};

export default CreatePoll;