import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './LoginForm';
import { useLoginPage } from './LoginPage.logic';

export function LoginPage() {
  const { form, onSubmit } = useLoginPage();

  return (
    <Card className="w-[360px]">
      <CardHeader className="items-center">
        <img src="/cattleyaresortlogo.png" alt="Cattleya Resort" className="h-20 object-contain mb-2" />
        <CardTitle>Cattleya Resort</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm form={form} onSubmit={onSubmit} />
      </CardContent>
    </Card>
  );
}
