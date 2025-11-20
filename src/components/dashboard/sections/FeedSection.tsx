import { useState, useRef, useEffect, useCallback, useMemo, MouseEvent as ReactMouseEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Heart,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Video,
  TrendingUp,
  Clock,
  Trash2,
  X,
  Upload,
  Bell,
  Link as LinkIcon,
} from 'lucide-react';
import { useFeed, type FeedPost, type FeedComment } from '../hooks/useFeed';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { MentionInput } from '../MentionInput';
import { MentionText } from '../MentionText';
import { NotificationPanel } from '../NotificationPanel';
import { useNotifications } from '../hooks/useNotifications';
import { ShareModal } from '../ShareModal';
import { FeedMediaGrid } from '../FeedMediaGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Users, Lock, Settings, Coins, ChevronDown, ChevronUp, ArrowRight, ArrowLeft, Check } from 'lucide-react';

export function FeedSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [composerOpen, setComposerOpen] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostVisibility, setNewPostVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [rewardEnabled, setRewardEnabled] = useState(false);
  const [rewardPool, setRewardPool] = useState<number>(0);
  const [rewardLikeAmount, setRewardLikeAmount] = useState<number>(1);
  const [rewardCommentAmount, setRewardCommentAmount] = useState<number>(2);
  const [rewardShareAmount, setRewardShareAmount] = useState<number>(3);
  const [rewardPerUserCap, setRewardPerUserCap] = useState<number>(10);
  const [rewardCoinSymbol, setRewardCoinSymbol] = useState<string>(
    (user?.default_coin_symbol ?? 'FCN').toUpperCase()
  );
  const [walletCoins, setWalletCoins] = useState<Array<{ coin_symbol: string; balance: number }>>([]);
  const [isWalletCoinsLoading, setIsWalletCoinsLoading] = useState(false);
  const [walletCoinsError, setWalletCoinsError] = useState<string | null>(null);
  const [rewardToggleLoading, setRewardToggleLoading] = useState<string | null>(null);
  const [postCreationStep, setPostCreationStep] = useState<1 | 2 | 3>(1);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [uploadedMedia, setUploadedMedia] = useState<Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail_url?: string;
    metadata?: Record<string, unknown>;
  }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [postDetailModalOpen, setPostDetailModalOpen] = useState(false);
  const [postDetailPost, setPostDetailPost] = useState<FeedPost | null>(null);
  const [postDetailComments, setPostDetailComments] = useState<FeedComment[]>([]);
  const [postDetailReplyingTo, setPostDetailReplyingTo] = useState<string | null>(null);
  const [postDetailReplyContent, setPostDetailReplyContent] = useState<Record<string, string>>({});
  const [postDetailNewComment, setPostDetailNewComment] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [postToShare, setPostToShare] = useState<FeedPost | null>(null);
  const { unreadCount } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedPostContent, setExpandedPostContent] = useState<Record<string, boolean>>({});

  const openUserProfile = useCallback(
    (username?: string | null) => {
      if (!username) return;
      navigate(`/${username}`);
    },
    [navigate],
  );

  // Check URL for post ID on mount
  useEffect(() => {
    const postId = searchParams.get('post');
    const commentId = searchParams.get('comment');
    if (postId) {
      handleOpenPostDetail(postId, commentId || undefined);
      // Clear URL params after opening
      setSearchParams({});
    }
  }, []);

  console.log('FeedSection: Component rendered', { userId: user?.id });

  const {
    posts,
    isLoading,
    isCreating,
    isLiking,
    isCommenting,
    isSharing,
    createPost,
    toggleLike,
    addComment,
    likeComment,
    sharePost,
    updatePost,
    deletePost,
    loadComments,
    loadPost,
    reload: reloadFeed,
  } = useFeed(sortBy);

  // Reload feed when user avatar changes
  useEffect(() => {
    if (user?.avatar_url) {
      reloadFeed(1);
    }
  }, [user?.avatar_url, reloadFeed]);

  console.log('FeedSection: Hook state', { 
    postsCount: posts.length, 
    isLoading,
    userId: user?.id 
  });

  const fetchWalletCoins = useCallback(async () => {
    setIsWalletCoinsLoading(true);
    setWalletCoinsError(null);
    try {
      const response = await apiClient.request<{
        coin_balances?: Array<{ coin_symbol?: string; balance?: number }>;
      }>('/v1/wallets/me', { method: 'GET' });

      if (response.ok && response.data) {
        const balances = Array.isArray(response.data.coin_balances)
          ? response.data.coin_balances
              .map((coin) => ({
                coin_symbol: String(coin.coin_symbol ?? '').toUpperCase(),
                balance: Number(coin.balance ?? 0) || 0,
              }))
              .filter((coin) => coin.coin_symbol)
          : [];

        setWalletCoins(balances);

        if (balances.length > 0) {
          const hasCurrent = balances.some((coin) => coin.coin_symbol === rewardCoinSymbol);
          if (!hasCurrent) {
            setRewardCoinSymbol(balances[0].coin_symbol);
          }
        }
      } else {
        setWalletCoinsError(response.errors?.[0]?.detail || 'Failed to load wallet coins');
      }
    } catch (error) {
      console.error('Failed to load wallet coins', error);
      setWalletCoinsError('Failed to load wallet coins');
    } finally {
      setIsWalletCoinsLoading(false);
    }
  }, [rewardCoinSymbol]);

  useEffect(() => {
    if (composerOpen) {
      fetchWalletCoins();
    }
  }, [composerOpen, fetchWalletCoins]);

  const selectedRewardCoinBalance = useMemo(() => {
    return walletCoins.find((coin) => coin.coin_symbol === rewardCoinSymbol)?.balance ?? 0;
  }, [walletCoins, rewardCoinSymbol]);

  const handleDisableRewards = useCallback(async (postId: string) => {
    setRewardToggleLoading(postId);
    try {
      const updated = await updatePost(postId, { reward_enabled: false });
      if (updated) {
        if (postDetailPost?.id === postId) {
          setPostDetailPost(updated);
        }
        toast.success('Rewards disabled for this post');
      }
    } catch (error) {
      console.error('Disable rewards error:', error);
      toast.error('Failed to disable rewards');
    } finally {
      setRewardToggleLoading(null);
    }
  }, [updatePost, postDetailPost]);

  const togglePostExpansion = useCallback((postId: string) => {
    setExpandedPostContent((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  }, []);

  const shouldClampContent = useCallback((content?: string | null) => {
    if (!content) return false;
    return content.trim().length > 220;
  }, []);

  const renderClampedContent = useCallback(
    (
      content: string,
      key: string,
      options: { textClass?: string; containerClass?: string } = {},
    ) => {
      const { textClass = 'text-black', containerClass = 'mb-4' } = options;
      const shouldClamp = shouldClampContent(content);
      const isExpanded = !!expandedPostContent[key];

      return (
        <div className={containerClass}>
          <MentionText
            text={content}
            className={`${textClass} whitespace-pre-wrap ${
              shouldClamp && !isExpanded ? 'line-clamp-3' : ''
            }`}
          />
          {shouldClamp && (
            <button
              type="button"
              className="mt-2 text-sm font-semibold text-orange-600 hover:text-orange-700 focus:outline-none"
              onClick={() => togglePostExpansion(key)}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      );
    },
    [expandedPostContent, shouldClampContent, togglePostExpansion],
  );


  const handleFileUpload = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;
    setIsUploading(true);
    setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

    console.log('Upload: Starting file upload', {
      fileName: file.name,
      fileSize: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
      fileType: file.type,
      fileId,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use XMLHttpRequest to track upload progress
      const response = await new Promise<{
        ok: boolean;
        data?: {
          type: 'image' | 'video';
          url: string;
          thumbnail_url?: string;
          metadata?: Record<string, unknown>;
        };
        errors?: Array<{ detail: string }>;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        // Use the same API base URL logic as apiClient
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? 'http://localhost:8000/api';
        const uploadUrl = `${API_BASE_URL}/v1/upload`;
        const token = apiClient.getToken();

        console.log('Upload: Request URL', { uploadUrl, hasToken: !!token });

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadProgress((prev) => ({ ...prev, [fileId]: percentComplete }));
            console.log('Upload: Progress', {
              fileName: file.name,
              loaded: e.loaded,
              total: e.total,
              percent: percentComplete,
            });
          }
        });

        xhr.addEventListener('load', () => {
          console.log('Upload: Response received', {
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText.substring(0, 500),
          });

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseData = JSON.parse(xhr.responseText);
              console.log('Upload: Parsed response data', responseData);
              
              if (!responseData.data) {
                console.error('Upload: No data in response', responseData);
                resolve({
                  ok: false,
                  errors: [{ detail: 'Upload response missing data' }],
                });
                return;
              }

              resolve({
                ok: true,
                data: responseData.data,
                errors: responseData.errors,
              });
            } catch (e) {
              console.error('Upload: Failed to parse JSON response', {
                error: e,
                responseText: xhr.responseText,
              });
              reject(new Error('Invalid JSON response'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              console.error('Upload: Error response', errorData);
              resolve({
                ok: false,
                errors: errorData.errors || [{ detail: `Upload failed: ${xhr.statusText} (${xhr.status})` }],
              });
            } catch (e) {
              console.error('Upload: Failed to parse error response', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText,
              });
              resolve({
                ok: false,
                errors: [{ detail: `Upload failed: ${xhr.statusText} (${xhr.status})` }],
              });
            }
          }
        });

        xhr.addEventListener('error', (e) => {
          console.error('Upload: Network error', e);
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          console.log('Upload: Aborted');
          reject(new Error('Upload aborted'));
        });

        xhr.open('POST', uploadUrl);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.send(formData);
      });

      if (response.ok && response.data) {
        console.log('Upload: File uploaded successfully', {
          fileName: file.name,
          type: response.data.type,
          url: response.data.url,
          thumbnail_url: response.data.thumbnail_url,
          metadata: response.data.metadata,
        });

        // Remove progress indicator first
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });

        // Add uploaded media
        const newMedia = {
          type: response.data.type,
          url: response.data.url,
          thumbnail_url: response.data.thumbnail_url,
          metadata: response.data.metadata,
        };

        console.log('Upload: Adding media to state', newMedia);
        setUploadedMedia((prev) => {
          const updated = [...prev, newMedia];
          console.log('Upload: Updated media state', updated);
          return updated;
        });

        toast.success(`${file.name} uploaded successfully`);
        return response.data;
      } else {
        console.error('Upload: Upload failed', {
          ok: response.ok,
          errors: response.errors,
          data: response.data,
        });
        toast.error(response.errors?.[0]?.detail || 'Failed to upload file');
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
        return null;
      }
    } catch (error) {
      console.error('Upload: Error during upload', {
        fileName: file.name,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to upload file');
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: { target: { files: FileList | null } }) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Upload files in parallel for better UX
    const uploadPromises: Promise<unknown>[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (uploadedMedia.length + uploadPromises.length >= 10) {
        toast.error('Maximum 10 files allowed');
        break;
      }
      uploadPromises.push(handleFileUpload(file));
    }
    
    // Wait for all uploads to complete
    await Promise.all(uploadPromises);
  };

  const removeMedia = (index: number) => {
    setUploadedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && uploadedMedia.length === 0) {
      toast.error('Please add some content or media');
      return;
    }

    // Validate reward pool if enabled
    if (rewardEnabled) {
      if (rewardPool <= 0) {
        toast.error('Please set a reward pool amount greater than 0');
        return;
      }
      if (!rewardCoinSymbol) {
        toast.error('Select which coin to use for rewards');
        return;
      }
      if (selectedRewardCoinBalance > 0 && rewardPool > selectedRewardCoinBalance) {
        toast.error(`You only have ${selectedRewardCoinBalance} ${rewardCoinSymbol} available.`);
        return;
      }
    }

    const result = await createPost({
      content: newPostContent.trim() || undefined,
      visibility: newPostVisibility,
      media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
      reward_enabled: rewardEnabled,
      reward_pool: rewardEnabled ? rewardPool : undefined,
      reward_coin_symbol: rewardEnabled ? rewardCoinSymbol : undefined,
      reward_rule: rewardEnabled ? {
        like: rewardLikeAmount,
        comment: rewardCommentAmount,
        share: rewardShareAmount,
        per_user_cap: rewardPerUserCap,
      } : undefined,
    });

    if (result) {
      setNewPostContent('');
      setNewPostVisibility('public');
      setRewardEnabled(false);
      setRewardPool(0);
      setRewardLikeAmount(1);
      setRewardCommentAmount(2);
                        setRewardShareAmount(3);
                        setRewardPerUserCap(10);
      setRewardCoinSymbol(
        (user?.default_coin_symbol ?? walletCoins[0]?.coin_symbol ?? 'FCN').toUpperCase()
      );
                        setPostCreationStep(1);
                        setUploadedMedia([]);
      setComposerOpen(false);
      setUploadProgress({});
    }
  };

  const handleOpenComments = async (post: FeedPost) => {
    setSelectedPost(post);
    setCommentModalOpen(true);
    const loadedComments = await loadComments(post.id);
    setComments(loadedComments);
  };

  const handleOpenPostDetail = async (postId: string, commentId?: string) => {
    const post = await loadPost(postId);
    if (post) {
      setPostDetailPost(post);
      setPostDetailModalOpen(true);
      // Update URL with post ID for shareable link
      if (commentId) {
        setSearchParams({ post: postId, comment: commentId });
      } else {
        setSearchParams({ post: postId });
      }
      const comments = await loadComments(postId);
      if (comments) {
        // Ensure replies array is always present
        const commentsWithReplies = comments.map(comment => ({
          ...comment,
          replies: comment.replies || []
        }));
        setPostDetailComments(commentsWithReplies);
        // Scroll to specific comment if commentId is provided
        if (commentId) {
          setTimeout(() => {
            const commentElement = document.getElementById(`comment-${commentId}`);
            if (commentElement) {
              commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              commentElement.classList.add('ring-2', 'ring-orange-500', 'rounded-lg', 'p-2');
              setTimeout(() => {
                commentElement.classList.remove('ring-2', 'ring-orange-500');
              }, 2000);
            }
          }, 300);
        }
      }
    }
  };

  // Close modal and clear URL
  const handleClosePostDetail = () => {
    setPostDetailModalOpen(false);
    setPostDetailPost(null);
    setPostDetailComments([]);
    setPostDetailReplyingTo(null);
    setPostDetailReplyContent({});
    setPostDetailNewComment('');
    setSearchParams({});
  };

  const handleSubmitComment = async (parentId?: string) => {
    if (!selectedPost) return;
    
    const content = parentId ? (replyContent[parentId] || '').trim() : newComment.trim();
    if (!content) return;

    const result = await addComment(selectedPost.id, content, parentId);
    if (result) {
      if (parentId) {
        setReplyContent((prev) => ({ ...prev, [parentId]: '' }));
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
      const loadedComments = await loadComments(selectedPost.id);
      setComments(loadedComments);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!selectedPost) return;
    
    const result = await likeComment(selectedPost.id, commentId);
    if (result) {
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              is_liked: result.liked,
              likes_count: result.likes_count,
            };
          }
          // Also update in replies
          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === commentId
                ? {
                    ...reply,
                    is_liked: result.liked,
                    likes_count: result.likes_count,
                  }
                : reply
            ),
          };
        })
      );
    }
  };

  const handlePostDetailSubmitComment = async (parentId?: string) => {
    if (!postDetailPost) return;
    
    const content = parentId ? (postDetailReplyContent[parentId] || '').trim() : postDetailNewComment.trim();
    if (!content) return;

    const result = await addComment(postDetailPost.id, content, parentId);
    if (result) {
      if (parentId) {
        setPostDetailReplyContent((prev) => ({ ...prev, [parentId]: '' }));
        setPostDetailReplyingTo(null);
      } else {
        setPostDetailNewComment('');
      }
      // Reload comments
      const loadedComments = await loadComments(postDetailPost.id);
      if (loadedComments) {
        // Ensure replies array is always present
        const commentsWithReplies = loadedComments.map(comment => ({
          ...comment,
          replies: comment.replies || []
        }));
        setPostDetailComments(commentsWithReplies);
      }
      // Update post comments count (only for top-level comments, not replies)
      if (!parentId) {
        setPostDetailPost((prev) =>
          prev
            ? {
                ...prev,
                comments_count: prev.comments_count + 1,
              }
            : null
        );
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex gap-6">
      {/* Main Feed Content - Left Side */}
      <div className="flex-1 space-y-6">
        {/* Sort Tabs */}
        <Tabs value={sortBy} onValueChange={(v: string) => setSortBy(v as 'newest' | 'popular')}>
          <TabsList>
            <TabsTrigger value="newest">
              <Clock className="w-4 h-4 mr-2" />
              Newest
            </TabsTrigger>
            <TabsTrigger value="popular">
              <TrendingUp className="w-4 h-4 mr-2" />
              Popular
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Feed Posts */}
        <div className="space-y-4">
          {isLoading && posts.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 text-lg mb-2">No posts yet</p>
            <p className="text-gray-400 text-sm">
              Start following creators to see their posts, or create your own!
            </p>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="p-6 bg-white overflow-visible relative z-0">
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    className="cursor-pointer"
                    onClick={() => openUserProfile(post.user.username)}
                  >
                    <AvatarImage
                      src={post.user.avatar_url || undefined}
                      alt={post.user.display_name || post.user.username}
                    />
                    <AvatarFallback>
                      {(post.user.display_name || post.user.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openUserProfile(post.user.username)}
                        className="font-semibold text-black hover:underline text-left"
                      >
                        {post.user.display_name || post.user.username}
                      </button>
                      {post.user.verified_creator && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{formatTime(post.created_at)}</span>
                      {/* Visibility Badge */}
                      {post.visibility === 'public' && (
                        <Badge variant="outline" className="text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      )}
                      {post.visibility === 'followers' && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          Followers
                        </Badge>
                      )}
                      {post.visibility === 'private' && (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="w-3 h-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {/* Edit Visibility Button (only for post owner) */}
                {user && post.user && String(post.user.id) === String(user.id) && (
                  <Select
                    value={post.visibility}
                    onValueChange={async (value: 'public' | 'followers' | 'private') => {
                      const result = await updatePost(post.id, { visibility: value });
                      if (result) {
                        toast.success('Visibility updated');
                      }
                    }}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <Settings className="w-3 h-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <span>Public</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="followers">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Followers Only</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          <span>Private</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Share Header - if this is a shared post */}
              {post.shared_post && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Share2 className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-semibold text-black">
                      {post.user.display_name || post.user.username} shared a post
                    </span>
                  </div>
                  {post.content &&
                    renderClampedContent(post.content, `${post.id}-share-note`, {
                      textClass: 'text-sm text-gray-700',
                      containerClass: 'mb-2',
                    })}
                </div>
              )}

              {/* Post Content */}
              {post.shared_post ? (
                // Show shared post content in an embedded card
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar
                      className="cursor-pointer"
                      onClick={() => openUserProfile(post.shared_post!.user.username)}
                    >
                      <AvatarImage
                        src={post.shared_post!.user.avatar_url || undefined}
                        alt={post.shared_post!.user.display_name || post.shared_post!.user.username}
                      />
                      <AvatarFallback>
                        {(post.shared_post!.user.display_name || post.shared_post!.user.username)
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openUserProfile(post.shared_post!.user.username)}
                          className="font-semibold text-black hover:underline text-left"
                        >
                          {post.shared_post!.user.display_name || post.shared_post!.user.username}
                        </button>
                        {post.shared_post!.user.verified_creator && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatTime(post.shared_post!.created_at)}
                      </span>
                    </div>
                  </div>
                  {post.shared_post.content &&
                    renderClampedContent(post.shared_post.content, `shared-${post.shared_post.id}`)}
                  {post.shared_post!.media.length > 0 && (
                    <FeedMediaGrid
                      media={post.shared_post!.media}
                      onOpen={() => handleOpenPostDetail(post.shared_post!.id)}
                    />
                  )}
                </div>
              ) : (
                <>
                  {/* Regular post content */}
                  {post.content && renderClampedContent(post.content, `post-${post.id}`)}

                  {/* Post Media */}
                  {post.media.length > 0 && (
                    <FeedMediaGrid
                      media={post.media}
                      onOpen={() => handleOpenPostDetail(post.id)}
                    />
                  )}
                </>
              )}

              {/* Post Actions */}
              <div className="flex items-center gap-6 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLike(post.id)}
                  disabled={isLiking === post.id}
                  className={post.is_liked ? 'text-red-500' : 'text-gray-600'}
                >
                  <Heart
                    className={`w-5 h-5 mr-2 ${post.is_liked ? 'fill-current' : ''}`}
                  />
                  {post.likes_count}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenComments(post)}
                  className="text-gray-600"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {post.comments_count}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPostToShare(post);
                    setShareModalOpen(true);
                  }}
                  className="text-gray-600"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  {post.shares_count}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Post link copied to clipboard!');
                  }}
                  className="text-gray-600"
                  title="Copy post link"
                >
                  <LinkIcon className="w-5 h-5 mr-2" />
                </Button>
                {post.reward_enabled && post.user.id === user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisableRewards(post.id)}
                    disabled={rewardToggleLoading === post.id}
                    className="text-gray-600"
                    title="Disable rewards for this post"
                  >
                    <Coins className="w-5 h-5 mr-2" />
                    {rewardToggleLoading === post.id ? 'Disabling...' : 'Disable rewards'}
                  </Button>
                )}
                {user && post.user && String(post.user.id) === String(user.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this post?')) {
                        deletePost(post.id);
                      }
                    }}
                    className="text-red-600"
                    title="Delete post"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                  </Button>
                )}
                {post.reward_enabled && (
                  <Badge className="ml-auto bg-orange-100 text-orange-700">
                    💰 {post.reward_pool} {post.reward_coin_symbol ?? 'coins'}
                  </Badge>
                )}
              </div>
            </Card>
          ))
          )}
        </div>
      </div>

      {/* Right Sidebar - Fixed */}
      <div className="w-80 flex-shrink-0">
        <Card className="sticky top-6 p-6 space-y-6 bg-white">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-black">Feed</h2>
            <p className="text-sm text-gray-600 mt-1">See what's happening in your community</p>
          </div>

          {/* Notification Bell */}
          <div>
            <Button
              variant="outline"
              className="w-full justify-start relative"
              onClick={() => setNotificationPanelOpen(true)}
            >
              <Bell className="w-5 h-5 mr-2" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge className="ml-auto bg-orange-500 text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Create Post Button */}
          <Dialog open={composerOpen} onOpenChange={(open: boolean) => {
            setComposerOpen(open);
            if (!open) {
              // Reset all state when closing
              setNewPostContent('');
              setNewPostVisibility('public');
              setRewardEnabled(false);
              setRewardPool(0);
              setRewardLikeAmount(1);
              setRewardCommentAmount(2);
              setRewardShareAmount(3);
              setRewardPerUserCap(10);
              setRewardCoinSymbol(
                (user?.default_coin_symbol ?? walletCoins[0]?.coin_symbol ?? 'FCN').toUpperCase()
              );
              setPostCreationStep(1);
              setUploadedMedia([]);
              setUploadProgress({});
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className={`flex items-center gap-2 ${postCreationStep >= 1 ? 'text-orange-500' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${postCreationStep >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {postCreationStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                    </div>
                    <span className="text-sm font-medium">Content</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className={`flex items-center gap-2 ${postCreationStep >= 2 ? 'text-orange-500' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${postCreationStep >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {postCreationStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                    </div>
                    <span className="text-sm font-medium">Settings</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className={`flex items-center gap-2 ${postCreationStep >= 3 ? 'text-orange-500' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${postCreationStep >= 3 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      3
                    </div>
                    <span className="text-sm font-medium">Review</span>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4 min-h-[400px]">
                {/* Step 1: Content & Media */}
                {postCreationStep === 1 && (
                  <div className="space-y-4">
                    <MentionInput
                      value={newPostContent}
                      onChange={setNewPostContent}
                      placeholder="What's on your mind? Type @ to mention someone..."
                      className="min-h-[200px]"
                      maxLength={5000}
                    />
                    
                    {/* File Upload */}
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || uploadedMedia.length >= 10}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploading ? 'Uploading...' : 'Upload Images/Video'}
                        {uploadedMedia.length > 0 && ` (${uploadedMedia.length}/10)`}
                      </Button>

                      {/* Media Previews */}
                      {(uploadedMedia.length > 0 || Object.keys(uploadProgress).length > 0) && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {/* Show uploaded media */}
                          {uploadedMedia.map((media, index) => (
                            <div key={`uploaded-${index}-${media.url}`} className="relative group">
                              {media.type === 'image' ? (
                                <div className="relative w-full h-32 rounded-lg border overflow-hidden bg-gray-100">
                                  <img
                                    src={media.url}
                                    alt={`Upload ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e: { currentTarget: HTMLImageElement }) => {
                                      console.error('Image load error', {
                                        url: media.url,
                                        index,
                                        media,
                                      });
                                      const target = e.currentTarget;
                                      target.style.display = 'none';
                                      // Show error placeholder
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `
                                          <div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                            <svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p class="text-xs">Failed to load</p>
                                          </div>
                                        `;
                                      }
                                    }}
                                    onLoad={() => {
                                      console.log('Image loaded successfully', {
                                        url: media.url,
                                        index,
                                      });
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="relative w-full h-32 rounded-lg border bg-gray-100 flex items-center justify-center overflow-hidden">
                                  {media.thumbnail_url ? (
                                    <>
                                      <img
                                        src={media.thumbnail_url}
                                        alt="Video thumbnail"
                                        className="w-full h-full object-cover rounded-lg"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <Video className="w-8 h-8 text-white" />
                                      </div>
                                    </>
                                  ) : (
                                    <Video className="w-8 h-8 text-gray-400" />
                                  )}
                                </div>
                              )}
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 z-10"
                                onClick={() => removeMedia(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          
                          {/* Show uploading files with progress */}
                          {Object.entries(uploadProgress).map(([fileId, progress]) => (
                            <div key={fileId} className="relative w-full h-32 rounded-lg border bg-gray-100 flex flex-col items-center justify-center">
                              <Upload className="w-8 h-8 text-gray-400 mb-2 animate-pulse" />
                              <div className="w-full px-2">
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                  <div
                                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-600 text-center">
                                  {progress}% uploading...
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        {newPostContent.length}/5000 characters
                        {uploadedMedia.length > 0 && ` • ${uploadedMedia.length} media file(s)`}
                      </div>
                      <Button
                        onClick={() => {
                          if (!newPostContent.trim() && uploadedMedia.length === 0) {
                            toast.error('Please add some content or media');
                            return;
                          }
                          setPostCreationStep(2);
                        }}
                        disabled={isUploading}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Visibility & Rewards */}
                {postCreationStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-black">Post Settings</h3>
                    
                    {/* Visibility Selector */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Visibility</label>
                      <Select value={newPostVisibility} onValueChange={(value: 'public' | 'followers' | 'private') => setNewPostVisibility(value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              <span>Public - Everyone can see this post</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="followers">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>Followers Only - Only your followers can see</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              <span>Private - Only you can see</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Reward Toggle */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Coins className="w-4 h-4" />
                            Enable Rewards
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Allow users to earn coins for engaging with this post
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant={rewardEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (!walletCoins.length) {
                              toast.error('Launch a creator coin before enabling rewards.');
                              return;
                            }
                            setRewardEnabled(!rewardEnabled);
                          }}
                          disabled={walletCoins.length === 0 && !rewardEnabled}
                          className={rewardEnabled ? "bg-orange-500 hover:bg-orange-600" : ""}
                        >
                          {rewardEnabled ? "Yes" : "No"}
                        </Button>
                      </div>
                      {walletCoins.length === 0 && (
                        <p className="text-xs text-red-500">
                          You need to launch a creator coin and have balance before you can enable rewards.
                        </p>
                      )}

                      {/* Reward Configuration */}
                      {rewardEnabled && (
                        <div className="space-y-4 pt-4 border-t">
                          {/* Reward Coin Selection */}
                          <div>
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Reward Coin
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={fetchWalletCoins}
                                disabled={isWalletCoinsLoading}
                              >
                                {isWalletCoinsLoading ? 'Refreshing...' : 'Refresh'}
                              </Button>
                            </div>
                            {walletCoins.length > 0 ? (
                              <Select value={rewardCoinSymbol} onValueChange={(value: string) => setRewardCoinSymbol(value)}>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {walletCoins.map((coin) => (
                                    <SelectItem key={coin.coin_symbol} value={coin.coin_symbol}>
                                      <div className="flex items-center justify-between w-full">
                                        <span>{coin.coin_symbol}</span>
                                        <span className="text-xs text-gray-500">{coin.balance} available</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="rounded-md border border-dashed border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                                No coins found. Launch a creator coin first.
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                              <span>
                                Available: {selectedRewardCoinBalance} {rewardCoinSymbol}
                              </span>
                              {walletCoinsError && (
                                <span className="text-red-500">{walletCoinsError}</span>
                              )}
                            </div>
                          </div>

                          {/* Reward Pool */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              Total Reward Pool (coins)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={rewardPool}
                              onChange={(e: { target: { value: string } }) => setRewardPool(parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Total coins you're willing to spend on this post
                            </p>
                          </div>

                          {/* Per-Action Rewards */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Reward Amounts</label>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Like</label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={rewardLikeAmount}
                                  onChange={(e: { target: { value: string } }) => setRewardLikeAmount(parseFloat(e.target.value) || 0)}
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Comment</label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={rewardCommentAmount}
                                  onChange={(e: { target: { value: string } }) => setRewardCommentAmount(parseFloat(e.target.value) || 0)}
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 mb-1 block">Share</label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={rewardShareAmount}
                                  onChange={(e: { target: { value: string } }) => setRewardShareAmount(parseFloat(e.target.value) || 0)}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Per-User Cap */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              Max Coins Per User
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={rewardPerUserCap}
                              onChange={(e: { target: { value: string } }) => setRewardPerUserCap(parseFloat(e.target.value) || 0)}
                              placeholder="10"
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Maximum coins a single user can earn from this post
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setPostCreationStep(1)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        onClick={() => {
                          if (rewardEnabled) {
                            if (!rewardCoinSymbol) {
                              toast.error('Select a reward coin before continuing.');
                              return;
                            }
                            if (walletCoins.length === 0) {
                              toast.error('You need at least one creator coin to fund rewards.');
                              return;
                            }
                            if (selectedRewardCoinBalance > 0 && rewardPool > selectedRewardCoinBalance) {
                              toast.error(`You only have ${selectedRewardCoinBalance} ${rewardCoinSymbol} available.`);
                              return;
                            }
                          }
                          setPostCreationStep(3);
                        }}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Post */}
                {postCreationStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-black">Review Your Post</h3>
                    
                    {/* Content Preview */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Content:</span>
                        {newPostContent ? (
                          <p className="text-sm text-gray-900 flex-1">{newPostContent.substring(0, 100)}{newPostContent.length > 100 ? '...' : ''}</p>
                        ) : (
                          <span className="text-sm text-gray-400 italic">No text content</span>
                        )}
                      </div>
                      {uploadedMedia.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-medium text-gray-700">Media:</span>
                          <span className="text-sm text-gray-600">{uploadedMedia.length} file(s)</span>
                        </div>
                      )}
                    </div>

                    {/* Settings Preview */}
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Visibility:</span>
                        <Badge variant="outline">
                          {newPostVisibility === 'public' && <><Globe className="w-3 h-3 mr-1" />Public</>}
                          {newPostVisibility === 'followers' && <><Users className="w-3 h-3 mr-1" />Followers Only</>}
                          {newPostVisibility === 'private' && <><Lock className="w-3 h-3 mr-1" />Private</>}
                        </Badge>
                      </div>
                      {rewardEnabled && (
                        <div className="pt-2 border-t space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Rewards:</span>
                            <Badge className="bg-orange-100 text-orange-700">
                              <Coins className="w-3 h-3 mr-1" />
                              Enabled
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>Pool: {rewardPool} {rewardCoinSymbol}</p>
                            <p>Like: {rewardLikeAmount} | Comment: {rewardCommentAmount} | Share: {rewardShareAmount}</p>
                            <p>Max per user: {rewardPerUserCap} {rewardCoinSymbol}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setPostCreationStep(2)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setComposerOpen(false);
                            setNewPostContent('');
                            setNewPostVisibility('public');
                            setRewardEnabled(false);
                            setRewardPool(0);
                            setRewardLikeAmount(1);
                            setRewardCommentAmount(2);
                            setRewardShareAmount(3);
                            setRewardPerUserCap(10);
                            setRewardCoinSymbol(
                              (user?.default_coin_symbol ?? walletCoins[0]?.coin_symbol ?? 'FCN').toUpperCase()
                            );
                            setPostCreationStep(1);
                            setUploadedMedia([]);
                            setUploadProgress({});
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreatePost}
                          disabled={(!newPostContent.trim() && uploadedMedia.length === 0) || isCreating || isUploading}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          {isCreating ? 'Posting...' : 'Post'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </div>

      {/* Comments Modal */}
      <Dialog open={commentModalOpen} onOpenChange={setCommentModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-white">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="space-y-3">
                  {/* Main Comment */}
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarImage
                        src={comment.user.avatar_url || undefined}
                        alt={comment.user.display_name || comment.user.username}
                      />
                      <AvatarFallback>
                        {(comment.user.display_name || comment.user.username)
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            type="button"
                            onClick={() => openUserProfile(comment.user.username)}
                            className="font-semibold text-sm text-black hover:underline text-left"
                          >
                            {comment.user.display_name || comment.user.username}
                          </button>
                          <span className="text-xs text-gray-500">
                            {formatTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-black mb-2">
                          <MentionText text={comment.content} />
                        </p>
                      </div>
                      {/* Comment Actions */}
                      <div className="flex items-center gap-4 mt-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikeComment(comment.id)}
                          className={`text-xs h-6 px-2 ${comment.is_liked ? 'text-red-500' : 'text-gray-600'}`}
                        >
                          <Heart
                            className={`w-3 h-3 mr-1 ${comment.is_liked ? 'fill-current' : ''}`}
                          />
                          {comment.likes_count > 0 && comment.likes_count}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="text-xs h-6 px-2 text-gray-600"
                        >
                          Reply
                        </Button>
                      </div>
                      
                      {/* Reply Input */}
                      {replyingTo === comment.id && (
                        <div className="ml-11 mt-2 flex gap-2">
                          <MentionInput
                            value={replyContent[comment.id] || ''}
                            onChange={(value) =>
                              setReplyContent((prev) => ({ ...prev, [comment.id]: value }))
                            }
                            placeholder="Write a reply... Type @ to mention someone"
                            onKeyDown={(e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitComment(comment.id);
                              }
                            }}
                            className="flex-1 text-sm h-8"
                            multiline={false}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSubmitComment(comment.id)}
                            disabled={!replyContent[comment.id]?.trim() || isCommenting === selectedPost?.id}
                            className="bg-orange-500 hover:bg-orange-600 h-8 text-xs"
                          >
                            Reply
                          </Button>
                        </div>
                      )}

                      {/* Nested Replies */}
                      {comment.replies.length > 0 && (
                        <div className="ml-11 mt-2 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-2">
                              <Avatar className="w-7 h-7">
                                <AvatarImage
                                  src={reply.user.avatar_url || undefined}
                                  alt={reply.user.display_name || reply.user.username}
                                />
                                <AvatarFallback className="text-xs">
                                  {(reply.user.display_name || reply.user.username)
                                    .charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-gray-100 rounded-lg p-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <button
                                      type="button"
                                      onClick={() => openUserProfile(reply.user.username)}
                                      className="font-semibold text-xs text-black hover:underline text-left"
                                    >
                                      {reply.user.display_name || reply.user.username}
                                    </button>
                                    <span className="text-xs text-gray-500">
                                      {formatTime(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-black">
                                    <MentionText text={reply.content} />
                                  </p>
                                </div>
                                {/* Reply Actions */}
                                <div className="flex items-center gap-4 mt-1 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleLikeComment(reply.id)}
                                    className={`text-xs h-6 px-2 ${reply.is_liked ? 'text-red-500' : 'text-gray-600'}`}
                                  >
                                    <Heart
                                      className={`w-3 h-3 mr-1 ${reply.is_liked ? 'fill-current' : ''}`}
                                    />
                                    {reply.likes_count > 0 && reply.likes_count}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                                    className="text-xs h-6 px-2 text-gray-600"
                                  >
                                    Reply
                                  </Button>
                                </div>
                                
                                {/* Reply to Reply Input */}
                                {replyingTo === reply.id && (
                                  <div className="ml-11 mt-2 flex gap-2">
                                    <MentionInput
                                      value={replyContent[reply.id] || ''}
                                      onChange={(value) =>
                                        setReplyContent((prev) => ({ ...prev, [reply.id]: value }))
                                      }
                                      placeholder="Write a reply... Type @ to mention someone"
                                      onKeyDown={(e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleSubmitComment(comment.id);
                                        }
                                      }}
                                      className="flex-1 text-sm h-8"
                                      multiline={false}
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleSubmitComment(comment.id)}
                                      disabled={!replyContent[reply.id]?.trim() || isCommenting === selectedPost?.id}
                                      className="bg-orange-500 hover:bg-orange-600 h-8 text-xs"
                                    >
                                      Reply
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <MentionInput
              value={newComment}
              onChange={(value) => {
                // console.log('MentionInput onChange', value, 'length:', value.length);
                setNewComment(value);
              }}
              placeholder="Write a comment... Type @ to mention someone"
              onKeyDown={(e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  console.log('Enter key pressed in comment input', { newComment });
                  handleSubmitComment();
                }
              }}
              className="flex-1"
              multiline={false}
            />
            <Button
              type="button"
              onClick={(e: { preventDefault: () => void; stopPropagation: () => void }) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Post button clicked', { 
                  newComment, 
                  newCommentTrimmed: newComment.trim(),
                  selectedPost: selectedPost?.id,
                  isCommenting,
                  isDisabled: !newComment.trim() || isCommenting === selectedPost?.id
                });
                handleSubmitComment();
              }}
              disabled={!newComment.trim() || isCommenting === selectedPost?.id}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCommenting === selectedPost?.id ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
        onPostClick={handleOpenPostDetail}
      />

      {/* Share Modal */}
      {postToShare && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setPostToShare(null);
          }}
          post={postToShare}
          onShareToTimeline={async (comment?: string) => {
            const result = await sharePost(postToShare.id, comment, true);
            if (result) {
              // Post will be added to feed automatically by sharePost
            }
          }}
        />
      )}

      {/* Post Detail Modal */}
      <Dialog open={postDetailModalOpen} onOpenChange={(open: boolean) => {
        if (!open) {
          handleClosePostDetail();
        } else {
          setPostDetailModalOpen(true);
        }
      }}>
        <DialogContent className="!max-w-[95vw] sm:!max-w-[90vw] md:!max-w-[90vw] lg:!max-w-[75vw] w-full max-h-[85vh] flex flex-col bg-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Post</DialogTitle>
              {postDetailPost && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}?post=${postDetailPost.id}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Post link copied to clipboard!');
                  }}
                  className="text-xs"
                >
                  <LinkIcon className="w-4 h-4 mr-1" />
                  Copy Link
                </Button>
              )}
            </div>
          </DialogHeader>
          {postDetailPost && (
            <div className="flex-1 flex gap-8 overflow-hidden">
              {/* Left Column - Post Content */}
              <div className="w-[45%] flex-shrink-0 overflow-y-auto pr-4">
                <Card className="p-6">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={postDetailPost.user.avatar_url || undefined}
                        alt={postDetailPost.user.display_name || postDetailPost.user.username}
                      />
                      <AvatarFallback>
                        {(postDetailPost.user.display_name || postDetailPost.user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-black">
                          {postDetailPost.user.display_name || postDetailPost.user.username}
                        </span>
                        {postDetailPost.user.verified_creator && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{formatTime(postDetailPost.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                {postDetailPost.content && (
                  <p className="text-black mb-4 whitespace-pre-wrap">
                    <MentionText text={postDetailPost.content} />
                  </p>
                )}

                {/* Post Media */}
                {postDetailPost.media.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {postDetailPost.media.map((media) => (
                      <div key={media.id} className="rounded-lg overflow-hidden">
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt="Post media"
                            className="w-full max-h-96 object-cover"
                          />
                        ) : (
                          <div className="relative">
                            <video
                              src={media.url}
                              controls
                              className="w-full max-h-96"
                              poster={media.thumbnail_url || undefined}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center gap-6 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const result = await toggleLike(postDetailPost.id);
                      if (result) {
                        setPostDetailPost((prev) =>
                          prev
                            ? {
                                ...prev,
                                is_liked: result.liked,
                                likes_count: result.likes_count,
                              }
                            : null
                        );
                      }
                    }}
                    disabled={isLiking === postDetailPost.id}
                    className={postDetailPost.is_liked ? 'text-red-500' : 'text-gray-600'}
                  >
                    <Heart
                      className={`w-5 h-5 mr-2 ${postDetailPost.is_liked ? 'fill-current' : ''}`}
                    />
                    {postDetailPost.likes_count}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPost(postDetailPost);
                      setCommentModalOpen(true);
                      loadComments(postDetailPost.id).then((comments) => {
                        if (comments) {
                          setComments(comments);
                        }
                      });
                    }}
                    className="text-gray-600"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {postDetailPost.comments_count}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPostToShare(postDetailPost);
                      setShareModalOpen(true);
                    }}
                    className="text-gray-600"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    {postDetailPost.shares_count}
                  </Button>
                  {postDetailPost.reward_enabled && postDetailPost.user.id === user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisableRewards(postDetailPost.id)}
                      disabled={rewardToggleLoading === postDetailPost.id}
                      className="text-gray-600"
                    >
                      <Coins className="w-5 h-5 mr-2" />
                      {rewardToggleLoading === postDetailPost.id ? 'Disabling...' : 'Disable rewards'}
                    </Button>
                  )}
                        {postDetailPost.reward_enabled && (
                          <Badge className="ml-auto bg-orange-100 text-orange-700">
                            💰 {postDetailPost.reward_pool} {postDetailPost.reward_coin_symbol ?? 'coins'}
                          </Badge>
                        )}
                </div>
              </Card>
              </div>

              {/* Right Column - Comments Section */}
              <div className="w-[55%] flex-shrink-0 flex flex-col border-l pl-8">
                <div className="flex-1 overflow-y-auto space-y-4 pr-4">
                  <h3 className="font-semibold text-black sticky top-0 bg-white pb-2 z-10">Comments</h3>
                {postDetailComments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No comments yet</p>
                ) : (
                  postDetailComments.map((comment) => (
                    <div key={comment.id} id={`comment-${comment.id}`} className="space-y-3">
                      {/* Main Comment */}
                      <div className="flex gap-3">
                        <Avatar>
                          <AvatarImage
                            src={comment.user.avatar_url || undefined}
                            alt={comment.user.display_name || comment.user.username}
                          />
                          <AvatarFallback>
                            {(comment.user.display_name || comment.user.username)
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-100 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-black">
                                {comment.user.display_name || comment.user.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTime(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-black mb-2">
                              <MentionText text={comment.content} />
                            </p>
                          </div>
                          {/* Comment Actions */}
                          <div className="flex items-center gap-4 mt-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (postDetailPost) {
                                  likeComment(postDetailPost.id, comment.id).then((result) => {
                                    if (result) {
                                      setPostDetailComments((prev) =>
                                        prev.map((c) =>
                                          c.id === comment.id
                                            ? {
                                                ...c,
                                                is_liked: result.liked,
                                                likes_count: result.likes_count,
                                              }
                                            : c
                                        )
                                      );
                                    }
                                  });
                                }
                              }}
                              className={`text-xs h-6 px-2 ${comment.is_liked ? 'text-red-500' : 'text-gray-600'}`}
                            >
                              <Heart
                                className={`w-3 h-3 mr-1 ${comment.is_liked ? 'fill-current' : ''}`}
                              />
                              {comment.likes_count > 0 && comment.likes_count}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPostDetailReplyingTo(postDetailReplyingTo === comment.id ? null : comment.id)}
                              className="text-xs h-6 px-2 text-gray-600"
                            >
                              Reply
                            </Button>
                          </div>
                          
                          {/* Reply Input */}
                          {postDetailReplyingTo === comment.id && (
                            <div className="ml-11 mt-2 flex gap-2">
                              <MentionInput
                                value={postDetailReplyContent[comment.id] || ''}
                                onChange={(value) =>
                                  setPostDetailReplyContent((prev) => ({ ...prev, [comment.id]: value }))
                                }
                                placeholder="Write a reply... Type @ to mention someone"
                                onKeyDown={(e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handlePostDetailSubmitComment(comment.id);
                                  }
                                }}
                                className="flex-1 text-sm h-8"
                                multiline={false}
                              />
                              <Button
                                size="sm"
                                onClick={() => handlePostDetailSubmitComment(comment.id)}
                                disabled={!postDetailReplyContent[comment.id]?.trim() || isCommenting === postDetailPost?.id}
                                className="bg-orange-500 hover:bg-orange-600 h-8 text-xs"
                              >
                                Reply
                              </Button>
                            </div>
                          )}

                          {/* Nested Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="ml-11 mt-2 space-y-3">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} id={`comment-${reply.id}`} className="flex gap-2">
                                  <Avatar className="w-7 h-7">
                                    <AvatarImage
                                      src={reply.user.avatar_url || undefined}
                                      alt={reply.user.display_name || reply.user.username}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {(reply.user.display_name || reply.user.username)
                                        .charAt(0)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="bg-gray-100 rounded-lg p-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-xs text-black">
                                          {reply.user.display_name || reply.user.username}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatTime(reply.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-xs text-black">
                                        <MentionText text={reply.content} />
                                      </p>
                                    </div>
                                    {/* Reply Actions */}
                                    <div className="flex items-center gap-4 mt-1 ml-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          if (postDetailPost) {
                                            likeComment(postDetailPost.id, reply.id).then((result) => {
                                              if (result) {
                                                setPostDetailComments((prev) =>
                                                  prev.map((c) => ({
                                                    ...c,
                                                    replies: c.replies.map((r) =>
                                                      r.id === reply.id
                                                        ? {
                                                            ...r,
                                                            is_liked: result.liked,
                                                            likes_count: result.likes_count,
                                                          }
                                                        : r
                                                    ),
                                                  }))
                                                );
                                              }
                                            });
                                          }
                                        }}
                                        className={`text-xs h-6 px-2 ${reply.is_liked ? 'text-red-500' : 'text-gray-600'}`}
                                      >
                                        <Heart
                                          className={`w-3 h-3 mr-1 ${reply.is_liked ? 'fill-current' : ''}`}
                                        />
                                        {reply.likes_count > 0 && reply.likes_count}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                </div>
                
                {/* Comment Input - Fixed at bottom of comments column */}
                <div className="flex gap-2 pt-4 border-t mt-4 flex-shrink-0">
                <MentionInput
                  value={postDetailNewComment}
                  onChange={(value) => {
                    setPostDetailNewComment(value);
                  }}
                  placeholder="Write a comment... Type @ to mention someone"
                  onKeyDown={(e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePostDetailSubmitComment();
                    }
                  }}
                  className="flex-1"
                  multiline={false}
                />
                <Button
                  type="button"
                  onClick={(e: { preventDefault: () => void; stopPropagation: () => void }) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePostDetailSubmitComment();
                  }}
                  disabled={!postDetailNewComment.trim() || isCommenting === postDetailPost?.id}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCommenting === postDetailPost?.id ? 'Posting...' : 'Post'}
                </Button>
              </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

