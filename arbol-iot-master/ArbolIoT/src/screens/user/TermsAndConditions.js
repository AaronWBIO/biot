import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { Text, ImageBackground, View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import strings from '../../config/languages';
import { Icon } from 'native-base';
import globalStyles from '../../styles/global';

class TermsAndConditions extends Component {
    static navigationOptions = ({ navigation }) => ({
        title: strings.legalAgreements.title,
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
        this.state = {
            loadingVisible: false,
            bintaryTab: true,
        }
    }
    componentDidMount() {
    }
    render() {
        return (
            <ImageBackground source={require('../../resources/global/background-map-color.png')} style={ styles.imageBackground }>
                { !this.state.loadingVisible &&
                <View style={styles.scrollView}>
                    { (this.props.showOnlyTermsAndConditions == undefined || this.props.showOnlyTermsAndConditions == false ) &&
                    <View style={{backgroundColor: 'black', flexDirection: 'row', height: 30}}>
                        <TouchableOpacity style={{flexGrow: 1, backgroundColor: 'white', height: 30}}>
                            <Text onPress={() => { 
                                this.setState({
                                    bintaryTab: true
                                });
                            }} style={this.state.bintaryTab ? styles.current: styles.too}>{strings.legalAgreements.termsAndConditions}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{flexGrow: 1, backgroundColor: 'white', height: 30, borderLeftColor: 'black', borderLeftWidth: 1}}>
                            <Text onPress={() => {
                                this.setState({
                                    bintaryTab: false
                                });
                            }} style={this.state.bintaryTab ? styles.too: styles.current}>{strings.legalAgreements.privacyPolicy}</Text>
                        </TouchableOpacity>
                    </View>
                    }
                    <SafeAreaView  style={ styles.wrapper }>
                        <View style={styles.scrollViewWrapper}>
                            <View style={styles.marginContainer}>
                                <View style={styles.paddingContainer}>
                                    <ScrollView style={{}}>
                                        <Text style={{marginRight: 30, color:'#737373', textAlign:'justify', lineHeight:25}}>{this.state.bintaryTab ? this.props.termsAndConditions : this.props.privacyPolicy}</Text>
                                    </ScrollView>
                                </View>
                            </View>   
                        </View>
                    </SafeAreaView>
                </View> }
                { ( this.state.loadingVisible ) && 
                <ActivityIndicator style={{alignItems:'center',justifyContent:'center', flex:1}} size="large" color="white" /> }
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
        marginRight: 30,
    },
    scrollViewWrapper: {
        marginTop: 10,
        flex: 1,
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
        height: "90%"
    },
    paddingContainer: {
        backgroundColor: 'transparent',
        marginTop: 20,
        marginRight: 20,
        marginLeft: 20,
        marginBottom: 10
    },
    current: {
        color: '#41B17C',
        textAlign: 'center', 
        marginTop: 5, 
        marginBottom: 5,
        fontWeight: 'bold'
    },
    too: {
        color: '#737373',
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

export default connect(mapStateToProps, mapDispatchToProps)(TermsAndConditions);