import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import BookSlot from './pages/BookSlot';
import Payment from './pages/Payment';
import Receipt from './pages/Receipt';
import QRScanner from './pages/QRScanner';
import MyBookings from './pages/MyBookings';
import BookingVerification from './pages/BookingVerification';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/book-slot" element={<BookSlot />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/receipt" element={<Receipt />} />
          <Route path="/qr-scanner" element={<QRScanner />} />
          <Route path="/booking/:bookingId" element={<BookingVerification />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;