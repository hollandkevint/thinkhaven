'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    try {
      const storedResults = localStorage.getItem('assessmentResults');
      if (storedResults) {
        setResults(JSON.parse(storedResults));
      }
    } catch (error) {
      console.error('Failed to load assessment results:', error);
      localStorage.removeItem('assessmentResults');
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="w-full max-w-md rounded-lg border border-ink/10 bg-parchment p-6">
          <div className="h-4 w-32 rounded bg-ink/10 animate-pulse" />
          <div className="mt-4 h-7 w-3/4 rounded bg-ink/10 animate-pulse" />
          <div className="mt-3 h-4 w-full rounded bg-ink/10 animate-pulse" />
          <p className="mt-5 text-sm text-ink-light">Preparing your decision readiness scorecard.</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <Card className="max-w-md border-ink/10 bg-parchment">
          <CardHeader>
            <h1 className="text-lg font-semibold leading-none text-ink">
              No decision readiness scorecard found
            </h1>
            <CardDescription className="text-ink-light">
              Complete the diagnostic to generate a scorecard, or skip straight to a 10-message pressure test with Mary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full bg-terracotta text-cream hover:bg-terracotta-hover">
              <Link href="/assessment">Take Assessment</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-ink/15 text-ink hover:bg-cream">
              <Link href="/try">Try Mary Instead</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getScoreLevel = (score: number) => {
    if (score >= 4.5) return { level: 'High confidence', color: 'bg-forest', description: 'Defensible' };
    if (score >= 3.5) return { level: 'Strong case', color: 'bg-terracotta', description: 'Mostly clear' };
    if (score >= 2.5) return { level: 'Needs pressure', color: 'bg-mustard', description: 'Uneven' };
    return { level: 'Fragile case', color: 'bg-rust', description: 'Under-evidenced' };
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
      "Name the claim that would change the decision",
      "Separate evidence you have from evidence you need",
      "Ask Mary to pressure-test the highest-risk assumption"
    ],
    framework: [
      "Write the decision in one sentence",
      "List the rejected alternatives and why they lost",
      "Use plan-grill mode to expose the hidden tradeoffs"
    ],
    execution: [
      "Turn the decision into owners, dates, and first proof",
      "Identify the failure signal you will watch first",
      "Ask Mary to convert the plan into a defensible artifact"
    ]
  };

  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            Assessment complete
          </Badge>
          <h1 className="text-4xl font-bold text-ink mb-4">
            Your Decision Readiness Scorecard
          </h1>
          <p className="text-lg text-ink-light">
            Results sent to: <strong>{results.email}</strong>
          </p>
        </div>

        {/* Overall Score */}
        <Card className="mb-8 border-2 border-terracotta">
          <CardHeader>
            <CardTitle className="text-2xl">Overall decision readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-6xl font-bold text-terracotta">
                  {results.scores.overall.toFixed(1)}
                </div>
                <div className="text-sm text-ink-light">out of 5.0</div>
              </div>
              <div className="text-right">
                <div className={`inline-block px-4 py-2 rounded-lg text-cream ${overallLevel.color}`}>
                  {overallLevel.level}
                </div>
                <div className="text-sm text-ink-light mt-2">{overallLevel.description}</div>
              </div>
            </div>
            <div className="w-full bg-ink/10 rounded-full h-3">
              <div
                className="bg-terracotta h-3 rounded-full"
                style={{ width: `${(results.scores.overall / 5) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Scores */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evidence base</CardTitle>
              <CardDescription>How well the decision is supported</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{results.scores.evidence.toFixed(1)}</div>
              <Badge className={evidenceLevel.color}>{evidenceLevel.level}</Badge>
              <div className="w-full bg-ink/10 rounded-full h-2 mt-4">
                <div
                  className="bg-terracotta h-2 rounded-full"
                  style={{ width: `${(results.scores.evidence / 5) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Decision frame</CardTitle>
              <CardDescription>How clearly the options and tradeoffs are named</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{results.scores.framework.toFixed(1)}</div>
              <Badge className={frameworkLevel.color}>{frameworkLevel.level}</Badge>
              <div className="w-full bg-ink/10 rounded-full h-2 mt-4">
                <div
                  className="bg-terracotta h-2 rounded-full"
                  style={{ width: `${(results.scores.framework / 5) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Execution path</CardTitle>
              <CardDescription>How directly the decision becomes action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{results.scores.execution.toFixed(1)}</div>
              <Badge className={executionLevel.color}>{executionLevel.level}</Badge>
              <div className="w-full bg-ink/10 rounded-full h-2 mt-4">
                <div
                  className="bg-terracotta h-2 rounded-full"
                  style={{ width: `${(results.scores.execution / 5) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personalized Recommendations */}
        <Card className="mb-8 bg-terracotta text-cream">
          <CardHeader>
            <CardTitle>Recommended pressure test</CardTitle>
            <CardDescription className="text-cream/85">
              Based on the scorecard, start where the case is easiest to challenge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-2">
                Priority focus: {weakestArea === 'evidence' && 'Evidence base'}
                {weakestArea === 'framework' && 'Decision frame'}
                {weakestArea === 'execution' && 'Execution path'}
              </h3>
              <p className="text-cream/85 mb-4">
                This is the part of the decision most likely to break under scrutiny.
              </p>
              <ul className="space-y-2">
                {recommendations[weakestArea].map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2" aria-hidden="true">&middot;</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="border-2 border-terracotta">
          <CardHeader>
            <CardTitle>Ready to test a real decision?</CardTitle>
            <CardDescription>
              Bring the highest-risk decision on your desk. Mary will turn it into artifact, decision, and confidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-semibold mb-1">10 guest messages</div>
                <div className="text-ink-light">Pressure-test before signup</div>
              </div>
              <div>
                <div className="font-semibold mb-1">Board perspectives</div>
                <div className="text-ink-light">Opposing lenses, not agreement</div>
              </div>
              <div>
                <div className="font-semibold mb-1">Defensible output</div>
                <div className="text-ink-light">A decision artifact you can share</div>
              </div>
            </div>
          </CardContent>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => router.push('/try')}
              >
                Try Mary Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/pricing')}
              >
                View Pricing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mt-8 text-center text-sm text-slate-blue">
          <p>Check your email for the saved scorecard.</p>
          <p className="mt-2">Questions? Contact kevin@thinkhaven.co</p>
        </div>
      </div>
    </div>
  );
}
