import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

const prose =
  [
    'prose prose-invert prose-sm max-w-none',
    'prose-headings:scroll-mt-2 prose-headings:font-semibold prose-headings:text-slate-100',
    'prose-p:leading-relaxed prose-p:text-slate-200',
    'prose-strong:text-slate-50 prose-a:text-sky-400 prose-a:no-underline hover:prose-a:underline',
    'prose-code:rounded prose-code:bg-slate-900/90 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sky-200',
    'prose-code:before:content-none prose-code:after:content-none',
    'prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-700/90 prose-pre:text-slate-200 prose-pre:shadow-inner',
    'prose-blockquote:border-l-sky-500/50 prose-blockquote:text-slate-300',
    'prose-li:marker:text-slate-500 prose-li:text-slate-200',
    'prose-table:block prose-table:overflow-x-auto prose-th:border prose-th:border-slate-600 prose-td:border prose-td:border-slate-700',
    'prose-hr:border-slate-600'
  ].join(' ');

interface MarkdownBubbleProps {
  content: string;
}

export function MarkdownBubble({ content }: MarkdownBubbleProps) {
  return (
    <div className={prose}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
