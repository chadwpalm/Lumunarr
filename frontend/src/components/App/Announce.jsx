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
        <b>Lumunarr v1.6.0 Update</b>
        <br />
        <br />
        While this release was originally intended to fix a backend crash due to a very niche edge-case, it ended up
        being an update worthy of a major version number change.
        <br />
        <br />
        Most of the changes are on the backend, but proved to be very important. The first change was updating Node to
        version 20 LTS in the Docker image since v18 is EOL. Speaking of Docker, I also changed the way the image
        builds, greatly reducing the image size.
        <br />
        <br />
        I also took the time to update all of the Node packages that are used in the app to remove all security
        vulnerablilties. An important part of this process involved ripping the band-aid off and re-writing the Plex
        login/authorization code to stop using an outdated 3rd-party Plex authorization package. Holding on to this
        package was forcing me to also hold on to outdated versions of packages it was depending on. So now officially I
        am rid of all 3rd-party Hue and Plex API helper packages and using custom code to interact with these platforms.
        Very long overdue.
        <br />
        <br />
        As always, I thank you for your support on this project and I hope you are enjoying using it.
        <br />
        <br />
        As a reminder, there is a Lumunarr Discord server located here:&nbsp;
        <a href="https://discord.gg/d76vc6bBJ6" target="_blank" rel="noreferrer">
          https://discord.gg/d76vc6bBJ6
        </a>
        <br />
        <br />
        And if you need support, you can either go to our GitHub page and submit an issue there, or go to the support
        channel on the Discord server.
        <br />
        <br />
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
