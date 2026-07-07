// backend/index.js

const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Connect to SQLite database
const db = new Database("data.db");

// Create the habits table if it does not already exist.
db.prepare(`
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`).run();

// Create the checkins table if it does not already exist.
db.prepare(`
  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    checked_at TEXT NOT NULL,
    UNIQUE(habit_id, date)
  )
`).run();

/**
 * Returns today's date as YYYY-MM-DD using local time.
 */
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns a new Date shifted by a number of days from the provided date.
 */
function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Formats a Date object as YYYY-MM-DD using local time.
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculate the current streak for a habit by looking at all of its check-in dates.
 * If today is missing but yesterday exists, the streak still continues from yesterday;
 * if both today and yesterday are missing, the streak is 0.
 */
function calculateStreak(habitId) {
  const rows = db
    .prepare(
      `SELECT date FROM checkins WHERE habit_id = ? ORDER BY date DESC`
    )
    .all(habitId);

  const checkinDates = new Set(rows.map((row) => row.date));

  const today = new Date();
  const todayString = formatDate(today);
  const yesterday = addDays(today, -1);
  const yesterdayString = formatDate(yesterday);

  // If there is no check-in for today AND no check-in for yesterday, streak is 0
  if (!checkinDates.has(todayString) && !checkinDates.has(yesterdayString)) {
    return 0;
  }

  // Start from today if checked in today, otherwise start from yesterday
  let currentDate = checkinDates.has(todayString) ? today : yesterday;
  let streak = 0;

  while (checkinDates.has(formatDate(currentDate))) {
    streak++;
    currentDate = addDays(currentDate, -1);
  }

  return streak;
}

// Create a new habit.
app.post("/habits", (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const createdAt = new Date().toISOString();
    const result = db
      .prepare(`INSERT INTO habits (name, created_at) VALUES (?, ?)`)
      .run(name.trim(), createdAt);

    const newHabit = db
      .prepare(`SELECT * FROM habits WHERE id = ?`)
      .get(result.lastInsertRowid);

    res.status(201).json({
      ...newHabit,
      streak: 0,
    });
  } catch (error) {
    console.error("Error creating habit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// List all habits and include the current streak for each one.
app.get("/habits", (req, res) => {
  try {
    const habits = db
      .prepare(`SELECT * FROM habits ORDER BY created_at ASC`)
      .all();

    const habitsWithStreak = habits.map((habit) => ({
      ...habit,
      streak: calculateStreak(habit.id),
    }));

    res.status(200).json(habitsWithStreak);
  } catch (error) {
    console.error("Error fetching habits:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a check-in for a habit for a given date, or today if no date is provided.
app.post("/habits/:id/checkin", (req, res) => {
  try {
    const habitId = Number(req.params.id);
    const { date } = req.body;

    const habit = db.prepare(`SELECT * FROM habits WHERE id = ?`).get(habitId);
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }

    const resolvedDate = date || getTodayDateString();
    const checkedAt = new Date().toISOString();

    const result = db
      .prepare(
        `INSERT INTO checkins (habit_id, date, checked_at) VALUES (?, ?, ?)`
      )
      .run(habitId, resolvedDate, checkedAt);

    const newCheckin = db
      .prepare(`SELECT * FROM checkins WHERE id = ?`)
      .get(result.lastInsertRowid);

    res.status(201).json({
      ...newCheckin,
      streak: calculateStreak(habitId),
    });
  } catch (error) {
    console.error("Error creating checkin:", error);

    // UNIQUE constraint means habit already checked in for that date
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE" || String(error.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "Already checked in for this date" });
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

// Return all check-in dates for a single habit.
app.get("/habits/:id/checkins", (req, res) => {
  try {
    const habitId = Number(req.params.id);

    const habit = db.prepare(`SELECT * FROM habits WHERE id = ?`).get(habitId);
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }

    const rows = db
      .prepare(`SELECT date FROM checkins WHERE habit_id = ? ORDER BY date DESC`)
      .all(habitId);

    const dates = rows.map((row) => row.date);

    res.status(200).json(dates);
  } catch (error) {
    console.error("Error fetching checkins:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove a check-in for a specific habit/date combination.
app.delete("/habits/:id/checkin/:date", (req, res) => {
  try {
    const habitId = Number(req.params.id);
    const { date } = req.params;

    db.prepare(`DELETE FROM checkins WHERE habit_id = ? AND date = ?`).run(
      habitId,
      date
    );

    res.status(200).json({ message: "Checkin removed" });
  } catch (error) {
    console.error("Error deleting checkin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a habit and all of its check-in history.
app.delete("/habits/:id", (req, res) => {
  try {
    const habitId = Number(req.params.id);

    db.prepare(`DELETE FROM checkins WHERE habit_id = ?`).run(habitId);
    db.prepare(`DELETE FROM habits WHERE id = ?`).run(habitId);

    res
      .status(200)
      .json({ message: `Habit ${habitId} and its checkins deleted` });
  } catch (error) {
    console.error("Error deleting habit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:5000");
});