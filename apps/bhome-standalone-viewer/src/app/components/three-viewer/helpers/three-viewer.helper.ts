import { BoxGeometry, EdgesGeometry, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, Object3D } from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';

export class ThreeViewerHelper {
  public static getBeam(
    length: number,
    width: number,
    height: number,
    color: string,
    name?: string,
    userData?: Record<string, unknown>,
  ) {
    const material = new MeshBasicMaterial({ color });
    // material.transparent = true;
    // material.opacity = 0.5; // Adjust the opacity as needed
    // material.needsUpdate = true;
    const mesh = new Mesh(new BoxGeometry(length, height, width), material);
    if (name) {
      mesh.name = name;
    }
    if (userData) {
      mesh.userData = userData;
    }

    // Add edges
    const objectEdges = new LineSegments(new EdgesGeometry(mesh.geometry), new LineBasicMaterial({ color: 'black' }));
    mesh.add(objectEdges);

    // move the beam into the positive  quadrant
    mesh.position.set(length / 2, height / 2, -width / 2);
    return mesh;
  }

  public static getCSS3DObject(div: HTMLDivElement): CSS3DObject {
    return new CSS3DObject(div);
  }

  public static translate(object: Object3D, x: number, y: number, z: number): Object3D {
    object.position.x += x;
    object.position.y += z;
    object.position.z += -y;
    return object;
  }

  public static moveToLocation(object: Object3D, x: number, y: number, z: number): Object3D {
    object.position.set(x, z, -y);
    return object;
  }

  public static group(objects: Object3D[]): Object3D {
    const group = new Object3D();
    for (const object of objects) {
      group.add(object);
    }
    return group;
  }

  public static updateColor(object: Object3D, color: string): void {
    if (!(object instanceof Mesh)) {
      return;
    }
    const mesh = object as Mesh;
    if (!(mesh.material instanceof MeshBasicMaterial)) {
      return;
    }
    const material = mesh.material as MeshBasicMaterial;
    material.color.set(color);
    material.needsUpdate = true;
  }
}
