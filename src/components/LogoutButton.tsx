'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

export function LogoutButton() {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to log out?')) return;

    setIsLoading(true);
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
    </button>
  );
}
