import { Component } from "react";
import Row from "react-bootstrap/Row";
import Form from "react-bootstrap/Form";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Info from "bootstrap-icons/icons/info-circle.svg";
import Button from "react-bootstrap/Button";
import Stack from "react-bootstrap/Stack";
import SettingsSection from "../SettingsSection/SettingsSection";
import Col from "react-bootstrap/Col";
import { InfoLabel, TimeRange } from "../Common/FormFields";
import "./Settings.css";

// Must match normalizeBaseURL() in backend/config.js
function normalizeBaseURL(value) {
  const trimmed = (value || "").trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) return "";
  if (!/^[A-Za-z0-9._~\-/]+$/.test(trimmed) || trimmed.split("/").some((s) => s === "" || s === "." || s === "..")) {
    return null; // invalid
  }
  return "/" + trimmed;
}

function validInt(value, min, max) {
  const n = Number(value);
  return String(value ?? "").trim() !== "" && Number.isInteger(n) && n >= min && n <= max;
}

function validPort(value) {
  if (String(value ?? "").trim() === "") return true; // empty = default
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n < 65536;
}

export default class Settings extends Component {
  constructor(props) {
    super(props);
    const s = this.props.settings.settings;
    this.state = {
      transition: s?.transition ?? "0",
      startHour: s?.startHour ?? "1",
      startMin: s?.startMin ?? "0",
      startMed: s?.startMed ?? "1",
      endHour: s?.endHour ?? "1",
      endMin: s?.endMin ?? "0",
      endMed: s?.endMed ?? "1",
      latitude: s?.latitude ?? "",
      longitude: s?.longitude ?? "",
      appPort: s?.appPort ?? "",
      baseURL: s?.baseURL ?? "",
      logLevel: s?.logLevel ?? "0",
      logSize: s?.logSize ?? "10",
      logFiles: s?.logFiles ?? "5",
      host: null, // what the server is running with, from backend/host
      isSaved: false,
      error: null,
      isEdit: !!s,
    };
  }

  componentDidMount() {
    fetch("backend/host")
      .then((res) => (res.ok ? res.json() : null))
      .then((host) => this.setState({ host }))
      .catch(() => this.setState({ host: null }));
  }

  formErrors() {
    const errors = {};
    if (!validPort(this.state.appPort)) errors.appPort = "Port must be a whole number from 1 to 65535.";
    if (normalizeBaseURL(this.state.baseURL) === null)
      errors.baseURL = "Use letters, numbers and . _ ~ - separated by /, e.g. /lumunarr";
    if (!validInt(this.state.logSize, 1, 100)) errors.logSize = "Enter a whole number from 1 to 100.";
    if (!validInt(this.state.logFiles, 1, 60)) errors.logFiles = "Enter a whole number from 1 to 60.";
    return errors;
  }

