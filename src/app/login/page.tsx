'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // Default ON
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password, rememberMe });
      toast.success('Login successful');
      if (res.data.user?.role === 'customer') {
        router.push('/portal');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FFF9F5]">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="h-20 w-20 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden p-2 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="MMM Traders" className="w-full h-full object-contain" />
          </div>
        </div>

        <Card className="border-slate-100 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.1)] rounded-3xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">MMM Traders</CardTitle>
            <CardDescription className="text-slate-500">Sign in to access your account</CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">Email or Phone Number</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="email@example.com or 9876543210"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>

              {/* Remember Me */}
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-all duration-200 ${rememberMe ? 'bg-orange-500' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${rememberMe ? 'left-5' : 'left-1'}`} />
                  </div>
                </div>
                <span className="text-sm text-slate-600">
                  Keep me signed in for <span className="font-semibold text-slate-800">90 days</span>
                </span>
              </label>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)] transition-all"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
