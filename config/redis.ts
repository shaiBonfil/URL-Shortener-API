import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.error('Redis URL not found in environment variables');
    process.exit(1);
}

const redisClient = createClient({
    url: redisUrl,
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));

(async () => {
    await redisClient.connect();
    console.log('✅ Connected to Redis successfully!');
})();

export default redisClient;
