import React from 'react';

export class WebView extends React.Component {
  constructor(props) {
    super(props);
    console.log(this.props);
  }

  render() {
    return <div>{this.props.source.uri}</div>;
  }
}

export default WebView;