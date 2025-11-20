import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function VotePage() {
    const [, params] = useRoute("/vote/:accessCode");
    const accessCode = params?.accessCode;
    const { toast } = useToast();
    const [selectedCandidate, setSelectedCandidate] = useState<string>("");
    const [hasVoted, setHasVoted] = useState(false);

    const { data: election, isLoading, error } = useQuery({
        queryKey: ["/api/elections", accessCode],
        enabled: !!accessCode,
    });

    const voteMutation = useMutation({
        mutationFn: async (candidateId: string) => {
            return await apiRequest("POST", `/api/elections/${accessCode}/vote`, {
                candidateId,
            });
        },
        onSuccess: () => {
            setHasVoted(true);
            toast({
                title: "Vote Cast",
                description: "Your vote has been recorded successfully.",
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !election) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <CardTitle>Election Not Found</CardTitle>
                        <CardDescription>
                            The election link you used is invalid or has expired.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (hasVoted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <div className="mx-auto bg-green-100 p-3 rounded-full mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">Vote Recorded!</CardTitle>
                        <CardDescription>
                            Thank you for participating in the <strong>{election.title}</strong>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Your vote has been securely cast and anonymized.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const now = new Date();
    const startTime = new Date(election.startTime);
    const endTime = new Date(election.endTime);
    const notStarted = now < startTime;
    const ended = now > endTime;

    if (notStarted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <CardTitle>{election.title}</CardTitle>
                        <CardDescription>{election.clubName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="py-8">
                            <p className="text-lg font-medium text-muted-foreground">
                                Voting has not started yet.
                            </p>
                            <p className="mt-2">
                                Please come back at {format(startTime, "PPp")}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (ended) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <CardTitle>{election.title}</CardTitle>
                        <CardDescription>{election.clubName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="py-8">
                            <p className="text-lg font-medium text-muted-foreground">
                                Voting has ended.
                            </p>
                            <p className="mt-2">
                                The election closed at {format(endTime, "PPp")}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        {election.institutionName}
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Official Voting Portal
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{election.title}</CardTitle>
                        <CardDescription>
                            {election.clubName} • Ends {format(endTime, "PPp")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="prose prose-sm max-w-none text-muted-foreground">
                            <p>{election.description}</p>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-base font-semibold">Select a Candidate</Label>
                            <RadioGroup
                                value={selectedCandidate}
                                onValueChange={setSelectedCandidate}
                                className="space-y-3"
                            >
                                {election.candidates.map((candidate: any) => (
                                    <div key={candidate.id} className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value={candidate.id}
                                            id={candidate.id}
                                            className="peer sr-only"
                                        />
                                        <Label
                                            htmlFor={candidate.id}
                                            className="flex flex-1 items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg">
                                                    {candidate.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold">{candidate.name}</div>
                                                    <div className="text-sm text-muted-foreground">{candidate.role}</div>
                                                </div>
                                            </div>
                                            <div className="h-4 w-4 rounded-full border border-primary opacity-0 peer-data-[state=checked]:opacity-100 bg-primary" />
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full text-lg py-6"
                            size="lg"
                            disabled={!selectedCandidate || voteMutation.isPending}
                            onClick={() => voteMutation.mutate(selectedCandidate)}
                        >
                            {voteMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Submitting Vote...
                                </>
                            ) : (
                                "Cast Vote"
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                <p className="text-center text-xs text-muted-foreground">
                    Your vote is anonymous. IP tracking is used to prevent duplicate voting.
                </p>
            </div>
        </div>
    );
}
