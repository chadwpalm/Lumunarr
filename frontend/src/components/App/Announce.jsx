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
        <b>Lumunarr v1.5.0 Update</b>
        <br />
        <br />
        After taking time to work on other projects I decided to come back and complete some of the things I've been
        wanting to do with this app for a while. This will probably be the last major update for this app since I feel
        it is at a point that I am satisfied with. It grew much larger than I originally expected and that is due to a
        great community offering suggestions and helping report bugs.
        <br />
        <br />
        Any future work on this app will be mostly fixing any bugs that rear their heads or if any 3rd party APIs change
        forcing an update for functionality.
        <br />
        <br />
        This is a large feature update, so please check out the changelog to see what's been added so you can take
        advantage of anything new.
        <br />
        <br />
        You can find the changelog for this version here:{" "}
        {branch === "dev" ? (
          <>
            <a href="https://github.com/chadwpalm/Lumunarr/blob/develop/history.md" target="_blank">
              Changelog
            </a>
            &nbsp;&nbsp;
            <img src={Extern} className="icon-size" />
          </>
        ) : (
          <>
            <a href="https://github.com/chadwpalm/Lumunarr/blob/main/history.md" target="_blank">
              Changelog
            </a>
            &nbsp;&nbsp;
            <img src={Extern} className="icon-size" />
          </>
        )}
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
