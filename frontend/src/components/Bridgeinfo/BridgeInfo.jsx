import React, { Component } from "react";
import Button from "react-bootstrap/Button";
import "./Bridgeinfo.css";

export default class BridgeInfo extends Component {
  render() {
    const { name, id, ip, onActivate, isButton, isDarkMode } = this.props;

    if (isButton) {
      return (
        <Button variant={`${isDarkMode ? "outline-light" : "outline-dark"}`} onClick={() => onActivate(name, id, ip)}>
          <div>Name: {name}</div>
          <div>ID: {id}</div>
          <div>IP: {ip}</div>
        </Button>
      );
    } else {
      return (
        <Button disabled variant={`${isDarkMode ? "outline-light" : "outline-dark"}`}>
          <div>Name: {name}</div>
          <div>ID: {id}</div>
          <div>IP: {ip}</div>
        </Button>
      );
    }
  }
}
