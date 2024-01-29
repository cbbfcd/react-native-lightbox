import React from "react";
import { StyleProp, ViewStyle, ModalProps } from "react-native";
import { IGestureProps } from "./hooks";
export declare type Func<T, R> = (...args: T[]) => R;
export interface IOrigin {
    width: number;
    height: number;
    x: number;
    y: number;
}
export interface ISpringConfig {
    tension: number;
    friction: number;
}
export interface LightboxProps<T = any> extends IGestureProps {
    activeProps?: Record<string, T>;
    renderContent?: Func<T, JSX.Element>;
    renderHeader?: Func<T, JSX.Element>;
    renderItem?: Func<T, JSX.Element>;
    didOpen?: Func<T, void>;
    onOpen?: Func<T, void>;
    willClose?: Func<T, void>;
    onClose?: Func<T, void>;
    onPress?: Func<T, void>;
    onLongPress?: Func<T, void>;
    onLayout?: Func<T, void>;
    swipeToDismiss?: boolean;
    disabled?: boolean;
    springConfig?: ISpringConfig;
    style?: StyleProp<ViewStyle>;
    underlayColor?: string;
    backgroundColor?: string;
    useNativeDriver?: boolean;
    dragDismissThreshold?: number;
    modalProps?: ModalProps;
    openOnLongPress?: boolean;
}
declare const Lightbox: React.FC<LightboxProps>;
export default Lightbox;
