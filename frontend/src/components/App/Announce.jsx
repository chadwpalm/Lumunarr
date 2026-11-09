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
        <b>Lumunarr v1.7.0 Update</b>
        <br />
        <br />
        Remember back in v1.5.0 when I said that would probably be the last major update? Yeah... about that. What
        started as a routine security update turned into giving Lumunarr a fresh coat of paint and a brand new engine
        under the hood.
        <ul>
          <li>
            <b>A new look.</b> The Settings, Server and profile pages are now organized into tidy sections, and they
            make much better use of the screen, especially on your phone.
          </li>
          <li>
            <b>Easier profiles.</b> Each trigger (Play, Pause, Stop and friends) now gets its own row, and the poster
            options pop up right under the trigger that uses them.
          </li>
          <li>
            <b>Poster colors got some love.</b> Using just one poster color now actually works (oops), and your dominant
            light gets the poster's most dominant color.
          </li>
          <li>
            <b>"Why didn't my lights change?"</b> Lumunarr now tells you. Set the log level to Debug under Settings &gt;
            Logging and the logs will explain exactly why each profile did or didn't react.
          </li>
          <li>
            <b>Reverse proxy friendly.</b> Lumunarr can now run on a different port or behind a URL like
            yourdomain.com/lumunarr. Look for the new Host section in Settings.
          </li>
          <li>
            <b>Fresh and secure.</b> Everything under the hood has been updated to the latest versions, with zero known
            security vulnerabilities. You won't see most of it, but your Docker image will thank you.
          </li>
        </ul>
        A handful of bugs were squashed along the way too. For the full (and much nerdier) list of changes, check out
        the{" "}
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
        As always, thank you for your support on this project, and I hope you enjoy the new look!
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
