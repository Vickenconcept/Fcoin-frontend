import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  Search,
  Loader2,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { useConversations, type Conversation } from '../hooks/useConversations';
import { useMessages, type Message } from '../hooks/useMessages';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export function MessagingSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationIdFromUrl = searchParams.get('conversation');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStartingNewChat, setIsStartingNewChat] = useState(false);
  const [newChatUserId, setNewChatUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { conversations, isLoading: conversationsLoading, reload: reloadConversations } = useConversations();
  const { messages, isLoading: messagesLoading, sendMessage, markAsRead } = useMessages(
    selectedConversation?.id || null,
    selectedConversation?.other_user.id,
  );

  // Handle conversation ID from URL (when coming from profile page)
  useEffect(() => {
    if (conversationIdFromUrl && !conversationsLoading) {
      const conversation = conversations.find((c) => c.id === conversationIdFromUrl);
      if (conversation) {
        setSelectedConversation(conversation);
        // Remove the query parameter after selecting
        setSearchParams({});
      } else if (conversations.length > 0) {
        // Conversation not found in list, might be new - reload to get it
        reloadConversations();
      }
    }
  }, [conversationIdFromUrl, conversations, conversationsLoading, setSearchParams, reloadConversations]);

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.other_user.username.toLowerCase().includes(query) ||
      conv.other_user.display_name?.toLowerCase().includes(query) ||
      ''
    );
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      markAsRead();
      reloadConversations();
    }
  }, [selectedConversation, markAsRead, reloadConversations]);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const success = await sendMessage(messageInput, selectedConversation.other_user.id);
    if (success) {
      setMessageInput('');
      inputRef.current?.focus();
      reloadConversations();
    }
  }, [messageInput, selectedConversation, sendMessage, reloadConversations]);

  const handleKeyPress = useCallback(
    (e: { key: string; shiftKey?: boolean; preventDefault: () => void }) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  const handleStartNewChat = useCallback(async (userId: string) => {
    setIsStartingNewChat(true);
    try {
      const response = await apiClient.request<{
        data: {
          id: string;
          other_user: {
            id: string;
            username: string;
            display_name: string;
            avatar_url: string | null;
          };
          created_at: string;
        };
      }>('/v1/conversations/find-or-create', {
        method: 'POST',
        body: { user_id: userId } as any,
      });

      if (response.ok && response.data) {
        const conversationData = (response.data as any)?.data || response.data;
        const conversationId = conversationData?.id;
        // Reload conversations to get the new one
        await reloadConversations();
        // Find and select the new conversation
        if (conversationId) {
          const newConv = conversations.find((c) => c.id === conversationId);
          if (newConv) {
            setSelectedConversation(newConv);
          }
        }
        setIsStartingNewChat(false);
        setNewChatUserId(null);
      } else {
        const errorMsg = response.errors?.[0]?.detail ?? 'Failed to start conversation';
        toast.error(errorMsg);
        setIsStartingNewChat(false);
      }
    } catch (err) {
      toast.error('Failed to start conversation');
      setIsStartingNewChat(false);
    }
  }, [conversations, reloadConversations]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-full gap-4">
      {/* Conversations List */}
      <Card className="w-80 flex flex-col p-0 bg-white shadow-md border border-slate-200">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Open user search modal - for now just show a placeholder
                toast('User search coming soon');
              }}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e: { target: { value: string } }) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {conversationsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-4 text-left transition-colors bg-white hover:bg-purple-50/50 ${
                    selectedConversation?.id === conversation.id ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.other_user.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(conversation.other_user.display_name || conversation.other_user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">
                          {conversation.other_user.display_name || conversation.other_user.username}
                        </p>
                        {conversation.latest_message && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.latest_message.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.latest_message?.body || 'No messages yet'}
                        </p>
                        {conversation.unread_count > 0 && (
                          <Badge variant="default" className="ml-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-sm">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col p-0 bg-white shadow-md border border-slate-200">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <button
              onClick={() => navigate(`/${selectedConversation.other_user.username}`)}
              className="w-full p-4 border-b border-slate-200 flex items-center gap-3 bg-white hover:bg-slate-50 transition-colors text-left"
            >
              <Avatar className="cursor-pointer">
                <AvatarImage
                  src={selectedConversation.other_user.avatar_url || undefined}
                />
                <AvatarFallback>
                  {getInitials(
                    selectedConversation.other_user.display_name ||
                      selectedConversation.other_user.username,
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  {selectedConversation.other_user.display_name ||
                    selectedConversation.other_user.username}
                </p>
                <p className="text-sm text-muted-foreground">
                  @{selectedConversation.other_user.username}
                </p>
              </div>
            </button>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-white">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.sender.id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                      >
                        {!isOwn && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.sender.avatar_url || undefined} />
                            <AvatarFallback>
                              {getInitials(message.sender.display_name || message.sender.username)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                          {!isOwn && (
                            <p className="text-xs text-muted-foreground mb-1 px-1">
                              {message.sender.display_name || message.sender.username}
                            </p>
                          )}
                          <div
                            className={`rounded-xl px-4 py-2.5 shadow-sm border ${
                              isOwn
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500/20'
                                : 'bg-white text-slate-900 border-slate-200'
                            }`}
                          >
                            <p className={`text-sm whitespace-pre-wrap break-words ${isOwn ? 'text-white' : 'text-slate-900'}`}>
                              {message.body}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5 px-1">
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e: { target: { value: string } }) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!messageInput.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white">
            <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
            <p className="text-sm text-muted-foreground">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

