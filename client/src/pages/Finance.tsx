import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, TrendingDown, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Finance as FinanceEntry } from '@shared/schema';
import { hasPermission } from '@/lib/permissions';

interface CreateFinanceInput {
  transactionName: string;
  type: FinanceEntry['type'];
  amount: string;
  receiptUrl?: string;
}

export default function Finance() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [transactionName, setTransactionName] = useState('');
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [statusValue, setStatusValue] = useState<'Pending' | 'Approved'>('Pending');
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const { toast } = useToast();

  if (!user || user.kind !== 'club') {
    return null;
  }

  const { data: transactions = [], isLoading } = useQuery<FinanceEntry[]>({
    queryKey: ['/api/finance'],
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: CreateFinanceInput) => {
      return await apiRequest<FinanceEntry>('POST', '/api/finance', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setOpen(false);
      resetForm();
      setEditingEntry(null);
      toast({
        title: 'Transaction added',
        description: 'The financial entry has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to add transaction', description: error.message, variant: 'destructive' });
    },
  });

  const approveTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest<FinanceEntry>('PATCH', `/api/finance/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: 'Transaction approved',
        description: 'The transaction has been approved.',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to approve transaction', description: error.message, variant: 'destructive' });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateFinanceInput & { status?: string } }) => {
      return await apiRequest<FinanceEntry>('PATCH', `/api/finance/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setOpen(false);
      resetForm();
      setEditingEntry(null);
      toast({ title: 'Transaction updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to update transaction', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest<{ message: string }>('DELETE', `/api/finance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: 'Transaction deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Unable to delete transaction', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setTransactionName('');
    setType('expense');
    setAmount('');
    setReceiptUrl('');
    setStatusValue('Pending');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateFinanceInput & { status?: string } = {
      transactionName,
      type,
      amount,
      receiptUrl: receiptUrl || undefined,
    };

    if (editingEntry) {
      updateTransactionMutation.mutate({ id: editingEntry.id, data: { ...payload, status: statusValue } });
    } else {
      createTransactionMutation.mutate(payload);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingEntry(null);
    setOpen(true);
  };

  const openEditDialog = (entry: FinanceEntry) => {
    setEditingEntry(entry);
    setTransactionName(entry.transactionName);
    setType(entry.type);
    setAmount(entry.amount.toString());
    setReceiptUrl(entry.receiptUrl ?? '');
    setStatusValue(entry.status as 'Pending' | 'Approved');
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingEntry(null);
    resetForm();
  };

  const canApprove = user?.permissions && hasPermission(user.permissions, 'approve_finance');
  const canManage = user?.permissions && hasPermission(user.permissions, 'manage_finance');

  const totalIncome = transactions
    .filter((t) => t.type === 'income' && t.status === 'Approved')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense' && t.status === 'Approved')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const balance = totalIncome - totalExpense;

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Finance</h1>
        <Dialog open={open} onOpenChange={(value) => {
          if (!value) {
            closeDialog();
          } else {
            setOpen(true);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} data-testid="button-add-transaction">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEntry ? 'Edit Financial Transaction' : 'Add Financial Transaction'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transactionName">Transaction Name *</Label>
                <Input
                  id="transactionName"
                  value={transactionName}
                  onChange={(e) => setTransactionName(e.target.value)}
                  required
                  data-testid="input-transaction-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type" data-testid="select-transaction-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    data-testid="input-transaction-amount"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiptUrl">Receipt URL (optional)</Label>
                <Input
                  id="receiptUrl"
                  type="url"
                  placeholder="https://..."
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  data-testid="input-receipt-url"
                />
              </div>

              {editingEntry && (
                <div className="space-y-2">
                  <Label htmlFor="statusSelect">Status</Label>
                  <Select value={statusValue} onValueChange={(value: 'Pending' | 'Approved') => setStatusValue(value)}>
                    <SelectTrigger id="statusSelect">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending} data-testid="button-submit-transaction">
                {editingEntry
                  ? updateTransactionMutation.isPending
                    ? 'Saving...'
                    : 'Save Changes'
                  : createTransactionMutation.isPending
                  ? 'Adding...'
                  : 'Add Transaction'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="text-total-income">₹{totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600" data-testid="text-total-expenses">₹{totalExpense.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-balance">
              ₹{balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                {(canApprove || canManage) && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!transactions || transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={(canApprove || canManage) ? 6 : 5} className="text-center text-muted-foreground py-12">
                    No transactions yet
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.transactionName}</p>
                        {transaction.receiptUrl && (
                          <a href={transaction.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                            View Receipt
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{parseFloat(transaction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={transaction.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </TableCell>
                    {(canApprove || canManage) && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {canApprove && transaction.status !== 'Approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => approveTransactionMutation.mutate(transaction.id)}
                              disabled={approveTransactionMutation.isPending}
                              data-testid={`button-approve-transaction-${transaction.id}`}
                            >
                              <CheckCircle className="h-4 w-4" /> Approve
                            </Button>
                          )}
                          {canManage && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => openEditDialog(transaction)}
                              >
                                <Pencil className="h-4 w-4" /> Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 text-destructive border-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" /> Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
                                    <AlertDialogDescription>This will remove the financial entry permanently.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
