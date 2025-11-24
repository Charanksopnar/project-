# 🗳️ Online Voting System

## Overview

A secure and modern online voting system built with React.js and Node.js. This system provides a comprehensive platform for conducting digital elections with advanced security features including biometric verification, fraud detection, and real-time monitoring.

## 🎯 Features

### Core Voting Features
- **Voter Registration**: Secure voter registration with identity verification
- **Candidate Management**: Complete candidate profile and campaign management
- **Election Management**: Create, schedule, and manage multiple elections
- **Secure Voting**: Encrypted voting process with multiple security layers
- **Real-time Results**: Live election results and analytics
- **Dashboard Analytics**: Comprehensive voting statistics and insights

### Security Features
- **Biometric Verification**: Face recognition and ID verification
- **Fraud Detection**: AI-powered fraud detection and prevention
- **Multiple Person Detection**: Prevents multiple people during voting
- **Voice Detection**: Audio analysis for additional security
- **Secure Authentication**: JWT-based authentication system
- **Audit Trail**: Complete logging of all voting activities

### Administrative Features
- **Admin Dashboard**: Comprehensive administrative control panel
- **Voter Management**: View and manage registered voters
- **Election Monitoring**: Real-time election monitoring and control
- **Results Analysis**: Detailed election results and analytics
- **System Logs**: Complete system activity logging

## 🏗️ System Architecture

```
Online-Voting-System/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   │   ├── Home/          # Landing page components
│   │   ├── Sign/          # Authentication components
│   │   ├── User/          # User dashboard components
│   │   └── NewDashboard/  # Admin dashboard components
│   ├── utils/             # Utility functions
│   └── App.js             # Main application component
├── server/                # Backend Node.js server
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── utils/             # Server utilities
│   ├── biometrics/        # Biometric verification modules
│   └── uploads/           # File upload storage
├── public/                # Static assets
└── package.json           # Project dependencies
```

## 🚀 Quick Start

### Prerequisites

- Node.js 14 or higher
- Modern web browser with camera/microphone support

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Online-Voting-System-main
   ```

2. **Install dependencies**:
   ```bash
   # Install frontend dependencies
   npm install

   # Install server dependencies
   cd server
   npm install
   ```

3. **Environment Setup**:
   ```bash
   # Create .env file in server directory
   cd server
   cp .env.example .env
   # Edit .env with your configuration (only JWT_SECRET is required)
   ```

4. **Data**:
   No database is required. The server uses `server/mockDb.js` for test data (users, candidates, elections). Edit that file to modify mock data for development.

### Running the Application

1. **Start the server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Start the client** (in a new terminal):
   ```bash
   npm start
   ```

3. **Access the application**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

## 📱 User Interfaces

### 1. Voter Interface
- **Registration**: Secure voter registration with document upload
- **Login**: Secure authentication with biometric verification
- **Voting**: Intuitive voting interface with security checks
- **Profile**: Manage voter profile and view voting history

### 2. Admin Interface
- **Dashboard**: Overview of system statistics and activities
- **Voter Management**: View and manage registered voters
- **Candidate Management**: Add, edit, and manage candidates
- **Election Management**: Create and manage elections
- **Results**: View and analyze election results

## 🔒 Security Features

### Biometric Verification
- **Face Recognition**: Real-time face verification during voting
- **ID Document Verification**: Automatic ID document validation
- **Liveness Detection**: Prevents photo/video spoofing
- **Multiple Person Detection**: Ensures single-person voting

### Fraud Prevention
- **AI-powered Detection**: Machine learning fraud detection
- **Behavioral Analysis**: Suspicious activity monitoring
- **Duplicate Vote Prevention**: Prevents multiple voting attempts
- **Audit Logging**: Complete activity tracking

## 📊 API Endpoints

### Authentication
- `POST /login` - User login
- `POST /createVoter` - Voter registration

### Voting
- `GET /getCandidate` - Get all candidates
- `PATCH /getCandidate/:id` - Cast vote for candidate
- `GET /getDashboardData` - Get voting statistics

### Security
- `POST /api/security/verify-face` - Face verification
- `POST /api/security/verify-id` - ID verification
- `POST /api/security/secure-vote` - Secure voting with all checks

## 🛠️ Development

### Available Scripts

```bash
# Frontend
npm start              # Start development server
npm run build         # Build for production
npm test              # Run tests

