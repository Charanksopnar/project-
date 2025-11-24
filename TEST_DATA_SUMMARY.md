# Test Data Implementation Summary

## Overview
Comprehensive test data has been added to the project for all major components: KYC Review, Audit Records, and Invalid Votes.

## Test Data Added

### 1. KYC Review Test Data
**Location**: `server/mockDb.js` - Enhanced `voters` array

**Test Cases Added**:
- ✅ **Approved KYC** (Voter ID: 1, 4)
  - Complete KYC submission with all documents
  - Status: `approved`
  - Approved by admin

- ⏳ **Pending KYC** (Voter ID: 2, 5)
  - Fresh KYC submissions awaiting review
  - Status: `pending`
  - Ready for admin approval/rejection

- ❌ **Rejected KYC** (Voter ID: 3, 6)
  - Previously rejected submissions
  - Status: `rejected`
  - Rejection reasons: "Document not clear", "Face does not match ID"
  - Ready for resubmission

**KYC Data Fields**:
```javascript
{
  kycData: {
    voterId: "ID001",
    fullName: "Full Name",
    dateOfBirth: "1990-01-01",
    address: "Address",
    submittedAt: Date
  },
  kycDocuments: {
    idDocument: { filename, uploadedAt, mimeType },
    idBackside: { filename, uploadedAt, mimeType },
    selfie: { filename, uploadedAt, mimeType }
  },
  kycSubmissionAttempts: number,
  kycApprovedAt: Date,
  kycApprovedBy: "admin",
  kycRejectedAt: Date,
  kycRejectionReason: string
}
```

### 2. Audit Records Test Data
**Location**: `server/mockDb.js` - New `auditRecords` array

**Test Cases Added**:
- 📝 **KYC Approved** - Audit log for successful KYC verification
- 📤 **KYC Submitted** - Audit log for KYC submission
- ❌ **KYC Rejected** - Audit log for rejected KYC
- 🚫 **Voter Blocked** - Multiple cases:
  - Multiple votes attempted
  - Face mismatch detected
  - With video proof reference
- ✅ **Vote Cast** - Successful voting events
- 📹 **Video References** - Links to audit video files

**Audit Record Fields**:
```javascript
{
  id: "audit_1",
  voterId: "voter_id",
  voterName: "name",
  email: "email",
  action: "KYC_APPROVED|KYC_SUBMITTED|KYC_REJECTED|VOTER_BLOCKED|VOTE_CAST",
  reason: string,
  timestamp: Date,
  approvedBy: string,
  blockedBy: string,
  electionId: string,
  videoRef: string (optional),
  details: object
}
```

### 3. Invalid Votes Test Data
**Location**: `server/mockDb.js` - New `invalidVotes` array

**Test Cases Added**:
- 🔴 **Multiple Votes** - Voter attempted to cast multiple votes
  - Violation Type: `multiple_votes`
  - Severity: `high`
  - Status: `flagged`

- 👤 **Face Mismatch** - Face biometric doesn't match ID
  - Violation Type: `fraud_detection`
  - Severity: `critical`
  - Status: `blocked`

- 👥 **Multiple Faces** - Multiple faces detected during voting
  - Violation Type: `multiple_faces`
  - Severity: `critical`
  - Status: `flagged`

- 🆔 **Document Tampering** - KYC document suspected to be fake
  - Violation Type: `fraud_detection`
  - Severity: `high`
  - Status: `investigation`

- 👶 **Underage Voter** - Voter verification failed (too young)
  - Violation Type: `fraud_detection`
  - Severity: `high`
  - Status: `flagged`

- 📋 **Duplicate Entry** - Duplicate voter detected
  - Violation Type: `fraud_detection`
  - Severity: `medium`
  - Status: `flagged`

**Invalid Vote Fields**:
```javascript
{
  _id: string,
  voterId: string,
  voterName: string,
  candidateId: string,
  candidateName: string,
  violationType: "multiple_votes|multiple_faces|fraud_detection",
  violationDetails: string,
  detectionMethod: string,
  timestamp: Date,
  electionId: string,
  severity: "low|medium|high|critical",
  status: "flagged|blocked|investigation",
  videoProof: string (optional)
}
```

## API Endpoints

### Existing Endpoints Now with Test Data
1. **GET** `/api/kyc/pending` - Fetch pending KYC submissions
   - Returns voters with `verificationStatus: "pending"`

