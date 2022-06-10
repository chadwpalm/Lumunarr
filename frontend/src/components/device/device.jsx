import React, { Component } from "react";
import styled from "styled-components";

const deviceBox = styled.button`
  color: palevioletred;
  font-size: 1em;
  margin: 1em;
  padding: 0.25em 1em;
  border: 2px solid palevioletred;
  border-radius: 3px;
`;

class Device extends Component {
  render() {
    const { id, ip, onActivate, isButton } = this.props;

    if (isButton) {
      return (
        <button onClick={() => onActivate(id, ip)}>
          <div>ID: {id}</div>
          <div>IP: {ip}</div>
        </button>
      );
    } else {
      return (
        <button>
          <div>ID: {id}</div>
          <div>IP: {ip}</div>
        </button>
      );
    }
  }
}

export default Device;
