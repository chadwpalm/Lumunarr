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

export default class Create extends Component {
  constructor(props) {
    super(props);

    if (this.props.isEdit) {
      var info = this.props.settings.clients.find(({ uid }) => uid === this.props.uid.toString());

      this.state = {
        uid: info.uid,
        clientName: info.client.name,
        clientId: info.client.id,
        userName: info.user.name,
        userId: info.user.id,
        media: info.media,
        room: info.room,
        playScene: info.play,
        pauseScene: info.pause,
        stopScene: info.stop,
        resumeScene: info.resume,
        scrobble: info.scrobble,
        scrobbleDelayMs: info.scrobbleDelayMs ?? 0,
        active: info.active,
        groupsList: [],
        userList: [],
        clientList: [],
        sceneList: [],
        roomSceneList: [],
        isLoading: true,
        isIncomplete: false,
        isError: false,
        show: false,
        show2: false,
        errorRes: "",
      };
    } else {
      this.state = {
        clientName: "",
        clientId: "-1",
        userName: "",
        userId: "-1",
        media: "-1",
        room: "-1",
        playScene: "-1",
        playRoom: "-1",
        pauseScene: "-1",
        stopScene: "-1",
        resumeScene: "-1",
        scrobble: "-1",
        scrobbleDelayMs: 0,
        active: true,
        groupsList: [],
        userList: [],
        clientList: [],
        sceneList: [],
        roomSceneList: [],
        isLoading: true,
        isIncomplete: false,
        isError: false,
        show: false,
        show2: false,
        errorRes: "",
      };
    }
    this.handleClient = this.handleClient.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  componentDidMount() {
    var settings = { ...this.props.settings };

    var xhr = new XMLHttpRequest();
    xhr.timeout = 10000;
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
          this.setState({ isLoading: false });

          if (this.props.isEdit) {
            var room = json[2].find(({ Id }) => Id === this.state.playScene).Room;
            if (this.state.room === undefined) this.setState({ room: room });
          }
          var temp = [];
          this.setState({ roomSceneList: [] });
          json[2].forEach((scene) => {
            if (this.state.room === undefined) {
              if (scene.Room === room) temp.push(scene);
            } else {
              if (scene.Room === this.state.room) temp.push(scene);
            }
          });

          this.setState({ roomSceneList: temp });
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
    xhr.open("POST", "/backend/client", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(settings));
  }

  handleFormSubmit = (e) => {
    e.preventDefault();

    this.setState({ isIncomplete: false });

    if (
      this.state.clientId === "-1" ||
      this.state.userId === "-1" ||
      this.state.media === "-1" ||
      this.state.room === "-1" ||
      this.state.playScene === "-1" ||
      this.state.pauseScene === "-1" ||
      this.state.stopScene === "-1" ||
      this.state.resumeScene === "-1" ||
      this.state.scrobble === "-1"
    ) {
      this.setState({ isIncomplete: true });
      return;
    }

    var settings = { ...this.props.settings };

    if (!settings.clients) settings.clients = [];

    var temp = {};

    temp.uid = uuid().toString();
    temp.client = {};
    temp.client.id = this.state.clientId;
    temp.client.name = this.state.clientName;
    temp.user = {};
    temp.user.id = this.state.userId;
    temp.user.name = this.state.userName;
    temp.media = this.state.media;
    temp.room = this.state.room;
    temp.play = this.state.playScene;
    temp.stop = this.state.stopScene;
    temp.pause = this.state.pauseScene;
    temp.resume = this.state.resumeScene;
    temp.scrobble = this.state.scrobble;
    temp.scrobbleDelayMs = this.state.scrobbleDelayMs;
    temp.active = this.state.active;

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

  handleClient = (e) => {
    if (e.target.value === "-1") {
      this.setState({
        clientId: "-1",
        clientName: "",
      });
    } else {
      var result = this.state.clientList.find(
        ({ _attributes }) => _attributes.clientIdentifier === e.target.value.toString()
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
  }

  handleClose = () => this.setState({ show: false, show2: false });

  render() {
    if (this.state.isError) {
      if (this.state.errorRes === "Invalid authentication token.") {
        return <>Invalid authentication token. Please log out and log back in.</>;
      } else {
        return <>{this.state.errorRes}</>;
      }
    } else if (this.state.isLoading) {
      return (
        <div className="d-flex align-items-center justify-content-center">
          <img src={Loading} width="50" />
        </div>
      );
    } else {
      return (
        <div>
          <Form onSubmit={this.handleFormSubmit}>
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
                <img src={Info} alt="Info" />
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
                )
              )}
            </Form.Select>
            <div style={{ paddingBottom: "0.75rem" }} />
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
                <img src={Info} alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={this.state.userId} id="user" name="user" onChange={this.handleUser} size="sm">
              <option value="-1">Select a User</option>
              <option value="Any">Any</option>
              {this.state.userList.map((user) => (
                <option value={user._attributes.id}>
                  {user._attributes.title} ({user._attributes.username})
                </option>
              ))}
            </Form.Select>
            <div style={{ paddingBottom: "0.75rem" }} />
            {/* Select Media Type */}
            <Form.Label for="media">
              Media &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    This is the media type that you want to control Hue scenes from. Select "All" if you want scenes to
                    activate for any media type.
                  </Tooltip>
                }
              >
                <img src={Info} alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={this.state.media} id="media" name="media" onChange={this.handleMedia} size="sm">
              <option value="-1">Select Media Type</option>
              <option value="All">All</option>
              <option value="movie">Movie</option>
              <option value="show">TV Show</option>
              <option value="cinemaTrailer">Trailer/Preroll</option>
            </Form.Select>
            <div style={{ paddingBottom: "0.75rem" }} />
            {/* Select Room */}
            <Form.Label for="room">
              Room &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={<Tooltip>This is the room/group of lights you want to use.</Tooltip>}
              >
                <img src={Info} alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={this.state.room} id="room" name="room" onChange={this.handleRoom} size="sm">
              <option value="-1">Select Room</option>
              {this.state.groupsList.map((group) => (
                <option value={group.Room}>{group.Room} ({group.Type})</option>
              ))}
            </Form.Select>
            <div style={{ paddingBottom: "0.75rem" }} />
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
                <img src={Info} alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={this.state.playScene} id="play" name="play" onChange={this.handlePlay} size="sm">
              <option value="-1">Select Play Action Scene</option>
              <option value="None">None</option>
              {this.state.roomSceneList.map((scene) => (
                <option value={scene.Id}>{scene.Name}</option>
              ))}
            </Form.Select>
            <div style={{ paddingBottom: "0.75rem" }} />
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
                <img src={Info} alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={this.state.stopScene} id="stop" name="stop" onChange={this.handleStop} size="sm">
              <option value="-1">Select Stop Action Scene</option>
              <option value="None">None</option>
              {this.state.roomSceneList.map((scene) => (
                <option value={scene.Id}>{scene.Name}</option>
              ))}
            </Form.Select>
            <div style={{ paddingBottom: "0.75rem" }} />
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
                <img src={Info} alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={this.state.pauseScene} id="pause" name="pause" onChange={this.handlePause} size="sm">
              <option value="-1">Select Pause Action Scene</option>
              <option value="None">None</option>
              {this.state.roomSceneList.map((scene) => (
                <option value={scene.Id}>{scene.Name}</option>
              ))}
            </Form.Select>
            <div style={{ paddingBottom: "0.75rem" }} />
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
                <img src={Info} alt="Info" />
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
              {this.state.roomSceneList.map((scene) => (
                <option value={scene.Id}>{scene.Name}</option>
              ))}
            </Form.Select>
            <div style={{ paddingBottom: "0.75rem" }} />
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
                <img src={Info} alt="Info" />
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
              {this.state.roomSceneList.map((scene) => (
                <option value={scene.Id}>{scene.Name}</option>
              ))}
            </Form.Select>
            <div style={{ paddingBottom: "0.75rem" }} />
            <Form.Label for="scrobbleDelay">
              Scrobble Delay (ms) &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip>
                    Plex tends to send the scrobble event a second or two before the credits start rolling. You can use this to delay the effect by a few seconds.
                  </Tooltip>
                }
              >
                <img src={Info} alt="Info" />
              </OverlayTrigger>
            </Form.Label>
            <Stack gap={1} direction="horizontal">
              <Form.Range
                id="scrobbleDelay"
                className="me-auto"
                value={this.state.scrobbleDelayMs}
                min={0}
                max={5000}
                step={100}
                onChange={this.handleScrobbleDelay} 
              />
              <div style={{ width: 70, textAlign: 'right' }}>
                {this.state.scrobbleDelayMs} ms
              </div>
            </Stack>
            <div style={{ paddingBottom: "0.75rem" }} />
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
          <Modal show={this.state.show} onHide={this.handleClose} size="sm" backdrop="static">
            <Modal.Header>
              <h3>Warning</h3>
            </Modal.Header>
            <Modal.Body>
              Selecting the "Any" or "All" option could have unforseen issues with the behavior of the lights. Only use
              if you know what you are doing.
              <br />
              <br />
              See HuePlex documentation for more information.
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
              See HuePlex documentation for more information.
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
