# KYC Review Testing Guide

## ✅ Universal Testing Solution (Works for ANY User)

I've added a **test endpoint** that creates verification cases for ANY voter without needing to restart the server.

### Method 1: Using the API Endpoint (Recommended)

**Endpoint**: `POST /api/admin/verification-cases/create-test`

**How to Use**:

1. Open PowerShell or Command Prompt
2. Run this command (replace `VOTER_ID` with any voter ID from mockDb):

```powershell
# For Charan (ID: 2)
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/verification-cases/create-test" -Method POST -ContentType "application/json" -Body '{"voterId": "2"}'

# For Ravi (ID: 1)
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/verification-cases/create-test" -Method POST -ContentType "application/json" -Body '{"voterId": "1"}'

# For any other voter - just change the voterId
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/verification-cases/create-test" -Method POST -ContentType "application/json" -Body '{"voterId": "YOUR_VOTER_ID"}'
```

3. Go to `http://localhost:3000/admin/kyc-review`
4. You should see the test case immediately!

### Method 2: Using Postman/Thunder Client

1. **Method**: POST
2. **URL**: `http://localhost:5000/api/admin/verification-cases/create-test`
3. **Headers**: `Content-Type: application/json`
4. **Body** (raw JSON):
```json
{
  "voterId": "2"
}
```

### Method 3: Using Browser Console

1. Open `http://localhost:3000` in your browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Paste and run:

```javascript
fetch('http://localhost:5000/api/admin/verification-cases/create-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ voterId: '2' })
})
.then(r => r.json())
.then(data => console.log('✅ Test case created:', data))
.catch(err => console.error('❌ Error:', err));
```

---

## 📋 Available Voters for Testing

From mockDb, you can create test cases for:

| Voter ID | Name | Email |
|----------|------|-------|
| `1` | Ravi M | ravimysore2004@gmail.com |
| `2` | Charan K S | charancharu869@gmail.com |
| `3` | Soundarya | soundarya@example.com |
| `4` | Harshitha | harshitha@example.com |

---

## 🔍 What the Test Case Creates

The endpoint automatically creates a verification case with:

- ✅ Voter information (name, email)
- ✅ ID document references (from voter's registered documents)
- ✅ **Intentional mismatch** in Aadhar number (to simulate failed verification)
- ✅ Status: `pending` (ready for admin review)
- ✅ OCR results and match details

---

## 🎯 Testing Workflow

### Step 1: Create Test Case
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/verification-cases/create-test" -Method POST -ContentType "application/json" -Body '{"voterId": "2"}'
```

### Step 2: View in Admin Dashboard
1. Navigate to: `http://localhost:3000/admin/kyc-review`
2. You should see Charan K S in the pending cases table

### Step 3: Review the Case
1. Click "View Details" button
2. Review:
   - Voter information
   - Automated verification results (OCR mismatch)
   - Document images

### Step 4: Approve or Reject
1. Click **"Approve"** to verify the voter
   - Voter's status changes to "verified"
   - Case removed from pending list
   
2. OR click **"Reject"** and provide a reason
   - Voter's status changes to "rejected"
   - Rejection reason is stored
   - Case removed from pending list

---

## 🔧 Troubleshooting

### Issue: "Cannot reach server"
**Solution**: Make sure the server is running on port 5000
```powershell
# Check if server is running
Test-NetConnection -ComputerName localhost -Port 5000
```

### Issue: "Voter not found"
**Solution**: Check the voter ID exists in mockDb
- Open `server/mockDb.js`
- Look for the voter in the `voters` array
- Use the correct `_id` value

### Issue: "No pending cases showing"
**Solution**: 
1. Refresh the KYC Review page
2. Check browser console for errors (F12)
3. Verify the API call succeeded:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/verification-cases?status=pending" -Method GET
```

---

## 💡 Benefits of This Approach

✅ **No Server Restart Required** - Works with running server  
✅ **Works for ANY Voter** - Just change the voterId  
✅ **Instant Testing** - See results immediately  
✅ **Repeatable** - Create multiple test cases  
✅ **Production-Ready** - Can be used for actual testing workflows  

---

## 🎓 For Developers

The endpoint is located at:
- **File**: `server/routes/adminVerificationRoutes.js`
- **Line**: ~247-308
- **Route**: `POST /api/admin/verification-cases/create-test`

It creates a test case by:
1. Finding the voter by ID
2. Creating a case object with intentional mismatch
3. Adding it to `mockDb.idVerificationCases`
4. Updating voter's `pendingIdCaseId` and `verificationStatus`
