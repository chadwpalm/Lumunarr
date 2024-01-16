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
          Welcome to <b>Lumunarr</b>!
          <br />
          <br />
          This release and all future releases will be under the product name Lumunarr (formerly known at HuePlex).
          <br />
          <br />
          As a reminder, the new GitHub repository for Lumunarr is <b>https://github.com/chadwpalm/Lumunarr</b> and the
          new Docker repository is <b>chadwpalm/lumunarr</b>.
          <br />
          <br />
          As always, if you have any support issues with the app, you can file them under the GitHub issues tab:{" "}
          <b>https://github.com/chadwpalm/Lumunarr/issues</b>
          <br />
          <br />
          Aagin, thank you for your support and I look forward to continue growing this app as Lumunarr!
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
