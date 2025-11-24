import React from 'react';
import useLocalVoters from '../../hooks/useLocalVoters';

/**
 * Simple admin-facing component that lists local voters and updates live
 * when `useLocalVoters` detects changes (from registration or other tabs).
 */
export default function VotersList() {
  const [voters, addVoter, refresh] = useLocalVoters();

  return (
    <div style={{ padding: 16 }}>
      <h2>Local Voters (live)</h2>
      <div style={{ marginBottom: 8 }}>
        <button onClick={refresh} style={{ marginRight: 8 }}>Refresh</button>
      </div>

      {voters && voters.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>Email</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>Username/ID</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>Vote Status</th>
            </tr>
          </thead>
          <tbody>
            {voters.map((v) => (
              <tr key={v._id || v.email}>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{v.name || '—'}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{v.email || '—'}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{v.username || v._id || '—'}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{v.voteStatus ? 'Voted' : 'Not Voted'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>No local voters found.</div>
      )}
    </div>
  );
}
