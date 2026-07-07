# 🔥 Habit Tracker

A full-stack Habit Tracker application built using **React**, **Express.js**, and **SQLite (better-sqlite3)**. The application allows users to create habits, check in daily, track streaks, view recent activity, and manage habits through a clean user interface and REST API.

---

## Features

- Create new habits
- Daily habit check-ins
- Automatic streak calculation
- Prevent duplicate check-ins for the same day
- View last 7 days of habit history
- Delete individual habits
- Remove check-ins
- RESTful API
- SQLite database using better-sqlite3
- Postman collection included for API testing

---

## Technologies Used

### Frontend
- React
- Vite
- CSS

### Backend
- Node.js
- Express.js
- CORS
- better-sqlite3

### Database
- SQLite (`data.db`)

---

## Project Structure

```
project/
│
├── backend/
│   ├── index.js
│   ├── package.json
│   └── data.db
│
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── main.jsx
│       └── index.css
│
└── postman/
    ├── Habit-Tracker-API.postman_collection.json
    └── Habit-Tracker.postman_environment.json
```

---

## Database Tables

### habits

| Column | Type |
|---------|------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT |
| name | TEXT |
| created_at | TEXT |

### checkins

| Column | Type |
|---------|------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT |
| habit_id | INTEGER |
| date | TEXT |
| checked_at | TEXT |

Unique Constraint:

```
UNIQUE(habit_id, date)
```

This prevents multiple check-ins for the same habit on the same day.

---

## REST API Endpoints

### Create Habit

```
POST /habits
```

Request

```json
{
  "name": "Drink 2L Water"
}
```

---

### Get All Habits

```
GET /habits
```

Returns all habits along with their current streak.

---

### Check In Habit

```
POST /habits/:id/checkin
```

Optional Request Body

```json
{
  "date": "2026-07-06"
}
```

If no date is provided, today's date is used.

---

### Get Habit Check-ins

```
GET /habits/:id/checkins
```

Returns

```json
[
  "2026-07-06",
  "2026-07-05",
  "2026-07-04"
]
```

---

### Delete a Check-in

```
DELETE /habits/:id/checkin/:date
```

Example

```
DELETE /habits/3/checkin/2026-07-06
```

---

### Delete Habit

```
DELETE /habits/:id
```

Deletes the habit and all associated check-ins.

---

## Streak Logic

The application automatically calculates the current streak based on consecutive daily check-ins.

Rules:

- Starts counting from today.
- If today's check-in is missing but yesterday has one, the streak begins from yesterday.
- Missing both today and yesterday resets the streak to **0**.
- Consecutive calendar days increase the streak.

---

## Frontend Features

- Add new habits
- One-click daily check-in
- Disabled check-in button after today's check-in
- Displays current streak
- Shows previous 7-day history
- Delete habits
- Automatic refresh after every action

---

## Running the Project

### Backend

Navigate to the backend folder.

```bash
cd backend
```

Start the server.

```bash
node index.js
```

The backend runs on:

```
http://localhost:5000
```

---

### Frontend

Navigate to the frontend folder.

```bash
cd frontend
```

Start the Vite development server.

```bash
npm run dev
```

The frontend usually runs on:

```
http://localhost:5173
```

---

## API Testing

The project includes:

- `Habit-Tracker-API.postman_collection.json`
- `Habit-Tracker.postman_environment.json`

Import both files into Postman to test every API endpoint.

---

## Validation

- Habit name cannot be empty.
- Duplicate check-ins for the same date are prevented.
- Invalid habit IDs return appropriate error responses.
- Errors are handled gracefully without crashing the server.

---

## Future Improvements

- User authentication
- Habit categories
- Weekly and monthly statistics
- Dark mode
- Search and filter habits
- Reminder notifications
- Habit completion percentage
- Dashboard with charts
- Export data
- Mobile responsive enhancements

---

## Author

Developed as a Full Stack Habit Tracker project using:

- React
- Express.js
- SQLite (better-sqlite3)
- REST API
- Postman
