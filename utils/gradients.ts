// // gradients.ts
// export const gradients = {
//   welcome: {
//     colors: ["#C4AAC1", "rgba(109,126,190,0.5)", "#C296B5"],
//     locations: [0.16, 0.62, 0.95],
//     start: { x: 0, y: 0 },
//     end: { x: 1, y: 0 },
//   },
//   card: {
//     colors: ["#6D7EBE", "#C296B5"],
//     locations: [0, 1],
//     start: { x: 0, y: 1 },
//     end: { x: 1, y: 0 },
//   },
// };

// utils/gradients.ts
import type { ColorValue } from 'react-native';

type XY = { x: number; y: number };

// A gradient must have at least two colors, so use a readonly tuple type
export type Gradient = {
  colors: readonly [ColorValue, ColorValue, ...ColorValue[]];
  // locations correspond to colors; optional but must be readonly tuple/array
  locations?: readonly [number, number, ...number[]];
  start?: XY;
  end?: XY;
};

export const gradients: {
  welcome: Gradient;
  card: Gradient;
  subtle: Gradient;
} = {
  welcome: {
    // your original stops: 16% (#C4AAC1), 62% (#6D7EBE with 50% opacity), 95% (#C296B5)
    colors: ['#C4AAC1', 'rgba(109,126,190,0.5)', '#C296B5'],
    locations: [0.16, 0.62, 0.95],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  card: {
    colors: ['#6D7EBE', '#C296B5'],
    locations: [0, 1],
    start: { x: 0, y: 1 },
    end: { x: 1, y: 0 },
  },
  subtle: {
    colors: ['#A2D2FF', '#FFFFFF'],
    locations: [0, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
};

export default gradients;
