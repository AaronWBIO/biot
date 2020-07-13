import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import {
    StyleSheet,
    Text,
    SafeAreaView,
    Image,
    TouchableOpacity,
    View,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { Icon, Badge, ListItem, Left, Body, Right } from 'native-base';
import strings from '../../config/languages';
import TreeService from '../../services/tree';
import constants from '../../config/constants';
import ImageWithAuth from '../../components/image';
import globalStyles from '../../styles/global';
import _ from 'lodash';

class TreesValidation extends Component {
    static navigationOptions =  ({ navigation }) => {
        const { params = {} } = navigation.state;
        return {
            title: strings.treesValidation.title,
            headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
                            <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
                        </TouchableOpacity>,     
            headerRight: <TouchableOpacity style={globalStyles.headerRight}  onPress={() => params.filters()} >
                            <Image source={require('../../resources/global/icon-filter.png')} style= {{height:18, width: 17}}/>
                            <Text style= {globalStyles.headerRightSmallLabel}>{strings.treesValidation.filter}</Text>
                        </TouchableOpacity>,
            headerTintColor: colors.white,
            headerStyle: globalStyles.headerStyle,
            headerTitleStyle: globalStyles.headerTitleStyle,
        };
    };    
    constructor(props) {
        super(props)
        this.state = {
            isLoading: true,
            filter: false,
            query: [
                { type: strings.asc, status: false },
                { type: strings.desc, status: true },],
            treesData: [],
            moreElements: true,
            page: 0,
            size: 10,
            sort: 'id,desc',
            status: 'DRAFT',
            alert: { show: false, confirmText: null,  view: <View/>, onConfirmPressed:null, onCancelPressed: null, 
                closeOnHardwareBackPress: null, closeOnTouchOutside: null, showConfirmButton: false},
        }  
    }
    componentDidMount() {
        this.props.navigation.setParams({ filters: this.showHandler });
        this.subs = [ 
            this.props.navigation.addListener ('willFocus', () => { 
                if (!this.state.isLoading) {
                    this.state.page = 0;
                    this.loadTreeValidation();
                }
            }),
        ];
        this.loadTreeValidation();
    }
    componentWillUnmount() {
        this.subs.forEach((sub) => {
          sub.remove();
        });
    }
    loadTreeValidation = () => {
        this.setState({ isLoading: true})        
        TreeService.getTreesByStatus( this.state.status, { page: this.state.page, size: this.state.size, sort:this.state.sort })
        .then((res) => {            
            if(res.status==200 || res.status == 201){                
                let result = JSON.parse(res._bodyText);
                if(result.length > 0){
                    this.setState({
                        treesData: this.state.page === 0 ? result : [...this.state.treesData, ...result],
                        isLoading: false,
                    });
                } else{
                    this.setState({ moreElements: false, isLoading: false });
                }
            }
        })
        .catch((e) => {
            this.setState({ isLoading: false });
        });
    }
    getFilters(){
        return (            
            <View style={styles.filterBox}>
                <View style={styles.filterBoxContent}>
                    <View style={styles.filterBoxContentForm}>
                        <Text style={styles.filterLabel}>{ strings.treesValidation.dateOrder }</Text>                                                
                        <ListItem icon>                            
                            <Body>
                                <TouchableOpacity onPress={ () => {this.setFilterDateAscendent()} }>
                                    <Text style={styles.filterItem}>{ strings.asc }</Text>
                                </TouchableOpacity>
                            </Body>
                            <Right>                                
                                { this.state.query[0].status ?
                                    <Icon style={styles.iconChk} name="ios-checkmark" /> 
                                    : null
                                }   
                            </Right>                                
                        </ListItem>
                        <ListItem icon>                            
                            <Body>
                                <TouchableOpacity onPress={ () => {this.setFilterDateDescendent()} }>
                                    <Text style={styles.filterItem}>{ strings.desc }</Text>
                                </TouchableOpacity>
                            </Body>
                            <Right>
                                { this.state.query[1].status ?
                                    <Icon style={styles.iconChk} name="ios-checkmark" /> 
                                    : null
                                }                                                            
                            </Right>                            
                        </ListItem>
                    </View>
                </View>
            </View>
        );
    }
    showHandler = () => {
        this.setState({filter: !this.state.filter});
    };
    setFilterDateAscendent(){
        this.state.query[0].status=true;
        this.state.query[1].status=false;
        this.setState({
            sort: 'id,asc',
            page: 0,
        }, () => this.loadTreeValidation());          
        this.showHandler();
    }
    setFilterDateDescendent(){
        this.state.query[1].status=true;
        this.state.query[0].status=false;
        this.setState({
            sort: 'id,desc',
            page: 0,
        }, () => this.loadTreeValidation());          
        this.showHandler();
    }
    redirectToTreeView(id) {
        this.props.navigation.navigate('TreeViewDetail',{ id: "tree." + id, mode:'validate' });
    }
    renderItem = ({ item, index }) => {
        if (item.empty === true) {
            return <View key={item.id} style={[styles.item, styles.itemInvisible]} />;
        }   
        return (            
            <View key={item.id} style={ styles.item }>
                <ListItem thumbnail style={ { marginLeft: 0, borderBottomColor: "#d2d3d2", borderBottomWidth: 1, paddingBottom: 10, paddingTop: 10}}>
                    <TouchableOpacity onPress={() => this.redirectToTreeView(item.id)} style={{ width: '100%', flexDirection: 'row'}}>
                    <Left style={{paddingLeft:30, paddingTop:15}}>
                            { item.images && item.images.length > 0 ?
                                <ImageWithAuth 
                                    resizeMode="cover" 
                                    style={{ height: 80, width: 80, marginBottom: 15, borderWidth:2, borderColor:'#f7f7f7'}} 
                                    source={{ uri: constants.base + item.images[0].uri + "?last=" + item.images[0].lastModifiedDate }} />
                                :
                                <Image style={{ height: 80, width: 80, marginBottom: 15, borderWidth:2, borderColor:'#f7f7f7'}}  source={require('../../resources/global/default-tree-img.png')} /> 
                            }
                    </Left> 
                    <Body style={{ borderBottomWidth: 0 }}>
                        <Text style={styles.itemTitle}>
                         { _.has(item, 'specie.commonName') ? 
                            item.specie.commonName : strings.noSpecie
                         }</Text>
                        <Text style={styles.itemDateLabel}>{strings.treesValidation.createDate} </Text>
                        { item.readableDate &&
                            <Text style={styles.itemDate}>
                                {item.readableDate}                                
                            </Text>
                        }
                        <Badge style={[styles.badge , {backgroundColor:'#F7AE55'}]}>
                            <Text style={styles.badgeText}>{strings.treesValidation.treeValidate}</Text>
                        </Badge>                            
                    </Body>
                    <Right style={{ borderBottomWidth: 0, paddingRight:30}}>             
                        <Icon name="ios-arrow-forward" style={ [{  fontSize:25, color:"#737373",  height: 25, width: 10, alignSelf:'center'}]}/>               
                    </Right>
                    </TouchableOpacity> 
                </ListItem>
            </View> 
        );
    };
    handleLoadMore = () => {
        if(this.state.moreElements && !this.state.isLoading){
            this.setState( state => ({page: state.page + 1}), () => this.loadTreeValidation());
        }
    };
    emptyList = ({}) => {
        if (!this.state.isLoading)
            return (<View style={{alignItems: 'center', marginTop: 30}}>
                        <Text style={{ color:'#737373'}}>{strings.treesValidation.emptyList}</Text>
                    </View>);
        else 
            return null;
    }
    renderFooter = () => {
        return  ( this.state.isLoading ? 
                    <View style={styles.loader}> 
                        <ActivityIndicator color='#2CA06C' size='large' />
                    </View> : null);
    }
    render() {
        const { goBack } = this.props.navigation;
        return (
            <SafeAreaView style={ styles.wrapper}>                
                <View>
                    { this.state.filter ?
                        this.getFilters()
                        : null
                    }
                    <FlatList
                        extraData={this.state}
                        data={this.state.treesData}
                        keyExtractor={(item, index) => item.id+''}
                        styles= {styles.container}
                        renderItem= {this.renderItem}
                        onEndReached={() => this.handleLoadMore()}
                        onEndReachedThreshold={0.5}
                        ListEmptyComponent={this.emptyList} 
                        ListFooterComponent={this.renderFooter}
                    />
                </View>      
          </SafeAreaView>
        )   
    }
}
const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: 'transparent',
    },  
    container: {
        flex:1,   
    },
    item: {        
        flex: 1, 
    },
    itemTitle: { 
        fontSize:14,
        fontWeight: '700',
        color:"#5b5b5b",
        paddingBottom: 3,
    },
    itemDateLabel: {
        fontSize:12,
        fontWeight: '400',
        color:"#5b5b5b",
        paddingBottom: 3,
    },
    itemDate:{
        fontSize:11,
        fontWeight: '600',
        color:"#5b5b5b",
        paddingBottom: 3,
    },
    itemInvisible: {
        backgroundColor: 'transparent',
    },
    filterBox:{
        height:'100%', 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        position: 'absolute', 
        width: '100%',
        zIndex: 1
    },
    filterBoxContent: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 14,        
    },
    filterBoxContentForm:{
        marginHorizontal: 40,
        marginTop: 20,
        marginBottom: 25,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#737373',
        paddingBottom:10
    },
    filterItem: {
        fontSize: 14,
        fontWeight: '400',
        color: '#737373',
    },
    iconChk:{
        fontSize: 30,
    },
    badge: {
        marginTop:5,
        paddingLeft:5,
        paddingRight:5,
        height:20,
        justifyContent:'center',
        textAlign:'center'
    },
    badgeText:{
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
        paddingLeft:2,
        paddingRight:2
    },
    loader:{
        marginTop: 20,
        alignItems: 'center'
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


export default connect(mapStateToProps, mapDispatchToProps)(TreesValidation);