import styles from "./HoneypotField.module.css";

// Hidden bot trap. Off-screen clipped rather than display:none (some bots
// skip display:none fields), never a real control for a sighted or
// screen-reader user, not required, ignored when empty.
export default function HoneypotField({ name = "contact_preference", value, onChange }) {
  return (
    <div className={styles.trap} aria-hidden="true">
      <label htmlFor={name}>Leave this field blank</label>
      <input
        id={name}
        name={name}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
