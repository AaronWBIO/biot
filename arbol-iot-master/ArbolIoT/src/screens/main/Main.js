import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import  transparentHeaderStyle  from '../../styles/navigation'
import { Col, Row, Grid } from "react-native-easy-grid";
import {
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    ImageBackground,
    Image,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import { Button, Drawer, Icon } from 'native-base';
import strings from '../../config/languages';
import SideBar from '../../components/side-bar/SideBar';
import _ from 'lodash';
import {AsyncStorage} from 'react-native';
import NotificationService from '../../services/notificaction';
import UserService from '../../services/user';
import SpeciesService from '../../services/species';
import ConfigService from '../../services/config';
import FastImage from 'react-native-fast-image';
import constants from '../../config/constants';
import Orientation from 'react-native-orientation';

class Main extends Component {
    static navigationOptions = ({}) => ({
        headerStyle: transparentHeaderStyle,
        headerTransparent: true,
        headerLeft: null,
        headerTintColor: colors.white,
    });
    constructor(props) {
        super(props);
        this.state = {
            backImages:[
                require('../../resources/main/header-green.png'),
                require('../../resources/main/header-yellow.png'),
                require('../../resources/main/header-red.png'),
            ],
            rings:[
                require('../../resources/main/circle-green.png'),
                require('../../resources/main/circle-yellow.png'),
                require('../../resources/main/circle-red.png'),
            ],
            colors:[
                '#2F9763',
                '#ECA500',
                '#C9424D',
            ],
            airBreeze:[
                require('../../resources/main/icon-air-good.png'),
                require('../../resources/main/icon-air-reg.png'),
                require('../../resources/main/icon-air-bad.png'),
            ],
            images: {
                '01d':require('../../resources/weather/01d.png'),
                '01n':require('../../resources/weather/01n.png'),
                '02d':require('../../resources/weather/02d.png'),
                '02n':require('../../resources/weather/02n.png'),
                '03d':require('../../resources/weather/03d.png'),
                '03n':require('../../resources/weather/03n.png'),
                '04d':require('../../resources/weather/04d.png'),
                '04n':require('../../resources/weather/04n.png'),
                '09d':require('../../resources/weather/09d.png'),
                '09n':require('../../resources/weather/09n.png'),
                '10d':require('../../resources/weather/10d.png'),
                '10n':require('../../resources/weather/10n.png'),
                '11d':require('../../resources/weather/11d.png'),
                '11n':require('../../resources/weather/11n.png'),
                '13d':require('../../resources/weather/13d.png'),
                '13n':require('../../resources/weather/13n.png'),
                '50d':require('../../resources/weather/50d.png'),
                '50n':require('../../resources/weather/50n.png'),
            },
            trees: '',
            temp: '',
            tempLabel: '',
            tempImage: require('../../resources/weather/01d.png'),
            aqi: '-',
            aqLabel: '',
            airQualityLevel: 0,
            isLoadingMeasures: true,
            isLoading:false,
            notificactionUnread: null,
            humidity: ''
        }
        if (!_.has(this.props,'currentBoundary.id')) {
            if (this.props.user.boundary != undefined && this.props.user.boundary != null) {
                this.props.setCurrentBoundary(this.props.user.boundary);
                this.props.setMainData(this.props.user.boundary.id);
            }
        }  else {
            this.props.setMainData(this.props.currentBoundary.id);
        }
    }
    async componentDidMount() {
        Orientation.lockToPortrait();
        let fcmToken = await AsyncStorage.getItem('fcmToken');
        NotificationService.updateToken(fcmToken);
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
        var species = await AsyncStorage.getItem('species');      
        if (species == undefined || species == null) {
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
        if (_.has(this.props,'currentBoundary.id') && 
        _.has(this.props,'mainData.aqi')) {
            this.prepareMeasures();
        }
        this.props.updateNotificationsIndicator();
        UserService.reportSession().then((res)=>{
            if (res.status != undefined && res.status == 401) {
                this.props.logOut();
            }
        }).catch((e) =>{
        });
        this.props.clearLocalBoundary();
    }
    componentDidUpdate(prevProps, prevState) {
        Orientation.lockToPortrait();
        this.props.clearLocalBoundary();
        if (prevProps.mainData !== this.props.mainData) {
            this.setState({isLoadingMeasures:true});
            this.prepareMeasures();
        }
        if (prevProps.currentBoundary !== this.props.currentBoundary) {
            this.setState({isLoadingMeasures:true});
            this.props.setMainData(this.props.currentBoundary.id);
        }
    }
    prepareMeasures() {
        if (_.has(this.props,'mainData.aqIndex')) {
            if (this.props.mainData.aqIndex == "N/A") {
                this.state.airQualityLevel = 0;
            } else {
                this.state.airQualityLevel = this.props.mainData.aqIndex;
            }
        } 
        if (_.has(this.props,'mainData.aqi')) {
            this.state.aqi = this.props.mainData.aqi;
        } 
        if (_.has(this.props,'mainData.tempObject.mainParameters.temperature') && !isNaN(this.props.mainData.tempObject.mainParameters.temperature)) {
            this.state.temp = Math.round(this.props.mainData.tempObject.mainParameters.temperature);
        } 
        if (_.has(this.props,'mainData.tempObject.mainParameters.humidity')) {
            this.state.humidity = this.props.mainData.tempObject.mainParameters.humidity;
        } 
        if (_.has(this.props,'mainData.tempObject.weather') && this.props.mainData.tempObject.weather.length > 0 && this.props.mainData.tempObject.weather[0].description != undefined) {
            this.state.tempLabel = this.props.mainData.tempObject.weather[0].description;
            this.state.tempImage = this.state.images[this.props.mainData.tempObject.weather[0].icon];
        } 
        if (_.has(this.props,'mainData.aqLabel')) {
            this.state.aqLabel = this.props.mainData.aqLabel.toUpperCase();
        } 
        if (_.has(this.props,'mainData.trees')) {
            this.state.trees = this.props.mainData.trees;
        } 
        this.setState(this.state);
        this.setState({isLoadingMeasures:false});
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
    _closeDrawer = () => { this._drawer._root.close(); }
    _openDrawer = () => { this._drawer._root.open(); }
    render() {
        return (
            <Drawer style={{ backgroundColor:'#F6F6F9', flex:1}} ref={(ref) => { this._drawer = ref; }} 
                content={<SideBar navigation={this.props.navigation} _closeDrawer = { this._closeDrawer } />} >
                <SafeAreaView style={{ backgroundColor:'#F6F6F9', flex:1}}>
                    <ScrollView>
                        <ImageBackground style={{backgroundColor:'white'}} source={this.state.backImages[this.state.airQualityLevel]} style={styles.backgroundImage}>                        
                            <View>
                                <View style={styles.topData}>    
                                    <Col style={styles.topBarData}>                    
                                        <TouchableOpacity onPress={()=> this._openDrawer() }>
                                            <Icon   type="MaterialCommunityIcons"  name={"menu"} style={ [{ 
                                                fontSize:37, 
                                                color:"white",
                                                paddingTop:0,     
                                                height: 30, width: 30, marginRight: 30, marginTop:-3 }]}/>
                                        </TouchableOpacity>
                                    </Col>       
                                    <Col style={[styles.topBarData,{flex: 2}, this.props.mode !== 1 ? { opacity:0.3} : {}]}>
                                        <TouchableOpacity onPress={ ()=> this.props.navigation.navigate('Boundary')} disabled={ this.props.mode !== 1  }>
                                            <View style={styles.locationView}>
                                                <View style={styles.locationArrow}/> 
                                                <Text style={styles.location}>{
                                                    ( this.props.currentBoundary.name == undefined ) ? strings.main.selectLocation : 
                                                        this.props.currentBoundary.name.replace(".","").split("-")[0]  }</Text>
                                                 <Icon name="md-arrow-dropdown" style={ [{  fontSize:22, color:"white",  height: 25, width: 15, marginLeft:0, alignSelf:'center'}]}/>
                                            </View>
                                        </TouchableOpacity>
                                    </Col>
                                    <Col style={[styles.topBarData, this.props.mode !== 1 ? { opacity:0.3} : {}]}>
                                        <TouchableOpacity  onPress={()=>this.props.navigation.navigate('Notifications')} disabled={ this.props.mode !== 1  }>
                                            <View style={{flexDirection: 'row'}}>
                                            <Icon name={"notifications"} style={ [{ 
                                                fontSize:30, color:"white",
                                                paddingTop:0,     
                                                height: 30, width: 25, marginTop:0 }]}/>
                                            {   this.props.notifications != null && this.props.notifications != 0 &&
                                                 <View style={{backgroundColor:'#DB4739', height: 20, width:20, borderRadius: 10,  justifyContent:'center', position:"absolute", top: -4, right: -8}}> 
                                                    <Text  style={ {color:'#fff', fontSize: 8, fontWeight: '500', alignSelf:'center'}}>
                                                        {this.props.notifications}
                                                    </Text>
                                                </View>
                                            }     
                                            </View>                                       
                                        </TouchableOpacity>
                                    </Col>
                                </View>
                            </View>
                            <View style={styles.treeCount}>
                                <ImageBackground source={this.state.rings[this.state.airQualityLevel]} style={styles.circle}>
                                    { this.props.mode !== 0  && this.state.isLoadingMeasures == false &&
                                        <View>
                                            <Text style={styles.treeCountNumber}>{ this.state.trees }</Text>
                                            <Text style={styles.treeCountText}>{strings.main.trees}</Text>
                                        </View>
                                    }
                                    { this.props.mode !== 0  && this.state.isLoadingMeasures == true &&
                                        <View style={{ flex:1, alignContent:'center', justifyContent:'center' }}>
                                            <ActivityIndicator size="small" color="#ccc" />
                                        </View>
                                    }
                                    { this.props.mode !== 1 &&
                                        <View style={{ flex:1, alignContent:'center', justifyContent:'center' }}>
                                            <Icon type="MaterialCommunityIcons" name={"airplane"} style={ [{ fontSize:48, color: this.state.colors[this.state.airQualityLevel], alignSelf:'center' }]}/>
                                        </View>
                                    }
                                </ImageBackground>
                            </View>
                            <View  style={[ styles.statusData,  this.props.mode !== 1 ? { opacity:0.2} : {}]} >
                                { this.state.isLoadingMeasures == false &&
                                    <Col style={styles.statusDataElement}>
                                        <Image source={ this.state.tempImage } style={styles.barIcons}/>
                                        <Text style={styles.statusDataUpper}>{this.state.temp}  { this.props.config != undefined && this.props.config.scales != undefined && this.props.config.scales.temp != undefined ? this.props.config.scales.temp : '' }</Text>
                                        <Text style={styles.statusDataLower}>{this.state.tempLabel}</Text>
                                    </Col>
                                }
                                { this.state.isLoadingMeasures == true &&
                                    <Col style={[ styles.statusDataElement,{ flex:1, alignContent:'center', justifyContent:'center' }]}>
                                        <ActivityIndicator size="small" color="#ccc" />
                                    </Col>
                                }
                                { this.state.isLoadingMeasures == false &&
                                    <Col style={styles.statusDataElement}>
                                        <Image source={this.state.airBreeze[this.state.airQualityLevel]} style={[styles.barIcons,{ width:34, height:30}]}/>
                                        <Text style={styles.statusDataUpper}>{this.state.aqLabel}</Text>
                                        <Text style={styles.statusDataLower}>{strings.main.airQuality}</Text>
                                    </Col>
                                }
                                { this.state.isLoadingMeasures == true &&
                                    <Col style={[ styles.statusDataElement,{ flex:1, alignContent:'center', justifyContent:'center' }]}>
                                        <ActivityIndicator size="small" color="#ccc" />
                                    </Col>
                                }
                                { this.state.isLoadingMeasures == false &&
                                    <Col style={[styles.statusDataElement, styles.statusDataElementLast]}>
                                        <Image source={require('../../resources/main/icon-humidiy.png')} style={[styles.barIcons , {width:31, height:30, opacity:0.5}]}/>
                                        <Text style={styles.statusDataUpper}>{ this.state.humidity } { this.props.config != undefined &&  this.props.config.scales != undefined && this.props.config.scales.humidity != undefined ? this.props.config.scales.humidity : '' }</Text>
                                        <Text style={styles.statusDataLower}>{strings.main.humidity}</Text>
                                    </Col>
                                }
                                { this.state.isLoadingMeasures == true &&
                                    <Col style={[ styles.statusDataElement,{ flex:1, alignContent:'center', justifyContent:'center' }]}>
                                        <ActivityIndicator size="small" color="#ccc" />
                                    </Col>
                                }
                            </View>
                            <View style={styles.buttonsContainer}>
                                <Grid>
                                    <Row>
                                        <Col>
                                            <View style={styles.buttonCol}>
                                                <Button style={styles.button} onPress={()=> this.props.navigation.navigate('Trees') }>
                                                    <Image source={require('../../resources/global/icon-tree-gen.png')} style={styles.iconUrban}/>
                                                    <Text style={styles.buttonLabel}>{strings.main.urbanTrees}</Text>
                                                </Button>
                                            </View>
                                        </Col>
                                    </Row>
                                    <Row style={[ this.props.mode !== 1 ? { opacity:0.3} : {}]}>
                                        <Col>
                                            <View style={styles.buttonCol}>
                                                <Button style={styles.button} onPress={ ()=> this.props.navigation.navigate('Benefits') } disabled={ this.props.mode !== 1  }>
                                                    <Image source={require('../../resources/main/icon-benefit.png')} style={styles.iconBenefits}/>
                                                    <Text style={styles.buttonLabel}>{strings.main.benefits}</Text>
                                                </Button>
                                            </View>
                                        </Col>
                                        <Col>
                                            <View style={styles.buttonCol}>
                                                <Button style={styles.button} onPress={ ()=> this.props.navigation.navigate('Community') } disabled={ this.props.mode !== 1  }>
                                                    <Image source={require('../../resources/main/icon-community.png')} style={styles.iconCommunity}/>
                                                    <Text style={styles.buttonLabel}>{strings.main.community}</Text>
                                                </Button>
                                            </View>
                                        </Col>
                                    </Row>
                                    <Row style={[ this.props.mode !== 1 ? { opacity:0.3} : {}]}>
                                        <Col>
                                            <View style={styles.buttonCol}>
                                                <Button style={styles.button} onPress= { () => this.props.navigation.navigate('Trivia')} disabled={ this.props.mode !== 1  }>
                                                    <Image source={require('../../resources/main/icon-trivia.png')} style={styles.iconTrivia}/>
                                                    <Text style={styles.buttonLabel}>{strings.main.trivia}</Text>
                                                </Button>
                                            </View>
                                        </Col>
                                        <Col>
                                            <View style={styles.buttonCol}>
                                                <Button style={styles.button} onPress= { () => this.props.navigation.navigate('UserTreeList')} disabled={ this.props.mode !== 1  }>
                                                    <Image source={require('../../resources/main/icon-my-trees.png')} style={styles.iconMyTrees}/>
                                                    <Text style={styles.buttonLabel}>{strings.main.myTrees}</Text>
                                                </Button>
                                            </View>
                                        </Col>
                                    </Row>
                                </Grid>
                            </View>
                        </ImageBackground>
                        { _.has(this.props,'config.sources.aq') && _.has(this.props,'config.sources.temp') && 
                        <View style={{ marginBottom:10}}>
                            <Text style={{fontSize:9, margin:5, marginHorizontal:40, color:'#737373', lineHeight:15, textAlign:'center'}}>{ this.props.config.sources.temp.trim()}</Text>
                            <Text style={{fontSize:9, margin:5, marginHorizontal:40, color:'#737373', lineHeight:15, marginBottom:10, textAlign:'center'}}>{ this.props.config.sources.aq.trim()}</Text>
                        </View>
                        }
                    </ScrollView>
                </SafeAreaView>
            </Drawer>
        )
    }
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        height: '33%',
        backgroundColor:'white'
    },
    treeCount: {
        alignItems: 'center',
        marginTop: 10,
    },
    treeCountNumber: {
        alignSelf: 'center',
        marginTop: 45,
        color: 'grey',
        fontWeight: 'bold',
        fontSize: 35,
    },
    treeCountText: {
        alignSelf: 'center',
        fontSize: 25,
        color: '#C0C0C0',
    },
    locationView: {
        flexDirection: 'row',
    },
    statusData: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: 15,
        marginBottom: 20,
        minHeight:70,
        backgroundColor:'white'
    },
    topData: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: 20,
        marginBottom: 20,
    },
    statusDataElement: {
        alignItems: 'center',
        borderRightWidth: 0.5, 
        borderRightColor: 'grey',
    },
    statusDataElementLast: {
        borderRightWidth: 0,
    },
    topBarData: {
        alignItems: 'center',
    },
    statusDataUpper: {
        fontSize: 22,
        color: '#888888'
    },
    statusDataLower: {
        fontSize: 12,
        color: '#888888',
    },
    buttonsContainer: {
        backgroundColor: '#F6F6F9',
        paddingTop: 15,
        paddingBottom: 15,
        paddingLeft: 10,
        paddingRight: 10,
    },
    buttonCol: {
        margin: 10,
    },
    buttonColFinish: {
        margin: 10,
        alignSelf: 'center',
    },
    button: {
        width:'100%', 
        height: '100%', 
        backgroundColor:'#fff', 
        flexDirection: 'column', 
        resizeMode:'contain',
        paddingTop: 20,
        paddingBottom: 20,
    },
    buttonFinish: {
        width:'70%', 
        height: '100%', 
        backgroundColor:'#fff', 
        flexDirection: 'column', 
        resizeMode:'contain',
        paddingTop: 20,
        paddingBottom: 20,
    },
    buttonLabel:{
        fontSize: 12,
        color: '#888888',
        fontWeight: '500',
        marginTop: 12,
    },
    iconBenefits: {
        height: 50,
        resizeMode:'contain'
    },
    iconCommunity: {
        height: 50,
        resizeMode:'contain'
    },
    iconMyTrees: {
        height: 50,
        resizeMode:'contain'
    },
    iconTrivia: {
        height: 50,
        resizeMode:'contain'
    },
    iconUrban: {
        height: 50,
        resizeMode:'contain'
    },
    barIcons: {
        height: 30,
        width: 30,
    },
    locationArrow: {
        height: 15,
        width: 15,
        marginRight: 10,
        alignSelf:'center'
    },
    circle: {
        height: 160,
        width: 160,
    },
    location: {
        color:'white',
        fontSize: 16,
        marginTop:5,
        width: 150,
        fontWeight: '700',
        textAlign: 'center',
        justifyContent:'center',
        lineHeight: 24
    }
});

const mapStateToProps = (state) => {
    return {
        loggedInStatus: state.loggedInStatus,
        mainData: state.mainData,
        idToken: state.user.id_token,
        user: state.user,
        currentBoundary: state.currentBoundary,
        notifications: state.notificationsIndicator.count,
        config: state.config.application.dynamic,
        mode: state.mode
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Main);