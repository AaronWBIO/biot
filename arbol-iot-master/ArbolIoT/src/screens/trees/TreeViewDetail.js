import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import {
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    View,
    Dimensions,
    FlatList,
    PixelRatio,
    Platform,
    ActivityIndicator
} from 'react-native';
import GamificationAlert from '../../components/awesome-alert/GamificationAlert';
import { Item, Button, Card, Badge, CardItem, Left, Body, Label, Input, Icon } from 'native-base';
import MapView , { UrlTile, WMSTile, Marker, Polygon } from '@jmruvalcabav/react-native-maps';
import strings from '../../config/languages';
import Lightbox from 'react-native-lightbox';
import TreeService from '../../services/tree';
import Share from 'react-native-share';
import _ from 'lodash';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import constants from '../../config/constants';
import ImageWithAuth from '../../components/image';
import AdoptionService from '../../services/adoptions';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import globalStyles from '../../styles/global';
import ReportService from '../../services/report';
import Loader from '../../components/loader/Loader';
const Wkt = require("wicket");
const BASE_PADDING = 10;

class TreeViewDetail extends Component {
    static navigationOptions = ({ navigation}) => ({
        title: `${navigation.state.params.title ? navigation.state.params.title : ''}` ,
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
        const { navigation } = this.props;
        this.state = {
            isLoading: false,
            optionalCameraProps: {},
            showErrorAlert: false,
            alertErrorText: '',
            showSuccessAlert: false,
            alertSuccessText: '',
            close: true,
            backFunc: () => {},
            gamificationAlertGeneralText: '',
            eventResponseVM: {},
            opacity: 1,
            view: true,
            treeEntity: {},
            mapLoaded: false,
            ecoBenefits: null,
            ecoBenefitsLoading: true,
            perms: {
                treeAoption: {
                    interact: { status:true }
                }
            }
        }  
        this.state.id =  navigation.getParam('id', '0').replace("tree.","");
        this.state.mode = navigation.getParam('mode', null);
        this.permsMaping();  
    }
    componentDidMount() {
        this.setState({ view: false, isLoading: true });
        this.loadEntity();
        this.props.navigation.setParams({
            title: this.state.mode == 'validate' ? strings.treeDetailFull.validateTitle : strings.treeDetailFull.title
        });
        // Load eco-benefits
        this.loadBenefits();
        // Add events
        this.subs = [ 
            this.props.navigation.addListener ('willFocus', () => {  
                this.loadEntity(); 
                this.loadBenefits();
            }),
        ];
    }
    componentWillUnmount() {
        // Remove listeners
        this.subs.forEach((sub) => {
            sub.remove();
        });
    }
    permsMaping() {
        this.state.perms.treeAoption.interact = GeneralHelpers.hasPermission('treeAoption','interact').remote == true ?
          GeneralHelpers.hasPermission('treeAoption','interact') :
          this.state.perms.treeAoption.interact;
    }
    loadBenefits() {
        if (this.state.id > 0) {
            this.setState({ecoBenefitsLoading:true});
            ReportService.getEcoBenefitsBySingleId(this.state.id).then((res) => {
                if(res.status==200 || res.status == 201){
                    let result = JSON.parse(res._bodyText);
                    if ( result['airQuality'] != undefined ) {
                        this.setState({
                            ecoBenefits: result,
                            ecoBenefitsLoading:false
                        });
                    } else {
                        this.setState({
                            ecoBenefits: null,
                            ecoBenefitsLoading:false
                        });
                    }
                }
                this.setState({ecoBenefitsLoading:false});  
            })
            .catch((e) => {
                this.setState({ecoBenefitsLoading:false});
            });
        }
    }
    loadEntity() {
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
                // Convert measures
                if (res.diameter != undefined && res.diameter != null && !isNaN(res.diameter))
                    res.diameter = ( res.diameter * 100 ).toFixed(2);
                if (res.canopyDiameter != undefined && res.canopyDiameter != null && !isNaN(res.canopyDiameter))
                    res.canopyDiameter = ( res.canopyDiameter * 100 ).toFixed(2);
                this.setState({treeEntity: res});
                if ( Platform.OS === 'android') {
                    this.setState({
                        optionalCameraProps: {
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
                        optionalCameraProps: {}
                    })
                }
                this.setState({mapLoaded:true});
            } else {
                this.setState({opacity:0.5});
            }
            var e = this;
            setTimeout(()=>{
                e.setState({view:true, isLoading: false});
            },1000);
        }).catch((e) => {
            console.log(e);
            this.setState({opacity:0.5});
            this.setState({view:true, isLoading: false});
        });
    }
    // Validate status @ToDo replace for specific service
    _saveEntity = () => {
        this.state.treeEntity.status = 'VALIDATED';
        TreeService.update(
            this.state.treeEntity
        )            
        .then((res) => res.json())
        .then(res  => {
            if (_.has(res,"original.id")) {
                if (res.alter == true) {
                    this.setState({ 
                        close: !this.state.adopt,
                        backFunc: () => {
                            this.props.navigation.goBack() 
                        },
                        gamificationAlertGeneralText: strings.general.confirmationSave,
                        eventResponseVM:res});
                } else {
                    this.setState({
                        showSuccessAlert: true,
                        alertSuccessText: strings.general.confirmationSave
                    });
                }
            } else {
                this.setState({
                    showErrorAlert: true,
                    alertErrorText:  strings.general.error
                });
            }
        }).catch((e) => {
            this.setState({
                showErrorAlert: true,
                alertErrorText:  strings.general.error
            });
        });
    }   
    _adoptTree = (tid) => {
        this.setState({isLoading:true});
        AdoptionService.treeAdopt(tid)        
        .then((res) => {
            res = JSON.parse(res._bodyText); 
            if(_.has(res,'original.tree.id')) {
                this.props.addTreeToLocalRepository(res.original.tree);  
                if (res.alter) {
                    this.setState({ 
                        close: false,
                        backFunc: () => { },
                        gamificationAlertGeneralText: strings.general.confirmationAdoption,
                        eventResponseVM:res});
                } else {
                    this.setState({
                        showSuccessAlert: true,
                        alertSuccessText: strings.general.confirmationAdoption
                    });
                }
            }
        }).catch((e) => {
            this.setState({isLoading:false});
        });
    }         
    render() {
        return ( 
            <SafeAreaView style={{flex:1}} opacity={this.state.opacity}>
                { this.state.isLoading &&
                    <Loader></Loader>
                }    
                <ScrollView ref='_scrollView'>     
                    { this.state.treeEntity.id != undefined && this.state.view  == true &&               
                    <View>
                        <View>
                            <Card style= { [ styles.cardNoMargin , { backgroundColor:'#F4F4F6'} ] }>
                                <CardItem style={{ backgroundColor:'#F4F4F6'}}>
                                    <Left>
                                        { this.state.treeEntity.images != undefined &&
                                          this.state.treeEntity.images.length > 0 && 
                                          this.state.treeEntity.images[0].id != undefined ?
                                          <ImageWithAuth 
                                            resizeMode="cover" 
                                            style={ [ styles.imgTree ] }
                                            source={{ uri: constants.base + this.state.treeEntity.images[0].uri + "?last=" + this.state.treeEntity.images[0].lastModifiedDate }} />
                                          :
                                          <Image source={require('../../resources/global/default-tree-img.png')}  style={ [ {marginLeft:10}, styles.imgTree]}/>
                                        }                                        
                                        <Body>
                                            <Text style={styles.specieName}>
                                            { _.has(this.state, 'treeEntity.specie.commonName') ? 
                                                this.state.treeEntity.specie.commonName : strings.noSpecie
                                            }
                                            </Text>
                                            <Text style={styles.specieCommon}>
                                            { _.has(this.state, 'treeEntity.specie.genus') ? 
                                                this.state.treeEntity.specie.genus : strings.noSpecie
                                            }
                                            </Text>
                                            {
                                                (_.has(this.state.treeEntity, 'status') && this.state.treeEntity.status  == "DRAFT") &&
                                                <Badge success style={[ styles.badge , { backgroundColor: '#F5A623'}]}>
                                                    <Text style={styles.badgeText}>{strings.treeDetailFull.treeDraft}</Text>
                                                </Badge>
                                            }
                                            {
                                                ( !_.has(this.state.treeEntity, 'status') || this.state.treeEntity.status  == "INCOMPLETE" ||
                                                    this.state.treeEntity.status  == null
                                                ) &&
                                                <Badge success style={[ styles.badge , { backgroundColor: '#737373'}]}>
                                                    <Text style={styles.badgeText}>{strings.treeDetailFull.treeIncomplete}</Text>
                                                </Badge>
                                            }
                                            {
                                                (_.has(this.state.treeEntity, 'status') && this.state.treeEntity.status  == "VALIDATED") &&
                                                <Badge success style={[ styles.badge , {  backgroundColor: '#2CA06C'}]}>
                                                    <Text style={styles.badgeText}>{strings.treeDetailFull.treeValidated}</Text>
                                                </Badge>
                                            }

                                            {
                                                ( (!_.has(this.state.treeEntity, 'status') || this.state.treeEntity.status  == "INCOMPLETE" ||
                                                this.state.treeEntity.status  == null ) && this.state.mode != 'validate'
                                                ) &&
                                                 <Button onPress={(id) => { 
                                                    this.props.navigation.navigate('TreeEditForm',{ id:this.state.id, mode:'edit' });                                                
                                                    }} style={[ { backgroundColor: '#41B07C', height:30, marginTop:10, paddingLeft:10, paddingRight:10, justifyContent:'center' }]}>
                                                    <Text style={[styles.badgeText,{ fontWeight:'bold'}]}>Editar árbol</Text>
                                                </Button>
                                            }
                                        </Body>
                                    </Left>
                                </CardItem>
                            </Card>
                        </View>
                        { (this.state.mode != 'validate') &&
                            <View pointerEvents="none">
                                { this.state.mapLoaded &&
                                <MapView style={{ flex: 1, height:200 }}
                                    ref="map"
                                    provider="google"
                                    pointerEvents="none"
                                    mapType={ "none" }
                                    showsCompass={false}
                                    initialRegion= {{
                                        latitude: this.state.center.latitude,
                                        longitude: this.state.center.longitude,
                                        latitudeDelta: this.state.center.latitudeDelta,
                                        longitudeDelta:this.state.center.longitudeDelta,
                                    }}
                                    { ...this.state.optionalCameraProps }
                                    toolbarEnabled={false}>
                                    <UrlTile urlTemplate={ constants.baseLayer + "{z}/{x}/{y}.jpg"} zIndex={149} />
                                    <MapView.Marker  coordinate={this.state.center} >
                                        <Image resizeMode='contain' source={require('../../resources/trees/marker.png')} style={{ width: 25, height: 42 }} />
                                    </MapView.Marker>
                                </MapView>
                                }
                            </View>
                        }
                        <View style={[{backgroundColor: '#41B07C' }, styles.sectionStyle]}>
                            <Text style={styles.sectionTitle}> {strings.treeDetailFull.treeInformation} </Text>
                        </View>
                        <View style={ styles.formStyle}>
                            <Item stackedLabel style={styles.item}>
                                <Label style={styles.stackedLabel}>{ strings.treeDetailFull.specie}</Label>
                                <Input 
                                        ref="specie"
                                        editable={false}                                        
                                        ref={component => this._specie = component}
                                        value= { this.state.treeEntity.specie ? this.state.treeEntity.specie.commonName : '' }
                                        style={ styles.input } />
                            </Item>
                            <Item stackedLabel style={styles.item}>
                                <Label style={styles.stackedLabel}>{ strings.treeDetailFull.treeID}</Label>
                                <Input 
                                        ref="treeID"
                                        ref={component => this._treeID = component}
                                        editable={false}                                        
                                        value= { this.state.treeEntity.id + '' }
                                        style={ styles.input }  />
                            </Item>
                            <Item stackedLabel style={styles.item}>
                                <Label style={styles.stackedLabel}>{ strings.treeDetailFull.trunkDiameter}</Label>
                                <Input 
                                        ref="trunkDiameter"
                                        ref={component => this._trunkDiameter = component}
                                        value= {this.state.trunkDiameter}
                                        editable={false}                                        
                                        value= { 
                                            _.has(this.state.treeEntity,'diameter') && this.state.treeEntity.diameter != null  ?
                                            this.state.treeEntity.diameter + ' cm' : ''}
                                        style={ styles.input } />
                            </Item>         
                            <Item stackedLabel style={styles.item}>
                                <Label style={styles.stackedLabel}>{ strings.treeDetailFull.treeCanopyDiameter}</Label>
                                <Input 
                                        ref="treeCanopyDiameter"
                                        ref={component => this._treeCanopyDiameter = component}
                                        editable={false}                                        
                                        value= { 
                                            _.has(this.state.treeEntity,'canopyDiameter') && this.state.treeEntity.canopyDiameter != null ?
                                            this.state.treeEntity.canopyDiameter + ' cm' : ''
                                        }
                                        style={ styles.input }  
                                        onChangeText={ (text) => this.setState({ treeTopDimmeter: text }) }/>
                            </Item>   
                            <Item stackedLabel style={[styles.item ,{ marginBottom:30}]}>
                                <Label style={styles.stackedLabel}>{ strings.treeDetailFull.treeHeight}</Label>
                                <Input 
                                        ref="treeHeight"
                                        ref={component => this._treeHeight = component}
                                        editable={false}                                        
                                        value= { 
                                            _.has(this.state.treeEntity,'height') && this.state.treeEntity.height != null ?
                                            this.state.treeEntity.height + ' m' : ''}
                                        style={ styles.input }  
                                        onChangeText={ (text) => this.setState({ treeHeight: text }) }/>
                            </Item>
                        </View>
                        { (this.state.mode != 'validate') &&
                            <View style={[{backgroundColor: '#9b9b9b'}, styles.sectionStyle]}>
                                <Text style={styles.sectionTitle}> {strings.treeDetailFull.benefits} </Text>
                            </View>
                        }
                        { (this.state.mode != 'validate') && this.state.ecoBenefitsLoading && 
                            <ActivityIndicator color='#2CA06C' size='large' style={{ alignSelf:'center', margin:20 }} />
                        }
                        { (this.state.mode != 'validate') && !this.state.ecoBenefitsLoading && this.state.ecoBenefits == null && 
                            <Text style={{color: '#737373', alignSelf:'center', padding:20}}>{strings.treeDetailFull.availableBenefits}</Text>
                        }
                        { (this.state.mode != 'validate') && !this.state.ecoBenefitsLoading && this.state.ecoBenefits != undefined && this.state.ecoBenefits != null && 
                            <View style={ styles.formStyle}>
                                { this.state.ecoBenefits['energy'] != undefined  && this.state.ecoBenefits['energy']['value'] != undefined &&
                                <Item stackedLabel style={styles.item}>
                                    <Label style={styles.stackedLabelG}>{ strings.treeDetailFull.conservedEnergy}</Label>
                                    <Input 
                                            ref="conservedEnergy"
                                            editable={false}                                        
                                            ref={component => this._conservedEnergy = component}
                                            value= {this.state.ecoBenefits['energy']['value'] + " " + this.state.ecoBenefits['energy']['unit'] + strings.treeDetailFull.yearSuffix }
                                            style={ styles.input }  
                                            onChangeText={ (text) => this.setState({ conservedEnergy: text }) }/>
                                </Item>
                                }
                                { this.state.ecoBenefits['airQuality'] != undefined  && this.state.ecoBenefits['airQuality']['value'] != undefined &&
                                <Item stackedLabel style={styles.item}>
                                    <Label style={styles.stackedLabelG}>{ strings.treeDetailFull.ImprovedAirQuality}</Label>
                                    <Input 
                                                ref="ImprovedAirQuality"
                                        editable={false}                                        
                                        ref={component => this._ImprovedAirQuality = component}
                                        value= {this.state.ecoBenefits['airQuality']['value'] + " " + this.state.ecoBenefits['airQuality']['unit'] + strings.treeDetailFull.yearSuffix  }
                                        style={ styles.input }  
                                        onChangeText={ (text) => this.setState({ ImprovedAirQuality: text }) }/>
                                </Item>
                                }
                                { this.state.ecoBenefits['co2Removed'] != undefined  && this.state.ecoBenefits['co2Removed']['value'] != undefined &&
                                <Item stackedLabel style={styles.item}>
                                    <Label style={styles.stackedLabelG}>{ strings.treeDetailFull.co2Removed}</Label>
                                    <Input 
                                            ref="co2Removed"
                                            editable={false}                                        
                                            ref={component => this._specie = component}
                                            value= {this.state.ecoBenefits['co2Removed']['value'] + " " + this.state.ecoBenefits['co2Removed']['unit'] + strings.treeDetailFull.yearSuffix  }
                                            style={ styles.input }  
                                            onChangeText={ (text) => this.setState({ co2Removed: text }) }/>
                                </Item>
                                }
                                { this.state.ecoBenefits['co2Storage'] != undefined  && this.state.ecoBenefits['co2Storage']['value'] != undefined &&
                                <Item stackedLabel style={styles.item}>
                                    <Label style={styles.stackedLabelG}>{ strings.treeDetailFull.co2Storage}</Label>
                                    <Input 
                                            ref="co2Storage"
                                            editable={false}                                        
                                            ref={component => this._specie = component}
                                            value= {this.state.ecoBenefits['co2Storage']['value'] + " " + this.state.ecoBenefits['co2Storage']['unit'] + strings.treeDetailFull.toDateSuffix }
                                            style={ styles.input }  
                                            onChangeText={ (text) => this.setState({ co2Storage: text }) }/>
                                </Item>
                                }
                                { this.state.ecoBenefits['stormWater'] != undefined  && this.state.ecoBenefits['stormWater']['value'] != undefined &&
                                <Item stackedLabel style={styles.item}>
                                    <Label style={styles.stackedLabelG}>{ strings.treeDetailFull.stormWater }</Label>
                                    <Input 
                                            ref="stormWater"
                                            editable={false}                                        
                                            ref={component => this.stormWater = component}
                                            value= {this.state.ecoBenefits['stormWater']['value'] + " " + this.state.ecoBenefits['stormWater']['unit'] + strings.treeDetailFull.yearSuffix  }
                                            style={ styles.input }  
                                            onChangeText={ (text) => this.setState({ anualBenefits: text }) }/>
                                </Item>
                                }
                            </View>
                        }
                        <View style={[{backgroundColor: '#41B07C'}, styles.sectionStyle]} >
                            <Text style={styles.sectionTitle}> {strings.treeDetailFull.seasonalPhotos} </Text>
                        </View>
                        <View style={[styles.row , { alignSelf:'center', textAlign:'center', justifyContent:'center'}]}>
                            { this.state.treeEntity.images != undefined &&
                                this.state.treeEntity.images.length > 0 &&
                                this.state.treeEntity.images[0].id != undefined ?
                                    <View style={{ width:'100%'}}>
                                        <FlatList
                                            style={{ alignSelf:'center', textAlign:'center'}}
                                            data={ this.state.treeEntity.images }
                                            numColumns= {2}
                                            keyExtractor={ (item, index) => item.id }
                                            renderItem= {({ item, key }) => {
                                                if (item.empty === true) {
                                                return <View key={key}/>;
                                                }
                                                return (
                                                    <Lightbox key={key} activeProps={{ flex: 1, width:'100%' }}>
                                                        <View style={[styles.square]}>
                                                            <ImageWithAuth  
                                                                style={{ flex: 1}} 
                                                                source={{ uri: constants.base + item.uri + "?last=" + item.lastModifiedDate }} />
                                                        </View>
                                                    </Lightbox>
                                                );
                                            }}
                                        />
                                        <View style={[ styles.buttonContainer, { marginTop:30 } ]}>
                                                <Button block transparent style={ [ styles.continueButton, { backgroundColor:'white', borderColor:'#2CA06C', borderWidth:1 }] } onPress={() => { 
                                                        this.props.navigation.navigate('TreePhotos',{ id:this.state.id});
                                                    }}>
                                                    <Text style= {  [ styles.continueLabel, { color:'#2CA06C'} ] }>{ strings.treeDetailFull.viewPhotos }</Text>
                                                </Button>
                                        </View>
                                    </View>
                                :
                                <TouchableOpacity>
                                    <Image
                                        style={{ height:80, width:80, alignSelf:'center', marginTop:20}}
                                        resizeMode="contain"
                                        source={ require('../../resources/global/icon-photo-add.png')}
                                    />
                                    <Text style={styles.photoChangeText}>{ strings.treeDetailFull.noPhotos }</Text>
                                </TouchableOpacity>
                            }              
                        </View>
                        <View style={{ width:'100%', height:1, backgroundColor:'#D2D3D2', marginTop:20, marginBottom:20}}></View>
                        <View style={ [ styles.buttonContainer, { marginTop:20, marginBottom:30, height:'auto' }]}>
                            { ( _.has(this.state,'treeEntity.adopted') && this.state.treeEntity.adopted == false && this.state.treeEntity.status == "VALIDATED" && this.state.perms.treeAoption.interact.status == true) && 
                            <Button block success style={[styles.continueButton, {marginBottom:15}] } onPress={() => { 
                                    this._adoptTree(this.state.treeEntity.id);
                                }}>
                                <Text style= { styles.continueLabel }>{ strings.treeDetailFull.adoptLabel}</Text>
                            </Button>
                            }
                            { (this.state.mode == 'validate') &&
                                <Button block success style={ [styles.validationButtons, {marginBottom:15}] } onPress={this._saveEntity}>
                                    <Text style= { styles.validations }>{ strings.treeDetailFull.treeValidation }</Text>
                                </Button>
                            }
                            { (this.state.mode == 'validate') &&
                                <Button block success style={ [styles.validationButtons, {marginBottom:15}] } onPress={(id) => {
                                    this.props.navigation.navigate('TreeEditForm',{ id:this.state.id, mode:'validate' });}}>
                                    <Text style= { styles.validations }>{ strings.treeDetailFull.treeEdit }</Text>
                                </Button>
                            }
                            {
                            ( (!_.has(this.state.treeEntity, 'status') || this.state.treeEntity.status  == "INCOMPLETE" ||
                                this.state.treeEntity.status  == null ) && this.state.mode != 'validate'
                                ) &&
                                <Button block success style={[styles.validationButtons, {marginBottom:15}] } onPress={(id) => {
                                    this.props.navigation.navigate('TreeEditForm',{ id:this.state.id, mode:'edit' });}}>
                                    <Text style= { styles.validations }>{ strings.treeDetailFull.treeEdit }</Text>
                                </Button>         
                            }
                            <Button block success style={ [styles.validationButtons, {marginBottom:15}] } onPress={(id) => {
                                this.props.navigation.navigate('TreeComments',{ id:this.state.id });}}>
                                <Text style= { styles.validations }>{ strings.treeDetailFull.treeComments }</Text>
                            </Button>
                            {
                                (this.state.mode != 'validate') &&
                                    <Button 
                                    style={[styles.validationButtons, {marginBottom:15,backgroundColor: '#2CA06C', textAlign:'center', justifyContent:'center'}] }
                                    onPress={() => {
                                                const options = {
                                                    title: strings.treeDetailFull.title + ' ' + this.state.treeEntity.id,
                                                    message: strings.treeDetailFull.title + ' ' + this.state.treeEntity.id,
                                                    subject: strings.treeDetailFull.title + ' ' + this.state.treeEntity.id,
                                                    url: constants.base + '/#/tree/' + this.state.treeEntity.id
                                                };
                                                Share.open(options);
                                            }}>
                                        <Text style={{color: 'white'}}>
                                        <Icon name="share-alt" style={{       
                                                    width: 15,
                                                    height: 20, 
                                                    paddingRight:20,
                                                    fontSize:15,
                                                    color:"white"}}/> {strings.benefits.share}</Text>
                                </Button>     
                            }
                        </View>
                    </View>
                    }
                </ScrollView>    
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
                { /* Gamification alert */}
                <GamificationAlert 
                    close = {true}
                    backFunc = { this.state.backFunc }
                    generalText = { this.state.gamificationAlertGeneralText }
                    eventResponseVM ={ this.state.eventResponseVM } />   
            </SafeAreaView>
        )  
    }
}
const styles = StyleSheet.create({
    cardNoMargin: {
        marginTop:0, 
        marginLeft:0, 
        marginRight:0, 
        marginBottom: 0,
        paddingTop: 15,
        paddingBottom: 15,
        shadowOffset: { width: 5, height: 5 },
        shadowColor: "grey",
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation:5,
    },
    imgTree:{
        height: 85,
        width: 85, 
        borderRadius: 85/2, 
        shadowOffset: { width: 1, height: 1 },
        shadowColor: "grey",
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    specieName: {
        color: '#696767', 
        fontSize: 16,  
        fontWeight: '500',
        marginBottom: 3,
    },
    specieCommon: {
        color: '#757575', 
        fontSize: 14,  
        fontWeight: '400',
        marginBottom: 5,
    },
    badge:{
        paddingLeft: 8, 
        paddingRight: 8, 
        color:'#fff', 
        fontSize: 10, 
        fontWeight: '500',
        height:20,
        justifyContent:'center'
    },
    badgeText:{
        color: '#fff',
        fontSize: 10,
    },
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
    stackedLabelG: {
        color: '#41B07C',
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
    share:{
        flex:1, 
        flexDirection:'row', 
        justifyContent: 'center', 
        alignItems:'center', 
        marginTop: 30,
    },
    row: {
        marginTop: 30, 
        flexDirection: 'row',
        marginLeft: -BASE_PADDING,
        marginRight: -BASE_PADDING,
    },
    square: {
        marginLeft: 20,
        marginRight:20,
        width:81, 
        height:120, 
        marginTop:20, 
        alignSelf:'center'
    },
    buttonContainer:{
        marginLeft: 60,
        marginRight: 60,
        marginTop: 10,
        marginBottom: 20, 
        justifyContent:'center',
        alignItems: 'center',
        height:60
    },
    continueButton: {
        backgroundColor:'#2CA06C', 
        borderRadius: 5,
        justifyContent:'center',
        alignItems: 'center',
        alignSelf:'center',
        width:250
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
    photoChangeText:{
        marginTop: 15, 
        marginBottom: 15,
        alignSelf: 'center',
        textAlign: 'center',
        color:'#828382'
    },
    validationButtons:{
        backgroundColor:'#fff', 
        borderRadius: 5,
        borderColor:"#2EA16E",
        borderWidth: 1,
        width:250,
        alignSelf:'center'
    },
    validations:{
        fontWeight:'bold',
        color: '#2EA16E',
    }, 
});
 
const mapStateToProps = (state) => {
    return {
        loggedInStatus: state.loggedInStatus,
        idToken: state.user.id_token
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(TreeViewDetail);