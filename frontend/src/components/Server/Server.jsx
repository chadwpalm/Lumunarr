import { Component } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Loading from "../../images/loading-gif.gif";
import SettingsSection from "../SettingsSection/SettingsSection";
import { InfoLabel, ScheduleFields, SliderField } from "../Common/FormFields";
import { SCHEDULE_TIP } from "../Common/tips";
import "./Server.css";

// The two server alerts. Each has its own room/light/behavior/color/brightness/intervals,
// stored as e.g. lightPlay / lightNew in settings.server.
const ALERTS = [
  {
    suffix: "Play",
    title: "Playback Started",
    tip: "This lets a light be used to alert the server admin that someone has started watching a stream.",
  },
  {
    suffix: "New",
    title: "Library New",
    tip: "This lets a light be used to alert the server admin that new media has been added to the server.",
  },
];

const COLORS = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple", "White"];

const BEHAVIOR_TIP = (
  <>
    Select behavior for the light. This could be to turn the light on, or make it blink.
    <br />
    <br />
    Turn On: If the light is already on, the "turn on" function will just change the color and brightness.
    <br />
    Blink: Blink will go the set amount of intervals set and return to the state it was at before the blinking.
  </>
);

export default class Server extends Component {
  constructor(props) {
    super(props);
    const sv = this.props.settings.server;
    if (sv) {
      this.state = {
        roomPlay: sv.roomPlay,
        lightPlay: String(sv.lightPlay),
        behaviorPlay: String(sv.behaviorPlay),
        colorPlay: String(sv.colorPlay),
        brightnessPlay: String(sv.brightnessPlay),
        intervalsPlay: String(sv.intervalsPlay),
        roomNew: sv.roomNew,
        lightNew: String(sv.lightNew),
        behaviorNew: String(sv.behaviorNew),
        colorNew: String(sv.colorNew),
        brightnessNew: String(sv.brightnessNew),
        intervalsNew: String(sv.intervalsNew),
        roomIdPlay: sv.roomIdPlay,
        roomIdNew: sv.roomIdNew,
        scheduleType: sv.scheduleType ?? "0",
        startHour: sv.startHour ?? "1",
        startMin: sv.startMin ?? "0",
        startMed: sv.startMed ?? "1",
        endHour: sv.endHour ?? "1",
        endMin: sv.endMin ?? "0",
        endMed: sv.endMed ?? "1",
        isEdit: true,
      };
    } else {
      this.state = {
        roomPlay: "-1",
        lightPlay: "-1",
        behaviorPlay: "-1",
        colorPlay: "-1",
        brightnessPlay: "5",
        intervalsPlay: "1",
        roomNew: "-1",
        lightNew: "-1",
        behaviorNew: "-1",
        colorNew: "-1",
        brightnessNew: "5",
        intervalsNew: "1",
        roomIdPlay: "",
        roomIdNew: "",
        scheduleType: "0",
        startHour: "1",
        startMin: "0",
        startMed: "1",
        endHour: "1",
        endMin: "0",
        endMed: "1",
        isEdit: false,
      };
    }
    Object.assign(this.state, {
      groupsList: [],
      lightList: [],
      roomLightListPlay: [],
      roomLightListNew: [],
      isLoading: true,
      isError: false,
      isIncomplete: false,
      errorRes: "",
      isOffPlay: false,
      isOffNew: false,
      isSaved: false,
    });
  }

