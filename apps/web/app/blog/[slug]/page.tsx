import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getAllSlugs } from '@/lib/blog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found | ThinkHaven',
    };
  }

  return {
    title: `${post.title} | ThinkHaven Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

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
          <Link href="/blog">
            <Button
              variant="outline"
              className="border-ink/15 text-ink hover:bg-cream hover:border-ink/30 transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>

      {/* Article Content */}
      <article className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Article Header */}
          <header className="mb-12">
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map(tag => (
                <Badge
                  key={tag}
                  className="text-xs px-3 py-1 bg-terracotta/10 text-terracotta font-normal border-0"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-medium font-display text-ink mb-6 leading-tight">
              {post.title}
            </h1>

            <p className="text-xl text-ink-light font-body mb-8 leading-relaxed">
              {post.excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-blue pb-8 border-b border-ink/10">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {post.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {post.readingTime}
              </span>
            </div>
          </header>

          {/* Article Body */}
          <div className="prose prose-lg max-w-none
            prose-headings:font-display prose-headings:text-ink prose-headings:font-medium
            prose-h1:text-3xl prose-h1:mt-12 prose-h1:mb-6
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:font-body prose-p:text-ink-light prose-p:leading-relaxed prose-p:mb-6
            prose-a:text-terracotta prose-a:no-underline hover:prose-a:underline
            prose-strong:text-ink prose-strong:font-semibold
            prose-ul:my-6 prose-ul:pl-6
            prose-ol:my-6 prose-ol:pl-6
            prose-li:text-ink-light prose-li:font-body prose-li:mb-2
            prose-blockquote:border-l-4 prose-blockquote:border-terracotta prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-ink-light
            prose-hr:border-ink/10 prose-hr:my-12
          ">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Footer CTA */}
          <div className="mt-16 pt-8 border-t border-ink/10">
            <div className="bg-parchment rounded-xl p-8 text-center">
              <h3 className="text-2xl font-medium font-display text-ink mb-3">
                Ready to validate your idea?
              </h3>
              <p className="text-ink-light font-body mb-6">
                Get clarity on your startup idea in 30 minutes with AI-powered strategic analysis.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/assessment">
                  <Button className="bg-terracotta hover:bg-terracotta-hover text-cream font-display px-8">
                    Try Free Assessment
                  </Button>
                </Link>
                <Link href="/blog">
                  <Button variant="outline" className="border-ink/20 text-ink hover:bg-cream font-display px-8">
                    Read More Articles
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
