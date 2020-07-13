import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { Col, Row } from "react-native-easy-grid";
import {
    StyleSheet,
    Text,
    SafeAreaView,
    Image,
    TouchableOpacity,
    View,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { Badge, ListItem, Body, Right, Icon, Card, CardItem } from 'native-base';
import strings from '../../config/languages';
import AdoptionService from '../../services/adoptions';
import constants from '../../config/constants';
import ImageWithAuth from '../../components/image';
import globalStyles from '../../styles/global';
import GeneralHelpers from '../../helpers/GeneralHelpers';

const numColumns = 2;
const formatData = (data, numColumns) => {
    const numberOfFullRows = Math.floor(data.length / numColumns);
    let numberOfElementsLastRow = data.length - (numberOfFullRows * numColumns);
    while (numberOfElementsLastRow !== numColumns && numberOfElementsLastRow !== 0) {
      data.push({ key: `blank-${numberOfElementsLastRow}`, empty: true });
      data[data.length - 2]['last'] = true;
      numberOfElementsLastRow++;
    }
    return data;
};
class UserTreeList extends Component {        
    constructor(props) {
        super(props)
        this.state = {
            totalTreesCounter: 0,
            refreshing: false,
            filter: false,
            query: [
                {type:'name', status: false },
                {type:'date', status: true },],
            isLoading: true,
            page: 0,
            size: 10,
            sort: 'id,desc',            
            treesData: [],
            moreElements: true,
            perms: {
                treeAoption: {
                    interact: { status:true }
                }
            },
        }  
    }
    static navigationOptions =  ({ navigation }) => {
        const { params = {} } = navigation.state;
        return {
            title: strings.userTrees.userTreesList.title,
            headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
                            <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
                        </TouchableOpacity>,                        
            headerRight: <TouchableOpacity style={globalStyles.headerRight}  onPress={() => params.filters()} >
                            <Image source={require('../../resources/global/icon-filter.png')} style= {{height:18, width: 17}}/>
                            <Text style= {globalStyles.headerRightSmallLabel}>{strings.userTrees.userTreesList.filter}</Text>
                        </TouchableOpacity>,
            headerTintColor: colors.white,
            headerStyle: globalStyles.headerStyle,
            headerTitleStyle: globalStyles.headerTitleStyle,
        };    
    };
    componentDidMount() {
        this.loadAdoptions();
        this.props.navigation.setParams({
          filters: this.showHandler
        });
        this.subs = [ 
            this.props.navigation.addListener ('willFocus', () => { 
                if (!this.state.isLoading) {
                    this.setState({
                        page: 0,
                        treesData:[],
                        moreElements: true,
                    },() => this.loadAdoptions());
                }
            }),
        ];
        this.permsMaping();
    }
    permsMaping() {
        this.state.perms.treeAoption.interact = GeneralHelpers.hasPermission('treeAoption','interact').remote == true ?
          GeneralHelpers.hasPermission('treeAoption','interact') :
          this.state.perms.treeAoption.interact;
    } 
    componentWillUnmount() {
        this.subs.forEach((sub) => {
          sub.remove();
        });
    }    
    loadAdoptions=() =>{
        let count= 0;
        this.setState({ isLoading: true });        
        AdoptionService.getCurrentUserTrees({ page: this.state.page, size: this.state.size, sort:this.state.sort })
        .then((res) => {
            if(res.status==200 || res.status == 201){
                count = res.headers.map['x-total-count'];
                let result = JSON.parse(res._bodyText);
                if(result.length > 0){
                    this.setState({
                        treesData: this.state.page === 0 ? result : [...this.state.treesData, ...result], 
                        isLoading: false, 
                        refreshing: false,
                        totalTreesCounter: count,                        
                    });
                } else{
                    this.setState({ moreElements: false, isLoading: false, refreshing: false });
                }
            }         
        })
        .catch((e) => {
            this.setState({ isLoading: false, refreshing: false });
        });
    }
    showHandler = () => {
        this.setState({filter: !this.state.filter});        
    }; 
    getPercent(status){
        if(status != undefined){
            let total = 0;
            let dif = 0;
            let porcent= 0;
            total = status.treeWateringPassedDays + status.treeWateringRemainingDays;
            dif= status.treeWateringRemainingDays - status.treeWateringPassedDays;
            porcent = ((100 / total) * dif );
            return parseFloat(porcent.toFixed(2));
        }
        return 0;
    }
    getWaterStatus(status){ 
        let careDays = this.getPercent(status);
        if(careDays < 0 ){
            return (<View style={styles.wateringRow}>
                        <Image style={styles.waternigIcon} source={require('../../resources/user-trees/icon-empty.png')} />
                        <Text style={styles.waternigLabel} >{ strings.userTrees.userTreesList.careToday }</Text>
                    </View>);
        } else if(careDays >= 0 && careDays <= 20){
            return (<View style={styles.wateringRow}>
                        <Image style={styles.waternigIcon} source={require('../../resources/user-trees/icon-empty.png')} />
                        <Text style={styles.waternigLabel} >{[strings.userTrees.userTreesList.waterIn, status.treeWateringRemainingDays, strings.userTrees.userTreesList.day]} </Text>
                    </View>);
        } else {
            if (careDays >= 20 && careDays <= 80 ) {
                return (<View style={styles.wateringRow} >
                            <Image style={styles.waternigIcon} source={require('../../resources/user-trees/icon-mid.png')} />
                            <Text style={styles.waternigLabel}>{[strings.userTrees.userTreesList.waterIn, status.treeWateringRemainingDays, strings.userTrees.userTreesList.days ]} </Text>
                        </View>);
            }  else{
               if (careDays >= 80 ) {
                    return (<View style={styles.wateringRow}>
                                <Image style={styles.waternigIcon} source={require('../../resources/user-trees/icon-full.png')} />
                                <Text style={styles.waternigLabel}>{[strings.userTrees.userTreesList.waterIn, status.treeWateringRemainingDays, strings.userTrees.userTreesList.days]} </Text>
                            </View>);
                }  
            }
        }
    }
    getFilters(){
        return (            
            <View style={styles.filterBox}>
                <View style={styles.filterBoxContent}>
                    <View style={styles.filterBoxContentForm}>
                        <Text style={styles.filterLabel}>{strings.userTrees.userTreesList.filterLabel}</Text>                                                
                            <ListItem icon>                            
                                <Body>
                                    <TouchableOpacity onPress={ () => {this.setFilterName()} }>
                                        <Text style={styles.filterItem}>{strings.userTrees.userTreesList.filterItemName}</Text>
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
                                    <TouchableOpacity onPress={ () => {this.setFilterDate()} }>
                                        <Text style={styles.filterItem}>{strings.userTrees.userTreesList.filterItemDate}</Text>
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
    setFilterName(){
        this.state.query[0].status=true;
        this.state.query[1].status=false;
        this.setState({
            sort: 'tree.specie.genus,asc',
            page: 0,
        }, () => this.loadAdoptions());
          
        this.showHandler();
    }
    setFilterDate(){
        this.state.query[1].status=true;
        this.state.query[0].status=false;
        this.setState({
            sort: 'id,desc',
            page: 0,
        }, () => this.loadAdoptions());          
        this.showHandler();
    }
    renderFooter = () => {
        return  ( this.state.isLoading ? 
                    <View> 
                        <ActivityIndicator color={colors.mainColor}  size='large' />
                    </View> : null);
    }
    handleRefresh = () => {
        this.setState({ isLoading:true, moreElements: true});
        this.setState( state => ({page: 0 }), () => this.loadAdoptions());
    }
    handleLoadMore = () => {
        if(this.state.moreElements && !this.state.isLoading){
            this.setState({page: this.state.page + 1},()=>{ this.loadAdoptions(); })
        }
    };
    header = () =>{
        return (                
            <View style={ styles.localHeader }>
                <Row style={styles.localRowHeader}>
                    <Col size={20} style={{paddingRight:10 }}>
                        <Image source={require('../../resources/global/icon-user-trees.png')} style={styles.localHeaderIcon}/>
                    </Col>
                    <Col size={80}>
                        <Text style={[ globalStyles.text, { fontWeight: '400'}]}> 
                            {strings.userTrees.userTreesList.messageHeaderFrag1} 
                            <Text style={[ globalStyles.text, { fontWeight: '700'}]}> 
                                { this.state.totalTreesCounter} 
                            </Text> {strings.userTrees.userTreesList.messageHeaderFrag2}
                        </Text>
                    </Col>
                </Row>
            </View>
        )
    }
    renderItem = ({ item, key }) => {
        if (item.empty === true) {
          return <View key={key}></View>;
        }
        return (
            <View key={key} style={[{ flex:1, marginHorizontal:5, marginVertical:5}, item.last ? { marginLeft:'26%', marginEnd:'26%'} :{}]}>
                <Card key={item.id} style={{ flex:1}}>
                    <TouchableOpacity onPress={() => this.props.navigation.navigate('UserTreeView',{item})} >
                        <CardItem >
                            <Body style={{alignItems:'center', justifyContent:'center', marginBottom: 10}}>
                                <View style={{alignItems:'center', paddingTop: 20,}}>
                                    {   item.tree.images != undefined &&
                                        item.tree.images.length > 0 && 
                                        item.tree.images[0].id != undefined ?
                                        <ImageWithAuth 
                                            resizeMode="cover" 
                                            style={ [ globalStyles.imageRound80x ] }
                                            source={{ uri: constants.base + item.tree.images[0].uri + "?last=" + item.tree.images[0].lastModifiedDate }} />
                                        :
                                        <Image source={require('../../resources/global/default-tree-img.png')}  style={ [ {marginLeft:10}, globalStyles.imageRound80x ]}/>
                                    }
                                </View>
                                { item.tree &&  item.tree.specie ?
                                    <View style={{marginTop:5}}>
                                        <Text style={[ globalStyles.text, styles.itemText]}>{[item.tree.specie.commonName]}</Text>                           
                                        <Text style={[ globalStyles.text, styles.itemTextSmall,{ lineHeight:18, marginTop:2}]}>{[item.tree.specie.genus]}</Text>
                                    </View> : 
                                    <View style={{marginTop:5}}>
                                        <Text style={[ globalStyles.text, styles.itemText]}>{ strings.userTrees.userTreesList.noLabel }</Text>                           
                                    </View>
                                }
                                
                                <View style={{marginTop:5, marginBottom:5}}>
                                    <Badge style={[ globalStyles.badgeSuccess ]}>
                                        <Text style={ globalStyles.badgeText }> {strings.userTrees.userTreesList.type} </Text>
                                    </Badge>
                                </View>
                                { item.status &&
                                    <View>{this.getWaterStatus(item.status)}</View>
                                }
                            </Body>
                        </CardItem>
                    </TouchableOpacity>
                </Card>
            </View>
        );
    };
    emptyList = ({}) => {
        if (this.state.perms.treeAoption.interact.status == false) {
            return (<View style={{alignItems: 'center', marginTop: 30}}>
                <Text style={{color:'#5b5b5b'}}>{this.state.perms.treeAoption.interact.desc }</Text>
            </View>);
        }
        if (this.state.isLoading == false)
            return (<View style={{alignItems: 'center', marginTop: 30}}>
                        <Text style={{color:'#5b5b5b'}}>{strings.userTrees.userTreesList.emptyList}</Text>
                    </View>);
        else 
            return null;
    }
    render() {
        return ( 
            <SafeAreaView style={styles.wrapper}>               
                { this.state.filter ?
                    this.getFilters()
                    : null
                }
                <FlatList
                    extraData={this.state}
                    data={formatData(this.state.treesData, numColumns)}
                    numColumns= {numColumns}
                    styles= {styles.container}                                
                    keyExtractor={(item, index) => item.id+''}
                    ListHeaderComponent={this.header} 
                    ListHeaderComponentStyle={{ marginBottom:20}}                       
                    renderItem= { this.renderItem }
                    ListFooterComponent={this.renderFooter}
                    onRefresh= {() => this.handleRefresh() }
                    onEndReached={() => this.handleLoadMore()}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={this.emptyList} 
                    columnWrapperStyle={{marginHorizontal:20}}
                    refreshing = {this.state.refreshing}                                                            
                    rowWrapperStyle={{marginHorizontal:20}}
                />                
            </SafeAreaView>
        )  
    }
}
const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    localHeader: {
        backgroundColor:'#f4f4f6', 
        borderBottomColor: '#D8D8D8', 
        borderBottomWidth: 0.8
    },
    localRowHeader:{
        paddingTop: 10, 
        paddingBottom: 10, 
        marginBottom:20,
        marginTop:20,
        marginLeft: '20%',
        marginRight: '20%',
    },
    localHeaderIcon:{
        height: 42,
        width: '100%',
        resizeMode: 'contain',
        paddingLeft: 15,
    },
    container: {
        flex: 1,
        marginVertical: 20,
        paddingLeft:20,
        paddingRight:20,
        marginLeft: 20,
    },
    itemText: {
        fontSize: 16,
        fontWeight: '700',
        paddingBottom: 0,
        textAlign: 'center', 
        paddingTop:5       
    },
    itemTextSmall:{
        fontSize: 12,
        fontWeight: '300',
        paddingBottom: 4,
        textAlign: 'center',
       
    },
    waternigLabel:{
        fontSize: 12,
        color: '#1b86c8',
        fontWeight: '500',
    },
    waternigIcon:{
        height: 12,
        width: 7,
        marginRight: 5,
        resizeMode:'contain'
    },
    wateringRow:{
        flexDirection: 'row',
        marginTop: 5,
        alignSelf: 'center',
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
    }
});
 
const mapStateToProps = (state) => {
    return {
        idToken: state.user.id_token,
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(UserTreeList);