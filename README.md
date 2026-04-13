<div align="center" style="font-family: Arial, sans-serif;">

  <h1 style="margin-bottom: 0;">ParkEase</h1>
  <h3 style="margin-top: 5px; font-weight: normal; color: #555;">
    Smart Parking Management System
  </h3>

  <p style="max-width: 650px; font-size: 15px; line-height: 1.5; color: #444;">
    ParkEase is a smart web-based solution that helps users find, book, and manage parking slots 
    with ease. It provides real-time availability, QR-based entry verification, and a seamless 
    booking experience for both users and administrators.
  </p>

  <hr style="width: 60%; margin: 30px auto;" />

  <h2>Features</h2>

  <div style="max-width: 650px; text-align: left; margin: auto; font-size: 15px; line-height: 1.6; color: #444;">
    <strong>User Features</strong>
    <ul>
      <li>Real-time slot availability</li>
      <li>Book and manage reservations</li>
      <li>Secure payment gateway integration (Stripe)</li>
      <li>QR Code based entry pass with comprehensive booking details</li>
      <li>Automatic slot release upon booking expiration</li>
      <li>User authentication</li>
      <li>Location-based parking suggestions</li>
    </ul>

    <strong>Admin Features</strong>
    <ul>
      <li>Manage parking slots</li>
      <li>Monitor bookings</li>
      <li>View occupancy statistics</li>
      <li>Real-time booking management</li>
    </ul>
  </div>

  <hr style="width: 60%; margin: 30px auto;" />

  <h2>Tech Stack</h2>

  <p style="max-width: 600px; margin: auto; font-size: 15px; line-height: 1.6; color: #444;">
    <strong>Frontend:</strong> React.js, Vite, Tailwind CSS, Stripe Elements <br/>
    <strong>Backend:</strong> Node.js, Express.js, MongoDB, Stripe API <br/>
    <strong>Additional:</strong> JWT Auth, QR Generator, Node-cron Scheduler, Maps API (future)
  </p>

  <hr style="width: 60%; margin: 30px auto;" />

  <h2>System Workflow</h2>

  <p style="max-width: 600px; margin: auto; font-size: 15px; line-height: 1.6; color: #444;">
    1. User selects a location <br/>
    2. System displays available slots <br/>
    3. User books a slot and completes secure payment via Stripe <br/>
    4. User receives a comprehensive QR code ticket with all booking details <br/>
    5. QR is scanned at the parking gate for verification <br/>
    6. System automatically releases slot when booking expires
  </p>

  <hr style="width: 60%; margin: 30px auto;" />

  <h2>Installation</h2>

  <div style="text-align: left; max-width: 600px; margin: auto; font-size: 14px; color: #444;">
    <strong>Prerequisites</strong><br/>
    • Node.js (v14 or higher)<br/>
    • MongoDB database<br/>
    • Stripe account for payment processing<br/><br/>

    <strong>Clone Repository</strong><br/>
    <pre>git clone https://github.com/Harshita1325/Smart_Parking_System-Parkease.git
cd Smart_Parking_System-Parkease</pre>

    <strong>Environment Setup</strong><br/>
    <pre># Backend .env
cp .env.example .env
# Add your MongoDB URI, JWT secret, and Stripe keys

# Frontend .env
cd frontend
cp .env.example .env
# Add your Stripe publishable key</pre>

    <strong>Stripe Setup</strong><br/>
    <pre>1. Create a Stripe account at https://stripe.com
2. Get your API keys from the dashboard
3. Add STRIPE_SECRET_KEY to backend .env
4. Add VITE_STRIPE_PUBLISHABLE_KEY to frontend .env</pre>

    <strong>Installation</strong><br/>
    <strong>Frontend Setup</strong><br/>
    <pre>cd frontend
npm install
npm run dev</pre>

    <strong>Backend Setup</strong><br/>
    <pre>cd ..
npm install
npm start</pre>
  </div>

  <hr style="width: 60%; margin: 30px auto;" />

  <h2>API Endpoints</h2>

  <p style="text-align: left; max-width: 600px; margin: auto; font-size: 14px; line-height: 1.7; color: #444;">
    <strong>Auth</strong><br/>
    • POST /api/auth/register – Register user<br/>
    • POST /api/auth/login – Login user<br/><br/>

    <strong>Locations</strong><br/>
    • GET /api/locations – Get all locations<br/>
    • GET /api/locations/:id – Get location details<br/><br/>

    <strong>Slots</strong><br/>
    • GET /api/slots – Get all slots<br/>
    • POST /api/slots – Add new slot (Admin)<br/><br/>

    <strong>Bookings</strong><br/>
    • POST /api/bookings/create-payment-intent – Create Stripe payment intent<br/>
    • POST /api/bookings – Create booking with payment<br/>
    • GET /api/bookings/my-bookings – Get user's bookings<br/>
    • GET /api/bookings/:id – Get booking details<br/>
    • PUT /api/bookings/:id/cancel – Cancel booking<br/>
    • PUT /api/bookings/:id/checkin – Check-in to booking<br/>
    • PUT /api/bookings/:id/checkout – Check-out from booking<br/>
    • POST /api/bookings/complete-expired – Complete expired bookings (Admin)<br/>
  </p>

  <hr style="width: 60%; margin: 30px auto;" />

  <h2>Folder Structure</h2>
  <pre style="text-align: left; max-width: 600px; margin: auto; font-size: 14px; color: #444;">
Smart_Parking_System-Parkease/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   └── server.js
│
└── README.md
  </pre>

  <hr style="width: 60%; margin: 30px auto;" />

  <h2>Future Enhancements</h2>

  <p style="max-width: 600px; margin: auto; font-size: 15px; line-height: 1.6; color: #444;">
    • IoT-based live detection <br/>
    • AI-driven peak hour prediction <br/>
    • Mobile app (React Native) <br/>
    • Automated entry/exit gate integration <br/>
  </p>

  <hr style="width: 60%; margin: 30px auto;" />

  <h3>Developer</h3>
  <p><strong>Harshita Bande</strong></p>

</div>
