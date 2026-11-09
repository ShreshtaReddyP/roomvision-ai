// One reusable set of single-choice options. variant: "chip" | "card" | "palette" | "segment"
export default function OptionGroup({ legend, hint, options, value, onChange, variant = "chip" }) {
  return (
    <fieldset className="field-group">
      <legend className="field-legend">{legend}</legend>
      {hint && <p className="field-hint">{hint}</p>}
      <div className={`options options-${variant}`} role="radiogroup" aria-label={legend}>
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`option option-${variant}${selected ? " is-selected" : ""}`}
              onClick={() => onChange(option.id)}
            >
              {variant === "palette" && (
                <span className="swatch-row" aria-hidden="true">
                  {option.swatches.length === 0 ? (
                    <span className="swatch swatch-custom" />
                  ) : (
                    option.swatches.map((color) => <span key={color} className="swatch" style={{ background: color }} />)
                  )}
                </span>
              )}
              <span className="option-label">{option.label}</span>
              {option.blurb && variant !== "chip" && <span className="option-blurb">{option.blurb}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
