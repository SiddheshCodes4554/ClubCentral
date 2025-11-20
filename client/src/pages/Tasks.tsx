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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, Pencil, Trash2, Sparkles } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AIAssistant } from '@/components/AIAssistant';
import type { Task as ClubTask, Event as ClubEvent, User as Member } from '@shared/schema';
import type { AITask } from '@/types/ai';
import type { TeamsResponse } from '@/types/api';

const UNASSIGNED_TEAM = '__unassigned_team__';

type CreateTaskInput = {
  title: string;
  description?: string;
  eventId: string;
  assignedToId?: string;
  teamId?: string;
  dueDate?: string;
  status: ClubTask['status'];
};

export default function Tasks() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [teamId, setTeamId] = useState(UNASSIGNED_TEAM);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Pending');
  const [editingTask, setEditingTask] = useState<ClubTask | null>(null);
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<ClubTask[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: events = [] } = useQuery<ClubEvent[]>({
    queryKey: ['/api/events'],
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ['/api/members'],
  });

  const { data: teamData } = useQuery<TeamsResponse>({
    queryKey: ['/api/teams'],
  });

  const teams = teamData?.teams ?? [];

  const createTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      return await apiRequest<ClubTask>('POST', '/api/tasks', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setOpen(false);
      resetForm();
      setEditingTask(null);
      toast({
        title: 'Task created',
        description: 'The task has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to create task', description: error.message, variant: 'destructive' });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateTaskInput }) => {
      return await apiRequest<ClubTask>('PATCH', `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setOpen(false);
      resetForm();
      setEditingTask(null);
      toast({ title: 'Task updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to update task', description: error.message, variant: 'destructive' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: { id: string; status: ClubTask['status'] }) => {
      return await apiRequest<ClubTask>('PATCH', `/api/tasks/${data.id}`, { status: data.status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: 'Status updated',
        description: 'Task status has been updated.',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to update status', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest<{ message: string }>('DELETE', `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: 'Task deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to delete task', description: error.message, variant: 'destructive' });
    },
  });

  const createTaskFromAI = useMutation({
    mutationFn: async ({ eventId, task }: { eventId: string; task: AITask }) => {
      // Find team by name if possible
      let teamId: string | undefined;
      if (task.assignedTo && teamData?.teams) {
        const matchingTeam = teamData.teams.find((t: any) => 
          t.name.toLowerCase().includes(task.assignedTo.toLowerCase()) ||
          task.assignedTo.toLowerCase().includes(t.name.toLowerCase())
        );
        if (matchingTeam) {
          teamId = matchingTeam.id;
        }
      }

      // Find member by name if possible
      let assignedToId: string | undefined;
      if (task.assignedTo && members.length > 0) {
        const matchingMember = members.find((m: Member) => 
          m.name.toLowerCase().includes(task.assignedTo.toLowerCase()) ||
          task.assignedTo.toLowerCase().includes(m.name.toLowerCase())
        );
        if (matchingMember) {
          assignedToId = matchingMember.id;
        }
      }

      // Parse due date
      let dueDate: string | undefined;
      if (task.dueDate) {
        try {
          const parsed = new Date(task.dueDate);
          if (!isNaN(parsed.getTime())) {
            dueDate = parsed.toISOString();
          }
        } catch (e) {
          // Ignore invalid dates
        }
      }

      return await apiRequest<ClubTask>('POST', '/api/tasks', {
        title: task.title,
        description: task.description,
        eventId,
        teamId,
        assignedToId,
        dueDate,
        status: 'Pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
  });

  const handleAITasksInsert = async (tasks: AITask[]) => {
    if (events.length === 0) {
      toast({
        title: 'No events available',
        description: 'Please create an event first.',
        variant: 'destructive',
      });
      return;
    }

    // Use the first event or the currently selected event
    const targetEventId = eventId || events[0]?.id;
    if (!targetEventId) {
      toast({
        title: 'No event selected',
        description: 'Please select an event first.',
        variant: 'destructive',
      });
      return;
    }

    // Create all selected tasks
    for (const task of tasks) {
      await createTaskFromAI.mutateAsync({ eventId: targetEventId, task });
    }

    toast({
      title: 'Tasks created',
      description: `${tasks.length} task(s) have been added successfully.`,
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventId('');
    setAssignedToId('');
    setTeamId(UNASSIGNED_TEAM);
    setDueDate('');
    setStatus('Pending');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateTaskInput = {
      title,
      description: description || undefined,
      eventId,
      assignedToId: assignedToId || undefined,
      teamId: teamId !== UNASSIGNED_TEAM ? teamId : undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      status,
    };

    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data: payload });
    } else {
      createTaskMutation.mutate(payload);
    }
  };

  const handleEditTask = (task: ClubTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description ?? '');
    setEventId(task.eventId);
    setAssignedToId(task.assignedToId ?? '');
    setTeamId(task.teamId ?? UNASSIGNED_TEAM);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '');
    setStatus(task.status);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingTask(null);
    resetForm();
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
        <div className="flex items-center gap-2">
          <AIAssistant
            eventId={eventId || events[0]?.id}
            onTasksInsert={handleAITasksInsert}
            triggerButton={
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </Button>
            }
          />
          <Dialog open={open} onOpenChange={(value) => {
            if (!value) {
              closeDialog();
            } else {
              setOpen(true);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm();
                setEditingTask(null);
                setOpen(true);
              }} data-testid="button-create-task">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
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
                    {events.map((event) => (
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
                      {members.filter((m) => m.canLogin).map((member) => (
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

              <div className="space-y-2">
                <Label htmlFor="teamId">Assign Team</Label>
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger id="teamId">
                    <SelectValue placeholder="No team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED_TEAM}>No team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={createTaskMutation.isPending || updateTaskMutation.isPending} data-testid="button-submit-task">
                {editingTask
                  ? updateTaskMutation.isPending
                    ? 'Saving...'
                    : 'Save Changes'
                  : createTaskMutation.isPending
                  ? 'Creating...'
                  : 'Create Task'}
              </Button>
            </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No tasks created yet</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => {
            const relatedEvent = events.find((e) => e.id === task.eventId);
            const assignee = task.assignedToId ? members.find((m) => m.id === task.assignedToId) : undefined;
            const team = task.teamId ? teams.find((t) => t.id === task.teamId) : undefined;

            return (
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
                        {relatedEvent && (
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {relatedEvent.title}
                          </Badge>
                        )}
                        {assignee && (
                          <Badge variant="secondary">
                            Assigned to {assignee.name}
                          </Badge>
                        )}
                        {team && (
                          <Badge variant="outline" className="bg-primary/10 text-primary">
                            Team: {team.name}
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
                      onValueChange={(value) => updateStatusMutation.mutate({ id: task.id, status: value as ClubTask['status'] })}
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
                  <div className="flex items-center gap-2 mt-3 justify-end">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleEditTask(task)}>
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
                          <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the task and associated progress tracking.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
