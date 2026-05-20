"use client";

import { useEffect, useState, useCallback } from "react";

interface User {
  id: string;
  email: string | null;
  username: string | null;
  name: string | null;
  image: string | null;
  selectedCharacterId: string | null;
  selectedCharacter: {
    id: string;
    name: string;
    subtitle: string;
    avatarUrl: string;
  } | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [enriching, setEnriching] = useState(true);

  const enrichUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setEnriching(false);
    }
  }, []);

  useEffect(() => {
    setEnriching(true);
    enrichUser();
  }, [enrichUser]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    await enrichUser();
    window.location.href = "/chat";
  };

  return { user, loading: enriching, logout, refreshUser: enrichUser };
}
