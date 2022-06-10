// import styled from "styled-components";
import React from "react";
import { Component } from "react";
import bridgecon from "../../images/bridgecon.png";
import bridgedis from "../../images/bridgedis.png";
import Device from "../device/device";

class Bridge extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      error: null,
      isConnected: false,
      devices: [],
    };
  }

  componentDidMount() {
    console.log("Bridge did Mount");

    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // request successful
          var response = xhr.responseText,
            json = JSON.parse(response);

          console.log("At bridge response", json);

          this.setState({
            isLoaded: true,
            devices: json,
          });
        } else {
          // error
          this.setState({
            isLoaded: true,
            error: xhr.responseText,
          });
        }
      }
    });

    xhr.open("GET", "/backend/detect", true);
    xhr.send();
  }

  //minipulate config file here
  handleActivate = (id, ip) => {
    console.log("Handle Activate", id, ip);

    var settings = { ...this.props.settings };
    settings.connected = "true";
    settings.device = { id: id, ip: ip };

    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // request successful
          // var response = xhr.responseText,
          //   json = JSON.parse(response);

          this.props.settings.connected = "true";
          this.props.settings.device = { id: id, ip: ip };

          this.setState({
            isConnected: true,
          });
        } else {
          // error
          this.setState({
            isLoaded: true,
            error: xhr.responseText,
          });
        }
      }
    });

    xhr.open("POST", "/backend/save", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    console.log("Before send:", settings);
    xhr.send(JSON.stringify(settings));
  };

  render() {
    console.log("Bridge did render");
    // const { settings } = this.props;
    if (this.props.settings.connected === "false") {
      if (!this.state.isLoaded) {
        return <h2>Scanning for bridges...</h2>;
      } else if (this.state.error) {
        return <div>Error occured: {this.state.error}</div>;
      } else {
        if (this.state.devices.length === 1) {
          this.handleActivate(
            this.state.devices[0].Id,
            this.state.devices[0].IP
          );
        } else {
          return (
            <>
              <div>
                <img src={bridgedis} width="150" />
              </div>
              <h3>{this.state.devices.length} devices were found</h3>
              <h4>Please select a bridge to use below</h4>
              {this.state.devices.map((device) => (
                <div>
                  <Device
                    id={device.Id}
                    ip={device.IP}
                    onActivate={this.handleActivate}
                    isButton={true}
                  />
                </div>
              ))}
            </>
          );
        }
      }
    } else {
      return (
        <>
          <div>
            <img src={bridgecon} width="150" />
          </div>
          <div>
            <Device
              id={this.props.settings.device.id}
              ip={this.props.settings.device.ip}
              onActivate={this.handleActivate}
              isButton={false}
            />
          </div>
        </>
      );
    }
  }
}

export default Bridge;
