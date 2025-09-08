import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  X, 
  Plus, 
  Reply, 
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Comment {
  id: string;
  content: string;
  author: string;
  authorEmail: string;
  createdAt: Date;
  updatedAt?: Date;
  status: 'open' | 'resolved';
  replies?: CommentReply[];
  position?: {
    start: number;
    end: number;
    selectedText: string;
  };
}

interface CommentReply {
  id: string;
  content: string;
  author: string;
  authorEmail: string;
  createdAt: Date;
}

interface CommentsSidebarProps {
  projectId: string;
  sectionType: string;
  onClose: () => void;
}

export const CommentsSidebar: React.FC<CommentsSidebarProps> = ({
  projectId,
  sectionType,
  onClose
}) => {
  const [comments, setComments] = useState<Comment[]>([
    // Mock data for demonstration
    {
      id: '1',
      content: 'This section needs more specific financial metrics to support the growth projections.',
      author: 'Sarah Johnson',
      authorEmail: 'sarah.johnson@company.com',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'open',
      position: {
        start: 150,
        end: 250,
        selectedText: 'growth projections for the next five years'
      },
      replies: [
        {
          id: 'r1',
          content: 'I agree. We should add the quarterly breakdown from our financial model.',
          author: 'Mike Chen',
          authorEmail: 'mike.chen@company.com',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
        }
      ]
    },
    {
      id: '2',
      content: 'Consider adding more details about regulatory compliance here.',
      author: 'Legal Team',
      authorEmail: 'legal@company.com',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'open'
    }
  ]);
  
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const filteredComments = comments.filter(comment => {
    if (filter === 'all') return true;
    return comment.status === filter;
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      author: 'Current User', // Would be from auth context
      authorEmail: 'user@company.com',
      createdAt: new Date(),
      status: 'open'
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  const handleAddReply = (commentId: string) => {
    if (!replyContent.trim()) return;

    const reply: CommentReply = {
      id: Date.now().toString(),
      content: replyContent,
      author: 'Current User',
      authorEmail: 'user@company.com',
      createdAt: new Date()
    };

    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply]
        };
      }
      return comment;
    }));

    setReplyContent('');
    setReplyingTo(null);
  };

  const handleResolveComment = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          status: comment.status === 'open' ? 'resolved' : 'open'
        };
      }
      return comment;
    }));
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter(comment => comment.id !== commentId));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="h-full flex flex-col border-l bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Comments</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Filter buttons */}
        <div className="flex gap-2 mt-3">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({comments.length})
          </Button>
          <Button 
            variant={filter === 'open' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('open')}
          >
            Open ({comments.filter(c => c.status === 'open').length})
          </Button>
          <Button 
            variant={filter === 'resolved' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('resolved')}
          >
            Resolved ({comments.filter(c => c.status === 'resolved').length})
          </Button>
        </div>
      </div>

      {/* Add new comment */}
      <div className="p-4 border-b bg-muted/30">
        <Textarea
          placeholder="Add a comment about this section..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="mb-2"
        />
        <Button 
          onClick={handleAddComment}
          disabled={!newComment.trim()}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Comment
        </Button>
      </div>

      {/* Comments list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {filteredComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm">Add a comment to start the discussion</p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <Card key={comment.id} className={`${comment.status === 'resolved' ? 'opacity-75' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(comment.author)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{comment.author}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(comment.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant={comment.status === 'open' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {comment.status}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleResolveComment(comment.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {comment.status === 'open' ? 'Mark Resolved' : 'Reopen'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {comment.position && (
                    <div className="bg-muted/50 rounded p-2 mb-3 text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Referenced text:</p>
                      <p className="italic">"{comment.position.selectedText}"</p>
                    </div>
                  )}
                  
                  <p className="text-sm">{comment.content}</p>
                  
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 pl-4 border-l space-y-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="bg-muted/30 rounded p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-xs">
                                {getInitials(reply.author)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{reply.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Reply input */}
                  {replyingTo === comment.id ? (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => handleAddReply(comment.id)}
                          disabled={!replyContent.trim()}
                        >
                          Reply
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setReplyingTo(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 h-7"
                      onClick={() => setReplyingTo(comment.id)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};