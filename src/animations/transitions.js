// src/animations/transitions.js
// Enhanced transitions with smoother, more sophisticated effects

export const transitionStyles = {
  fade: {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  },
  
  'slide-left': {
    from: { opacity: 0, transform: 'translateX(100%)' },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: 'translateX(-100%)' },
  },
  
  'slide-right': {
    from: { opacity: 0, transform: 'translateX(-100%)' },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: 'translateX(100%)' },
  },
  
  'slide-up': {
    from: { opacity: 0, transform: 'translateY(100%)' },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: { opacity: 0, transform: 'translateY(-100%)' },
  },
  
  'slide-down': {
    from: { opacity: 0, transform: 'translateY(-100%)' },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: { opacity: 0, transform: 'translateY(100%)' },
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
    from: { opacity: 0, transform: 'rotate(-180deg) scale(0.5)' },
    enter: { opacity: 1, transform: 'rotate(0deg) scale(1)' },
    leave: { opacity: 0, transform: 'rotate(180deg) scale(0.5)' },
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
  
  'dissolve': {
    from: { opacity: 0, filter: 'blur(20px)' },
    enter: { opacity: 1, filter: 'blur(0px)' },
    leave: { opacity: 0, filter: 'blur(20px)' },
  },
  
  'fade-through-black': {
    from: { opacity: 0, backgroundColor: 'black' },
    enter: { opacity: 1, backgroundColor: 'transparent' },
    leave: { opacity: 0, backgroundColor: 'black' },
  },
  
  'cross-fade': {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0.5 },
  },
  
  'push-left': {
    from: { opacity: 0.8, transform: 'translateX(100%)' },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0.8, transform: 'translateX(-50%)' },
  },
  
  'push-up': {
    from: { opacity: 0.8, transform: 'translateY(100%)' },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: { opacity: 0.8, transform: 'translateY(-50%)' },
  },
  
  'cube-left': {
    from: { opacity: 0, transform: 'translateX(100%) rotateY(-90deg) translateZ(100px)' },
    enter: { opacity: 1, transform: 'translateX(0%) rotateY(0deg) translateZ(0px)' },
    leave: { opacity: 0, transform: 'translateX(-100%) rotateY(90deg) translateZ(100px)' },
  },
  
  'wave': {
    from: { opacity: 0, transform: 'translateY(100%) rotate(10deg)' },
    enter: { opacity: 1, transform: 'translateY(0%) rotate(0deg)' },
    leave: { opacity: 0, transform: 'translateY(-100%) rotate(-10deg)' },
  },
  
  'iris': {
    from: { 
      opacity: 0, 
      clipPath: 'circle(0% at 50% 50%)'
    },
    enter: { 
      opacity: 1, 
      clipPath: 'circle(100% at 50% 50%)'
    },
    leave: { 
      opacity: 0, 
      clipPath: 'circle(0% at 50% 50%)'
    },
  },
  
  'curtain': {
    from: { 
      opacity: 0, 
      clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)'
    },
    enter: { 
      opacity: 1, 
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
    },
    leave: { 
      opacity: 0, 
      clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)'
    },
  },
  
  'diagonal-wipe': {
    from: { 
      opacity: 0, 
      clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'
    },
    enter: { 
      opacity: 1, 
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
    },
    leave: { 
      opacity: 0, 
      clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'
    },
  }
};