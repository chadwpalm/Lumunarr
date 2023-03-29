import React, { Component } from "react";
import Card from "react-bootstrap/Card";
import Xclose from "bootstrap-icons/icons/x-square.svg";
import Edit from "bootstrap-icons/icons/pencil-square.svg";

export default class Client extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
    };

    this.handleClick = this.handleClick.bind(this.props.id);
  }

  static getDerivedStateFromProps(props) {
    return { id: props.id };
  }

  handleClick = (e) => {
    this.props.click(e.currentTarget.value);
  };

  handleDelete = (e) => {
    this.props.delete(this.state.id);
  };

  render() {
    return (
      <Card
        style={{ width: "10rem", height: "14rem", backgroundColor: "#f8f9fa" }}
        className="text-center"
        border="dark"
      >
        <Card.Header
          className="border-bottom-0"
          style={{ backgroundColor: "#f8f9fa", padding: "5px", textAlign: "right" }}
        >
          {this.props.isEdit || this.props.isCreating ? (
            <img src={Xclose} />
          ) : (
            <img src={Xclose} onClick={this.handleDelete} style={{ cursor: "pointer" }} />
          )}
        </Card.Header>
        <Card.Subtitle
          className="d-flex align-items-center justify-content-center"
          style={{ height: "4rem", paddingLeft: "5px", paddingRight: "5px" }}
        >
          {this.props.client}
        </Card.Subtitle>
        <Card.Body style={{ padding: "5px", verticalAlign: "text-bottom" }}>
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
        <Card.Footer
          className="border-top-0"
          style={{ backgroundColor: "#f8f9fa", padding: "5px", textAlign: "right" }}
        >
          {this.props.isEdit || this.props.isCreating ? (
            <img src={Edit} />
          ) : (
            <button
              value={this.state.id}
              onClick={this.handleClick}
              style={{ margin: 0, padding: 0, borderWidth: "0px", backgroundColor: "inherit" }}
            >
              <img src={Edit} />
            </button>
          )}
        </Card.Footer>
      </Card>
    );
  }
}
