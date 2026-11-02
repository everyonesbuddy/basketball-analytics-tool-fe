import axios from "axios";
import { getApiBaseUrl } from "../utils/dashboardApi";

// The personal OS API: same backend as the sports tools, under /os, signed in.
const KEY = "personal_os_token";

export const getToken = (): string => {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
};

export const setToken = (t: string) => {
  try {
    if (t) localStorage.setItem(KEY, t);
    else localStorage.removeItem(KEY);
  } catch {
    // storage blocked: the session lasts until the tab closes
  }
};

export const SIGNED_OUT = "personal-os:signed-out";

const os = axios.create({ baseURL: `${getApiBaseUrl()}/os`, timeout: 20000 });

os.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

os.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = String(err?.config?.url || "");
    if (err?.response?.status === 401 && !url.includes("/auth/login")) {
      setToken("");
      window.dispatchEvent(new Event(SIGNED_OUT));
    }
    return Promise.reject(err);
  },
);

/** The server's message, or a fallback. */
export const errorText = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
  return e?.response?.data?.error?.message || (e?.message === "Network Error" ? "Can't reach the server." : fallback);
};

export default os;
