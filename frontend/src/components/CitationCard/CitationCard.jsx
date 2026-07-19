const CitationCard = ({ citation }) => (
  <div className="border-l-2 border-sage-400 pl-3 py-1 text-xs text-sage-700 bg-sage-50 rounded-r-md">
    <p className="font-medium text-sage-800">{citation.source}</p>
    <p className="line-clamp-2">{citation.snippet}</p>
    {citation.url && (
      <a href={citation.url} target="_blank" rel="noreferrer" className="text-sage-600 hover:underline">
        View source
      </a>
    )}
  </div>
);

export default CitationCard;