declare module "marching-cubes-faster" {
  export interface DFObject {
    bounds: [[number, number, number], [number, number, number]];
    [key: string]: any;
  }

  export interface MarchingCubesResult {
    positions: number[];
    cells: any[];
  }

  export const dfBuilder: {
    addBrick(
      list: any[],
      aabb: [[number, number, number], [number, number, number]],
      padding: number,
      doSubtract?: boolean,
      color?: any
    ): void;
    addTriangle(
      list: any[],
      triangle: [[number, number, number], [number, number, number], [number, number, number]],
      padding: number,
      doSubtract?: boolean,
      color?: any
    ): void;
    addTetra(
      list: any[],
      tetra: [[number, number, number], [number, number, number], [number, number, number], [number, number, number]],
      padding: number,
      doSubtract?: boolean,
      color?: any
    ): void;
    addLine(
      list: any[],
      line: [[number, number, number], [number, number, number]],
      radius: number,
      doSubtract?: boolean,
      color?: any
    ): void;
    addLineCone(
      list: any[],
      lineCone: { line: [[number, number, number], [number, number, number]]; r0: number; r1: number },
      doSubtract?: boolean,
      color?: any
    ): void;
    buildDfFromRTreeObjs(objList: any[]): any;
  };

  export const meshBuilder: {
    buildForList(
      dfObjList: any[],
      iters?: number,
      renderBlock?: [[number, number, number], [number, number, number]],
      dfBuilderResult?: any
    ): MarchingCubesResult;
  };

  const mfc: {
    dfBuilder: typeof dfBuilder;
    meshBuilder: typeof meshBuilder;
  };

  export default mfc;
}
