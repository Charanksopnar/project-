import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import './CSS/Nav.css'
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BASE_URL } from '../../helper';


function UserNavbar() {
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    const id = Cookies.get('myCookie');
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${BASE_URL}/verificationStatus/${id}`);
        if (!cancelled && res.data && res.data.verificationStatus) {
          setVerificationStatus(res.data.verificationStatus);
        }
      } catch (err) {
        console.warn('Could not fetch verification status', err?.response?.data || err.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    Cookies.remove('myCookie')

    axios.post('/logout');

  };


  return (
    <Navbar expand="lg" className="Nav">
      <Container fluid>
        <Navbar.Brand href="#" className='Heading'>Online Voting System</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
          <Nav
            className="me-auto my-2 my-lg-0 Nav-items-container"
            style={{ maxHeight: '100px' }}
            navbarScroll
          >
            <Nav.Link className="Nav-items" href="/User" >Home</Nav.Link>
            <Nav.Link className="Nav-items" href="/Edit">Edit Profile</Nav.Link>
            
            {/* Verification status badge */}
            {verificationStatus && (
              <Nav.Link className="Nav-items" href={`/IdVerification?voterId=${Cookies.get('myCookie')}`}>
                <Button variant={verificationStatus === 'verified' ? 'success' : verificationStatus === 'pending' ? 'warning' : 'outline-danger'}>
                  {verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'pending' ? 'Pending' : 'Not Verified'}
                </Button>
              </Nav.Link>
            )}

            <Nav.Link className="Nav-items" href='/Login'><Button onClick={handleLogout}>Logout</Button></Nav.Link>


          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default UserNavbar;