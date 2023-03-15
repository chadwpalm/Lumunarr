import React, { Component } from "react";
import { stringify } from "uuid";
import Loading from "../../images/loading-gif.gif";
import crc from "crc-32";
import Form from "react-bootstrap/Form";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Info from "bootstrap-icons/icons/info-circle.svg";
import Button from "react-bootstrap/Button";

// import styled from "styled-components";

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
        playScene: info.play,
        pauseScene: info.pause,
        stopScene: info.stop,
        resumeScene: info.resume,
        scrobble: info.scrobble,
        userList: [],
        clientList: [],
        sceneList: [],
        isLoading: true,
        selectUser: true,
        selectMedia: true,
        selectPlay: true,
        selectPause: true,
        selectStop: true,
        selectResume: true,
        selectSave: true,
        selectScrobble: true,
        isIncomplete: false,
        isDuplicate: false,
        isError: false,
        errorRes: "",
      };
    } else {
      this.state = {
        clientName: "",
        clientId: "-1",
        userName: "",
        userId: "-1",
        media: "-1",
        playScene: "-1",
        pauseScene: "-1",
        stopScene: "-1",
        resumeScene: "-1",
        scrobble: "-1",
        userList: [],
        clientList: [],
        sceneList: [],
        isLoading: true,
        selectUser: false,
        selectMedia: false,
        selectPlay: false,
        selectPause: false,
        selectStop: false,
        selectResume: false,
        selectSave: false,
        selectScrobble: false,
        isIncomplete: false,
        isDuplicate: false,
        isError: false,
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
          console.log("At Create response");
          this.setState({ userList: json[0] });
          this.setState({ clientList: json[1] });
          this.setState({ sceneList: json[2] });
          this.setState({ isLoading: false });
        } else {
          console.log("Status Code: ", xhr.status);
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
    console.log("Before send:", settings);
    xhr.send(JSON.stringify(settings));
  }

  handleFormSubmit = (e) => {
    e.preventDefault();
    console.log("Handle Save");

    this.setState({ isDuplicate: false, isIncomplete: false });

    if (
      this.state.clientId === "-1" ||
      this.state.userId === "-1" ||
      this.state.media === "-1" ||
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

    temp.uid = Math.abs(crc.str(this.state.clientName + this.state.userName + this.state.media)).toString();
    temp.client = {};
    temp.client.id = this.state.clientId;
    temp.client.name = this.state.clientName;
    temp.user = {};
    temp.user.id = this.state.userId;
    temp.user.name = this.state.userName;
    temp.media = this.state.media;
    temp.play = this.state.playScene;
    temp.stop = this.state.stopScene;
    temp.pause = this.state.pauseScene;
    temp.resume = this.state.resumeScene;
    temp.scrobble = this.state.scrobble;

    if (this.props.isEdit) {
      const index = settings.clients.findIndex(({ uid }) => uid === temp.uid);
      if (index !== -1 && temp.uid !== this.state.uid) {
        this.setState({ isDuplicate: true });
        return;
      } else {
        const index2 = settings.clients.findIndex(({ uid }) => uid === this.state.uid);
        settings.clients.splice(index2, 1, temp);
      }
    } else {
      const index = settings.clients.findIndex(({ uid }) => uid === temp.uid);
      if (index !== -1) {
        this.setState({ isDuplicate: true });
        return;
      } else {
        settings.clients.push(temp);
      }
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
    console.log("Before send:", settings);
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
      var result = this.state.clientList.find(({ clientIdentifier }) => clientIdentifier === e.target.value.toString());
      this.setState({
        selectUser: true,
        clientId: e.target.value.toString(),
        clientName: result.name + " (" + result.platform + ")",
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
        selectMedia: true,
      });
    } else {
      var result = this.state.userList.find(({ id }) => id.toString() === e.target.value);
      this.setState({
        selectMedia: true,
        userId: e.target.value.toString(),
        userName: result.title,
      });
    }
  };

  handleMedia = (e) => {
    this.setState({ selectPlay: true, media: e.target.value.toString() });
  };

  handlePlay = (e) => {
    this.setState({ selectStop: true, playScene: e.target.value.toString() });
  };

  handleStop = (e) => {
    this.setState({ selectPause: true, stopScene: e.target.value.toString() });
  };

  handlePause = (e) => {
    this.setState({
      selectResume: true,
      pauseScene: e.target.value.toString(),
    });
  };

  handleResume = (e) => {
    this.setState({
      selectScrobble: true,
      resumeScene: e.target.value.toString(),
    });
  };

  handleScrobble = (e) => {
    this.setState({
      selectSave: true,
      scrobble: e.target.value.toString(),
    });
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
      return (
        <div>
          <Form onSubmit={this.handleFormSubmit}>
            {/* Select Client */}
            <Form.Label for="client">
              Client &nbsp;&nbsp;
              <OverlayTrigger
                placement="right"
                overlay={<Tooltip>This is the Plex client that will control the Hue scenes.</Tooltip>}
              >
                <img src={Info} />
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={this.state.clientId} id="client" name="client" onChange={this.handleClient} size="sm">
              <option value="-1">Select a Client</option>
              {this.state.clientList.map((client) =>
                client.provides !== "server" ? (
                  <option value={client.clientIdentifier}>
                    {client.name} ({client.platform}),{" created: "}
                    {this.relativeTime(client.createdAt)}
                  </option>
                ) : (
                  <></>
                )
              )}
            </Form.Select>
            <div style={{ paddingBottom: "0.75rem" }} />
            {/* Select User */}
            {this.state.selectUser ? (
              <>
                <Form.Label for="user">
                  User &nbsp;&nbsp;
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip>
                        This is the Plex user that will control the Hue scenes. Chosing "Any" will allow any user to
                        control the Hue scenes from that client. <br />
                        <br /> This option is meant to be used when the client is set up with multiple Plex Home users.
                        If Plex Home is not set up, then you should use the user that is logged into that client (or use
                        "Any").
                      </Tooltip>
                    }
                  >
                    <img src={Info} />
                  </OverlayTrigger>
                </Form.Label>
                <Form.Select value={this.state.userId} id="user" name="user" onChange={this.handleUser} size="sm">
                  <option value="-1">Select a User</option>
                  <option value="Any">Any</option>
                  {this.state.userList.map((user) => (
                    <option value={user.id}>
                      {user.title} ({user.username})
                    </option>
                  ))}
                </Form.Select>
                <div style={{ paddingBottom: "0.75rem" }} />
              </>
            ) : (
              <></>
            )}
            {/* Select Media Type */}
            {this.state.selectMedia ? (
              <>
                <Form.Label for="media">
                  Media &nbsp;&nbsp;
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip>
                        This is the media type that you want to control Hue scenes from. Select "All" if you want scenes
                        to activate for any media type.
                      </Tooltip>
                    }
                  >
                    <img src={Info} />
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
              </>
            ) : (
              <></>
            )}
            {/* Play Action */}
            {this.state.selectPlay ? (
              <>
                <Form.Label for="play">
                  Play &nbsp;&nbsp;
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip>
                        This is the Hue scene that will activate when media is played (From a stopped state). Select
                        "None" if you don't want any action to happen.
                      </Tooltip>
                    }
                  >
                    <img src={Info} />
                  </OverlayTrigger>
                </Form.Label>
                <Form.Select value={this.state.playScene} id="play" name="play" onChange={this.handlePlay} size="sm">
                  <option value="-1">Select Play Action Scene</option>
                  <option value="None">None</option>
                  {this.state.sceneList.map((scene) => (
                    <option value={scene.Id}>
                      {scene.Name} ({scene.Room})
                    </option>
                  ))}
                </Form.Select>
                <div style={{ paddingBottom: "0.75rem" }} />
              </>
            ) : (
              <></>
            )}
            {/* Stop Action */}
            {this.state.selectStop ? (
              <>
                <Form.Label for="stop">
                  Stop &nbsp;&nbsp;
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip>
                        This is the Hue scene that will activate when media is stopped. Select "None" if you don't want
                        any action to happen.
                      </Tooltip>
                    }
                  >
                    <img src={Info} />
                  </OverlayTrigger>
                </Form.Label>
                <Form.Select value={this.state.stopScene} id="stop" name="stop" onChange={this.handleStop} size="sm">
                  <option value="-1">Select Stop Action Scene</option>
                  <option value="None">None</option>
                  {this.state.sceneList.map((scene) => (
                    <option value={scene.Id}>
                      {scene.Name} ({scene.Room})
                    </option>
                  ))}
                </Form.Select>
                <div style={{ paddingBottom: "0.75rem" }} />
              </>
            ) : (
              <></>
            )}
            {/* Pause Action */}
            {this.state.selectPause ? (
              <>
                <Form.Label for="pause">
                  Pause &nbsp;&nbsp;
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip>
                        This is the Hue scene that will activate when media is paused. Select "None" if you don't want
                        any action to happen.
                      </Tooltip>
                    }
                  >
                    <img src={Info} />
                  </OverlayTrigger>
                </Form.Label>
                <Form.Select
                  value={this.state.pauseScene}
                  id="pause"
                  name="pause"
                  onChange={this.handlePause}
                  size="sm"
                >
                  <option value="-1">Select Pause Action Scene</option>
                  <option value="None">None</option>
                  {this.state.sceneList.map((scene) => (
                    <option value={scene.Id}>
                      {scene.Name} ({scene.Room})
                    </option>
                  ))}
                </Form.Select>
                <div style={{ paddingBottom: "0.75rem" }} />
              </>
            ) : (
              <></>
            )}
            {/* Resume Action */}
            {this.state.selectResume ? (
              <>
                <Form.Label for="resume">
                  Resume &nbsp;&nbsp;
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip>
                        This is the Hue scene that will activate when media is resumed from a paused state. Select
                        "None" if you don't want any action to happen.
                      </Tooltip>
                    }
                  >
                    <img src={Info} />
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
                  {this.state.sceneList.map((scene) => (
                    <option value={scene.Id}>
                      {scene.Name} ({scene.Room})
                    </option>
                  ))}
                </Form.Select>
                <div style={{ paddingBottom: "0.75rem" }} />
              </>
            ) : (
              <></>
            )}
            {/* Scrobble Action */}
            {this.state.selectScrobble ? (
              <>
                <Form.Label for="scrobble">
                  Scrobble &nbsp;&nbsp;
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip>
                        This is the Hue scene that will activate when media is scrobbled. Select "None" if you don't
                        want any action to happen.
                        <br />
                        <br />
                        In Plex, "scrobble" is the time when the media you are watching is considered "played". By
                        default, this time is set at the 90% mark of a video, but can be changed in the Plex Media
                        Server's settings.
                        <br />
                        <br />
                        As of version 1.31 of the Plex Media Server, scrobble can be set at end credits marker points.
                        This is good if you want your lights to react when credits start rolling.
                      </Tooltip>
                    }
                  >
                    <img src={Info} />
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
                  {this.state.sceneList.map((scene) => (
                    <option value={scene.Id}>
                      {scene.Name} ({scene.Room})
                    </option>
                  ))}
                </Form.Select>
                <div style={{ paddingBottom: "0.75rem" }} />
              </>
            ) : (
              <></>
            )}
            {/* Cancel/Save */}
            <Button onClick={this.props.cancel} variant="light">
              Cancel
            </Button>
            &nbsp;&nbsp;
            {this.state.selectSave ? (
              this.props.isEdit ? (
                <Button type="submit" variant="secondary">
                  Update
                </Button>
              ) : (
                <Button type="submit" variant="secondary">
                  Save
                </Button>
              )
            ) : (
              <></>
            )}
            {this.state.isIncomplete ? (
              <i style={{ color: "#f00" }}>&nbsp; All parameters must be selected. </i>
            ) : (
              <></>
            )}
            {this.state.isDuplicate ? (
              <i style={{ color: "#f00" }}>&nbsp; A client with the same matching user and media already exists. </i>
            ) : (
              <></>
            )}
          </Form>
          <br />
          <br />
        </div>
      );
    }
  }
}
