import { Button, Input, Space } from 'antd';
import React, { useMemo, useState } from 'react';
import { toJsonString, validateJson } from '@/utils/json';

export interface JsonFieldEditorProps {
  /** Current value (can be string or object) */
  value?: any;
  /** Change callback */
  onChange?: (value: string) => void;
  /** Readonly mode */
  readonly?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * JSON field editor component with format/minify buttons
 */
const JsonFieldEditor: React.FC<JsonFieldEditorProps> = ({
  value,
  onChange,
  readonly = false,
  placeholder,
}) => {
  const [error, setError] = useState<string | null>(null);

  // Convert value to string for display (handle both object and string)
  const displayValue = useMemo(() => toJsonString(value), [value]);

  const handleChange = (newValue: string) => {
    const result = validateJson(newValue);
    setError(result.valid ? null : result.error || 'Invalid JSON');
    onChange?.(newValue);
  };

  const handleFormat = () => {
    try {
      const parsed =
        typeof displayValue === 'string' && displayValue.trim()
          ? JSON.parse(displayValue)
          : displayValue;
      const formatted = JSON.stringify(parsed, null, 2);
      setError(null);
      onChange?.(formatted);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleMinify = () => {
    try {
      const parsed =
        typeof displayValue === 'string' && displayValue.trim()
          ? JSON.parse(displayValue)
          : displayValue;
      const minified = JSON.stringify(parsed);
      setError(null);
      onChange?.(minified);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div>
      <Input.TextArea
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        readOnly={readonly}
        placeholder={placeholder || 'Enter JSON data...'}
        rows={6}
        style={{
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          fontSize: 12,
          borderColor: error ? '#ff4d4f' : undefined,
        }}
      />
      {error && (
        <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
          {error}
        </div>
      )}
      {!readonly && (
        <Space style={{ marginTop: 8 }}>
          <Button size="small" onClick={handleFormat}>
            Format
          </Button>
          <Button size="small" onClick={handleMinify}>
            Minify
          </Button>
        </Space>
      )}
    </div>
  );
};

export default JsonFieldEditor;
