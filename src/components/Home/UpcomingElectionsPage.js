import { useEffect, React, useRef, useState } from 'react';
import ScrollReveal from "scrollreveal";
import { useNavigate } from 'react-router-dom';
import { useRealtime } from '../../context/RealtimeContext';
import Nav_bar from "../Navbar/Navbar";
import "./CSS/features.css";

const UpcomingElectionsPage = () => {
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
                title: el.title || el.name,
                name: el.title || el.name,
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

    const revealRefBottom = useRef(null);
    const revealRefLeft = useRef(null);
    const revealRefTop = useRef(null);
    const revealRefRight = useRef(null);

    useEffect(() => {


        ScrollReveal().reveal(revealRefBottom.current, {

            duration: 1000,
            delay: 200,
            distance: '50px',
            origin: 'bottom',
            easing: 'ease',
            reset: 'true',
        });
    }, []);
    useEffect(() => {


        ScrollReveal().reveal(revealRefRight.current, {

            duration: 1000,
            delay: 200,
            distance: '50px',
            origin: 'right',
            easing: 'ease',
            reset: 'true',
        });
    }, []); useEffect(() => {


        ScrollReveal().reveal(revealRefLeft.current, {

            duration: 1000,
            delay: 200,
            distance: '50px',
            origin: 'left',
            easing: 'ease',
            reset: 'true',
        });
    }, []); useEffect(() => {


        ScrollReveal().reveal(revealRefTop.current, {

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

    // Get status badge styling
    const getStatusBadge = (status) => {
        const statusMap = {
            'current': { color: '#ff6b6b', label: '🗳️ Current' },
            'ongoing': { color: '#ff6b6b', label: '🗳️ Ongoing' },
            'upcoming': { color: '#4ecdc4', label: '📅 Upcoming' },
            'completed': { color: '#95e1d3', label: '✅ Completed' },
            'stopped': { color: '#ffa502', label: '⏹️ Stopped' }
        };
        return statusMap[status] || { color: '#999', label: status };
    };

    return (
        <div className="Features">
            <Nav_bar />
            <h2 ref={revealRefTop}> All Elections</h2>
            <div className='Features-Content' >
                {displayElections.map((election, index) => {
                    const statusInfo = getStatusBadge(election.status);
                    return (
                        <div
                            key={election.id}
                            className='Features-Content-Card'
                            ref={index === 0 ? revealRefLeft : index === 1 ? revealRefBottom : revealRefRight}
                            style={{ position: 'relative' }}
                        >
                            <div style={{ 
                                position: 'absolute', 
                                top: '10px', 
                                right: '10px', 
                                backgroundColor: statusInfo.color, 
                                color: 'white', 
                                padding: '5px 10px', 
                                borderRadius: '20px', 
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}>
                                {statusInfo.label}
                            </div>
                            <h5><strong>{election.title}</strong></h5>
                            <p>{election.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
export default UpcomingElectionsPage;
