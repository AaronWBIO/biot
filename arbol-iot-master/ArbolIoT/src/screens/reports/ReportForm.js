import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import AppConstants from '../../config/constants';
import { Col, Row } from "react-native-easy-grid";
import MapView , { UrlTile } from '@jmruvalcabav/react-native-maps';
import Loader from '../../components/loader/Loader';
import {
    StyleSheet,
    Text,
    SafeAreaView,
    Image,
    TouchableOpacity,
    View,
    FlatList,
    Dimensions,
    PixelRatio,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Button, Textarea, Input, Form, Icon } from 'native-base';
import strings from '../../config/languages';
import ImagePicker from 'react-native-image-picker';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import {Autocomplete} from "react-native-dropdown-autocomplete";
import validationMessages from '../../config/validationMessages';
import CustomValidationComponent from '../../helpers/CustomValidationComponent';
import ReportService from '../../services/report';
import MinIoService from '../../services/minio';
import GamificationAlert from '../../components/awesome-alert/GamificationAlert';
import globalStyles from '../../styles/global';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import _ from 'lodash';
import constants from '../../config/constants';
var Wkt = require("wicket");
import {Linking} from 'react-native'
import ImageResizer from 'react-native-image-resizer';
import RNFetchBlob from 'rn-fetch-blob';
import Orientation from 'react-native-orientation';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'


const numColumns = 3;
const formatData = (data, numColumns) => {
    const numberOfFullRows = Math.floor(data.length / numColumns);
    let numberOfElementsLastRow = data.length - (numberOfFullRows * numColumns);
    while (numberOfElementsLastRow !== numColumns && numberOfElementsLastRow !== 0) {
      data.push({ key: `blank-${numberOfElementsLastRow}`, empty: true });
      numberOfElementsLastRow++;
    }
    return data;
};

