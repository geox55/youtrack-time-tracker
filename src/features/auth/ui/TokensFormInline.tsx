import { TokensFormProps } from '../types';

export const TokensFormInline = ({ tokens, setTokens }: TokensFormProps) => {
  const handleChange = (field: keyof typeof tokens, value: string): void => {
    setTokens((prev: typeof tokens) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="tokens-form-inline">
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
        <label>YouTrack Token:</label>
        <input
          type="password"
          value={tokens.youtrackToken}
          onChange={(e) => handleChange('youtrackToken', e.target.value)}
          placeholder="Permanent Token из профиля"
        />
      </div>
    </div>
  );
};

