import React from 'react';
import { View, StyleSheet } from 'react-native';

const ThemeCard = ({ 
  children, 
  variant = 'default',
  padding = 'md',
  style,
  ...props 
}) => {
  
  const paddingValues = {
    none: 0,
    sm: 12,
    md: 20,
    lg: 28,
    xl: 36,
  };
  
  const cardStyle = [
    styles.base,
    styles[variant],
    { padding: paddingValues[padding] },
    style
  ];

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  elevated: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  subtle: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.3)',
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#334155',
  },
  dashed: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  accent: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
});

export default ThemeCard;
