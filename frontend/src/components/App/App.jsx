import React from "react";
import { Component } from "react";
import Loading from "../../images/loading-gif.gif";
import Logo from "../../images/HuePlexLogo.png";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "../Login/Login";
import Bridge from "../Bridge/Bridge";
import Device from "../Device/Device";
import Server from "../Server/Server";
import Settings from "../Settings/Settings";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import { LinkContainer } from "react-router-bootstrap";
import Logout from "bootstrap-icons/icons/box-arrow-right.svg";
import Modal from "react-bootstrap/Modal";
import NavDropdown from "react-bootstrap/NavDropdown";
import Image from "react-bootstrap/Image";
import Badge from "react-bootstrap/Badge";
import { default as axios } from "axios";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

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
    announce: false,
    first: false,
    dismiss: false,
  };

  componentDidMount() {
    var xhr = new XMLHttpRequest();
    var state = false;
    var online = true;

    xhr.addEventListener("readystatechange", async () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // request successful
          var response = xhr.responseText,
            json = JSON.parse(response);

          if (json.branch === "dev") {
            var url = `https://raw.githubusercontent.com/chadwpalm/HuePlex/develop/version.json?cb=${Date.now()}`;

            await axios
              .get(url, { headers: { "Content-Type": "application/json;charset=UTF-8" } })
              .then(function (response) {
                var data = response.data;
                if (data.version !== json.version) {
                  state = true;
                }
              })
              .catch(function (error) {
                online = false;
              });
          } else {
            var url = `https://raw.githubusercontent.com/chadwpalm/HuePlex/main/version.json`;

            await axios
              .get(url, { headers: { "Content-Type": "application/json;charset=UTF-8" } })
              .then(function (response) {
                var data = response.data;

                if (data.version !== json.version) {
                  state = true;
                }
              })
              .catch(function (error) {});
          }

          if (!online) {
            this.setState({ isOnline: false });
          } else {
            this.setState({
              isLoaded: true,
              config: json,
              thumb: json.thumb,
            });

            if (state) this.setState({ isUpdate: true });

            if (json.token) this.setState({ isLoggedIn: true });

            if (json.connected === "true") {
              this.setState({ isConnected: true });
            }

            if (json.message) this.setState({ first: true });
          }
        } else {
          // error
          this.setState({
            isLoaded: true,
            error: xhr.responseText,
          });
        }
      }
    });

    xhr.open("GET", "/backend/load", true);
    xhr.send();
  }

  handleLogin = () => {
    window.location.reload(false);
    // this.setState({ isLoggedIn: true });
  };

  handleConnectionChange = (change) => {
    change ? this.setState({ isConnected: true }) : this.setState({ isConnected: false });
  };

  handleClose = () => this.setState({ show: false });

  handleOpen = () => this.setState({ show: true, fullscreen: "md-down" });

  handleCloseAnn = () => {
    this.setState({ announce: false });
    if (this.state.dismiss) {
      var settings = { ...this.state.config };

      settings.message = false;

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

  handleUpdateThumb = (thumb, token, username, email) => {
    var temp = this.state.config;
    temp.token = token;
    temp.thumb = thumb;
    temp.email = email;
    temp.username = username;
    this.setState({ config: temp });
  };

  handleLogout = () => {
    var settings = { ...this.state.config };

    delete settings["token"];
    delete settings["thumb"];
    delete settings["email"];
    delete settings["username"];

    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          this.setState({ isLoggedIn: false });
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
  };

  render() {
    if (!this.state.isOnline) {
      return (
        <>
          HuePlex requires an internet connection. If you are running HuePlex in Docker, check your Docker network
          settings.
        </>
      );
    } else {
      if (!this.state.isLoaded) {
        // is loading
        return (
          <div>
            <img src={Loading} width="50" />
          </div>
        );
      } else if (this.state.error) {
        // error
        return <div>Error occured: {this.state.error}</div>;
      } else {
        if (this.state.isLoggedIn) {
          // success
          return (
            <Router>
              <Container fluid>
                <Row style={{ borderBottom: "solid", borderBottomColor: "black" }}>
                  <Navbar
                    style={{
                      backgroundColor: "#ddd",
                      paddingLeft: "15px",
                      paddingRight: "15px",
                    }}
                    expand="md"
                  >
                    <Navbar.Brand>
                      <img src={Logo} className="d-inline-block align-top" /> HuePlex
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                      <Nav className="me-auto">
                        {!this.state.isConnected ? (
                          <>
                            <LinkContainer to="/">
                              <Nav.Link disabled>Clients</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/server">
                              <Nav.Link disabled>Server</Nav.Link>
                            </LinkContainer>
                          </>
                        ) : (
                          <>
                            <LinkContainer to="/">
                              <Nav.Link>Clients</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to="/server">
                              <Nav.Link>Server</Nav.Link>
                            </LinkContainer>
                          </>
                        )}
                        <LinkContainer to="/bridge">
                          <Nav.Link>Bridge</Nav.Link>
                        </LinkContainer>
                        {!this.state.isConnected ? (
                          <>
                            <LinkContainer to="/settings">
                              <Nav.Link disabled>Settings</Nav.Link>
                            </LinkContainer>
                          </>
                        ) : (
                          <>
                            <LinkContainer to="/settings">
                              <Nav.Link>Settings</Nav.Link>
                            </LinkContainer>
                          </>
                        )}
                      </Nav>
                      <Nav className="ms-auto">
                        <NavDropdown
                          menuVariant="secondary"
                          id="dropdown-menu-align-end"
                          align="end"
                          title={
                            <>
                              <Image
                                roundedCircle
                                src={this.state.config.thumb}
                                style={{ height: "40px", width: "40px" }}
                              />
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
                          <NavDropdown.Item href="https://github.com/chadwpalm/HuePlex/wiki" target="_blank">
                            Documentation
                          </NavDropdown.Item>
                          <NavDropdown.Item onClick={this.handleOpen}>About</NavDropdown.Item>
                          <NavDropdown.Item href="https://www.buymeacoffee.com/hueplex" target="_blank">
                            Donate
                          </NavDropdown.Item>
                          {this.state.isUpdate ? (
                            <NavDropdown.Item
                              href="https://github.com/chadwpalm/HuePlex/blob/develop/history.md"
                              target="_blank"
                              style={{ color: "red" }}
                            >
                              Update Available
                            </NavDropdown.Item>
                          ) : (
                            <></>
                          )}
                          <NavDropdown.Item onClick={this.handleLogout}>
                            <img src={Logout} style={{ verticalAlign: "middle" }} />
                            &nbsp; Sign Out
                          </NavDropdown.Item>
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
                >
                  <Modal.Header closeButton>
                    <Modal.Title>About</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <b>Version:</b> &nbsp;{this.state.config.version}
                    <br />
                    <b>Branch:</b> &nbsp;{this.state.config.branch}
                    <br />
                    <b>Build:</b> &nbsp;{this.state.config.build}
                    <br />
                    <b>Config Dir:</b>&nbsp; /config
                    <br />
                    <b>App Dir:</b>&nbsp; /HuePlex
                    <br />
                    <b>App ID:</b>&nbsp; {this.state.config.appId}
                    <br />
                    <b>Docker:</b>&nbsp;
                    <a href="https://hub.docker.com/repository/docker/chadwpalm/hueplex/general" target="_blank">
                      chadwpalm/hueplex
                    </a>
                    <br />
                    <b>Source:</b>&nbsp;
                    <a href="https://github.com/chadwpalm/HuePlex" target="_blank">
                      github.com/chadwpalm/HuePlex
                    </a>
                  </Modal.Body>
                </Modal>
                <Modal
                  show={this.state.announce}
                  fullscreen={this.state.fullscreenAnn}
                  onHide={this.handleCloseAnn}
                  size="lg"
                  animation={true}
                >
                  <Modal.Header>
                    <Modal.Title>Announcement</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    Due to Plex's trademark guidelines for product naming, HuePlex is being rebranded to <b>Lumunarr</b>
                    .
                    <br />
                    <br />
                    This will be the final release under the name HuePlex. The GitHub repository will be renamed to
                    <b>https://github.com/chadwpalm/lumunarr</b> and the new Docker repository will be{" "}
                    <b>chadwpalm/lumunarr</b>.
                    <br />
                    <br />
                    If you are running this app natively, the app will simply be rebranded in the next release found at
                    the renamed GitHub repo. If you are using Docker, you will need to pull the image from the new
                    Docker Hub repo and recreate the container or update your Docker Compose file accordingly. This is
                    important if you are using an auto-update app like Watchtower.
                    <br />
                    <br />
                    Thank you for your support and I look forward to continue growing this app as Lumunarr!
                    <br />
                    <br />
                    <Form.Check
                      inline
                      label="Do not show this message again"
                      id="Dismiss"
                      name="Dismiss"
                      onChange={this.handleDismiss}
                      size="sm"
                      checked={this.state.dismiss}
                    />
                    <br />
                    <br />
                    <Button onClick={this.handleCloseAnn}>Dismiss</Button>
                  </Modal.Body>
                </Modal>
                <Row
                  style={{
                    paddingLeft: 30,
                    paddingTop: 30,
                    paddingRight: 30,
                    borderTop: "solid",
                    borderTopColor: "#ebaf00",
                  }}
                >
                  <Routes>
                    <Route
                      path="/bridge"
                      element={<Bridge settings={this.state.config} connection={this.handleConnectionChange} />}
                    />

                    {!this.state.isConnected ? (
                      <Route path="*" element={<Navigate replace to="/bridge" />} />
                    ) : (
                      <>
                        <Route path="/" element={<Device settings={this.state.config} />} />
                        <Route path="/server" element={<Server settings={this.state.config} />} />
                        <Route path="/settings" element={<Settings settings={this.state.config} />} />
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
            <Router>
              <Routes>
                <Route path="*" element={<Navigate replace to="/login" />} />
                <Route
                  path="/login"
                  element={
                    <Login
                      handleLogin={this.handleLogin}
                      handleUpdateThumb={this.handleUpdateThumb}
                      settings={this.state.config}
                    />
                  }
                />
              </Routes>
            </Router>
          );
        }
      }
    }
  }
}
