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
          <b>Lumunarr v1.4.5 Update</b>
          <br />
          <br />
          <b>Hotfix:</b>
          <br />
          <br />
          This updated addresses two minor issues:
          <br />
          <br />
          1. Fixed issue where not having default settings was causing Lumunarr to not work if a Client profile used
          Global settings and the Settings page hadn't been saved yet.
          <br />
          <br />
          2. Fixed issue where migration fails if no server settings have been created/saved.
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
