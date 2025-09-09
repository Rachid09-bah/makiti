import { create } from 'zustand';

export interface AuthUser {
	id: string;
	name: string;
	email: string;
	role: 'admin' | 'vendor' | 'customer';
	token?: string;
	photoUrl?: string;
	phone?: string;
}

interface UserState {
	user?: AuthUser;
	login: (user: AuthUser) => void;
	logout: () => void;
}

const STORAGE_KEY = 'makiti_auth_user';

function loadInitialUser(): AuthUser | undefined {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as AuthUser) : undefined;
	} catch {
		return undefined;
	}
}

export const useUser = create<UserState>((set, get) => ({
	user: loadInitialUser(),
	login: (user) => {
		set({ user });
		try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
	},
	logout: () => {
		set({ user: undefined });
		try { localStorage.removeItem(STORAGE_KEY); } catch {}
	},
}));
