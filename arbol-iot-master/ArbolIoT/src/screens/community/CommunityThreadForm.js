import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import {
    StyleSheet,
    Text,
    SafeAreaView,
    Image,
    TouchableOpacity,
    View,
    FlatList,
    Platform
} from 'react-native';
import { Button, Left, Body, Form, Textarea, Card, CardItem, Icon} from 'native-base';
import strings from '../../config/languages';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import CommunityService from '../../services/community';
import MinIoService from '../../services/minio';
import Loader from '../../components/loader/Loader';
import constants from '../../config/constants';
import GamificationAlert from '../../components/awesome-alert/GamificationAlert';
import ImageWithAuth from '../../components/image';
import globalStyles from '../../styles/global';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import ImagePicker from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import RNFetchBlob from 'rn-fetch-blob';
import Orientation from 'react-native-orientation';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

const numColumns = 3;
const formatData = (data, numColumns) => {
    const numberOfFullRows = Math.floor(data.length / numColumns);
    let numberOfElementsLastRow = data.length - (numberOfFullRows * numColumns);
    while (numberOfElementsLastRow !== numColumns && numberOfElementsLastRow !== 0) {
      data.push({ key: `blank-${numberOfElementsLastRow}`, empty: true });
      numberOfElementsLastRow++;
    }
    return data;
};
class CommunityThreadForm extends Component { 
    static navigationOptions = ({navigation}) => {
        const {params = {}} = navigation.state;
        return {
            title: strings.communityThreadForm.title,
            headerLeft: <TouchableOpacity style={globalStyles.headerLeft} 
                        onPress={ () => { 
                            if (params.customBack !== undefined) {
                                params.customBack();
                            }
                        }}>
                <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
            </TouchableOpacity>,        
            headerRight: (<View />),
            headerTintColor: colors.white,
            headerStyle: globalStyles.headerStyle,
            headerTitleStyle: globalStyles.headerTitleStyle,
        }
    }; 
    validations = {
        message: { required: true },        
    }
    deviceLocale = this.props.lang != undefined ? this.props.lang : 'es';
    constructor(props) {
        super(props)
        this.state = {       
            backFunc: () => {},
            showAlertCancel: false,
            showSuccessAlert: false,
            alertSuccessText: '',
            showAlertRetry: false,    
            showErrorAlert: false,
            alertErrorText: '',
            eventResponseVM: {},     
            gamificationAlertGeneralText:'',
            userPhoto: this.props.user.user.imageUrl,
            firstName: this.props.user.user.firstName,
            lastName: this.props.user.user.lastName,
            levelName: '',
            message: "",
            photo: null,
            tags: [],
            noTag: false,
            noMessage: false,
            tagsData: [],
            isLoading: false,
            alert: { show: false, confirmText: "Aceptar",  view: <View/>, onConfirmPressed: () => { this.hideAlert(); }, onCancelPressed: null, closeOnHardwareBackPress: null, 
                closeOnTouchOutside: null, showConfirmButton: true},
        }          
    }
    componentDidMount() {
        Orientation.lockToPortrait();
        this.props.navigation.setParams({
            customBack: this.customBack.bind(this), 
        });
        if(this.props.user.currentLevel){
            this.setState({
                levelName: this.props.user.currentLevel.name
            });
        }
        this._getTags();
    }
    _getTags(){
        this.setState({isLoading:true});
        CommunityService.getAllCommunityTags()
        .then((res) => res.json())
        .then(res  => { 
            if (res.length > 0 ) {                
                var result = res;
                setTimeout(function(){                 
                    this.setState({
                        tagsData: result,
                        isLoading: false
                    })               
                }.bind(this), 500);
            } else { 
                this.setState({isLoading:false});
            } 
        }).catch((e) => {
            this.setState({isLoading:false});
        });
    }
    customBack(){
        this.setState({showAlertCancel:true});
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
        this.props.navigation.goBack();
    };
    retryAlert =() => {
        this._saveEntity()
    }
    selectPhoto(){
        this.setState({isLoading:true});
        const options = {
            title: strings.imagepicker.changePhoto,
            cancelButtonTitle: strings.imagepicker.cancelPhoto,
            takePhotoButtonTitle: strings.imagepicker.camera,
            chooseFromLibraryButtonTitle: strings.imagepicker.library,
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };
        ImagePicker.showImagePicker(options, (response) => {          
            if (response.didCancel) {
                this.setState({isLoading:false});
            } else if (response.error) {
                this.setState({isLoading:false});
            } else {
                ImageResizer.createResizedImage(response.uri, 1000, 700, 'JPEG', 80)
                .then(({ uri }) => {
                    let filePath = uri;
                    let fileName = GeneralHelpers.getUUID() + ".jpg";
                    let fileType = "image/jpeg";
                    if (Platform.OS === 'ios') {
                        let arr = uri.split('/')
                        const dirs = RNFetchBlob.fs.dirs
                        filePath = `${dirs.CacheDir}/${arr[arr.length - 1]}`
                    } 
                    RNFetchBlob.fs.readFile(filePath, 'base64')
                    .then((data) => {
                        var relatedId = null;
                        MinIoService.uploadFile('community',fileName, data, fileType, relatedId).then((resp) => {
                            if (resp.data != null ) {
                                var res = JSON.parse(resp.data);
                                if (res.message != undefined) {
                                    this.setState({ 
                                        isLoading:false, 
                                        alertErrorText: strings.imagePicker.error,
                                        showErrorAlert:true});                            
                                    return;
                                }                        
                                this.setState({ 
                                    isLoading:false, 
                                    showSuccessAlert:true,
                                    alertSuccessText: strings.imagePicker.uploadGeneral });
                                this.setState({photo:res, image: 1,});
                            } 
                            this.setState({isLoading:false});
                        }).catch((err) => {
                            this.setState({ 
                                isLoading:false, 
                                alertErrorText: strings.imagePicker.error,
                                showErrorAlert:true});  
                            this.setState({isLoading:false});
                        });
                    });
                })
                .catch(err => {
                    this.setState({isLoading:false});
                });
            }
        });
    }
    _saveEntity(){
        var communityEntity = {
            body: this.state.message,
            image: this.state.photo,
            status: 'open',
            sticky: false,
            tags: this.state.tags,
        }
        this.setState({isLoading:true});
        CommunityService.postPublication(
            communityEntity
        )
        .then((res)=> res.json())
        .then(res => {
            if(res.status == 200 || res.status == 201){
                var eventResponseVM = res;
                if(eventResponseVM.points > 0) {
                    setTimeout(() => {
                        this.setState({ 
                            close: true,
                            backFunc: () => { this.props.navigation.goBack() },
                            gamificationAlertGeneralText: strings.communityThreadForm.alerts.pointsMsg,
                            eventResponseVM:eventResponseVM});
                    },100)
                }
            } else {
                this.setState({showAlertRetry:true});
                this.setState({isLoading:false});
            }
        }).catch((e) => {
            this.setState({showAlertRetry:true});
            this.setState({isLoading:false});
        });
    }
    _onPressButton = () => {
        this.refs._scrollView.scrollToPosition(0,0);
        let noMessage = false;
        let noTag = false;
        if( this.state.message == ""){
            noMessage = true;
            this.setState({
                noMessage: true,
            })
        } else{
            noMessage = false;
            this.setState({
                noMessage: false,
            })
        }
        if( this.state.tags && this.state.tags.length <= 0 ){
            noTag = true;
            this.setState({
                noTag: true,
            })
        } else{
            noTag = false;
            this.setState({
                noTag: false,
            })
        }
        if(!noTag && !noMessage){
            this._saveEntity();
            this.setState({
                publishDate: new Date()
            })
        }
    }
    selectTag(item, index){
        let tagSelected = [];
        let exist = this.state.tags.findIndex(element => element.tag === item.tag);
        tagSelected = this.state.tags;
        if( exist == -1){                
            tagSelected.push(item); 
        } else {
            tagSelected.splice(exist,1);
        }
        this.setState({
            tags: tagSelected
        });       
    }
    renderItem = ({ item, index }) => {
        let isSelected = false;
        if(this.state.tags && this.state.tags.length > 0){
            var result = this.state.tags.find( element => element.tag === item.tag );
            if(result != undefined){
                isSelected = true;
            } else {
                isSelected = false;
            }            
        }
        if (item.empty === true) {
            return <View key={item.id} style={[styles.item, styles.itemInvisible]} />;
        }   
        return (            
                <View key={item.id} style={ isSelected ? 
                    [styles.tagSelectContainer, styles.item]
                    :
                    [styles.tagContainerUnselect, styles.item]
                    }>      
                    <TouchableOpacity onPress={() => this.selectTag(item, index)} style={{width:'100%'}}>  
                        <Text style={ isSelected ? 
                            styles.tagSelected
                            :
                            styles.tagUnselected
                            }>
                            {item.tag}
                        </Text>
                    </TouchableOpacity>
                </View>
        );
    };
    getUserPhoto(){
        if(this.state.userPhoto == undefined || this.state.userPhoto == null) {
            return <Image source={require('../../resources/global/default-user-img.png')} style={ [ styles.userPictureBorder, styles.imageProfile ]} />
        } 
        else {
            if(this.state.userPhoto != undefined && this.state.userPhoto.length > 0 && this.state.userPhoto.startsWith('http')){
                return <ImageWithAuth style={ [ styles.userPictureBorder, styles.imageProfile ]}  source={{uri: this.state.userPhoto}}/>
            } else {
                return <ImageWithAuth style={ [ styles.userPictureBorder, styles.imageProfile ]} 
                            source={{ 
                                headers: { Pragma: 'no-cache',  'Authorization' : "Bearer " + this.props.idToken },
                                uri: constants.base + this.state.userPhoto }} 
                        />
            }
        }
    }
    render() {
        return ( 
            <SafeAreaView>
                <KeyboardAwareScrollView ref='_scrollView' extraHeight={100}>
                        <View style={styles.content}>
                            <Card style= {[styles.cardNoMargin]}>
                                <CardItem style={{ paddingLeft: 0, }}>
                                    <Left>
                                        { this.getUserPhoto() }
                                        <Body style={{marginLeft:15}}>
                                            <Text style={styles.userName}>{[this.state.firstName, " ",this.state.lastName]}</Text>
                                            <Text style={styles.level}>{[this.state.levelName]}</Text>
                                        </Body> 
                                    </Left>                              
                                </CardItem>
                            </Card>
                            <Form style={{ marginTop: 20,}}>
                                <Textarea rowSpan={4} style={[ styles.input, {
                                        borderColor:'#cfcecf', borderWidth: 1, lineHeight:14}]}
                                        ref="message"
                                        placeholderTextColor="#9b9b9b"
                                        ref={component => this._message = component}
                                        value={this.state.message} 
                                        onChangeText={ (text) => this.setState({ message: text }) }
                                        placeholder= {strings.communityThreadForm.postNew} 
                                />  
                                { this.state.noMessage ?
                                        <Text style={ styles.error }> {strings.communityThreadForm.validations.noMessage} </Text> 
                                        :
                                        null
                                }                       
                            </Form>
                            <View style={{marginTop:35, marginBottom:30,}}>
                                    { this.state.photo != null &&
                                        <View >
                                            <ImageWithAuth 
                                                resizeMode="cover" 
                                                style={{ width:'100%', height: 200, resizeMode:'contain', marginBottom: 15,}} 
                                                source={{  uri: constants.base + this.state.photo.uri }} 
                                            />
                                        </View>
                                }
                                <TouchableOpacity onPress={() => this.selectPhoto() } >
                                    <View style={{flexDirection:'row'}}>
                                        <Image source={require('../../resources/global/icon-photo-add-v2.png')} style={{width: 25, height: 25, resizeMode:'contain' }}/>
                                        <Text style={styles.addPhotoText} >{strings.communityThreadForm.addPhoto}</Text>
                                    </View>
                                </TouchableOpacity>
                                <View style={{height:1, backgroundColor:"#b5b6b4", marginTop:30,}} ></View>
                            </View>
                            <View style={{marginBottom:20,}}>
                                <View style={{flexDirection:'row'}}>
                                    <Image source={require('../../resources/global/icon-tag.png')} style={{width: 24, height: 19, resizeMode:'contain' }}/>
                                    <Text style={styles.tagsText} >{strings.communityThreadForm.tags}</Text>                                
                                </View>                            
                            </View>
                            <View style={{borderColor:'#cfcecf', borderWidth: 1, }}>
                                <View style={{ margin: 10, }}>
                                    <FlatList
                                        extraData={this.state}
                                        data={formatData(this.state.tagsData, numColumns)}
                                        keyExtractor={(item, index) => item.id+''}
                                        styles= {styles.container}
                                        numColumns= {numColumns}
                                        renderItem= {this.renderItem}
                                    />
                                </View>
                            </View>
                            { this.state.noTag ?
                                <Text style={ styles.error }> {strings.communityThreadForm.validations.noTag} </Text> 
                                :
                                null
                            }      
                        </View>

                        <View style={styles.content}>
                            <Text style={{marginTop: 15, fontSize:10, color:'#737373'}}> {strings.communityThreadForm.validations.mandatory} </Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <Button block success style={ styles.sharedButton } onPress={this._onPressButton}>
                                <Text style= { styles.shared }>{ strings.communityThreadForm.shared }</Text>
                            </Button>
                        </View>
                    </KeyboardAwareScrollView>
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
                { /* Alert cancel  */}
                <AwesomeAlertPlus
                    show={ this.state.showAlertCancel }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton={false}
                    customView = {  <View> 
                                        <View style={{marginHorizontal:'15%'}}>
                                            <Text style={ globalStyles.alertTitle }> {strings.communityThreadForm.alerts.cancel} </Text>
                                            <Text style={ globalStyles.alertText}> { strings.communityThreadForm.alerts.cancelMsg } </Text>
                                        </View>
                                        <View style={{flexDirection:'row',marginTop:10}}>
                                            <Button transparent style={[styles.cancelButton, { borderRight: 1, borderColor: '#AFADAD', borderRightWidth: 1}]}
                                                onPress={ () => this.setState({showAlertCancel:false})}>
                                                <Text style={styles.alertCancelButtonText}> {strings.communityThreadForm.alerts.cancelBtn}</Text>
                                            </Button>
                                            <Button transparent style={[styles.cancelButton]} onPress={ () => { this.exitAlert()} } >
                                                <Text style={styles.alertCancelButtonText}> {strings.communityThreadForm.alerts.cancelConfirm}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                }
                />    
                { /* Gamifiaction alert */}
                <GamificationAlert 
                    close = {true}
                    backFunc = { this.state.backFunc }
                    generalText = { this.state.gamificationAlertGeneralText }
                    eventResponseVM ={ this.state.eventResponseVM } />      
                { ( this.state.isLoading ) &&
                    <Loader></Loader>
                }  
            </SafeAreaView>
        )  
    }
}

