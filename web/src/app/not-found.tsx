import Link from 'next/link';
import { Button } from '@/components/Button';
import {
  LABEL_BACK_TO_DASHBOARD,
  MSG_PAGE_NOT_FOUND,
  MSG_PAGE_NOT_FOUND_DESC,
} from '@/lib/messages';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-gray-700 mb-4">404</div>
        <h2 className="text-2xl font-bold text-white mb-2">{MSG_PAGE_NOT_FOUND}</h2>
        <p className="text-gray-400 mb-6">{MSG_PAGE_NOT_FOUND_DESC}</p>
        <Link href="/">
          <Button>{LABEL_BACK_TO_DASHBOARD}</Button>
        </Link>
      </div>
    </div>
  );
}
