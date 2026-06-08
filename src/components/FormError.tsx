import { Text } from '@/components/ui/primitives';

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text as="span" size="small" color="destructive" className="mt-1">
      {message}
    </Text>
  );
}
