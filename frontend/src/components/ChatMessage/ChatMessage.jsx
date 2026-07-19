import ReactMarkdown from "react-markdown";
import CitationCard from "../CitationCard/CitationCard";

const ChatMessage = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-soft ${
          isUser ? "bg-sage-600 text-white" : "bg-white text-sage-900 border border-sage-100"
        }`}
      >
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {!isUser && message.sources?.length > 0 ? (
          <details className="mt-3 group">
            <summary className="text-xs font-medium text-sage-600 cursor-pointer hover:text-sage-800 list-none flex items-center gap-1">
              <span className="inline-block transition-transform group-open:rotate-90">▸</span>
              Sources ({message.sources.length})
            </summary>
            <div className="mt-2 space-y-2">
              {message.sources.map((s, i) => (
                <div
                  key={i}
                  className="border-l-2 border-sage-400 pl-3 py-1 text-xs text-sage-700 bg-sage-50 rounded-r-md"
                >
                  <p className="font-medium text-sage-800">
                    {s.fileName}
                    {s.pageNumber ? `, page ${s.pageNumber}` : ""}
                  </p>
                  {typeof s.score === "number" && (
                    <p className="text-sage-500">Relevance: {Math.round(s.score * 100)}%</p>
                  )}
                </div>
              ))}
            </div>
          </details>
        ) : (
          !isUser &&
          message.citations?.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.citations.map((c, i) => (
                <CitationCard key={i} citation={c} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ChatMessage;