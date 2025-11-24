import './CSS/team.css'
import { useEffect, React, useRef } from 'react';
import ScrollReveal from "scrollreveal";
import { SocialIcon } from 'react-social-icons'
import image1 from './CSS/image1.JPG'
import image2 from './CSS/image2.jpg'
import image3 from './CSS/image3.jpg'
import image4 from './CSS/image4.jpg'

const Team = () => {
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
    return (
        <div className="Team">
            <h2 ref={revealRefTop}> Our Team</h2>
            <div className='Team-Content'>
                <div className='Team-Content-Card' ref={revealRefLeft}>
                    <img src={image1} className='image'></img>
                    <h3>Charan K S | <span>Frontend Developer</span></h3>
                    <p>Enthusiastic Software Developer with a BE in Artificial Intelligence and Machine Learning,, solid foundation in C++, Python and JavaScript. Experienced in crafting engaging web experiences through projects
                        like a Data Analysis System, Online Voting System etc. Adept at adapting to new technologies like React.js and Node.js,
                        eager to contribute adaptability and fresh perspectives to dynamic teams.</p>
                    <SocialIcon className='SocialIcon' style={{ height: "30px", width: "30px" }} href="www.linkedin.com/in/charan-k-s-77a182354/" target='_blank' url="www.linkedin.com" />
                    <SocialIcon className='SocialIcon' style={{ height: "30px", width: "30px" }} href="https://github.com/Charanksopnar" target='_blank' url="www.github.com" />
                    <SocialIcon className='SocialIcon' style={{ height: "30px", width: "30px" }} href="https://www.instagram.com/charan_k_sopnar?igsh=MW9vZ25odWFkNWh3cQ==/" target='_blank' url="www.instagram.com" />
                </div>

                <div className='Team-Content-Card' ref={revealRefLeft}>
                    <img src={image2} className='image'></img>
                    <h3>Ravi M | <span>MERN Stack Developer</span></h3>
                    <p>Energetic Software Developer with a BE in Artificial Intelligence and Machine Learning, Engineering, proficient in C++, Python, and JavaScript. Skilled in creating interactive web applications, demonstrated through projects like Arwes-AI-Powered-chatbot. Experienced in embracing new technologies such as React.js and Node.js, and ready to bring innovative ideas and flexibility to dynamic teams.</p>                    
                    <SocialIcon className='SocialIcon' style={{ height: "30px", width: "30px" }} href="https://www.linkedin.com/in/ravi-m-034b6a334/" target='_blank' url="www.linkedin.com" />
                    <SocialIcon className='SocialIcon' style={{ height: "30px", width: "30px" }} href="https://github.com/ravinayka" target='_blank' url="www.github.com" />
                    <SocialIcon className='SocialIcon' style={{ height: "30px", width: "30px" }} href="https://www.instagram.com/___its__me__nayaka?igsh=YmJ0OWZkZ201b3lk/" target='_blank' url="www.instagram.com" />
                </div>

                <div className='Team-Content-Card' ref={revealRefLeft}>
                    <img src={image3} className='image'></img>
                    <h3>Harshitha K M | <span>MERN Stack Developer</span></h3>
                    <p>Enthusiastic Software Developer with a BE in Artificial Intelligence and Machine Learning, Engineering, solid foundation in C++, Python and JavaScript. Experienced in crafting engaging web experiences through projects
                        like a Data Analysis System, Online Voting System etc. Adept at adapting to new technologies like React.js and Node.js,
                        eager to contribute adaptability and fresh perspectives to dynamic teams.</p>
                    <SocialIcon className='SocialIcon' style={{ height: "30px", width: "30px" }} href="https://www.linkedin.com/in/harshitha-k-m-894a8b341/" target='_blank' url="www.linkedin.com" />
                    <SocialIcon className='SocialIcon' style={{ height: "30px", width: "30px" }} href="https://github.com/harshithakm13-cell" target='_blank' url="www.github.com" />
                    <SocialIcon className='SocialIcon' style={{ height: "30px", width: "30px" }} href="https://www.instagram.com/harshithakm_13?igsh=ZHhkMGZuNXN2MmJu/" target='_blank' url="www.instagram.com" />
                </div>

                <div className='Team-Content-Card' ref={revealRefLeft}>
                    <img src={image4} className='image'></img>
                    <h3>Soundarya G | <span>MERN Stack Developer</span></h3>
                    <p>Enthusiastic Software Developer with a BE in Artificial Intelligence and Machine Learning, Engineering, solid foundation in C++, Python and JavaScript. Experienced in crafting engaging web experiences through projects
                        like a Data Analysis System, Online Voting System etc. Adept at adapting to new technologies like React.js and Node.js,
                        eager to contribute adaptability and fresh perspectives to dynamic teams.</p>
                    <SocialIcon className='SocialIcon' style={{ height: "30px", width: "30px" }} href="https://www.linkedin.com/in/soundharya-soundharya-b58703337/" target='_blank' url="www.linkedin.com" />
                    <SocialIcon className='SocialIcon' style={{ height: "30px", width: "30px" }} href="https://github.com/Charanksopnar" target='_blank' url="www.github.com" />
                    <SocialIcon className='SocialIcon' style={{ height: "30px", width: "30px" }} href="https://www.instagram.com/soundhu_.25/" target='_blank' url="www.instagram.com" />
                </div>

            </div>
        </div>
    )
}
export default Team;