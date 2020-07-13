import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import {
    Text,
    View,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    Platform,
    Dimensions,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { Icon, ListItem, Left, Body, Button, Right, CardItem, Card } from "native-base";
import strings from '../../config/languages';
import { Col, Grid } from "react-native-easy-grid";
import { SearchBar } from 'react-native-elements';
import _ from 'lodash';
import BoundaryService from '../../services/boundary';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
var Wkt = require("wicket");
import RNFetchBlob from 'rn-fetch-blob';
import constants from '../../config/constants';
import Loader from '../../components/loader/Loader';
import TreeService from '../../services/tree';
import {AsyncStorage} from 'react-native';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import globalStyles from '../../styles/global';
import { YellowBox } from 'react-native';

class TreeOffline extends Component {
    static navigationOptions = ({ navigation }) => {
        const {params = {}} = navigation.state;
        return {
            headerTintColor: colors.white,
            header: 
            <SafeAreaView style={ [ { backgroundColor: colors.mainColor }, Platform.OS == "android" ? { height:60} : {}] }>
                <Grid >
                    <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center", alignSelf:'center' }}>
                        <TouchableOpacity style={{ width:60, height:60, justifyContent:'center'}} onPress={() => { if (params.customBack != undefined) params.customBack() }}>
                            <Icon name="ios-arrow-back" style= {{ fontSize:28, color:'white',height:29, width: 10, alignSelf:'center', textAlign:'center'}}/>
                        </TouchableOpacity>
                    </Col>
                    <Col style={{ flex:1, textAlign:'center', justifyContent:'center'}}>
                        { (!params.showSearch == undefined || !params.showSearch) ? 
                            <Text style={{ alignSelf:'center', color:'white', fontSize:15, fontWeight:'500'}}>
                                {strings.treeOffline.title}
                            </Text>
                            :                             
                            <SearchBar round placeholder={ strings.treeOffline.placeholderSearch }  
                                style= {{ backgroundColor:'white', size:11}}
                                leftIconContainerStyle = {{ backgroundColor: 'white'}}
                                inputContainerStyle={{ backgroundColor:'white', borderRadius:10}}
                                onChangeText={ (text) => {
                                    navigation.setParams({searchText:text},() => {});
                                    params.updateSearch(text);
                                }}
                                value={ params.searchText }
                                iconStyle = {{ backgroundColor: 'transparent'}}
                                containerStyle = {{backgroundColor:'transparent', borderTopWidth: 0,
                                borderBottomWidth: 0}} 
                                inputStyle = {{backgroundColor:'white', fontSize:14}} 
                                />                                
                        }                            
                    </Col>
                    <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center", alignSelf:'center' }}>
                        <TouchableOpacity onPress={ () => params.handleSearchBar()} style={{ width:60,height: 60, justifyContent: "center", alignItems: "center", alignSelf:'center' }}>
                            <Icon name="ios-search" style={{ fontSize:20, color:"white", marginLeft: 10, marginRight:10}}/>
                        </TouchableOpacity> 
                    </Col>
                </Grid>
            </SafeAreaView>
        }
    };
    constructor(props) {
        super(props)
        this.state = {
            showErrorAlert: false,
            alertErrorText: '',
            showSuccessAlert: false,
            alertSuccessText: '',
            localBoundaries: {}, 
            localBoundariesData: {},
            debounceSearch: _.debounce(this.debounceSearchWrap, 1000).bind(this),
            downloadedData:[],
            downloadedDataLoading: true,
            boundaryData:[],
            showSearch: false,
            search: "",
            page: 0,
            pageSize: 10,
            isLoading: false,
            isDownloading: false,
            moreElements: true,
        }
    }
    componentDidMount() {
        this.loadDownloadedBoundaries();
        this.props.navigation.setParams({
            showSearch: false,
            handleSearchBar: this.handleSearchBar.bind(this),
            searchActivated: false,
            searchText: "",
            customBack: this.customBack.bind(this),
            currentIndex: -1,
            updateSearch: this.updateSearch.bind(this)
        });
        this.subs = [ 
            this.props.navigation.addListener ('willFocus', () => {  this.loadDownloadedBoundaries();  }),
        ];
        // Ignore debug alerts
        YellowBox.ignoreWarnings(["Directory", "Warning: "]);
    }
    componentWillUnmount() {
        this.subs.forEach((sub) => {
            sub.remove();
        });
    }
    handleSearchBar(){
        this.setState({
            showSearch: !this.state.showSearch,
            searchText: '',
        })   
        this.props.navigation.setParams({
            showSearch : !this.state.showSearch,
            searchText: '',
        });
        this.loadBoundarySearch('');
    }
    customBack(){
        if ( this.state.showSearch){
            this.handleSearchBar();
            this.updateSearch('');
        } else {
            this.props.navigation.goBack();
        }
    }  
    loadDownloadedBoundaries = async() => {
        this.setState({isLoading:true});
        var localBoundaries = await AsyncStorage.getItem('localBoundaries');        
        if (localBoundaries == undefined || localBoundaries == null) 
            localBoundaries = {};  
        else 
            localBoundaries = JSON.parse(localBoundaries);
        this.state.downloadedData = [];
        if (localBoundaries != null && localBoundaries != {}) {
            for (var property in localBoundaries) {
                this.state.downloadedData.push(localBoundaries[property]);
            }
        }
        this.setState({
            downloadedDataLoading: false,
            localBoundaries,
            isLoading: false,
        }); 
    }
    loadBoundarySearch = (searchText) => {
        this.setState({isLoading: true});
        BoundaryService.getBoundariesByTypeWithGeom({ search: this.state.searchText, page: this.state.page, size: this.state.pageSize})
        .then(res => res.json())
        .then(res => {
            if (res.length > 0) {                                               
                this.setState({
                    boundaryData: this.state.page === 0 ? res : [...this.state.boundaryData, ...res],
                    isLoading: false
                });                        
            } else {
                this.setState({ isLoading: false, moreElements: false});
            }
        })
        .catch(err => {
            this.setState({ isLoading: false});
        });
    }
    updateSearch(searchText) { 
        this.setState({ 
            boundaryData: [],
            isLoading: true, 
            page: 0,
            moreElements: true,
            searchText }, () => {
                this.state.debounceSearch(searchText);
            });

    }
    debounceSearchWrap (searchText) {
        this.loadBoundarySearch(searchText);
    }
    async downloadBoundary(item){
        if (this.state.isDownloading) {
            return;
        }
        this.setState({isDownloading:true});
        var wkt = new Wkt.Wkt();
        wkt.read(item.geom);
        var coordinates = [];
        wkt.components[0].map(coordsArr => { 
            coordinates.push ({
                latitude: coordsArr.y,
                longitude: coordsArr.x,
            });
        });
        var region = this.getRegionForCoordinates(coordinates);
        var tiles = this.tilesForZoom(region, 18);
        var tileServerUrl = constants.baseLayer;
        const createDirectories = tiles.map(async tile => {
            const folder = RNFetchBlob.fs.dirs.DocumentDir + "/boundary-" + item.id + "/" + `${tile.z}/${tile.x}`;
            var dirExist = await RNFetchBlob.fs.isDir(folder);
            if (!dirExist) {
                await RNFetchBlob.fs.mkdir(folder);
            }
        });
        const downloadTiles = tiles.map(async tile => {
            const file = RNFetchBlob.fs.dirs.DocumentDir + "/boundary-" + item.id + "/" + `${tile.z}/${tile.x}/${tile.y}.jpg`
            const fetchUrl = `${tileServerUrl}${tile.z}/${tile.x}/${tile.y}.jpg`;
            var exist = await RNFetchBlob.fs.exists(file);
            if (!exist) {
                await RNFetchBlob
                .config({ path : file })
                .fetch('GET', fetchUrl, {})
                .then((res) => {
                });
            } else {
            }
        });
        var tileUrl = RNFetchBlob.fs.dirs.DocumentDir + "/boundary-" + item.id + "/{z}/{x}/{y}.jpg";
        item['tileUrl'] = tileUrl;
        item['downloadDate'] = new Date().toLocaleDateString();
        item['modifications'] = {};
        TreeService.getAllByBoundaryId(item.id)
        .then(async (res) => res.json())
        .then(async (res) => {
           this.state.localBoundaries[item.id] = item;
           await AsyncStorage.setItem('localBoundaries',JSON.stringify(this.state.localBoundaries));  
           var treeRepository = {};
           // Prepare trees
           res.map((item,key) => {
                treeRepository[item.id] = item;
           });
           await AsyncStorage.setItem('localBoundariesId' + item.id,JSON.stringify({ ...item , trees: treeRepository}));                    
           setTimeout(()=>{
               this.setState({isDownloading:false});
               this.setState({ showSuccessAlert:true, alertSuccessText:strings.treeOffline.downlaodMessage});
               this.loadDownloadedBoundaries();
           },2000);
        }).catch(async (e) => {
            item['trees'] = [];
            await AsyncStorage.setItem('localBoundaries',JSON.stringify(this.state.localBoundaries));         
            await AsyncStorage.setItem('localBoundariesId' + item.id,JSON.stringify({ ...item, trees: {}}));                      
            setTimeout(()=>{
                this.setState({isDownloading:false});
                this.setState({ showErrorAlert:true, alertErrorText:strings.treeOffline.errorDownlaodMessage});
                this.loadDownloadedBoundaries();
            },2000);
        });
    }
    lonToTileX(lon, zoom) {
        return Math.floor((lon + 180) / 360 * Math.pow(2, zoom))
    } 
    latToTileY(lat, zoom) {
        return Math.floor(
            (1 - Math.log(Math.tan(this.degToRad(lat)) + 1 / Math.cos(this.degToRad(lat))) / Math.PI) /
            2 *
            Math.pow(2, zoom)
        )
    }
    degToRad(deg) {
        return deg * Math.PI / 180
    }
    tilesForZoom(region, zoom) {
        const minLon = region.longitude - region.longitudeDelta
        const minLat = region.latitude - region.latitudeDelta
        const maxLon = region.longitude + region.longitudeDelta
        const maxLat = region.latitude + region.latitudeDelta
        let minTileX = this.lonToTileX(minLon, zoom)
        let maxTileX = this.lonToTileX(maxLon, zoom)
        let minTileY = this.latToTileY(maxLat, zoom)
        let maxTileY = this.latToTileY(minLat, zoom)
        let tiles = []
        for (let x = minTileX; x <= maxTileX; x++) {
            for (let y = minTileY; y <= maxTileY; y++) {
            tiles.push({ x, y, z: zoom })
            }
        }      
        return tiles
    }
    getRegionForCoordinates(points) {
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
    handleLoadMore = () => {
        if(this.state.moreElements && !this.state.isLoading){
            this.setState({page: this.state.page + 1}, () => this.loadBoundarySearch('') );
        }
    };
    emptyList = ({}) => {
        if(!this.state.isLoading)
            return  <View style={{alignItems: 'center', marginTop: 30}}>
                    <Text style={{ color:'#737373'}}>{strings.friends.emptySearchResult}</Text>
                </View>
        else   
            return <View />
    }
    renderFooter = () => {
        return  ( this.state.isLoading ? 
                    <View style={styles.loader}> 
                        <ActivityIndicator color='#2CA06C' size='large' style={{justifyContent:'center', alignSelf: 'center', marginTop:40,}}/>
                    </View> : null);
    }
    emptyListDownload = ({}) => {
        if(!this.state.downloadedDataLoading)
            return  <View style={{alignItems: 'center', marginTop: 30}}>
                    <Text style={{ color:'#737373'}}>{strings.treeOffline.emptyList}</Text>
                </View>
        else   
            return <View />
    }
    renderFooterDownload = () => {
        return  ( this.state.downloadedDataLoading ? 
                    <View style={styles.loader}> 
                        <ActivityIndicator color='#2CA06C' size='large' style={{justifyContent:'center', alignSelf: 'center', marginTop:40,}}/>
                    </View> : null);
    }
    renderItem = ({ item, index }) => {
        return  <View key={item.id}>                    
                    <ListItem thumbnail style={{
                            marginLeft: 0, borderBottomColor: "#d2d3d2", 
                            borderBottomWidth: 1, paddingBottom: 10, paddingTop: 10}}>
                        <Left style={{paddingLeft:30}}>
                            <Image source={require('../../resources/trees/icon-map.png')} style= {styles.cardPicture}/>
                        </Left> 
                        <Body style={{ borderBottomWidth: 0 }}>                                                        
                            <Text style={{fontWeight: 'bold', color:'#737373'}}>{item.name}</Text>
                            { !this.state.showSearch &&
                                <View>
                                    <Text style={{color:'#737373', fontSize:12, paddingTop:5}}>{strings.treeOffline.downloadDate}
                                        <Text style={{color:'#737373'}}>{this.state.localBoundaries[item.id] != undefined && this.state.localBoundaries[item.id]['downloadDate'] != undefined ? this.state.localBoundaries[item.id]['downloadDate']: '' }</Text>
                                    </Text>
                                    <Text style={{color:'#737373', fontSize:12, paddingTop:5}}>{strings.treeOffline.editedTrees}
                                        <Text style={{color:'#737373'}}>{this.state.localBoundaries[item.id] != undefined && this.state.localBoundaries[item.id]['modifications']!= undefined ? Object.keys(this.state.localBoundaries[item.id]['modifications']).length : '' }</Text>
                                    </Text>
                                </View>
                            }                         
                        </Body>
                        { !this.state.showSearch  &&
                            <Right style={{borderBottomWidth: 0}}>
                                <Button style={styles.buttonFalse} onPress={() => this.props.navigation.navigate('TreeOfflineDetail', {item})}>
                                    <Text style={styles.buttonTextFalse}>{ strings.treeOffline.details }</Text>
                                </Button>      
                            </Right>
                        }
                        { this.state.showSearch && this.state.localBoundaries[item.id] == undefined &&
                            <Right style={{paddingLeft:10, paddingRight:20, borderBottomColor:'transparent'}}>
                                <TouchableOpacity style={{alignContent:'center'}} onPress={() => this.downloadBoundary(item)}>
                                    <Card style={{alignSelf:'center', height:50}}>
                                        <CardItem>
                                            <Image source={require('../../resources/global/icon-download.png')} style={{alignSelf:'center', height:24, width:20, resizeMode:'contain'}}/>
                                        </CardItem>
                                    </Card>
                                    <Text style={{ fontSize: 12, fontWeight:'400', color:'#9b9b9b', alignSelf:'center'}}>{strings.treeOffline.download}</Text>
                                </TouchableOpacity>
                            </Right>
                        }
                        { this.state.showSearch && this.state.localBoundaries[item.id] != undefined &&
                            <Right style={{paddingLeft:10, paddingRight:20, borderBottomColor:'transparent'}}>
                                <Text style={{ fontSize: 10, fontWeight:'400', color:'#9b9b9b'}}>{ strings.treeOffline.downloading }</Text>
                            </Right>                        
                        }
                    </ListItem>                    
                </View>
    }
    render(){
        return(
            <SafeAreaView style={{flex: 1}}>
                { !this.state.showSearch &&
                    <FlatList
                        style={{ width: '100%' }}
                        keyExtractor={(item, index) => index + ''}
                        data={this.state.downloadedData}
                        renderItem={this.renderItem}
                        ListEmptyComponent={this.emptyListDownload}
                        ListFooterComponent={this.renderFooterDownload}
                    />              
                }
                { this.state.showSearch &&
                        <FlatList
                        style={{ width: '100%' }}
                        keyExtractor={(item, index) => index + ''}
                        data={this.state.boundaryData}
                        onEndReached={this.handleLoadMore}
                        renderItem={this.renderItem}
                        ListEmptyComponent={this.emptyList}
                        ListFooterComponent={this.renderFooter}
                        onEndReachedThreshold={0.5}
                    />
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
                    onConfirmPressed={ () => { this.setState({showSuccessAlert:false})}}
                    onDismiss={ () => { this.setState({showSuccessAlert:false})}}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-check.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={globalStyles.alertText}> { this.state.alertSuccessText }  </Text>
                                    </View> 
                                    }
                />          
                { this.state.isDownloading && <Loader></Loader>  }           
            </SafeAreaView>  
        )
    }
}
const styles = StyleSheet.create({
    cardPicture: {
        height: 80, 
        width: 80, 
        alignSelf: 'center',
    },
    buttonFalse: {
        backgroundColor: '#2CA06C',
        marginTop: 10,
        justifyContent: 'center',
        alignItems:'center',
        height: 26,
    },
    buttonTextFalse: {
        color: '#fff',
        fontSize: 12,
        fontWeight:'400',
        paddingHorizontal: 10,
    }, 
});

const mapStateToProps = (state) => {
    return {
        idToken: state.user.id_token,
        loggedInStatus: state.loggedInStatus
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(TreeOffline);