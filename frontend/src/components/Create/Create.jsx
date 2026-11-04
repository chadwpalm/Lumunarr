import { Component } from "react";
import Loading from "../../images/loading-gif.gif";
import { v4 as uuid } from "uuid";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import SettingsSection from "../SettingsSection/SettingsSection";
import { InfoLabel, ScheduleFields, SliderField } from "../Common/FormFields";
import { SCHEDULE_TIP, TRANSITION_TIP } from "../Common/tips";
import EventAction from "./EventAction";
import "./Create.css";

// Plex events a profile reacts to, in display order. Saved per event (e.g. for "pause"):
// pause (scene), pauseBright, pauseNum, pauseLight, and pauseDelayMs when it has a delay.
// sceneKey is the state key for the chosen scene (scrobble's is just "scrobble").
const EVENTS = [
  {
    key: "play",
    label: "Play",
    sceneKey: "playScene",
    tip: 'This is the Hue scene that will activate when media is played (From a stopped state). Select "None" if you don\'t want any action to happen.',
  },
  {
    key: "stop",
    label: "Stop",
    sceneKey: "stopScene",
    restorePrePlay: true,
    tip: 'This is the Hue scene that will activate when media is stopped. Select "None" if you don\'t want any action to happen.',
  },
  {
    key: "pause",
    label: "Pause",
    sceneKey: "pauseScene",
    restorePrePlay: true,
    tip: 'This is the Hue scene that will activate when media is paused. Select "None" if you don\'t want any action to happen.',
    delay: {
      key: "pauseDelayMs",
      max: 5000,
      tip: (
        <>
          This will delay the pause action after receiving the webhook for the selected amount of time unless a resume
          action happens before the delay time has expired. This delay is intended for users using Plex clients that
          send out a pause webhook when using the seek feature.
          <br />
          <br />
          Be aware that this will also delay normal pause actions. It is advised to try and find a delay time that will
          satisfy the seek issue but not take too long on normal pauses.
        </>
      ),
    },
  },
  {
    key: "resume",
    label: "Resume",
    sceneKey: "resumeScene",
    tip: 'This is the Hue scene that will activate when media is resumed from a paused state. Select "None" if you don\'t want any action to happen.',
  },
  {
    key: "scrobble",
    label: "Scrobble",
    sceneKey: "scrobble",
    tip: (
      <>
        This is the Hue scene that will activate when media is scrobbled. Select "None" if you don't want any action to
        happen.
        <br />
        <br />
        In Plex, "scrobble" is the time when the media you are watching is considered "played". By default, this time
        is set at the 90% mark of a video, but can be changed in the Plex Media Server's settings.
        <br />
        <br />
        As of version 1.31 of the Plex Media Server, scrobble can be set at end credits marker points. This is good if
        you want your lights to react when credits start rolling.
      </>
    ),
    delay: {
      key: "scrobbleDelayMs",
      max: 15000,
      tip: "Plex tends to send the scrobble event a second or two before the credits start rolling. You can use this to delay the effect by a few seconds.",
    },
  },
];

