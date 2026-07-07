// frontend/src/App.jsx

import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [newHabitName, setNewHabitName] = useState("");
  const [habits, setHabits] = useState([]);
  const [checkinsByHabit, setCheckinsByHabit] = useState({});
  const [loading, setLoading] = useState(true);

  /**
   * Returns today's date as YYYY-MM-DD in local time.
   */
  function getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Returns the last 7 calendar days including today.
   * Example: [today, yesterday, ... 6 days ago]
   */
  function getLast7Days() {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const dateString = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      days.push({
        dateString,
        dayNumber: date.getDate(),
      });
    }

    return days;
  }

  /**
   * Fetch all habits and then fetch checkins for each habit.
   * This is the single refresh function used everywhere after successful actions.
   */
  async function refreshAll() {
    try {
      const habitsResponse = await fetch(`${API_URL}/habits`);
      const habitsData = await habitsResponse.json();

      setHabits(habitsData);

      const nextCheckinsByHabit = {};

      for (const habit of habitsData) {
        try {
          const checkinsResponse = await fetch(
            `${API_URL}/habits/${habit.id}/checkins`
          );
          const checkinsData = await checkinsResponse.json();
          nextCheckinsByHabit[habit.id] = checkinsData;
        } catch (error) {
          console.error("Error fetching checkins for habit:", habit.id, error);
        }
      }

      setCheckinsByHabit(nextCheckinsByHabit);
    } catch (error) {
      console.error("Error refreshing habits:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  /**
   * Add a new habit. Empty/whitespace-only input is ignored silently.
   */
  async function handleAddHabit() {
    const trimmedName = newHabitName.trim();

    if (!trimmedName) {
      return;
    }

    try {
      await fetch(`${API_URL}/habits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      setNewHabitName("");
      await refreshAll();
    } catch (error) {
      console.error("Error adding habit:", error);
    }
  }

  /**
   * Add a check-in for the selected habit for today.
   */
  async function handleCheckIn(habitId) {
    try {
      await fetch(`${API_URL}/habits/${habitId}/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      await refreshAll();
    } catch (error) {
      console.error("Error checking in habit:", error);
    }
  }

  /**
   * Delete a habit and all its checkins.
   */
  async function handleDeleteHabit(habitId) {
    try {
      await fetch(`${API_URL}/habits/${habitId}`, {
        method: "DELETE",
      });

      await refreshAll();
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  }

  const today = getTodayDateString();

  return (
    <div className="page">
      <h1>🔥 Habit Tracker</h1>

      {/* New Habit card */}
      <div className="habit-card new-habit-card">
        <h2>New Habit</h2>

        <div className="new-habit-row">
          <input
            type="text"
            placeholder="e.g. Drink 2L water"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddHabit();
              }
            }}
          />
          <button onClick={handleAddHabit}>Add Habit</button>
        </div>
      </div>

      {/* Habits section */}
      <div>
        {loading ? (
          <p>Loading your habits...</p>
        ) : habits.length === 0 ? (
          <p>No habits yet. Add one above to get started!</p>
        ) : (
          habits.map((habit) => {
            const checkinDates = checkinsByHabit[habit.id] || [];
            const checkedInToday = checkinDates.includes(today);
            const last7Days = getLast7Days();

            return (
              <div className="habit-card" key={habit.id}>
                <h3>{habit.name}</h3>

                {habit.streak > 0 ? (
                  <p className="streak-text active-streak">
                    🔥 {habit.streak} day streak
                  </p>
                ) : (
                  <p className="streak-text">No streak yet — check in today!</p>
                )}

                <button
                  className={`checkin-button ${
                    checkedInToday ? "checked-in" : ""
                  }`}
                  disabled={checkedInToday}
                  onClick={() => handleCheckIn(habit.id)}
                >
                  {checkedInToday ? "✅ Checked in today" : "Check In"}
                </button>

                <div className="history-row">
                  {last7Days.map((day) => {
                    const done = checkinDates.includes(day.dateString);

                    return (
                      <div
                        key={day.dateString}
                        className={`day-box ${done ? "done" : "not-done"}`}
                        title={day.dateString}
                      >
                        {day.dayNumber}
                      </div>
                    );
                  })}
                </div>

                <button
                  className="delete-button"
                  onClick={() => handleDeleteHabit(habit.id)}
                >
                  Delete Habit
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default App;