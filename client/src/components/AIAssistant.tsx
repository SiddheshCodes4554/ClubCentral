import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, RefreshCw, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { AIResponse, AITask } from '@/types/ai';

type AIAssistantProps = {
  eventId?: string;
  onTasksInsert?: (tasks: AITask[]) => void;
  triggerButton?: React.ReactNode;
};

export function AIAssistant({ eventId, onTasksInsert, triggerButton }: AIAssistantProps) {
  const [open, setOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [goals, setGoals] = useState('');
  const [team, setTeam] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [expectedBudget, setExpectedBudget] = useState('');
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [openSections, setOpenSections] = useState({
    tasks: true,
    timeline: true,
    budget: true,
    teams: true,
  });

  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!eventTitle.trim()) {
        throw new Error('Event title is required');
      }
      return await apiRequest<AIResponse>('POST', '/api/ai/generate-tasks', {
        eventTitle,
        eventDescription: eventDescription || undefined,
        goals: goals || undefined,
        team: team || undefined,
        expectedDate: expectedDate || undefined,
        expectedBudget: expectedBudget || undefined,
      });
    },
    onSuccess: (data) => {
      setAiResponse(data);
      // Auto-select all tasks
      setSelectedTasks(new Set(data.tasks.map((_, i) => i)));
      toast({
        title: 'AI suggestions generated',
        description: 'Review and customize the suggestions below.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to generate suggestions',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleRegenerate = () => {
    setAiResponse(null);
    setSelectedTasks(new Set());
    generateMutation.mutate();
  };

  const toggleTaskSelection = (index: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  const handleInsertTasks = () => {
    if (!aiResponse || selectedTasks.size === 0) {
      toast({
        title: 'No tasks selected',
        description: 'Please select at least one task to insert.',
        variant: 'destructive',
      });
      return;
    }

    const tasksToInsert = aiResponse.tasks.filter((_, i) => selectedTasks.has(i));
    if (onTasksInsert) {
      onTasksInsert(tasksToInsert);
      setOpen(false);
      toast({
        title: 'Tasks inserted',
        description: `${tasksToInsert.length} task(s) added successfully.`,
      });
    }
  };

  const handleCopyToClipboard = async () => {
    if (!aiResponse) return;

    const text = JSON.stringify(aiResponse, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copied to clipboard',
      description: 'AI suggestions copied successfully.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Task Assistant
          </SheetTitle>
          <SheetDescription>
            Provide event details and let AI generate structured tasks, timelines, budget suggestions, and team assignments.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Input Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventTitle">Event Title *</Label>
              <Input
                id="eventTitle"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g., Annual Tech Conference 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDescription">Event Description</Label>
              <Textarea
                id="eventDescription"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Describe the event, its purpose, and key details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goals">Goals</Label>
                <Input
                  id="goals"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g., Increase engagement, raise funds"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team">Team/Department</Label>
                <Input
                  id="team"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="e.g., PR Team, Operations"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedDate">Expected Date</Label>
                <Input
                  id="expectedDate"
                  type="datetime-local"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedBudget">Expected Budget</Label>
                <Input
                  id="expectedBudget"
                  type="number"
                  value={expectedBudget}
                  onChange={(e) => setExpectedBudget(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!eventTitle.trim() || generateMutation.isPending}
              className="w-full"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </div>

          {/* AI Response Display */}
          {generateMutation.isPending && (
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          )}

          {aiResponse && (
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleInsertTasks}
                  disabled={selectedTasks.size === 0}
                  className="flex-1"
                >
                  Insert Selected Tasks ({selectedTasks.size})
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={generateMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyToClipboard}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-500px)]">
                {/* Tasks Section */}
                <Collapsible open={openSections.tasks} onOpenChange={() => toggleSection('tasks')}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg mb-2">
                    <h3 className="font-semibold">Tasks ({aiResponse.tasks.length})</h3>
                    {openSections.tasks ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3">
                    {aiResponse.tasks.map((task, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedTasks.has(index)}
                              onCheckedChange={() => toggleTaskSelection(index)}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <Badge
                                  variant={
                                    task.priority === 'High'
                                      ? 'destructive'
                                      : task.priority === 'Medium'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {task.priority}
                                </Badge>
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline">Team: {task.assignedTo}</Badge>
                                {task.dueDate && (
                                  <Badge variant="outline">Due: {task.dueDate}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-4" />

                {/* Timeline Section */}
                <Collapsible open={openSections.timeline} onOpenChange={() => toggleSection('timeline')}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg mb-2">
                    <h3 className="font-semibold">Timeline ({aiResponse.timeline.length})</h3>
                    {openSections.timeline ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2">
                      {aiResponse.timeline.map((item, index) => (
                        <div key={index} className="flex gap-3 p-3 border rounded-lg">
                          <Badge variant="outline" className="shrink-0">
                            {item.day}
                          </Badge>
                          <p className="text-sm flex-1">{item.milestone}</p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-4" />

                {/* Budget Suggestions Section */}
                <Collapsible open={openSections.budget} onOpenChange={() => toggleSection('budget')}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg mb-2">
                    <h3 className="font-semibold">Budget Suggestions ({aiResponse.budgetSuggestions.length})</h3>
                    {openSections.budget ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2">
                      {aiResponse.budgetSuggestions.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="text-sm font-medium">{item.item}</span>
                          <Badge variant="secondary">₹{item.estimatedAmount}</Badge>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-4" />

                {/* Team Suggestions Section */}
                <Collapsible open={openSections.teams} onOpenChange={() => toggleSection('teams')}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg mb-2">
                    <h3 className="font-semibold">Team Suggestions ({aiResponse.teamSuggestions.length})</h3>
                    {openSections.teams ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2">
                      {aiResponse.teamSuggestions.map((item, index) => (
                        <Card key={index}>
                          <CardContent className="p-3">
                            <h4 className="font-medium text-sm mb-1">{item.role}</h4>
                            <p className="text-xs text-muted-foreground">{item.responsibility}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </ScrollArea>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

