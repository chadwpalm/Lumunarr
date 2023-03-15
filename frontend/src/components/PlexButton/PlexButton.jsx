import React, { Component } from "react";
import logo from "./plex-logo.png";

class PlexButton extends Component {
  render() {
    if (this.props.gotToken) {
      return (
        <button onClick={this.props.authHandle} disabled>
          <img src={logo} width="50" />
        </button>
      );
    } else {
      return (
        <button onClick={this.props.authHandle}>
          <img src={logo} width="50" />
        </button>
      );
    }
  }
}

export default PlexButton;