export default class Create extends Component {
  constructor(props) {
    super(props);

    const lists = {
      groupsList: [],
      userList: [],
      clientList: [],
      sceneList: [],
      roomSceneList: [],
      libraryList: [],
      lightList: [],
      isLoading: true,
      isIncomplete: false,
      isError: false,
      show: false,
      show2: false,
      errorRes: [],
    };

    if (this.props.isEdit) {
      var info = this.props.settings.clients.find(({ uid }) => uid === this.props.uid.toString());

      this.state = {
        uid: info.uid,
        title: info.client.title ?? info.client.name,
        clientName: info.client.name,
        clientId: info.client.id,
        userName: info.user.name,
        userId: info.user.id,
        media: info.media,
        library: info.library ?? "All",
        server: info.server ?? "-1",
        lightsOff: info.lightsOff ?? false,
        room: info.room,
        playScene: info.play,
        playBright: info.playBright ?? 25,
        playNum: info.playNum ?? 1,
        playLight: info.playLight ?? "-1",
        pauseScene: info.pause,
        pauseBright: info.pauseBright ?? 25,
        pauseNum: info.pauseNum ?? 1,
        pauseLight: info.pauseLight ?? "-1",
        pauseDelayMs: info.pauseDelayMs ?? 0,
        stopScene: info.stop,
        stopBright: info.stopBright ?? 25,
        stopNum: info.stopNum ?? 1,
        stopLight: info.stopLight ?? "-1",
        resumeScene: info.resume,
        resumeBright: info.resumeBright ?? 25,
        resumeNum: info.resumeNum ?? 1,
        resumeLight: info.resumeLight ?? "-1",
        scrobble: info.scrobble,
        scrobbleBright: info.scrobbleBright ?? 25,
        scrobbleNum: info.scrobbleNum ?? 1,
        scrobbleLight: info.scrobbleLight ?? "-1",
        scrobbleDelayMs: info.scrobbleDelayMs ?? 0,
        scheduleType: info.scheduleType ?? "0",
        startHour: info.startHour ?? "1",
        startMin: info.startMin ?? "0",
        startMed: info.startMed ?? "1",
        endHour: info.endHour ?? "1",
        endMin: info.endMin ?? "0",
        endMed: info.endMed ?? "1",
        transitionType: info.transitionType ?? "1",
        transition: info.transition ?? "0",
        active: info.active,
        ...lists,
      };
    } else {
      this.state = {
        title: "",
        clientName: "",
        clientId: "-1",
        userName: "",
        userId: "-1",
        media: "-1",
        library: "-1",
        server: "-1",
        lightsOff: false,
        room: "-1",
        playScene: "-1",
        playBright: 25,
        playNum: 1,
        playLight: "-1",
        pauseScene: "-1",
        pauseBright: 25,
        pauseNum: 1,
        pauseLight: "-1",
        pauseDelayMs: 0,
        stopScene: "-1",
        stopBright: 25,
        stopNum: 1,
        stopLight: "-1",
        resumeScene: "-1",
        resumeBright: 25,
        resumeNum: 1,
        resumeLight: "-1",
        scrobble: "-1",
        scrobbleBright: 25,
        scrobbleNum: 1,
        scrobbleLight: "-1",
        scrobbleDelayMs: 0,
        scheduleType: "0",
        startHour: "1",
        startMin: "0",
        startMed: "1",
        endHour: "1",
        endMin: "0",
        endMed: "1",
        transitionType: "1",
        transition: "0",
        active: true,
        ...lists,
      };
    }
  }

