import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Network, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      toast.success('Welcome to NetScope');
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 topology-grid opacity-30" />
      <div className="glass-panel rounded-2xl p-8 w-full max-w-sm fade-in-up relative z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Network className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">NetScope</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
          <Button type="submit" className="w-full">Sign In</Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground space-y-1">
          <p>Demo credentials:</p>
          <p className="font-mono">admin / admin &nbsp;•&nbsp; user / user</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
