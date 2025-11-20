
import "dotenv/config";
import { db } from "../server/db";
import { elections, electionCandidates } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Fetching elections...");
    const allElections = await db.select().from(elections);

    if (allElections.length === 0) {
        console.log("No elections found.");
        return;
    }

    for (const election of allElections) {
        console.log(`\nElection: ${election.title} (ID: ${election.id})`);
        console.log(`Access Code: ${election.accessCode}`);
        console.log(`Status: ${election.status}`);
        console.log(`Start Time: ${election.startTime}`);
        console.log(`End Time: ${election.endTime}`);

        const candidates = await db.select().from(electionCandidates).where(eq(electionCandidates.electionId, election.id));
        console.log("Candidates:");
        candidates.forEach(c => {
            console.log(`  - ID: ${c.id}, Name: ${c.candidateName || 'User Linked'}, Votes: ${c.voteCount}`);
        });
    }
    process.exit(0);
}

main().catch(console.error);
