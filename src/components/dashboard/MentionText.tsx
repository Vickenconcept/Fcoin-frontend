import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface MentionTextProps {
  text: string;
  className?: string;
}

export function MentionText({ text, className = '' }: MentionTextProps) {
  const navigate = useNavigate();

  const parts = useMemo(() => {
    // Split text by mentions (@username)
    const mentionRegex = /@([A-Za-z0-9_.]+)/g;
    const parts: Array<{ text: string; isMention: boolean }> = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, match.index),
          isMention: false,
        });
      }

      // Add mention
      parts.push({
        text: match[0], // Full match including @
        isMention: true,
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        isMention: false,
      });
    }

    return parts.length > 0 ? parts : [{ text, isMention: false }];
  }, [text]);

  const handleMentionClick = useCallback(
    (mention: string) => {
      const username = mention.replace(/^@/, '');
      if (!username) return;
      navigate(`/${username}`);
    },
    [navigate],
  );

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.isMention ? (
          <span
            key={index}
            className="text-blue-600 font-semibold hover:underline cursor-pointer"
            style={{ fontWeight: 600 }}
            onClick={() => handleMentionClick(part.text)}
          >
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  );
}

