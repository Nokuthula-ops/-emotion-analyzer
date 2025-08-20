import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Brain, TrendingUp, MessageSquare, BarChart3, Upload, FileText } from 'lucide-react';
import SentimentExplanation from './SentimentExplanation';
import ExportResults from './ExportResults';

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

const COLORS = {
  POSITIVE: 'hsl(var(--positive))',
  NEGATIVE: 'hsl(var(--negative))',
  NEUTRAL: 'hsl(var(--neutral))'
};

const SentimentDashboard = () => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rule-based sentiment analysis - will be replaced with Hugging Face integration
  const analyzeSentiment = async (inputText: string): Promise<AnalysisResult> => {
    setIsAnalyzing(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple rule-based sentiment analysis
    const text = inputText.toLowerCase();
    
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'perfect', 'best', 'awesome', 'brilliant', 'outstanding', 'superb'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'disappointing', 'poor', 'sad', 'angry', 'disgusting', 'pathetic', 'useless', 'annoying', 'frustrated'];
    const neutralWords = ['okay', 'fine', 'average', 'normal', 'standard', 'typical', 'regular', 'moderate'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;
    
    // Count sentiment words
    positiveWords.forEach(word => {
      const matches = (text.match(new RegExp(word, 'g')) || []).length;
      positiveScore += matches;
    });
    
    negativeWords.forEach(word => {
      const matches = (text.match(new RegExp(word, 'g')) || []).length;
      negativeScore += matches;
    });
    
    neutralWords.forEach(word => {
      const matches = (text.match(new RegExp(word, 'g')) || []).length;
      neutralScore += matches;
    });
    
    // Check for strong negative phrases
    const strongNegativePhrases = ['no one should', 'never again', 'waste of money', 'completely disappointed'];
    strongNegativePhrases.forEach(phrase => {
      if (text.includes(phrase)) {
        negativeScore += 3; // Strong negative weight
      }
    });
    
    // Check for exclamation marks (often emotional)
    const exclamations = (text.match(/!/g) || []).length;
    if (exclamations > 0) {
      if (negativeScore > positiveScore) {
        negativeScore += exclamations * 0.5;
      } else if (positiveScore > negativeScore) {
        positiveScore += exclamations * 0.5;
      }
    }
    
    // Set base scores if no sentiment words found
    if (positiveScore === 0 && negativeScore === 0 && neutralScore === 0) {
      neutralScore = 1;
    }
    
    // Create sentiment array
    const sentiment: SentimentResult[] = [
      { label: 'POSITIVE', score: positiveScore },
      { label: 'NEGATIVE', score: negativeScore },
      { label: 'NEUTRAL', score: neutralScore === 0 ? 0.1 : neutralScore }
    ];

    // Normalize scores
    const total = sentiment.reduce((sum, item) => sum + item.score, 0);
    sentiment.forEach(item => item.score = item.score / total);
    
    // Sort by score
    sentiment.sort((a, b) => b.score - a.score);

    const result: AnalysisResult = {
      sentiment,
      confidence: sentiment[0].score,
      keywords: extractKeywords(inputText),
      text: inputText,
      timestamp: new Date()
    };

    setIsAnalyzing(false);
    return result;
  };

  const handleNewAnalysis = () => {
    setText('');
    setCurrentResult(null);
    setResults([]);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('text/') && !file.name.endsWith('.txt')) {
      alert('Please select a text file (.txt)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const extractKeywords = (text: string): string[] => {
    // Simple keyword extraction - replace with more sophisticated NLP
    const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 3);
    const commonWords = ['that', 'this', 'with', 'have', 'will', 'been', 'they', 'there', 'their', 'would', 'could', 'should'];
    return words.filter(word => !commonWords.includes(word)).slice(0, 5);
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    const result = await analyzeSentiment(text);
    setCurrentResult(result);
    setResults(prev => [result, ...prev.slice(0, 9)]);
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'POSITIVE': return COLORS.POSITIVE;
      case 'NEGATIVE': return COLORS.NEGATIVE;
      case 'NEUTRAL': return COLORS.NEUTRAL;
      default: return COLORS.NEUTRAL;
    }
  };

  const getSentimentBadgeVariant = (label: string) => {
    switch (label) {
      case 'POSITIVE': return 'positive';
      case 'NEGATIVE': return 'negative';
      case 'NEUTRAL': return 'neutral';
      default: return 'secondary';
    }
  };

  const pieData = currentResult?.sentiment.map(item => ({
    name: item.label,
    value: Math.round(item.score * 100),
    color: getSentimentColor(item.label)
  })) || [];

  const barData = results.slice(0, 5).map((result, index) => ({
    name: `Text ${results.length - index}`,
    positive: Math.round((result.sentiment.find(s => s.label === 'POSITIVE')?.score || 0) * 100),
    negative: Math.round((result.sentiment.find(s => s.label === 'NEGATIVE')?.score || 0) * 100),
    neutral: Math.round((result.sentiment.find(s => s.label === 'NEUTRAL')?.score || 0) * 100)
  })).reverse();

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 rounded-lg bg-gradient-primary shadow-glow">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Sentiment Analysis Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Analyze the emotional tone of your text with advanced AI-powered sentiment detection
          </p>
        </div>

        {/* Input Section */}
        <Card className="bg-gradient-card shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Text Analysis</span>
            </CardTitle>
            <CardDescription>
              Enter text to analyze its sentiment, confidence, and key emotional drivers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fileName && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <FileText className="h-4 w-4" />
                <span>Loaded file: {fileName}</span>
              </div>
            )}
            
            <div className="space-y-3">
              <Textarea
                placeholder="Enter your text here for sentiment analysis or upload a text file..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[120px] resize-none border-2 focus:border-primary transition-smooth"
              />
              
              <div className="flex items-center justify-center">
                <span className="text-sm text-muted-foreground">or</span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleUploadClick}
                className="w-full border-dashed border-2 hover:border-primary transition-smooth"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Text File
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleAnalyze}
                disabled={!text.trim() || isAnalyzing}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze Sentiment
                  </>
                )}
              </Button>
              
              {currentResult && (
                <Button 
                  onClick={handleNewAnalysis}
                  variant="outline"
                  size="lg"
                  className="px-6"
                >
                  New Analysis
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {currentResult && (
          <div className="space-y-6">
            {/* Main Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sentiment Breakdown */}
              <Card className="bg-gradient-card shadow-elegant border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Sentiment Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentResult.sentiment.map((item, index) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={getSentimentBadgeVariant(item.label)} className="capitalize">
                            {item.label.toLowerCase()}
                          </Badge>
                          <span className="font-semibold">{Math.round(item.score * 100)}%</span>
                        </div>
                        <Progress 
                          value={item.score * 100} 
                          className="h-2"
                          style={{
                            '--progress-background': getSentimentColor(item.label)
                          } as React.CSSProperties}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 text-center">
                    <div className="text-sm text-muted-foreground mb-2">Overall Confidence</div>
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(currentResult.confidence * 100)}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visualization */}
              <Card className="bg-gradient-card shadow-elegant border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Visual Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Confidence']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Keywords */}
              <Card className="bg-gradient-card shadow-elegant border-0">
                <CardHeader>
                  <CardTitle>Key Terms</CardTitle>
                  <CardDescription>Words that likely influence the sentiment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {currentResult.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="capitalize">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comparison Chart */}
              {results.length > 1 && (
                <Card className="bg-gradient-card shadow-elegant border-0">
                  <CardHeader>
                    <CardTitle>Recent Analysis Comparison</CardTitle>
                    <CardDescription>Compare sentiment across your recent analyses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="positive" fill={COLORS.POSITIVE} />
                        <Bar dataKey="negative" fill={COLORS.NEGATIVE} />
                        <Bar dataKey="neutral" fill={COLORS.NEUTRAL} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Explanation Section */}
            <SentimentExplanation result={currentResult} />

            {/* Export Section */}
            <ExportResults results={results} currentResult={currentResult} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SentimentDashboard;