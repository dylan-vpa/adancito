
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database path (adjusting for script location: server/scripts -> server/database/adan.db)
const DB_PATH = path.join(__dirname, '../database/adan.db');

console.log(`🔍 Checking database at: ${DB_PATH}`);

if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database file not found!');
    process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

try {
    const users = db.prepare('SELECT id, email, full_name, referral_code FROM users').all() as any[];

    console.log(`📊 Found ${users.length} users in database.\n`);

    const codes = new Map<string, string[]>(); // code -> user_emails[]
    const usersWithoutCode: any[] = [];

    users.forEach(user => {
        if (!user.referral_code) {
            usersWithoutCode.push(user);
        } else {
            const code = user.referral_code;
            if (!codes.has(code)) {
                codes.set(code, []);
            }
            codes.get(code)?.push(user.email);
        }
    });

    console.log('--- Referral Codes ---');
    let duplicateCount = 0;

    codes.forEach((emails, code) => {
        const isDuplicate = emails.length > 1;
        const status = isDuplicate ? '❌ DUPLICATE' : '✅ Unique';
        console.log(`Code: ${code.padEnd(15)} | Status: ${status} | Users: ${emails.join(', ')}`);

        if (isDuplicate) duplicateCount++;
    });

    if (usersWithoutCode.length > 0) {
        console.log('\n--- Users without Referral Code ---');
        usersWithoutCode.forEach(user => {
            console.log(`User: ${user.email} (ID: ${user.id})`);
        });
    }

    console.log('\n--- Summary ---');
    console.log(`Total Codes: ${codes.size}`);
    console.log(`Duplicates Found: ${duplicateCount}`);

    if (duplicateCount === 0) {
        console.log('✨ All referral codes are unique.');
    } else {
        console.error('⚠️  WARNING: Duplicate referral codes detected!');
    }

} catch (error) {
    console.error('Error querying database:', error);
} finally {
    db.close();
}
