import { Component } from "react";
import Loading from "../../images/loading-gif.gif";
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from "react-router-dom";
import Login from "../Login/Login";
import Bridge from "../Bridge/Bridge";
import Device from "../Device/Device";
import Server from "../Server/Server";
import Settings from "../Settings/Settings";
import Announce from "./Announce";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import Logout from "bootstrap-icons/icons/box-arrow-right.svg";
import Modal from "react-bootstrap/Modal";
import NavDropdown from "react-bootstrap/NavDropdown";
import Image from "react-bootstrap/Image";
import Badge from "react-bootstrap/Badge";
import { default as axios } from "axios";
import Moon from "bootstrap-icons/icons/moon-stars.svg";
import Sun from "bootstrap-icons/icons/sun.svg";
import Extern from "bootstrap-icons/icons/box-arrow-up-right.svg";
import { SIGNED_OUT_EVENT } from "../../signedOut";
import "./App.css";

// URL base injected by the backend into index.html (see app.js); "/" in the dev server
const basePath = window.__BASE_PATH__ || "/";

export default class App extends Component {
  state = {
    isLoaded: false,
    isConnected: false,
    error: null,
    config: {},
    show: false,
    fullscreen: true,
    fullscreenAnn: true,
    isLoggedIn: false,
    isUpdate: false,
    isOnline: true,
    isDarkMode: false,
    announce: false,
    first: false,
    dismiss: false,
    announcement: true, //master key to show an announcement after version update
    auth: {}, // backend/auth/status: whether this browser is let in, and the Plex sign-in client details
  };

  componentDidMount() {
    window.addEventListener(SIGNED_OUT_EVENT, this.handleSignedOut);
    this.loadSettings();
  }

  componentWillUnmount() {
    window.removeEventListener(SIGNED_OUT_EVENT, this.handleSignedOut);
  }

  // A backend request was refused (session ended, Authentication changed, or Plex rejected the saved
  // sign-in): back to the sign-in page
  handleSignedOut = () => {
    if (this.state.isLoggedIn) this.setState({ isLoggedIn: false });
  };

  // Newer version on GitHub? Dev builds compare with the develop branch, releases with main.
  async checkForUpdate(info) {
    let isUpdate = false;
    let online = true;
    if (info.branch === "dev") {
      const url = `https://raw.githubusercontent.com/chadwpalm/Lumunarr/develop/version.json?cb=${Date.now()}`;
      await axios
        .get(url, { headers: { "Content-Type": "application/json;charset=UTF-8" } })
        .then((response) => {
          if (response.data.version !== info.version) isUpdate = true;
        })
        .catch(() => {
          online = false;
        });
    } else {
      const url = `https://raw.githubusercontent.com/chadwpalm/Lumunarr/main/version.json`;
      await axios
        .get(url, { headers: { "Content-Type": "application/json;charset=UTF-8" } })
        .then((response) => {
          if (response.data.version !== info.version) isUpdate = true;
        })
        .catch(() => {});
    }
    return { online, isUpdate };
  }

