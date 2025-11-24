const mockDb = require('./mockDb');

function verifyKycFix() {
    const charan = mockDb.voters.find(v => v._id === '2');
    console.log('Checking Charan KYC data...');

    if (charan.kycDocuments && charan.kycDocuments.idDocument) {
        console.log('SUCCESS: kycDocuments.idDocument exists.');
        console.log('Filename: ' + charan.kycDocuments.idDocument.filename);
    } else {
        console.error('FAIL: kycDocuments.idDocument missing.');
    }
}

verifyKycFix();
