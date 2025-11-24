import { useState, useEffect, useCallback } from 'react';
import { getLocalVoters, addLocalVoter as addLocalVoterHelper } from '../helper';

export default function useLocalVoters() {
  const [voters, setVoters] = useState(() => {
    try {
      return getLocalVoters();
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleStorage = (e) => {
      if (!e || e.key === 'voters') {
        setVoters(getLocalVoters());
      }
    };

    const handleCustom = () => {
      setVoters(getLocalVoters());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('localVotersUpdated', handleCustom);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('localVotersUpdated', handleCustom);
    };
  }, []);

  const addVoter = useCallback((voter) => {
    const updated = addLocalVoterHelper(voter);
    // update state synchronously for current tab
    if (updated) setVoters(updated);
  }, []);

  const refresh = useCallback(() => setVoters(getLocalVoters()), []);

  return [voters, addVoter, refresh];
}
