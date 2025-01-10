import {
  BufferGeometry,
  Color,
  ColorRepresentation,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
} from 'three';

export class AdvancedGrid extends LineSegments {
  //constructor(size = 10, divisions = 10, color1 = 0x44_44_44, color2 = 0x88_88_88) {
  constructor(
    size: number,
    primaryStepSize: number,
    secondaryStepSize: number,
    primaryColor: ColorRepresentation,
    secondaryColor: ColorRepresentation,
  ) {
    const color1 = new Color(primaryColor);
    const color2 = new Color(secondaryColor);

    const vertices = [];
    const colors: number[] = [];

    for (let index = 0, colorIndex = 0; index <= size; index++) {
      if (index % primaryStepSize === 0) {
        vertices.push(0, 0, -index, size, 0, -index, index, 0, 0, index, 0, -size);

        color1.toArray(colors, colorIndex);
        colorIndex += 3;
        color1.toArray(colors, colorIndex);
        colorIndex += 3;
        color1.toArray(colors, colorIndex);
        colorIndex += 3;
        color1.toArray(colors, colorIndex);
        colorIndex += 3;
      }
      if (index % secondaryStepSize === 0 && index % primaryStepSize !== 0) {
        vertices.push(0, 0, -index, size, 0, -index, index, 0, 0, index, 0, -size);

        color2.toArray(colors, colorIndex);
        colorIndex += 3;
        color2.toArray(colors, colorIndex);
        colorIndex += 3;
        color2.toArray(colors, colorIndex);
        colorIndex += 3;
        color2.toArray(colors, colorIndex);
        colorIndex += 3;
      }
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

    const material = new LineBasicMaterial({ vertexColors: true, toneMapped: false });

    super(geometry, material);
  }

  dispose() {
    this.geometry.dispose();
  }
}
