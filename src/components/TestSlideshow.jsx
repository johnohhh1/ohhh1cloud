import { useTransition, animated } from '@react-spring/web'
import { useStore } from '../store'

export function TestSlideshow() {
  const { currentImage } = useStore()

  console.log('Current image:', currentImage) // Debug log

  const transitions = useTransition(currentImage, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 1000 }, // 1 second transition
    exitBeforeEnter: true
  })

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {transitions((style, item) => 
        item ? ( // Only render if we have an image
          <animated.div style={{
            ...style,
            position: 'absolute',
            width: '100%',
            height: '100%'
          }}>
            <img 
              src={item} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
              alt=""
            />
          </animated.div>
        ) : null
      )}
    </div>
  )
} 