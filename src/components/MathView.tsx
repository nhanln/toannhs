import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  content?: string;
  text?: string;
  className?: string;
}

/**
 * MathView renders text with embedded LaTeX formulas:
 * - Block math: $$ ... $$
 * - Inline math: $ ... $
 * Safe and fast rendering using KaTeX
 */
export const MathView: React.FC<MathViewProps> = ({ content, text, className = '' }) => {
  const actualContent = content ?? text ?? '';
  const renderedHtml = useMemo(() => {
    if (!actualContent) return '';

    // Regex to match $$block math$$ or $inline math$
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;

    const parts = actualContent.split(mathRegex);

    return parts
      .map((part) => {
        if (!part) return '';

        // Check for block math: $$...$$
        if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
          const formula = part.slice(2, -2).trim();
          try {
            return `<div class="my-2 overflow-x-auto py-1 text-center">${katex.renderToString(formula, {
              displayMode: true,
              throwOnError: false,
            })}</div>`;
          } catch (e) {
            return `<span class="text-red-500 font-mono text-sm">${part}</span>`;
          }
        }

        // Check for inline math: $...$
        if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
          const formula = part.slice(1, -1).trim();
          try {
            return `<span class="inline-block px-0.5">${katex.renderToString(formula, {
              displayMode: false,
              throwOnError: false,
            })}</span>`;
          } catch (e) {
            return `<span class="text-red-500 font-mono text-sm">${part}</span>`;
          }
        }

        // Normal text: escape HTML entities and preserve newlines
        const escaped = part
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')
          .replace(/\n/g, '<br />');

        return escaped;
      })
      .join('');
  }, [content]);

  return (
    <div
      className={`math-content leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
