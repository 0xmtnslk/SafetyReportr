import { useState, useEffect } from "react";

interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'user';
  location: string;
  locationId?: string;
  firstLogin: boolean;
  hospital?: {
    id: string;
    name: string;
    address: string;
    type: string;
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      // Fetch current user data from API to get latest info including hospital
      fetch('/api/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to fetch user data');
      })
      .then(userData => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      })
      .catch(error => {
        console.error("Error fetching user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });
    }

    setIsLoading(false);
  }, []);

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.reload();
  };

  return {
    user,
    isLoading,
    updateUser,
    logout,
  };
}
