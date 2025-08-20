import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, AlertCircle } from 'lucide-react';

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

interface SentimentExplanationProps {
  result: AnalysisResult;
}

const SentimentExplanation = ({ result }: SentimentExplanationProps) => {
  const analyzeTextFeatures = (text: string) => {
    const features = [];
    const lowerText = text.toLowerCase();
    
    // Positive indicators
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'perfect', 'best', 'awesome', 'brilliant', 'outstanding', 'superb'];
    const foundPositive = positiveWords.filter(word => lowerText.includes(word));
    
    // Negative indicators
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'disappointing', 'poor', 'sad', 'angry', 'disgusting', 'pathetic', 'useless', 'annoying', 'frustrated'];
    const foundNegative = negativeWords.filter(word => lowerText.includes(word));
    
    // Strong phrases
    const strongNegativePhrases = ['no one should', 'never again', 'waste of money', 'completely disappointed'];
    const foundStrongNegative = strongNegativePhrases.filter(phrase => lowerText.includes(phrase));
    
    // Emotional indicators
    const exclamations = (text.match(/!/g) || []).length;
    const allCaps = (text.match(/[A-Z]{2,}/g) || []).length;
    
    if (foundPositive.length > 0) {
      features.push({
        type: 'positive',
        description: `Contains positive words: ${foundPositive.join(', ')}`,
        impact: 'Increases positive sentiment'
      });
    }
    
    if (foundNegative.length > 0) {
      features.push({
        type: 'negative',
        description: `Contains negative words: ${foundNegative.join(', ')}`,
        impact: 'Increases negative sentiment'
      });
    }
    
    if (foundStrongNegative.length > 0) {
      features.push({
        type: 'negative',
        description: `Contains strong negative phrases: ${foundStrongNegative.join(', ')}`,
        impact: 'Strongly increases negative sentiment'
      });
    }
    
    if (exclamations > 0) {
      features.push({
        type: 'emotional',
        description: `${exclamations} exclamation mark${exclamations > 1 ? 's' : ''} detected`,
        impact: 'Indicates emotional intensity'
      });
    }
    
    if (allCaps > 0) {
      features.push({
        type: 'emotional',
        description: `${allCaps} all-caps word${allCaps > 1 ? 's' : ''} detected`,
        impact: 'Indicates strong emphasis or emotion'
      });
    }
    
    return features;
  };

  const features = analyzeTextFeatures(result.text);
  const primarySentiment = result.sentiment[0];

  const getFeatureColor = (type: string) => {
    switch (type) {
      case 'positive': return 'positive';
      case 'negative': return 'negative';
      case 'emotional': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="bg-gradient-card shadow-elegant border-0">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5" />
          <span>Sentiment Explanation</span>
        </CardTitle>
        <CardDescription>
          Understanding why this text received a {primarySentiment.label.toLowerCase()} sentiment score
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Primary Classification</span>
          </div>
          <p className="text-sm text-muted-foreground">
            This text was classified as <strong>{primarySentiment.label.toLowerCase()}</strong> with{' '}
            <strong>{Math.round(primarySentiment.score * 100)}% confidence</strong> based on the following indicators:
          </p>
        </div>

        {features.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Key Sentiment Indicators:</h4>
            {features.map((feature, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={getFeatureColor(feature.type)} className="capitalize">
                    {feature.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{feature.impact}</span>
                </div>
                <p className="text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No specific sentiment indicators found.</p>
            <p className="text-xs mt-1">This text may have neutral language or subtle sentiment cues.</p>
          </div>
        )}

        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> This explanation is based on rule-based analysis. 
            More sophisticated models may identify additional subtle patterns and context.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SentimentExplanation;