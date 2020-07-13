import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import ActionCreators  from "../../redux/actions";
import { View, Image, StyleSheet, TouchableOpacity, Dimensions, PixelRatio, Text, FlatList,
         ActivityIndicator, PermissionsAndroid, SafeAreaView, Platform, ScrollView, Keyboard
} from 'react-native';
import MapBar from "../../components/map-bar/index";
import MapView , { UrlTile, WMSTile, Marker, Polygon } from '@jmruvalcabav/react-native-maps';
import { Icon, Button, Thumbnail, CheckBox, Item, Badge } from 'native-base';
import  transparentHeaderStyle  from '../../styles/navigation';
import strings from '../../config/languages';
import { Autocomplete } from "react-native-dropdown-autocomplete";
import { BottomSheet } from 'react-native-btr';
import AppConstants from '../../config/constants';
import { Col,Row, Grid } from "react-native-easy-grid";
import GeoserverService from '../../services/geoserver';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
var Wkt = require("wicket");
var centroid = require('polygon-centroid');
import TreeService from '../../services/tree';
import _ from 'lodash';
import ImageWithAuth from '../../components/image';
import {AsyncStorage} from 'react-native';
import { YellowBox } from 'react-native';
import Loader from '../../components/loader/Loader';
import globalStyles from '../../styles/global';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import colors from '../../styles/colors';

