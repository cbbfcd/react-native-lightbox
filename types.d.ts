declare module 'react-native-lightbox-v2' {
  import { Animated, StyleProp, ViewStyle } from 'react-native'

  interface LightboxProps {
    activeProps?: any
    renderHeader?: (close: () => void) => JSX.Element
    renderContent?: () => JSX.Element
    renderItem?: (open: () => void) => JSX.Element
    underlayColor?: string
    backgroundColor?: string
    didOpen?: () => void
    onOpen?: () => void
    willClose?: () => void
    onClose?: () => void
    springConfig?: Animated.SpringAnimationConfig['friction' | 'tension']
    swipeToDismiss?: boolean
    style?: StyleProp<ViewStyle>
    onLongPress?: (...args: any) => void
  }

  const Lightbox: React.FC<LightboxProps>

  export default Lightbox
}