# Backend
cd server
npm run dev           # Start development server with nodemon (uses mock DB)
npm run start         # Start production server (uses mock DB)
```

### Project Structure

- **Frontend**: React.js with Bootstrap for responsive UI
- **Backend**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **File Upload**: Multer for handling file uploads
- **Security**: bcryptjs for password hashing

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/voting-system
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
```

### Database Models

- **Voter**: User registration and profile data
- **Candidate**: Candidate information and vote counts
- **Admin**: Administrative user accounts
- **Election**: Election details and scheduling
- **InvalidVote**: Tracking of invalid voting attempts

## 📈 Performance & Scalability

- **Optimized Database Queries**: Efficient MongoDB queries
- **Caching**: Redis caching for improved performance
- **Load Balancing**: Support for horizontal scaling
- **CDN Integration**: Static asset optimization
- **Real-time Updates**: WebSocket support for live updates

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run backend tests
cd server
npm test

# Run integration tests
npm run test:integration
```

## 📦 Deployment

### Production Build

```bash
# Build frontend
npm run build

# Start production server
cd server
npm start
```

### Docker Deployment

```bash
# Build and run with Docker
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

## 🎉 Acknowledgments

- React.js community for the excellent frontend framework
- Node.js and Express.js for the robust backend platform
- MongoDB for the flexible database solution
- All contributors who helped build this system

---

## 🔗 Related Projects

### ML Document Classification System

The machine learning document classification functionality has been separated into its own standalone system:

📁 **Location**: `ML-Document-Classification-System/`

This separate system provides:
- Document type identification
- Training interfaces for custom models
- API endpoints for document classification
- Independent deployment and scaling

To use the ML system, navigate to the `ML-Document-Classification-System` directory and follow its README instructions.

---

## 🛡️ KYC / Voter Verification Flow

This system enforces Know Your Customer (KYC) verification before voting. The flow is as follows:

1. **Registration Page**: Users register with their details. The registration form includes a "Verification (KYC)" section where users can:
   - Enter their Voter ID
   - Upload a government-issued ID document (optional at registration)
   - Provide required metadata (name, DOB, address)
   - Choose to "Skip verification for now" (sets their `verificationStatus` to `skipped`)

2. **Verification Enforcement**:
   - Users who skip or do not complete KYC can register, but **cannot vote** until their verification is completed and approved.
   - On any voting page, if the user's `verificationStatus` is not `verified`, an interrupting modal/page appears, explaining that verification is required before voting. The KYC form is prefilled with saved registration values.
   - Users can complete verification (submit KYC, upload ID, etc.) or cancel and return to the voting list.

3. **Verification Status Display**:
   - The user's verification status (Verified / Pending / Not Verified) is shown in the header and election pages, with a link to start or resume verification.

4. **Admin Review**:
   - Submitted KYC is set to `pending` and must be approved by an admin (if applicable) before the user can vote.

5. **File Storage & Security**:
   - Uploaded ID documents are stored securely on the server. All transmissions use secure endpoints.

### Manual Test Steps

1. **Register a New Voter**
   - Go to the registration page.
   - Fill in all required fields.
   - Optionally upload an ID document, or click "Skip verification for now".
   - Complete registration.

2. **Attempt to Vote Without Verification**
   - Log in as the new voter.
   - Go to any election/voting page.
   - You should see a modal/page requiring you to complete verification before voting.

3. **Complete Verification**
   - Click the provided link or button to start/resume verification.
   - Fill in the KYC form and upload required documents.
   - Submit the form. Status should become `pending`.
   - (If admin approval is required, log in as admin and approve the KYC.)

4. **Vote After Verification**
   - Once your status is `verified`, return to the voting page.
   - You should now be able to cast your vote.

5. **Check Status Display**
   - Your verification status should be visible in the header and election pages, with a link to resume or view verification.

---

For any issues, check the browser console and server logs for error messages.

**Happy Voting! 🗳️**