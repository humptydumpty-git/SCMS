# School Management System - Web Portal

## Overview
This is the web portal for the School Management System. It provides a beautiful landing page with quick access to all system features.

## Accessing the Portal

1. **Start the Backend Server:**
   ```bash
   cd backend
   node server.js
   ```

2. **Access the Portal:**
   Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Portal Features

- **Beautiful Modern Design**: Responsive design that works on all devices
- **Quick Access Cards**: Direct links to all major system modules
- **System Status**: Real-time status checking for API, Database, and Frontend
- **Feature Overview**: Information about system capabilities
- **Easy Navigation**: Quick access buttons to the main application

## Portal Sections

### 1. Student Management
Access student records, add new students, update information, and manage student data.

### 2. Fee Management
Track fee payments, generate reports, and manage financial records for all students.

### 3. User Management
Manage system users, assign roles, and control access permissions for staff members.

### 4. Dashboard
View comprehensive statistics, analytics, and system overview at a glance.

## Frontend Application

The portal links to the React frontend application which should be running on:
```
http://localhost:3000
```

To start the frontend:
```bash
cd frontend
npm install
npm start
```

## API Endpoints

The backend API is available at:
```
http://localhost:5000/api
```

Main API routes:
- `/api/auth` - Authentication endpoints
- `/api/students` - Student management endpoints
- `/api/fees` - Fee management endpoints

## Customization

You can customize the portal by editing:
- `index.html` - Portal structure and content
- `css/portal.css` - Styling and design

## Notes

- Make sure both backend (port 5000) and frontend (port 3000) are running for full functionality
- The portal will show system status indicators for each service
- All links open in new tabs for easy navigation

