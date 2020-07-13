import React from 'react';
import { View, Image, ImageBackground, ActivityIndicator,Text } from 'react-native';
import colors from '../../styles/colors';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import ActionCreators  from "../../redux/actions";
import ConfigService from '../../services/config';
import {StackActions,NavigationActions } from 'react-navigation';
import constants from '../../config/constants';
import {AsyncStorage} from 'react-native';
import FastImage from 'react-native-fast-image';
import SpeciesService from '../../services/species';
import strings from '../../config/languages';

class Splash extends React.Component {
    static navigationOptions = ({  }) => ({
        headerTransparent: true,
        headerTintColor: colors.white,
    });
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            config: {},
        }
    }
    async componentDidMount() {
        this.props.setMode(1);
        ConfigService.getConfig().then(async (res) =>{
            if (res.status == 200) {
                var config = JSON.parse(res._bodyText);
                this.props.setConfigOnInit(config);  
                this.setState({config: config}, ()=>{
                    this.setState({isLoading:false});
                });
                // Ger splash screen
                var assistant = await AsyncStorage.getItem('assistant');      
                if (assistant == undefined || assistant == null) {
                    ConfigService.getConfigAssistant().then(async (res) =>{
                        if (res.status == 200) {
                            AsyncStorage.setItem('assistant',res._bodyText); 
                            var assitantData = JSON.parse(res._bodyText);
                            var data = [];
                            var filesToPreload = [];
                            this.navTree(assitantData,data);
                            for (var indx in data) {
                                filesToPreload.push({uri: constants.base + data[indx],headers: { "Accept": "*/*", "Content-Type": "*/*"}});
                            }
                            FastImage.preload(filesToPreload);
                        }
                    });
                }
                // Get species data
                var species = await AsyncStorage.getItem('species');      
                if (true || species == undefined || species == null) {
                    SpeciesService.getAll()
                    .then((res) => res.json())
                    .then(res => {
                        if (res.length > 0) {
                            AsyncStorage.setItem('species',JSON.stringify(res)); 
                        }
                    })
                    .catch((e) => {
                    });    
                }   
                setTimeout(()=>{
                    this.checkRedirect();
                },5000);
            }
        });
        setTimeout(()=>{
            if (this.state.isLoading) {
                this.checkRedirect();
            }
        },10000);
    }
    checkRedirect = () => {
        if (this.props.idToken != null && this.props.idToken.length > 0) {
            this.props
            .navigation
            .dispatch(StackActions.reset(
                {
                    index: 0,
                    actions: [
                    NavigationActions.navigate({ routeName: 'Main'})
                    ]
            }));
        } else {
            this.props
            .navigation
            .dispatch(StackActions.reset(
                {
                    index: 0,
                    actions: [
                    NavigationActions.navigate({ routeName: 'LogIn'})
                    ]
            }));
        }
    }
    navTree  = (element,data) => {
        if (element.type == "leaf") {
            data.push(element.specie.image.uri);
            return data;
        }
        if (element['images'] != undefined && element['images'].length > 0) {
            for( imgIndx in element['images'] ) {
                data.push(element['images'][imgIndx].uri);
            }
        }
        if(element['options'] != undefined && element['options'].length > 0) {
            for( indx in element['options'] ) {
                this.navTree(element['options'][indx],data);
            }
        }
    }
    render() {
        return (
            <ImageBackground source={require('../../resources/splash/background.png')} style={ styles.imageBackground }>
                <View style={ styles.splashWrapper }>
                    <ImageBackground resizeMode='contain' 
                        style={ styles.splash }  
                        source={require('../../resources/splash/app-brand.png')}>
                        <Text style={{ color:'white', fontWeight:'bold', fontSize:25, position:'absolute', bottom:60}}>{ this.state.isLoading || this.state.config.application == undefined || this.state.config.application.dynamic.instanceName == undefined ? 
                            strings.appName : this.state.config.application.dynamic.instanceName}</Text>
                        <ActivityIndicator color='#2CA06C' style={{alignSelf:'center', position:'absolute', bottom:-50}} size="large" />
                    </ImageBackground>     
                </View>
                <View style={{ width:'100%', height:100, position:'absolute', bottom:0, flexDirection:'row', backgroundColor:'white', padding:20}}>
                    <Image
                        style={{resizeMode: 'contain', width:'33%', height:100, alignSelf:'center'}}
                        source={ require('../../resources/splash/logo-1.png')}
                    />
                    <Image
                        style={{resizeMode: 'contain', width:'33%', height:100, alignSelf:'center'}}
                        source={ require('../../resources/splash/logo-2.png')}
                    />
                    <Image
                        style={{resizeMode: 'contain', width:'33%', height:100, alignSelf:'center'}}
                        source={ require('../../resources/splash/logo-3.png')}
                    />
                </View>
            </ImageBackground>
        );
    }
}
const styles = {
    imageBackground: {
        width: '100%', 
        height: '100%',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    splashWrapper: {
        alignItems: 'center',
        justifyContent:'center', 
        height: 300,
    },
    splash: {
        alignItems: 'center',
        justifyContent:'center', 
        width: 300,
        height:300        
    }
}
const mapStateToProps = (state) => {
    return {
        idToken: state.user.id_token
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(Splash);
