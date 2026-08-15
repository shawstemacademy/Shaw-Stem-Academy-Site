import React from 'react';

interface FormattedTextProps {
  text?: string;
  className?: string;
  paragraphClassName?: string;
  lineClamp?: number;
  enableLinks?: boolean;
}

export const FormattedText: React.FC<FormattedTextProps> = ({
  text = '',
  className = '',
  paragraphClassName = '',
  lineClamp,
  enableLinks = true,
}) => {
  if (!text) return null;

  // If clamped for preview cards (e.g. 3 lines)
  if (lineClamp) {
    const clampClass =
      lineClamp === 2
        ? 'line-clamp-2'
        : lineClamp === 3
        ? 'line-clamp-3'
        : lineClamp === 4
        ? 'line-clamp-4'
        : lineClamp === 5
        ? 'line-clamp-5'
        : 'line-clamp-6';

    return (
      <div className={`whitespace-pre-wrap break-words leading-relaxed ${clampClass} ${className}`}>
        {text}
      </div>
    );
  }

  // Parse paragraphs separated by double linebreaks or multiple linebreaks
  // to maintain natural typography hierarchy and spacing
  const paragraphs = text.split(/\n\s*\n/);

  return (
    <div className={`space-y-3 break-words ${className}`}>
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');

        // Check if paragraph is a list
        const isBulletList = lines.length > 0 && lines.every(l => /^\s*[-*•]\s+/.test(l));
        const isNumberedList = lines.length > 0 && lines.every(l => /^\s*\d+\.\s+/.test(l));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="list-disc list-inside space-y-1.5 pl-1 my-2">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^\s*[-*•]\s+/, '');
                return (
                  <li key={lIdx} className={`text-inherit leading-relaxed ${paragraphClassName}`}>
                    {renderLineWithLinks(cleanLine, enableLinks)}
                  </li>
                );
              })}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={pIdx} className="list-decimal list-inside space-y-1.5 pl-1 my-2">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^\s*\d+\.\s+/, '');
                return (
                  <li key={lIdx} className={`text-inherit leading-relaxed ${paragraphClassName}`}>
                    {renderLineWithLinks(cleanLine, enableLinks)}
                  </li>
                );
              })}
            </ol>
          );
        }

        return (
          <p
            key={pIdx}
            className={`whitespace-pre-wrap leading-relaxed text-inherit ${paragraphClassName}`}
          >
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderLineWithLinks(line, enableLinks)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

function renderLineWithLinks(line: string, enableLinks: boolean): React.ReactNode {
  if (!enableLinks) return line;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = line.split(urlRegex);

  if (parts.length === 1) return line;

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 break-all inline-flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
