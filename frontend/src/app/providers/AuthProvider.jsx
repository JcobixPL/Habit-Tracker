import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { api, clearToken, getToken, setToken } from "../../api.js";

const AuthContext = createContext(null);

const initialState = {
  token: "",
  status: "idle" // idle | authed | guest
};

function reducer(state, action) {
  switch (action.type) {
    case "RESTORE":
      return action.token ? { token: action.token, status: "authed" } : { token: "", status: "guest" };
    case "SET_TOKEN":
      return { token: action.token, status: "authed" };
    case "LOGOUT":
      return { token: "", status: "guest" };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: "RESTORE", token: getToken() });
  }, []);

  const actions = useMemo(() => {
    return {
      async login(email, password) {
        const { token } = await api.login(email, password);
        setToken(token);
        dispatch({ type: "SET_TOKEN", token });
        return token;
      },
      async register(email, password) {
        await api.register(email, password);
        const { token } = await api.login(email, password);
        setToken(token);
        dispatch({ type: "SET_TOKEN", token });
        return token;
      },
      logout() {
        clearToken();
        dispatch({ type: "LOGOUT" });
      }
    };
  }, []);

  const value = useMemo(() => ({ ...state, ...actions, isAuthed: !!state.token }), [state, actions]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
