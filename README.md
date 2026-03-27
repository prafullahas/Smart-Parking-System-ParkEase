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
      <li>QR Code based entry pass</li>
      <li>User authentication</li>
      <li>Location-based parking suggestions</li>
    </ul>

    <strong>Admin Features</strong>
    <ul>
      <li>Manage parking slots</li>
      <li>Monitor bookings</li>
      <li>View occupancy statistics</li>
    </ul>
  </div>

  <hr style="width: 60%; margin: 30px auto;" />

  <h2>Tech Stack</h2>

  <p style="max-width: 600px; margin: auto; font-size: 15px; line-height: 1.6; color: #444;">
    <strong>Frontend:</strong> React.js, Vite, Tailwind CSS <br/>
    <strong>Backend:</strong> Node.js, Express.js, MongoDB <br/>
    <strong>Additional:</strong> JWT Auth, QR Generator, Maps API (future)
  </p>

  <hr style="width: 60%; margin: 30px auto;" />

  <h2>System Workflow</h2>

  <p style="max-width: 600px; margin: auto; font-size: 15px; line-height: 1.6; color: #444;">
    1. User selects a location <br/>
    2. System displays available slots <br/>
    3. User books a slot and receives a QR code <br/>
    4. QR is scanned at the parking gate for verification
  </p>

  <hr style="width: 60%; margin: 30px auto;" />

  <h2>Installation</h2>

  <div style="text-align: left; max-width: 600px; margin: auto; font-size: 14px; color: #444;">
    <strong>Clone Repository</strong><br/>
    <pre>git clone https://github.com/Harshita1325/Smart_Parking_System-Parkease.git
cd Smart_Parking_System-Parkease</pre>

    <strong>Frontend Setup</strong><br/>
    <pre>cd frontend
npm install
npm run dev</pre>

    <strong>Backend Setup</strong><br/>
    <pre>cd backend
npm install
npm start</pre>
  </div>

  <hr style="width: 60%; margin: 30px auto;" />

  <h2>API Endpoints</h2>

  <p style="text-align: left; max-width: 600px; margin: auto; font-size: 14px; line-height: 1.7; color: #444;">
    <strong>Auth</strong><br/>
    • POST /api/auth/register – Register user<br/>
    • POST /api/auth/login – Login user<br/><br/>

    <strong>Slots</strong><br/>
    • GET /api/slots – Get all slots<br/>
    • POST /api/slots – Add new slot (Admin)<br/><br/>

    <strong>Bookings</strong><br/>
    • POST /api/book – Book a slot<br/>
    • GET /api/book/:id – Get booking details<br/>
    • DELETE /api/book/:id – Cancel booking<br/>
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
