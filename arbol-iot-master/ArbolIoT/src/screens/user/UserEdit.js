import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import AppConstants from '../../config/constants';
import { Autocomplete } from "react-native-dropdown-autocomplete";
import colors from '../../styles/colors';
import {
    StyleSheet,
    Text,
    SafeAreaView,
    ImageBackground,
    Image,
    TouchableOpacity,
    View,
    Platform
} from 'react-native';
import Loader from '../../components/loader/Loader';
import { Item, Input, Label, Button, CheckBox, Icon } from 'native-base';
import validationMessages from '../../config/validationMessages';
import CustomValidationComponent from '../../helpers/CustomValidationComponent';
import strings from '../../config/languages';
import ImagePicker from 'react-native-image-picker';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import UserService from '../../services/user';
import MinIoService from '../../services/minio';
import _ from 'lodash';
import ImageWithAuth from '../../components/image';
import globalStyles from '../../styles/global';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import ImageResizer from 'react-native-image-resizer';
import RNFetchBlob from 'rn-fetch-blob';
import Orientation from 'react-native-orientation';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

class UserEdit extends CustomValidationComponent {
    static navigationOptions = ({ navigation}) => ({
        title: strings.editProfile.title,
        headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
            <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
        </TouchableOpacity>,        
        headerRight: (<View />),
        headerTintColor: colors.white,
        headerStyle: globalStyles.headerStyle,
        headerTitleStyle: globalStyles.headerTitleStyle,
    });    
    validationsFull = {
        mail: { email: true, required: true },
        newPassword: { required: true },
        repeatNewPassword: { required: true },
        firstName: { required: true },        
        lastName: { required: true },
        address: { required: true },
    }
    validationsSimple = {
        mail: { email: true, required: true },
        firstName: { required: true },
        lastName: { required: true },
        address: { required: true },
    }
    messages = validationMessages;
    deviceLocale = this.props.lang != undefined ? this.props.lang : 'es';
    constructor(props) {
        super(props)
        this.state = {
            showErrorAlert: false,
            alertErrorText: '',
            showAlertRetry: false,
            showSuccessAlert: false,
            alertSuccessText: '',
            imageUrl: null,
            minIoObject: {},
            isHostedImage: false,
            formValid: true,
            mail: this.props.user.user.email,
            lastPassword: '',
            newPassword:'',
            repeatNewPassword:'',
            userName: this.props.user.user.login,
            firstName: this.props.user.user.firstName,
            lastName: this.props.user.user.lastName,
            address: '',
            boundary: [],
            organization: this.props.user.organization,
            changePass: false,
            errorNewPass: false,
            isLoading: false,
            loadingImage: false,
            gamificactionProfile: [],
            showAlert: false,
            alert: { show: false, confirmText: strings.acceptLabel,  view: <View/>, onConfirmPressed: () => { this.hideAlert(); }, 
                onCancelPressed: null, closeOnHardwareBackPress: null, 
                closeOnTouchOutside: null, showConfirmButton: true},
        }
        var user = this.props.user.user;
        if (_.has(user,'imageUrl') && user.imageUrl != null && user.imageUrl.length > 0 ) {
            if (user.imageUrl.startsWith('http') || user.imageUrl.startsWith('https')) {
                this.state.imageUrl = user.imageUrl;
            } else {
                this.state.imageUrl = AppConstants.base + user.imageUrl;
                this.state.isHostedImage = true;
            }
        }
        this.rules.email = (status,value) => {
            let reg = /\S+@\S+/ ;
            if(reg.test(value) === false) {
                return false;
            }
            else {
                return true;
            }
        }
    }
    componentDidMount(){
        Orientation.lockToPortrait();
        if (this.props.user.boundary != null){
            this.setState({ 
                address: this.props.user.boundary.name.toLowerCase(),
                boundary: this.props.user.boundary,
            });
            this._address.state.inputValue = this.capitalize(this.props.user.boundary.name);
        } 
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
                        MinIoService.uploadFile('profile',fileName, data, fileType, relatedId).then((resp) => {
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
                                if (_.has(res,'uri') && res.uri.length > 0 ) {
                                    this.state.imageUrl = AppConstants.base + res.uri + '?' + GeneralHelpers.getUUID();
                                    this.state.isHostedImage = true;
                                }
                                this.setState({minIoObject:res, image: 1, isLoading:false});
                            } 
                            this.setState({isLoading:false});
                            setTimeout(()=>{
                                this._onPressButton();
                            },1000);
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
    capitalize = (s) => {
        s = s.toLowerCase();
        if (typeof s !== 'string') return ''
        return s.charAt(0).toUpperCase() + s.slice(1)
    }
    _onCheckBoxPress = () => { 
        this.setState ({changePass: !this.state.changePass });
    }
    _onPressButton = () => {       
       var invalidPass = false;
        if(this.state.changePass){
            var valid = this.validate(this.validationsFull);
            
            if(valid) {
                if(this.state.newPassword != this.state.repeatNewPassword){                    
                    invalidPass = true;
                    this.setState({
                        errorNewPass: true
                    })
                } else {
                    invalidPass = false;
                    this.setState({
                        errorNewPass: false
                    })
                }                
            }
        } else {
            var valid = this.validate(this.validationsSimple);    
        }
        this.setState( {formValid:valid });
        if (valid && !invalidPass) {
            this._saveEntity();
        } else {
            this.refs._scrollView.scrollToPosition(0,0);
        }
    }
    _saveEntity(){
        this.setState({isLoading:true});
        let userProfileEntity = {
            boundary: this.state.boundary,
            firstName: this.state.firstName,
            lastName: this.state.lastName,
            mail: this.state.mail,
            organization: this.state.organization,
        }        
        if(this.state.minIoObject.bucketName){
            userProfileEntity['profileImage'] = this.state.minIoObject;
        }
        if(this.state.changePass){
            userProfileEntity['password'] = this.state.newPassword;
            userProfileEntity['currentPassword'] = this.state.lastPassword;
        }
        UserService.putProfileInfo(
            userProfileEntity
        )            
        .then((res) => res.json())
        .then(res  => {
            if(res.id){
                this.setState({
                    showSuccessAlert:true,
                    alertSuccessText: strings.editProfile.confirmationSave
                })
                UserService.getProfile()
                .then((res) => res.json())
                .then(res  => { 
                    var user = res;
                    user.id_token = this.props.idToken;
                    this.props.updateLocalUser(user);
                });
            } else {
                this.setState({showAlertRetry:true});
            }
            this.setState({isLoading:false});
        }).catch((e) => {
            this.setState({showAlertRetry:true});
            this.setState({isLoading:false});
        });
    }
    handleSelectItem(item, index) {
        this.setState({
            address: item,
            boundary: item,
        });
    }
    exitAlert = () => {
        this.setState({showAlertRetry:false});
        this.props.navigation.goBack();
    }
    retryAlert =() => {
        this.setState({showAlertRetry:false});
        this._saveEntity()
    }
    userPhoto = () => ( <View style={{ marginTop:20}}>
            { (this.state.imageUrl && this.state.imageUrl != null) ?
                (this.state.isHostedImage) ?
                        <ImageWithAuth  
                            style={styles.circle}
                            imageStyle= {styles.imgRadius }
                            source={{  uri: this.state.imageUrl }} >
                            <Image source={require('../../resources/global/icon-photo-add-v2.png')} style={ styles.addphoto} />
                        </ImageWithAuth >
                :
                <ImageBackground  style={styles.circle} imageStyle= {styles.imgRadius }
                source={{ uri: this.state.imageUrl }} >            
                    <Image source={require('../../resources/global/icon-photo-add-v2.png')} style={ styles.addphoto} />
                </ImageBackground >
            : <Image source={require('../../resources/global/icon-photo-add-v2.png')} style={ styles.addphoto} /> }
            </View>)
    render() {
        const { goBack } = this.props.navigation;
        return (
            <SafeAreaView>
                <KeyboardAwareScrollView ref='_scrollView' extraHeight={100}> 
                    <View>                        
                        <View style={styles.picture}>
                            <TouchableOpacity onPress={ () => { this.selectPhoto() }}>                                
                                { this.userPhoto() }                            
                            </TouchableOpacity>                            
                        </View>
                        <View style={styles.content}>
                            <TouchableOpacity onPress={ () => { this.selectPhoto() }}>
                                <Text style={[styles.greenText, {marginTop:10}]}> {strings.editProfile.changePhoto} </Text>
                            </TouchableOpacity>
                            <View style={ styles.formStyle}>
                                    <Item stackedLabel style={styles.item}>
                                        <Label style={styles.stackedLabel}>{ strings.register.firstName}</Label>
                                        <Input
                                                ref="firstName"
                                                ref={component => this._firstName = component}
                                                value= {this.state.firstName}
                                                style={ styles.input } 
                                                onChangeText={ (text) => this.setState({ firstName: text }) }/>
                                    </Item>
                                    { this.isFieldInError('firstName') && this.getErrorsInField('firstName').map((errorMessage, i) => {
                                            return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                        })}

                                    <Item stackedLabel style={styles.item}>
                                        <Label style={styles.stackedLabel}>{ strings.register.lastName}</Label>
                                        <Input
                                                ref="lastName"
                                                ref={component => this._lastName = component}
                                                value= {this.state.lastName}
                                                style={ styles.input } 
                                                onChangeText={ (text) => this.setState({ lastName: text }) }/>
                                    </Item>
                                    { this.isFieldInError('lastName') && this.getErrorsInField('lastName').map((errorMessage, i) => {
                                            return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                        })}
                                        
                                    <Label style={styles.stackedLabel}>{strings.register.address}</Label>    
                                    <Item style={[styles.autocomplete]} >                                                                    
                                        <Autocomplete
                                            ref="address"
                                            noDataText={ strings.emptyList }      
                                            noDataTextStyle={{ fontSize:11, padding:10}}  
                                            listItemTextStyle={{fontSize:11}}
                                            ref={component => this._address = component}
                                            fetchDataUrl={AppConstants.api.boundary}   
                                            style={styles.autocompleteInput}
                                            inputStyle={[ { borderWidth:  0, paddingLeft: 0, paddingTop: 0, width:'100%',}, styles.input ]} 
                                            placeholder={ strings.search } 
                                            placeholderColor = {'#565656'}
                                            scrollToInput={ev => {}}
                                            handleSelectItem={(item, id) => this.handleSelectItem(item, id)}
                                            renderIcon={() => ( null )}
                                            onDropdownShow={() => ( null )}
                                            onDropdownClose={() => ( null  )}
                                            minimumCharactersCount={1}
                                            valueExtractor={item => item.name}
                                            
                                            />
                                    </Item>
                                    { this.isFieldInError('address') && this.getErrorsInField('address').map((errorMessage, i) => {
                                            return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                        })}

                                    <Item stackedLabel style={styles.item}>
                                        <Label style={styles.stackedLabel}>{ strings.register.organization}</Label>
                                        <Input 
                                                ref="organization"
                                                ref={component => this._organization = component}
                                                value= {this.state.organization}
                                                style={ styles.input } 
                                                onChangeText={ (text) => this.setState({ organization: text }) }/>
                                    </Item>
                                    
                                
                                    <Item stackedLabel style={styles.item}>
                                        <Label style={styles.stackedLabel}>{ strings.register.email}</Label>
                                        <Input 
                                                ref="mail"
                                                ref={component => this._mail = component}
                                                style={ styles.input } value={this.state.mail} 
                                                onChangeText={ (text) =>  {this.setState({ mail: text }) }}/>
                                    </Item>
                                    { this.isFieldInError('mail') && this.getErrorsInField('mail').map((errorMessage, i) => {
                                            return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                        })}

                                    <Item style={styles.checkBoxItem}>
                                        <TouchableOpacity onPress={this._onCheckBoxPress} style={[{ width:'100%',flexDirection:'row'}]}>
                                            <CheckBox checked ={this.state.changePass} style={[styles.checkBox]} color='#2CA06C'
                                                onPress={this._onCheckBoxPress} />
                                                <Text style={[styles.checkBoxText]}> {strings.editProfile.changePass} </Text>
                                        </TouchableOpacity>
                                    </Item>
                                    { this.state.changePass ? 
                                        <Item stackedLabel style={styles.item}>
                                            <Label style={styles.stackedLabel}>{ strings.register.newPassword}</Label>
                                            <Input 
                                                    ref="newPassword"
                                                    ref={component => this._newPassword = component} 
                                                    secureTextEntry={true} style={ styles.input } 
                                                    onChangeText={ (text) => this.setState({ newPassword: text })}/>
                                        </Item>: null }
                                        {  this.state.changePass && this.isFieldInError('newPassword') && this.getErrorsInField('newPassword').map((errorMessage, i) => {
                                                return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                            })}
                                    { this.state.changePass ? 
                                        <Item stackedLabel last style={styles.item}>
                                            <Label style={styles.stackedLabel}>{ strings.register.repeatNewPassword}</Label>
                                            <Input 
                                                    ref="repeatNewPassword"
                                                    ref={component => this._repeatNewPassword = component}
                                                    secureTextEntry={true} style={ styles.input } 
                                                    onChangeText={ (text) => this.setState({ repeatNewPassword: text }) }/>
                                        </Item> : null }
                                        {  this.state.changePass && this.isFieldInError('repeatNewPassword') && this.getErrorsInField('repeatNewPassword').map((errorMessage, i) => {
                                                return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                            })}
                                        
                                        { this.state.errorNewPass ?
                                            <Text style={ styles.error }> {strings.editProfile.errorNewPass} </Text> 
                                            :
                                            null
                                        }
                                                                                                                                
                                <Text style={{marginTop: 20, marginBottom: 15, color:'#828382', fontSize:12}}>{strings.register.required}</Text>
                                <View style={styles.buttonContainer}>
                                    <Button block success style={ styles.registerButton } onPress={this._onPressButton}>
                                        <Text style= { styles.register }>{ strings.register.save }</Text>
                                    </Button>
                                    <Button block transparent style={[ styles.button ]} onPress={() => goBack() }>
                                        <Text style= {{ color:'grey' }}>{ strings.register.cancel }</Text>
                                    </Button>
                                </View>
                            </View>
                        </View>
                    </View>
                </KeyboardAwareScrollView>  
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
                                                <Text style={styles.next}> {strings.retry}</Text>
                                            </Button>
                                            <Button style={styles.exitButton} onPress={ () => { this.exitAlert()} } >
                                                <Text style={styles.next}> {strings.exit}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                }
                />    
                { /* Success alert */}
                <AwesomeAlertPlus
                    show={ this.state.showSuccessAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    onConfirmPressed={ () => { 
                        this.setState({showSuccessAlert:false});
                    }}
                    onDismiss={ () => { 
                        this.setState({showSuccessAlert:false});
                    }}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-check.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={globalStyles.alertText}> { this.state.alertSuccessText }  </Text>
                                    </View> 
                                    }
                />   
                { this.state.isLoading && <Loader></Loader> }   
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    picture: {
        alignItems: 'center',
        marginTop: 20,
        borderRadius: 100,
    },  
    circle: {
        height: 100,
        width: 100,
        borderRadius: 100/2,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor:'#f7f7f7',
        borderWidth:1
    },
    imgRadius: {
        height: 100,
        width: 100,
        borderRadius: 100/2,
    },
    addphoto:{
        height: 25,
        resizeMode: 'contain',                
    },
    content: {
        marginTop: 12,
        marginLeft: 30,
        marginRight: 30,
    },    
    greenText: {
        color: '#2CA06C',
        fontSize: 12,
        fontWeight: '400',
        alignSelf: 'center',
    },
    formStyle: {
      marginTop: 30,
    },
    stackedLabel: {
        color: '#828382',
        fontSize: 12,
        fontWeight: '400',
        marginBottom:5
    },
    item: {
        marginBottom: 20,
        borderBottomColor: '#B5B6B4',
        borderBottomWidth: 1,
        paddingBottom:5
    },
    input: { 
        color: '#737373', 
        fontSize: 14,
        padding: 0,
        margin: 0,
        height: 30,
        lineHeight: 20,
    },
    checkBoxItem: {
        borderBottomWidth: 0,
        marginBottom: 15,
        marginTop: 10,    
    },
    checkBox: {
        left: 0,
        borderColor: '#B5B6B4',
        marginRight: 10,
    },
    checkBoxText: {
        color: '#737373', 
        fontSize: 14,
    },
    autocomplete: {
        color: '#737373', 
        fontSize: 14,
        height: 38,
        lineHeight: 20,
        borderColor: '#B5B6B4',
        borderBottomWidth: 1,
        paddingBottom:10,
        marginBottom: 15,
    },
    error: {
        color: "#EA585E",
        fontSize: 12,
        paddingTop:0,
        paddingLeft:5,
        paddingBottom:20  
    },
    buttonContainer: {
        marginLeft: 60,
        marginRight: 60,
        marginTop: 10,
        marginBottom: 20,  
    },
    button: {
        fontWeight:'bold',
        color: 'white',
        borderRadius: 5,
        marginTop: 5,
    },
    registerButton: {
        backgroundColor:'#41B07C', 
        borderRadius: 5,
    },
    register: {
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
        loggedInStatus: state.loggedInStatus
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(UserEdit);