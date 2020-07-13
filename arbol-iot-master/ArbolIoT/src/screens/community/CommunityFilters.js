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
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { Button, Form, ListItem, CheckBox, Body, Icon} from 'native-base';
import strings from '../../config/languages';
import CommunityService from '../../services/community';
import globalStyles from '../../styles/global';

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
class CommunityFilters extends Component {
    static navigationOptions = ({ navigation}) => ({
        title: strings.communityFilters.title,
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
            showUserPublications: false,            
            isLoading: false,
            tags: [],
            tagsData: [],
        }
        this.state.data =  navigation.getParam('data', null);   
    }
    componentDidMount(){
        if(this.state.data){
            this.setState({
                showUserPublications: this.state.data.currentUser,
                tags: this.state.data.tags,
            });
        }
        this._getTags();        
    }
    _getTags(){
        this.setState({isLoading:true});
        CommunityService.getAllCommunityTags()
        .then((res) => res.json())
        .then(res  => { 
            if (res.length > 0 ) {                
                var result = res;
                setTimeout(function(){                 
                    this.setState({
                        tagsData: result,
                        isLoading: false
                    })               
                }.bind(this), 500);
            } else { 
                this.setState({isLoading:false});
            } 
        }).catch((e) => {
            this.setState({isLoading:false});
        });
    }
    filter() { 
        let data = {
            currentUser: this.state.showUserPublications,
            tags: this.state.tags
        }
        let tags = '';
        if(this.state.tags.length > 0){
            for(x=0; x< this.state.tags.length; x++){
                if(x==0){
                    tags = this.state.tags[x].tag;
                } else{
                    tags = tags + 'tags='+this.state.tags[x].tag;   
                }
                if(x != this.state.tags.length-1){
                    tags = tags + '&';
                }
            }
            
        }
        let filters = {             
            currentUser: this.state.showUserPublications,            
            page: 0,
            size:10,
            tags: tags
        };
        this.props.navigation.navigate('Community',{ filters, data,  mode:'view' });
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
    cleanForm(){
        this.setState({
            showUserPublications: false,            
            tags: [],
        }, ()=>{this.filter()});
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
    render() {
        return ( 
            <SafeAreaView>
                <ScrollView>                    
                    <View>
                        <Form style={{marginHorizontal:40, marginTop: 20,}}>
                            <ListItem style={{borderBottomWidth:0, marginLeft: 0,}}>
                                <TouchableOpacity style={{ flexDirection:'row'}} onPress={ () => this.setState({ showUserPublications: !this.state.showUserPublications})}>
                                    <CheckBox color={'#41B17C'} checked={this.state.showUserPublications} onPress={ () => this.setState({ showUserPublications: !this.state.showUserPublications})}/>
                                    <Body>
                                        <Text style={{marginLeft:8, color:'#737373'}}>{strings.communityFilters.showUserPublications}</Text>
                                    </Body>
                                </TouchableOpacity>
                            </ListItem>
                        </Form>
                        
                        <View style={{marginHorizontal:40, marginTop:40, }}>
                            <View style={{marginBottom:20,}}>
                                <View style={{flexDirection:'row'}}>
                                    <Image source={require('../../resources/global/icon-tag.png')} style={{width: 24, height: 19, resizeMode:'contain' }}/>
                                    <Text style={styles.tagsText} >{strings.communityFilters.byTag}</Text>                                
                                </View>                            
                            </View>
                            <View style={{borderColor:'#cfcecf', borderWidth: 1, }}>
                                <View style={{ margin: 10, }}>
                                    {   this.state.isLoading ?
                                        <View>
                                            <ActivityIndicator size='large' color={ colors.mainColor } />
                                        </View>                                        
                                        :                                    
                                        <FlatList
                                            extraData={this.state}
                                            data={formatData(this.state.tagsData, numColumns)}
                                            keyExtractor={(item, index) => item.id+''}
                                            styles= {styles.container}
                                            numColumns= {numColumns}
                                            renderItem= {this.renderItem}
                                        />
                                    }
                                </View>
                            </View>
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button block success style={ styles.searchButton } onPress={ () => this.filter() } >
                                <Text style= { styles.search }>{ strings.communityFilters.search }</Text>
                            </Button>
                            <Button block transparent style={{marginTop:20}} onPress={() => this.cleanForm()}>
                                <Text style= {{ color:'#EA585E', fontSize:14, fontWeight: '500' }} >{ strings.communityFilters.cleanForm }</Text>
                            </Button>
                        </View>
                        
                    </View>
                </ScrollView>  
            </SafeAreaView>
        )  
    }
}

const styles = StyleSheet.create({    
    container: {
        flex:1,
        marginVertical: 20,
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
        marginTop: 40,
        marginBottom: 20,  
    },
    searchButton: {
        backgroundColor:'#41B07C', 
        borderRadius: 5,
    },
    search: {
        fontWeight:'bold',
        color: 'white',
    },
});
const mapStateToProps = (state) => {
    return {
        loggedInStatus: state.loggedInStatus
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(CommunityFilters);