class ReportForm extends CustomValidationComponent {
    static navigationOptions = ({navigation}) => {
        const {params = {}} = navigation.state;
        return {
            title: strings.reportForm.title,
            headerLeft: <TouchableOpacity style={globalStyles.headerLeft} 
                            onPress={ () => { 
                                if (params.customBack !== undefined) {
                                    params.customBack();
                                }
                            }}>
                        <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
                    </TouchableOpacity>,      
            headerRight: <View></View>,                               
            headerTintColor: colors.white,
            headerStyle: globalStyles.headerStyle,
            headerTitleStyle: globalStyles.headerTitleStyle,
        }
    };   
    deviceLocale = this.props.lang != undefined ? this.props.lang : 'es';
    constructor(props) {
        super(props)
        this.state = {
            enabled: false,
            plainBody: '',
            phone: '',
            close: true,
            showSuccessAlertWC: false,
            showAlertCancel: false,
            showAlertRetry: false,
            showSuccessAlert: false,
            alertSuccessText: '',
            showErrorAlert: false,
            alertErrorText: '',
            gamificationAlertGeneralText: '',
            eventResponseVM: {},
            titleReport: "",
            street:"",
            report: "",
            boundary: null,
            photo: null,
            tags: [],
            reportEntity:{},
            formValid: true,
            mapLoaded: false,
            center: {},
            showClear: false,
            isLoading: false,
            loadingImage: false,
            noBoundary: false,
            noPhoto: false,
            noTag: false,
            tagsData: [],
            enableScrollViewScroll: true,
        }  
    }
    validations = {
        titleReport: { required: true },
        street: { required: true },
        report: { required: true },
        boundary: { required: true },
    }
    messages = validationMessages;
    onEnableScroll= (value) => {
        this.setState({
            enableScrollViewScroll: value,
        });
    };
    async componentDidMount() {
        Orientation.lockToPortrait();
        this.props.navigation.setParams({
            customBack: this.customBack.bind(this), 
        });   
        if(this.props.reportModule != undefined && this.props.reportModule.enabled != undefined && 
            this.props.reportModule.enabled != false) {
             this.setState({enabled:true, plainBody: '', phone: '' },()=>{
                 setTimeout(()=>{
                    var prevOnChange = this.refs.address.container._onChange;
                    this.refs.address.container._onChange =  (e) => {
                        this.addressKeyDown(e)
                        prevOnChange(e);
                    };     
                    this.geolocate();
                    this._getTags();
                 },1000)
             });

         } else{
             this.setState({enabled:false, plainBody: this.props.reportModule.message, phone: this.props.reportModule.phone });
         }
    }
    _getTags(){
        this.setState({isLoading:true});
        ReportService.getAllReportTags()
        .then((res) => res.json())
        .then(res  => { 
            if (res.length > 0 ) {                
                var result = res;
                setTimeout(function(){                 
                    this.setState({
                        tagsData: result,
                        isLoading: false
                    })               
                }.bind(this), 1000);
            } else { 
                this.setState({isLoading:false});
            } 
        }).catch((e) => {
            this.setState({isLoading:false});
        });
    }
    addressKeyDown(text) {
        this.setState({ showClear:true });
    }
    customBack(){
        if(this.state.enabled)
            this.setState({ showAlertCancel:true });
        else 
            this.props.navigation.goBack();
    }
    exitAlert = () => {
        this.setState({showAlertRetry:false}); 
        this.props.navigation.goBack();
    };
    retryAlert =() => {
        this.setState({showAlertRetry:false}); 
        this._saveEntity()
    }
    alertPoints(eventResponseVM){

    }
    async geolocate() {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                var wkt = new Wkt.Wkt();
                wkt.read("POINT ("+ position.coords.longitude +" "+position.coords.latitude+")");
                const { width, height } = Dimensions.get('window');
                this.state.center = {};
                this.state.w = PixelRatio.getPixelSizeForLayoutSize(Math.round(width));
                this.state.h = PixelRatio.getPixelSizeForLayoutSize(Math.round(height));
                this.state.center.longitude = wkt.components[0].x;
                this.state.center.latitude = wkt.components[0].y;
                this.state.center.latitudeDelta = 0.001;
                this.state.center.longitudeDelta = 0.001 * Math.round(width) / 200;
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

            },
            async (error) => { },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 5000 },
        );        
    }
    _onPressButton = () => {
        this.refs._scrollView.scrollToPosition(0,0);
        let noPhoto = false;
        let noTag = false;
        let noBoundary = false;
        if( this.state.boundary == null){
            noBoundary = true;
            this.setState({
                noBoundary: true,
            })
        } else{
            noBoundary = false;
            this.setState({
                noBoundary: false,
            })
        }
        if( this.state.photo == null){
            noPhoto = true;
            this.setState({
                noPhoto: true,
            })
        } else{
            noPhoto = false;
            this.setState({
                noPhoto: false,
            })
        }
        if( this.state.tags && this.state.tags.length <= 0 ){
            noTag = true;
            this.setState({
                noTag: true,
            })
        } else{
            noTag = false;
            this.setState({
                noTag: false,
            })
        }
        var valid = this.validate(this.validations);
        this.setState( {formValid:valid });  
        if (valid && !noTag && !noPhoto && !noBoundary) {
            this._saveEntity();
        } else {
            this.refs._scrollView.scrollToPosition(0,0);
        }
    }
    selectPhoto(){
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
                    .then((data) => {
                        var relatedId = null;
                        MinIoService.uploadFile('report',fileName, data, fileType, relatedId).then((resp) => {
                            if (resp.data != null ) {                        
                                var res = JSON.parse(resp.data);
                                if (res.message != undefined) {
                                    this.setState({ 
                                        isLoading:false, 
                                        alertErrorText: strings.imagePicker.error,
                                        showErrorAlert:true});                               
                                    return;
                                }                                                
                                this.setState({ 
                                    isLoading:false, 
                                    showSuccessAlertWC:true,
                                    alertSuccessText: strings.imagePicker.uploadGeneral });
                                this.setState({photo:res, image: 1,});
                            } 
                            this.setState({isLoading:false});
                        }).catch((err) => {
                            this.setState({ 
                                isLoading:false, 
                                alertErrorText: strings.imagePicker.error,
                                showErrorAlert:true});  
                            this.setState({isLoading:false});
                        });



                    });
                })
                .catch(err => {
                    this.setState({isLoading:false});
                });
            }
        });
    }
    selectTag(item, index){
        let tagSelected = [];
        let exist = this.state.tags.findIndex(element => element.tag === item.tag);
        tagSelected = this.state.tags;
        if( exist == -1){                
            tagSelected.push(item); 
        } else {
            tagSelected.splice(exist,1);
        }
        this.setState({
            tags: tagSelected
        });
    }
    renderItem = ({ item, index }) => {
        let isSelected = false;
        if(this.state.tags && this.state.tags.length > 0){
            var result = this.state.tags.find( element => element.tag === item.tag );
            if(result != undefined){
                isSelected = true;
            } else {
                isSelected = false;
            }            
        }
        if (item.empty === true) {
            return <View key={item.id} style={[styles.item, styles.itemInvisible]} />;
        }   
        return (            
                <View key={item.id} style={ isSelected ? 
                    [styles.tagSelectContainer, styles.item]
                    :
                    [styles.tagContainerUnselect, styles.item]
                    }>      
                    <TouchableOpacity onPress={() => this.selectTag(item, index)} style={{width:'100%'}}>  
                        <Text style={ isSelected ? 
                            styles.tagSelected
                            :
                            styles.tagUnselected
                            }>
                            {item.tag}
                        </Text>
                    </TouchableOpacity>
                </View>
        );
    };
    _saveEntity(){
        this.setState({isLoading:true});
        var geom = `POINT (${this.state.center.longitude} ${this.state.center.latitude})`;
        var reportEntity = {
            geom: geom,
            title: this.state.titleReport,
            status: 'open',
            street: this.state.street,
            image: this.state.photo,
            tags: this.state.tags,
            body: this.state.report,
            boundary: this.state.boundary,
        }
        ReportService.addReport(
            reportEntity
        )            
        .then((res) => res.json())
        .then(res => {
            if(res.status == 200 || res.status == 201){
                var eventResponseVM = res;
                if(eventResponseVM.points > 0) {
                    setTimeout(() => {
                        this.setState({ 
                            close: true,
                            gamificationAlertGeneralText: strings.reportForm.alerts.pointsMsg,
                            eventResponseVM:eventResponseVM});
                    },100)
                }  else {
                    this.setState({showSuccessAlert:true, alertSuccessText:strings.general.confirmationSave});
                }
                this.setState({isLoading:false});        
            } else {
                this.setState({showAlertRetry:true});
                this.setState({isLoading:false});
            }
        }).catch((e) => {
            this.setState({showAlertRetry:true});
            this.setState({isLoading:false});
        });
    }
    handleSelectItem(item, index) {
        this.setState({
            boundary: item
        });
    }
    render() {
        const { goBack } = this.props.navigation;
        return ( 
            <SafeAreaView style={{flex:1, justifyContent:'center'}}> 
                { this.state.enabled ? 
                    <KeyboardAwareScrollView ref='_scrollView' extraHeight={100}>
                        <View style={styles.content}>
                            <View style={{backgroundColor:"#F6F6F9"}}>
                                <View style={styles.contain}>
                                    <Row>
                                        <Col style={{ width: 40, marginRight: 20,}}>
                                            <Image source={require('../../resources/global/icon-tree-gen.png')} style={styles.icon}/>
                                        </Col>
                                        <Col>
                                            <Text style={styles.message1}>{strings.reportForm.message1}</Text>
                                            <Text style={styles.message2}>{strings.reportForm.message2}</Text>
                                        </Col>
                                    </Row>
                                </View>
                            </View>
                            <View style={{backgroundColor:"#F5A623"}}>
                                <View style={styles.contain}>
                                    <Text style={styles.mapIndication}>{strings.reportForm.mapIndication}</Text>
                                </View>
                            </View>
                            <View style={{borderBottomColor:'#B5B6B4', borderBottomWidth:1}}>
                                { this.state.mapLoaded &&
                                    <MapView style={{ flex: 1, height:211 }}
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
                                        <UrlTile urlTemplate={ constants.baseLayer +  "{z}/{x}/{y}.jpg" } zIndex={149} />
                                        <MapView.Marker
                                                draggable
                                                coordinate={this.state.center}
                                                onDragEnd={(e) => {
                                                const { width } = Dimensions.get('window');
                                                this.state.center = e.nativeEvent.coordinate;
                                                this.state.center.latitudeDelta = 0.001;
                                                this.state.center.longitudeDelta = 0.001 * Math.round(width) / 200;
                                                this.setState({ center:this.state.center });
                                            }}>
                                            <Image resizeMode='contain' source={require('../../resources/trees/marker.png')} style={{ width: 25, height: 42 }} />
                                        </MapView.Marker>
                                    </MapView>
                                }
                            </View>
                            <View style={styles.container}>                             
                                <Form>
                                    <Text style= {styles.label}> {strings.reportForm.reportTitle} </Text>
                                    <Input  
                                            ref="titleReport"
                                            ref={component => this._titleReport = component}
                                            style={ [styles.input, {borderBottomColor: '#b5b6b4', borderBottomWidth:1}] } 
                                            onChangeText={ (text) => this.setState({ titleReport: text }) }/>
                                
                                    { this.isFieldInError('titleReport') && this.getErrorsInField('titleReport').map((errorMessage, i) => {
                                        return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                    })}

                                    
                                    <Text style= {[styles.label,{marginTop:20}]}> {strings.reportForm.street} </Text>
                                    <Input  
                                            ref="street"
                                            ref={component => this._street = component}
                                            style={ [styles.input, {borderBottomColor: '#b5b6b4', borderBottomWidth:1}] } 
                                            onChangeText={ (text) => this.setState({ street: text }) }/>
                                
                                    { this.isFieldInError('street') && this.getErrorsInField('street').map((errorMessage, i) => {
                                        return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                    })}


                                    <Textarea rowSpan={5} style={[ styles.input, { borderColor:'#666', borderBottomWidth:0.5, 
                                                lineHeight:14, borderLeftWidth: 0.5, borderRightWidth:0.5, borderTopWidth:0.5, marginTop:25}]}
                                        ref="report"
                                        ref={component => this._report = component}
                                        value={this.state.report} 
                                        onChangeText={ (text) => this.setState({ report: text }) }
                                        placeholder= {strings.reportForm.reportPlaceHolder} 
                                    />        
                                    { this.isFieldInError('report') && this.getErrorsInField('report').map((errorMessage, i) => {
                                        return <Text key={i} style={ styles.error }>{errorMessage}</Text>;
                                    })}                                                     
                                
                                    <Text style= {[styles.label, {marginTop:25,} ]}> {strings.reportForm.boundary} </Text>                                
                                        <Autocomplete
                                        ref="address"
                                        noDataText={ strings.emptyList }      
                                        noDataTextStyle={{ fontSize:11, padding:10}}  
                                        listItemTextStyle={{fontSize:11}}                       
                                        fetchDataUrl={AppConstants.api.boundary}   
                                        style={styles.autocompleteInput}
                                        inputStyle={[  styles.input]} 
                                        placeholder={ strings.search } 
                                        placeholderColor = {'#565656'}
                                        scrollToInput={ev => {}}
                                        handleSelectItem={(item, id) => this.handleSelectItem(item, id)}
                                        renderIcon={() => ( null )}
                                        onDropdownShow={() => ( null )}
                                        onDropdownClose={() => ( null  )}
                                        minimumCharactersCount={1}
                                        valueExtractor={item => item.name}
                                        /> 
                                    { this.state.noBoundary ?
                                        <Text style={ styles.error }> {strings.reportForm.validations.noBoundary} </Text> 
                                        :
                                        null
                                    }                            
                                </Form>
                                <View style={{marginTop:35, marginBottom:30,}}>
                                    {  this.state.loadingImage &&
                                        <ActivityIndicator style={{alignSelf:'center', marginTop:20}} size="large" color="#32AA77" />
                                    }  
                                    { this.state.photo != null &&
                                        <View >
                                            <Image 
                                                resizeMode="cover" 
                                                style={{ width:'100%', height: 200, resizeMode:'contain', marginBottom: 15,}} 
                                                onLoadStart={() => { this.setState({loadingImage: true}); }}
                                                onLoadEnd={() => { this.setState({loadingImage: false}); }}
                                                source={{ 
                                                    headers: { Pragma: 'no-cache',  'Authorization' : "Bearer " + this.props.idToken },
                                                    uri: AppConstants.base + this.state.photo.uri }} 
                                            />
                                        </View>
                                    }
                                    <TouchableOpacity onPress={() => this.selectPhoto() } >
                                        <View style={{flexDirection:'row'}}>
                                            <Image source={require('../../resources/global/icon-photo-add-v2.png')} style={{width: 25, height: 25, resizeMode:'contain' }}/>
                                            <Text style={styles.addPhotoText} >{strings.reportForm.addPhoto}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={{height:1, backgroundColor:"#b5b6b4", marginTop:15,}} ></View>
                                    { this.state.noPhoto ?
                                        <Text style={ styles.error }> {strings.reportForm.validations.noPhoto} </Text> 
                                        :
                                        null
                                    }   
                                </View>                            
                                <View style={{marginBottom:20,}}>
                                    <View style={{flexDirection:'row'}}>
                                        <Image source={require('../../resources/global/icon-tag.png')} style={{width: 24, height: 19, resizeMode:'contain' }}/>
                                        <Text style={styles.tagsText} >{strings.reportForm.tags}</Text>                                
                                    </View>                            
                                </View>
                                <View style={{borderColor:'#cfcecf', borderWidth: 1, }}>
                                            <FlatList
                                            extraData={this.state}
                                            data={formatData(this.state.tagsData, numColumns)}
                                            keyExtractor={(item, index) => item.id+''}
                                            styles= {[styles.container, {flexGrow: 0}]}                                       
                                            numColumns= {numColumns}
                                            renderItem= {this.renderItem}
                                        /> 
                                </View>
                                { this.state.noTag ?
                                    <Text style={ styles.error }> {strings.reportForm.validations.noTag} </Text> 
                                    :
                                    null
                                }    
                                <View style={styles.content}>
                                    <Text style={{marginTop: 25, fontSize:10, color:'#737373'}}> {strings.reportForm.validations.mandatory} </Text>
                                </View>

                                <View style={styles.buttonContainer}>
                                    <Button block success style={ styles.reportButton } onPress={this._onPressButton}>
                                        <Text style= { styles.report }>{ strings.reportForm.report }</Text>
                                    </Button>
                                </View>
                            </View>    
                        </View> 
                    </KeyboardAwareScrollView>
                    :
                    <View style={{width:'100%', height:200}}>
                        <Text style={[globalStyles.text,{width:300, margin:20, textAlign:'center', alignSelf:'center'}]}>{this.state.plainBody }</Text>
                        <View style={[ styles.buttonContainer, {position:'absolute', bottom:10, alignSelf:'center'}]}>
                                <Button block style={ styles.continueButton } onPress={() => {
                                            let phoneNumber = '';
                                            if (Platform.OS === 'android') { phoneNumber = `tel:${this.state.phone}`; }
                                            else {phoneNumber = `telprompt:${this.state.phone}`; }
                                            Linking.openURL(phoneNumber);
                                    }}>
                                    <Text style= { styles.continueLabel }><Icon name="ios-call" style={{ fontSize:20, color:'white'}}/> {' ' + this.state.phone }</Text>
                                </Button>
                        </View>
                    </View> 
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
                { /* Alert cancel  */}
                <AwesomeAlertPlus
                    show={ this.state.showAlertCancel }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton={false}
                    customView = {  <View> 
                                        <View style={{marginHorizontal:'15%'}}>
                                            <Text style={ globalStyles.alertTitle }> {strings.reportForm.alerts.cancel} </Text>
                                            <Text style={ globalStyles.alertText}> {strings.reportForm.alerts.cancelMsg } </Text>
                                        </View>
                                        <View style={{flexDirection:'row',marginTop:10}}>
                                            <Button transparent style={[styles.cancelButton, { borderRight: 1, borderColor: '#AFADAD', borderRightWidth: 1}]}
                                                onPress={ () => this.setState({showAlertCancel:false})}>
                                                <Text style={styles.alertCancelButtonText}> {strings.reportForm.alerts.cancelBtn}</Text>
                                            </Button>
                                            <Button transparent style={[styles.cancelButton]} onPress={ () => {
                                                this.setState({
                                                    showAlertCancel:false
                                                });
                                                setTimeout(()=>{
                                                    this.props.navigation.goBack();
                                                },1000);
                                             }}>
                                                <Text style={styles.alertCancelButtonText}> {strings.reportForm.alerts.cancelConfirm}</Text>
                                            </Button>
                                        </View>
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
                 { /* Gamification alert */}
                <GamificationAlert 
                    close = {true}
                    backFunc = { () => { this.props.navigation.goBack() }}
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
    contain:{
        marginHorizontal: 40,
        paddingVertical: 20,
    },
    container:{
        marginHorizontal: 30,
        paddingVertical: 20,
    },
    icon: {
        width:34,
        height:50,
        resizeMode: 'contain'
    },
    message1:{
        fontSize: 14,
        fontWeight: '400',
        color: "#737373",
        lineHeight:22
    },
    message2:{
        fontSize: 14,
        fontWeight: '700',
        color: "#646465",
        lineHeight:22
    },
    mapIndication:{
        fontSize: 14,
        fontWeight: '400',
        color: "#fff",
        textAlign: 'center',
        lineHeight:22
    },
    addPhotoText:{
        color:'#2cA06c',
        fontSize: 14,
        fontWeight: '400',
        paddingLeft: 15,
        top: 3,
    },
    item: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        margin: 5,
    },
    itemInvisible: {
        backgroundColor: 'transparent',
    },
    tagsText:{
        color:'#828382',
        fontSize: 14,
        fontWeight: '400',
        paddingLeft: 15,
    },
    tags:{
        color: '#828382', 
        fontSize: 14, 
        fontWeight:'400',
   },
    tagContainerUnselect:{
        backgroundColor: "#ededed", 
        borderColor: "#ededed",
        borderWidth: 2,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    tagSelectContainer:{
        backgroundColor: "#fff", 
        borderColor: "#2CA06C",
        borderWidth: 2,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    tagUnselected:{
        color: '#9b9b9b', 
        fontSize: 11, 
        fontWeight:'500',
        textAlign:'center',
    },
    tagSelected:{
        color: '#2ca06c', 
        fontSize: 11, 
        fontWeight:'500',
        textAlign:'center',
    },
    buttonContainer: {
        marginLeft: 60,
        marginRight: 60,
        marginBottom: 30,
        marginTop: 25,
    },
    reportButton: {
        backgroundColor:'#EA585E', 
        borderRadius: 5,
    },
    report: {
        fontWeight:'bold',
        color: 'white',
    },
    error: {
        color: "#EA585E",
        fontSize: 12,
        paddingTop:10,
        paddingLeft:0,
        paddingBottom:10   
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
    autocompleteInput: {
        maxHeight: 40,
        borderWidth: 0,
    },
    input: { 
        color: '#7C7C7C', 
        fontSize: 14,
        lineHeight: 20,
        borderWidth: 0,
        borderBottomColor:'#B5B6B4', 
        borderBottomWidth:1,
    },
    label:{
        fontSize: 14,
        fontWeight: '700',
        color: '#737373'
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
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        color: '#fff'
    },
    continueButton: {
        backgroundColor:'#41B07C', 
        borderRadius: 5,
        justifyContent:'center',
        alignItems: 'center',
    },
    continueLabel: {
        fontWeight:'bold',
        color: 'white',
        textAlign: 'center',
        alignSelf: 'center',
        justifyContent:'center',
        alignItems: 'center',
        marginHorizontal:50
    },
});
 
const mapStateToProps = (state) => {
    return {
        param: state.param,
        idToken: state.user.id_token,
        user: state.user,
        loggedInStatus: state.loggedInStatus,
        reportModule: state.config.application.dynamic.reportModule,
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}


export default connect(mapStateToProps, mapDispatchToProps)(ReportForm);