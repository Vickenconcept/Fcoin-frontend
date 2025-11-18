import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Facebook, MessageCircle, Instagram, Twitter, Share2, User } from 'lucide-react';
import toast from 'react-hot-toast';

type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    content?: string | null;
    user: {
      display_name?: string | null;
      username: string;
    };
  };
  onShareToTimeline: (comment?: string) => Promise<void>;
};

export function ShareModal({ isOpen, onClose, post, onShareToTimeline }: ShareModalProps) {
  const [shareComment, setShareComment] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const postUrl = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
  const shareText = post.content && post.content.trim()
    ? `${post.user.display_name || post.user.username}: ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}`
    : `Check out this post by ${post.user.display_name || post.user.username}`;

  const handleShareToTimeline = async () => {
    setIsSharing(true);
    try {
      await onShareToTimeline(shareComment.trim() || undefined);
      setShareComment('');
      onClose();
      toast.success('Post shared to your timeline!');
    } catch (error) {
      toast.error('Failed to share to timeline');
    } finally {
      setIsSharing(false);
    }
  };

  const handleExternalShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(postUrl);
    const encodedText = encodeURIComponent(shareText);

    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so copy to clipboard
        navigator.clipboard.writeText(postUrl);
        toast.success('Post link copied! Paste it in your Instagram story or post.');
        return;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
    toast.success(`Opening ${platform}...`);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.user.display_name || post.user.username}`,
          text: shareText,
          url: postUrl,
        });
        toast.success('Shared successfully!');
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(postUrl);
      toast.success('Post link copied to clipboard!');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Share to Timeline */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-black">Share to Your Timeline</h3>
                <p className="text-sm text-gray-600">Add this post to your profile timeline</p>
              </div>
            </div>
            <Textarea
              value={shareComment}
              onChange={(e: { target: { value: string } }) => setShareComment(e.target.value)}
              placeholder="Add a comment (optional)..."
              className="mb-3 min-h-[80px]"
              maxLength={500}
            />
            <Button
              onClick={handleShareToTimeline}
              disabled={isSharing}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSharing ? 'Sharing...' : 'Share to Timeline'}
            </Button>
          </Card>

          {/* External Platforms */}
          <div>
            <h3 className="font-semibold text-black mb-3">Share to External Platforms</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleExternalShare('facebook')}
                className="flex items-center gap-2"
              >
                <Facebook className="w-4 h-4 text-blue-600" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExternalShare('twitter')}
                className="flex items-center gap-2"
              >
                <Twitter className="w-4 h-4 text-blue-400" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExternalShare('whatsapp')}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-green-600" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExternalShare('instagram')}
                className="flex items-center gap-2"
              >
                <Instagram className="w-4 h-4 text-pink-600" />
                Instagram
              </Button>
            </div>
          </div>

          {/* Native Share / Copy Link */}
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              onClick={handleNativeShare}
              className="w-full flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              {'share' in navigator ? 'Share via...' : 'Copy Link'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

