const BASE_URL = 'http://127.0.0.1:5000/api';
const USER_ID = '507f1f77bcf86cd799439011';
const headers = { 'Content-Type': 'application/json', 'x-user-id': USER_ID };

async function request(method, path, body = null) {
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE_URL}${path}`, opts);
    const data = await res.json().catch(() => null);
    return { status: res.status, data, ok: res.ok };
}

async function testProfileUpdate() {
    console.log('--- Testing Profile Update ---');
    
    // 1. Get current preferences
    let res = await request('GET', '/settings/preferences');
    console.log('Current Preferences:', JSON.stringify(res.data?.account, null, 2));

    const newTitle = `Engineer ${Date.now()}`;
    const updateData = {
        account: {
            username: 'Test User',
            email: 'test@example.com',
            title: newTitle,
            bio: 'Updated bio',
            avatar: ''
        }
    };

    console.log(`Updating title to: ${newTitle}`);

    // 2. Send Update
    res = await request('PUT', '/settings/preferences', updateData);
    
    if (!res.ok) {
        console.error('Update failed:', res.data);
        throw new Error('Update request failed');
    }

    // 3. Verify Update
    res = await request('GET', '/settings/preferences');
    const updatedAccount = res.data?.account;
    
    console.log('Updated Preferences:', JSON.stringify(updatedAccount, null, 2));
    
    if (updatedAccount?.title !== newTitle) {
        console.error(`❌ Mismatch! Expected title "${newTitle}", got "${updatedAccount?.title}"`);
        throw new Error('Profile update verification failed');
    }

    console.log('✅ Profile updated successfully');
}

testProfileUpdate().catch(err => {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
});
