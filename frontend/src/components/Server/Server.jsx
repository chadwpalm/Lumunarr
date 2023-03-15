import React, { Component } from "react";
import Row from "react-bootstrap/Row";
import Form from "react-bootstrap/Form";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Info from "bootstrap-icons/icons/info-circle.svg";
import Button from "react-bootstrap/Button";
import Loading from "../../images/loading-gif.gif";

export default class Server extends Component {
  constructor(props) {
    super(props);
    console.log("Seeeee: ", this.props.settings);
    if (this.props.settings.server) {
      this.state = {
        lightPlay: this.props.settings.server.lightPlay.toString(),
        behaviorPlay: this.props.settings.server.behaviorPlay.toString(),
        colorPlay: this.props.settings.server.colorPlay.toString(),
        brightnessPlay: this.props.settings.server.brightnessPlay.toString(),
        intervalsPlay: this.props.settings.server.intervalsPlay.toString(),
        lightNew: this.props.settings.server.lightNew.toString(),
        behaviorNew: this.props.settings.server.behaviorNew.toString(),
        colorNew: this.props.settings.server.colorNew.toString(),
        brightnessNew: this.props.settings.server.brightnessNew.toString(),
        intervalsNew: this.props.settings.server.intervalsNew.toString(),
        lightList: [],
        isLoading: true,
        selectIntervalsPlay: false,
        selectIntervalsNew: false,
        isError: false,
        isIncomplete: false,
        errorRes: "",
        isEdit: true,
      };
    } else {
      this.state = {
        lightPlay: "-1",
        behaviorPlay: "-1",
        colorPlay: "-1",
        brightnessPlay: "-1",
        intervalsPlay: "-1",
        lightNew: "-1",
        behaviorNew: "-1",
        colorNew: "-1",
        brightnessNew: "-1",
        intervalsNew: "-1",
        lightList: [],
        isLoading: true,
        selectIntervalsPlay: false,
        selectIntervalsNew: false,
        isIncomplete: false,
        errorRes: "",
        isEdit: false,
      };
    }
  }

