import { useState, useEffect } from "react"
import { getReportsList } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Calendar, Tag } from "lucide-react"

export function Reports() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReportsList()
      .then(res => {
        setReports(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const handleDownload = (fileUrl: string) => {
    const backendBase = import.meta.env.VITE_API_URL || "http://localhost:8000"
    // fileUrl is e.g. "/api/reports/download/1"
    window.open(`${backendBase}${fileUrl}`, "_blank")
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Generated Reports</h2>
        <p className="text-muted-foreground mt-2">Browse and download PDF summaries of demand forecasts and inventory optimizations.</p>
      </div>

      <Card className="shadow-lg border-muted/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Report Export Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-8">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No reports have been generated yet. Go to the Forecasting Wizard to ingest a dataset.
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div 
                  key={report.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl bg-card/50 hover:bg-card/80 transition-colors shadow-sm gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-sm text-foreground">{report.name}</h4>
                      <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          {report.report_type} ({report.format})
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownload(report.file_url)}
                    className="w-full sm:w-auto flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
