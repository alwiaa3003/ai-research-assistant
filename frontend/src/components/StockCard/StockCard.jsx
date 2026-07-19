const StockCard = ({ stock, onClick }) => (
  <button
    onClick={() => onClick?.(stock)}
    className="text-left border border-sage-100 rounded-xl p-4 hover:shadow-soft hover:border-sage-200 transition bg-white w-full"
  >
    <p className="font-semibold text-sage-800">{stock.companyName}</p>
    <p className="text-sm text-sage-500">
      {stock.symbol} • {stock.exchange}
    </p>
    {stock.sector && <p className="text-xs text-sage-400 mt-1">{stock.sector}</p>}
  </button>
);

export default StockCard;