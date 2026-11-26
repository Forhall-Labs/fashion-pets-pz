"use client";

import { Lottie } from "lottie-react";

import pawPrintsAnimation from "../assets/paw-prints-lottie.json";

// Spinner de botón — "Paw Prints" de Brian (LottieFiles, Lottie Simple
// License — uso comercial libre, sin atribución obligatoria:
// https://lottiefiles.com/free-animation/paw-prints-oJpe7SKaYK). El source
// dura 5s por vuelta; 2.5x lo deja en ~2s, más acorde a un spinner de botón.
export function PawPrintsSpinner() {
  return (
    <Lottie src={pawPrintsAnimation} loop autoplay speed={2.5} style={{ width: 28, height: 28 }} />
  );
}
