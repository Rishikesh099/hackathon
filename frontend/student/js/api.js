const BASE_URL = "http://localhost:3000/api";

// Utility function to make authenticated requests to backend
async function apiFetch(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("jwt_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return await response.json();
}
