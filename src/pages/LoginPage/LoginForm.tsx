import { type UseFormReturn } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stack } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import type { LoginInput } from '@/lib/form-schemas';

interface Props {
  form: UseFormReturn<LoginInput>;
  onSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({ form, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit}>
      <Stack gap="s0">
        <Stack gap="s-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" {...form.register('email')} />
          <FormError message={form.formState.errors.email?.message} />
        </Stack>
        <Stack gap="s-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...form.register('password')} />
          <FormError message={form.formState.errors.password?.message} />
        </Stack>
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
        </Button>
      </Stack>
    </form>
  );
}
