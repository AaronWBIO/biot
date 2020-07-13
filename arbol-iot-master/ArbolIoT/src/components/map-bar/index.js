import { StyleSheet, View, TouchableHighlight, Dimensions, Animated, Text, Image } from 'react-native';
import Svg, { Circle, LinearGradient, RadialGradient, Stop, Defs, Path } from 'react-native-svg';
import React, { Component } from 'react';

const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const AnimatedPath = Animated.createAnimatedComponent(Path)

class MapBarItem extends Component {
    constructor(props) { super(props); }
    render() {
        return (
            null
        );
    }
}
export default class MapBar extends Component{
    constructor(props) {
        super(props);
        this.state = {
            selectedIndex: 1,
            defaultPage: 1,
            navFontSize: 12,
            navTextColor: "rgb(148, 148, 148)",
            navTextColorSelected: 'rgb(51, 163, 244)',
            circleRadius: new Animated.Value(546),
            pathD: new Animated.Value(357),
            pathX: "357",
            pathY: "675",
            pathA: "689",
            pathB: "706",
            showIcon: true
        }
        this.state.circleRadius.addListener( (circleRadius) => {
            this._myCircle.setNativeProps({ cx: circleRadius.value.toString() });
        });
        this.state.pathD.addListener( a => {
            this.setState({
                pathX: a.value.toString(),
                pathY: (318 + parseInt(a.value)).toString(),
                pathA: (330 + parseInt(a.value)).toString(),
                pathB: (350 + parseInt(a.value)).toString()
            })
        })
    }
    render() {
        const {
            children,
        } = this.props;
        const {
            selectedIndex,
            showIcon
        } = this.state;
        return(
            <View 
                style={[styles.container, this.props.style]}>
                {children[selectedIndex]}
                 <View style={[styles.content]}>
                    <View style={styles.subContent}>
                        {
                            React.Children.map(children,  (child,i) => {
                            const imgSrc = selectedIndex == i && showIcon ?
                            <View style={[styles.circle,{justifyContent:'center', marginTop:-5}]}>
                                <Image
                                    resizeMode='contain'
                                    style={styles.navImage}
                                    source={child.props.icon}
                                    style={{ width:child.props.width, height:child.props.height, alignSelf:'center', resizeMode:'stretch', marginLeft:5 }}
                                />
                                <Text style={{ fontSize:9, color:'#333', paddingTop:5 }}>{ child.props.title }</Text>
                            </View>
                            :
                            <View 
                            opacity={child.props.opacity != undefined ? child.props.opacity : 1}
                            style={{
                                flex:1,
                                alignItems:'center',
                                justifyContent:'center',
                                paddingTop:40,
                                alignSelf: "center",
                                flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                            }}>
                                <Image
                                    resizeMode='contain'
                                    style={styles.navImage}
                                    source={child.props.icon}
                                    style={{ width:child.props.width, height:child.props.height }}
                                />
                                <Text style={{ flex:1, fontSize:9, paddingTop:7, color:'#333', alignSelf: "center", minHeight:20, textAlign:'center' }}>{ child.props.title }</Text>
                            </View>
                            ;
                            return (<View style={styles.navItem} >{ child.props.onPress != undefined ?
                                    <TouchableHighlight
                                        key={i}
                                        underlayColor={"transparent"}
                                        style={styles.navItem}
                                        onPress={ child.props.onPress }
                                    >
                                        {imgSrc}
                                    </TouchableHighlight> :
                                    <View
                                    key={i}
                                    underlayColor={"transparent"}
                                    opacity={0.4}
                                    style={styles.navItem}
                                >
                                    {imgSrc}
                                </View>
                                    }</View>
                                );
                            })
                        }
                    </View>
                    <Svg             
                    version="1.1" id="bottom-bar" x="0px" y="0px" width='100%' height="100" viewBox="0 0 1092 260" space="preserve">
                        <Defs>
                            <LinearGradient id="grad" x1="0" y1="10" x2="0" y2="170">
                                <Stop offset="0" stopColor="#000000" stopOpacity="0.1" />
                                <Stop offset="1" stopColor="#000000" stopOpacity="0.2" />
                            </LinearGradient>
                            <RadialGradient id="grad-2" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%" gradientUnits="userSpaceOnUse">
                                <Stop
                                    offset="100%"
                                    stopColor="#ccc"
                                    stopOpacity="0.2"
                                />
                            </RadialGradient>
                        </Defs>
                        <AnimatedPath 
                            y="10" fill="url(#grad)"
                            d={ `M30,60h${this.state.pathX}.3c17.2,0,31,14.4,30,31.6c-0.2,2.7-0.3,5.5-0.3,8.2c0,71.2,58.1,129.6,129.4,130c72.1,0.3,130.6-58,130.6-130c0-2.7-0.1-5.4-0.2-8.1C${this.state.pathY}.7,74.5,${this.state.pathA}.5,60,${this.state.pathB}.7,60H1062c16.6,0,30,13.4,30,30v94c0,42-34,76-76,76H76c-42,0-76-34-76-76V90C0,73.4,13.4,60,30,60z` }/>
                        <AnimatedPath 
                            y="16"
                            fill="url(#grad)"
                            d={ `M30,60h${this.state.pathX}.3c17.2,0,31,14.4,30,31.6c-0.2,2.7-0.3,5.5-0.3,8.2c0,71.2,58.1,129.6,129.4,130c72.1,0.3,130.6-58,130.6-130c0-2.7-0.1-5.4-0.2-8.1C${this.state.pathY}.7,74.5,${this.state.pathA}.5,60,${this.state.pathB}.7,60H1062c16.6,0,30,13.4,30,30v94c0,42-34,76-76,76H76c-42,0-76-34-76-76V90C0,73.4,13.4,60,30,60z` }/>
                        <AnimatedPath 
                            y="15"
                            fill="#ffffff"
                            d={ `M30,60h${this.state.pathX}.3c17.2,0,31,14.4,30,31.6c-0.2,2.7-0.3,5.5-0.3,8.2c0,71.2,58.1,129.6,129.4,130c72.1,0.3,130.6-58,130.6-130c0-2.7-0.1-5.4-0.2-8.1C${this.state.pathY}.7,74.5,${this.state.pathA}.5,60,${this.state.pathB}.7,60H1062c16.6,0,30,13.4,30,30v94c0,42-34,76-76,76H76c-42,0-76-34-76-76V90C0,73.4,13.4,60,30,60z` }/>
           
                        <AnimatedCircle ref={ ref => this._myCircle = ref } fill="url(#grad-2)" cx="546" cy="100" r="105"/>
                        <AnimatedCircle ref={ ref => this._myCircle = ref } fill="#ffffff" cx="546" cy="100" r="100"  />             
                    </Svg>
                </View>
            </View>
        );
    }
    update(index) {

        
    }
}
MapBar.Item = MapBarItem;
const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        backgroundColor: 'transparent',
        flex: 1,
    },
    content: {
        flexDirection:"column",
        zIndex: 0,
        width: (Dimensions.get('window').width - 20),
        marginBottom: 10,
        left: 10,
        right: 10,
        elevation:4,
        shadowOffset: { width: 5, height: 5 },
        shadowColor: "grey",
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    subContent: {
        flexDirection: 'row',
        marginBottom: 8,
        zIndex: 1,
        position: 'absolute',
        bottom: 5,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        zIndex: 0,
        justifyContent: "center", alignItems: "center",
        height:80
    },
    navImage: {
        backgroundColor:'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        bottom: 5,
        elevation:4,
    }
});