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
          <b>Welcome to Lumunarr v1.4.0</b>
          <br />
          <br />
          This update now utilizes Hue API v2 for all API calls to the Hue bridge. Since Hue API v2 uses a different
          schema for scene and light IDs, the settings.js file will be automatically migrated to support the new IDs.
          Since this is a breaking change for previous versions of Lumunarr, a backup of the old settings file will be
          made in case you wish to revert back to an older version.
          <br />
          <br />
          Smart scenes are now supported (such as the Natural Light scene) due to the Hue API update.
          <br />
          Note: Hue currently does not support on/off transitions for smart scenes. Please be aware of this before
          submitting an issue.
          <br />
          <br />
          Also due to the Hue API update, the way colors are selected have changes from hue/saturation to using the X/Y
          coordinates of CIE color space. Hopefully this will bring all variations of lights closer to the correct
          colors when using the Server behavior options.
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
