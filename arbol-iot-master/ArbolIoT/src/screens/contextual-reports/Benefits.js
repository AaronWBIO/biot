import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { Col, Row } from "react-native-easy-grid";
import  transparentHeaderStyle  from '../../styles/navigation'
import {
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    ImageBackground,
    Image,
    TouchableOpacity,
    View,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { Button, Icon } from 'native-base';
import strings from '../../config/languages';
import ProgressCircle from 'react-native-progress-circle';
import ReportService from '../../services/report';
import _ from 'lodash';
import Share from 'react-native-share';
import ImageWithAuth from '../../components/image';
import AppConstants from '../../config/constants';
import globalStyles from '../../styles/global';
import ViewShot from "react-native-view-shot";
import RNFetchBlob from 'rn-fetch-blob';
import Orientation from 'react-native-orientation';

class Benefits extends Component {
    static navigationOptions = ({}) => ({
        headerStyle: transparentHeaderStyle,
        headerTransparent: true,
        headerLeft: null,
        headerTintColor: colors.white,
        drawerLabel: 'Benefits',
    });
    constructor(props) {
        super(props)
        this.state = {
            backImages:[
                require('../../resources/main/header-green.png'),
                require('../../resources/main/header-yellow.png'),
                require('../../resources/main/header-red.png'),
            ],
            rings:[
                require('../../resources/main/circle-green.png'),
                require('../../resources/main/circle-yellow.png'),
                require('../../resources/main/circle-red.png')
            ],
            airBreeze:[
                require('../../resources/main/icon-air-good.png'),
                require('../../resources/main/icon-air-reg.png'),
                require('../../resources/main/icon-air-bad.png'),
            ],
            trees: '-',
            boundary: '',
            aqi: '-',
            humidity:'-',
            airQualityLevel: 0,
            isLoadingMeasures: true,
            temp:'',
            tempLabel:'-',
            tempImage: null,
            aqLabel:'',
            colStatsEnabled: null,
            aqIndex:'',
            colStatPercent: null,
            consoleWebUrl: '',            
            benefitsData:[],
            treeStats:[],
            mainStats:[],
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
        }
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.currentBoundary !== this.props.currentBoundary) {
            let boundary = this.props.currentBoundary;
            if(boundary != undefined){
                this.loadData(boundary.id);              
                if (boundary.trees != undefined){
                    this.setState({ trees: boundary.trees });
                }          
            }
        } 
    }
    componentDidMount() {
        Orientation.lockToPortrait();
        let boundary = this.props.currentBoundary;
        if(boundary != undefined){
            if (boundary.trees != undefined){
                this.setState({ trees: boundary.trees });
            }      
            this.loadData(boundary.id);                  
        }              
    }
    mappingData(){
        let d = this.state.benefitsData;
        if (_.has(d,'baseIndicators')){
            if (_.has(d,'baseIndicators.tempObject.mainParameters.temperature') && !isNaN(d.baseIndicators.tempObject.mainParameters.temperature)) {
                this.state.temp = Math.round(d.baseIndicators.tempObject.mainParameters.temperature);
            } 

            if (_.has(d,'baseIndicators.tempObject.mainParameters.humidity')) {
                this.state.humidity = d.baseIndicators.tempObject.mainParameters.humidity;
            }
            if (_.has(d,'baseIndicators.tempObject.weather') && d.baseIndicators.tempObject.weather.length > 0 && d.baseIndicators.tempObject.weather[0].description != undefined) {
                this.state.tempLabel = d.baseIndicators.tempObject.weather[0].description;
                this.state.tempImage = this.state.images[d.baseIndicators.tempObject.weather[0].icon];
            } 
            if (_.has(d,'baseIndicators.aqLabel')) {
                this.state.aqLabel = d.baseIndicators.aqLabel;
                this.state.aqLabel = this.state.aqLabel.toUpperCase();
            }
            if (_.has(d,'baseIndicators.aqi'))         
                this.state.aqi = d.baseIndicators.aqi;         
            if (_.has(d,'nTrees'))            
                this.state.trees = d.nTrees;
            if (_.has(d,'baseIndicators.aqIndex')) {                
                this.state.aqIndex = d.baseIndicators.aqIndex;
                this.state.airQualityLevel = d.baseIndicators.aqIndex;
                if (this.state.airQualityLevel == "-" || this.state.airQualityLevel  == "N/A") {
                    this.state.airQualityLevel = 0;
                    this.state.aqLabel = "N/A";
                }
            }
            if (_.has(d,'baseIndicators.colStatsEnabled'))
                this.state.colStatsEnabled = d.baseIndicators.colStatsEnabled;
            if (_.has(d,'baseIndicators.colStatPercent'))
                this.state.colStatPercent = d.baseIndicators.colStatPercent;
            if (_.has(d,'baseIndicators.consoleWebUrl'))
                this.state.consoleWebUrl = d.baseIndicators.consoleWebUrl;
        }
        if (_.has(d,'mainStats') )
            this.state.mainStats = d.mainStats;
        if (_.has(d,'treeStats') )
            this.state.treeStats = d.treeStats;
        this.setState(this.state);
        this.setState({isLoadingMeasures:false});
    }
    loadData(id){
        this.setState({ isLoading: true})
        ReportService.getEcoBenefits(id)
        .then((res) => {
            if(res.status==200 || res.status == 201){
                let result = JSON.parse(res._bodyText);
                this.setState({
                    benefitsData: result,
                    isLoading: false,                     
                }, () => { 
                    this.mappingData();
                    this.setState({ isLoading: false });
                });                
            }         
        })
        .catch((e) => {
            this.setState({ isLoading: false});
        });
    }
    render() {
        const { goBack } = this.props.navigation;
        return (
            <SafeAreaView style={{ flex:1}}>
                <ScrollView style={{backgroundColor:'white'}}>
                    <ImageBackground style={{backgroundColor:'white'}} source={this.state.backImages[this.state.airQualityLevel]} style={styles.backgroundImage}>
                        <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-evenly'
                        }}>    
                            <Col style={{ width:60,  flexDirection: 'row', 
                                    marginTop:10,
                                    }}>
                                <TouchableOpacity  style={{ width:60, height:60, marginRight:15, justifyContent:'center'}}  onPress={ () => goBack() } >
                                    <Icon name="ios-arrow-back" style={[{ alignSelf:'center'},globalStyles.headerLeftIcon]}/>
                                </TouchableOpacity>
                            </Col>       
                            <Col style={[styles.topBarData,{marginTop:25}]}>
                                <TouchableOpacity style={{ flexDirection:'row'}} onPress={ ()=> this.props.navigation.navigate('Boundary') }>
                                    <View style={styles.locationView}>
                                        <View style={styles.locationArrow}/> 
                                        <Text style={styles.location}>{
                                            ( this.props.currentBoundary.name == undefined ) ? strings.general.location : 
                                                this.props.currentBoundary.name.replace(".","").split("-")[0] }</Text>
                                        <Icon name="md-arrow-dropdown" style={ [{  fontSize:22, color:"white",  height: 25, width: 15, marginLeft:0, alignSelf:'center'}]}/>
                                    </View>
                                </TouchableOpacity>
                            </Col>
                            <Col style={{width:60}}></Col>
                        </View>                             
                        <View style={styles.treeCount}>
                            <ImageBackground source={this.state.rings[this.state.airQualityLevel]} style={styles.circle}>
                                { this.state.isLoadingMeasures == false &&
                                    <View>
                                        <Text style={styles.treeCountNumber}>{ this.state.trees }</Text>
                                        <Text style={styles.treeCountText}>{strings.main.trees}</Text>
                                    </View>
                                }
                                { this.state.isLoadingMeasures == true &&
                                    <View style={{ flex:1, alignContent:'center', justifyContent:'center' }}>
                                        <ActivityIndicator size="small" color="#ccc" />
                                    </View>
                                }
                            </ImageBackground>
                        </View>
                        <View style={styles.statusData}>
                            { this.state.isLoadingMeasures == false &&
                                <Col style={styles.statusDataElement}>
                                    <Image source={ this.state.tempImage } style={styles.barIcons}/>
                                    <Text style={styles.statusDataUpper}>{this.state.temp} { this.props.config != undefined && this.props.config.scales != undefined && this.props.config.scales.temp != undefined ? this.props.config.scales.temp : '' }</Text>
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
                    </ImageBackground>
                    { this.state.isLoading &&
                        <View style={styles.colonyBenefitsBackground}>
                            <Text style={styles.colonyBenefits}>{strings.benefits.colonyBenefits}</Text>
                        </View>
                    }
                    { !this.state.isLoading ?
                        <View>
                            <ViewShot ref="viewShot" options={{ format: "jpg", quality: 0.9 }}>
                                <View style={styles.colonyBenefitsBackground}>
                                    <Text style={styles.colonyBenefits}>{strings.benefits.colonyBenefits}</Text>
                                </View>
                                <View collapsable={false} style={styles.dataContainerTreeStats}>                                
                                        { this.state.treeStats != null &&
                                            <Row style={{flexDirection: 'row', paddingBottom: 15, marginTop: 15, alignItems: 'center', marginHorizontal: 15,}}>
                                                <Col size={25} >
                                                    <ImageWithAuth source={{uri: AppConstants.base + this.state.treeStats.imageUrl}} style={{ height: 45, width: 45, resizeMode:'contain', alignSelf: 'center'}} />
                                                </Col>
                                                <Col size={75} style={{flexDirection: 'row'}}>
                                                    { this.state.treeStats.body &&
                                                        <Text>
                                                            {this.state.treeStats.body.map((b,i )=> <Text key={i} style={[{ color: b.color, fontSize: b.size, lineHeight:24}, b.color=='green' ? { fontWeight:'bold'} : {}]}>{b.text}</Text>)}
                                                        </Text>
                                                    }
                                                </Col>
                                            </Row> 
                                        }
                                </View>
                                <View style={styles.dataContainer}>
                                    { this.state.mainStats &&
                                        this.state.mainStats.map(function(item, i){
                                            return( <View key={i} >
                                                        <Row style={[styles.benefitsRows] } >
                                                            <Col size={25} style={{alignItems: 'center',}}>
                                                                <View style={[styles.backFigure]}>
                                                                    <ImageWithAuth source={{uri: AppConstants.base + item.imageUrl}} style={{ height: 35, width: 35, resizeMode: 'contain',}}/>
                                                                </View>
                                                            </Col>
                                                            <Col size={75} style={{flexDirection: 'column'}}>
                                                                    <Text>{item.title.map((b,i )=> <Text key={i} style={[{ color: b.color, fontSize: b.size, lineHeight:24}, b.color=='green' ? { fontWeight:'bold'} : {}]}>{[b.text.trim(), ' ']}</Text>)}</Text>
                                                                    <Text style={{color: item.description.color, fontSize:item.description.size, lineHeight:24}}>{item.description.text}</Text>
                                                            </Col>
                                                        </Row>
                                                    </View> 
                                            )
                                        })
                                    }
                                </View>
                            </ViewShot> 
                            <View style={{marginTop:10}}></View>
                            { this.state.colStatsEnabled && false &&
                                <Row style={styles.benefitsColumns}>
                                    <ProgressCircle percent={this.state.colStatPercent} radius={45} borderWidth={12} color="#1986C8" shadowColor="#E8F1F6" bgColor="#fff" >
                                        <Text style={styles.percentage}>{this.state.colStatPercent}%</Text>
                                    </ProgressCircle>
                                    <View style={{alignItems: 'center', marginLeft: 30, marginRight: 30, marginTop: 20}}>
                                            <Text style={{textAlign: 'center', color:'#888888'}}>{strings.benefits.engagedFirst}
                                                <Text style={styles.boldText}>{this.state.colStatPercent}</Text>
                                                <Text style={styles.boldText}>{strings.benefits.percentage}</Text>
                                                {strings.benefits.engagedSecond}
                                            </Text>
                                    </View>
                                </Row>
                            }                                   
                            <Row style={[styles.benefitsColumns,{paddingLeft: 30, paddingRight: 30}]}>
                                <Text style={styles.benefitsQuestion}>{strings.benefits.dataQuestion}</Text>
                                <Text style={{ marginTop:10, color:'#888888'}}>{strings.benefits.visitWebApp}</Text>
                                <Button style={styles.webApp} onPress={ ()=>{ Linking.openURL(this.state.consoleWebUrl)}}>
                                    <Image source={require('../../resources/global/icon-link.png')} style={styles.webAppLink}/>
                                    <Text style={{color: 'white', marginLeft: 10}}>{strings.benefits.webApp}</Text>
                                </Button>
                            </Row>
                            <Row style={styles.shareColumn}>
                                <View style={styles.shareRow}>
                                    <Button style={{
                                        flexDirection: 'row', 
                                        backgroundColor: '#2CA06C', 
                                        borderRadius: 5, 
                                        paddingLeft: 20, 
                                        paddingRight: 20, 
                                        marginTop: 15, 
                                        marginBottom: 10, 
                                        width:200,
                                        justifyContent:'center'
                                    }} onPress={() => {
                                                setTimeout(() => {
                                                    this.refs.viewShot.capture().then(uri => {
                                                        RNFetchBlob.fs.readFile(uri, 'base64')
                                                        .then((data) => {
                                                            const imageBase64 = data;
                                                            const options = {
                                                                title: strings.appName + ' / ' + strings.benefits.colonyBenefits + ' / ' + this.props.currentBoundary.name,
                                                                message: strings.appName + ' / ' + strings.benefits.colonyBenefits + ' / ' + this.props.currentBoundary.name,
                                                                subject: strings.appName + ' / ' + strings.benefits.colonyBenefits + ' / ' + this.props.currentBoundary.name,
                                                                type: 'image/jpeg',
                                                                url: 'data:image/jpeg;base64,' + imageBase64
                                                              };
                                                            Share.open(options);
                                                        });
                                                    });
                                                },300);
                                            }}>
                                        <Text style={{color: 'white'}}>
                                        <Icon name="share-alt" style={{       
                                                    width: 15,
                                                    height: 20, 
                                                    fontSize:15,
                                                    color:"white"}}/> {strings.benefits.share}</Text>
                                    </Button>
                                </View>
                            </Row>                   
                        </View>
                        :
                        <View 
                            style={{ flex:1, justifyContent:'center'}}>
                            <ActivityIndicator style={{alignSelf:'center', marginTop:20}} size="large" color="#ccc" />
                        </View>
                    }
                    { _.has(this.props,'config.sources.aq') && _.has(this.props,'config.sources.temp') && 
                        <View style={{ marginBottom:10}}>
                            <Text style={{fontSize:9, margin:5, marginHorizontal:40, color:'#737373', lineHeight:15, textAlign:'center'}}>{ this.props.config.sources.temp.trim()}</Text>
                            <Text style={{fontSize:9, margin:5, marginHorizontal:40, color:'#737373', lineHeight:15, marginBottom:10, textAlign:'center'}}>{ this.props.config.sources.aq.trim()}</Text>
                        </View>
                    }
                </ScrollView>
            </SafeAreaView>
        )
    }
}
const styles = StyleSheet.create({
    backgroundImage: {
        flex:1,
        height:210,
        marginBottom:110,
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
        maxHeight:70
    },
    statusDataUpper: {
        fontSize: 22,
        color: '#737373'
    },
    statusDataLower: {
        fontSize: 12,
        color: '#737373',
    },
    dataContainerTreeStats: {
        backgroundColor: '#F6F6F9',
        paddingTop: 15,
        paddingBottom: 15,
        borderBottomColor: 'grey', 
        borderBottomWidth: 0.5,
    },
    dataContainer: {
        backgroundColor: '#fff',
        paddingLeft: 15,
        paddingRight: 15,
    },
    barIcons: {
        height: 30,
        width: 30,
    },
    dots: {
        height: 20,
        width: 75,
    },
    circle: {
        height: 160,
        width: 160,
    },
    colonyBenefits: {
        color: 'white', 
        alignSelf: 'center', 
        marginBottom: 5, 
        marginTop: 5,
    },
    colonyBenefitsBackground: {
        backgroundColor: '#737373', 
        marginTop: 30,
    },
    benefitsRows: {
        flexDirection: 'row', 
        alignItems: 'center',
        paddingTop: 20, 
        paddingBottom: 20, 
        borderBottomColor: 'grey', 
        borderBottomWidth: 0.5,
    },
    benefitsColumns: {
        flexDirection: 'column', 
        paddingBottom: 20, 
        marginTop: 20, 
        marginBottom: 20, 
        alignItems: 'center', 
        borderBottomColor: 'grey', 
        borderBottomWidth: 0.5,
    },
    share:{
        flex:1, 
        flexDirection:'row', 
        justifyContent: 'center', 
        alignItems:'center', 
        marginTop: 20,
        marginBottom:20,
    },
    socialShare:{
        width: 30, 
        height: 30, 
        resizeMode:'contain'
    },
    shareColumn: {
        flexDirection: 'column', 
        paddingBottom: 20, 
        marginTop: 0, 
        alignItems: 'center',
    },
    shareRow: {
        alignItems: 'center', 
        flexDirection: 'row', 
        marginTop: 10,
    },
    boldText: {
        color: '#888888', 
        fontWeight: 'bold', 
        fontSize: 20,
    },
    webApp: {
        flexDirection: 'row', 
        backgroundColor: '#2CA06C', 
        borderRadius: 5, 
        paddingLeft: 20, 
        paddingRight: 20, 
        marginTop: 15, 
        marginBottom: 10, 
        alignSelf: 'center',
        width:200
    },
    webAppLink: {
        alignSelf: 'center', 
        height: 20.5, 
        width: 24.375,
    },
    benefitsQuestion: {
        color: 'grey', 
        fontWeight: 'bold', 
        fontSize: 20, 
        textAlign: 'center',
    },
    percentage: {
        fontSize: 20, 
        fontWeight: '500', 
        color: '#484747',
    },
    backFigure: {
        backgroundColor: 'white', 
        height: 65, 
        width: 65, 
        borderRadius: 33, 
        justifyContent: 'center',
        alignItems:'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderBottomWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 1,
        marginLeft: 5,
        marginRight: 5,
        marginTop: 10,
    },
    location: {
        color:'white',
        fontSize: 16,
        marginTop:5,
        width: 160,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 24
    },
    locationArrow: {
        height: 15,
        width: 15,
        marginRight: 10,
        alignSelf:'center'
    },
});
const mapStateToProps = (state) => {
    return {
        loggedInStatus: state.loggedInStatus,
        mainMeasures: state.mainMeasures,
        currentBoundary: state.currentBoundary,
        config: state.config.application.dynamic,
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(Benefits);