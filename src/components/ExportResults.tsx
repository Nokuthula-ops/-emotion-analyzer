import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, FileJson, FileImage } from 'lucide-react';
import jsPDF from 'jspdf';

interface SentimentResult {
  label: string;
  score: number;
}

interface AnalysisResult {
  sentiment: SentimentResult[];
  confidence: number;
  keywords: string[];
  text: string;
  timestamp: Date;
}

interface ExportResultsProps {
  results: AnalysisResult[];
  currentResult: AnalysisResult | null;
}

const ExportResults = ({ results, currentResult }: ExportResultsProps) => {
  const exportToCSV = () => {
    if (!currentResult && results.length === 0) return;
    
    const dataToExport = currentResult ? [currentResult] : results;
    
    const headers = ['Timestamp', 'Text', 'Primary Sentiment', 'Confidence', 'Positive %', 'Negative %', 'Neutral %', 'Keywords'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(result => [
        result.timestamp.toISOString(),
        `"${result.text.replace(/"/g, '""')}"`,
        result.sentiment[0].label,
        Math.round(result.confidence * 100) + '%',
        Math.round((result.sentiment.find(s => s.label === 'POSITIVE')?.score || 0) * 100) + '%',
        Math.round((result.sentiment.find(s => s.label === 'NEGATIVE')?.score || 0) * 100) + '%',
        Math.round((result.sentiment.find(s => s.label === 'NEUTRAL')?.score || 0) * 100) + '%',
        `"${result.keywords.join(', ')}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sentiment-analysis-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (!currentResult && results.length === 0) return;
    
    const dataToExport = currentResult ? [currentResult] : results;
    
    const jsonData = {
      exportDate: new Date().toISOString(),
      totalAnalyses: dataToExport.length,
      analyses: dataToExport.map(result => ({
        timestamp: result.timestamp.toISOString(),
        text: result.text,
        sentiment: result.sentiment,
        confidence: result.confidence,
        keywords: result.keywords,
        primarySentiment: result.sentiment[0].label,
        scores: {
          positive: Math.round((result.sentiment.find(s => s.label === 'POSITIVE')?.score || 0) * 100),
          negative: Math.round((result.sentiment.find(s => s.label === 'NEGATIVE')?.score || 0) * 100),
          neutral: Math.round((result.sentiment.find(s => s.label === 'NEUTRAL')?.score || 0) * 100)
        }
      }))
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sentiment-analysis-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!currentResult && results.length === 0) return;
    
    const dataToExport = currentResult ? [currentResult] : results;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Sentiment Analysis Report', 20, 30);
    
    // Date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Total Analyses: ${dataToExport.length}`, 20, 55);
    
    let yPosition = 75;
    
    dataToExport.forEach((result, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }
      
      // Analysis header
      doc.setFontSize(14);
      doc.text(`Analysis ${index + 1}`, 20, yPosition);
      yPosition += 10;
      
      // Timestamp
      doc.setFontSize(10);
      doc.text(`Date: ${result.timestamp.toLocaleString()}`, 20, yPosition);
      yPosition += 8;
      
      // Text (truncated if too long)
      const textLines = doc.splitTextToSize(`Text: ${result.text}`, 170);
      const maxLines = 3;
      const displayLines = textLines.slice(0, maxLines);
      if (textLines.length > maxLines) {
        displayLines[maxLines - 1] += '...';
      }
      doc.text(displayLines, 20, yPosition);
      yPosition += displayLines.length * 5 + 5;
      
      // Sentiment results
      doc.text(`Primary Sentiment: ${result.sentiment[0].label} (${Math.round(result.confidence * 100)}% confidence)`, 20, yPosition);
      yPosition += 8;
      
      // Scores
      result.sentiment.forEach(sentiment => {
        doc.text(`${sentiment.label}: ${Math.round(sentiment.score * 100)}%`, 30, yPosition);
        yPosition += 6;
      });
      
      // Keywords
      if (result.keywords.length > 0) {
        doc.text(`Keywords: ${result.keywords.join(', ')}`, 20, yPosition);
        yPosition += 8;
      }
      
      yPosition += 10; // Space between analyses
    });
    
    doc.save(`sentiment-analysis-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const hasData = currentResult || results.length > 0;

  return (
    <Card className="bg-gradient-card shadow-elegant border-0">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Export Results</span>
        </CardTitle>
        <CardDescription>
          Download your sentiment analysis results in various formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="flex items-center space-x-2 h-auto py-3"
            >
              <FileText className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">CSV</div>
                <div className="text-xs text-muted-foreground">Spreadsheet format</div>
              </div>
            </Button>
            
            <Button
              onClick={exportToJSON}
              variant="outline"
              className="flex items-center space-x-2 h-auto py-3"
            >
              <FileJson className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">JSON</div>
                <div className="text-xs text-muted-foreground">Structured data</div>
              </div>
            </Button>
            
            <Button
              onClick={exportToPDF}
              variant="outline"
              className="flex items-center space-x-2 h-auto py-3"
            >
              <FileImage className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">PDF</div>
                <div className="text-xs text-muted-foreground">Report format</div>
              </div>
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No analysis results to export</p>
            <p className="text-xs mt-1">Analyze some text first to enable export options</p>
          </div>
        )}
        
        {hasData && (
          <div className="mt-4 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            <p><strong>Export includes:</strong> Text content, sentiment scores, confidence levels, keywords, and timestamps</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExportResults;