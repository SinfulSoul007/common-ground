'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Role } from '@/lib/types';

interface CharterDocumentProps {
  npoView: string;
  researcherView: string;
  activeView: Role;
}

export default function CharterDocument({ npoView, researcherView, activeView }: CharterDocumentProps) {
  const content = activeView === 'npo' ? npoView : researcherView;

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="p-8 md:p-12"
        >
          <div
            className="prose prose-slate max-w-none prose-headings:text-primary prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:mt-8 prose-h2:mb-4 prose-p:leading-relaxed prose-li:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function markdownToHtml(markdown: string): string {
  // Simple markdown to HTML converter for the hackathon
  let html = markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs (lines that aren't already HTML)
    .replace(/^(?!<[hlu]|<li)(.+)$/gm, '<p>$1</p>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    // Line breaks
    .replace(/\n\n/g, '\n')
    // Clean up empty paragraphs
    .replace(/<p>\s*<\/p>/g, '');

  return html;
}
