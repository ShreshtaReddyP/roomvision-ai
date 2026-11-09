const PRETTY = { tv: "TV" };

function prettyLabel(label) {
  if (PRETTY[label]) return PRETTY[label];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Groups detections by label: { label, count, best confidence }. */
function group(objects) {
  const map = new Map();
  objects.forEach((o) => {
    const entry = map.get(o.label) ?? { label: o.label, count: 0, best: 0 };
    entry.count += 1;
    entry.best = Math.max(entry.best, o.confidence);
    map.set(o.label, entry);
  });
  return [...map.values()].sort((a, b) => b.count - a.count || b.best - a.best);
}

export default function DetectionList({ objects = [], available = true }) {
  if (!available) {
    return <p className="muted">Furniture detection was not available for this photo.</p>;
  }
  if (objects.length === 0) {
    return <p className="muted">No furniture from our detection list was found in this photo.</p>;
  }
  return (
    <ul className="detections">
      {group(objects).map((item) => (
        <li key={item.label} className="detection">
          <span className="detection-count">{item.count}</span>
          <span className="detection-label">{prettyLabel(item.label)}</span>
          <span className="detection-confidence">{Math.round(item.best * 100)}% confidence</span>
        </li>
      ))}
    </ul>
  );
}