class Trees extends Component {
    static navigationOptions = ({ }) => ({
        headerStyle: transparentHeaderStyle,
        headerTransparent: true,
        headerTintColor: '#FFFFFF00'
    });
    markerValidated = require('../../resources/trees/marker-validated.png');    
    markerValidate = require('../../resources/trees/marker-validate.png');    
    markerIncomplete = require('../../resources/trees/marker-incomplete.png');  
    constructor(props) {
        super(props)          
        this.state = {
            index: 0,
            currentFeature: {},
            redrawMap: 0,
            initialStatePass: false,
            isOffline: false,
            isLocating: true,
            isLoading: false,
            isGettingEntity: false,
            enableOfflineMode: false,
            currentOfflineBoundary: 0,
            showPolygon: false,
            showLayers: true,
            showBottomSheetLayers: false,
            showClear: false,
            addTree: false,
            showAddTreeLayer:false,
            viewTree: false,
            viewMultipleTrees: false,
            addTreeCenter: {},
            mapLayout: {},
            searchGeom: [],
            features: [],
            offlineBoundaries: [],
            baseTemplate: 
                this.props.config.url + "/" + this.props.config.workspace + 
                "/wms?service=WMS&version=1.1.0&request=GetMap&format=image/png&transparent=true&layers={layers}&bbox={minX},"+
                "{minY},{maxX},{maxY}&width={width}&height={height}&srs=EPSG:900913&format_options=dpi:200",
            cqlFilters: "",
            cqlAdvancedFilters: "",
            layers: [],
            mapType: "none",
            zoomProps: {
                minZoomLevel: 12,
                maxZoomLevel: 21 
            }, 
            showOfflineAlert: false,
            showErrorAlert: false,
            alertErrorText: '',
        }  
        // Ignore debug alerts
        YellowBox.ignoreWarnings(["Network", "Warning: "]);
        // Update region
        const { width, height } = Dimensions.get('window');
        this.updateRegion(width, height);
        // Preset optional props
        if ( Platform.OS === 'android') {
            this.state.optionalProps = { 
                initialCamera: {
                    pitch: 45,
                    bearing: 45,
                    heading: -20,
                    altitude: 0,
                    zoom: 18,
                    center: this.state.center
                }
            };
        } else {
            this.state.optionalProps = {};
        }
    }
    componentWillMount() {
        // Redraw map to show compass button
        setTimeout(()=>this.setState({redrawMap: 1}),500);
    }
    async componentDidMount(){
        // Initialize layers
        var l = this.state.layers;
        if (l.length == 0) {
            var i = 0;
            this.props.config.layers.internal.map((layer) => {
                layer.key = i;
                if (i == 0) {
                    layer.active = true;
                } else {
                    layer.active = false;
                }
                layer.url = this.state.baseTemplate.replace("{layers}",layer.params.layers);
                l.push(layer);
                i = i + 1;
            });
            this.setState({layers:l});
        } else {
            var i = 0;
            this.state.layers.map((layer) => {
                layer.key = i;
                i = i + 1;
            });
        }
        // Add events
        this.subs = [ 
            this.props.navigation.addListener ('willFocus', () => { 
                this.setState({ state: this.state });
                this.setState({
                    showLayers: false,
                    addTree: false,
                    showAddTreeLayer: false,
                    viewMultipleTrees: false,
                    viewTree: false
                });
                let self = this;
                setTimeout(() => {
                    self.setState({showLayers: true});
                }, 100);
             }),
        ];
        // Check initial state
        this.checkInitialState();
        // Locate
        setTimeout(() =>{
            this.geolocate(); 
        },1000);
    }
    componentWillUnmount() {
        // Remove offline temporal data
        this.props.clearLocalBoundary();
        // Remove listeners
        this.subs.forEach((sub) => {
            sub.remove();
        });
    }
    componentDidUpdate(prevProps, prevState) {
        if (this.state.isGettingEntity) {
            return;
        }
        if (prevProps.treeLocalRepository != this.props.treeLocalRepository) {
            this.setState({
                showLayers: false,
                addTree: false,
                showAddTreeLayer: false
            });
            let self = this;
            setTimeout(() => {
                self.setState({showLayers: true});
            }, 100);
        }
        if (prevProps.param !== this.props.param) {
            if (this.props.param.cqlAdvancedFilters != undefined &&
                this.props.param.cqlAdvancedFilters != null &&
                this.props.param.cqlAdvancedFilters != ''
                ) {
                this.setState({
                    cqlAdvancedFilters: this.props.param.cqlAdvancedFilters,
                    showLayers: false,
                    showPolygon: false
                });
                let self = this;
                setTimeout(() => {
                    self.setState({showLayers: true});
                }, 100);
            } else {
                this.setState({
                    cqlAdvancedFilters: "",
                    showLayers: false,
                    showPolygon: false
                });
                let self = this;
                setTimeout(() => {
                    self.setState({showLayers: true});
                }, 100);
            } 
        }
    }
    async checkInitialState(){
        if (this.props.mode !== 0) {
            this.setState({ 
                isOffline: false,
                enableOfflineMode: false,
                zoomProps: {                
                   minZoomLevel: 12,
                   maxZoomLevel: 21 
                },
                initialStatePass: true 
            }, () => {
                var prevOnChange = this.refs.address.container._onChange;
                this.refs.address.container._onChange =  (ev) => {
                    this.addressKeyDown(ev)
                    prevOnChange(ev);
                };
            });
        } else {
            await this.prepareOfflineData();
            this.setState({ 
                isOffline: true,
                enableOfflineMode: false,
                zoomProps: {                
                   minZoomLevel: 18,
                   maxZoomLevel: 21
               } 
            }, () => {
                this.setState({showOfflineAlert:true});
            });
        }
    }
    addressKeyDown(text) {
        this.setState({ showClear:true });
    }
    async prepareOfflineData () {
        var data = [];   
        this.state.offlineBoundaries = [];
        var localBoundaries = await AsyncStorage.getItem('localBoundaries');        
        if (localBoundaries == undefined || localBoundaries == null) 
            localBoundaries = {};  
        else 
            localBoundaries = JSON.parse(localBoundaries);
        if (localBoundaries != null && localBoundaries != {}) {
            for (var property in localBoundaries) {
                data.push(localBoundaries[property]);
            }
            this.setState({ offlineBoundaries: data, localBoundaries });
        }
    }
    enableOfflineMode(item) {
        this.setState({ 
            showOfflineAlert:false,
            currentOfflineBoundary: item.id, 
            enableOfflineMode: true
            },() => {
            setTimeout(async()=>{
                this.handleSelectBoundary(item,18);
                this.setState({initialStatePass:true});
                var localBoundaryData = await AsyncStorage.getItem('localBoundariesId'+ item.id);        
                if (localBoundaryData == undefined || localBoundaryData == null) 
                    localBoundaryData = {};  
                else 
                    localBoundaryData = JSON.parse(localBoundaryData);
                this.props.setCurrentLocalBoundary(localBoundaryData);
            },1500);
        });
    }
    async geolocate() {
        this.clearAutocomplete();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                var prev = { ...this.state.center };
                this.state.center = { ...prev };
                this.state.center.longitude = position.coords.longitude;
                this.state.center.latitude = position.coords.latitude;
                this.refs.map.animateCamera({
                    pitch: 45,
                    bearing: 45,
                    heading: -20,
                    altitude: 0,
                    zoom: 18,
                    center: { latitude: this.state.center.latitude, longitude: this.state.center.longitude},
                    duration: 500
                }); 
                this.setState({isLocating:false}); 
            },
            async (error) => {
                this.setState({isLocating:false}); 
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 5000 },
        );        
    }
    wrapWithTreeEntity(feature) {
        this.setState({isGettingEntity: true});
        var id = feature.id.replace("tree.","");
        feature.isLoadingEntity = true;
        return new Promise((resolve, reject) => {
            TreeService.get(id, false)
            .then(res => {
                if (res.id != undefined && res.id == id) {
                    feature.entity = res;
                } 
                this.setState({isGettingEntity: false});
                feature.isLoadingEntity = false;
                resolve(feature); 
            }).catch((e) => {
                feature.isLoadingEntity = false;
                this.setState({isGettingEntity: false});
                reject(e);
            });
        });
    }
    updateViewedEntity(index) {
        var feature = this.state.features[index];
        this.wrapWithTreeEntity(feature).then((res) =>{
            var wkt = new Wkt.Wkt();
            wkt.read(res.entity.geom);
            var longitude = wkt.components[0].x;
            var latitude = wkt.components[0].y;
            res.entity['extra'] = { longitude, latitude};
            this.setState({currentFeature: res});
        });
    }
    clearAutocomplete() {
        if (this.refs.address != undefined) {
            this.refs.address.state.inputValue = "";
        }
        this.setState({
            showClear:false,
            baseUrl: this.state.baseTemplate,
            showLayers: false,
            showPolygon: false,
            cqlFilters: ""
        });
        let self = this;
        setTimeout(() => {
            self.setState({ showLayers: true });
        }, 100);
        if (this.state.center != undefined) {
            this.refs.map.animateCamera({
                pitch: 45,
                bearing: 45,
                heading: -20,
                altitude: 0,
                zoom: 18,
                center: this.state.center,
                duration: 500
            });
        }
    }
    resetCamera() {
        this.refs.map.animateCamera({
            pitch: 45,
            bearing: 45,
            heading: -20,
            altitude: 0,
            zoom: 18,
            center: { latitude: this.refs.map.__lastRegion.latitude, longitude: this.refs.map.__lastRegion.longitude},
            duration: 500
        });
    }
    getPolygonBBOX(points) {
        var minX = 0;
        var maxX = 0;
        var minY = 0;
        var maxY = 0;
        for(i = 0; i < points.length; i += 1) {
            var x = points[i].longitude;
            var y = points[i].latitude;
            if(minX == 0){
                minX = x;
                maxX = x;
            }
            if(minY == 0) {
                minY = y;
                maxY = y;
            }
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);    
        }
        return [minX,minY,maxX,maxY];
    }
    getPolygonRegion(center, points) {
        const { width, height } = Dimensions.get('window');
        const ASPECT_RATIO = width / height;
        const lat = parseFloat(center.y);
        const lng = parseFloat(center.x);
        const bbox = this.getPolygonBBOX(points);
        const northeastLat = parseFloat(bbox[1]);
        const southwestLat = parseFloat(bbox[3]);
        const latDelta = (   northeastLat - southwestLat );
        const lngDelta = ( latDelta * ASPECT_RATIO );
        return {
            latitude: lat,
            longitude: lng,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta
        }; 
    }
    getCenterRegionFromPoints(center, points) {
        const { width, height } = Dimensions.get('window');
        const ASPECT_RATIO = width / height;
        const bbox = this.getPolygonBBOX(points);
        var minY = bbox[1];
        var maxY = bbox[3];
        const latitude = parseFloat(center.y);
        const longitude = parseFloat(center.x);
        const latitudeDelta = Math.abs(   minY - maxY ) / 0.23;
        const longitudeDelta = ( latitudeDelta * ASPECT_RATIO );
        return {
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: latitudeDelta,
            longitudeDelta: longitudeDelta
        }; 
    }
    getCenterRegionFromPointsV2(points) {
        let minX, maxX, minY, maxY;
        ((point) => {
          minX = point.latitude;
          maxX = point.latitude;
          minY = point.longitude;
          maxY = point.longitude;
        })(points[0]);
        points.map((point) => {
          minX = Math.min(minX, point.latitude);
          maxX = Math.max(maxX, point.latitude);
          minY = Math.min(minY, point.longitude);
          maxY = Math.max(maxY, point.longitude);
        });
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        const deltaX = (maxX - minX);
        const deltaY = (maxY - minY);
        return {
          latitude: midX,
          longitude: midY,
          latitudeDelta: deltaX,
          longitudeDelta: deltaY
        };
    }
    updateRegion(width, height) {
        var wkt = new Wkt.Wkt();
            wkt.read(this.props.config.center);
        this.state.center = {};
        this.state.w = PixelRatio.getPixelSizeForLayoutSize(Math.round(width));
        this.state.h = PixelRatio.getPixelSizeForLayoutSize(Math.round(height));
        const aspectRatio =  this.state.w  / this.state.h;
        this.state.center.longitude = wkt.components[0].x;
        this.state.center.latitude = wkt.components[0].y;
        const distanceDelta = Math.exp(Math.log(360) - (18 * Math.LN2));
        this.state.center.latitudeDelta = distanceDelta;
        this.state.center.longitudeDelta = distanceDelta;
    }
    handleSelectBoundary(item, zoom) {
        this.setState({ showClear:true });
        var wkt = new Wkt.Wkt();
        wkt.read(item.geom);
        var center = centroid(wkt.components[0]);
        this.setState({
            cqlFilters: "INTERSECTS(geom,querySingle('arbol-iot:boundary','geom','IN(''boundary."+item.id+"'')'))",
            showLayers: false,
            showPolygon: false
        });
        var self = this;
        setTimeout(() => {
            self.setState({showLayers: true,  showPolygon: true});
        }, 100);
        var coordinates = [];
        wkt.components[0].map(coordsArr => { 
            coordinates.push ({
                latitude: coordsArr.y,
                longitude: coordsArr.x,
            });
        });
        this.setState({searchGeom:coordinates});
        var region = this.getCenterRegionFromPointsV2(coordinates);
        this.refs.map.animateCamera({
            pitch: 45,
            bearing: 45,
            heading: -20,
            altitude: 0,
            zoom: zoom,
            center: { latitude: center.y, longitude: center.x},
            duration: 500
        });   
    }
    getBoundingBox = (region) => ([ 
        region.longitude - region.longitudeDelta / 2,  
        region.latitude - region.latitudeDelta / 2,   
        region.longitude + region.longitudeDelta / 2,  
        region.latitude + region.latitudeDelta / 2     
    ])
    coordinatesToXY(bbox, map_width, map_height, lat, long) {
        var map_lon_left = bbox[0];
        var map_lon_right = bbox[2];
        var map_lon_delta = map_lon_right - map_lon_left;
        var map_lat_bottom = bbox[1];
        var map_lat_bottom_degree = map_lat_bottom * Math.PI / 180;
        var x = (long - map_lon_left) * (map_width / map_lon_delta);
        lat = lat * Math.PI / 180;
        var world_map_width = ((map_width / map_lon_delta) * 360) / (2 * Math.PI);
        var map_offset_y = (world_map_width / 2 * Math.log((1 + Math.sin(map_lat_bottom_degree)) / (1 - Math.sin(map_lat_bottom_degree))));
        var y = map_height - ((world_map_width / 2 * Math.log((1 + Math.sin(lat)) / (1 - Math.sin(lat)))) - map_offset_y)
        return {
            x,
            y
        }
    }
    getSelectBounce(lat, lng) { 
        var meters = 10;
        var coef = meters * 0.0000089;
        var lat2 = lat + coef;
        var lng2 = lng + coef / Math.cos(lat * 0.018);
        var lat1 = lat - coef;
        var lng1 = lng - coef / Math.cos(lat * 0.018);
        return [lng1,lat1,lng2,lat2];
    }
    handleChangeLayer = (index) => {
        let layers = [...this.state.layers];
        layers[index].active = !layers[index].active;
        this.setState({ layers });
    }                          
    redirectToTreeView(id) {
        this.setState({viewTree:false, viewMultipleTrees:false});
        this.props.navigation.navigate('TreeViewDetail',{ id, mode:'add' });
    }
    async addTree() {
        const { width, height } = this.state.mapLayout;
        var latlon = await this.refs.map.coordinateForPoint({ x: Math.round(width / 2), y: Math.round(height / 2) });
        this.setState({ addTreeCenter: latlon,
                        addTree:true,
                        showAddTreeLayer: true});
    }
    async addTreeNextButton() {
        const { width, height } = this.state.mapLayout;
        var latlon = await this.refs.map.coordinateForPoint({ x: Math.round(width / 2), y: Math.round(height / 2) });
        if (this.state.enableOfflineMode) {
            this.setState({ addTreeCenter: latlon }, ()=> {
                this.setState({addTree:false, showAddTreeLayer: false});
                this.props.navigation.navigate('TreeEditForm',{ center: this.state.addTreeCenter, currentOfflineBoundary: this.state.currentOfflineBoundary, mode:'add-offline'});
            });
        } else {
            this.setState({ addTreeCenter: latlon }, ()=> {
                this.setState({addTree:false, showAddTreeLayer: false});
                this.props.navigation.navigate('TreeEditForm',{ center: this.state.addTreeCenter, mode:'add'});
            });
        }
    }
    render() {
        return (
            <SafeAreaView style= {{ flex: 1, backgroundColor: colors.mainColor }}>
                { this.state.isOffline && 
                    <Row style={{ backgroundColor:'#e77d2d', width:'100%', height:60}}>
                        <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center" }}>
                            <TouchableOpacity style={{ width:60, height:60, justifyContent:'center'}} onPress={ () => { 
                                    this.props.navigation.goBack();
                                }}>
                                <Icon name="ios-arrow-back" style={[globalStyles.headerLeftIcon,{ alignSelf:'center' }]}/>
                            </TouchableOpacity>
                        </Col>
                        <Col style={{ flex:1, textAlign:'center', justifyContent:'center', height:60}}>
                            <Text style={{ alignSelf:'center', fontSize:12, fontWeight:'bold', color:'white'}}>{ strings.tree.offlineLabel }</Text>
                        </Col>
                        <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center", alignSelf:'center' }}>
                            <TouchableOpacity style={{marginLeft: 10}} onPress={ () => { this.setState({showOfflineAlert:true}); }}>
                                <Icon name="ios-settings" style={{ fontSize:20, color:"white", marginLeft: 10, marginRight:10}}/>
                            </TouchableOpacity>
                        </Col>
                    </Row>
                }
                <View style={{ flex: 1, backgroundColor:'#000000',paddingBottom: this.state.redrawMap }}>
                    <MapView style={[{ flex:1 } , this.state.showAddTreeLayer ? { opacity:0.5 } : {}]}
                        ref="map"
                        mapPadding={{ bottom:80, top:5, left:9, right:9 }}
                        provider="google"
                        onLayout={(event) => { this.setState({mapLayout:event.nativeEvent.layout}); }}
                        showsCompass={true}
                        showsUserLocation={true}
                        followsUserLocation={true}
                        showsPointsOfInterest={false}
                        showsBuildings={false}
                        showsTraffic={false}
                        showsMyLocationButton={false}
                        showsIndoors={false}
                        showsIndoorLevelPicker={false}
                        mapType={ this.state.mapType }
                        toolbarEnabled = {false}
                        onRegionChangeComplete={currentRegion => {  
                            Keyboard.dismiss();
                            this.setState({ showAddTreeLayer: false}); 
                        }}
                        onPress={ async (e) =>{
                            Keyboard.dismiss();
                            if (this.state.addTree || this.state.isOffline || this.state.enableOfflineMode)
                                return;
                            const lat = e.nativeEvent.coordinate.latitude;
                            const lng = e.nativeEvent.coordinate.longitude;   
                            var bbox = this.getSelectBounce(lat,lng);                         
                            var o = this.coordinatesToXY(bbox,100,100,lat,lng);
                            this.setState({isLoading: true});
                            GeoserverService.getFeatureInfo(o.x,o.y,'arbol-iot:tree',100,100,bbox)        
                            .then((res) => res.json())
                            .then(async res => {
                                if ( res != undefined && res.features != undefined && res.features.length > 0 ) {
                                    this.setState({index: 0, viewMultipleTrees: false, viewTree: false});
                                    this.setState({features:res.features});
                                    let self = this;
                                    if (res.features.length > 1) {
                                        setTimeout(() => {
                                            self.updateViewedEntity(0);
                                            self.setState({ viewMultipleTrees: true });
                                        }, 100);
                                    } else {
                                        setTimeout(() => {
                                            self.updateViewedEntity(0);
                                            self.setState({ viewTree: true });
                                        }, 100);
                                    }
                                } else {
                                    this.setState({index: 0, viewMultipleTrees: false, viewTree: false});
                                    this.setState({features:[]});
                                }
                                this.setState({isLoading: false});
                            }).catch((e) => this.setState({isLoading: false}))
                        }}
                        initialRegion= {{
                            latitude: this.state.center.latitude,
                            longitude: this.state.center.longitude,
                            latitudeDelta: this.state.center.latitudeDelta,
                            longitudeDelta:this.state.center.longitudeDelta,
                        }}
                        { ...this.state.zoomProps }
                        { ...this.state.optionalProps }>
                            { /* Offline mode*/ }
                            { this.state.initialStatePass && this.state.enableOfflineMode &&
                                <UrlTile
                                    urlTemplate={"file://" + this.state.localBoundaries[this.state.currentOfflineBoundary].tileUrl.replace("{z}","18")}
                                    zIndex={300}
                                />
                            }
                            { /* Offline mode markers */}
                            {   this.state.initialStatePass && this.state.enableOfflineMode &&
                                this.props.localBoundary != undefined && 
                                this.props.localBoundary.trees != undefined && 
                                this.props.localBoundary.trees != {} &&
                                Object.keys(this.props.localBoundary.trees).length > 0 &&
                                Object.keys(this.props.localBoundary.trees).map((key) => {
                                    var wkt = new Wkt.Wkt();
                                    var marker = this.props.localBoundary.trees[key];
                                    wkt.read(marker.geom);
                                    var longitude = wkt.components[0].x;
                                    var latitude = wkt.components[0].y;
                                    var markerImage = this.markerIncomplete;
                                    if (marker.status == "INCOMPLETE") 
                                        markerImage = this.markerIncomplete;
                                    if (marker.status == "DRAFT") 
                                        markerImage = this.markerValidate;
                                    if (marker.status == "VALIDATED") 
                                        markerImage = this.markerValidated;
                    
                                    return (<Marker
                                        tracksViewChanges={false}
                                        icon= { markerImage }
                                        onPress = { () => {
                                            if (marker.status == "INCOMPLETE") {
                                                this.props.navigation.navigate('TreeEditForm',{ entity: marker, currentOfflineBoundary: this.state.currentOfflineBoundary,  mode:'edit-offline' });  
                                            } else {
                                                this.setState({
                                                    showErrorAlert:true,
                                                    alertErrorText: strings.tree.statusEditError
                                                });
                                            }
                                        }}
                                        key = { marker.id }
                                        coordinate={{longitude,latitude}}
                                    />)
                                })
                            }
                            { /* Online mode*/ }
                            { this.state.initialStatePass && !this.state.enableOfflineMode &&
                                this.state.mapType == "none" && 
                                <UrlTile urlTemplate={ AppConstants.baseLayer + "{z}/{x}/{y}.jpg"} zIndex={144} />
                            }
                            { /* Online mode - Layers */ }
                            {
                                this.state.initialStatePass && !this.state.enableOfflineMode &&
                                this.state.showLayers && this.state.layers.map((layer) => {
                                if ( layer.active == true  )
                                    return(
                                        <WMSTile
                                            ref="wms"
                                            key={layer.key}
                                            urlTemplate={layer.url.replace("http:","https:") + 
                                                (
                                                    ( this.state.cqlFilters + this.state.cqlAdvancedFilters)  != '' ? 
                                                        "&CQL_FILTER=" + this.state.cqlFilters  +
                                                            (this.state.cqlFilters != '' && this.state.cqlAdvancedFilters != '' ? '+and+' : '') + 
                                                            this.state.cqlAdvancedFilters : '' 
                                                )}
                                            zIndex={150}
                                            opacity={1}
                                            tileSize={512} 
                                        /> 
                                    ) 
                                }) 
                            }
                            { /* Polygon - current search - disabled */ }
                            { false &&
                                <Polygon
                                    fillColor="transparent"
                                    coordinates={this.state.searchGeom} 
                                    zIndex={145}
                                    strokeColor="#2CA06C" 
                                    strokeWidth={1}
                                    />
                            }
                            { /* Feature selected marker */ }
                            { !this.state.enableOfflineMode && ( !this.state.addTree && ( this.state.viewMultipleTrees || this.state.viewTree ) 
                                && this.state.currentFeature != undefined && this.state.currentFeature.entity != undefined && this.state.currentFeature.entity.extra !== undefined) ?                      
                                    <MapView.Marker
                                        coordinate={{ longitude: this.state.currentFeature.entity.extra.longitude, latitude:this.state.currentFeature.entity.extra.latitude }}
                                        onPress = { () => { this.state.currentFeature = undefined; this.state.viewMultipleTrees = this.state.viewTree = false; }}
                                    >
                                    </MapView.Marker>
                                    : <View></View>

                            }
                    </MapView>
                    { /* Related components */ }
                    { /* Search bar */}
                    { this.state.initialStatePass && !this.state.enableOfflineMode  && !this.state.addTree && 
                        <View searchBar rounded style={ styles.blockAutoComplete }>
                            <View rounded  style={ styles.blockAutoCompleteWrapper }>
                                <TouchableOpacity style={{height: 40, width:40  }} onPress={ () => { this.props.navigation.goBack() }}>
                                    <Icon name="ios-arrow-back" style={{ fontSize:22, color:"#999", marginTop:9, alignSelf:'center' }}/>
                                </TouchableOpacity>
                                <View style={{ marginLeft: 2, width:1, height:25, backgroundColor:'#f7f7f7'}}></View>
                                { !this.state.showClear && <Icon name="ios-search" style={{ fontSize:19, color:"#999", marginLeft: 10, marginRight:10}}/> }
                                {  this.state.showClear && 
                                    <TouchableOpacity onPress={()=>{ this.clearAutocomplete(); }}>
                                        <Icon name="ios-close" style={{ fontSize:19, color:"#999", marginLeft: 10, marginRight:10}}/>
                                    </TouchableOpacity> 
                                }
                                <Autocomplete
                                    ref="address"               
                                    noDataText={ strings.emptyList }      
                                    noDataTextStyle={{ fontSize:11, padding:10}}  
                                    listItemTextStyle={{fontSize:11}}
                                    fetchDataUrl={AppConstants.api.boundaryWithGeom}   
                                    style={styles.autocompleteInput}
                                    inputStyle={[  styles.input,]} 
                                    placeholder={ strings.search } 
                                    spinnerStyle={{ marginTop: -2 }}
                                    placeholderColor = {'#565656'}
                                    scrollToInput={ev => {}}
                                    handleSelectItem={(item, id) => this.handleSelectBoundary(item,15)}
                                    renderIcon={() => ( null )}
                                    onDropdownShow={() => ( null )}
                                    onDropdownClose={() => ( null  )}
                                    minimumCharactersCount={1}
                                    valueExtractor={item => item.name}
                                    />
                                <View style={{ marginLeft: 2, width:1, height:25, backgroundColor:'#f7f7f7'}}></View>
                                <TouchableOpacity style={{height: 40, width:40  }} onPress={() => { 
                                    this.setState({ showBottomSheetLayers : true});
                                }}>
                                    <Image
                                        source={require('../../resources/trees/icon-layers.png')}
                                        style={{ width:17, height:13, margin:10, marginTop:14 }}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                    { /* Locate button */ }
                    {   ! this.state.addTree && 
                        <Button rounded style={ styles.locationIcon } onPress={() => { this.geolocate(); }} >
                            { this.state.isLocating ?
                                <ActivityIndicator style={{position:'absolute', top:8, left:8}} color={ '#4285f4' } size={"small"} />
                                :
                                <Image
                                    source={require('../../resources/trees/icon-location.png')}  style={{ width:15, height:15, margin:10, transform: [{ rotate: '-10deg'}]   }}/>
                            }
                        </Button> 
                    }
                    {   ! this.state.addTree && !this.state.enableOfflineMode && 
                        <Button rounded style={ styles.filterIcon } onPress={() => {
                                if (!this.state.enableOfflineMode) {
                                    this.props.navigation.navigate('TreeFilters');
                                }
                            }}>
                            <Image
                                source={require('../../resources/trees/icon-filter-green.png')}  style={{ width:15, height:15, margin:10 }}/>
                        </Button> 
                    }
                    {   ! this.state.addTree && 
                        <View style={{ position:'absolute', bottom:120, left: 10,backgroundColor:'#ffffff', borderColor:'#2CA06C', borderWidth:1, borderRadius:5 }}>
                            <View style={{ backgroundColor:'#2CA06C', borderTopLeftRadius:2, borderTopRightRadius:2, padding:2, borderColor:'#2CA06C' }}>
                                <Text style={{ fontSize:9, color:'white', fontWeight:'bold' }}>{ strings.tree.statusLegendTitle }</Text>
                            </View>
                            <View style={{ flex:1, flexDirection:'row', padding:3, paddingLeft:5, paddingTop:5}}>
                                <View style={{ borderRadius:4, width:8, height:8, backgroundColor:'#019D57'}}></View>
                                <Text style={{ fontSize:9, paddingLeft:5, color:'#333'}}>{ strings.tree.statusComplete }</Text>
                            </View>
                            <View style={{ flex:1, flexDirection:'row', padding:3, paddingLeft:5}}>
                                <View style={{ borderRadius:4, width:8, height:8, backgroundColor:'#019D57', borderWidth:1.5, borderColor:'#6ae377'}}></View>
                                <Text style={{ fontSize:9, paddingLeft:5, color:'#333'}}>{ strings.tree.statusValidating }</Text>
                            </View>
                            <View style={{ flex:1, flexDirection:'row', padding:3, paddingLeft:5,paddingBottom:7}}>
                                <View style={{ borderRadius:4, width:8, height:8, backgroundColor:'#6ae377'}}></View>
                                <Text style={{ fontSize:9, paddingLeft:5, color:'#333'}}>{ strings.tree.statusIncomplete }</Text>
                            </View>
                        </View>  
                    }    
                    { ! this.state.addTree  &&         
                        <MapBar style={ styles.mapBar }>
                            { !this.state.enableOfflineMode ?
                                <MapBar.Item
                                    icon={require('../../resources/trees/icon-offline.png')}
                                    title={ strings.tree.mapBar.offline }
                                    width={29} height={20}
                                    onPress={() => {
                                        if (!this.state.enableOfflineMode) {
                                            this.props.navigation.navigate('TreeOffline');
                                        }
                                    }}
                                    /> 
                                : 
                                <MapBar.Item
                                    icon={require('../../resources/trees/icon-offline.png')}
                                    title={ strings.tree.mapBar.offline }
                                    width={29} height={20}/>
                            }
                            <MapBar.Item
                                icon={require('../../resources/trees/icon-add.png')}
                                title={ strings.tree.mapBar.add }
                                width={20}
                                height={20}
                                onPress={()=>{ this.addTree(); }}
                            />
                            { !this.state.enableOfflineMode ?
                                <MapBar.Item
                                    icon={require('../../resources/global/icon-edit-gray.png')}
                                    title={  strings.treesEditedByCurrentUser.title }
                                    width={20} height={20}
                                    onPress={() => {
                                        if (!this.state.enableOfflineMode) {
                                            this.props.navigation.navigate('TreesEditedByCurrentUser');
                                        }
                                    }} /> 
                                : 
                                <MapBar.Item
                                    icon={require('../../resources/global/icon-edit-gray.png')}
                                    width={20}
                                    height={20}
                                    title={  strings.treesEditedByCurrentUser.title }
                                />
                            }
                        </MapBar>
                    }
                    {   this.state.isLoading &&
                        <View 
                            pointerEvents="none"
                            style={{ position:'absolute', left:0, right:0, top:0, bottom:0, justifyContent:'center'}}>
                            <ActivityIndicator style={{alignSelf:'center'}} size="large" color="#32AA77" />
                        </View>
                    }
                    {
                        this.state.addTree &&
                        <View style={styles.markerFixed}>
                            <Image resizeMode='contain' style={styles.marker} source={require('../../resources/trees/marker.png')} />
                        </View>
                    }
                    {
                        this.state.showAddTreeLayer &&
                        <View style={styles.markerIndicatorTop}>
                            <Image style={{ width:30, height:33.9 }} source={require('../../resources/trees/icon-arrow-up.png')} />
                        </View>
                    }
                    {
                        this.state.showAddTreeLayer &&
                        <View style={styles.markerIndicatorBottom}>
                            <Image style={{ width:30, height:33.9 }} source={require('../../resources/trees/icon-arrow-down.png')} />
                        </View>
                    }
                    {
                        this.state.showAddTreeLayer &&
                        <View style={styles.markerIndicatorLeft}>
                            <Image style={{ height:30, width:33.9 }} source={require('../../resources/trees/icon-arrow-left.png')} />
                        </View>
                    }
                    {
                        this.state.showAddTreeLayer &&
                        <View style={styles.markerIndicatorRight}>
                            <Image style={{ height:30, width:33.9 }} source={require('../../resources/trees/icon-arrow-right.png')} />
                        </View>
                    }
                </View>
                { /* Bottom sheet layers */ }
                <BottomSheet 
                    visible={ this.state.showBottomSheetLayers}
                    onBackButtonPress={ () => { this.setState({ showBottomSheetLayers:false }) }}
                    onBackdropPress={ () => { this.setState({ showBottomSheetLayers:false }) }}>
                    <View style={ styles.block }>
                        <View style={ styles.blockTitle }>
                            <Text style={{ color:'white'}}>{ strings.tree.layersTitle }</Text>
                            <TouchableOpacity style={ styles.blockCloseButton } onPress={ (e) => { this.setState({showBottomSheetLayers:false}) }}>
                                <Icon name="ios-close-circle" style={ styles.blockIcon }/>
                            </TouchableOpacity>
                        </View>
                        <Grid>
                            <Row style={ styles.blockSubtitleWrapper }>
                                <Text style={ styles.blockSubtitle }>{ strings.tree.layersDetailSubtitle }</Text>
                            </Row>
                            <Row style={{ ...styles.blockWrapper ,  height: (Math.round(this.state.layers.length / 2) * 40) <= 120 
                                                                            ? (Math.round(this.state.layers.length / 2) * 40) : 120 } }>
                                { this.state.layers != undefined && this.state.layers.length > 0 && 
                                    <FlatList
                                        data={ this.state.layers }
                                        extraData={ [this.state.layers] }
                                        numColumns= { 2 }
                                        renderItem= { ({ item, key }) => {
                                            return (
                                            

                                            
                                            <Item style={ styles.layerItem } key={ item.key }>
                                                <TouchableOpacity style={{ flex:1, flexDirection:'row'}} onPress={() => this.handleChangeLayer(item.key)} >
                                                    <CheckBox
                                                        checked={ item.active}
                                                        color='#2CA06C'
                                                        style={{ height:20, width:20, borderRadius:0}}
                                                        onPress={() => this.handleChangeLayer(item.key)}
                                                    />
                                                    <Text style={{ paddingLeft: 30, color:'#333' }}>{item.label}</Text>
                                                </TouchableOpacity>
                                            </Item>
                                            );
                                    }}/> 
                                }
                            </Row>
                            <Row style={ styles.blockSubtitleWrapper }>
                                <Text style={ styles.blockSubtitle }>{ strings.tree.layersMapType }</Text>
                            </Row>
                            <Row style={ styles.blockMapType } >
                                <Col style={{ justifyContent:'center' }}>
                                    <TouchableOpacity 
                                        style={ styles.mapTypeButton } 
                                        onPress={() => { this.setState({"mapType":"none"});  }} >
                                        <Thumbnail style={ this.state.mapType == "none" ? styles.activeThumb : {}  } source={ require('../../resources/trees/icon-flat-layer.png') }/>
                                        <Text style={ [ styles.mapTypeButtonText, { color: this.state.mapType == "none" ? '#2CA06C' : '#333'}]}>{ strings.tree.layersMapTypeButtonDefault }</Text>
                                    </TouchableOpacity>
                                </Col>
                                <Col style={{ justifyContent:'center' }}>
                                    <TouchableOpacity   
                                        style={ styles.mapTypeButton } 
                                        onPress={() => { this.setState({"mapType":"satellite"}); }} >
                                        <Thumbnail style={ this.state.mapType == "satellite" ? styles.activeThumb : {}  } source={ require('../../resources/trees/icon-sat-layer.png') }/>
                                        <Text style={ [ styles.mapTypeButtonText, { color: this.state.mapType == "satellite" ? '#2CA06C' : '#333'}]}>{ strings.tree.layersMapTypeButtonSat }</Text>
                                    </TouchableOpacity>
                                </Col>
                            </Row>
                        </Grid>
                    </View> 
                </BottomSheet>
                <View style={{ backgroundColor:'white' }}>
                    { this.state.addTree && 
                        <View style={ styles.blockAddTreeWrapper }>
                            <View style={ styles.blockTitle }>
                                <Text style={{ color:'white'}}>{ strings.tree.addTreeTitle }</Text>
                                <TouchableOpacity style={ styles.blockCloseButton } onPress={ (e) => { this.setState({addTree:false, showAddTreeLayer: false}) }}>
                                    <Icon name="ios-close-circle" style={ styles.blockIcon }/>
                                </TouchableOpacity>
                            </View>
                            <Grid>
                                <Col style={{ justifyContent: "center", alignItems: "center" }}>                               
                                    <Text style={ styles.addTreeLabels }>{ strings.tree.addTreeProcDescription}</Text>
                                </Col>
                                <Col style={{ width:90, justifyContent: "center", alignItems: "center"}}>                                
                                    <Button rounded onPress={ (e) => { this.addTreeNextButton(); }} style={ styles.addTreeNextButton } >
                                        <Icon name="ios-arrow-forward" style={{ fontSize:12, color:"white"}}/>
                                    </Button>
                                    <Text style={ styles.addTreeButtonLabels }>{ strings.tree.addTreeContinueButton }</Text>
                                </Col>
                            </Grid>
                        </View> 
                    }
                </View>
                { /* View tree component  */ }
                <View>
                    { this.state.addTree == false && ( this.state.viewTree || this.state.viewMultipleTrees ) && this.state.features != undefined && this.state.features.length > 0 &&
                        <View style={ [ styles.blockViewTreeWrapper, , this.state.viewMultipleTrees ? { height:180 } : {}]}>
                            <View style={ [ styles.blockTitle , this.state.viewMultipleTrees ? { backgroundColor: '#F18C6F', height:60, padding:10, paddingRight:50, justifyContent:'center', alignContent:'center' } : {}]}>
                                <Text style={{ color:'white'}}>{ this.state.viewMultipleTrees ? strings.tree.viewMultipleTreeTitle.replace("{n}",this.state.features.length) : strings.tree.viewTreeTitle }</Text>
                                <TouchableOpacity style={ [ styles.blockCloseButton] } onPress={ (e) => { this.setState({viewTree:false, viewMultipleTrees:false}) }}>
                                    <Icon name="ios-close-circle" style={ styles.blockIcon }/>
                                </TouchableOpacity>
                            </View>
                            { _.has(this.state.currentFeature,'isLoadingEntity') && !this.state.currentFeature.isLoadingEntity ?   
                            <Grid style={[ this.state.viewMultipleTrees ? { paddingTop:20, paddingBottom:20 } : {}]}>
                                { this.state.viewMultipleTrees && 
                                <Col style={{ width:60, justifyContent: "center"}}>
                                    <Button rounded onPress={ (e) => {
                                            if (this.state.index - 1 >= 0) {
                                                this.state.index = this.state.index - 1;
                                                
                                            } else {
                                                this.state.index = this.state.features.length - 1;
                                            }
                                            this.setState({index:this.state.index});
                                            this.updateViewedEntity(this.state.index);
                                    }} style={ styles.viewMultipleTreesControls } >
                                        <Icon name="ios-arrow-back" style={{ fontSize:12, color:"white", padding:0, margin: 0, width:5}}/>
                                    </Button>
                                </Col>
                                }
                                <Col style={{ width: this.state.viewMultipleTrees ? 100 : 120}}>                               
                                    {   
                                        _.has(this.state.currentFeature, 'entity.images') &&
                                        this.state.currentFeature.entity.images.length > 0 &&
                                        this.state.currentFeature.entity.images[0].id != undefined ?
                                        <ImageWithAuth 
                                            resizeMode="cover" 
                                            style={{ flex:1, width:this.state.viewMultipleTrees ? 100 : 120 }} 
                                            source={{ uri: AppConstants.base + this.state.currentFeature.entity.images[0].uri }} />
                                        :
                                        <Image source={require('../../resources/global/default-tree-img.png')}  style={{ flex:1, width:this.state.viewMultipleTrees ? 100 : 120 }}  />
                                    }   
                                </Col>
                                <Col style={{ justifyContent: "center", alignItems: "center"}}>                             
                                <Grid>
                                    <Col style={{ justifyContent: "center"}}>                               
                                        <Text style={styles.specieName}>
                                        { _.has(this.state, 'currentFeature.entity.specie.commonName') ? 
                                            this.state.currentFeature.entity.specie.commonName : ( this.state.index + 1 ) + ' - ' + strings.noSpecie
                                        }
                                        </Text>
                                        <Text style={styles.specieCommon}>
                                        { _.has(this.state, 'currentFeature.entity.specie.genus') ? 
                                            this.state.currentFeature.entity.specie.genus : strings.noSpecie
                                        }
                                        </Text>
                                        { ! this.state.viewMultipleTrees && 
                                        <View>
                                        {
                                            (_.has(this.state.currentFeature, 'entity.status') && this.state.currentFeature.entity.status  == "DRAFT") &&
                                            <Badge success style={[ styles.badge , { backgroundColor: '#F5A623'}]}>
                                                <Text style={styles.badgeText}>{strings.treeDetailFull.treeDraft}</Text>
                                            </Badge>
                                        }
                                        {
                                            ( !_.has(this.state.currentFeature, 'entity.status') || this.state.currentFeature.entity.status  == "INCOMPLETE" ||
                                                this.state.currentFeature.entity.status  == null
                                            ) &&
                                            <Badge success style={[ styles.badge , { backgroundColor: '#4A4A4A'}]}>
                                                <Text style={styles.badgeText}>{strings.treeDetailFull.treeIncomplete}</Text>
                                            </Badge>
                                        }
                                        {
                                            (_.has(this.state.currentFeature, 'entity.status') && this.state.currentFeature.entity.status  == "VALIDATED") &&
                                            <Badge success style={[ styles.badge , {  backgroundColor: '#2CA06C'}]}>
                                                <Text style={styles.badgeText}>{strings.treeDetailFull.treeValidated}</Text>
                                            </Badge>
                                        }
                                        </View> }
                                        { this.state.viewMultipleTrees && 
                                        <Button onPress={(id) => { this.redirectToTreeView(this.state.features[this.state.index].id); }} style={[ { backgroundColor: '#41B07C', height:23, paddingTop:0, marginLeft: 5, marginTop:3, padding:10 }]}>
                                            <Text style={{ color:'white', fontSize:12, paddingTop:3}}>{ strings.tree.select }</Text>
                                        </Button>
                                        }
                                    </Col>
                                    { ! this.state.viewMultipleTrees && 
                                    <Col style={{ width:90, justifyContent: "center", alignItems: "center"}}>                                
                                        <Button rounded onPress={() => { this.redirectToTreeView(this.state.features[this.state.index].id); }} style={ styles.viewTreeNextButton } >
                                            <Icon name="ios-arrow-forward" style={{ fontSize:16, color:"white"}}/>
                                        </Button>
                                        <Text style={ [ styles.addTreeButtonLabels , { fontSize: 11}]}>{ strings.tree.viewTreeButton }</Text>
                                    </Col> }
                                </Grid>
                            </Col>
                            { this.state.viewMultipleTrees && 
                            <Col style={{ width:60, justifyContent: "center"}}>
                                <Button rounded onPress={ (e) => { 
                                        if (this.state.index + 1 < this.state.features.length) {
                                            this.state.index = this.state.index + 1;
                                        } else {
                                            this.state.index = 0;
                                        }
                                        this.setState({index:this.state.index});
                                        this.updateViewedEntity(this.state.index);
                                }} style={ styles.viewMultipleTreesControls } >
                                    <Icon name="ios-arrow-forward" style={{ fontSize:12, color:"white", padding:0, margin: 0, width:5}}/>
                                </Button>
                            </Col>
                            }
                        </Grid>
                        :
                        <View 
                            style={{ flex:1, justifyContent:'center'}}>
                            <ActivityIndicator style={{alignSelf:'center'}} size="large" color="#32AA77" />
                        </View>
                        }
                    </View> }
                </View>
                { !this.state.initialStatePass &&
                    <Loader></Loader>
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

                { /* Offline alert */}
                <AwesomeAlertPlus
                    show={ this.state.showOfflineAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton={ false }
                    onDismiss={ () => { this.setState({showOfflineAlert:false})}}
                    customView = {
                        <View style={ [{ marginTop: 15, marginLeft: 20,  marginRight: 20, width: 200, 
                                         marginBottom: 20, padding: 0,
                                         height: this.state.offlineBoundaries == undefined || this.state.offlineBoundaries.length == 0 ? 150 : 300 }] }>
                            { (this.state.offlineBoundaries == undefined || this.state.offlineBoundaries.length == 0) ?
                                <Text style={ [ globalStyles.text, {textAlign:'center'}] }>{ strings.tree.emptyBoundaries }</Text> :
                                <Text style={ [ globalStyles.text, {textAlign:'center'}] }>{ strings.tree.selectBoundary }</Text>
                            }
                            <ScrollView style={{ width: 200, flex:1, margin:0, padding:0, paddingTop:10, 
                                                 height: this.state.offlineBoundaries == undefined || this.state.offlineBoundaries.length == 0 ? 120 : 300 }}>
                                { this.state.offlineBoundaries.map((item) =>{
                                    return(
                                        <TouchableOpacity key={item.id} onPress={() =>{ this.enableOfflineMode(item) }}>
                                            <View style={{width:'100%', flex:1, flexDirection:'row', height:50, alignContent:'center', borderBottomColor:'#f3f3f3', borderBottomWidth:1}}>                    
                                                    <Col style={{width:30, justifyContent:'center' }}>
                                                        <Image source={require('../../resources/trees/icon-map.png')} style= {styles.cardPicture}/>
                                                    </Col> 
                                                    <Col style={{ borderBottomWidth: 0, justifyContent:'center', paddingLeft:5 }}>                                                        
                                                        <Text style={{fontSize:11, color:'#737373'}}> {item.name.trim()} </Text>                         
                                                    </Col>              
                                            </View>
                                        </TouchableOpacity>)
                                    })
                                }
                            </ScrollView>
                            <Button onPress={ () => {
                                    this.setState({showOfflineAlert:false});
                                    setTimeout(() => {
                                        this.props.setMode(1);
                                        this.checkInitialState();
                                    }, 1000); }}
                                    style={{ backgroundColor: '#2CA06C', marginTop: 10, justifyContent: 'center', alignItems:'center', alignSelf:'center', padding:10, width: 115, height: 30 }}>
                                    <Text style={{ color:'white', fontSize:12}}>{ strings.tree.onlineLabel }</Text></Button>
                            <Button onPress={ () => {
                                    this.setState({showOfflineAlert:false});
                                    setTimeout(() => {
                                            this.props.navigation.goBack();
                                    }, 1000); }}
                                style={{ backgroundColor: '#2CA06C', marginTop: 10, justifyContent: 'center', alignItems:'center', alignSelf:'center', padding:10, width: 115, height: 30}}>
                                    <Text style={{ color:'white', fontSize:12}}>{ strings.tree.exitMap }</Text></Button>
                        </View>
                    }
                />   
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    block: {
        backgroundColor:'white', 
        width:'100%',
        position:'absolute', 
        bottom:0, 
        elevation:101, 
        zIndex:101
    },
    blockTitle:{
        width:'100%', 
        backgroundColor:'#2CA06C',
        height:40, 
        shadowOffset: { width: 2, height: 2 },
        shadowColor: "grey",
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation:2,
        justifyContent: "center",
        alignItems: "center"
    },
    blockSubtitle: {
        color:'#333', 
        fontSize:12, 
        fontWeight: 'bold',
    },
    blockSubtitleWrapper: {
        height: 40, 
        paddingLeft:20, 
        paddingRight:20, 
        paddingTop: 20 ,
        marginBottom:15
    },
    layerItem: {
        flex: 1 , 
        borderColor: 'transparent', 
        padding:8,
    },
    blockWrapper: {
        paddingLeft:20
    },
    blockCloseButton: {
        position:'absolute', 
        right:20, 
        top:'50%',
        marginTop:-10,
        width: 20,
        height: 20
    },
    blockIcon:{
        fontSize:19, 
        color:"white"
    },
    blockMapType: {
        maxHeight:90,
        marginBottom:40,
        paddingLeft:20, 
        paddingRight:20
    },
    blockAddTreeWrapper: {
        backgroundColor:'white', 
        width:'100%',
        height: 150, 
        position:'relative', 
        bottom:0    
    },
    blockViewTreeWrapper: {
        backgroundColor:'white', 
        width:'100%',
        height: 140, 
        position:'absolute', 
        bottom:0, 
        elevation:101, 
        zIndex:101
    },
    mapTypeButton: {
        justifyContent: "center",
        alignItems: "center"
    },
    mapTypeButtonText: {
        color:'#333', 
        fontSize:12, 
        paddingTop:10
    },
    addTreeCol: {
        justifyContent: "center",
        alignItems: "center"
    },
    addTreeNextButton: {
        alignSelf: 'center',
        marginTop:10,
        backgroundColor: '#2CA06C',
        borderRadius : 30,
        width : 37,
        height : 37,     
        shadowOffset: { width: 5, height: 5 },
        shadowColor: "grey",
        shadowOpacity: 0.5,
        shadowRadius: 5
    },
    viewTreeNextButton: {
        alignSelf: 'center',
        marginTop:10,
        backgroundColor: '#2CA06C',
        borderRadius : 30,
        width : 37,
        height : 37,     
        shadowOffset: { width: 5, height: 5 },
        shadowColor: "grey",
        shadowOpacity: 0.5,
        shadowRadius: 5
    },
    viewMultipleTreesControls: {
        alignSelf: 'center',
        justifyContent: "center", alignItems: "center",
        margin:0,
        backgroundColor: '#9B9B9B',
        borderRadius : 25,
        width : 25,
        height : 25,     
        padding: 0,
        shadowOffset: { width: 2, height: 2 },
        shadowColor: "grey",
        shadowOpacity: 0.5,
        shadowRadius: 5
    },
    addTreeLabels: {
        color:'#4A4A4A', 
        fontSize:13, 
        margin:20 
    },
    addTreeButtonLabels: {
        color:'#4A4A4A', 
        fontSize:11, 
        margin:10 
    },
    autocompleteInput: { 
        borderLeftWidth: 2,
        borderColor: '#999',
    },
    input: { 
        borderWidth: 0 , 
        paddingLeft:3, 
        paddingTop:0, 
        color: 'gray', 
        fontSize: 12,
        lineHeight: 15,
        paddingBottom:0,
        height:30
    },
    wrapper: {
        flex: 1,
        backgroundColor: 'transparent',
        margin: 15
    },
    blockAutoComplete: {
        position: 'absolute', 
        top:15, 
        left:16, 
        right:70, 
        height:40, 
        flexWrap: 'wrap', 
        flexDirection:'row'
    },
    cardPicture: {
        height: 30, 
        width: 30, 
        alignSelf: 'center',
    },
    blockAutoCompleteWrapper: {
        width:'100%',
        backgroundColor:'white', 
        borderRadius: 8,
        flexWrap: 'wrap', 
        flexDirection:'row',
        alignItems:'center',
        elevation:2,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84
    },

    blockAutoCompleteIcon: {
        backgroundColor: 'white',
        opacity:0.8,
        borderRadius : 30,
        width : 34,
        height : 34,
        margin: 14,
        marginTop: 0,
        shadowOffset: { width: 1, height: 1 },
        shadowColor: "#bcbdbf",
        shadowOpacity: 1,
        shadowRadius: 2,
        borderWidth:1,
        borderColor:'#bcbdbf'
    },
    activeThumb: {
        borderWidth:2, 
        borderColor:'#2CA06C'
    },
    locationIcon: {
        backgroundColor: 'white',
        borderRadius : 30,
        width : 35,
        height : 35,
        marginLeft: 10,
        marginTop: 10,
        position: 'absolute',
        bottom: 150,
        right: 20,
        shadowOffset: { width: 2, height: 2 },
        shadowColor: "grey",
        shadowOpacity: 0.4,
        shadowRadius: 2,
    },
    filterIcon: {
        backgroundColor: 'white',
        borderRadius : 30,
        width : 35,
        height : 35,
        marginLeft: 10,
        marginTop: 10,
        position: 'absolute',
        bottom: 105,
        right: 20,
        shadowOffset: { width: 2, height: 2 },
        shadowColor: "grey",
        shadowOpacity: 0.4,
        shadowRadius: 2,
    },
    mapBar: {
        backgroundColor: 'transparent', 
        position: 'absolute', 
        bottom:0, 
        left:0, 
        right:0,
        elevation:4,
        zIndex: 2, 
        shadowOffset: { width: 5, height: 5 },
        shadowColor: "grey",
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    specieName: {
        color: '#2CA06C', 
        fontSize: 15,  
        marginBottom: 3,
        marginLeft:10,
        marginBottom: 5
    },
    specieCommon: {
        color: '#757575', 
        fontSize: 12,  
        fontWeight: '400',
        marginBottom: 3,
        marginLeft:10,
        marginBottom: 5
    },
    badge:{
        marginLeft:10,
        paddingLeft:0,
        paddingRight:0,
        marginBottom: 4,
        height:20,
        justifyContent:'center'
    },
    badgeText:{
        paddingLeft: 10, 
        paddingRight: 10, 
        color:'#fff', 
        fontSize: 10, 
        fontWeight: '500',
        alignSelf: 'center',
        alignItems: 'center', 
        justifyContent: 'center',
    },
    markerFixed: {
        left: '50%',
        position: 'absolute',
        top: '50%',
        marginTop:-42,
        marginLeft: -12
    },
    markerIndicatorLeft: {
        left: 20,
        position: 'absolute',
        top: '50%',
        marginLeft: -13,
        marginTop: -30,
    },
    markerIndicatorRight: {
        right: 10,
        position: 'absolute',
        top: '50%',
        marginLeft: -13,
        marginTop: -30,
    },
    markerIndicatorTop: {
        top: 40,
        position: 'absolute',
        left: '50%',
        marginLeft: -13,
        marginTop: -30,
    },
    markerIndicatorBottom: {
        bottom: 30,
        position: 'absolute',
        left: '50%',
        marginLeft: -13,
        marginTop: -30,
    },
    marker: {
        height: 42,
        width: 25
    },
});
const mapStateToProps = (state) => {
    return {
        loggedInStatus: state.loggedInStatus,
        config: state.config.application.client.map,
        param: state.param,
        treeLocalRepository: state.treeLocalRepository,
        idToken: state.user.id_token,
        localBoundary: state.localBoundary,
        mode: state.mode
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Trees);