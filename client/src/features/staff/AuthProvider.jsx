import { useEffect, useState } from "react";
import { getMe, login as loginRequest } from "../../api/auth.js";
import { AuthContext } from "./authContext.js";

const TOKEN_KEY = "hostess_token";

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);

  // A token with no user yet means we're still checking it with the server.
  const loading = Boolean(token) && !user;

  // On page load, ask the server who the stored token belongs to.
  useEffect(() => {
    if (!token || user) return;
    let cancelled = false;
    getMe(token)
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token, user]);

  async function login(email, password) {
    const data = await loginRequest(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
