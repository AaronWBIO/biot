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
import { FlatList } from 'react-native-gesture-handler';
import globalStyles from '../../styles/global';
import Loader from '../../components/loader/Loader';
import GeneralHelpers from '../../helpers/GeneralHelpers';

class TreeComments extends Component {
    static navigationOptions = ({ navigation}) => ({
        title: strings.treeComments.title,
        headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
            <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
        </TouchableOpacity>,        
        headerRight: (<View />),
        headerTintColor: colors.white,
        headerStyle: globalStyles.headerStyle,
        headerTitleStyle: globalStyles.headerTitleStyle,
    });    
    constructor(props) {
        super(props)
        const { navigation } = this.props;
        this.state = {     
            showSuccessAlert: false,
            alertSuccessText: '',
            showAlertRetry: false,   
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
        this.state.filters =  navigation.getParam('filters', null);
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
        var communityEntity = {
            bucketName: "tree-comment",
            objectName: "comment",
            payload: this.state.reason,
            relatedEntityId: this.state.id
        }
        this.setState({isLoading:true});
        CommunityService.createEntityRelatedData(
            communityEntity
        )
        .then((res)=> {
            if(res.status == 200 || res.status == 201){
                this.setState({showSuccessAlert:true, alertSuccessText:strings.treeComments.success});
            } else {
                this.setState({
                    showAlertRetry:true
                });
            }
            this.setState({isLoading:false});
        }).catch((e) => {
            this.setState({
                showAlertRetry:true
            });
            this.setState({isLoading:false});
        });
    }    
    exitAlert = () => {
        this.setState({ showAlertRetry: false });
        this.props.navigation.goBack();
    };
    retryAlert =() => {
        this.setState({showAlertRetry:false});
        this._saveEntity()
    }
    handleSave(){
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
                            <Text style={{marginLeft:5, color:'#737373', fontSize:14}}>{strings.treeComments[item.name]}</Text>
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
                            <Image source={require('../../resources/global/icon-tree-gen.png')}  style={ globalStyles.alertImg}/>
                            <Text style={[ globalStyles.alertText, {marginTop: 10}] }>{strings.treeComments.desc}</Text>
                        </View>
                        <Form style={{marginHorizontal:'15%', marginBottom: 20,}}>
                            <FlatList
                                extraData={this.state}
                                data={this.state.opReasons}
                                keyExtractor={(item, index) => item.id + '-' + index}
                                styles= {styles.container}                                
                                renderItem= {this.renderItem}
                            />
                            { this.state.last ? 
                                <View style={{borderBottomWidth:0, marginLeft: 0, paddingBottom: 0, paddingTop:20, paddingRight:0,}}>
                                    <Textarea style={{borderBottomWidth: 1, borderBottomColor: '#CFCECF', marginTop: 0, width: '100%', color: '#737373', fontSize: 12}} 
                                        rowSpan={2} 
                                        placeholder={ strings.treeComments.otherDesc } 
                                        ref="reason"
                                        ref={component => this._reason = component}
                                        value={this.state.reason} 
                                        onChangeText={ (text) => this.setState({ reason: text }) }/>
                                    <Text style={{ color:'#737373', fontSize:11, width: '100%', lineHeight:20, paddingTop:10}}>{ strings.treeComments.descLong }</Text>
                                </View> 
                                :
                                null
                            }
                            { this.state.noOther ?
                                <Text style={ styles.error }> {strings.treeComments.noOther} </Text>  : null
                            }
                            { this.state.noSelected ?
                                <Text style={ styles.error }> {strings.treeComments.noSelected} </Text>  : null
                            }
                        </Form>
                        <View style={styles.buttonContainer}>
                            <Button block success style={ styles.closeButton } onPress={ () => this.handleSave() } >
                                <Text style= { styles.close }>{ strings.treeComments.save }</Text>
                            </Button>
                        </View>

                    </View>
                </ScrollView> 
                { /* Loader */}
                { this.state.isLoading && <Loader></Loader>} 
                { /* Success alert */}
                <AwesomeAlertPlus
                    show={ this.state.showSuccessAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    onConfirmPressed={ () => { 
                        this.setState({showSuccessAlert:false});
                        this.props.navigation.goBack();
                    }}
                    onDismiss={ () => { this.setState({showSuccessAlert:false})}}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-check.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={globalStyles.alertText}> { this.state.alertSuccessText }  </Text>
                                    </View> 
                                    }
                />   
                { /* Error alert with retry */}
                <AwesomeAlertPlus
                    show={ this.state.showAlertRetry }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton={false}
                    customView = {  <View style={ globalStyles.alertContainer }>
                                        <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={ globalStyles.alertText }> {strings.general.error} </Text>
                                        <View style={{ marginTop: 20}}>
                                            <Button  style={[styles.retryButton,]} onPress={ () => this.retryAlert()} >
                                                <Text style={styles.next}> {strings.triviaCreateForm.retry}</Text>
                                            </Button>
                                            <Button style={styles.exitButton} onPress={ () => { this.exitAlert()} } >
                                                <Text style={styles.next}> {strings.triviaCreateForm.exit}</Text>
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
    nextButton: {
        backgroundColor:'#41B17C', 
        borderRadius: 5,
    },
    next: {
        fontWeight:'bold',
        color: 'white',
        textAlign:'center'
    },
});
 
const mapStateToProps = (state) => {
    return {
        param: state.param,
        idToken: state.user.id_token,
        user: state.user,
        config: state.config.application.dynamic.treeCommentsModule.closeReasons,
        loggedInStatus: state.loggedInStatus
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}


export default connect(mapStateToProps, mapDispatchToProps)(TreeComments);