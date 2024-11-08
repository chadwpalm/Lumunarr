import React, { Component } from "react";
import Row from "react-bootstrap/Row";
import Form from "react-bootstrap/Form";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Info from "bootstrap-icons/icons/info-circle.svg";
import Button from "react-bootstrap/Button";
import Loading from "../../images/loading-gif.gif";
import Stack from "react-bootstrap/Stack";
import "./Server.css";

export default class Server extends Component {
  constructor(props) {
    super(props);
    if (this.props.settings.server) {
      this.state = {
        roomPlay: this.props.settings.server.roomPlay,
        lightPlay: this.props.settings.server.lightPlay.toString(),
        behaviorPlay: this.props.settings.server.behaviorPlay.toString(),
        colorPlay: this.props.settings.server.colorPlay.toString(),
        brightnessPlay: this.props.settings.server.brightnessPlay.toString(),
        intervalsPlay: this.props.settings.server.intervalsPlay.toString(),
        roomNew: this.props.settings.server.roomNew,
        lightNew: this.props.settings.server.lightNew.toString(),
        behaviorNew: this.props.settings.server.behaviorNew.toString(),
        colorNew: this.props.settings.server.colorNew.toString(),
        brightnessNew: this.props.settings.server.brightnessNew.toString(),
        intervalsNew: this.props.settings.server.intervalsNew.toString(),
        roomIdPlay: this.props.settings.server.roomIdPlay,
        roomIdNew: this.props.settings.server.roomIdNew,
        scheduleType: this.props.settings.server.scheduleType ?? "0",
        startHour: this.props.settings.server.startHour ?? "1",
        startMin: this.props.settings.server.startMin ?? "0",
        startMed: this.props.settings.server.startMed ?? "1",
        endHour: this.props.settings.server.endHour ?? "1",
        endMin: this.props.settings.server.endMin ?? "0",
        endMed: this.props.settings.server.endMed ?? "1",
        groupsList: [],
        lightList: [],
        roomLightListPlay: [],
        roomLightListNew: [],
        isLoading: true,
        selectIntervalsPlay: false,
        selectIntervalsNew: false,
        isError: false,
        isIncomplete: false,
        errorRes: "",
        isOffPlay: false,
        isOffNew: false,
        isEdit: true,
        isSaved: false,
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
        groupsList: [],
        lightList: [],
        roomLightListPlay: [],
        roomLightListNew: [],
        isLoading: true,
        selectIntervalsPlay: false,
        selectIntervalsNew: false,
        isIncomplete: false,
        errorRes: "",
        isOffPlay: false,
        isOffNew: false,
        isEdit: false,
        isSaved: false,
      };
    }
  }

