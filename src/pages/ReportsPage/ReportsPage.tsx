import { Stack, Text } from '@/components/ui/primitives';

export function ReportsPage() {
  // URL copied from nuxt-cattleyaresort/pages/reports/index.vue
  const reportUrl = "https://lookerstudio.google.com/embed/reporting/1t1ZnTXmEWZbT8vAjnRpkrbSEjCiy8iqc/page/84DW";

  return (
    <Stack gap="s0">
      <Text as="h1" size="xxl" weight="bold">Reports</Text>
      <iframe
        src={reportUrl}
        className="w-full border-0 rounded-lg"
        style={{ height: '80vh' }}
        title="Reports Dashboard"
      />
    </Stack>
  );
}