  componentDidMount() {
    var settings = { ...this.props.settings };

    var xhr = new XMLHttpRequest();
    xhr.timeout = 30000;
    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var json = JSON.parse(xhr.responseText);
          this.setState({
            userList: json[0],
            clientList: json[1],
            sceneList: json[2],
            groupsList: json[3],
            libraryList: json[4],
            roomSceneList: json[2].filter((scene) => scene.Room === this.state.room),
            isLoading: false,
          });
          this.getLights(this.state.room);
        } else if (xhr.status === 401) {
          this.props.logout();
        } else {
          this.setState({ isError: true, errorRes: JSON.parse(xhr.responseText) });
        }
      }
    });
    xhr.open("POST", "backend/client", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(settings));
  }

  handleFormSubmit = (e) => {
    e.preventDefault();

    this.setState({ isIncomplete: false });

    if (
      this.state.title === "" ||
      this.state.clientId === "-1" ||
      this.state.userId === "-1" ||
      this.state.media === "-1" ||
      this.state.room === "-1" ||
      EVENTS.some(({ sceneKey }) => this.state[sceneKey] === "-1") ||
      (this.state.library === "-1" && this.state.media !== "All")
    ) {
      this.setState({ isIncomplete: true });
      return;
    }

    var settings = { ...this.props.settings };

    if (!settings.clients) settings.clients = [];

    var temp = {};

    temp.uid = this.props.isEdit ? this.state.uid : uuid().toString();
    temp.client = {};
    temp.client.title = this.state.title;
    temp.client.id = this.state.clientId;
    temp.client.name = this.state.clientName;
    temp.user = {};
    temp.user.id = this.state.userId;
    temp.user.name = this.state.userName;
    temp.media = this.state.media;
    temp.library = this.state.library;
    temp.server = this.state.server;
    temp.room = this.state.room;
    for (const { key, sceneKey, delay } of EVENTS) {
      temp[key] = this.state[sceneKey];
      temp[`${key}Bright`] = this.state[`${key}Bright`];
      temp[`${key}Num`] = this.state[`${key}Num`];
      temp[`${key}Light`] = this.state[`${key}Light`];
      if (delay) temp[delay.key] = this.state[delay.key];
    }
    temp.scheduleType = this.state.scheduleType;
    temp.startHour = this.state.startHour;
    temp.startMin = this.state.startMin;
    temp.startMed = this.state.startMed;
    temp.endHour = this.state.endHour;
    temp.endMin = this.state.endMin;
    temp.endMed = this.state.endMed;
    temp.transitionType = this.state.transitionType;
    temp.transition = this.state.transition;
    temp.active = this.state.active;
    temp.lightsOff = this.state.lightsOff;

    if (this.props.isEdit) {
      const index = settings.clients.findIndex(({ uid }) => uid === this.state.uid);
      settings.clients.splice(index, 1, temp);
    } else {
      settings.clients.push(temp);
    }

    var xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4 && xhr.status !== 200) {
        this.setState({ error: xhr.responseText });
      }
    });
    xhr.open("POST", "backend/save", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(settings));

    this.props.saved();
  };

  relativeTime(stamp) {
    var time = Math.floor(new Date().getTime() / 1000.0) - stamp;
    if (time < 60) return "Less than a minute ago";
    if (time < 3600) return Math.round(time / 60).toString() + " minutes ago";
    if (time < 86400) return Math.round(time / 3600).toString() + " hours ago";
    if (time < 2592000) return Math.round(time / 86400).toString() + " days ago";
    if (time < 31536000) return Math.round(time / 2592000).toString() + " months ago";
    return Math.round(time / 31536000).toString() + " years ago";
  }

  getLights(room) {
    var settings = { ...this.props.settings };

    var xhr = new XMLHttpRequest();
    xhr.timeout = 10000;
    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var json = JSON.parse(xhr.responseText);
          this.setState({ lightList: json[0].filter((light) => light.Room === room) });
        } else {
          this.setState({ isError: true, errorRes: [xhr.responseText] });
        }
      }
    });
    xhr.open("POST", "backend/server", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(settings));
  }

  // Generic setter used by the event rows and simple fields. Callers pass the value in the type it is saved as.
  setField = (key, value) => this.setState({ [key]: value });

  // title, transitionType, transition, startHour/Min/Med, endHour/Min/Med
  handleField = (e) => this.setState({ [e.target.name]: e.target.value.toString() });

  handleClient = (e) => {
    if (e.target.value === "-1") {
      this.setState({ clientId: "-1", clientName: "" });
    } else {
      var result = this.state.clientList.find(
        ({ _attributes }) => _attributes.clientIdentifier === e.target.value.toString(),
      );
      this.setState({
        clientId: e.target.value.toString(),
        clientName: result._attributes.name + " (" + result._attributes.platform + ")",
      });
    }
  };

  handleUser = (e) => {
    if (e.target.value === "-1") {
      this.setState({ userId: "-1", userName: "" });
    } else if (e.target.value === "Any") {
      this.setState({ userId: "Any", userName: "Any", show: true });
    } else {
      var result = this.state.userList.find(({ _attributes }) => _attributes.id.toString() === e.target.value);
      this.setState({ userId: e.target.value.toString(), userName: result._attributes.title });
    }
  };

  handleMedia = (e) => {
    if (e.target.value === "All") this.setState({ show: true });
    this.setState({ media: e.target.value.toString() });
  };

  handleLibrary = (e) => {
    const [title, server] = e.target.value.split("|");
    this.setState({ library: title, server: server });
  };

  handleRoom = (e) => {
    const room = e.target.value.toString();
    this.setState({ room, roomSceneList: this.state.sceneList.filter((scene) => scene.Room === room) });
    this.getLights(room);
  };

  handleSchedule = (e) => this.setState({ scheduleType: e.target.value.toString() });

  handleClose = () => this.setState({ show: false, show2: false });

  handleLightsOff = (e) => this.setState({ lightsOff: e.target.checked });

  renderProfile() {
    const showLibrary = this.state.media === "movie" || this.state.media === "show";
    return (
      <SettingsSection title="Profile" isDarkMode={this.props.isDarkMode}>
        <Row className="g-3">
          <Col xs={12}>
            <InfoLabel
              htmlFor="title"
              tip="Enter the title of the Client profile. Will default to the Client's name if left blank."
            >
              Title
            </InfoLabel>
            <Form.Control value={this.state.title} id="title" name="title" onChange={this.handleField} size="sm" />
          </Col>
          <Col xs={12} md={6}>
            <InfoLabel
              htmlFor="client"
              tip="This is the Plex client that will control the Hue scenes. Clients are ordered top-down from most recently used to last used."
            >
              Client
            </InfoLabel>
            <Form.Select value={this.state.clientId} id="client" name="client" onChange={this.handleClient} size="sm">
              <option value="-1">Select a Client</option>
              {this.state.clientList
                .filter((client) => client._attributes.provides !== "server")
                .map(({ _attributes: c }) => (
                  <option key={c.clientIdentifier} value={c.clientIdentifier}>
                    {c.name} ({c.platform}) {"  -  "} {c.product}
                    {", version: "}
                    {c.productVersion} ({c.device}){" - created: "}
                    {this.relativeTime(c.createdAt)}
                  </option>
                ))}
            </Form.Select>
          </Col>
          <Col xs={12} md={6}>
            <InfoLabel
              htmlFor="user"
              tip={
                <>
                  This is the Plex user that will control the Hue scenes. Chosing "Any" will allow any user to control
                  the Hue scenes from that client.
                  <br />
                  <br />
                  This option is meant to be used when the client is set up with multiple Plex Home users. If Plex Home
                  is not set up, then you should use the user that is logged into that client (or use "Any").
                </>
              }
            >
              User
            </InfoLabel>
            <Form.Select value={this.state.userId} id="user" name="user" onChange={this.handleUser} size="sm">
              <option value="-1">Select a User</option>
              <option value="Any">Any</option>
              {this.state.userList.map(({ _attributes: u }) => (
                <option key={u.id} value={u.id}>
                  {u.title} ({u.username === "" ? "Plex Home" : u.username})
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={12} md={6}>
            <InfoLabel
              htmlFor="media"
              tip='This is the media type that you want to control Hue scenes from. Select "All" if you want scenes to activate for any media type.'
            >
              Media Type
            </InfoLabel>
            <Form.Select value={this.state.media} id="media" name="media" onChange={this.handleMedia} size="sm">
              <option value="-1">Select Media Type</option>
              <option value="All">All</option>
              <option value="movie">Movie</option>
              <option value="show">TV Show</option>
              <option value="cinemaTrailer">Trailer/Preroll</option>
            </Form.Select>
          </Col>
          {showLibrary && (
            <Col xs={12} md={6}>
              <InfoLabel
                htmlFor="library"
                tip='This is the library that you want to control Hue scenes from. Select "All" if you want scenes to activate for any library of the selected media type.'
              >
                Library
              </InfoLabel>
              <Form.Select
                value={this.state.library && this.state.server ? `${this.state.library}|${this.state.server}` : ""}
                id="library"
                name="library"
                onChange={this.handleLibrary}
                size="sm"
              >
                <option value="-1|-1">Select Library</option>
                <option value="All|-1">All</option>
                {this.state.libraryList
                  .filter((library) => ["movie", "show"].includes(library.type) && library.type === this.state.media)
                  .map((library) => (
                    <option key={`${library.title}|${library.server}`} value={`${library.title}|${library.server}`}>
                      {library.title} ({library.server})
                    </option>
                  ))}
              </Form.Select>
            </Col>
          )}
          <Col xs={12} md={6}>
            <InfoLabel htmlFor="room" tip="This is the room/group of lights you want to use.">
              Room
            </InfoLabel>
            <Form.Select value={this.state.room} id="room" name="room" onChange={this.handleRoom} size="sm">
              <option value="-1">Select Room</option>
              {this.state.groupsList.map((group) => (
                <option key={group.Id ?? group.Room} value={group.Room}>
                  {group.Room} ({group.Type})
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={12}>
            <div className="d-flex align-items-center">
              <Form.Check
                type="checkbox"
                id="lightsOff"
                name="lightsOff"
                label="Ignore triggers if lights in room are off"
                onChange={this.handleLightsOff}
                checked={this.state.lightsOff}
              />
              <InfoLabel
                className="mb-0"
                tip={
                  <>
                    If this is checked, the Play, Stop, Pause, and Resume triggers will not work if all of the lights in
                    the selected room are off. Be aware, if any of your triggers turn the lights off, Lumunarr will not
                    turn them back on unless this is unchecked or you manually turn them on.
                    <br />
                    <br />
                    Schedules are still in effect regardless of this setting.
                  </>
                }
              />
            </div>
          </Col>
        </Row>
      </SettingsSection>
    );
  }

  renderActions() {
    const allowPoster = this.state.media !== "cinemaTrailer" && this.state.media !== "All";
    return (
      <SettingsSection
        title="Actions"
        tooltip="The Hue scene to run for each Plex event. Scenes come from the room selected above."
        isDarkMode={this.props.isDarkMode}
      >
        {EVENTS.map((event) => (
          <EventAction
            key={event.key}
            event={event}
            values={this.state}
            onChange={this.setField}
            sceneList={this.state.roomSceneList}
            lightList={this.state.lightList}
            allowPoster={allowPoster}
          />
        ))}
      </SettingsSection>
    );
  }

  renderTiming() {
    return (
      <SettingsSection title="Timing" isDarkMode={this.props.isDarkMode}>
        <InfoLabel tip={TRANSITION_TIP}>Scene Transition Time (s)</InfoLabel>
        <div className="mb-2">
          {[
            ["1", "Local"],
            ["2", "Global"],
          ].map(([value, label]) => (
            <Form.Check
              key={value}
              inline
              type="radio"
              label={label}
              value={value}
              id={`transitionType-${value}`}
              name="transitionType"
              onChange={this.handleField}
              checked={this.state.transitionType === value}
            />
          ))}
        </div>
        {this.state.transitionType === "1" && (
          <div className="mb-3">
            <SliderField
              id="transition"
              value={this.state.transition}
              min={0}
              max={10}
              step={0.2}
              display={this.state.transition === "0" ? "Default" : `${this.state.transition} s`}
              onChange={this.handleField}
            />
          </div>
        )}
        <InfoLabel tip={SCHEDULE_TIP}>Schedule</InfoLabel>
        <ScheduleFields values={this.state} onScheduleChange={this.handleSchedule} onTimeChange={this.handleField} />
      </SettingsSection>
    );
  }

  render() {
    if (this.state.isError) {
      return (
        <ul>
          {[].concat(this.state.errorRes).map((err, i) => (
            <li key={i}>{String(err)}</li>
          ))}
        </ul>
      );
    }
    if (this.state.isLoading) {
      return (
        <div className="d-flex align-items-center justify-content-center">
          <img src={Loading} width="50" alt="" />
        </div>
      );
    }
    return (
      <div>
        <Form onSubmit={this.handleFormSubmit} className={`form-content ${this.props.isDarkMode ? "dark-mode" : ""}`}>
          {this.renderProfile()}
          {this.renderActions()}
          {this.renderTiming()}

          <Button onClick={this.props.cancel} variant="light">
            Cancel
          </Button>
          &nbsp;&nbsp;
          <Button type="submit" variant="secondary">
            {this.props.isEdit ? "Update" : "Save"}
          </Button>
          {this.state.isIncomplete && <i style={{ color: "#f00" }}>&nbsp; All parameters must be selected. </i>}
        </Form>
        <br />
        <br />
        <Modal
          show={this.state.show}
          onHide={this.handleClose}
          size="sm"
          backdrop="static"
          className={this.props.isDarkMode ? "dark-mode" : ""}
        >
          <Modal.Header>
            <h3>Warning</h3>
          </Modal.Header>
          <Modal.Body>
            Selecting the "Any" or "All" option could have unforseen issues with the behavior of the lights. Only use if
            you know what you are doing.
            <br />
            <br />
            See{" "}
            <a
              href="https://github.com/chadwpalm/Lumunarr/wiki/User-Guide#profile-design-tips"
              target="_blank"
              rel="noreferrer"
            >
              Lumunarr documentation
            </a>{" "}
            for more information.
            <br />
            <br />
            <Button onClick={this.handleClose}>Acknowledge</Button>
          </Modal.Body>
        </Modal>
        <Modal show={this.state.show2} onHide={this.handleClose} size="sm" backdrop="static">
          <Modal.Header>
            <h3>Warning</h3>
          </Modal.Header>
          <Modal.Body>
            A profile with the same client, user, and media already exists. This could have unforseen issues if scenes
            from the same room are used in both profiles.
            <br />
            <br />
            See Lumunarr documentation for more information.
            <br />
            <br />
            <Button onClick={this.handleClose}>Acknowledge</Button>
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}
