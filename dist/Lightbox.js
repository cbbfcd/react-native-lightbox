import React, { useRef, useState, cloneElement, Children, isValidElement, } from "react";
import { Animated, TouchableHighlight, View, } from "react-native";
import LightboxOverlay from "./LightboxOverlay";
import { useNextTick } from "./hooks";
const noop = () => { };
const Lightbox = ({ activeProps, swipeToDismiss = true, useNativeDriver = false, disabled = false, renderContent, renderHeader, renderItem, didOpen = noop, onOpen = noop, willClose = noop, onClose = noop, onPress = noop, onLongPress = noop, onLayout = noop, springConfig = { tension: 30, friction: 7 }, backgroundColor = "black", underlayColor, style, dragDismissThreshold = 150, children, modalProps = {}, openOnLongPress = false, ...rest }) => {
    const layoutOpacity = useRef(new Animated.Value(1));
    const _root = useRef(null);
    const closeNextTick = useNextTick(onClose);
    const openNextTick = useNextTick(() => {
        _root.current && layoutOpacity.current.setValue(0);
    });
    const [{ isOpen, origin }, setState] = useState({
        isOpen: false,
        origin: { x: 0, y: 0, width: 0, height: 0 },
    });
    const getContent = () => {
        if (renderContent)
            return renderContent();
        else if (activeProps && isValidElement(children))
            return cloneElement(Children.only(children), activeProps);
        return children;
    };
    const handleOnClose = () => {
        layoutOpacity.current.setValue(1);
        setState((s) => ({ ...s, isOpen: false }));
        closeNextTick();
    };
    const wrapMeasureWithCallback = (callback) => {
        _root.current.measure((ox, oy, width, height, px, py) => {
            callback({ width, height, x: px, y: py });
        });
    };
    const open = () => {
        if (!_root.current)
            return;
        onOpen();
        wrapMeasureWithCallback((newOrigin) => {
            setState((s) => ({
                ...s,
                isOpen: true,
                origin: { ...newOrigin },
            }));
            openNextTick();
        });
    };
    const getOverlayProps = () => ({
        isOpen,
        origin,
        renderHeader,
        swipeToDismiss,
        springConfig,
        backgroundColor,
        children: getContent(),
        didOpen,
        willClose,
        onClose: handleOnClose,
        useNativeDriver,
        dragDismissThreshold,
        modalProps,
        ...rest,
    });
    const _renderItem = () => {
        if (renderItem) {
            return renderItem(open);
        }
        return (<TouchableHighlight underlayColor={underlayColor} onPress={openOnLongPress ? onPress : open} onLongPress={openOnLongPress ? open : onLongPress} disabled={disabled}>
          {children}
      </TouchableHighlight>);
    };
    return (<View ref={_root} style={style} onLayout={onLayout}>
      <Animated.View style={{ opacity: layoutOpacity.current }}>
        {_renderItem()}
      </Animated.View>
      {disabled ? null : <LightboxOverlay {...getOverlayProps()}/>}
    </View>);
};
export default Lightbox;
