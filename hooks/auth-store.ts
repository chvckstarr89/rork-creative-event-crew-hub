import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, AuthState, LoginCredentials, SignupData } from '@/types/user';
import { trpcClient } from '@/lib/trpc';

const STORAGE_KEY = 'user_auth';



export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const userData = JSON.parse(stored);
          return {
            ...userData,
            lastSeen: new Date(userData.lastSeen),
            createdAt: new Date(userData.createdAt || Date.now()),
            updatedAt: new Date(userData.updatedAt || Date.now())
          };
        }
        return null;
      } catch (error) {
        console.error('Error loading auth data:', error);
        return null;
      }
    },
    staleTime: Infinity
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const user = await trpcClient.users.login.mutate(credentials);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return {
        ...user,
        lastSeen: new Date(user.lastSeen),
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      };
    },
    onSuccess: (user) => {
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      });
      queryClient.setQueryData(['auth'], user);
    },
    onError: (error) => {
      console.error('Login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  });

  const signupMutation = useMutation({
    mutationFn: async (signupData: SignupData) => {
      const user = await trpcClient.users.create.mutate(signupData);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return {
        ...user,
        lastSeen: new Date(user.lastSeen),
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      };
    },
    onSuccess: (user) => {
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      });
      queryClient.setQueryData(['auth'], user);
    },
    onError: (error) => {
      console.error('Signup error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(STORAGE_KEY);
    },
    onSuccess: () => {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      queryClient.setQueryData(['auth'], null);
      queryClient.clear();
    }
  });

  useEffect(() => {
    if (authQuery.data !== undefined) {
      setAuthState({
        user: authQuery.data,
        isAuthenticated: !!authQuery.data,
        isLoading: false
      });
    }
  }, [authQuery.data]);

  const login = useCallback((credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    loginMutation.mutate(credentials);
  }, [loginMutation.mutate]);

  const signup = useCallback((signupData: SignupData) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    signupMutation.mutate(signupData);
  }, [signupMutation.mutate]);

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation.mutate]);

  const quickLogin = useCallback(async (user: User) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      });
      queryClient.setQueryData(['auth'], user);
    } catch (error) {
      console.error('Quick login error:', error);
    }
  }, [queryClient]);

  return useMemo(() => ({
    ...authState,
    login,
    signup,
    logout,
    quickLogin,
    loginError: loginMutation.error?.message,
    signupError: signupMutation.error?.message,
    isLoginLoading: loginMutation.isPending,
    isSignupLoading: signupMutation.isPending
  }), [authState, login, signup, logout, quickLogin, loginMutation.error?.message, signupMutation.error?.message, loginMutation.isPending, signupMutation.isPending]);
});