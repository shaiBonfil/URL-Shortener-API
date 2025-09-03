import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface to define the properties of a URL document
export interface IUrl extends Document {
    urlId: string;
    originalUrl: string;
    shortUrl: string;
    clicks: number;
    date: Date;
}

const urlSchema: Schema<IUrl> = new mongoose.Schema({
    urlId: {
        type: String,
        required: true,
        unique: true,
    },
    originalUrl: {
        type: String,
        required: true,
    },
    shortUrl: {
        type: String,
        required: true,
        unique: true,
    },
    clicks: {
        type: Number,
        required: true,
        default: 0,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const Url: Model<IUrl> = mongoose.model<IUrl>('Url', urlSchema);

export default Url;
