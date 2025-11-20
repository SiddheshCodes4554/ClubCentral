import "dotenv/config";
import { storage } from "../server/storage";
import { nanoid } from "nanoid";

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function runVerification() {
    console.log("Starting verification...");

    // 1. Create a test election
    const institution = await storage.createInstitution({
        name: "Test Inst " + nanoid(),
        type: "College",
        code: nanoid(12),
        adminEmail: "test@example.com",
    });

    const club = await storage.createClub({
        name: "Test Club " + nanoid(),
        institutionId: institution.id,
        description: "Test Club Desc",
        code: nanoid(10),
    });

    const election = await storage.createElection({
        title: "Test Election " + nanoid(),
        clubId: club.id,
        institutionId: institution.id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000), // 1 hour later
        accessCode: nanoid(10),
        status: "active",
    });

    const candidate = await storage.createElectionCandidate({
        electionId: election.id,
        candidateName: "Test Candidate",
    });

    console.log(`Created election: ${election.title} (${election.accessCode})`);
    console.log(`Created candidate: ${candidate.id}`);

    // 2. Vote without cookie
    console.log("\nTest 1: Voting without cookie...");
    const res1 = await fetch(`${BASE_URL}/api/elections/${election.accessCode}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id }),
    });

    if (res1.status !== 200) {
        console.error("Vote 1 failed:", await res1.text());
        process.exit(1);
    }

    const cookieHeader = res1.headers.get("set-cookie");
    if (!cookieHeader) {
        console.error("Vote 1 did not return a cookie!");
        process.exit(1);
    }
    console.log("Vote 1 successful. Received cookie:", cookieHeader);

    // Extract the cookie value
    const cookieMatch = cookieHeader.match(/vote_token_[^=]+=[^;]+/);
    const cookie = cookieMatch ? cookieMatch[0] : null;

    if (!cookie) {
        console.error("Could not extract cookie value");
        process.exit(1);
    }

    // 3. Vote again WITH cookie (should fail)
    console.log("\nTest 2: Voting again with same cookie...");
    const res2 = await fetch(`${BASE_URL}/api/elections/${election.accessCode}/vote`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": cookie
        },
        body: JSON.stringify({ candidateId: candidate.id }),
    });

    if (res2.status === 403 || res2.status === 400) { // Assuming 403 or 400 for duplicate
        const text = await res2.text();
        if (text.includes("already voted")) {
            console.log("Vote 2 blocked as expected:", text);
        } else {
            console.warn("Vote 2 failed but maybe not for the right reason:", text);
        }
    } else {
        console.error("Vote 2 succeeded unexpectedly! Status:", res2.status);
        process.exit(1);
    }

    // 4. Vote again WITHOUT cookie (simulating different device, same IP)
    console.log("\nTest 3: Voting again without cookie (different device)...");
    const res3 = await fetch(`${BASE_URL}/api/elections/${election.accessCode}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id }),
    });

    if (res3.status === 200) {
        console.log("Vote 3 successful (simulated different device).");
        const cookie3 = res3.headers.get("set-cookie");
        console.log("Received new cookie:", cookie3);
    } else {
        console.error("Vote 3 failed:", await res3.text());
        process.exit(1);
    }

    console.log("\nVerification PASSED!");
    process.exit(0);
}

runVerification().catch(err => {
    console.error("Verification failed:", err);
    process.exit(1);
});
