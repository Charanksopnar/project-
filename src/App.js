import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { RealtimeProvider } from './context/RealtimeContext';
import { NotificationProvider } from './context/NotificationContext';
import PushNotification from './components/Notification/PushNotification';
import Home from './components/Home/Home';
import AdminLogin from './components/Sign/AdminLogin';
import Login from './components/Sign/Login';
import Signup from './components/Sign/Signup';
import User from './components/User/User';
import New from './components/NewDashboard/New';
import NewVoters from './components/NewDashboard/scenes/voters/NewVoters';
import Vote from './components/User/Components/Voter/Vote';
import EditProfile from './components/User/Components/EditProfile/EditProfile';
import AuditLogs from './components/Admin/AuditLogs';
import NewCandidates from './components/NewDashboard/scenes/candidates/NewCandidates';
import AddCandidate from './components/NewDashboard/scenes/NewCandidate/AddCandidate';
import AddElection from './components/NewDashboard/scenes/NewElection/AddElection';
import Calendar from './components/NewDashboard/scenes/calendar/Calendar';
import Line from './components/NewDashboard/scenes/line/Line';
import Pie from './components/NewDashboard/scenes/pie/Pie';
import Result from './components/NewDashboard/scenes/result/Result';
import AdminLayout from './components/Admin/AdminLayout';
import RegionElectionConfig from './components/Admin/RegionElectionConfig';
import CandidateManagement from './components/Admin/CandidateManagement';
import UpcomingElection from './components/NewDashboard/scenes/upcoming/UpcomingElection';
import InvalidVotes from './components/NewDashboard/scenes/invalidVotes/InvalidVotes';
import VideoCaptureDiagnostic from './components/VideoCaptureDiagnostic';
import IdVerification from './components/IdVerification/IdVerification';
import Notification from './components/Notification/Notification';
import KYCReview from './components/Admin/KYCReview';
import FaceCapturePreview from './components/Previews/FaceCapturePreview';

const Routing = () => {
  return (
    <Routes>
      <Route exact path="/" element={<Home />} />
      <Route path="/Signup" element={<Signup />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/AdminLogin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<New />} />\r\n      <Route path="/Admin" element={<New />} />
      <Route path="/Admin/audits" element={<AdminLayout><AuditLogs /></AdminLayout>} />
      <Route path="/admin/region-election" element={<AdminLayout><RegionElectionConfig /></AdminLayout>} />
      <Route path="/admin/candidate-management" element={<AdminLayout><CandidateManagement /></AdminLayout>} />
      <Route path="/admin/kyc-review" element={<AdminLayout><KYCReview /></AdminLayout>} />
      <Route path="/admin/notifications" element={<AdminLayout><Notification /></AdminLayout>} />
      <Route path="/AddElection" element={<AddElection />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/Edit" element={<EditProfile />} />
      <Route path="/User" element={<User />} />
      <Route path="/Vote/:id" element={<Vote />} />
      <Route path="/upcoming" element={<UpcomingElection />} />
      <Route path="/invalidVotes" element={<InvalidVotes />} />
      <Route path="/diagnostic" element={<VideoCaptureDiagnostic />} />
      <Route path="/verify-id" element={<IdVerification />} />
      <Route path="/IdVerification" element={<IdVerification />} />
      <Route path="/notifications" element={<Notification />} />
      <Route path="/Voters" element={<NewVoters />} />
      <Route path="/candidate" element={<NewCandidates />} />
      <Route path="/AddCandidate" element={<AddCandidate />} />
      <Route path="/BarChart" element={<Result />} />
      <Route path="/PieChart" element={<Pie />} />
      <Route path="/LineChart" element={<Line />} />
      <Route path="/face-capture-preview" element={<FaceCapturePreview />} />
    </Routes>
  );
};

function App() {
  return (
    <NotificationProvider>
      <RealtimeProvider>
        <BrowserRouter>
          <PushNotification />
          <Routing />
        </BrowserRouter>
      </RealtimeProvider>
    </NotificationProvider>
  );
}

export default App;
