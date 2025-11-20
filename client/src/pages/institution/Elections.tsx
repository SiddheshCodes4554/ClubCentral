
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Vote, Copy, ExternalLink, Trophy, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useAuth } from "@/lib/auth";

export default function InstitutionElections() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedClubId, setSelectedClubId] = useState<string>("");
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
    const [candidateMode, setCandidateMode] = useState<"select" | "manual">("select");
    const [manualCandidates, setManualCandidates] = useState<string[]>([]);
    const [candidateInput, setCandidateInput] = useState("");

    const { data: elections, isLoading: isLoadingElections } = useQuery<any>({
        queryKey: ["/api/institution/elections"],
        enabled: !!(user as any)?.institutionId,
    });

    const { data: clubsResponse } = useQuery<any>({
        queryKey: ["/api/institution/clubs"],
    });
    const clubs = clubsResponse?.clubs;

    const { data: clubDetails } = useQuery<any>({
        queryKey: ["/api/institution/club", selectedClubId],
        enabled: !!selectedClubId,
    });
    const clubUsers = clubDetails?.members;

    const createElectionMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiRequest("POST", "/api/institution/elections", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/institution/elections"] });
            setIsCreateOpen(false);
            toast({
                title: "Election Created",
                description: "The election has been successfully scheduled.",
            });
            setSelectedClubId("");
            setSelectedCandidates([]);
            setCandidateMode("select");
            setManualCandidates([]);
            setCandidateInput("");
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleCreateElection = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const title = formData.get("title");
        const description = formData.get("description");
        const startTime = formData.get("startTime");
        const endTime = formData.get("endTime");

        console.log('[ELECTION CREATE] Form values:', {
            clubId: selectedClubId,
            title,
            description,
            startTime,
            endTime,
            candidateMode,
            selectedCandidates,
            manualCandidates
        });

        const payload: any = {
            clubId: selectedClubId,
            title,
            description,
            startTime: new Date(startTime as string).toISOString(),
            endTime: new Date(endTime as string).toISOString(),
        };

        if (candidateMode === "select") {
            payload.candidateIds = selectedCandidates;
            if (selectedCandidates.length === 0) {
                toast({
                    title: "Validation Error",
                    description: "Please select at least one candidate",
                    variant: "destructive",
                });
                return;
            }
        } else {
            payload.candidateNames = manualCandidates;
            if (manualCandidates.length === 0) {
                toast({
                    title: "Validation Error",
                    description: "Please add at least one candidate",
                    variant: "destructive",
                });
                return;
            }
        }

        console.log('[ELECTION CREATE] Submitting payload:', payload);
        createElectionMutation.mutate(payload);
    };

    const handleAddManualCandidate = () => {
        if (candidateInput.trim() && !manualCandidates.includes(candidateInput.trim())) {
            setManualCandidates([...manualCandidates, candidateInput.trim()]);
            setCandidateInput("");
        }
    };

    const handleRemoveManualCandidate = (name: string) => {
        setManualCandidates(manualCandidates.filter(c => c !== name));
    };

    const copyLink = (accessCode: string) => {
        const url = `${window.location.origin}/vote/${accessCode}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Link Copied",
            description: "Voting link copied to clipboard.",
        });
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Elections</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage club elections and voting sessions.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Election
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New Election</DialogTitle>
                            <DialogDescription>
                                Set up a new election for a club.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateElection} className="space-y-6">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>Club</Label>
                                    <Select
                                        value={selectedClubId}
                                        onValueChange={setSelectedClubId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a club" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clubs?.map((club: any) => (
                                                <SelectItem key={club.id} value={club.id}>
                                                    {club.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="title">Election Title</Label>
                                    <Input id="title" name="title" placeholder="e.g. 2025 President Election" required />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" name="description" placeholder="Brief description of the election..." />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="startTime">Start Time</Label>
                                        <Input id="startTime" name="startTime" type="datetime-local" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="endTime">End Time</Label>
                                        <Input id="endTime" name="endTime" type="datetime-local" required />
                                    </div>
                                </div>

                                {selectedClubId && (
                                    <div className="grid gap-2">
                                        <Label>Candidates</Label>

                                        {/* Mode Toggle */}
                                        <div className="flex gap-2 mb-2">
                                            <Button
                                                type="button"
                                                variant={candidateMode === "select" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCandidateMode("select")}
                                            >
                                                Select from Members
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={candidateMode === "manual" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCandidateMode("manual")}
                                            >
                                                Enter Manually
                                            </Button>
                                        </div>

                                        {/* Select from Members Mode */}
                                        {candidateMode === "select" && (
                                            <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                                                {clubUsers?.map((user: any) => (
                                                    <div key={user.id} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`candidate-${user.id}`}
                                                            checked={selectedCandidates.includes(user.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedCandidates([...selectedCandidates, user.id]);
                                                                } else {
                                                                    setSelectedCandidates(selectedCandidates.filter(id => id !== user.id));
                                                                }
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-300"
                                                        />
                                                        <Label htmlFor={`candidate-${user.id}`}>{user.name} ({user.email})</Label>
                                                    </div>
                                                ))}
                                                {(!clubUsers || clubUsers.length === 0) && (
                                                    <p className="text-sm text-muted-foreground">No members found in this club.</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Manual Entry Mode */}
                                        {candidateMode === "manual" && (
                                            <div className="space-y-3">
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Enter candidate name"
                                                        value={candidateInput}
                                                        onChange={(e) => setCandidateInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddManualCandidate();
                                                            }
                                                        }}
                                                    />
                                                    <Button type="button" onClick={handleAddManualCandidate}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                                                    {manualCandidates.map((name, index) => (
                                                        <div key={index} className="flex items-center justify-between bg-secondary/50 px-3 py-2 rounded">
                                                            <span className="text-sm">{name}</span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveManualCandidate(name)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    {manualCandidates.length === 0 && (
                                                        <p className="text-sm text-muted-foreground">No candidates added yet.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={createElectionMutation.isPending}>
                                    {createElectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Election
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoadingElections ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {elections?.map((election: any) => (
                        <Card key={election.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <Badge variant={election.status === 'active' ? 'default' : 'secondary'}>
                                        {election.status}
                                    </Badge>
                                    <div className="flex items-center gap-2">
                                        <DeleteElectionButton electionId={election.id} electionTitle={election.title} />
                                        <Vote className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <CardTitle className="mt-2">{election.title}</CardTitle>
                                <CardDescription>{election.clubName}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-sm text-muted-foreground">
                                        <p>Starts: {format(new Date(election.startTime), "PPp")}</p>
                                        <p>Ends: {format(new Date(election.endTime), "PPp")}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1" onClick={() => copyLink(election.accessCode)}>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy Link
                                        </Button>
                                        <Button variant="secondary" className="flex-1" asChild>
                                            <a href={`/vote/${election.accessCode}`} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                View
                                            </a>
                                        </Button>
                                    </div>

                                    <ResultsDialog electionId={election.id} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {(!elections || elections.length === 0) && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No elections found. Create one to get started.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ResultsDialog({ electionId }: { electionId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const { data, isLoading } = useQuery<any>({
        queryKey: ["/api/institution/elections", electionId, "results"],
        enabled: isOpen,
    });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <Trophy className="mr-2 h-4 w-4" />
                    View Results
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Election Results</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data?.results.sort((a: any, b: any) => b.voteCount - a.voteCount).map((result: any, index: number) => (
                            <div key={result.candidateId} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                <div className="flex items-center gap-4">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${index === 0 ? "bg-yellow-100 text-yellow-700" :
                                        index === 1 ? "bg-gray-100 text-gray-700" :
                                            index === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-700"
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <span className="font-medium">{result.name}</span>
                                </div>
                                <Badge variant="secondary" className="text-lg px-3">
                                    {result.voteCount}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function DeleteElectionButton({ electionId, electionTitle }: { electionId: string; electionTitle: string }) {
    const { toast } = useToast();
    const deleteElectionMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("DELETE", `/api/institution/elections/${electionId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/institution/elections"] });
            toast({
                title: "Election Deleted",
                description: `"${electionTitle}" has been removed.`,
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={deleteElectionMutation.isPending}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete election?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. The election and all associated votes will be permanently deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteElectionMutation.isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleteElectionMutation.isPending}
                        onClick={() => deleteElectionMutation.mutate()}
                    >
                        {deleteElectionMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