  componentDidMount() {
    var settings = { ...this.props.settings };

    var xhr = new XMLHttpRequest();
    xhr.timeout = 10000;
    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // request successful
          var response = xhr.responseText,
            json = JSON.parse(response);
          console.log("At Create response");
          this.setState({ lightList: json });
          this.setState({ isLoading: false });
        } else {
          console.log("Status Code: ", xhr.status);
          // error
          this.setState({
            isLoaded: true,
            isError: true,
            errorRes: xhr.responseText,
          });
        }
      }
    });
    xhr.open("POST", "/backend/server", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    console.log("Before send:", settings);
    xhr.send(JSON.stringify(settings));
  }

  handleFormSubmit = (e) => {
    e.preventDefault();
    console.log("Handle Save");

    if (
      this.state.lightPlay === "-1" ||
      this.state.behaviorPlay === "-1" ||
      this.state.colorPlay === "-1" ||
      this.state.brightnessPlay === "-1" ||
      (this.state.intervalsPlay === "-1" && this.state.behaviorPlay === "2") ||
      this.state.lightNew === "-1" ||
      this.state.behaviorNew === "-1" ||
      this.state.colorNew === "-1" ||
      this.state.brightnessNew === "-1" ||
      (this.state.intervalsNew === "-1" && this.state.behaviorNew === "2")
    ) {
      this.setState({ isIncomplete: true });
      return;
    }

    // var settings = { ...this.props.settings };

    // if (!settings.server) settings.server = {};

    // settings.server.lightPlay = this.state.lightPlay;
    // settings.server.behaviorPlay = this.state.behaviorPlay;
    // settings.server.colorPlay = this.state.colorPlay;
    // settings.server.brightnessPlay = this.state.brightnessPlay;
    // settings.server.intervalsPlay = this.state.intervalsPlay;
    // settings.server.lightNew = this.state.lightNew;
    // settings.server.behaviorNew = this.state.behaviorNew;
    // settings.server.colorNew = this.state.colorNew;
    // settings.server.brightnessNew = this.state.brightnessNew;
    // settings.server.intervalsNew = this.state.intervalsNew;

    if (!this.props.settings.server) this.props.settings.server = {};

    this.props.settings.server.lightPlay = this.state.lightPlay;
    this.props.settings.server.behaviorPlay = this.state.behaviorPlay;
    this.props.settings.server.colorPlay = this.state.colorPlay;
    this.props.settings.server.brightnessPlay = this.state.brightnessPlay;
    this.props.settings.server.intervalsPlay = this.state.intervalsPlay;
    this.props.settings.server.lightNew = this.state.lightNew;
    this.props.settings.server.behaviorNew = this.state.behaviorNew;
    this.props.settings.server.colorNew = this.state.colorNew;
    this.props.settings.server.brightnessNew = this.state.brightnessNew;
    this.props.settings.server.intervalsNew = this.state.intervalsNew;

    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
        } else {
          // error
          this.setState({
            error: xhr.responseText,
          });
        }
      }
    });

    xhr.open("POST", "/backend/save", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    // console.log("Before send:", settings);
    xhr.send(JSON.stringify(this.props.settings));

    this.setState({ isIncomplete: false, isEdit: true });
  };

  handleLightPlay = (e) => {
    this.setState({ lightPlay: e.target.value.toString() });
  };

  handleBehaviorPlay = (e) => {
    this.setState({ behaviorPlay: e.target.value.toString() });
  };

  handleIntervalsPlay = (e) => {
    this.setState({ intervalsPlay: e.target.value.toString() });
  };

  handleColorPlay = (e) => {
    this.setState({ colorPlay: e.target.value.toString() });
  };

  handleBrightnessPlay = (e) => {
    this.setState({ brightnessPlay: e.target.value.toString() });
  };

  handleLightNew = (e) => {
    this.setState({ lightNew: e.target.value.toString() });
  };

  handleBehaviorNew = (e) => {
    this.setState({ behaviorNew: e.target.value.toString() });
  };

  handleIntervalsNew = (e) => {
    this.setState({ intervalsNew: e.target.value.toString() });
  };

  handleColorNew = (e) => {
    this.setState({ colorNew: e.target.value.toString() });
  };

  handleBrightnessNew = (e) => {
    this.setState({ brightnessNew: e.target.value.toString() });
  };

  render() {
    if (this.state.isError) {
      return <>{this.state.errorRes}</>;
    } else if (this.state.isLoading) {
      return (
        <div className="d-flex align-items-center justify-content-center">
          <img src={Loading} width="50" />
        </div>
      );
    } else {
      return (
        <>
          <Row>
            <h3>Server</h3>
          </Row>
          <div style={{ paddingBottom: "0.75rem" }} />
          <Row>
            <Form onSubmit={this.handleFormSubmit}>
              <h5>
                Playback Started &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip>
                      This lets a light be used to alert the server admin that someone has started watching a stream.
                      This only turns on the light...there is no event for altering this light when playback is stopped.
                    </Tooltip>
                  }
                >
                  <img src={Info} />
                </OverlayTrigger>
              </h5>
              <Form.Label for="lightPlay">
                Light &nbsp;&nbsp;
                <OverlayTrigger placement="right" overlay={<Tooltip>Select the light to be used.</Tooltip>}>
                  <img src={Info} />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.lightPlay}
                id="lightPlay"
                name="lightPlay"
                onChange={this.handleLightPlay}
                size="sm"
              >
                <option value="-1">Select a Light</option>
                <option value="-2">None</option>
                {this.state.lightList.map((light) => (
                  <option value={light.Id}>
                    {light.Name} ({light.Room})
                  </option>
                ))}
              </Form.Select>
              <div style={{ paddingBottom: "0.75rem" }} />
              <Form.Label for="behaviorPlay">
                Behavior &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip>
                      Select behavior for the light. This could be to turn the light on, or make it blink.
                      <br />
                      <br />
                      Turn On: If the light is already on, the "turn on" function will just change the color and
                      brightness.
                      <br />
                      Blink: Blink will go the set amount of intervals set and return to the state it was at before the
                      blinking.
                    </Tooltip>
                  }
                >
                  <img src={Info} />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.behaviorPlay}
                id="behaviorPlay"
                name="behaviorPlay"
                onChange={this.handleBehaviorPlay}
                size="sm"
              >
                <option value="-1">Select Behavior</option>
                <option value="1">Turn On</option>
                <option value="2">Blink</option>
              </Form.Select>
              <div style={{ paddingBottom: "0.75rem" }} />
              {this.state.behaviorPlay === "2" ? (
                <>
                  <Form.Label for="intervalsPlay">
                    Intervals &nbsp;&nbsp;
                    <OverlayTrigger
                      placement="right"
                      overlay={<Tooltip>Select number of times the light will blink.</Tooltip>}
                    >
                      <img src={Info} />
                    </OverlayTrigger>
                  </Form.Label>
                  <Form.Select
                    value={this.state.intervalsPlay}
                    id="intervalsPlay"
                    name="intervalsPlay"
                    onChange={this.handleIntervalsPlay}
                    size="sm"
                  >
                    <option value="-1">Select Intervals</option>
                    <option value="1">1</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                  </Form.Select>
                  <div style={{ paddingBottom: "0.75rem" }} />
                </>
              ) : (
                <></>
              )}
              <Form.Label for="colorPlay">
                Color &nbsp;&nbsp;
                <OverlayTrigger placement="right" overlay={<Tooltip>Select color for the light.</Tooltip>}>
                  <img src={Info} />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.colorPlay}
                id="colorPlay"
                name="colorPlay"
                onChange={this.handleColorPlay}
                size="sm"
              >
                <option value="-1">Select Color</option>
                <option value="0">Red</option>
                <option value="1">Orange</option>
                <option value="2">Yellow</option>
                <option value="3">Green</option>
                <option value="4">Blue</option>
                <option value="5">Purple</option>
                <option value="6">White</option>
              </Form.Select>
              <div style={{ paddingBottom: "0.75rem" }} />
              <Form.Label for="brightnessPlay">
                Brightness &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={<Tooltip>Select brightness for the light. Use number from 10% to 100%.</Tooltip>}
                >
                  <img src={Info} />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.brightnessPlay}
                id="brightnessPlay"
                name="brightnessPlay"
                onChange={this.handleBrightnessPlay}
                size="sm"
              >
                <option value="-1">Select Brightness</option>
                <option value="10">10%</option>
                <option value="20">20%</option>
                <option value="30">30%</option>
                <option value="40">40%</option>
                <option value="50">50%</option>
                <option value="60">60%</option>
                <option value="70">70%</option>
                <option value="80">80%</option>
                <option value="90">90%</option>
                <option value="100">100%</option>
              </Form.Select>
              <div style={{ paddingBottom: "1.5rem" }} />
              <h5>
                Library New &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip>
                      This lets a light be used to alert the server admin that someone has started watching a stream.
                      This only turns on the light...there is no event for altering this light when playback is stopped.
                    </Tooltip>
                  }
                >
                  <img src={Info} />
                </OverlayTrigger>
              </h5>
              <Form.Label for="lightNew">
                Light &nbsp;&nbsp;
                <OverlayTrigger placement="right" overlay={<Tooltip>Select the light to be used.</Tooltip>}>
                  <img src={Info} />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.lightNew}
                id="lightNew"
                name="lightNew"
                onChange={this.handleLightNew}
                size="sm"
              >
                <option value="-1">Select a Light</option>
                <option value="-2">None</option>
                {this.state.lightList.map((light) => (
                  <option value={light.Id}>
                    {light.Name} ({light.Room})
                  </option>
                ))}
              </Form.Select>
              <div style={{ paddingBottom: "0.75rem" }} />
              <Form.Label for="behaviorNew">
                Behavior &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip>
                      Select behavior for the light. This could be to turn the light on, or make it blink.
                      <br />
                      <br />
                      Turn On: If the light is already on, the "turn on" function will just change the color and
                      brightness.
                      <br />
                      Blink: Blink will go the set amount of intervals set and return to the state it was at before the
                      blinking.
                    </Tooltip>
                  }
                >
                  <img src={Info} />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.behaviorNew}
                id="behaviorNew"
                name="behaviorNew"
                onChange={this.handleBehaviorNew}
                size="sm"
              >
                <option value="-1">Select Behavior</option>
                <option value="1">Turn On</option>
                <option value="2">Blink</option>
              </Form.Select>
              <div style={{ paddingBottom: "0.75rem" }} />
              {this.state.behaviorNew === "2" ? (
                <>
                  <Form.Label for="intervalsNew">
                    Intervals &nbsp;&nbsp;
                    <OverlayTrigger
                      placement="right"
                      overlay={<Tooltip>Select number of times the light will blink.</Tooltip>}
                    >
                      <img src={Info} />
                    </OverlayTrigger>
                  </Form.Label>
                  <Form.Select
                    value={this.state.intervalsNew}
                    id="intervalsNew"
                    name="intervalsNew"
                    onChange={this.handleIntervalsNew}
                    size="sm"
                  >
                    <option value="-1">Select Intervals</option>
                    <option value="1">1</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                  </Form.Select>
                  <div style={{ paddingBottom: "0.75rem" }} />
                </>
              ) : (
                <></>
              )}
              <Form.Label for="colorNew">
                Color &nbsp;&nbsp;
                <OverlayTrigger placement="right" overlay={<Tooltip>Select color for the light.</Tooltip>}>
                  <img src={Info} />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.colorNew}
                id="colorNew"
                name="colorNew"
                onChange={this.handleColorNew}
                size="sm"
              >
                <option value="-1">Select Color</option>
                <option value="1">Red</option>
                <option value="2">Orange</option>
                <option value="3">Yellow</option>
                <option value="4">Green</option>
                <option value="5">Blue</option>
                <option value="6">Purple</option>
                <option value="7">White</option>
              </Form.Select>
              <div style={{ paddingBottom: "0.75rem" }} />
              <Form.Label for="brightnessNew">
                Brightness &nbsp;&nbsp;
                <OverlayTrigger
                  placement="right"
                  overlay={<Tooltip>Select brightness for the light. Use number from 10% to 100%.</Tooltip>}
                >
                  <img src={Info} />
                </OverlayTrigger>
              </Form.Label>
              <Form.Select
                value={this.state.brightnessNew}
                id="brightnessNew"
                name="brightnessNew"
                onChange={this.handleBrightnessNew}
                size="sm"
              >
                <option value="-1">Select Brightness</option>
                <option value="10">10%</option>
                <option value="20">20%</option>
                <option value="30">30%</option>
                <option value="40">40%</option>
                <option value="50">50%</option>
                <option value="60">60%</option>
                <option value="70">70%</option>
                <option value="80">80%</option>
                <option value="90">90%</option>
                <option value="100">100%</option>
              </Form.Select>
              <div style={{ paddingBottom: "0.75rem" }} />
              {/* Cancel/Save */}
              {this.state.isEdit ? (
                <Button type="submit" variant="secondary">
                  Update
                </Button>
              ) : (
                <Button type="submit" variant="secondary">
                  Save
                </Button>
              )}
              {this.state.isIncomplete ? (
                <i style={{ color: "#f00" }}>&nbsp; All parameters must be selected </i>
              ) : (
                <></>
              )}
            </Form>
          </Row>
        </>
      );
    }
  }
}
