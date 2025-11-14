const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

class LocalStorage {
    constructor() {
        this.dbPath = path.join(__dirname, 'data');
        this.votersPath = path.join(this.dbPath, 'voters.json');
        this.adminsPath = path.join(this.dbPath, 'admins.json');
        this.candidatesPath = path.join(this.dbPath, 'candidates.json');
        this.electionsPath = path.join(this.dbPath, 'elections.json');
        this.initializeStorage();
    }

    initializeStorage() {
        // Create data directory if it doesn't exist
        if (!fs.existsSync(this.dbPath)) {
            fs.mkdirSync(this.dbPath, { recursive: true });
        }

        // Initialize files if they don't exist
        this.initializeFile(this.votersPath, []);
        this.initializeFile(this.adminsPath, [{
            _id: '1',
            username: 'admin',
            password: bcrypt.hashSync('admin@123', 10)
        }]);
        this.initializeFile(this.candidatesPath, []);
        this.initializeFile(this.electionsPath, []);
    }

    initializeFile(filePath, defaultData) {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
        }
    }

    readData(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${filePath}:`, error);
            return [];
        }
    }

    writeData(filePath, data) {
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error writing to ${filePath}:`, error);
            return false;
        }
    }

    // Voter methods
    getVoters() {
        return this.readData(this.votersPath);
    }

    findVoter(query) {
        const voters = this.getVoters();
        return voters.find(v => v.username === query || v.email === query);
    }

    addVoter(voter) {
        const voters = this.getVoters();
        voter._id = Date.now().toString();
        voter.password = bcrypt.hashSync(voter.password, 10);
        voters.push(voter);
        return this.writeData(this.votersPath, voters);
    }

    // Admin methods
    getAdmins() {
        return this.readData(this.adminsPath);
    }

    findAdmin(username) {
        const admins = this.getAdmins();
        return admins.find(a => a.username === username);
    }

    // Candidate methods
    getCandidates() {
        return this.readData(this.candidatesPath);
    }

    addCandidate(candidate) {
        const candidates = this.getCandidates();
        candidate._id = Date.now().toString();
        candidates.push(candidate);
        return this.writeData(this.candidatesPath, candidates);
    }

    // Election methods
    getElections() {
        return this.readData(this.electionsPath);
    }

    addElection(election) {
        const elections = this.getElections();
        election._id = Date.now().toString();
        elections.push(election);
        return this.writeData(this.electionsPath, elections);
    }
}

module.exports = new LocalStorage();