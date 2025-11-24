import React from 'react';
import './userCard.css';
import { BASE_URL } from '../../../../helper';

export default function UserCard({ voter, onUpdate }) {
    // violation reason labels
    const violationLabels = {
        'multiple_votes': '❌ Multiple Votes Attempted',
        'wrong_information': '⚠️ Wrong Information Provided',
        'face_mismatch': '👤 Face Doesn\'t Match ID',
        'id_mismatch': '🆔 ID Information Mismatch',
        'suspicious_activity': '🔍 Suspicious Activity Detected',
        'other': '❓ Other'
    };

    return (
        <div>
            {/* Blocking Alert - Prominently displayed if voter is blocked */}
            {voter.isBlocked && (
                <div className='blocking-alert'>
                    <div className='blocking-alert-header'>
                        <span className='blocking-icon'>⛔</span>
                        <h3>Your Account is Blocked</h3>
                    </div>
                    <div className='blocking-alert-content'>
                        <p><strong>Reason:</strong> {violationLabels[voter.blockedReason] || voter.blockedReason}</p>
                        {voter.violationDescription && (
                            <p><strong>Details:</strong> {voter.violationDescription}</p>
                        )}
                        {voter.blockedAt && (
                            <p><strong>Blocked On:</strong> {new Date(voter.blockedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        )}
                        <p className='blocking-alert-footer'>
                            Please contact the admin office to resolve this issue and restore your voting access.
                        </p>
                    </div>
                </div>
            )}

            <div className='User-Card'>
                <div className='userImage'>
                    {
                        // Prefer uploaded profilePic, fall back to an inline image URL if available
                        (voter && (voter.profilePic || voter.image)) ? (
                            <img src={voter.profilePic ? `${BASE_URL}/uploads/${voter.profilePic}` : voter.image} alt='voter-image' />
                        ) : (
                            <p>No image</p>
                        )
                    }
                </div><br />
                <div className='userDetails1'>
                    <p><h6>Name: &nbsp; {voter.firstName}&nbsp;{voter.lastName}</h6> </p>
                    <p><h6>Age: &nbsp;{voter.age}</h6></p>
                    <p><h6>Phone: &nbsp;{voter.phone}</h6> </p>
                    <p><h6>VoterID: &nbsp;{voter.voterid}</h6>  </p>
                    <p><h6>Voter Status: &nbsp;{voter.voteStatus && (<span className='Voted'>Voted</span>)}{(!voter.voteStatus) && (<span className='notVoted'>Not Voted</span>)}</h6>  </p>

                    {/* Verification Badge */}
                    <p>
                        <h6>Verification: &nbsp;
                            {(() => {
                                const status = voter.verificationStatus || 'not-started';
                                let badgeClass = 'badge-not-started';
                                let badgeText = 'Not Verified';
                                let badgeIcon = '⚪';

                                switch (status) {
                                    case 'verified':
                                        badgeClass = 'badge-verified';
                                        badgeText = 'Verified';
                                        badgeIcon = '✅';
                                        break;
                                    case 'rejected':
                                        badgeClass = 'badge-rejected';
                                        badgeText = 'Verification Failed';
                                        badgeIcon = '❌';
                                        break;
                                    case 'pending':
                                        badgeClass = 'badge-pending';
                                        badgeText = 'Pending Review';
                                        badgeIcon = '⏳';
                                        break;
                                    case 'skipped':
                                        badgeClass = 'badge-not-started';
                                        badgeText = 'Skipped';
                                        badgeIcon = '⏭️';
                                        break;
                                    default:
                                        badgeClass = 'badge-not-started';
                                        badgeText = 'Not Started';
                                        badgeIcon = '⚪';
                                }

                                return (
                                    <span className={`verification-badge ${badgeClass}`}>
                                        <span className="badge-icon">{badgeIcon}</span>
                                        {badgeText}
                                    </span>
                                );
                            })()}
                        </h6>
                    </p>
                    {voter.isBlocked && (
                        <p><h6>Account Status: &nbsp;<span className='blocked-status'>Blocked</span></h6></p>
                    )}
                </div>
            </div>
        </div>
    );
}