// src/animations/transitions.js
// Transitions that actually work with react-spring's useTransition

export const transitionStyles = {
  fade: {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  },
  
  'slide-left': {
    from: { opacity: 0, transform: 'translate3d(100%,0,0)' },
    enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
    leave: { opacity: 0, transform: 'translate3d(-100%,0,0)' },
  },
  
  'slide-right': {
    from: { opacity: 0, transform: 'translate3d(-100%,0,0)' },
    enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
    leave: { opacity: 0, transform: 'translate3d(100%,0,0)' },
  },
  
  'slide-up': {
    from: { opacity: 0, transform: 'translate3d(0,100%,0)' },
    enter: { opacity: 1, transform: 'translate3d(0,0%,0)' },
    leave: { opacity: 0, transform: 'translate3d(0,-100%,0)' },
  },
  
  'slide-down': {
    from: { opacity: 0, transform: 'translate3d(0,-100%,0)' },
    enter: { opacity: 1, transform: 'translate3d(0,0%,0)' },
    leave: { opacity: 0, transform: 'translate3d(0,100%,0)' },
  },
  
  'zoom-in': {
    from: { opacity: 0, transform: 'scale(0.5)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(1.5)' },
  },
  
  'zoom-out': {
    from: { opacity: 0, transform: 'scale(1.5)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(0.5)' },
  },
  
  'rotate-in': {
    from: { opacity: 0, transform: 'scale(0.5) rotate(-180deg)' },
    enter: { opacity: 1, transform: 'scale(1) rotate(0deg)' },
    leave: { opacity: 0, transform: 'scale(0.5) rotate(180deg)' },
  },
  
  'flip-horizontal': {
    from: { opacity: 0, transform: 'rotateY(-180deg)' },
    enter: { opacity: 1, transform: 'rotateY(0deg)' },
    leave: { opacity: 0, transform: 'rotateY(180deg)' },
  },
  
  'flip-vertical': {
    from: { opacity: 0, transform: 'rotateX(-180deg)' },
    enter: { opacity: 1, transform: 'rotateX(0deg)' },
    leave: { opacity: 0, transform: 'rotateX(180deg)' },
  },
  
  'fade-zoom': {
    from: { opacity: 0, transform: 'scale(0.9)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(1.1)' },
  },
  
  'cross-fade': {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0.3 },
  },
  
  'push-left': {
    from: { opacity: 1, transform: 'translate3d(100%,0,0)' },
    enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
    leave: { opacity: 1, transform: 'translate3d(-50%,0,0)' },
  },
  
  'push-up': {
    from: { opacity: 1, transform: 'translate3d(0,100%,0)' },
    enter: { opacity: 1, transform: 'translate3d(0,0%,0)' },
    leave: { opacity: 1, transform: 'translate3d(0,-50%,0)' },
  },
  
  'swing': {
    from: { opacity: 0, transform: 'rotate(-10deg)' },
    enter: { opacity: 1, transform: 'rotate(0deg)' },
    leave: { opacity: 0, transform: 'rotate(10deg)' },
  },
  
  'drop': {
    from: { opacity: 0, transform: 'translate3d(0,-100%,0) scale(0.75)' },
    enter: { opacity: 1, transform: 'translate3d(0,0%,0) scale(1)' },
    leave: { opacity: 0, transform: 'translate3d(0,10%,0) scale(0.75)' },
  },
  
  'bounce': {
    from: { opacity: 0, transform: 'scale(0.3)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(0.3)' },
    config: { tension: 180, friction: 12 }
  },
  
  'slide-fade-left': {
    from: { opacity: 0, transform: 'translate3d(50%,0,0)' },
    enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
    leave: { opacity: 0, transform: 'translate3d(-50%,0,0)' },
  },
  
  'slide-fade-up': {
    from: { opacity: 0, transform: 'translate3d(0,50%,0)' },
    enter: { opacity: 1, transform: 'translate3d(0,0%,0)' },
    leave: { opacity: 0, transform: 'translate3d(0,-50%,0)' },
  }
};