import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import '../App.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotsOverview, setSlotsOverview] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [slotFilter, setSlotFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [locationForm, setLocationForm] = useState({ name: '', address: '', lat: '', long: '', totalSlots: 20, floors: 1, type: 'indoor' });
  const [slotForm, setSlotForm] = useState({ locationId: '', slotNumber: '', vehicleType: 'car', floor: 'Ground', row: 'A', position: 1, pricePerHour: 50 });
  const [editSlotLocationId, setEditSlotLocationId] = useState('');
  const [editSlotId, setEditSlotId] = useState('');
  const [slotEditForm, setSlotEditForm] = useState({
    slotNumber: '',
    vehicleType: 'car',
    floor: 'Ground',
    row: 'A',
    position: 1,
    pricePerHour: 50,
    isAvailable: true,
    slotState: 'NOT_BOOKED'
  });
  const navigate = useNavigate();

  const refreshDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [slotRes, usersRes, bookingsRes] = await Promise.all([
        api.get('/slots/admin/overview'),
        api.get('/auth/users'),
        api.get('/bookings')
      ]);
      setSlotsOverview(slotRes.data?.data || []);
      setUsers(usersRes.data?.data || []);
      setBookings(bookingsRes.data?.data || []);
      if (!slotForm.locationId && slotRes.data?.data?.length > 0) {
        setSlotForm((prev) => ({ ...prev, locationId: slotRes.data.data[0].locationId }));
        setEditSlotLocationId(slotRes.data.data[0].locationId);
      }
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [slotForm.locationId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) return navigate('/login');
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') return navigate('/dashboard');
    setUser(parsedUser);
    refreshDashboard();
  }, [navigate, refreshDashboard]);

  useEffect(() => {
    if (!user) return undefined;
    const interval = setInterval(() => {
      refreshDashboard();
    }, 5000);
    return () => clearInterval(interval);
  }, [user, refreshDashboard]);

  const totalStats = useMemo(() => slotsOverview.reduce((acc, location) => {
    acc.totalSlots += location.stats.total;
    acc.notBooked += location.stats.notBooked;
    acc.booked += location.stats.booked;
    acc.arrived += location.stats.arrived;
    acc.expired += location.stats.expired || 0;
    return acc;
  }, { totalSlots: 0, notBooked: 0, booked: 0, arrived: 0, expired: 0 }), [slotsOverview]);

  const filteredBookings = useMemo(() => bookings.filter((b) => {
    const slotMatch = slotFilter ? (b.slotId?.slotNumber || '').toLowerCase().includes(slotFilter.toLowerCase()) : true;
    const dateMatch = dateFilter ? new Date(b.startTime).toISOString().slice(0, 10) === dateFilter : true;
    const timeMatch = timeFilter ? new Date(b.startTime).toTimeString().slice(0, 5) === timeFilter : true;
    return slotMatch && dateMatch && timeMatch;
  }), [bookings, slotFilter, dateFilter, timeFilter]);

  const paymentStats = useMemo(() => bookings.reduce((acc, booking) => {
    const key = booking.paymentStatus || 'PENDING';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, { PENDING: 0, COMPLETED: 0, FAILED: 0, REFUNDED: 0 }), [bookings]);

  const selectedEditLocation = useMemo(
    () => slotsOverview.find((loc) => String(loc.locationId) === String(editSlotLocationId)),
    [slotsOverview, editSlotLocationId]
  );

  const updateSlotState = async (slotId, isAvailable) => {
    await api.put(`/slots/${slotId}/status`, { isAvailable });
    await refreshDashboard();
  };

  const toggleBlockUser = async (id, blocked) => {
    await api.put(`/auth/users/${id}/block`, { blocked: !blocked });
    await refreshDashboard();
  };

  const createLocation = async (e) => {
    e.preventDefault();
    await api.post('/locations', {
      name: locationForm.name,
      address: locationForm.address,
      coordinates: { lat: Number(locationForm.lat), long: Number(locationForm.long) },
      totalSlots: Number(locationForm.totalSlots),
      floors: Number(locationForm.floors),
      type: locationForm.type
    });
    setLocationForm({ name: '', address: '', lat: '', long: '', totalSlots: 20, floors: 1, type: 'indoor' });
    await refreshDashboard();
  };

  const createSlot = async (e) => {
    e.preventDefault();
    await api.post('/slots', {
      ...slotForm,
      position: Number(slotForm.position),
      pricePerHour: Number(slotForm.pricePerHour)
    });
    setSlotForm((prev) => ({ ...prev, slotNumber: '', row: 'A', position: 1 }));
    await refreshDashboard();
  };

  const loadSlotForEdit = (slotId) => {
    setEditSlotId(slotId);
    const slot = selectedEditLocation?.slots?.find((s) => String(s._id) === String(slotId));
    if (!slot) return;
    setSlotEditForm({
      slotNumber: slot.slotNumber || '',
      vehicleType: slot.vehicleType || 'car',
      floor: slot.floor || 'Ground',
      row: slot.row || 'A',
      position: slot.position || 1,
      pricePerHour: slot.pricePerHour || 50,
      isAvailable: Boolean(slot.isAvailable),
      slotState: slot.slotState || 'NOT_BOOKED'
    });
  };

  const updateSlotDetails = async (e) => {
    e.preventDefault();
    if (!editSlotId) return;
    await api.put(`/slots/${editSlotId}`, {
      slotNumber: slotEditForm.slotNumber,
      vehicleType: slotEditForm.vehicleType,
      floor: slotEditForm.floor,
      row: slotEditForm.row,
      position: Number(slotEditForm.position),
      pricePerHour: Number(slotEditForm.pricePerHour),
      isAvailable: slotEditForm.isAvailable,
      slotState: slotEditForm.slotState
    });
    await refreshDashboard();
  };

  const deleteSlotById = async () => {
    if (!editSlotId) return;
    if (!window.confirm('Delete this slot? This cannot be undone.')) return;
    await api.delete(`/slots/${editSlotId}`);
    setEditSlotId('');
    setSlotEditForm({
      slotNumber: '',
      vehicleType: 'car',
      floor: 'Ground',
      row: 'A',
      position: 1,
      pricePerHour: 50,
      isAvailable: true,
      slotState: 'NOT_BOOKED'
    });
    await refreshDashboard();
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)' }}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
          <div style={{ marginBottom: 'var(--spacing-3xl)' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-lg)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🛠️ Admin Dashboard
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', margin: 0 }}>
              Monitor slots, bookings, users, locations and slot states. Welcome, {user?.name}.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-2xl)' }}>
            {[
              { label: 'Total Slots', value: totalStats.totalSlots },
              { label: 'Open', value: totalStats.notBooked },
              { label: 'Booked', value: totalStats.booked },
              { label: 'Arrived', value: totalStats.arrived },
              { label: 'Expired', value: totalStats.expired }
            ].map((card) => (
              <div key={card.label} className="card card-glass" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{card.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>{card.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <div className="card card-glass">
              <h3>💳 Payment Status Mix</h3>
              {Object.entries(paymentStats).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-glass" style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <h3>🔍 Slot/Date/Time Booking Lookup</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <input className="form-input" placeholder="Slot number (A1)" value={slotFilter} onChange={(e) => setSlotFilter(e.target.value)} />
              <input className="form-input" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
              <input className="form-input" type="time" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} />
            </div>
            <div style={{ maxHeight: 260, overflow: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.9rem' }}>
                <thead><tr><th>User</th><th>Slot</th><th>Vehicle</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b._id}>
                      <td>{b.userId?.name || '-'}</td>
                      <td>{b.slotId?.slotNumber || '-'}</td>
                      <td>{b.vehicleNumber}</td>
                      <td>{new Date(b.startTime).toLocaleString()}</td>
                      <td>{new Date(b.endTime).toLocaleString()}</td>
                      <td>{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card card-glass" style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <h3>🅿️ Manual Slot State Update</h3>
            {slotsOverview.map((location) => (
              <div key={location.locationId} style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 600 }}>{location.locationName}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {location.slots.map((slot) => (
                    <button key={slot._id} className="btn btn-outline btn-sm" onClick={() => updateSlotState(slot._id, !slot.isAvailable)}>
                      {slot.slotNumber} ({slot.slotState})
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-2xl)' }}>
            <form className="card card-glass" onSubmit={createLocation}>
              <h3>📍 Create Location</h3>
              <input className="form-input" placeholder="Name" value={locationForm.name} onChange={(e) => setLocationForm((p) => ({ ...p, name: e.target.value }))} required />
              <input className="form-input" placeholder="Address" value={locationForm.address} onChange={(e) => setLocationForm((p) => ({ ...p, address: e.target.value }))} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input className="form-input" placeholder="Latitude" value={locationForm.lat} onChange={(e) => setLocationForm((p) => ({ ...p, lat: e.target.value }))} required />
                <input className="form-input" placeholder="Longitude" value={locationForm.long} onChange={(e) => setLocationForm((p) => ({ ...p, long: e.target.value }))} required />
              </div>
              <button className="btn btn-primary" type="submit">Create Location</button>
            </form>

            <form className="card card-glass" onSubmit={createSlot}>
              <h3>➕ Add Slot</h3>
              <select className="form-input" value={slotForm.locationId} onChange={(e) => setSlotForm((p) => ({ ...p, locationId: e.target.value }))} required>
                <option value="">Select location</option>
                {slotsOverview.map((loc) => <option key={loc.locationId} value={loc.locationId}>{loc.locationName}</option>)}
              </select>
              <input className="form-input" placeholder="Slot Number (A7)" value={slotForm.slotNumber} onChange={(e) => setSlotForm((p) => ({ ...p, slotNumber: e.target.value }))} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input className="form-input" value="Car" readOnly />
                <input className="form-input" type="number" min="1" value={slotForm.pricePerHour} onChange={(e) => setSlotForm((p) => ({ ...p, pricePerHour: e.target.value }))} placeholder="Price per hour" />
              </div>
              <button className="btn btn-primary" type="submit">Add Slot</button>
            </form>
          </div>

          <form className="card card-glass" style={{ marginBottom: 'var(--spacing-2xl)' }} onSubmit={updateSlotDetails}>
            <h3>✏️ Update Slot Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
              <select className="form-input" value={editSlotLocationId} onChange={(e) => { setEditSlotLocationId(e.target.value); setEditSlotId(''); }}>
                <option value="">Select location</option>
                {slotsOverview.map((loc) => <option key={loc.locationId} value={loc.locationId}>{loc.locationName}</option>)}
              </select>
              <select className="form-input" value={editSlotId} onChange={(e) => loadSlotForEdit(e.target.value)}>
                <option value="">Select slot</option>
                {(selectedEditLocation?.slots || []).map((slot) => (
                  <option key={slot._id} value={slot._id}>{slot.slotNumber}</option>
                ))}
              </select>
              <input className="form-input" value={slotEditForm.slotNumber} onChange={(e) => setSlotEditForm((p) => ({ ...p, slotNumber: e.target.value }))} placeholder="Slot number" />
              <input className="form-input" value="Car" readOnly />
              <input className="form-input" value={slotEditForm.floor} onChange={(e) => setSlotEditForm((p) => ({ ...p, floor: e.target.value }))} placeholder="Floor" />
              <input className="form-input" value={slotEditForm.row} onChange={(e) => setSlotEditForm((p) => ({ ...p, row: e.target.value }))} placeholder="Row" />
              <input className="form-input" type="number" min="1" value={slotEditForm.position} onChange={(e) => setSlotEditForm((p) => ({ ...p, position: e.target.value }))} placeholder="Position" />
              <input className="form-input" type="number" min="1" value={slotEditForm.pricePerHour} onChange={(e) => setSlotEditForm((p) => ({ ...p, pricePerHour: e.target.value }))} placeholder="Price / hr" />
              <select className="form-input" value={String(slotEditForm.isAvailable)} onChange={(e) => setSlotEditForm((p) => ({ ...p, isAvailable: e.target.value === 'true' }))}>
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
              <select className="form-input" value={slotEditForm.slotState} onChange={(e) => setSlotEditForm((p) => ({ ...p, slotState: e.target.value }))}>
                <option value="NOT_BOOKED">NOT_BOOKED</option>
                <option value="BOOKED">BOOKED</option>
                <option value="ARRIVED">ARRIVED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <button className="btn btn-primary" type="submit" disabled={!editSlotId}>Update Slot</button>
              <button className="btn btn-danger" type="button" disabled={!editSlotId} onClick={deleteSlotById} style={{ marginLeft: '0.5rem' }}>Delete Slot</button>
            </div>
          </form>

          <div className="card card-glass">
            <h3>👥 Users & Booking History Panel</h3>
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.9rem' }}>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Blocked</th><th>Bookings</th><th>Action</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.isBlocked ? 'Yes' : 'No'}</td>
                      <td>{u.bookings?.length || 0}</td>
                      <td>
                        {u.role !== 'admin' && (
                          <button className="btn btn-outline btn-sm" onClick={() => toggleBlockUser(u._id, u.isBlocked)}>
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;