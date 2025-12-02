import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMentions, type MentionUser } from './hooks/useMentions';

// Reserved mention types
const RESERVED_MENTIONS: MentionUser[] = [
  {
    id: 'everyone',
    username: 'everyone',
    display_name: 'Everyone',
    avatar_url: null,
  },
  {
    id: 'highlight',
    username: 'highlight',
    display_name: 'Highlight',
    avatar_url: null,
  },
];

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
        const query = textAfterAt.trim().toLowerCase();
        
        // Always show suggestions when @ is typed, prioritizing reserved mentions
        setShowSuggestions(true);
        setSelectedIndex(0);
        
        // If query is empty or matches reserved mentions, show reserved mentions first
        if (query.length === 0 || RESERVED_MENTIONS.some(m => m.username.startsWith(query))) {
          // Only search users if query doesn't match reserved mentions exactly
          if (query.length > 0 && !RESERVED_MENTIONS.some(m => m.username === query)) {
            searchUsers(query);
          } else {
            clearResults();
          }
        } else {
          // Query doesn't match reserved mentions, search for users
          searchUsers(query);
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

  // Get combined suggestions (reserved mentions first, then search results)
  const getSuggestions = (): MentionUser[] => {
    if (mentionStart === null) return [];
    
    // Get the current query from the value
    const textAfterAt = value.substring(mentionStart + 1);
    const spaceIndex = textAfterAt.indexOf(' ');
    const newlineIndex = textAfterAt.indexOf('\n');
    const endIndex = spaceIndex !== -1 && newlineIndex !== -1
      ? Math.min(spaceIndex, newlineIndex)
      : spaceIndex !== -1
        ? spaceIndex
        : newlineIndex !== -1
          ? newlineIndex
          : textAfterAt.length;
    const query = textAfterAt.substring(0, endIndex).trim().toLowerCase();
    
    // Filter reserved mentions based on query - always show if query is empty or matches
    const filteredReserved = RESERVED_MENTIONS.filter(m => 
      query.length === 0 || m.username.startsWith(query)
    );
    
    // Filter search results to exclude reserved usernames
    const filteredSearchResults = searchResults.filter(u => 
      u.username !== 'everyone' && u.username !== 'highlight'
    );
    
    // Always return reserved mentions first, then search results
    return [...filteredReserved, ...filteredSearchResults];
  };

  const handleKeyDown = (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
    const suggestions = getSuggestions();
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && (!multiline || e.shiftKey === false)) {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
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
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          style={{ top: '100%' }}
        >
          {isSearching && getSuggestions().length === 0 && (
            <div className="p-2 text-sm text-gray-500">Searching...</div>
          )}
          {(!isSearching || getSuggestions().length > 0) && getSuggestions().length > 0 && getSuggestions().map((user, index) => {
            const isReserved = user.id === 'everyone' || user.id === 'highlight';
            return (
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
                } ${isReserved ? 'bg-orange-50' : ''}`}
              >
                <Avatar className="w-8 h-8">
                  {user.avatar_url ? (
                    <AvatarImage src={user.avatar_url} alt={user.display_name || user.username} />
                  ) : (
                    <AvatarFallback className="bg-orange-500 text-white">
                      {(user.display_name || user.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-black">
                    {user.display_name || user.username}
                  </div>
                  <div className="text-xs text-gray-500">@{user.username}</div>
                </div>
                {isReserved && (
                  <span className="px-2 py-1 text-xs font-semibold text-white bg-orange-500 rounded">
                    Special
                  </span>
                )}
              </div>
            );
          })}
          {!isSearching && getSuggestions().length === 0 && (
            <div className="p-2 text-sm text-gray-500">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}

