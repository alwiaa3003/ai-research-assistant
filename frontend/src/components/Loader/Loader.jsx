const Loader = ({ size = 24 }) => (
  <div
    className="animate-spin rounded-full border-2 border-sage-200 border-t-sage-600"
    style={{ width: size, height: size }}
  />
);

export default Loader;