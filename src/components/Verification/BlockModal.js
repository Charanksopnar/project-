import React from 'react';

export default function BlockModal({ info }) {
  if (!info) return null;
  const overlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
  };
  const box = { background: '#fff', padding: 24, borderRadius: 8, maxWidth: 520 };
  return (
    <div style={overlay} role="dialog" aria-modal>
      <div style={box}>
        <h3>Voting Disabled</h3>
        <p>Your voting session is blocked for this election due to repeated multiple-person detection during verification.</p>
        <p><strong>Audit ref:</strong> {info.auditRef || (info.auditSaved && info.auditSaved.id) || 'N/A'}</p>
        <p>Please contact election support for further assistance.</p>
      </div>
    </div>
  );
}
