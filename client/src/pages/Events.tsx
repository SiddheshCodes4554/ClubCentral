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
import { Plus, Calendar as CalendarIcon, DollarSign, Pencil, Trash2, RefreshCw, Sparkles } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { AIAssistant } from '@/components/AIAssistant';
import { EventAITaskGenerator } from '@/components/EventAITaskGenerator';
import type { Event as ClubEvent, Task as ClubTask } from '@shared/schema';
import type { AITask } from '@/types/ai';

type CreateEventInput = {
  title: string;
  description?: string;
  date: string;
  budget?: number;
  status: ClubEvent['status'];
};

export default function Events() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState('Planning');
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);

  const { toast } = useToast();

  const { data: events = [], isLoading } = useQuery<ClubEvent[]>({
    queryKey: ['/api/events'],
  });

  const { data: teams = [] } = useQuery<any>({
    queryKey: ['/api/teams'],
  });

  const createTaskFromAI = useMutation({
    mutationFn: async ({ eventId, task }: { eventId: string; task: AITask }) => {
      // Find team by name if possible
      let teamId: string | undefined;
      if (task.assignedTo && teams?.teams) {
        const matchingTeam = teams.teams.find((t: any) => 
          t.name.toLowerCase().includes(task.assignedTo.toLowerCase()) ||
          task.assignedTo.toLowerCase().includes(t.name.toLowerCase())
        );
        if (matchingTeam) {
          teamId = matchingTeam.id;
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
        dueDate,
        status: 'Pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
  });

  const insertTasksForEvent = async (eventId: string, tasks: AITask[]) => {
    for (const task of tasks) {
      await createTaskFromAI.mutateAsync({ eventId, task });
    }
  };

  const handleAITasksInsert = async (tasks: AITask[]) => {
    if (!editingEvent && events.length > 0) {
      // If no event is being edited, use the first event or show a message
      toast({
        title: 'Select an event',
        description: 'Please create or select an event first to add tasks.',
        variant: 'destructive',
      });
      return;
    }

    const targetEventId = editingEvent?.id || events[0]?.id;
    if (!targetEventId) {
      toast({
        title: 'No event available',
        description: 'Please create an event first.',
        variant: 'destructive',
      });
      return;
    }

    await insertTasksForEvent(targetEventId, tasks);

    toast({
      title: 'Tasks created',
      description: `${tasks.length} task(s) have been added to the event.`,
    });
  };

  const handleEventSpecificAITasksInsert = async (eventId: string, tasks: AITask[]) => {
    if (!eventId) return;
    await insertTasksForEvent(eventId, tasks);
    toast({
      title: 'Tasks created',
      description: `${tasks.length} task(s) have been added to the event.`,
    });
  };

  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventInput) => {
      return await apiRequest<ClubEvent>('POST', '/api/events', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setOpen(false);
      resetForm();
      toast({
        title: 'Event created',
        description: 'The event has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to create event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateEventInput }) => {
      return await apiRequest<ClubEvent>('PATCH', `/api/events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setOpen(false);
      resetForm();
      setEditingEvent(null);
      toast({
        title: 'Event updated',
        description: 'The event has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to update event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest<{ message: string }>('DELETE', `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: 'Event deleted' });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to delete event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleStatusChange = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ClubEvent['status'] }) => {
      return await apiRequest<ClubEvent>('PATCH', `/api/events/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to update status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setBudget('');
    setStatus('Planning');
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingEvent(null);
    setOpen(true);
  };

  const openEditDialog = (event: ClubEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description ?? '');
    setDate(new Date(event.date).toISOString().slice(0, 16));
    setBudget(event.budget ? parseFloat(event.budget).toString() : '');
    setStatus(event.status);
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateEventInput = {
      title,
      description: description || undefined,
      date: new Date(date).toISOString(),
      budget: budget ? parseFloat(budget) : undefined,
      status,
    };

    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data: payload });
    } else {
      createEventMutation.mutate(payload);
    }
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
        <h1 className="text-3xl font-semibold">Events</h1>
        <div className="flex items-center gap-2">
          <AIAssistant
            eventId={editingEvent?.id}
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
              setEditingEvent(null);
              resetForm();
            }
            setOpen(value);
          }}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-create-event">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  data-testid="input-event-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  data-testid="input-event-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    data-testid="input-event-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    data-testid="input-event-budget"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" data-testid="select-event-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={createEventMutation.isPending || updateEventMutation.isPending} data-testid="button-submit-event">
                {editingEvent ? (updateEventMutation.isPending ? 'Saving...' : 'Save Changes') : createEventMutation.isPending ? 'Creating...' : 'Create Event'}
              </Button>
            </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!events || events.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No events created yet</p>
            </CardContent>
          </Card>
        ) : (
          events.map((event: ClubEvent) => (
            <Card key={event.id} className="hover-elevate" data-testid={`card-event-${event.id}`}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-[200px]">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">Created {new Date(event.createdAt ?? event.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <StatusBadge status={event.status} />
                    <Select
                      value={event.status}
                      onValueChange={(value) => handleStatusChange.mutate({ id: event.id, status: value as ClubEvent['status'] })}
                    >
                      <SelectTrigger className="w-32" data-testid={`select-event-status-${event.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <EventAITaskGenerator event={event} onTasksInsert={handleEventSpecificAITasksInsert} />
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => openEditDialog(event)} data-testid={`button-edit-event-${event.id}`}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive" data-testid={`button-delete-event-${event.id}`}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone and will remove all assigned tasks references.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteEventMutation.mutate(event.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Confirm Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{new Date(event.date).toLocaleString()}</span>
                </div>
                {event.budget && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>₹{parseFloat(event.budget).toFixed(2)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
