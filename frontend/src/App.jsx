import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;
const AUTH_URL = import.meta.env.VITE_AUTH_URL;

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split("; ") : [];

  for (const cookie of cookies) {
    const [key, ...value] = cookie.split("=");

    if (key === name) {
      return decodeURIComponent(value.join("="));
    }
  }

  return null;
}

async function prepareCsrf() {
  await fetch(`${AUTH_URL}csrf/`, {
    method: "GET",
    credentials: "include",
  });

  return getCookie("csrftoken");
}

async function apiRequest(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = {
    ...(options.headers || {}),
  };

  if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    const csrfToken = await prepareCsrf();

    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }
  }

  return fetch(url, {
    ...options,
    method,
    headers,
    credentials: "include",
  });
}

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("tasks");
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Check whether the browser already has an authenticated session.
  useEffect(() => {
    async function checkSession() {
      try {
        await prepareCsrf();

        const response = await fetch(`${AUTH_URL}me/`, {
          credentials: "include",
        });

        if (response.ok) {
          const currentUser = await response.json();
          setUser(currentUser.user || currentUser);
        }
      } catch (err) {
        console.error("Could not check authentication:", err);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkSession();
  }, []);

  // Load tasks only after the user is authenticated.
  useEffect(() => {
    if (user) {
      fetchTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user]);

  async function fetchTasks() {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest(API_URL);

      if (!response.ok) {
        throw new Error("Could not load tasks.");
      }

      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error("Fetch tasks error:", err);
      setError("Unable to load tasks. Check that Django is running.");
    } finally {
      setLoading(false);
    }
  }

  // Login and registration.
  async function handleAuthSubmit(event) {
    event.preventDefault();

    setAuthError("");
    setAuthMessage("");
    setAuthLoading(true);

    try {
      if (authMode === "register") {
        const response = await apiRequest(`${AUTH_URL}register/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const message =
            data.username?.[0] ||
            data.email?.[0] ||
            data.password?.[0] ||
            data.detail ||
            "Registration failed.";

          throw new Error(
            typeof message === "string" ? message : "Registration failed."
          );
        }

        setAuthMessage("Registration successful. You can now log in.");
        setAuthMode("login");
        setPassword("");
        setShowRegisterPassword(false);
      } else {
        const response = await apiRequest(`${AUTH_URL}login/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Login failed. Check your details."
          );
        }

        const authenticatedUser = data.user || data;

        if (!authenticatedUser || !authenticatedUser.username) {
          throw new Error(
            "Login succeeded, but the user response was unexpected."
          );
        }

        setUser(authenticatedUser);
        setActiveView("tasks");
        setPassword("");
        setShowLoginPassword(false);
        setAuthMessage("");
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setAuthError(err.message || "Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  // Logout.
  async function handleLogout() {
    try {
      setError("");

      const response = await apiRequest(`${AUTH_URL}logout/`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      setUser(null);
      setActiveView("tasks");
      setTasks([]);
      setAuthMode("login");
      setAuthMessage("You have been logged out.");
      setAuthError("");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Could not log out. Please try again.");
    }
  }

  // Create task.
  async function addTask(event) {
    event.preventDefault();

    if (!title.trim()) return;

    try {
      setError("");

      const response = await apiRequest(API_URL, {
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
      console.error("Create task error:", err);
      setError("Could not create the task. Check that Django is running.");
    }
  }

  // Complete or uncomplete a task.
  async function toggleTask(task) {
    try {
      setError("");

      const response = await apiRequest(`${API_URL}${task.id}/`, {
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
      console.error("Toggle task error:", err);
      setError("Could not update the task.");
    }
  }

  // Start editing a task.
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

  // Save task changes.
  async function saveTask(id) {
    if (!editTitle.trim()) {
      setError("Task title cannot be empty.");
      return;
    }

    try {
      setError("");

      const response = await apiRequest(`${API_URL}${id}/`, {
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
      console.error("Save task error:", err);
      setError("Could not save changes. Please try again.");
    }
  }

  // Delete task.
  async function deleteTask(id) {
    try {
      setError("");

      const response = await apiRequest(`${API_URL}${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete task.");
      }

      setTasks((previousTasks) =>
        previousTasks.filter((task) => task.id !== id)
      );
    } catch (err) {
      console.error("Delete task error:", err);
      setError("Could not delete the task.");
    }
  }

  const completedCount = tasks.filter((task) => task.completed).length;
  const remainingCount = tasks.length - completedCount;

  // Show session checking screen.
  if (checkingAuth) {
    return (
      <main className="app">
        <p>Checking your session...</p>
      </main>
    );
  }

  // Login and registration screen.
  if (!user) {
    return (
      <main className="app auth-page">
        <section className="panel auth-panel">
          <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>

          <h1>TaskFlow</h1>

          <p className="subtitle">
            Organise your work. Make progress every day.
          </p>

          <div className="auth-switch">
            <button
              type="button"
              className={authMode === "login" ? "active" : ""}
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
                setAuthMessage("");
              }}
            >
              Login
            </button>

            <button
              type="button"
              className={authMode === "register" ? "active" : ""}
              onClick={() => {
                setAuthMode("register");
                setAuthError("");
                setAuthMessage("");
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="task-form">
            <label htmlFor="username">Username or Email</label>

            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username or email"
              autoComplete="username"
              required
            />

            {authMode === "register" && (
              <>
                <label htmlFor="email">Email</label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </>
            )}

            <label htmlFor="password">Password</label>

            <div className="password-input-wrapper">
              <input
                id="password"
                type={
                  authMode === "login"
                    ? showLoginPassword
                      ? "text"
                      : "password"
                    : showRegisterPassword
                      ? "text"
                      : "password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  authMode === "login"
                    ? "Enter your password"
                    : "Create a password"
                }
                autoComplete={
                  authMode === "login"
                    ? "current-password"
                    : "new-password"
                }
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => {
                  if (authMode === "login") {
                    setShowLoginPassword((previous) => !previous);
                  } else {
                    setShowRegisterPassword((previous) => !previous);
                  }
                }}
                aria-label={
                  authMode === "login"
                    ? showLoginPassword
                      ? "Hide password"
                      : "Show password"
                    : showRegisterPassword
                      ? "Hide password"
                      : "Show password"
                }
              >
                {authMode === "login"
                  ? showLoginPassword
                    ? "Hide"
                    : "Show"
                  : showRegisterPassword
                    ? "Hide"
                    : "Show"}
              </button>
            </div>

            {authError && <p className="error">{authError}</p>}
            {authMessage && <p>{authMessage}</p>}

            <button type="submit" disabled={authLoading}>
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                  ? "Login"
                  : "Create account"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  // Authenticated dashboard.
  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>

          <h1>TaskFlow</h1>

          <p className="subtitle">
            Organise your work. Make progress every day.
          </p>

          <p>Welcome, {user.username}!</p>
        </div>

        <div className="task-summary">
          <span>{tasks.length} total</span>
          <span>{completedCount} completed</span>

          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Dashboard navigation */}
      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <button
          type="button"
          className={activeView === "tasks" ? "active" : ""}
          onClick={() => setActiveView("tasks")}
        >
          My Tasks
        </button>

        <button
          type="button"
          className={activeView === "profile" ? "active" : ""}
          onClick={() => setActiveView("profile")}
        >
          My Profile
        </button>
      </nav>

      {/* Profile dashboard */}
      {activeView === "profile" ? (
        <section className="panel profile-panel">
          <div className="profile-heading">
            <div className="profile-avatar" aria-hidden="true">
              {(user.username || "U").charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="eyebrow">ACCOUNT DETAILS</p>

              <h2>My Profile</h2>

              <p className="profile-subtitle">
                Your personal account information.
              </p>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-detail">
              <span>Username</span>

              <strong>
                {user.username || "Not available"}
              </strong>
            </div>

            <div className="profile-detail">
              <span>Email address</span>

              <strong>
                {user.email || "No email address added"}
              </strong>
            </div>

            <div className="profile-detail">
              <span>User ID</span>

              <strong>
                {user.id ?? "Not available"}
              </strong>
            </div>
          </div>

          <div className="profile-summary">
            <div>
              <span className="profile-summary-number">
                {tasks.length}
              </span>

              <span className="profile-summary-label">
                Total tasks
              </span>
            </div>

            <div>
              <span className="profile-summary-number">
                {completedCount}
              </span>

              <span className="profile-summary-label">
                Completed
              </span>
            </div>

            <div>
              <span className="profile-summary-number">
                {remainingCount}
              </span>

              <span className="profile-summary-label">
                Remaining
              </span>
            </div>
          </div>

          <p className="profile-note">
            You are signed in to your TaskFlow account.
          </p>
        </section>
      ) : (
        <>
          {/* Create task */}
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

              <label htmlFor="description">
                Description (optional)
              </label>

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

          {/* Task list */}
          <section className="tasks-section">
            <div className="section-heading">
              <h2>Your tasks</h2>

              <span>
                {completedCount} of {tasks.length} done
              </span>
            </div>

            {error && <p className="error">{error}</p>}

            {loading ? (
              <p>Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <h3>No tasks yet</h3>

                <p>
                  Create your first task above to get started.
                </p>
              </div>
            ) : (
              <div className="task-list">
                {tasks.map((task) => (
                  <article className="task-card" key={task.id}>
                    {editingTaskId === task.id ? (
                      <div className="edit-form">
                        <label>
                          Task title

                          <input
                            value={editTitle}
                            onChange={(event) =>
                              setEditTitle(event.target.value)
                            }
                            maxLength={200}
                            required
                          />
                        </label>

                        <label>
                          Description

                          <textarea
                            value={editDescription}
                            onChange={(event) =>
                              setEditDescription(event.target.value)
                            }
                            rows={3}
                          />
                        </label>

                        <div className="edit-actions">
                          <button
                            type="button"
                            onClick={() => saveTask(task.id)}
                          >
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
                            <h3
                              className={
                                task.completed ? "completed" : ""
                              }
                            >
                              {task.title}
                            </h3>

                            {task.description && (
                              <p>{task.description}</p>
                            )}
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
        </>
      )}
    </main>
  );
}

export default App;