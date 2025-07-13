import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (username, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          set({
            user: data.data.user,
            token: data.data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return data.data;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          throw error;
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
          }

          set({
            user: data.data.user,
            token: data.data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return data.data;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      updateProfile: async (updates) => {
        const { token } = get();
        
        if (!token) {
          throw new Error('No authentication token');
        }

        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('http://localhost:5000/api/auth/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updates),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Profile update failed');
          }

          set({
            user: data.data,
            isLoading: false,
            error: null,
          });

          return data.data;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          throw error;
        }
      },

      getProfile: async () => {
        const { token } = get();
        
        if (!token) {
          throw new Error('No authentication token');
        }

        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('http://localhost:5000/api/auth/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Failed to get profile');
          }

          set({
            user: data.data,
            isLoading: false,
            error: null,
          });

          return data.data;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore; 