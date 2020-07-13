import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import { Col, Row } from "react-native-easy-grid";
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
import {  Card, CardItem, Body, Left, Icon } from 'native-base';
import strings from '../../config/languages';
import * as Progress from 'react-native-progress';
import TriviaService from '../../services/trivia';
import Loader from '../../components/loader/Loader';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import _ from 'lodash';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import globalStyles from '../../styles/global';

class Trivia extends Component {
    static navigationOptions = ({}) => ({
        headerTransparent: true,
        headerLeft: null
    });
    constructor(props) {
        super(props)
        this.state = {
            isLoading: false,
            questions: [],
            showErrorAlert: false,
            alertErrorText: '',
            level: 0,
            levelProgress:0,
            levelDescription: '',
            currentPoints:0,
            min: 0,
            max: 1000,
            wallet: 'default-xp',
            perms: {
                answerTrivias: {
                    interact: { status:true }
                },
                addTrivia: {
                    interact: { status:true }
                },
            }
        }
        this.permsMaping();
        this.userMapping();
    }
    permsMaping() {
        this.state.perms.answerTrivias.interact = GeneralHelpers.hasPermission('answerTrivias','interact').remote == true ?
          GeneralHelpers.hasPermission('answerTrivias','interact') :
          this.state.perms.answerTrivias.interact;
        this.state.perms.addTrivia.interact = GeneralHelpers.hasPermission('addTrivia','interact').remote == true ?
          GeneralHelpers.hasPermission('addTrivia','interact') :
          this.state.perms.addTrivia.interact;
    }
    userMapping() {
        var u = this.props.user;
        var payload = {};
        if (_.has(u,"currentLevel.description")) 
            this.state.levelDescription = u.currentLevel.name;
        if (_.has(u,"currentLevel.payload")) 
            payload = JSON.parse(u.currentLevel.payload);    
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
    componentDidUpdate(prevProps) {
        if (prevProps.user != this.props.user) {
            this.userMapping();
            this.permsMaping();
            this.setState(this.state);
        }
    }
    action(option){
        if(option == 1) {
            TriviaService.getTrivia()
            .then((res) => {
                if(res.status == 455) {
                    this.setState({
                        showErrorAlert:true,
                        alertErrorText: res._bodyText
                    });
                } else {
                    return res.json();
                }
            })
            .then(res  => {
                if (_.has(res,"status")) {                
                    var result = res;
                    this.setState({
                        questions: result.original.questions,
                        isLoading: false
                    },() => {
                        if (this.state.perms.answerTrivias.interact.status == false) {
                            this.setState({
                                showErrorAlert:true,
                                alertErrorText: this.state.perms.answerTrivias.interact.desc
                            });
                            return;
                        }
                        if(this.state.questions.length == 0) {
                            this.setState({
                                showErrorAlert:true,
                                alertErrorText: strings.trivia.empty
                            });
                            return;
                        }
                        this.props.navigation.navigate('TriviaAnswer', { questions:this.state.questions});
                    })     
                } else { 
                    this.setState({isLoading:false});
                }
            }).catch((e) => {
                this.setState({isLoading:false});
            });
        } else {
            if (this.state.perms.addTrivia.interact.status == false) {
                this.setState({
                    showErrorAlert:true,
                    alertErrorText: this.state.perms.addTrivia.interact.desc
                });
                return;
            } 
            this.props.navigation.navigate('TriviaCreate');   
        }
    }
    render() {
        const { goBack } = this.props.navigation;
        return (
            <SafeAreaView style={{ flex:1, backgroundColor:'#F6F6F9' }}>
                <ScrollView> 
                    <View style={{backgroundColor:'white'}}>
                        <ImageBackground  source={require('../../resources/trivia/header.png')} style={styles.backgroundImage}>
                            <View style= { styles.header} >
                                <Row>
                                    <Col style={ [ styles.headerBack] }>
                                        <TouchableOpacity  style={{ width:60, height:60, marginRight:15, justifyContent:'center'}}  onPress={ () => goBack() } >
                                            <Icon name="ios-arrow-back" style={[{ alignSelf:'center'},globalStyles.headerLeftIcon]}/>
                                        </TouchableOpacity>
                                        <Text style={[styles.headerTitle]}> 
                                            {strings.trivia.title} 
                                        </Text>
                                    </Col>
                                </Row>
                            </View>
                            <View style={styles.circle}>
                                <View style={styles.circleContain}>
                                    <Image  source={require('../../resources/trivia/icon-card.png')} style={ styles.circleIcon} />
                                </View>
                            </View>
                        </ImageBackground>
                        <View style={styles.userData}>       
                            <Row>
                                <Col style={{ width:'50%', paddingLeft:30, paddingRight:30}}>
                                    <View style={{flex:1, flexDirection:'row', textAlign:'left'}}>
                                        <Text style={[ globalStyles.text , { fontWeight:'bold', marginBottom:5, fontSize:13}]}>{this.state.levelDescription}</Text>                                        
                                    </View>
                                    <ImageBackground  source={require('../../resources/global/xp-tail.png')} style={[styles.progressXp, styles.progressTail, 
                                        {width:'100%', marginLeft:-35}]}>
                                        <ImageBackground  source={require('../../resources/global/xp-circle.png')} style={[styles.progressXp, styles.circlePoint, {marginLeft:45} ]}>
                                            <Text style={[styles.userXp, {fontSize:14}]}>{this.state.level}</Text>
                                        </ImageBackground>   
                                        <Progress.Bar style={{ marginLeft:-33 }} progress={this.state.levelProgress}  height={20} 
                                                color={"#EA585E"} borderColor={'#1E8D5D'} 
                                                borderWidth={1.2} unfilledColor={'white'} borderRadius={50} />
                                    </ImageBackground>
                                </Col>
                                <Col  style={{ width:'50%', paddingLeft:10, paddingRight:10, height:60, alignItems:'center', alignContent:'center', justifyContent:'center'}}>
                                    <Text style={[globalStyles.text, { fontSize:13, marginBottom:5}]}>{strings.trivia.label}</Text>
                                    <View style={{flex:1, flexDirection:'row', textAlign:'left', alignSelf:'center'}}>
                                        <ImageBackground  source={require('../../resources/global/icon-medal.png')} 
                                            style={{ width:20, height:30, alignSelf:'center',  alignItems: 'center'}}>
                                        </ImageBackground>
                                        <Text style={[ globalStyles.text , { fontWeight:'bold', marginLeft:10}]}>{this.state.currentPoints}</Text>                                        
                                    </View>

                                </Col>
                            </Row>                                  
                        </View>
                        <View style={styles.buttonsContainer}>
                            <View style={{marginHorizontal: 45,}}>
                                <View style={{marginHorizontal: 20, marginBottom: 20}}>
                                    <Text style={[ globalStyles.text,{textAlign: 'center', fontSize: 16, fontWeight:'300'}]}>
                                        <Text style={{ fontWeight:'900'}}> {strings.trivia.instructions01} </Text>
                                        {strings.trivia.instructions02}
                                        <Text style={{ fontWeight:'900'}}> {strings.trivia.instructions03} </Text>
                                    </Text>
                                </View>
                                <Card style={{marginBottom:20}}>
                                    <TouchableOpacity onPress={ () => this.action(1) }>
                                        <CardItem style={{width:'80%', alignSelf:'center'}}>
                                            <Left>
                                                <Image source={require('../../resources/trivia/icon-play.png')} style={{width:36, height:43, resizeMode:'contain'}}/>
                                                <Body>
                                                    <Text style={styles.buttonText}> {strings.trivia.play} </Text>
                                                </Body>
                                            </Left>                                        
                                        </CardItem>
                                    </TouchableOpacity>
                                </Card>
                                <Card >            
                                        <TouchableOpacity onPress={ () => this.action(2) }>                      
                                            <CardItem style={{width:'80%', alignSelf:'center', }}>                                                
                                                <Left >
                                                    <Image source={require('../../resources/trivia/icon-create.png')} style={{width:36, height:27, resizeMode:'contain'}}/>
                                                    <Body>
                                                        <Text style={styles.buttonText}> {strings.trivia.create} </Text>
                                                    </Body>
                                                </Left> 
                                            </CardItem>
                                        </TouchableOpacity>
                                    </Card> 
                            </View>
                        </View>
                    </View>
                </ScrollView>      
                { /* Error alert */}
                <AwesomeAlertPlus
                    show={ this.state.showErrorAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    onConfirmPressed={ () => { this.setState({showErrorAlert:false})}}
                    onDismiss={ () => { this.setState({showErrorAlert:false})}}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={globalStyles.alertTitle}> { strings.alertSorry } </Text>       
                                        <Text style={globalStyles.alertText}> { this.state.alertErrorText }  </Text>
                                    </View> 
                                    }
                />    
                { this.state.isLoading  && <Loader></Loader> } 
            </SafeAreaView>
        )
    }
}
const styles = StyleSheet.create({
    header:{
        height: 60,
        paddingTop: 20,
    },
    headerBack:{
        flexDirection: 'row', 
        height: 60,
        zIndex:2,
    },
    backgroundImage: {
        flex: 1,
        height: 205,
    },
    circle:{
        marginTop: 30,
        height:120, 
        width: 120, 
        backgroundColor:'#2CA06C', 
        borderRadius: 60, 
        justifyContent:'center', 
        alignSelf:'center'
    },
    circleContain:{
        height:110, 
        width: 110, 
        backgroundColor:'#FFF', 
        borderRadius: 55, 
        justifyContent:'center', 
        alignSelf:'center', 
        elevation: 2,
        borderColor: "#3F51B5",
        borderBottomWidth: null,
        borderLeftWidth: null,
        borderRightWidth: null,
        borderTopWidth: null,
    },
    circleIcon:{
        height:77, 
        width:62, 
        resizeMode:'contain', 
        alignSelf:'center',
    },
    headerTitle: { 
        alignSelf:'center', 
        textAlign: 'center', 
        color:'#fff', 
        fontWeight: '400', 
        fontSize: 19, 
        marginLeft: -76,
        width:'100%', 
        zIndex: -1,
    },
    userData: {
        marginTop: 20,
        marginBottom: 25,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor:'white'
    },
    userDataElement: {
        fontSize: 12,
        paddingRight: 10,
    },
    progressTail: {
        flexDirection: 'row',
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
        alignItems: 'flex-start'
    },
    userXp: {
        paddingTop: 6,
        fontSize: 14,
        fontWeight: '600',
        color: '#FFEDAD',
        textAlign:'center',
        alignSelf: 'center',
        width: 18,
    },    
    buttonsContainer: {        
        backgroundColor: '#F6F6F9',
        paddingTop: 50,
        paddingBottom: 50,
        paddingLeft: 10,
        paddingRight: 10,
    },
    buttonText:{
        fontSize:14, 
        fontWeight:'400', 
        color:'#4a4a4a',
    }
});

const mapStateToProps = (state) => {
    return {
        user: state.user
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}


export default connect(mapStateToProps, mapDispatchToProps)(Trivia);