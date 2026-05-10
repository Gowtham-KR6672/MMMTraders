import { redirect } from 'next/navigation';

// Root page: always redirect to login
// The login page handles sending users to /dashboard or /portal based on their role
export default function Home() {
  redirect('/login');
}
