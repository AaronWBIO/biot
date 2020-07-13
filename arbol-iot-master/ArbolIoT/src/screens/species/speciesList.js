import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { Col, Grid } from "react-native-easy-grid";
import {
    Text,
    SafeAreaView,
    SectionList,
    TouchableOpacity,
    View,
    Platform,
    AsyncStorage
} from 'react-native';
import { SearchBar } from 'react-native-elements';
import { Item, Icon, CheckBox, Body } from 'native-base';
import { createFilter } from 'react-native-search-filter';
import strings from '../../config/languages';
import Loader from '../../components/loader/Loader';
import _ from 'lodash';

class SpeciesList extends Component {
    static navigationOptions = ({navigation}) => {
        const {params = {}} = navigation.state;
        return {
            headerTintColor: colors.white,
            header: 
            <SafeAreaView style={ [ { backgroundColor: '#2CA06C'}, Platform.OS == "android" ? { height:60} : {}] }>
                <Grid >
                    <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center" }}>
                        <TouchableOpacity style={{ width:60, height:60, justifyContent:'center'}} onPress={() => { navigation.goBack() }}>
                            <Icon name="ios-arrow-back" style= {{ fontSize:28, color:'white',height:35, width: 10, alignSelf:'center', textAlign:'center'}}/>
                        </TouchableOpacity>
                    </Col>
                    <Col>
                        <SearchBar 
                        style= {{ backgroundColor:'white'}}
                        leftIconContainerStyle = {{ backgroundColor: 'white'}}
                        inputContainerStyle={{ backgroundColor:'white', borderRadius:10}}
                        onChangeText={ params.updateSearch }
                        placeholder={ strings.specieAssistant.searchPlaceHolder }
                        value={ params.search }
                        iconStyle = {{ backgroundColor: 'transparent'}}
                        containerStyle = {{backgroundColor:'transparent', borderTopWidth: 0,
                        borderBottomWidth: 0}} 
                        inputStyle = {{backgroundColor:'white', fontSize:14}} ></SearchBar>
                    </Col>
                    <Col style={{ width:10,height: 60, justifyContent: "center", alignItems: "center" }}>
                    </Col>
                </Grid>
            </SafeAreaView>
        }
    };
    constructor(props) {
        super(props)
        this.state = {
            species : [],
            speciesData: [],
            isLoading: true,
            commonSpecies: [],
            commonSpeciesIndex: {},
            showOnlyCommonSpecies: false,
        };
        if (_.has(this.props.config,'commonSpecies')) {
            if (this.props.config.commonSpecies.length > 0) {
                this.state.commonSpecies = this.props.config.commonSpecies;
            }
        }
    }
    async componentDidMount() {
        var species = await AsyncStorage.getItem('species');    
        if (species != undefined && species != null) {
            this.setState({speciesData: JSON.parse(species)},()=> {
                setTimeout(()=>{
                    this.dataFilter("");
                },1000)
            });
        }  
        if (this.state.commonSpecies != undefined && this.state.commonSpecies.length > 0) {
            this.state.commonSpecies.map((element) => {
                this.state.commonSpeciesIndex[element.id] = true;
            });
        }

        this.props.navigation.setParams({
            updateSearch: this.updateSearch.bind(this)
        });
    }
    updateSearch(e) {
        this.props.navigation.setParams({
            search: e
        });
        this.dataFilter(e);
    }
    getFirstLetterFrom(value) {
        return value.slice(0, 1).toUpperCase();
    }
    async dataFilter(text) {
        this.setState({isLoading:true});
        var data = {};
        var list = [];
        var filtered = this.state.speciesData.filter(createFilter(text, ['commonName','genus']));
        filtered.sort(function(a, b) {
            if(a.commonName.toLowerCase() < b.commonName.toLowerCase()) return -1;
            if(a.commonName.toLowerCase() > b.commonName.toLowerCase()) return 1;
            return 0;
        });
        var e = this;
        await filtered
            .map(function (item) {
                var letter = item.commonName.slice(0, 1).toUpperCase();
                if (e.state.showOnlyCommonSpecies) {
                    if (e.state.commonSpeciesIndex[item.id] != undefined && e.state.commonSpeciesIndex[item.id]) {
                        if (data[letter] != undefined) {
                            data[letter].push(item);
                        } else {
                            data[letter] = [];
                            data[letter].push(item);
                        }
                    }
                } else {
                    if (data[letter] != undefined) {
                        data[letter].push(item);
                    } else {
                        data[letter] = [];
                        data[letter].push(item);
                    }
                }
            });
        for (var key in data) {
            if (!data.hasOwnProperty(key)) continue;
            var items = data[key];
            list.push({title: key, data: items})
        }
        this.setState({species: list});
        this.setState({isLoading:false});
    }
    toggleCommonSpecies() {
        let status = !this.state.showOnlyCommonSpecies;
        this.setState({ showOnlyCommonSpecies: status}, ()=>{
            this.props.navigation.setParams({
                search: ""
            });
            this.dataFilter("");
        });
    }
    render() {
        return ( 
            <SafeAreaView style={{ flex:1 }}>
                { this.state.commonSpecies != undefined && this.state.commonSpecies.length > 0 &&
                <TouchableOpacity style={{ flexDirection:'row', margin:10, marginTop:20, flexDirection:'row'}} onPress={ () => this.toggleCommonSpecies() }>
                    <CheckBox color={'#41B17C'} style={{ borderRadius:0}} checked={this.state.showOnlyCommonSpecies} onPress={ () => this.toggleCommonSpecies() }/>
                    <Text style={{color:'#737373', marginLeft:25}}>{strings.specieAssistant.showOnlyCommonSpecies}</Text>
                </TouchableOpacity>
                }
                { this.state.species != undefined && this.state.species.length > 0 &&
                <SectionList
                    sections={ this.state.species }
                    style= {{         
                        flex: 1,
                        padding: 20 
                    }}
                    keyExtractor={(item, index, section) => item + index}
                    renderSectionHeader={({section: {title}}) => (
                        <Item>
                            <Text style={{fontWeight: 'bold', color:'#2CA06C'}}>{title}</Text>
                        </Item>
                    )}
                    renderItem = { ({ item, index, section }) => {
                        return (
                            <View key={index}>
                                <TouchableOpacity onPress={() =>{
                                    this.props.setParam({ specie:item });
                                    this.props.navigation.goBack();
                                }} >
                                    <View style={{ paddingBottom:10, paddingTop:10}}>
                                        <Text style={{ color:'#737373', fontSize:14}}>{ item.commonName }</Text>
                                        <Text style={{ color:'#737373', fontSize:12}}>{ item.genus }</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        );
                    } }
                />
                }
                { this.state.isLoading &&
                    <Loader></Loader>
                }
            </SafeAreaView>
        )  
    }
}
const mapStateToProps = (state) => {
    return {
        idToken: state.user.id_token,
        config: state.config.application.dynamic,
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(SpeciesList);