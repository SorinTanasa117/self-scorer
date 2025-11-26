# Self-Appreciation App

## Overview
A Firebase-powered web application for tracking positive actions and achievements. Users can log daily positive activities, view progress through interactive charts, and build self-appreciation habits.

## Project Type
Frontend-only static web application using Firebase for authentication and data storage.

## Architecture

### Frontend
- **Technology**: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Libraries**:
  - Firebase SDK 9.6.10 (Authentication & Firestore)
  - Chart.js (data visualization)
  - Compromise.js (natural language processing for lifestyle categorization)
- **Server**: http-server on port 5000 (development)

### Backend Services
- **Firebase Authentication**: User registration and login
- **Firebase Firestore**: NoSQL database for storing user data
  - Collections: `users/{userId}/positives`, `users/{userId}/custom_templates`

## Key Features
1. **Authentication**: Email/password login and registration
2. **Calendar View**: Monthly calendar showing daily positive action scores
3. **Daily Logging**: Add positive actions with difficulty ratings (1-10)
4. **Templates**: Standard and custom templates for common positive actions
5. **Progress Charts**: Week/Month/Year view of positive action scores
6. **Lifestyle Analysis**: Categorizes positive actions into 14 life areas (Work, Hobbies, Physical Health, Mental Health, Community Service, Family, Education, Creativity, Spirituality, Finances, Relationships, Environmental Protection, Politics, Miscellaneous) using NLP
7. **Template Reuse**: Copy positive actions from previous days

## File Structure
```
.
├── index.html              # Main application page
├── login.html             # Login page
├── register.html          # Registration page
├── app.js                 # Main application logic
├── auth.js                # Firebase authentication & Firestore functions
├── login.js               # Login page logic
├── register.js            # Registration page logic
├── firebase-config.js     # Firebase configuration
├── style.css              # Application styles
├── package.json           # Node.js dependencies
└── replit.md             # Project documentation (this file)
```

## Development Setup

### Running the Application
The app runs automatically via the configured workflow:
```bash
npm start
```
This starts http-server on `0.0.0.0:5000` for Replit preview compatibility.

### Firebase Configuration
The app uses a pre-configured Firebase project. Authentication and Firestore are already set up.

**Important Security Note**: Firestore security rules should be configured to restrict user data access:
```javascript
match /users/{userId}/{documents=**} {
  allow read, write: if request.auth.uid == userId;
}
```

## Deployment
Configured as a static site deployment:
- **Type**: Static
- **Public Directory**: `.` (root)
- All HTML, CSS, JS, and assets are served directly

## User Flow
1. User visits the app → Redirected to login.html if not authenticated
2. User registers/logs in → Redirected to index.html
3. Main app loads with calendar view for current month
4. User can:
   - Click calendar days to view/edit positive actions for that date
   - Add new positive actions using the "+" button
   - Use templates for quick entry
   - View progress charts (weekly/monthly/yearly)
   - Sign out (returns to login page)

## Date Restrictions
- Users can only edit positive actions from the past 14 days
- Older dates are view-only (displayed with "uneditable-day" style)

## Recent Changes
- **2025-11-26**: Replaced Verb Analysis with Lifestyle Analysis
  - Changed chart from verb-based bubble chart to lifestyle category bar chart
  - Uses Compromise.js NLP to classify entries into 14 life areas
  - Chart now syncs with Progress chart date range (week/month/year)
  - Color-coded horizontal bar chart for better visualization

- **2025-11-26**: Initial import and Replit environment setup
  - Cleaned up package.json (removed unused backend dependencies)
  - Configured http-server for static file serving on port 5000
  - Set up Replit workflow for frontend
  - Configured static deployment
