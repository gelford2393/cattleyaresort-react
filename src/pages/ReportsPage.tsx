export function ReportsPage() {
  // URL copied from nuxt-cattleyaresort/pages/reports/index.vue
  const reportUrl = "https://datastudio.google.com/embed/reporting/1t1ZnTXmEWZbT8vAjnRpkrbSEjCiy8iqc/page/84DW";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <iframe
        src={reportUrl}
        className="w-full border-0 rounded-lg"
        style={{ height: '80vh' }}
        title="Reports Dashboard"
      />
    </div>
  );
}
