import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import {
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Form, ListItem, CheckBox, Body, Icon, Textarea} from 'native-base';
import strings from '../../config/languages';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import CommunityService from '../../services/community';
import UserService from '../../services/user';
import { FlatList } from 'react-native-gesture-handler';
import globalStyles from '../../styles/global';
import Loader from '../../components/loader/Loader';

class PromoteUserCancel extends Component {
    static navigationOptions = ({ navigation}) => ({
        title: strings.promoteUserCancel.title,
        headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
            <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
        </TouchableOpacity>,        
        headerRight: (<View />),
        headerTintColor: colors.white,
        headerStyle: globalStyles.headerStyle,
        headerTitleStyle: globalStyles.headerTitleStyle,
    });    
    deviceLocale = this.props.lang != undefined ? this.props.lang : 'es';
    constructor(props) {
        super(props)
        const { navigation } = this.props;
        this.state = {            
            last: '',
            selected: null,
            reason: null,
            noSelected: false,
            alert: { show: false, confirmText: null,  view: <View/>, onConfirmPressed:null, onCancelPressed: null, 
                closeOnHardwareBackPress: null, closeOnTouchOutside: null, showConfirmButton: false},
            opReasons:[],
            isLoading:  false,
        }  
        this.state.id =  navigation.getParam('id', null);
    }
    componentDidMount(){
        let opt = [];
        this.props.config.map((data,index) => {
            let item = []; 
            item['id'] = index;
            item['name'] = data;
            item['status'] = false;
            item['checked'] = false;
            opt.push(item);
        });
        this.setState({
            opReasons: opt
        });
    }
    _saveEntity(){
        this.setState({isLoading:true});
        var communityEntity = {
            bucketName: "user-policy-module",
            objectName: "down-reason",
            payload: this.state.reason,
            relatedEntityId: this.state.id
        }
        CommunityService.createEntityRelatedData(
            communityEntity
        )
        .then((res)=> {
            if(res.status == 200 || res.status == 201){
                this.updatePromote(this.state.id);
            } else {
                this.alertError();
            }
            this.setState({isLoading:false});
        }).catch((e) => {
            this.alertError();
            this.setState({isLoading:false});
        });
    }    
    showAlert = () => {
        this.state.alert.show = true;
        this.setState({ alert: this.state.alert });
    };
    hideAlert = () => {
        this.state.alert.show = false;
        this.setState({ alert: this.state.alert });        
    };
    exitAlert = () => {
        this.state.alert.show = false;
        this.setState({ alert: this.state.alert });
        this.props.navigation.goBack();
    };
    retryAlert =() => {
        this.hideAlert();
        this._saveEntity()
    }
    alertConfirmation(){
        this.state.alert.view = 
            <View> 
                <View style={globalStyles.alertContainer}>
                    <Image source={require('../../resources/global/icon-check.png')} style={ globalStyles.alertImg }/> 
                    <Text style={[globalStyles.alertText,{marginTop:20, width:150}]}> {strings.promoteUserCancel.closed } </Text>       
                </View>
            </View>
        this.state.alert.showConfirmButton= true; 
        this.state.alert.closeOnTouchOutside= false;
        this.state.alert.closeOnHardwareBackPress= false;
        this.state.alert.confirmText= strings.communityCloseThread.end;
        this.state.alert.onConfirmPressed = () => { 
            this.hideAlert(); 
            this.props.navigation.navigate('PromoteUsers');
        };
        this.setState({ alert: this.state.alert });
        this.showAlert();
    }
    alertError(){
        this.state.alert.view = <View style={ globalStyles.alertContainer }>
                                    <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/>                             
                                    <Text style={ globalStyles.alertText}> {strings.general.error} </Text>
                                    <View style={{ marginTop: 20}}>
                                        <Button  style={[styles.retryButton,]} onPress={ () => this.retryAlert()} >
                                            <Text style={styles.next}> {strings.retry}</Text>
                                        </Button>
                                        <Button style={styles.exitButton} onPress={ () => { this.exitAlert()} } >
                                            <Text style={styles.next}> {strings.exit}</Text>
                                        </Button>
                                    </View>
                                </View>
        this.state.alert.showConfirmButton= false; 
        this.state.alert.closeOnTouchOutside= false;
        this.state.alert.closeOnHardwareBackPress= false;
        this.setState({ alert: this.state.alert }); 
        this.showAlert();
    }
    handlePromoteDown(){
        let valid= false;
        if(!this.state.selected){
            this.setState({
                noSelected : true,
            })
        } else {
            this.setState({
                noSelected : false,
                noOther: false,
            })
            if(this.state.last){
                if(this.state.reason != null){
                    this.setState({
                        noOther : false,                        
                    })
                    valid = true;
                } else {
                    this.setState({
                        noOther : true,
                    })                    
                }
            } else {
                valid = true;
            }
        }

        if ( valid ) {
            this._saveEntity();            
        }
            
    }
    updatePromote(id){
        UserService.togglePRO(
            id
        )
        .then(res => {
            if(res.status == 200 || res.status == 201){
                this.alertConfirmation();     
            }
        })
        .catch(e => { });  
    }
    selectOpt(item, index){
        let change = this.state.opReasons;
        let last  = null;
        let reason = null;
        for( x = 0; x< change.length ; x++){
            if(x == index){
                change[x]. status = true;
                reason = change[x].name;
            } else{
                change[x]. status = false;
            }
        }
        if(index == change.length-1){
            last = true;
            this.setState({
                reason : null
            })
        } else {
            this.setState({
                reason : reason
            })
        }

        this.setState({
            selected: true,
            noSelected: false,
            noOther: false,
            opReasons: change,
            last: last,
        })
    }

