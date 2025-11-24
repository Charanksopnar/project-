import 'bootstrap/dist/css/bootstrap.min.css';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import './CSS/Nav.css'
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

function AdminNavbar() {
    const navigate = useNavigate();
    const { getUnreadCount } = useNotification();
    const unreadCount = getUnreadCount();

    const handleNotificationClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Notification button clicked, navigating to /notifications');
        navigate('/notifications');
    };

    return (
        <Navbar expand="lg" className="Nav">
            {/* <Container className='Nav'>*/}
            <Navbar.Brand className="Heading" href="/">Online Voting System</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" className='Toggle' />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto Nav">
                    <Nav.Link className="Nav-items" href="/Admin">Dashboard</Nav.Link>
                    <Nav.Link className="Nav-items" href="/Voters">Voters</Nav.Link>
                    <Nav.Link className="Nav-items" href="/Candidate">Candidates</Nav.Link>
                    <Nav.Item style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                            className="notification-icon-btn"
                            onClick={handleNotificationClick}
                            onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(e)}
                            type="button"
                            title="View Notifications"
                            style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                marginLeft: '10px',
                                marginRight: '10px'
                            }}
                        >
                            <span style={{ fontSize: '20px', pointerEvents: 'none' }}>🔔</span>
                            {unreadCount > 0 && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: '-5px',
                                        right: '-5px',
                                        background: '#e74c3c',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        pointerEvents: 'none'
                                    }}
                                >
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </Nav.Item>
                    <Nav.Link className="Nav-items" href="/">Logout</Nav.Link>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
}

export default AdminNavbar;