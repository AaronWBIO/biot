import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { Col, Row, Grid } from "react-native-easy-grid";
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Image,
    ListView,
    FlatList,
    ActivityIndicator
} from 'react-native';
import { ListItem, List, Button, Icon } from 'native-base';
import { SearchBar } from 'react-native-elements';
import strings from '../../config/languages';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import BoundaryService from '../../services/boundary';
import { SafeAreaView } from 'react-navigation';
import globalStyles from '../../styles/global';
import Orientation from 'react-native-orientation';

class Boundary extends Component { 
    static navigationOptions = ({navigation}) => {
        const {params = {}} = navigation.state; 
        return {
            headerTintColor: colors.white,
            header: 
            <SafeAreaView style={{ backgroundColor: '#2CA06C'}}>
                <View style={{ backgroundColor: '#2CA06C',height: 60}}>
                    <Grid >
                        <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center" }}>
                                <TouchableOpacity style={{ width:60, height:60, padding:5, justifyContent:'center'}} 
                                    onPress={ () => { 
                                        if (params.customBack !== undefined) {
                                            params.customBack();
                                        }
                                    }}>
                                    <Icon name="ios-arrow-back" style= {[ globalStyles.headerLeftIcon, { alignSelf:'center'}]}/>
                                </TouchableOpacity>
                        </Col>                       
                        <Col> 
                            { (!params.showSearch == undefined || !params.showSearch) ? 
                                <View style={styles.centerContent}>
                                    <Text style={styles.title}> {strings.boundary.title} </Text> 
                                </View> 
                                :                             
                                <SearchBar 
                                    style= {{ backgroundColor:'white'}}
                                    leftIconContainerStyle = {{ backgroundColor: 'white'}}
                                    inputContainerStyle={{ backgroundColor:'white', borderRadius:10}}
                                    placeholder="Buscar colonia"
                                    onChangeText={ params.updateSearch }
                                    value={ params.searchText }
                                    iconStyle = {{ backgroundColor: 'transparent'}}
                                    containerStyle = {{backgroundColor:'transparent', borderTopWidth: 0,
                                    borderBottomWidth: 0}} 
                                    inputStyle = {{backgroundColor:'white', fontSize:14}} />
                            }                   
                        </Col>
                        {  (!params.showSearch == undefined || !params.showSearch) &&
                            <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center" }} />
                        }
                    </Grid>
                </View>
            </SafeAreaView>
        }
    };
    favoriteBoundaryDataSource = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    constructor(props) {
        super(props)
        this.state = {
            boundaryDataSource: null,
            isLoading: true,
            searchText: '',
            showSearch: false, 
            moreElements: true,
            page: 0,
            size: 50,
            alert: { show: false, wrapper:false, continueLabel:'Intentar nuevamente', view: <View/>, onConfirmPressed:null, onCancelPressed: null, cancelText:'Cancelar'},
        } 
    }
    componentDidMount() {
        Orientation.lockToPortrait();
        this.props.syncBoundaryFavs();
        this.props.navigation.setParams({
            updateSearch: this.updateSearch.bind(this),
            customBack: this.customBack.bind(this),
            showSearch: false,
            searchText: ''
        });
        this.setState({
            searchText:'',
            boundaryDataSource: null
        });
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.boundaryFavs !== this.props.boundaryFavs) {
            this.setState({isLoading:false});
        }
    }
    clearParameters() {
        this.props.navigation.setParams({
            searchText: ''
        });
        this.setState({
            boundaryDataSource: null,
            searchText:''
        });
    }
    customBack(){
        if ( this.state.showSearch){
            this.handleSearchBar();
            this.clearParameters();
        } else {
            this.props.navigation.goBack();
        }
    }
    handleSearchBar(){
        var visible = !this.state.showSearch;
        this.setState({
            showSearch: visible
        })   
        this.props.navigation.setParams({
            showSearch : visible
        });
    }
    showAlert = () => {
        this.state.alert.wrapper = true;
        this.state.alert.show = true;
        this.setState({ alert: this.state.alert });
    };
    hideAlert = () => {
        this.state.alert.show = false;
        this.setState({ alert: this.state.alert });
        this.clearParameters();
    };
    addBoundaryFav(boundaryFav){
        BoundaryService.addFavorite(boundaryFav)
        .then(responseJson => {
            this.props.syncBoundaryFavs();
            this.state.alert.onCancelPressed= () => { 
                this.hideAlert();
                this.handleSearchBar();
            };
            this.state.alert.onConfirmPressed= this.state.alert.onCancelPressed;
            this.state.alert.view = 
            <View>
                <Text style={styles.alertTextAdd}> {strings.boundary.addedMessage } </Text> 
                <Image source={require('../../resources/boundary/boundary.png')} style={ styles.alertImgAdd}/>                                                   
            </View>;
            this.showAlert();
            
        })
        .catch(error => {
        });
    }
    deleteBoundaryFav(boundaryFav,secId, rowId, rowMap) {
        this.state.alert.showCancelButton = true;
        this.state.alert.onCancelPressed = () => {
            this.hideAlert();
        }
        this.state.alert.showCancelButton = true;
        this.state.alert.cancelText = "Cancelar";
        this.state.alert.view = 
            <View>
                <Button onPress={ () => this.hideAlert() } style={{ padding: 0, elevation: 0, 
                    justifyContent:'center',
                    backgroundColor:'transparent',
                    alignContent:'center',
                    width:60, height:40,
                    borderColor: '#f3f3f5'}}>
                    <Icon name="ios-close" style={{ fontSize:24, color:'#737373', alignSelf:'center'}}/>
                </Button>
                <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/>                             
                <Text style={styles.alertText}> {strings.boundary.deleteMessage } </Text>       
            </View>
        this.state.alert.onCancelPressed = () => { 
            this.hideAlert(); 
        };
        this.state.alert.onConfirmPressed = async () => {
            this.setState({isLoading:true});
            BoundaryService.deleteFavorite(boundaryFav.id)
            .then(responseJson => {
                setTimeout(()=>{
                    this.props.syncBoundaryFavs();
                },500);
            })
            .catch(error => {
            });
            this.hideAlert();
        };
        this.showAlert();
    }
    selectBoundary(boundary) {
        this.props.setCurrentBoundary(boundary);
        this.props.navigation.goBack();
    }
    updateSearch(searchText) {
        if (searchText == '') {
            this.clearParameters();
            return;
        }
        this.setState({ 
            isLoading: true, 
            searchText });
        this.props.navigation.setParams({
            searchText
        });
        BoundaryService.query({search: searchText, page: this.state.page, size: this.state.size})
        .then(response => response.json())
        .then(responseJson => {
            if (responseJson.length > 0) {
                this.setState({
                    boundaryDataSource: this.state.page === 0 ? responseJson : [...this.state.boundaryDataSource, ...responseJson],
                    isLoading: false,
                });
            }                
            this.setState({isLoading: false, moreElements: false});
        })
        .catch(error => {});
    }
    handleLoadMore = () => {
        if(this.state.moreElements){
            this.setState( state => ({page: state.page + 1}), () => this.updateSearch(this.state.searchText));
        }
    };
    renderItem = ({ item, index }) => {
        if (item.empty === true) {
            return <View key={item.id} style={[styles.item, styles.itemInvisible]} />;
        }   
        return (            
                <View key={item.id} style={[ styles.listNoDiv , {paddingVertical: 5,}]}>
                    <Row style={{ alignItems:'center'}}>
                        <Col size={70}>
                            <Text style={styles.label}>{ item.name }</Text>
                        </Col>
                        <Col size={30} >
                            <Button style={{justifyContent:'flex-end', alignSelf: 'flex-end', backgroundColor: '#2CA06C', borderRadius: 3, height:35, marginVertical:5, marginRight:10}} onPress={ () => this.addBoundaryFav(item) }>
                                <Text style={styles.addButtonText}> {strings.boundary.add} </Text>
                            </Button>   
                        </Col>                
                    </Row>
                </View>
        );
    };
    render() {
        const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
        return (
                <SafeAreaView style={{flex:1}}>                
                        <View style={styles.wrapper}>
                            {
                                this.state.isLoading &&
                                <View style={[styles.loader, { marginTop:20}]}> 
                                    <ActivityIndicator color='#2CA06C' size='large' />
                                </View>
                            } 
                            { !this.state.showSearch && !this.state.isLoading ?   
                                ((this.props.boundaryFavs != {} && this.props.boundaryFavs.length > 0 ) ?                                                            
                                <List                                     
                                    rightOpenValue={-75}
                                    dataSource={ this.favoriteBoundaryDataSource.cloneWithRows(this.props.boundaryFavs) }
                                    renderRow={data => 
                                    <ListItem style={styles.listNoDiv}>                                        
                                        <Row style={{justifyContent:'center', alignItems:'center'}}>
                                            <Col size={70}>
                                                <TouchableOpacity onPress={() => this.selectBoundary(data) } >
                                                    <Text style={styles.label}>
                                                        { data != undefined ? data.name : ''}
                                                    </Text> 
                                                </TouchableOpacity>
                                            </Col>
                                            <Col size={30}>
                                                <View style={styles.rightContainer}>
                                                    <Image source={require('../../resources/global/icon-tree-gen.png')} style={styles.icon}/>
                                                    <Text style={styles.number}>
                                                        { data.trees }
                                                    </Text>
                                                    <Image source= {require('../../resources/boundary/icon-line.png')} style={styles.iconB} />
                                                </View>
                                            </Col>
                                        </Row>                                        
                                    </ListItem> 
                                    }
                                    renderRightHiddenRow={(data, secId, rowId, rowMap) =>
                                        <Button full danger onPress={ () => this.deleteBoundaryFav(data,secId, rowId, rowMap)}>
                                            <Text style={styles.deleteText}> {strings.boundary.delete} </Text>
                                        </Button>}
                                /> 
                                :
                                <Text style={{ justifyContent:'center', alignSelf:'center', textAlign:'center', marginTop:40,  color: "#5b5b5b"}}>{ strings.boundary.emptyList }</Text> )
                            :                                
                            <View style={{  }}>
                                <FlatList
                                    extraData={this.state}
                                    data={this.state.boundaryDataSource}
                                    keyExtractor={(item, index) => item.id+''}
                                    styles= {styles.container}
                                    renderItem= {this.renderItem}
                                    onEndReached={() => this.handleLoadMore()}
                                    onEndReachedThreshold={0.5}                                    
                                />
                                {  this.state.searchText.length == 0 && !this.state.isLoading && 
                                    <Text style={{ justifyContent:'center', alignSelf:'center', marginTop:40,  color: "#5b5b5b"}}>{strings.boundary.searchPlaceholder}</Text>
                                }
                            </View> 
                            }
                        </View>
                    { !this.state.showSearch ?       
                        <SafeAreaView style={styles.footer}>
                            <Row>
                                <Col style={styles.center}>
                                    < TouchableOpacity onPress={ () => this.handleSearchBar() } > 
                                        <View style={styles.addContainer}>
                                            <Image source={require('../../resources/global/icon-add.png')} style={styles.addIcon}/>
                                        </View>                            
                                        <Text style={styles.addText}> {strings.boundary.addColony} </Text>
                                    </TouchableOpacity>
                                </Col>    
                                <Col style={styles.center}>
                                    <View style={{flexDirection: 'row'}}>
                                        <Image source={require('../../resources/global/icon-tree-gen.png')} style={styles.descriptionIcon}/>
                                        <Text style={styles.descriptionText}> {strings.boundary.description} </Text>
                                    </View>
                                </Col>
                            </Row>
                        </SafeAreaView>  
                    :
                        null
                    }
                    <AwesomeAlertPlus
                        alertContainerStyle = { { padding: 0, } }
                        overlayStyle= { {padding: 0} }
                        contentContainerStyle= { {borderWidth: 0, borderRadius: 0, padding: 0, margin: 0} }
                        messageStyle= { {padding: 0} }
                        show={ this.state.alert.show }
                        showProgress={false}
                        closeOnTouchOutside={true}
                        closeOnHardwareBackPress={true}
                        showCancelButton={false}
                        showConfirmButton={true}
                        confirmText= { strings.boundary.continue }
                        confirmButtonTextStyle= { styles.alertConfirmText }
                        confirmButtonColor="#2CA06C"
                        confirmButtonStyle = { styles.alertButton }
                        onCancelPressed={ this.state.alert.onCancelPressed }
                        onConfirmPressed={ this.state.alert.onConfirmPressed }
                        customView = { this.state.alert.view }
                    /> 
                </SafeAreaView>
        ) 
    } 
}

