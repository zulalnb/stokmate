export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
};

type SessionState = {
  accessToken: string | null;
  expiresAt: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

let state: SessionState = {
  accessToken: null,
  expiresAt: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const listeners = new Set<() => void>();

function setState(partial: Partial<SessionState>) {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

export const sessionStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },
  setSession(accessToken: string, user: AuthUser, expiresAt: string) {
    setState({ accessToken, expiresAt, user, isAuthenticated: true, isLoading: false });
  },
  clearSession() {
    setState({
      accessToken: null,
      expiresAt: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
};
