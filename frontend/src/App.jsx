import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import CompanyDrives from './pages/CompanyDrives';
import AdminDrives from './pages/AdminDrives';
import StudentDrives from './pages/StudentDrives';
import MyApplications from './pages/MyApplications';
import DriveApplicants from './pages/DriveApplicants';
import AdminCompanies from './pages/AdminCompanies';
import CompanyInterviews from './pages/CompanyInterviews';
import StudentInterviews from './pages/StudentInterviews';
import StudentNotifications from './pages/StudentNotifications';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/drives" element={<CompanyDrives />} />
          <Route path="/admin/drives" element={<AdminDrives />} />
          <Route path="/student/drives" element={<StudentDrives />} />
          <Route path="/student/applications" element={<MyApplications />} />
          <Route path="/company/applicants" element={<DriveApplicants />} />
          <Route path="/admin/companies" element={<AdminCompanies />} />
          <Route path="/company/interviews" element={<CompanyInterviews />} />
          <Route path="/student/interviews" element={<StudentInterviews />} />
          <Route path="/student/notifications" element={<StudentNotifications />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;