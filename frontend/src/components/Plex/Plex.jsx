import React, { Component } from "react";
import { PlexOauth, IPlexClientDetails } from "plex-oauth";
import PlexButton from "../PlexButton/PlexButton";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Info from "bootstrap-icons/icons/info-circle.svg";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import Refresh from "../../images/icons8-restart-24.png";
import RefreshAnim from "../../images/icons8-restart.gif";

export default class Plex extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gotURL: false,
      gotToken: false,
      thumb: "",
      url: "",
      pin: null,
      ip: "",
      port: "",
      ssl: false,
      saved: false,
      openWindow: false,
      gettingToken: false,
      gettingIPs: false,
      isLoading: false,
      error: null,
    };
    let clientInformation: IPlexClientDetails = {
      clientIdentifier: `${this.props.settings.uuid}`, // This is a unique identifier used to identify your app with Plex.
      product: "HuePlex", // Name of your application
      device: `${this.props.settings.platform}`, // The type of device your application is running on
      version: `${this.props.settings.version}`, // Version of your application
      forwardUrl: "", // Url to forward back to after signing in.
      platform: "Web", // Optional - Platform your application runs on - Defaults to 'Web'
    };

    this.externalWindow = null;
    this.plexOauth = new PlexOauth(clientInformation);
  }
  componentDidMount() {
    if (this.props.settings["plex"]) {
      if (this.props.settings.plex["token"]) this.setState({ gotToken: true });
      if (this.props.settings.plex["ip"]) this.setState({ ip: this.props.settings.plex.ip });
      if (this.props.settings.plex["port"]) this.setState({ port: this.props.settings.plex.port });
      if (this.props.settings.plex["ssl"]) this.setState({ ssl: this.props.settings.plex.ssl });
    }

    if (!this.state.gotURL) {
      this.plexOauth
        .requestHostedLoginURL()
        .then((data) => {
          let [hostedUILink, pinId] = data;

          this.setState({ url: `${hostedUILink}`, pin: `${pinId}` });
        })
        .catch((err) => {
          throw err;
        });
      this.setState({
        gotURL: true,
      });
    }
  }

  executePoll = async () => {
    try {
      var token;
      if (!this.state.pin) {
        throw new Error("Unable to poll when pin is not initialized.");
      }
      await this.plexOauth
        .checkForAuthToken(this.state.pin)
        .then((authToken) => {
          // this.setState({ plexToken: String(authToken) });
          token = authToken;
          // console.log("In the plexOauth:", token);
          // An auth token will only be null if the user never signs into the hosted UI, or you stop checking for a new one before they can log in
        })
        .catch((err) => {
          throw err;
        });

      if (token) {
        this.setState({ gotToken: true });
        console.log("Token 1: ", token);
        this.handleGetThumb(token);
        this.handleSaveToken(token);
        this.externalWindow.close();
      } else if (token === null && !this.externalWindow.closed) {
        setTimeout(this.executePoll, 1000);
      } else {
        this.setState({ gettingToken: false });
        throw new Error("Window closed without completing login");
      }
    } catch (e) {
      console.log("Poll execution error: ", e);
      this.externalWindow.close();
    }
  };

  handlePlexAuth = async () => {
    this.setState({ gettingToken: true });
    if (this.externalWindow == null || this.externalWindow.closed) {
      const y = window.top.outerHeight / 2 + window.top.screenY - 300;
      const x = window.top.outerWidth / 2 + window.top.screenX - 300;
      this.externalWindow = window.open(
        `${this.state.url}`,
        "",
        `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=600, height=600, top=${y}, left=${x}`
      );
    } else {
      this.externalWindow.focus();
    }

    await this.executePoll();
  };

  handleGetThumb = (token) => {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // request successful
          var response = xhr.responseText,
            json = JSON.parse(response);
          console.log("At Create response");
          this.setState({ thumb: json });
        } else {
          console.log("Status Code: ", xhr.status);
          // error
        }
      }
    });
    xhr.open("POST", "/backend/thumb", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(token);
  };

  handleSaveToken = (token) => {
    console.log("Handle Save Token");

    var settings = { ...this.props.settings };
    console.log("Token 2: ", token);

    if (!settings.plex.token) {
      settings.plex = {};
      settings.plex.token = token;
    }

    // this.setState({
    //   isSearching: true,
    // });

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
  };

  handleRefresh = () => {};

  handleChange = (event) => {
    if (event.target.name === "ip") this.setState({ ip: event.target.value });
    if (event.target.name === "port") this.setState({ port: event.target.value });
    if (event.target.name === "ssl") this.setState({ ssl: event.target.checked });
  };

  handleFormSubmit = (event) => {
    console.log("Handle Form Submit");

    var settings = { ...this.props.settings };

    if (!settings.plex) settings.plex = {};

    settings.plex.ip = this.state.ip;
    settings.plex.port = this.state.port;
    settings.plex.ssl = this.state.ssl;

    // this.setState({
    //   isSearching: true,
    // });

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

    this.setState({ saved: true });
    event.preventDefault();
  };

  render() {
    if (this.state.gotURL) {
      return (
        <>
          <Row>
            <h3>Plex</h3>
          </Row>
          <Row>
            <PlexButton gotToken={this.state.gotToken} authHandle={this.handlePlexAuth} />
          </Row>
          <div style={{ paddingBottom: "0.75rem" }} />
          <Row>
            <Form onSubmit={this.handleFormSubmit}>
              <Form.Label for="server">Server</Form.Label>
              <InputGroup className="mb-3">
                {this.state.gettingIPs ? (
                  <Form.Select value="Manual configuration" id="manual" name="manual" onChange={this.handleIP}>
                    <option>Stuff</option>
                  </Form.Select>
                ) : (
                  <Form.Select disabled value="Manual configuration" id="manual" name="manual" onChange={this.handleIP}>
                    <option>Press the button to load available servers</option>
                  </Form.Select>
                )}
                <InputGroup.Text onClick={this.handleRefresh} style={{ cursor: "pointer" }}>
                  {this.state.isLoading ? <img src={RefreshAnim} /> : <img src={Refresh} />}
                </InputGroup.Text>
              </InputGroup>
              <div style={{ paddingBottom: "0.75rem" }} />
              <Form.Label for="ip">IP Address</Form.Label>
              <Form.Control type="text" value={this.state.ip} name="ip" onChange={this.handleChange} />
              <div style={{ paddingBottom: "0.75rem" }} />
              <Form.Label for="port">Port</Form.Label>
              <Form.Control type="text" value={this.state.port} name="port" onChange={this.handleChange} />
              <div style={{ paddingBottom: "0.75rem" }} />
              <Form.Label for="https">SSL&nbsp;&nbsp;</Form.Label>
              <Form.Check
                inline
                type="checkbox"
                name="ssl"
                checked={this.state.ssl}
                onChange={this.handleChange}
              ></Form.Check>
              <div style={{ paddingBottom: "0.75rem" }} />
              <Button type="submit" variant="secondary">
                Save Changes
              </Button>
            </Form>
            {this.state.saved === true ? <div>Settings Saved</div> : <div />}
          </Row>
        </>
      );
    }
  }
}
