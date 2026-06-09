import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { loginSchema, type LoginInput } from '@/lib/form-schemas';

export function useLoginPage() {
  const navigate = useNavigate();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      navigate('/calendar');
    } catch (e: unknown) {
      const err = e as FirebaseError | Error;
      const message = 'code' in err && err.code ? `${err.code}: ${err.message}` : err.message;
      toast.error(message);
    }
  });

  return { form, onSubmit };
}
