"use client";

import { Lottie } from "lottie-react";

import dogWalkingAnimation from "../assets/dog-walking-lottie.json";

// Loader de "cargando" — "Dog walking" de Syed Asim Ali Shah (LottieFiles,
// Lottie Simple License — uso comercial libre, sin atribución obligatoria:
// https://lottiefiles.com/free-animation/dog-walking-7K4JCxjvHm).
export function WalkingDogLoader({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="walking-dog-loader">
      <Lottie src={dogWalkingAnimation} loop autoplay style={{ width: 140, height: 140 }} />
      <p className="text-small">{label}</p>
    </div>
  );
}
