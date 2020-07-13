import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import Loader from '../../components/loader/Loader';
import AppConstants from '../../config/constants';
import {Autocomplete} from "react-native-dropdown-autocomplete";
import {
    Text,
    ImageBackground,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import { Button, View, Icon } from "native-base";
import { Item, Input } from 'native-base';
import strings from '../../config/languages';
import validationMessages from '../../config/validationMessages'
import CustomValidationComponent from '../../helpers/CustomValidationComponent'
import UserService from '../../services/user';
import { Toast } from "native-base";
import globalStyles from '../../styles/global';
import Orientation from 'react-native-orientation';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

class Register extends CustomValidationComponent {
    static navigationOptions = ({ navigation }) => ({
        title: strings.register.title,
        headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
            <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
        </TouchableOpacity>,        
        headerRight: (<View />),
        headerTintColor: colors.white,
        headerStyle: globalStyles.headerStyle,
        headerTitleStyle: globalStyles.headerTitleStyle,
    });
    validations = {
        mail: { email: true, required: true },
        password: { minlength: 3, required: true },
        repeatPassword: { minlength: 3, required: true, passwordConfirm: true },
        userName: { required: true, user: true, minlength: 3 },
        firstName: { required: true },
        lastName: { required: true },
        address: { boundary: true },
    }
    messages = validationMessages;
    deviceLocale = this.props.lang != undefined ? this.props.lang : 'es';
    constructor(props) {
        super(props)
        this.state = {
            formValid: true,
            mail: '',
            password:'',
            repeatPassword:'',
            userName:'',
            firstName:'',
            lastName:'',
            address:'',
            loadingVisible: false,
            boundaryId: null,
            boundary: null
        }
        this.rules.user = /^[_'.a-z0-9-]*$/;
        this.messages[this.props.lang != undefined ? this.props.lang : 'es']['user'] = strings.fieldsValidations.user;
        this.messages[this.props.lang != undefined ? this.props.lang : 'es']['passwordConfirm'] = strings.fieldsValidations.passwordConfirm;
        this.messages[this.props.lang != undefined ? this.props.lang : 'es']['boundary'] = strings.fieldsValidations.boundary;
        this.rules.email = (status,value) => {
            let reg = /\S+@\S+/ ;
            if(reg.test(value) === false) {
                return false;
            }
            else {
                return true;
            }
        }
        this.rules.boundary = (status,value) => {
            if (this.state.boundaryId == null)
                return false;
            return  !isNaN(this.state.boundaryId);
        }
        this.rules.passwordConfirm = (status,value) => {
            return this.state.password == this.state.repeatPassword;
        }
    }
    componentDidMount() {
        Orientation.lockToPortrait();
    }
    _onPressButton = () => {
        var valid = this.validate(this.validations);
        this.setState( {formValid:valid });  
        if (valid) {
            this.setState({loadingVisible:true});
            UserService.register({
                "boundaryId": this.state.boundaryId,
                "email": this.state.mail,
                "firstName": this.state.firstName,
                "lastName": this.state.lastName,
                "login": this.state.userName,
                "password": this.state.password
            })
            .then((res) => {
                if (res.status == 201) {
                    this.props.authenticate(this.state.userName,this.state.password);
                    return null;
                }
                return res.json();
            })
            .then(res => { 
                if (res != null && res.status == 400) {
                    if (res.errorKey == "emailexists" || res.errorKey == "userexists") {
                        Toast.show({ text: strings.register.uexist, buttonText: strings.ok, duration: 20000 });
                    } else {
                        Toast.show({ text: strings.general.error, buttonText: strings.ok, duration: 20000 });
                    }
                    this.setState({loadingVisible:false});
                } 
            });
        } else {
            this.refs._scrollView.scrollToPosition(0,0);
        }
    }
    handleSelectItem(item, index) {
        this.state.boundaryId = item.id;
        this.state.boundary = item;
    }
    render() {
        const { loadingVisible } = this.state;
        return (
            <ImageBackground source={require('../../resources/global/background-map-color.png')} style={ styles.imageBackground }>
                <KeyboardAwareScrollView ref='_scrollView' style={styles.scrollView} extraHeight={100}>
                    <SafeAreaView  style={ styles.wrapper }>
                        <View style={styles.scrollViewWrapper}>
                            <View style={styles.marginContainer}>
                                <View style={styles.paddingContainer}>
                                    <Item>
                                        <Input placeholder={ strings.register.userName } 
                                                ref="userName"
                                                placeholderTextColor="#737373"
                                                ref={component => this._userName = component}
                                                autoCapitalize={"none"}
                                                style={ styles.input } 
                                                onChangeText={ (text) => this.setState({ userName: text }) }/>
                                    </Item>

                                        { this.isFieldInError('userName') && this.getErrorsInField('userName').map((errorMessage, i) => {
                                            return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                        })}

                                    <Item>
                                        <Input placeholder={ strings.register.firstName } 
                                                ref="firstName"
                                                placeholderTextColor="#737373"
                                                ref={component => this._firstName = component}
                                                autoCapitalize={"none"}
                                                style={ styles.input } 
                                                onChangeText={ (text) => this.setState({ firstName: text }) }/>
                                    </Item>
                                        { this.isFieldInError('firstName') && this.getErrorsInField('firstName').map((errorMessage, i) => {
                                            return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                        })}
                                    <Item>
                                        <Input placeholder={ strings.register.lastName } 
                                                ref="lastName"
                                                placeholderTextColor="#737373"
                                                ref={component => this._lastName = component}
                                                autoCapitalize={"none"}
                                                style={ styles.input } 
                                                onChangeText={ (text) => this.setState({ lastName: text }) }/>
                                    </Item>
                                        { this.isFieldInError('lastName') && this.getErrorsInField('lastName').map((errorMessage, i) => {
                                            return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                        })}
                                    <Item >
                                        <Autocomplete
                                            ref="boundary"
                                            style={styles.autocompleteInput}
                                            noDataText={ strings.emptyList }      
                                            noDataTextStyle={{ fontSize:11, padding:10}}  
                                            listItemTextStyle={{fontSize:11}}     
                                            inputStyle={[ { borderWidth: 0 , paddingLeft:3, paddingTop: 0 } , styles.input]} 
                                            placeholder={ strings.register.address } 
                                            placeholderColor = {'#737373'}
                                            scrollToInput={ev => {}}
                                            inputStyle={{        
                                                borderWidth: 0 , 
                                                paddingLeft:3, 
                                                paddingTop:0, 
                                                color: 'gray', 
                                                fontSize: 14,
                                                lineHeight: 17,
                                                paddingBottom:0,
                                                height:40}}
                                            handleSelectItem={(item, id) => this.handleSelectItem(item, id)}
                                            renderIcon={() => (
                                                null
                                            )}
                                            onDropdownShow={() => (
                                                null
                                            )}
                                            onDropdownClose={() => {
                                                if (this.state.boundaryId > 0 && this.state.boundary != undefined && this.state.boundary.name != undefined){
                                                    this.refs.boundary.state.inputValue = this.state.boundary.name;
                                                }  
                                            }}
                                            minimumCharactersCount={1}
                                            autoCapitalize={"none"}
                                            fetchDataUrl={AppConstants.api.boundary}   
                                            valueExtractor={item => item.name}
                                            />
                                    </Item>
                                        { this.isFieldInError('address') && this.getErrorsInField('address').map((errorMessage, i) => {
                                            return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                        })}

                                    <Item>
                                        <Input  placeholder={ strings.register.email }
                                                ref="mail"
                                                placeholderTextColor="#737373"
                                                ref={component => this._mail = component}
                                                autoCapitalize={"none"}
                                                style={ styles.input } value={this.state.mail} 
                                                onChangeText={ (text) =>  {this.setState({ mail: text }) }}/>
                                    </Item>
                                        { this.isFieldInError('mail') && this.getErrorsInField('mail').map((errorMessage, i) => {
                                            return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                        })}

                                    <Item>
                                        <Input  placeholder={ strings.register.password }
                                                ref="password"
                                                placeholderTextColor="#737373"
                                                ref={component => this._password = component} 
                                                autoCapitalize={"none"}
                                                secureTextEntry={true} style={ styles.input } 
                                                onChangeText={ (text) => this.setState({ password: text })}/>
                                    </Item>
                                        { this.isFieldInError('password') && this.getErrorsInField('password').map((errorMessage, i) => {
                                            return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                        })}

                                    <Item>
                                        <Input  placeholder={ strings.register.repeatPassword } 
                                                ref="repeatPassword"
                                                placeholderTextColor="#737373"
                                                ref={component => this._repeatPassword = component}
                                                secureTextEntry={true} style={ styles.input } 
                                                autoCapitalize={"none"}
                                                onChangeText={ (text) => this.setState({ repeatPassword: text }) }/>
                                    </Item>

                                        { this.isFieldInError('repeatPassword') && this.getErrorsInField('repeatPassword').map((errorMessage, i) => {
                                            return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                        })}

                                    <Text style={{marginTop: 15, fontSize:11, padding:5, color:'#737373'}}>{strings.register.required}</Text>    
                                </View>
                                <View style={styles.buttonContainer}>
                                    <Button block success style={ styles.registerButton } onPress={this._onPressButton}>
                                        <Text style= { styles.register }>{ strings.register.register }</Text>
                                    </Button>
                                    <Button block transparent style={[ styles.button ]} onPress={() => this.props.navigation.navigate('LogIn')}>
                                        <Text style= {{ color:'#737373' }}>{ strings.forgotPassword.cancel }</Text>
                                    </Button>
                                </View>
                            </View>
                        </View>
                    </SafeAreaView>
                </KeyboardAwareScrollView>
                { this.state.loadingVisible && <Loader/> }
            </ImageBackground>
        )
    }
}

const styles = StyleSheet.create({
    autocompleteInput: {maxHeight: 40},
    imageBackground: {
        width: '100%', 
        height: '100%',
    },
    wrapper: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    registerButton: {
        backgroundColor:'#41B17C', 
        borderRadius: 5,
    },
    button: {
        fontWeight:'bold',
        color: 'white',
        borderRadius: 5,
        marginTop: 5,
    },
    register: {
        fontWeight:'bold',
        color: 'white',
    },
    error: {
        color: "#EA585E",
        fontSize: 12,
        paddingTop:10,
        paddingLeft:0,
        paddingBottom:10,
        marginLeft:5,
        lineHeight:25
    },
    input: { 
        color: 'gray', 
        fontSize: 14,
        lineHeight: 20
    },
    scrollViewWrapper: {
        marginTop: 10,
        flex: 1,
    },
    scrollView: {
        paddingLeft: 30,
        paddingRight: 30,
        paddingTop: 10,
        flex: 1,
    },
    marginContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 0,
        marginBottom: 30,
        marginTop: 20,
    },
    paddingContainer: {
        backgroundColor: 'transparent',
        marginTop: 20,
        marginRight: 20,
        marginLeft: 20,
        marginBottom: 10,
    },
    buttonContainer: {
        marginLeft: 60,
        marginRight: 60,
        marginTop: 10,
        marginBottom: 20,
    },

});
const mapStateToProps = (state) => {
    return {
        loggedInStatus: state.loggedInStatus
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Register);