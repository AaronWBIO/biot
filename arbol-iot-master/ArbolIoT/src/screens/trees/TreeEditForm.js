import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import MapView , { UrlTile } from '@jmruvalcabav/react-native-maps';
import {
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    View,
    Dimensions,
    PixelRatio,
    BackHandler,
    Platform,
} from 'react-native';
import GamificationAlert from '../../components/awesome-alert/GamificationAlert';
import Loader from '../../components/loader/Loader';
import { Item, Icon, Button, Label, Input, Grid, Col } from 'native-base';
import strings from '../../config/languages';
import validationMessages from '../../config/validationMessages';
import CustomValidationComponent from '../../helpers/CustomValidationComponent';
import ImagePicker from 'react-native-image-picker';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import TreeService from '../../services/tree';
import AdoptionService from '../../services/adoptions';
import _ from 'lodash';
import ImageWithAuth from '../../components/image';
import constants from '../../config/constants';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import RNFetchBlob from 'rn-fetch-blob';
import {AsyncStorage} from 'react-native';
import globalStyles from '../../styles/global';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import ImageResizer from 'react-native-image-resizer';
import Orientation from 'react-native-orientation';
var Wkt = require("wicket");

class TreeForm extends CustomValidationComponent {
    static navigationOptions = ({navigation}) => {
        const {params = {}} = navigation.state;
        return {
            title: strings.treeForm.title,
            headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { if (params.customBack != undefined) params.customBack() }}>
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
        diameter: { required: true, numbers: true,  diameterMinNumber:true },
        treeCanopyDiameter: { required: true, numbers: true, diameterMinNumber:true},
        treeHeight: { required: true, numbers: true, diameterMinNumber:true},
    }
    constructor(props) {
        super(props);
        const { navigation } = this.props;
        this.state = {
            mode: 'add',
            status: 'INCOMPLETE',
            showCancelAlert: false,
            showOfflineSaveAlert: false,
            showAlertRetry: false,
            showCommunityRecommendationAlert:false,
            showOfferInAdoptionAndSaveAlert: false,
            showErrorAlert: false,
            alertErrorText: '',
            showSuccessAlert: false,
            showSuccessAlertWC: false,
            alertSuccessText: '',
            close: true,
            backFunc: () => {},
            gamificationAlertGeneralText: '',
            eventResponseVM: {},
            specieAdvancedMode: false,
            dimAdvancedMode: false,
            treeEntity: {},
            opacity: 1,
            mapLoaded: false,
            specieNotFound: false,
            formValid: true,
            isLoading: false,
            center: {},
            diameter: '',
            treeCanopyDiameter: '',
            treeHeight: '',
            treePhoto: {},
            adopt: false,
            currentOfflineBoundary: null,
            perms: {
                treeAoption: {
                    interact: { status:true }
                }
            },
        }  
        // Default state mode add
        this.state.mode = navigation.getParam('mode', 'add');
        // Get edit entity id
        if (this.state.mode == "edit" || this.state.mode == "validate") {
            const id = navigation.getParam('id', null);
            if (id != null)
                this.state.id =  id.replace("tree.","");
        }
        // Custom validations
        this.messages['es']['diameterMinNumber'] = 'Debes ingresar un número mayor a 0 para el campo {0}';
        this.rules.diameterMinNumber = (status,value) => {
            return value > 0;
        }
        // Map permissions
        this.permsMaping();       
    }
    permsMaping() {
        this.state.perms.treeAoption.interact = GeneralHelpers.hasPermission('treeAoption','interact').remote == true ?
          GeneralHelpers.hasPermission('treeAoption','interact') :
          this.state.perms.treeAoption.interact;
    }
    componentDidMount() {
        Orientation.lockToPortrait();
        BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
        this.props.navigation.setParams({
            customBack: this.customBack.bind(this), 
        });
        this.props.setParam({ specie:null , dim:null });
        if (this.state.mode == 'edit' || this.state.mode == "validate") {
            TreeService.get(this.state.id, false)
            .then(res => {
                if (res.id != undefined && res.id == this.state.id) {
                    var wkt = new Wkt.Wkt();
                    const { width, height } = Dimensions.get('window');
                    wkt.read(res.geom);
                    this.state.center = {};
                    this.state.w = PixelRatio.getPixelSizeForLayoutSize(Math.round(width));
                    this.state.h = PixelRatio.getPixelSizeForLayoutSize(Math.round(height));
                    this.state.center.longitude = wkt.components[0].x;
                    this.state.center.latitude = wkt.components[0].y;
                    this.state.center.latitudeDelta = 0.001;
                    this.state.center.longitudeDelta = 0.001 * Math.round(width) / 200;
                    this.setState({treeEntity: res});
                    if ( Platform.OS === 'android') {
                        this.setState({
                            optionalProps: {
                                initialCamera: {
                                    pitch: 45,
                                    bearing: 45,
                                    heading: -20,
                                    altitude: 0,
                                    zoom: 18,
                                    center: this.state.center
                                }
                            }
                        });
                    } else {
                        this.setState({
                            optionalProps: {}
                        })
                    }
                    this.setState({ mapLoaded: true });
                    // Convert measures from m to cm
                    res.diameter = ( res.diameter * 100 ).toFixed(2);
                    res.canopyDiameter = ( res.canopyDiameter * 100 ).toFixed(2);
                    this.setState({ diameter: res.diameter != 0 ? res.diameter+'':'', treeHeight: res.height+'', treeCanopyDiameter: res.canopyDiameter != 0 ? res.canopyDiameter+'' : ''});
                    if (res.images != undefined && res.images.length > 0) {
                        this.setState({treePhoto: res.images[0]});
                    }
                    if (res.diameter > 0 || res.height > 0 || res.canopyDiameter > 0) {
                        this.setState({dimAdvancedMode:true});
                    }
                    if (res.specie != null && res.specie.id > 0) {
                        this.setState({specieAdvancedMode:true});
                    }
                } else {
                    this.setState({ showErrorAlert: true, alertErrorText: strings.general.error });
                }
            }).catch((e) => {
                this.setState({ showErrorAlert: true, alertErrorText: strings.general.error });
            });
        } 
        else if (this.state.mode == "add" || this.state.mode == "add-offline") {
            this.state.currentOfflineBoundary = this.props.navigation.getParam('currentOfflineBoundary', null);
            const center = this.props.navigation.getParam('center', null);
            const { width } = Dimensions.get('window');
            if (center != null) {
                this.state.center.longitude = center.longitude;
                this.state.center.latitude = center.latitude;
                this.state.center.latitudeDelta = 0.001;
                this.state.center.longitudeDelta = 0.001 * Math.round(width) / 200;
                this.setState({mapLoaded: true});
            }
        }
        else if (this.state.mode == "edit-offline") {
            this.state.currentOfflineBoundary = this.props.navigation.getParam('currentOfflineBoundary', null);
            var res = this.props.navigation.getParam('entity', null);
            if (res.id != undefined) {
                var wkt = new Wkt.Wkt();
                const { width, height } = Dimensions.get('window');
                wkt.read(res.geom);
                this.state.center = {};
                this.state.w = PixelRatio.getPixelSizeForLayoutSize(Math.round(width));
                this.state.h = PixelRatio.getPixelSizeForLayoutSize(Math.round(height));
                this.state.center.longitude = wkt.components[0].x;
                this.state.center.latitude = wkt.components[0].y;
                this.state.center.latitudeDelta = 0.001;
                this.state.center.longitudeDelta = 0.001 * Math.round(width) / 200;
                this.setState({treeEntity: res});
                if ( Platform.OS === 'android') {
                    this.setState({
                        optionalProps: {
                            initialCamera: {
                                pitch: 45,
                                bearing: 45,
                                heading: -20,
                                altitude: 0,
                                zoom: 18,
                                center: this.state.center
                            }
                        }
                    });
                } else {
                    this.setState({
                        optionalProps: {}
                    })
                }
                this.setState({mapLoaded: true});
                // Convert measures from m to cm
                res.diameter = ( res.diameter * 100 ).toFixed(2);
                res.canopyDiameter = ( res.canopyDiameter * 100 ).toFixed(2);
                this.setState({ diameter: res.diameter != 0 ? res.diameter+'':'', treeHeight: res.height+'', treeCanopyDiameter: res.canopyDiameter != 0 ? res.canopyDiameter+'' : ''});
                if (res.images != undefined && res.images.length > 0) {
                    this.setState({treePhoto: res.images[0]});
                }
                if (res.diameter > 0 || res.height > 0 || res.canopyDiameter > 0) {
                    this.setState({dimAdvancedMode:true});
                }
                if (res.specie != null && res.specie.id > 0) {
                    this.setState({specieAdvancedMode:true});
                }
            } else {
                this.setState({ showErrorAlert: true, alertErrorText: strings.general.error });
            }
        }
    }
    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.param !== this.props.param) {
            if (this.props.param.dim != undefined) {
                this.setState({
                    diameter: ( this.props.param.dim.diameter * 100 ).toFixed(2) + '',
                    treeCanopyDiameter: ( this.props.param.dim.canopyHeight * 100 ).toFixed(2) + '',
                    treeHeight: this.props.param.dim.height.toFixed(2) + '',
                    dimAdvancedMode: true,
                });
            }
            if (this.props.param.specie != undefined) {
                if (this.props.param.specie == -1) {
                    this.state.treeEntity.specie = null;
                    this.setState({specieNotFound: true});
                    this.setState({treeEntity: this.state.treeEntity});
                } else {     
                    this.setState({specieAdvancedMode:true});
                    this.state.treeEntity.specie = this.props.param.specie;
                    this.setState({treeEntity: this.state.treeEntity});
                }
            }
        }
    }
    _onPressButton = () => {
        var valid = this.validate(this.validations);  
            valid = valid && _.has(this.state.treePhoto,"id");  
        this.setState({ formValid:valid });       
        if (valid) {
            if (!_.has(this.state.treeEntity,"specie.id")) {
                this.setState({showCommunityRecommendationAlert:true});
            } else {
                if (this.state.mode == "edit-offline" || this.state.mode == "add-offline") {
                    this._offlineSave();
                } else {
                    this._offerInAdoptionAndSave();
                }
            }
        } else {
            this.refs._scrollView.scrollToPosition(0,0);
        }
    }
    handleBackPress = () => {
        this._cancel();
        return true;
    }
    customBack(){
        this._cancel();  
    }
    _offerInAdoptionAndSave() {
        this.setState({showOfferInAdoptionAndSaveAlert:true});
    }
    _offlineSave() {
        this.setState({showOfflineSaveAlert:true});
    }
    _cancel = () => {
        this.setState({showCancelAlert:true});
    }
    _adoptTree = (tid) => {
        AdoptionService.treeAdopt(tid)            
        .then((res) => {
           // ¯\_(ツ)_/¯
        });
    }
    exitAlert = () => {
        this.setState({showAlertRetry:false, isLoading: false});
    }
    retryAlert =() => {
        this.setState({showAlertRetry:false, isLoading: false});
        this._saveEntity()
    }
    _saveEntity = async () => {
        this.setState({isLoading:true});
        if (this.state.status == undefined || this.state.status == null) 
            this.state.status = "INCOMPLETE";
        this.state.treeEntity.status = this.state.status;
        var geom = `POINT (${this.state.center.longitude} ${this.state.center.latitude})`;
        this.state.treeEntity.geom = geom;
        // Convert diamter in cm to m 
        this.state.treeEntity.diameter = ( this.state.diameter / 100 );
        this.state.treeEntity.canopyDiameter = ( this.state.treeCanopyDiameter / 100);
        this.state.treeEntity.height = this.state.treeHeight;
        if (this.state.mode == "edit-offline") {
            this.state.treeEntity['synchronized'] = false;
            this.props.localBoundary.trees[this.state.treeEntity.id] = this.state.treeEntity;
            this.props.localBoundary.modifications[this.state.treeEntity.id] = true;
            this.props.setCurrentLocalBoundary(this.props.localBoundary);
            var localBoundaries = await AsyncStorage.getItem('localBoundaries');        
            if (localBoundaries == undefined || localBoundaries == null) 
                localBoundaries = {};  
            else 
                localBoundaries = JSON.parse(localBoundaries);
            localBoundaries[this.props.localBoundary.id]['modifications'] = this.props.localBoundary.modifications;
            var modifiedBoundary = localBoundaries[this.props.localBoundary.id];
            await AsyncStorage.setItem('localBoundaries',JSON.stringify(localBoundaries));  
            await AsyncStorage.setItem('localBoundariesId' + this.props.localBoundary.id,JSON.stringify({ ...modifiedBoundary , trees: this.props.localBoundary.trees}));     
            this.setState({isLoading:false});
            this.setState({showSuccessAlert:true, alertSuccessText:strings.treeForm.offlineConfirmationSave});
        } else if (this.state.mode == "add-offline") {
            // Manage temporal id
            if (this.props.localBoundary['lastTemportalId']  == undefined) {
                this.props.localBoundary['lastTemportalId']  = -1;
            } else {
                this.props.localBoundary['lastTemportalId'] += -1;
            }
            var lastTemporalId = this.props.localBoundary['lastTemportalId'];
            this.props.localBoundary.modifications[lastTemporalId] = true;
            if (this.props.localBoundary.trees == undefined)
                this.props.localBoundary.trees = [];
            this.state.treeEntity.id = lastTemporalId;    
            this.props.localBoundary.trees[lastTemporalId] = this.state.treeEntity;
            this.props.setCurrentLocalBoundary(this.props.localBoundary);
            var localBoundaries = await AsyncStorage.getItem('localBoundaries');        
            if (localBoundaries == undefined || localBoundaries == null) 
                localBoundaries = {};  
            else 
                localBoundaries = JSON.parse(localBoundaries);
            localBoundaries[this.props.localBoundary.id]['lastTemportalId'] = this.props.localBoundary.lastTemportalId;
            localBoundaries[this.props.localBoundary.id]['modifications'] = this.props.localBoundary.modifications;
            var modifiedBoundary = localBoundaries[this.props.localBoundary.id];
            await AsyncStorage.setItem('localBoundaries',JSON.stringify(localBoundaries));  
            await AsyncStorage.setItem('localBoundariesId' + this.props.localBoundary.id,JSON.stringify({ ...modifiedBoundary , trees: this.props.localBoundary.trees}));     
            this.setState({isLoading:false});
            this.setState({showSuccessAlert:true, alertSuccessText:strings.treeForm.offlineConfirmationSave});
        } 
        else {
            if (this.state.treeEntity.id == undefined) {
                TreeService.save(
                    this.state.treeEntity
                )            
                .then((res) => {
                    console.log(res);
                    return res.json();
                })
                .then(res  => {
                    if (_.has(res,"original.id")) {
                        if (this.state.adopt) {
                            this._adoptTree(res.original.id);
                        }
                        if (res.alter == true) {
                            this.setState({ 
                                close: !this.state.adopt,
                                backFunc: () => {
                                    this.props.navigation.goBack() 
                                },
                                gamificationAlertGeneralText: strings.general.confirmationSave,
                                eventResponseVM:res});
                        } else {
                            this.setState({showSuccessAlert:true, alertSuccessText:strings.general.confirmationSave});
                        }
                    } else {
                        this.setState({ showAlertRetry: true});
                    }
                }).catch((f) => {
                    this.setState({ showAlertRetry: true});
                });
            } else {
                TreeService.update(
                    this.state.treeEntity
                )            
                .then((res) => {
                    console.log(res);
                    return res.json();
                })
                .then(res  => {
                    if (_.has(res,"original.id")) {
                        if (this.state.adopt) {
                            this._adoptTree(res.original.id);
                        }
                        if (res.alter == true) {
                            this.setState({ 
                                close: !this.state.adopt,
                                backFunc: () => {
                                    this.props.navigation.goBack() 
                                },
                                gamificationAlertGeneralText: strings.general.confirmationSave,
                                eventResponseVM:res});
                        } else {
                            this.setState({showSuccessAlert:true, alertSuccessText:strings.general.confirmationSave});
                        }
                    } else {
                        this.setState({ showAlertRetry: true});

                    }
                }).catch((e) => {
                    this.refs._scrollView.scrollToPosition(0,0);
                    this.setState({ showAlertRetry: true});
                });
            }
    
        }   
    }
    selectPhoto() {
        this.setState({isLoading:true});
        const options = {
            title: strings.imagepicker.changePhoto,
            cancelButtonTitle: strings.imagepicker.cancelPhoto,
            takePhotoButtonTitle: strings.imagepicker.camera,
            chooseFromLibraryButtonTitle: strings.imagepicker.library,
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };
        ImagePicker.showImagePicker(options, async (response) => {    
            if (response.didCancel) {
                this.setState({isLoading:false});
            } else if (response.error) {
                this.setState({isLoading:false});
            } else {
                ImageResizer.createResizedImage(response.uri, 1000, 700, 'JPEG', 80)
                .then(({ uri }) => {
                    let filePath = uri;
                    let fileName = GeneralHelpers.getUUID() + ".jpg";
                    let fileType = "image/jpeg";
                    if (Platform.OS === 'ios') {
                        let arr = uri.split('/')
                        const dirs = RNFetchBlob.fs.dirs
                        filePath = `${dirs.CacheDir}/${arr[arr.length - 1]}`
                    } 
                    RNFetchBlob.fs.readFile(filePath, 'base64')
                    .then(async (data) => {
                        if (this.state.mode == "edit-offline" || this.state.mode == "add-offline") { 
                            var filePath = RNFetchBlob.fs.dirs.DocumentDir + "/boundary-" + this.state.currentOfflineBoundary + "/" + fileName;
                            await RNFetchBlob.fs.writeFile(filePath, data, 'base64');
                            response.fileName = fileName;
                            response.data = null;
                            var treePhoto = {
                                id: 1001,
                                uri: 'file://' + filePath,
                                lastModifiedDate: Date.now(),
                                subType: 'local',
                                ...response
                            };
                            this.setState({treePhoto});
                            if (this.state.treeEntity.images == undefined) 
                                this.state.treeEntity.images = [];
                            this.state.treeEntity.images.unshift(treePhoto);
                            this.setState({treeEntity:this.state.treeEntity});
                            this.setState({isLoading:false});
                        } else {
                            if(this.state.treeEntity.id > 0) {
                                TreeService.uploadFileWithTreeId(this.state.treeEntity.id, fileName, data, fileType).then(this.uploadFileResponse).catch(this.uploadFileError);
                            } else {
                                TreeService.uploadFile(fileName, data, fileType).then(this.uploadFileResponse).catch(this.uploadFileError);
                            }
                        }
                    });
                })
                .catch(err => {
                    this.setState({isLoading:false});
                });
            }
        });
    }
    uploadFileResponse = (resp) => {
        var prevImageId = null;
        if (this.state.treePhoto != undefined && this.state.treePhoto.id != undefined) {
          prevImageId = this.state.treePhoto.id;
        } 
        if (resp.data != null ) {
            var res = JSON.parse(resp.data);
            if (res.message != undefined) {
                this.setState({ 
                    isLoading:false, 
                    alertErrorText: strings.imagePicker.error,
                    showErrorAlert:true});    
                return;
            }
            if (this.state.treeEntity.images == undefined) {
                this.state.treeEntity.images = [];
            } 
            if (this.state.treeEntity.id > 0) {
                res = res.images[0];
            }
            if (prevImageId != res.id) {
                this.state.treeEntity.images.unshift(res);
                this.setState({ 
                    isLoading:false, 
                    showSuccessAlertWC:true,
                    alertSuccessText: strings.imagePicker.upload });
            } else {
                this.state.treeEntity.images[0] = res;
                this.setState({ 
                    isLoading:false, 
                    showSuccessAlertWC:true,
                    alertSuccessText: strings.imagePicker.update });
            }
            var timeStamp = Math.floor(Date.now());
            res.lastModifiedDate = timeStamp;
            this.setState({treePhoto:res});
        } 
        this.setState({isLoading:false});
    }
    uploadFileError = (err) => {
        this.setState({ 
            isLoading:false, 
            alertErrorText: strings.imagePicker.error,
            showErrorAlert:true});  
        this.setState({isLoading:false});
    }
    render() {
        return ( 
            <SafeAreaView>
                { ( (this.state.treeEntity != undefined && this.state.treeEntity.id != undefined)  || (this.state.mode == "add" || this.state.mode == "add-offline")) &&               
                <KeyboardAwareScrollView ref='_scrollView' extraHeight={100}>
                        <View>
                            { this.state.mode != "edit-offline" && this.state.mode != "add-offline" && this.state.mapLoaded &&
                                <MapView style={{ flex: 1, height:200 }}
                                    ref="map"
                                    provider="google"
                                    mapType={ "none" }
                                    showsCompass={false}
                                    initialRegion= {{
                                        latitude: this.state.center.latitude,
                                        longitude: this.state.center.longitude,
                                        latitudeDelta: this.state.center.latitudeDelta,
                                        longitudeDelta:this.state.center.longitudeDelta,
                                    }}
                                    { ...this.state.optionalProps }
                                    toolbarEnabled={false}>
                                    <UrlTile urlTemplate={ constants.baseLayer + '{z}/{x}/{y}.jpg'} zIndex={149} />
                                    <MapView.Marker
                                            draggable
                                            coordinate={this.state.center}
                                            onDragEnd={(e) => {
                                            const { width } = Dimensions.get('window');
                                            this.state.center = e.nativeEvent.coordinate;
                                            this.state.center.latitudeDelta = 0.001;
                                            this.state.center.longitudeDelta = 0.001 * Math.round(width) / 200;
                                            this.setState({ center:this.state.center });
                                        }}
                                    >
                                    <Image resizeMode='contain' source={require('../../resources/trees/marker.png')} style={{ width: 25, height: 42 }} />
                                    </MapView.Marker>
                                </MapView>
                            }
                        </View>
                        <View style={[{backgroundColor: '#9b9b9b' }, styles.sectionStyle]}>
                            <Text style={styles.sectionTitle}> {strings.treeForm.treeInformation} </Text>
                        </View>
                        <View style={ styles.formStyle}>
                            <View style={{width:'100%', height:55, marginBottom:20, marginTop:10}}>
                                <View style={{width:'100%', height:2, backgroundColor:'#dbdbda', position:'absolute', top:'50%'}}></View>
                                <View style={{ borderColor:'#91c484', backgroundColor:'white', borderWidth:3, width:50, height:50, borderRadius:50, position:'absolute',alignSelf:'center', justifyContent:'center'}}>
                                    <Text style={{ color:'#737373', textAlign:'center', fontSize:10, fontWeight:'900', marginTop:5, paddingBottom:0, marginBottom:0}}>{ strings.treeForm.step }</Text>
                                    <Text style={{ color:'#737373', textAlign:'center', fontSize:16, fontWeight:'900', lineHeight:17}}>1</Text>
                                </View>
                            </View>
                            <Label style={[styles.stackedLabel, {textAlign:'center', lineHeight:20}]}>{ strings.treeForm.specie}</Label>
                            <Button disabled = { this.state.specieAdvancedMode } style={[styles.btnGreen,
                                this.state.specieAdvancedMode ? { opacity: 0.5} : {}
                                ,{ width:'100%', paddingBottom:10, paddingTop:10, marginTop:20}]} onPress={() => this.props.navigation.navigate('SpecieAssistant') }>
                                <Text style={[styles.btnText, {width:'100%', textAlign:'center'}]}>{strings.treeForm.assistentSpecie}</Text>
                            </Button>
                            <Item style={ [styles.itemCheckBox, { justifyContent:'center', textAlign:'center', marginBottom:20}] } onPress={() =>  this.setState({ specieAdvancedMode: !this.state.specieAdvancedMode }) }>
                                <Text style={{ fontSize: 12, color:'#737373', textDecorationLine:'underline' }}>{ strings.treeForm.manualSpecie }</Text>
                            </Item>
                            { !( !this.state.specieNotFound && !this.state.specieAdvancedMode) &&
                                <View>
                                    <View style={[{borderBottomColor: '#B5B6B4', borderBottomWidth: 1, marginBottom: 10, height: 40,}]}>
                                        <Grid>
                                            <Col>
                                                <Input 
                                                    editable= {false}
                                                    placeholder = { strings.treeForm.specieLabel}
                                                    placeholderTextColor = {'#B9B9B9'}
                                                    value= { this.state.treeEntity.specie != undefined ? this.state.treeEntity.specie.commonName : ''}
                                                    style={ styles.input }  
                                                    onChangeText={ (text) => this.setState({ treeID: text }) }/>  
                                            </Col>
                                            <Col style={{ width:50, justifyContent: "center", alignItems: "center"}}>                                
                                                <Button rounded onPress={() => { 
                                                    this.props.navigation.navigate('SpeciesList');
                                                }} style={ styles.viewSpeciesButton } >
                                                    <Icon name="ios-arrow-forward" style={{ 
                                                        fontSize:16, width:5, height:16, color:"white",paddingTop:0, 
                                                        textAlign:'center',
                                                        textAlign:'center',alignSelf:'center'}}/>
                                                </Button>   
                                            </Col>
                                        </Grid>
                                    </View>
                                </View>
                            }
                            <View style={{width:'100%', height:55, marginBottom:10, marginTop:5}}>
                                <View style={{width:'100%', height:2, backgroundColor:'#dbdbda', position:'absolute', top:'50%'}}></View>
                                <View style={{ borderColor:'#ea585e', backgroundColor:'white', borderWidth:3, width:50, height:50, borderRadius:50, position:'absolute',alignSelf:'center', justifyContent:'center'}}>
                                    <Text style={{ color:'#737373', textAlign:'center', fontSize:10, fontWeight:'900', marginTop:5, paddingBottom:0, marginBottom:0}}>{ strings.treeForm.step }</Text>
                                    <Text style={{ color:'#737373', textAlign:'center', fontSize:16, fontWeight:'900', lineHeight:17}}>2</Text>
                                </View>
                            </View>
                            <Label style={[styles.stackedLabel, {textAlign:'center', lineHeight:20}]}>{ strings.treeForm.measuresLabel}</Label>
                            <Button disabled = { this.state.dimAdvancedMode } style={[styles.btnRed,
                                this.state.dimAdvancedMode ? { opacity: 0.5} : {},
                                { width:'100%', paddingBottom:10, paddingTop:10, marginTop:20, marginBottom:10}]} onPress={() => this.props.navigation.navigate('CameraAssistant') }>
                                <Text style={[styles.btnText, {width:'100%', textAlign:'center'}]}>{strings.treeForm.assistentMeasure}</Text>
                            </Button>
                            <Item style={ [styles.itemCheckBox, { justifyContent:'center', textAlign:'center', marginBottom:20}] } onPress={() =>  this.setState({ dimAdvancedMode: !this.state.dimAdvancedMode }) }>
                                <Text style={{ fontSize: 12, color:'#737373', textDecorationLine:'underline' }}>{ strings.treeForm.manualMeasures }</Text>
                            </Item>
                            { this.state.dimAdvancedMode ?
                                <View>
                                    <Item stackedLabel style={styles.item}>
                                        <Label style={styles.stackedLabel}>{ strings.treeDetailFull.trunkDiameter}</Label>
                                        <View style={{ flexDirection:'row'}}>
                                            <Input 
                                                    ref="diameter"
                                                    keyboardType="number-pad"
                                                    ref={component => this._diameter = component}
                                                    style={ [styles.input, {flex:1}] }  
                                                    onSubmitEditing={() => { this._treeCanopyDiameter._root.focus(); }}
                                                    value= { 
                                                        _.has(this.state,'diameter') && this.state.diameter != 'null'  ?
                                                        this.state.diameter : ''}
                                                    onChangeText={ (diameter) => {
                                                        this.state.treeEntity.diameter = diameter;
                                                        this.state.diameter = diameter;
                                                        this.setState({treeEntity: this.state.treeEntity, diameter:diameter});
                                                    } }/>
                                            <Text style={[ globalStyles.text, {padding:10, fontSize:12}]}>cm</Text>
                                        </View>
                                    </Item>
                                    { this.isFieldInError('diameter') && this.getErrorsInField('diameter').map((errorMessage, i) => {
                                                    return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                    })}
                                    <Item stackedLabel style={styles.item}>
                                        <Label style={styles.stackedLabel}>{ strings.treeDetailFull.treeCanopyDiameter}</Label>
                                        <View style={{ flexDirection:'row'}}>
                                            <Input 
                                                    ref="treeCanopyDiameter"
                                                    keyboardType="number-pad"
                                                    ref={component => this._treeCanopyDiameter = component}
                                                    onSubmitEditing={() => { this._treeHeight._root.focus(); }}
                                                    style={ [styles.input, {flex:1}] }  
                                                    value= { 
                                                        _.has(this.state,'treeCanopyDiameter') && this.state.treeCanopyDiameter != 'null'  ?
                                                        this.state.treeCanopyDiameter : ''}
                                                    onChangeText={ (treeCanopyDiameter) => {
                                                        this.state.treeEntity.canopyDiameter = treeCanopyDiameter;
                                                        this.state.treeCanopyDiameter  = treeCanopyDiameter;
                                                        this.setState({treeEntity: this.state.treeEntity, treeCanopyDiameter});
                                                    } }/>
                                            <Text style={[ globalStyles.text, { padding:10, fontSize:12}]}>cm</Text>
                                        </View>
                                    </Item>  
                                    { this.isFieldInError('treeCanopyDiameter') && this.getErrorsInField('treeCanopyDiameter').map((errorMessage, i) => {
                                                    return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                    })}     
                                    <Item stackedLabel style={styles.item}>
                                        <Label style={styles.stackedLabel}>{ strings.treeDetailFull.treeHeight}</Label>
                                        <View style={{ flexDirection:'row'}}>
                                            <Input 
                                                    ref="treeHeight"
                                                    keyboardType="decimal-pad"
                                                    ref={component => this._treeHeight = component}
                                                    style={ [styles.input, {flex:1}] }  
                                                    value= { 
                                                        _.has(this.state,'treeHeight') && this.state.treeHeight != 'null'  ?
                                                        this.state.treeHeight : ''}
                                                    onChangeText={ (treeHeight) => {
                                                        this.state.treeEntity.height = treeHeight;
                                                        this.state.treeHeight = treeHeight;
                                                        this.setState({treeEntity: this.state.treeEntity, treeHeight});
                                                    } }/>
                                            <Text style={[ globalStyles.text, {padding:10, fontSize:12}]}>m</Text>
                                        </View>
                                    </Item>  
                                    { this.isFieldInError('treeHeight') && this.getErrorsInField('treeHeight').map((errorMessage, i) => {
                                                    return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                    })}                
                                </View> : 
                                <View>
                                    { ( this.isFieldInError('diameter') || this.isFieldInError('treeCanopyDiameter') || this.isFieldInError('treeHeight'))  && 
                                        <Text style={ styles.error }>{strings.treeForm.measureError}</Text>
                                    }
                                </View>
                            }
                            <View style={{width:'100%', height:55, marginBottom:10, marginTop:5}}>
                                <View style={{width:'100%', height:2, backgroundColor:'#dbdbda', position:'absolute', top:'50%'}}></View>
                                <View style={{ borderColor:'#9c9c9c', backgroundColor:'white', borderWidth:3, width:50, height:50, borderRadius:50, position:'absolute',alignSelf:'center', justifyContent:'center'}}>
                                    <Text style={{ color:'#737373', textAlign:'center', fontSize:10, fontWeight:'900', marginTop:5, paddingBottom:0, marginBottom:0}}>{ strings.treeForm.step }</Text>
                                    <Text style={{ color:'#737373', textAlign:'center', fontSize:16, fontWeight:'900', lineHeight:17}}>3</Text>
                                </View>
                            </View>
                            <Label style={[styles.stackedLabel, {textAlign:'center', lineHeight:20}]}>{ strings.treeForm.photoLabel}</Label>
                        </View>
                        <View>
                            { this.state.treePhoto == undefined || this.state.treePhoto.id == undefined &&
                                <TouchableOpacity onPress={ () => { this.selectPhoto() }}>
                                    <Image
                                        style={{ height:80, width:80, alignSelf:'center', marginTop:20}}
                                        resizeMode="contain"
                                        source={ require('../../resources/global/icon-photo-add.png')}
                                    />
                                    <Text style={styles.photoChangeText}> {strings.treeForm.selectPhoto} </Text>
                                </TouchableOpacity>
                            }           
                            { this.state.mode != "edit-offline" && this.state.mode != "add-offline" && this.state.treePhoto != undefined && this.state.treePhoto.id != undefined &&
                                <TouchableOpacity style={{ textAlign:'center', marginTop:20}} onPress={ () => { this.selectPhoto() }}>
                                    <ImageWithAuth 
                                        resizeMode="cover" 
                                        style={{ width:81, height:120, alignSelf:'center',borderWidth:1, borderColor:'#f7f7f7'}} 
                                        source={{ 
                                            uri: constants.base + this.state.treePhoto.uri  + '?lastModifiedDate='+this.state.treePhoto.lastModifiedDate }} />
                                    <Text style={styles.photoChangeText}> {strings.treeForm.changePhoto} </Text>
                                </TouchableOpacity>
                            }        
                            { (this.state.mode == "edit-offline" || this.state.mode == "add-offline" ) && this.state.treePhoto != undefined && this.state.treePhoto.id != undefined &&
                                <TouchableOpacity style={{ textAlign:'center', marginTop:20}} onPress={ () => { this.selectPhoto() }}>
                                    { this.state.treePhoto.subType  != undefined && this.state.treePhoto.subType == "local" ?
                                    <ImageWithAuth 
                                        resizeMode="cover" 
                                        style={{ width:81, height:120, alignSelf:'center',borderWidth:1, borderColor:'#f7f7f7'}} 
                                        source={{ 
                                            uri: this.state.treePhoto.uri  + '?lastModifiedDate='+this.state.treePhoto.lastModifiedDate }} />
                                    :
                                            <View style={{ width:81, height:120, alignSelf:'center',borderWidth:1, borderColor:'#f7f7f7', justifyContent:'center'}}>
                                                <Icon name="ios-thunderstorm" style={{ 
                                                    fontSize:25, width:30, height:30, color:"#737373",paddingTop:0, 
                                                    textAlign:'center',alignSelf:'center'}}/>
                                                <Text style={{fontSize:8, color:'#737373', paddingTop:10, textAlign:'center'}}>Modo offline / Presiona para actualizar</Text>
                                            </View>
                                    }
                                    <Text style={styles.photoChangeText}> {strings.treeForm.changePhoto} </Text>
                                </TouchableOpacity>
                            }              
                            { !_.has(this.state.treePhoto,"id") && !this.state.formValid &&
                             <Text style={ [styles.error , { textAlign:'center'}]}>El campo fotografía es obligatorio</Text>
                            }      
                            <View style={styles.buttonContainer}>
                                    <Button block success style={ styles.alertBtn } onPress={this._onPressButton}>
                                        <Text style= { styles.alertBtnText }>{ strings.treeForm.save }</Text>
                                    </Button>
                            </View>
                        </View>
                    </KeyboardAwareScrollView>
                }
                { /* Error alert */}
                <AwesomeAlertPlus
                    show={ this.state.showErrorAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    onConfirmPressed={ () => { this.setState({showErrorAlert:false})}}
                    onDismiss={ () => { this.setState({showErrorAlert:false})}}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={globalStyles.alertTitle}> { strings.alertSorry } </Text>       
                                        <Text style={globalStyles.alertText}> { this.state.alertErrorText }  </Text>
                                    </View> 
                                    }
                />    
                { /* Success alert */}
                <AwesomeAlertPlus
                    show={ this.state.showSuccessAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    onConfirmPressed={ () => { 
                        this.setState({showSuccessAlert:false});
                        this.props.navigation.goBack();
                    }}
                    onDismiss={ () => { 
                        this.setState({showSuccessAlert:false});
                        this.props.navigation.goBack();
                    }}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-check.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={globalStyles.alertText}> { this.state.alertSuccessText }  </Text>
                                    </View> 
                                    }
                />   
                { /* Success alert mantain route */}
                <AwesomeAlertPlus
                    show={ this.state.showSuccessAlertWC }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    onConfirmPressed={ () => { 
                        this.setState({showSuccessAlertWC:false});
                    }}
                    onDismiss={ () => { 
                        this.setState({showSuccessAlertWC:false});
                    }}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-check.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={globalStyles.alertText}> { this.state.alertSuccessText }  </Text>
                                    </View> 
                                    }
                />   
                { /* Community recommendation alert */}
                <AwesomeAlertPlus
                    show={ this.state.showCommunityRecommendationAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton = {false}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-message.png')} style={globalStyles.alertImg} />
                                        <Text style={ globalStyles.alertTitle}>{ strings.treeForm.noSpecie }</Text>
                                        <Text style={[globalStyles.alertText ,{ marginBottom:20}]}>{ strings.treeForm.noSpecieSuggest }</Text>
                                        <View style={[styles.buttonContainer,{marginTop:0, paddingTop:0}]}>
                                            <Button block success style={{ ...styles.alertBtn,  width:200, alignSelf:'center'}} onPress={ () => { 
                                                this.setState({showCommunityRecommendationAlert:false});
                                                setTimeout(()=>{
                                                    this._saveEntity();
                                                },1000)
                                             }}>
                                                <Text style= { styles.alertBtnText }>{ strings.treeForm.saveAndComeBack}</Text>
                                            </Button>
                                            <Button block transparent style={{ ...styles.cancelButton,  width:200, alignSelf:'center', marginTop:10}} onPress={ () => {  
                                                    this.setState({showCommunityRecommendationAlert:false, isLoading:false}) 
                                                }}>
                                                <Text style= {[styles.backLabel, {marginBottom:10}]}>{strings.treeForm.cancel}</Text>
                                            </Button>
                                        </View>
                                    </View> 
                                    }
                />   
                { /* Offer in adoption and save alert */}
                <AwesomeAlertPlus
                    show={ this.state.showOfferInAdoptionAndSaveAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton = {false}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-tree.png')} style={globalStyles.alertImg} />
                                        <Text style={ [globalStyles.alertTitle, {marginBottom:10}] }>{ strings.treeForm.questionSave} </Text>
                                        { this.state.mode != "validate" &&
                                            <View style={styles.buttonContainer}>
                                                {   this.state.perms.treeAoption.interact.status == true && 
                                                    <Button block success style={{ ...styles.alertBtn,  width:250, alignSelf:'center'}} onPress={ () => { 
                                                        this.state.adopt = true;
                                                        this.state.status = "DRAFT";
                                                        this.setState({adopt:true, showOfferInAdoptionAndSaveAlert: false});
                                                        setTimeout(()=>{
                                                            this._saveEntity();
                                                        },1000)
                                                        }}>
                                                        <Text style= { styles.alertBtnText }>{ strings.treeForm.adoptAndValidate }</Text>
                                                    </Button>
                                                }
                                                <Button block transparent style={{ ...styles.backButton,  width:250, marginTop:10, borderWidth:1, borderColor:'#2CA06C', alignSelf:'center'}} onPress={ () => { 
                                                    this.state.adopt = false;
                                                    this.state.status = "DRAFT";
                                                    this.setState({adopt:false, showOfferInAdoptionAndSaveAlert: false});
                                                    setTimeout(()=>{
                                                        this._saveEntity();
                                                    },1000)
                                                    }}>
                                                    <Text style= { styles.backLabel }>{ strings.treeForm.sendToValidate }</Text>
                                                </Button>
                                                <Button block transparent style={{ ...styles.backButton,  width:250, marginTop:10, alignSelf:'center'}} onPress={ () => { 
                                                    this.state.adopt = false;
                                                    this.state.status = this.state.treeEntity.status;
                                                    this.setState({adopt:false, showOfferInAdoptionAndSaveAlert: false});
                                                    setTimeout(()=>{
                                                        this._saveEntity();
                                                    },1000)
                                                    }}>
                                                    <Text style= { [ styles.backLabel , {color:'#666'}] }>{ strings.treeForm.saveAndComeBack } </Text>
                                                </Button>
                                            </View>
                                        }
                                        { this.state.mode == "validate" &&
                                            <View style={styles.buttonContainer}>
                                                <Button block success style={{ ...styles.alertBtn,  width:250, alignSelf:'center'}} onPress={ () => { 
                                                        this.state.adopt = false;
                                                        this.setState({adopt:false, showOfferInAdoptionAndSaveAlert: false});
                                                        setTimeout(()=>{
                                                            this._saveEntity();
                                                        },1000)
                                                        }}>
                                                        <Text style= { styles.alertBtnText }>{ strings.treeForm.save }</Text>
                                                    </Button>
                                            </View>
                                        }
                                    </View> 
                                }
                />   
                { /* Offline save */}
                <AwesomeAlertPlus
                    show={ this.state.showOfflineSaveAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton = {false}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-tree.png')} style={globalStyles.alertImg} />
                                        <Text style={ [globalStyles.alertTitle, {marginBottom:10}] }>{ strings.treeForm.questionSave} </Text>
                                        { this.state.mode != "validate" &&
                                            <View style={styles.buttonContainer}>
                                                <Button block transparent style={{ ...styles.alertBtn,  width:250, marginTop:10, borderWidth:1, borderColor:'#2CA06C', alignSelf:'center'}} onPress={ () => { 
                                                    this.state.adopt = false;
                                                    this.state.status = "DRAFT";
                                                    this.setState({adopt:false, showOfflineSaveAlert: false});
                                                    setTimeout(()=>{
                                                        this._saveEntity();
                                                    },1000)
                                                    }}>
                                                    <Text style= { styles.alertBtnText }>{ strings.treeForm.sendToValidate }</Text>
                                                </Button>
                                                <Button block transparent style={{ ...styles.backButton,  width:250, marginTop:10, alignSelf:'center'}} onPress={ () => { 
                                                    this.state.adopt = false;
                                                    this.state.status = this.state.treeEntity.status;
                                                    this.setState({adopt:false, showOfflineSaveAlert: false});
                                                    setTimeout(()=>{
                                                        this._saveEntity();
                                                    },1000)
                                                    }}>
                                                    <Text style= { [ styles.backLabel , {color:'#666'}] }>{ strings.treeForm.saveAndComeBack } </Text>
                                                </Button>
                                            </View>
                                        }
                                        { this.state.mode == "validate" &&
                                            <View style={styles.buttonContainer}>
                                                <Button block success style={{ ...styles.alertBtn,  width:250, alignSelf:'center'}} onPress={ () => { 
                                                        this.state.adopt = false;
                                                        this.state.status = this.state.treeEntity.status;
                                                        this.setState({adopt:false, showOfflineSaveAlert: false});
                                                        setTimeout(()=>{
                                                            this._saveEntity();
                                                        },1000)
                                                        }}>
                                                        <Text style= { styles.alertBtnText }>{ strings.treeForm.save }</Text>
                                                    </Button>
                                            </View>
                                        }
                                    </View> 
                                }
                />   
                { /* Error alert with retry */}
                <AwesomeAlertPlus
                    show={ this.state.showAlertRetry }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton={false}
                    customView = {  <View style={ globalStyles.alertContainer }>
                                        <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={ globalStyles.alertText }> {strings.general.error} </Text>
                                        <View style={{ marginTop: 20}}>
                                            <Button  style={[styles.retryButton,]} onPress={ () => this.retryAlert()} >
                                                <Text style={styles.next}> {strings.retry}</Text>
                                            </Button>
                                            <Button style={styles.exitButton} onPress={ () => { this.exitAlert()} } >
                                                <Text style={styles.next}> {strings.exit}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                }
                />   
                { /* Cancel alert */}
                <AwesomeAlertPlus
                    show={ this.state.showCancelAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton = {false}
                    customView = { <View> 
                                        <View style={{marginHorizontal:'15%'}}>
                                            <Text style={globalStyles.alertTitle}>{ strings.treeForm.alertCancelTitle }</Text>
                                            <Text style={globalStyles.alertText}>{ strings.treeForm.alertCancelText }</Text>
                                        </View>
                                        <View style={{flexDirection:'row'}}>
                                            <Button transparent style={[styles.cancelButton, {borderRight: 1, borderColor: '#AFADAD', borderRightWidth: 1}]}
                                                onPress={ () => this.setState({showCancelAlert: false})}    
                                            >
                                                <Text style={styles.alertCancelButtonText}> {strings.treeForm.cancel}</Text>
                                            </Button>
                                            <Button transparent style={styles.cancelButton} onPress={ () => {
                                                this.setState({showCancelAlert:false});
                                                setTimeout(()=>{
                                                    this.props.navigation.goBack()
                                                },100);
                                                }} >
                                                <Text style={styles.alertCancelButtonText}> {strings.treeForm.confirm}</Text>
                                            </Button>
                                        </View>
                                    </View>
                    }
                /> 
                { /* Gamification alert */}
                <GamificationAlert 
                    close = {true}
                    backFunc = { this.state.backFunc }
                    generalText = { this.state.gamificationAlertGeneralText }
                    eventResponseVM ={ this.state.eventResponseVM } />
                { this.state.isLoading &&
                    <Loader></Loader>
                }
            </SafeAreaView>
        )  
    }
}
const styles = StyleSheet.create({
    sectionStyle: {
        alignItems: 'center', 
        paddingTop: 10, 
        paddingBottom: 10
    },
    sectionTitle:{
        fontSize: 16,
        fontWeight: '400',
        color:'#fff'
    },
    formStyle: {
        marginTop: 30,
        marginLeft: 40,
        marginRight: 40,
    },
    item: {
        marginBottom: 15,
        borderBottomColor: '#B5B6B4',
        borderBottomWidth: 1,
    },
    stackedLabel: {
        color: '#828382',
        fontSize: 12,
        fontWeight: '400'
    },
    input: { 
        color: '#737373', 
        fontSize: 14,
        padding: 0,
        margin: 0,
        height: 40,
        lineHeight: 17,
    },
    btnGreen: {
        backgroundColor:'#88C07B',
        marginTop: 5, 
        marginBottom: 20,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 10,
        paddingBottom: 10,
    },
    btnRed: {
        backgroundColor:'#EA585E',
        marginTop: 5, 
        marginBottom: 30,  
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 10,
        paddingBottom: 10,
    },
    btnText:{
        color: '#fff',
        fontWeight: '400',
        fontSize:12,
    },
    photoChangeText:{
        marginTop: 15, 
        marginBottom: 15,
        alignSelf: 'center',    
        textAlign: 'center',
        color:'#696767'
        
    },
    buttonContainer: {
        marginLeft: 60,
        marginRight: 60,
        marginTop: 10,
        marginBottom: 20,  
    },
    alertBtn: {
        backgroundColor:'#41B07C', 
        borderRadius: 5,
    },
    alertBtn: {
        backgroundColor:'#41B07C', 
        borderRadius: 5,
    },
    alertBtnText: {
        fontWeight:'bold',
        color: 'white',
    },
    viewSpeciesButton: {
        alignSelf: 'center',
        justifyContent: 'center', 
        alignItems: 'center',
        textAlign:'center',
        backgroundColor: '#2CA06C',
        borderRadius : 30,
        width : 25,
        height : 25,     
        shadowOffset: { width: 5, height: 5 },
        shadowColor: "grey",
        shadowOpacity: 0.5,
        shadowRadius: 5
    },
    error: {
        color: "#EA585E",
        fontSize: 12,
        paddingTop:10,
        paddingLeft:0,
        paddingBottom:10   
    },
    backButton: {
        justifyContent:'center',
        alignItems: 'center',
        marginTop:0
    },
    backLabel: {
        fontWeight:'bold',
        color: '#2CA06C',
        textAlign: 'center',
        alignSelf: 'center',
        justifyContent:'center',
        alignItems: 'center',
        width: '80%',
    },
    itemCheckBox: {
        marginTop:10,
        marginBottom: 5,
        borderBottomColor:'transparent',
        padding:3,
    },
    alertCancelButtonText:{
        fontSize: 18,
        fontWeight: '400',
        textAlign: 'center',
        color: '#208D5C'
    },
    cancelButton:{
        width:'50%',
        justifyContent:'center',
    },
    retryButton: {
        backgroundColor:'#41B07C', 
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: 10,
        width: '100%',
        textAlign:'center',
        justifyContent:'center'
    },
    exitButton: {
        backgroundColor:'#EA585E', 
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: 10,
        width: '100%', 
        textAlign:'center',
        justifyContent:'center'
    },
    next: {
        fontWeight:'bold',
        color: 'white',
        textAlign:'center'
    },
});
 
const mapStateToProps = (state) => {
    return {
        loggedInStatus: state.loggedInStatus,
        param: state.param,
        idToken: state.user.id_token,
        localBoundary: state.localBoundary,
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}


export default connect(mapStateToProps, mapDispatchToProps)(TreeForm);