  // Reads a backend response as JSON; throws with `status` and the server's message on failure
  async getJSON(url) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined;
    }
    if (!res.ok) {
      const err = new Error(data?.error || text || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async loadSettings() {
    // First ask whether this browser may use the app (backend/auth.js); the sign-in page needs these details too
    let auth;
    try {
      auth = await this.getJSON("backend/auth/status");
    } catch (err) {
      this.setState({ isLoaded: true, error: err.message });
      return;
    }

    const { online, isUpdate } = await this.checkForUpdate(auth);
    if (!online) {
      this.setState({ isOnline: false });
      return;
    }

    if (!auth.allowed) {
      this.setState({ isLoaded: true, isLoggedIn: false, auth });
      return;
    }

    let json;
    try {
      json = await this.getJSON("backend/load");
    } catch (err) {
      if (err.status === 401) this.setState({ isLoaded: true, isLoggedIn: false, auth });
      else this.setState({ isLoaded: true, error: err.message });
      return;
    }

    this.setState(
      {
        isLoaded: true,
        config: json,
        thumb: json.thumb,
        isUpdate,
        isLoggedIn: true,
        auth,
        isConnected: json.connected === "true",
        first: !!json.message,
        isDarkMode: json.darkMode,
      },
      this.toggleBodyClass,
    );
  }

  toggleBodyClass = () => {
    if (this.state.isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };

  handleLogin = () => {
    window.location.reload(false);
    // this.setState({ isLoggedIn: true });
  };

  handleConnectionChange = (change) => {
    change ? this.setState({ isConnected: true }) : this.setState({ isConnected: false });
  };

  handleClose = () => this.setState({ show: false });

  handleOpen = () => {
    this.setState({ show: true, fullscreen: "md-down" });
    // Config/app folders come from the server (CONFIG_DIR can change the config folder)
    fetch("backend/host")
      .then((res) => (res.ok ? res.json() : null))
      .then((host) => host && this.setState({ host }))
      .catch(() => {});
  };

  handleCloseAnn = () => {
    this.setState({ announce: false });
    if (this.state.dismiss) {
      var settings = { ...this.state.config };

      settings.message = false;

      var xhr = new XMLHttpRequest();

      xhr.addEventListener("readystatechange", () => {
        if (xhr.readyState === 4) {
          if (xhr.status !== 200) {
            // error
            this.setState({
              error: xhr.responseText,
            });
          }
        }
      });

      xhr.open("POST", "backend/save", true);
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.send(JSON.stringify(settings));
    }
  };

  handleOpenAnn = () => this.setState({ announce: true, first: false, fullscreenAnn: "md-down" });

  handleDismiss = () => {
    if (this.state.dismiss) {
      this.setState({ dismiss: false });
    } else {
      this.setState({ dismiss: true });
    }
  };

  // Ends this browser's session only (other browsers stay signed in)
  handleLogout = async () => {
    try {
      await fetch("backend/auth/logout", { method: "POST" });
    } catch {
      // reload anyway
    }
    window.location.reload(false);
  };

  handleDark = () => {
    this.setState((prevState) => {
      const newMode = !prevState.isDarkMode;
      var settings = { ...this.state.config };
      settings.darkMode = newMode;
      var xhr = new XMLHttpRequest();
      xhr.addEventListener("readystatechange", () => {
        if (xhr.readyState === 4) {
          if (xhr.status !== 200) {
            // error
            this.setState({
              error: xhr.responseText,
            });
          }
        }
      });
      xhr.open("POST", "backend/save", true);
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.send(JSON.stringify(settings));
      return { isDarkMode: newMode };
    }, this.toggleBodyClass);
  };

  render() {
    if (!this.state.isOnline) {
      return (
        <>
          Lumunarr requires an internet connection. If you are running Lumunarr in Docker, check your Docker network
          settings.
        </>
      );
    } else {
      if (!this.state.isLoaded) {
        // is loading
        return (
          <div>
            <img src={Loading} width="50" alt="" />
          </div>
        );
      } else if (this.state.error) {
        // error
        return <div>Error occured: {this.state.error}</div>;
      } else {
        if (this.state.isLoggedIn) {
          // success
          return (
            <Router basename={basePath}>
              <Container fluid>
                <Row className={`navbar-row ${this.state.isDarkMode ? "dark-mode" : ""}`}>
                  <Navbar className={`navbar-content ${this.state.isDarkMode ? "dark-mode" : ""}`} expand="md">
                    <Navbar.Brand>
                      <h2>
                        <b>Lumunarr</b>
                      </h2>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                      <Nav className="me-auto">
                        <Nav.Link as={NavLink} to="/" end disabled={!this.state.isConnected}>
                          Clients
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/server" disabled={!this.state.isConnected}>
                          Server
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/bridge">
                          Bridge
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/settings" disabled={!this.state.isConnected}>
                          Settings
                        </Nav.Link>
                      </Nav>
                      <Nav className="ms-auto d-flex align-items-center">
                        <Image
                          src={this.state.isDarkMode ? Sun : Moon}
                          className="moon-icon"
                          onClick={this.handleDark}
                        />
                        &nbsp;&nbsp;
                        <NavDropdown
                          menuVariant={this.state.isDarkMode ? "dark" : "secondary"}
                          id="dropdown-menu-align-end"
                          align="end"
                          title={
                            <>
                              <Image roundedCircle src={this.state.config.thumb} className="img-thumbnail" />
                              {this.state.isUpdate ? (
                                <Badge pill bg="danger" className="position-absolute top-20 translate-middle start-55">
                                  !
                                </Badge>
                              ) : (
                                <></>
                              )}
                            </>
                          }
                        >
                          <NavDropdown.Header>
                            <b>{this.state.config.username}</b>
                            <br />
                            {this.state.config.email}
                          </NavDropdown.Header>
                          <NavDropdown.Divider />
                          <NavDropdown.Item href="https://lumunarr.org/docs/Introduction" target="_blank">
                            Documentation
                          </NavDropdown.Item>
                          <NavDropdown.Item onClick={this.handleOpen}>About</NavDropdown.Item>
                          <NavDropdown.Item href="https://www.buymeacoffee.com/lumunarr" target="_blank">
                            Donate
                          </NavDropdown.Item>
                          {this.state.isUpdate ? (
                            <NavDropdown.Item
                              href="https://github.com/chadwpalm/Lumunarr/blob/develop/history.md"
                              target="_blank"
                              className="nav-dropdown-update"
                            >
                              Update Available
                            </NavDropdown.Item>
                          ) : (
                            <></>
                          )}
                          {this.state.auth.signedIn && (
                            <NavDropdown.Item onClick={this.handleLogout} className="d-flex align-items-center">
                              <img src={Logout} className="logout-icon" alt="" />
                              &nbsp; Sign Out
                            </NavDropdown.Item>
                          )}
                        </NavDropdown>
                      </Nav>
                    </Navbar.Collapse>
                  </Navbar>
                </Row>

                {this.state.first ? this.handleOpenAnn() : <></>}
                <Modal
                  show={this.state.show}
                  fullscreen={this.state.fullscreen}
                  onHide={this.handleClose}
                  size="lg"
                  animation={true}
                  className={this.state.isDarkMode ? "dark-mode" : ""}
                >
                  <Modal.Header closeButton closeVariant={this.state.isDarkMode ? "white" : ""}>
                    <Modal.Title>About</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <b>Version:</b> &nbsp;{this.state.config.version}
                    <br />
                    <b>Branch:</b> &nbsp;{this.state.config.branch}
                    <br />
                    <b>Build:</b> &nbsp;{this.state.config.build}
                    <br />
                    <b>Config Dir:</b>&nbsp; {this.state.host?.configDir ?? "…"}
                    <br />
                    <b>App Dir:</b>&nbsp; {this.state.host?.appDir ?? "…"}
                    <br />
                    <b>App ID:</b>&nbsp; {this.state.config.appId}
                    <br />
                    <b>Docker:</b>&nbsp;
                    <a href="https://hub.docker.com/r/chadwpalm/lumunarr" target="_blank" rel="noreferrer">
                      chadwpalm/lumunarr
                    </a>
                    &nbsp;&nbsp;
                    <img src={Extern} className="icon-size" alt="" />
                    <br />
                    <b>Source:</b>&nbsp;
                    <a href="https://github.com/chadwpalm/Lumunarr" target="_blank" rel="noreferrer">
                      github.com/chadwpalm/Lumunarr
                    </a>
                    &nbsp;&nbsp;
                    <img src={Extern} className="icon-size" alt="" />
                  </Modal.Body>
                </Modal>
                {this.state.announcement ? (
                  <Announce
                    announce={this.state.announce}
                    fullscreenAnn={this.state.fullscreenAnn}
                    handleCloseAnn={this.handleCloseAnn}
                    handleDismiss={this.handleDismiss}
                    dismiss={this.state.dismiss}
                    branch={this.state.config.branch}
                    isDarkMode={this.state.isDarkMode}
                  />
                ) : (
                  <></>
                )}
                <Row className="main-row">
                  <Routes>
                    <Route
                      path="/bridge"
                      element={
                        <Bridge
                          settings={this.state.config}
                          connection={this.handleConnectionChange}
                          isDarkMode={this.state.isDarkMode}
                        />
                      }
                    />

                    {!this.state.isConnected ? (
                      <Route path="*" element={<Navigate replace to="/bridge" />} />
                    ) : (
                      <>
                        <Route
                          path="/"
                          element={<Device settings={this.state.config} isDarkMode={this.state.isDarkMode} />}
                        />
                        <Route
                          path="/server"
                          element={<Server settings={this.state.config} isDarkMode={this.state.isDarkMode} />}
                        />
                        <Route
                          path="/settings"
                          element={
                            <Settings
                              settings={this.state.config}
                              auth={this.state.auth}
                              isDarkMode={this.state.isDarkMode}
                            />
                          }
                        />
                        <Route path="*" element={<Navigate replace to="/" />} />
                      </>
                    )}
                  </Routes>
                </Row>
              </Container>
            </Router>
          );
        } else {
          return (
            <Router basename={basePath}>
              <Routes>
                <Route path="*" element={<Navigate replace to="/login" />} />
                <Route path="/login" element={<Login handleLogin={this.handleLogin} settings={this.state.auth} />} />
              </Routes>
            </Router>
          );
        }
      }
    }
  }
}
