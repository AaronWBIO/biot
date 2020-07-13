import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { Col, Grid, Row } from "react-native-easy-grid";
import {
    StyleSheet,
    Text,
    Image,
    TouchableOpacity,
    View,
    BackHandler,
    ActivityIndicator,
    Platform,
    Modal
} from 'react-native';
import { Item, Button, Icon, Input } from 'native-base';
import strings from '../../config/languages';
import {CameraKitCamera} from 'react-native-camera-kit';
import {PermissionsAndroid} from 'react-native';
import Svg,{ Line, Polygon } from 'react-native-svg';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import validationMessages from '../../config/validationMessages';
import CustomValidationComponent from '../../helpers/CustomValidationComponent';
import globalStyles from '../../styles/global';
import Orientation from 'react-native-orientation';

class CameraAssistant extends CustomValidationComponent {
    static navigationOptions = ({navigation}) => {
        const {params = {}} = navigation.state;
        return {
            title: strings.cameraAssistant.title,
            headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { 
                                if (params.currentIndex > 0) {
                                    params.back();
                                } else {
                                    navigation.goBack();
                                }
                            }}>
                            <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
                        </TouchableOpacity>,      
            headerRight: (<View />),
            headerTintColor: colors.white,
            headerStyle: globalStyles.headerStyle,
            headerTitleStyle: globalStyles.headerTitleStyle,
        }
    };
    messages = validationMessages;
    deviceLocale = this.props.lang != undefined ? this.props.lang : 'es';
    validations = {
        height: { required: true, numbers: true,  diameterMinNumber:true },
    }
    constructor(props) {
        super(props)
        this.state = {
            pinchWidth: 0,
            pinchHeight: 0,
            isMoving: false,
            isResizing1: false,
            isResizing2: false,
            showPinchInstructions: true,
            showOrientationAlert: false,
            pass: false,
            isTakingPhoto: false,
            formValid: false,
            isUserAuthorizedCamera: false,
            currentIndex: 0,
            height: '',
            image: {
                uri: ''
            },
            strokeOne: {
                drawed: false,
            },
            strokeTwo: {
                drawed: false,
            },
            strokeThree: {
                drawed: false,
            },
            strokeFour: {
                drawed: false,
            },
            alert: { show: false, view: <View/>},
        }  
        this.props.navigation.setParams({
            back: this.back.bind(this),
            currentIndex: 0,
        });
        this.messages[this.props.lang != undefined ? this.props.lang : 'es']['diameterMinNumber'] = strings.diameterMinNumber;
        this.rules.diameterMinNumber = (status,value) => {
            return value > 0;
        }
    }
    async componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
        await this.requestCameraPermission();
        this.props.setParam({ dim: undefined});
        Orientation.unlockAllOrientations();
        Orientation.addOrientationListener(this._orientationDidChange);
    }
    componentWillMount() {
        const initial = Orientation.getInitialOrientation();
        if (initial === 'PORTRAIT') {
            this.setState({showOrientationAlert:false});
        } else {
            this.setState({showOrientationAlert:true});
        }    
    }
    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
        Orientation.removeOrientationListener(this._orientationDidChange);
        Orientation.lockToPortrait();
    }
    _orientationDidChange = (orientation) => {
        if (orientation === 'PORTRAIT') {
            this.setState({showOrientationAlert:false});
        } else {
            if (this.state.currentIndex == 2) {
                this.back();
            }
            this.setState({showOrientationAlert:true});
        }
    };
    async requestCameraPermission() {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: strings.cameraAssistant.permissionTitle,
                        message: strings.cameraAssistant.message,
                        buttonNeutral: strings.cameraAssistant.buttonNeutral,
                        buttonNegative: strings.cameraAssistant.buttonNegative,
                        buttonPositive: strings.cameraAssistant.buttonPositive,
                    },
                );
                const granted1 = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: strings.cameraAssistant.permissionTitle,
                        message: strings.cameraAssistant.message,
                        buttonNeutral: strings.cameraAssistant.buttonNeutral,
                        buttonNegative: strings.cameraAssistant.buttonNegative,
                        buttonPositive: strings.cameraAssistant.buttonPositive,
                    },
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED && granted1 == PermissionsAndroid.RESULTS.GRANTED) {
                    this.setState({ isUserAuthorizedCamera:true })
                } else { }
            } catch (err) {
            }
        }
    }
    handleBackPress = () => {
        if (this.state.currentIndex > 0) {
            this.back();
        } else {
            this.props.navigation.goBack();
        }
        return true;
    }
    navigate() {
        this.state.currentIndex = this.state.currentIndex + 1;
        this.setState({pass: this.validateDrawStatus()});
        if (this.state.currentIndex  == 11) {
            // Calculate
            var pixelVal = Math.abs(this.state.strokeOne.y2 - this.state.strokeOne.y1);
            var pixelInM = this.state.height / pixelVal;
            var height = Math.abs(this.state.strokeTwo.y2 - this.state.strokeTwo.y1) * pixelInM;
            var diameter = Math.abs(this.state.strokeThree.x2 - this.state.strokeThree.x1) * pixelInM;
            var canopyHeight = Math.abs(this.state.strokeFour.x2 - this.state.strokeFour.x1) * pixelInM;
            this.props.setParam({ dim: { height, canopyHeight, diameter }});
            this.props.navigation.goBack();
        }
        this.setState({currentIndex: this.state.currentIndex});
        this.setState({showPinchInstructions:false});
        this.props.navigation.setParams({
            currentIndex: this.state.currentIndex
        });
        { this.state.currentIndex == 4  &&
            this.setState({strokeOne:{drawed:false}})
        }
        { this.state.currentIndex == 7  &&
            this.setState({strokeTwo:{drawed:false}})
        }
        { this.state.currentIndex == 8  &&
            this.setState({strokeThree:{drawed:false}})
        }
        { this.state.currentIndex == 9  &&
            this.setState({strokeFour:{drawed:false}})
        }
    }
    back() {
        var index = this.state.currentIndex - 1;
        this.setState({currentIndex: index});
        this.props.navigation.setParams({
            currentIndex: index
        });
        this.setState({showPinchInstructions:true});
        if ( index <= 4) {
            this.state.strokeOne = {drawed:false};
            this.state.strokeTwo = {drawed:false};
            this.state.strokeThree = {drawed:false};
            this.state.strokeFour = {drawed:false};
            this.setState({strokeOne: this.state.strokeOne});
            this.setState({strokeTwo: this.state.strokeTwo});
            this.setState({strokeThree: this.state.strokeThree});
            this.setState({strokeFour: this.state.strokeFour});
        }
        if ( index == 7) {
            this.state.strokeTwo = {drawed:false};
            this.state.strokeThree = {drawed:false};
            this.state.strokeFour = {drawed:false};
            this.setState({strokeTwo: this.state.strokeTwo});
            this.setState({strokeThree: this.state.strokeThree});
            this.setState({strokeFour: this.state.strokeFour});
        }
        if ( index == 8) {
            this.state.strokeThree = {drawed:false};
            this.state.strokeFour = {drawed:false};
            this.setState({strokeThree: this.state.strokeThree});
            this.setState({strokeFour: this.state.strokeFour});
        }
        if ( index == 9) {
            this.state.strokeFour = {drawed:false};
            this.setState({strokeFour: this.state.strokeFour});
        }
    }
    drawLine(type, stroke) {
        if (stroke == null)
            return null;
        if (type == "vertical") {
            var minY = Math.min(stroke.y2, stroke.y1);
            var maxY = Math.max(stroke.y2, stroke.y1);
            var triangleStartH = "" +
            stroke.x1 + "," + ( minY - 10 ) + " " + 
            ( stroke.x1 - 8 ) + "," + ( minY + 5 ) + " " +
            ( stroke.x1 + 8 ) + "," + ( minY + 5 ) + " " 
            var triangleEndH = "" +
            stroke.x1 + "," + ( maxY + 10 ) + " " + 
            ( stroke.x1 - 8 ) + "," + ( maxY - 5 ) + " " +
            ( stroke.x1 + 8 ) + "," + ( maxY - 5 ) + " " 
            ;
            return (
            <Svg style={{ position:'absolute', backgroundColor:'#ffffff00', left:0, top:0, right:0, bottom:0, zIndex:103 }}>
                <Polygon
                        points={ triangleStartH }
                        fill="#B8E986"
                        strokeWidth="1"
                />
                <Line
                        x1={ ( stroke.x1 - 20) }
                        y1={ ( minY - 10) }
                        x2={ ( stroke.x1 + 20) }
                        y2={ ( minY - 10) }
                        stroke="#B8E986"
                        strokeWidth="1"
                />
                <Line
                    x1={stroke.x1}
                    y1={stroke.y1}
                    x2={stroke.x2}
                    y2={stroke.y2}
                    stroke="#B8E986"
                    strokeWidth="3"
                />
                <Polygon
                        points={ triangleEndH }
                        fill="#B8E986"
                        strokeWidth="1"
                    />
                <Line
                        x1={ (stroke.x1 - 20) }
                        y1={ ( maxY + 10) }
                        x2={ ( stroke.x1 + 20) }
                        y2={ ( maxY + 10) }
                        stroke="#B8E986"
                        strokeWidth="1"
                    />  
            </Svg>
            );
        }
        if (type == "horizontal") {
            var minX = Math.min(stroke.x2, stroke.x1);
            var maxX = Math.max(stroke.x2, stroke.x1);
            var triangleStartH = "" +
            ( minX - 10 ) + "," +  stroke.y1 + " " + 
            ( minX + 5  ) + "," + ( stroke.y1 - 8 )  + " " +
            ( minX + 5  ) + "," + ( stroke.y1 + 8 )+ " " 
            var triangleEndH = "" +
            ( maxX + 10 ) + "," +  stroke.y1 + " " + 
            ( maxX - 5  ) + "," + ( stroke.y1 - 8 )  + " " +
            ( maxX - 5  ) + "," + ( stroke.y1 + 8 )+ " " 
            return (
            <Svg style={{ flex: 1, position:'absolute', left:0, top:0, right:0, bottom:0, zIndex:103}}>
                <Polygon
                        points={ triangleStartH }
                        fill="#B8E986"
                        strokeWidth="1"
                />
                <Line
                        x1={ ( minX - 10 ) }
                        y1={ ( stroke.y1 - 20 ) }
                        x2={ ( minX - 10 ) }
                        y2={ ( stroke.y1 + 20 )}
                        stroke="#B8E986"
                        strokeWidth="1"
                />
                <Line
                    x1={stroke.x1}
                    y1={stroke.y1}
                    x2={stroke.x2}
                    y2={stroke.y2}
                    stroke="#B8E986"
                    strokeWidth="3"
                />
                <Polygon
                        points={ triangleEndH }
                        fill="#B8E986"
                        strokeWidth="1"
                    />
                <Line
                        x1={ ( maxX + 10 ) }
                        y1={ ( stroke.y1 - 20 ) }
                        x2={ ( maxX + 10 ) }
                        y2={ ( stroke.y1 + 20 )}
                        stroke="#B8E986"
                        strokeWidth="1"
                />
            </Svg>
            );
        }
    }
    render() {
        return ( 
        <View style={{flex:1}} keyboardShouldPersistTaps={'handled'}>
            <Modal supportedOrientations={['portrait', 'landscape']} transparent={true} visible={this.state.showOrientationAlert}>
                <View style={{flex:1, backgroundColor:'#000000', opacity: 0.95, width:'100%', height:'100%', justifyContent:'center'}}>
                    <Text style={[ globalStyles.text, { color:'white', alignSelf:'center', width:250, textAlign:'center'}]}>{ strings.cameraAssistant.orientationAlert }</Text>
                </View>
            </Modal> 
            { this.state.currentIndex == 0 && 
                <View style={styles.slideDescription}>
                    <Text style={{ fontSize:20, width:250, textAlign:'center', marginBottom:20, color:'#888888', lineHeight:25 }}>{ strings.cameraAssistant.welcome }</Text>
                    <Image source={require('../../resources/trees/camera-assistant/step-1.png')} style= {{height:112, width: 98, marginBottom:50, marginTop:50}}/>
                    <View style={styles.buttonContainer}>
                        <Button block success style={ styles.continueButton }  onPress={() => this.navigate() }>
                            <Text style= { styles.continueLabel }>{ strings.nextLabel }</Text>
                        </Button>
                    </View>
                </View>
            }
            { this.state.currentIndex == 1 && 
                <View style={styles.slideDescription}>
                    <Text style={{ fontSize:20, width:200, textAlign:'center', marginBottom:20,color:'#888888', fontWeight:'bold' }}>Paso 1</Text>
                    <Text style={{ fontSize:17, marginLeft:40, marginRight:40, marginBottom:10,color:'#888888', textAlign:'center', width:270, lineHeight:25}}>
                        { strings.cameraAssistant.slide1 }
                    </Text>
                    <Image source={require('../../resources/trees/camera-assistant/step-2.png')} style= {{height:100, width: 112, marginBottom:50, marginTop:50}}/>
                    <View style={styles.buttonContainer}>
                        <Button block success style={ styles.continueButton }  onPress={() => this.navigate()}>
                            <Text style= { styles.continueLabel }>{ strings.nextLabel }</Text>
                        </Button>
                    </View>
                </View>
            }
            { ( this.state.currentIndex == 2 ) &&
                this.renderCamera()
            }
            { this.state.currentIndex == 3 && 
                <View style={styles.slideDescription}>
                    <Text style={{ fontSize:20, width:200, textAlign:'center', marginBottom:10,color:'#888888', fontWeight:'bold' }}>Paso 2</Text>
                    <Text style={{ fontSize:17, marginLeft:40, marginRight:40, marginBottom:10,color:'#888888', textAlign:'center', width:270, lineHeight:25}}>{ strings.cameraAssistant.slide2 }</Text>
                    <Image source={require('../../resources/trees/camera-assistant/step-3.png')} style= {{height:106, width: 103, marginBottom:20}}/>
                    <View style={styles.buttonContainer}>
                        <Button block success style={ styles.continueButton }  onPress={() => this.navigate()}>
                            <Text style= { styles.continueLabel }>{ strings.nextLabel }</Text>
                        </Button>
                    </View>
                    <View style={[styles.buttonContainer,{marginTop:0, paddingTop:0}]}>
                        <Button block transparent style={ styles.backButton }  onPress={() => this.back() }>
                            <Text style= { styles.backLabel }>{ strings.backLabel }</Text>
                        </Button>
                    </View>
                </View>
            }
            { ( this.state.currentIndex == 4 ) &&
                this.renderCanvas()
            }   
            { ( this.state.currentIndex == 4 && this.state.showPinchInstructions ) && 
                <View style={{ backgroundColor:'#000000', opacity:0.9, position:'absolute', top:0, left:0, right:0, bottom:0}}>
                    <Grid>
                        <Row style={{ justifyContent:'center', margin:24}}>
                            <Text style={{ justifyContent:'center', color:'white', width:200, textAlign:'center', lineHeight:20, alignSelf:'center'}}>{ strings.cameraAssistant.pinchDesc1 }</Text>
                        </Row>
                        <Row style={{ justifyContent:'center',height:86}}>
                            <Image source={require('../../resources/trees/camera-assistant/icon-1-deliver.png')} style= {{height:86, width: 70}}/>
                        </Row>
                        <Row style={{ justifyContent:'center', margin:24}}>
                            <Text style={{ justifyContent:'center', color:'white', width:220, textAlign:'center', lineHeight:20, alignSelf:'center'}}>{ strings.cameraAssistant.pinchDesc2 }</Text>
                        </Row>
                        <Row style={{ justifyContent:'center', height:124}}>
                            <Image source={require('../../resources/trees/camera-assistant/icon-2-deliver.png')} style= {{height:124, width: 104, alignSelf:'center'}}/>
                        </Row>
                        <Row style={{ justifyContent:'center'}}>
                            <View style={{ 
                                width:'100%', justifyContent: "center", alignItems: "center", position:'absolute', bottom:10,
                                zIndex:200, elevation:200
                            }}>                                
                                <Button onPress={ async (e) => {
                                    this.setState({showPinchInstructions:false});
                                }} style={{
                                    justifyContent:'center',
                                    alignSelf: 'center',
                                    marginTop:10,
                                    backgroundColor: 'white',
                                    width : 220,
                                    height : 40,     
                                    shadowOffset: { width: 5, height: 5 },
                                    shadowColor: "grey",
                                    shadowOpacity: 0.5,
                                    shadowRadius: 5,
                                    borderRadius:10,
                                    marginBottom:10
                                }} >
                                    <Text style={{ fontSize:12, color:'#2CA06C' }}>{ strings.tree.ok }</Text>
                                </Button>
                            </View>                        
                        </Row>
                    </Grid>
                </View>
            }
            { ( this.state.currentIndex == 5 ) && 
                <View style={styles.slideDescription}>
                    <Text style={{ fontSize:20, width:200, textAlign:'center', marginBottom:10,color:'#888888', fontWeight:'bold' }}>Paso 3</Text>
                    <Text style={{ fontSize:17, marginLeft:40, marginRight:40, marginBottom:10,color:'#888888', textAlign:'center', width:270, lineHeight:25}}>
                        { strings.cameraAssistant.slide3 }
                    </Text>
                    <Item style={{ height:40, width:230 }}>
                        <Input placeholder="0 m" style={{ textAlign:'right', color:'#B9B9B9', fontSize:14}} 
                                placeholderTextColor = {'#B9B9B9'}
                                ref="height"
                                keyboardType="decimal-pad"
                                ref={component => this._height = component}
                                value= { this.state.height }
                                onChangeText={ (height) => {
                                    this.state.height = height;
                                    this.setState({height});
                                } }/>
                    </Item>
                    { this.isFieldInError('height') && this.getErrorsInField('height').map((errorMessage, i) => {
                            return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                    })}
                    <View style={styles.buttonContainer}>
                    <Button block success style={ styles.continueButton }  onPress={() => {
                                var valid = this.validate(this.validations);    
                                this.setState({ formValid:valid });       
                                if (valid) {
                                    this.navigate();
                                } 
                            }}>
                        <Text style= { styles.continueLabel }>{ strings.nextLabel }</Text>
                    </Button>
                    </View>
                    <View style={styles.buttonContainer}>
                        <Button block transparent style={ styles.backButton }  onPress={() => this.back() }>
                            <Text style= { styles.backLabel }>{ strings.backLabel }</Text>
                        </Button>
                    </View>
                </View>
            }
            { this.state.currentIndex == 6 && 
                <View style={styles.slideDescription}>
                    <Text style={{ fontSize:20, width:200, textAlign:'center', marginBottom:10,color:'#888888', fontWeight:'bold' }}>Paso 4</Text>
                    <Text style={{ fontSize:17, marginLeft:40, marginRight:40, marginBottom:20,color:'#888888', textAlign:'center', width:270, lineHeight:25}}>
                        { strings.cameraAssistant.slide4 }
                    </Text>
                    <Image source={require('../../resources/trees/camera-assistant/step-4.png')} style= {{height:123, width: 125, marginBottom:20}}/>
                    <View style={styles.buttonContainer}>
                        <Button block success style={ styles.continueButton }  onPress={() => this.navigate()}>
                            <Text style= { styles.continueLabel }>{ strings.nextLabel }</Text>
                        </Button>
                    </View>
                    <View style={styles.buttonContainer}>
                        <Button block transparent style={ styles.backButton }  onPress={() => this.back() }>
                            <Text style= { styles.backLabel }>{ strings.backLabel }</Text>
                        </Button>
                    </View>
                </View>
            }
            { ( this.state.currentIndex >= 7 && this.state.currentIndex <=9 ) &&
                this.renderCanvas()
            }
            { this.state.currentIndex == 10 && 
                <View style={styles.slideDescription}>
                    <Text style={{ fontSize:20, width:200, textAlign:'center', marginBottom:10,color:'#888888', fontWeight:'bold' }}>Paso 5</Text>
                    <Text style={{ fontSize:17, marginLeft:40, marginRight:40, marginBottom:20,color:'#888888', textAlign:'center', width:270, lineHeight:25}}>
                        { strings.cameraAssistant.slide5 }
                    </Text>
                    <Image source={require('../../resources/trees/camera-assistant/measure-icon.png')} resizeMode="contain" style= {{height:57, width: 85, marginBottom:20}}/>
                    <View style={styles.buttonContainer}>
                        <Button block success style={ styles.continueButton }  onPress={() => this.navigate()} >
                            <Text style= { styles.continueLabel }>{ strings.finish }</Text>
                        </Button>
                    </View>
                </View>
            }

            {  !this.state.isMoving && !this.state.isResizing1 && !this.state.isResizing2 &&
               ( ( this.state.currentIndex == 4 && !this.state.showPinchInstructions ) || (this.state.currentIndex >= 7 && this.state.currentIndex <=9)) && this.state.pass &&   
                <View 
                    style={{ 
                    width:'100%', justifyContent: "center", alignItems: "center", position:'absolute', bottom:10,
                    zIndex:1000, elevation:105
                }}>              
                    <Button  
                        onPress={ (e) => { 
                            var pass = this.validateDrawStatus();
                            if (!pass){
                                this.state.alert.show = true;
                                this.state.alert.view = <View style={ globalStyles.alertContainer }>
                                    <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/>  
                                    <Text style={ globalStyles.alertText}>
                                        { this.state.currentIndex == 4  &&
                                            <Text>{ strings.cameraAssistant.slide9 }</Text>
                                        }
                                        { this.state.currentIndex == 7  &&
                                            <Text>{ strings.cameraAssistant.slide10 }</Text>
                                        }
                                        { this.state.currentIndex == 8  &&
                                            <Text>{ strings.cameraAssistant.slide7 }</Text>
                                        }
                                        { this.state.currentIndex == 9  &&
                                            <Text>{ strings.cameraAssistant.slide8 }</Text>
                                        }
                                    </Text>
                                </View>;
                                this.setState({
                                    alert: this.state.alert
                                });
                            } else {
                                this.navigate(); 
                            }
                    }} style={{
                                alignSelf: 'center',
                                marginTop:10,
                                justifyContent:'center',
                                alignSelf: 'center',
                                backgroundColor: 'white',
                                width : 220,
                                height : 40,  
                                shadowOffset: { width: 5, height: 5 },
                                shadowColor: "grey",
                                shadowOpacity: 0.5,
                                shadowRadius: 5,
                                marginBottom:10
                    }} >
                        <Text style={{ fontSize:12, color:'#2CA06C' }}>{ strings.tree.addTreeContinueButton }</Text>
                    </Button>
                </View>
                }
                { this.state.alert.show &&
                <View style={{
                        width:'100%', justifyContent: "center", alignItems: "center", position:'absolute', bottom:10, top:0,
                        zIndex:105, elevation:105
                    }}> 
                    <AwesomeAlertPlus
                        style={{ position:'absolute', top:0, bottom:0, right:0, left: 0, zIndex:2000}}
                        show={ this.state.alert.show }
                        showProgress={false}
                        closeOnTouchOutside={true}
                        closeOnHardwareBackPress={false}
                        showCancelButton={false}
                        showConfirmButton={true}
                        confirmText={strings.continueLabel }
                        confirmButtonColor="#41B07C"
                        confirmButtonStyle = {styles.alertButton}
                        onCancelPressed={() => {
                            this.state.alert.show = false;
                            this.setState({
                                alert: this.state.alert
                            });             
                        }}
                        onConfirmPressed={() => {
                            this.state.alert.show = false;
                            this.setState({
                                alert: this.state.alert
                            });
                        }}
                        customView = { this.state.alert.view }
                    />    
                </View>
                }
        </View>
        )  
    }
    validateDrawStatus() {
        var pass = false;
        if ( this.state.currentIndex == 4 ) {
            pass = this.state.strokeOne.y1 > 0 && this.state.strokeOne.y2 > 0 &&
            this.state.strokeOne.y1 != this.state.strokeOne.y2;
        }
        if ( this.state.currentIndex == 7 ) {
            pass = this.state.strokeTwo.y1 > 0 && this.state.strokeTwo.y2 > 0 &&
            this.state.strokeTwo.y1 != this.state.strokeTwo.y2;
        }
        if ( this.state.currentIndex == 8 ) {
            pass = this.state.strokeThree.x1 > 0 && this.state.strokeThree.x2 > 0 &&
            this.state.strokeThree.x1 != this.state.strokeThree.x2;
        }
        if ( this.state.currentIndex == 9 ) {
            pass = this.state.strokeFour.x1 > 0 && this.state.strokeFour.x2 > 0 &&
            this.state.strokeFour.x1 != this.state.strokeFour.x2;
        }
        return pass;
    }
    renderCanvas() {
        return (                    
            <View 
                style={{ flex: 1}} 
                ref="rootView"
                onLayout={(event) => {
                    this.setState({pinchWidth: event.nativeEvent.layout.width, pinchHeight: event.nativeEvent.layout.height});
                }}
                onTouchStart={(e) => {
                    var x = e.nativeEvent.locationX;
                    var y = e.nativeEvent.locationY;
                    if ( this.state.currentIndex == 4  && this.state.strokeOne.drawed == false) {
                        if (y >= this.state.pinchHeight - 80 || y <= 100) {
                            y = this.state.pinchHeight / 2;
                            x = this.state.pinchWidth / 2;
                        }
                        this.state.strokeOne.x1 = x;
                        this.state.strokeOne.y1 = y;
                        this.state.strokeOne.x2 = x;
                        this.state.strokeOne.y2 = y + 20;
                        this.setState({strokeOne:this.state.strokeOne});
                    }
                    if ( this.state.currentIndex == 7 && this.state.strokeTwo.drawed == false) {
                        if (y >= this.state.pinchHeight - 80 || y <= 100) {
                            y = this.state.pinchHeight / 2;
                            x = this.state.pinchWidth / 2;
                        }
                        this.state.strokeTwo.x1 = x;
                        this.state.strokeTwo.y1 = y;
                        this.state.strokeTwo.x2 = x;
                        this.state.strokeTwo.y2 = y + 20;
                        this.setState({strokeTwo:this.state.strokeTwo});
                    }
                    if ( this.state.currentIndex == 8 && this.state.strokeThree.drawed == false) {
                        if (y >= this.state.pinchHeight - 80 || y <= 100) {
                            y = this.state.pinchHeight / 2;
                            x = this.state.pinchWidth / 2;
                        }
                        this.state.strokeThree.x1 = x;
                        this.state.strokeThree.y1 = y;
                        this.state.strokeThree.x2 = x + 20;
                        this.state.strokeThree.y2 = y;
                        this.setState({strokeThree:this.state.strokeThree});
                    }
                    if ( this.state.currentIndex == 9 && this.state.strokeFour.drawed == false) {
                        if (y >= this.state.pinchHeight - 80 || y <= 100) {
                            y = this.state.pinchHeight / 2;
                            x = this.state.pinchWidth / 2;
                        }
                        this.state.strokeFour.x1 = x;
                        this.state.strokeFour.y1 = y;
                        this.state.strokeFour.x2 = x + 20;
                        this.state.strokeFour.y2 = y;
                        this.setState({strokeFour:this.state.strokeFour});
                    }
                }}
                onTouchEnd={(e) => {
                    if ( this.state.currentIndex == 4 ) {
                        this.setState({strokeOne:this.state.strokeOne});
                        this.state.strokeOne.drawed = true;
                    }
                    if ( this.state.currentIndex == 7 ) {
                        this.setState({strokeTwo:this.state.strokeTwo});
                        this.state.strokeTwo.drawed = true;
                    }
                    if ( this.state.currentIndex == 8 ) {
                        this.setState({strokeThree:this.state.strokeThree});
                        this.state.strokeThree.drawed = true;
                    }
                    if ( this.state.currentIndex == 9 ) {
                        this.setState({strokeFour:this.state.strokeFour});
                        this.state.strokeFour.drawed = true;
                    }
                    this.state.isMoving = false;
                    this.state.isResizing1 = false;
                    this.state.isResizing2 = false;
                }}
                onTouchMove={(e) => {
                    var x = e.nativeEvent.locationX;
                    var y = e.nativeEvent.locationY;
                    // Draw stroke 1
                    if ( this.state.currentIndex == 4 && this.state.strokeOne.drawed == false) {
                        this.state.strokeOne.x2 = this.state.strokeOne.x1;
                        this.state.strokeOne.y2 = y;
                        if (this.state.strokeOne.y1 > this.state.strokeOne.y2 ) {
                            this.state.strokeOne.y2 = this.state.strokeOne.y1 + 80;
                        }
                        if (this.state.strokeOne.y2 >= this.state.pinchHeight - 80)
                            this.state.strokeOne.y2 = this.state.pinchHeight - 80;
                        this.setState({strokeOne:this.state.strokeOne});
                    }
                    // Draw stroke 2
                    if ( this.state.currentIndex == 7 && this.state.strokeTwo.drawed == false) {
                        this.state.strokeTwo.x2 = this.state.strokeTwo.x1;
                        this.state.strokeTwo.y2 = y;
                        if (this.state.strokeTwo.y1 > this.state.strokeTwo.y2 ) {
                            this.state.strokeTwo.y2 = this.state.strokeTwo.y1 + 80;
                        }
                        if (this.state.strokeTwo.y2 >= this.state.pinchHeight - 80)
                            this.state.strokeTwo.y2 = this.state.pinchHeight - 80;
                        this.setState({strokeTwo:this.state.strokeTwo});
                    }
                    // Draw stroke 3
                    if ( this.state.currentIndex == 8 && this.state.strokeThree.drawed == false) {
                        this.state.strokeThree.y2 = this.state.strokeThree.y1;
                        this.state.strokeThree.x2 = x;
                        if (this.state.strokeThree.x1 > this.state.strokeThree.x2 ) {
                            this.state.strokeThree.x2 = this.state.strokeThree.x1 + 80;
                        }
                        if (this.state.strokeThree.y1 > this.state.strokeThree.y2 ) {
                            this.state.strokeThree.y2 = this.state.strokeThree.y1 + 80;
                        }
                        if (this.state.strokeThree.y2 >= this.state.pinchHeight - 80)
                            this.state.strokeThree.y2 = this.state.pinchHeight - 80;
                        this.setState({strokeThree:this.state.strokeThree});
                    }
                    // Draw stroke 4
                    if ( this.state.currentIndex == 9 && this.state.strokeFour.drawed == false) {
                        this.state.strokeFour.y2 = this.state.strokeFour.y1;
                        this.state.strokeFour.x2 = x;
                        if (this.state.strokeFour.x1 > this.state.strokeFour.x2 ) {
                            this.state.strokeFour.x2 = this.state.strokeFour.x1 + 80;
                        }
                        if (this.state.strokeFour.y1 > this.state.strokeFour.y2 ) {
                            this.state.strokeFour.y2 = this.state.strokeFour.y1 + 80;
                        }
                        if (this.state.strokeFour.y2 >= this.state.pinchHeight - 80)
                            this.state.strokeFour.y2 = this.state.pinchHeight - 80;
                        this.setState({strokeFour:this.state.strokeFour});
                    }
                    
                    // Move stroke 1 or alter
                     if (this.state.currentIndex == 4 && this.state.strokeOne.drawed == true) {
                        // Move if is in center
                        if (!this.state.isResizing1 && !this.state.isResizing2) {
                            if (this.state.isMoving || (this.state.strokeOne.x1 - 30 < x && this.state.strokeOne.x1 + 30 > x && 
                                this.state.strokeOne.y1 + 20  < y && this.state.strokeOne.y2 - 20  > y)) {
                                this.state.strokeOne.x1 = x;
                                this.state.strokeOne.x2 = x;
                                var height = this.state.strokeOne.y2 - this.state.strokeOne.y1;
                                this.state.strokeOne.y1 = y - (height/ 2);
                                this.state.strokeOne.y2 = y + (height/ 2);  
                                // Top constraints
                                if (this.state.strokeOne.y1 <= 80) {
                                    this.state.strokeOne.y1 = 80;
                                    this.state.strokeOne.y2 = 80 + height;
                                } 
                                // Bottom constraints
                                if (this.state.strokeOne.y2 >= this.state.pinchHeight - 80) {
                                    this.state.strokeOne.y1 = this.state.pinchHeight - 80 - height;
                                    this.state.strokeOne.y2 = this.state.pinchHeight - 80;
                                }
                                this.setState({strokeOne:this.state.strokeOne});
                                this.state.isMoving = true;
                            }
                        }
                        // Resize by side
                        if (!this.state.isMoving) {
                            if (this.state.isResizing1 || this.state.strokeOne.x1 - 30 < x && this.state.strokeOne.x1 + 30 > x && 
                                this.state.strokeOne.y1 - 15  < y && this.state.strokeOne.y1 + 15  > y) {
                                if ((this.state.strokeOne.y2 - y) > 10) {
                                    this.state.strokeOne.y1 = y;
                                    if (this.state.strokeOne.y1 <= 80)
                                        this.state.strokeOne.y1 = 80;
                                    this.state.isResizing1 = true;
                                    this.setState({strokeOne:this.state.strokeOne});
                                }
                            }
                            if (this.state.isResizing2 || this.state.strokeOne.x1 - 30 < x && this.state.strokeOne.x1 + 30 > x && 
                                this.state.strokeOne.y2 - 15  < y && this.state.strokeOne.y2 + 15  > y) {
                                if ((y - this.state.strokeOne.y1) > 10) {
                                    this.state.strokeOne.y2 = y;
                                    if (this.state.strokeOne.y2 >= this.state.pinchHeight - 80)
                                        this.state.strokeOne.y2 = this.state.pinchHeight - 80;
                                    this.state.isResizing2 = true;
                                    this.setState({strokeOne:this.state.strokeOne});
                                }
                            }
                        }
                    }
                    // Move stroke 2
                    if (this.state.currentIndex == 7 && this.state.strokeTwo.drawed == true) {
                        // Move if is in center
                        if (!this.state.isResizing1 && !this.state.isResizing2) {
                            if (this.state.isMoving || (this.state.strokeTwo.x1 - 30 < x && this.state.strokeTwo.x1 + 30 > x && 
                                this.state.strokeTwo.y1 + 20  < y && this.state.strokeTwo.y2 - 20  > y)) {
                                this.state.strokeTwo.x1 = x;
                                this.state.strokeTwo.x2 = x;
                                var height = this.state.strokeTwo.y2 - this.state.strokeTwo.y1;
                                this.state.strokeTwo.y1 = y - (height/ 2);
                                this.state.strokeTwo.y2 = y + (height/ 2);  
                                // Top constraints
                                if (this.state.strokeTwo.y1 <= 80) {
                                    this.state.strokeTwo.y1 = 80;
                                    this.state.strokeTwo.y2 = 80 + height;
                                } 
                                // Bottom constraints
                                if (this.state.strokeTwo.y2 >= this.state.pinchHeight - 80) {
                                    this.state.strokeTwo.y1 = this.state.pinchHeight - 80 - height;
                                    this.state.strokeTwo.y2 = this.state.pinchHeight - 80;
                                }
                                this.setState({strokeTwo:this.state.strokeTwo});
                                this.state.isMoving = true;
                            }
                        }
                        // Resize by side
                        if (!this.state.isMoving) {
                            if (this.state.isResizing1 || this.state.strokeTwo.x1 - 30 < x && this.state.strokeTwo.x1 + 30 > x && 
                                this.state.strokeTwo.y1 - 15  < y && this.state.strokeTwo.y1 + 15  > y) {
                                if ((this.state.strokeTwo.y2 - y) > 10) {
                                    this.state.strokeTwo.y1 = y;
                                    if (this.state.strokeTwo.y1 <= 80)
                                        this.state.strokeTwo.y1 = 80;
                                    this.state.isResizing1 = true;
                                    this.setState({strokeTwo:this.state.strokeTwo});
                                }
                            }
                            if (this.state.isResizing2 || this.state.strokeTwo.x1 - 30 < x && this.state.strokeTwo.x1 + 30 > x && 
                                this.state.strokeTwo.y2 - 15  < y && this.state.strokeTwo.y2 + 15  > y) {
                                if ((y - this.state.strokeTwo.y1) > 10) {
                                    this.state.strokeTwo.y2 = y;
                                    if (this.state.strokeTwo.y2 >= this.state.pinchHeight - 80)
                                        this.state.strokeTwo.y2 = this.state.pinchHeight - 80;
                                    this.state.isResizing2 = true;
                                    this.setState({strokeTwo:this.state.strokeTwo});
                                }
                            }
                        }
                    }

                    // Move stroke 3
                    if (this.state.currentIndex == 8 && this.state.strokeThree.drawed == true) {
                        // Move if is in center
                        if (!this.state.isResizing1 && !this.state.isResizing2) {
                            if (this.state.isMoving || (this.state.strokeThree.y1 - 30 < y && this.state.strokeThree.y1 + 30 > y && 
                                this.state.strokeThree.x1 + 20  < x && this.state.strokeThree.x2 -  20  > x)) {
                                this.state.strokeThree.y1 = y;
                                this.state.strokeThree.y2 = y;
                                var width = this.state.strokeThree.x2 - this.state.strokeThree.x1;
                                this.state.strokeThree.x1 = x - (width/ 2);
                                this.state.strokeThree.x2 = x + (width/ 2);  
                                // Left constraints
                                if (this.state.strokeThree.x1 <= 15) {
                                    this.state.strokeThree.x1 = 15;
                                    this.state.strokeThree.x2 = 15 + width;
                                } 
                                // Right constraints
                                if (this.state.strokeThree.x2 >= this.state.pinchWidth - 15) {
                                    this.state.strokeThree.x1 = this.state.pinchWidth - width - 15;
                                    this.state.strokeThree.x2 = this.state.pinchWidth - 15;
                                }
                                if (this.state.strokeThree.y1  < 100) {
                                    this.state.strokeThree.y1 = 100;
                                    this.state.strokeThree.y2 = 100;
                                }
                                if (this.state.strokeThree.y1 >= this.state.pinchHeight - 80) {
                                    this.state.strokeThree.y1 = this.state.pinchHeight - 80;
                                    this.state.strokeThree.y2 = this.state.pinchHeight - 80;
                                }
                                this.setState({strokeThree:this.state.strokeThree});
                                this.state.isMoving = true;
                            }
                        }
                        // Resize by side
                        if (!this.state.isMoving) {
                            if (this.state.isResizing1 || this.state.strokeThree.y1 - 30 < y && this.state.strokeThree.y1 + 30 > y && 
                                this.state.strokeThree.x1 - 15  < x && this.state.strokeThree.x1 + 15  > x) {
                                if ((this.state.strokeThree.x2 - x) > 10) {
                                    this.state.strokeThree.x1 = x;
                                    if (this.state.strokeThree.x1 <= 15)
                                        this.state.strokeThree.x1 = 15;
                                    this.state.isResizing1 = true;
                                    this.setState({strokeThree:this.state.strokeThree});
                                }
                            }
                            if (this.state.isResizing2 || this.state.strokeThree.y1 - 30 < y && this.state.strokeThree.y1 + 30 > y && 
                                this.state.strokeThree.x2 - 15  < x && this.state.strokeThree.x2 + 15  > x) {
                                if ((x - this.state.strokeThree.x1) > 10) {
                                    this.state.strokeThree.x2 = x;
                                    if (this.state.strokeThree.x2 >= this.state.pinchWidth - 15)
                                        this.state.strokeThree.x2 = this.state.pinchWidth - 15;
                                    this.state.isResizing2 = true;
                                    this.setState({strokeThree:this.state.strokeThree});
                                }
                            }
                        }
                    }

                    // Move stroke 4
                    if (this.state.currentIndex == 9 && this.state.strokeFour.drawed == true) {
                        // Move if is in center
                        if (!this.state.isResizing1 && !this.state.isResizing2) {
                            if (this.state.isMoving || (this.state.strokeFour.y1 - 30 < y && this.state.strokeFour.y1 + 30 > y && 
                                this.state.strokeFour.x1 + 20  < x && this.state.strokeFour.x2 -  20  > x)) {
                                this.state.strokeFour.y1 = y;
                                this.state.strokeFour.y2 = y;
                                var width = this.state.strokeFour.x2 - this.state.strokeFour.x1;
                                this.state.strokeFour.x1 = x - (width/ 2);
                                this.state.strokeFour.x2 = x + (width/ 2);  
                                // Left constraints
                                if (this.state.strokeFour.x1 <= 15) {
                                    this.state.strokeFour.x1 = 15;
                                    this.state.strokeFour.x2 = 15 + width;
                                } 
                                // Right constraints
                                if (this.state.strokeFour.x2 >= this.state.pinchWidth - 15) {
                                    this.state.strokeFour.x1 = this.state.pinchWidth - width - 15;
                                    this.state.strokeFour.x2 = this.state.pinchWidth - 15;
                                }
                                if (this.state.strokeFour.y1  < 100) {
                                    this.state.strokeFour.y1 = 100;
                                    this.state.strokeFour.y2 = 100;
                                }
                                if (this.state.strokeFour.y1 >= this.state.pinchHeight - 80) {
                                    this.state.strokeFour.y1 = this.state.pinchHeight - 80;
                                    this.state.strokeFour.y2 = this.state.pinchHeight - 80;
                                }
                                this.setState({strokeFour:this.state.strokeFour});
                                this.state.isMoving = true;
                            }
                        }
                        // Resize by side
                        if (!this.state.isMoving) {
                            if (this.state.isResizing1 || this.state.strokeFour.y1 - 30 < y && this.state.strokeFour.y1 + 30 > y && 
                                this.state.strokeFour.x1 - 15  < x && this.state.strokeFour.x1 + 15  > x) {
                                if ((this.state.strokeFour.x2 - x) > 10) {
                                    this.state.strokeFour.x1 = x;
                                    if (this.state.strokeFour.x1 <= 15)
                                        this.state.strokeFour.x1 = 15;
                                    this.state.isResizing1 = true;
                                    this.setState({strokeFour:this.state.strokeFour});
                                }
                            }
                            if (this.state.isResizing2 || this.state.strokeFour.y1 - 30 < y && this.state.strokeFour.y1 + 30 > y && 
                                this.state.strokeFour.x2 - 15  < x && this.state.strokeFour.x2 + 15  > x) {
                                if ((x - this.state.strokeFour.x1) > 10) {
                                    this.state.strokeFour.x2 = x;
                                    if (this.state.strokeFour.x2 >= this.state.pinchWidth - 15)
                                        this.state.strokeFour.x2 = this.state.pinchWidth - 15;
                                    this.state.isResizing2 = true;
                                    this.setState({strokeFour:this.state.strokeFour});
                                }
                            }
                        }
                    }
                    this.setState({  pass: this.validateDrawStatus()});
                }}>          
                <Grid style={{width:'100%', 
                    zIndex:1000,
                    elevation:1000,
                    shadowOffset: { width: 5, height: 5 },
                    shadowColor: "grey",
                    shadowOpacity: 0.5,
                    shadowRadius: 5,
                    elevation:5,
                    backgroundColor:'white',
                    height:70, flexDirection:'row', position:'absolute',left:0,top:0,right:0, elevation:100, zIndex:100}}>
                    <Col style={{width: 45, margin:15, marginLeft:20, marginRight:10}}>
                        <View style={{ borderColor:'#91c484', backgroundColor:'white', borderWidth:3, width:45, height:45, borderRadius:50, position:'absolute',alignSelf:'center', justifyContent:'center'}}>
                            <Text style={{ color:'#737373', textAlign:'center', fontSize:8, fontWeight:'900', marginTop:5, paddingBottom:0, marginBottom:0}}>{ strings.treeForm.step }</Text>
                            <Text style={{ color:'#737373', textAlign:'center', fontSize:14, fontWeight:'900', lineHeight:17}}>
                                { this.state.currentIndex == 4 ? 2 : 
                                    (this.state.currentIndex == 7 ? 4 : 
                                        (this.state.currentIndex == 8 ? 5 : 
                                            (this.state.currentIndex == 9 ? 6 : '')    
                                        )
                                    ) }
                            </Text>
                        </View>   
                    </Col>
                    <Col style={{margin:15, marginLeft:0, marginLeft:0, justifyContent:'center'}}>   
                        { this.state.currentIndex == 4  &&
                            <Text style={{ color:'#737373', fontSize:13, justifyContent:'center' }}>{ strings.cameraAssistant.slide2 }</Text>
                        }
                        { this.state.currentIndex == 7  &&
                            <Text style={{ color:'#737373', fontSize:13, justifyContent:'center' }}>{ strings.cameraAssistant.slide6 }</Text>
                        }
                        { this.state.currentIndex == 8  &&
                            <Text style={{ color:'#737373', fontSize:13, justifyContent:'center' }}>{ strings.cameraAssistant.slide7 }</Text>
                        }
                        { this.state.currentIndex == 9  &&
                            <Text style={{ color:'#737373', fontSize:13, justifyContent:'center' }}>{ strings.cameraAssistant.slide8 }</Text>
                        }
                    </Col>
                </Grid>    
                <Image style={{
                        flex: 1,
                        backgroundColor: 'white',
                        position:'absolute',
                        top:0,
                        bottom:0,
                        right:0,
                        left:0,
                        zIndex:99,
                }} source={{isStatic:true, uri:"file://"+this.state.image.uri}} />
                { this.state.strokeOne.y1 !== undefined &&
                    this.drawLine("vertical", this.state.strokeOne) 
                }
                { this.state.strokeTwo.y1 !== undefined &&
                    this.drawLine("vertical", this.state.strokeTwo) 
                }
                { this.state.strokeThree.x1 !== undefined &&
                    this.drawLine("horizontal", this.state.strokeThree) 
                }
                { this.state.strokeFour.x1 !== undefined &&
                    this.drawLine("horizontal", this.state.strokeFour) 
                }
        </View> );
    }
    renderCamera() {
        return (                    
            <View style={{ flex: 1}} keyboardShouldPersistTaps={'handled'}>          
                <Grid style={
                    {width:'100%', 
                    shadowOffset: { width: 5, height: 5 },
                    shadowColor: "grey",
                    shadowOpacity: 0.5,
                    shadowRadius: 5,
                    elevation:5,
                    backgroundColor:'white',
                    height:70, flexDirection:'row', position:'absolute',left:0,top:0,right:0, elevation:100, zIndex:100}}>
                    <Col style={{width: 45, margin:15, marginLeft:20, marginRight:10}}>
                        <View style={{ borderColor:'#91c484', backgroundColor:'white', borderWidth:3, width:45, height:45, borderRadius:50, position:'absolute',alignSelf:'center', justifyContent:'center'}}>
                            <Text style={{ color:'#737373', textAlign:'center', fontSize:8, fontWeight:'900', marginTop:5, paddingBottom:0, marginBottom:0}}>{ strings.treeForm.step }</Text>
                            <Text style={{ color:'#737373', textAlign:'center', fontSize:14, fontWeight:'900', lineHeight:17}}>1</Text>
                        </View>                    
                    </Col>
                    <Col style={{margin:15, marginLeft:0, justifyContent:'center'}}>   
                        { this.state.currentIndex == 2  &&
                            <Text style={{color:'#737373', fontSize:13, justifyContent:'center'}}>{ strings.cameraAssistant.takePhotoDesc }</Text>
                        }
                    </Col>
                </Grid>      
                <CameraKitCamera
                    ref="camera"
                    hideControls={false} 
                    style={{
                        backgroundColor: 'white',
                        position:'absolute',
                        top:0,
                        bottom:0,
                        right:0,
                        left:0,
                        zIndex:99,
                        elevation:99
                    }}
                    cameraOptions={{
                        flashMode: 'auto',             
                        focusMode: 'on',               
                        zoomMode: 'off',               
                    }}
                />
                {
                    this.state.isTakingPhoto &&
                    <View 
                        style={{ position:'absolute',top:0, bottom:0, left:0,right:0, justifyContent:'center', zIndex:110, elevation:110}}>
                        <ActivityIndicator style={{alignSelf:'center'}} size="large" color="#32AA77" />
                    </View>
                }
                { !this.state.isTakingPhoto &&
                <View style={{ 
                    width:'100%', justifyContent: "center", alignItems: "center", position:'absolute', bottom:10,
                    zIndex:200, elevation:200
                }}>                                
                    <Button onPress={ async (e) => {
                        this.setState({isTakingPhoto: true});
                        const image = await this.refs.camera.capture(false);
                        this.setState({image});
                        this.setState({isTakingPhoto: false});
                        this.navigate();
                    }} style={{
                        justifyContent:'center',
                        alignSelf: 'center',
                        marginTop:10,
                        backgroundColor: 'white',
                        width : 220,
                        height : 40,     
                        shadowOffset: { width: 5, height: 5 },
                        shadowColor: "grey",
                        shadowOpacity: 0.5,
                        shadowRadius: 5,
                        borderRadius:10,
                        marginBottom:10
                    }} >
                        <Text style={{ fontSize:12, color:'#2CA06C' }}>{ strings.tree.takePhoto }</Text>
                    </Button>
                    
                </View>
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    slideDescription: {
        flex: 1,
        flexDirection:'column',
        justifyContent:'center',
        alignItems: 'center'
    },
    buttonContainer: {
        marginLeft: 60,
        marginRight: 60,
        marginTop: 10,
        marginBottom: 20,  
        padding:0,
        justifyContent:'center',
        alignItems: 'center',
        height:60
    },
    continueButton: {
        backgroundColor:'#41B07C', 
        borderRadius: 5,
        justifyContent:'center',
        alignItems: 'center',
        marginBottom:0
    },
    backButton: {
        justifyContent:'center',
        alignItems: 'center',
        marginTop:0
    },
    continueLabel: {
        fontWeight:'bold',
        color: 'white',
        textAlign: 'center',
        alignSelf: 'center',
        justifyContent:'center',
        alignItems: 'center',
        width: '80%',
    },
    backLabel: {
        color: '#737373',
        textAlign: 'center',
        alignSelf: 'center',
        justifyContent:'center',
        alignItems: 'center',
        width: '80%',
    },
    error: {
        color: "#EA585E",
        fontSize: 12,
        paddingTop:10,
        paddingLeft:0,
        paddingBottom:10  
    },
    alertContainer: {
        alignItems: 'center', 
        marginTop: 40, 
        marginLeft: 20, 
        marginRight: 20, 
        marginBottom: 10
    },
    alertButton: {
        marginBottom: 40,
        paddingLeft: 40, 
        paddingRight: 40, 
        paddingTop: 12, 
        paddingBottom: 12,
    },
    alertImage: {
        width: 60,
        height: 60, 
        resizeMode: 'contain', 
        marginBottom: 25,
    },
    alertText: {
        textAlign: 'center', 
        color: '#828382', 
        fontSize: 15, 
        fontWeight: '400'
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


export default connect(mapStateToProps, mapDispatchToProps)(CameraAssistant);