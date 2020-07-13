import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import AppConstants from '../../config/constants';
import { Col, Row, Grid } from "react-native-easy-grid";
import {
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    ImageBackground,
    Image,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Icon } from 'native-base';
import strings from '../../config/languages';
import ProgressCircle from 'react-native-progress-circle';
import * as Progress from 'react-native-progress';
import AwesomeAlert from 'react-native-awesome-alerts';
import _ from 'lodash';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import ReportService from '../../services/report';
import globalStyles from '../../styles/global';
import FastImage from 'react-native-fast-image';
import Orientation from 'react-native-orientation';

class UserProfile extends Component {
    static navigationOptions = ({}) => ({
        header: null,
    });
    constructor(props) {
        super(props)
        this.state = {
            isHostedImage: false,
            fullName:'',
            imageUrl:null,
            levelDescription:'',
            level: 0,
            levelProgress:0,
            currentPoints:0,
            min: 0,
            max: 1000,
            wallet: 'default-xp',
            userBoundaryLabel: '',
            myEngagement: 0,            
            showAlert: false,
            insignia: null,
        }
        this.userMapping();
    }
    componentDidMount() {
        Orientation.lockToPortrait();
        this.getUserContribution();
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.user != this.props.user) {
            this.userMapping();
            this.setState(this.state);
        }
    }
    getUserContribution() {
        ReportService.getUserSingleContrib().then((res) => {
            if(res.status==200 || res.status == 201){
                let result = JSON.parse(res._bodyText);
                this.setState({
                    myEngagement: result.contrib,
                });
            }         
        })
        .catch((e) => {
            this.setState({ isLoading: false});
        });
    }
    capitalize = (s) => {
        s = s.toLowerCase();
        if (typeof s !== 'string') return ''
        return s.charAt(0).toUpperCase() + s.slice(1)
    }
    userMapping() {
        var u = this.props.user;
        var payload = {};
        if (_.has(u,'boundary.name') && u.boundary.name.length > 0 ) 
            this.state.userBoundaryLabel = this.capitalize(u.boundary.name.replace(".","").split("-")[0]);
        if (_.has(u,"myEngagement") && u.myEngagement > 0) 
            this.state.myEngagement = u.myEngagement;
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
        if (_.has(u,"currentLevel.insignia"))
          this.state.insignia = u.currentLevel.insignia;
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
    showAlert = () => {
        this.setState({
            showAlert: true
        });
    };
    hideAlert = () => {
        this.setState({
            showAlert: false
        });
    };
    render() {
        const { goBack } = this.props.navigation;
        const { showAlert } = this.state;
        return (
            <SafeAreaView style={{ backgroundColor:'#F6F6F9', flex:1}}>
                <ScrollView>
                    <View style={{backgroundColor:'white'}}>
                        <ImageBackground  style={{backgroundColor:'white'}} source={require('../../resources/user/header.png')} style={styles.backgroundImage}>
                            <View style= {[styles.header]} >
                                <Row>
                                    <Col style={ [styles.headerBack] }>
                                        <TouchableOpacity  style={{ width:60, height:60, marginRight:15, justifyContent:'center', zIndex:1000}}  onPress={ () => goBack() } >
                                            <Icon name="ios-arrow-back" style={[{ alignSelf:'center'},globalStyles.headerLeftIcon]}/>
                                        </TouchableOpacity>
                                    </Col>
                                    <Col style={[styles.headerEdit]}>
                                        <TouchableOpacity  style={{ width:60, height:60, marginRight:0, justifyContent:'center',
                                            paddingRight:0
                                        }}  onPress={ () => this.props.navigation.navigate('UserEdit')} >
                                            <Image source={require('../../resources/global/icon-edit.png')} style= {{height:20, width: 20, alignSelf:'center'}}/>
                                        </TouchableOpacity>
                                    </Col>
                                </Row>
                            </View>
                            <View style={[styles.picture,{width:150, alignSelf:'center'}]}>
                                { (this.state.imageUrl && this.state.imageUrl != null) ?
                                    <FastImage
                                        style={styles.circle}
                                        resizeMode="cover"
                                        source={{ uri: this.state.imageUrl, 
                                                  headers: { 
                                                      "Authorization":  "Bearer " + this.props.idToken,
                                                      "Accept": "*/*", 
                                                      "Content-Type": "*/*" },
                                                  priority: FastImage.priority.high
                                                }}
                                    />
                                    : 
                                    <Image source={require('../../resources/global/default-user-img.png')} style={ styles.circle} /> }
                            </View>
                        </ImageBackground>
                        <View style={[styles.userInfo]}>
                            <Text style={styles.userName}>{this.state.fullName}</Text>
                            <Text style={styles.userBoundary}>{this.state.userBoundaryLabel}</Text>
                        </View>
                        <View style={styles.userData}>
                            <Col size={50} style={[styles.userDataElementFirst]}>
                                <TouchableOpacity style={{alignContent:'center'}} onPress={ () => this.showAlert() }>
                                    <Text style={ [styles.textBold , { textAlign:'center', paddingBottom:10}] }>{this.state.levelDescription}</Text>                            
                                    <ImageBackground  source={require('../../resources/global/xp-tail.png')} style={[styles.progressXp, styles.progressTail]}>
                                        <ImageBackground  source={require('../../resources/global/xp-circle.png')} style={[styles.progressXp, styles.circlePoint ]}>
                                            <Text style={styles.userXp}>{this.state.level}</Text>
                                        </ImageBackground>                                        
                                        <View style={ {marginLeft: -20 }}>
                                            <Progress.Bar progress={this.state.levelProgress} width={90} height={21} 
                                                color={"#EA585E"} borderColor={'#1E8D5D'} 
                                                borderWidth={1.2} unfilledColor={'white'} borderRadius={50} />
                                        </View>
                                    </ImageBackground>
                                    <Text style={[{color:'#5b5b5b', fontSize:13, fontWeight:'400', marginTop:10, marginBottom: 5, textAlign:'center'}]}> {[strings.userProfile.xp]} </Text>
                                    { this.state.currentPoints != null &&
                                        <View style={{flexDirection: 'row', justifyContent:'center', alignItems: 'center'}}>
                                            <Image source={require('../../resources/global/icon-medal.png')} style={{height: 22, width: 14, resizeMode: 'contain'}}/>
                                            <Text style={{color:'#5b5b5b', fontWeight: '700', fontSize: 14, marginLeft: 10,}}>{this.state.currentPoints}</Text>
                                        </View>
                                    }  
                                </TouchableOpacity>
                            </Col>
                            <Col size={50} style={styles.userDataElement}>
                                <TouchableOpacity  onPress={ () => this.props.navigation.navigate('UserContribution') }>
                                    <Row>
                                        <Col size={40} style={ {alignItems: 'center'}} >
                                            <ProgressCircle percent={this.state.myEngagement} radius={30} borderWidth={6} color="#1986C8" shadowColor="#E8F1F6" bgColor="#fff" >
                                                <Text style={{ fontSize: 12, fontWeight: '400', color: '#484747' }}>{this.state.myEngagement}%</Text>
                                            </ProgressCircle>
                                        </Col>
                                        <Col size={60}>
                                            <Text style={styles.textBold}>{strings.userProfile.myContribution}</Text>
                                            <Text style={styles.textSmall}>{strings.userProfile.contributionMessage}</Text>
                                            <Text style={styles.textButton}>{strings.userProfile.more}</Text>
                                        </Col>
                                    </Row>
                                </TouchableOpacity>
                            </Col>                        
                        </View>                    
                        <View style={styles.buttonsContainer}>
                            <Grid>
                                <Row>
                                    <Col >
                                        <View style={[ styles.buttonCol ]}>
                                            <Button style={ styles.button} onPress={ () => this.props.navigation.navigate('Benefits')}>
                                                <Image source={require('../../resources/main/icon-benefit.png')} style={styles.iconBenefits}  />
                                                <Text style={ styles.buttonLabel}> {strings.userProfile.benefits} </Text>
                                            </Button>
                                        </View>
                                    </Col>
                                    <Col >
                                        <View style={styles.buttonCol}>
                                            <Button style={ styles.button} onPress={ () => this.props.navigation.navigate('UserTreeList')} >
                                                <Image source={require('../../resources/global/icon-user-trees.png')} style={styles.iconUserTrees}  />
                                                <Text style={ styles.buttonLabel}> {strings.userProfile.myTrees} </Text>
                                            </Button>
                                        </View>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col >
                                        <View style={[ styles.buttonCol]}>
                                            <Button style={ styles.button} onPress={ () => this.props.navigation.navigate('Insignia')} >
                                                <Image source={require('../../resources/global/icon-insignias.png')} style={styles.iconInsignia}  />
                                                <Text style={ styles.buttonLabel}> {strings.userProfile.insignia} </Text>
                                            </Button>
                                        </View>
                                    </Col>
                                    <Col>
                                        <View style={styles.buttonCol}>
                                            <Button style={ styles.button} onPress={()=> this.props.navigation.navigate('Friends')}>
                                                <Image source={require('../../resources/global/icon-friends.png')} style={styles.iconFriends}  />
                                                <Text style={ styles.buttonLabel}> {strings.userProfile.friends} </Text>
                                            </Button>
                                        </View>
                                    </Col>
                                </Row>
                            </Grid>
                        </View>
                    </View>
                </ScrollView>      
                <AwesomeAlert
                    contentContainerStyle= { {borderWidth: 0, borderRadius: 0, padding: 0, margin: 0, backgroundColor: 'transparent'} }
                    show={ showAlert }
                    closeOnTouchOutside={ true }
                    closeOnHardwareBackPress={false}
                    showCancelButton={false}
                    showConfirmButton={false}
                    customView = { <View style={ {width:280, margin: 0, padding: 0} }>                                        
                                        <View style={[{backgroundColor: '#f3f3f5'}]}>
                                            <Button onPress={ () => this.hideAlert() } style={{ padding: 0, elevation: 0, 
                                                justifyContent:'center',
                                                backgroundColor:'transparent',
                                                alignContent:'center',
                                                width:40, height:40,
                                                borderColor: '#f3f3f5'}}>
                                                <Icon name="ios-close" style={{ fontSize:24, color:'#737373', alignSelf:'center'}}/>
                                            </Button>
                                            <View style={[styles.alertContainer]} >
                                                { this.state.insignia != null &&
                                                    <Image  source={{uri: `data:${this.state.insignia.imageContentType};base64,${this.state.insignia.image}`}} style={styles.alertImage} />
                                                }
                                                <Text  style={ [styles.levelText, globalStyles.alertTitle ]}>{this.state.levelDescription}</Text>
                                            </View>
                                            <ImageBackground  source={require('../../resources/global/xp-tail.png')} 
                                                style={[styles.progressXp, styles.progressTail, {marginLeft:70, marginBottom: 20 }]}>
                                                <ImageBackground  source={require('../../resources/global/xp-circle.png')} style={[styles.progressXp, styles.circlePoint ]}>
                                                    { this.state.level !== undefined &&
                                                        <Text style={styles.userXp}>{this.state.level}</Text>
                                                    }
                                                </ImageBackground>                                        
                                                <View style={ {marginLeft: -20 }}>
                                                    <Progress.Bar progress={this.state.levelProgress} width={120} height={21} 
                                                        color={"#EA585E"} borderColor={'#1E8D5D'} 
                                                        borderWidth={1.2} unfilledColor={'white'} borderRadius={50} />
                                                </View>
                                            </ImageBackground>   
                                        </View>
                                        <View style={{backgroundColor: '#fff', paddingHorizontal:40}}>      
                                            <Text style={[ globalStyles.alertText ,{marginTop:15, marginBottom: 15}]}> {[strings.userProfile.xp]} </Text>
                                            { this.state.currentPoints != undefined &&
                                                <View style={{flexDirection: 'row', justifyContent:'center', alignItems: 'center'}}>
                                                    <Image source={require('../../resources/global/icon-medal.png')} style={{height: 28, width: 19, resizeMode: 'contain'}}/>
                                                    <Text style={[ styles.alertText, {marginLeft: 10, marginTop:10, fontSize:14, fontWeight:'bold'}]}>{this.state.currentPoints}</Text>
                                                </View>
                                            }  
                                            <Button style={styles.alertButton} onPress={() => {this.hideAlert();this.props.navigation.navigate('UserLevel');}}>
                                                <Text style={styles.alertConfirmText}>{strings.userProfile.levelsList}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                }
                /> 
            </SafeAreaView>
        )
    }
}
const styles = StyleSheet.create({
    header:{
        height: 30,
        paddingTop: 20,
    },
    headerBack:{
        flexDirection: 'row', 
        height: 60,
        zIndex:2,
    },
    headerEdit:{
        flexDirection: 'row', 
        justifyContent: 'flex-end',
        height:20
    },
    backgroundImage: {
        flex: 1,
        height: 180,
    },
    userInfo:{
        marginTop:20,
    },
    picture: {
        alignItems: 'center',
        marginTop: 30,
    },
    userName:{
        alignSelf: 'center',
        color: '#2CA06C',
        fontSize: 22,
        fontWeight: '500',
    },
    userBoundary:{
        alignSelf: 'center',
        color: '#646465',
        fontSize: 16,
        fontWeight: '400',
    },
    textBold: {
        fontWeight: '900',
        color: '#4a4a4a',
    },
    textSmall: {
        fontWeight: '400',
        color: '#646465',
        fontSize: 10,
    },
    textButton: {
        fontWeight: '400',
        color: '#41B07C',
        fontSize: 12,
    },
    userData: {
        flexDirection: 'row',
        marginTop: 30,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems:'center',
        backgroundColor:'white'
    },    
    userDataElementFirst: {        
        borderRightWidth: 0.5, 
        borderRightColor: 'grey',
        fontSize: 13,
        fontWeight: '400',
    },   
    userDataElement: {
        fontSize: 12,
        paddingRight: 10,
    },
    levelText: {
        flexDirection: 'row', 
        alignSelf: 'center',
    },
    progressTail: {
        flexDirection: 'row', 
        marginHorizontal: '20%'
    },
    progressXp: {
        width: 23,
        height: 23,
    },
    circlePoint:{
        width: 33,
        height: 33,
        marginLeft: 12,
        marginTop: -5,
        zIndex: 1, 
        alignItems: 'flex-start',
        justifyContent:'center'
    },
    userXp: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFEDAD',
        textAlign:'center',
        alignSelf: 'center',
        justifyContent:'center',
        width: 18,
    },    
    buttonsContainer: {        
        backgroundColor: '#F6F6F9',
        paddingTop: 15,
        paddingBottom: 15,
        paddingLeft: 10,
        paddingRight: 10,
    },
    buttonCol: {
        margin: 10,
    },
    button: {
        width:'100%', 
        height: '100%', 
        backgroundColor:'#fff', 
        flexDirection: 'column', 
        resizeMode:'contain',
        paddingTop: 20,
        paddingBottom: 20,
    },
    circle: {
        height: 120,
        width: 120,
        borderRadius: 120/2,
        backgroundColor:'white',
        borderWidth:1,
        borderColor:'#f7f7f7'
    },
    buttonLabel:{
        fontSize: 10,
        color: '#888888',
        fontWeight: '500',
        marginTop: 12,
    },
    iconBenefits: {
        height: 50,
        resizeMode:'contain'
    },
    iconUserTrees: {
        height: 50,
        resizeMode:'contain'
    },
    iconInsignia: {
        height: 55,
        resizeMode:'contain'
    },
    iconFriends: {
        height: 52,
        resizeMode:'contain'
    },
    imgRadius: {
        height: 122,
        width: 122,
        borderRadius: 122/2,
    },
    alertContainer: {        
        alignItems: 'center', 
        paddingTop: 0, 
        paddingLeft: 20, 
        paddingRight: 20, 
        paddingBottom: 20,
        margin: 0,
    },
    alertButton: {
        backgroundColor: '#2CA06C',
        alignSelf: 'center',
        marginTop: 20,
        marginBottom: 35,
        paddingLeft: 12, 
        paddingRight: 12, 
        paddingTop: 12, 
        paddingBottom: 12,    
        borderRadius: 5,
        color: 'white'    
    },
    alertConfirmText: {
        fontSize: 12,
        fontWeight: '500',
        color: 'white',
    },  
    alertImage: {
        height: 86,
        width: 135,
        height: 86, 
        resizeMode: 'contain', 
        marginBottom: 5,
    },
    alertText:{
        alignSelf: 'center',
        marginBottom: 15,
        fontSize: 18,
        fontWeight: '400',
        color: '#5b5b5b'
    },
});

const mapStateToProps = (state) => {
    return {
        user: state.user,
        idToken: state.user.id_token,
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}


export default connect(mapStateToProps, mapDispatchToProps)(UserProfile);