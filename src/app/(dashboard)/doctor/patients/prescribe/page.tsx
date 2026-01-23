'use client';

import { useEffect, useState } from 'react';

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">/ (dashboard) / doctor / patients / prescribe</h1>
        <p className="text-gray-600">Page content under development</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Content coming soon...</p>
      </div>
    </div>
  );
}
