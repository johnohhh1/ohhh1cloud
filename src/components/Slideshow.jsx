import { useTransition, animated } from '@react-spring/web'
import { useStore } from '../store'
import { transitionStyles, defaultSpringConfig } from '../transitions';
import { useEffect } from 'react'

export function Slideshow() {
  const { currentImage, settings } = useStore()

  // Debug logging
  useEffect(() => {
    console.log('Current transition:', settings.transition)
    console.log('Duration:', settings.transitionDuration)
  }, [settings.transition, settings.transitionDuration])

  // Preload images
  useEffect(() => {
    if (currentImage) {
      const img = new Image()
      img.src = currentImage
    }
  }, [currentImage])

  const transitions = useTransition(currentImage, {
    ...(transitionStyles[settings.transition] || transitionStyles.fade),
    config: { 
      duration: settings.transitionDuration * 1000,
      tension: 200,
      friction: 20
    }
  })

  return (
    <div className="relative w-full h-full overflow-hidden">
      {transitions((style, item) => (
        <animated.div 
          style={{
            ...style,
            position: 'absolute',
            width: '100%',
            height: '100%',
            willChange: 'transform, opacity'
          }}
          className="absolute inset-0"
        >
          <img 
            src={item} 
            className="w-full h-full object-contain"
            alt=""
            draggable={false}
          />
        </animated.div>
      ))}
    </div>
  )
} 