
import "./SignUtils/CSS/Sign.css";
import signupimage from "./SignUtils/images/signup-image.jpg"
import { Link } from 'react-router-dom';
import Nav_bar from "../Navbar/Navbar";
import { useState } from "react";
import Cookies from 'js-cookie';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BASE_URL, addLocalVoter } from "../../helper";
import { useNavigate } from 'react-router-dom';

const stateCityMapping = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur"],
    "Arunachal Pradesh": ["Itanagar", "Tawang"],
    "Assam": ["Guwahati", "Dibrugarh"],
    "Bihar": ["Patna", "Gaya"],
    "Chhattisgarh": ["Raipur", "Bhilai"],
    "Goa": ["Panaji", "Margao"],
    "Gujarat": ["Ahmedabad", "Surat"],
    "Haryana": ["Chandigarh", "Gurugram"],
    "Himachal Pradesh": ["Shimla", "Manali"],
    "Jharkhand": ["Ranchi", "Jamshedpur"],
    "Karnataka": ["Bengaluru", "Mysore", "Chitradurga", "Challakere", "Kadur"],
    "Kerala": ["Thiruvananthapuram", "Kochi"],
    "Madhya Pradesh": ["Bhopal", "Indore"],
    "Maharashtra": ["Mumbai", "Pune"],
    "Manipur": ["Imphal"],
    "Meghalaya": ["Shillong"],
    "Mizoram": ["Aizawl"],
    "Nagaland": ["Kohima"],
    "Odisha": ["Bhubaneswar", "Cuttack"],
    "Punjab": ["Amritsar", "Ludhiana"],
    "Rajasthan": ["Jaipur", "Udaipur"],
    "Sikkim": ["Gangtok"],
    "Tamil Nadu": ["Chennai", "Coimbatore"],
    "Telangana": ["Hyderabad", "Warangal"],
    "Tripura": ["Agartala"],
    "Uttar Pradesh": ["Lucknow", "Kanpur"],
    "Uttarakhand": ["Dehradun", "Haridwar"],
    "West Bengal": ["Kolkata", "Darjeeling"],
};

const locationData = {
    "Karnataka": {
        "Bengaluru Urban": {
            "Bengaluru North": ["Yelahanka Hobli", "Hebbal Hobli", "Yeshwanthpur Hobli"],
            "Bengaluru South": ["Begur Hobli", "Uttarahalli Hobli", "Kengeri Hobli"],
            "Anekal": ["Anekal Hobli", "Attibele Hobli", "Huskur Hobli"]
        },
        "Chitradurga": {
            "Chitradurga": ["Chitradurga Hobli", "Holalkere Hobli", "Hosadurga Hobli"],
            "Challakere": ["Challakere Hobli", "Rampura Hobli", "Jagalur Hobli"],
            "Hiriyur": ["Hiriyur Hobli", "Bannikodu Hobli", "Vanivilasapura Hobli"]
        },
        "Mysuru": {
            "Mysuru": ["Mysuru Hobli", "Jayapura Hobli", "Yelwal Hobli"],
            "Nanjangud": ["Nanjangud Hobli", "Tagaduru Hobli", "Hullahalli Hobli"],
            "Hunsur": ["Hunsur Hobli", "Piriyapatna Hobli", "Periyapatna Rural Hobli"]
        },
        "Chikkamagaluru": {
            "Kadur": {
                "Kadur Hobli": ["Kadur Town", "Halebeedu", "Birur Rural"],
                "Panchanahalli Hobli": ["Panchanahalli", "Malleshwara", "Hirehalli"],
                "Sakharayapatna Hobli": ["Sakharayapatna", "Anekere", "Kudremukh Road Village"]
            },
            "Chikkamagaluru": {
                "Chikkamagaluru Hobli": ["Chikkamagaluru City", "Rathnagiri Bore", "Indira Nagar"],
                "Aldur Hobli": ["Aldur", "Mallandur", "Niduvale"],
                "Marle Hobli": ["Marle", "Makonahalli", "Joldal"]
            },
            "Tarikere": {
                "Tarikere Hobli": ["Tarikere", "Doddabathi", "Bhadra Reservoir Colony"],
                "Lingadahalli Hobli": ["Lingadahalli", "Anuvanahalli", "Agalagandi"],
                "Bhadravathi Road Hobli": ["Bhadravathi Road Village", "Koranahalli", "Holaluru"]
            }
        }
    },
    "Tamil Nadu": {
        "Chennai": {
            "Egmore": ["Egmore Hobli", "Anna Nagar Hobli", "Tondiarpet Hobli"],
            "Mylapore": ["Mylapore Hobli", "Teynampet Hobli", "Adyar Hobli"],
            "Ambattur": ["Ambattur Hobli", "Avadi Hobli", "Madhavaram Hobli"]
        },
        "Coimbatore": {
            "Coimbatore North": ["Gandhipuram Hobli", "Kavundampalayam Hobli", "Saravanampatti Hobli"],
            "Coimbatore South": ["Sungam Hobli", "Podanur Hobli", "Perur Hobli"],
            "Pollachi": ["Pollachi Hobli", "Anamalai Hobli", "Sultanpet Hobli"]
        },
        "Madurai": {
            "Madurai North": ["Madurai City Hobli", "Melur Hobli", "Vadipatti Hobli"],
            "Madurai South": ["Tirupparankundram Hobli", "Thirumangalam Hobli", "Usilampatti Hobli"]
        }
    },
    "Maharashtra": {
        "Mumbai Suburban": {
            "Kurla": ["Kurla Hobli", "Bandra Hobli", "Andheri Hobli"],
            "Borivali": ["Borivali Hobli", "Kandivali Hobli", "Malad Hobli"],
            "Chembur": ["Chembur Hobli", "Ghatkopar Hobli", "Mulund Hobli"]
        },
        "Pune": {
            "Pune City": ["Shivajinagar Hobli", "Hadapsar Hobli", "Kothrud Hobli"],
            "Haveli": ["Haveli Hobli", "Bhor Hobli", "Mulshi Hobli"],
            "Baramati": ["Baramati Hobli", "Indapur Hobli", "Daund Hobli"]
        },
        "Nagpur": {
            "Nagpur Urban": ["Dhantoli Hobli", "Lakadganj Hobli", "Mangalwari Hobli"],
            "Nagpur Rural": ["Kamptee Hobli", "Saoner Hobli", "Hingna Hobli"],
            "Umred": ["Umred Hobli", "Kuhi Hobli", "Bhiwapur Hobli"]
        }
    }
};