2. **GET** `/api/kyc/details/:id` - Get detailed KYC info
   - Returns voter with full KYC documents and history

3. **POST** `/api/kyc/approve/:id` - Approve KYC
   - Updates voter status to `approved`

4. **POST** `/api/kyc/reject/:id` - Reject KYC
   - Updates voter status to `rejected`

5. **GET** `/audit/list` - Get audit records
   - Returns all audit records from mockDb or file

### New Endpoints Added
6. **GET** `/getInvalidVotes` - Fetch all invalid votes
   - Returns: `{ success: true, invalidVotes: [], totalRecords: number }`
   - Location: `server/routes/dashboardRoutes.js`

7. **GET** `/getAuditRecords` - Fetch audit records (admin only)
   - Returns: `{ success: true, audits: [], totalRecords: number }`
   - Location: `server/routes/dashboardRoutes.js`

## Components Using Test Data

### 1. KYC Review Component
**File**: `src/components/Admin/KYCReview.jsx`
- Displays pending KYC submissions
- Shows viewer details with documents
- Approve/Reject functionality
- Shows submission attempts and history

**Test Data Displayed**:
- 1 pending submission ready for review
- 2 approved submissions as reference
- 2 rejected submissions with rejection reasons

### 2. Audit Logs Component
**File**: `src/components/Admin/AuditLogs.js`
- Displays audit records in table format
- Shows action history (KYC approvals, blocks, votes)
- Download video proof functionality
- Sorted by timestamp (most recent first)

**Test Data Displayed**:
- 3 KYC-related actions
- 2 voter block actions with reasons
- 2 successful vote cast events

### 3. Invalid Votes Component
**File**: `src/components/NewDashboard/scenes/invalidVotes/InvalidVotes.js`
- Displays invalid votes in data grid
- Searchable by voter ID, candidate ID, violation type
- Export to CSV functionality
- Severity-based color coding

**Test Data Displayed**:
- 6 invalid vote records
- Different violation types
- Various severity levels
- Detailed violation descriptions

## How to Test

### 1. Start the Server
```bash
cd server
npm install
npm start
```

### 2. Test KYC Review
1. Login as admin (`username: admin`, `password: admin@123`)
2. Navigate to **Admin → KYC Review**
3. Should see:
   - 2 pending KYC submissions
   - 2 approved submissions
   - 2 rejected submissions

### 3. Test Audit Records
1. Login as admin
2. Navigate to **Admin → Audit Records**
3. Should see:
   - KYC submission logs
   - KYC approval/rejection logs
   - Voter block actions
   - Vote cast events

### 4. Test Invalid Votes
1. Login as admin or voter
2. Navigate to **Dashboard → Invalid Votes**
3. Should see:
   - 6 flagged/blocked votes
   - Different violation types displayed
   - Search functionality working
   - Export to CSV option available

### 5. Test via API
```bash
# Get invalid votes
curl http://localhost:5000/getInvalidVotes

# Get audit records (requires admin token)
curl -H "Authorization: Bearer <admin_token>" http://localhost:5000/getAuditRecords

# Get pending KYC (requires admin token)
curl -H "Authorization: Bearer <admin_token>" http://localhost:5000/api/kyc/pending
```

## Files Modified

1. **server/mockDb.js**
   - Enhanced `voters` array with 4 new test voters
   - Added `auditRecords` array with 7 test records
   - Added `invalidVotes` array with 6 test records

2. **server/routes/dashboardRoutes.js**
   - Added `GET /getInvalidVotes` endpoint
   - Added `GET /getAuditRecords` endpoint (admin only)

3. **server/routes/auditRoutes.js**
   - Enhanced `GET /audit/list` to fallback to mockDb data

## Test Data Verification

All test data has been:
- ✅ Validated for correct syntax
- ✅ Added with realistic field values
- ✅ Linked between related records (KYC → Audit → Invalid Votes)
- ✅ Formatted to match component expectations
- ✅ Indexed with proper IDs for lookup

## Notes

- Test data uses realistic timestamps around 2025-11-20 to 2025-11-21
- All personal identifiable information is mock/test data
- Document filenames and video references are placeholders
- Data persists during server runtime but resets on restart (in-memory database)
- For persistent data, consider saving to JSON file in `server/utils/data/`
