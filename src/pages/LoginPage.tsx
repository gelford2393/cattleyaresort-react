import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Stack } from '@/components/ui/primitives';
import { FormError } from '@/components/FormError';
import { auth } from '@/lib/firebase';
import { loginSchema, type LoginInput } from '@/lib/form-schemas';

export function LoginPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError('');
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      navigate('/calendar');
    } catch (e: unknown) {
      const err = e as FirebaseError | Error;
      setSubmitError('code' in err && err.code ? `${err.code}: ${err.message}` : err.message);
    }
  });

  return (
    <Card className="w-[360px]">
      <CardHeader className="items-center">
        <img src="/cattleyaresortlogo.png" alt="Cattleya Resort" className="h-20 object-contain mb-2" />
        <CardTitle>Cattleya Resort</CardTitle>
      </CardHeader>
      <CardContent>
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
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
