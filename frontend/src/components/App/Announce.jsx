import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Extern from "bootstrap-icons/icons/box-arrow-up-right.svg";
import "./App.css";

const Announce = ({ announce, fullscreenAnn, handleCloseAnn, branch, handleDismiss, dismiss, isDarkMode }) => {
  return (
    <Modal
      show={announce}
      fullscreen={fullscreenAnn}
      onHide={handleCloseAnn}
      size="lg"
      animation={true}
      className={isDarkMode ? "dark-mode" : ""}
    >
      <Modal.Header>
        <Modal.Title>Announcement</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <b>Lumunarr v1.5.2 Update</b>
        <br />
        <br />
        <ul>
          <li>
            Fixed issues with "Restore Pre-Play" option that was introduced in v1.5.0.
            <br />
            <br />
          </li>
          <li>
            Added in a feature in the client add/edit form to ignore Play, Pause, Resume, Stop triggers if all lights
            are off.
          </li>
        </ul>
        <Form.Check
          inline
          label="Do not show this message again"
          id="Dismiss"
          name="Dismiss"
          onChange={handleDismiss}
          size="sm"
          checked={dismiss}
        />
        <br />
        <br />
        <Button variant={isDarkMode ? "secondary" : "primary"} onClick={handleCloseAnn}>
          Dismiss
        </Button>
      </Modal.Body>
    </Modal>
  );
};

export default Announce;
