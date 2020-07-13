import React from 'react';
import { Modal } from 'react-native';
import Alert from 'react-native-awesome-alerts/lib/containers/alert';

export default class AwesomeAlertPlus extends Alert {
  render() {
    const { showSelf } = this.state;
    if (showSelf) return <Modal transparent={true} visible={true} onRequestClose={ () => {}}>{this._renderAlert()}</Modal>;
    return null;
  }
}