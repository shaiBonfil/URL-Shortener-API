# Node.js URL Shortener API (TypeScript)
This is a backend project that creates a URL shortener service using Node.js, Express, MongoDB, and TypeScript, with a Redis caching layer for performance and support for temporary links.

## Features
- Generate permanent or temporary a short URL from a long original URL.

- Redirect from a short URL to the original URL.

- Cache frequently accessed URLs with Redis for faster redirects.

- Track the number of clicks for each short URL.

- Automatically delete expired links with a daily background job.

## Technologies Used
- **Node.js:** JavaScript runtime environment.

- **Express.js:** Web framework for Node.js.

- **TypeScript:** Superset of JavaScript that adds static types.

- **MongoDB:** NoSQL database for storing URL data.

- **Redis:** In-memory data store used for caching.

- **Mongoose:** Object Data Modeling (ODM) library for MongoDB.

- **nanoid:** For generating unique, URL-friendly short IDs.

- **node-cron:** For scheduling background cleanup jobs.

- **dotenv:** For managing environment variables.

- **cors:** For enabling Cross-Origin Resource Sharing.

## Prerequisites
- [Node.js](https://nodejs.org/) (version 16 or higher).

- [Docker](https://www.docker.com/products/docker-desktop/) & [Docker Compose](https://docs.docker.com/compose/install/) (if you choose the local MongoDB option).

## Getting Started
### 1. Clone the Repository
```
git clone <repository-url>
cd url-shortener-ts
```

### 2. Configure Your Environment
Create a `.env` file in the root directory and add the following variables:
```
PORT=5000
BASE_URL="http://localhost:5000"
MONGO_URI=
REDIS_URL="redis://localhost:6379"
```

### 3. Choose and Configure Your Database
You have two options for your MongoDB database. Choose one and configure your `MONGO_URI` in the `.env` file accordingly.

#### Option A: Use Docker for Local Development (Recommended)
This is the quickest way to get a database running locally.

  #### 1. Start the MongoDB Container:
  Make sure Docker is running, then execute the following command in your terminal:
  ```
  docker-compose up -d
  ```

  #### 2. Configure `.env`:
  Use the following connection string in your `.env` file to connect to the Docker container:
  ```
  MONGO_URI="mongodb://user:password@localhost:27017/url-shortener?authSource=admin"
  ```

  #### Option B: Use MongoDB Atlas (Cloud Database)
  This option is great for staging or production environments.

  #### 1. Set up Atlas:

  - Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

  - Create a new cluster.

  - Create a database user and make a note of the username and password.

  - Whitelist your IP address to allow connections to your cluster.

  #### 2. Configure `.env`:
  Get your connection string from the Atlas dashboard and update it with your credentials. It will look like this:
  ```
  MONGO_URI="mongodb+srv://<user>:<password>@<cluster-url>/url-shortener?retryWrites=true&w=majority"
  ```

### 4. Install Dependencies
Once your database is configured, install the project dependencies:
```
npm install
```

## Running the Application
- **For development** (with automatic server restarts on file changes):
```
npm run dev
```

- **For production:**
```
# 1. Build the project (compiles .ts to .js in /dist)
npm run build

# 2. Start the server from the compiled files
npm start
```

The server will start on the port specified in your `.env` file (default is 5000).

## API Endpoints

#### Create a Short URL
- **URL:** `/api/shorten`

- **Method:** `POST`

- **Body:**
```
{
  "originalUrl": "[https://www.example.com/a-very-long-url-to-shorten](https://www.example.com/a-very-long-url-to-shorten)",
  "ttl": 24
}
```
  - `originalUrl` (string, required): The URL to shorten.
  - `ttl` (number, optional): The "Time To Live" in hours. If provided, the link will expire after this duration. If omitted, the link will be permanent.

- **Success Response (201):**
```
{
  "originalUrl": "[https://www.example.com/a-very-long-url-to-shorten](https://www.example.com/a-very-long-url-to-shorten)",
  "shortUrl": "http://localhost:5000/abcdefg",
  "urlId": "abcdefg",
  "clicks": 0,
  "date": "2025-09-03T22:13:00.000Z",
  "expiresAt": "2025-09-04T22:13:00.000Z",
  "_id": "...",
  "__v": 0
}
```

#### Redirect to Original URL
- **URL:** `/:urlId`

- **Method:** `GET`

- **Example:** `http://localhost:5000/abcdefg`

- **Action:** Redirects the user to the `originalUrl` and increments the click count. If the link has expired, it returns a `410 Gone` status with an error message.