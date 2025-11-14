# Online Voting System - Server

This is the server-side component of the Online Voting System, built with Node.js and Express. The project has been configured to use local/mock storage (server/mockDb.js) instead of MongoDB for easier testing.

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

2. Create a `.env` file with the following variables (only JWT_SECRET is required):
   ```
   PORT=5000
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

   You can copy the `.env.example` file and update it with your own values.

3. No database setup is required. The server uses `server/mockDb.js` for test data. To change test users or candidates, edit that file directly.

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

These test credentials are available in `server/mockDb.js`.
