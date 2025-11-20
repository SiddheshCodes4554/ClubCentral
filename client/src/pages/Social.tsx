import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, Pencil, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { SocialPost } from '@shared/schema';

type CreateSocialPostInput = {
  caption: string;
  imageUrl?: string;
  platform: SocialPost['platform'];
  scheduledDate?: string;
  status: SocialPost['status'];
};

export default function Social() {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [scheduledDate, setScheduledDate] = useState('');
  const [status, setStatus] = useState('Draft');
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const { toast } = useToast();

  const { data: posts = [], isLoading } = useQuery<SocialPost[]>({
    queryKey: ['/api/social'],
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: CreateSocialPostInput) => {
      return await apiRequest<SocialPost>('POST', '/api/social', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setOpen(false);
      resetForm();
      setEditingPost(null);
      toast({
        title: 'Post created',
        description: 'The social media post has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to create post', description: error.message, variant: 'destructive' });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateSocialPostInput }) => {
      return await apiRequest<SocialPost>('PATCH', `/api/social/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setOpen(false);
      resetForm();
      setEditingPost(null);
      toast({ title: 'Post updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to update post', description: error.message, variant: 'destructive' });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest<{ message: string }>('DELETE', `/api/social/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: 'Post deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to delete post', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setCaption('');
    setImageUrl('');
    setPlatform('Instagram');
    setScheduledDate('');
    setStatus('Draft');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateSocialPostInput = {
      caption,
      imageUrl: imageUrl || undefined,
      platform,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      status,
    };

    if (editingPost) {
      updatePostMutation.mutate({ id: editingPost.id, data: payload });
    } else {
      createPostMutation.mutate(payload);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingPost(null);
    setOpen(true);
  };

  const openEditDialog = (post: SocialPost) => {
    setEditingPost(post);
    setCaption(post.caption);
    setImageUrl(post.imageUrl ?? '');
    setPlatform(post.platform);
    setStatus(post.status);
    setScheduledDate(post.scheduledDate ? new Date(post.scheduledDate).toISOString().slice(0, 16) : '');
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingPost(null);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Social Media Planner</h1>
        <Dialog open={open} onOpenChange={(value) => {
          if (!value) {
            closeDialog();
          } else {
            setOpen(true);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} data-testid="button-create-post">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPost ? 'Edit Social Media Post' : 'Create Social Media Post'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caption">Caption *</Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  required
                  rows={4}
                  data-testid="input-post-caption"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  data-testid="input-post-image"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform *</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger id="platform" data-testid="select-post-platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Twitter">Twitter</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status" data-testid="select-post-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Posted">Posted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date (optional)</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  data-testid="input-post-scheduled-date"
                />
              </div>

              <Button type="submit" className="w-full" disabled={createPostMutation.isPending || updatePostMutation.isPending} data-testid="button-submit-post">
                {editingPost
                  ? updatePostMutation.isPending
                    ? 'Saving...'
                    : 'Save Changes'
                  : createPostMutation.isPending
                  ? 'Creating...'
                  : 'Create Post'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No social media posts yet</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="hover-elevate" data-testid={`card-post-${post.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{post.platform}</Badge>
                    <StatusBadge status={post.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => openEditDialog(post)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive">
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deletePostMutation.mutate(post.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {post.imageUrl && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-sm line-clamp-3">{post.caption}</p>
                {post.scheduledDate && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(post.scheduledDate).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Created {new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
