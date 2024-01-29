import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  PanResponderInstance,
  StatusBar,
  TouchableOpacity,
  Text,
  Modal,
  GestureResponderHandlers,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";

import { LightboxProps, IOrigin, ISpringConfig } from "./Lightbox";
import { useGesture, IGestureProps, useNextTick } from "./hooks";

type OmitedLightboxProps = Omit<
  LightboxProps,
  "style" | "disabled" | "underlayColor" | "activeProps" | "renderContent" | "renderItem"
>;

export interface LightboxOverlayProps
  extends OmitedLightboxProps,
  IGestureProps {
  isOpen?: boolean;
  origin?: IOrigin;
  springConfig?: ISpringConfig;
}

const isIOS = Platform.OS === "ios";
const getDefaultTarget = () => ({ x: 0, y: 0, opacity: 1 });

const styles = StyleSheet.create({
  background: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  open: {
    position: "absolute",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // Android pan handlers crash without this declaration:
    backgroundColor: "transparent",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "transparent",
  },
  closeButton: {
    fontSize: 35,
    color: "white",
    lineHeight: 60,
    width: 70,
    textAlign: "center",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowRadius: 1.5,
    shadowColor: "black",
    shadowOpacity: 0.8,
  },
});

const LightboxOverlay: React.FC<LightboxOverlayProps> = ({
  useNativeDriver = false,
  dragDismissThreshold,
  springConfig,
  isOpen,
  onClose,
  willClose,
  didOpen,
  swipeToDismiss,
  origin,
  backgroundColor,
  renderHeader,
  modalProps,
  children,
  doubleTapZoomEnabled,
  doubleTapGapTimer,
  doubleTapCallback,
  doubleTapZoomToCenter,
  doubleTapMaxZoom,
  doubleTapZoomStep,
  doubleTapInitialScale,
  doubleTapAnimationDuration,
  longPressGapTimer,
  longPressCallback,
}) => {
  const _panResponder = useRef<PanResponderInstance>();
  const pan = useRef(new Animated.Value(0));
  const openVal = useRef(new Animated.Value(0));
  const handlers = useRef<GestureResponderHandlers>();

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [gesture, animations] = useGesture({
    useNativeDriver,
    doubleTapZoomEnabled,
    doubleTapGapTimer,
    doubleTapCallback,
    doubleTapZoomToCenter,
    doubleTapMaxZoom,
    doubleTapZoomStep,
    doubleTapInitialScale,
    doubleTapAnimationDuration,
    longPressGapTimer,
    longPressCallback,
  });

  const [{ isAnimating, isPanning, target }, setState] = useState({
    isAnimating: false,
    isPanning: false,
    target: getDefaultTarget(),
  });

  const handleCloseNextTick = useNextTick(onClose!);

  const close = () => {
    willClose!();
    if (isIOS) {
      StatusBar.setHidden(false, "fade");
    }

    gesture.reset();

    setState((s) => ({
      ...s,
      isAnimating: true,
    }));

    Animated.spring(openVal.current, {
      toValue: 0,
      ...springConfig,
      useNativeDriver,
    }).start(({ finished }) => {
      if (finished) {
        setState((s) => ({ ...s, isAnimating: false }));
        handleCloseNextTick();
      }
    });
  };

  const open = () => {
    if (isIOS) {
      StatusBar.setHidden(true, "fade");
    }

    pan.current.setValue(0);

    setState((s) => ({
      ...s,
      isAnimating: true,
      target: getDefaultTarget(),
    }));

    Animated.spring(openVal.current, {
      toValue: 1,
      ...springConfig,
      useNativeDriver,
    }).start(({ finished }) => {
      if (finished) {
        setState((s) => ({ ...s, isAnimating: false }));
        didOpen!();
      }
    });
  };

  const initPanResponder = () => {
    _panResponder.current = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: () => !isAnimating,
      onStartShouldSetPanResponderCapture: () => !isAnimating,
      onMoveShouldSetPanResponder: () => !isAnimating,
      onMoveShouldSetPanResponderCapture: () => !isAnimating,

      onPanResponderGrant: (e, gestureState) => {
        gesture.init();

        pan.current.setValue(0);
        setState((s) => ({ ...s, isPanning: true }));

        gesture.onLongPress(e, gestureState);
        gesture.onDoubleTap(e, gestureState);
      },

      onPanResponderMove: Animated.event([null, { dy: pan.current }], {
        useNativeDriver,
      }),
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        gesture.release();
        if (gesture.isDoubleTaped) return;
        if (gesture.isLongPressed) return;
        if (Math.abs(gestureState.dy) > dragDismissThreshold!) {
          setState((s) => ({
            ...s,
            isPanning: false,
            target: {
              y: gestureState.dy,
              x: gestureState.dx,
              opacity: 1 - Math.abs(gestureState.dy / windowHeight),
            },
          }));
          close();
        } else {
          Animated.spring(pan.current, {
            toValue: 0,
            ...springConfig,
            useNativeDriver,
          }).start(({ finished }) => {
            finished && setState((s) => ({ ...s, isPanning: false }));
          });
        }
      },
    });
  };

  useEffect(() => {
    initPanResponder();
  }, [useNativeDriver, isAnimating]);

  useEffect(() => {
    isOpen && open();
  }, [isOpen]);

  useEffect(() => {
    if (_panResponder.current && swipeToDismiss) {
      handlers.current = _panResponder.current.panHandlers;
    }
  }, [swipeToDismiss, _panResponder.current]);

  const lightboxOpacityStyle = {
    opacity: openVal.current.interpolate({
      inputRange: [0, 1],
      outputRange: [0, target.opacity],
    }),
  };

  let dragStyle;
  if (isPanning) {
    dragStyle = {
      top: pan.current,
    };
    lightboxOpacityStyle.opacity = pan.current.interpolate({
      inputRange: [-windowHeight, 0, windowHeight],
      outputRange: [0, 1, 0],
    });
  }

  const openStyle = [
    styles.open,
    {
      left: openVal.current.interpolate({
        inputRange: [0, 1],
        outputRange: [origin!.x, target.x],
      }),
      top: openVal.current.interpolate({
        inputRange: [0, 1],
        outputRange: [origin!.y, target.y],
      }),
      width: openVal.current.interpolate({
        inputRange: [0, 1],
        outputRange: [origin!.width, windowWidth],
      }),
      height: openVal.current.interpolate({
        inputRange: [0, 1],
        outputRange: [origin!.height, windowHeight],
      }),
    },
  ];

  const background = (
    <Animated.View
      style={[styles.background, { width: windowWidth, height: windowHeight, backgroundColor }, lightboxOpacityStyle]}
    ></Animated.View>
  );

  const header = (
    <Animated.View style={[styles.header, { width: windowWidth }, lightboxOpacityStyle]}>
      {renderHeader ? (
        renderHeader(close)
      ) : (
        <SafeAreaView>
          <TouchableOpacity onPress={close}>
            <Text style={styles.closeButton}>×</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </Animated.View>
  );

  const content = (
    <Animated.View
      style={[openStyle, dragStyle, animations as any]}
      {...handlers.current}
    >
      {children as any}
    </Animated.View>
  );

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      onRequestClose={close}
      supportedOrientations={['portrait', 'landscape']}
      {...modalProps}
    >
      {background}
      {content}
      {header}
    </Modal>
  );
};

export default LightboxOverlay;
