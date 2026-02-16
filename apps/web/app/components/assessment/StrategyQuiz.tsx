'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface QuizQuestion {
  id: number;
  question: string;
  options: {
    value: number;
    label: string;
  }[];
  category: 'evidence' | 'framework' | 'execution';
}

// 10 questions covering 3 categories: Evidence (4), Framework (3), Execution (3)
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "How often do your strategic decisions rely on gut feeling rather than data?",
    options: [
      { value: 1, label: "Always - I trust my intuition" },
      { value: 2, label: "Often - Data is hard to find" },
      { value: 3, label: "Sometimes - I mix both" },
      { value: 4, label: "Rarely - I prefer data" },
      { value: 5, label: "Never - Always evidence-based" }
    ],
    category: 'evidence'
  },
  {
    id: 2,
    question: "When analyzing competitors, how systematic is your approach?",
    options: [
      { value: 1, label: "No formal process" },
      { value: 2, label: "Ad-hoc research when needed" },
      { value: 3, label: "Basic framework I follow" },
      { value: 4, label: "Structured methodology" },
      { value: 5, label: "Rigorous competitive intelligence system" }
    ],
    category: 'framework'
  },
  {
    id: 3,
    question: "How often do you document and revisit strategic decisions?",
    options: [
      { value: 1, label: "Never - Keep it in my head" },
      { value: 2, label: "Rarely - Only major decisions" },
      { value: 3, label: "Sometimes - When time permits" },
      { value: 4, label: "Usually - Most decisions" },
      { value: 5, label: "Always - Complete documentation" }
    ],
    category: 'execution'
  },
  {
    id: 4,
    question: "Do you use structured frameworks (SWOT, Porter's Five Forces, etc.)?",
    options: [
      { value: 1, label: "Never heard of them" },
      { value: 2, label: "Know them, don't use" },
      { value: 3, label: "Occasionally apply basics" },
      { value: 4, label: "Regularly use 2-3 frameworks" },
      { value: 5, label: "Expert in multiple frameworks" }
    ],
    category: 'framework'
  },
  {
    id: 5,
    question: "How do you validate strategic assumptions before committing?",
    options: [
      { value: 1, label: "I don't - Just move forward" },
      { value: 2, label: "Ask colleagues for opinions" },
      { value: 3, label: "Do some basic research" },
      { value: 4, label: "Test with small experiments" },
      { value: 5, label: "Systematic validation process" }
    ],
    category: 'evidence'
  },
  {
    id: 6,
    question: "Do you quantify the potential impact of strategic decisions?",
    options: [
      { value: 1, label: "No - Qualitative only" },
      { value: 2, label: "Rough estimates" },
      { value: 3, label: "Basic calculations" },
      { value: 4, label: "Detailed projections" },
      { value: 5, label: "Full financial modeling" }
    ],
    category: 'evidence'
  },
  {
    id: 7,
    question: "How do you prioritize multiple strategic options?",
    options: [
      { value: 1, label: "Pick what feels right" },
      { value: 2, label: "Discuss with team" },
      { value: 3, label: "Simple pros/cons list" },
      { value: 4, label: "Scoring matrix" },
      { value: 5, label: "Multi-criteria decision analysis" }
    ],
    category: 'framework'
  },
  {
    id: 8,
    question: "How well do you communicate strategic rationale to stakeholders?",
    options: [
      { value: 1, label: "Struggle to explain" },
      { value: 2, label: "Basic explanation" },
      { value: 3, label: "Clear but incomplete" },
      { value: 4, label: "Compelling narrative" },
      { value: 5, label: "Executive-ready presentation" }
    ],
    category: 'execution'
  },
  {
    id: 9,
    question: "How often do you incorporate customer insights into strategy?",
    options: [
      { value: 1, label: "Never - Internal only" },
      { value: 2, label: "Rarely - Anecdotal feedback" },
      { value: 3, label: "Sometimes - Surveys occasionally" },
      { value: 4, label: "Often - Regular customer research" },
      { value: 5, label: "Always - Continuous discovery" }
    ],
    category: 'evidence'
  },
  {
    id: 10,
    question: "How actionable are your strategic recommendations?",
    options: [
      { value: 1, label: "Vague direction only" },
      { value: 2, label: "General suggestions" },
      { value: 3, label: "Some specific steps" },
      { value: 4, label: "Clear action plan" },
      { value: 5, label: "Detailed roadmap with owners/timelines" }
    ],
    category: 'execution'
  }
];

export function StrategyQuiz() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [email, setEmail] = useState('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;
  const isLastQuestion = currentQuestion === QUIZ_QUESTIONS.length - 1;

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));

    if (isLastQuestion) {
      // Show email capture after last question
      setShowEmailCapture(true);
    } else {
      // Move to next question
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
      }, 300);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Calculate scores
    const scores = calculateScores();

    // Store results in localStorage for results page
    localStorage.setItem('assessmentResults', JSON.stringify({
      email,
      scores,
      answers,
      completedAt: new Date().toISOString()
    }));

    // TODO: Send to Supabase
    try {
      await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          scores,
          answers,
          completedAt: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      // Continue anyway - data is in localStorage
    }

    // Redirect to results page
    router.push('/assessment/results');
  };

  const calculateScores = () => {
    const categoryScores = {
      evidence: 0,
      framework: 0,
      execution: 0
    };
    const categoryCounts = {
      evidence: 0,
      framework: 0,
      execution: 0
    };

    Object.entries(answers).forEach(([questionIdStr, value]) => {
      const questionId = parseInt(questionIdStr);
      const question = QUIZ_QUESTIONS.find(q => q.id === questionId);
      if (question) {
        categoryScores[question.category] += value;
        categoryCounts[question.category]++;
      }
    });

    // Calculate average scores (1-5 scale)
    return {
      evidence: categoryScores.evidence / categoryCounts.evidence,
      framework: categoryScores.framework / categoryCounts.framework,
      execution: categoryScores.execution / categoryCounts.execution,
      overall: Object.values(answers).reduce((sum, val) => sum + val, 0) / Object.values(answers).length
    };
  };

  if (showEmailCapture) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🎉 Assessment Complete!</CardTitle>
          <CardDescription>
            Get your personalized strategic thinking scorecard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Enter your email to receive your results
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
              <p className="text-xs text-slate-blue mt-2">
                We'll send you detailed recommendations and insights based on your assessment.
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !email}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? 'Processing...' : 'Get My Results →'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const question = QUIZ_QUESTIONS[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-ink-light">
          <span>Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-ink/10 rounded-full h-2">
          <div
            className="bg-terracotta h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary">
              {question.category === 'evidence' && '📊 Evidence-Based'}
              {question.category === 'framework' && '🎯 Framework Mastery'}
              {question.category === 'execution' && '🚀 Execution Excellence'}
            </Badge>
          </div>
          <CardTitle className="text-xl">{question.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(question.id, option.value)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-terracotta hover:bg-terracotta/5 ${
                  answers[question.id] === option.value
                    ? 'border-terracotta bg-terracotta/5'
                    : 'border-ink/8'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option.label}</span>
                  {answers[question.id] === option.value && (
                    <span className="text-terracotta">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation hint */}
      <p className="text-center text-sm text-slate-blue">
        Click an option to continue
      </p>
    </div>
  );
}
