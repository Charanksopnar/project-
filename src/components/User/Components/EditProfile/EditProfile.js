import "../../../Sign/SignUtils/CSS/Sign.css";
import UserNavbar from "../../../Navbar/UserNavbar";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../../../helper";
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

const EditProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { voter } = location.state || {};

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState('');
    const [phone, setPhone] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentVoterId, setCurrentVoterId] = useState(null);

    useEffect(() => {
        if (voter) {
            setCurrentVoterId(voter.voterid);
            setFirstName(voter.firstName || '');
            setLastName(voter.lastName || '');
            setAge(voter.age || '');
            setPhone(voter.phone || '');
            setImagePreview(voter.image || '');
        } else {
            // Fallback: fetch from cookie if available
            const id = Cookies.get('myCookie');
            if (id) {
                axios.get(`${BASE_URL}/getVoterbyID/${id}`)
                    .then(res => {
                        if (res.data && res.data.voter) {
                            const v = res.data.voter;
                            setCurrentVoterId(v.voterid || v._id);

                            // Handle name splitting if firstName/lastName are missing
                            let fName = v.firstName || '';
                            let lName = v.lastName || '';
                            if (!fName && v.name) {
                                const parts = v.name.split(' ');
                                fName = parts[0];
                                lName = parts.slice(1).join(' ');
                            }

                            setFirstName(fName);
                            setLastName(lName);
                            setAge(v.age || '');
                            setPhone(v.phone || '');
                            setImagePreview(v.profilePic ? `${BASE_URL}/uploads/${v.profilePic}` : (v.image || ''));
                        }
                    })
                    .catch(err => console.error('Error fetching voter for edit:', err));
            }
        }
    }, [voter]);

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentVoterId) {
            toast.error('Voter information is missing');
            return;
        }

        const formData = new FormData();
        if (firstName) formData.append('firstName', firstName);
        if (lastName) formData.append('lastName', lastName);
        if (age) formData.append('age', age);
        if (phone) formData.append('phone', phone);
        if (imageFile) formData.append('image', imageFile);

        try {
            setLoading(true);
            const res = await axios.patch(`${BASE_URL}/updateVoterDetails/${currentVoterId}`, formData);
            if (res.data && res.data.success) {
                toast.success('Profile updated successfully');
                setTimeout(() => navigate('/User'), 1500);
            }
        } catch (err) {
            console.error('Error updating voter:', err);
            toast.error('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div >
            <UserNavbar />
            <section className="signup">
                <div className="container">
                    <div className="signup-content">
                        <div className="signup-form">
                            <h2 className="form-title">Edit Your Details</h2>
                            <form onSubmit={handleSubmit} className="register-form" id="register-form">
                                <div className="form-group">
                                    <label htmlFor="firstName"><i className="zmdi zmdi-account material-icons-name"></i></label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        id="firstName"
                                        placeholder="First Name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="lastName"><i className="zmdi zmdi-account material-icons-name"></i></label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        id="lastName"
                                        placeholder="Last Name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="age"><i className="zmdi zmdi-calendar-account material-icons-name"></i></label>
                                    <input
                                        type="number"
                                        name="age"
                                        id="age"
                                        placeholder="Your Age"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone"><i className="zmdi zmdi-local-phone material-icons-name"></i></label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        id="phone"
                                        placeholder="Your Phone Number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="image"><i className="zmdi zmdi-image"></i></label>
                                    <input
                                        type="file"
                                        name="image"
                                        id="image"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                {imagePreview && (
                                    <div className="form-group">
                                        <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', marginTop: '10px' }} />
                                    </div>
                                )}
                                <div className="form-group form-button">
                                    <button type="submit" className="form-submit" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )
}
export default EditProfile;