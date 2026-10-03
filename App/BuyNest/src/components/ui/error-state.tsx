import { EmptyState } from '@/components/ui/empty-state';
import type { IconName } from '@/components/ui/icon';
import type { ApiError } from '@/services/api/api-error';

type ErrorStateProps = {
  error: ApiError;
  onRetry: () => void;
};

function describe(error: ApiError): { icon: IconName; title: string } {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return { icon: 'offline', title: 'No connection' };
    case 'TIMEOUT':
      return { icon: 'offline', title: 'This is taking too long' };
    default:
      return { icon: 'info', title: 'Something went wrong' };
  }
}

/** Full-screen failure for a server-driven screen, always with a way to try again. */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const { icon, title } = describe(error);

  return (
    <EmptyState
      icon={icon}
      title={title}
      message={error.message}
      actionLabel="Try again"
      onAction={onRetry}
    />
  );
}
