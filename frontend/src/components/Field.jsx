// One input row with its label and its error message underneath.
// Every form uses this so the error styling is identical everywhere, which is what the
// design system page in Figma is for.

export default function Field({ label, name, error, children, ...inputProps }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {children || <input id={name} name={name} {...inputProps} />}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
