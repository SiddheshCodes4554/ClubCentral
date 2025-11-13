import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Members() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: members, isLoading } = useQuery({
    queryKey: ['/api/members'],
  });

  const coreMembers = members?.filter((m: any) => m.canLogin) || [];
  const regularMembers = members?.filter((m: any) => !m.canLogin) || [];

  const filterMembers = (membersList: any[]) => {
    return membersList.filter(m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const MemberTable = ({ membersList }: { membersList: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {membersList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
              No members found
            </TableCell>
          </TableRow>
        ) : (
          membersList.map((member: any) => (
            <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={member.isPresident ? 'default' : 'secondary'}>
                  {member.role}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {member.phone && <p>{member.phone}</p>}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                      LinkedIn
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(member.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

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
        <h1 className="text-3xl font-semibold">Members</h1>
      </div>

      <Tabs defaultValue="core" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="core" data-testid="tab-core-members">
              Core Members ({coreMembers.length})
            </TabsTrigger>
            <TabsTrigger value="regular" data-testid="tab-regular-members">
              Regular Members ({regularMembers.length})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-members"
            />
          </div>
        </div>

        <TabsContent value="core">
          <Card>
            <CardHeader>
              <CardTitle>Core Council Members</CardTitle>
              <p className="text-sm text-muted-foreground">Members with login access and management permissions</p>
            </CardHeader>
            <CardContent>
              <MemberTable membersList={filterMembers(coreMembers)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regular">
          <Card>
            <CardHeader>
              <CardTitle>Regular Members</CardTitle>
              <p className="text-sm text-muted-foreground">Record-only members without login access</p>
            </CardHeader>
            <CardContent>
              <MemberTable membersList={filterMembers(regularMembers)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
