import { Spinner } from '@/components/Spinner';
import { MSG_LOADING } from '@/lib/messages';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-400">{MSG_LOADING}</p>
      </div>
    </div>
  );
}
