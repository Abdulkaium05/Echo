// src/hooks/use-auth.ts
import { useContext } from 'react';
// Correct the path if necessary based on where you placed AuthContext
import { AuthContext } from '@/context/auth-context';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
