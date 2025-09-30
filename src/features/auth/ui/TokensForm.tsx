import { useState } from 'react';
import { TokensFormProps } from '../types';

export const TokensForm = ({ tokens, setTokens }: TokensFormProps) => {

  const handleChange = (field: keyof typeof tokens, value: string): void => {
    setTokens((prev: typeof tokens) => ({ ...prev, [field]: value }));
  };

  const allFieldsFilled = Object.values(tokens).every((token) => (token as string).trim() !== '');
  const [isExpanded, setIsExpanded] = useState<boolean>(!allFieldsFilled);

  return (
    <div className="tokens-form">
      <button
        className="toggle-tokens"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        Настройки API {allFieldsFilled ? '✅' : '⚠️'}
      </button>

      {isExpanded && (
        <div className="tokens-fields">
          <div className="field">
            <label>Toggl API Token:</label>
            <input
              type="password"
              value={tokens.togglToken}
              onChange={(e) => handleChange('togglToken', e.target.value)}
              placeholder="Получить в профиле Toggl"
            />
          </div>

          <div className="field">
            <label>Toggl Workspace ID:</label>
            <input
              type="text"
              value={tokens.workspaceId}
              onChange={(e) => handleChange('workspaceId', e.target.value)}
              placeholder="ID рабочего пространства"
            />
          </div>

          <div className="field">
            <label>YouTrack Token:</label>
            <input
              type="password"
              value={tokens.youtrackToken}
              onChange={(e) => handleChange('youtrackToken', e.target.value)}
              placeholder="Permanent Token из профиля"
            />
          </div>
        </div>
      )}
    </div>
  );
};
