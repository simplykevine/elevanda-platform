'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../SharedComponents/ui/Input';
import Button from '../../SharedComponents/ui/Button';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

type Role = 'student' | 'parent';

interface FormState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState<FormState>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'parent',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.first_name) e.first_name = 'First name is required.';
    if (!form.last_name) e.last_name = 'Last name is required.';
    if (!form.email) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
      });
    } catch (err) {
      const axiosErr = err as AxiosError<Record<string, string[]>>;
      const data = axiosErr.response?.data;
      if (data) {
        const fieldErrors: Partial<Record<keyof FormState, string>> = {};
        for (const key in data) {
          if (Array.isArray(data[key])) {
            fieldErrors[key as keyof FormState] = data[key][0];
          }
        }
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          return;
        }
      }
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-900 p-12 text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
              <span className="text-base font-bold text-slate-900">E</span>
            </div>
            <span className="text-xl font-semibold">Elevanda</span>
          </div>
        </div>
        <div>
          <blockquote className="text-2xl font-medium leading-relaxed text-slate-100">
            Register to access your child's academic records, fee statements, and more.
          </blockquote>
          <p className="mt-4 text-slate-400">
            After registration, an administrator will verify your device before you can log in.
          </p>
        </div>
        <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Elevanda. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900">Create an account</h1>
            <p className="mt-1 text-sm text-slate-500">
              Fill in your details to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                placeholder="John"
                value={form.first_name}
                onChange={set('first_name')}
                error={errors.first_name}
              />
              <Input
                label="Last name"
                placeholder="Doe"
                value={form.last_name}
                onChange={set('last_name')}
                error={errors.last_name}
              />
            </div>

            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
            />

            <Input
              label="Phone number"
              type="tel"
              placeholder="+254 7XX XXX XXX"
              value={form.phone}
              onChange={set('phone')}
              hint="Optional"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Account type</label>
              <select
                value={form.role}
                onChange={set('role')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option value="parent">Parent</option>
                <option value="student">Student</option>
              </select>
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
            />

            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              error={errors.confirmPassword}
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-slate-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}