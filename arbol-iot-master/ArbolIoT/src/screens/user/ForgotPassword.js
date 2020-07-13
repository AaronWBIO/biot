import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import Loader from '../../components/loader/Loader';
import {
    Text,
    ImageBackground,
    View,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import { Button, Icon, Input } from "native-base";
import { Item } from 'native-base';
import strings from '../../config/languages';
import validationMessages from '../../config/validationMessages';
import CustomValidationComponent from '../../helpers/CustomValidationComponent';
import globalStyles from '../../styles/global';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

class ForgotPassword extends CustomValidationComponent {
    static navigationOptions = ({ navigation }) => ({
        title: 'Recuperar contraseña',
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
    }
    messages = validationMessages;
    deviceLocale = this.props.lang != undefined ? this.props.lang : 'es';
    constructor(props) {
        super(props)
        this.state = {
            formValid: true,
            mail: '',
            password:'',
            loadingVisible: false,
            sent: false,
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
    logIn = () => {
        this.setState({ sent: !this.state.sent })
        this.props.navigation.navigate('LogIn')
    }
    _onPressButton = () => {
        var valid = this.validate(this.validations);
        this.setState( {formValid:valid });  
        if (valid) {
            var t = this;
            this.setState({ sent: this.state.recoverStatus == 200, loadingVisible:true })
            this.props.recovery(this.state.mail);
            setTimeout(function(){ t.setState({loadingVisible:false}); }, 5000);
        } else {
            this.refs._scrollView.scrollToPosition(0,0);
        }
    }
    render() {
        if(!this.state.sent){
            return (
                <ImageBackground source={require('../../resources/global/background-map-color.png')} style={ styles.imageBackground }>
                    <KeyboardAwareScrollView extraHeight={100} ref='_scrollView' style={styles.scrollView}>
                        <SafeAreaView style={ styles.wrapper }>
                            <View style={ styles.scrollViewWrapper }>                         
                                <View style={styles.marginContainer}>
                                    <View style={ styles.paddingContainer }>
                                        <Text style={[globalStyles.text ,{ textAlign:'center', margin:10, marginBottom:20}]}>{strings.forgotPassword.description}</Text>
                                        <Item >       
                                            <Input placeholder={ strings.forgotPassword.email } 
                                                ref="mail"
                                                autoCapitalize='none'
                                                ref={component => this._mail = component}
                                                placeholderTextColor={'#737373'}
                                                style={ styles.input } value={this.state.mail} 
                                                onChangeText={ (text) => this.setState({ mail: text }) }/>
                                        </Item>
                                            { this.isFieldInError('mail') && this.getErrorsInField('mail').map((errorMessage, i) => {
                                                return <Text key={i} style={ styles.error }>{ errorMessage }</Text>;
                                            })}                  
                                        <Button block style={[styles.button, {backgroundColor: '#41B17C', marginTop: 40}]}
                                                onPress={this._onPressButton.bind(this)}>
                                            <Text style= {{ color:'white' }}>{ strings.forgotPassword.recoverPassword }</Text>
                                        </Button>
                                        <Button block transparent style={[ styles.cancel ]} onPress={() => this.props.navigation.navigate('LogIn')}>
                                            <Text style= {{ color:'grey' }}>{ strings.forgotPassword.cancel }</Text>
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
    else{
        return (
            <ImageBackground source={require('../../resources/global/background-map-color.png')} style={ styles.imageBackground }>
                <KeyboardAwareScrollView extraHeight={100} ref='_scrollView' ref='_scrollView' style={styles.scrollView}>
                    <SafeAreaView style={ styles.wrapper }>
                        <View style={ styles.scrollViewWrapper }>                         
                            <View style={styles.marginContainer}>
                                <View style={ styles.paddingContainer }>
                                    <Image source={require('../../resources/global/icon-check.png')} style={ globalStyles.alertImg}/>    
                                    <Text style={ [ globalStyles.text, {marginTop: 10, marginLeft: 48, marginRight: 48, marginBottom: 20}]}>{strings.forgotPassword.emailSent}</Text>             
                                    <Button block style={[styles.button, {backgroundColor: '#41B17C'}]}
                                            onPress={this.logIn}>
                                        <Text style= {{ color:'white' }}>{ strings.forgotPassword.continue }</Text>
                                    </Button>
                                    <Button block transparent style={[ styles.cancel ]} onPress={() => this.props.navigation.navigate('LogIn')}>
                                        <Text style= {{ color:'grey' }}>{ strings.forgotPassword.sendAgain }</Text>
                                    </Button>
                                </View>
                            </View>
                        </View>
                    </SafeAreaView>
                </KeyboardAwareScrollView>
                { this.state.loadingVisible && <Loader/> }
            </ImageBackground>
        )}
    }
}
const styles = StyleSheet.create({
    imageBackground: {
        width: '100%', 
        height: '100%',
    },
    wrapper: {
        flex: 1
    },
    description: {
        marginLeft: 20, 
        marginRight: 20,
        marginBottom: 30,
        marginTop: 30, 
        alignSelf: 'center', 
        color: 'grey', 
        textAlign: 'center',
    },
    button: {
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 30,
        marginRight: 30,
        fontWeight:'bold',
        borderRadius: 5,
        color: 'white',
    },
    cancel: {
        marginLeft: 20,
        marginRight: 20,
        marginBottom:10,
        fontWeight:'bold',
        borderRadius: 5,
        color: 'white',
    },   
    input: { 
        color: '#737373', 
        fontSize: 14, 
        fontWeight:'400',
    },
    scrollViewWrapper: {
        marginTop: 25,
        flex: 1
    },
    scrollView: {
        paddingLeft: 30,
        paddingRight: 30,
        paddingTop: 10,
        flex: 1,
    },
    marginContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        marginTop: 60,
    },
    paddingContainer: {
        backgroundColor: 'transparent',
        marginTop: 15,
        marginRight: 30,
        marginLeft: 30,
        marginBottom: 5
    },
    error: {
        color: "#EA585E",
        fontSize: 12,
        paddingTop:10,
        paddingLeft:0,
        paddingBottom:10   
    },
    login: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    check: {
        alignItems: 'center',
        justifyContent:'center', 
        marginBottom: 5,
        marginTop: 15,
        height: 100,
    },

});
const mapStateToProps = (state) => {
    return {
        recoverStatus: state.recoverStatus
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}


export default connect(mapStateToProps, mapDispatchToProps)(ForgotPassword);