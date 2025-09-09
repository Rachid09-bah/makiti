import axios from 'axios';
import { useUser } from '../store/user';
import { toast } from 'react-hot-toast';

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
	withCredentials: true,
});

api.interceptors.request.use((config) => {
	try {
		const token = useUser.getState().user?.token;
		if (token) {
			config.headers = config.headers ?? {};
			(config.headers as any).Authorization = `Bearer ${token}`;
		}
	} catch (error) {
		toast.error('Erreur lors de la récupération du token utilisateur.');
	}
	return config;
});

// Intercepteur de réponse pour gérer les erreurs 401
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response && error.response.status === 401) {
			toast.error('Session expirée ou accès non autorisé. Veuillez vous reconnecter.');
		}
		return Promise.reject(error);
	}
);
