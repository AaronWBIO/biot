import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { Col, Row, } from "react-native-easy-grid";
import { SafeAreaView } from 'react-navigation';
import {
    StyleSheet,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    View,
    FlatList,
} from 'react-native';
import { Body, Card, CardItem, Left, Icon, List, ListItem, Textarea, Item, Button } from 'native-base';
import strings from '../../config/languages';
import { BottomSheet } from 'react-native-btr';
import CommunityService from '../../services/community';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import Loader from '../../components/loader/Loader';
import constants from '../../config/constants';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import GamificationAlert from '../../components/awesome-alert/GamificationAlert';
import ImageWithAuth from '../../components/image';
import globalStyles from '../../styles/global';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

const numColumns = 1;
class CommunityThread extends Component {
    static navigationOptions = ({ navigation}) => ({
        title: strings.communityThread.title,
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
            backFunc: () => {},
            isLoading:  false,
            isSendingComment: false,
            isProcessingLike: false,
            showSuccessAlert: false,
            alertSuccessText: '',
            showAlertRetry: false,    
            showErrorAlert: false,
            alertErrorText: '',
            eventResponseVM: {},     
            gamificationAlertGeneralText:'',
            userIsPro: false,
            firstName: null,
            lastName: null,
            imageUrl: "",
            showBottomSheetOptions: { visible: false},
            thread: [],
            replays:[],
            newComment:null,          
            perms: {
                community: {
                    toggleSticky: { status:false },
                    toggleClose: { status:false }
                },
                communityComment: {
                    interact: { status:true },
                }
            }
        }
        this.permsMaping();
        this.state.item =  navigation.getParam('item', null);  
    }
    permsMaping() {
        this.state.perms.community.toggleSticky = GeneralHelpers.hasPermission('community','toggleSticky').remote == true ?
        GeneralHelpers.hasPermission('community','toggleSticky') :
        this.state.perms.community.toggleSticky;
        this.state.perms.community.toggleClose = GeneralHelpers.hasPermission('community','toggleClose').remote == true ?
        GeneralHelpers.hasPermission('community','toggleClose') :
        this.state.perms.community.toggleClose;
        this.state.perms.communityComment.interact = GeneralHelpers.hasPermission('communityComment','interact').remote == true ?
          GeneralHelpers.hasPermission('communityComment','interact') :
          this.state.perms.communityComment.interact;
    }
    componentDidMount() {
        this.setState({
            firstName: this.props.user.user.firstName,
            lastName: this.props.user.user.lastName,
            imageUrl: this.props.user.user.imageUrl,            
            thread: {
                id: this.state.item.id,                
                imageUrl: this.state.item.author.imageUrl,                
                firstName: this.state.item.author.firstName,
                lastName: this.state.item.author.lastName,
                readableDate: this.state.item.readableDate,
                message: this.state.item.body,
                image: this.state.item.image,
                tags: this.state.item.tags,
                like: this.state.item.likedByCurrentUser,
                likes: this.state.item.likes,
                replys: this.state.item.comments,
                sticky: this.state.item.sticky,
                threadClose: this.state.item.status,
            }
        });
        this.setUpUserRole();
        this._loadComments();
    }
    _loadComments(){
        this.setState({isLoading: true});
        CommunityService.getPublicationComments(
            this.state.item.id
        )
        .then(res => res.json())
        .then(res => {
            if(!(res.status && res.status == 400)){
                this.setState({
                    replays: res
                });
            }            
            this.setState({isLoading: false});
        })
        .catch(err => {
            this.setState({isLoading: false});
        });
    }
    setUpUserRole(){
        let isPro = this.state.perms.community.toggleClose.status || this.state.perms.community.toggleSticky.status;
        let isAdmin = this.props.user.authorities.findIndex(element => element.name === 'ROLE_ADMIN');
        if(isPro != false || isAdmin != -1){
            this.setState({ userIsPro: true })
        }
    }
    exitAlert = () => {
        this.setState({showAlertRetry:false});
        this.props.navigation.goBack();
    };
    retryAlert =() => {
        this.setState({showAlertRetry:false});
        this.addComment()
    }
    actionLike(){
        this.setState({isProcessingLike:true});
        CommunityService.toggleLike(
            this.state.item.id
        )
        .then(res => {
            if(res.status == 200 || res.status == 201){         
                var newThread = [];
                newThread = this.state.thread;
                if( !newThread.like ) {             
                    newThread.likes = newThread.likes + 1;
                    newThread.like = true;
                } else {
                    newThread.likes = newThread.likes - 1;
                    newThread.like = false;
                }
                this.setState({ thread: newThread });
            }
            this.setState({isProcessingLike:false});
        })
        .catch(e => { 
            this.setState({isProcessingLike:false});
        });       
    }
    getTags(tags) {
        return tags.map(function(item, i){
          return(
            <View key={i} style={[styles.tagContainer,{ marginBottom:10}]}>
              <Text style={styles.tagsText}>{item.tag}</Text>
            </View>
          );
        }); 
    }
    handleSticky(){
        CommunityService.toggleSticky(
            this.state.thread.id
        )
        .then(res => {
            if(res.status == 200 || res.status == 201){         
                var newThread = [];
                newThread = this.state.thread;
                newThread.sticky = !newThread.sticky;
                this.setState({ 
                    thread: newThread,
                    showBottomSheetOptions: {visible: false, item: null, index: null}
                });
            }
        })
        .catch(e => { });  
    }
    handleCloseThread(){
        let id = this.state.thread.id;
        var newThread = [];
        newThread = this.state.thread;
        newThread.threadClose = !newThread.threadClose;
        this.setState({ 
            thread: newThread,
            showBottomSheetOptions: {visible: false, item: null, index: null}
        });
        this.props.navigation.navigate('CommunityCloseThread',{ id, mode:'view' });
    }
    handleValidation(){
        this.setState({
            showBottomSheetOptions: {visible: false}
        });
        this.props.navigation.navigate('TreeEditForm');
    }
    showOptionsComponent() {
        let data = { visible: true}
        this.setState({ showBottomSheetOptions : data });
    }
    bottomSheetOptions = () =>         
        (<BottomSheet 
            visible={ this.state.showBottomSheetOptions.visible}
            onBackButtonPress={ () => { this.setState({ showBottomSheetOptions: {visible: false} }) }}
            onBackdropPress={ () => { this.setState({ showBottomSheetOptions: {visible: false} }) }}>
            <SafeAreaView style={ styles.block }>                
                <TouchableOpacity style={ styles.blockCloseButton } onPress={ (e) => { this.setState({showBottomSheetOptions: {visible: false } }) }}>
                    <Icon name="ios-close-circle" style={ styles.blockIcon }/>
                </TouchableOpacity>
                <View>
                    <List>                                                        
                        <ListItem thumbnail style={ {borderBottomColor: "#D2D3D2", borderBottomWidth: 1, marginLeft: 0}}>                                    
                            <Left style={{paddingLeft:20}}>
                                <TouchableOpacity onPress={() => this.handleSticky()}>
                                    { !this.state.thread.sticky ?
                                        <Image source={require('../../resources/global/icon-star.png')} style={{width: 18, height: 18, resizeMode: 'contain',}} />
                                        :
                                        <Image source={require('../../resources/global/icon-star-gray.png')} style={{width: 18, height: 18, resizeMode: 'contain',}} />
                                    }
                                    
                                </TouchableOpacity>
                            </Left>
                            <Body style={{ borderBottomWidth: 0 }}>
                                <TouchableOpacity onPress={() => this.handleSticky()}>
                                    { !this.state.thread.sticky ?
                                        <Text>{strings.community.bottomOptionLayer.outstanding}</Text>
                                        :
                                        <Text>{strings.community.bottomOptionLayer.noOutstanding}</Text>
                                    }
                                </TouchableOpacity>
                            </Body>                            
                        </ListItem >                        
                        { this.state.thread.threadClose == 'open' ?
                            <ListItem thumbnail style={ {borderBottomColor: "#D2D3D2", borderBottomWidth: 1, marginLeft: 0}} >
                                <Left style={{paddingLeft:20}}>
                                    <TouchableOpacity onPress={() => this.handleCloseThread()}>
                                        <Image source={require('../../resources/community/icon-red-close.png')} style={{width: 18, height: 18, resizeMode: 'contain',}}/>
                                    </TouchableOpacity>
                                </Left>
                                <Body>
                                    <TouchableOpacity onPress={() => this.handleCloseThread()}>
                                        <Text>{strings.community.bottomOptionLayer.close}</Text>
                                    </TouchableOpacity>
                                </Body>
                            </ListItem>
                            :
                            null
                        }
                    </List>
                </View>                
            </SafeAreaView> 
        </BottomSheet>);
    getimageUrl(item){
        if(item.imageUrl != undefined && item.imageUrl.length > 0 && item.imageUrl.startsWith('http')){
            return <ImageWithAuth  style={[styles.userPictureBorder, styles.imageProfile]} source={{uri: item.imageUrl}}/>
        } else {
            return <ImageWithAuth  style={[styles.userPictureBorder, styles.imageProfile]}
                        source={{ 
                            headers: { Pragma: 'no-cache',  'Authorization' : "Bearer " + this.props.idToken },
                            uri: constants.base + item.imageUrl }} 
                    />
        }        
    }
    renderItem = ({ item, index }) => {
        if (item.empty === true) {
            return <View key={item.id} style={[styles.item, styles.itemInvisible]} />;
        }   
        return  <View style={{marginTop:20, marginBottom:20, borderBottomColor:'#D2D3D280', borderBottomWidth:1, paddingBottom:5}}>
                    <Left>
                        {  item.user.imageUrl != undefined ?
                            this.getimageUrl(item.user) : null
                        }
                        <Body>
                            <Text style={styles.userName}>{[item.user.firstName, ' ', item.user.lastName]}</Text>
                            <Text style={styles.publishDate}>{ item.readableDate }</Text>                                
                        </Body>                                
                    </Left>
                    <Text style={[styles.message,{marginTop:5, padding: 10, paddingLeft:0,fontSize:12}]}>
                        {item.body}
                    </Text>
                </View>
    }
    addComment(){
        this.setState({isSendingComment:true});
        if(this.state.newComment != null){
            if (this.state.perms.communityComment.interact.status == false) {
                this.setState({
                    showErrorAlert:true,
                    alertErrorText: this.state.perms.communityComment.interact.desc
                });
                return;
            }
            let newComment = {
                id: this.state.item.id,
                body: this.state.newComment,
            }
            CommunityService.postComment(
                newComment
            )
            .then((res) => res.json())
            .then(res => {
                if(res.status == 200 || res.status == 201){
                    this.setState({
                        newComment: null
                    });
                    this._loadComments();
                    var eventResponseVM = res;
                    if(eventResponseVM.points > 0) {
                        setTimeout(() => {
                            this.setState({isLoading:false});
                            this.setState({ 
                                close: false,
                                backFunc: () => { this.props.navigation.goBack() },
                                gamificationAlertGeneralText: strings.communityThread.alerts.points.pointsMsg,
                                eventResponseVM:eventResponseVM});
                        },100)
                    } else {
                        this.setState({showSuccessAlert:true, alertSuccessText: strings.communityThread.alerts.points.pointsMsg});
                    }
                    this.setState({isSendingComment:false});
                }  else{
                    this.setState({showAlertRetry:true});
                    this.setState({isSendingComment:false});
                }
            })
            .catch(e =>{
                this.setState({showAlertRetry:true});
                this.setState({isSendingComment:false});
            });                
        }
    }
    render() {
        const { goBack } = this.props.navigation;
        return ( 
            <SafeAreaView style={styles.wrapper}>
                <KeyboardAwareScrollView extraHeight={100}>
                        <View style={ [styles.card, {marginTop:20, marginBottom: 20,}]} >
                            <Card >
                                { this.state.userIsPro ? 
                                    <View style={{ alignItems: 'flex-end', paddingTop:15, paddingBottom:0, paddingRight:20, }}>
                                        <TouchableOpacity  onPress={() => { this.showOptionsComponent(); }} style={{padding:5,}}>
                                            <Image source={require('../../resources/global/icon-dots.png')} style={{ width: 27, height:5, resizeMode:'contain'}}/>
                                        </TouchableOpacity>
                                    </View>
                                    : 
                                        null
                                }
                                <CardItem >
                                    <Left>
                                        {  this.state.thread.imageUrl != undefined ?
                                            this.getimageUrl(this.state.thread) : null
                                        }
                                        <Body>
                                            <View style={ {flexDirection:'row'}}>
                                                <Text style={styles.userName}>{[this.state.thread.firstName, ' ', this.state.thread.lastName ]}</Text>
                                                {   this.state.thread.sticky ?
                                                    <Image source={require('../../resources/global/icon-star.png')} style={{ width: 18, height: 18, resizeMode: 'contain', marginLeft: 10, }}/>
                                                    :
                                                    null
                                                }
                                            </View>
                                            { this.state.thread.readableDate != null ?
                                                <Text style={styles.publishDate}>{ this.state.thread.readableDate  }
                                                    { this.state.thread.threadClose =='open' ? '' : ' - ' + strings.community.threadClose} 
                                                </Text>
                                                :
                                                <Text style={styles.publishDate}></Text>
                                            }
                                        </Body>                                
                                    </Left>
                                </CardItem>
                                <CardItem cardBody style={[styles.card, {marginTop: 5, marginBottom:10,}]}>
                                    <Text style={styles.message}>{this.state.thread.message}</Text>
                                </CardItem>
                                <CardItem cardBody style={styles.card}>                            
                                    { this.state.thread.image &&
                                        <ImageWithAuth                                     
                                            style={[ { height: 200, width: '100%', flex: 1, resizeMode: 'contain'}]} 
                                            source={{ uri: constants.base + this.state.thread.image.uri }} 
                                        />
                                    }                               
                                </CardItem>
                                { this.state.thread.tags != undefined && this.state.thread.tags.length > 0 &&
                                <CardItem style={ [ styles.card, {paddingLeft:0} ] }>
                                    <Left style={{alignItems: 'baseline', paddingTop: 5}}>
                                        <Text style={styles.tagsLabel}>{strings.community.tags}</Text>
                                        <View style={{ flexDirection:'row', flexWrap: 'wrap'}}> 
                                            {   this.state.thread.tags &&
                                                this.getTags(this.state.thread.tags) 
                                            } 
                                        </View>                             
                                    </Left>                           
                                </CardItem> 
                                }
                                <CardItem style={{marginTop:10, borderBottomColor: '#979797', borderBottomWidth: 2, borderTopColor: "#D2D3D2", borderTopWidth: 1}}>
                                    <Row style={{margin: -12, padding: 0}}>
                                        <Col style={{borderRightColor: "#D2D3D2", borderRightWidth: 1, flexDirection:'row', paddingVertical: 15, justifyContent:'center'}}>
                                            <TouchableOpacity onPress={() => this.actionLike() } style={{opacity: this.state.isProcessingLike ? 0.5 : 1}} disabled={this.state.isProcessingLike}>
                                                <View style={{ flexDirection:'row',}}>
                                                {   this.state.thread.like ?                                        
                                                    <Image source={require('../../resources/community/icon-heart.png') } style={{height:25, width:25, resizeMode:'contain'}}/>
                                                    :                                         
                                                    <Image source={require('../../resources/community/icon-heart-gray.png') } style={{height:25, width:25, resizeMode:'contain'}}/>
                                                }    
                                                
                                                <Text style={styles.counter}>{this.state.thread.likes}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </Col>
                                        <Col style={{flexDirection:'row', paddingVertical: 15, justifyContent:'center'}}>                                        
                                            <View style={{ flexDirection:'row',}}>
                                                <Image source={require('../../resources/community/icon-msg.png') } style={{height:25, width:25, resizeMode:'contain'}}/>
                                                <Text style={styles.counter}>{this.state.replays.length}</Text>
                                            </View>
                                        </Col>
                                    </Row>
                                </CardItem>
                                { this.state.replays.length > 0 &&                                
                                <CardItem style={styles.card} >
                                    <FlatList 
                                        extraData={this.state}
                                        data={this.state.replays}
                                        styles= {styles.container}
                                        numColumns= {numColumns}
                                        keyExtractor={(item, index) => item.id+''}                        
                                        renderItem= { this.renderItem }
                                    />                                    
                                </CardItem>
                                }
                                { this.state.thread.threadClose == 'open' ?
                                    <CardItem >
                                        <Item style={{ }}>
                                            <Textarea rowSpan={3} placeholder={strings.communityThread.newComment} 
                                                style={[styles.message, { width:'85%', fontSize:12 }]}
                                                ref="newComment"
                                                ref={component => this._newComment = component}
                                                value={this.state.newComment} 
                                                onChangeText={ (text) => this.setState({ newComment: text }) }
                                            />
                                            <TouchableOpacity onPress={ () => this.addComment() } style={{opacity: this.state.isSendingComment ? 0.5 : 1}} disabled={this.state.isSendingComment}>
                                                <View style={{backgroundColor:'#2CA06C', width:32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center'}}>
                                                    <Icon name="ios-arrow-round-forward" style={{ fontWeight:'bold', color:'white', fontSize:25, width: 13, paddingRight:-5, height:25, alignSelf:'center'}}/>
                                                </View>
                                            </TouchableOpacity>
                                        </Item>
                                    </CardItem> 
                                : null
                                }
                            </Card>                             
                        </View>                    
                    </KeyboardAwareScrollView>
                { this.bottomSheetOptions() }
                { /* Success alert */}
                <AwesomeAlertPlus
                    show={ this.state.showSuccessAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    onConfirmPressed={ () => { 
                        this.setState({showSuccessAlert:false});
                    }}
                    onDismiss={ () => { this.setState({showSuccessAlert:false})}}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-check.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={globalStyles.alertText}> { this.state.alertSuccessText }  </Text>
                                    </View> 
                                    }
                />   
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
                { this.state.isLoading &&
                    <Loader></Loader>
                } 
                <GamificationAlert 
                    close = {false}
                    backFunc = { this.state.backFunc }
                    generalText = { this.state.gamificationAlertGeneralText }
                    eventResponseVM ={ this.state.eventResponseVM } />     
            </SafeAreaView>
        )  
    }
}

const styles = StyleSheet.create({  
    container: {
        flex:1,
    },  
    tagsLabel:{
        color: "#737373",
        fontWeight: '500',
        fontSize: 10,        
    },
    tagsText:{
        color: "#9B9B9B",
        fontWeight: '500',
        fontSize: 10,        
    },
    tagContainer:{
        backgroundColor: "#EDEDED",
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginHorizontal: 5,
    },
    block: {
        backgroundColor:'#fff',
    },
    blockCloseButton: {
        marginTop:10,
        alignSelf:'flex-end',
        marginHorizontal:20,
        width: 20,
        height: 20
    },
    blockIcon:{
        fontSize:19, 
        color:"#999"
    }, 
    wrapper: {
        flex: 1,
        backgroundColor: '#f6f6f9',
    },
    card:{
        marginHorizontal: 20,
    },
    userName:{
        color: '#2CA06C', 
        fontSize: 12,
        fontWeight: '700',
    },
    publishDate:{
        color: '#5b5b5b',
        fontSize: 10,
        fontWeight: '400',
    },
    message:{
        color: "#4a4a4a",
        fontWeight: '300',
        fontSize: 13,
        lineHeight:20
    },
    counter:{
        color: "#757575",
        fontWeight: '500',
        fontSize: 12,
        marginLeft: 10,
        paddingTop: 3,
    },
    next: {
        fontWeight:'bold',
        color: 'white',
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
    userPictureBorder: {
        borderColor:'#f7f7f7',
        borderWidth: 1
      },
    imageProfile: {
        width:50,
        borderRadius: 50 / 2,
        height: 50,
    },
});
 
const mapStateToProps = (state) => {
    return {
        param: state.param,
        idToken: state.user.id_token,
        user: state.user,
        loggedInStatus: state.loggedInStatus
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}


export default connect(mapStateToProps, mapDispatchToProps)(CommunityThread);