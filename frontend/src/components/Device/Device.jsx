import React, { Component } from "react";
import { v4 as uuid } from "uuid";
import Client from "../Client/Client";
import AddIcon from "../../images/add-icon.png";
import Create from "../Create/Create";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import "./Device.css";

export default class Device extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clients: [],
      isCreating: false,
      uid: "-1",
      isEdit: false,
      show: false,
      tempID: "",
    };
    this.state.clients = this.props.settings.clients;
  }

  handleAddClient = () => {
    this.setState({
      isCreating: true,
      isEdit: false,
      uid: "-1",
    });
  };

  handleEditClient = (e) => {
    this.setState({
      isCreating: true,
      isEdit: true,
      uid: e,
    });
  };

  handleCopyClient = (id) => {
    var settings = { ...this.props.settings };

    // Find the index of the profile to copy
    const index = settings.clients.findIndex(({ uid }) => uid === id);

    if (index === -1) {
      // Handle the case where the profile isn't found
      return;
    }

    // Get the profile to copy
    const profileToCopy = { ...settings.clients[index] };

    // Deep copy the client object (to avoid modifying the original)
    profileToCopy.client = { ...profileToCopy.client };

    // Create a new UID for the copied profile
    profileToCopy.uid = uuid().toString(); // Generate a new unique ID for the copy
    profileToCopy.client.title =
      profileToCopy.client.title && profileToCopy.client.title.trim() !== ""
        ? profileToCopy.client.title + " (copy)"
        : profileToCopy.client.name + " (copy)";

    // Push the copied profile into the settings
    settings.clients.push(profileToCopy);

    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          this.setState({ show: false });
        } else {
          // error
          this.setState({
            show: false,
            error: xhr.responseText,
          });
        }
      }
    });

    xhr.open("POST", "/backend/save", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(settings));
  };

  handleCancelCreate = () => {
    this.setState({ isCreating: false, isEdit: false });
  };

  handleSaveCreate = () => {
    this.setState({ isCreating: false, isEdit: false });
  };

  handleClose = () => this.setState({ show: false });

  handleOpen = (e) => {
    this.setState({ tempID: e });
    this.setState({ show: true, fullscreen: "md-down" });
  };

  handleDelete = (e) => {
    e.preventDefault();

    var settings = { ...this.props.settings };

    const index = settings.clients.findIndex(({ uid }) => uid === this.state.tempID);

    settings.clients.splice(index, 1);

    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          this.setState({ show: false });
        } else {
          // error
          this.setState({
            show: false,
            error: xhr.responseText,
          });
        }
      }
    });

    xhr.open("POST", "/backend/save", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(settings));

    this.handleSaveCreate();
  };

  handleChecked = (checked, id) => {
    var settings = { ...this.props.settings };

    const index = settings.clients.findIndex(({ uid }) => uid === id);

    var client = settings.clients[index];
    client.active = checked;
    settings.clients.splice(index, 1, client);

    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
        } else {
          // error
          this.setState({
            show: false,
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
    return (
      <>
        <Row>
          <h3>Clients</h3>
        </Row>
        <Row xs={2} sm="auto">
          {this.state.clients?.map((client) => (
            <Col>
              <Client
                settings={this.props.settings}
                client={client.client.name}
                user={client.user.name}
                media={client.media}
                id={client.uid}
                stateId={this.state.uid}
                click={this.handleEditClient}
                copy={this.handleCopyClient}
                saved={this.handleSaveCreate}
                isEdit={this.state.isEdit}
                isCreating={this.state.isCreating}
                delete={this.handleOpen}
                checked={client.active}
                isChecked={this.handleChecked}
                isDarkMode={this.props.isDarkMode}
                title={client.client.title ?? ""}
              />
              <br />
            </Col>
          ))}

          <Col>
            {this.state.isEdit || this.state.isCreating ? (
              <Card
                className={`card-global ${this.state.uid === "-1" ? "card-error" : "card-default"} ${
                  this.props.isDarkMode ? "dark-mode" : ""
                }`}
              >
                <Card.Body className="d-flex align-items-center justify-content-center">
                  <img src={AddIcon} width="100" height="100" className="plus-image" alt="" />
                </Card.Body>
              </Card>
            ) : (
              <Card
                className={`card-global card-unselected ${this.props.isDarkMode ? "dark-mode" : ""}`}
                onClick={this.handleAddClient}
              >
                <Card.Body className="d-flex align-items-center justify-content-center">
                  <img src={AddIcon} width="100" height="100" className="plus-image" alt="" />
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
        <Row className="row-custom">
          {this.state.isCreating ? (
            <Create
              settings={this.props.settings}
              cancel={this.handleCancelCreate}
              saved={this.handleSaveCreate}
              uid={this.state.uid}
              isEdit={this.state.isEdit}
              logout={this.props.logout}
              isDarkMode={this.props.isDarkMode}
            />
          ) : (
            <h6>Click the plus to add a new device.</h6>
          )}
        </Row>
        <Modal
          show={this.state.show}
          fullscreen={this.state.fullscreen}
          onHide={this.handleClose}
          size="sm"
          backdrop="static"
          className={this.props.isDarkMode ? "dark-mode" : ""}
        >
          <Modal.Body>
            <h4> Are you sure?</h4>
            <Button variant={this.props.isDarkMode ? "secondary" : "primary"} onClick={this.handleDelete}>
              Yes
            </Button>
            &nbsp;&nbsp;&nbsp;
            <Button variant={this.props.isDarkMode ? "outline-light" : ""} onClick={this.handleClose}>
              Cancel
            </Button>
          </Modal.Body>
        </Modal>
      </>
    );
  }
}
