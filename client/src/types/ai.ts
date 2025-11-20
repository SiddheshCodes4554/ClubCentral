export type AITask = {
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  priority: string;
};

export type BudgetSuggestion = {
  item: string;
  estimatedAmount: string;
};

export type TimelineItem = {
  day: string;
  milestone: string;
};

export type TeamSuggestion = {
  role: string;
  responsibility: string;
};

export type AIResponse = {
  tasks: AITask[];
  budgetSuggestions: BudgetSuggestion[];
  timeline: TimelineItem[];
  teamSuggestions: TeamSuggestion[];
};

