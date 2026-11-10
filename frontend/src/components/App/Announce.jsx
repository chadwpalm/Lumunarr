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
        <b>Lumunarr v1.7.1 Update</b>
        <br />
        <br />
        This is an important security update, particularly for those who access Lumunarr from the internet. The update
        also includes a few quality of life improvements, and a handful of bug fixes.
        <ul>
          <li>
            <b>Login Security.</b> Your Plex login also serves as your Lumunarr login now, and your Plex token is stored
            in a more secure way. If you are using Lumunarr from the internet, this is a must-have update.
          </li>
          <li>
            <b>New Security section in Settings.</b> You can now set Lumunarr to either require authorization for every
            browser, or not required for local addresses.
          </li>
          <li>
            <b>Docker Change.</b> Lumunarr does not have a standalone ARM image anymore. If you are running Lumunarr in
            Docker, please update your image to the latest version. The new image is now multi-arch and will run on both
            x86 and ARM devices.
          </li>
        </ul>
        As always, for the full list of changes, check out the{" "}
        {branch === "dev" ? (
          <a href="https://github.com/chadwpalm/Lumunarr/blob/develop/history.md" target="_blank" rel="noreferrer">
            changelog
          </a>
        ) : (
          <a href="https://github.com/chadwpalm/Lumunarr/blob/main/history.md" target="_blank" rel="noreferrer">
            changelog
          </a>
        )}
        .
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
