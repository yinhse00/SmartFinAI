import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send } from 'lucide-react';
import { 
  executionCollaborationService,
  TaskComment
} from '@/services/execution/executionCollaborationService';
import { useToast } from '@/hooks/use-toast';

interface TaskCommentsPanelProps {
  projectId: string;
  taskId: string;
  taskTitle: string;
}

export const TaskCommentsPanel = ({ 
  projectId, 
  taskId, 
  taskTitle 
}: TaskCommentsPanelProps) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadComments();
  }, [projectId, taskId]);

  const loadComments = async () => {
    try {
      const commentsList = await executionCollaborationService.getTaskComments(projectId, taskId);
      setComments(commentsList);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await executionCollaborationService.addTaskComment(
        projectId,
        taskId,
        newComment.trim()
      );

      setNewComment('');
      await loadComments();
      
      toast({
        title: "Comment Added",
        description: "Your comment has been posted"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Could not add comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmitComment();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          Comments: {taskTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No comments yet. Start the conversation!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 border rounded-lg">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback>
                    {(comment.author_name || comment.author_email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.author_name || comment.author_email}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment */}
        <div className="space-y-3 pt-3 border-t">
          <Textarea
            placeholder="Add a comment... (Ctrl+Enter to submit)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Press Ctrl+Enter to submit quickly
            </span>
            <Button 
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
              size="sm"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-3 w-3 mr-2" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};