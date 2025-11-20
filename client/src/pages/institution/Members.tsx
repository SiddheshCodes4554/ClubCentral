import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { InstitutionMembersResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Users, UserCheck, Shield, User, ChevronDown, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function InstitutionMembersPage() {
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());
  const { data, isLoading } = useQuery({
    queryKey: ['institution-members'],
    queryFn: () => apiRequest<InstitutionMembersResponse>('GET', '/api/institution/members'),
  });

  const toggleClub = (clubId: string) => {
    const newExpanded = new Set(expandedClubs);
    if (newExpanded.has(clubId)) {
      newExpanded.delete(clubId);
    } else {
      newExpanded.add(clubId);
    }
    setExpandedClubs(newExpanded);
  };

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const getRoleBadge = (member: InstitutionMembersResponse['clubMembers'][0]['members'][0]) => {
    if (member.isPending) {
      return <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600"><User className="h-3 w-3" />Pending</Badge>;
    }
    if (member.isPresident) {
      return <Badge variant="default" className="gap-1"><Crown className="h-3 w-3" />President</Badge>;
    }
    if (member.role === 'Vice-President') {
      return <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" />VP</Badge>;
    }
    if (member.canLogin) {
      return <Badge variant="outline" className="gap-1"><UserCheck className="h-3 w-3" />Core</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><User className="h-3 w-3" />Member</Badge>;
  };

  const clubMembersData = data.clubMembers || [];
  const clubTeamsData = data.clubTeams || [];

  // Combine club data - backend ensures all clubs are in clubMembers
  const clubsWithData = clubMembersData.map((clubMember) => {
    const clubTeam = clubTeamsData.find((ct) => ct.clubId === clubMember.clubId);
    return {
      ...clubMember,
      teams: clubTeam?.teams || [],
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Member Insights</h1>
        <p className="text-sm text-muted-foreground">
          View total members, core councils, and club-wise member distribution.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.totals.members}</p>
            <p className="text-xs text-muted-foreground mt-1">Across all clubs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Core Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.totals.coreMembers}</p>
            <p className="text-xs text-muted-foreground mt-1">With login access</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Normal Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.totals.generalMembers}</p>
            <p className="text-xs text-muted-foreground mt-1">General members</p>
          </CardContent>
        </Card>
      </div>

      {/* Club List with Members and Teams */}
      {clubsWithData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clubs yet</h3>
            <p className="text-sm text-muted-foreground">Clubs will appear here once they are created.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {clubsWithData.map((club) => {
            const isExpanded = expandedClubs.has(club.clubId);
            return (
              <Card key={club.clubId} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleClub(club.clubId)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="text-lg">{club.clubName}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {club.department || 'General'} · {club.members.length} members · {club.teams.length} teams
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{club.members.length} members</Badge>
                          <Badge variant="outline">{club.teams.length} teams</Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <Tabs defaultValue="members" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="members">Members</TabsTrigger>
                          <TabsTrigger value="teams">Teams</TabsTrigger>
                        </TabsList>
                        <TabsContent value="members" className="mt-4">
                          {club.members.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                              No members in this club yet
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {club.members.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{member.name}</p>
                                      <p className="text-xs text-muted-foreground">{member.email}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getRoleBadge(member)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                        <TabsContent value="teams" className="mt-4">
                          {club.teams.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                              No teams in this club yet
                            </div>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                              {club.teams.map((team) => (
                                <div
                                  key={team.id}
                                  className="p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-semibold text-sm">{team.name}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                                    </Badge>
                                  </div>
                                  {team.description && (
                                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{team.description}</p>
                                  )}
                                  {team.captainName && (
                                    <p className="text-xs text-muted-foreground">
                                      Captain: <span className="font-medium">{team.captainName}</span>
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

