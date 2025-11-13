import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function Tasks() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Pending');
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: events } = useQuery({
    queryKey: ['/api/events'],
  });

  const { data: members } = useQuery({
    queryKey: ['/api/members'],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/tasks', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setOpen(false);
      resetForm();
      toast({
        title: 'Task created',
        description: 'The task has been created successfully.',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: { id: string; status: string }) => {
      return await apiRequest('PATCH', `/api/tasks/${data.id}`, { status: data.status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: 'Status updated',
        description: 'Task status has been updated.',
      });
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventId('');
    setAssignedToId('');
    setDueDate('');
    setStatus('Pending');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate({
      title,
      description: description || undefined,
      eventId,
      assignedToId: assignedToId || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      status,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Tasks</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-task">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  data-testid="input-task-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  data-testid="input-task-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventId">Event *</Label>
                <Select value={eventId} onValueChange={setEventId} required>
                  <SelectTrigger id="eventId" data-testid="select-task-event">
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events?.map((event: any) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedToId">Assign To</Label>
                  <Select value={assignedToId} onValueChange={setAssignedToId}>
                    <SelectTrigger id="assignedToId" data-testid="select-task-assignee">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {members?.filter((m: any) => m.canLogin).map((member: any) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    data-testid="input-task-due-date"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={createTaskMutation.isPending} data-testid="button-submit-task">
                {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {!tasks || tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No tasks created yet</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task: any) => (
            <Card key={task.id} className="hover-elevate" data-testid={`card-task-${task.id}`}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{task.title}</h3>
                      <StatusBadge status={task.status} />
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {task.event && (
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          {task.event.title}
                        </Badge>
                      )}
                      {task.assignedTo && (
                        <Badge variant="secondary">
                          Assigned to {task.assignedTo.name}
                        </Badge>
                      )}
                      {task.dueDate && (
                        <Badge variant="outline" className="text-xs">
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Select
                    value={task.status}
                    onValueChange={(value) => updateStatusMutation.mutate({ id: task.id, status: value })}
                  >
                    <SelectTrigger className="w-36" data-testid={`select-status-${task.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