const styles = StyleSheet.create({
    content:{
        marginHorizontal: 40,
    },
    cardNoMargin: {
        margin:0, 
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomWidth: 0,
        padding: 0,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomColor: 'transparent',
    },
    container: {
        flex:1,
        marginVertical: 20,
    },
    userName:{
        color: '#2CA06C', 
        fontSize: 16,
        fontWeight: '500',
    },
    level:{
        color: '#737373', 
        fontSize: 12,
        fontWeight: '400',
    },
    publishDate:{
        color: '#5b5b5b',
        fontSize: 10,
        fontWeight: '400',
    },
    input:{
        color: '#9b9b9b', 
        fontSize: 14, 
        fontWeight:'400',
    },
    addPhoto:{
        color: '#2CA06C', 
        fontSize: 14, 
        fontWeight:'400',
    },
    addPhotoText:{
        color:'#2cA06c',
        fontSize: 14,
        fontWeight: '400',
        paddingLeft: 15,
        top: 3,
    },
    item: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        margin: 5,
    },
    itemInvisible: {
        backgroundColor: 'transparent',
    },
    tagsText:{
        color:'#828382',
        fontSize: 14,
        fontWeight: '400',
        paddingLeft: 15,
    },
    tags:{
        color: '#828382', 
        fontSize: 14, 
        fontWeight:'400',
   },
    tagContainerUnselect:{
        backgroundColor: "#ededed", 
        borderColor: "#ededed",
        borderWidth: 2,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    tagSelectContainer:{
        backgroundColor: "#fff", 
        borderColor: "#2CA06C",
        borderWidth: 2,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    tagUnselected:{
        color: '#9b9b9b', 
        fontSize: 11, 
        fontWeight:'500',
        textAlign:'center',
    },
    tagSelected:{
        color: '#2ca06c', 
        fontSize: 11, 
        fontWeight:'500',
        textAlign:'center',
    },
    buttonContainer: {
        marginLeft: 60,
        marginRight: 60,
        marginBottom: 40,
        marginTop: 20,
    },
    sharedButton: {
        backgroundColor:'#41B17C', 
        borderRadius: 5,
    },
    shared: {
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
    alertCancelButtonText:{
        fontSize: 18,
        fontWeight: '400',
        textAlign: 'center',
        color: '#208D5C'
    },
    cancelButton:{
        width:'50%',
        justifyContent:'center',
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


export default connect(mapStateToProps, mapDispatchToProps)(CommunityThreadForm);