export default function Signup() {
    const navigate = useNavigate();

    const signSuccess = () => toast.success("Voter Created Successfully \n Redirecting You To Login Page", {
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });
    const signFailed = (msg) => toast.error(`${msg}`, {
        // position: toast.POSITION.TOP_CENTER,
        className: "toast-message",
    });
    const [loading, setLoading] = useState(false);
    const [age, setAge] = useState();
    const [touchedFields, setTouchedFields] = useState({});
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        age: '',
        city: '',
        state: '',
        dob: '',
        voterid: '',
        phone: '',
        district: '',
        taluk: '',
        hobli: '',
        gender: '',
        image: null,
        idDocument: null,
        email: '',
        pass: '',
        re_pass: '',
        aadharNumber: '',
        voterIdNumber: '',
        aadharCard: null,
        voterIdCard: null,
        project: ''
    });

    function calculateAge(dateOfBirth) {
        const dob = new Date(dateOfBirth);
        const today = new Date();

        let age = today.getFullYear() - dob.getFullYear();
        const monthDifference = today.getMonth() - dob.getMonth();
        const dayDifference = today.getDate() - dob.getDate();

        // Adjust age if the birthdate hasn't occurred yet this year
        if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
            age--;
        }

        return age;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;

        let updatedFormData = { ...formData, [name]: value };

        if (name === 'state') {
            updatedFormData.district = '';
            updatedFormData.taluk = '';
            updatedFormData.hobli = '';
            updatedFormData.city = '';
        } else if (name === 'district') {
            updatedFormData.taluk = '';
            updatedFormData.hobli = '';
        } else if (name === 'taluk') {
            updatedFormData.hobli = '';
        }

        if (name === 'dob') {
            const age = calculateAge(value);
            updatedFormData.age = age;
        }

        setFormData(updatedFormData);
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouchedFields(prev => ({ ...prev, [name]: true }));
    };
    const cities = stateCityMapping[formData.state] || [];
    const handleFileChange = (e) => {
        setFormData({
            ...formData,
            image: e.target.files[0]
        });
    };

    const handleAadharFileChange = (e) => {
        setFormData({
            ...formData,
            aadharCard: e.target.files[0]
        });
    };

    const handleVoterIdFileChange = (e) => {
        setFormData({
            ...formData,
            voterIdCard: e.target.files[0]
        });
    };

    const handleKYCFileChange = (e) => {
        setFormData({
            ...formData,
            idDocument: e.target.files[0]
        });
    };

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        if (formData.pass !== formData.re_pass) {
            alert('Passwords do not match');
            setLoading(false);
            return;
        }
        setAge(calculateAge(formData.dob));
        if (age < 18 && age >= 1) {
            alert('You are not eligible to register')
            setLoading(false);
            return;
        }


        const formDataToSend = new FormData();
        for (const key in formData) {
            formDataToSend.append(key, formData[key]);
        }

        try {
            const response = await axios.post(`${BASE_URL}/createVoter`, formDataToSend);
            //   console.log(response.data);
            if (response.data.success) {
                signSuccess();
                // Save created voter locally on the device so registration reflects immediately
                const voterId = response.data.voterId;
                const created = response.data.voter || {
                    _id: voterId,
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    username: formData.voterid || (formData.email ? formData.email.split('@')[0] : ''),
                    email: formData.email
                };
                try {
                    // add the created voter to local `voters` array for immediate UI listing
                    addLocalVoter(created);
                } catch (err) {
                    console.warn('Could not save registered voter to localStorage', err);
                }

                // If server returns created voter id, send user to verification step
                setTimeout(() => {
                    if (voterId) {
                        // If user uploaded an ID document during registration, submit it immediately
                        (async function submitKycIfProvided() {
                            try {
                                if (formData.idDocument) {
                                    const kfd = new FormData();
                                    kfd.append('voterId', formData.voterid || '');
                                    kfd.append('fullName', `${formData.firstName} ${formData.lastName}`.trim());
                                    kfd.append('dateOfBirth', formData.dob || '');
                                    kfd.append('address', `${formData.city || ''}, ${formData.state || ''}`);
                                    kfd.append('idDocument', formData.idDocument);
                                    await axios.post(`${BASE_URL}/submitKYC/${voterId}`, kfd);
                                    // navigate user to IdVerification page to show pending state
                                    navigate(`/IdVerification?voterId=${voterId}`);
                                    return;
                                }
                                // otherwise go to IdVerification so user can start/continue KYC
                                navigate(`/IdVerification?voterId=${voterId}`);
                            } catch (err) {
                                console.error('Error submitting KYC after registration:', err?.response?.data || err.message);
                                // still navigate to verification page so user can retry
                                navigate(`/IdVerification?voterId=${voterId}`);
                            }
                        })();
                    } else {
                        navigate('/Login');
                    }
                }, 1200);
            }
            else {
                signFailed("Invalid Details");
            }
        }
        catch (error) {
            console.error(error);
            signFailed(error);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="Sign-Container" >
            <Nav_bar />
            <section className="signup">
                <div className="container">
                    <div className="signup-content">
                        <div className="signup-form">
                            <h2 className="form-title">Registration</h2>
                            <form method="POST" enctype="multipart/form-data" className="register-form" id="register-form">
                                <ToastContainer />
                                <div className="form-group">
                                    <label htmlFor="firstName"><i className="zmdi zmdi-account material-icons-name"></i></label>
                                    <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} placeholder="Your First Name" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="lastName"><i className="zmdi zmdi-account-box material-icons-name"></i></label>
                                    <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} placeholder="Your Last Name" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="state"><i className="zmdi zmdi-map material-icons-name"></i></label>
                                    <select name="state" id="state" value={formData.state} onChange={handleChange} required>
                                        <option value="">Select Your State</option>
                                        {Object.keys(stateCityMapping).map((state) => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="district"><i className="zmdi zmdi-pin material-icons-name"></i></label>
                                    {locationData[formData.state] ? (
                                        <select name="district" id="district" value={formData.district} onChange={handleChange} required>
                                            <option value="">Select District</option>
                                            {Object.keys(locationData[formData.state]).map((dist) => (
                                                <option key={dist} value={dist}>{dist}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input type="text" name="district" id="district" value={formData.district} onChange={handleChange} placeholder="District" required />
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="taluk"><i className="zmdi zmdi-pin-drop material-icons-name"></i></label>
                                    {locationData[formData.state] && formData.district && locationData[formData.state][formData.district] ? (
                                        <select name="taluk" id="taluk" value={formData.taluk} onChange={handleChange} required>
                                            <option value="">Select Taluk</option>
                                            {Object.keys(locationData[formData.state][formData.district]).map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input type="text" name="taluk" id="taluk" value={formData.taluk} onChange={handleChange} placeholder="Taluk" required />
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="hobli"><i className="zmdi zmdi-my-location material-icons-name"></i></label>
                                    {locationData[formData.state] && formData.district && formData.taluk && locationData[formData.state][formData.district][formData.taluk] ? (
                                        <select name="hobli" id="hobli" value={formData.hobli} onChange={handleChange} required>
                                            <option value="">Select Hobli</option>
                                            {(Array.isArray(locationData[formData.state][formData.district][formData.taluk])
                                                ? locationData[formData.state][formData.district][formData.taluk]
                                                : Object.keys(locationData[formData.state][formData.district][formData.taluk])
                                            ).map((h) => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input type="text" name="hobli" id="hobli" value={formData.hobli} onChange={handleChange} placeholder="Hobli" required />
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="city"><i className="zmdi zmdi-city material-icons-name"></i></label>
                                    <select name="city" id="city" value={formData.city} onChange={handleChange} required>
                                        <option value="">Select Your City</option>
                                        {cities.map((city) => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="dob"><i className="zmdi zmdi-calendar-account material-icons-name"></i></label>
                                    <input type="date" name="dob" id="dob" value={formData.dob} onChange={handleChange} placeholder="Your Date of Birth" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="gender"><i className="zmdi zmdi-male-female material-icons-name"></i></label>
                                    <select name="gender" id="gender" value={formData.gender} onChange={handleChange} required>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email"><i className="zmdi zmdi-email material-icons-name"></i></label>
                                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} placeholder="Your Email" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="project"><i className="zmdi zmdi-assignment material-icons-name"></i></label>
                                    <input
                                        type="text"
                                        name="project"
                                        id="project"
                                        value={formData.project}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="Enter Project Name"
                                        required
                                        style={{
                                            borderColor: touchedFields.project
                                                ? (formData.project.trim() ? '#4CAF50' : '#f44336')
                                                : ''
                                        }}
                                    />
                                    {touchedFields.project && !formData.project.trim() && (
                                        <span style={{ color: '#f44336', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                            Project name is required
                                        </span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="aadharNumber"><i className="zmdi zmdi-card material-icons-name"></i></label>
                                    <input type="text" name="aadharNumber" id="aadharNumber" value={formData.aadharNumber} onChange={handleChange} placeholder="Aadhar Number" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="aadharCard" style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Upload Aadhar Card</label>
                                    <input type="file" name="aadharCard" id="aadharCard" onChange={handleAadharFileChange} accept="image/*,application/pdf" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="voterIdNumber"><i className="zmdi zmdi-card-membership material-icons-name"></i></label>
                                    <input type="text" name="voterIdNumber" id="voterIdNumber" value={formData.voterIdNumber} onChange={handleChange} placeholder="Voter ID Number" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="voterIdCard" style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Upload Voter ID Card</label>
                                    <input type="file" name="voterIdCard" id="voterIdCard" onChange={handleVoterIdFileChange} accept="image/*,application/pdf" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="pass"><i className="zmdi zmdi-lock"></i></label>
                                    <input type="password" name="pass" id="pass" value={formData.pass} onChange={handleChange} placeholder="Password" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="re-pass"><i className="zmdi zmdi-lock-outline"></i></label>
                                    <input type="password" name="re_pass" id="re_pass" value={formData.re_pass} onChange={handleChange} placeholder="Repeat your password" required />
                                </div>
                                <div className="form-group form-button">
                                    {/* <input type="submit" name="signup" id="signup" className="form-submit" value="Submit" /> */}
                                    <button onClick={handleSubmit} disabled={loading}>{loading ? <div className="spinner"></div> : 'Register'}</button>
                                    <button type="button" onClick={async (ev) => {
                                        // Quick skip verification flow: register then mark skip
                                        ev.preventDefault();
                                        setLoading(true);
                                        try {
                                            const formDataToSendSkip = new FormData();
                                            for (const key in formData) {
                                                formDataToSendSkip.append(key, formData[key]);
                                            }
                                            const res = await axios.post(`${BASE_URL}/createVoter`, formDataToSendSkip);
                                            if (res.data && res.data.voterId) {
                                                try {
                                                    await axios.patch(`${BASE_URL}/skipKYC/${res.data.voterId}`);
                                                } catch (skipErr) {
                                                    console.warn('Could not mark skipped:', skipErr?.response?.data || skipErr.message);
                                                }
                                                navigate('/Login');
                                            } else {
                                                signFailed('Could not create voter');
                                            }
                                        } catch (err) {
                                            console.error('Skip registration error', err);
                                            signFailed('Registration failed');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }} style={{ marginLeft: '8px' }}>{loading ? 'Processing...' : 'Skip Verification for Now'}</button>
                                </div>
                            </form>
                        </div>
                        <div className="signup-image">
                            <figure><img src={signupimage} alt="sing up image" /></figure>
                            <Link to='/Login' className="signup-image-link">I am already member</Link>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )

}
