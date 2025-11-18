import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMentions, type MentionUser } from './hooks/useMentions';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  onKeyDown?: (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => void;
  multiline?: boolean;
}

export function MentionInput({
  value,
  onChange,
  placeholder = 'Write something...',
  className = '',
  maxLength,
  onKeyDown,
  multiline = true,
}: MentionInputProps) {
  const { searchResults, isSearching, searchUsers, clearResults } = useMentions();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);

  const handleChange = (e: { target: { value: string; selectionStart: number | null } }) => {
    const newValue = e.target.value;
    onChange(newValue);

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's a space after @ (meaning mention is complete)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionStart(lastAtIndex);
        const query = textAfterAt.trim();
        if (query.length > 0) {
          searchUsers(query);
          setShowSuggestions(true);
          setSelectedIndex(0);
        } else {
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
        setMentionStart(null);
        clearResults();
      }
    } else {
      setShowSuggestions(false);
      setMentionStart(null);
      clearResults();
    }
  };

  const insertMention = (user: MentionUser) => {
    if (mentionStart === null) return;

    const currentValue = value;
    const beforeMention = currentValue.substring(0, mentionStart);
    // Find where the @ mention text ends (up to cursor or end of @text)
    const afterAt = currentValue.substring(mentionStart);
    const spaceIndex = afterAt.indexOf(' ');
    const newlineIndex = afterAt.indexOf('\n');
    const endIndex = spaceIndex !== -1 && newlineIndex !== -1 
      ? Math.min(spaceIndex, newlineIndex)
      : spaceIndex !== -1 
        ? spaceIndex 
        : newlineIndex !== -1 
          ? newlineIndex 
          : afterAt.length;
    const afterMention = currentValue.substring(mentionStart + endIndex);
    
    // Insert the mention with a space after
    const mentionText = `@${user.username} `;
    const newValue = beforeMention + mentionText + afterMention;

    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(null);
    clearResults();

    // Set cursor position after the mention
    setTimeout(() => {
      const element = textareaRef.current;
      if (element) {
        const newCursorPos = beforeMention.length + mentionText.length;
        element.setSelectionRange(newCursorPos, newCursorPos);
        element.focus();
      }
    }, 10);
  };

  const handleKeyDown = (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
    if (showSuggestions && searchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && (!multiline || e.shiftKey === false)) {
        e.preventDefault();
        insertMention(searchResults[selectedIndex]);
        return;
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        clearResults();
      }
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e: { target: HTMLTextAreaElement }) => {
            textareaRef.current = e.target;
            handleChange({ target: { value: e.target.value, selectionStart: e.target.selectionStart } });
          }}
          onKeyDown={(e: { key: string; shiftKey: boolean; preventDefault: () => void; currentTarget: HTMLTextAreaElement }) => {
            textareaRef.current = e.currentTarget;
            handleKeyDown(e);
          }}
          placeholder={placeholder}
          className={className}
          maxLength={maxLength}
        />
      ) : (
        <Input
          value={value}
          onChange={(e: { target: HTMLInputElement }) => {
            textareaRef.current = e.target;
            handleChange({ target: { value: e.target.value, selectionStart: e.target.selectionStart } });
          }}
          onKeyDown={(e: { key: string; shiftKey: boolean; preventDefault: () => void; currentTarget: HTMLInputElement }) => {
            textareaRef.current = e.currentTarget;
            handleKeyDown(e);
          }}
          placeholder={placeholder}
          className={className}
          maxLength={maxLength}
        />
      )}
      {showSuggestions && searchResults.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          style={{ top: '100%' }}
        >
          {isSearching && (
            <div className="p-2 text-sm text-gray-500">Searching...</div>
          )}
          {!isSearching && searchResults.map((user, index) => (
            <div
              key={user.id}
              onClick={(e: { preventDefault: () => void; stopPropagation: () => void }) => {
                e.preventDefault();
                e.stopPropagation();
                insertMention(user);
              }}
              onMouseDown={(e: { preventDefault: () => void }) => {
                e.preventDefault(); // Prevent input from losing focus
              }}
              className={`p-2 flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || user.username} />
                <AvatarFallback>
                  {(user.display_name || user.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-sm text-black">
                  {user.display_name || user.username}
                </div>
                <div className="text-xs text-gray-500">@{user.username}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

