import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { nanoid } from 'nanoid';
import cron from 'node-cron';
import connectDB from './config/db.js';
import redisClient from './config/redis.js';
import Url, { IUrl } from './models/url.js';

dotenv.config();

connectDB();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Cron Job for Cleanup ---
// Schedule a job to run at midnight every day to delete expired links
cron.schedule('0 0 * * *', async () => {
    try {
        const now = new Date();
        const result = await Url.deleteMany({ expiresAt: { $ne: null, $lte: now } });
        console.log(`Expired link cleanup job ran. Deleted ${result.deletedCount} links.`);
    } catch (err) {
        console.error('Error running expired link cleanup job:', err);
    }
});

// --- API Routes ---

/**
 * @route   POST /api/shorten
 * @desc    Create a short URL
 */
app.post('/api/shorten', async (req: Request, res: Response) => {
    const { originalUrl, ttl }: { originalUrl: string, ttl: number } = req.body;
    const baseUrl = process.env.BASE_URL;

    // Validate the original URL
    if (!originalUrl || !isValidUrl(originalUrl)) {
        return res.status(400).json({ error: 'Invalid URL provided.' });
    }

    let expiresAt: Date | null = null;
    if (ttl && typeof ttl === 'number' && ttl > 0) {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + ttl);
    }

    try {
        let url: IUrl | null = await Url.findOne({ originalUrl });

        if (url) {
            res.json(url);
        } else {
            const urlId = nanoid(7);
            const shortUrl = `${baseUrl}/${urlId}`;

            url = new Url({
                originalUrl,
                shortUrl,
                urlId,
                expiresAt,
                date: new Date()
            });

            await url.save();
            res.status(201).json(url);
        }
    } catch (err: any) {
        console.error('Server Error:', err.message);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

/**
 * @route   GET /:urlId
 * @desc    Redirect to the original URL
 */
app.get('/:urlId', async (req: Request, res: Response) => {
    try {
        const { urlId } = req.params;

        const cachedUrl = await redisClient.get(urlId);

        if (cachedUrl) {
            console.log(`CACHE HIT for ${urlId}`);
            if (cachedUrl === 'EXPIRED') {
                return res.status(410).json('Link has expired');
            }
            Url.updateOne({ urlId }, { $inc: { clicks: 1 } }).exec();
            return res.redirect(cachedUrl);
        }

        console.log(`CACHE MISS for ${urlId}`);
        const url: IUrl | null = await Url.findOne({ urlId });

        if (url) {
            if (url.expiresAt && url.expiresAt.getTime() < Date.now()) {
                Url.deleteOne({ urlId }).exec();
                // Cache the expired status for 5 minutes to prevent DB hits
                await redisClient.set(urlId, 'EXPIRED', { EX: 300 });
                return res.status(410).json({ error: 'Link has expired' });
            }
            
            // Set an expiration time of 24 hours (86400 seconds)
            await redisClient.set(urlId, url.originalUrl, { EX: 86400 });

            url.clicks++;
            await url.save();
            return res.redirect(url.originalUrl);
        } else {
            return res.status(404).json({ error: 'No URL found.' });
        }
    } catch (err: any) {
        console.error('Server Error:', err.message);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Helper function to validate URL format
function isValidUrl(string: string): boolean {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

app.listen(port, () => {
    console.log(`✅ Server is running on port: ${port}`);
    console.log('🕒 Cron job for expired link cleanup is scheduled.');
});
