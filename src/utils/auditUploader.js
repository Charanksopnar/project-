import { BASE_URL } from '../helper';

export async function uploadBlockAudit({ voterId, electionId, reason, auditRef, blob, meta = {} } = {}) {
  try {
    const fd = new FormData();
    fd.append('voterId', voterId || '');
    fd.append('electionId', electionId || '');
    fd.append('reason', reason || 'blocked_by_policy');
    fd.append('auditRef', auditRef || `audit_${Date.now()}`);
    fd.append('meta', JSON.stringify(meta || {}));
    if (blob) {
      fd.append('video', blob, `${auditRef || 'audit'}-evidence.webm`);
    }

    const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/audit/block`, {
      method: 'POST',
      body: fd
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`upload failed: ${res.status} ${txt}`);
    }

    return await res.json();
  } catch (err) {
    console.error('uploadBlockAudit error', err);
    throw err;
  }
}

export default { uploadBlockAudit };
