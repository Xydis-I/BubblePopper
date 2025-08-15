/**
 * Bubble Popper Game
 * 
 * ============== GAME OVERVIEW ==============
 * A bubble shooting game built with React Native and Expo.
 * 
 * CURRENT IMPLEMENTATION:
 * - Bubble Spawning: Random horizontal positions every 0.5s
 * - Bubble Movement: Upward motion until off-screen
 * - Static Gun: Fixed at bottom center
 * - Basic Laser: Vertical red line appearing for 0.3s on tap
 * - Simple Hit Detection: X-axis distance comparison
 * - Game Flow: Start screen, 120s countdown, score tracking, game over screen
 * 
 * ============== STUDENT ASSIGNMENT ==============
 * Your task is to extend this game by implementing a movable gun that can
 * fire in different directions to make the game more engaging.
 * 
 * ASSESSMENT CRITERIA:
 * 1. Functionality: Gun movement and response to input
 * 2. Code Quality: Structure, comments, efficiency
 * 3. User Experience: Intuitive gameplay, visual appeal
 * 4. Creativity: Unique features beyond requirements
 * 5. Performance: Smooth operation without issues
 * 
 * TIPS:
 * - Use React Native's touch handling for smooth control
 * - Consider Animated API for smoother animations
 * - Clean up any event listeners or timers you add
 * - Test on different device sizes for responsive UI
 */

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableWithoutFeedback, PanResponder } from 'react-native';
import Bubble from './components/Bubble';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function GameScreen() {
  /**
   * Game State
   * 
   * These state variables manage the core game functionality:
   * - gameStarted/gameOver: Control game flow
   * - score/timeLeft: Track player progress
   * - bubbles: Array of bubble objects with positions
   * - laserVisible: Controls when the laser is shown
   */
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [bubbles, setBubbles] = useState([]);
  const [isFiring, setIsFiring] = useState(false);
  const [laser, setLaser] = useState(null);
  const [laserVisible, setLaserVisible] = useState(false);
  
  /**
   * ============== STUDENT TASK 1 ==============
   * TODO: IMPLEMENT MOVABLE GUN
   * 
   * Currently the gun is fixed in the middle. Modify this code to:
   * 1. Add state to track gun position (both X and Y coordinates)
   * 2. Allow the gun to move based on user input (e.g., touch/drag or buttons)
   * 3. Ensure the gun stays within screen boundaries
   * 
   * Example implementation approach:
   * const [gunPosition, setGunPosition] = useState({ 
   *   x: screenWidth / 2 - gunWidth / 2, 
   *   y: screenHeight - 70
   * });
   */
  
  // Fixed gun position - currently in the middle (MODIFY THIS)
  const gunHeight = 60;
  const gunWidth = 60;
  //const gunPosition = screenWidth / 2 - gunWidth / 2;
  const [gunPosition, setGunPosition] = useState(screenWidth / 2 - gunWidth / 2);
  const gunPositionRef = useRef(gunPosition);


  useEffect(() => {
    gunPositionRef.current = gunPosition;
  }, [gunPosition]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        const fingerX = event.nativeEvent.pageX;
        const clampedX = Math.max(
          0,
          Math.min(fingerX - gunWidth / 2, screenWidth - gunWidth)
        );
        setGunPosition(clampedX);
      }
    })
  ).current;


  //const gunCenterX = screenWidth / 2;
  // const [gunCenterX, setGunCenterX] = useState(screenWidth / 2 - gunWidth / 2);
  
  /**
   * ============== STUDENT TASK 2 ==============
   * TODO: IMPLEMENT GUN MOVEMENT
   * 
   * Add functions to:
   * 1. Handle touch/drag events to move the gun
   * 2. Update the gun position state
   * 3. Add visual feedback for active controls
   * 
   * Example implementation approach:
   * const handleTouchMove = (event) => {
   *   const { locationX, locationY } = event.nativeEvent;
   *   // Apply constraints to keep gun on screen
   *   setGunPosition({ x: locationX - gunWidth/2, y: locationY });
   * };
   */
  
  // Refs for game timers and IDs
  const bubbleIdRef = useRef(1);
  const timerRef = useRef(null);
  const bubbleTimerRef = useRef(null);
  const laserTimeoutRef = useRef(null);
  
  /**
   * Handle tap to shoot laser
   * Currently fires the laser on any tap when game is active
   */
  const handleTouchStart = (event) => {
    if (!gameStarted || gameOver) return;

    const fingerX = event.nativeEvent.pageX;
    const clampedX = Math.max(
      0,
      Math.min(fingerX - gunWidth / 2, screenWidth - gunWidth)
    );
    setGunPosition(clampedX);

    setIsFiring(true);
    setLaserVisible(true);

    // Clear any previous timeout
    if (laserTimeoutRef.current) {
      clearTimeout(laserTimeoutRef.current);
    }

    // Hide laser after 300ms
    laserTimeoutRef.current = setTimeout(() => {
      setIsFiring(false);
      setLaserVisible(false);
    }, 300);
  };



  const handleTouchEnd = () => {
    console.log("Untouched!");
    // setIsFiring(false);
    // setLaserVisible(false);
  };

  useEffect(() => {
    if (!isFiring) return;

    let animationId;

    const updateLaser = () => {
      const laserX = gunPosition + gunWidth / 2;
      checkHits(laserX);
      animationId = requestAnimationFrame(updateLaser);
    };

    animationId = requestAnimationFrame(updateLaser);

    return () => cancelAnimationFrame(animationId);
  }, [isFiring, gunPosition]);



  /**
   * Check if laser hits any bubbles
   * @param {number} laserX - X coordinate of the laser
   */
  const checkHits = (laserX) => {
    setBubbles(prevBubbles => {
      const hitBubbleIds = [];
      let hitCount = 0;

      prevBubbles.forEach(bubble => {
        const bubbleCenterX = bubble.x + bubble.radius;
        const bubbleCenterY = bubble.y + bubble.radius;

        const distanceX = Math.abs(bubbleCenterX - laserX);
        const laserTop = 0;
        const laserBottom = screenHeight - gunHeight;

        // Check X and Y overlap
        const isXOverlap = distanceX <= bubble.radius;
        const isYOverlap = bubbleCenterY >= laserTop && bubbleCenterY <= laserBottom;

        if (isXOverlap && isYOverlap) {
          hitBubbleIds.push(bubble.id);
          hitCount++;
        }
      });

      if (hitCount > 0) {
        setScore(prevScore => prevScore + hitCount);
      }

      return prevBubbles.filter(bubble => !hitBubbleIds.includes(bubble.id));
    });
  };

  
  /**
   * Spawn a new bubble with random horizontal position
   * Creates bubble at bottom of screen with random X position
   */
  const spawnBubble = () => {
    const radius = 30;
    // Ensure bubble stays within screen bounds
    const maxX = screenWidth - (radius * 2);
    const newBubble = {
      id: bubbleIdRef.current++,
      x: Math.random() * maxX,
      y: screenHeight - 100, // Start near bottom of screen
      radius: radius,
    };
    
    setBubbles(prev => [...prev, newBubble]);
  };
  
  /**
   * Start the game
   * Initializes game state and starts timers for bubble spawning and countdown
   */
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(120);
    setBubbles([]);
    setLaserVisible(false);
    bubbleIdRef.current = 1;
    
    // Start spawning bubbles every 500ms
    bubbleTimerRef.current = setInterval(spawnBubble, 500);
    
    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Game over
          clearInterval(timerRef.current);
          clearInterval(bubbleTimerRef.current);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  /**
   * Reset game
   * Returns game to initial state and cleans up timers
   */
  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setBubbles([]);
    setScore(0);
    setTimeLeft(120);
    setLaserVisible(false);
    bubbleIdRef.current = 1;
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (bubbleTimerRef.current) clearInterval(bubbleTimerRef.current);
  };
  
  /**
   * Move bubbles upward
   * Uses effect to animate bubbles moving up the screen
   */
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const moveInterval = setInterval(() => {
      setBubbles(prev => {
        const updatedBubbles = prev
          .map(bubble => ({
            ...bubble,
            y: bubble.y - 2, // Move bubbles up
          }))
          .filter(bubble => bubble.y > -60); // Remove bubbles that exit the top
        
        return updatedBubbles;
      });
    }, 16); // ~60 FPS
    
    return () => clearInterval(moveInterval);
  }, [gameStarted, gameOver]);
  
  /**
   * Cleanup on unmount
   * Ensures all timers are cleared when component unmounts
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (bubbleTimerRef.current) clearInterval(bubbleTimerRef.current);
      if (laserTimeoutRef.current) clearTimeout(laserTimeoutRef.current);
    };
  }, []);
  
  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Game area */}
      <TouchableWithoutFeedback
        onPressIn={handleTouchStart}
        onPressOut={handleTouchEnd}
        disabled={!gameStarted || gameOver}
      >
        <View style={styles.gameArea}>
          {/* Bubbles */}
          {bubbles.map(bubble => (
            <Bubble
              key={`bubble-${bubble.id}`}
              x={bubble.x}
              y={bubble.y}
              radius={bubble.radius}
            />
          ))}
          
          {/**
           * ============== STUDENT TASK 5 ==============
           * TODO: MODIFY LASER RENDERING
           * Currently the laser is a simple vertical line.
           * Enhance it to:
           * 1. Render based on gun position and angle
           * 2. Add visual effects (color, thickness, etc.)
           * 3. Consider adding a cooldown or power meter
           */}
          
          {/* Laser - currently fixed to fire from center of gun */}
          {laserVisible && (
            <View
              style={[
                styles.laser,
                { left: gunPosition + gunWidth / 2 - 2 }
              ]}
            />
          )}


          {/**
           * ============== STUDENT TASK 6 ==============
           * TODO: MODIFY GUN RENDERING
           * Currently the gun is fixed at the bottom center.
           * Update it to:
           * 1. Use the gun position state you created
           * 2. Add visual indication of gun direction/angle
           * 3. Add controls or touch areas for movement
           */}
          
          {/* Gun - currently static in middle */}
          <View
            style={[styles.gun, { left: gunPosition }]}
          >
            <View style={styles.gunBase} />
            <View style={styles.gunBarrel} />
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Score and Timer */}
      <View style={styles.hudContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.scoreText}>Time: {timeLeft}s</Text>
      </View>
      
      {/* Start Screen */}
      {!gameStarted && !gameOver && (
        <View style={styles.overlay}>
          <Text style={styles.title}>Bubble Popper</Text>
          <TouchableWithoutFeedback onPress={startGame}>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Start Game</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}
      
      {/* Game Over Screen */}
      {gameOver && (
        <View style={styles.overlay}>
          <Text style={styles.title}>Game Over</Text>
          <Text style={styles.scoreText}>Final Score: {score}</Text>
          <TouchableWithoutFeedback onPress={resetGame}>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Play Again</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}
    </View>
  );
}

/**
 * ============== STUDENT TASK 7 ==============
 * TODO: ENHANCE THE STYLING
 * Consider adding styles for:
 * 1. Different gun states (active, cooldown)
 * 2. Enhanced laser effects
 * 3. Controls for gun movement
 * 4. Power-ups or special ability indicators
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000033',
  },
  gameArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  hudContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 30,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  scoreText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gun: {
    position: 'absolute',
    bottom: 10,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    backgroundColor: '#555',
    borderRadius: 5,
  },
  gunBase: {
    position: 'absolute',
    bottom: 0,
    width: 40,
    height: 20,
    backgroundColor: '#333',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  gunBarrel: {
    position: 'absolute',
    bottom: 20,
    width: 10,
    height: 30,
    backgroundColor: '#222',
  },
  laser: {
    position: 'absolute',
    top: 0,
    bottom: 100,
    width: 4,
    height: '93.4%',
    backgroundColor: '#ff0000',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 90,
  },
});
