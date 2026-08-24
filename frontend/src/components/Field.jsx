// One input row with its label and error underneath. Every form uses it so the error
// styling matches the design system page in Figma.

export default function Field({ label, name, error, children, ...inputProps }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {children || <input id={name} name={name} {...inputProps} />}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
