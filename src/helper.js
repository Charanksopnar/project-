// Use environment variable when available, otherwise try localhost with common dev ports
export const BASE_URL = (process.env.REACT_APP_BASE_URL && process.env.REACT_APP_BASE_URL.length > 0)
	? process.env.REACT_APP_BASE_URL
	: (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost')
		? 'http://localhost:5000'
		: 'http://localhost:5000';

// Local storage helpers for voters
export function getLocalVoters() {
	try {
		const raw = localStorage.getItem('voters');
		if (!raw) return [];
		return JSON.parse(raw);
	} catch (err) {
		console.warn('Failed to read local voters', err);
		return [];
	}
}

export function setLocalVoters(voters) {
	try {
		localStorage.setItem('voters', JSON.stringify(voters));
	} catch (err) {
		console.warn('Failed to write local voters', err);
	}
}

export function addLocalVoter(voter) {
	try {
		const list = getLocalVoters();
		// dedupe by _id or email
		const idx = list.findIndex(v => (v._id && voter._id && v._id === voter._id) || (v.email && voter.email && v.email === voter.email));
		if (idx !== -1) {
			list[idx] = { ...list[idx], ...voter };
		} else {
			list.push(voter);
		}
		setLocalVoters(list);
		// notify other listeners (same-window components and other tabs)
		try {
			window.dispatchEvent(new Event('localVotersUpdated'));
			// also write to storage to trigger storage events in other tabs
			localStorage.setItem('voters', JSON.stringify(list));
		} catch (e) {
			// ignore if window not available (e.g., SSR)
		}

		return list;
	} catch (err) {
		console.warn('Failed to add local voter', err);
		return null;
	}
}