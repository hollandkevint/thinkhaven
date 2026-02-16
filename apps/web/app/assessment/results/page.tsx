'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AssessmentResults {
  email: string;
  scores: {
    evidence: number;
    framework: number;
    execution: number;
    overall: number;
  };
  answers: Record<number, number>;
  completedAt: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load results from localStorage
    const storedResults = localStorage.getItem('assessmentResults');
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Results Found</CardTitle>
            <CardDescription>Complete the assessment to see your results</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/assessment')} className="w-full">
              Take Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getScoreLevel = (score: number) => {
    if (score >= 4.5) return { level: 'Expert', color: 'bg-green-600', description: 'Outstanding' };
    if (score >= 3.5) return { level: 'Advanced', color: 'bg-blue-600', description: 'Strong' };
    if (score >= 2.5) return { level: 'Intermediate', color: 'bg-yellow-600', description: 'Developing' };
    return { level: 'Beginner', color: 'bg-orange-600', description: 'Opportunity to grow' };
  };

  const evidenceLevel = getScoreLevel(results.scores.evidence);
  const frameworkLevel = getScoreLevel(results.scores.framework);
  const executionLevel = getScoreLevel(results.scores.execution);
  const overallLevel = getScoreLevel(results.scores.overall);

  // Determine weakest area for personalized recommendation
  const weakestArea = Object.entries(results.scores)
    .filter(([key]) => key !== 'overall')
    .sort(([, a], [, b]) => a - b)[0][0] as keyof Omit<typeof results.scores, 'overall'>;

  const recommendations: Record<string, string[]> = {
    evidence: [
      "Start tracking decisions with evidence requirements",
      "Implement a 'data-first' policy for strategic choices",
      "Create templates for market research and validation"
    ],
    framework: [
      "Learn 3 core strategic frameworks (SWOT, Porter's Five Forces, BMC)",
      "Practice applying frameworks to real scenarios weekly",
      "Join strategic thinking communities for peer learning"
    ],
    execution: [
      "Build decision documentation templates",
      "Set up quarterly strategy review meetings",
      "Create stakeholder communication playbooks"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            Assessment Complete ✓
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Strategic Thinking Scorecard
          </h1>
          <p className="text-lg text-gray-600">
            Results sent to: <strong>{results.email}</strong>
          </p>
        </div>

        {/* Overall Score */}
        <Card className="mb-8 border-2 border-blue-600">
          <CardHeader>
            <CardTitle className="text-2xl">Overall Strategic Maturity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-6xl font-bold text-blue-600">
                  {results.scores.overall.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">out of 5.0</div>
              </div>
              <div className="text-right">
                <div className={`inline-block px-4 py-2 rounded-lg text-white ${overallLevel.color}`}>
                  {overallLevel.level}
                </div>
                <div className="text-sm text-gray-600 mt-2">{overallLevel.description}</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full"
                style={{ width: `${(results.scores.overall / 5) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Scores */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Evidence-Based</CardTitle>
              <CardDescription>Data-driven decision making</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{results.scores.evidence.toFixed(1)}</div>
              <Badge className={evidenceLevel.color}>{evidenceLevel.level}</Badge>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(results.scores.evidence / 5) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Framework Mastery</CardTitle>
              <CardDescription>Systematic methodologies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{results.scores.framework.toFixed(1)}</div>
              <Badge className={frameworkLevel.color}>{frameworkLevel.level}</Badge>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(results.scores.framework / 5) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🚀 Execution Excellence</CardTitle>
              <CardDescription>Implementation & tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{results.scores.execution.toFixed(1)}</div>
              <Badge className={executionLevel.color}>{executionLevel.level}</Badge>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(results.scores.execution / 5) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personalized Recommendations */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardHeader>
            <CardTitle>💡 Your Personalized Action Plan</CardTitle>
            <CardDescription className="text-blue-100">
              Based on your assessment, here's where to focus first
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-2">
                Priority Focus Area: {weakestArea === 'evidence' && '📊 Evidence-Based Decision Making'}
                {weakestArea === 'framework' && '🎯 Framework Mastery'}
                {weakestArea === 'execution' && '🚀 Execution Excellence'}
              </h3>
              <p className="text-blue-100 mb-4">
                This is your biggest opportunity for improvement. Strengthening this area will have the highest impact.
              </p>
              <ul className="space-y-2">
                {recommendations[weakestArea].map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="border-2 border-blue-600">
          <CardHeader>
            <CardTitle>🎯 Ready to Level Up Your Strategic Thinking?</CardTitle>
            <CardDescription>
              Get personalized AI coaching with Mary using the bMAD Method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-semibold mb-1">✓ 2 Free Sessions</div>
                <div className="text-gray-600">Try before you commit</div>
              </div>
              <div>
                <div className="font-semibold mb-1">✓ Systematic Frameworks</div>
                <div className="text-gray-600">Evidence-based methods</div>
              </div>
              <div>
                <div className="font-semibold mb-1">✓ Actionable Outputs</div>
                <div className="text-gray-600">Professional documents</div>
              </div>
            </div>
          </CardContent>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => router.push('/')}
              >
                Start Free Trial →
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/try')}
              >
                Try It Free
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>📧 Check your email for detailed recommendations</p>
          <p className="mt-2">Questions? Contact kevin@thinkhaven.co</p>
        </div>
      </div>
    </div>
  );
}
