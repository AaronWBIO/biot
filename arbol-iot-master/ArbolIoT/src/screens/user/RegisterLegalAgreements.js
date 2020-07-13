import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { NavigationActions, StackActions } from 'react-navigation';
import { Text, ImageBackground, View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Button,Icon } from "native-base";
import strings from '../../config/languages';
import { CheckBox } from "react-native-elements";
import UserService from '../../services/user';
import globalStyles from '../../styles/global';
import Loader from '../../components/loader/Loader';

class RegisterLegalAgreements extends Component {
    static navigationOptions = ({ navigation }) => ({
        title: strings.legalAgreements.title,
        headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { 
                        navigation
                        .dispatch(StackActions.reset(
                        {
                            index: 0,
                            actions: [
                            NavigationActions.navigate({ routeName: 'LogIn'})
                            ]
                        }));
                    }}>
                        <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
                    </TouchableOpacity>,        
        headerRight: (<View />),
        headerTintColor: colors.white,
        headerStyle: globalStyles.headerStyle,
        headerTitleStyle: globalStyles.headerTitleStyle,
    });
    constructor(props) {
        super(props)
        this.state = {
            loadingVisible: false,
            checked: false,
            pressStatus: true,
        }
        this.handleNextButton = this.handleNextButton.bind(this)
    }
    handleNextButton() {
        this.setState({ loadingVisible: true })   
        setTimeout(() => {        
            if (this.state.checked) {
                this.setState({ loadingVisible: false }, () => {
                    UserService.acceptTerms().then((res) => { });
                    this.props.navigation.dispatch(StackActions.reset({
                        index: 0,
                        key: null,
                        actions: [NavigationActions.navigate({ routeName: 'SuccessfulRegistration' })],
                    }));
                })
            } else {
                this.setState({ loadingVisible: false })
            }
        }, 2000);
    }
    render() {
        const { loadingVisible } = this.state;
        return (
            <ImageBackground source={require('../../resources/global/background-map-color.png')} style={ styles.imageBackground }>
                { !this.state.loadingVisible &&
                <ScrollView ref='_scrollView' style={styles.scrollView}>
                    { (this.props.showOnlyTermsAndConditions == undefined || this.props.showOnlyTermsAndConditions == false ) &&
                    <View style={{backgroundColor: 'black',flex: 1, flexDirection: 'row', }}>
                        <TouchableOpacity style={{flexGrow: 1, backgroundColor: 'white'}}>
                            <Text onPress={() => {
                                this.setState({
                                    pressStatus: true
                                });
                            }} style={this.state.pressStatus ? styles.current: styles.too}>{strings.legalAgreements.termsAndConditions}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{flexGrow: 1, backgroundColor: 'white', borderLeftColor: 'black', borderLeftWidth: 1}}>
                            <Text onPress={() => { 
                                this.setState({
                                    pressStatus: false
                                });
                            }} style={this.state.pressStatus ? styles.too: styles.current}>{strings.legalAgreements.privacyPolicy}</Text>
                        </TouchableOpacity>
                    </View>
                    }
                    <SafeAreaView  style={ styles.wrapper }>
                        <View style={styles.scrollViewWrapper}>
                            <View style={styles.marginContainer}>
                                <View style={styles.paddingContainer}>
                                    <ScrollView style={{height: 300}}>
                                        <Text style={{marginRight: 30, color:'#737373', lineHeight:25, textAlign:'justify'}}>{this.state.pressStatus ? this.props.termsAndConditions : this.props.privacyPolicy}</Text>
                                    </ScrollView>
                                </View>
                            </View>
                                <View style={styles.buttonContainer}>
                                    <CheckBox 
                                        title={ strings.legalAgreements.accept } 
                                        containerStyle={{backgroundColor: 'transparent', borderColor: 'transparent', marginLeft: 20, marginRight: 20, marginTop: 10}}
                                        textStyle={{lineHeight:22}}
                                        checkedColor='green'
                                        checked={this.state.checked}
                                        onPress={() => this.setState({ checked: !this.state.checked })}/>
                                    <Button disabled={!this.state.checked}  block success style={ [ styles.registerButton, !this.state.checked ? {opacity:0.5} : {}] } onPress={this.handleNextButton}>
                                        <Text style= { styles.register }>{ strings.legalAgreements.continue }</Text>
                                    </Button> 
                                    <Button block transparent style={[ styles.button ]} onPress={() => { 
                                            this.props
                                            .navigation
                                            .dispatch(StackActions.reset(
                                                {
                                                    index: 0,
                                                    actions: [
                                                    NavigationActions.navigate({ routeName: 'LogIn'})
                                                    ]
                                            }));
                                        }}>
                                        <Text style= {{ color:'#737373' }}>{ strings.forgotPassword.cancel }</Text>
                                    </Button>
                                </View>   
                        </View>
                    </SafeAreaView>
                </ScrollView> }
                { ( this.state.loadingVisible ) && <Loader></Loader>}
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
        marginLeft: 30,
        marginRight: 30
    },
    registerButton: {
        backgroundColor:'#41B17C', 
        borderRadius: 5,
        marginLeft: 25,
        marginRight: 25,
        marginTop:10
    },
    button: {
        fontWeight:'bold',
        color: 'white',
        borderRadius: 5,
        marginTop: 10,
        marginBottom:10
    },
    register: {
        fontWeight:'bold',
        color: 'white',
        lineHeight: 25
    },
    scrollViewWrapper: {
        marginTop: 10,
        flex: 1
    },
    scrollView: {
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 0,
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
        paddingRight: 10,
        paddingLeft: 20,
    },
    buttonContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        marginBottom:20
    },
    current: {
        color: '#41B17C',
        textAlign: 'center', 
        marginTop: 5, 
        marginBottom: 5,
        fontWeight: 'bold'
    },
    too: {
        color: 'grey',
        textAlign: 'center', 
        marginTop: 5, 
        marginBottom: 5
    },

});
const mapStateToProps = (state) => {
    return {
        termsAndConditions: state.config.application.dynamic.userRegister.termsAndConditions,
        privacyPolicy: state.config.application.dynamic.userRegister.privacyPolicy,
        showOnlyTermsAndConditions: state.config.application.dynamic.userRegister.showOnlyTermsAndConditions,
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(RegisterLegalAgreements);