import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { auth, functions } from '@/lib/firebase';
import { PinInput } from '@/components/PinInput';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [step, setStep] = useState<'login' | 'setup' | 'verify'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const generateSecret = httpsCallable<object, { qrCode: string }>(functions, 'generateSecret');
      const result = await generateSecret({});
      if (result.data.qrCode) { setQrCode(result.data.qrCode); setStep('setup'); }
      else { setStep('verify'); }
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  };

  const handleVerify = async (pin: string) => {
    setLoading(true); setError('');
    try {
      const verifyTotpCode = httpsCallable<{ token: string }, { verified: boolean }>(functions, 'verifyTotpCode');
      const result = await verifyTotpCode({ token: pin });
      if (result.data.verified) navigate('/calendar-view');
      else setError('Invalid code. Try again.');
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  };

  return (
    <Card className="w-[360px]">
      <CardHeader className="items-center">
        <img src="/cattleyaresortlogo.png" alt="Cattleya Resort" className="h-20 object-contain mb-2" />
        <CardTitle>Cattleya Resort</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {step === 'login' && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
            </Button>
          </>
        )}

        {step === 'setup' && (
          <>
            <p className="text-sm text-center text-muted-foreground">Scan this QR code with your authenticator app</p>
            <img src={qrCode} alt="QR Code" className="w-full" />
            <p className="text-sm text-center text-muted-foreground">Then enter the 6-digit code:</p>
            <div className="flex justify-center">
              <PinInput onComplete={handleVerify} />
            </div>
          </>
        )}

        {step === 'verify' && (
          <>
            <p className="text-sm text-center text-muted-foreground">Enter your 6-digit authenticator code</p>
            <div className="flex justify-center">
              <PinInput onComplete={handleVerify} />
            </div>
          </>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
