import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Clock, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Blog | ThinkHaven',
  description: 'Strategic insights for founders. Learn about idea validation, AI-powered decision making, and building products people want.',
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-cream">
      {/* Subtle texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className="relative z-10 bg-parchment border-b border-ink/8">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-medium font-display text-ink">Blog</h1>
              <p className="text-slate-blue text-sm mt-1">
                Strategic insights for founders and builders
              </p>
            </div>
            <Link href="/">
              <Button
                variant="outline"
                className="border-ink/15 text-ink hover:bg-cream hover:border-ink/30 transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Blog Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-medium font-display text-ink mb-6">
              Think Strategically
            </h2>
            <p className="text-xl text-ink-light font-body max-w-2xl mx-auto leading-relaxed">
              Insights on idea validation, strategic decision-making, and building products that matter.
            </p>
          </div>

          {/* Posts Grid */}
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-blue font-body">No posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {posts.map((post, index) => (
                <Link key={post.slug} href={`/blog/${post.slug}`}>
                  <Card
                    className="group bg-parchment border-ink/8 hover:border-terracotta/40 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Decorative corner */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-terracotta/20 rounded-tl-lg transition-colors group-hover:border-terracotta/40" />

                    <CardContent className="p-8">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map(tag => (
                          <Badge
                            key={tag}
                            className="text-xs px-2.5 py-0.5 bg-ink/5 text-slate-blue font-normal border-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <h3 className="text-2xl font-medium font-display text-ink mb-3 group-hover:text-terracotta transition-colors">
                        {post.title}
                      </h3>

                      <p className="text-ink-light font-body mb-6 leading-relaxed">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm text-slate-blue">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {post.readingTime}
                          </span>
                        </div>

                        <span className="flex items-center gap-1 text-sm font-medium text-terracotta opacity-0 group-hover:opacity-100 transition-opacity">
                          Read more
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
