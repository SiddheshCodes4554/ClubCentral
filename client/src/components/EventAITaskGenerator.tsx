import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import type { Event as ClubEvent } from '@shared/schema';
import type { AIResponse, AITask } from '@/types/ai';

type EventAITaskGeneratorProps = {
  event: ClubEvent;
  onTasksInsert: (eventId: string, tasks: AITask[]) => Promise<void>;
};

export function EventAITaskGenerator({ event, onTasksInsert }: EventAITaskGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setAdditionalNotes('');
    setAiResponse(null);
    setSelectedTasks(new Set());
    setCopied(false);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      resetState();
    }
  };

  const buildEventDescription = () => {
    const details = [
      event.description || '',
      `Event Date: ${new Date(event.date).toLocaleString()}`,
      event.budget ? `Budget: ₹${event.budget}` : null,
      `Status: ${event.status}`,
    ].filter(Boolean);

    return details.join('\n');
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest<AIResponse>('POST', '/api/ai/generate-tasks', {
        eventTitle: event.title,
        eventDescription: buildEventDescription(),
        goals: additionalNotes || undefined,
        expectedDate: event.date,
        expectedBudget: event.budget || undefined,
      });
    },
    onSuccess: (data) => {
      setAiResponse(data);
      setSelectedTasks(new Set(data.tasks.map((_, index) => index)));
      toast({
        title: 'Event-specific tasks generated',
        description: 'Review the tasks and insert them into this event.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to generate tasks',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const toggleTaskSelection = (index: number) => {
    const updated = new Set(selectedTasks);
    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }
    setSelectedTasks(updated);
  };

  const handleInsertTasks = async () => {
    if (!aiResponse || selectedTasks.size === 0) {
      toast({
        title: 'No tasks selected',
        description: 'Select at least one task to insert.',
        variant: 'destructive',
      });
      return;
    }

    const tasksToInsert = aiResponse.tasks.filter((_, index) => selectedTasks.has(index));
    await onTasksInsert(event.id, tasksToInsert);
    toast({
      title: 'Tasks inserted',
      description: `${tasksToInsert.length} task(s) added to ${event.title}.`,
    });
    setOpen(false);
    resetState();
  };

  const handleCopy = async () => {
    if (!aiResponse) return;
    const text = JSON.stringify(aiResponse.tasks, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copied',
      description: 'AI suggestions copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" data-testid={`button-event-ai-${event.id}`}>
          <Sparkles className="h-4 w-4" />
          AI Tasks
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate AI Tasks for {event.title}</DialogTitle>
          <DialogDescription>
            Automatically craft structured tasks tailored to this event&apos;s details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2 p-4 rounded-lg bg-muted/40">
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">Date: {new Date(event.date).toLocaleString()}</Badge>
              {event.budget ? <Badge variant="outline">Budget: ₹{event.budget}</Badge> : null}
              <Badge variant="outline">Status: {event.status}</Badge>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`additional-notes-${event.id}`}>Additional Goals / Notes</Label>
            <Textarea
              id={`additional-notes-${event.id}`}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Optional: highlight focus areas, constraints, sponsors, etc."
              rows={3}
            />
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating tasks...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Suggestions
              </>
            )}
          </Button>

          {generateMutation.isPending && (
            <div className="space-y-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          )}

          {aiResponse && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleInsertTasks} disabled={selectedTasks.size === 0}>
                  Insert Selected ({selectedTasks.size})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAiResponse(null);
                    setSelectedTasks(new Set());
                    generateMutation.mutate();
                  }}
                  disabled={generateMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <ScrollArea className="h-64 rounded-lg border p-2">
                {aiResponse.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No tasks returned by AI.</p>
                ) : (
                  <div className="space-y-3">
                    {aiResponse.tasks.map((task, index) => (
                      <Card key={index} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex gap-3 items-start">
                            <Checkbox
                              checked={selectedTasks.has(index)}
                              onCheckedChange={() => toggleTaskSelection(index)}
                              className="mt-1"
                            />
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-medium">{task.title}</h4>
                                {task.priority && <Badge variant="outline">{task.priority}</Badge>}
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {task.assignedTo && <Badge variant="secondary">Team: {task.assignedTo}</Badge>}
                                {task.dueDate && <Badge variant="secondary">Due: {task.dueDate}</Badge>}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Separator />

              {aiResponse.timeline.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">AI Timeline Highlights</h4>
                  <div className="space-y-2">
                    {aiResponse.timeline.map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg text-sm flex gap-3">
                        <Badge variant="outline" className="shrink-0">{item.day}</Badge>
                        <p className="text-muted-foreground">{item.milestone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="text-xs text-muted-foreground">
          AI suggestions are drafts. Review before assigning to your team.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

