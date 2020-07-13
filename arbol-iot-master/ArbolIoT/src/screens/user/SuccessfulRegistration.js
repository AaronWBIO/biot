import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { NavigationActions, StackActions } from 'react-navigation';
import Loader from '../../components/loader/Loader';
import {
    Text,
    ImageBackground,
    View,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Image
} from 'react-native';
import { Button } from "native-base";
import strings from '../../config/languages';
import globalStyles from '../../styles/global';
import _ from 'lodash';

class SuccessfulRegistration extends Component {
    static navigationOptions = ({ navigation }) => ({
        headerTransparent: true,
        headerTintColor: colors.white,
    });
    constructor(props) {
        super(props)
        this.state = {
            loadingVisible: false
        }

    }
    _onPressButton = () => {        
        if (_.has(this.props,'user.currentLevel.payload')) {
            let payload = JSON.parse(this.props.user.currentLevel.payload);
            if (_.has(payload,'onBoardId')) {
                let onBoardId = payload.onBoardId;
                this.props.navigation.dispatch(StackActions.reset({
                    index: 0,
                    key: null,
                    actions: [NavigationActions.navigate({ routeName: 'OnBoard', params: { id: onBoardId }})],
                }));
                return;
            }
        }
        this.props.navigation.dispatch(StackActions.reset({
            index: 0,
            key: null,
            actions: [NavigationActions.navigate({ routeName: 'Main' })],
        }));
    }
    render() {
        const { loadingVisible } = this.state;
        return (
            <ImageBackground source={require('../../resources/global/background-map-color.png')} style={ styles.imageBackground }>
                <ScrollView ref='_scrollView' style={styles.scrollView}>
                    <SafeAreaView style={ styles.wrapper }>
                        <View style={ styles.scrollViewWrapper }>                         
                            <View style={styles.marginContainer}>
                                <View style={ styles.paddingContainer }>
                                    <Image source={require('../../resources/global/icon-check.png')} style={[globalStyles.alertImg,{marginBottom:20, marginTop:10}]}/>    
                                    <Text style={ globalStyles.alertTitle }>{strings.successfulRegistration.successfulRegistration}</Text>
                                    <Text style={ globalStyles.alertText }>{strings.successfulRegistration.accountRegistrated}</Text>        
                                    <Button block style={styles.button} onPress={this._onPressButton}>
                                        <Text style= {{ color:'white' }}>{ strings.successfulRegistration.continue }</Text>
                                    </Button>
                                </View>
                            </View>
                        </View>
                    </SafeAreaView>
                </ScrollView>
                { loadingVisible && <Loader></Loader> }
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
        flex: 1
    },
    button: {
        marginTop: 20,
        marginBottom: 30,
        marginLeft: 20,
        marginRight: 20,
        fontWeight:'bold',
        borderRadius: 5,
        color: 'white',
        backgroundColor: '#41B17C'
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
        borderRadius: 0,
        marginTop: 60,
    },
    paddingContainer: {
        backgroundColor: 'transparent',
        marginTop: 15,
        marginRight: 30,
        marginLeft: 30,
        marginBottom: 5
    },

});
const mapStateToProps = (state) => {
    return {
        loggedInStatus: state.loggedInStatus,
        user: state.user,
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}


export default connect(mapStateToProps, mapDispatchToProps)(SuccessfulRegistration);