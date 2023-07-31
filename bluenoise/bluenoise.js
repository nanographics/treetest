// Source: https://github.com/kchapelier/fast-2d-poisson-disk-sampling
// Note: Please add <script src="https://cdn.jsdelivr.net/gh/kchapelier/fast-2d-poisson-disk-sampling@1.0.3/build/fast-poisson-disk-sampling.min.js"></script> to your HTML.
export default function bluenoise(width, height, numPoints) {
    return new FastPoissonDiskSampling({
        shape: [width, height],
        radius: Math.sqrt(width * height / numPoints),
        tries: 30,
    }).fill();
}