  handleFormSubmit = (e) => {
    e.preventDefault();
    if (Object.keys(this.formErrors()).length) return;

    if (!this.props.settings.settings) this.props.settings.settings = {};
    const settings = this.props.settings.settings;

    settings.transition = this.state.transition;
    settings.startHour = this.state.startHour;
    settings.startMin = this.state.startMin;
    settings.startMed = this.state.startMed;
    settings.endHour = this.state.endHour;
    settings.endMin = this.state.endMin;
    settings.endMed = this.state.endMed;
    settings.latitude = this.state.latitude;
    settings.longitude = this.state.longitude;
    settings.appPort = String(this.state.appPort).trim();
    settings.baseURL = normalizeBaseURL(this.state.baseURL);
    settings.logLevel = this.state.logLevel;
    settings.logSize = String(parseInt(this.state.logSize, 10));
    settings.logFiles = String(parseInt(this.state.logFiles, 10));

    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          this.setState({ isSaved: true, error: null, baseURL: settings.baseURL, appPort: settings.appPort });
        } else {
          this.setState({ error: xhr.responseText || `Save failed (${xhr.status})` });
        }
      }
    });

    xhr.open("POST", "backend/save", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(this.props.settings));

    this.setState({ isEdit: true });
  };

  handleTransition = (e) => {
    this.setState({ transition: e.target.value.toString(), isSaved: false });
  };

  // startHour, startMin, startMed, endHour, endMin, endMed, latitude, longitude, appPort, baseURL
  handleField = (e) => {
    this.setState({ [e.target.name]: e.target.value.toString(), isSaved: false });
  };

  // True when the saved host settings differ from what the server is running with
  hostNeedsRestart() {
    const { host } = this.state;
    if (!host) return false;
    const savedPort = Number(this.props.settings.settings?.appPort) || host.defaultPort;
    const savedBase = normalizeBaseURL(this.props.settings.settings?.baseURL) ?? "";
    const portChanged = host.portSource !== "APP_PORT" && host.portSource !== "PORT" && savedPort !== host.port;
    const baseChanged = host.baseURLSource !== "APP_BASE_URL" && savedBase !== host.baseURL;
    return this.state.isSaved && (portChanged || baseChanged);
  }

  render() {
    const { host } = this.state;
    const errors = this.formErrors();
    const portOverride =
      host && (host.portSource === "APP_PORT" || host.portSource === "PORT") ? host.portSource : null;
    const baseOverride = host && host.baseURLSource === "APP_BASE_URL";

    return (
      <>
        <Row>
          <h3>Settings</h3>
        </Row>
        <div className="div-seperator" />
        <Row>
          <Form onSubmit={this.handleFormSubmit} className={`form-content ${this.props.isDarkMode ? "dark-mode" : ""}`}>
            {/* Global */}
            <SettingsSection
              title="Global Settings"
              tooltip='These settings will be applied toward profile settings that are set as "global".'
              isDarkMode={this.props.isDarkMode}
            >
              <Form.Label htmlFor="transition">
                Scene Transition Time (s) &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip>
                      This is the time in seconds for the scene to transition.
                      <br />
                      <br />
                      If set to "Default", Lumunarr will use the transition time that is saved in the scene (through a
                      third-party app). If there is no saved transition time, the Hue default of 0.4 seconds will be
                      used.
                      <br />
                      <br />
                      Setting a specific time will override the transition time saved in the scene and use the selected
                      time instead.
                    </Tooltip>
                  }
                >
                  <img src={Info} className="image-info" alt="" />
                </OverlayTrigger>
              </Form.Label>
              <Stack gap={1} direction="horizontal" className="mb-3">
                <Form.Range
                  id="transition"
                  className="me-auto"
                  value={this.state.transition}
                  min={0}
                  max={10}
                  step={0.2}
                  onChange={this.handleTransition}
                />
                <div className="range-text">
                  {this.state.transition === "0" ? "Default" : `${this.state.transition} s`}
                </div>
              </Stack>
              <Form.Label>
                Schedule &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={<Tooltip>Add a global schedule for when the triggers will be active.</Tooltip>}
                >
                  <img src={Info} className="image-info" alt="Schedule" />
                </OverlayTrigger>
              </Form.Label>
              <TimeRange values={this.state} onChange={this.handleField} />
            </SettingsSection>

            {/* Location */}
            <SettingsSection
              title="Geographical Location"
              tooltip="Enter your location in latitude and longitude. This is required to use sunrise/sunset schedule."
              isDarkMode={this.props.isDarkMode}
            >
              <div className="mb-3">
                1. Visit{" "}
                <a href="https://www.latlong.net/" target="_blank" rel="noreferrer">
                  LatLong.net
                </a>
                <br />
                2. Pinpoint your location using the text box and/or map
                <br />
                3. Copy and paste the latitude and longitude into the fields below
              </div>
              <Form.Label htmlFor="latitude">Latitude</Form.Label>
              <Form.Control
                value={this.state.latitude}
                id="latitude"
                name="latitude"
                onChange={this.handleField}
                size="sm"
                className="mb-3"
              />
              <Form.Label htmlFor="longitude">Longitude</Form.Label>
              <Form.Control
                value={this.state.longitude}
                id="longitude"
                name="longitude"
                onChange={this.handleField}
                size="sm"
              />
            </SettingsSection>

            {/* Host */}
            <SettingsSection title="Host" isDarkMode={this.props.isDarkMode}>
              {host && (
                <div className="mb-3 host-running">
                  Currently running on port <b>{host.port}</b> at <b>{host.baseURL || "/"}</b>
                </div>
              )}
              <Form.Label htmlFor="appPort">
                Port Number &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip>
                      The port number Lumunarr runs on. If left blank the port will default to "
                      {host?.defaultPort ?? 3939}".
                      <br />
                      <br />
                      Note: If running in a Docker container this will be the port as seen <i>inside</i> the container.
                      If APP_PORT is used as an environment variable, it will override this setting.
                    </Tooltip>
                  }
                >
                  <img src={Info} className="image-info" alt="Info" />
                </OverlayTrigger>
              </Form.Label>
              <Form.Control
                value={this.state.appPort}
                id="appPort"
                name="appPort"
                inputMode="numeric"
                placeholder={String(host?.defaultPort ?? 3939)}
                onChange={this.handleField}
                isInvalid={!!errors.appPort}
                disabled={!!portOverride}
                size="sm"
              />
              <Form.Control.Feedback type="invalid">{errors.appPort}</Form.Control.Feedback>
              <div className="footnote mb-3">
                {portOverride
                  ? `Set by the ${portOverride} environment variable; this setting is ignored.`
                  : "Requires restart to take effect"}
              </div>
              <Form.Label htmlFor="baseURL">
                URL Base &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip>
                      For reverse proxy support, default is empty.
                      <br />
                      <br />
                      Note: If using a reverse proxy (example: mydomain.com/lumunarr) you would enter '/lumunarr' for
                      URL Base. If APP_BASE_URL is used as an environment variable, it will override this setting.
                    </Tooltip>
                  }
                >
                  <img src={Info} className="image-info" alt="Info" />
                </OverlayTrigger>
              </Form.Label>
              <Form.Control
                value={this.state.baseURL}
                id="baseURL"
                name="baseURL"
                placeholder="/"
                onChange={this.handleField}
                isInvalid={!!errors.baseURL}
                disabled={baseOverride}
                size="sm"
              />
              <Form.Control.Feedback type="invalid">{errors.baseURL}</Form.Control.Feedback>
              <div className="footnote">
                {baseOverride
                  ? "Set by the APP_BASE_URL environment variable; this setting is ignored."
                  : "Requires restart to take effect"}
              </div>
            </SettingsSection>

            {/* Logging */}
            <SettingsSection
              title="Logging"
              tooltip={`Logs are written to ${host?.configDir ?? "/config"}/logs and to the console. Changes apply as soon as you save.`}
              isDarkMode={this.props.isDarkMode}
            >
              <Row className="g-3">
                <Col xs={12} md={4}>
                  <InfoLabel
                    htmlFor="logLevel"
                    tip={
                      <>
                        Info: what Lumunarr did (webhooks received, scenes recalled, errors).
                        <br />
                        <br />
                        Debug: also why it did or didn't act (e.g. why a profile didn't match a webhook), every API
                        request, and details of Hue/Plex lookups. Use this when troubleshooting.
                      </>
                    }
                  >
                    Log Level
                  </InfoLabel>
                  <Form.Select
                    value={this.state.logLevel}
                    id="logLevel"
                    name="logLevel"
                    onChange={this.handleField}
                    size="sm"
                  >
                    <option value="0">Info</option>
                    <option value="1">Debug</option>
                  </Form.Select>
                </Col>
                <Col xs={6} md={4}>
                  <InfoLabel
                    htmlFor="logSize"
                    tip="Maximum size of a log file before a new one is started. Default is 10 MB."
                  >
                    Max File Size (MB)
                  </InfoLabel>
                  <Form.Control
                    type="number"
                    min={1}
                    max={100}
                    value={this.state.logSize}
                    id="logSize"
                    name="logSize"
                    onChange={this.handleField}
                    isInvalid={!!errors.logSize}
                    size="sm"
                  />
                  <Form.Control.Feedback type="invalid">{errors.logSize}</Form.Control.Feedback>
                </Col>
                <Col xs={6} md={4}>
                  <InfoLabel
                    htmlFor="logFiles"
                    tip="How many log files to keep. A new file starts each day or when the size limit is reached; the oldest are deleted. Default is 5."
                  >
                    Files to Keep
                  </InfoLabel>
                  <Form.Control
                    type="number"
                    min={1}
                    max={60}
                    value={this.state.logFiles}
                    id="logFiles"
                    name="logFiles"
                    onChange={this.handleField}
                    isInvalid={!!errors.logFiles}
                    size="sm"
                  />
                  <Form.Control.Feedback type="invalid">{errors.logFiles}</Form.Control.Feedback>
                </Col>
              </Row>
            </SettingsSection>

            {/* Save */}
            <Button type="submit" variant="secondary" disabled={Object.keys(errors).length > 0}>
              {this.state.isEdit ? "Update" : "Save"}
            </Button>
            {this.state.isSaved && (
              <i className="conf-text">&nbsp; Settings {this.state.isEdit ? "updated" : "saved"}. </i>
            )}
            {this.state.error && <i className="error-text">&nbsp; {this.state.error}</i>}
            {this.hostNeedsRestart() && (
              <div className="footnote mt-2">
                Restart Lumunarr to apply the new host settings. Afterwards, open it at the new port/URL base.
              </div>
            )}
            <div className="div-seperator" />
          </Form>
        </Row>
      </>
    );
  }
}
