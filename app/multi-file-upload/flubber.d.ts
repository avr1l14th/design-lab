declare module "flubber" {
  type Interpolator = (t: number) => string;
  interface Options {
    maxSegmentLength?: number;
    string?: boolean;
    single?: boolean;
  }
  export function interpolate(
    fromShape: string,
    toShape: string,
    opts?: Options
  ): Interpolator;
  export function combine(
    fromShape: string,
    toShapes: string[],
    opts?: Options
  ): Interpolator[];
  export function separate(
    fromShapes: string[],
    toShape: string,
    opts?: Options
  ): Interpolator[];
}
