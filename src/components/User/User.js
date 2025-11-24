import { useState, useEffect, React, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import UserNavbar from "../Navbar/UserNavbar";
import './CSS/user.css'
import UserCard from './Components/UserCard/userCard'
import UpcomingElections from './Components/UpcomingElections';
import ScrollReveal from "scrollreveal";
import { BASE_URL } from '../../helper';
import Cookies from 'js-cookie';

const User = () => {
  const location = useLocation();
  const { voterst } = location.state || {};
  // Safely set cookie from voter object (use _id returned by server)
  const setCookie = (id) => {
    if (id) Cookies.set('myCookie', id, { expires: 7 }); // Set cookie for 7 days
  };

  // If voter object is present (from login), store its id in cookie
  if (voterst && (voterst._id || voterst.id)) {
    setCookie(voterst._id || voterst.id);
  }

  const voterid = Cookies.get('myCookie');
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
  }, []); useEffect(() => {

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
  }, []); useEffect(() => {

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
  const [singleVoter, setVoter] = useState({});

  useEffect(() => {
    // Determine which id to use: prefer location state (fresh login), otherwise cookie
    const idToUse = (voterst && (voterst._id || voterst.id)) ? (voterst._id || voterst.id) : voterid;

    if (!idToUse) return; // nothing to fetch

    axios.get(`${BASE_URL}/getVoterbyID/${idToUse}`)
      .then((response) => {
        const v = response.data.voter || {};

        // Normalize server response into the shape expected by UserCard
        const name = v.name || '';
        const parts = name.split(' ').filter(Boolean);
        const firstName = parts.length ? parts[0] : (v.firstName || '');
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : (v.lastName || '');

        const normalized = {
          firstName: firstName,
          lastName: lastName,
          age: v.age || '',
          phone: v.phone || v.phoneNumber || '',
          voterid: v._id || v.voterid || v.username || '',
          voteStatus: v.voteStatus,
          image: v.profilePic ? `${BASE_URL}/uploads/${v.profilePic}` : (v.image || ''),
          isBlocked: v.isBlocked || false,
          blockedReason: v.blockedReason || null,
          violationDescription: v.violationDescription || '',
          blockedAt: v.blockedAt || null,
          verificationStatus: v.verificationStatus || 'not-started'
        };

        setVoter(normalized);
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
      });
  }, []);

  return (
    <div className="User">
      <UserNavbar />
      <div className="Heading2" ref={revealRefTop}>
        <h3>Welcome <span>{singleVoter.firstName}</span></h3>
      </div>
      <div className="userPage" >
        <div className="userDetails" ref={revealRefLeft}>
          <UserCard voter={singleVoter} onUpdate={(updated) => {
            const name = updated.name || '';
            const parts = name.split(' ').filter(Boolean);
            const firstName = parts.length ? parts[0] : '';
            const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
            const normalized = {
              firstName,
              lastName,
              age: updated.age || '',
              phone: updated.phone || '',
              voterid: updated._id || singleVoter.voterid,
              voteStatus: updated.voteStatus,
              image: updated.profilePic ? `${BASE_URL}/uploads/${updated.profilePic}` : (updated.image || singleVoter.image || ''),
              isBlocked: updated.isBlocked || false,
              blockedReason: updated.blockedReason || null,
              violationDescription: updated.violationDescription || '',
              blockedAt: updated.blockedAt || null,
              verificationStatus: updated.verificationStatus || singleVoter.verificationStatus
            };
            setVoter(normalized);
          }} />
          {/* <UserUtil voterid = {voterst.id} /> */}
        </div>
        <div className='details' ref={revealRefRight}>
          <h2> Welcome to <span>Online Voting Platform</span></h2>
          <h6>Exercise Your Right to Vote Anytime, Anywhere</h6>
          <p>Welcome to our online voting platform, where your voice matters. With the convenience of modern technology, we bring democracy to your fingertips, enabling you to participate in important decisions and elections from the comfort of your own home. Our secure and user-friendly platform ensures that your vote is counted accurately and confidentially. Whether it's electing your local representatives, deciding on community initiatives, or participating in organizational polls, our platform empowers you to make a difference.</p>
        </div>
      </div>
      <UpcomingElections voteStatus={singleVoter.voteStatus} />
    </div>
  )
}
export default User;