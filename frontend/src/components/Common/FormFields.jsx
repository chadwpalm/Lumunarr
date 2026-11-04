// Small form building blocks shared by Settings, Server and Create.
import Form from "react-bootstrap/Form";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Stack from "react-bootstrap/Stack";
import Info from "bootstrap-icons/icons/info-circle.svg";
import "./FormFields.css";

/** A form label with an (i) tooltip. `tip` can be text or JSX. */
export function InfoLabel({ htmlFor, children, tip, className }) {
  return (
    <Form.Label htmlFor={htmlFor} className={className}>
      {children}
      {tip && (
        <OverlayTrigger placement="right" overlay={<Tooltip>{tip}</Tooltip>}>
          <img src={Info} className="image-info ms-2" alt="Info" />
        </OverlayTrigger>
      )}
    </Form.Label>
  );
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i));

/**
 * Hour / minute / AM-PM dropdowns for one time of day.
 * Reads values[`${prefix}Hour`|`Min`|`Med`] and calls onChange with the select's event
 * (the event target's name is e.g. "startHour").
 */
export function TimeSelects({ prefix, label, values, onChange }) {
  return (
    <Stack gap={1} direction="horizontal" className="time-selects">
      <span className="time-label">{label}</span>
      <Form.Select
        value={values[`${prefix}Hour`]}
        id={`${prefix}Hour`}
        name={`${prefix}Hour`}
        onChange={onChange}
        size="sm"
        className="time-pulldown"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </Form.Select>
      <Form.Select
        value={values[`${prefix}Min`]}
        id={`${prefix}Min`}
        name={`${prefix}Min`}
        onChange={onChange}
        size="sm"
        className="time-pulldown"
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m.padStart(2, "0")}
          </option>
        ))}
      </Form.Select>
      <Form.Select
        value={values[`${prefix}Med`]}
        id={`${prefix}Med`}
        name={`${prefix}Med`}
        onChange={onChange}
        size="sm"
        className="time-pulldown"
      >
        <option value="1">AM</option>
        <option value="2">PM</option>
      </Form.Select>
    </Stack>
  );
}

/** Start and End time rows. */
export function TimeRange({ values, onChange }) {
  return (
    <>
      <div className="mb-2">
        <TimeSelects prefix="start" label="Start:" values={values} onChange={onChange} />
      </div>
      <TimeSelects prefix="end" label="End:" values={values} onChange={onChange} />
    </>
  );
}

const SCHEDULE_TYPES = [
  ["0", "None"],
  ["3", "Global"],
  ["1", "Range"],
  ["2", "Sunset/Sunrise"],
];

/**
 * Schedule type radios (None / Global / Range / Sunset-Sunrise) plus the time range when "Range" is picked.
 * values.scheduleType is "0" | "3" | "1" | "2" (stored as-is in settings).
 */
export function ScheduleFields({ values, onScheduleChange, onTimeChange }) {
  return (
    <>
      <div className="mb-2">
        {SCHEDULE_TYPES.map(([value, label]) => (
          <Form.Check
            key={value}
            inline
            type="radio"
            label={label}
            value={value}
            id={`schedule-${value}`}
            name="schedule"
            onChange={onScheduleChange}
            checked={values.scheduleType === value}
          />
        ))}
      </div>
      {values.scheduleType === "1" && <TimeRange values={values} onChange={onTimeChange} />}
    </>
  );
}

/** A range slider with its value shown at the end (or start). */
export function SliderField({ id, name, value, min, max, step, onChange, display, disabled, valueFirst = false }) {
  const shown = <div className="slider-value">{display ?? value}</div>;
  return (
    <Stack gap={2} direction="horizontal">
      {valueFirst && shown}
      <Form.Range
        id={id}
        name={name ?? id}
        className="me-auto"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        disabled={disabled}
      />
      {!valueFirst && shown}
    </Stack>
  );
}
