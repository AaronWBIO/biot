import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { Col, Row, Grid } from "react-native-easy-grid";
import {
    StyleSheet,
    Text,
    SafeAreaView,
    Image,
    TouchableOpacity,
    View,
    ImageBackground,
    FlatList,
    SectionList,
    ScrollView,
    BackHandler,
    AsyncStorage
} from 'react-native';
import { Item, Button, Icon } from 'native-base';
import strings from '../../config/languages';
import { createFilter } from 'react-native-search-filter';
import { SearchBar } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import constants from '../../config/constants';
import global from '../../styles/global';
import Lightbox from 'react-native-lightbox';

class SpecieAssistant extends Component {
    static navigationOptions = ({navigation}) => {
        const {params = {}} = navigation.state;
        return {
            headerTintColor: colors.white,
            header: 
            <SafeAreaView style={{ backgroundColor: colors.mainColor }}>
                <View style={{ backgroundColor: colors.mainColor ,height: 60}}>
                    <Grid style={{height:60,backgroundColor: '#2CA06C'}}>
                        <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center" }}>
                            <TouchableOpacity style={{ width:60, height:60, justifyContent:'center'}} onPress={ () => { 
                                    if (params.currentIndex > -1) {
                                        params.back();
                                    } else {
                                        navigation.goBack();
                                    }
                                }}>
                                <Icon name="ios-arrow-back" style= {{ fontSize:28, color:'white',height:36, width: 10, alignSelf:'center', textAlign:'center'}}/>
                            </TouchableOpacity>
                        </Col>
                        <Col style={{ flex:1, textAlign:'center', justifyContent:'center'}}>
                            { params.searchActivated != undefined &&  params.searchActivated &&
                                <SearchBar 
                                    style= {{ backgroundColor:'white'}}
                                    leftIconContainerStyle = {{ backgroundColor: 'white'}}
                                    inputContainerStyle={{ backgroundColor:'white', borderRadius:10}}
                                    placeholder={ strings.specieAssistant.searchPlaceHolder }                        
                                    onChangeText={ params.updateSearch }
                                    value={ params.search }
                                    iconStyle = {{ backgroundColor: 'transparent'}}
                                    containerStyle = {{backgroundColor:'transparent', borderTopWidth: 0, borderBottomWidth: 0}} 
                                    inputStyle = {{backgroundColor:'white', fontSize:14}} />
                            }
                            {
                                params.searchActivated != undefined && !params.searchActivated &&
                                <Text style={{ alignSelf:'center', color:'white', fontSize:15, fontWeight:'500'}}>{strings.treeForm.titleAssistant}</Text>
                            }
                        </Col>
                        <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center", alignSelf:'center' }}>
                            { params.showSearch &&
                            <TouchableOpacity style={{marginLeft: 10}} onPress={ () => { 
                                    navigation.setParams({searchActivated: !params.searchActivated});
                                }}>
                                <Icon name="ios-search" style={{ fontSize:20, color:"white", marginLeft: 10, marginRight:10}}/>
                            </TouchableOpacity>
                            }
                        </Col>
                    </Grid>
                </View>
            </SafeAreaView>
        }
    };
    constructor(props) {
        super(props)
        this.state = {
            currentIndex: -1,
            nodeStack: [],
            species: [],
            leafs: [],
            showSpecieDetail: false,
            specie: {},
            assistantData: undefined
        }  
        this.props.navigation.setParams({
            searchActivated: false,
            search: "",
            back: this.back.bind(this),
            currentIndex: -1,
        });
    }
    async componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
        this.props.navigation.setParams({
            updateSearch: this.updateSearch.bind(this),
        });
        var assistant = await AsyncStorage.getItem('assistant');      
        if (assistant != undefined && assistant != null) {
            let as = JSON.parse(assistant);
            this.setState({assistantData: as});
        }
    }
    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
    }
    navigate(node) {
        var stack = this.state.nodeStack;
        stack.push(node);
        var index = this.state.currentIndex + 1;
        this.setState({nodeStack:stack, currentIndex: index});
        this.props.navigation.setParams({
            currentIndex: index
        });
        if (
            this.state.currentIndex >= 0 &&
            node.options[0].type == 'leaf'
        ) {
            this.setState({leafs:node.options});
            this.props.navigation.setParams({
                showSearch: true,
                search: "",
            });
            this.filterSpecies(node.options, "");
        } 
    }
    back() {
        if (this.state.showSpecieDetail == true) {
            this.setState({showSpecieDetail:false});
            return;
        }
        var stack = this.state.nodeStack;
        stack.pop();
        var index = this.state.currentIndex - 1;
        this.setState({nodeStack:stack, currentIndex: index});
        this.props.navigation.setParams({
            searchActivated: false,
            showSearch: false,
            search: "",
            currentIndex: index
        });
    }
    handleBackPress = () => {
        if (this.state.currentIndex > -1) {
            this.back();
        } else {
            this.props.navigation.goBack();
        }
        return true;
    }
    renderNode = ({ item, key }) => {
        switch(item.type) {
            case 'branch':
                return (<Item style={styles.itemOption} key={key} onPress={() => {  this.navigate(item); }}>
                        <View style={{flex:1, flexDirection:'row', width:'100%' }}>
                            <Text style={{ fontSize:12, color:'#2CA06C'}}>{ item.prefix }</Text>
                            <Text style={{ fontSize:12, color:'#737373', marginLeft:5 }}>{ item.description }</Text>
                        </View>
                        <View style={{flex:1, width:'100%'}}>
                            <Grid style={{ flex:1}}>
                                <Col style={{ padding:10, flex:1, flexDirection:'row', overflow:'hidden' }}>               
                                    {item.images.map((imageObj, key) => {
                                        return (
                                            <FastImage
                                                key={key}
                                                resizeMode="stretch"
                                                style={{ width:40, height:40, marginRight:20, marginTop:5}} 
                                                source={{ uri: constants.base + imageObj.uri, 
                                                          headers: { 
                                                              "Authorization":  "Bearer " + this.props.idToken,
                                                              "Accept": "*/*", 
                                                              "Content-Type": "*/*" },
                                                          priority: FastImage.priority.high
                                                        }}
                                            />
                                        );
                                    })}
                                </Col>
                                <Col style={{ width:50, justifyContent: "center", alignItems: "center", backgroundColor:'white'}}>                                
                                        <Button rounded onPress={() => {  this.navigate(item); }} style={ styles.viewSpeciesButton } >
                                            <Icon name="ios-arrow-forward" style={{ 
                                                            fontSize:16, width:7, height:16, color:"white",paddingTop:0, 
                                                            textAlign:'center',alignSelf:'center'}}/>
                                        </Button>
                                </Col>
                            </Grid>
                        </View>
                    </Item>)
            default:
                return (<Item style={styles.itemOption}  key={key} />)
        }
    }   
    async filterSpecies(leafs, text) {
        var data = {};
        var list = [];
        var filtered = await leafs.filter(createFilter(text, ['specie.commonName','specie.genus']));
        filtered.sort(function(a, b) {
            if(a.specie.commonName.toLowerCase() < b.specie.commonName.toLowerCase()) return -1;
            if(a.specie.commonName.toLowerCase() > b.specie.commonName.toLowerCase()) return 1;
            return 0;
        });
        await filtered
            .map(function (item) {
                var letter = item.specie.commonName.slice(0, 1).toUpperCase();
                if (data[letter] != undefined) {
                    data[letter].push(item);
                } else {
                    data[letter] = [];
                    data[letter].push(item);
                }
            });
        for (var key in data) {
            if (!data.hasOwnProperty(key)) continue;
            var items = data[key];
            list.push({title: key, data: items})
        }
        this.setState({species:list});
    }
    updateSearch(text) {
        this.props.navigation.setParams({
            search: text
        });
        this.filterSpecies(this.state.leafs, text);
    }
    render() {
        const filterHtml = /(<([^>]+)>)/ig;
        return ( 
            <SafeAreaView style={{flex:1}}>
                { this.state.currentIndex == -1 &&
                    <ImageBackground source={require('../../resources/global/background-map.png')} style={ styles.imageBackground }>
                        <View style={{ flex: 1, flexDirection:'column', justifyContent:'center', alignItems: 'center'}}>
                            <Text style={[ global.text,{ width:'60%', textAlign:'center'}]}>{ strings.specieAssistant.selectSpecieText }</Text>
                            <Image style={{margin:20}} source={require("../../resources/specie-assistant/intro-img.png")} />
                            <View style={styles.buttonContainer}>
                                { this.state.assistantData != undefined &&
                                <Button block success style={ styles.continueButton } onPress={() => this.navigate(this.state.assistantData) }>
                                    <Text style= { styles.continueLabel }>{ strings.continueLabel }</Text>
                                </Button>
                                }
                            </View>
                        </View>
                    </ImageBackground>
                }
                {
                    this.state.showSpecieDetail == true &&
                    this.state.specie != null &&
                    <View style={{ flex: 1}}>
                        { this.state.specie.image.objectName == undefined &&
                            <ImageBackground source={require('../../resources/global/default-tree-img.png')} style={{ width: '100%', height: 160 }} />
                            }
                        { this.state.specie.image.objectName != undefined &&
                            <Lightbox
                            renderContent={
                                () => (<FastImage
                                resizeMode="cover"
                                style={{ flex:1 }} 
                                source={{ uri: constants.base + this.state.specie.image.uri, 
                                    headers: { 
                                        "Authorization":  "Bearer " + this.props.idToken,
                                        "Accept": "*/*", 
                                        "Content-Type": "*/*" },
                                    priority: FastImage.priority.high
                                }}
                            />)
                            }
                            >
                                <FastImage
                                    resizeMode="cover"
                                    style={{ width:'100%', height:160 }} 
                                    source={{ uri: constants.base + this.state.specie.image.uri, 
                                                headers: { 
                                                    "Authorization":  "Bearer " + this.props.idToken,
                                                    "Accept": "*/*", 
                                                    "Content-Type": "*/*" },
                                                priority: FastImage.priority.high
                                            }}
                                />
                            </Lightbox>
                            }
                        <View style={{ 
                                width:'100%', 
                                paddingLeft:40,
                                paddingRight:40,
                                backgroundColor:'#F4F4F6', 
                                height:61, 
                                shadowOffset: { width: 5, height: 5 },
                                shadowColor: "grey",
                                shadowOpacity: 0.5,
                                justifyContent:'center',
                                shadowRadius: 5,
                                elevation: 5 }}>
                            <Text style={{fontSize:12, color:'#4A4A4A'}}>{ this.state.specie.commonName }</Text>
                            <Text style={{fontSize:12, color:'#737373'}}>{ this.state.specie.genus }</Text>
                        </View>
                        { this.state.specie != undefined && this.state.specie.description != undefined &&
                            <ScrollView style={{ flex:1, marginBottom:110}}>
                                 { this.state.specie.description != undefined && this.state.specie.description !='&nbsp;' && 
                                 <Text style={{fontSize:12, color:'#4A4A4A', marginLeft:40, marginRight:40, marginTop:20}}>{ strings.description }</Text> }
                                <Text style={{ margin:40, marginTop:10, marginBottom:0}}>
                                    { this.state.specie.description != undefined && this.state.specie.description !='&nbsp;' ? this.state.specie.description.replace(filterHtml, '') : '' }
                                </Text>
                            </ScrollView>
                        }
                        <View style={[ styles.buttonContainer, {position:'absolute', bottom:10, alignSelf:'center'}]}>
                            <Button block style={ styles.continueButton } onPress={() => {
                                    this.props.setParam({ specie: this.state.specie  });
                                    this.props.navigation.goBack();
                                }}>
                                <Text style= { styles.continueLabel }>{ strings.specieAssistant.asignSpecie }</Text>
                            </Button>
                        </View>
                    </View>
                }
                { this.state.currentIndex >= 0 &&
                  this.state.showSpecieDetail == false &&
                    <Grid style={{flex:1}}>
                        <View style={{flex:1}}>
                            <Row style={ styles.titleArea }>
                                <Text style={{ padding:15, paddingLeft:40, paddingRight:40, textAlign:'center', color:'#737373',fontSize:12}}>
                                    { this.state.nodeStack[this.state.currentIndex].description }
                                </Text>
                            </Row>
                            <Row>
                                { this.state.nodeStack[this.state.currentIndex].options != undefined &&
                                  this.state.nodeStack[this.state.currentIndex].options.length > 0 &&
                                  this.state.nodeStack[this.state.currentIndex].options[0].type != 'leaf' &&
                                <FlatList
                                    data={this.state.nodeStack[this.state.currentIndex].options}
                                    styles= {{ flex:1, paddingTop:10 }}
                                    numColumns= {1}
                                    renderItem= { this.renderNode }
                                />
                                }
                                { this.state.nodeStack[this.state.currentIndex].options != undefined &&
                                  this.state.nodeStack[this.state.currentIndex].options.length > 0 &&
                                  this.state.nodeStack[this.state.currentIndex].options[0].type == 'leaf' &&
                                  <SectionList
                                        sections={ this.state.species }
                                        style= {{         
                                            flex: 1,
                                            margin:30
                                        }}
                                        keyExtractor={(item, index, section) => item + index}
                                        renderSectionHeader={({section: {title}}) => (
                                            <Item>
                                                <Text style={{fontWeight: 'bold', color:'#2CA06C'}}>{title}</Text>
                                            </Item>
                                        )}
                                        renderItem = { ({ item, index, section }) => {
                                            return (
                                                <View style={styles.itemOption} key={item.key}>
                                                    <Grid style={{flex:1, flexDirection:'row', width:'100%' }}  onPress={() => { 
                                                    this.setState({ specie: item.specie, showSpecieDetail: true });
                                                    this.props.navigation.setParams({
                                                        searchActivated: false,
                                                        showSearch: false
                                                    });
                                                }}>
                                                        <Col style={{width:100}}>
                                                            { item.specie.image.objectName == undefined &&
                                                                <Image resizeMode="stretch" style={{ width:80, height:80, marginRight:20, marginTop:5, backgroundColor:'#f7f7f7'}} 
                                                                    source={require('../../resources/global/default-tree-img.png')}
                                                                />   
                                                            }
                                                            { item.specie.image.objectName != undefined &&
                                                                <FastImage
                                                                    resizeMode="stretch"
                                                                    style={{ width:80, height:80, marginRight:20, marginTop:5, backgroundColor:'#f7f7f7'}} 
                                                                    source={{ uri: constants.base + item.specie.image.uri, 
                                                                                headers: { 
                                                                                    "Authorization":  "Bearer " + this.props.idToken,
                                                                                    "Accept": "*/*", 
                                                                                    "Content-Type": "*/*" },
                                                                                priority: FastImage.priority.high
                                                                            }}
                                                                />
                                                            }
                                                        </Col>
                                                        <Col style={{flex:1, flexDirection:'column', marginTop:20}}>
                                                            <Text style={{ fontSize:12, paddingBottom:5, color:'#2CA06C'}}>{ item.specie.commonName }</Text>
                                                            <Text style={{ fontSize:12, color:'#737373'}}>{ item.specie.genus }</Text>
                                                        </Col>
                                                        <Col style={{ width:50, justifyContent: "center", alignItems: "center", textAlign:'center', backgroundColor:'white'}}>                                
                                                            <Button rounded onPress={() => { 
                                                                this.setState({ specie: item.specie, showSpecieDetail: true });
                                                                this.props.navigation.setParams({
                                                                    searchActivated: false,
                                                                    showSearch: false
                                                                });
                                                            }} style={ styles.viewSpeciesButton } >
                                                                <Icon name="ios-arrow-forward" style={{ 
                                                                        fontSize:16, width:7, height:16, color:"white",paddingTop:0, 
                                                                        textAlign:'center',alignSelf:'center'}}/>
                                                            </Button>
                                                        </Col>
                                                    </Grid>
                                                </View>
                                            );
                                        } }
                                    />
                                }
                            </Row>
                            { this.state.nodeStack[this.state.currentIndex].options != undefined && this.state.nodeStack[this.state.currentIndex].options.length > 0 &&
                              this.state.nodeStack[this.state.currentIndex].options[0].type == "leaf" &&
                            <Row style={{   height:60,         
                                            textAlign: 'center',
                                            alignSelf: 'center',
                                            justifyContent:'center',
                                            paddingBottom:30,
                                            alignItems: 'center',}}>
                                <View style={styles.buttonContainer}>
                                    <Button block danger style={ styles.dangerButton } onPress={() => {
                                            this.props.setParam({ specie: -1 });
                                            this.props.navigation.goBack();
                                        }}>
                                        <Text style= { styles.continueLabel } >{ strings.specieAssistant.specieNotFound }</Text>
                                    </Button>
                                </View>
                            </Row>
                            }
                        </View>
                    </Grid>
                }
            </SafeAreaView>
        )  
    }
}

const styles = StyleSheet.create({
    imageBackground: {
        width: '100%', 
        height: '100%',
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
    },
    dangerButton: {
        backgroundColor:'#EA585E', 
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
        width: '80%',
    },
    titleArea:{
        width:'100%', 
        backgroundColor:'#F4F4F6',
        shadowOffset: { width: 2, height: 2 },
        shadowColor: "grey",
        textAlign: 'center',
        alignSelf: 'center',
        justifyContent:'center',
        alignItems: 'center',
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation:2,
        height:50
    },
    itemOption: {
        padding: 10,
        marginTop:5,
        flex:1,
        flexDirection:'column'
    }, 
    viewSpeciesButton: {
        alignSelf: 'center',
        justifyContent:'center',
        marginRight: 0,
        backgroundColor: '#2CA06C',
        borderRadius : 30,
        width : 25,
        height : 25,     
        shadowOffset: { width: 5, height: 5 },
        shadowColor: "grey",
        shadowOpacity: 0.5,
        shadowRadius: 5
    },
});
 
const mapStateToProps = (state) => {
    return {
        idToken: state.user.id_token
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(SpecieAssistant);