const styles = StyleSheet.create({
    title:{
        color: 'white',
        fontSize: 15,
        fontWeight: '500',
    },
    listNoDiv: {
        paddingLeft: 40,
        borderBottomWidth: 1, 
        borderBottomColor: '#ccc'
    },
    rightContainer: {
        flexDirection:'row', 
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: "#737373"
    },
    icon: {
        height: 20,
        width: 17,
        marginRight: 10,
    },
    iconB: {
        height: 30,
        width: 10,
        marginLeft: 10,
    },
    addContainer:{
        backgroundColor: '#2ca06c',
        borderColor: '#208d5c',
        borderRadius: 14,
        borderWidth: 1,
        height: 28,
        width: 28,   
        alignSelf: 'center',
        alignItems:'center',
        justifyContent: 'center',     
    },
    addIcon:{
        width: 18,
        height: 18,
        resizeMode: 'contain',        
    },
    descriptionIcon:{
        height: 24,
        width: 21,
        marginRight: 10,
    },
    number: { 
        fontSize: 16,
        fontWeight: '300',
        color: "#4a4a4a"
    },
    footer:{
        borderTopWidth: 2,
        borderColor: '#BCBDBD',
        backgroundColor: "#f4f4f6",
        paddingTop: 20,
        paddingBottom: 10,
        width: '100%', 
        flexDirection: 'row',
        position: 'absolute',
        bottom:0,
    },
    center:{
        justifyContent:'center',
        alignItems: 'center',
    },
    addText:{
        fontSize:8,
        color: '#5b5b5b',
        fontWeight: '400',
        marginTop: 5,
    },
    descriptionText:{
        fontSize:14,
        color: '#5b5b5b',
        fontWeight: '400',
    },
    deleteText:{
        fontSize:16,
        color: '#fff',
        fontWeight: '400',
    },
    centerContent:{
        flex: 1, 
        justifyContent: 'center', 
        alignContent: 'center', 
        alignItems:'center',
    },
    alertButton: {
        width: '100%',   
        marginTop: 10,     
        marginBottom: 40,
        paddingHorizontal: 40,
        paddingVertical: 10,
    },
    alertConfirmText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        color: '#fefefe'
    },  
    alertImg: {
        marginTop: 10,
        height: 61,
        width: 61,
        resizeMode: 'contain',
        alignSelf: 'center'
    },
    alertImgAdd: {
        marginTop: 30,
        marginBottom: 30,
        height: 125,
        width: 167,
        resizeMode: 'contain',
        alignSelf: 'center'
    },
    alertTextAdd:{
        textAlign: 'center',
        marginTop: 40,
        fontSize: 18,
        lineHeight: 25,
        fontWeight: '400',
        color: '#737373',
        marginHorizontal: 30,
    },
    alertText:{
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
        lineHeight: 23,
        fontWeight: '400',
        color: '#737373',
        marginHorizontal: 30,
    },
    addButton:{
        backgroundColor: '#2CA06C', 
        borderRadius: 5,
        width: '100%', 
        height: 30,
        justifyContent: 'center',
    }, 
    addButtonText:{
        color: '#fff',
        fontSize: 13,
        fontWeight: '400',
        paddingHorizontal: 20,    
    },

});
const mapStateToProps = (state) => {
    return {
        loggedInStatus: state.loggedInStatus,
        boundaryFavs: state.boundaryFavs
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Boundary);