import React, { Component, } from 'react';
import { Text, Button, View, Icon } from 'native-base';
import { SafeAreaView, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import AppConstants from '../../config/constants';
import { Col, Row, Grid } from "react-native-easy-grid";
import strings from '../../config/languages';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import { connect } from 'react-redux';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import _ from 'lodash';
import colors from '../../styles/colors';
import FastImage from 'react-native-fast-image';

class SideBar extends Component {
  constructor(props) {
    super(props)
    this.state = {
        fullName:'',
        imageUrl:null,
        levelDescription:'',
        level: 0,
        levelProgress:0,
        currentPoints:0,
        min: 0,
        max: 1000,
        wallet: 'default-xp',
        perms: {
          treeValidation: {
            view: { status:false, desc:"" }
          },
          userPolicyUp: {
            view: { status:false, desc:"" }
          } 
        }
    }
    this.permsMaping();
    this.userMapping();
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevProps.user != this.props.user) {
        this.userMapping();
        this.permsMaping();
        this.setState(this.state);
    }
  }
  switchMode() {
    this.props.setMode(this.props.mode !== 1 ? 1 : 0);
  }
  permsMaping() {
    this.state.perms.treeValidation.view = GeneralHelpers.hasPermission('treeValidation','view').remote == true ?
      GeneralHelpers.hasPermission('treeValidation','view') :
      this.state.perms.treeValidation.view;
    this.state.perms.userPolicyUp.view = GeneralHelpers.hasPermission('userPolicyUp','view').remote == true ?
      GeneralHelpers.hasPermission('userPolicyUp','view') :
      this.state.perms.userPolicyUp.view;
  }
  userMapping() {
    var u = this.props.user;
    var payload = {};
    if (_.has(u,"currentLevel.payload")) 
      payload = JSON.parse(u.currentLevel.payload);
    if (_.has(u,"user.firstName")) 
      this.state.fullName = u.user.firstName;
    if (_.has(u,"user.lastName")) 
      this.state.fullName += " " + u.user.lastName;
    if (_.has(u,'user.imageUrl') && u.user.imageUrl != null && u.user.imageUrl.length > 0 ) {
      if (u.user.imageUrl.startsWith('http') || u.user.imageUrl.startsWith('https')) {
          this.state.imageUrl = u.user.imageUrl;
      } else {
          this.state.imageUrl = AppConstants.base + u.user.imageUrl;
          this.state.isHostedImage = true;
      }
    }     
    if (_.has(u,"currentLevel.name")) 
      this.state.levelDescription = u.currentLevel.name;
    if (_.has(payload,"levelNumber")) 
      this.state.level = payload.levelNumber;
    if (_.has(payload,"min")) 
      this.state.min = payload.min;
    if (_.has(payload,"max")) 
      this.state.max = payload.max;
    if (_.has(payload,"wallet")) 
      this.state.wallet = payload.wallet;
    this.state.currentPoints = GeneralHelpers.getCurrentUserPointsByWallet(this.state.wallet);
    if(this.state.min > 0 && this.state.max > 0 && this.state.currentPoints > 0) {
      var p = (( 1 / this.state.max) * this.state.currentPoints);
      this.state.levelProgress = p <= 0.20 ? 0.30 : p;
    } else {
      this.state.levelProgress = 0.30;
    }
  }
  openProfile() {
    this.props.navigation.navigate('UserProfile');
    this.props._closeDrawer();
  }
  openTreeValidation() {
    this.props.navigation.navigate('TreesValidation');
    this.props._closeDrawer();
  }
  openPromoteUsers() {
    this.props.navigation.navigate('PromoteUsers');
    this.props._closeDrawer();
  }
  openReports() {
    this.props.navigation.navigate('UserReports');
    this.props._closeDrawer();
  }
  openTermsAndConditions() {
    this.props.navigation.navigate('TermsAndConditions');
    this.props._closeDrawer();
  }
  render() { 
    return (
          <SafeAreaView style={styles.sidebar}>
              <View style={styles.sidebarInner}>
                <Grid style={{flex: 1, flexDirection: 'column', display: 'flex'}}>
                  <View style={styles.userData}>
                    <Col style={{backgroundColor: 'white', width: '40%'}}>
                      <View style={ styles.userPictureBorder }>
                        { (this.state.imageUrl != undefined && this.state.imageUrl != null) ?
                          <FastImage
                              style={styles.userPicture}
                              resizeMode="cover"
                              source={{ uri: this.state.imageUrl, 
                                        headers: { 
                                            "Authorization":  "Bearer " + this.props.idToken,
                                            "Accept": "*/*", 
                                            "Content-Type": "*/*" },
                                        priority: FastImage.priority.high
                                      }}
                          />
                          : <Image source={require('../../resources/global/default-user-img.png')} style={ styles.userPicture} /> }
                        </View>
                    </Col>
                    <Col style={{justifyContent: 'center'}}>
                      <Text style={styles.user}>{this.state.fullName}</Text>
                      <View style={{flexDirection: 'row'}}>
                        <Text style={styles.rank}>{this.state.levelDescription}</Text>
                      </View>
                      { this.props.mode !== 0 && 
                        <Button style={styles.seeProfile} onPress={() => this.openProfile()}>
                          <Text style={{fontSize:12, fontWeight:'bold'}}>{strings.sideMenu.seeProfile}</Text>
                        </Button>
                      }
                    </Col>        
                  </View>
                  <View style={{justifyContent: 'center', borderBottomColor: 'grey', borderBottomWidth: 4, paddingBottom:10}}/>
                  <Row style={{flex: 1, flexDirection: 'column', marginLeft: 30}}>
                    <ScrollView>
                      { this.props.mode !== 0 &&
                      <TouchableOpacity style={styles.buttons} onPress={() => this.openReports()}>
                        <Icon name={"ios-warning"} style={ [{ fontSize:22, color:"#999", alignSelf:'center', marginRight: 10, marginLeft: 10, width:20, marginTop:4, justifyContent:'center' }]}/>
                        <Text style={styles.buttonsText}>{strings.sideMenu.citizenReports}</Text>
                      </TouchableOpacity>
                      }
                      { this.props.mode !== 0  && _.has(this.state,'perms.treeValidation.view.status') && this.state.perms.treeValidation.view.status == true &&
                        <TouchableOpacity style={styles.buttons} onPress={() => this.openTreeValidation()}>
                          <Icon name={"ios-checkmark-circle"} style={ [{ fontSize:22, color:"#999", alignSelf:'center', marginRight: 10, marginLeft: 10, width:20, marginTop:4, justifyContent:'center' }]}/>
                          <Text style={styles.buttonsText}>{strings.sideMenu.treeValidation}</Text>
                        </TouchableOpacity> 
                      }
                      { this.props.mode !== 0  && _.has(this.state,'perms.userPolicyUp.view.status') && this.state.perms.userPolicyUp.view.status == true &&
                        <TouchableOpacity style={styles.buttons} onPress={() => this.openPromoteUsers()}>
                          <Icon name={"ios-person"} style={ [{ fontSize:22, color:"#999", alignSelf:'center', marginRight: 10, marginLeft: 10, width:20, marginTop:4, justifyContent:'center' }]}/>
                          <Text style={styles.buttonsText}>{strings.sideMenu.promoteUsers}</Text>
                        </TouchableOpacity>
                      }
                      { this.props.mode !== 0 &&
                        <TouchableOpacity style={styles.buttons} onPress={() =>{ this.props._closeDrawer(); this.openTermsAndConditions();  }}>
                          <Icon name={"ios-paper"} style={ [{ fontSize:22, color:"#999", alignSelf:'center', marginRight: 10, marginLeft: 10, width:20, marginTop:4, justifyContent:'center' }]}/>
                          <Text style={styles.buttonsText}>{strings.sideMenu.termsAndConditions}</Text>
                        </TouchableOpacity>
                      }
                      <TouchableOpacity style={styles.buttons} onPress={() => this.switchMode()}>
                        <Icon type="MaterialCommunityIcons" name={ this.props.mode !== 0 ? "airplane":"airplane-off"} style={ [{ fontSize:24, width:20, color:"#999", alignSelf:'center', marginRight: 10, marginLeft: 10, }]}/>
                        <Text style={styles.buttonsText}>{ this.props.mode !== 0 ? strings.sideMenu.liteMode :  strings.sideMenu.completeMode }</Text>
                      </TouchableOpacity> 
                      <TouchableOpacity style={styles.buttons} onPress={() =>{ this.props._closeDrawer(); this.props.logOut();  }}>
                        <Icon name={"ios-power"} style={ [{ fontSize:24, color:"#ed9096", alignSelf:'center', marginRight: 10, marginLeft: 10, width:20, marginTop:4, justifyContent:'center' }]}/>
                        <Text style={styles.buttonsText}>{strings.sideMenu.logOut}</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </Row>
                </Grid>
              </View>
          </SafeAreaView>
    );
  }
}           

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#F6F6F9',
    flex: 1,
  },
  sidebarInner: {
    backgroundColor: 'white',
    flex: 1,
  },
  buttons: {
    borderBottomColor: 'grey',
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    height:60
  },
  buttonsText: {
    alignSelf: 'center',
    color:'#737373',
    fontSize:14
  },
  userPicture: {
    height: 70, 
    width: 70, 
    borderRadius: 35,
    borderColor: 'white',    
  },
  userPictureBorder: {
    height: 80, 
    width: 80, 
    borderWidth: 1,
    marginRight: 20,
    borderRadius: 40,
    borderWidth: 1,
    alignSelf: 'flex-end',
    padding:4,
    borderColor: colors.mainColor
  },
  user: {
    color: 'green',
    fontWeight: '500',  
    fontSize: 20,
    paddingRight:10,
    lineHeight:25
  },
  rank: {
    fontWeight: 'bold',
    color:'#5b5b5b',
    fontSize:14,
    marginTop:2
  },
  seeProfile: {
    color: 'white',
    marginTop: 10,
    borderRadius: 5,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: '#41B17C',
    height: 30,
  },
  userData: {
    flexDirection: 'row',
    marginTop: 30,
    marginBottom: 10,
  },
})

const mapStateToProps = (state) => {
  return {
      user: state.user,
      idToken: state.user.id_token,
      mode: state.mode
  }
}
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(ActionCreators,dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(SideBar);