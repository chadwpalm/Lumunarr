import React from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
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
        <b>Lumunarr v1.5.4 Update</b>
        <br />
        <br />
        <ul>
          <li>
            There is now an option to add a delay on pause where if resume or stop is recalled before the delay is up it
            will not perform the pause action. This was added to fix an issue where some Plex clients pause when seeking
            forward/backward. If set to "Off", pause will act as it always has.
            <br />
            <br />
          </li>
          <li>
            The ability to filter out movies and TV shows by library and server has also been added. You are not tied
            down to a certain media type anymore and if you have multiple Plex servers claimed you can chose libraries
            from specific servers.
            <br />
            <br />
          </li>
          <li>
            Lumunarr is now on <b>Discord</b>! Come join the community and chat about Lumunarr as well as receive
            real-time support!
            <br />
            <br />
            Discord Invite Link:{" "}
            <a href="https://discord.gg/d76vc6bBJ6" target="_blank" rel="noreferrer">
              https://discord.gg/d76vc6bBJ6
            </a>
            <br />
            <br />
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
