import { useNavigate } from 'react-router-dom';
import { Stack, Text } from '@/components/ui/primitives';
import { ReserveForm } from '@/components/ReserveForm';

export function ReservePage() {
  const navigate = useNavigate();
  return (
    <Stack gap="s1">
      <Text as="h1" size="xxl" weight="bold">Reserve</Text>
      <ReserveForm onSuccess={(id) => navigate(`/booking/${id}`)} />
    </Stack>
  );
}
