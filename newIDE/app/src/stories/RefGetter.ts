import React, { Component } from 'react';

type Props = {
  onRef: (ref: any) => void;
  children: React.ReactElement<any>;
};

export default class RefGetter extends Component<Props> {
  _ref: any;

  componentDidMount() {
    if (this._ref) {
      this.props.onRef(this._ref);
    }
  }

  render() {
    return React.cloneElement(this.props.children, {
      ref: (ref: any) => (this._ref = ref),
    });
  }
}
