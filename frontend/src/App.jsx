
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/api/tasks/";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchTasks() {
    try {
      setError("");
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not load tasks.");
      }

      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError("Unable to connect to the API. Is Django running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  async function addTask(event) {
    event.preventDefault();

    if (!title.trim()) return;

    try {
      setError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Could not create task.");
      }

      const newTask = await response.json();
      setTasks((previousTasks) => [newTask, ...previousTasks]);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError("Could not create the task. Check that Django is running.");
    }
  }

  async function toggleTask(task) {
    try {
      setError("");

      const response = await fetch(`${API_URL}${task.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not update task.");
      }

      const updatedTask = await response.json();

      setTasks((previousTasks) =>
        previousTasks.map((item) =>
          item.id === updatedTask.id ? updatedTask : item
        )
      );
    } catch (err) {
      setError("Could not update the task.");
    }
  }
const [editingTaskId, setEditingTaskId] = useState(null);
const [editTitle, setEditTitle] = useState("");
const [editDescription, setEditDescription] = useState("");

function startEditing(task) {
  setEditingTaskId(task.id);
  setEditTitle(task.title);
  setEditDescription(task.description || "");
}

function cancelEditing() {
  setEditingTaskId(null);
  setEditTitle("");
  setEditDescription("");
}

async function saveTask(id) {
  if (!editTitle.trim()) {
    setError("Task title cannot be empty.");
    return;
  }

  try {
    setError("");

    const response = await fetch(`${API_URL}${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDescription.trim(),
      }),
    });

    if (!response.ok) {
      throw new Error("Could not update task.");
    }

    const updatedTask = await response.json();

    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task
      )
    );

    cancelEditing();
  } catch (err) {
    setError("Could not save changes. Please try again.");
  }
}


  async function deleteTask(id) {
    try {
      setError("");

      const response = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete task.");
      }

      setTasks((previousTasks) =>
        previousTasks.filter((task) => task.id !== id)
      );
    } catch (err) {
      setError("Could not delete the task.");
    }
  }

  const completedCount = tasks.filter((task) => task.completed).length;

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
          <h1>TaskFlow</h1>
          <p className="subtitle">
            Organise your work. Make progress every day.
          </p>
        </div>

        <div className="task-summary">
          <span>{tasks.length} total</span>
          <span>{completedCount} completed</span>
        </div>
      </header>

      <section className="panel">
        <h2>Create a task</h2>

        <form onSubmit={addTask} className="task-form">
          <label htmlFor="title">Task title</label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What do you need to do?"
            maxLength={200}
            required
          />

          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add a few details..."
            rows={3}
          />

          <button type="submit">+ Add task</button>
        </form>
      </section>

      <section className="tasks-section">
        <div className="section-heading">
          <h2>Your tasks</h2>
          <span>{completedCount} of {tasks.length} done</span>
        </div>

        {error && <p className="error">{error}</p>}

        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <h3>No tasks yet</h3>
            <p>Create your first task above to get started.</p>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (

<article className="task-card"key={task.id}>
  {editingTaskId === task.id ? (
    <div className="edit-form">
      <label>
        Task title
        <input
          value={editTitle}
          onChange={(event) => setEditTitle(event.target.value)}
          maxLength={200}
          required
        />
      </label>

      <label>
        Description
        <textarea
          value={editDescription}
          onChange={(event) => setEditDescription(event.target.value)}
          rows={3}
        />
      </label>

      <div className="edit-actions">
        <button type="button" onClick={() => saveTask(task.id)}>
          Save changes
        </button>
        <button
          type="button"
          className="cancel-button"
          onClick={cancelEditing}
        >
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <>
      <label className="task-content">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => toggleTask(task)}
        />
        <div>
          <h3 className={task.completed ? "completed" : ""}>
            {task.title}
          </h3>
          {task.description && <p>{task.description}</p>}
        </div>
      </label>

      <div className="task-actions">
        <button
          className="edit-button"
          type="button"
          onClick={() => startEditing(task)}
        >
          Edit
        </button>
        <button
          className="delete-button"
          type="button"
          onClick={() => deleteTask(task.id)}
          aria-label={`Delete ${task.title}`}
        >
          Delete
        </button>
      </div>
    </>
  )}
</article>

            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
