# Online Voting System - Server

This is the server-side component of the Online Voting System, built with Node.js, Express, and MongoDB.

## Features

- User authentication (voters and admin)
- Candidate management
- Voting functionality
- Dashboard data for analytics
- Election management

## API Endpoints

### Voter Routes
- `POST /createVoter` - Register a new voter
- `POST /login` - Login voter
- `GET /voter/:id` - Get voter profile
- `PATCH /updateVoter/:id` - Update voter profile
- `GET /getVoters` - Get all voters (admin only)

### Candidate Routes
- `POST /createCandidate` - Create a new candidate
- `GET /getCandidate` - Get all candidates
- `GET /getCandidate/:id` - Get a specific candidate
- `PATCH /getCandidate/:id` - Update candidate votes
- `DELETE /deleteCandidate/:id` - Delete a candidate (admin only)

### Admin Routes
- `POST /adminlogin` - Admin login
- `PATCH /changePassword` - Change admin password (admin only)

### Dashboard Routes
- `GET /getDashboardData` - Get dashboard data
- `POST /createElection` - Create a new election (admin only)
- `GET /getElections` - Get all elections
- `GET /getUpcomingElections` - Get upcoming elections
- `GET /getOngoingElections` - Get ongoing elections
- `GET /getElectionResults/:id` - Get election results

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

   You can copy the `.env.example` file and update it with your own values:
   ```
   cp .env.example .env
   ```

3. Initialize the project (creates upload directories and seeds the database):
   ```
   npm run setup
   ```

   Or you can run these steps individually:
   ```
   # Create upload directories
   npm run init-uploads

   # Seed the database with sample data
   npm run seed
   ```

4. Start the server:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

5. Check if the server is running correctly:
   ```
   npm run check
   ```
   This will attempt to connect to the server and verify that it's responding properly.

## Default Credentials

### Admin
Username: admin
Password: admin@123

These credentials are automatically created when the server starts if no admin exists in the database.

### Test User
Email: user@gmail.com
Password: 123

This test user is created when you run the seed script.
