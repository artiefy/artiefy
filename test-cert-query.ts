import { eq } from 'drizzle-orm';

import { db } from './src/server/db/index';
import {
    certificationTypes,
    scheduleOptions,
    spaceOptions,
} from './src/server/db/schema';

async function testQueries() {
    console.log('🧪 Testing queries...\n');

    // Test certificationTypes
    console.log('1️⃣  Testing certificationTypes table:');
    const certResult = await db
        .select({ name: certificationTypes.name })
        .from(certificationTypes)
        .where(eq(certificationTypes.id, 1));
    console.log('Result:', certResult);

    // Test scheduleOptions
    console.log('\n2️⃣  Testing scheduleOptions table:');
    const scheduleResult = await db
        .select({ name: scheduleOptions.name })
        .from(scheduleOptions)
        .where(eq(scheduleOptions.id, 1));
    console.log('Result:', scheduleResult);

    // Test spaceOptions
    console.log('\n3️⃣  Testing spaceOptions table:');
    const spaceResult = await db
        .select({ name: spaceOptions.name })
        .from(spaceOptions)
        .where(eq(spaceOptions.id, 1));
    console.log('Result:', spaceResult);
}

testQueries().catch(console.error);
