import React, { Component } from "react";
import Loading from "../../images/loading-gif.gif";
import { v4 as uuid } from "uuid";
import Form from "react-bootstrap/Form";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Info from "bootstrap-icons/icons/info-circle.svg";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Stack from "react-bootstrap/Stack";
import "./Create.css";

export default class Create extends Component {
  constructor(props) {
    super(props);

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
        pauseScene: info.pause,
        pauseDelayMs: info.pauseDelayMs ?? 0,
        stopScene: info.stop,
        resumeScene: info.resume,
        scrobble: info.scrobble,
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
        groupsList: [],
        userList: [],
        clientList: [],
        sceneList: [],
        roomSceneList: [],
        libraryList: [],
        isLoading: true,
        isIncomplete: false,
        isError: false,
        show: false,
        show2: false,
        errorRes: [],
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
        playRoom: "-1",
        pauseScene: "-1",
        pauseDelayMs: 0,
        stopScene: "-1",
        resumeScene: "-1",
        scrobble: "-1",
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
        groupsList: [],
        userList: [],
        clientList: [],
        sceneList: [],
        roomSceneList: [],
        libraryList: [],
        isLoading: true,
        isIncomplete: false,
        isError: false,
        show: false,
        show2: false,
        errorRes: [],
      };
    }
    this.handleClient = this.handleClient.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  componentDidMount() {
    var settings = { ...this.props.settings };

    var xhr = new XMLHttpRequest();
    xhr.timeout = 30000;
    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // request successful
          var response = xhr.responseText,
            json = JSON.parse(response);
          this.setState({ userList: json[0] });
          this.setState({ clientList: json[1] });
          this.setState({ sceneList: json[2] });
          this.setState({ groupsList: json[3] });
          this.setState({ libraryList: json[4] });
          this.setState({ isLoading: false });

          var temp = [];
          this.setState({ roomSceneList: [] });
          json[2].forEach((scene) => {
            if (scene.Room === this.state.room) temp.push(scene);
          });

          this.setState({ roomSceneList: temp });
        } else if (xhr.status === 401) {
          this.props.logout();
        } else {
          // error
          this.setState({
            isLoaded: true,
            isError: true,
            errorRes: JSON.parse(xhr.responseText),
          });
        }
      }
    });
    xhr.open("POST", "/backend/client", true);
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
      this.state.playScene === "-1" ||
      this.state.pauseScene === "-1" ||
      this.state.stopScene === "-1" ||
      this.state.resumeScene === "-1" ||
      this.state.scrobble === "-1" ||
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
    temp.play = this.state.playScene;
    temp.stop = this.state.stopScene;
    temp.pause = this.state.pauseScene;
    temp.pauseDelayMs = this.state.pauseDelayMs;
    temp.resume = this.state.resumeScene;
    temp.scrobble = this.state.scrobble;
    temp.scrobbleDelayMs = this.state.scrobbleDelayMs;
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
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
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
    xhr.send(JSON.stringify(settings));

    this.props.saved();
  };

  relativeTime(stamp) {
    var time = Math.floor(new Date().getTime() / 1000.0) - stamp;
    var response = "";
    if (time < 60) response = "Less than a minute ago";
    else if (time < 3600) response = Math.round(time / 60).toString() + " minutes ago";
    else if (time < 86400) response = Math.round(time / 3600).toString() + " hours ago";
    else if (time < 2592000) response = Math.round(time / 86400).toString() + " days ago";
    else if (time < 31536000) response = Math.round(time / 2592000).toString() + " months ago";
    else response = Math.round(time / 31536000).toString() + " years ago";
    return response;
  }

  handleTitle = (e) => {
    this.setState({ title: e.target.value.toString() });
  };

  handleClient = (e) => {
    if (e.target.value === "-1") {
      this.setState({
        clientId: "-1",
        clientName: "",
      });
    } else {
      var result = this.state.clientList.find(
        ({ _attributes }) => _attributes.clientIdentifier === e.target.value.toString(),
      );
      this.setState({
        selectUser: true,
        clientId: e.target.value.toString(),
        clientName: result._attributes.name + " (" + result._attributes.platform + ")",
      });
    }
  };

  handleUser = (e) => {
    if (e.target.value === "-1") {
      this.setState({
        userId: "-1",
        userName: "",
      });
    } else if (e.target.value === "Any") {
      this.setState({
        userId: "Any",
        userName: "Any",
        show: true,
      });
    } else {
      var result = this.state.userList.find(({ _attributes }) => _attributes.id.toString() === e.target.value);
      this.setState({
        userId: e.target.value.toString(),
        userName: result._attributes.title,
      });
    }
  };

  handleMedia = (e) => {
    if (e.target.value === "All") this.setState({ show: true });
    this.setState({ media: e.target.value.toString() });
  };

  handleLibrary = (e) => {
    const selectedValue = e.target.value;
    const [title, server] = selectedValue.split("|");

    this.setState({
      library: title,
      server: server,
    });
  };

  handlePlay = (e) => {
    this.setState({ playScene: e.target.value.toString() });
  };

  handleRoom = (e) => {
    this.setState({ room: e.target.value.toString() });
    var temp = [];
    this.setState({ roomSceneList: [] });
    this.state.sceneList.forEach((scene) => {
      if (scene.Room === e.target.value.toString()) temp.push(scene);
    });

    this.setState({ roomSceneList: temp });
  };

  handleStop = (e) => {
    this.setState({ stopScene: e.target.value.toString() });
  };

  handlePause = (e) => {
    this.setState({
      pauseScene: e.target.value.toString(),
    });
  };

  handlePauseDelay = (e) => {
    this.setState({
      pauseDelayMs: e.target.value.toString(),
    });
  };

  handleResume = (e) => {
    this.setState({
      resumeScene: e.target.value.toString(),
    });
  };

  handleScrobble = (e) => {
    this.setState({
      scrobble: e.target.value.toString(),
    });
  };

  handleScrobbleDelay = (e) => {
    this.setState({
      scrobbleDelayMs: e.target.value.toString(),
    });
  };

  handleTransition = (e) => {
    this.setState({
      transition: e.target.value.toString(),
    });
  };

  handleTransitionType = (e) => {
    this.setState({
      transitionType: e.target.value.toString(),
    });
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
      default:
        break;
    }
  };

  handleClose = () => this.setState({ show: false, show2: false });

  handleLightsOff = (e) => {
    this.setState({ lightsOff: e.target.checked });
  };

  render() {
    if (this.state.isError) {
      var text = "";
      for (let i = 0; i < this.state.errorRes.length; i++) {
        text = text + `- ` + this.state.errorRes[i] + "</br>";
      }
      return <div dangerouslySetInnerHTML={{ __html: `${text}` }} />;
    } else if (this.state.isLoading) {
      return (
        <div className="d-flex align-items-center justify-content-center">
          <img src={Loading} width="50" alt="" />
        </div>
      );
    } else {
      const options = [];
      for (let i = 0; i < 60; i++) {
        options.push(
          <option value={i.toString()}>
            {i.toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false })}
          </option>,
        );
      }
      return (
        <div>
          <Form onSubmit={this.handleFormSubmit} className={`form-content ${this.props.isDarkMode ? "dark-mode" : ""}`}>
            {/* Enter Title */}
            <Form.Label for="Title">
              Title &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    Enter the title of the Client profile. Will default to the Client's name if left blank.
                  </Tooltip>
                }
              >
                <img src={Info} className="image-info" alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Control value={this.state.title} id="title" name="title" onChange={this.handleTitle} size="sm" />
            <div className="div-seperator" />
            {/* Select Client */}
            <Form.Label for="client">
              Client &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    This is the Plex client that will control the Hue scenes. Clients are ordered top-down from most
                    recently used to last used.
                  </Tooltip>
                }
              >
                <img src={Info} className="image-info" alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={this.state.clientId} id="client" name="client" onChange={this.handleClient} size="sm">
              <option value="-1">Select a Client</option>
              {this.state.clientList.map((client) =>
                client._attributes.provides !== "server" ? (
                  <option value={client._attributes.clientIdentifier}>
                    {client._attributes.name} ({client._attributes.platform}) {"  -  "} {client._attributes.product}
                    {", version: "}
                    {client._attributes.productVersion} ({client._attributes.device}){" - created: "}
                    {this.relativeTime(client._attributes.createdAt)}
                  </option>
                ) : (
                  <></>
                ),
              )}
            </Form.Select>
            <div className="div-seperator" />
            {/* Select User */}
            <Form.Label for="user">
              User &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    This is the Plex user that will control the Hue scenes. Chosing "Any" will allow any user to control
                    the Hue scenes from that client. <br />
                    <br /> This option is meant to be used when the client is set up with multiple Plex Home users. If
                    Plex Home is not set up, then you should use the user that is logged into that client (or use
                    "Any").
                  </Tooltip>
                }
              >
                <img src={Info} className="image-info" alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={this.state.userId} id="user" name="user" onChange={this.handleUser} size="sm">
              <option value="-1">Select a User</option>
              <option value="Any">Any</option>
              {this.state.userList.map((user) => (
                <option value={user._attributes.id}>
                  {user._attributes.title} ({user._attributes.username === "" ? "Plex Home" : user._attributes.username}
                  )
                </option>
              ))}
            </Form.Select>
            <div className="div-seperator" />
            {/* Select Media Type */}
            <Form.Label for="media">
              Media Type &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    This is the media type that you want to control Hue scenes from. Select "All" if you want scenes to
                    activate for any media type.
                  </Tooltip>
                }
              >
                <img src={Info} className="image-info" alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={this.state.media} id="media" name="media" onChange={this.handleMedia} size="sm">
              <option value="-1">Select Media Type</option>
              <option value="All">All</option>
              <option value="movie">Movie</option>
              <option value="show">TV Show</option>
              <option value="cinemaTrailer">Trailer/Preroll</option>
            </Form.Select>
            <div className="div-seperator" />
            {/* Select Library */}
            {this.state.media === "movie" || this.state.media === "show" ? (
              <>
                <Form.Label for="library">
                  Library &nbsp;&nbsp;
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip>
                        This is the library that you want to control Hue scenes from. Select "All" if you want scenes to
                        activate for any library of the selected media type.
                      </Tooltip>
                    }
                  >
                    <img src={Info} className="image-info" alt="Info" />
                  </OverlayTrigger>
                </Form.Label>
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
                <div className="div-seperator" />
              </>
            ) : null}
            {/* Select Room */}
            <Form.Label for="room">
              Room &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={<Tooltip>This is the room/group of lights you want to use.</Tooltip>}
              >
                <img src={Info} className="image-info" alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={this.state.room} id="room" name="room" onChange={this.handleRoom} size="sm">
              <option value="-1">Select Room</option>
              {this.state.groupsList.map((group) => (
                <option value={group.Room}>
                  {group.Room} ({group.Type})
                </option>
              ))}
            </Form.Select>
            <div className="div-seperator" />
            <Stack gap={1} direction="horizontal">
              <Form.Check
                type="checkbox"
                id="lightsOff"
                name="lightsOff"
                onChange={this.handleLightsOff}
                checked={this.state.lightsOff}
              />
              &nbsp;&nbsp;Ignore triggers if lights in room are off&nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    If this is checked, the Play, Stop, Pause, and Resume triggers will not work if all of the lights in
                    the selected room are off. Be aware, if any of your triggers turn the lights off, Lumunarr will not
                    turn them back on unless this is unchecked or you manually turn them on.
                    <br />
                    <br />
                    Schedules are still in effect regardless of this setting.
                  </Tooltip>
                }
              >
                <img src={Info} className="image-info" alt="Info" />
              </OverlayTrigger>
            </Stack>
            <div className="div-seperator" />
            {/* Play Action */}
            <Form.Label for="play">
              Play &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    This is the Hue scene that will activate when media is played (From a stopped state). Select "None"
                    if you don't want any action to happen.
                  </Tooltip>
                }
              >
                <img src={Info} className="image-info" alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={this.state.playScene} id="play" name="play" onChange={this.handlePlay} size="sm">
              <option value="-1">Select Play Action Scene</option>
              <option value="None">None</option>
              <option value="Off">Off</option>
              {this.state.roomSceneList.map((scene) => (
                <option value={scene.Id}>{scene.Name}</option>
              ))}
            </Form.Select>
            <div className="div-seperator" />
            {/* Stop Action */}
            <Form.Label for="stop">
              Stop &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    This is the Hue scene that will activate when media is stopped. Select "None" if you don't want any
                    action to happen.
                  </Tooltip>
                }
              >
                <img src={Info} className="image-info" alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={this.state.stopScene} id="stop" name="stop" onChange={this.handleStop} size="sm">
              <option value="-1">Select Stop Action Scene</option>
              <option value="None">None</option>
              <option value="Off">Off</option>
              <option value="-2">Restore Pre-Play</option>
              {this.state.roomSceneList.map((scene) => (
                <option value={scene.Id}>{scene.Name}</option>
              ))}
            </Form.Select>
            <div className="div-seperator" />
            {/* Pause Action */}
            <Form.Label for="pause">
              Pause &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    This is the Hue scene that will activate when media is paused. Select "None" if you don't want any
                    action to happen.
                  </Tooltip>
                }
              >
                <img src={Info} className="image-info" alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={this.state.pauseScene} id="pause" name="pause" onChange={this.handlePause} size="sm">
              <option value="-1">Select Pause Action Scene</option>
              <option value="None">None</option>
              <option value="Off">Off</option>
              <option value="-2">Restore Pre-Play</option>
              {this.state.roomSceneList.map((scene) => (
                <option value={scene.Id}>{scene.Name}</option>
              ))}
            </Form.Select>
            <div className="div-seperator" />
            {/* Pause Delay */}
            <Form.Label for="pauseDelay">
              Pause Delay (ms) &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    This will delay the pause action after receiving the webhook for the selected amount of time unless
                    a resume action happens before the delay time has expired. This delay is intended for users using
                    Plex clients that send out a pause webhook when using the seek feature.
                    <br />
                    <br />
                    Be aware that this will also delay normal pause actions. It is advised to try and find a delay time
                    that will satisfy the seek issue but not take too long on normal pauses.
                  </Tooltip>
                }
              >
                <img src={Info} className="image-info" alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Stack gap={1} direction="horizontal">
              <Form.Range
                id="pauseDelay"
                className="me-auto"
                value={this.state.pauseDelayMs}
                min={0}
                max={5000}
                step={100}
                onChange={this.handlePauseDelay}
              />
              <div className="slider-style" style={{ whiteSpace: "nowrap" }}>
                {this.state.pauseDelayMs === 0 ? "Off" : this.state.pauseDelayMs + " ms"}
              </div>
            </Stack>
            <div className="div-seperator" />
            {/* Resume Action */}
            <Form.Label for="resume">
              Resume &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    This is the Hue scene that will activate when media is resumed from a paused state. Select "None" if
                    you don't want any action to happen.
                  </Tooltip>
                }
              >
                <img src={Info} className="image-info" alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select
              value={this.state.resumeScene}
              id="resume"
              name="resume"
              onChange={this.handleResume}
              size="sm"
            >
              <option value="-1">Select Resume Action Scene</option>
              <option value="None">None</option>
              <option value="Off">Off</option>
              {this.state.roomSceneList.map((scene) => (
                <option value={scene.Id}>{scene.Name}</option>
              ))}
            </Form.Select>
            <div className="div-seperator" />
            {/* Scrobble Action */}
            <Form.Label for="scrobble">
              Scrobble &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    This is the Hue scene that will activate when media is scrobbled. Select "None" if you don't want
                    any action to happen.
                    <br />
                    <br />
                    In Plex, "scrobble" is the time when the media you are watching is considered "played". By default,
                    this time is set at the 90% mark of a video, but can be changed in the Plex Media Server's settings.
                    <br />
                    <br />
                    As of version 1.31 of the Plex Media Server, scrobble can be set at end credits marker points. This
                    is good if you want your lights to react when credits start rolling.
                  </Tooltip>
                }
              >
                <img src={Info} className="image-info" alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select
              value={this.state.scrobble}
              id="scrobble"
              name="scrobble"
              onChange={this.handleScrobble}
              size="sm"
            >
              <option value="-1">Select Scrobble Action Scene</option>
              <option value="None">None</option>
              <option value="Off">Off</option>
              {this.state.roomSceneList.map((scene) => (
                <option value={scene.Id}>{scene.Name}</option>
              ))}
            </Form.Select>
            <div className="div-seperator" />
            {/* Scrobble Delay */}
            <Form.Label for="scrobbleDelay">
              Scrobble Delay (ms) &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    Plex tends to send the scrobble event a second or two before the credits start rolling. You can use
                    this to delay the effect by a few seconds.
                  </Tooltip>
                }
              >
                <img src={Info} className="image-info" alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Stack gap={1} direction="horizontal">
              <Form.Range
                id="scrobbleDelay"
                className="me-auto"
                value={this.state.scrobbleDelayMs}
                min={0}
                max={15000}
                step={100}
                onChange={this.handleScrobbleDelay}
              />
              <div className="slider-style" style={{ whiteSpace: "nowrap" }}>
                {this.state.scrobbleDelayMs === 0 ? "Off" : this.state.scrobbleDelayMs + " ms"}
              </div>
            </Stack>
            <div className="div-seperator" />
            {/* Scene Transition */}
            <Form.Label for="transition">
              Scene Transition Time (s) &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    This is the time in seconds for the scene to transition.
                    <br />
                    <br />
                    If set to "Default", Lumunarr will use the transition time that is saved in the scene (through a
                    third-party app). If there is no saved transition time, the Hue default of 0.4 seconds will be used.
                    <br />
                    <br />
                    Setting a specific time will override the transition time saved in the scene and use the selected
                    time instead.
                  </Tooltip>
                }
              >
                <img src={Info} className="image-info" alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <div>
              <Form.Check
                inline
                type="radio"
                label="Local"
                value="1"
                id="transition"
                name="transition"
                onChange={this.handleTransitionType}
                size="sm"
                checked={this.state.transitionType === "1"}
              />
              <Form.Check
                inline
                type="radio"
                label="Global"
                value="2"
                id="transition"
                name="transition"
                onChange={this.handleTransitionType}
                size="sm"
                checked={this.state.transitionType === "2"}
              />
            </div>
            <div className="div-seperator" />
            {this.state.transitionType === "1" ? (
              <>
                <Stack gap={1} direction="horizontal">
                  <Form.Range
                    id="transition"
                    className="me-auto"
                    value={this.state.transition}
                    min={0}
                    max={10}
                    step={0.2}
                    onChange={this.handleTransition}
                  />
                  {this.state.transition === "0" ? (
                    <>
                      <div className="slider-style">Default</div>
                    </>
                  ) : (
                    <>
                      <div className="slider-style">{this.state.transition} s</div>
                    </>
                  )}
                </Stack>
                <div className="div-seperator" />
              </>
            ) : (
              <></>
            )}
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
                    None: There will be no schedule. Profiles will be active based on the switch located on the profile
                    tile.
                    <br />
                    <br />
                    Global: Use the global setting for schedules.
                    <br />
                    <br />
                    Range: The schedule will be based on a time range daily.
                    <br />
                    <br />
                    Sunset/Sunrise: The active schedule will be between sunset and sunrise. In order for this to work a
                    Latitude and Longitude must be set in the Settings tab. If using Docker the timezone environment
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
            <Button onClick={this.props.cancel} variant="light">
              Cancel
            </Button>
            &nbsp;&nbsp;
            {this.props.isEdit ? (
              <Button type="submit" variant="secondary">
                Update
              </Button>
            ) : (
              <Button type="submit" variant="secondary">
                Save
              </Button>
            )}
            {this.state.isIncomplete ? (
              <i style={{ color: "#f00" }}>&nbsp; All parameters must be selected. </i>
            ) : (
              <></>
            )}
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
              Selecting the "Any" or "All" option could have unforseen issues with the behavior of the lights. Only use
              if you know what you are doing.
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
}
