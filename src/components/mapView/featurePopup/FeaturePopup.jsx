const FeaturePopup = ({ feature, index, total, onPrev, onNext }) => {
  if (!feature) return null;

  const attributes = feature.attributes;

  return (
    <div
      style={{
        background: "white",
        padding: "10px",
        borderRadius: "8px",
        maxWidth: "300px",
      }}
    >
      <b>Feature Info</b>
      <div style={{ margin: "10px 0" }}>
        {Object.entries(attributes).map(([key, value]) => (
          <div key={key}>
            <b>{key}:</b> {value?.toString()}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px",
        }}
      >
        <button onClick={onPrev} disabled={index === 0}>
          &larr; Prev
        </button>
        <span>
          {index + 1} of {total}
        </span>
        <button onClick={onNext} disabled={index === total - 1}>
          Next &rarr;
        </button>
      </div>
    </div>
  );
};

export default FeaturePopup;
