declare module 'imagetracerjs' {
  export interface ImageTracerOptions {
    corsenabled?: boolean;
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    rightangleenhance?: boolean;
    colorsampling?: number;
    numberofcolors?: number;
    mincolorratio?: number;
    colorquantcycles?: number;
    layering?: number;
    strokewidth?: number;
    linefilters?: boolean;
    scale?: number;
    roundcoords?: number;
    viewbox?: boolean;
    desc?: boolean;
    lcpr?: number;
    qcpr?: number;
    blurradius?: number;
    blurdelta?: number;
    pal?: { r: number; g: number; b: number; a: number }[];
  }

  export function imageToSVG(
    url: string,
    callback: (svgString: string) => void,
    options?: ImageTracerOptions | string
  ): void;

  export function imagedataToSVG(
    imgData: ImageData,
    options?: ImageTracerOptions | string
  ): string;

  export function imageDataToSVG(
    imgData: ImageData,
    options?: ImageTracerOptions | string
  ): string;

  export function imagedataToTracedata(
    imgData: ImageData,
    options?: ImageTracerOptions | string
  ): any;

  export function getsvgstring(
    tracedata: any,
    options?: ImageTracerOptions | string
  ): string;

  const ImageTracer: {
    imageToSVG: typeof imageToSVG;
    imagedataToSVG: typeof imagedataToSVG;
    imageDataToSVG: typeof imageDataToSVG;
    imagedataToTracedata: typeof imagedataToTracedata;
    getsvgstring: typeof getsvgstring;
    optionpresets: Record<string, ImageTracerOptions>;
  };

  export default ImageTracer;
}
