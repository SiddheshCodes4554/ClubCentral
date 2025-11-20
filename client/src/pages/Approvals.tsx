import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Mail, Phone, Linkedin, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { PendingMember } from '@shared/schema';
import type { MessageResponse } from '@/types/api';

export default function Approvals() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: pendingMembers = [], isLoading } = useQuery<PendingMember[]>({
    queryKey: ['/api/members/pending'],
  });

  useEffect(() => {
    if (pendingMembers.length === 0) {
      setSelectedId(null);
      return;
    }

    const stillExists = pendingMembers.some((member) => member.id === selectedId);
    if (!stillExists) {
      setSelectedId(pendingMembers[0].id);
    }
  }, [pendingMembers, selectedId]);

  const approveMutation = useMutation({
    mutationFn: async (data: { id: string; role: string }) => {
      return await apiRequest<MessageResponse>('POST', `/api/members/approve/${data.id}`, { role: data.role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setSelectedId(null);
      toast({
        title: 'Member approved',
        description: 'The member has been added to your club.',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest<MessageResponse>('DELETE', `/api/members/reject/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setSelectedId(null);
      toast({
        title: 'Application rejected',
        description: 'The application has been removed.',
      });
    },
  });

  const [selectedRole, setSelectedRole] = useState('Member');

  const selected = pendingMembers.find((m) => m.id === selectedId) || null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6">Pending Approvals</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Applications ({pendingMembers?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!pendingMembers || pendingMembers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No pending applications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingMembers.map((member: any) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedId(member.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedId === member.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover-elevate'
                    }`}
                    data-testid={`applicant-${member.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Applicant Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Select an applicant to view details</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">{getInitials(selected.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{selected.name}</h3>
                    <p className="text-sm text-muted-foreground">Applied {new Date(selected.appliedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selected.email}</span>
                  </div>
                  {selected.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selected.phone}</span>
                    </div>
                  )}
                  {selected.idNumber && (
                    <div className="flex items-center gap-3 text-sm">
                      <Badge variant="outline">ID: {selected.idNumber}</Badge>
                    </div>
                  )}
                  {selected.linkedin && (
                    <div className="flex items-center gap-3 text-sm">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  {selected.portfolio && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={selected.portfolio} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Portfolio/GitHub
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <label className="text-sm font-medium">Assign Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger data-testid="select-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Council Head">Council Head (Can Login)</SelectItem>
                      <SelectItem value="Member">Member (Record Only)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Council Heads can log in and manage the club. Members are record-only.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => approveMutation.mutate({ id: selected.id, role: selectedRole })}
                    disabled={approveMutation.isPending}
                    className="flex-1 gap-2"
                    data-testid="button-approve"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => rejectMutation.mutate(selected.id)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 gap-2"
                    data-testid="button-reject"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
