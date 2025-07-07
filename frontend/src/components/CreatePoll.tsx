import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pollService } from '../services/api';
import { CreatePollRequest } from '../types/poll';
import Loader from './Loader';

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
  const { t } = useTranslation();
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

    // Title validation
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = t('createPoll.form.title.required');
      isValid = false;
    } else if (trimmedTitle.length < 3) {
      errors.title = t('createPoll.form.title.minLength');
      isValid = false;
    } else if (trimmedTitle.length > 255) {
      errors.title = t('createPoll.form.title.maxLength');
      isValid = false;
    }

    // Description validation
    if (description.trim().length > 500) {
      errors.description = t('createPoll.form.description.maxLength');
      isValid = false;
    }

    // Options validation
    const validOptions = options.filter(opt => opt.trim() !== '');
    const optionErrors: string[] = [];
    
    if (validOptions.length < 2) {
      errors.general = t('createPoll.form.options.minOptions');
      isValid = false;
    } else if (validOptions.length > 10) {
      errors.general = t('createPoll.form.options.maxOptions');
      isValid = false;
    }

    // Validate each option
    options.forEach((option, index) => {
      const trimmedOption = option.trim();
      if (trimmedOption && trimmedOption.length > 255) {
        optionErrors[index] = t('createPoll.form.options.maxLength');
        isValid = false;
      }
    });

    // Check for duplicates
    const lowerCaseOptions = validOptions.map(opt => opt.trim().toLowerCase());
    const uniqueOptions = lowerCaseOptions.filter((option, index) => 
      lowerCaseOptions.indexOf(option) === index
    );
    if (lowerCaseOptions.length !== uniqueOptions.length) {
      errors.general = t('createPoll.form.options.duplicates');
      isValid = false;
    }

    if (optionErrors.length > 0) {
      errors.options = optionErrors;
    }

    // Expiration validation
    if (expiresIn) {
      const expirationValue = parseInt(expiresIn);
      if (isNaN(expirationValue) || expirationValue < 1) {
        errors.expiresIn = t('createPoll.form.expiration.min');
        isValid = false;
      } else if (expirationValue > 10080) {
        errors.expiresIn = t('createPoll.form.expiration.max');
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
      // Handle backend validation errors
      if (err.response?.data?.error) {
        const backendError = err.response.data.error;
        if (typeof backendError === 'object') {
          setValidationErrors(backendError);
        } else {
          setError(backendError);
        }
      } else {
        setError(t('createPoll.form.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          {t('createPoll.title')}
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {t('createPoll.subtitle')}
        </p>
      </div>

      {/* Main Form Card */}
      <div className="glass-card p-6 md:p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2h4a1 1 0 0 1 0 2h-1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6H3a1 1 0 0 1 0-2h4z" />
              </svg>
              {t('createPoll.form.title.label')} *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationErrors.title) {
                  setValidationErrors({ ...validationErrors, title: undefined });
                }
              }}
              className={`input-modern ${validationErrors.title ? 'border-red-500 bg-red-50' : ''}`}
              placeholder={t('createPoll.form.title.placeholder')}
              minLength={3}
              maxLength={255}
            />
            {validationErrors.title && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors.title}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {t('createPoll.form.description.label')}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (validationErrors.description) {
                  setValidationErrors({ ...validationErrors, description: undefined });
                }
              }}
              className={`textarea-modern h-24 ${validationErrors.description ? 'border-red-500 bg-red-50' : ''}`}
              placeholder={t('createPoll.form.description.placeholder')}
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <span className={`text-xs ${description.length > 450 ? 'text-amber-500' : description.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                {description.length}/500 {t('createPoll.form.description.counter')}
              </span>
            </div>
            {validationErrors.description && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors.description}
              </p>
            )}
          </div>

          {/* Options Section */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {t('createPoll.form.options.label')} * {t('createPoll.form.options.subtitle')}
            </label>
            
            <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 space-y-3 border border-gray-200">
              {options.map((option, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className={`input-modern ${validationErrors.options?.[index] ? 'border-red-500 bg-red-50' : ''}`}
                      placeholder={`${t('createPoll.form.options.placeholder')} ${index + 1}`}
                      maxLength={255}
                    />
                    {validationErrors.options?.[index] && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.options[index]}
                      </p>
                    )}
                  </div>
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="btn-animated flex-shrink-0 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              
              {options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="btn-animated w-full bg-gradient-to-r from-secondary-500 to-secondary-600 text-white py-3 px-4 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('createPoll.form.options.add')}
                </button>
              )}
            </div>
          </div>

          {/* Expiration Field */}
          <div className="space-y-2">
            <label htmlFor="expiresIn" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('createPoll.form.expiration.label')}
            </label>
            <input
              type="number"
              id="expiresIn"
              value={expiresIn}
              onChange={(e) => {
                setExpiresIn(e.target.value);
                if (validationErrors.expiresIn) {
                  setValidationErrors({ ...validationErrors, expiresIn: undefined });
                }
              }}
              className={`input-modern ${validationErrors.expiresIn ? 'border-red-500 bg-red-50' : ''}`}
              placeholder="60"
              min="1"
              max="10080"
            />
            <p className="text-xs text-gray-500">
              {t('createPoll.form.expiration.help')}
            </p>
            {validationErrors.expiresIn && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors.expiresIn}
              </p>
            )}
          </div>

          {/* Error Messages */}
          {validationErrors.general && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors.general}
              </div>
            </div>
          )}
          
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

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-animated w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader size="small" inline />
                  <span>{t('createPoll.form.creating')}</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>{t('createPoll.form.submit')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePoll;