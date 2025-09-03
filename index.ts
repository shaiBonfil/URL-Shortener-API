// Import necessary modules
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { nanoid } from 'nanoid';
import connectDB from './config/db.js';
import Url, { IUrl } from './models/url.js';

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

// Initialize the Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON bodies

// --- API Routes ---

/**
 * @route   POST /api/shorten
 * @desc    Create a short URL
 */
app.post('/api/shorten', async (req: Request, res: Response) => {
    const { originalUrl }: { originalUrl: string } = req.body;
    const baseUrl = process.env.BASE_URL;

    // Validate the original URL
    if (!originalUrl || !isValidUrl(originalUrl)) {
        return res.status(400).json({ error: 'Invalid URL provided.' });
    }

    try {
        // Check if the URL has already been shortened
        let url: IUrl | null = await Url.findOne({ originalUrl });

        if (url) {
            // If it exists, return the existing short URL
            res.json(url);
        } else {
            // If not, create a new short URL
            const urlId = nanoid(7); // Generate a unique short ID
            const shortUrl = `${baseUrl}/${urlId}`;

            url = new Url({
                originalUrl,
                shortUrl,
                urlId,
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
        const url: IUrl | null = await Url.findOne({ urlId: req.params.urlId });

        if (url) {
            // Increment the click count
            url.clicks++;
            await url.save();
            
            // Redirect to the original URL
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


// Start the server
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