  componentDidMount() {
    var settings = { ...this.props.settings };

    if (settings.server) {
      if (String(settings.server.lightPlay) === "-2") this.setState({ isOffPlay: true });
      if (String(settings.server.lightNew) === "-2") this.setState({ isOffNew: true });
    }

    var xhr = new XMLHttpRequest();
    xhr.timeout = 10000;
    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var json = JSON.parse(xhr.responseText);
          const [lights, groups] = json;
          const update = { lightList: lights, groupsList: groups, isLoading: false };

          for (const { suffix } of ALERTS) {
            let room = this.state[`room${suffix}`];
            // Older settings only stored the light; work out its room
            if (this.props.settings.server && room === undefined) {
              const light = this.state[`light${suffix}`];
              if (light !== "-2" && light !== "-3") {
                room = lights.find(({ Id }) => Id === light)?.Room ?? "-1";
                update[`roomId${suffix}`] = groups.find(({ Room }) => Room === room)?.Id ?? "";
              } else {
                room = "-1";
                update[`roomId${suffix}`] = "";
              }
              update[`room${suffix}`] = room;
            }
            update[`roomLightList${suffix}`] = lights.filter((light) => light.Room === room);
          }
          this.setState(update);
        } else {
          this.setState({ isError: true, errorRes: xhr.responseText });
        }
      }
    });
    xhr.open("POST", "backend/server", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(settings));
  }

  isAlertIncomplete(suffix) {
    if (this.state[`isOff${suffix}`]) return false;
    const s = (k) => this.state[`${k}${suffix}`];
    return (
      s("light") === "-1" ||
      s("behavior") === "-1" ||
      s("color") === "-1" ||
      s("brightness") === "-1" ||
      (s("intervals") === "-1" && s("behavior") === "2")
    );
  }

  handleFormSubmit = (e) => {
    e.preventDefault();

    if (ALERTS.some(({ suffix }) => this.isAlertIncomplete(suffix))) {
      this.setState({ isIncomplete: true });
      return;
    }

    if (!this.props.settings.server) this.props.settings.server = {};
    const server = this.props.settings.server;

    for (const key of [
      "roomPlay",
      "roomIdPlay",
      "roomNew",
      "roomIdNew",
      "lightPlay",
      "behaviorPlay",
      "colorPlay",
      "brightnessPlay",
      "intervalsPlay",
      "lightNew",
      "behaviorNew",
      "colorNew",
      "brightnessNew",
      "intervalsNew",
      "scheduleType",
      "startHour",
      "startMin",
      "startMed",
      "endHour",
      "endMin",
      "endMed",
    ]) {
      server[key] = this.state[key];
    }

    var xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          this.setState({ isSaved: true });
        } else {
          this.setState({ error: xhr.responseText });
        }
      }
    });
    xhr.open("POST", "backend/save", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(this.props.settings));

    this.setState({ isIncomplete: false, isEdit: true });
  };

  // behavior*, intervals*, color*, brightness*, startHour/Min/Med, endHour/Min/Med
  handleField = (e) => {
    this.setState({ [e.target.name]: e.target.value.toString(), isSaved: false });
  };

  handleRoom = (suffix) => (e) => {
    const room = e.target.value.toString();
    this.setState({
      [`room${suffix}`]: room,
      [`roomId${suffix}`]: this.state.groupsList.find(({ Room }) => Room === room)?.Id,
      [`roomLightList${suffix}`]: this.state.lightList.filter((light) => light.Room === room),
      isSaved: false,
    });
  };

  handleLight = (suffix) => (e) => {
    const light = e.target.value.toString();
    if (light === "-2") {
      this.setState({ [`light${suffix}`]: light, [`isOff${suffix}`]: true, [`room${suffix}`]: "-1", isSaved: false });
    } else {
      this.setState({ [`light${suffix}`]: light, [`isOff${suffix}`]: false, isSaved: false });
    }
  };

  handleSchedule = (e) => {
    this.setState({ scheduleType: e.target.value.toString(), isSaved: false });
  };

  renderAlert({ suffix, title, tip }) {
    const v = (k) => this.state[`${k}${suffix}`];
    const id = (k) => `${k}${suffix}`;
    const isOff = this.state[`isOff${suffix}`];

    return (
      <SettingsSection key={suffix} title={title} tooltip={tip} isDarkMode={this.props.isDarkMode}>
        <Row className="g-3">
          <Col xs={12} md={6}>
            <InfoLabel htmlFor={id("room")} tip="Select the room to be used.">
              Room
            </InfoLabel>
            <Form.Select
              value={v("room")}
              id={id("room")}
              name={id("room")}
              onChange={this.handleRoom(suffix)}
              size="sm"
            >
              <option value="-1">Select Room</option>
              {this.state.groupsList.map((group) => (
                <option key={group.Id} value={group.Room}>
                  {group.Room} ({group.Type})
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={12} md={6}>
            <InfoLabel htmlFor={id("light")} tip="Select the light to be used.">
              Light
            </InfoLabel>
            <Form.Select
              value={v("light")}
              id={id("light")}
              name={id("light")}
              onChange={this.handleLight(suffix)}
              size="sm"
            >
              <option value="-1">Select a Light</option>
              <option value="-2">None</option>
              <option value="-3">All</option>
              {this.state[`roomLightList${suffix}`].map((light) => (
                <option key={light.Id} value={light.Id}>
                  {light.Name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={12} md={6}>
            <InfoLabel htmlFor={id("behavior")} tip={BEHAVIOR_TIP}>
              Behavior
            </InfoLabel>
            <Form.Select
              value={v("behavior")}
              id={id("behavior")}
              name={id("behavior")}
              onChange={this.handleField}
              size="sm"
              disabled={isOff}
            >
              <option value="-1">Select Behavior</option>
              <option value="1">Turn On</option>
              <option value="2">Blink</option>
            </Form.Select>
          </Col>
          <Col xs={12} md={6}>
            <InfoLabel htmlFor={id("color")} tip="Select color for the light.">
              Color
            </InfoLabel>
            <Form.Select
              value={v("color")}
              id={id("color")}
              name={id("color")}
              onChange={this.handleField}
              size="sm"
              disabled={isOff}
            >
              <option value="-1">Select Color</option>
              {COLORS.map((color, i) => (
                <option key={color} value={String(i)}>
                  {color}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={12} md={6}>
            <InfoLabel htmlFor={id("brightness")} tip="Select brightness for the light. Use number from 5% to 100%.">
              Brightness
            </InfoLabel>
            <SliderField
              id={id("brightness")}
              value={v("brightness")}
              min={5}
              max={100}
              step={5}
              display={`${v("brightness")}%`}
              onChange={this.handleField}
              disabled={isOff}
            />
          </Col>
          {v("behavior") === "2" && (
            <Col xs={12} md={6}>
              <InfoLabel htmlFor={id("intervals")} tip="Select number of times the light will blink.">
                Intervals
              </InfoLabel>
              <SliderField
                id={id("intervals")}
                value={v("intervals")}
                min={1}
                max={10}
                step={1}
                display={`${v("intervals")}×`}
                onChange={this.handleField}
                disabled={isOff}
              />
            </Col>
          )}
        </Row>
      </SettingsSection>
    );
  }

  render() {
    if (this.state.isError) {
      return <>{this.state.errorRes}</>;
    }
    if (this.state.isLoading) {
      return (
        <div className="d-flex align-items-center justify-content-center">
          <img src={Loading} width="50" alt="" />
        </div>
      );
    }
    return (
      <>
        <Row>
          <h3>Server</h3>
        </Row>
        <div className="div-seperator" />
        <Row>
          <Form onSubmit={this.handleFormSubmit} className={`form-content ${this.props.isDarkMode ? "dark-mode" : ""}`}>
            {ALERTS.map((alert) => this.renderAlert(alert))}

            <SettingsSection title="Schedule" tooltip={SCHEDULE_TIP} isDarkMode={this.props.isDarkMode}>
              <ScheduleFields
                values={this.state}
                onScheduleChange={this.handleSchedule}
                onTimeChange={this.handleField}
              />
            </SettingsSection>

            <Button type="submit" variant="secondary">
              {this.state.isEdit ? "Update" : "Save"}
            </Button>
            {this.state.isSaved && (
              <i className="conf-text">&nbsp; Settings {this.state.isEdit ? "updated" : "saved"}. </i>
            )}
            {this.state.isIncomplete && <i style={{ color: "#f00" }}>&nbsp; All parameters must be selected </i>}
            {this.state.error && <i style={{ color: "#f00" }}>&nbsp; {this.state.error}</i>}
            <div className="div-seperator" />
          </Form>
        </Row>
      </>
    );
  }
}
