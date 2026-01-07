import { Suspense } from 'react';
import ConnectionsClient from './ConnectionsClient';

export default function ConnectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ConnectionsClient />
    </Suspense>
  );
}
