import { useEffect, React, useRef, useState } from 'react';
import ScrollReveal from "scrollreveal";
import { useNavigate } from 'react-router-dom';
import { useRealtime } from '../../../context/RealtimeContext';

import "../CSS/upcomingElections.css"

const UpcomingElections = ({voteStatus})=>{
    const navigate = useNavigate();
    const { electionsData, requestElectionsSync, electionUpdate } = useRealtime();
    const [elections, setElections] = useState([]);
   
    // Request initial sync on mount
    useEffect(() => {
        console.log('🔄 Requesting elections sync on mount');
        requestElectionsSync();
    }, [requestElectionsSync]);

    // Update elections from real-time data whenever electionsData or electionUpdate changes
    useEffect(() => {
        if (electionsData && electionsData.length > 0) {
            const formattedElections = electionsData.map(el => ({
                id: el._id?.toString() || el.id,
                title: el.name || el.title,
                name: el.name || el.title,
                description: el.description || 'No description provided',
                status: el.status || 'upcoming',
                startDate: el.startDate,
                endDate: el.endDate,
                createdAt: el.createdAt
            }));
            console.log('✅ Elections updated from real-time:', formattedElections);
            setElections(formattedElections);
        }
    }, [electionsData, electionUpdate]);

    const getButtonText = (election) => {
        if (voteStatus) {
            return "Already Voted";
        }
        
        const now = new Date();
        const electionStart = new Date(election.startDate || election.date);
        
        // Check election status
        if (election.status === 'upcoming') {
            return "Not Available";
        } else if (election.status === 'current') {
            return "Participate/Vote";
        } else if (election.status === 'stopped' || election.status === 'completed') {
            return "Ended";
        }
        
        return "Not Available";
    };

    const isElectionActive = (election) => {
        return election.status === 'current' && !voteStatus;
    };
   
    const handleParticipate = (election) => {
      if (voteStatus) {
        alert("You Have Already Voted");
        return;
      }

      if (election.status !== 'current') {
        alert(`This election is ${election.status || 'not available'}. Please wait for the election to start.`);
        return;
      }

      // Navigate to Vote page using URL parameter (also include state for backward compatibility)
      navigate(`/Vote/${election.id}`, { state: { election } });
    };
    
    const revealRefBottom = useRef(null);
    const revealRefLeft = useRef(null);  
    const revealRefTop = useRef(null);
    const revealRefRight = useRef(null);
  
    useEffect(() => {
    
      // Initialize ScrollReveal
      ScrollReveal().reveal(revealRefBottom.current, {
        // You can configure options here
        duration: 1000,
        delay: 200,
        distance: '50px',
        origin: 'bottom',
        easing: 'ease',
        reset: 'true',
      });
    }, []);
    useEffect(() => {
    
      // Initialize ScrollReveal
      ScrollReveal().reveal(revealRefRight.current, {
        // You can configure options here
        duration: 1000,
        delay: 200,
        distance: '50px',
        origin: 'right',
        easing: 'ease',
        reset: 'true',
      });
    }, []);  useEffect(() => {
    
      // Initialize ScrollReveal
      ScrollReveal().reveal(revealRefLeft.current, {
        // You can configure options here
        duration: 1000,
        delay: 200,
        distance: '50px',
        origin: 'left',
        easing: 'ease',
        reset: 'true',
      });
    }, []);  useEffect(() => {
    
      // Initialize ScrollReveal
      ScrollReveal().reveal(revealRefTop.current, {
        // You can configure options here
        duration: 1000,
        delay: 200,
        distance: '50px',
        origin: 'top',
        easing: 'ease',
        reset: 'true',
      });
    }, []); 

    // Default elections for fallback/display - now prioritizes real elections
    const displayElections = elections.length > 0 ? elections : [
        { id: 'india-2026', title: '2026 India General Election', name: '2026 India General Election', status: 'upcoming', description: 'General elections will be held in India from 19 April 2026 to 1 June 2026 to elect the 543 members of the 18th Lok Sabha. The elections will be held in seven phases and the results will be announced on 4 June 2024.' },
        { id: '2', title: '2025 Local Mayor Election', name: '2025 Local Mayor Election', status: 'upcoming', description: 'General elections will be held in India from 19 April 2025 to 1 June 2025 to elect the 543 members of the 18th Lok Sabha. The elections will be held in seven phases and the results will be announced on 4 June 2024.' },
        { id: '1', title: '2026 Presidential Election', name: '2026 Presidential Election', status: 'upcoming', description: 'General elections will be held in India from 19 April 2026 to 1 June 2026 to elect the 543 members of the 18th Lok Sabha. The elections will be held in seven phases and the results will be announced on 4 June 2024.' }
    ];

    return(
        <div className="upcomingElections">
            <h2 ref={revealRefTop}>Upcoming Elections</h2>
 
            <div className="upcomingElectionsCardContainer">
                {displayElections.slice(0, 3).map((election, index) => (
                    <div 
                        key={election.id} 
                        className="upcomingElectionCard" 
                        ref={index === 0 ? revealRefLeft : index === 1 ? revealRefBottom : revealRefRight}
                        style={{
                            opacity: election.status === 'current' ? 1 : 0.8,
                            borderColor: election.status === 'current' ? '#2ecc71' : 'inherit',
                            borderWidth: election.status === 'current' ? '2px' : '1px'
                        }}
                    >
                        <h3>{election.title}</h3>
                        {election.status && (
                            <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                                Status: <strong>{election.status.toUpperCase()}</strong>
                            </p>
                        )}
                        <br/>
                        <p>{election.description}</p><br/>
                        <button 
                            onClick={() => handleParticipate(election)}
                            disabled={!isElectionActive(election)}
                            style={{
                                backgroundColor: isElectionActive(election) ? '#2ecc71' : '#999',
                                cursor: isElectionActive(election) ? 'pointer' : 'not-allowed',
                                opacity: isElectionActive(election) ? 1 : 0.95
                            }}
                        >
                            {getButtonText(election)}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
export default UpcomingElections;