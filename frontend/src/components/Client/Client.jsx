import React, { Component } from "react";
import Card from "react-bootstrap/Card";
import Xclose from "bootstrap-icons/icons/x-square.svg";
import Edit from "bootstrap-icons/icons/pencil-square.svg";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import "./Client.css";

export default class Client extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      active: true,
    };

    this.handleClick = this.handleClick.bind(this.props.id);
  }

  static getDerivedStateFromProps(props) {
    if (props.checked === undefined) {
      props.isChecked(true, props.id);
      return { id: props.id, active: true };
    } else {
      return { id: props.id, active: props.checked };
    }
  }

  handleClick = (e) => {
    this.props.click(e.currentTarget.value);
  };

  handleDelete = (e) => {
    this.props.delete(this.state.id);
  };

  handleCheck = (e) => {
    if (e.target.checked) {
      this.setState({ active: true });
    } else {
      this.setState({ active: false });
    }

    this.props.isChecked(e.target.checked, this.state.id);
  };

  render() {
    return (
      <Card
        className={`text-center card-global ${
          (this.props.isEdit || this.props.isCreating) && this.props.id === this.props.stateId
            ? "card-error"
            : "card-default"
        } ${this.props.isDarkMode ? "dark-mode" : ""}`}
      >
        <Card.Header className={`border-bottom-0 header-custom ${this.props.isDarkMode ? "dark-mode" : ""}`}>
          {this.props.isEdit || this.props.isCreating ? (
            <Image src={Xclose} alt="Close" className="icon-noclick" />
          ) : (
            <Image src={Xclose} onClick={this.handleDelete} className="icon-noclick" alt="Close" />
          )}
        </Card.Header>
        <Card.Subtitle className="d-flex align-items-center justify-content-center sub-custom">
          {this.props.client}
        </Card.Subtitle>
        <Card.Body className="body-custom">
          <div style={{ fontSize: "0.8em" }}>
            <b>User</b>
          </div>
          <div style={{ fontSize: "0.9em", paddingBottom: "5px" }}>{this.props.user}</div>
          <div style={{ fontSize: "0.8em" }}>
            <b>Media</b>
          </div>
          <div style={{ fontSize: "0.9em" }}>
            {this.props.media === "cinemaTrailer"
              ? "Trailer"
              : this.props.media[0].toUpperCase() + this.props.media.substring(1)}
          </div>
        </Card.Body>
        <Card.Footer className={`border-top-0 footer-custom ${this.props.isDarkMode ? "dark-mode" : ""}`}>
          <Row>
            <Col>
              {this.props.isEdit || this.props.isCreating ? (
                <div className="div-custom-l">
                  <Form.Switch onChange={this.handleCheck} defaultChecked={this.state.active} disabled />
                </div>
              ) : (
                <div className="div-custom-l">
                  <Form.Switch onChange={this.handleCheck} defaultChecked={this.state.active} />
                </div>
              )}
            </Col>
            <Col>
              <div className="div-custom-r">
                {this.props.isEdit || this.props.isCreating ? (
                  <Image src={Edit} alt="Edit" className="icon-noclick" />
                ) : (
                  <button value={this.state.id} onClick={this.handleClick} className="edit-button">
                    <Image src={Edit} alt="Edit" className="icon-clickable" />
                  </button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Footer>
      </Card>
    );
  }
}
