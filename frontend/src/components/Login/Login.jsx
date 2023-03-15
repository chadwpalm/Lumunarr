import React, { Component } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import LoginIcon from "bootstrap-icons/icons/box-arrow-in-left.svg";
import Logo from "../../images/LogoLarge.svg";
import Card from "react-bootstrap/Card";
import { PlexOauth, IPlexClientDetails } from "plex-oauth";

export default class Login extends Component {
  constructor(props) {
    super(props);

    this.state = {
      gotURL: false,
      gotToken: false,
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
      noInternet: false,
      error: null,
    };

    var thumb, email, username;

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
    if (!this.state.gotURL) {
      this.plexOauth
        .requestHostedLoginURL()
        .then((data) => {
          let [hostedUILink, pinId] = data;

          this.setState({ url: `${hostedUILink}`, pin: `${pinId}` });
        })
        .catch((err) => {
          this.setState({ noInternet: true });
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
    // if (this.externalWindow == null || this.externalWindow.closed) {
    const y = window.top.outerHeight / 2 + window.top.screenY - 300;
    const x = window.top.outerWidth / 2 + window.top.screenX - 300;
    this.externalWindow = window.open(
      `${this.state.url}`,
      "",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=600, height=600, top=${y}, left=${x}`
    );
    // } else {
    //   this.externalWindow.focus();
    // }

    await this.executePoll();
  };

  handleSaveToken = (token) => {
    console.log("Handle Save Token");

    var settings = { ...this.props.settings };
    console.log("Token 2: ", token);

    settings.token = token;
    settings.thumb = this.thumb;
    settings.email = this.email;
    settings.username = this.username;

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

    this.props.handleLogin();
    this.props.handleUpdateThumb(this.thumb, token, this.username, this.email);
  };

  handleGetThumb = (token) => {
    console.log("Handling thumb", token);
    var data = {};
    data.token = token;
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // request successful
          var response = xhr.responseText,
            json = JSON.parse(response);

          this.thumb = json.thumb;
          this.email = json.email;
          this.username = json.username;
        } else {
          console.log("Status Code: ", xhr.status);
          // error
        }
      }
    });
    xhr.open("POST", "/backend/thumb", false);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(data));
  };

  render() {
    if (this.state.gotURL) {
      return (
        <Container
          fluid
          style={{ backgroundImage: "linear-gradient(to bottom right, black, #ebaf00)", paddingTop: "30px" }}
        >
          <Card
            className="mx-auto"
            style={{ width: "350px", paddingTop: "30px", paddingBottom: "30px", backgroundColor: "#fcfcfc" }}
          >
            <Row>
              <div className="mx-auto" style={{ width: "75px" }}>
                <img src={Logo} width="75px" />
              </div>
            </Row>
            <Row style={{ textAlign: "center" }}>
              <p style={{ fontSize: "50px" }}>
                <b>HuePlex</b>
              </p>
            </Row>
            <Row style={{ textAlign: "center" }}>
              <p style={{ fontSize: "20px" }}>Sign in to Plex account to continue</p>
            </Row>
            <Row>
              <div className="mx-auto" style={{ width: "350px" }}>
                {this.state.gettingToken ? (
                  <Button variant="warning" style={{ width: "100%" }} onClick={this.handlePlexAuth} disabled>
                    <div style={{ color: "#444" }}>
                      <img src={LoginIcon} />
                      &nbsp;&nbsp; Loading...
                    </div>
                  </Button>
                ) : this.state.noInternet ? (
                  <Button variant="warning" style={{ width: "100%" }} onClick={this.handlePlexAuth} disabled>
                    <div style={{ color: "#444" }}>
                      <img src={LoginIcon} />
                      &nbsp;&nbsp; Sign in
                    </div>
                  </Button>
                ) : (
                  <Button variant="warning" style={{ width: "100%" }} onClick={this.handlePlexAuth}>
                    <div style={{ color: "#444" }}>
                      <img src={LoginIcon} />
                      &nbsp;&nbsp; Sign in
                    </div>
                  </Button>
                )}
              </div>
            </Row>
          </Card>
          <br />
          {this.state.noInternet ? (
            <div style={{ textAlign: "center", color: "#fff" }}>
              You must have an internet connection to sign into Plex
            </div>
          ) : (
            <></>
          )}
        </Container>
      );
    }
  }
}
