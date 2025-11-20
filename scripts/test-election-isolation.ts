
import { storage } from "../server/storage";
import { db } from "../server/db";
import { institutions, institutionUsers, clubs, elections, users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

async function main() {
    console.log("Starting election isolation test...");

    // Cleanup previous test data
    const testCodeA = "TEST_INST_A";
    const testCodeB = "TEST_INST_B";

    const existingA = await storage.getInstitutionByCode(testCodeA);
    if (existingA) {
        // Delete manually to cascade if needed, though schema handles cascade
        await db.delete(institutions).where(eq(institutions.id, existingA.id));
    }
    const existingB = await storage.getInstitutionByCode(testCodeB);
    if (existingB) {
        await db.delete(institutions).where(eq(institutions.id, existingB.id));
    }

    // 1. Create Institution A
    const instA = await storage.createInstitution({
        name: "Test Institution A",
        type: "University",
        code: testCodeA,
        adminEmail: "admin@a.com",
        phone: "1234567890"
    });
    console.log("Created Institution A:", instA.id);

    // 2. Create Institution B
    const instB = await storage.createInstitution({
        name: "Test Institution B",
        type: "University",
        code: testCodeB,
        adminEmail: "admin@b.com",
        phone: "0987654321"
    });
    console.log("Created Institution B:", instB.id);

    // 3. Create Club for Inst A
    const clubA = await storage.createClub({
        institutionId: instA.id,
        name: "Club A",
        collegeName: "College A",
        clubCode: "CLUBA",
        description: "Test Club A"
    });
    console.log("Created Club A:", clubA.id);

    // 4. Create Election for Inst A
    const electionA = await storage.createElection({
        clubId: clubA.id,
        institutionId: instA.id,
        title: "Election A",
        description: "Test Election A",
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
        status: "scheduled",
        accessCode: "VOTE_A_" + Date.now()
    });
    console.log("Created Election A for Inst A:", electionA.id);

    // 5. Fetch elections for Inst A (Should see Election A)
    const electionsA = await storage.getElectionsByInstitution(instA.id);
    console.log("Elections for Inst A:", electionsA.length);
    if (electionsA.length !== 1 || electionsA[0].id !== electionA.id) {
        console.error("FAIL: Inst A should see exactly 1 election (Election A)");
        process.exit(1);
    }

    // 6. Fetch elections for Inst B (Should see 0 elections)
    const electionsB = await storage.getElectionsByInstitution(instB.id);
    console.log("Elections for Inst B:", electionsB.length);

    if (electionsB.length !== 0) {
        console.error("FAIL: Inst B should see 0 elections, but saw:", electionsB.length);
        console.log("Leaked elections:", electionsB);
        process.exit(1);
    }

    console.log("SUCCESS: Election isolation verified. Inst B cannot see Inst A's elections.");

    // Cleanup
    await db.delete(institutions).where(eq(institutions.id, instA.id));
    await db.delete(institutions).where(eq(institutions.id, instB.id));
    console.log("Cleanup complete.");
}

main().catch(console.error);
