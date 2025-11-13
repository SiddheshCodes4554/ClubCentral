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
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Finance() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [transactionName, setTransactionName] = useState('');
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const { toast } = useToast();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/finance'],
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/finance', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setOpen(false);
      resetForm();
      toast({
        title: 'Transaction added',
        description: 'The financial entry has been created successfully.',
      });
    },
  });

  const approveTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('PATCH', `/api/finance/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: 'Transaction approved',
        description: 'The transaction has been approved.',
      });
    },
  });

  const resetForm = () => {
    setTransactionName('');
    setType('expense');
    setAmount('');
    setReceiptUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTransactionMutation.mutate({
      transactionName,
      type,
      amount: parseFloat(amount),
      receiptUrl: receiptUrl || undefined,
    });
  };

  const isAdmin = user?.isPresident || user?.role === 'Vice-President';

  const totalIncome = transactions?.filter((t: any) => t.type === 'income' && t.status === 'Approved')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0;
  
  const totalExpense = transactions?.filter((t: any) => t.type === 'expense' && t.status === 'Approved')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0;
  
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-transaction">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Financial Transaction</DialogTitle>
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

              <Button type="submit" className="w-full" disabled={createTransactionMutation.isPending} data-testid="button-submit-transaction">
                {createTransactionMutation.isPending ? 'Adding...' : 'Add Transaction'}
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
            <div className="text-3xl font-bold text-green-600" data-testid="text-total-income">${totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600" data-testid="text-total-expenses">${totalExpense.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-balance">
              ${balance.toFixed(2)}
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
                {isAdmin && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!transactions || transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground py-12">
                    No transactions yet
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction: any) => (
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
                      ${parseFloat(transaction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={transaction.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {transaction.status === 'Pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveTransactionMutation.mutate(transaction.id)}
                            disabled={approveTransactionMutation.isPending}
                            className="gap-2"
                            data-testid={`button-approve-${transaction.id}`}
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </Button>
                        )}
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
