import React from "react";
import { Component } from "react";
import styled from "styled-components";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  // Link,
  // useParams,
  Redirect,
} from "react-router-dom";
import Bridge from "../bridge/bridge";
import gear from "../../images/gear.png";

const Title = styled.div`
  font-size: 2em;
  margin-left: 3mm;
  float: left;
  color: white;
  /* display: inline-block; */
  /* width: 50%; */
`;

const Settings = styled.div`
  font-size: 2em;
  margin-right: 2mm;
  margin-top: 2mm;
  /* text-align: right; */
  float: right;
  color: black;
  /* display: inline-block; */
  /* width: 50%; */
`;

const Main = styled.div`
  padding-top: 100px;
  max-width: 800px;
  margin: 0 auto;
`;

class App extends Component {
  state = {
    isLoaded: false,
    error: null,
    config: {},
  };

  componentDidMount() {
    console.log("App Did Mount");
    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // request successful
          var response = xhr.responseText,
            json = JSON.parse(response);

          console.log("At app response", json);

          this.setState({
            isLoaded: true,
            config: json,
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

    xhr.open("GET", "/backend/load", true);
    xhr.send();
  }

  render() {
    console.log("At app render", this.state.config);
    var body;

    if (!this.state.isLoaded) {
      // is loading
      return <div>Loading...</div>;
    } else if (this.state.error) {
      // error
      body = <div>Error occured: {this.state.error}</div>;
      return body;
    } else {
      // success
      return (
        <Router>
          <>
            <Title>HuePlex</Title>
            <Settings>
              <img src={gear} width="40" height="40" />
            </Settings>
            {/* <nav>
              <ul>
                <li>
                  <Link to="/bridge">Bridge</Link>
                </li>
              </ul>
            </nav> */}
            {/* A <Switch> looks through its children <Route>s and
          renders the first one that matches the current URL. */}
            <Main>
              <Switch>
                <Route path="/bridge">
                  <Bridge settings={this.state.config} />
                </Route>
                <Route path="/about">
                  <About />
                </Route>
                <Route path="/webhook">
                  <Users />
                </Route>
                <Route path="/">
                  {this.state.config.connected === "false" ? (
                    <Redirect to="/bridge" />
                  ) : (
                    <h1>{this.state.config.connected}</h1>
                  )}
                </Route>
              </Switch>
            </Main>
          </>
        </Router>
      );
    }
  }
}

// function Home(props) {
//   return <h1>{props.match.params.body}</h1>;
// }

function Users() {
  return <h2>Webhook</h2>;
}

function About() {
  return (
    <>
      <h2>About</h2>
      <h1>Face</h1>
    </>
  );
}

export default App;
