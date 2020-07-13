import React, { Component } from 'react';
import { LOGIN } from '../../redux/ActionTypes';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import Loader from '../../components/loader/Loader';
import { store } from '../../navigators/AppNavigator';
import {
    Text,
    Image,
    ImageBackground,
    View,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TextInput,
    AsyncStorage,
    Keyboard
} from 'react-native';
import { Button,Toast } from "native-base";
import { Item } from 'native-base';
import strings from '../../config/languages';
import _ from 'lodash';
import { GoogleSignin, statusCodes } from 'react-native-google-signin';
import { LoginManager, AccessToken } from "react-native-fbsdk";
import UserService from '../../services/user';
import {StackActions, NavigationActions } from 'react-navigation';

class LogIn extends Component {
    static navigationOptions = ({  }) => ({
        headerTransparent: true,
        headerTintColor: colors.white,
    });
    constructor(props) {
        super(props)
        this.state = {
            socialLoading: false,
            formValid: true,
            emailAddress: '',
            password:'',
            isLoading: false,
            showErrors: false,
            log: '',
        }
        this.handleNextButton = this.handleNextButton.bind(this)
    }
    componentDidMount() {
        this.props.setMode(1);
        GoogleSignin.configure({
            webClientId: this.props.google.webClientId,
            iosClientId: this.props.google.iosClientId, 
            offlineAccess: true,
            forceConsentPrompt: false,
        });
    }
    componentWillUnmount() {
        this.socialLoading = false;
        this.isLoading = false;
    }
    handleError(err) {
        this.setState({socialLoading:false});
    }
    async handleSocialLogin(destination) {
        this.setState({socialLoading:true});
        if (destination == "facebook") {
            var e = this;
            LoginManager.logInWithPermissions(['public_profile', 'email']).then(
                function(result) {
                  if (result.isCancelled) {
                    e.setState({socialLoading:false});
                    e.handleError(null);
                  } else {
                    AccessToken.getCurrentAccessToken().then(
                        (data) => {
                            var token = data.accessToken;
                            e.props.socialAuth('facebook',token);
                        }
                    );
                  }
                },
                function(error) {
                    e.setState({socialLoading:false});
                    e.handleError(null);
                }
            ).catch((e) => {
                e.setState({socialLoading:false});
            })
        } else if (destination == "google") {
            try {
                await GoogleSignin.hasPlayServices();
                try {
                    await GoogleSignin.revokeAccess();
                } catch(error) {
                }
                const userInfo = await GoogleSignin.signIn();
                if (_.has(userInfo,"idToken") && userInfo.idToken.length > 0) {
                    let token = userInfo.serverAuthCode;
                    this.props.socialAuth('google',token);
                } else {
                    this.setState({socialLoading:false});
                    this.handleError(null);
                }
              } catch (error) {
                if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                    this.setState({socialLoading:false});
                    this.handleError(null);
                } else if (error.code === statusCodes.IN_PROGRESS) {
                } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                    this.setState({socialLoading:false});
                    this.handleError(null);
                } else {
                    this.setState({socialLoading:false});
                    this.handleError(null);
                }
            }
        } 
        var e = this;
        setTimeout(function(){ e.setState({socialLoading:false}); }, 10000);
    }
    handleNextButton() {
        this.setState({log:''});
        this.setState({ isLoading: true })
        const {emailAddress,password } = this.state;  
        UserService.authenticate(emailAddress.toLowerCase(), password)
        .then((res) => res.json())
        .then(token => {
            if (token.id_token) {
                user = {};
                user.id_token = token.id_token;
                store.dispatch({
                    type: LOGIN,
                    user
                });
                setTimeout(()=>{
                    UserService.getProfile()
                    .then((res) =>{
                        return res.json();
                    })
                    .then(user => {
                        if (user.id) {  
                            user.id_token = token.id_token;
                            AsyncStorage.setItem('id_token', token.id_token);
                            store.dispatch({
                                type: LOGIN,
                                user
                            });
                            if (user.termsAndConditionsChecked == true) {
                                const successful = StackActions.reset({
                                    index: 0,
                                    actions: [NavigationActions.navigate({ routeName: 'Main' })],
                                });
                                store.dispatch(successful);
                            } else {
                                const legalAgreements = StackActions.reset({
                                    index: 0,
                                    actions: [NavigationActions.navigate({ routeName: 'LegalAgreements' })],
                                });
                                store.dispatch(legalAgreements);  
                            }
                        } else {
                            this.setState({ log : strings.globalErrors.connection});
                            this.setState({ isLoading: false });
                        }
                    })
                    .catch((e) => {
                        this.setState({ log : strings.globalErrors.gamProfile});
                        this.setState({ isLoading: false });
                        return;
                    });
                },1000);   
            } else {
                this.setState({ log: strings.logIn.error.badCredentials});
                this.setState({ isLoading: false });
                return;
            }
        })
        .catch((e) => {
            this.setState({ log: strings.globalErrors.connection});
            this.setState({ isLoading: false });
        });
    }
    render() {
        const { isLoading } = this.state;
        return (
            <ImageBackground source={require('../../resources/global/background-map-color.png')} style={ styles.imageBackground }>
                { this.state.socialLoading == false &&
                <ScrollView style={styles.scrollView}>
                    <SafeAreaView style={ styles.wrapper }>
                        <View style={styles.scrollViewWrapper}> 
                            <View style={styles.outerContainer}>
                                <View style={styles.innerContainer}>
                                    <View style={ styles.logoView }>
                                        <Image resizeMode='contain' style={ styles.logo }  
                                            source={require('../../resources/global/app-logo.png')} />
                                    </View>
                                    { this.state.log != undefined && this.state.log.length > 0 &&
                                        <Text style={[styles.error,{width:'100%', marginBottom:5}]} >{this.state.log}</Text>
                                    }
                                    <Item>       
                                        <View style={styles.login}>
                                            <TextInput placeholder={ strings.logIn.userName } 
                                                    style={ styles.input } 
                                                    ref={(c) => {
                                                        this.userName = c;
                                                    }}
                                                    autoCapitalize = 'none'
                                                    onChangeText={ (text) => this.setState({ emailAddress: text }) }/>
                                        </View>
                                    </Item>
                                    <Item style={ styles.passwordInput }>
                                        <View style={styles.login}>
                                            <TextInput  placeholder={ strings.logIn.password } secureTextEntry={true} 
                                                        ref={(c) => {
                                                            this.passwordInput = c;
                                                        }}
                                                        style={ styles.input } 
                                                        onChangeText={ (text) => this.setState({ password: text }) }/>
                                        </View>
                                    </Item>
                                    <Button block success style={ styles.logInButton } onPress={() =>{
                                                Keyboard.dismiss();
                                                this.handleNextButton();
                                    }}>
                                        <Text style= {{ color:'white' }}>{ strings.logIn.logIn }</Text>
                                    </Button>
                                    <Button block transparent style={[ {marginTop: 15} ]} onPress={() => this.props.navigation.navigate('ForgotPassword')}>
                                        <Text style= {{ color:'grey' }} >{ strings.logIn.forgotPassword }</Text>
                                    </Button>
                                    <Button block transparent style={{ marginBottom:10}} onPress={() => this.props.navigation.navigate('Register')}>
                                        <Text style= {{ color:'#41B17C' }} >{ strings.logIn.register }</Text>
                                    </Button>
                                </View>
                            </View>
                            { _.has(this.props.config,'login.facebook') && this.props.config.login.facebook == true && 
                            <Button block
                                style={[ styles.button , { backgroundColor: "#3956A2"}]}
                                onPress={() => this.handleSocialLogin("facebook")}
                                >
                                <Text style= {{ color:'white' }}>{ strings.logIn.facebook }</Text>
                            </Button>
                            }
                            { _.has(this.props.config,'login.google') && this.props.config.login.google == true && 
                            <Button block
                                style={[ styles.button , { backgroundColor: "white"}]}
                                onPress={() => this.handleSocialLogin("google")}>
                                <Text style= {{ color:'#737373' }}>{ strings.logIn.google }</Text>
                            </Button>
                            }
                        </View>
                    </SafeAreaView>
                </ScrollView> }
                { ( this.state.isLoading || this.state.socialLoading) && 
                <Loader></Loader> }
            </ImageBackground> 
        )
    }
}
const styles = StyleSheet.create({
    imageBackground: {
        width: '100%', 
        height: '100%',
    },
    wrapper: {
        flex: 1,
    },
    logoView: {
        justifyContent:'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    logo: {
        alignItems: 'center',
        justifyContent:'center', 
        width: 100, 
        height: 100,
        
    },
    passwordInput: {
        marginBottom:20,
    },
    button: {
        marginTop: 20,
        alignSelf:'center',
        fontWeight:'bold',
        borderRadius: 5,
        height: 40,
        width:250,
        padding:15,
    },
    logInButton: {
        backgroundColor:'#41B17C', 
        borderRadius: 5,
        marginLeft: 20,
        marginRight: 20,
    },
    scrollViewWrapper: {
        marginTop: 40,
        flex: 1,
        justifyContent: 'center'
    },
    scrollView: {
        paddingLeft: 30,
        paddingRight: 30,
        paddingTop: 10,
        flex: 1,
    },
    outerContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 0,
        marginTop: 0,
        marginBottom: 20,
    },
    innerContainer: {
        backgroundColor: 'transparent',
        marginTop: 15,
        marginRight: 30,
        marginLeft: 30,
        marginBottom: 5,
    },
    login: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    input: {
        flex: 1,
        paddingTop: 15,
        paddingRight: 10,
        paddingBottom: 10,
        height:50,
        backgroundColor: 'transparent',
        color: '#737373',
        fontSize: 14,
    },
    error: {
        color: "#EA585E",
        fontSize: 12,
        paddingTop:10,
        paddingLeft:0,
        paddingBottom:10   
    },
});
const mapStateToProps = (state) => {
    return {
        loggedInStatus: state.loggedInStatus,
        config: state.config.application.dynamic,
        google: state.config.application.client.google
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(LogIn);