    renderItem = ({ item, index }) => {
        return (            
                <View key={item.id} >      
                    <ListItem style={{borderBottomWidth:0, marginLeft: 0,}}>
                        <CheckBox color={'#41B17C'} checked={item.status} 
                            onPress={ () => this.selectOpt(item,index)}/>
                        <Body>
                            <Text style={{marginLeft:10, color:'#737373', fontSize:14}}>{strings.policyDownReasons[item.name]}</Text>
                        </Body>
                    </ListItem>
                </View>
        );
    };
    render() {
        return ( 
            <SafeAreaView>
                <ScrollView>                    
                    <View style={{  }}>
                        <View style={{marginTop:40, alignItems: 'center', marginHorizontal: '15%', marginBottom: 20, }}>
                            <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/> 
                            <Text style={globalStyles.alertTitleMain}>{strings.promoteUsers.aboutToDemote}</Text>
                            <Text style={[globalStyles.alertText, {marginTop: 10}]}>{strings.promoteUsers.reason}</Text>
                            
                        </View>
                        <Form style={{marginHorizontal:'15%', marginBottom: 20,}}>
                            <FlatList
                                extraData={this.state}
                                data={this.state.opReasons}
                                keyExtractor={(item, index) => item.id+''}
                                styles= {styles.container}                                
                                renderItem= {this.renderItem}
                            />
                                                        
                            { this.state.last ? 
                                <ListItem style={{borderBottomWidth:0, marginLeft: 0, paddingBottom: 0, paddingTop:0, paddingRight:0,}}>
                                    <Textarea style={{borderBottomWidth: 1, borderBottomColor: '#CFCECF', marginTop: 10, width: '100%', color: '#4a4a4a', fontSize: 14}} 
                                        rowSpan={2} 
                                        placeholder={strings.promoteUserCancel.other } 
                                        placeholderTextColor={'#737373'}
                                        ref="reason"
                                        ref={component => this._reason = component}
                                        value={this.state.reason} 
                                        onChangeText={ (text) => this.setState({ reason: text }) }/>
                                </ListItem> 
                                :
                                null
                            }
                            { this.state.noOther ?
                                <Text style={ styles.error }> {strings.communityCloseThread.noOther} </Text>  : null
                            }
                            { this.state.noSelected ?
                                <Text style={ styles.error }> {strings.communityCloseThread.noSelected} </Text>  : null
                            }
                        </Form>

                        <View style={styles.buttonContainer}>
                            <Button block success style={ styles.closeButton } onPress={ () => this.handlePromoteDown() } >
                                <Text style= { styles.close }>{strings.promoteUserCancel.disable}</Text>
                            </Button>
                        </View>

                    </View>
                </ScrollView> 
                <AwesomeAlertPlus
                    alertContainerStyle = { { padding: 0, } }
                    overlayStyle= { {padding: 0} }
                    contentContainerStyle= { {borderWidth: 0, borderRadius: 0, padding: 0, margin: 0} }
                    messageStyle= { {padding: 0} }
                    show={ this.state.alert.show }
                    showProgress={false}
                    closeOnTouchOutside={this.state.alert.closeOnTouchOutside}
                    closeOnHardwareBackPress={this.state.alert.closeOnHardwareBackPress}
                    showCancelButton={false}
                    showConfirmButton={this.state.alert.showConfirmButton}
                    confirmText= {this.state.alert.confirmText}
                    confirmButtonTextStyle= { styles.alertConfirmText }
                    confirmButtonColor="#2CA06C"
                    confirmButtonStyle = { styles.alertButton }
                    onCancelPressed={ this.state.alert.onCancelPressed }
                    onConfirmPressed={ this.state.alert.onConfirmPressed }
                    onDismiss={() => this.hideAlert()}
                    customView = { this.state.alert.view }
                />
                { this.state.isLoading && <Loader></Loader> }  
            </SafeAreaView>
        )  
    }
}

const styles = StyleSheet.create({    
    buttonContainer: {
        marginLeft: 60,
        marginRight: 60,
        marginTop: 10,
        marginBottom: 20,  
    },
    closeButton: {
        backgroundColor:'#41B07C', 
        borderRadius: 5,
    },
    close: {
        fontWeight:'bold',
        color: 'white',
    },    
    alertButton: {
        width: '100%',  
        marginBottom: 40,
        paddingHorizontal: 40,
        paddingVertical: 10,
    },
    alertConfirmText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        color: '#fefefe'
    },
    error: {
        color: "#EA585E",
        fontSize: 12,
        paddingTop:10,
        paddingLeft:0,
        paddingBottom:10  
    },
    retryButton: {
        backgroundColor:'#41B07C', 
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: 10,
        width: '100%',
        textAlign:'center',
        justifyContent:'center'
    },
    exitButton: {
        backgroundColor:'#EA585E', 
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: 10,
        width: '100%', 
        textAlign:'center',
        justifyContent:'center'
    },
    next: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        color: '#fff'
    },
});
 
const mapStateToProps = (state) => {
    return {
        param: state.param,
        idToken: state.user.id_token,
        user: state.user,
        config: state.config.application.dynamic.userPolicyModule.policyDownReasons,
        loggedInStatus: state.loggedInStatus
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}


export default connect(mapStateToProps, mapDispatchToProps)(PromoteUserCancel);