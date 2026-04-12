type Props = {
  content: string;
  title?: string;
  styleLabel?: string;
};

export default function DocumentPreview({
  content,
  title,
  styleLabel,
}: Props) {
  return (
    <div className="bg-neutral-900 p-4 rounded-2xl">
      <div className="bg-white text-black mx-auto w-full max-w-[800px] min-h-[900px] shadow-2xl rounded-sm border border-neutral-300">
        <div className="px-12 py-10">
          {(title || styleLabel) && (
            <div className="mb-8 border-b border-neutral-200 pb-4">
              {title && (
                <h2 className="text-3xl font-bold leading-tight">{title}</h2>
              )}
              {styleLabel && (
                <p className="text-sm text-neutral-500 mt-2">{styleLabel}</p>
              )}
            </div>
          )}

          <pre className="whitespace-pre-wrap font-serif text-[17px] leading-[1.9]">
            {content || "Your formatted document will appear here..."}
          </pre>
        </div>
      </div>
    </div>
  );
}