  componentDidMount() {
    var settings = { ...this.props.settings };

    if (settings.server) {
      if (settings.server.lightPlay.toString() === "-2") {
        this.setState({ isOffPlay: true });
      }

      if (settings.server.lightNew.toString() === "-2") {
        this.setState({ isOffNew: true });
      }
    }

    var xhr = new XMLHttpRequest();
    xhr.timeout = 10000;
    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // request successful
          var response = xhr.responseText,
            json = JSON.parse(response);
          this.setState({ lightList: json[0] });
          this.setState({ groupsList: json[1] });
          this.setState({ isLoading: false });

          if (this.props.settings.server) {
            if (this.state.lightPlay !== "-2" && this.state.lightPlay !== "-3") {
              var roomPlay = json[0].find(({ Id }) => Id === this.state.lightPlay).Room;
              var roomIdPlay = json[1].find(({ Room }) => Room === roomPlay).Id;
            } else {
              roomPlay = "-1";
              roomIdPlay = "";
            }
            if (this.state.lightNew !== "-2" && this.state.lightNew !== "-3") {
              var roomNew = json[0].find(({ Id }) => Id === this.state.lightNew).Room;
              var roomIdNew = json[1].find(({ Room }) => Room === roomNew).Id;
            } else {
              roomNew = "-1";
              roomIdNew = "";
            }
            if (this.state.roomPlay === undefined) this.setState({ roomPlay: roomPlay });
            if (this.state.roomIdPlay === undefined) this.setState({ roomIdPlay: roomIdPlay });
            if (this.state.roomNew === undefined) this.setState({ roomNew: roomNew });
            if (this.state.roomIdNew === undefined) this.setState({ roomIdNew: roomIdNew });
          }

          var tempPlay = [];
          var tempNew = [];
          this.setState({ roomLightListPlay: [] });
          this.setState({ roomLightListNew: [] });
          json[0].forEach((light) => {
            if (this.state.roomPlay === undefined) {
              if (light.Room === roomPlay) tempPlay.push(light);
            } else {
              if (light.Room === this.state.roomPlay) tempPlay.push(light);
            }
          });
          json[0].forEach((light) => {
            if (this.state.roomNew === undefined) {
              if (light.Room === roomNew) tempNew.push(light);
            } else {
              if (light.Room === this.state.roomNew) tempNew.push(light);
            }
          });
          this.setState({ roomLightListPlay: tempPlay });
          this.setState({ roomLightListNew: tempNew });
        } else {
          // error
          this.setState({
            isLoaded: true,
            isError: true,
            errorRes: xhr.responseText,
          });
        }
      }
    });
    xhr.open("POST", "/backend/server", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(settings));
  }

  handleFormSubmit = (e) => {
    e.preventDefault();

    if (!this.state.isOffPlay) {
      if (
        this.state.lightPlay === "-1" ||
        this.state.behaviorPlay === "-1" ||
        this.state.colorPlay === "-1" ||
        this.state.brightnessPlay === "-1" ||
        (this.state.intervalsPlay === "-1" && this.state.behaviorPlay === "2")
      ) {
        this.setState({ isIncomplete: true });
        return;
      }
    }

    if (!this.state.isOffNew) {
      if (
        this.state.lightNew === "-1" ||
        this.state.behaviorNew === "-1" ||
        this.state.colorNew === "-1" ||
        this.state.brightnessNew === "-1" ||
        (this.state.intervalsNew === "-1" && this.state.behaviorNew === "2")
      ) {
        this.setState({ isIncomplete: true });
        return;
      }
    }

    if (!this.props.settings.server) this.props.settings.server = {};

    this.props.settings.server.roomPlay = this.state.roomPlay;
    this.props.settings.server.roomIdPlay = this.state.roomIdPlay;
    this.props.settings.server.roomNew = this.state.roomNew;
    this.props.settings.server.roomIdNew = this.state.roomIdNew;
    this.props.settings.server.lightPlay = this.state.lightPlay;
    this.props.settings.server.behaviorPlay = this.state.behaviorPlay;
    this.props.settings.server.colorPlay = this.state.colorPlay;
    this.props.settings.server.brightnessPlay = this.state.brightnessPlay;
    this.props.settings.server.intervalsPlay = this.state.intervalsPlay;
    this.props.settings.server.lightNew = this.state.lightNew;
    this.props.settings.server.behaviorNew = this.state.behaviorNew;
    this.props.settings.server.colorNew = this.state.colorNew;
    this.props.settings.server.brightnessNew = this.state.brightnessNew;
    this.props.settings.server.intervalsNew = this.state.intervalsNew;
    this.props.settings.server.scheduleType = this.state.scheduleType;
    this.props.settings.server.startHour = this.state.startHour;
    this.props.settings.server.startMin = this.state.startMin;
    this.props.settings.server.startMed = this.state.startMed;
    this.props.settings.server.endHour = this.state.endHour;
    this.props.settings.server.endMin = this.state.endMin;
    this.props.settings.server.endMed = this.state.endMed;

    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          this.setState({ isSaved: true });
        } else {
          // error
          this.setState({
            error: xhr.responseText,
          });
        }
      }
    });

    xhr.open("POST", "/backend/save", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(this.props.settings));

    this.setState({ isIncomplete: false, isEdit: true });
  };

  handleLightPlay = (e) => {
    this.setState({ lightPlay: e.target.value.toString() });
    if (e.target.value.toString() === "-2") {
      this.setState({ isOffPlay: true, roomPlay: "-1", isSaved: false });
    } else {
      this.setState({ isOffPlay: false, isSaved: false });
    }
  };

  handleBehaviorPlay = (e) => {
    this.setState({ behaviorPlay: e.target.value.toString(), isSaved: false });
  };

  handleIntervalsPlay = (e) => {
    this.setState({ intervalsPlay: e.target.value.toString(), isSaved: false });
  };

  handleColorPlay = (e) => {
    this.setState({ colorPlay: e.target.value.toString(), isSaved: false });
  };

  handleBrightnessPlay = (e) => {
    this.setState({ brightnessPlay: e.target.value.toString(), isSaved: false });
  };

  handleRoomPlay = (e) => {
    this.setState({ roomPlay: e.target.value.toString(), isSaved: false });
    var temp = [];
    this.setState({ roomLightListPlay: [] });
    this.state.lightList.forEach((light) => {
      if (light.Room === e.target.value.toString()) temp.push(light);
    });
    var roomIdPlay = this.state.groupsList.find(({ Room }) => Room === e.target.value.toString()).Id;
    this.setState({ roomLightListPlay: temp, roomIdPlay: roomIdPlay });
  };

  handleRoomNew = (e) => {
    this.setState({ roomNew: e.target.value.toString(), isSaved: false });
    var temp = [];
    this.setState({ roomLightListNew: [] });
    this.state.lightList.forEach((light) => {
      if (light.Room === e.target.value.toString()) temp.push(light);
    });
    var roomIdNew = this.state.groupsList.find(({ Room }) => Room === e.target.value.toString()).Id;
    this.setState({ roomLightListNew: temp, roomIdNew: roomIdNew });
  };

  handleLightNew = (e) => {
    this.setState({ lightNew: e.target.value.toString(), isSaved: false });
    if (e.target.value.toString() === "-2") {
      this.setState({ isOffNew: true, roomNew: "-1" });
    } else {
      this.setState({ isOffNew: false });
    }
  };

  handleBehaviorNew = (e) => {
    this.setState({ behaviorNew: e.target.value.toString(), isSaved: false });
  };

  handleIntervalsNew = (e) => {
    this.setState({ intervalsNew: e.target.value.toString(), isSaved: false });
  };

  handleColorNew = (e) => {
    this.setState({ colorNew: e.target.value.toString(), isSaved: false });
  };

  handleBrightnessNew = (e) => {
    this.setState({ brightnessNew: e.target.value.toString(), isSaved: false });
  };

  handleSchedule = (e) => {
    this.setState({ scheduleType: e.target.value.toString() });
  };

  handleTime = (e) => {
    switch (e.target.name) {
      case "startHour":
        this.setState({ startHour: e.target.value.toString() });
        break;
      case "startMin":
        this.setState({ startMin: e.target.value.toString() });
        break;
      case "startMed":
        this.setState({ startMed: e.target.value.toString() });
        break;
      case "endHour":
        this.setState({ endHour: e.target.value.toString() });
        break;
      case "endMin":
        this.setState({ endMin: e.target.value.toString() });
        break;
      case "endMed":
        this.setState({ endMed: e.target.value.toString() });
        break;
    }
  };

  render() {
    if (this.state.isError) {
      return <>{this.state.errorRes}</>;
    } else if (this.state.isLoading) {
      return (
        <div className="d-flex align-items-center justify-content-center">
          <img src={Loading} width="50" />
        </div>
      );
    } else {
      const options = [];
      for (var i = 0; i < 60; i++) {
        options.push(
          <option value={i.toString()}>
            {i.toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false })}
          </option>
        );
      }
      return (
        <>
          <Row>
            <h3>Server</h3>
          </Row>
          <div className="div-seperator" />
          <Row>
            <Form
              onSubmit={this.handleFormSubmit}
              className={`form-content ${this.props.isDarkMode ? "dark-mode" : ""}`}
            >
              <h5>
                Playback Started &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip>
                      This lets a light be used to alert the server admin that someone has started watching a stream.
                    </Tooltip>
                  }
                >
                  <img src={Info} className="image-info" />
                </OverlayTrigger>
              </h5>
              <Form.Label for="roomPlay">
                Room &nbsp;&nbsp;
                <OverlayTrigger placement="right" overlay={<Tooltip>Select the room to be used.</Tooltip>}>
                  <img src={Info} className="image-info" />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.roomPlay}
                id="roomPlay"
                name="roomPlay"
                onChange={this.handleRoomPlay}
                size="sm"
              >
                <option value="-1">Select Room</option>
                {this.state.groupsList.map((group) => (
                  <option value={group.Room}>
                    {group.Room} ({group.Type})
                  </option>
                ))}
              </Form.Select>
              <div className="div-seperator" />
              <Form.Label for="lightPlay">
                Light &nbsp;&nbsp;
                <OverlayTrigger placement="right" overlay={<Tooltip>Select the light to be used.</Tooltip>}>
                  <img src={Info} className="image-info" />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.lightPlay}
                id="lightPlay"
                name="lightPlay"
                onChange={this.handleLightPlay}
                size="sm"
              >
                <option value="-1">Select a Light</option>
                <option value="-2">None</option>
                <option value="-3">All</option>
                {this.state.roomLightListPlay.map((light) => (
                  <option value={light.Id}>{light.Name}</option>
                ))}
              </Form.Select>
              <div className="div-seperator" />
              <Form.Label for="behaviorPlay">
                Behavior &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip>
                      Select behavior for the light. This could be to turn the light on, or make it blink.
                      <br />
                      <br />
                      Turn On: If the light is already on, the "turn on" function will just change the color and
                      brightness.
                      <br />
                      Blink: Blink will go the set amount of intervals set and return to the state it was at before the
                      blinking.
                    </Tooltip>
                  }
                >
                  <img src={Info} className="image-info" />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.behaviorPlay}
                id="behaviorPlay"
                name="behaviorPlay"
                onChange={this.handleBehaviorPlay}
                size="sm"
                disabled={this.state.isOffPlay}
              >
                <option value="-1">Select Behavior</option>
                <option value="1">Turn On</option>
                <option value="2">Blink</option>
              </Form.Select>
              <div className="div-seperator" />
              {this.state.behaviorPlay === "2" ? (
                <>
                  <Form.Label for="intervalsPlay">
                    Intervals &nbsp;&nbsp;
                    <OverlayTrigger
                      placement="right"
                      overlay={<Tooltip>Select number of times the light will blink.</Tooltip>}
                    >
                      <img src={Info} className="image-info" />
                    </OverlayTrigger>
                  </Form.Label>
                  <Stack gap={1} direction="horizontal">
                    <div className="slider-style">{this.state.intervalsPlay}</div>
                    <Form.Range
                      id="intervalsPlay"
                      className="me-auto"
                      value={this.state.intervalsPlay}
                      min={1}
                      max={10}
                      step={1}
                      onChange={this.handleIntervalsPlay}
                      disabled={this.state.isOffPlay}
                    />
                  </Stack>
                  <div className="div-seperator" />
                </>
              ) : (
                <></>
              )}
              <Form.Label for="colorPlay">
                Color &nbsp;&nbsp;
                <OverlayTrigger placement="right" overlay={<Tooltip>Select color for the light.</Tooltip>}>
                  <img src={Info} className="image-info" />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.colorPlay}
                id="colorPlay"
                name="colorPlay"
                onChange={this.handleColorPlay}
                size="sm"
                disabled={this.state.isOffPlay}
              >
                <option value="-1">Select Color</option>
                <option value="0">Red</option>
                <option value="1">Orange</option>
                <option value="2">Yellow</option>
                <option value="3">Green</option>
                <option value="4">Blue</option>
                <option value="5">Purple</option>
                <option value="6">White</option>
              </Form.Select>
              <div className="div-seperator" />
              <Form.Label for="brightnessPlay">
                Brightness &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={<Tooltip>Select brightness for the light. Use number from 5% to 100%.</Tooltip>}
                >
                  <img src={Info} className="image-info" />
                </OverlayTrigger>
              </Form.Label>
              <Stack gap={1} direction="horizontal">
                <div className="slider-style">{this.state.brightnessPlay}%</div>
                <Form.Range
                  id="brightnessPlay"
                  className="me-auto"
                  value={this.state.brightnessPlay}
                  min={5}
                  max={100}
                  step={5}
                  onChange={this.handleBrightnessPlay}
                  disabled={this.state.isOffPlay}
                />
              </Stack>
              <div style={{ paddingBottom: "1.5rem" }} />
              <h5>
                Library New &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip>
                      This lets a light be used to alert the server admin that new media has been added to the server.
                    </Tooltip>
                  }
                >
                  <img src={Info} className="image-info" />
                </OverlayTrigger>
              </h5>
              <Form.Label for="roomNew">
                Room &nbsp;&nbsp;
                <OverlayTrigger placement="right" overlay={<Tooltip>Select the room to be used.</Tooltip>}>
                  <img src={Info} className="image-info" />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.roomNew}
                id="roomNew"
                name="roomNew"
                onChange={this.handleRoomNew}
                size="sm"
              >
                <option value="-1">Select Room</option>
                {this.state.groupsList.map((group) => (
                  <option value={group.Room}>
                    {group.Room} ({group.Type})
                  </option>
                ))}
              </Form.Select>
              <div className="div-seperator" />
              <Form.Label for="lightNew">
                Light &nbsp;&nbsp;
                <OverlayTrigger placement="right" overlay={<Tooltip>Select the light to be used.</Tooltip>}>
                  <img src={Info} className="image-info" />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.lightNew}
                id="lightNew"
                name="lightNew"
                onChange={this.handleLightNew}
                size="sm"
              >
                <option value="-1">Select a Light</option>
                <option value="-2">None</option>
                <option value="-3">All</option>
                {this.state.roomLightListNew.map((light) => (
                  <option value={light.Id}>{light.Name}</option>
                ))}
              </Form.Select>
              <div className="div-seperator" />
              <Form.Label for="behaviorNew">
                Behavior &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip>
                      Select behavior for the light. This could be to turn the light on, or make it blink.
                      <br />
                      <br />
                      Turn On: If the light is already on, the "turn on" function will just change the color and
                      brightness.
                      <br />
                      Blink: Blink will go the set amount of intervals set and return to the state it was at before the
                      blinking.
                    </Tooltip>
                  }
                >
                  <img src={Info} className="image-info" />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.behaviorNew}
                id="behaviorNew"
                name="behaviorNew"
                onChange={this.handleBehaviorNew}
                size="sm"
                disabled={this.state.isOffNew}
              >
                <option value="-1">Select Behavior</option>
                <option value="1">Turn On</option>
                <option value="2">Blink</option>
              </Form.Select>
              <div className="div-seperator" />
              {this.state.behaviorNew === "2" ? (
                <>
                  <Form.Label for="intervalsNew">
                    Intervals &nbsp;&nbsp;
                    <OverlayTrigger
                      placement="right"
                      overlay={<Tooltip>Select number of times the light will blink.</Tooltip>}
                    >
                      <img src={Info} className="image-info" />
                    </OverlayTrigger>
                  </Form.Label>
                  <Stack gap={1} direction="horizontal">
                    <div className="slider-style">{this.state.intervalsNew}</div>
                    <Form.Range
                      id="intervalsNew"
                      className="me-auto"
                      value={this.state.intervalsNew}
                      min={1}
                      max={10}
                      step={1}
                      onChange={this.handleIntervalsNew}
                    />
                  </Stack>
                  <div className="div-seperator" />
                </>
              ) : (
                <></>
              )}
              <Form.Label for="colorNew">
                Color &nbsp;&nbsp;
                <OverlayTrigger placement="right" overlay={<Tooltip>Select color for the light.</Tooltip>}>
                  <img src={Info} className="image-info" />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.colorNew}
                id="colorNew"
                name="colorNew"
                onChange={this.handleColorNew}
                size="sm"
                disabled={this.state.isOffNew}
              >
                <option value="-1">Select Color</option>
                <option value="0">Red</option>
                <option value="1">Orange</option>
                <option value="2">Yellow</option>
                <option value="3">Green</option>
                <option value="4">Blue</option>
                <option value="5">Purple</option>
                <option value="6">White</option>
              </Form.Select>
              <div className="div-seperator" />
              <Form.Label for="brightnessNew">
                Brightness &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={<Tooltip>Select brightness for the light. Use number from 5% to 100%.</Tooltip>}
                >
                  <img src={Info} className="image-info" />
                </OverlayTrigger>
              </Form.Label>
              <Stack gap={1} direction="horizontal">
                <div className="slider-style">{this.state.brightnessNew}%</div>
                <Form.Range
                  id="brightnessNew"
                  className="me-auto"
                  value={this.state.brightnessNew}
                  min={5}
                  max={100}
                  step={5}
                  onChange={this.handleBrightnessNew}
                  disabled={this.state.isOffNew}
                />
              </Stack>
              <div className="div-seperator" />
              {/* Schedule */}
              <Form.Label for="schedule">
                Schedule &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip>
                      Add a schedule for when the triggers will be active.
                      <br />
                      <br />
                      None: There will be no schedule. Profiles will be active based on the switch located on the
                      profile tile.
                      <br />
                      <br />
                      Global: Use the global setting for schedules.
                      <br />
                      <br />
                      Range: The schedule will be based on a time range daily.
                      <br />
                      <br />
                      Sunset/Sunrise: The active schedule will be between sunset and sunrise. In order for this to work
                      a Latitude and Longitude must be set in the Settings tab. If using Docker the timezone environment
                      variable must also be set.
                    </Tooltip>
                  }
                >
                  <img src={Info} className="image-info" alt="Schedule" />
                </OverlayTrigger>
              </Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  label="None"
                  value="0"
                  id="schedule"
                  name="schedule"
                  onChange={this.handleSchedule}
                  size="sm"
                  checked={this.state.scheduleType === "0"}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="Global"
                  value="3"
                  id="schedule"
                  name="schedule"
                  onChange={this.handleSchedule}
                  size="sm"
                  checked={this.state.scheduleType === "3"}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="Range"
                  value="1"
                  id="schedule"
                  name="schedule"
                  onChange={this.handleSchedule}
                  size="sm"
                  checked={this.state.scheduleType === "1"}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="Sunset/Sunrise"
                  value="2"
                  id="schedule"
                  name="schedule"
                  onChange={this.handleSchedule}
                  size="sm"
                  checked={this.state.scheduleType === "2"}
                />
              </div>
              <div className="div-seperator" />
              {this.state.scheduleType === "1" ? (
                <>
                  <Stack gap={1} direction="horizontal">
                    Start:&nbsp;&nbsp;
                    <Form.Select
                      value={this.state.startHour}
                      id="startHour"
                      name="startHour"
                      onChange={this.handleTime}
                      size="sm"
                      className="sched-style"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                      <option value="11">11</option>
                      <option value="12">12</option>
                    </Form.Select>
                    <Form.Select
                      value={this.state.startMin}
                      id="startMin"
                      name="startMin"
                      onChange={this.handleTime}
                      size="sm"
                      className="sched-style"
                    >
                      {options}
                    </Form.Select>
                    <Form.Select
                      value={this.state.startMed}
                      id="startMed"
                      name="startMed"
                      onChange={this.handleTime}
                      size="sm"
                      className="sched-style"
                    >
                      <option value="1">AM</option>
                      <option value="2">PM</option>
                    </Form.Select>
                  </Stack>
                  <div className="div-seperator" />
                  <Stack gap={1} direction="horizontal">
                    End:&nbsp;&nbsp;&nbsp;&nbsp;
                    <Form.Select
                      value={this.state.endHour}
                      id="endHour"
                      name="endHour"
                      onChange={this.handleTime}
                      size="sm"
                      className="sched-style"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                      <option value="11">11</option>
                      <option value="12">12</option>
                    </Form.Select>
                    <Form.Select
                      value={this.state.endMin}
                      id="endMin"
                      name="endMin"
                      onChange={this.handleTime}
                      size="sm"
                      className="sched-style"
                    >
                      {options}
                    </Form.Select>
                    <Form.Select
                      value={this.state.endMed}
                      id="endMed"
                      name="endMed"
                      onChange={this.handleTime}
                      size="sm"
                      className="sched-style"
                    >
                      <option value="1">AM</option>
                      <option value="2">PM</option>
                    </Form.Select>
                  </Stack>
                  <div className="div-seperator" />
                </>
              ) : (
                <></>
              )}
              <div className="div-seperator" />
              {/* Cancel/Save */}
              {this.state.isEdit ? (
                <>
                  <Button type="submit" variant="secondary">
                    Update
                  </Button>
                  {this.state.isSaved ? <i className="conf-text">&nbsp; Settings Updated. </i> : <></>}
                </>
              ) : (
                <>
                  <Button type="submit" variant="secondary">
                    Save
                  </Button>
                  {this.state.isSaved ? <i className="conf-text">&nbsp; Settings saved. </i> : <></>}
                </>
              )}
              {this.state.isIncomplete ? (
                <i style={{ color: "#f00" }}>&nbsp; All parameters must be selected </i>
              ) : (
                <></>
              )}
              <div className="div-seperator" />
            </Form>
          </Row>
        </>
      );
    }
  }
}
