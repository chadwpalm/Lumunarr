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
          <b>Lumunarr v1.4.2 Update</b>
          <br />
          <br />
          This update addresses one change and one fix.
          <br />
          <br />
          <b>Change:</b>
          <br />
          <br />
          Increased the Hue Bridge button press authorization time from 10 to 30 seconds. This should give users more
          time to press the button if it is in a more remote location.
          <br />
          <br />
          <b>Fix:</b>
          <br />
          <br />
          Lumunarr will now automatically sign out and require signing back in when Plex credentials are invalid or
          expired. Previously the user needed to manually sign out and sign back in to recreate the auth token. Now it
          will automatically log the user out.
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
