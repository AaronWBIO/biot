import React, { Component } from 'react';
import { StyleSheet, Text, Image, View, } from 'react-native';
import AwesomeAlertPlus from './AwesomeAlertPlus';
import _ from 'lodash';
import strings from '../../config/languages';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import globalStyles from '../../styles/global';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import { NavigationActions } from 'react-navigation'
import { store } from '../../navigators/AppNavigator';

class GamificationAlert extends Component {
    customView = <Text></Text>;
    constructor(props) {
        super(props);
        this.state = {
            eventResponseVM: null,
            currentLevel: null,
            newLevel: null,
            generalText: '',
            show: false,
            step: 1,
            insignias: [],
            level: []
        }
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.generalText != nextProps.generalText ) {
            this.setState({ generalText:nextProps.generalText });
        }
        if (this.props.eventResponseVM != nextProps.eventResponseVM) {
            this.setState({ eventResponseVM:nextProps.eventResponseVM},() =>{
                if (_.has(this.state,'eventResponseVM.status') && this.state.eventResponseVM.status >= 0) {
                    if (this.state.eventResponseVM.alter && this.state.eventResponseVM.points > 0) {
                        var user = this.state.eventResponseVM.profile;
                        if (user == undefined || user == null) 
                            user = {};
                        user.id_token = this.props.idToken;
                        this.setState({currentLevel:this.props.user.currentLevel});
                        this.props.updateLocalUser(user);
                        this.state.step = 1;
                        this.state.insignias = [];
                        this.state.level = [];
                        if (this.state.eventResponseVM.achievements.length > 0) {
                            for(let achievement of this.state.eventResponseVM.achievements) {
                                if(achievement.type == "INSIGNIA") {
                                    this.state.insignias.push(achievement);
                                }
                                if(achievement.type == "LEVEL") {
                                    this.state.level.push(achievement);
                                }
                            }
                        } 
                        if (this.state.eventResponseVM.achievements.length == 0) {
                            this.state.step = 3;
                        } else if (this.state.insignias.length > 0) {
                            this.state.step = 1;
                        } else if (this.state.level.length > 0) {
                            this.state.step = 2;
                        }
                        // Show point alert
                        if (this.state.eventResponseVM.points > 0) {
                            this.customView = <View style={{paddingHorizontal:20, }}>
                            <Image source={require('../../resources/global/icon-cup.png')} style={ styles.alertImg}/> 
                                <Text style={globalStyles.alertTitleMain}> {[strings.triviaCreateForm.pointsWon,this.state.eventResponseVM.points, strings.triviaCreateForm.pointsWon2]} </Text>
                                <Text style={globalStyles.alertText}> 
                                { this.state.generalText }
                                </Text>                
                            </View>;
                            this.setState({ show: true });
                        } else {
                            if (this.state.achievements.length == 0) {
                                return;
                            } else {
                                this.nextAction();
                            }                            
                        }
                    }
                }
            });
        }
    }      
    nextAction() {
        this.setState({ show: false },()=> {
            if (this.state.step == 1) {
                if (this.state.insignias.length > 0) {
                    var achievement = this.state.insignias.pop();
                    this.customView = <View style={{padding: 20}}>
                        <Image source={{uri: `data:${achievement.insignia.imageContentType};base64,${achievement.insignia.image}`}} 
                                                                        style={[styles.alertImg]} />
                        <Text style={globalStyles.alertTitleMain}>{ strings.gamificaitionAlert.unlock }</Text>
                        <Text style={globalStyles.alertText}>{ achievement.name } </Text>                
                    </View>;
                    setTimeout(()=>{
                        this.setState({ show: true });
                    },1000);
                } else {
                    this.state.step = 2;
                }
            } else
            if (this.state.step == 2) {
                if (this.state.level.length > 0) {
                    var achievement = this.state.level.pop();
                    this.customView = <View style={{padding: 20, paddingTop:5 }}>
                        <Image resizeMode='cover'  source={{uri: `data:${achievement.insignia.imageContentType};base64,${achievement.insignia.image}`}} 
                                                                        style={[styles.alertImg, {width:150,height:150, marginTop:10}]} />
                        <Text style={globalStyles.alertTitle}>{ achievement.name } </Text>                
                        <Text style={globalStyles.alertText}>{ strings.gamificaitionAlert.levelReached }</Text>
                    </View>;
                    setTimeout(()=>{
                        this.setState({ show: true, newLevel: achievement });
                    },1000);
                } else {
                    this.state.step = 3;
                }
            } else if (this.state.step == 3){ 
                this.state.step = 4;
                let close = this.props.close != undefined && this.props.close == true;
                if (this.state.currentLevel != undefined && this.state.newLevel != undefined && 
                    this.state.currentLevel.id != this.state.newLevel.id) {
                    let payload = JSON.parse(this.state.newLevel.payload);
                    if (_.has(payload,'onBoardId')) {
                        let onBoardId = payload.onBoardId;
                        store.dispatch(NavigationActions.navigate({ routeName: 'OnBoard', params: { id: onBoardId }}));  
                        return;
                    }
                }
                if (close) {
                    setTimeout(()=>{
                        this.props.backFunc();
                    },1500);
                }
            } 
        });
    }
    render() {
       return <AwesomeAlertPlus
            { ...GeneralHelpers.alertTemplateDefault }
            show={ this.state.show }
            showConfirmButton={true}
            onCancelPressed={ this.nextAction.bind(this) }
            onConfirmPressed={ this.nextAction.bind(this) }
            onDismiss={ this.nextAction.bind(this) }
            customView = { this.customView }
        />
    }
}
const styles = StyleSheet.create({
    insignia:{
        marginTop: 40,
        height: 118,
        width: 118,
        resizeMode: 'contain',
        alignSelf: 'center'    
    },
    alertImg: {
        marginTop: 40,
        height: 118,
        width: 70,
        resizeMode: 'contain',
        alignSelf: 'center'
    }
});
const mapStateToProps = (state) => {
    return {
        idToken: state.user.id_token,
        user: state.user,
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(GamificationAlert);