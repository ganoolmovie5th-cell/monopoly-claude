import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import PropertyGalleryScreen from './src/screens/PropertyGalleryScreen';

type Screen = 'home' | 'game' | 'gallery';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const prevScreen = useRef<Screen>('home');

  const goToGallery = (from: Screen) => {
    prevScreen.current = from;
    setScreen('gallery');
  };

  const goBackFromGallery = () => {
    setScreen(prevScreen.current);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {screen === 'home' ? (
          <HomeScreen onStart={() => setScreen('game')} onGallery={() => goToGallery('home')} />
        ) : screen === 'game' ? (
          <GameScreen onBack={() => setScreen('home')} onGallery={() => goToGallery('game')} />
        ) : (
          <PropertyGalleryScreen onBack={goBackFromGallery} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
