import React, { Component } from 'react';
import { Provider } from "react-redux";
import { store, FinalRoot, persistor } from './src/navigators/AppNavigator';
import { PersistGate } from 'redux-persist/integration/react'
import { BackHandler, YellowBox,PermissionsAndroid } from 'react-native';
import firebase from 'react-native-firebase';
import {AsyncStorage,Alert} from 'react-native';
import { updateNotificationsIndicator } from './src/redux/actions/notifications';
import AwesomeAlertPlus from './src/components/awesome-alert/AwesomeAlertPlus';
import { Text, Image, View } from 'react-native';
import NotificationService from './src/services/notificaction';
import BackgroundFetch from "react-native-background-fetch";
import Orientation from 'react-native-orientation';

let NotificationRequestTask = async () => {
  navigator.geolocation.getCurrentPosition(
      (position) => {
        let wkt = "POINT("+position.coords.longitude+" "+position.coords.latitude+")";
        NotificationService.updateLocation(wkt);
        BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA);
      },
      async (error) => {
        BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 5000 },
  ); 
  BackgroundFetch.finish();
}
BackgroundFetch.registerHeadlessTask(NotificationRequestTask);
export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      alert: { show: false},
      customView: <View></View>,
    }
  }
  async componentDidMount() {
    YellowBox.ignoreWarnings(["Require cycle:", "Remote debugger"]);
    // Check notification permission
    this.checkPermission();
    // Add notification listeners
    this.checkLocationStatus();
    this.createNotificationListeners(); 
    Orientation.lockToPortrait();
    // Subscribe
    BackHandler.addEventListener('backPress', () => {
      const state =  store.getState();
      if (state.nav.index == 0) return false;
      store.dispatch({
          type: 'Navigation/BACK'
        })
      return true;
    });
    BackgroundFetch.status((status) => {
      console.log(status);
      switch(status) {
        case BackgroundFetch.STATUS_RESTRICTED:
          console.log("BackgroundFetch restricted");
          break;
        case BackgroundFetch.STATUS_DENIED:
          console.log("BackgroundFetch denied");
          break;
        case BackgroundFetch.STATUS_AVAILABLE:
          console.log("BackgroundFetch is enabled");
          break;
      }
    });
    BackgroundFetch.configure({
      minimumFetchInterval: 15,  
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
      requiresCharging: false,      
      requiresDeviceIdle: false,    
      requiresBatteryNotLow: false, 
      requiresStorageNotLow: false
      }, async () => {
        navigator.geolocation.getCurrentPosition(
              (position) => {
                let wkt = "POINT("+position.coords.longitude+" "+position.coords.latitude+")";
                NotificationService.updateLocation(wkt);
                BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA);
              },
              async (error) => {
                BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA);
              },
              { enableHighAccuracy: false, timeout: 5000, maximumAge: 5000 },
          ); 
        }, (error) => {
    });
  }
  async checkLocationStatus() {
    navigator.geolocation.getCurrentPosition(
      (position) => {},
      (error) => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 5000 },
    ); 
  }
  async checkPermission() {
    const enabled = await firebase.messaging().hasPermission();
    if (enabled) {
        this.getToken();
    } else {
        this.requestPermission();
    }
  }
  async getToken() {
    let fcmToken = await AsyncStorage.getItem('fcmToken');
    if (!fcmToken) {
        fcmToken = await firebase.messaging().getToken();
        if (fcmToken) {
            await AsyncStorage.setItem('fcmToken', fcmToken);
        }
    }
    firebase.messaging().subscribeToTopic("all");
  }
  async requestPermission() {
    try {
        await firebase.messaging().requestPermission();
        this.getToken();
    } catch (error) {}
  }
  componentWillUnmount() {
    BackHandler.removeEventListener('backPress');
    this.notificationListener();
    this.notificationOpenedListener();
  }
  render() {
    return (
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <FinalRoot />
          <AwesomeAlertPlus 
            alertContainerStyle = { { padding: 0, } }
            overlayStyle= { {padding: 0} }
            contentContainerStyle= { {borderWidth: 0, borderRadius: 0, padding: 10, margin: 0} }
            messageStyle= { {padding: 0} }
            show={ this.state.alert.show }
            showProgress={false}
            showConfirmButton={true}
            confirmText= {'Aceptar'}
            confirmButtonTextStyle= {{
                fontSize: 14,
                fontWeight: '500',
                textAlign: 'center',
                color: '#fefefe'
            }}
            confirmButtonColor="#2CA06C"
            confirmButtonStyle = {{
                width: '100%',   
                marginTop: 20,     
                marginBottom: 20,
                paddingHorizontal: 40,
                paddingVertical: 10,
            }}
            onCancelPressed={ () => { this.state.alert.show = false; this.setState({ alert:this.state.alert})} }
            onConfirmPressed={ () => { this.state.alert.show = false; this.setState({ alert:this.state.alert})} }
            onDismiss={ () => { this.state.alert.show = false; this.setState({ alert:this.state.alert})} }
            customView = { this.state.alert.customView }
          />  
        </PersistGate>
      </Provider>
    );
  }
  
  async createNotificationListeners() {
    /*
    * Triggered when a particular notification has been received in foreground
    * 
    * */
    this.notificationListener = firebase.notifications().onNotification((notification) => {
        store.dispatch(updateNotificationsIndicator());
        if(notification._data != undefined && notification._data.type != undefined) {
            if(notification._data.type == "FOREGROUND") {
              this.state.alert.customView = 
              <View style={{ width:200 }}>
                      <Image source={require('./src/resources/notifications/default.png')} style={{
                                marginTop: 10,
                                height: 118,
                                width: 70,
                                resizeMode: 'contain',
                                alignSelf: 'center'
                      }}/> 
                        <Text style={{
                                  marginTop: 10,
                                  fontSize: 18,
                                  fontWeight: '400',
                                  textAlign: 'center',
                                  color: '#4a4a4a'
                        }}>
                          { notification._title }
                        </Text>
                        <Text style={{
                                  marginTop:10,
                                  fontSize: 14,
                                  fontWeight: '400',
                                  lineHeight: 20,
                                  textAlign: 'center',
                                  color: '#737373'
                        }}> 
                          { notification._body }
                        </Text>                
              </View>;
              this.state.alert.show = true; 
              this.setState({ alert: this.state.alert });
            }
        }
    });
    /*
    * If your app is in background, you can listen for when a notification is clicked / tapped / opened as follows:
    * */
    this.notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen) => {
        store.dispatch(updateNotificationsIndicator());
    });
    /*
    * If your app is closed, you can check if it was opened by a notification being clicked / tapped / opened as follows:
    * */
    const notificationOpen = await firebase.notifications().getInitialNotification();
    if (notificationOpen) {
      // Send to notifications
    }
    /*
    * Triggered for data only payload in foreground
    * */
    this.messageListener = firebase.messaging().onMessage((message) => {
    });
  }
}
