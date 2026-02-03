import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  tags: string[];
  readingTime: string;
  content: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  tags: string[];
  readingTime: string;
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BLOG_DIR).filter(file => file.endsWith('.md') || file.endsWith('.mdx'));

  const posts = files.map(filename => {
    const filePath = path.join(BLOG_DIR, filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    const stats = readingTime(content);

    return {
      slug: filename.replace(/\.mdx?$/, ''),
      title: data.title || 'Untitled',
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      author: data.author || 'ThinkHaven',
      excerpt: data.excerpt || '',
      tags: data.tags || [],
      readingTime: stats.text,
    };
  });

  // Sort by date descending
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
  const mdPath = path.join(BLOG_DIR, `${slug}.md`);
  const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);

  let filePath = '';
  if (fs.existsSync(mdPath)) {
    filePath = mdPath;
  } else if (fs.existsSync(mdxPath)) {
    filePath = mdxPath;
  } else {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);
  const stats = readingTime(content);

  return {
    slug,
    title: data.title || 'Untitled',
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    author: data.author || 'ThinkHaven',
    excerpt: data.excerpt || '',
    tags: data.tags || [],
    readingTime: stats.text,
    content,
  };
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  return fs.readdirSync(BLOG_DIR)
    .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
    .map(file => file.replace(/\.mdx?$/, ''));
}
