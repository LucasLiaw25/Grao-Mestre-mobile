import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type { UserResponseDTO, AuthResponseDTO, UserLoginRequestDTO, UserRegisterRequestDTO } from "../types"; 
import { Platform } from "react-native";

const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8081/api' : 'http://localhost:8081/api';


interface AuthContextType {
  user: UserResponseDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: UserLoginRequestDTO) => Promise<void>;
  register: (data: UserRegisterRequestDTO) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("grao_user");
        const token = await AsyncStorage.getItem("grao_token");
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to load user from storage", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

  }, []);

  const login = async (data: UserLoginRequestDTO) => {
    const res = await axios.post<AuthResponseDTO>(`${API_BASE_URL}/users/login`, data);
    await AsyncStorage.setItem("grao_token", res.data.token);
    await AsyncStorage.setItem("grao_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
  };

  const register = async (data: UserRegisterRequestDTO) => {
    await axios.post(`${API_BASE_URL}/users/register`, data);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("grao_token");
    await AsyncStorage.removeItem("grao_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}