
import "dotenv/config";
import { db } from "../server/db";
import { elections, electionCandidates, clubs, institutions } from "../shared/schema";
import { eq } from "drizzle-orm";
import * as fs from 'fs';

async function main() {
    // 1. Setup test data
    console.log("Setting up test data...");

    // Find or create institution
    let institution = await db.query.institutions.findFirst();
    if (!institution) {
        [institution] = await db.insert(institutions).values({
            name: "Test Inst",
            type: "College",
            code: "TEST01",
            adminEmail: "test@test.com"
        }).returning();
    }

    // Find or create club
    let club = await db.query.clubs.findFirst({
        where: eq(clubs.institutionId, institution.id)
    });
    if (!club) {
        [club] = await db.insert(clubs).values({
            institutionId: institution.id,
            name: "Test Club",
            collegeName: "Test College",
            clubCode: "TESTCLUB",
            description: "Test Club"
        }).returning();
    }

    // Create election
    const accessCode = `test-${Date.now()}`;
    const [election] = await db.insert(elections).values({
        clubId: club.id,
        institutionId: institution.id,
        title: "Test Election",
        startTime: new Date(Date.now() - 10000), // Started 10s ago
        endTime: new Date(Date.now() + 100000), // Ends in 100s
        status: "active",
        accessCode: accessCode
    }).returning();

    // Create candidate
    const [candidate] = await db.insert(electionCandidates).values({
        electionId: election.id,
        candidateName: "Test Candidate",
        voteCount: 0
    }).returning();

    console.log(`Created election ${election.id} with access code ${accessCode}`);
    console.log(`Created candidate ${candidate.id}`);

    // 2. Send vote request
    console.log("Sending vote request...");
    try {
        const response = await fetch(`http://localhost:5000/api/elections/${accessCode}/vote`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                candidateId: candidate.id
            })
        });

        const data = await response.json();
        console.log("Response status:", response.status);
        console.log("Response data:", JSON.stringify(data, null, 2));

        if (data.message) {
            fs.writeFileSync('error_msg.txt', data.message);
        }
    } catch (error: any) {
        console.error("Request failed:", error);
        fs.writeFileSync('error_msg.txt', `Request failed: ${error.message}`);
    }

    process.exit(0);
}

main().catch(console.error);
