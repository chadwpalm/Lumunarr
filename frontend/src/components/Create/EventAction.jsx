// One Plex event row in the Create form's Actions card (Play, Stop, Pause, Resume, Scrobble):
// the scene to run, an optional delay, and the poster options when "Poster" is chosen.
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import { InfoLabel, SliderField } from "../Common/FormFields";

const POSTER = "-3";
const COLOR_COUNTS = [1, 2, 3, 4, 5];

/**
 * event: one entry of EVENTS in Create.jsx
 * values: Create's state
 * onChange(stateKey, value): value types must match what is saved (see Create.jsx)
 */
export default function EventAction({ event, values, onChange, sceneList, lightList, allowPoster }) {
  const { key, label, sceneKey, tip, restorePrePlay, delay } = event;
  const scene = values[sceneKey];
  const id = (suffix = "") => `${key}${suffix}`;

  return (
    <div className="event-action">
      <Row className="g-2 align-items-center">
        <Col xs={12} md={2}>
          <InfoLabel htmlFor={id()} tip={tip} className="event-label mb-0">
            {label}
          </InfoLabel>
        </Col>
        <Col xs={12} md={delay ? 5 : 10}>
          <Form.Select value={scene} id={id()} name={id()} onChange={(e) => onChange(sceneKey, e.target.value)} size="sm">
            <option value="-1">Select {label} Action Scene</option>
            <option value="None">None</option>
            <option value="Off">Off</option>
            {restorePrePlay && <option value="-2">Restore Pre-Play</option>}
            {allowPoster && <option value={POSTER}>Poster</option>}
            {sceneList.map((s) => (
              <option key={s.Id} value={s.Id}>
                {s.Name}
              </option>
            ))}
          </Form.Select>
        </Col>
        {delay && (
          <Col xs={12} md={5}>
            <div className="d-flex align-items-center gap-2">
              <InfoLabel htmlFor={delay.key} tip={delay.tip} className="mb-0 text-nowrap">
                Delay
              </InfoLabel>
              <div className="flex-grow-1">
                <SliderField
                  id={delay.key}
                  value={values[delay.key]}
                  min={0}
                  max={delay.max}
                  step={100}
                  display={Number(values[delay.key]) === 0 ? "Off" : `${values[delay.key]} ms`}
                  onChange={(e) => onChange(delay.key, e.target.value.toString())}
                />
              </div>
            </div>
          </Col>
        )}
      </Row>

      {scene === POSTER && (
        <div className="poster-options">
          <Row className="g-3">
            <Col xs={12} md={4}>
              <InfoLabel
                htmlFor={id("Bright")}
                tip="This will set the maximum brightness of the lights in the room when choosing to use poster art. The colors from the poster will be scaled to fit between 5% and the max brightness you set here."
              >
                Max Brightness
              </InfoLabel>
              <SliderField
                id={id("Bright")}
                value={values[id("Bright")]}
                min={1}
                max={100}
                step={1}
                display={`${values[id("Bright")]}%`}
                onChange={(e) => onChange(id("Bright"), e.target.value.toString())}
              />
            </Col>
            <Col xs={12} md={4}>
              <InfoLabel tip="Select the number of colors to use from the poster.">Number of Colors</InfoLabel>
              <div>
                <ToggleButtonGroup
                  type="radio"
                  name={id("Colors")}
                  value={values[id("Num")]}
                  onChange={(n) => onChange(id("Num"), Number(n))}
                  size="sm"
                  className="color-count"
                >
                  {COLOR_COUNTS.map((n) => (
                    <ToggleButton key={n} id={id(`Colors${n}`)} value={n} variant="outline-secondary">
                      {n}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </div>
            </Col>
            <Col xs={12} md={4}>
              <InfoLabel
                htmlFor={id("Light")}
                tip="Select the light to be used as the poster's dominant color. Select none if that doesn't matter."
              >
                Dominant Light
              </InfoLabel>
              <Form.Select
                value={values[id("Light")]}
                id={id("Light")}
                name={id("Light")}
                onChange={(e) => onChange(id("Light"), e.target.value)}
                size="sm"
              >
                <option value="-1">None</option>
                {lightList.map((light) => (
                  <option key={light.Id} value={light.Id}>
                    {light.Name}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}
