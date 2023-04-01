import React from "react";
import { Component } from "react";
import Loading from "../../images/loading-gif.gif";
import Logo from "../../images/HuePlexLogo.png";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "../Login/Login";
import Bridge from "../Bridge/Bridge";
import Device from "../Device/Device";
import Server from "../Server/Server";
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

export default class App extends Component {
  state = {
    isLoaded: false,
    isConnected: false,
    error: null,
    config: {},
    show: false,
    fullscreen: true,
    isLoggedIn: false,
  };

  componentDidMount() {
    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // request successful
          var response = xhr.responseText,
            json = JSON.parse(response);

          this.setState({
            isLoaded: true,
            config: json,
            thumb: json.thumb,
          });

          if (json.token) this.setState({ isLoggedIn: true });

          if (json.connected === "true") {
            this.setState({ isConnected: true });
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
    this.setState({ isLoggedIn: true });
  };

  handleConnectionChange = (change) => {
    change ? this.setState({ isConnected: true }) : this.setState({ isConnected: false });
  };

  handleClose = () => this.setState({ show: false });

  handleOpen = () => this.setState({ show: true, fullscreen: "md-down" });

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
                    </Nav>
                    <Nav className="ms-auto">
                      <NavDropdown
                        menuVariant="secondary"
                        id="dropdown-menu-align-end"
                        align="end"
                        title={
                          <Image
                            roundedCircle
                            src={this.state.config.thumb}
                            style={{ height: "40px", width: "40px" }}
                          />
                        }
                      >
                        <NavDropdown.Header>
                          <b>{this.state.config.username}</b>
                          <br />
                          {this.state.config.email}
                        </NavDropdown.Header>
                        <NavDropdown.Divider />
                        <NavDropdown.Item onClick={this.handleOpen}>About</NavDropdown.Item>
                        <NavDropdown.Item href="https://www.buymeacoffee.com/hueplex" target="_blank">
                          Donate
                        </NavDropdown.Item>
                        <NavDropdown.Item onClick={this.handleLogout}>
                          <img src={Logout} style={{ verticalAlign: "middle" }} />
                          &nbsp; Sign Out
                        </NavDropdown.Item>
                      </NavDropdown>
                    </Nav>
                  </Navbar.Collapse>
                </Navbar>
              </Row>

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
