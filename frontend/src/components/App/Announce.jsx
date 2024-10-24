import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

export default class Client extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Modal
        show={this.props.announce}
        fullscreen={this.props.fullscreenAnn}
        onHide={this.props.handleCloseAnn}
        size="lg"
        animation={true}
      >
        <Modal.Header>
          <Modal.Title>Announcement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <b>Lumunarr v1.5.0 Update</b>
          <br />
          <br />
          After taking time to work on other projects I decided to come back and complete some of the things I've been
          wanting to do with this app for a while. This will probably be the last major update for this app since I feel
          it is at a point that I am satisfied with. It grew much larger than I originally expected and that is due to a
          great community offering suggestions and helping report bugs.
          <br />
          <br />
          Any future work on this app will be mostly fixing any bugs that rear their heads or if any 3rd party APIs
          change forcing an update for functionality.
          <br />
          <br />
          You can find the changelog for this version here:{" "}
          {this.props.branch === "dev" ? (
            <a href="https://github.com/chadwpalm/Lumunarr/blob/develop/history.md">Changelog</a>
          ) : (
            <a href="https://github.com/chadwpalm/Lumunarr/blob/main/history.md">Changelog</a>
          )}
          <br />
          <br />
          <Form.Check
            inline
            label="Do not show this message again"
            id="Dismiss"
            name="Dismiss"
            onChange={this.props.handleDismiss}
            size="sm"
            checked={this.props.dismiss}
          />
          <br />
          <br />
          <Button onClick={this.props.handleCloseAnn}>Dismiss</Button>
        </Modal.Body>
      </Modal>
    );
  }
}
