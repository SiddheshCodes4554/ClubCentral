import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

const reportLinks = [
  { label: 'Club Performance Report (PDF)', endpoint: '/api/institution/report/club', description: 'Download per-club insights. Append club ID to the endpoint.' },
  { label: 'Finance Summary PDF', endpoint: '/api/institution/report/finance' },
  { label: 'Institution Events PDF', endpoint: '/api/institution/report/events' },
  { label: 'Member Summary CSV', endpoint: '/api/institution/report/members' },
  { label: 'Monthly Report ZIP', endpoint: '/api/institution/report/monthly' },
];

export default function InstitutionReportsPage() {
  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports & Exports</h1>
        <p className="text-sm text-muted-foreground">
          Export finance summaries, club performance PDFs, and cross-club analytics.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reportLinks.map((report) => (
            <div
              key={report.endpoint}
              className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {report.label}
                </p>
                {report.description && (
                  <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                )}
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleDownload(report.endpoint)}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

