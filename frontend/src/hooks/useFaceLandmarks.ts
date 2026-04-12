import { useCallback } from "react";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import {
  detectVideoFrame,
  loadFaceLandmarker,
  loadFaceLandmarkerVideo,
  pickPrimaryLandmarks,
} from "../lib/faceLandmarker";

export type FaceLandmarkFrame = {
  /** Largest face in frame (preview target). */
  primary: NormalizedLandmark[] | null;
  all: NormalizedLandmark[][];
};

/**
 * Lazy MediaPipe loaders + primary-face selection.
 * IMAGE: `detect` on canvas snapshots. VIDEO: use {@link detectVideoFrame} in a `requestAnimationFrame` loop for real-time webcam.
 */
export function useFaceLandmarks() {
  const detectImage = useCallback(async (canvas: HTMLCanvasElement): Promise<FaceLandmarkFrame> => {
    const fl = await loadFaceLandmarker();
    const { faceLandmarks } = fl.detect(canvas);
    return { primary: pickPrimaryLandmarks(faceLandmarks), all: faceLandmarks };
  }, []);

  const detectVideo = useCallback(async (canvas: HTMLCanvasElement): Promise<FaceLandmarkFrame> => {
    const fl = await loadFaceLandmarkerVideo();
    return detectVideoFrame(fl, canvas);
  }, []);

  return { detectImage, detectVideo };
}
