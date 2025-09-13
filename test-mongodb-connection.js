// Test MongoDB connection
import { MongoClient } from 'mongodb';

async function testMongoDBConnection() {
    console.log('🔍 Testing MongoDB connection...');
    
    // MongoDB connection string
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'spacio_ai_conversations';
    
    console.log('📡 MongoDB URI:', MONGODB_URI);
    console.log('🗄️ Database Name:', MONGODB_DB_NAME);
    
    let client;
    
    try {
        // Test 1: Basic connection
        console.log('\n📝 Test 1: Basic MongoDB connection...');
        client = new MongoClient(MONGODB_URI);
        
        await client.connect();
        console.log('✅ MongoDB connection successful!');
        
        // Test 2: Database access
        console.log('\n📝 Test 2: Database access...');
        const db = client.db(MONGODB_DB_NAME);
        console.log('✅ Database access successful!');
        
        // Test 3: Collection operations
        console.log('\n📝 Test 3: Collection operations...');
        const collection = db.collection('conversations');
        
        // Test insert
        const testDoc = {
            sessionId: `test_${Date.now()}`,
            userId: 'test_user',
            startTime: new Date(),
            messages: [],
            status: 'active',
            bookingStatus: 'none',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const insertResult = await collection.insertOne(testDoc);
        console.log('✅ Document inserted with ID:', insertResult.insertedId);
        
        // Test find
        const findResult = await collection.findOne({ _id: insertResult.insertedId });
        console.log('✅ Document found:', findResult ? 'Yes' : 'No');
        
        // Test update
        const updateResult = await collection.updateOne(
            { _id: insertResult.insertedId },
            { $set: { status: 'completed', updatedAt: new Date() } }
        );
        console.log('✅ Document updated:', updateResult.modifiedCount > 0 ? 'Yes' : 'No');
        
        // Test delete
        const deleteResult = await collection.deleteOne({ _id: insertResult.insertedId });
        console.log('✅ Document deleted:', deleteResult.deletedCount > 0 ? 'Yes' : 'No');
        
        // Test 4: Database stats
        console.log('\n📝 Test 4: Database statistics...');
        const stats = await db.stats();
        console.log('📊 Database stats:', {
            database: stats.db,
            collections: stats.collections,
            dataSize: stats.dataSize,
            storageSize: stats.storageSize,
            indexes: stats.indexes
        });
        
        // Test 5: List collections
        console.log('\n📝 Test 5: List collections...');
        const collections = await db.listCollections().toArray();
        console.log('📋 Collections in database:', collections.map(c => c.name));
        
        // Test 6: Server info
        console.log('\n📝 Test 6: Server information...');
        const serverInfo = await db.admin().serverStatus();
        console.log('🖥️ Server info:', {
            version: serverInfo.version,
            uptime: serverInfo.uptime,
            connections: serverInfo.connections,
            mem: serverInfo.mem
        });
        
        console.log('\n🎉 All MongoDB connection tests passed successfully!');
        
    } catch (error) {
        console.error('❌ MongoDB connection test failed:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('🔍 Possible issues:');
            console.log('   - MongoDB service is not running');
            console.log('   - MongoDB is not installed');
            console.log('   - Wrong port (default: 27017)');
            console.log('   - Firewall blocking connection');
        } else if (error.message.includes('authentication')) {
            console.log('🔍 Possible issues:');
            console.log('   - Authentication required');
            console.log('   - Wrong username/password');
            console.log('   - Database access permissions');
        } else if (error.message.includes('timeout')) {
            console.log('🔍 Possible issues:');
            console.log('   - Network connectivity issues');
            console.log('   - MongoDB server overloaded');
            console.log('   - Connection timeout settings');
        }
        
        console.log('\n💡 Troubleshooting steps:');
        console.log('1. Check if MongoDB is running: mongod --version');
        console.log('2. Start MongoDB service: net start MongoDB');
        console.log('3. Check MongoDB logs for errors');
        console.log('4. Verify connection string format');
        console.log('5. Check firewall and network settings');
        
    } finally {
        if (client) {
            await client.close();
            console.log('✅ MongoDB connection closed');
        }
    }
}

// Test with different connection strings
async function testMultipleConnections() {
    console.log('\n🔍 Testing multiple connection scenarios...');
    
    const connectionStrings = [
        'mongodb://localhost:27017',
        'mongodb://127.0.0.1:27017',
        'mongodb://localhost:27017/spacio_ai_conversations',
        'mongodb://localhost:27017/?retryWrites=true&w=majority'
    ];
    
    for (const uri of connectionStrings) {
        console.log(`\n📡 Testing connection: ${uri}`);
        
        try {
            const client = new MongoClient(uri);
            await client.connect();
            console.log('✅ Connection successful!');
            await client.close();
        } catch (error) {
            console.log('❌ Connection failed:', error.message);
        }
    }
}

// Run tests
async function runAllTests() {
    await testMongoDBConnection();
    await testMultipleConnections();
}

runAllTests();
