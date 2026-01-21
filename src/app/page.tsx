import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold">Cureos Hospital Management System</h1>
        <p className="text-xl text-gray-600">
          Comprehensive healthcare management solution for modern hospitals
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/login"
            className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
          <Link 
            href="/admin"
            className="inline-flex items-center justify-center h-11 rounded-md px-8 border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}